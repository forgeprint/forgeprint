import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** File that marks the root of a Forgeprint repository. */
const ROOT_MARKER = join('schema', 'taxonomy.yaml');

/**
 * Walk upwards from `startDir` until a Forgeprint repository root is found, so
 * that every command works from any subdirectory the way git does.
 */
export function findRepoRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, ROOT_MARKER))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Not inside a Forgeprint repository: no ${ROOT_MARKER} found at or above ${resolve(startDir)}`,
      );
    }
    dir = parent;
  }
}

export const repoPaths = {
  taxonomy: (root: string): string => join(root, 'schema', 'taxonomy.yaml'),
  manifestSchema: (root: string): string => join(root, 'schema', 'manifest.schema.json'),
  blueprintsDir: (root: string): string => join(root, 'blueprints'),
  blueprintDir: (root: string, slug: string): string => join(root, 'blueprints', slug),
  index: (root: string): string => join(root, 'docs', 'index.json'),
  codeowners: (root: string): string => join(root, '.github', 'CODEOWNERS'),
};

/** Files every blueprint folder must contain. */
export const REQUIRED_BLUEPRINT_FILES = [
  'manifest.yaml',
  'AGENTS.md',
  'overview.md',
  'setup.md',
  'CHANGELOG.md',
] as const;
