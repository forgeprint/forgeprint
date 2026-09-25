# Setup

Creates an Expo SDK 57 app (React Native 0.86) on Expo Router with typed
routes and strict TypeScript, a home screen tested through Expo Router's own
test harness, ESLint on Expo's configuration, a dependency check against the
SDK's own version table, and a static web export plus Hermes bundles for
Android and iOS as the build proof.

Run every step from an empty directory that will hold the project. Each step is
one action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.13 or newer: Metro, the bundler under every Expo command,
refuses anything older. No Android SDK, Xcode, emulator, device or Expo account
is needed for any step here.

`EXPO_NO_TELEMETRY=1` in front of an Expo command turns off the anonymous usage
data the Expo CLI otherwise sends. `EXPO_OFFLINE=1` makes the dependency check
read the version table inside the installed SDK instead of asking Expo's
servers.

1. Scaffold the app from Expo's default template, pinned to the SDK 57 release. `create-expo` is called directly because `create-expo-app` is a shim whose dependency on it is an open range, and `--no-agents-md` stops it writing its own `AGENTS.md`, `CLAUDE.md` and `.claude/settings.json` over the ones this blueprint provides: `EXPO_NO_TELEMETRY=1 npx --yes create-expo@5.0.2 . --template expo-template-default@57.0.27 --no-install --no-agents-md`
   Verify: `grep -q '"expo-router": "~57.0' package.json`

2. Install the template's dependencies: `npm install --no-audit --no-fund`
   Verify: `node -e "require.resolve('expo-router/entry')"`

3. Add the test toolchain. `jest-expo` 57 is built on Jest 29, and Testing Library stays on 13 because Expo Router's `renderRouter` renders synchronously and Testing Library 14 made `render` asynchronous: `npm install --save-dev --save-exact --no-audit --no-fund jest@29.7.0 jest-expo@57.0.5 @testing-library/react-native@13.3.3 react-test-renderer@19.2.3 @types/jest@29.5.14`
   Verify: `npx jest --version`

4. Add ESLint with the configuration Expo publishes for SDK 57. ESLint stays on 9 because the React and import plugins that configuration depends on do not accept 10: `npm install --save-dev --save-exact --no-audit --no-fund eslint@9.39.5 eslint-config-expo@57.0.2`
   Verify: `npx eslint --version`

5. Remove the template's `reset-project` script. It moves `src` aside and writes a blank app, which after the next steps would throw away the tested screen: `npm pkg delete scripts.reset-project`
   Verify: `! grep -q reset-project package.json`

6. Delete the file that script ran: `rm scripts/reset-project.js`
   Verify: `test ! -e scripts/reset-project.js`

7. Add the scripts CI and the next agent run. `typecheck` runs `expo customize tsconfig.json` first because that is what writes the typed-route declarations under `.expo/types` without starting a dev server: `npm pkg set scripts.lint="eslint . --max-warnings 0" scripts.typecheck="expo customize tsconfig.json && tsc --noEmit" scripts.test="jest" scripts.check:deps="expo install --check" scripts.export:web="expo export --platform web --output-dir dist/web" scripts.export:native="expo export --platform android --platform ios --output-dir dist/native"`
   Verify: `npm pkg get scripts.typecheck | grep -q "tsc --noEmit"`

8. Replace `tsconfig.json` with:

   ```json
   {
     "extends": "expo/tsconfig.base",
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noFallthroughCasesInSwitch": true,
       "types": ["jest"],
       "paths": {
         "@/*": ["./src/*"],
         "@/assets/*": ["./assets/*"]
       }
     },
     "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
   }
   ```

   Verify: `node -e "const c=require('./tsconfig.json').compilerOptions; if (!c.strict || !c.noUncheckedIndexedAccess) process.exit(1)"`

