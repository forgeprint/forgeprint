import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { affectedBlueprints, changedFiles } from './changed.js';

const SLUGS = ['a-api', 'b-api', 'c-api'];

describe('affectedBlueprints', () => {
  it('selects a blueprint whose folder changed', () => {
    assert.deepEqual(affectedBlueprints(['blueprints/b-api/setup.md'], SLUGS), ['b-api']);
  });

  it('selects every blueprint when the recipe runner changed', () => {
    // A change to test-setup itself changes what "the recipe passed" means.
    assert.deepEqual(affectedBlueprints(['packages/cli/src/test-setup.ts'], SLUGS), SLUGS);
  });

  it('selects none for a change that cannot affect a recipe', () => {
    assert.deepEqual(affectedBlueprints(['README.md', 'docs/index.json'], SLUGS), []);
  });

  it('ignores a folder that is not in the catalog, such as a deleted blueprint', () => {
    assert.deepEqual(affectedBlueprints(['blueprints/gone-api/setup.md'], SLUGS), []);
  });

  it('keeps catalog order rather than the order git printed', () => {
    assert.deepEqual(
      affectedBlueprints(['blueprints/c-api/AGENTS.md', 'blueprints/a-api/setup.md'], SLUGS),
      ['a-api', 'c-api'],
    );
  });
});

const repositories: string[] = [];

after(() => {
  for (const dir of repositories) rmSync(dir, { recursive: true, force: true });
});

/** A repository with one commit on `main` and one on a branch above it. */
function repoWithBranch(files: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'forgeprint-changed-'));
  repositories.push(dir);
  const git = (...args: string[]): void => {
    execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  };
  const write = (path: string, contents: string): void => {
    mkdirSync(join(dir, dirname(path)), { recursive: true });
    writeFileSync(join(dir, path), contents, 'utf8');
  };

  git('init', '--initial-branch=main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  write('README.md', 'before\n');
  git('add', '--all');
  git('commit', '--message', 'first');

  git('checkout', '-b', 'topic');
  for (const file of files) write(file, 'after\n');
  git('add', '--all');
  git('commit', '--message', 'second');
  return dir;
}

describe('changedFiles', () => {
  it('lists what the branch changed', () => {
    const dir = repoWithBranch(['blueprints/b-api/setup.md', 'docs/index.json']);
    assert.deepEqual(changedFiles(dir, 'main').sort(), [
      'blueprints/b-api/setup.md',
      'docs/index.json',
    ]);
  });

  it('says what to do when the reference is not there', () => {
    const dir = repoWithBranch(['README.md']);
    assert.throws(() => changedFiles(dir, 'origin/nowhere'), /Cannot compare against/);
  });
});
