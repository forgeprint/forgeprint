# Setup

Creates a Manifest V3 browser extension with WXT, for Chrome and Firefox: a
background service worker that is the only writer of the extension's storage, a
content script scoped to one declared site, a popup, typed messages between them
that the background parses and checks by sender, and a manifest check that fails
the build when the shipped `manifest.json` asks for more than
`extension-policy.json` allows. Vitest runs the tests against WXT's in-memory
fake browser; `wxt zip` produces the store archives.

The project is written file by file rather than scaffolded. `wxt init` fetches
its templates from GitHub, not from the npm registry, and a recipe may reach
only package registries.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.12.0 or newer, the floor Vite 8 and Vitest 5 declare, and
npm. No browser is downloaded: CI proves the build and the logic, not the
extension running in a browser (see `overview.md`).

1. Every version is exact, and there is no install hook: the install in step 25 runs no script at all. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Create `package.json` with:

   ```json
   {
     "name": "page-stats",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": ">=22.12.0"
     },
     "scripts": {
       "dev": "wxt",
       "dev:firefox": "wxt -b firefox --mv3",
       "typecheck": "wxt prepare && tsc --noEmit",
       "test": "vitest run",
       "build": "wxt build",
       "build:firefox": "wxt build -b firefox --mv3",
       "check:manifest": "node scripts/check-manifest.mjs .output/chrome-mv3/manifest.json && node scripts/check-manifest.mjs .output/firefox-mv3/manifest.json",
       "zip": "wxt zip",
       "zip:firefox": "wxt zip -b firefox --mv3"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "devDependencies": {
       "@types/node": "22.20.4",
       "happy-dom": "20.14.5",
       "typescript": "7.0.2",
       "vite": "8.3.1",
       "vitest": "5.0.1",
       "wxt": "0.21.4"
     }
   }
   ```

   Verify: `test -f package.json`

2. This is the whole list of what the extension may touch. The config builds the manifest from it, and the check in step 30 holds the built manifest to it. Create `extension-policy.json` with:

   ```json
   {
     "permissions": ["storage"],
     "host_permissions": [],
     "content_script_matches": ["https://example.com/*"],
     "extension_pages_csp": "script-src 'self'; object-src 'self';"
   }
   ```

   Verify: `test -f extension-policy.json`

3. Create `wxt.config.ts` with:

   ```typescript
   import { defineConfig } from 'wxt';

   import policy from './extension-policy.json' with { type: 'json' };

   export default defineConfig({
     // Every import is written out. Auto-imports hide where `browser` and
     // `storage` come from, and an agent editing a file cannot see them.
     imports: false,
     manifest: ({ browser }) => ({
       name: 'Page Stats',
       description: 'Counts the words on the pages it is allowed to read.',
       permissions: [...policy.permissions],
       host_permissions: [...policy.host_permissions],
       content_security_policy: {
         extension_pages: policy.extension_pages_csp,
       },
       ...(browser === 'firefox'
         ? {
             browser_specific_settings: {
               gecko: {
                 id: 'page-stats@example.invalid',
                 data_collection_permissions: { required: ['none'] },
               },
             },
           }
         : {}),
     }),
   });
   ```

   Verify: `test -f wxt.config.ts`

4. Create `tsconfig.json` with:

   ```json
   {
     "extends": "./.wxt/tsconfig.json",
     "compilerOptions": {
       "exactOptionalPropertyTypes": true,
       "resolveJsonModule": true,
       "allowJs": true,
       "checkJs": true,
       "types": ["node"]
     }
   }
   ```

   Verify: `test -f tsconfig.json`

5. Create `lib/stats.ts` with:

   ```typescript
   /**
    * Everything the extension stores, declared once.
    *
    * `stats` is written only by the background (`lib/background.ts`). The
    * content script may read `enabled` and nothing else: it runs inside a web
    * page, and a context a page can influence does not get to write the numbers
    * the popup trusts.
    */
   import { storage } from 'wxt/utils/storage';

   export interface Stats {
     readonly pages: number;
     readonly words: number;
     readonly lastTitle: string | null;
   }

   export const EMPTY_STATS: Stats = { pages: 0, words: 0, lastTitle: null };

   export const statsItem = storage.defineItem<Stats>('local:stats', {
     fallback: EMPTY_STATS,
   });

   export const enabledItem = storage.defineItem<boolean>('local:enabled', {
     fallback: true,
   });
   ```

   Verify: `test -f lib/stats.ts`

