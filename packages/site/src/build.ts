import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadConfig, readRequests } from 'forgeprint';
import { SITE_SCRIPT } from './chrome.js';
import { renderSite, STYLESHEET, type Page } from './render.js';
import { llmsText, sitemap } from './seo.js';
import type { IndexWithUnits } from './units.js';
import { loadIndex } from './index.js';

export interface BuildResult {
  /** Pages whose committed copy differs from what the catalog produces. */
  readonly stale: readonly string[];
  readonly written: readonly string[];
}

/** Every file the site is made of: the pages, the stylesheet, the language switch, and what crawlers read. */
export function siteFiles(root: string): Page[] {
  // The requests come from outside the repository and the contributors from
  // configuration; both are optional, and a missing one renders as empty
  // rather than failing the build.
  const snapshot = readRequests(root);
  const context = {
    requests: snapshot.requests,
    requestsFrom: snapshot.generated_on,
    featured: loadConfig(root).featured_contributors ?? [],
  };
  const index = loadIndex(root);
  const pages = renderSite(index, context);
  return [
    ...pages,
    { path: 'forgeprint.css', html: STYLESHEET },
    { path: 'site.js', html: SITE_SCRIPT },
    // For crawlers: every page, and the catalog as a model would read it.
    { path: 'sitemap.xml', html: sitemap(pages.map((page) => page.path)) },
    { path: 'llms.txt', html: llmsText(index as IndexWithUnits) },
  ];
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
