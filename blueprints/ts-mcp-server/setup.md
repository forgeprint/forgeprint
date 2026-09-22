# Setup

Creates an MCP server in TypeScript on the official SDK, with one working tool,
tests that speak the protocol, and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires Node.js 20 or newer.

1. Create `package.json` with:

   ```json
   {
     "name": "mcp-server",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "bin": { "mcp-server": "dist/bin.js" },
     "files": ["dist"],
     "engines": { "node": ">=20.0.0" },
     "scripts": {
       "build": "tsc --build",
       "test": "npm run build && node --test \"dist/**/*.test.js\"",
       "start": "node dist/bin.js"
     },
     "dependencies": {
       "@modelcontextprotocol/sdk": "1.30.0",
       "zod": "4.6.5"
     },
     "devDependencies": {
       "@types/node": "26.6.2",
       "typescript": "6.0.3"
     }
   }
   ```

   Verify: `node -e "JSON.parse(require('node:fs').readFileSync('package.json'))"`

2. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "ES2023",
       "lib": ["ES2023"],
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "types": ["node"],

       "strict": true,
       "noUncheckedIndexedAccess": true,
       "verbatimModuleSyntax": true,
       "isolatedModules": true,

       "rootDir": "src",
       "outDir": "dist",
       "declaration": true,
       "sourceMap": true,
       "skipLibCheck": true
     },
     "include": ["src/**/*.ts"]
   }
   ```

   Verify: `test -f tsconfig.json`

3. Install the pinned dependencies: `npm install`
   Verify: `test -d node_modules/@modelcontextprotocol/sdk`

4. Create `src/server.ts` with:

   ```typescript
   import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   import { z } from 'zod';

   export const SERVER_NAME = 'mcp-server';
   // Keep this equal to the version in package.json: it is what a client reads
   // in the handshake, and a bug report quotes. Nothing enforces it, so a test
   // that asserts the two match is worth writing the day it first matters.
   export const SERVER_VERSION = '0.1.0';

   /**
    * Build the server.
    *
    * Separate from the transport on purpose: this function is what the tests
    * drive, and the entry point only decides how bytes reach it.
    */
   export function createServer(): McpServer {
     const server = new McpServer(
       { name: SERVER_NAME, version: SERVER_VERSION },
       {
         instructions:
           'A starting point. Replace `echo` with tools that do something, and keep each one narrow enough to describe in a sentence.',
       },
     );

     server.registerTool(
       'echo',
       {
         title: 'Echo a message',
         description:
           'Return the message it was given. It exists to prove the wiring, and to be deleted.',
         inputSchema: {
           message: z.string().min(1).describe('Text to send back unchanged.'),
         },
       },
       ({ message }) => ({
         content: [{ type: 'text', text: message }],
       }),
     );

     return server;
   }
   ```

   Verify: `test -f src/server.ts`

<!-- if options.transport == stdio -->

5. Create `src/bin.ts` with:

   ```typescript
   #!/usr/bin/env node
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
   import { createServer } from './server.js';

   // stdout carries the protocol, so nothing else may be written to it. A stray
   // console.log here is a malformed message to the client.
   await createServer().connect(new StdioServerTransport());
   ```

   Verify: `test -f src/bin.ts`

<!-- endif -->

<!-- if options.transport == http -->

5. Create `src/bin.ts` with:

   ```typescript
   #!/usr/bin/env node
   import { createServer as createHttpServer } from 'node:http';
   import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
   import { createServer } from './server.js';

   // Stateless: every request carries everything it needs, so the process can be
   // restarted or replicated without a client noticing.
   const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
   await createServer().connect(transport);

   // A browser can be made to resolve an attacker's domain to 127.0.0.1 and
   // then post to this port as same-origin — DNS rebinding, which the MCP
   // specification names as the way an insecure local server is reached. A
   // browser always sends Origin on a cross-site request, and no MCP client
   // sends one at all, so refusing anything unexpected costs nothing and
   // closes the hole.
   const ALLOWED_ORIGINS = new Set(
     (process.env['ALLOWED_ORIGINS'] ?? '')
       .split(',')
       .map((value) => value.trim())
       .filter(Boolean),
   );

   const http = createHttpServer((request, response) => {
     const origin = request.headers.origin;
     if (origin !== undefined && !ALLOWED_ORIGINS.has(origin)) {
       response.writeHead(403).end('Origin not allowed');
       return;
     }
     void transport.handleRequest(request, response);
   });

   // Port 0 asks the operating system for a free one, which is what makes this
   // safe to start on a machine that is already running something.
   const port = Number(process.env['PORT'] ?? 0);
   http.listen(port, '127.0.0.1', () => {
     const address = http.address();
     const chosen = typeof address === 'object' && address !== null ? address.port : port;
     // stderr, not stdout: the protocol owns stdout.
     console.error(`listening on http://127.0.0.1:${String(chosen)}`);
   });
   ```

   Verify: `test -f src/bin.ts`

<!-- endif -->

6. Create `src/server.test.ts` with:

   ```typescript
   import assert from 'node:assert/strict';
   import { after, before, describe, it } from 'node:test';
   import { Client } from '@modelcontextprotocol/sdk/client/index.js';
   import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
   import { createServer } from './server.js';

   const client = new Client({ name: 'tests', version: '1.0.0' });

   before(async () => {
     const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
     await createServer().connect(serverTransport);
     await client.connect(clientTransport);
   });

   after(async () => {
     await client.close();
   });

   describe('the server', () => {
     it('lists the tools it registered', async () => {
       const { tools } = await client.listTools();
       assert.deepEqual(
         tools.map((tool) => tool.name),
         ['echo'],
       );
     });

     it('answers a tool call', async () => {
       const result = await client.callTool({ name: 'echo', arguments: { message: 'hello' } });
       const content = result.content as { type: string; text: string }[];
       assert.equal(content[0]?.text, 'hello');
     });

     it('refuses an argument the schema does not allow', async () => {
       const result = await client.callTool({ name: 'echo', arguments: { message: '' } });
       assert.equal(result.isError, true);
     });
   });
   ```

   Verify: `test -f src/server.test.ts`

7. Create `.gitignore` with:

   ```gitignore
   node_modules/
   dist/
   *.tsbuildinfo
   ```

   Verify: `test -f .gitignore`

8. Create `.github/workflows/ci.yml` with:

   ```yaml
   name: ci

   on:
     push:
       branches: [main]
     pull_request:

   permissions:
     contents: read

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
         - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
           with:
             node-version: 22
         - run: npm ci
         - run: npm test
   ```

   Verify: `test -f .github/workflows/ci.yml`

9. Build it: `npm run build`
   Verify: `test -f dist/server.js`

10. Run the tests: `npm test`
    Verify: `npm test`

<!-- if options.transport == stdio -->

11. Create `scripts/probe.mjs` with:

    ```javascript
    // Speaks MCP to the built server over stdio, the way a client will.
    //
    // The tests drive `createServer` in memory, which proves the tools. This
    // proves the executable: that `node dist/bin.js` starts, completes the
    // handshake and answers — the part a wrong entry point, or anything written
    // to stdout, would break.
    import { Client } from '@modelcontextprotocol/sdk/client/index.js';
    import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

    const [command, ...args] = process.argv.slice(2);
    if (command === undefined) {
      console.error('usage: node scripts/probe.mjs <command> [args...]');
      process.exit(2);
    }

    const client = new Client({ name: 'probe', version: '1.0.0' });
    await client.connect(new StdioClientTransport({ command, args }));

    const { tools } = await client.listTools();
    if (tools.length === 0) throw new Error('the server registered no tools');

    const result = await client.callTool({ name: 'echo', arguments: { message: 'ping' } });
    const text = result.content?.[0]?.text;
    if (text !== 'ping') throw new Error(`echo returned ${JSON.stringify(text)}`);

    await client.close();
    console.log(
      `ok  ${String(tools.length)} tool(s): ${tools.map((tool) => tool.name).join(', ')}`,
    );
    ```

    Verify: `test -f scripts/probe.mjs`

12. Speak MCP to the built executable and confirm it answers: `node scripts/probe.mjs node dist/bin.js`
    Verify: `node scripts/probe.mjs node dist/bin.js`

<!-- endif -->

<!-- if options.transport == http -->

11. Start the built server on a port the operating system chooses, and keep its process id. A fixed port can already be taken, and then the check either fails or — worse — answers from somebody else's server: `node dist/bin.js > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

