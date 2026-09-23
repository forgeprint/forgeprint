import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Agent } from './agents.js';

/**
 * One file `render` would write, and what would be in it.
 *
 * Producing the plan separately from writing it is what makes this testable
 * and what makes `--dry-run` honest: the same function decides, whether or not
 * anything reaches the disk.
 */
export interface RenderedFile {
  /** Path relative to the output directory, always forward-slashed. */
  readonly path: string;
  readonly contents: string;
}

export interface RenderInput {
  readonly slug: string;
  readonly summary: string;
  /** The single source: the unit's AGENTS.md, or an expert's SKILL.md. */
  readonly body: string;
  /** Skills the unit ships, keyed by name, each one a whole SKILL.md. */
  readonly skills?: Readonly<Record<string, string>>;
}

export class RenderError extends Error {}

/**
 * Write one unit's context for one agent (ADR 0013).
 *
 * The content is written once, as `AGENTS.md` and `SKILL.md`, and every
 * agent-specific file is produced from it. A hand-written per-agent copy is
 * refused — that is ADR 0001 applied to the same content in a second costume —
 * so this function is the only thing that knows an agent's file layout, and
 * everything it knows comes from the registry rather than from here.
 */
export function renderForAgent(agent: Agent, input: RenderInput): RenderedFile[] {
  const files: RenderedFile[] = [];
  const path = agent.render.path.replaceAll('{slug}', input.slug);
  const contents = withFrontmatter(agent, input);

  const limit = agent.render.max_chars;
  if (limit !== null && contents.length > limit) {
    // Windsurf truncates past its cap without saying so. Handing over a
    // context that is silently half-delivered is worse than refusing: the
    // agent behaves as though it read the whole thing.
    throw new RenderError(
      `${input.slug} is ${contents.length} characters and ${agent.name} caps ${path} at ${limit}. ` +
        'Shorten it, or split it across the files that agent reads.',
    );
  }
  files.push({ path, contents });

  // A skill only travels to an agent that loads skills; for the rest it would
  // be a folder nothing reads, which is litter, not compatibility (ADR 0006).
  const skillPath = agent.skill_path;
  if (skillPath !== null) {
    for (const [name, skill] of Object.entries(input.skills ?? {})) {
      files.push({ path: skillPath.replace('<name>', name), contents: skill });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * The frontmatter this agent needs, if it needs any.
 *
 * Cursor ignores a rule file that has none, Kiro requires its inclusion mode
 * to be the first thing in the file, and Windsurf reads a `trigger`. None of
 * that is style: it is the difference between a file an agent reads and a file
 * it walks past.
 */
function withFrontmatter(agent: Agent, input: RenderInput): string {
  const fields = agent.render.frontmatter;
  if (fields === null) return ensureTrailingNewline(input.body);

  const lines = ['---'];
  for (const [key, template] of Object.entries(fields)) {
    const value = template.replaceAll('{slug}', input.slug).replaceAll('{summary}', input.summary);
    lines.push(`${key}: ${needsQuoting(value) ? JSON.stringify(value) : value}`);
  }
  lines.push('---', '');
  return `${lines.join('\n')}\n${ensureTrailingNewline(input.body)}`;
}

/** Quote anything YAML would read as something other than a string. */
function needsQuoting(value: string): boolean {
  if (value === 'true' || value === 'false' || value === 'null') return false;
  return /[:#\n]|^\s|\s$/.test(value) || value === '';
}

function ensureTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text : `${text}\n`;
}

/** Write a plan to disk, creating the directories it needs. */
export function writeRendered(outDir: string, files: readonly RenderedFile[]): string[] {
  const written: string[] = [];
  for (const file of files) {
    const target = join(outDir, ...file.path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.contents, 'utf8');
    written.push(file.path);
  }
  return written;
}
