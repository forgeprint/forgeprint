import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseRecipe } from './recipe.js';

const RECIPE = [
  '# Setup',
  '',
  'Some prose that is not a step.',
  '',
  '1. Create the project: `dotnet new webapi -o src/Api`',
  '   Verify: `dotnet build src/Api`',
  '',
  '2. Create `src/Api/appsettings.json` with:',
  '',
  '   ```json',
  '   {',
  '     "Logging": { "LogLevel": { "Default": "Information" } }',
  '   }',
  '   ```',
  '',
  '   Verify: `test -f src/Api/appsettings.json`',
  '',
  '## After setup',
  '',
  'Read `AGENTS.md` before changing anything.',
].join('\n');

describe('parseRecipe', () => {
  it('reads a command step', () => {
    const { steps, problems } = parseRecipe(RECIPE);
    assert.deepEqual(problems, []);
    const first = steps[0];
    assert.ok(first !== undefined);
    assert.equal(first.number, 1);
    assert.deepEqual(first.action, { kind: 'run', command: 'dotnet new webapi -o src/Api' });
    assert.equal(first.verify, 'dotnet build src/Api');
  });

  it('reads a file step, dedented, with a trailing newline', () => {
    const second = parseRecipe(RECIPE).steps[1];
    assert.ok(second !== undefined);
    assert.equal(second.action.kind, 'write');
    assert.equal(second.action.path, 'src/Api/appsettings.json');
    assert.equal(
      second.action.contents,
      '{\n  "Logging": { "LogLevel": { "Default": "Information" } }\n}\n',
    );
  });

  it('stops at a heading, so the prose after a recipe is not a step', () => {
    const { steps } = parseRecipe(RECIPE);
    assert.equal(steps.length, 2);
    // Without this, the last step would swallow "Read `AGENTS.md`" and try to
    // run it as a command.
    assert.equal(steps[1]?.verify, 'test -f src/Api/appsettings.json');
  });

  it('takes the last code span as the command, so a step may name other things', () => {
    const source =
      '1. Replace the `Microsoft.OpenApi` dependency: `dotnet add package X --version 1.0.0`\n' +
      '   Verify: `dotnet build`\n';
    assert.deepEqual(parseRecipe(source).steps[0]?.action, {
      kind: 'run',
      command: 'dotnet add package X --version 1.0.0',
    });
  });

  it('refuses a recipe with an unresolved option guard', () => {
    const source =
      '<!-- if options.database == postgres -->\n\n1. One: `a`\n   Verify: `b`\n\n<!-- endif -->\n';
    assert.match(parseRecipe(source).problems[0]?.message ?? '', /resolve the options first/);
  });

  it('refuses a step with no verification', () => {
    assert.match(parseRecipe('1. One: `a`\n').problems[0]?.message ?? '', /Verify/);
  });

  it('refuses a step with no command', () => {
    assert.match(
      parseRecipe('1. Install the packages.\n   Verify: `dotnet build`\n').problems[0]?.message ??
        '',
      /states no command/,
    );
  });

  it('refuses a file step that does not name the file', () => {
    const source = [
      '1. Write it:',
      '',
      '   ```json',
      '   {}',
      '   ```',
      '',
      '   Verify: `ls`',
    ].join('\n');
    assert.match(parseRecipe(source).problems[0]?.message ?? '', /does not name it/);
  });

  it('says so when there are no steps at all', () => {
    assert.match(
      parseRecipe('# Setup\n\nJust do the usual.\n').problems[0]?.message ?? '',
      /no numbered steps/,
    );
  });
});
