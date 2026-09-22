import { readFileSync } from 'node:fs';
import { repoPaths } from 'forgeprint';
import type { CatalogIndex } from 'forgeprint';

/**
 * The site is built from the committed `docs/index.json` and written back into
 * `docs/`, so GitHub Pages can serve it straight from the branch with no build
 * service involved (ADR 0002).
 *
 * The page renderer arrives in phase 3 of the roadmap.
 */
export const SITE_OUTPUT_DIR = 'docs';

export function loadIndex(root: string): CatalogIndex {
  const file = repoPaths.index(root);
  const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (typeof parsed !== 'object' || parsed === null || !('blueprints' in parsed)) {
    throw new Error(`${file} is not a catalog index; run \`forgeprint build-index\``);
  }
  return parsed as CatalogIndex;
}