9. Create `jest.config.js` with:

   ```javascript
   /** @type {import('jest').Config} */
   module.exports = {
     preset: 'jest-expo',
     // The template's theme imports a stylesheet for the web build. Jest cannot
     // parse CSS, and nothing a test asserts depends on one.
     moduleNameMapper: {
       '\\.css$': '<rootDir>/test/style-stub.js',
     },
   };
   ```

   Verify: `node -e "require('./jest.config.js').moduleNameMapper"`

10. Create `test/style-stub.js` with:

    ```javascript
    // Stands in for every .css import under Jest; see jest.config.js.
    module.exports = {};
    ```

    Verify: `test -f test/style-stub.js`

11. Create `eslint.config.js` with:

    ```javascript
    // The configuration Expo publishes for its own SDK: React, hooks, imports
    // and the Expo-specific rules.
    const { defineConfig } = require('eslint/config');
    const expoConfig = require('eslint-config-expo/flat');

    module.exports = defineConfig([
      expoConfig,
      {
        ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'],
      },
    ]);
    ```

    Verify: `test -f eslint.config.js`

12. The template's copy of this hook sets state inside an effect, which the React hooks rules in Expo's own SDK 57 lint configuration reject, so the template fails its own lint. Replace `src/hooks/use-color-scheme.web.ts` with:

    ```typescript
    import { useSyncExternalStore } from 'react';
    import { useColorScheme as useRNColorScheme } from 'react-native';

    // Nothing to subscribe to: the only change is "hydration has finished".
    const subscribe = () => () => {};

    /**
     * Static rendering writes the HTML on a machine with no colour scheme, so the
     * first render in the browser has to match it ('light') or React reports a
     * hydration mismatch.
     *
     * useSyncExternalStore returns the server snapshot while hydrating and the
     * client snapshot afterwards, without a setState inside an effect.
     */
    export function useColorScheme() {
      const hydrated = useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
      );
      const colorScheme = useRNColorScheme();
      return hydrated ? colorScheme : 'light';
    }
    ```

    Verify: `grep -q useSyncExternalStore src/hooks/use-color-scheme.web.ts`

13. Create `src/features/greeting/greeting.ts` with:

    ```typescript
    /**
     * The rule behind the home screen, with no idea that a screen exists.
     *
     * Keeping it free of React and React Native is what lets it be tested in
     * milliseconds, and what keeps the screen down to wiring.
     */
    export const MAX_NAME_LENGTH = 40;

    export type Greeting =
      | { readonly ok: true; readonly message: string }
      | { readonly ok: false; readonly error: string };

    export function greet(input: string): Greeting {
      const name = input.trim();
      if (name.length === 0) {
        return { ok: false, error: 'Enter a name first.' };
      }
      if (name.length > MAX_NAME_LENGTH) {
        return { ok: false, error: `Keep the name under ${MAX_NAME_LENGTH} characters.` };
      }
      return { ok: true, message: `Hello, ${name}.` };
    }
    ```

    Verify: `test -f src/features/greeting/greeting.ts`