6. Create `lib/messages.ts` with:

   ```typescript
   /**
    * The message protocol between the three contexts, and its only parser.
    *
    * Everything that arrives through `runtime.onMessage` is `unknown` until
    * `parseMessage` has checked it. A content script runs inside a web page, and
    * a page that compromises it can send anything the content script can; the
    * type annotation on a listener is a claim, this function is the check.
    */
   import { browser } from 'wxt/browser';

   import type { Stats } from './stats';

   /** A page title longer than this is cut before it is sent, and refused after. */
   export const MAX_TITLE_LENGTH = 200;
   /** More words than any real page has; a larger number is a forged message. */
   export const MAX_WORDS = 10_000_000;

   export interface PageSeen {
     readonly type: 'page-seen';
     readonly words: number;
     readonly title: string;
   }

   export interface GetStats {
     readonly type: 'get-stats';
   }

   export interface ResetStats {
     readonly type: 'reset-stats';
   }

   export type Message = PageSeen | GetStats | ResetStats;

   /** What each message type answers with when it succeeds. */
   export interface Responses {
     'page-seen': { readonly accepted: true };
     'get-stats': Stats;
     'reset-stats': Stats;
   }

   export type Reply<T> =
     { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

   function isRecord(value: unknown): value is Record<string, unknown> {
     return typeof value === 'object' && value !== null && !Array.isArray(value);
   }

   /** Returns the message if it is exactly one of the shapes above, or null. */
   export function parseMessage(value: unknown): Message | null {
     if (!isRecord(value)) return null;
     const keys = Object.keys(value).sort().join(',');
     switch (value['type']) {
       case 'page-seen': {
         const { words, title } = value;
         if (keys !== 'title,type,words') return null;
         if (typeof words !== 'number' || !Number.isSafeInteger(words)) return null;
         if (words < 0 || words > MAX_WORDS) return null;
         if (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH) return null;
         return { type: 'page-seen', words, title };
       }
       case 'get-stats':
         return keys === 'type' ? { type: 'get-stats' } : null;
       case 'reset-stats':
         return keys === 'type' ? { type: 'reset-stats' } : null;
       default:
         return null;
     }
   }

   /** Sends a message to the background and returns its typed answer. */
   export async function sendMessage<M extends Message>(
     message: M,
   ): Promise<Reply<Responses[M['type']]>> {
     return (await browser.runtime.sendMessage(message)) as Reply<Responses[M['type']]>;
   }
   ```

   Verify: `test -f lib/messages.ts`

7. Create `lib/background.ts` with:

   ```typescript
   /**
    * The background's message handler: the only code that writes `stats`.
    *
    * It decides who may ask for what. A content script (a sender with a tab) may
    * report a page, and only a page inside the declared scope. An extension page
    * (the popup: no tab, a URL inside the extension) may read and reset. Nobody
    * else gets anything, whatever the message says about itself.
    */
   import { browser, type Browser } from 'wxt/browser';
   import { MatchPattern } from 'wxt/utils/match-patterns';

   import policy from '../extension-policy.json' with { type: 'json' };
   import { parseMessage, type Reply, type Responses } from './messages';
   import { EMPTY_STATS, statsItem } from './stats';

   export type Sender = Pick<Browser.runtime.MessageSender, 'id' | 'tab' | 'url'>;

   const CONTENT_SCOPE = policy.content_script_matches.map((pattern) => new MatchPattern(pattern));

   function fail(error: string): Reply<never> {
     return { ok: false, error };
   }

   function isContentScriptInScope(sender: Sender): boolean {
     if (sender.tab === undefined || sender.url === undefined) return false;
     const url = sender.url;
     return CONTENT_SCOPE.some((pattern) => pattern.includes(url));
   }

   function isExtensionPage(sender: Sender): boolean {
     return (
       sender.tab === undefined &&
       sender.url !== undefined &&
       sender.url.startsWith(browser.runtime.getURL('/'))
     );
   }

   /**
    * Service workers handle messages concurrently, and a read-modify-write of
    * `stats` across an `await` loses updates when two pages report at once.
    * Every write goes through this queue, one at a time.
    */
   let queue: Promise<unknown> = Promise.resolve();
   function serialized<T>(work: () => Promise<T>): Promise<T> {
     const next = queue.then(work, work);
     queue = next.catch(() => undefined);
     return next;
   }

   export async function handleMessage(
     raw: unknown,
     sender: Sender,
   ): Promise<Reply<Responses[keyof Responses]>> {
     // `runtime.onMessage` only hears this extension's own contexts, but the
     // check costs nothing and survives somebody adding `externally_connectable`.
     if (sender.id !== browser.runtime.id) return fail('unknown sender');

     const message = parseMessage(raw);
     if (message === null) return fail('malformed message');

     switch (message.type) {
       case 'page-seen': {
         if (!isContentScriptInScope(sender)) {
           return fail('page-seen is accepted only from a content script on an allowed page');
         }
         return serialized(async () => {
           const stats = await statsItem.getValue();
           await statsItem.setValue({
             pages: stats.pages + 1,
             words: Math.min(stats.words + message.words, Number.MAX_SAFE_INTEGER),
             lastTitle: message.title,
           });
           return { ok: true, value: { accepted: true } } as const;
         });
       }
       case 'get-stats': {
         if (!isExtensionPage(sender))
           return fail('get-stats is accepted only from an extension page');
         return { ok: true, value: await statsItem.getValue() };
       }
       case 'reset-stats': {
         if (!isExtensionPage(sender))
           return fail('reset-stats is accepted only from an extension page');
         return serialized(async () => {
           await statsItem.setValue(EMPTY_STATS);
           return { ok: true, value: EMPTY_STATS } as const;
         });
       }
     }
   }
   ```

   Verify: `test -f lib/background.ts`

