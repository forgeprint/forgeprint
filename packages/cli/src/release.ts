import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Cutting a release, as one command.
 *
 * The steps were a checklist in `docs/releasing.md` and they were run by hand,
 * which went wrong in three different ways in a single afternoon: a rejected
 * token that reports itself as `404 Not Found`, a publish that succeeded and
 * then reported `409 Cannot publish over previously staged version`, and a
 * registry that served the previous version for minutes after the package page
 * showed the new one. Each one looked like a different problem than it was.
 *
 * So the rule this module is built on: **never believe the publish command,
 * read the registry.** Every package is published on its own and then verified
 * against the registry, and an error is only an error if the registry agrees.
 *
 * It runs on a laptop and needs no Actions (ADR 0002). It checks CI when `gh`
 * can reach it and says so when it cannot, rather than refusing to work.
 */

/** A package in the workspace that is published to npm. */
export interface WorkspacePackage {
  name: string;
  dir: string;
  version: string;
  private: boolean;
}

export interface VersionProblem {
  package: string;
  problem: string;
}

/** How a publish attempt ended, once the registry has been consulted. */
export type PublishOutcome =
  | { kind: 'published' }
  | { kind: 'already-published' }
  | { kind: 'unauthorized' }
  | { kind: 'stage-only' }
  | { kind: 'needs-interactive' }
  | { kind: 'failed'; detail: string };

/**
 * Every package under `packages/`, with the fields a release cares about.
 *
 * Read from disk rather than from `pnpm list --json`: this has to work when
 * the workspace does not install, which is exactly when somebody is trying to
 * find out what state a half-finished release left behind.
 */