14. Replace `src/app/index.tsx` with:

    ```tsx
    import { Link } from 'expo-router';
    import { useState } from 'react';
    import { Pressable, StyleSheet, TextInput } from 'react-native';
    import { SafeAreaView } from 'react-native-safe-area-context';

    import { ThemedText } from '@/components/themed-text';
    import { ThemedView } from '@/components/themed-view';
    import { MaxContentWidth, Spacing } from '@/constants/theme';
    import { greet, MAX_NAME_LENGTH, type Greeting } from '@/features/greeting/greeting';
    import { useTheme } from '@/hooks/use-theme';

    /**
     * The home route. It owns state and wiring and nothing else: the rule lives
     * in src/features/greeting, where a test can reach it without rendering.
     *
     * Every control has an accessible name, because that is what the tests query
     * by: a test that cannot find the button by its label is a screen reader
     * that cannot either.
     */
    export default function HomeScreen() {
      const theme = useTheme();
      const [name, setName] = useState('');
      const [result, setResult] = useState<Greeting | null>(null);

      return (
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.content}>
            <ThemedText type="title" accessibilityRole="header">
              Greeter
            </ThemedText>

            <TextInput
              accessibilityLabel="Name"
              value={name}
              onChangeText={setName}
              maxLength={MAX_NAME_LENGTH * 2}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => setResult(greet(name))}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}
            >
              <ThemedText type="smallBold">Greet</ThemedText>
            </Pressable>

            {result?.ok === true && <ThemedText>{result.message}</ThemedText>}
            {result?.ok === false && (
              <ThemedText accessibilityRole="alert" themeColor="textSecondary">
                {result.error}
              </ThemedText>
            )}

            <Link href="/explore">
              <ThemedText type="link">Explore</ThemedText>
            </Link>
          </SafeAreaView>
        </ThemedView>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
      },
      content: {
        flex: 1,
        maxWidth: MaxContentWidth,
        paddingHorizontal: Spacing.four,
        gap: Spacing.three,
        justifyContent: 'center',
      },
      input: {
        borderWidth: 1,
        borderRadius: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        fontSize: 16,
      },
      button: {
        alignItems: 'center',
        borderRadius: Spacing.two,
        paddingVertical: Spacing.three,
      },
    });
    ```

    Verify: `grep -q "accessibilityLabel=\"Name\"" src/app/index.tsx`

15. Create `src/__tests__/greeting.test.ts` with:

    ```typescript
    import { greet, MAX_NAME_LENGTH } from '@/features/greeting/greeting';

    describe('greet', () => {
      it('trims the name before greeting', () => {
        expect(greet('  Ada ')).toEqual({ ok: true, message: 'Hello, Ada.' });
      });

      it('refuses a blank name', () => {
        expect(greet('   ')).toEqual({ ok: false, error: 'Enter a name first.' });
      });

      it('refuses a name longer than the limit', () => {
        expect(greet('a'.repeat(MAX_NAME_LENGTH + 1)).ok).toBe(false);
        expect(greet('a'.repeat(MAX_NAME_LENGTH)).ok).toBe(true);
      });
    });
    ```

    Verify: `test -f src/__tests__/greeting.test.ts`

16. Create `src/__tests__/home-screen.test.tsx` with:

    ```tsx
    import { Text } from 'react-native';
    import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

    import HomeScreen from '@/app/index';

    /**
     * These render the real route inside Expo Router's own test harness and drive
     * it the way a person would: by the name a screen reader announces.
     *
     * Everything comes from `expo-router/testing-library`, which re-exports the
     * Testing Library it renders with. Importing `screen` from
     * `@testing-library/react-native` directly works until the two resolve to
     * different copies, and then every query says nothing was rendered.
     *
     * Nothing here needs a device. What these cannot tell you is how the screen
     * looks, scrolls or feels on one; overview.md says what covers that.
     */
    function renderHome() {
      return renderRouter(
        { index: HomeScreen, explore: () => <Text>Explore screen</Text> },
        { initialUrl: '/' },
      );
    }

    describe('home screen', () => {
      it('is the route at /', () => {
        const router = renderHome();
        expect(router.getPathname()).toBe('/');
        expect(screen.getByRole('header', { name: 'Greeter' })).toBeOnTheScreen();
      });

      it('greets the name that was typed', () => {
        renderHome();
        fireEvent.changeText(screen.getByLabelText('Name'), '  Ada  ');
        fireEvent.press(screen.getByRole('button', { name: 'Greet' }));
        expect(screen.getByText('Hello, Ada.')).toBeOnTheScreen();
      });

      it('announces an error instead of greeting nobody', () => {
        renderHome();
        fireEvent.press(screen.getByRole('button', { name: 'Greet' }));
        expect(screen.getByRole('alert')).toHaveTextContent('Enter a name first.');
        expect(screen.queryByText(/^Hello/)).toBeNull();
      });

      it('links to the explore route', () => {
        const router = renderHome();
        fireEvent.press(screen.getByText('Explore'));
        expect(router.getPathname()).toBe('/explore');
        expect(screen.getByText('Explore screen')).toBeOnTheScreen();
      });
    });
    ```

    Verify: `test -f src/__tests__/home-screen.test.tsx`

