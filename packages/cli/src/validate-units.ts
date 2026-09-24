import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { z } from 'zod';
import {
  listUnitSlugs,
  missingUnitFiles,
  readUnitFolder,
  type BlueprintFolder,
} from './catalog.js';
import { crewCombinationKey, crewSchema, type Crew } from './crew.js';
import { expertCombinationKey, expertSchema, type Expert } from './expert.js';
import { integrationCombinationKey, integrationSchema, type Integration } from './integration.js';
import { lintIntegration } from './lint-integration.js';
import { describeError, SLUG_PATTERN, type Taxonomy } from './taxonomy.js';
import { UNIT_DIRECTORY, type UnitKind } from './unit.js';

export interface UnitProblem {
  readonly kind: UnitKind;
  readonly slug?: string;
  readonly message: string;
}

/** One kind's folders, parsed, with the manifest each one carries. */
interface Loaded<T> {
  readonly slug: string;
  readonly folder: BlueprintFolder;
  readonly manifest: T;
}

export interface UnitCatalog {
  readonly experts: readonly Loaded<Expert>[];
  readonly crews: readonly Loaded<Crew>[];
  readonly integrations: readonly Loaded<Integration>[];
  readonly problems: readonly UnitProblem[];
}

/**
 * Validate everything the catalog holds that is not a blueprint.
 *
 * The checks are the blueprint checks applied to three more kinds — folder
 * name, schema, changelog, rule 9 — plus the ones that only exist because
 * these kinds refer to each other. A crew that names an expert nobody wrote is
 * the failure mode composition buys, and it is the one worth catching
 * (ADR 0012).
 */
export function validateUnits(root: string, taxonomy: Taxonomy): UnitCatalog {
  const problems: UnitProblem[] = [];

  const experts = loadKind(root, 'expert', expertSchema(taxonomy), problems);
  const crews = loadKind(root, 'crew', crewSchema(taxonomy), problems);
  const integrations = loadKind(root, 'integration', integrationSchema(taxonomy), problems);

  problems.push(
    ...duplicates('expert', experts, expertCombinationKey, 'role + domain + seniority + languages'),
  );
  problems.push(...duplicates('crew', crews, crewCombinationKey, 'members + integrations'));
  problems.push(...duplicates('integration', integrations, integrationCombinationKey, 'upstream'));

  const expertSlugs = new Set(experts.map((expert) => expert.slug));
  const integrationSlugs = new Set(integrations.map((integration) => integration.slug));

  for (const { slug, folder, manifest } of experts) {
    // A checklist is a file. A name with no file behind it is the thing this
    // whole unit type exists to refuse: a claim with nothing under it.
    for (const checklist of manifest.checklists) {
      if (!folder.files.includes(`checklists/${checklist}.md`)) {
        problems.push({
          kind: 'expert',
          slug,
          message: `checklist "${checklist}" has no checklists/${checklist}.md`,
        });
      }
    }
    for (const partner of manifest.pairs_with ?? []) {
      if (!expertSlugs.has(partner)) {
        problems.push({
          kind: 'expert',
          slug,
          message: `pairs_with "${partner}", which is not in the catalog`,
        });
      }
    }
  }

  for (const { slug, manifest } of crews) {
    for (const member of manifest.members) {
      if (!expertSlugs.has(member)) {
        problems.push({
          kind: 'crew',
          slug,
          message: `member "${member}" is not an expert in the catalog`,
        });
      }
    }
    for (const integration of manifest.integrations ?? []) {
      if (!integrationSlugs.has(integration)) {
        problems.push({
          kind: 'crew',
          slug,
          message: `integration "${integration}" is not in the catalog`,
        });
      }
    }
  }

  for (const { slug, manifest } of integrations) {
    // The schema checks the fields; this checks the command text, which is
    // what a user actually pastes into a shell (rule 20, §5b).
    for (const problem of lintIntegration(manifest)) {
      problems.push({
        kind: 'integration',
        slug,
        message: `install.${problem.agent}: ${problem.message} (${problem.rule})`,
      });
    }
  }

  return { experts, crews, integrations, problems };
}

function loadKind<T extends { slug: string; version: string; deprecated: boolean }>(
  root: string,
  kind: UnitKind,
  schema: z.ZodType<T>,
  problems: UnitProblem[],
): Loaded<T>[] {
  const loaded: Loaded<T>[] = [];
  for (const slug of listUnitSlugs(root, kind)) {
    const report = (message: string): void => void problems.push({ kind, slug, message });

    if (!SLUG_PATTERN.test(slug)) {
      report('folder name must be lower kebab-case');
      continue;
    }

    const folder = readUnitFolder(root, kind, slug);
    const missing = missingUnitFiles(folder, kind);
    if (missing.length > 0) report(`missing required file(s): ${missing.join(', ')}`);
    if (missing.includes('manifest.yaml')) continue;

    const result = schema.safeParse(parse(readFileSync(join(folder.dir, 'manifest.yaml'), 'utf8')));
    if (!result.success) {
      report(`manifest.yaml: ${describeError(result.error)}`);
      continue;
    }
    const manifest = result.data;
    loaded.push({ slug, folder, manifest });

    if (manifest.slug !== slug) {
      report(`manifest slug "${manifest.slug}" does not match the folder name`);
    }
    if (!missing.includes('CHANGELOG.md') && !mentionsVersion(folder.dir, manifest.version)) {
      report(`CHANGELOG.md has no entry for version ${manifest.version} (rule 17)`);
    }
  }
  return loaded;
}

/** Rule 9, for whichever combination makes two of this kind the same thing. */
function duplicates<T extends { deprecated: boolean }>(
  kind: UnitKind,
  loaded: readonly Loaded<T>[],
  keyOf: (manifest: T) => string,
  what: string,
): UnitProblem[] {
  const problems: UnitProblem[] = [];
  const owners = new Map<string, string>();
  for (const { slug, manifest } of loaded) {
    if (manifest.deprecated) continue;
    const key = keyOf(manifest);
    const owner = owners.get(key);
    if (owner === undefined) {
      owners.set(key, slug);
    } else {
      problems.push({
        kind,
        slug,
        message: `same ${what} as "${owner}" (rule 9); supersede it instead`,
      });
    }
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

/** Where a problem is, the way a contributor would find it. */
export function unitLabel(problem: UnitProblem): string {
  return problem.slug === undefined
    ? UNIT_DIRECTORY[problem.kind]
    : `${UNIT_DIRECTORY[problem.kind]}/${problem.slug}`;
}
