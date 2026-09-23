import {
  listBlueprintSlugs,
  readBlueprintFolder,
  readManifest,
  translations,
  type Blueprint,
} from './catalog.js';
import { hasAgentRegistry, loadAgentRegistry, type Agent } from './agents.js';
import type { Crew } from './crew.js';
import type { Expert } from './expert.js';
import type { Integration } from './integration.js';
import { stableJson } from './json.js';
import type { Taxonomy } from './taxonomy.js';
import { validateUnits } from './validate-units.js';

/**
 * The published catalog index. It is committed to the repository so that GitHub
 * Pages can serve it from the branch without a build service (ADR 0002).
 *
 * The index carries no timestamp on purpose: a generated file that changes on
 * every run cannot be checked for drift.
 */
export interface CatalogIndex {
  readonly schema: 1;
  readonly taxonomy: Taxonomy;
  readonly blueprints: readonly IndexEntry[];
  /**
   * The three kinds that arrived with ADR 0012.
   *
   * They carry their manifest and their file list, the same way a blueprint
   * does, because the MCP server and the site read this file and nothing else.
   * Absent in an index built before they existed, so every reader treats them
   * as optional.
   */
  /**
   * The agent registry, so a reader knows what each agent actually reads
   * without a second fetch (ADR 0013). The site draws its badges from this and
   * `get_expert` answers "where do I write this" from it.
   */
  readonly agents?: readonly Agent[];
  readonly experts?: readonly UnitEntry<Expert>[];
  readonly crews?: readonly UnitEntry<Crew>[];
  readonly integrations?: readonly UnitEntry<Integration>[];
}

/** One expert, crew or integration as the index carries it. */
export type UnitEntry<T> = T & { readonly files: readonly string[] };

export interface IndexEntry {
  readonly slug: string;
  readonly name: string;
  readonly version: string;
  readonly tier: string;
  readonly maintainers: readonly string[];
  readonly summary: string;
  readonly stack: readonly string[];
  readonly languages: readonly string[];
  readonly platforms: readonly string[];
  readonly distribution: readonly string[];
  readonly project_type: string;
  readonly audience: readonly string[];
  readonly requirements: readonly string[];
  readonly agents: readonly string[];
  readonly options: Record<string, string[]>;
  readonly provides: { readonly mcp: string[]; readonly skills: string[] };
  readonly requires_tools: readonly string[];
  /** Who wrote it: a person, or a tool (ADR 0011). */
  readonly provenance: 'human' | 'generated';
  /** Where the blueprint was derived from, when it was (ADR 0008). */
  readonly derived_from?: {
    readonly url: string;
    readonly license: string;
    readonly verified_on: string;
    readonly note?: string | undefined;
  };
  /** Who to work with and what to install alongside it (ADR 0012). */
  readonly recommended_experts: readonly string[];
  readonly recommended_crew: string | null;
  readonly integrations: readonly string[];
  readonly deprecated: boolean;
  readonly supersedes: string | null;
  readonly files: readonly string[];
  readonly i18n: readonly string[];
}

export function loadBlueprints(root: string, taxonomy: Taxonomy): Blueprint[] {
  return listBlueprintSlugs(root).map((slug) => {
    const folder = readBlueprintFolder(root, slug);
    return { ...folder, manifest: readManifest(taxonomy, folder) };
  });
}

export function indexEntry(blueprint: Blueprint): IndexEntry {
  const m = blueprint.manifest;
  return {
    slug: m.slug,
    name: m.name,
    version: m.version,
    tier: m.tier,
    maintainers: m.maintainers,
    summary: m.summary,
    stack: m.stack,
    languages: m.languages,
    platforms: m.platforms,
    distribution: m.distribution,
    project_type: m.project_type,
    audience: m.audience,
    requirements: m.requirements,
    agents: m.agents,
    options: m.options ?? {},
    provides: { mcp: m.provides?.mcp ?? [], skills: m.provides?.skills ?? [] },
    requires_tools: m.requires_tools ?? [],
    provenance: m.provenance,
    // Absent rather than empty: a blueprint written from scratch has no
    // source, and an empty object would read as an unanswered question.
    ...(m.derived_from === undefined ? {} : { derived_from: m.derived_from }),
    recommended_experts: m.recommended_experts ?? [],
    recommended_crew: m.recommended_crew,
    integrations: m.integrations ?? [],
    deprecated: m.deprecated,
    supersedes: m.supersedes,
    files: blueprint.files,
    i18n: translations(blueprint),
  };
}

export function buildIndex(
  blueprints: readonly Blueprint[],
  taxonomy: Taxonomy,
  root?: string,
): CatalogIndex {
  const base = { schema: 1, taxonomy, blueprints: blueprints.map(indexEntry) } as const;
  if (root === undefined) return base;

  // A catalog with none of these is not an error — they arrived after it did —
  // so an empty kind is left out rather than published as an empty array.
  const units = validateUnits(root, taxonomy);
  const list = <T>(loaded: readonly { folder: { files: readonly string[] }; manifest: T }[]) =>
    loaded.map((one) => ({ ...one.manifest, files: one.folder.files }));
  return {
    ...base,
    ...(hasAgentRegistry(root) ? { agents: loadAgentRegistry(root).agents } : {}),
    ...(units.experts.length === 0 ? {} : { experts: list(units.experts) }),
    ...(units.crews.length === 0 ? {} : { crews: list(units.crews) }),
    ...(units.integrations.length === 0 ? {} : { integrations: list(units.integrations) }),
  };
}

export function renderIndex(
  blueprints: readonly Blueprint[],
  taxonomy: Taxonomy,
  root?: string,
): string {
  return stableJson(buildIndex(blueprints, taxonomy, root));
}
