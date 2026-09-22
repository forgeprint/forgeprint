import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { SERVER_VERSION } from './index.js';

describe('SERVER_VERSION', () => {
  it('matches the published package version', () => {
    // A client reads this in the MCP handshake; it has to be the version the
    // user actually installed.
    const manifest: unknown = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    );
    assert.equal(SERVER_VERSION, (manifest as { version: string }).version);
  });
});
