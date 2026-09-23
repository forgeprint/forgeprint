import { existsSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import {
  hasAgentRegistry,
  loadAgentRegistry,
  staleAgents,
  STALE_AFTER_DAYS,
  vocabularyMismatches,
} from './agents.js';
import { renderCodeowners } from './build-codeowners.js';
import { renderIndex } from './build-index.js';
import { buildManifestJsonSchema } from './build-schema.js';
import {
  listBlueprintSlugs,
  missingRequiredFiles,
  readBlueprintFolder,
  readManifest,
  type Blueprint,
} from './catalog.js';
import { loadConfig } from './config.js';
import { normalizeNewlines } from './json.js';
import { combinationKey } from './manifest.js';
import { repoPaths } from './paths.js';
import { checkSkills } from './skills.js';
import { SLUG_PATTERN, describeError, loadTaxonomy, type Taxonomy } from './taxonomy.js';
import { unitLabel, validateUnits } from './validate-units.js';

export interface Problem {
  /** Blueprint slug, or undefined for a catalog-wide problem. */
  readonly blueprint?: string;
  readonly message: string;
}

export interface ValidationReport {
  readonly ok: boolean;
  readonly checked: number;
  readonly problems: readonly Problem[];
  /**
   * Things that are true but are nobody's pull request to fix.
   *
   * A registry entry going stale is a fact about the calendar. Failing an
   * unrelated contributor's pull request over it would teach everybody to
   * ignore a red build, so it is printed and the build stays green.
   */
  readonly warnings: readonly Problem[];
}

/**
 * Validate the whole catalog: schema conformance, required files, and the
 * catalog-wide rules that no single manifest can enforce on its own.
 */
export function validateCatalog(root: string): ValidationReport {
  const problems: Problem[] = [];
  const warnings: Problem[] = [];
  let taxonomy: Taxonomy;
  try {
    taxonomy = loadTaxonomy(root);
  } catch (error) {
    return { ok: false, checked: 0, problems: [{ message: describeError(error) }], warnings: [] };
  }

  const slugs = listBlueprintSlugs(root);
  const blueprints: Blueprint[] = [];

  for (const slug of slugs) {
    const report = (message: string): void => void problems.push({ blueprint: slug, message });

    if (!SLUG_PATTERN.test(slug)) {
      report('folder name must be lower kebab-case');
      continue;
    }

    const folder = readBlueprintFolder(root, slug);
    const missing = missingRequiredFiles(folder);
    if (missing.length > 0) report(`missing required file(s): ${missing.join(', ')}`);
    if (missing.includes('manifest.yaml')) continue;

    let blueprint: Blueprint;
    try {
      blueprint = { ...folder, manifest: readManifest(taxonomy, folder) };
    } catch (error) {
      report(`manifest.yaml: ${describeError(error)}`);
      continue;
    }
    blueprints.push(blueprint);

    const manifest = blueprint.manifest;
    if (manifest.slug !== slug) {
      report(`manifest slug "${manifest.slug}" does not match the folder name`);
    }
    if (!missing.includes('CHANGELOG.md') && !mentionsVersion(folder.dir, manifest.version)) {
      report(`CHANGELOG.md has no entry for version ${manifest.version} (rule 17)`);
    }
  }

  const known = new Set(blueprints.map((blueprint) => blueprint.slug));
  const combinations = new Map<string, string>();
  for (const { slug, manifest } of blueprints) {
    if (manifest.supersedes !== null && !known.has(manifest.supersedes)) {
      problems.push({
        blueprint: slug,
        message: `supersedes "${manifest.supersedes}", which is not in the catalog`,
      });
    }
    if (manifest.deprecated) continue;
    const key = combinationKey(manifest);
    const owner = combinations.get(key);
    if (owner === undefined) {
      combinations.set(key, slug);
    } else {
      problems.push({
        blueprint: slug,
        message: `same stack + project_type + requirements combination as "${owner}" (rule 9); supersede it instead`,
      });
    }
  }

  // Skills are distributed by tools nobody here controls, so the format they
  // read is checked with everything else (ADR 0006).
  for (const problem of checkSkills(root)) {
    problems.push({ message: `${problem.file}: ${problem.message}` });
  }

  // Experts, crews and integrations: the same rules, three more kinds, plus
  // the cross-references composition introduces (ADR 0012).
  const units = validateUnits(root, taxonomy);
  for (const problem of units.problems) {
    problems.push({ message: `${unitLabel(problem)}: ${problem.message}` });
  }
  problems.push(...danglingRecommendations(blueprints, units));

  const registry = checkAgentRegistry(root, taxonomy);
  problems.push(...registry.problems);
  warnings.push(...registry.warnings);

  problems.push(...generatedFileProblems(root, blueprints, taxonomy));
  return { ok: problems.length === 0, checked: slugs.length, problems, warnings };
}

/**
 * Recommendations that point at nothing.
 *
 * A blueprint may recommend an expert or a crew and never require one
 * (ADR 0012), so a missing one breaks no setup — which is exactly why it would
 * go unnoticed. The reader is the one who loses: they are told to work with
 * somebody who does not exist.
 */
function danglingRecommendations(
  blueprints: readonly Blueprint[],
  units: ReturnType<typeof validateUnits>,
): Problem[] {
  const experts = new Set(units.experts.map((expert) => expert.slug));
  const crews = new Set(units.crews.map((crew) => crew.slug));
  const integrations = new Set(units.integrations.map((integration) => integration.slug));

  const problems: Problem[] = [];
  for (const { slug, manifest } of blueprints) {
    const check = (named: readonly string[], known: Set<string>, what: string): void => {
      for (const name of named) {
        if (!known.has(name)) {
          problems.push({ blueprint: slug, message: `${what} "${name}" is not in the catalog` });
        }
      }
    };
    check(manifest.recommended_experts ?? [], experts, 'recommended_experts');
    check(
      manifest.recommended_crew === null ? [] : [manifest.recommended_crew],
      crews,
      'recommended_crew',
    );
    check(manifest.integrations ?? [], integrations, 'integrations');
  }
  return problems;
}

/**
 * The agent registry against the vocabulary that derives from it (ADR 0013).
 *
 * A repository without a registry is not an error: the file arrived after the
 * catalog did, and a fixture that predates it should still validate.
 */
function checkAgentRegistry(
  root: string,
  taxonomy: Taxonomy,
  today: Date = new Date(),
): { problems: Problem[]; warnings: Problem[] } {
  if (!hasAgentRegistry(root)) return { problems: [], warnings: [] };
  let registry: ReturnType<typeof loadAgentRegistry>;
  try {
    registry = loadAgentRegistry(root);
  } catch (error) {
    return { problems: [{ message: describeError(error) }], warnings: [] };
  }
  const problems: Problem[] = vocabularyMismatches(registry, taxonomy).map((message) => ({
    message: `schema/agents.yaml: ${message}`,
  }));
  const warnings: Problem[] = staleAgents(registry, today).map((agent) => ({
    message:
      `schema/agents.yaml: "${agent.id}" was last checked on ${agent.last_checked}, ` +
      `more than ${STALE_AFTER_DAYS} days ago — re-read ${agent.docs}`,
  }));
  return { problems, warnings };
}

/**
 * Generated artifacts are committed (ADR 0002), so a stale one is a defect.
 * Each check reports the command that fixes it.
 */
function generatedFileProblems(
  root: string,
  blueprints: readonly Blueprint[],
  taxonomy: Taxonomy,
): Problem[] {
  const problems: Problem[] = [];
  const check = (file: string, expected: string, command: string): void => {
    if (!existsSync(file)) {
      problems.push({ message: `${label(root, file)} is missing; run \`${command}\`` });
      return;
    }
    if (normalizeNewlines(readFileSync(file, 'utf8')) !== normalizeNewlines(expected)) {
      problems.push({ message: `${label(root, file)} is out of date; run \`${command}\`` });
    }
  };

  check(repoPaths.index(root), renderIndex(blueprints, taxonomy), 'forgeprint build-index');
  check(
    repoPaths.manifestSchema(root),
    buildManifestJsonSchema(taxonomy),
    'forgeprint build-schema',
  );

  const coreMaintainer = loadConfig(root).core_maintainer;
  if (coreMaintainer !== undefined) {
    check(
      repoPaths.codeowners(root),
      renderCodeowners(blueprints, coreMaintainer),
      'forgeprint build-codeowners',
    );
  }
  return problems;
}

/** True when the changelog mentions the version as a standalone token. */
function mentionsVersion(dir: string, version: string): boolean {
  const changelog = readFileSync(join(dir, 'CHANGELOG.md'), 'utf8');
  const isVersionChar = (char: string | undefined): boolean =>
    char !== undefined && (char === '.' || (char >= '0' && char <= '9'));
  for (let at = changelog.indexOf(version); at !== -1; at = changelog.indexOf(version, at + 1)) {
    if (!isVersionChar(changelog[at - 1]) && !isVersionChar(changelog[at + version.length])) {
      return true;
    }
  }
  return false;
}

function label(root: string, file: string): string {
  return file
    .slice(root.length + 1)
    .split(sep)
    .join('/');
}
