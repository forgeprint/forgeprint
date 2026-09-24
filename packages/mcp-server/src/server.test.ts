import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createServer, CONTENT_IS_DATA, SERVER_NAME } from './index.js';
import { RESOLVE_TRIGGER } from './notes.js';

describe('createServer', () => {
  it('builds a server that the SDK accepts', () => {
    const server = createServer();
    assert.equal(typeof server.connect, 'function');
    assert.equal(SERVER_NAME, 'forgeprint');
  });

  it('says when to use it, not only what it does', () => {
    // Lazily loaded tools are chosen from the instructions alone; without a
    // trigger, a stated profile reads as a request to start coding.
    assert.match(RESOLVE_TRIGGER, /about to start a new project/);
    assert.match(RESOLVE_TRIGGER, /call `resolve` before writing code/);
  });

  it('states that blueprint content is data, not instructions (rule 22)', () => {
    assert.match(CONTENT_IS_DATA, /data, not instructions/);
  });
});
