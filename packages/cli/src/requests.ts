import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { stableJson } from './json.js';
import { repoPaths } from './paths.js';

/**
 * The demand signal, as data.
 *
 * `request_blueprint` turns "nothing fits" into a public issue, and that list
 * is what decides which blueprint gets written next — the catalog grows by
 * demand, not by guesswork (CLAUDE.md §3.4). The site shows it, so it has to
 * exist as a file: Pages serves a branch, and a browser fetching the GitHub
 * API on every page load would be a different product.
 *
 * It is generated and committed like the other artifacts, with one difference
 * that matters: it comes from outside the repository, so `validate` cannot
 * regenerate it to check for drift. Nothing depends on it being current — a
 * stale list is a list, and a missing one renders as "none yet".
 */

/** The label `.github/ISSUE_TEMPLATE/blueprint-request.yml` applies. */
export const REQUEST_LABEL = 'blueprint-request';

const requestSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  url: z.string().min(1),
  author: z.string(),
});

const fileSchema = z.object({
  repository: z.string(),
  requests: z.array(requestSchema),
});

export type BlueprintRequest = z.infer<typeof requestSchema>;
export type RequestsFile = z.infer<typeof fileSchema>;

/**
 * Open blueprint requests, straight from `gh`.
 *
 * `gh` rather than a fetch with a token: the maintainer is already
 * authenticated, and nothing here should ask anybody for a secret.
 */
export function fetchRequests(repository: string): BlueprintRequest[] {
  const output = execFileSync(
    'gh',
    [
      'issue',
      'list',
      '--repo',
      repository,
      '--label',
      REQUEST_LABEL,
      '--state',
      'open',
      '--limit',
      '50',
      '--json',
      'number,title,url,author',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const raw: unknown = JSON.parse(output);
  const issues = z
    .array(
      z.object({
        number: z.number(),
        title: z.string(),
        url: z.string(),
        author: z.object({ login: z.string() }).nullish(),
      }),
    )
    .parse(raw);

  return issues
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      url: issue.url,
      author: issue.author?.login ?? '',
    }))
    .sort((a, b) => a.number - b.number);
}

/** True when `gh` is on this machine, which is the only thing this needs. */
export function hasGitHubCli(): boolean {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function renderRequests(repository: string, requests: readonly BlueprintRequest[]): string {
  return stableJson({ repository, requests });
}

/**
 * The committed list, or nothing at all. Every failure is the same answer —
 * no requests — because a demand list is never worth failing a build over.
 */
export function readRequests(root: string): RequestsFile {
  try {
    return fileSchema.parse(JSON.parse(readFileSync(repoPaths.requests(root), 'utf8')));
  } catch {
    return { repository: '', requests: [] };
  }
}
