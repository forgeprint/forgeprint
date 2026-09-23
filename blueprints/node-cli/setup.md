# Setup

Creates a command-line tool in TypeScript on Commander, with the argument
parsing tested in-process and a binary that runs from a checkout.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 20 or newer.

1. Create `package.json` with:

   ```json
   {
     "name": "example-cli",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "bin": { "example": "./dist/bin.js" },
     "scripts": {
       "build": "tsc --build",
       "test": "node --test dist/*.test.js"
     },
     "dependencies": {
       "commander": "15.0.0"
     },
     "devDependencies": {
       "typescript": "7.0.2",
       "@types/node": "26.6.2"
     }
   }
   ```

   Verify: `test -f package.json`

2. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "module": "nodenext",
       "moduleResolution": "nodenext",
       "outDir": "dist",
       "rootDir": "src",
       "strict": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true,
       "types": ["node"]
     },
     "include": ["src"]
   }
   ```

   Verify: `test -f tsconfig.json`

3. Install the pinned dependencies: `npm install --no-audit --no-fund`
   Verify: `node -e "await import('commander')"`

4. Create `src/greet.ts` with:

   ```typescript
   /**
    * What the tool does, with no idea that a command line exists.
    *
    * Keeping the work out of the command handler is what makes it testable
    * without parsing anything, and what lets the same logic be called from
    * somewhere else later without dragging Commander along.
    */
   export interface GreetOptions {
     readonly shout: boolean;
   }

   export function greet(name: string, options: GreetOptions): string {
     const line = `Hello, ${name}.`;
     return options.shout ? line.toUpperCase() : line;
   }
   ```

   Verify: `test -f src/greet.ts`

5. Create `src/cli.ts` with:

   ```typescript
   import { Command } from 'commander';

   import { greet } from './greet.js';

   /**
    * The command surface, as a function that takes its output.
    *
    * `write` is injected rather than being `console.log`, so a test can read
    * what the tool would have printed without capturing a stream. That single
    * decision is what makes the tests below ordinary function calls.
    *
    * `exitOverride` stops Commander calling `process.exit` on a parse error,
    * which in a test would take the test runner down with it.
    */
   export function createProgram(write: (line: string) => void): Command {
     const program = new Command();
     program.name('example').description('An example CLI.').version('0.1.0').exitOverride();

     program
       .command('greet')
       .argument('<name>', 'who to greet')
       .option('--shout', 'in capitals')
       .action((name: string, options: { shout?: boolean }) => {
         write(greet(name, { shout: options.shout === true }));
       });

     return program;
   }
   ```

   Verify: `test -f src/cli.ts`

6. Create `src/bin.ts` with:

   ```typescript
   #!/usr/bin/env node
   import { createProgram } from './cli.js';

   // The only place that touches the real streams. Everything above it is
   // callable from a test.
   const program = createProgram((line) => {
     process.stdout.write(`${line}\n`);
   });

   try {
     program.parse();
   } catch (error) {
     // exitOverride makes Commander throw instead of exiting. That is what the
     // tests need and the opposite of what a binary needs, so the translation
     // happens here: the error carries the exit code Commander would have
     // used — 0 for --help and --version, non-zero for a real parse failure.
     // Without this, `tool --help` exits 1 and every script that checks the
     // status code is wrong about it.
     const code = (error as { exitCode?: number }).exitCode;
     process.exit(typeof code === 'number' ? code : 1);
   }
   ```

   Verify: `test -f src/bin.ts`

7. Create `src/cli.test.ts` with:

   ```typescript
   import assert from 'node:assert/strict';
   import { describe, it } from 'node:test';

   import { createProgram } from './cli.js';

   /**
    * These drive the real parser, not the function behind it.
    *
    * A test that called greet() directly would pass while the option was
    * spelled wrong in the command definition, or not wired at all — and that
    * is the part of a CLI that actually breaks.
    */
   describe('greet command', () => {
     it('writes the greeting', () => {
       const written: string[] = [];
       createProgram((line) => written.push(line)).parse(['greet', 'Ada'], { from: 'user' });
       assert.deepEqual(written, ['Hello, Ada.']);
     });

     it('shouts when asked', () => {
       const written: string[] = [];
       createProgram((line) => written.push(line)).parse(['greet', 'Ada', '--shout'], {
         from: 'user',
       });
       assert.deepEqual(written, ['HELLO, ADA.']);
     });

     it('refuses a missing argument instead of guessing', () => {
       // exitOverride turns the parse failure into a throw. Without it this
       // test would end the process rather than fail.
       assert.throws(() => createProgram(() => undefined).parse(['greet'], { from: 'user' }));
     });
   });
   ```

   Verify: `test -f src/cli.test.ts`

8. Create `.gitignore` with:

   ```text
   node_modules/
   dist/
   *.tsbuildinfo
   ```

   Verify: `test -f .gitignore`

9. Create `.github/workflows/ci.yml` with:

   ```yaml
   name: ci

   on:
     push:
     pull_request:

   permissions:
     contents: read

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
         - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
           with:
             node-version: '20'
         - run: npm install --no-audit --no-fund
         - run: npm run build
         - run: npm test
   ```

   Verify: `test -f .github/workflows/ci.yml`

10. Create `README.md` with:

    ```markdown
    # example-cli

    A command-line tool on Commander.

    ## Run it from a checkout

    `npm run build`, then `node dist/bin.js greet Ada`.

    ## Add a command

    See `AGENTS.md`. The short version: the work goes in its own module, the
    command handler only parses and calls it, and the test drives the parser
    rather than the function.
    ```

    Verify: `test -f README.md`

11. Build it: `npm run build`
    Verify: `test -f dist/bin.js`

12. Run the tests: `npm test`
    Verify: `npm test`

13. Run the tool the way a user would, and check what it prints: `node dist/bin.js greet Ada --shout > greeted.txt`
    Verify: `grep -qx "HELLO, ADA." greeted.txt`

14. Confirm the help text lists the command and exits zero. A reader sees `--help` first, and so does every script that checks the status code: `node dist/bin.js --help > help.txt`
    Verify: `grep -q "greet" help.txt`

15. Confirm a bad invocation fails rather than doing something surprising: `node dist/bin.js greet > bad.txt 2>&1; echo "$?" > bad.code`
    Verify: `grep -qv '^0$' bad.code`
