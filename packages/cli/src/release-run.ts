import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { dirname, join } from 'node:path';
import { listBlueprintSlugs } from './catalog.js';
import { repoPaths } from './paths.js';
import {
  changelogEntry,
  checkVersions,
  classifyPublishError,
  draftNotes,
  failureLines,
  isReleaseVersion,
  notesPath,
  publishable,
  publishedCodeUnchanged,
  readWorkspacePackages,
  registryVersion,
  run,
  type PublishOutcome,
  type WorkspacePackage,
} from './release.js';

/**
 * The release command, end to end.
 *
 * `release.ts` holds the decisions and is tested; this holds the order they
 * happen in and the talking to git, gh and npm. The split is deliberate: the
 * part that can be wrong quietly is the part with tests.
 */

export interface ReleaseOptions {
  version: string;
  /** Skip the workspace check; it takes minutes and CI runs it too. */
  skipCheck?: boolean;
  /** Proceed without asking. For a maintainer who has read the plan already. */
  yes?: boolean;
  /** Do not consult GitHub for the state of CI (§4: Actions is optional). */
  skipCi?: boolean;
  /** Print the plan and stop. */
  dryRun?: boolean;
  /** Wait while a workflow is still running, rather than refusing. Default on. */
  wait?: boolean;
}

const say = (line = ''): void => {
  process.stdout.write(`${line}\n`);
};

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

function fail(message: string): never {
  process.stderr.write(`error  ${message}\n`);
  process.exit(1);
}

/** The one place that knows a tree is releasable. */
function gitState(root: string): { clean: boolean; branch: string; ahead: boolean } {
  const status = run('git', ['status', '--porcelain'], root);
  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], root).output.trim();
  const ahead = run('git', ['rev-list', '--count', '@{u}..HEAD'], root);
  return {
    clean: status.ok && status.output.trim() === '',
    branch,
    ahead: !ahead.ok || ahead.output.trim() !== '0',
  };
}

/**
 * What CI says about the commit being tagged.
 *
 * A tag is protected and a release is immutable, so a tag that points at a
 * commit nobody verified is the one mistake here that cannot be taken back.
 * When `gh` is missing or Actions is off this reports "unknown" and the
 * maintainer decides — refusing to release without Actions would break §4.
 */
function ciState(root: string): { known: boolean; green: boolean; detail: string } {
  const sha = run('git', ['rev-parse', 'HEAD'], root).output.trim();
  const result = run(
    'gh',
    ['run', 'list', '--limit', '20', '--json', 'headSha,conclusion,status,workflowName'],
    root,
  );
  if (!result.ok) return { known: false, green: false, detail: 'gh could not reach GitHub' };
  let runs: { headSha: string; conclusion: string; status: string; workflowName: string }[];
  try {
    runs = JSON.parse(result.output) as typeof runs;
  } catch {
    return { known: false, green: false, detail: 'unreadable response from gh' };
  }
  const forHead = runs.filter((r) => r.headSha === sha);
  if (forHead.length === 0) {
    return { known: false, green: false, detail: `no runs recorded for ${sha.slice(0, 7)}` };
  }
  const unfinished = forHead.filter((r) => r.status !== 'completed');
  if (unfinished.length > 0) {
    return {
      known: true,
      green: false,
      detail: `still running: ${unfinished.map((r) => r.workflowName).join(', ')}`,
    };
  }
  const failed = forHead.filter((r) => r.conclusion !== 'success');
  if (failed.length > 0) {
    return {
      known: true,
      green: false,
      detail: `failed: ${failed.map((r) => r.workflowName).join(', ')}`,
    };
  }
  return {
    known: true,
    green: true,
    detail: forHead.map((r) => r.workflowName).join(', '),
  };
}

/** How often to ask GitHub again while a workflow is still running. */
const CI_POLL_SECONDS = 30;

/** Longer than the matrix takes, short enough that a stuck run is not forever. */
const CI_WAIT_MINUTES = 45;