8. Create `lib/page.ts` with:

   ```typescript
   /**
    * What the content script does, apart from reading the page.
    *
    * Kept out of `entrypoints/content.ts` so a test can run it without a page.
    * It reads the page's text and title and sends two numbers and a string;
    * nothing from the page is ever evaluated, and nothing is written into it.
    */
   import { MAX_TITLE_LENGTH, sendMessage } from './messages';
   import { enabledItem } from './stats';

   export function countWords(text: string): number {
     const matches = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
     return matches === null ? 0 : matches.length;
   }

   /**
    * Reports the page to the background, unless the user switched it off.
    *
    * Returns whether the background accepted it. A background that cannot be
    * reached (the extension was just updated, or is being reloaded) is a report
    * that did not happen, not an error thrown into somebody else's page.
    */
   export async function reportPage(text: string, title: string): Promise<boolean> {
     if (!(await enabledItem.getValue())) return false;
     try {
       const reply = await sendMessage({
         type: 'page-seen',
         words: countWords(text),
         title: title.slice(0, MAX_TITLE_LENGTH),
       });
       return reply.ok;
     } catch {
       return false;
     }
   }
   ```

   Verify: `test -f lib/page.ts`

9. Create `lib/popup.ts` with:

   ```typescript
   /**
    * The popup, built with DOM calls rather than HTML strings.
    *
    * The last page title came from a web page. The popup is an extension page
    * with the extension's privileges, so a title that reached `innerHTML` here
    * would be a page running script inside the extension. `textContent` only.
    */
   import { sendMessage, type Reply } from './messages';
   import { enabledItem, type Stats } from './stats';

   function addField(list: HTMLDListElement, label: string): HTMLElement {
     const doc = list.ownerDocument;
     const term = doc.createElement('dt');
     term.textContent = label;
     const value = doc.createElement('dd');
     list.append(term, value);
     return value;
   }

   export async function mountPopup(root: HTMLElement): Promise<void> {
     const doc = root.ownerDocument;

     const heading = doc.createElement('h1');
     heading.textContent = 'Page Stats';

     const list = doc.createElement('dl');
     const pages = addField(list, 'Pages');
     const words = addField(list, 'Words');
     const lastTitle = addField(list, 'Last page');

     const toggle = doc.createElement('input');
     toggle.type = 'checkbox';
     toggle.id = 'enabled';
     const label = doc.createElement('label');
     label.htmlFor = 'enabled';
     label.textContent = 'Count pages on allowed sites';

     const reset = doc.createElement('button');
     reset.type = 'button';
     reset.textContent = 'Reset';

     const status = doc.createElement('p');
     status.setAttribute('role', 'status');

     root.replaceChildren(heading, list, toggle, label, reset, status);

     const show = (reply: Reply<Stats>): void => {
       if (!reply.ok) {
         status.textContent = reply.error;
         return;
       }
       pages.textContent = String(reply.value.pages);
       words.textContent = String(reply.value.words);
       lastTitle.textContent = reply.value.lastTitle ?? 'None yet';
       status.textContent = '';
     };

     // A background that does not answer is said on screen, not thrown away.
     const ask = (type: 'get-stats' | 'reset-stats'): Promise<Reply<Stats>> =>
       sendMessage({ type }).catch(() => ({ ok: false, error: 'The extension is not answering.' }));

     toggle.checked = await enabledItem.getValue();
     toggle.addEventListener('change', () => {
       void enabledItem.setValue(toggle.checked);
     });
     reset.addEventListener('click', () => {
       void ask('reset-stats').then(show);
     });

     show(await ask('get-stats'));
   }
   ```

   Verify: `test -f lib/popup.ts`

10. Create `entrypoints/background.ts` with:

    ```typescript
    import { browser } from 'wxt/browser';
    import { defineBackground } from 'wxt/utils/define-background';

    import { handleMessage } from '../lib/background';

    export default defineBackground(() => {
      // Registered synchronously: a service worker that registers a listener after
      // an `await` misses the message that woke it up.
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message, sender).then(sendResponse, () => {
          sendResponse({ ok: false, error: 'internal error' });
        });
        // Keeps the channel open for the asynchronous answer, in Chrome and
        // Firefox alike.
        return true;
      });
    });
    ```

    Verify: `test -f entrypoints/background.ts`

