# Angular App — agent context

An Angular 22 single-page application: standalone components, zoneless change
detection, signals for state, one lazily loaded feature, and a production build
per locale. Read this before adding a feature, a request or a piece of text.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/app/app.config.ts        every application-wide provider, in one list
src/app/app.routes.ts        top-level routes; features are loadChildren
src/app/core/api.ts          API_BASE_URL and apiInterceptor: the only way out
src/app/notes/               one feature: routes, store, page, guard, tests
src/locale/messages.*.xlf    translations; messages.xlf is extracted, never edited
angular.json                 locales, budgets, and the lint/test/extract targets
```

## Rules that are not style preferences

**There is no NgModule and no zone.js.** Components are standalone and import
what their template uses. Change detection is zoneless: a component re-renders
when a signal its template reads changes, or on an event Angular dispatched.
Mutating a plain field from a `setTimeout` or a subscription and expecting the
view to follow does not work here — put the value in a `signal()`. Do not add
`zone.js` or `provideZoneChangeDetection` to make an old snippet work.

**Every component is `ChangeDetectionStrategy.OnPush`.** Lint refuses one that
is not. Under zoneless it states what is already true: signals and inputs are
the only reasons a component re-renders.

**Only a store injects `HttpClient`.** Pages read signals and call methods on a
store. Lint refuses `HttpClient` in a `*-page.ts` or in `app.ts`, and refuses
the `fetch` and `XMLHttpRequest` globals everywhere — a request that does not go
through `HttpClient` skips the interceptor.

**Pass the interceptor a path, not a URL.** `http.get('notes')`, never
`http.get('/api/notes')` and never `https://...`. `apiInterceptor` prefixes
`API_BASE_URL`, adds a 10-second deadline, and refuses anything absolute or
anything that climbs out of the API with `..` (including `%2e%2e` and a
backslash, which the browser resolves the same way). The refusal is tested; do
not widen it to make a third-party call work — that call needs its own design.

**A response is checked before it is typed.** `http.get<Note[]>()` is a cast
the runtime never sees. Stores fetch `unknown` and pass it through a parser
(`parseNotes`, `parseNote`), so a signal holds what its type says. A new
endpoint gets a parser and a test that feeds it the wrong shape.

**A feature is lazy, and its state is scoped to it.** Add it to
`app.routes.ts` as `loadChildren: () => import(...)`, and provide its store in
the feature's own route `providers`, not `providedIn: 'root'`. The initial
bundle has an error budget of 350 kB in `angular.json`; an eagerly imported
feature is how it gets spent. Raise the budget only with a reason in the commit.

**Guards are functions, and what they ask is injected.**
`unsavedChangesGuard` decides; `DiscardConfirmation` asks the user. That split
is what lets a test replace the dialog instead of clicking it. A new guard
follows the same shape: a `CanDeactivateFn` or `CanMatchFn`, with anything it
needs from the outside world behind an injectable.

**Every piece of user-visible text has an i18n ID.** In templates,
`i18n="@@someId"`; in TypeScript, `` $localize`:@@someId:Text` ``. Lint refuses
text without one. Then `npm run extract-i18n` and add a `<trans-unit>` with a
`<target>` to every `src/locale/messages.<locale>.xlf`. The production build
refuses a missing translation (`i18nMissingTranslation: error`) and CI compares
the message counts, so a forgotten one fails before it ships. Never reuse an ID
for different text: the translation is keyed by the ID, not the words.

**Text from the API goes through interpolation, never `[innerHTML]`.**
`{{ note.body }}` is escaped by Angular; `[innerHTML]` is sanitized but still
renders markup the API chose, and `bypassSecurityTrust*` turns the sanitizer
off. Neither appears in this project, and a change that needs one needs a
reason in review. There is no Content-Security-Policy here — the host sets
headers — so escaping is the defence that is actually in place.

**Tests use the testing backend, never the network.** `provideHttpClient` with
the real `apiInterceptor`, then `provideHttpClientTesting()`, and
`HttpTestingController.verify()` in `afterEach` — which is also what proves a
refused request was never sent. Route behaviour is tested through
`RouterTestingHarness` with the real `routes`, not by calling components.

## Commands

```
npm start               dev server, source locale (en-US) only
npm test                Vitest in jsdom, once; no browser download
npm run lint            angular-eslint, template accessibility and i18n rules
npm run typecheck       tsc over application and tests
npm run extract-i18n    writes src/locale/messages.xlf
npm run build           production, one folder per locale, budget enforced
```

## Adding a feature

1. `src/app/<feature>/<feature>.routes.ts` exporting its `Routes`, with the
   store in `providers` and a `title` through `$localize`.
2. `<feature>.store.ts`: `@Injectable()` (not root), private `signal` state,
   public `computed` reads, `HttpClient` calls with a relative path and a
   parser.
3. `<feature>-page.ts`: `OnPush`, injects the store, i18n IDs on every text.
4. A `loadChildren` entry in `app.routes.ts`, and a link in `app.html`.
5. Specs for the store (happy path, wrong shape, failed request) and a route
   test in `app.spec.ts`. Then extract, translate, build.

## What this does not do

No server-side rendering or prerendering: the first paint is an empty page
until the bundle runs, and search engines see little. No backend: the API at
`/api` is somebody else's, and in tests it is `HttpTestingController`. No
authentication, no forms library, no end-to-end or browser tests — jsdom does
not lay anything out, so focus order, contrast and visual regressions are not
checked. The translation is British English, chosen because it keeps the
repository in one language; a real second language is the same file with
different targets.
