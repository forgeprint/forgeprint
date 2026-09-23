# Setup

Creates a TypeScript library that is publishable: an exports map, type
declarations, a test suite, and a release workflow that publishes from a tag
with npm provenance.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 20 or newer.

1. Create `package.json` with:

   ```json
   {
     "name": "@example/slugify",
     "version": "0.1.0",
     "description": "Turn a string into a URL-safe slug.",
     "license": "MIT",
     "type": "module",
     "sideEffects": false,
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "default": "./dist/index.js"
       }
     },
     "types": "./dist/index.d.ts",
     "files": ["dist"],
     "engines": { "node": ">=20" },
     "scripts": {
       "build": "tsc --build",
       "test": "node --test dist/*.test.js",
       "prepublishOnly": "npm run build && npm test"
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
       "declaration": true,
       "declarationMap": true,
       "types": ["node"]
     },
     "include": ["src"]
   }
   ```

   Verify: `test -f tsconfig.json`

3. Install the pinned development dependencies: `npm install --no-audit --no-fund`
   Verify: `test -d node_modules/typescript`

4. Create `src/index.ts` with:

   ```typescript
   export interface SlugifyOptions {
     readonly separator?: string;
     readonly maxLength?: number;
   }

   /**
    * Letters that `normalize('NFKD')` cannot help with.
    *
    * NFKD splits an accented Latin letter into a base letter and a combining
    * mark, so stripping the marks turns "é" into "e". That is the whole
    * strategy most slugifiers use, and it silently fails for letters that are
    * not accented Latin at all: Turkish dotless "ı" has no decomposition, so
    * it survives NFKD, fails the ASCII filter, and is replaced by a
    * separator. "Çınar" becomes "c-nar".
    *
    * The honest options are to map the letters you care about, as here, or to
    * take a real transliteration library. What is not honest is to strip
    * marks and call the result universal.
    */
   const TRANSLITERATIONS: ReadonlyMap<string, string> = new Map([
     ['ı', 'i'],
     ['İ', 'i'],
     ['ş', 's'],
     ['Ş', 's'],
     ['ğ', 'g'],
     ['Ğ', 'g'],
     ['ß', 'ss'],
     ['æ', 'ae'],
     ['Æ', 'ae'],
     ['ø', 'o'],
     ['Ø', 'o'],
     ['đ', 'd'],
     ['Đ', 'd'],
     ['ł', 'l'],
     ['Ł', 'l'],
   ]);

   function transliterate(input: string): string {
     let out = '';
     // Iterating a string yields code points rather than UTF-16 units, so a
     // character outside the basic plane is not split in half.
     for (const character of input) {
       out += TRANSLITERATIONS.get(character) ?? character;
     }
     return out;
   }

   export function slugify(input: string, options: SlugifyOptions = {}): string {
     const separator = options.separator ?? '-';

     const slug = transliterate(input)
       .normalize('NFKD')
       .replace(/[̀-ͯ]/g, '')
       .toLowerCase()
       .replace(/[^a-z0-9]+/g, separator)
       .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

     const max = options.maxLength;
     if (max === undefined || slug.length <= max) {
       return slug;
     }

     // Truncating can leave a trailing separator, which is a slug that looks
     // like a mistake.
     return slug.slice(0, max).replace(new RegExp(`${separator}+$`), '');
   }
   ```

   Verify: `test -f src/index.ts`

