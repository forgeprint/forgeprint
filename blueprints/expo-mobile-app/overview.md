# Expo Mobile App

An Expo SDK 57 app (React Native 0.86) on Expo Router with typed routes and
strict TypeScript, scaffolded from Expo's own default template and then given
what the template leaves out: tests that drive a screen through the router, a
lint that passes, a check that every package matches the SDK, a CI workflow,
and a build proof that needs no device and no account.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run the app on a phone, which
is what `tier: official` means in this catalog and why this is `community`.

## What you get

- Expo's default template at 57.0.27: Expo Router with native tabs, a themed
  component set, the React Compiler, typed routes and static web output.
- A home screen whose rule lives in a plain function (`src/features/greeting`)
  and whose wiring is tested through `expo-router/testing-library`: typing,
  pressing, an announced error and a link to another route, all found by
  accessible role and label.
- A type-check that fails if typed routes stop working, because a test file
  expects a non-existent path to be a compile error.
- `eslint-config-expo` with zero warnings allowed. The template does not pass
  it as shipped; one hook is rewritten so it does.
- `npm run check:deps`: every installed package against the version table
  inside the installed SDK.
- A static web export whose HTML is asserted to contain the home screen, and
  Hermes bytecode bundles for Android and iOS.
- `.github/workflows/ci.yml` running all of the above, with actions pinned by
  commit and Expo's telemetry off.

## What CI cannot prove

Say this plainly, because a green pipeline invites people to read more into it:

- **On-device behaviour.** Gestures, keyboard handling, safe areas on a real
  notch, performance, memory, and every native module's behaviour are
  untested. Jest runs the JavaScript with native modules mocked by `jest-expo`.
- **Native builds.** No `android/` or `ios/` project is generated, compiled or
  signed. The Hermes bundles show the JavaScript compiles for both platforms;
  a native build can still fail on a config plugin, a Gradle or CocoaPods
  problem, or a native dependency.
- **Store submission.** Nothing here touches App Store Connect or Google Play:
  no signing keys, no privacy manifest review, no store listing.
- **What it looks like.** No screenshot or visual regression test exists.

## What you do next for a device build

1. **On a phone, today:** `npm start` and open the QR code in Expo Go for
   SDK 57. Nothing to install on the computer beyond Node.
2. **A development build**, needed as soon as you add a package with native
   code Expo Go does not include: `npx expo run:android` with the Android SDK
   installed, or `npx expo run:ios` on macOS with Xcode. Both generate the
   native projects locally; `npx expo prebuild` does the same without building.
3. **A build to hand to testers or a store:** EAS Build (`eas build`), which
   needs an Expo account, or a local release build from the generated native
   projects with your own signing keys.
4. **Store submission** needs an Apple Developer Program membership and a
   Google Play developer account. Both are paid, and both review the app.

## Options

None. Navigation, styling and state management are the template's choices,
and a variant for each would be three blueprints wearing one name (ADR 0001).

## What it fits

- A mobile app for iOS and Android from one TypeScript codebase, with the web
  as a bonus target rather than the main one.
- A team that knows React and wants the path Expo documents, not a hand-rolled
  React Native setup.
- A project that wants its CI to prove something without a macOS runner, an
  emulator or a paid build service.

## What it is NOT for

- **A web application.** Static web export works, but a site whose users are
  on the web is better served by `nextjs-fullstack-app` or
  `astro-content-site`.
- **An app with a backend.** There is no API, no data, no authentication. Pair
  it with a service blueprint such as `ts-http-service` or `fastapi-service`,
  and keep secrets there: nothing in an app bundle is secret.
- **Heavy native work.** Custom native modules, background processing, or an
  existing native app adding React Native screens. Expo can do some of this
  through development builds and config plugins; this blueprint sets none of
  it up and proves none of it.
- **Games.** React Native renders views, not a game loop.
- **Offline data, push notifications, over-the-air updates, in-app purchases.**
  None is set up, and each brings an account or a native build this recipe
  deliberately avoids.

## Trade-offs made on your behalf

- **The default template, not the blank one.** It is what `create-expo`
  produces with no flags and what Expo's documentation assumes, so it is what
  most readers expect. It also ships example components you will delete, and
  `@expo/ui`, Reanimated and the React Compiler, which you may not want. Its
  tab bar comes from `expo-router/unstable-native-tabs`, an API Expo marks as
  unstable, and its web export includes Expo Router's `/_sitemap` page listing
  every route.
- **`create-expo` pinned, not `create-expo-app`.** The latter is a shim whose
  dependency on the former is `>=5.0.1`, an open range that would move to a new
  major without the recipe changing.
- **Testing Library 13, not 14.** Expo Router's `renderRouter` renders
  synchronously; Testing Library 14 made `render` asynchronous, and the two
  together find nothing. Move to 14 when Expo Router's harness does.
- **ESLint 9, not 10.** The React and import plugins inside
  `eslint-config-expo` 57 declare support up to ESLint 9 only. ESLint 9 is
  marked unsupported on npm, so expect to move when Expo's configuration does.
- **Jest 29.** `jest-expo` 57 is built on it.
- **Offline dependency check.** `EXPO_OFFLINE=1` makes the check use the table
  shipped inside the installed SDK, which is deterministic; Expo's servers can
  carry a newer table with patch releases the offline check does not know.
- **Package versions inside the SDK use `~` ranges**, as the template writes
  them. The committed `package-lock.json` is what makes an install repeatable;
  CI uses `npm ci`.
- **`npm audit` reports 14 moderate advisories** from two roots on the day this
  was written: `decode-uri-component` 0.2.2 under `expo-router` →
  `query-string` 7 (a denial of service on malformed percent-encoding, fixed
  only in an ESM-only release `query-string` 7 cannot load), and `uuid` 7
  under the build-time `xcode` package. Neither can be overridden without
  breaking the package that uses it; both wait on Expo.

## Pros

- The build proof covers all three platforms the manifest names, on a Linux
  runner, with no account.
- Tests query by accessible role and label, so a control a screen reader
  cannot find fails a test.
- Typed routes are checked, not assumed.
- The recipe fixes the template's own lint failure rather than lowering the
  bar.

## Cons

- **Nobody has run it on a phone.** See the notice above.
- **About three SDK releases a year.** The pins here age faster than most
  blueprints' do, and an SDK upgrade touches most of `package.json`.
- **`typecheck` calls `expo customize`**, an unusual name for "generate route
  types"; it is the only command that does so without starting a dev server.
- **The example components are the template's**, not designed for this app,
  and `LICENSE` is the template's MIT licence naming Expo. Replace both.

## Cost of adoption

About ten minutes for the recipe on a warm npm cache, most of it installing
about 1,100 packages and the three exports. Node.js 22.13 or newer is the only
tool; anything older is refused by Metro.
