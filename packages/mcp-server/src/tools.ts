import {
  compareSubjects,
  checkOptions,
  lintSetup,
  manifestSchema,
  missingOptions,
  REQUIRED_BLUEPRINT_FILES,
  resolveSetupOptions,
  type CatalogIndex,
  type IndexEntry,
  type SimilaritySubject,
} from 'forgeprint';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { parse } from 'yaml';
import { z } from 'zod';
import { entryFor, type CatalogSource } from './catalog.js';
import { CONTENT_IS_DATA } from './notes.js';
import { normalizeProfile } from './profile.js';
import {
  isGenuineTie,
  MATCH_FLOOR,
  questionsFor,
  scoreCatalog,
  type Profile,
  type Score,
} from './scoring.js';

const ISSUE_URL = 'https://github.com/forgeprint/forgeprint/issues/new';

const localeInput = z
  .string()
  .optional()
  .describe(
    'BCP-47 tag. Presentation hint only: the catalog is English, and this is handed back so the calling agent knows which language to answer in.',
  );

/**
 * What the agent is told about how far this blueprint has been checked.
 *
 * Two separate facts, because they answer different questions. `tier` says
 * whether a maintainer ran the setup; `provenance` says whether a person
 * wrote it at all. A generated blueprint's recipe passes CI like any other —
 * what nobody did is ask whether those are the right steps (ADR 0011).
 */
/**
 * What a blueprint suggests installing alongside itself.
 *
 * The field has been in the schema and the index since the beginning and was
 * read by nothing, so a blueprint could name the MCP servers it expects and
 * the agent would never hear about them — while CLAUDE.md §3.3 promises
 * `get_blueprint` returns exactly that. Absent rather than empty: a blueprint
 * that suggests nothing should say nothing, not answer with two empty lists.
 */
function suggests(entry: {
  provides?: { mcp?: readonly string[]; skills?: readonly string[] };
}): Record<string, readonly string[]> | undefined {
  const mcp = entry.provides?.mcp ?? [];
  const skills = entry.provides?.skills ?? [];
  if (mcp.length === 0 && skills.length === 0) return undefined;
  return {
    ...(mcp.length === 0 ? {} : { mcp_servers: mcp }),
    ...(skills.length === 0 ? {} : { skills }),
  };
}

function tierNote(entry: { tier: string; provenance?: 'human' | 'generated' }): string | undefined {
  const notes: string[] = [];
  if (entry.provenance === 'generated') {
    notes.push('Generated, CI-tested, not manually verified.');
  }
  if (entry.tier === 'community') {
    notes.push('Community blueprint: review the setup steps before running them.');
  }
  return notes.length === 0 ? undefined : notes.join(' ');
}

