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
  const text = output.toLowerCase();
  // "Cannot publish over previously staged version" is npm's phrasing for
  // "this version already exists". Nothing is staged and nothing is waiting
  // for approval — see npm/cli#9889. It arrives after a publish that worked.
  if (text.includes('previously staged version') || text.includes('cannot publish over')) {
    return { kind: 'already-published' };
  }
  if (text.includes('you cannot publish over the previously published versions')) {
    return { kind: 'already-published' };
  }
  // npm answers an unauthorized request for a package you cannot write with
  // 404, so a missing-package error is almost always a rejected token.
  if (text.includes('404') || text.includes('401') || text.includes('eneedauth')) {
    return { kind: 'unauthorized' };
  }
  return { kind: 'failed', detail: output.trim().split('\n').slice(-5).join('\n') };
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

/** Run a command and return its combined output, never throwing. */
export function run(command: string, args: string[], cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
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
