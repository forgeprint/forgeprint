import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { fetchText } from './catalog.js';

describe('fetchText', () => {
  let server: Server;
  let url = '';

  before(async () => {
    // A server that accepts the request and never answers: what a stalled
    // network looks like to the caller.
    server = createServer(() => {});
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/index.json`;
  });

  after(() => {
    server.closeAllConnections();
    server.close();
  });

  it('gives up on a server that never answers, instead of hanging the tool', async () => {
    const started = Date.now();
    await assert.rejects(fetchText(url, 200));
    assert.ok(Date.now() - started < 5_000);
  });
});