export function registerTools(server: McpServer, source: CatalogSource): void {
  const reply = (payload: unknown, meta: Record<string, unknown> = {}): CallToolResult => ({
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    _meta: { content_is_data: CONTENT_IS_DATA, catalog: source.description, ...meta },
  });

  const failure = (message: string): CallToolResult => ({
    content: [{ type: 'text', text: message }],
    isError: true,
  });

  const guard = async (
    run: () => CallToolResult | Promise<CallToolResult>,
  ): Promise<CallToolResult> => {
    try {
      return await run();
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error));
    }
  };

  server.registerTool(
    'search_blueprints',
    {
      title: 'Search blueprints',
      description:
        'Find blueprints matching a stack, languages, project type or requirements, with a score and the reasons behind it. ' +
        'Use this when the user wants to look at the catalog themselves. When they want a recommendation, use `resolve` instead: it returns one blueprint rather than a list.',
      inputSchema: {
        languages: z
          .array(z.string())
          .optional()
          .describe('Taxonomy ids or their labels: ["csharp"] and ["C#"] are both understood.'),
        stack: z
          .array(z.string())
          .optional()
          .describe('Taxonomy ids or labels, for example ["aspnetcore"] or [".NET"].'),
        project_type: z
          .string()
          .optional()
          .describe('One taxonomy id or label, for example "api" or "API service".'),
        requirements: z.array(z.string()).optional(),
        platforms: z.array(z.string()).optional(),
        distribution: z.array(z.string()).optional(),
        text: z.string().optional().describe('Free text about the project.'),
        limit: z.number().int().min(1).max(25).optional(),
      },
    },
    async (input) =>
      guard(async () => {
        const index = await source.loadIndex();
        const stated: Profile = { ...input, goal: input.text ?? undefined };
        const { profile, unrecognised, corrections } = normalizeProfile(stated, index.taxonomy);
        const scored = scoreCatalog(index, profile).slice(0, input.limit ?? 10);
        return reply({
          matches: scored.map(summarize),
          catalog_size: index.blueprints.length,
          unrecognised_values: unrecognised.length === 0 ? undefined : unrecognised,
          moved_to_the_right_field:
            corrections.length === 0
              ? undefined
              : corrections.map((c) => `${c.from} → did you mean ${c.to}?`),
          note:
            scored.length === 0
              ? 'Nothing matched. Do not invent a blueprint; `request_blueprint` records the demand.'
              : undefined,
        });
      }),
  );

  server.registerTool(
    'get_blueprint',
    {
      title: 'Get a blueprint',
      description:
        'Return a blueprint: its manifest, its context and overview files, and its setup recipe with the chosen options already resolved. ' +
        'Pass every option the blueprint declares, or the recipe comes back with its branches still in it and the unresolved fields listed.',
      inputSchema: {
        slug: z
          .string()
          .describe('Blueprint slug, as returned by `resolve` or `search_blueprints`.'),
        options: z
          .record(z.string(), z.string())
          .optional()
          .describe('Chosen option values, for example {"database":"postgres"}.'),
        paths: z
          .array(z.string())
          .optional()
          .describe(
            "Extra files to include, from the blueprint's `files` list (skills, mcp.json, scripts).",
          ),
        locale: localeInput,
      },
    },
    async ({ slug, options = {}, paths = [], locale }) =>
      guard(async () => {
        const index = await source.loadIndex();
        const entry = entryFor(index, slug);
        checkOptions(asManifestLike(entry), options);

        const wanted = [...REQUIRED_BLUEPRINT_FILES, ...paths].filter(
          (path, at, all) => all.indexOf(path) === at && entry.files.includes(path),
        );
        const files: Record<string, string> = {};
        for (const path of wanted) files[path] = await source.readFile(slug, path);

        const setup = resolveSetupOptions(files['setup.md'] ?? '', options);
        files['setup.md'] = setup.markdown;

        return reply(
          {
            blueprint: entry,
            chosen_options: options,
            undecided_options: missingOptions(asManifestLike(entry), options),
            unresolved_option_guards: setup.unresolved,
            files,
            other_files: entry.files.filter((path) => !(path in files)),
            tier_note: tierNote(entry),
            suggested_alongside: suggests(entry),
          },
          { present_in: locale },
        );
      }),
  );

  server.registerTool(
    'resolve',
    {
      title: 'Resolve a profile to one blueprint',
      description:
        'Take what the user knows and what they are building, and return EITHER the questions to ask them OR exactly one blueprint with the reasoning behind it. ' +
        'Ask the returned questions before recommending anything: they are chosen because their answers change which blueprint wins. ' +
        'This tool never returns a list to choose from, and never invents a match. ' +
        'Fill the structured fields from what the user said rather than passing only `goal`: the free text is the weakest signal, ' +
        'and mapping "it has to be multi-tenant" to requirements:["multi-tenant"] is what turns a coin-flip into an answer.',
      inputSchema: {
        languages: z
          .array(z.string())
          .optional()
          .describe(
            'Languages the user already writes. Taxonomy ids or their labels: ["csharp"] and ["C#"] are both understood.',
          ),
        goal: z.string().optional().describe('What they are building, in their words.'),
        skills: z.array(z.string()).optional(),
        stack: z
          .array(z.string())
          .optional()
          .describe(
            'Frameworks, runtimes or databases the user named. Ids or labels: ["aspnetcore"] or ["ASP.NET Core"]. A field this tool does not accept is dropped before it is scored, so put a stack here rather than in the goal.',
          ),
        project_type: z.string().optional(),
        platforms: z.array(z.string()).optional(),
        distribution: z.array(z.string()).optional(),
        requirements: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
        locale: localeInput,
      },
    },
    async (stated) =>
      guard(async () => {
        const index = await source.loadIndex();
        const meta = { present_in: stated.locale };
        // "C#" is the right answer in the wrong alphabet; the catalog stores
        // `csharp`. Scoring it as a language the user does not know turned a
        // match into no_match, so both spellings are accepted here.
        const { profile, unrecognised, inferred, corrections } = normalizeProfile(
          stated,
          index.taxonomy,
        );
        const ignored = unrecognised.length === 0 ? undefined : unrecognised;
        // A value in the wrong field is scored from the right one, and said
        // out loud so the agent can ask about it rather than silently absorb it.
        const moved =
          corrections.length === 0
            ? undefined
            : corrections.map(
                (correction) => `${correction.from} → did you mean ${correction.to}?`,
              );
        // What the sentence said that the fields did not. Reported, because a
        // requirement nobody typed should be visible enough to correct.
        const read = inferred.length === 0 ? undefined : inferred;

        const questions = questionsFor(index, profile);
        if (questions.length > 0) {
          return reply(
            {
              status: 'questions',
              questions,
              unrecognised_values: ignored,
              read_from_your_description: read,
              moved_to_the_right_field: moved,
              instruction:
                'Ask the user these questions before recommending anything. Then call `resolve` again with their answers.',
            },
            meta,
          );
        }

        const scored = scoreCatalog(index, profile);
        const best = scored[0];
        if (best === undefined || best.total < MATCH_FLOOR) {
          return reply(
            {
              status: 'no_match',
              unrecognised_values: ignored,
              read_from_your_description: read,
              moved_to_the_right_field: moved,
              closest:
                best === undefined
                  ? undefined
                  : { ...summarize(best), why_it_does_not_fit: best.mismatches },
              instruction:
                'Tell the user nothing in the catalog fits, name the closest blueprint and why it does not, and offer `request_blueprint`. Do not present the closest blueprint as a match. If `unrecognised_values` is present, one of those values is not in the taxonomy — check it before telling the user the catalog has nothing.',
            },
            meta,
          );
        }

        const runnerUp = scored[1];
        if (runnerUp !== undefined && isGenuineTie(best, runnerUp)) {
          return reply(
            {
              status: 'choose',
              unrecognised_values: ignored,
              read_from_your_description: read,
              moved_to_the_right_field: moved,
              question:
                'Two blueprints fit almost equally well. Which one matches what you are building?',
              candidates: [best, runnerUp].map((score) => ({
                ...summarize(score),
                why_it_fits: score.reasons,
                why_it_might_not: score.mismatches,
              })),
              instruction:
                'Put this choice to the user with the rationale. If they ask for the difference, call `compare_blueprints` with both slugs.',
            },
            meta,
          );
        }

        return reply(
          {
            status: 'resolved',
            unrecognised_values: ignored,
            read_from_your_description: read,
            moved_to_the_right_field: moved,
            blueprint: best.entry,
            score: round(best.total),
            why_it_fits: best.reasons,
            what_it_does_not_cover: best.mismatches,
            runner_up: runnerUp === undefined ? undefined : summarize(runnerUp),
            tools_the_setup_needs: best.entry.requires_tools,
            decisions_still_to_make: missingOptions(asManifestLike(best.entry)),
            next_step: `Call get_blueprint with slug "${best.entry.slug}" and the chosen options, then follow setup.md.`,
            tier_note: tierNote(best.entry),
            suggested_alongside: suggests(best.entry),
          },
          meta,
        );
      }),
  );

  server.registerTool(
    'compare_blueprints',
    {
      title: 'Compare blueprints',
      description:
        'Compare two to four blueprints on what they fit, what they are explicitly not for, and the trade-offs each one makes. Built from their overview files, not from a summary of them.',
      inputSchema: {
        slugs: z.array(z.string()).min(2).max(4),
        locale: localeInput,
      },
    },
    async ({ slugs, locale }) =>
      guard(async () => {
        const index = await source.loadIndex();
        const comparison = [];
        for (const slug of slugs) {
          const entry = entryFor(index, slug);
          const overview = await source.readFile(slug, 'overview.md');
          comparison.push({
            slug,
            name: entry.name,
            tier: entry.tier,
            tier_note: tierNote(entry),
            suggested_alongside: suggests(entry),
            summary: entry.summary,
            languages: entry.languages,
            project_type: entry.project_type,
            options: entry.options,
            requires_tools: entry.requires_tools,
            fits: section(overview, /what it fits/i),
            not_for: section(overview, /what it is not for/i),
            trade_offs: section(overview, /trade-?offs/i),
          });
        }
        return reply(
          {
            comparison,
            instruction:
              'Present this as a comparison the user can decide from, and lead with the "not for" rows: they are what actually separates the candidates.',
          },
          { present_in: locale },
        );
      }),
  );

  server.registerTool(
    'validate_blueprint',
    {
      title: 'Validate a blueprint draft',
      description:
        'Check a blueprint that is not in the catalog yet: schema and taxonomy errors, missing required files, setup recipe problems, and how similar it is to what already exists. For contributors, before opening a pull request.',
      inputSchema: {
        files: z
          .record(z.string(), z.string())
          .describe(
            'The blueprint folder as path -> contents, for example {"manifest.yaml":"schema: 1\\n..."}.',
          ),
      },
    },
    async ({ files }) =>
      guard(async () => {
        const index = await source.loadIndex();
        const problems: string[] = [];

        const missing = REQUIRED_BLUEPRINT_FILES.filter((file) => !(file in files));
        if (missing.length > 0) problems.push(`missing required file(s): ${missing.join(', ')}`);

        const manifestSource = files['manifest.yaml'];
        if (manifestSource === undefined) {
          return reply({ ok: false, problems, similarity: undefined });
        }

        const parsed = manifestSchema(index.taxonomy).safeParse(parse(manifestSource));
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            problems.push(`manifest.yaml ${issue.path.join('.') || '<root>'}: ${issue.message}`);
          }
          return reply({ ok: false, problems, similarity: undefined });
        }
        const manifest = parsed.data;

        const setupProblems = lintSetup(files['setup.md'] ?? '', {
          options: manifest.options ?? {},
        });
        for (const problem of setupProblems) {
          problems.push(`setup.md:${problem.line} ${problem.rule}: ${problem.message}`);
        }

        const draft: SimilaritySubject = {
          slug: manifest.slug,
          name: manifest.name,
          project_type: manifest.project_type,
          stack: manifest.stack,
          languages: manifest.languages,
          platforms: manifest.platforms,
          distribution: manifest.distribution,
          requirements: manifest.requirements,
          agentsMarkdown: files['AGENTS.md'] ?? '',
          setupMarkdown: files['setup.md'] ?? '',
        };
        const others: SimilaritySubject[] = [];
        for (const entry of index.blueprints) {
          if (entry.slug === manifest.slug) continue;
          others.push({
            slug: entry.slug,
            name: entry.name,
            project_type: entry.project_type,
            stack: entry.stack,
            languages: entry.languages,
            platforms: entry.platforms,
            distribution: entry.distribution,
            requirements: entry.requirements,
            agentsMarkdown: await source.readFile(entry.slug, 'AGENTS.md'),
            setupMarkdown: await source.readFile(entry.slug, 'setup.md'),
          });
        }
        const similarity = compareSubjects(draft, others);

        if (similarity.closest?.sameCombination === true) {
          problems.push(
            `"${similarity.closest.slug}" already claims this stack + project_type + requirements (rule 9). Improve it, add an option to it, or supersede it.`,
          );
        }

        return reply({
          ok: problems.length === 0,
          problems,
          similarity: {
            closest: similarity.closest,
            flagged: similarity.flagged,
            threshold: similarity.threshold,
            scores: similarity.scores,
          },
          instruction:
            'A red flag is a question the pull request template makes you answer, not a rejection. A same-combination result is a rejection.',
        });
      }),
  );

  server.registerTool(
    'request_blueprint',
    {
      title: 'Request a blueprint',
      description:
        'Produce a GitHub issue payload for a blueprint the catalog does not have. Use it when `resolve` found no match. This returns text; it does not open the issue — show it to the user and let them file it.',
      inputSchema: {
        goal: z.string().describe('What the user is building.'),
        languages: z.array(z.string()).optional(),
        project_type: z.string().optional(),
        platforms: z.array(z.string()).optional(),
        distribution: z.array(z.string()).optional(),
        requirements: z.array(z.string()).optional(),
        rationale: z
          .string()
          .describe('Which existing blueprint is closest and why it does not fit.'),
      },
    },
    async (input) =>
      guard(() => {
        const title = `Blueprint request: ${input.goal.slice(0, 80)}`;
        const body = [
          `**What are you building?**\n${input.goal}`,
          `**Languages you already know**\n${(input.languages ?? []).join(', ') || '(not stated)'}`,
          `**Project type**\n${input.project_type ?? '(not stated)'}`,
          `**Where does it run?**\n${(input.platforms ?? []).join(', ') || '(not stated)'}`,
          `**How does it reach its users?**\n${(input.distribution ?? []).join(', ') || '(not stated)'}`,
          `**What does it need?**\n${(input.requirements ?? []).join(', ') || '(not stated)'}`,
          `**Closest existing blueprint, and why it does not fit**\n${input.rationale}`,
        ].join('\n\n');

        const url = new URL(ISSUE_URL);
        url.searchParams.set('template', 'blueprint-request.yml');
        url.searchParams.set('title', title);

        return reply({
          issue: { title, labels: ['blueprint-request'], body },
          url: url.toString(),
          instruction:
            'Show the user the issue text and the link. Do not file it for them unless they ask.',
        });
      }),
  );
}

function summarize(score: Score): Record<string, unknown> {
  return {
    slug: score.entry.slug,
    name: score.entry.name,
    summary: score.entry.summary,
    tier: score.entry.tier,
    languages: score.entry.languages,
    project_type: score.entry.project_type,
    score: round(score.total),
    reasons: score.reasons,
    mismatches: score.mismatches,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The option-checking helpers want a manifest; an index entry carries the same fields. */
function asManifestLike(entry: IndexEntry): Parameters<typeof checkOptions>[0] {
  return entry as unknown as Parameters<typeof checkOptions>[0];
}

/** One `## Heading` section of a markdown document, heading included. */
function section(markdown: string, heading: RegExp): string | undefined {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{2,3}\s/.test(line) && heading.test(line));
  if (start === -1) return undefined;
  const end = lines.findIndex((line, at) => at > start && /^#{2,3}\s/.test(line));
  return lines
    .slice(start, end === -1 ? undefined : end)
    .join('\n')
    .trim();
}

export type { CatalogIndex };
