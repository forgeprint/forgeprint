/**
 * Where the server reads the catalog from.
 *
 * The published index is a committed file served by GitHub Pages, with the raw
 * repository as a fallback, so the server keeps working when Pages is being
 * redeployed. Pointing `FORGEPRINT_CATALOG` at a checkout replaces both, which
 * is how the catalog is used offline and how contributors test their own
 * blueprint before it exists anywhere (ADR 0002).
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CatalogIndex, IndexEntry } from 'forgeprint';

export const DEFAULT_INDEX_URL = 'https://forgeprint.github.io/forgeprint/index.json';
export const FALLBACK_INDEX_URL =
  'https://raw.githubusercontent.com/forgeprint/forgeprint/main/docs/index.json';
export const DEFAULT_FILES_URL =
  'https://raw.githubusercontent.com/forgeprint/forgeprint/main/blueprints';

/** How long a fetched index is reused. The server keeps no other state. */
export const INDEX_TTL_MS = 5 * 60 * 1000;

export interface CatalogSource {
  /** Shown in tool output so a caller knows which catalog answered. */
  readonly description: string;
  loadIndex(): Promise<CatalogIndex>;
  readFile(slug: string, path: string): Promise<string>;
}

export class BlueprintNotFoundError extends Error {}
export class CatalogUnavailableError extends Error {}

export function localSource(root: string): CatalogSource {
  return {
    description: `local catalog at ${root}`,
    async loadIndex() {
      const file = join(root, 'docs', 'index.json');
      try {
        return JSON.parse(await readFile(file, 'utf8')) as CatalogIndex;
      } catch (error) {
        throw new CatalogUnavailableError(
          `Could not read ${file}. Run \`forgeprint build-index\` in that checkout.`,
          { cause: error },
        );
      }
    },
    async readFile(slug, path) {
      const file = join(root, 'blueprints', slug, ...path.split('/'));
      try {
        return await readFile(file, 'utf8');
      } catch (error) {
        throw new BlueprintNotFoundError(`No file "${path}" in blueprint "${slug}"`, {
          cause: error,
        });
      }
    },
  };
}

export function httpSource(
  indexUrl: string = DEFAULT_INDEX_URL,
  filesUrl: string = DEFAULT_FILES_URL,
  /** `null` disables the fallback; the default is the raw repository. */
  fallbackIndexUrl: string | null = FALLBACK_INDEX_URL,
): CatalogSource {
  let cached: { index: CatalogIndex; at: number } | undefined;

  return {
    description: `published catalog at ${indexUrl}`,
    async loadIndex() {
      if (cached !== undefined && Date.now() - cached.at < INDEX_TTL_MS) return cached.index;

      const urls = fallbackIndexUrl === null ? [indexUrl] : [indexUrl, fallbackIndexUrl];
      const failures: string[] = [];
      for (const url of urls) {
        try {
          const index = (await fetchText(url).then(JSON.parse)) as CatalogIndex;
          cached = { index, at: Date.now() };
          return index;
        } catch (error) {
          failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      throw new CatalogUnavailableError(
        `Could not load the catalog index.\n${failures.join('\n')}\n` +
          'Set FORGEPRINT_CATALOG to a local checkout to work offline.',
      );
    },
    async readFile(slug, path) {
      const url = `${filesUrl}/${slug}/${path}`;
      try {
        return await fetchText(url);
      } catch (error) {
        throw new BlueprintNotFoundError(`No file "${path}" in blueprint "${slug}" (${url})`, {
          cause: error,
        });
      }
    },
  };
}

export function catalogFromEnvironment(
  env: Readonly<Record<string, string | undefined>> = process.env,
): CatalogSource {
  const local = env['FORGEPRINT_CATALOG'];
  if (local !== undefined && local.length > 0) return localSource(local);
  return httpSource(env['FORGEPRINT_INDEX_URL'], env['FORGEPRINT_FILES_URL']);
}

/** The entry for a slug, or a readable error naming what is in the catalog. */
export function entryFor(index: CatalogIndex, slug: string): IndexEntry {
  const entry = index.blueprints.find((blueprint) => blueprint.slug === slug);
  if (entry === undefined) {
    const known = index.blueprints.map((blueprint) => blueprint.slug);
    throw new BlueprintNotFoundError(
      known.length === 0
        ? `No blueprint "${slug}": the catalog is empty`
        : `No blueprint "${slug}". The catalog has: ${known.join(', ')}`,
    );
  }
  return entry;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { accept: 'text/plain, application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}