5. Create `src/index.test.ts` with:

   ```typescript
   import assert from 'node:assert/strict';
   import { describe, it } from 'node:test';

   import { slugify } from './index.js';

   describe('slugify', () => {
     it('lowercases and joins words', () => {
       assert.equal(slugify('Hello World'), 'hello-world');
     });

     it('strips accents rather than dropping the letter', () => {
       assert.equal(slugify('Café Crème'), 'cafe-creme');
     });

     it('collapses runs of punctuation', () => {
       assert.equal(slugify('a -- b!!! c'), 'a-b-c');
     });

     it('trims the separator from both ends', () => {
       assert.equal(slugify('  hello  '), 'hello');
     });

     it('honours a custom separator', () => {
       assert.equal(slugify('Hello World', { separator: '_' }), 'hello_world');
     });

     it('does not end a truncated slug with the separator', () => {
       assert.equal(slugify('one two three', { maxLength: 8 }), 'one-two');
     });

     it('returns an empty string when nothing survives', () => {
       assert.equal(slugify('!!!'), '');
     });
   });

   describe('letters that are not accented Latin', () => {
     // These are the tests that fail if somebody "simplifies" the function
     // back to normalize-and-strip, which looks equivalent and is not.
     it('maps Turkish dotless i, which NFKD does not decompose', () => {
       assert.equal(slugify('Çınar'), 'cinar');
     });

     it('maps the Turkish letters NFKD leaves alone', () => {
       assert.equal(slugify('Gülşah Çınar'), 'gulsah-cinar');
     });

     it('expands the German sharp s rather than dropping it', () => {
       assert.equal(slugify('Straße'), 'strasse');
     });
   });
   ```

   Verify: `test -f src/index.test.ts`

6. Create `.gitignore` with:

   ```text
   node_modules/
   dist/
   *.tsbuildinfo
   ```

   Verify: `test -f .gitignore`

7. Create `CHANGELOG.md` with:

   ```markdown
   # Changelog

   ## 0.1.0 — unreleased

   First version. `slugify(input, options)` with a custom separator and a
   maximum length.
   ```

   Verify: `test -f CHANGELOG.md`

8. Create `README.md` with:

   ```markdown
   # @example/slugify

   Turn a string into a URL-safe slug: `slugify('Gülşah Çınar')` returns
   `gulsah-cinar`.

   ## Which letters it handles

   Accented Latin letters are decomposed and their marks removed. Letters that
   are not accented Latin — Turkish `ı`, German `ß`, Polish `ł` — are mapped
   explicitly, because Unicode normalisation cannot help with them. Anything
   outside both groups is replaced by the separator. If you need a script this
   does not cover, add it to the map or take a transliteration library.
   ```

   Verify: `test -f README.md`

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
       strategy:
         matrix:
           # The floor in `engines` and the current release. A library that
           # only tests one version does not know what its floor is worth.
           node-version: ['20', '22']
       steps:
         - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
         - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
           with:
             node-version: ${{ matrix.node-version }}
         - run: npm install --no-audit --no-fund
         - run: npm run build
         - run: npm test
   ```

   Verify: `test -f .github/workflows/ci.yml`

10. Create `.github/workflows/release.yml` with:

    ```yaml
    name: release

    on:
      push:
        tags: ['v*']

    jobs:
      publish:
        runs-on: ubuntu-latest
        permissions:
          contents: read
          # What makes provenance possible: npm verifies the token against
          # this workflow, so the published package carries a signed statement
          # of which commit and which workflow built it. No npm token is
          # stored anywhere.
          id-token: write
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
            with:
              node-version: '22'
              registry-url: 'https://registry.npmjs.org'
          - run: npm install --no-audit --no-fund
          # prepublishOnly builds and tests, so a broken tag cannot publish.
          - run: npm publish --provenance --access public
    ```

    Verify: `test -f .github/workflows/release.yml`

11. Build it, which also writes the type declarations the exports map points at: `npm run build`
    Verify: `test -f dist/index.d.ts`

12. Run the tests: `npm test`
    Verify: `npm test`

13. Confirm the package would ship the built files and nothing else. `npm pack --dry-run` lists exactly what a consumer receives, and this is the step that catches a `files` field that quietly excludes the types: `npm pack --dry-run --json > packed.json`
    Verify: `grep -q '"path": "dist/index.d.ts"' packed.json`

14. Confirm no source or test file is in the tarball. A published library that ships its tests is a library whose consumers download them forever: `grep -c '"path": "src/' packed.json > sources.count || true`
    Verify: `grep -qx "0" sources.count`

15. Confirm the package can be imported by the path its exports map advertises, resolved the way a consumer resolves it: `node --input-type=module -e "import { slugify } from './dist/index.js'; if (slugify('Çınar') !== 'cinar') { process.exit(1); }"`
    Verify: `node --input-type=module -e "import { slugify } from './dist/index.js'; if (slugify('Çınar') !== 'cinar') { process.exit(1); }"`
