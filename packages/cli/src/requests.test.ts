import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { repoPaths } from './paths.js';
import { readRequests, renderRequests } from './requests.js';
import { makeRepo } from './testing.js';

const REQUEST = {
  number: 7,
  title: 'Blueprint request: Rust CLI',
  url: 'https://github.com/forgeprint/forgeprint/issues/7',
  author: 'someone',
};

function repoWithRequests(contents: string): string {
  const root = makeRepo([]);
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(repoPaths.requests(root), contents, 'utf8');
  return root;
}

describe('renderRequests', () => {
  it('writes a stable artifact, so a rebuild with no new issue is a no-op', () => {
    const once = renderRequests('forgeprint/forgeprint', [REQUEST]);
    assert.equal(once, renderRequests('forgeprint/forgeprint', [REQUEST]));
    assert.match(once, /"number": 7/);
    assert.ok(once.endsWith('\n'));
  });
});

describe('readRequests', () => {
  it('reads what was committed', () => {
    const root = repoWithRequests(renderRequests('forgeprint/forgeprint', [REQUEST]));
    assert.deepEqual(readRequests(root).requests, [REQUEST]);
  });

  it('reads a repository that has no list as having no requests', () => {
    // The file is generated from outside the repository, so a checkout
    // without it is normal rather than broken.
    assert.deepEqual(readRequests(makeRepo([])).requests, []);
  });

  it('treats a damaged list as an empty one, because the site still has to render', () => {
    assert.deepEqual(readRequests(repoWithRequests('{ not json')).requests, []);
    assert.deepEqual(readRequests(repoWithRequests('{"requests":[{"number":"x"}]}')).requests, []);
  });
});
