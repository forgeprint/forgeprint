import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { landingCounts, LANDING_FILES, staleLandingFiles, statusNumbers } from './landing.js';
import type { IndexWithUnits } from './units.js';

const index = {
  blueprints: [{ slug: 'a' }, { slug: 'b' }, { slug: 'gone', deprecated: true }],
  experts: [{ slug: 'e' }],
  crews: [],
  integrations: [{ slug: 'i' }, { slug: 'j' }],
  agents: [{ id: 'claude-code' }, { id: 'codex' }],
} as unknown as IndexWithUnits;

/** A docs/ tree with one status line per landing file, worded as each one words it. */
function makeDocs(numbers: readonly number[]): string {
  const root = mkdtempSync(join(tmpdir(), 'forgeprint-landing-'));
  const [b, e, c, i, a] = numbers;
  mkdirSync(join(root, 'docs', 'i18n'), { recursive: true });
  writeFileSync(
    join(root, 'docs', 'index.html'),
    `<p><span id="status"\n        >Pre-release · ${b} blueprints · ${e} experts · ${c} crews · ${i} integrations · ${a} agents</span\n      ></p>\n`,
    'utf8',
  );
  for (const [file, word] of [
    ['en.json', 'blueprints'],
    ['tr.json', 'blueprint'],
  ] as const) {
    writeFileSync(
      join(root, 'docs', 'i18n', file),
      `{\n  "status": "Pre-release · ${b} ${word} · ${e} expert · ${c} crew · ${i} integration · ${a} agent",\n  "statusLive": "Pre-release · {b} · {e} · {c} · {i} · {a}"\n}\n`,
      'utf8',
    );
  }
  return root;
}

describe('landingCounts', () => {
  it('counts what the page claims, in the order it claims it', () => {
    assert.deepEqual(landingCounts(index), [2, 1, 0, 2, 2]);
  });

  it("leaves out a deprecated entry, as the page's own script does", () => {
    assert.equal(landingCounts(index)[0], 2);
  });
});

describe('statusNumbers', () => {
  it('ignores the placeholders in statusLive, which carry no numbers', () => {
    assert.deepEqual(statusNumbers('i18n/en.json', '{"statusLive": "{b} · {e}"}'), undefined);
  });

  it('is undefined when the status line has gone', () => {
    assert.equal(statusNumbers('index.html', '<p>nothing here</p>'), undefined);
  });
});

describe('staleLandingFiles', () => {
  it('passes every file whose counts agree, in HTML and in each translation', () => {
    assert.deepEqual(staleLandingFiles(makeDocs([2, 1, 0, 2, 2]), index), []);
  });

  it('names every file whose counts disagree — which is how 17 became 45', () => {
    assert.deepEqual(staleLandingFiles(makeDocs([17, 8, 2, 10, 9]), index), [...LANDING_FILES]);
  });

  it('names a file that is missing, rather than passing it', () => {
    const root = mkdtempSync(join(tmpdir(), 'forgeprint-landing-'));
    assert.deepEqual(staleLandingFiles(root, index), [...LANDING_FILES]);
  });
});
