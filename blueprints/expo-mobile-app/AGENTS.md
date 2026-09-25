# Expo Mobile App — agent context

An Expo SDK 57 app (React Native 0.86, React 19.2) on Expo Router, with typed
routes and strict TypeScript. Read this before adding a screen, a dependency or
a native capability.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand or run the app on
> a phone. Treat it as a starting point that works, not as a design somebody has
> shipped.

## The shape

```
src/app/                 routes: every file here is a screen with a URL
src/features/<name>/     the rules a screen uses, with no React in them
src/components/          shared UI (from the Expo template)
src/hooks/               shared hooks; *.web.ts is the web variant
src/constants/theme.ts   colours, spacing, fonts
src/__tests__/           Jest tests, run under jest-expo
test/style-stub.js       stands in for .css imports under Jest
.expo/types/             generated route types, git-ignored
```

## Rules that are not style preferences

**Only routes go in `src/app`.** Expo Router turns every file there into a
screen with a URL, and ships it in the bundle. A test, a helper or a component
placed there becomes a route anybody can open with a deep link. Tests live in
`src/__tests__`, logic in `src/features`, shared UI in `src/components`.

**A screen is wiring; the rule is a function.** `src/app/index.tsx` holds state
and calls `greet()` from `src/features/greeting`. The rule is tested without
rendering anything, and the screen test only proves the wiring. A rule written
inside a component can only be tested by rendering it, which is slower and
tests less.

**Typed routes are on, and the compiler is the check.** `Href` accepts only
paths that exist under `src/app`. After adding or renaming a route, run
`npm run typecheck`: it regenerates `.expo/types/router.d.ts` through
`expo customize tsconfig.json` and then runs `tsc`. Never silence a route error
with `as Href`; that is the broken link the types exist to catch.
`src/__tests__/typed-routes.test.ts` fails the type-check if the route types
ever stop being generated.

**Add native-facing packages with `npx expo install <name>`, not `npm install`.**
It picks the version SDK 57 was released with. Then run
`EXPO_OFFLINE=1 npm run check:deps`, which compares every installed package
against the version table inside the installed `expo` package and fails on a
mismatch. A package outside that table is not checked at all: find out whether
it contains native code before adding it, because Expo Go cannot load native
code it was not built with, and such a package needs a development build.

**Every route renders in Node when the web build is exported.** `app.json` sets
`web.output` to `static`, so `npm run export:web` runs each screen at build
time. Touching `window`, `document` or `localStorage` during render or at module
scope breaks the export; do it in an effect. The first render in the browser
must match the HTML, which is why `use-color-scheme.web.ts` answers `light`
until hydration has finished.

**Platform files come in pairs.** Metro picks `use-color-scheme.web.ts` on web
and `use-color-scheme.ts` elsewhere. Change one and check whether the other
needs the same change; the tests run the native variant only.

**Nothing secret goes in the app.** Any `EXPO_PUBLIC_*` variable is inlined into
the JavaScript bundle, and anything in the bundle can be read by whoever
installs the app. An API key that must stay secret belongs on a server the app
calls. The template's `.gitignore` covers `.env*.local` and signing files
(`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `*.pem`), not `.env`.

**Deep links are input.** `app.json` registers a URL scheme, so every route can
be opened from outside the app with parameters of the sender's choosing. Treat
`useLocalSearchParams()` like a request body: parse it, and never let it decide
what the user is allowed to see.

**Import test helpers from `expo-router/testing-library`.** It re-exports the
Testing Library it renders with. `@testing-library/react-native` is pinned to
13 because Expo Router's `renderRouter` renders synchronously and version 14
made `render` asynchronous; with 14, every query reports that nothing was
rendered. Query by role and label, the way a screen reader finds things.

**Telemetry off.** The Expo CLI sends anonymous usage data unless
`EXPO_NO_TELEMETRY=1` is set. CI sets it; set it in your shell profile too.

## Commands

```
npm start                              dev server; w for web, Expo Go for a phone
EXPO_OFFLINE=1 npm run check:deps      versions against the SDK's own table
npm run lint                           ESLint, eslint-config-expo, no warnings
npm run typecheck                      route types, then tsc --noEmit
npm test                               jest-expo
npm run export:web                     static web build in dist/web
npm run export:native                  Hermes bundles for Android and iOS in dist/native
```

## Adding a screen

1. Create `src/app/<name>.tsx` with a default export. The path is the URL.
2. Put its rules in `src/features/<name>/` and test them there first.
3. Link to it with `<Link href="/<name>">`, then `npm run typecheck`.
4. Add a test in `src/__tests__/` that renders it through `renderRouter` and
   finds its controls by role or label.
5. If it reads the URL, validate what `useLocalSearchParams()` returns.
6. Run `npm run export:web`: if it touches a browser global during render, this
   is where you find out.

## Upgrading the SDK

One SDK at a time. `npx expo install expo@^58.0.0 --fix` moves `expo` and every
package in its table; `jest-expo` and `eslint-config-expo` follow the SDK's
major and are moved by hand. Read the SDK's release notes before running it,
then run every command above. Expo ships about three SDKs a year and supports
only recent ones, so an app that skips several has a harder upgrade.

## What this does not do

No native build: there is no `android/` or `ios/` directory, no signing, no
store listing, and nothing here has run on a device. The Hermes bundles prove
the JavaScript compiles for both platforms and nothing about how it behaves
there. No authentication, no network calls, no storage, no push
notifications, no over-the-air updates. `overview.md` lists what to do next for
each.
