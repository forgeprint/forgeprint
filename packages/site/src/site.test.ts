import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { repoPaths } from '@forgeprint/cli';
import { makeRepo } from '@forgeprint/cli/testing';
import { loadIndex, SITE_OUTPUT_DIR } from './index.js';

describe('loadIndex', () => {
  it('reads the committed catalog index', () => {
    const index = loadIndex(makeRepo([{ slug: 'sample-api' }]));
    assert.equal(index.schema, 1);
    assert.equal(index.blueprints[0]?.slug, 'sample-api');
  });

  it('refuses a file that is not a catalog index', () => {
    const root = makeRepo();
    writeFileSync(repoPaths.index(root), '{"nope":true}\n', 'utf8');
    assert.throws(() => loadIndex(root), /forgeprint build-index/);
  });

  it('publishes into the folder GitHub Pages serves', () => {
    assert.equal(SITE_OUTPUT_DIR, 'docs');
  });
});
