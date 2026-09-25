# Browser Extension — agent context

A Manifest V3 browser extension for Chrome and Firefox, built with WXT 0.21 on
Vite 8 and TypeScript 7. Three contexts run it, and they do not trust each
other equally:

| Context        | File                        | Runs where                           | May                                             |
| -------------- | --------------------------- | ------------------------------------ | ----------------------------------------------- |
| Background     | `entrypoints/background.ts` | Service worker (Firefox: event page) | Write `stats`; answer messages                  |
| Content script | `entrypoints/content.ts`    | Inside `https://example.com/*` pages | Read the page; read `enabled`; send `page-seen` |
| Popup          | `entrypoints/popup/`        | Extension page                       | Read and reset stats; write `enabled`           |

The content script is the least trusted of the three. It shares the page's
DOM, so a hostile page can feed it anything it reads, and anything it sends is
treated as coming from the page.

## The shape

- `entrypoints/` holds only the WXT entry files, and each one is a few lines
  that call into `lib/`. Logic lives in `lib/`, where a test can reach it
  without a browser.
- `extension-policy.json` is the **whole** list of what the extension may
  touch: `permissions`, `host_permissions`, the content script's `matches`, and
  the extension pages' CSP. `wxt.config.ts` builds the manifest from it, the
  content script takes its `matches` from it, and the background checks senders
  against it.
- `scripts/check-manifest.mjs` reads a **built** `manifest.json` and fails if it
  asks for anything the policy does not list, if any pattern covers every host,
  if a content script runs in the page's `MAIN` world, or if
  `web_accessible_resources`, `externally_connectable` or optional permissions
  appear at all.
- `lib/messages.ts` is the protocol: the message types, what each answers with,
  and `parseMessage`, the only parser. `lib/background.ts` decides who may send
  which message.
- `lib/stats.ts` declares every storage item, through WXT's storage API.

## Rules that are not style preferences

1. **A permission is added to `extension-policy.json`, never only to
   `wxt.config.ts`.** The build check compares the shipped manifest with the
   policy; a permission added anywhere else fails `npm run check:manifest`, which
   is the point. Every permission becomes an install-time warning the user reads
   and a reason for store review to look closer.
2. **Never `<all_urls>`, `*://*/*`, or a host of `*`.** The check refuses them
   even if the policy lists them. Widening to every site is a different
   extension with a different review; it is not an edit to this one. A second
   site is one more line in `content_script_matches`.
3. **Prefer `activeTab` over a host permission** when the feature runs only
   after the user clicks the extension. It grants the current tab for that
   gesture and shows no install warning.
4. **Every message is parsed before it is used.** `runtime.onMessage` hands the
   listener `unknown` in practice, whatever the annotation says. Add a message
   type to `Message`, to `Responses`, and a `case` to `parseMessage` that checks
   every field and refuses extra keys — all three, or the handler never sees it.
5. **The background checks the sender, not the message.** `page-seen` is
   accepted only from a tab whose URL matches the policy; `get-stats` and
   `reset-stats` only from an extension page (no tab, a URL inside the
   extension). A message cannot say where it came from; `sender` can.
6. **Only the background writes `stats`.** Storage written by the content script
   is storage a web page can steer. If the content script needs something
   stored, it sends a message and the background decides.
7. **Page data is text, forever.** The popup builds its DOM with
   `createElement` and `textContent`. A page title reaching `innerHTML` in an
   extension page runs the page's markup with the extension's privileges.
   `tests/popup.test.ts` renders a title that is an `<img onerror>` and asserts
   no element appears.
8. **No remote code.** Manifest V3 forbids executing anything the extension did
   not ship: no `eval`, no `new Function`, no script loaded from a URL, no
   `import()` of a remote module. Data from a server is fine; code is not. The
   recipe greps the build for the first three; store review looks for the rest.
9. **The CSP stays at the policy's value.** `script-src 'self'; object-src
'self';` is Chrome's documented Manifest V3 default, written out, and
   narrower than WXT's default, which adds `'wasm-unsafe-eval'`. Add
   `'wasm-unsafe-eval'` to the policy only if the extension ships WebAssembly.
10. **Listeners are registered synchronously** inside `defineBackground`. A
    service worker is stopped when idle and restarted by the event it missed; a
    listener registered after an `await` is not there when that event arrives.
    Nothing is kept in background memory that must survive — put it in storage.
11. **Asynchronous answers use `sendResponse` and `return true`.** That works in
    Chrome and Firefox alike, and it is what WXT's fake browser delivers in
    tests.
12. **Writes to `stats` go through `serialized`.** Two pages reporting at once
    would otherwise read the same value and lose one update; a test sends 25 at
    once and counts them.
13. **Imports are explicit** (`imports: false`): `browser` from `wxt/browser`,
    `storage` from `wxt/utils/storage`, `define*` from `wxt/utils/*`. Do not turn
    auto-imports back on.
14. **Nothing secret goes into this project.** Every file in the built
    extension can be unpacked by anybody who installs it, and the Firefox
    sources archive contains every file in the project that does not start with
    a dot. An API key in an extension is a published API key.
15. **Never ship a dev build.** `wxt` (dev mode) adds `tabs`, `scripting` and a
    localhost host permission for reloading. `wxt build` and `wxt zip` build for
    production; the manifest check would refuse a dev manifest anyway.

## Commands

```bash
npm install --ignore-scripts   # no dependency needs an install script
npm run typecheck              # wxt prepare, then tsc
npm test                       # Vitest with WXT's fake browser
npm run build                  # .output/chrome-mv3
npm run build:firefox          # .output/firefox-mv3
npm run check:manifest         # both built manifests against the policy
npm run zip                    # Chrome Web Store archive
npm run zip:firefox            # Firefox archive + sources archive
npm run dev                    # opens a browser with the extension loaded
```

## When you are asked to add a feature

1. Decide which context does the work. Reading a page is the content script;
   deciding and storing is the background; showing is the popup.
2. If it needs a permission or another site, change `extension-policy.json`
   first, and say in the pull request which install warning it adds.
3. If contexts must talk, add the message to `lib/messages.ts` (type, response,
   parser case) and the sender rule to `lib/background.ts`, with a test that a
   wrong sender is refused.
4. Put the logic in `lib/`, test it with `fakeBrowser` from
   `wxt/testing/fake-browser`, call `fakeBrowser.reset()` in `beforeEach`.
5. Run `npm run build`, `npm run build:firefox` and `npm run check:manifest`
   before calling it done.

## What this does not do

- It is not tested in a real browser. The tests prove the logic against a fake;
  whether Chrome and Firefox load it, and what they show the user, is checked
  by hand (`overview.md` says how).
- No icons, no options page, no side panel, no localisation (`_locales`), no
  Safari or Edge-specific build.
- No publishing: `wxt submit` needs store credentials and is not wired up.