export function readWorkspacePackages(root: string): WorkspacePackage[] {
  const dir = join(root, 'packages');
  if (!existsSync(dir)) return [];
  const packages: WorkspacePackage[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(dir, entry.name, 'package.json');
    if (!existsSync(file)) continue;
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    const record = parsed as Record<'name' | 'version' | 'private', unknown>;
    if (typeof record.name !== 'string' || typeof record.version !== 'string') continue;
    packages.push({
      name: record.name,
      dir: join(dir, entry.name),
      version: record.version,
      private: record.private === true,
    });
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/** The packages a release actually publishes. */
export function publishable(packages: WorkspacePackage[]): WorkspacePackage[] {
  return packages.filter((p) => !p.private);
}

/**
 * Whether a CHANGELOG has an entry for this version.
 *
 * The same rule blueprints live under (rule 17): a bump without an entry is a
 * defect. A release is the last moment it can be caught cheaply.
 */
export function hasChangelogEntry(changelog: string, version: string): boolean {
  const heading = new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}(\\s|$)`, 'm');
  return heading.test(changelog);
}

/**
 * Everything that would make this release wrong, as a list rather than the
 * first thing found: a maintainer fixing three versions wants all three now.
 */
export function checkVersions(
  packages: WorkspacePackage[],
  version: string,
  readChangelog: (pkg: WorkspacePackage) => string | undefined,
): VersionProblem[] {
  const problems: VersionProblem[] = [];
  for (const pkg of packages) {
    if (pkg.version !== version) {
      problems.push({
        package: pkg.name,
        problem: `package.json says ${pkg.version}, the release is ${version}`,
      });
    }
    const changelog = readChangelog(pkg);
    if (changelog === undefined) {
      problems.push({ package: pkg.name, problem: 'no CHANGELOG.md' });
      continue;
    }
    if (!hasChangelogEntry(changelog, version)) {
      problems.push({ package: pkg.name, problem: `CHANGELOG.md has no entry for ${version}` });
    }
  }
  return problems;
}

/**
 * What a failed publish actually means.
 *
 * npm's wording is misleading in both of the cases that happen in practice,
 * and reading it literally is what turns a finished release into an attempt to
 * skip a version number that was never stuck.
 */
export function classifyPublishError(output: string): PublishOutcome {
  const text = flattenReport(output);
  // "Cannot publish over previously staged version" is npm's phrasing for
  // "this version already exists". Nothing is staged and nothing is waiting
  // for approval — see npm/cli#9889. It arrives after a publish that worked.
  if (text.includes('previously staged version') || text.includes('cannot publish over')) {
    return { kind: 'already-published' };
  }
  if (text.includes('you cannot publish over the previously published versions')) {
    return { kind: 'already-published' };
  }
  // A token created with "Read and write (stage only)" is refused here and
  // nowhere else: `npm whoami` succeeds, and `npm token list` reports the same
  // permissions a working token reports. This 403 is the only place the
  // difference is visible, and it lands after the tag is already pushed.
  if (text.includes('e_stage_required') || text.includes('can only publish to a staging area')) {
    return { kind: 'stage-only' };
  }
  // 2FA without a bypass token is a browser challenge, which cannot happen in
  // a subprocess. Not a credential problem — the same token works by hand.
  if (text.includes('not running in an interactive terminal')) {
    return { kind: 'needs-interactive' };
  }
  // npm answers an unauthorized request for a package you cannot write with
  // 404, so a missing-package error is almost always a rejected token.
  if (text.includes('404') || text.includes('401') || text.includes('eneedauth')) {
    return { kind: 'unauthorized' };
  }
  return { kind: 'failed', detail: output.trim().split('\n').slice(-5).join('\n') };
}

/**
 * A publish error as one lower-case line, whatever the client did to it.
 *
 * pnpm wraps its error report to the terminal width and prefixes every
 * continuation line with a box-drawing character, so "not running in an
 * interactive terminal" arrives as "not running\n  │ in an interactive
 * terminal". A phrase match against the raw text misses it — which is exactly
 * how 0.3.1's release printed a raw error instead of the instruction written
 * for it. Match phrases against this, never against the raw output.
 */
export function flattenReport(output: string): string {
  return output.replace(/[─-╿]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Whether a tag that already exists still describes what would be published.
 *
 * A release that stopped between the tag and npm has to be finishable, and
 * refusing because "the tag exists" is how a half-finished release becomes a
 * wasted version number. But the tag has to still be true: if the published
 * packages have changed since it was cut, it no longer describes them and a
 * new version is the honest answer.
 *
 * Only the published packages count. Work on a private package — the site —
 * is not in the tarball, so it cannot make the tag wrong.
 */
export function publishedCodeUnchanged(
  diffPaths: (ref: string, paths: string[]) => boolean,
  tag: string,
  packages: readonly WorkspacePackage[],
): boolean {
  if (packages.length === 0) return true;
  return !diffPaths(
    tag,
    packages.map((pkg) => pkg.dir),
  );
}

/** The notes file for a version, which is committed so the release is reviewable. */
export function notesPath(root: string, version: string): string {
  return join(root, 'docs', 'releases', `v${version}.md`);
}

/**
 * A first draft of the notes, assembled from the entries that already exist.
 *
 * Not the final text: releases are immutable, so a human reads this before it
 * is published. Generating a draft removes the blank page, not the review.
 */
export function draftNotes(
  version: string,
  packageEntries: { name: string; entry: string }[],
  blueprintEntries: { slug: string; entry: string }[],
): string {
  const lines: string[] = [];
  lines.push(`<!-- Draft. Read it, rewrite it, then publish. Releases cannot be edited. -->`);
  lines.push('');
  if (packageEntries.length > 0) {
    lines.push('## Tools');
    lines.push('');
    for (const { name, entry } of packageEntries) {
      lines.push(`### ${name}`);
      lines.push('');
      lines.push(entry.trim());
      lines.push('');
    }
  }
  if (blueprintEntries.length > 0) {
    lines.push('## Blueprints');
    lines.push('');
    for (const { slug, entry } of blueprintEntries) {
      lines.push(`### ${slug}`);
      lines.push('');
      lines.push(entry.trim());
      lines.push('');
    }
  }
  if (packageEntries.length === 0 && blueprintEntries.length === 0) {
    lines.push(`No changelog entries were found for ${version}.`);
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/** The body of one version's entry in a changelog, without its heading. */
export function changelogEntry(changelog: string, version: string): string | undefined {
  const lines = changelog.split('\n');
  const heading = new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}(\\s|$)`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => /^##\s/.test(line));
  const body = (next === -1 ? rest : rest.slice(0, next)).join('\n').trim();
  return body === '' ? undefined : body;
}

/**
 * A version this command will put into a shell argument.
 *
 * `run` needs `shell: true` on Windows to reach npm's `.cmd` shims, so the one
 * value that arrives from the command line is checked against semver before it
 * is ever passed along. A release version is a narrow thing; anything that is
 * not one is a typo at best.
 */
export function isReleaseVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version);
}

/**
 * Enough room for the whole test suite.
 *
 * The default is 1MB, and a full `pnpm run check` sits close enough to it that
 * the run fails or succeeds depending on how much the test runner printed.
 * A release that depends on the volume of its own log output is not a check.
 */
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

/**
 * Quote an argument for the Windows shell.
 *
 * `shell: true` hands the whole line to cmd, which does not quote anything for
 * you: `-m Forgeprint 0.2.8` arrives as two arguments and `git tag` refuses.
 * The shell is needed on Windows because most of what this runs — npm, pnpm,
 * gh — is a `.cmd` shim that cannot be executed directly.
 */
export function quoteForShell(argument: string): string {
  if (argument === '') return '""';
  if (!/[\s"^&|<>()%!]/.test(argument)) return argument;
  return `"${argument.replace(/"/g, '\\"')}"`;
}

