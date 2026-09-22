import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { renderSite, STYLESHEET, type Page } from './render.js';
import { loadIndex } from './index.js';

export interface BuildResult {
  /** Pages whose committed copy differs from what the catalog produces. */
  readonly stale: readonly string[];
  readonly written: readonly string[];
}

/** Every file the site is made of: the pages plus the one stylesheet. */
export function siteFiles(root: string): Page[] {
  return [...renderSite(loadIndex(root)), { path: 'forgeprint.css', html: STYLESHEET }];
}

/**
 * Write the site into `docs/`, or report what is out of date.
 *
 * The output is committed, because Pages serves it from the branch. `check`
 * is what keeps a committed copy from quietly drifting from the catalog.
 */
export function buildSite(root: string, { check = false } = {}): BuildResult {
  const stale: string[] = [];
  const written: string[] = [];

  for (const page of siteFiles(root)) {
    const file = join(root, 'docs', ...page.path.split('/'));
    if (check) {
      if (readFileIfPresent(file) !== page.html) stale.push(page.path);
      continue;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page.html, 'utf8');
    written.push(page.path);
  }

  return { stale, written };
}

function readFileIfPresent(file: string): string | undefined {
  try {
    return readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return undefined;
  }
}
