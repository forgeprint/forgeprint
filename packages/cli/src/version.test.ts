import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { VERSION } from './cli.js';

describe('VERSION', () => {
  it('matches the published package version', () => {
    // `forgeprint --version` is what a bug report quotes, so it drifting from
    // the package is worse than useless. This test is the only thing that
    // keeps the two in step.
    const manifest: unknown = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    );
    assert.equal(VERSION, (manifest as { version: string }).version);
  });
});