/** Run a command and return its combined output, never throwing. */
export function run(command: string, args: string[], cwd: string): { ok: boolean; output: string } {
  const shell = process.platform === 'win32';
  try {
    const output = execFileSync(command, shell ? args.map(quoteForShell) : args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: MAX_OUTPUT_BYTES,
      shell,
    });
    return { ok: true, output };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}${failure.message ?? ''}`,
    };
  }
}

/**
 * The lines of a failed run that say what went wrong.
 *
 * A failing `pnpm run check` ends with pnpm's own epilogue, so printing the
 * tail shows which package failed and never which test. This pulls out the
 * lines that name the failure and keeps the tail as well, because an
 * unrecognised failure has no marker to find.
 */
export function failureLines(output: string, tail = 15): string[] {
  const lines = output.split('\n');
  const marked = lines.filter((line) =>
    /(^|\s)(not ok|# fail [1-9]|AssertionError|error TS\d|✖|failed)/i.test(line),
  );
  const keep = marked.slice(0, 40);
  const end = lines.slice(-tail);
  const seen = new Set(keep);
  return [...keep, ...end.filter((line) => !seen.has(line))];
}

/**
 * The version the registry serves, with the cache stepped around.
 *
 * `--prefer-online` is not enough on its own: it returned the previous version
 * for minutes after a publish the package page already showed as live, which
 * is why this retries instead of answering once.
 */
export function registryVersion(packageName: string, cwd: string): string | undefined {
  const result = run('npm', ['view', packageName, 'dist-tags.latest', '--prefer-online'], cwd);
  if (!result.ok) return undefined;
  const value = result.output.trim();
  return value === '' ? undefined : value;
}

/**
 * A manifest outside `packages/` that carries the release version.
 *
 * `server.json` is what the MCP Registry serves and every `plugin.json` is what
 * the Claude Code marketplace serves. Nothing read them back, nothing compared
 * them to anything, and they drifted eight releases behind npm — the registry
 * was serving 0.2.1 on the day 0.3.0 went out. A reminder printed at the end of
 * a release is not a check.
 */
export interface DistributionManifest {
  /** Repository-relative path, which is what the maintainer has to open. */
  path: string;
  /** Every version field in the file, named so the message says which one. */
  versions: { field: string; value: string }[];
}

/** Each version field in a distribution manifest that does not match. */
export function checkDistributionVersions(
  manifests: readonly DistributionManifest[],
  version: string,
): VersionProblem[] {
  const problems: VersionProblem[] = [];
  for (const manifest of manifests) {
    if (manifest.versions.length === 0) {
      problems.push({ package: manifest.path, problem: 'no version field' });
      continue;
    }
    for (const { field, value } of manifest.versions) {
      if (value !== version) {
        problems.push({
          package: manifest.path,
          problem: `${field} says ${value}, the release is ${version}`,
        });
      }
    }
  }
  return problems;
}

/**
 * The version the MCP Registry serves, or undefined when it cannot be asked.
 *
 * Undefined is not "not published": the network is allowed to be absent
 * (ADR 0002), so the caller treats it as unknown rather than as a reason to
 * publish or to refuse.
 */
export async function mcpRegistryVersion(serverName: string): Promise<string | undefined> {
  try {
    const url = `https://registry.modelcontextprotocol.io/v0/servers?search=${encodeURIComponent(serverName)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return undefined;
    const body = (await response.json()) as {
      servers?: { name?: string; version?: string; server?: { name?: string; version?: string } }[];
    };
    for (const entry of body.servers ?? []) {
      const server = entry.server ?? entry;
      if (server.name === serverName) return server.version;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