/**
 * How long to keep asking the registry after a publish.
 *
 * Six attempts thirty seconds apart is two and a half minutes. 0.3.0 took
 * ninety seconds to become visible, and the previous version of this loop —
 * five attempts with no wait at all — would have called that a failed publish.
 */
const REGISTRY_ATTEMPTS = 6;
const REGISTRY_POLL_SECONDS = 30;

/**
 * The outcomes worth waiting on. A rejected token, a stage-only token and a
 * 2FA challenge nobody can answer all mean the registry never received the
 * package, so re-asking it only delays the answer.
 */
const CAN_STILL_LAND: ReadonlySet<PublishOutcome['kind']> = new Set([
  'published',
  'already-published',
  'failed',
]);

/**
 * Wait for CI rather than making the maintainer poll it.
 *
 * "Still running" is not "failed", and the difference was being paid for by
 * hand: run the command, read that setup-test is in progress, wait, run it
 * again. The matrix takes around ten minutes, which is exactly long enough to
 * go and do something else and exactly short enough that starting over is
 * wasteful.
 */
async function waitForCi(
  root: string,
  wait: boolean,
): Promise<{ known: boolean; green: boolean; detail: string }> {
  const deadline = Date.now() + CI_WAIT_MINUTES * 60_000;
  let announced = false;
  for (;;) {
    const state = ciState(root);
    if (!state.known || state.green || !wait) return state;
    if (!state.detail.startsWith('still running')) return state;
    if (Date.now() > deadline) {
      return {
        known: true,
        green: false,
        detail: `${state.detail}, and ${String(CI_WAIT_MINUTES)} minutes is long enough to stop waiting`,
      };
    }
    if (!announced) {
      say(`  waiting for CI (${state.detail}); --no-wait to stop doing this`);
      announced = true;
    }
    await new Promise((resolve) => setTimeout(resolve, CI_POLL_SECONDS * 1000));
  }
}

/**
 * Publish one package and then ask the registry what actually happened.
 *
 * The exit code is not the answer. A publish that succeeded can still report
 * a 409 from a retry, and the registry serves the previous version for a while
 * after it has accepted a new one, so this asks more than once before it
 * believes the bad news.
 */
async function publishOne(
  pkg: WorkspacePackage,
  root: string,
  version: string,
): Promise<PublishOutcome> {
  const before = registryVersion(pkg.name, root);
  if (before === version) return { kind: 'already-published' };

  say(`  publishing ${pkg.name}@${version}`);
  const result = run('pnpm', ['publish', '--filter', pkg.name, '--access', 'public'], root);
  const outcome = result.ok
    ? ({ kind: 'published' } as const)
    : classifyPublishError(result.output);

  // A refusal is a refusal. Waiting on the registry for something it was never
  // sent turns a clear diagnosis into a two-minute pause before the same one.
  if (!CAN_STILL_LAND.has(outcome.kind)) return outcome;

  // Whatever it said, the registry decides. 0.3.0 reported success and then
  // served 404 for that version for about ninety seconds, so this waits
  // between attempts rather than asking five times in as many seconds.
  for (let attempt = 0; attempt < REGISTRY_ATTEMPTS; attempt += 1) {
    if (registryVersion(pkg.name, root) === version) {
      return outcome.kind === 'published' ? { kind: 'published' } : { kind: 'already-published' };
    }
    if (attempt < REGISTRY_ATTEMPTS - 1) {
      run('npm', ['cache', 'clean', '--force'], root);
      if (attempt === 0) say('  note   published; waiting for the registry to serve it');
      await new Promise((resolve) => setTimeout(resolve, REGISTRY_POLL_SECONDS * 1000));
    }
  }
  if (outcome.kind === 'published') {
    return {
      kind: 'failed',
      detail: 'publish reported success, but the registry does not serve it',
    };
  }
  return outcome;
}

