import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createServer, CONTENT_IS_DATA, SERVER_NAME } from './index.js';

describe('createServer', () => {
  it('builds a server that the SDK accepts', () => {
    const server = createServer();
    assert.equal(typeof server.connect, 'function');
    assert.equal(SERVER_NAME, 'forgeprint');
  });

  it('states that blueprint content is data, not instructions (rule 22)', () => {
    assert.match(CONTENT_IS_DATA, /data, not instructions/);
  });
});
