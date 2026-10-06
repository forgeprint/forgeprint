/**
 * What `forgeprint get` and `forgeprint render` need about one entry, from
 * either catalog.
 *
 * Two ways in, one answer out: an agent with no MCP client is not served a
 * second-class copy (ADR 0013), and that holds for the two catalogs as well as
 * for the two interfaces. Both builders below produce the same `GetPlan`, and
 * everything after them — the rendering, the recipe, the files written — is
 * one code path.
 *
 * The difference between them is what is trusted. A checkout is parsed and
 * validated here, because it may hold an entry nobody has published yet. The
 * published index was validated when it was built, by the same `validate` that
 * guards every pull request, so reading it again would check the same thing
 * twice — except the agent registry, which decides where files are written and
 * is therefore re-parsed (see `published.ts`).
 */
import { findAgent, loadAgentRegistry, type AgentRegistry } from './agents.js';
import {
  readBlueprintFile,
  readBlueprintFolder,
  readManifest,
  readUnitFile,
  type BlueprintFolder,
} from './catalog.js';
import {
  loadPublishedIndex,
  publishedAgents,
  publishedEntry,
  readPublishedFile,
  type PublishedCatalogOptions,
} from './published.js';
import type { RenderInput } from './render.js';
import { loadTaxonomy, type Taxonomy } from './taxonomy.js';
import { validateUnits } from './validate-units.js';

/** A blueprint's recipe and what the reader is told about it afterwards. */
export interface RecipePlan {
  readonly name: string;
  readonly setup: string;
  /** Only what `checkOptions` reads, so both catalogs can supply it. */
  readonly declares: {
    readonly slug: string;
    readonly options?: Readonly<Record<string, readonly string[]>> | undefined;
  };
  readonly integrations: readonly string[];
}

export interface GetPlan {
  /** Which catalog answered, for the line the command prints. */
  readonly source: string;
  readonly agents: AgentRegistry;
  readonly input: RenderInput;
  /** Absent for an expert, which has no recipe of its own. */
  readonly recipe?: RecipePlan;
}

/** A blueprint as `render` sees it: its AGENTS.md and the skills it ships. */
export function blueprintRenderInput(root: string, taxonomy: Taxonomy, slug: string): RenderInput {
  const folder = readBlueprintFolder(root, slug);
  const manifest = readManifest(taxonomy, folder);
  return {
    slug,
    summary: manifest.summary,
    body: readBlueprintFile(folder, 'AGENTS.md'),
    skills: skillsIn(folder),
  };
}

/** An expert as `render` sees it: its SKILL.md is both the body and the skill. */
export function expertRenderInput(root: string, taxonomy: Taxonomy, slug: string): RenderInput {
  const expert = validateUnits(root, taxonomy).experts.find((one) => one.slug === slug);
  if (expert === undefined) throw new Error(`No such expert: ${slug}`);
  const skill = readUnitFile(expert.folder, 'SKILL.md');
  return { slug, summary: expert.manifest.summary, body: skill, skills: { [slug]: skill } };
}

/** Every SKILL.md a folder ships, keyed by the directory that holds it. */
export function skillsIn(folder: BlueprintFolder): Record<string, string> {
  const skills: Record<string, string> = {};
  for (const file of folder.files) {
    const match = SKILL_FILE.exec(file);
    if (match?.[1] !== undefined) skills[match[1]] = readBlueprintFile(folder, file);
  }
  return skills;
}

const SKILL_FILE = /^skills\/([^/]+)\/SKILL\.md$/;

/** One entry out of a checkout: the catalog on disk, parsed and validated. */
export function localPlan(root: string, slug: string, { expert = false } = {}): GetPlan {
  const taxonomy = loadTaxonomy(root);
  const plan = {
    source: `the catalog at ${root}`,
    agents: loadAgentRegistry(root),
    input: expert
      ? expertRenderInput(root, taxonomy, slug)
      : blueprintRenderInput(root, taxonomy, slug),
  };
  if (expert) return plan;

  const folder = readBlueprintFolder(root, slug);
  const manifest = readManifest(taxonomy, folder);
  return {
    ...plan,
    recipe: {
      name: manifest.name,
      setup: readBlueprintFile(folder, 'setup.md'),
      declares: manifest,
      integrations: manifest.integrations ?? [],
    },
  };
}

/**
 * One entry out of the published catalog, for a command run anywhere.
 *
 * The index lists every file in an entry's folder, which is how the skills are
 * found without a directory to read. Each file is one request, and nothing is
 * fetched that is not written.
 */
export async function publishedPlan(
  slug: string,
  { expert = false } = {},
  options: PublishedCatalogOptions = {},
): Promise<GetPlan> {
  // `from` rather than the URL that was asked for: when Pages is mid-deploy the
  // raw repository answers instead, and a line that named the wrong one would
  // be worse than no line at all.
  const { index, from } = await loadPublishedIndex(options);
  const source = `the published catalog at ${from}`;
  const agents = publishedAgents(index);

  if (expert) {
    const entry = publishedEntry(index.experts, 'expert', slug);
    const skill = await readPublishedFile('expert', slug, 'SKILL.md', options);
    return {
      source,
      agents,
      input: { slug, summary: entry.summary, body: skill, skills: { [slug]: skill } },
    };
  }

  const entry = publishedEntry(index.blueprints, 'blueprint', slug);
  const skills: Record<string, string> = {};
  for (const file of entry.files) {
    const name = SKILL_FILE.exec(file)?.[1];
    if (name !== undefined) {
      skills[name] = await readPublishedFile('blueprint', slug, file, options);
    }
  }

  return {
    source,
    agents,
    input: {
      slug,
      summary: entry.summary,
      body: await readPublishedFile('blueprint', slug, 'AGENTS.md', options),
      skills,
    },
    recipe: {
      name: entry.name,
      setup: await readPublishedFile('blueprint', slug, 'setup.md', options),
      declares: entry,
      integrations: entry.integrations,
    },
  };
}

/** The agent to write for, or a readable error naming where the list lives. */
export function agentOrThrow(plan: GetPlan, id: string) {
  const agent = findAgent(plan.agents, id);
  if (agent === undefined) {
    throw new Error(
      `No such agent: ${id} — the catalog has ${plan.agents.agents
        .map((one) => one.id)
        .join(', ')}`,
    );
  }
  return agent;
}