12. Read the address it chose out of its own log: `for attempt in $(seq 60); do grep -oE "http://127\.0\.0\.1:[0-9]+" server.log | head -1 > server.url && test -s server.url && break; sleep 1; done`
    Verify: `test -s server.url`

13. Ask it to initialize, and keep the answer: `curl -fsS -o initialize.json -X POST "$(cat server.url)/" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1.0.0"}}}'`
    Verify: `grep -q protocolVersion initialize.json`

14. Confirm a request claiming to come from a web page is refused. This is the check that proves the rebinding guard, and it fails loudly if somebody removes it: `curl -sS -o rejected.txt -w "%{http_code}" -X POST "$(cat server.url)/" -H "Origin: https://example.com" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' > rejected.code`
    Verify: `grep -q 403 rejected.code`

15. Stop the server: `kill "$(cat server.pid)"`
    Verify: `test -f server.pid`

<!-- endif -->

## After setup

- `echo` exists to prove the wiring. Replace it with real tools; the discovery
  assertion in `src/server.test.ts` is the pattern that keeps each one
  reachable.
- The server registers no resources and no prompts. Both are registered the
  same way as tools, and neither is demonstrated here.
- `AGENTS.md` describes what makes a good tool boundary, and the one rule that
  is not a style preference: nothing writes to stdout. Read it before adding the
  second tool, not after the fifth.
- **Commit `package-lock.json`.** `npm install` wrote it in step 3, and the CI
  workflow runs `npm ci`, which fails without it. It is also the only thing
  that pins what your dependencies pull in — `package.json` pins the direct
  ones. Never add it to `.gitignore`.
- Under the `http` option, `ALLOWED_ORIGINS` is empty by default, which refuses
  every request that carries an `Origin` header. MCP clients do not send one;
  browsers always do. Set it only if something in a browser genuinely has to
  reach this server, and list exact origins.
- To publish: set a real `name`, drop `private`, and build before `npm publish`
  — `dist` is the package, `src` is not. To be listed in the official registry,
  add an `mcpName` field and a `server.json` beside it.
