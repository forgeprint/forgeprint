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
export const DEFAULT_FILES_URL = 'https://raw.githubusercontent.com/forgeprint/forgeprint/main';

/** Where each kind's folders live, relative to the repository root. */
export const UNIT_DIRECTORY = {
  blueprint: 'blueprints',
  expert: 'experts',
  crew: 'crews',
  integration: 'integrations',
} as const;

export type UnitKind = keyof typeof UNIT_DIRECTORY;

/** How long a fetched index is reused. The server keeps no other state. */
export const INDEX_TTL_MS = 5 * 60 * 1000;

export interface CatalogSource {
  /** Shown in tool output so a caller knows which catalog answered. */
  readonly description: string;
  loadIndex(): Promise<CatalogIndex>;
  /** `kind` defaults to `blueprint`, which is all this served before ADR 0012. */
  readFile(slug: string, path: string, kind?: UnitKind): Promise<string>;
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
    async readFile(slug, path, kind = 'blueprint') {
      const file = join(root, UNIT_DIRECTORY[kind], slug, ...path.split('/'));
      try {
        return await readFile(file, 'utf8');
      } catch (error) {
        throw new BlueprintNotFoundError(`No file "${path}" in ${kind} "${slug}"`, {
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
    async readFile(slug, path, kind = 'blueprint') {
      const url = `${filesUrl}/${UNIT_DIRECTORY[kind]}/${slug}/${path}`;
      try {
        return await fetchText(url);
      } catch (error) {
        throw new BlueprintNotFoundError(`No file "${path}" in ${kind} "${slug}" (${url})`, {
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

/** How long one request for the catalog may take before it is abandoned. */
export const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch a text resource, and give up after `timeoutMs`.
 *
 * Without a limit a stalled network holds the tool call open for as long as
 * the operating system keeps the socket, and the agent waits on a tool that
 * will never answer. A timeout turns that into the same error as any other
 * failed fetch, which the caller already reports.
 */
export async function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: 'text/plain, application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}

/**
 * The entry for a slug in one of the kinds that arrived with ADR 0012.
 *
 * Separate from `entryFor` because the failure is different: an empty
 * `experts` list means the catalog has no experts yet, which is a true and
 * useful thing to say, and not the same as a slug being wrong.
 */
export function unitFor<T extends { slug: string }>(
  entries: readonly T[] | undefined,
  kind: string,
  slug: string,
): T {
  const found = (entries ?? []).find((entry) => entry.slug === slug);
  if (found === undefined) {
    const known = (entries ?? []).map((entry) => entry.slug);
    throw new BlueprintNotFoundError(
      known.length === 0
        ? `No ${kind} "${slug}": the catalog has no ${kind}s yet`
        : `No ${kind} "${slug}". The catalog has: ${known.join(', ')}`,
    );
  }
  return found;
}
