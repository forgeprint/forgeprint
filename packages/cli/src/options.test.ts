import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { manifestSchema } from './manifest.js';
import {
  checkOptions,
  missingOptions,
  resolveSetupOptions,
  UnknownOptionError,
} from './options.js';
import { parseTaxonomy } from './taxonomy.js';
import { TEST_TAXONOMY, validManifest } from './testing.js';

const taxonomy = parseTaxonomy(TEST_TAXONOMY);
const manifest = manifestSchema(taxonomy).parse(
  validManifest({ options: { database: ['postgres', 'sqlserver'], auth: ['jwt', 'oidc'] } }),
);

const SETUP = [
  '1. Create it: `a`',
  '   Verify: `b`',
  '',
  '<!-- if options.database == postgres -->',
  '',
  '2. Postgres: `add npgsql`',
  '   Verify: `build`',
  '',
  '<!-- endif -->',
  '',
  '<!-- if options.database == sqlserver -->',
  '',
  '2. SQL Server: `add sqlserver`',
  '   Verify: `build`',
  '',
  '<!-- endif -->',
  '',
  '3. Done: `test`',
  '   Verify: `test`',
].join('\n');

describe('resolveSetupOptions', () => {
  it('keeps the chosen branch and drops the others', () => {
    const { markdown } = resolveSetupOptions(SETUP, { database: 'postgres' });
    assert.match(markdown, /add npgsql/);
    assert.doesNotMatch(markdown, /add sqlserver/);
  });

  it('removes the guard comments of a resolved field', () => {
    const { markdown } = resolveSetupOptions(SETUP, { database: 'sqlserver' });
    assert.doesNotMatch(markdown, /<!-- if/);
    assert.doesNotMatch(markdown, /<!-- endif/);
  });

  it('keeps the unguarded steps either way', () => {
    for (const database of ['postgres', 'sqlserver']) {
      const { markdown } = resolveSetupOptions(SETUP, { database });
      assert.match(markdown, /1\. Create it/);
      assert.match(markdown, /3\. Done/);
    }
  });

  it('leaves a guard whose field was not chosen, and reports it', () => {
    const { markdown, unresolved } = resolveSetupOptions(SETUP, {});
    assert.deepEqual(unresolved, ['database']);
    assert.match(markdown, /add npgsql/);
    assert.match(markdown, /add sqlserver/);
    assert.match(markdown, /<!-- if options\.database == postgres -->/);
  });

  it('does not read a guard written inside a code block', () => {
    const source = [
      '1. Write the docs `guide.md`:',
      '',
      '   ```markdown',
      '   <!-- if options.database == postgres -->',
      '   documented example',
      '   <!-- endif -->',
      '   ```',
      '',
      '   Verify: `test -f guide.md`',
    ].join('\n');
    const { markdown, unresolved } = resolveSetupOptions(source, { database: 'sqlserver' });
    assert.match(markdown, /documented example/);
    assert.deepEqual(unresolved, []);
  });

  it('does not leave a run of blank lines where a branch was', () => {
    const { markdown } = resolveSetupOptions(SETUP, { database: 'postgres' });
    assert.doesNotMatch(markdown, /\n\n\n/);
  });

  it('keeps the blank lines inside a code block, which are the file', () => {
    // ruff and PEP 8 want two blank lines between top-level definitions; a
    // file written by a recipe step must come out as it was written.
    const recipe = [
      '1. Write it:',
      '',
      '   ```python',
      '   import os',
      '',
      '',
      '   def main():',
      '       pass',
      '   ```',
      '',
      '   Verify: `python app.py`',
    ].join('\n');
    const { markdown } = resolveSetupOptions(recipe, { database: 'postgres' });
    assert.equal(markdown, recipe);
  });

  it('is a no-op on a recipe with no guards', () => {
    const plain = '1. One: `a`\n   Verify: `b`';
    assert.equal(resolveSetupOptions(plain, { database: 'postgres' }).markdown, plain);
  });
});

describe('checkOptions', () => {
  it('accepts a declared field and value', () => {
    assert.doesNotThrow(() => {
      checkOptions(manifest, { database: 'postgres', auth: 'jwt' });
    });
  });

  it('refuses a field the blueprint does not declare', () => {
    assert.throws(() => {
      checkOptions(manifest, { cache: 'redis' });
    }, UnknownOptionError);
  });

  it('refuses a value the field does not declare, and lists the real ones', () => {
    assert.throws(() => {
      checkOptions(manifest, { database: 'mysql' });
    }, /postgres, sqlserver/);
  });

  it('says so when the blueprint has no options at all', () => {
    const plain = manifestSchema(taxonomy).parse(validManifest());
    assert.throws(() => {
      checkOptions(plain, { database: 'postgres' });
    }, /declares no options/);
  });
});

describe('missingOptions', () => {
  it('lists the fields still to be chosen, with their values', () => {
    assert.deepEqual(missingOptions(manifest, { database: 'postgres' }), [
      { field: 'auth', values: ['jwt', 'oidc'] },
    ]);
  });

  it('is empty once everything is chosen', () => {
    assert.deepEqual(missingOptions(manifest, { database: 'postgres', auth: 'oidc' }), []);
  });
});
