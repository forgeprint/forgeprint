/**
 * The catalog over HTTP, for a command run outside a checkout.
 *
 * [ADR 0013](../../../docs/decisions/0013-agent-agnostic.md) promises an agent
 * with no MCP client the same answer through the CLI. That promise was half
 * kept: every command resolved the catalog by walking up for
 * `schema/taxonomy.yaml`, so `npx forgeprint get …` exited with "Not inside a
 * Forgeprint repository" — which is precisely where `npx` leaves you. This
 * module is the other half.
 *
 * It reads what the MCP server already reads, for the same reason: the
 * published index is a committed file, so Pages serves it without a build
 * service (ADR 0002), and the raw repository is the fallback for the minutes
 * when Pages is redeploying. The index carries the taxonomy, the agent
 * registry, and for each entry its summary, its declared options and the list
 * of files in its folder — everything but the file contents, which come from
 * the repository itself.
 *
 * A checkout still wins when there is one. Working offline, and testing an
 * entry that exists nowhere yet, are the same need and `--root` is the answer
 * to both.
 */
import { z } from 'zod';
import { agentSchema, type AgentRegistry } from './agents.js';
import type { CatalogIndex } from './build-index.js';
import { UNIT_DIRECTORY, type UnitKind } from './unit.js';

export const DEFAULT_INDEX_URL = 'https://forgeprint.github.io/forgeprint/index.json';
export const FALLBACK_INDEX_URL =
  'https://raw.githubusercontent.com/forgeprint/forgeprint/main/docs/index.json';
export const DEFAULT_FILES_URL = 'https://raw.githubusercontent.com/forgeprint/forgeprint/main';

/** How long one request may take before it is abandoned. */
export const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch a text resource, and give up after `timeoutMs`.
 *
 * Without a limit a stalled network holds the command open for as long as the
 * operating system keeps the socket. A timeout turns that into the same error
 * as any other failed fetch, which the caller already reports.
 */
export async function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: 'text/plain, application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}

/** Reads one URL. Injected so the tests never touch the network. */
export type ReadUrl = (url: string) => Promise<string>;

export interface PublishedCatalogOptions {
  readonly indexUrl?: string;
  /** `null` disables the fallback; the default is the raw repository. */
  readonly fallbackIndexUrl?: string | null;
  readonly filesUrl?: string;
  readonly read?: ReadUrl;
}

export class PublishedCatalogError extends Error {}

/**
 * The URLs in use, with the environment allowed to override them — the same
 * two variables the MCP server documents, so a mirror is configured once.
 */
export function publishedUrls(
  options: PublishedCatalogOptions = {},
  env: Readonly<Record<string, string | undefined>> = process.env,
): { readonly indexUrl: string; readonly filesUrl: string } {
  const fromEnv = (name: string): string | undefined => {
    const value = env[name];
    return value === undefined || value.length === 0 ? undefined : value;
  };
  return {
    indexUrl: options.indexUrl ?? fromEnv('FORGEPRINT_INDEX_URL') ?? DEFAULT_INDEX_URL,
    filesUrl: options.filesUrl ?? fromEnv('FORGEPRINT_FILES_URL') ?? DEFAULT_FILES_URL,
  };
}

export interface LoadedIndex {
  readonly index: CatalogIndex;
  /** The URL that actually answered, which is not always the one asked first. */
  readonly from: string;
}

/** The published index, Pages first and the raw repository second. */
export async function loadPublishedIndex(
  options: PublishedCatalogOptions = {},
): Promise<LoadedIndex> {
  const read = options.read ?? fetchText;
  const { indexUrl } = publishedUrls(options);
  const fallback =
    options.fallbackIndexUrl === undefined ? FALLBACK_INDEX_URL : options.fallbackIndexUrl;
  const urls = fallback === null || fallback === indexUrl ? [indexUrl] : [indexUrl, fallback];

  const failures: string[] = [];
  for (const url of urls) {
    try {
      const parsed: unknown = JSON.parse(await read(url));
      if (typeof parsed !== 'object' || parsed === null || !('blueprints' in parsed)) {
        throw new Error('not a catalog index');
      }
      return { index: parsed as CatalogIndex, from: url };
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new PublishedCatalogError(
    `Could not load the published catalog.\n${failures.map((line) => `  ${line}`).join('\n')}\n` +
      'Pass --root <path> to read a Forgeprint checkout instead, which also works offline.',
  );
}

/** Where one file of one entry is served from. */
export function publishedFileUrl(
  kind: UnitKind,
  slug: string,
  path: string,
  options: PublishedCatalogOptions = {},
): string {
  return `${publishedUrls(options).filesUrl}/${UNIT_DIRECTORY[kind]}/${slug}/${path}`;
}

/** One file of one entry, by the same path the index lists it under. */
export async function readPublishedFile(
  kind: UnitKind,
  slug: string,
  path: string,
  options: PublishedCatalogOptions = {},
): Promise<string> {
  const read = options.read ?? fetchText;
  const url = publishedFileUrl(kind, slug, path, options);
  try {
    return await read(url);
  } catch (error) {
    throw new PublishedCatalogError(
      `Could not read ${path} of ${kind} "${slug}" from ${url}: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

/**
 * The agent registry out of a published index.
 *
 * Validated rather than trusted. `render` reads an agent's file layout from
 * this, and an index old enough to predate ADR 0012 has no `agents` key at
 * all — a `undefined is not an object` three frames into rendering is a worse
 * answer than saying which catalog is too old.
 */
export function publishedAgents(index: CatalogIndex): AgentRegistry {
  const agents = (index as { agents?: unknown }).agents;
  if (!Array.isArray(agents) || agents.length === 0) {
    throw new PublishedCatalogError(
      'The published catalog carries no agent registry, so there is nothing to render for. ' +
        'Pass --root <path> to read a checkout instead.',
    );
  }
  // The index carries the agents and not the registry's own `version`, whose
  // only valid value is 1 — so this validates what was published and supplies
  // the one field that could not have been anything else.
  const result = z.array(agentSchema).min(1).safeParse(agents);
  if (!result.success) {
    throw new PublishedCatalogError(
      `The published catalog's agent registry is not one this version understands: ${result.error.message}`,
    );
  }
  return { version: 1, agents: result.data };
}

/** An entry of one kind, or a readable error naming what the catalog does have. */
export function publishedEntry<T extends { slug: string }>(
  entries: readonly T[] | undefined,
  kind: string,
  slug: string,
): T {
  const found = (entries ?? []).find((entry) => entry.slug === slug);
  if (found === undefined) {
    const known = (entries ?? []).map((entry) => entry.slug);
    throw new PublishedCatalogError(
      known.length === 0
        ? `No ${kind} "${slug}": the published catalog has no ${kind}s`
        : `No ${kind} "${slug}". The published catalog has: ${known.join(', ')}`,
    );
  }
  return found;
}
