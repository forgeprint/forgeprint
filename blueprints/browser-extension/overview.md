# Browser Extension (WXT, Manifest V3)

A Manifest V3 browser extension for Chrome and Firefox, written in TypeScript
and built with WXT. It has the three parts most extensions have — a background
service worker, a content script, a popup — wired together with typed messages
the background checks, and a build check that holds the shipped `manifest.json`
to a declared permission policy.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has loaded it into a browser and
built an extension on it first, which is what `tier: official` means in this
catalog and why this is `community`.

## What you get

- WXT 0.21.4 on Vite 8.3, TypeScript 7 in strict mode with
  `exactOptionalPropertyTypes`, explicit imports (auto-imports off).
- A small working extension, "Page Stats": on `https://example.com/*` the
  content script counts the words on the page and sends the count and the title
  to the background; the popup shows the totals, resets them, and switches
  counting off.
- `extension-policy.json`: `storage` and nothing else, no host permissions, one
  content-script site, and the extension pages' CSP.
- `scripts/check-manifest.mjs`, run on both built manifests: it fails when the
  manifest asks for a permission, host or site the policy does not list, any
  pattern covering every host, a content script in the page's `MAIN` world, or
  `web_accessible_resources`, `externally_connectable` or optional permissions.
  The recipe proves it fails by feeding it a manifest that also asks for
  `tabs`.
- A message protocol with one parser that refuses anything not exactly in the
  protocol, and a background that checks the **sender**: page reports only
  from a tab inside the declared sites, reads and resets only from an extension
  page.
- Storage through WXT's storage API, written only by the background.
- Vitest 5 against WXT's in-memory fake browser (`wxt/testing/fake-browser`,
  which is `@webext-core/fake-browser`), plus happy-dom for the popup: 51 tests,
  including a hostile page title rendered as text and 25 concurrent reports
  that all count.
- Production builds for Chrome (`.output/chrome-mv3`, service worker) and
  Firefox (`.output/firefox-mv3`, event page), checked for `eval`,
  `new Function`, `importScripts` and source maps.
- `wxt zip`: the Chrome Web Store archive, the Firefox archive, and the sources
  archive addons.mozilla.org asks for when code is bundled.
- A CI workflow with actions pinned by commit SHA, read-only permissions,
  `npm ci --ignore-scripts`, type-check, tests, both builds, the manifest check
  and both archives.

## Options

None. The obvious candidates — React or Vue in the popup, a side panel, an
options page — add files without changing the security shape, so they are
additions a reader makes rather than switches here.

## What it fits

- An extension that reads or annotates a known set of sites: a page helper for
  one web application, an internal tool for a company's own domains, a reading
  aid.
- An extension that has to ship to both the Chrome Web Store and
  addons.mozilla.org from one codebase.
- A team that wants the permission list to be a reviewed file with a build
  that enforces it, rather than whatever the manifest ended up containing.

## What it is NOT for

- **An extension that must run on every site** — an ad blocker, a password
  manager, a general-purpose page tool. The check refuses `<all_urls>` by
  design; that is a different extension with a different review.
- **Network interception.** No `declarativeNetRequest`, no `webRequest`.
- **Safari.** Safari needs an Xcode project and a macOS build; WXT can target
  it, this recipe does not.
- **Manifest V2.** Chrome no longer runs it; Firefox still does, but this
  recipe builds V3 for both.
- **A web application.** Use **`nextjs-fullstack-app`** for an application
  with a server, or **`astro-content-site`** for a content site.
- **A desktop application.** Electron is not in this catalog; a Tauri
  blueprint is planned for that project type.
- **Publishing.** `wxt submit` needs store accounts and API credentials; it is
  not wired up, and store listings, icons and screenshots are yours to make.

## Chrome and Firefox are not the same browser

- **Background:** Chrome runs `background.js` as a service worker; Firefox runs
  the same file as an event page (`background.scripts`). Both stop it when idle,
  which is why listeners are registered synchronously and nothing that matters
  lives in memory.
- **Firefox needs an add-on ID** for Manifest V3 and, for new extensions,
  `data_collection_permissions`. The config sets both for the Firefox build
  only: `page-stats@example.invalid` (replace it before submitting) and
  `required: ["none"]`, which is true of this code and has to stay true.
- **WXT builds Manifest V2 for Firefox by default.** The scripts pass `--mv3`.
- **Site access is the user's.** Both browsers let the user withdraw an
  extension's access to a site; the content script then does not run, and no
  report arriving is the expected result, not a bug.

## What CI cannot prove

- **That a browser loads it.** No browser is downloaded; the manifests are
  checked as JSON and the logic against a fake. Load it by hand before relying
  on it: Chrome, `chrome://extensions`, Developer mode, "Load unpacked",
  `.output/chrome-mv3`. Firefox, `about:debugging`, "This Firefox", "Load
  Temporary Add-on", `.output/firefox-mv3/manifest.json`. Then open
  `https://example.com`, open the popup, and see one page counted.
- **That the CSP is accepted.** It is Chrome's documented Manifest V3 default,
  written out; the build asserts the string, the browser decides.
- **Store review.** Both stores review permissions, remote code and the
  listing by hand, and can reject what passes here.
- **Signing.** Chrome signs what the Web Store publishes; Firefox signs through
  addons.mozilla.org, and release Firefox refuses an unsigned extension outside
  temporary loading.
- **The fake browser's fidelity.** `@webext-core/fake-browser` implements
  storage and runtime messaging in memory; it delivers every message with an
  empty sender, which is why the tests pass the sender explicitly.

## Trade-offs made on your behalf

- **WXT, not Plasmo or a hand-rolled Vite config.** WXT has the demand signal
  (406.6k downloads a week on npm) and builds both browsers from one entrypoint
  layout. It is pre-1.0: minor versions can break, so the version is exact.
- **Written file by file, not `wxt init`.** `wxt init` downloads its templates
  from GitHub, which a recipe here may not reach.
- **No UI framework.** The popup is DOM calls. React would add a dependency tree
  and an `innerHTML`-shaped temptation to a page that shows three numbers.
- **A JSON policy, not TypeScript.** The checker is plain Node, so it runs on the
  built output with no build step of its own, on any Node the project supports.
- **`--ignore-scripts` everywhere.** No dependency has an install script today;
  if one ever needs it, the install fails loudly rather than running it
  silently.
- **TypeScript 7.** Nothing here needs a lint plugin that pins an older
  compiler, so the current major is used.

## Cons

- Pre-1.0 framework: an upgrade is a read of WXT's changelog, not a version
  bump.
- The fake browser is not a browser: permissions, CSP enforcement and the
  service worker's lifecycle are untested by CI.
- No icons: both browsers show a default, and both stores require real ones.
- `example.com` is a placeholder site. The first change anybody makes is the
  line in `extension-policy.json`.

## Cost of adoption

About two minutes on a warm npm cache: 35 steps, one install of about 160
packages, no browser download. Needs Node.js 22.12 or newer and npm; a Chrome
or Firefox to load the result by hand.