function readChangelog(dir: string): string | undefined {
  const file = join(dir, 'CHANGELOG.md');
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export async function release(root: string, options: ReleaseOptions): Promise<void> {
  const { version } = options;
  if (!isReleaseVersion(version)) fail(`not a release version: ${version}`);

  const tag = `v${version}`;
  const packages = publishable(readWorkspacePackages(root));
  if (packages.length === 0) fail('no publishable packages found under packages/');

  say(`Forgeprint ${version}`);
  say();

  // 1. The repository is in a state that can be released.
  const git = gitState(root);
  if (!git.clean) fail('the working tree has uncommitted changes');
  if (git.ahead) fail('HEAD is not pushed; the tag would point at a commit nobody else has');
  if (git.branch !== 'main') {
    say(`  note   releasing from ${git.branch}, not main`);
  }
  // An existing tag is not automatically a problem: a release that stopped
  // between tagging and npm has to be finishable, and refusing here is how a
  // half-finished release costs a version number. What matters is whether the
  // tag still describes the code that would be published.
  const tagExists = run('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], root).ok;
  if (tagExists) {
    const unchanged = publishedCodeUnchanged(
      (ref, paths) => !run('git', ['diff', '--quiet', `${ref}..HEAD`, '--', ...paths], root).ok,
      tag,
      packages,
    );
    if (!unchanged) {
      fail(
        `${tag} already exists, and the published packages have changed since it was cut. ` +
          'It no longer describes what would go to npm — bump the version instead.',
      );
    }
    const at = run('git', ['rev-parse', '--short', tag], root).output.trim();
    say(`  note   ${tag} already exists (${at}); nothing published has changed since`);
  }

  // 2. The versions and changelogs agree with what is being released.
  const problems = checkVersions(packages, version, (p) => readChangelog(p.dir));
  if (problems.length > 0) {
    for (const p of problems) process.stderr.write(`error  ${p.package}: ${p.problem}\n`);
    fail('fix the versions and changelogs first');
  }
  say(`  ok     ${packages.length} package(s) at ${version}, each with a changelog entry`);

  // 3. The notes exist and a human has seen them.
  const notes = notesPath(root, version);
  if (!existsSync(notes)) {
    const packageEntries = packages
      .map((p) => ({ name: p.name, entry: changelogEntry(readChangelog(p.dir) ?? '', version) }))
      .filter((e): e is { name: string; entry: string } => e.entry !== undefined);
    const blueprintEntries = listBlueprintSlugs(root)
      .map((slug) => ({
        slug,
        entry: changelogEntry(
          readChangelog(join(repoPaths.blueprintsDir(root), slug)) ?? '',
          version,
        ),
      }))
      .filter((e): e is { slug: string; entry: string } => e.entry !== undefined);
    mkdirSync(join(root, 'docs', 'releases'), { recursive: true });
    writeFileSync(notes, draftNotes(version, packageEntries, blueprintEntries), 'utf8');
    say();
    say(`  wrote a draft of the release notes to ${notes}`);
    say('  Read it, rewrite it, commit it, and run this again. A release cannot be edited.');
    return;
  }

  // 4. CI has verified this commit.
  const ci = options.skipCi
    ? { known: false, green: false, detail: 'not checked' }
    : await waitForCi(root, options.wait !== false);
  if (ci.known && !ci.green) fail(`CI is not green on HEAD — ${ci.detail}`);
  say(
    ci.known
      ? `  ok     CI green on HEAD (${ci.detail})`
      : `  note   CI state unknown (${ci.detail}); releasing on your own verification`,
  );

  // 5. The workspace itself.
  if (!options.skipCheck) {
    say('  running pnpm run check');
    const check = run('pnpm', ['run', 'check'], root);
    if (!check.ok) {
      const log = join(root, 'docs', 'releases', `.check-${version}.log`);
      mkdirSync(dirname(log), { recursive: true });
      writeFileSync(log, check.output, 'utf8');
      for (const line of failureLines(check.output)) process.stderr.write(`${line}\n`);
      fail(`pnpm run check failed; the whole output is in ${log}`);
    }
    say('  ok     check passed');
  }

  // 6. What is left to do, stated before anything irreversible happens.
  const pending = packages.filter((p) => registryVersion(p.name, root) !== version);
  say();
  say('Plan');
  say(`  tag      ${tag} -> ${run('git', ['rev-parse', '--short', 'HEAD'], root).output.trim()}`);
  say(`  release  ${tag} from ${notes}`);
  say(
    pending.length === 0
      ? '  npm      nothing to publish; the registry already serves every package'
      : `  npm      ${pending.map((p) => p.name).join(', ')}`,
  );
  say();
  if (options.dryRun) return;
  if (!options.yes && !(await confirm('The tag and the release cannot be undone. Continue?'))) {
    say('stopped');
    return;
  }

  // 7. Do it, one step at a time, saying which step failed if one does.
  const notesBody = readFileSync(notes, 'utf8');
  if (tagExists) {
    say(`  ok     ${tag} was already tagged`);
  } else {
    // Print what the command said. "could not create v0.2.8" sent the
    // maintainer looking for a tag that already existed, when the real answer
    // was in the output being thrown away.
    const created = run('git', ['tag', '-a', tag, '-m', `Forgeprint ${version}`], root);
    if (!created.ok)
      fail(`could not create ${tag}:
${created.output.trim()}`);
  }
  // Pushed whether or not it was just created: a tag can exist locally and not
  // on the remote, which is exactly what a run that died between the two
  // leaves behind.
  const pushed = run('git', ['push', 'origin', tag], root);
  if (!pushed.ok && !/already exists|up to date/i.test(pushed.output))
    fail(`could not push ${tag}:
${pushed.output.trim()}`);
  say(`  ok     ${tag} is on the remote`);

  if (run('gh', ['release', 'view', tag], root).ok) {
    say(`  note   a release for ${tag} already exists; leaving it alone`);
  } else {
    const created = run(
      'gh',
      ['release', 'create', tag, '--title', `Forgeprint ${version}`, '--notes-file', notes],
      root,
    );
    if (!created.ok) {
      process.stderr.write(`${created.output}\n`);
      fail(`the tag is pushed but the release was not created; notes are in ${notes}`);
    }
    say(`  ok     release created (${notesBody.split('\n').length} lines of notes)`);
  }

  for (const pkg of pending) {
    const outcome = await publishOne(pkg, root, version);
    switch (outcome.kind) {
      case 'published':
        say(`  ok     ${pkg.name}@${version} published`);
        break;
      case 'already-published':
        say(`  ok     ${pkg.name}@${version} was already on the registry`);
        break;
      case 'unauthorized':
        fail(
          `npm rejected your credentials while publishing ${pkg.name}. ` +
            'Run `npm whoami`; a 401 there means log in again. ' +
            'The tag and release are done — rerun this command afterwards to finish.',
        );
        break;
      case 'stage-only':
        fail(
          `npm refused to publish ${pkg.name}: your token can only stage (403 E_STAGE_REQUIRED).\n` +
            'Nothing on this machine can tell a stage-only token from a working one — ' +
            '`npm whoami` and `npm token list` report the same thing for both, ' +
            'so this 403 is the first place the difference shows.\n' +
            'Generate a granular access token with "Read and write" — the option with ' +
            'nothing in parentheses — and leave "Bypass two-factor authentication" unchecked. ' +
            'See docs/releasing.md §7.\n' +
            'The tag and release are done. Swap the token and rerun; published packages are skipped.',
        );
        break;
      case 'needs-interactive':
        fail(
          `npm asked ${pkg.name} for a browser 2FA challenge, which cannot happen inside this command.\n` +
            'Your token is fine; it just is not a bypass-2FA token, and this runs pnpm as a subprocess.\n' +
            `Publish it by hand: pnpm publish --filter ${pkg.name} --access public\n` +
            'The tag and release are done. Do that for each remaining package, then rerun to verify.',
        );
        break;
      case 'failed':
        fail(
          `${pkg.name} did not publish: ${outcome.detail}\n` +
            'The tag and release are done. Fix this and rerun; published packages are skipped.',
        );
    }
  }

  say();
  say('Released. What is left is outside this command:');
  say('  mcp-publisher publish server.json     (the MCP registry reads the npm package)');
  say('  docs/dogfood.md                       (if a first-time user would notice this release)');
}
