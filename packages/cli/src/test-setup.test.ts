import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { parseRecipe } from './recipe.js';
import { checkTools, runDirectoryName, runRecipe, satisfies } from './test-setup.js';

const directories: string[] = [];

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'forgeprint-recipe-test-'));
  directories.push(dir);
  return dir;
}

after(() => {
  for (const dir of directories) rmSync(dir, { recursive: true, force: true });
});

describe('runRecipe', () => {
  it('runs each step and its verification, in order', async () => {
    const recipe = parseRecipe(
      [
        '1. Write the marker: `echo one > one.txt`',
        '   Verify: `test -f one.txt`',
        '',
        '2. Write another: `echo two > two.txt`',
        '   Verify: `test -f two.txt`',
      ].join('\n'),
    );
    const dir = workspace();

    const result = await runRecipe(recipe.steps, { dir });

    assert.equal(result.ok, true);
    assert.equal(result.outcomes.length, 4, 'two steps, each with its verification');
    assert.ok(existsSync(join(dir, 'one.txt')));
    assert.ok(existsSync(join(dir, 'two.txt')));
  });

  it('writes a file step exactly as written', async () => {
    const recipe = parseRecipe(
      [
        '1. Create `src/app.json` with:',
        '',
        '   ```json',
        '   { "name": "app" }',
        '   ```',
        '',
        '   Verify: `test -f src/app.json`',
      ].join('\n'),
    );
    const dir = workspace();

    const result = await runRecipe(recipe.steps, { dir });

    assert.equal(result.ok, true, result.failure?.output ?? '');
    assert.equal(readFileSync(join(dir, 'src/app.json'), 'utf8'), '{ "name": "app" }\n');
  });

  it('stops at the first failing action and says which step it was', async () => {
    const recipe = parseRecipe(
      [
        '1. Fail: `exit 3`',
        '   Verify: `true`',
        '',
        '2. Never runs: `echo late > late.txt`',
        '   Verify: `test -f late.txt`',
      ].join('\n'),
    );
    const dir = workspace();

    const result = await runRecipe(recipe.steps, { dir });

    assert.equal(result.ok, false);
    assert.equal(result.failure?.step.number, 1);
    assert.equal(result.failure.phase, 'action');
    assert.equal(result.failure.exitCode, 3);
    assert.ok(!existsSync(join(dir, 'late.txt')), 'the run stopped');
  });

  it('fails a step whose verification does not hold, even though it ran', async () => {
    const recipe = parseRecipe('1. Do nothing: `true`\n   Verify: `test -f missing.txt`\n');

    const result = await runRecipe(recipe.steps, { dir: workspace() });

    assert.equal(result.ok, false);
    assert.equal(result.failure?.phase, 'verify');
  });

  it('keeps the output of a failure, which is what makes it fixable', async () => {
    const recipe = parseRecipe(
      '1. Complain: `echo something broke >&2; exit 1`\n   Verify: `true`\n',
    );

    const result = await runRecipe(recipe.steps, { dir: workspace() });

    assert.match(result.failure?.output ?? '', /something broke/);
  });

  it('refuses to write outside the working directory', async () => {
    const recipe = parseRecipe(
      [
        '1. Create `../escape.txt` with:',
        '',
        '   ```text',
        '   nope',
        '   ```',
        '',
        '   Verify: `true`',
      ].join('\n'),
    );
    const dir = workspace();

    const result = await runRecipe(recipe.steps, { dir });

    assert.equal(result.ok, false);
    assert.match(result.failure?.output ?? '', /outside the project directory/);
  });

  it('gives up on a step that hangs rather than waiting for it', async () => {
    const recipe = parseRecipe('1. Hang: `sleep 30`\n   Verify: `true`\n');

    const result = await runRecipe(recipe.steps, { dir: workspace(), timeoutMs: 500 });

    assert.equal(result.ok, false);
    assert.match(result.failure?.output ?? '', /timed out/);
  });
});

describe('checkTools', () => {
  it('accepts a tool that is installed', async () => {
    assert.deepEqual(await checkTools(['node']), []);
  });

  it('accepts a version constraint the installed tool satisfies', async () => {
    assert.deepEqual(await checkTools(['node>=18']), []);
  });

  it('refuses a tool that is not installed, naming it', async () => {
    const problems = await checkTools(['definitely-not-a-real-tool']);
    assert.equal(problems.length, 1);
    assert.match(problems[0]?.message ?? '', /not installed/);
  });

  it('refuses a version that is too old, naming the constraint', async () => {
    const problems = await checkTools(['node>=999']);
    assert.match(problems[0]?.message ?? '', />=999/);
  });
});

describe('satisfies', () => {
  it('compares part by part rather than as text', () => {
    assert.equal(satisfies('10.0.103', '>=', '10'), true);
    assert.equal(satisfies('9.0.100', '>=', '10'), false);
    // "10" sorts before "9" as text; as a version it does not.
    assert.equal(satisfies('10.0.0', '>', '9.9.9'), true);
  });

  it('handles the operators a tool requirement can use', () => {
    assert.equal(satisfies('2.1.0', '==', '2.1.0'), true);
    assert.equal(satisfies('2.1.0', '<=', '2.1.0'), true);
    assert.equal(satisfies('2.2.0', '<', '2.1.0'), false);
    assert.equal(satisfies('2.1.5', '~', '2.1.0'), true);
    assert.equal(satisfies('2.2.0', '~', '2.1.0'), false);
    assert.equal(satisfies('2.9.0', '^', '2.1.0'), true);
    assert.equal(satisfies('3.0.0', '^', '2.1.0'), false);
  });
});

describe('runDirectoryName', () => {
  it('names a run after the blueprint and its options', () => {
    assert.equal(
      runDirectoryName('dotnet-web-api', { database: 'postgres', auth: 'jwt' }),
      'forgeprint-dotnet-web-api-auth-jwt_database-postgres',
    );
  });

  it('falls back to the slug when there are no options', () => {
    assert.equal(runDirectoryName('dotnet-mcp-server', {}), 'forgeprint-dotnet-mcp-server');
  });
});
