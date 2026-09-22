import { execFileSync } from 'node:child_process';

/**
 * Selecting the blueprints a change actually affects.
 *
 * A pull request that edits the README should not spend twenty minutes
 * building containers, and a required status check that never reports blocks
 * the merge. So the workflow runs on every pull request and asks this module
 * what to run, instead of a `paths:` filter deciding whether the check exists
 * at all (see docs/repo-settings.md).
 *
 * The decision lives here rather than in the workflow because it has to be
 * reproducible on a laptop: `test-setup --changed-since main` answers the same
 * question a reviewer has (ADR 0002).
 */

/**
 * A change under the recipe runner affects every blueprint, because it changes
 * what "the recipe passed" means. Paths are repository-relative, the way `git
 * diff --name-only` prints them.
 */
const RUNNER_PATHS = ['packages/cli/'];

const BLUEPRINT_PATH = /^blueprints\/([^/]+)\//;

/**
 * The files that changed between `ref` and the working tree's commit.
 *
 * Three dots: what this branch did, not what happened on the base branch
 * meanwhile.
 */
export function changedFiles(root: string, ref: string): string[] {
  let output: string;
  try {
    output = execFileSync('git', ['diff', '--name-only', `${ref}...HEAD`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : String(error);
    throw new Error(
      `Cannot compare against "${ref}": ${detail ?? ''}\n` +
        'The reference has to exist locally; in CI that means fetching enough history.',
      { cause: error },
    );
  }
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/**
 * Which of `slugs` the changed paths affect, in catalog order.
 *
 * Deliberately blunt: a touched blueprint folder selects that blueprint, and a
 * touched runner selects all of them. Anything else — documentation, the site,
 * the MCP server — selects none, and the caller reports that rather than
 * failing.
 */
export function affectedBlueprints(changed: readonly string[], slugs: readonly string[]): string[] {
  if (changed.some((path) => RUNNER_PATHS.some((prefix) => path.startsWith(prefix)))) {
    return [...slugs];
  }
  const touched = new Set(
    changed.map((path) => BLUEPRINT_PATH.exec(path)?.[1]).filter((slug) => slug !== undefined),
  );
  return slugs.filter((slug) => touched.has(slug));
}