11. Create `entrypoints/content.ts` with:

    ```typescript
    import { defineContentScript } from 'wxt/utils/define-content-script';

    import policy from '../extension-policy.json' with { type: 'json' };
    import { reportPage } from '../lib/page';

    export default defineContentScript({
      // The only pages this script runs on. Widening it is a permission change:
      // edit extension-policy.json, and the manifest check holds the build to it.
      matches: [...policy.content_script_matches],
      runAt: 'document_idle',
      async main() {
        // A document with no body (an image, a feed) has no words to count.
        await reportPage(document.body?.innerText ?? '', document.title);
      },
    });
    ```

    Verify: `test -f entrypoints/content.ts`

12. Create `entrypoints/popup/index.html` with:

    ```html
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Page Stats</title>
      </head>
      <body>
        <main id="app"></main>
        <script type="module" src="./main.ts"></script>
      </body>
    </html>
    ```

    Verify: `test -f entrypoints/popup/index.html`

13. Create `entrypoints/popup/main.ts` with:

    ```typescript
    import { mountPopup } from '../../lib/popup';

    const root = document.getElementById('app');
    if (root === null) throw new Error('popup: #app is missing from index.html');
    void mountPopup(root);
    ```

    Verify: `test -f entrypoints/popup/main.ts`

14. Create `scripts/check-manifest.mjs` with:

    ```javascript
    /**
     * Fails when a built manifest asks for more than extension-policy.json allows.
     *
     * Run it on what ships, after `wxt build`: WXT, a WXT module or a dev build
     * can add permissions the config never names (a dev build adds `tabs`,
     * `scripting` and a localhost host permission), and this is where that is
     * caught. Usage: node scripts/check-manifest.mjs <path to manifest.json>
     */
    import { readFileSync } from 'node:fs';
    import { resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    /**
     * `<all_urls>`, or a pattern whose host is every host. No policy may allow one:
     * widening to every site is a new extension, not an edit to this one.
     *
     * @param {string} pattern
     */
    const everyHost = (pattern) => pattern === '<all_urls>' || /^[a-z*]+:\/\/\*\//.test(pattern);

    /** Keys that open the extension to other code; the policy allows none of them. */
    const ABSENT = [
      'optional_permissions',
      'optional_host_permissions',
      'externally_connectable',
      'web_accessible_resources',
    ];

    /**
     * @typedef {{
     *   permissions: string[];
     *   host_permissions: string[];
     *   content_script_matches: string[];
     *   extension_pages_csp: string;
     * }} Policy
     */

    /**
     * @param {Record<string, any>} manifest
     * @param {Policy} policy
     * @returns {string[]}
     */
    export function findViolations(manifest, policy) {
      /** @type {string[]} */
      const problems = [];

      if (manifest['manifest_version'] !== 3) {
        problems.push(`manifest_version is ${String(manifest['manifest_version'])}, not 3`);
      }

      /** @param {string} field @param {unknown} asked @param {string[]} allowed */
      const within = (field, asked, allowed) => {
        const values = Array.isArray(asked) ? asked : [];
        for (const value of values) {
          if (typeof value === 'string' && everyHost(value))
            problems.push(`${field} asks for ${JSON.stringify(value)}, which is never allowed`);
          else if (!allowed.includes(value)) {
            problems.push(
              `${field} asks for ${JSON.stringify(value)}, which extension-policy.json does not list`,
            );
          }
        }
      };

      within('permissions', manifest['permissions'], policy.permissions);
      within('host_permissions', manifest['host_permissions'], policy.host_permissions);

      const scripts = Array.isArray(manifest['content_scripts']) ? manifest['content_scripts'] : [];
      for (const script of scripts) {
        within('content_scripts.matches', script?.matches, policy.content_script_matches);
        if (script?.world === 'MAIN')
          problems.push('a content script runs in the MAIN world, next to the page');
      }

      for (const key of ABSENT) {
        if (manifest[key] !== undefined) problems.push(`${key} is present; the policy allows none`);
      }

      const csp = manifest['content_security_policy']?.['extension_pages'];
      if (csp !== policy.extension_pages_csp) {
        problems.push(
          `content_security_policy.extension_pages is ${JSON.stringify(csp)}, not the policy's`,
        );
      }

      return problems;
    }

    const invokedDirectly =
      process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

    if (invokedDirectly) {
      const path = process.argv[2];
      if (path === undefined) {
        console.error('usage: node scripts/check-manifest.mjs <path to manifest.json>');
        process.exit(2);
      }
      const policy = JSON.parse(
        readFileSync(new URL('../extension-policy.json', import.meta.url), 'utf8'),
      );
      const manifest = JSON.parse(readFileSync(path, 'utf8'));
      const problems = findViolations(manifest, policy);
      for (const problem of problems) console.error(`${path}: ${problem}`);
      if (problems.length > 0) process.exit(1);
      console.log(`${path}: within extension-policy.json`);
    }
    ```

    Verify: `test -f scripts/check-manifest.mjs`

15. Create `vitest.config.ts` with:

    ```typescript
    import { defineConfig } from 'vitest/config';
    import { WxtVitest } from 'wxt/testing/vitest-plugin';

    export default defineConfig({
      // Replaces `wxt/browser` with an in-memory fake, so storage and messaging
      // run in Node without a browser.
      plugins: [WxtVitest()],
      test: {
        include: ['tests/**/*.test.ts'],
      },
    });
    ```

    Verify: `test -f vitest.config.ts`

16. Create `tests/wire.ts` with:

    ```typescript
    import { fakeBrowser } from 'wxt/testing/fake-browser';

    import { handleMessage, type Sender } from '../lib/background';

    /**
     * Connects the fake runtime to the real background handler, as `sender`.
     *
     * The fake browser delivers every message with an empty sender, which the
     * handler rightly refuses; a test says which context it is speaking as.
     */
    export function wireBackground(sender: Sender): string[] {
      const received: string[] = [];
      fakeBrowser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
        received.push(JSON.stringify(message));
        void handleMessage(message, sender).then(sendResponse);
        return true;
      });
      return received;
    }
    ```

    Verify: `test -f tests/wire.ts`

17. Create `tests/messages.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { MAX_TITLE_LENGTH, MAX_WORDS, parseMessage } from '../lib/messages';

    describe('parseMessage', () => {
      it('accepts each message in the protocol', () => {
        expect(parseMessage({ type: 'page-seen', words: 3, title: 'A page' })).toEqual({
          type: 'page-seen',
          words: 3,
          title: 'A page',
        });
        expect(parseMessage({ type: 'get-stats' })).toEqual({ type: 'get-stats' });
        expect(parseMessage({ type: 'reset-stats' })).toEqual({ type: 'reset-stats' });
      });

      it.each([
        ['not an object', 'page-seen'],
        ['null', null],
        ['an array', [{ type: 'get-stats' }]],
        ['an unknown type', { type: 'run-code', code: 'alert(1)' }],
        ['an extra field', { type: 'reset-stats', force: true }],
        ['a missing field', { type: 'page-seen', words: 3 }],
        ['a negative count', { type: 'page-seen', words: -1, title: '' }],
        ['a fractional count', { type: 'page-seen', words: 1.5, title: '' }],
        ['a count as a string', { type: 'page-seen', words: '3', title: '' }],
        ['an impossible count', { type: 'page-seen', words: MAX_WORDS + 1, title: '' }],
        [
          'a title that is too long',
          { type: 'page-seen', words: 1, title: 'x'.repeat(MAX_TITLE_LENGTH + 1) },
        ],
        ['a title that is not a string', { type: 'page-seen', words: 1, title: { toString: 'x' } }],
      ])('refuses %s', (_label, value) => {
        expect(parseMessage(value)).toBeNull();
      });
    });
    ```

    Verify: `test -f tests/messages.test.ts`

18. Create `tests/background.test.ts` with:

    ```typescript
    import { beforeEach, describe, expect, it } from 'vitest';
    import { fakeBrowser } from 'wxt/testing/fake-browser';

    import { handleMessage, type Sender } from '../lib/background';
    import { EMPTY_STATS, statsItem } from '../lib/stats';

    const id = fakeBrowser.runtime.id;
    const tab = { id: 1 } as NonNullable<Sender['tab']>;

    const contentScript: Sender = { id, tab, url: 'https://example.com/article' };
    const outOfScope: Sender = { id, tab, url: 'https://example.org/article' };
    const popup: Sender = { id, url: fakeBrowser.runtime.getURL('/popup.html') };
    const otherExtension: Sender = {
      id: 'another-extension',
      url: 'chrome-extension://another-extension/page.html',
    };

    const seen = (words: number, title = 'A page') => ({ type: 'page-seen', words, title });

    describe('handleMessage', () => {
      beforeEach(() => {
        fakeBrowser.reset();
      });

      it('records a page reported by the content script', async () => {
        await expect(handleMessage(seen(120), contentScript)).resolves.toEqual({
          ok: true,
          value: { accepted: true },
        });
        await expect(statsItem.getValue()).resolves.toEqual({
          pages: 1,
          words: 120,
          lastTitle: 'A page',
        });
      });

      it('refuses a report from a page outside the declared matches', async () => {
        const reply = await handleMessage(seen(120), outOfScope);
        expect(reply.ok).toBe(false);
        await expect(statsItem.getValue()).resolves.toEqual(EMPTY_STATS);
      });

      it('refuses a report that does not come from a tab', async () => {
        const reply = await handleMessage(seen(120), popup);
        expect(reply.ok).toBe(false);
      });

      it('does not let a content script reset or read the stats', async () => {
        await handleMessage(seen(5), contentScript);
        expect((await handleMessage({ type: 'reset-stats' }, contentScript)).ok).toBe(false);
        expect((await handleMessage({ type: 'get-stats' }, contentScript)).ok).toBe(false);
        await expect(statsItem.getValue()).resolves.toMatchObject({ pages: 1 });
      });

      it('lets the popup read and reset the stats', async () => {
        await handleMessage(seen(5), contentScript);
        await expect(handleMessage({ type: 'get-stats' }, popup)).resolves.toEqual({
          ok: true,
          value: { pages: 1, words: 5, lastTitle: 'A page' },
        });
        await expect(handleMessage({ type: 'reset-stats' }, popup)).resolves.toEqual({
          ok: true,
          value: EMPTY_STATS,
        });
        await expect(statsItem.getValue()).resolves.toEqual(EMPTY_STATS);
      });

      it('refuses a sender that is not this extension', async () => {
        expect((await handleMessage({ type: 'get-stats' }, otherExtension)).ok).toBe(false);
      });

      it('refuses a malformed message without touching storage', async () => {
        const reply = await handleMessage(
          { type: 'page-seen', words: -5, title: '' },
          contentScript,
        );
        expect(reply).toEqual({ ok: false, error: 'malformed message' });
        await expect(statsItem.getValue()).resolves.toEqual(EMPTY_STATS);
      });

      it('loses no report when many pages report at once', async () => {
        await Promise.all(Array.from({ length: 25 }, () => handleMessage(seen(2), contentScript)));
        await expect(statsItem.getValue()).resolves.toMatchObject({ pages: 25, words: 50 });
      });
    });
    ```

    Verify: `test -f tests/background.test.ts`

19. Create `tests/page.test.ts` with:

    ```typescript
    import { beforeEach, describe, expect, it } from 'vitest';
    import { fakeBrowser } from 'wxt/testing/fake-browser';

    import type { Sender } from '../lib/background';
    import { MAX_TITLE_LENGTH } from '../lib/messages';
    import { countWords, reportPage } from '../lib/page';
    import { enabledItem, statsItem } from '../lib/stats';
    import { wireBackground } from './wire';

    const contentScript: Sender = {
      id: fakeBrowser.runtime.id,
      tab: { id: 1 } as NonNullable<Sender['tab']>,
      url: 'https://example.com/article',
    };

    describe('countWords', () => {
      it.each([
        ['', 0],
        ['   ', 0],
        ['one', 1],
        ['two words', 2],
        ["it's a well-known word", 4],
        ['Çınar ve Gülşah', 3],
        ['1 000 numbers count too', 5],
      ])('counts %j as %i', (text, expected) => {
        expect(countWords(text)).toBe(expected);
      });
    });

    describe('reportPage', () => {
      beforeEach(() => {
        fakeBrowser.reset();
      });

      it('sends the count and the title to the background', async () => {
        wireBackground(contentScript);
        await expect(reportPage('three short words', 'Title')).resolves.toBe(true);
        await expect(statsItem.getValue()).resolves.toEqual({
          pages: 1,
          words: 3,
          lastTitle: 'Title',
        });
      });

      it('cuts a long title to the length the background accepts', async () => {
        wireBackground(contentScript);
        await expect(reportPage('word', 'x'.repeat(MAX_TITLE_LENGTH * 2))).resolves.toBe(true);
        const stats = await statsItem.getValue();
        expect(stats.lastTitle).toHaveLength(MAX_TITLE_LENGTH);
      });

      it('reports failure, rather than throwing, when the background cannot be reached', async () => {
        await expect(reportPage('three short words', 'Title')).resolves.toBe(false);
      });

      it('sends nothing when the user has switched it off', async () => {
        const received = wireBackground(contentScript);
        await enabledItem.setValue(false);
        await expect(reportPage('three short words', 'Title')).resolves.toBe(false);
        expect(received).toEqual([]);
      });
    });
    ```

    Verify: `test -f tests/page.test.ts`

20. Create `tests/popup.test.ts` with:

    ```typescript
    // @vitest-environment happy-dom
    import { beforeEach, describe, expect, it } from 'vitest';
    import { fakeBrowser } from 'wxt/testing/fake-browser';

    import { mountPopup } from '../lib/popup';
    import { enabledItem, statsItem } from '../lib/stats';
    import { wireBackground } from './wire';

    const popup = { id: fakeBrowser.runtime.id, url: fakeBrowser.runtime.getURL('/popup.html') };

    async function mount(): Promise<HTMLElement> {
      const root = document.createElement('main');
      document.body.replaceChildren(root);
      await mountPopup(root);
      return root;
    }

    const values = (root: HTMLElement) =>
      [...root.querySelectorAll('dd')].map((dd) => dd.textContent);

    describe('popup', () => {
      beforeEach(() => {
        fakeBrowser.reset();
        wireBackground(popup);
      });

      it('shows the stats the background holds', async () => {
        await statsItem.setValue({ pages: 2, words: 40, lastTitle: 'Last one' });
        const root = await mount();
        expect(values(root)).toEqual(['2', '40', 'Last one']);
      });

      it('renders a hostile page title as text, never as markup', async () => {
        const hostile = '<img src=x onerror="alert(1)">';
        await statsItem.setValue({ pages: 1, words: 1, lastTitle: hostile });
        const root = await mount();
        expect(values(root)[2]).toBe(hostile);
        expect(root.querySelector('img')).toBeNull();
      });

      it('resets through the background', async () => {
        await statsItem.setValue({ pages: 2, words: 40, lastTitle: 'Last one' });
        const root = await mount();
        root.querySelector('button')?.click();
        await expect.poll(() => values(root)).toEqual(['0', '0', 'None yet']);
        await expect(statsItem.getValue()).resolves.toMatchObject({ pages: 0 });
      });

      it('says so when the background does not answer', async () => {
        fakeBrowser.reset();
        const root = await mount();
        expect(root.querySelector('[role="status"]')?.textContent).toBe(
          'The extension is not answering.',
        );
      });

      it('switches counting off', async () => {
        const root = await mount();
        const toggle = root.querySelector<HTMLInputElement>('input[type="checkbox"]');
        expect(toggle?.checked).toBe(true);
        toggle?.click();
        await expect.poll(() => enabledItem.getValue()).toBe(false);
      });
    });
    ```

    Verify: `test -f tests/popup.test.ts`

21. Create `tests/manifest-policy.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import policy from '../extension-policy.json' with { type: 'json' };
    import { findViolations } from '../scripts/check-manifest.mjs';

    const clean = {
      manifest_version: 3,
      permissions: [...policy.permissions],
      host_permissions: [...policy.host_permissions],
      content_scripts: [
        { matches: [...policy.content_script_matches], js: ['content-scripts/content.js'] },
      ],
      content_security_policy: { extension_pages: policy.extension_pages_csp },
    };

    describe('findViolations', () => {
      it('passes a manifest that asks for exactly the policy', () => {
        expect(findViolations(clean, policy)).toEqual([]);
      });

      it.each([
        ['an extra permission', { ...clean, permissions: [...clean.permissions, 'tabs'] }],
        ['a host permission', { ...clean, host_permissions: ['https://example.org/*'] }],
        ['all URLs', { ...clean, host_permissions: ['<all_urls>'] }],
        ['a wider content script', { ...clean, content_scripts: [{ matches: ['*://*/*'] }] }],
        [
          'a content script in the page world',
          {
            ...clean,
            content_scripts: [{ matches: [...policy.content_script_matches], world: 'MAIN' }],
          },
        ],
        [
          'a relaxed CSP',
          {
            ...clean,
            content_security_policy: {
              extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
            },
          },
        ],
        [
          'web accessible resources',
          { ...clean, web_accessible_resources: [{ resources: ['*'], matches: ['<all_urls>'] }] },
        ],
        [
          'externally connectable',
          { ...clean, externally_connectable: { matches: ['https://example.org/*'] } },
        ],
        ['optional permissions', { ...clean, optional_permissions: ['downloads'] }],
        ['manifest version 2', { ...clean, manifest_version: 2 }],
      ])('refuses %s', (_label, manifest) => {
        expect(findViolations(manifest, policy)).not.toEqual([]);
      });

      it.each(['<all_urls>', '*://*/*', 'ws://*/*'])(
        'refuses %s even when the policy itself lists it',
        (pattern) => {
          const widened = { ...policy, host_permissions: [pattern] };
          expect(findViolations({ ...clean, host_permissions: [pattern] }, widened)).not.toEqual(
            [],
          );
        },
      );
    });
    ```

    Verify: `test -f tests/manifest-policy.test.ts`

22. Create `.gitignore` with:

    ```text
    node_modules/
    .output/
    .wxt/
    *.log
    .env
    .env.*
    ```

    Verify: `test -f .gitignore`

23. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      check:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          # The committed lock file, byte for byte, and no dependency's install
          # script runs: none of them needs one, and a script is code from the
          # registry running with this job's access.
          - run: npm ci --ignore-scripts
          - run: npm run typecheck
          - run: npm test
          - run: npm run build
          - run: npm run build:firefox
          # Fails when either built manifest asks for more than
          # extension-policy.json allows.
          - run: npm run check:manifest
          - run: npm run zip
          - run: npm run zip:firefox
    ```

    Verify: `test -f .github/workflows/ci.yml`

