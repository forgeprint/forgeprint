import {
  listBlueprintSlugs,
  readBlueprintFolder,
  readManifest,
  translations,
  type Blueprint,
} from './catalog.js';
import { stableJson } from './json.js';
import type { Taxonomy } from './taxonomy.js';

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
}

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
  /** Where the blueprint was derived from, when it was (ADR 0008). */
  readonly provenance?: {
    readonly derived_from: string;
    readonly license: string;
    readonly verified_on: string;
    readonly note?: string | undefined;
  };
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
    // Absent rather than empty: a blueprint written from scratch has none,
    // and an empty object would read as an unanswered question.
    ...(m.provenance === undefined ? {} : { provenance: m.provenance }),
    deprecated: m.deprecated,
    supersedes: m.supersedes,
    files: blueprint.files,
    i18n: translations(blueprint),
  };
}

export function buildIndex(blueprints: readonly Blueprint[], taxonomy: Taxonomy): CatalogIndex {
  return { schema: 1, taxonomy, blueprints: blueprints.map(indexEntry) };
}

export function renderIndex(blueprints: readonly Blueprint[], taxonomy: Taxonomy): string {
  return stableJson(buildIndex(blueprints, taxonomy));
}