17. Create `src/__tests__/typed-routes.test.ts` with:

    ```typescript
    import type { Href } from 'expo-router';

    /**
     * This file is checked by the compiler, not by Jest's assertions.
     *
     * With typed routes on, `Href` only accepts paths that exist under src/app.
     * If the generated route types go missing (typedRoutes switched off, or
     * `.expo/types` never generated), `Href` widens to any string, the
     * `@ts-expect-error` below has nothing to expect, and `npm run typecheck`
     * fails. That turns "typed routes are on" into a check.
     */
    const existing: Href = '/explore';

    // @ts-expect-error '/does-not-exist' is not a file under src/app
    const missing: Href = '/does-not-exist';

    describe('typed routes', () => {
      it('are enforced by the compiler, not at run time', () => {
        expect([existing, missing]).toHaveLength(2);
      });
    });
    ```

    Verify: `test -f src/__tests__/typed-routes.test.ts`

18. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    env:
      # The Expo CLI sends anonymous usage data unless this is set.
      EXPO_NO_TELEMETRY: '1'

    jobs:
      check:
        runs-on: ubuntu-latest
        timeout-minutes: 20
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: npm ci --no-audit --no-fund
          # Against the version table inside the installed SDK, not a newer one
          # fetched from Expo's servers halfway through a build.
          - run: npm run check:deps
            env:
              EXPO_OFFLINE: '1'
          - run: npm run lint
          - run: npm run typecheck
          - run: npm test -- --ci
          - run: npm run export:web
          - run: npm run export:native
    ```

    Verify: `test -f .github/workflows/ci.yml`

19. Replace `README.md` with:

    ```markdown
    # Expo app

    An Expo SDK 57 app on Expo Router, with typed routes and strict TypeScript.

    ## Run it

    `npm start`, then press `w` for the browser, or scan the QR code with Expo Go
    on a phone on the same network.

    ## Check it the way CI does

    `npm run check:deps`, `npm run lint`, `npm run typecheck`, `npm test`,
    `npm run export:web`, `npm run export:native`.

    None of these needs a device, an Android SDK, Xcode or an Expo account, and
    none of them proves the app runs on a phone. See `AGENTS.md`.

    ## Licence

    `LICENSE` is the MIT licence the Expo template ships under, naming Expo as
    the copyright holder. Replace it with your own before you publish.
    ```

    Verify: `grep -q "Expo app" README.md`

20. Check that every installed package is the version SDK 57 was released with: `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npm run check:deps`
    Verify: `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npm run check:deps 2>&1 | grep -q "Dependencies are up to date"`

21. Lint with no warnings allowed: `npm run lint`
    Verify: `npm run lint`

22. Type-check, which also generates the typed-route declarations the compiler checks `Href` against: `EXPO_NO_TELEMETRY=1 npm run typecheck`
    Verify: `test -f .expo/types/router.d.ts`

23. Run the tests: `npm test -- --ci`
    Verify: `npm test -- --ci`

24. Export the web build. Static rendering runs every route in Node at build time, so the home screen's heading has to be in the HTML: `EXPO_NO_TELEMETRY=1 npm run export:web`
    Verify: `grep -q "Greeter" dist/web/index.html`

25. Compile the Android and iOS JavaScript bundles to Hermes bytecode. This is what a device build would embed, and it needs neither the Android SDK nor Xcode: `EXPO_NO_TELEMETRY=1 npm run export:native`
    Verify: `ls dist/native/_expo/static/js/android/*.hbc dist/native/_expo/static/js/ios/*.hbc`
