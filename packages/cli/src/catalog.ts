import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';
import { repoPaths, REQUIRED_BLUEPRINT_FILES } from './paths.js';
import { manifestSchema, type Manifest } from './manifest.js';
import { describeError, type Taxonomy } from './taxonomy.js';
import { REQUIRED_FILES, UNIT_DIRECTORY, type UnitKind } from './unit.js';

export interface BlueprintFolder {
  /** Folder name under `blueprints/`. */
  readonly slug: string;
  readonly dir: string;
  /** Every file in the folder, as forward-slash paths relative to it, sorted. */
  readonly files: readonly string[];
}

export interface Blueprint extends BlueprintFolder {
  readonly manifest: Manifest;
}

/** Blueprint folder names, sorted, so that every generated file is stable. */
export function listBlueprintSlugs(root: string): string[] {
  const dir = repoPaths.blueprintsDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function readBlueprintFolder(root: string, slug: string): BlueprintFolder {
  const dir = repoPaths.blueprintDir(root, slug);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`No such blueprint: ${slug}`);
  }
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => toPosix(relative(dir, join(entry.parentPath, entry.name))))
    .sort();
  return { slug, dir, files };
}

export function missingRequiredFiles(folder: BlueprintFolder): string[] {
  return REQUIRED_BLUEPRINT_FILES.filter((file) => !folder.files.includes(file));
}

/** Parse and validate one manifest. Throws with a readable message on failure. */
export function parseManifest(taxonomy: Taxonomy, source: string): Manifest {
  const result = manifestSchema(taxonomy).safeParse(parse(source));
  if (!result.success) throw new Error(describeError(result.error));
  return result.data;
}

export function readManifest(taxonomy: Taxonomy, folder: BlueprintFolder): Manifest {
  return parseManifest(taxonomy, readFileSync(join(folder.dir, 'manifest.yaml'), 'utf8'));
}

export function readBlueprintFile(folder: BlueprintFolder, file: string): string {
  return readFileSync(join(folder.dir, ...file.split('/')), 'utf8');
}

/** Community translations of overview.md, as language codes, sorted. */
export function translations(folder: BlueprintFolder): string[] {
  return folder.files
    .filter((file) => file.startsWith('i18n/') && file.endsWith('/overview.md'))
    .map((file) => file.split('/')[1] ?? '')
    .filter((lang) => lang.length > 0)
    .sort();
}

function toPosix(path: string): string {
  return sep === '/' ? path : path.split(sep).join('/');
}

/**
 * The same three reads, for the kinds of thing that arrived after blueprints
 * (ADR 0012). A blueprint keeps its own helpers above because the rest of the
 * pipeline is written against them; everything new goes through these.
 */
export function listUnitSlugs(root: string, kind: UnitKind): string[] {
  const dir = repoPaths.unitsDir(root, UNIT_DIRECTORY[kind]);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function readUnitFolder(root: string, kind: UnitKind, slug: string): BlueprintFolder {
  const dir = repoPaths.unitDir(root, UNIT_DIRECTORY[kind], slug);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`No such ${kind}: ${slug}`);
  }
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => toPosix(relative(dir, join(entry.parentPath, entry.name))))
    .sort();
  return { slug, dir, files };
}

export function missingUnitFiles(folder: BlueprintFolder, kind: UnitKind): string[] {
  return REQUIRED_FILES[kind].filter((file) => !folder.files.includes(file));
}

export function readUnitFile(folder: BlueprintFolder, file: string): string {
  return readFileSync(join(folder.dir, ...file.split('/')), 'utf8');
}