24. Create `README.md` with:

    ```markdown
    # Page Stats

    A Manifest V3 browser extension built with WXT. On the pages it is allowed to
    read, it counts the words and remembers the page title; the popup shows the
    totals and can switch counting off or reset it.

    ## What it may touch

    `extension-policy.json` is the whole list: the `storage` permission, no host
    permissions, and a content script on `https://example.com/*` only. After a
    build, `npm run check:manifest` fails if either browser's `manifest.json` asks
    for anything more.

    ## Commands

    - `npm run dev` — Chrome with the extension loaded and reloading
    - `npm run dev:firefox` — the same in Firefox
    - `npm test` — unit tests against an in-memory fake of the browser APIs
    - `npm run build` and `npm run build:firefox` — production builds in `.output/`
    - `npm run zip` and `npm run zip:firefox` — the archives the stores take

    A dev build adds permissions for reloading (`tabs`, `scripting`, a localhost
    host permission). Never ship one; `wxt zip` builds for production.

    ## Loading it unpacked

    Chrome: `chrome://extensions`, turn on Developer mode, "Load unpacked", pick
    `.output/chrome-mv3`. Firefox: `about:debugging`, "This Firefox", "Load
    Temporary Add-on", pick `.output/firefox-mv3/manifest.json`.
    ```

    Verify: `test -f README.md`

25. Install the pinned dependencies without running any package's install script. None of them needs one, and this writes `package-lock.json`, which is committed and is what CI installs from: `npm install --ignore-scripts --no-audit --no-fund`
    Verify: `npm ls wxt vite vitest typescript happy-dom --depth=0`

26. Generate WXT's types and type-check everything, tests and the manifest check included: `npm run typecheck`
    Verify: `npm run typecheck`

27. Run the tests: the message parser, who may ask the background for what, the content script's report, the popup rendering a hostile title as text, and the manifest check refusing each way of asking for more: `npm test`
    Verify: `npm test`

28. Build for Chrome, as a Manifest V3 extension with a service worker: `npm run build`
    Verify: `grep -q '"service_worker":"background.js"' .output/chrome-mv3/manifest.json`

29. Build for Firefox, also Manifest V3. WXT builds Manifest V2 for Firefox unless told otherwise, and Firefox runs the background as an event page rather than a service worker: `npm run build:firefox`
    Verify: `grep -q '"scripts":\["background.js"\]' .output/firefox-mv3/manifest.json`

30. Hold both built manifests to `extension-policy.json`: exactly `storage`, no host permissions, the content script on its declared matches only, and the policy's CSP: `npm run check:manifest`
    Verify: `npm run check:manifest`

31. Prove the check is not a formality: write a copy of the Chrome manifest that also asks for `tabs`: `node -e "const fs = require('node:fs'); const m = JSON.parse(fs.readFileSync('.output/chrome-mv3/manifest.json', 'utf8')); m.permissions.push('tabs'); fs.writeFileSync('.output/widened-manifest.json', JSON.stringify(m));"`
    Verify: `node scripts/check-manifest.mjs .output/widened-manifest.json 2>&1 | grep -q '"tabs"'`

32. Confirm the built extension contains no code that could run something it did not ship, which Manifest V3 forbids and store review rejects — no `eval`, no `new Function`, no `importScripts`: `grep -rlE "eval\(|new Function\(|importScripts\(" .output/chrome-mv3 .output/firefox-mv3 || true`
    Verify: `! grep -rqE "eval\(|new Function\(|importScripts\(" .output/chrome-mv3 .output/firefox-mv3`

33. Confirm no source map was shipped, because a map publishes the original source to anybody who unpacks the archive: `find .output/chrome-mv3 .output/firefox-mv3 -name '*.map'`
    Verify: `test -z "$(find .output/chrome-mv3 .output/firefox-mv3 -name '*.map')"`

34. Package the Chrome Web Store archive: `npm run zip`
    Verify: `grep -aq manifest.json .output/page-stats-0.1.0-chrome.zip`

35. Package the Firefox archive and the sources archive that addons.mozilla.org asks for when the code is bundled: `npm run zip:firefox`
    Verify: `grep -aq manifest.json .output/page-stats-0.1.0-firefox.zip && grep -aq extension-policy.json .output/page-stats-0.1.0-sources.zip`
