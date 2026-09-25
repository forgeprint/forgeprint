# Setup

Creates a Tauri 2 desktop app: a Rust library crate that holds the logic and
its tests, a Tauri shell that exposes that logic as one IPC command behind a
capability, and a TypeScript frontend built with Vite and tested with Vitest.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Rust 1.85 or newer through rustup, with the rustfmt and clippy
components, and Node.js 22.12 or newer with npm. No toolchain file is written:
it would make rustup download a toolchain in the middle of the recipe.

**This recipe does not compile the desktop shell.** On Linux the shell links
against WebKitGTK and its libraries, which come from the system package
manager and need administrator rights to install; a recipe here may not ask
for them. The recipe writes the shell, formats it, resolves its whole
dependency graph into `Cargo.lock`, and checks its configuration against
Tauri's own schema and against the tests below. The generated CI workflow is
what builds it, on Linux, Windows and macOS. `overview.md` says what that
leaves unproven.

1. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Create `package.json` with:

   ```json
   {
     "name": "example",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": ">=22.12.0"
     },
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "typecheck": "tsc",
       "test": "vitest run",
       "tauri": "tauri"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "dependencies": {
       "@tauri-apps/api": "2.11.1"
     },
     "devDependencies": {
       "@tauri-apps/cli": "2.11.5",
       "@types/node": "22.20.4",
       "typescript": "6.0.3",
       "vite": "8.3.1",
       "vitest": "5.0.1"
     }
   }
   ```

   Verify: `test -f package.json`

2. Install the pinned dependencies. This writes `package-lock.json`, which is committed and is what CI installs from: `npm install --no-audit --no-fund`
   Verify: `npm ls @tauri-apps/api @tauri-apps/cli vite vitest --depth=0`

3. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2022",
       "lib": ["dom", "dom.iterable", "es2023"],
       "module": "esnext",
       "moduleResolution": "bundler",
       "verbatimModuleSyntax": true,
       "allowImportingTsExtensions": true,
       "noEmit": true,
       "strict": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "skipLibCheck": true,
       "types": ["vite/client", "node"]
     },
     "include": ["src", "vite.config.ts"]
   }
   ```

   Verify: `test -f tsconfig.json`

4. Create `index.html` with:

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>example</title>
     </head>
     <body>
       <main>
         <h1>example</h1>
         <form id="greet-form">
           <label for="greet-name">Name</label>
           <input id="greet-name" name="name" autocomplete="off" maxlength="64" required />
           <button type="submit">Greet</button>
         </form>
         <output id="greet-output" for="greet-name" aria-live="polite"></output>
       </main>
       <script type="module" src="/src/main.ts"></script>
     </body>
   </html>
   ```

   Verify: `test -f index.html`

5. Create `src/styles.css` with:

   ```css
   :root {
     font-family: system-ui, sans-serif;
     color-scheme: light dark;
   }

   main {
     max-width: 32rem;
     margin: 3rem auto;
     padding: 0 1rem;
   }

   form {
     display: flex;
     gap: 0.5rem;
     align-items: center;
   }
   ```

   Verify: `test -f src/styles.css`

6. Create `src/commands.ts` with:

   ```typescript
   import { invoke } from '@tauri-apps/api/core';

   // The only module that calls into Rust. Every command the shell registers
   // has one function here, so the command's name and the names of its
   // arguments are written down once on this side, and a test can pin them.

   /** The shape of `invoke`, so a test can pass a fake one. */
   export type Call = <T>(command: string, args: Record<string, unknown>) => Promise<T>;

   export type Greeting =
     | { readonly ok: true; readonly text: string }
     | { readonly ok: false; readonly message: string };

   /**
    * Ask the Rust side for a greeting.
    *
    * A Rust command that returns `Err` rejects the promise with the error it
    * serialized — here the message string built by `app-core`. Anything else
    * that rejects (no Tauri runtime, a denied command) is not a message meant
    * for the user, so it is not shown to them.
    */
   export async function greet(name: string, call: Call = invoke): Promise<Greeting> {
     try {
       return { ok: true, text: await call<string>('greet', { name }) };
     } catch (error) {
       return {
         ok: false,
         message: typeof error === 'string' ? error : 'The greeting could not be made.',
       };
     }
   }
   ```

   Verify: `test -f src/commands.ts`

7. Create `src/main.ts` with:

   ```typescript
   import { greet } from './commands.ts';
   import './styles.css';

   const form = document.querySelector<HTMLFormElement>('#greet-form');
   const input = document.querySelector<HTMLInputElement>('#greet-name');
   const output = document.querySelector<HTMLOutputElement>('#greet-output');
   if (form === null || input === null || output === null) {
     throw new Error('index.html is missing the greeting form');
   }

   form.addEventListener('submit', (event) => {
     event.preventDefault();
     void greet(input.value).then((result) => {
       // textContent, never innerHTML: the greeting echoes what the user typed.
       output.textContent = result.ok ? result.text : result.message;
     });
   });
   ```

   Verify: `test -f src/main.ts`

8. Create `vite.config.ts` with:

   ```typescript
   import { defineConfig } from 'vitest/config';

   // Set by the Tauri CLI while it runs beforeDevCommand and beforeBuildCommand.
   const platform = process.env.TAURI_ENV_PLATFORM;

   export default defineConfig({
     // Tauri prints the Rust build to the same terminal; a cleared screen hides it.
     clearScreen: false,
     server: {
       // tauri.conf.json's devUrl names this port. With strictPort a taken port
       // is an error rather than a silent move to a port the window never loads.
       port: 1420,
       strictPort: true,
       watch: { ignored: ['**/src-tauri/**', '**/app-core/**', '**/target/**'] },
     },
     build: {
       // The webview is the operating system's: WebView2 (Chromium) on Windows,
       // WebKit on macOS and Linux. The oldest of each that Tauri 2 supports.
       target: platform === 'windows' ? 'chrome105' : 'safari13',
       // A source map in the bundle ships the original source inside the app.
       sourcemap: false,
     },
     test: {
       environment: 'node',
       include: ['src/**/*.test.ts'],
     },
   });
   ```

   Verify: `test -f vite.config.ts`

9. Create `src/commands.test.ts` with:

   ```typescript
   import { describe, expect, it } from 'vitest';

   import { greet, type Call } from './commands.ts';

   /** A stand-in for invoke that records the call and answers with `answer`. */
   function fake(answer: () => Promise<unknown>): { call: Call; calls: unknown[][] } {
     const calls: unknown[][] = [];
     const call = (<T>(command: string, args: Record<string, unknown>): Promise<T> => {
       calls.push([command, args]);
       return answer() as Promise<T>;
     }) as Call;
     return { call, calls };
   }

   describe('greet', () => {
     it('calls the greet command with the argument name the Rust side declares', async () => {
       const { call, calls } = fake(() => Promise.resolve('Hello, Ada.'));

       const result = await greet('Ada', call);

       expect(calls).toEqual([['greet', { name: 'Ada' }]]);
       expect(result).toEqual({ ok: true, text: 'Hello, Ada.' });
     });

     it("shows the Rust side's message when the command returns an error", async () => {
       const { call } = fake(() => Promise.reject('the name is empty'));

       expect(await greet(' ', call)).toEqual({ ok: false, message: 'the name is empty' });
     });

     it('does not show an unexpected failure to the user', async () => {
       const { call } = fake(() => Promise.reject(new Error('command greet not allowed by ACL')));

       expect(await greet('Ada', call)).toEqual({
         ok: false,
         message: 'The greeting could not be made.',
       });
     });
   });
   ```

   Verify: `test -f src/commands.test.ts`

10. Create `Cargo.toml` with:

    ```toml
    [workspace]
    # The shell links against the operating system's webview, which on Linux
    # means WebKitGTK from the system package manager. Leaving it out of
    # default-members keeps a bare `cargo test` and `cargo clippy` to the crate
    # that holds the logic, so they run on any machine with Rust. The shell is
    # built with `npm run tauri build`, or `cargo test -p app` for its tests.
    members = ["app-core", "src-tauri"]
    default-members = ["app-core"]
    resolver = "3"

    [workspace.package]
    version = "0.1.0"
    edition = "2024"
    # The oldest Rust this builds with: the 2024 edition needs 1.85, and so does
    # nothing in the lock file ask for more. The msrv job in CI builds the core
    # crate with exactly this toolchain.
    rust-version = "1.85"
    # Not a library for crates.io. Remove when publishing is a decision.
    publish = false

    [workspace.lints.rust]
    unsafe_code = "forbid"
    ```

    Verify: `grep -q 'default-members = \["app-core"\]' Cargo.toml`

11. Create `app-core/Cargo.toml` with:

    ```toml
    [package]
    name = "app-core"
    description = "What the app does, with no window and no Tauri."
    version.workspace = true
    edition.workspace = true
    rust-version.workspace = true
    publish.workspace = true

    # No dependencies, and in particular no `tauri`: this crate is what builds
    # and tests on a machine without a webview.

    [lints]
    workspace = true
    ```

    Verify: `test -f app-core/Cargo.toml`

12. Create `app-core/src/lib.rs` with:

    ```rust
    //! What the app does, with no idea that a window exists. Every IPC command
    //! in the shell is a thin wrapper around a function here, which is what
    //! makes the logic testable with `cargo test` on any machine.

    use std::fmt;

    /// The longest name accepted, in characters. Input arrives from a webview,
    /// which is to say from whatever script runs in it; a limit is part of
    /// validating it, not a nicety.
    pub const MAX_NAME_CHARS: usize = 64;

    /// Why a name was refused. The `Display` text is what the user sees, so it
    /// says what is wrong and nothing about how the app is built.
    #[derive(Debug, PartialEq, Eq)]
    pub enum GreetError {
        Empty,
        TooLong,
        ControlCharacter,
    }

    impl fmt::Display for GreetError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                Self::Empty => f.write_str("the name is empty"),
                Self::TooLong => write!(f, "the name is longer than {MAX_NAME_CHARS} characters"),
                Self::ControlCharacter => f.write_str("the name contains a control character"),
            }
        }
    }

    impl std::error::Error for GreetError {}

    /// The greeting for `name`, or the reason there is none.
    pub fn greet(name: &str) -> Result<String, GreetError> {
        let name = name.trim();
        if name.is_empty() {
            return Err(GreetError::Empty);
        }
        if name.chars().count() > MAX_NAME_CHARS {
            return Err(GreetError::TooLong);
        }
        if name.chars().any(char::is_control) {
            return Err(GreetError::ControlCharacter);
        }
        Ok(format!("Hello, {name}."))
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[test]
        fn greets_by_name() {
            assert_eq!(greet("Ada").unwrap(), "Hello, Ada.");
        }

        #[test]
        fn trims_the_name() {
            assert_eq!(greet("  Ada \n").unwrap(), "Hello, Ada.");
        }

        #[test]
        fn refuses_a_blank_name() {
            assert_eq!(greet(" \t "), Err(GreetError::Empty));
        }

        #[test]
        fn counts_characters_not_bytes() {
            let longest = "é".repeat(MAX_NAME_CHARS);
            assert!(greet(&longest).is_ok());
            assert_eq!(greet(&format!("{longest}é")), Err(GreetError::TooLong));
        }

        #[test]
        fn refuses_a_control_character() {
            assert_eq!(greet("Ada\u{7}"), Err(GreetError::ControlCharacter));
        }

        #[test]
        fn the_message_says_what_is_wrong() {
            assert_eq!(
                GreetError::TooLong.to_string(),
                "the name is longer than 64 characters"
            );
        }
    }
    ```

    Verify: `test -f app-core/src/lib.rs`

13. Create `src-tauri/Cargo.toml` with:

    ```toml
    [package]
    name = "app"
    description = "The desktop shell: the window, the webview and the IPC commands."
    version.workspace = true
    edition.workspace = true
    rust-version.workspace = true
    publish.workspace = true

    [lib]
    # Not `app`: on Windows a library and a binary with one name collide on
    # their output files.
    name = "app_lib"

    [build-dependencies]
    tauri-build = { version = "=2.6.3", features = [] }

    [dependencies]
    app-core = { path = "../app-core" }
    # `=` is an exact pin. No plugin (shell, fs, http, opener): each one adds
    # commands a capability can grant the webview, and none is needed yet.
    tauri = { version = "=2.11.6", features = [] }

    [dev-dependencies]
    serde_json = "=1.0.151"
    # The mock runtime, for tests that go through the real IPC and ACL path.
    tauri = { version = "=2.11.6", features = ["test"] }

    [lints]
    workspace = true
    ```

    Verify: `grep -q 'tauri = { version = "=2.11.6"' src-tauri/Cargo.toml`

14. Create `src-tauri/build.rs` with:

    ```rust
    fn main() {
        // Listing the app's commands turns on access control for them: a
        // command listed here can only be called from a window whose capability
        // grants `allow-<command>`. Without the list, every registered command
        // is callable from every window. Keep it equal to generate_handler! in
        // src/lib.rs; src/tauri-policy.test.ts fails when they differ.
        tauri_build::try_build(
            tauri_build::Attributes::new()
                .app_manifest(tauri_build::AppManifest::new().commands(&["greet"])),
        )
        .expect("failed to run the Tauri build script");
    }
    ```

    Verify: `test -f src-tauri/build.rs`

15. Create `src-tauri/src/lib.rs` with:

    ```rust
    //! The shell: the IPC commands the webview may call, and the app that
    //! registers them. A command here validates nothing and decides nothing; it
    //! hands its arguments to `app_core` and turns the result into something
    //! that can cross IPC.

    /// Greets through `app_core`. An error crosses to the webview as its
    /// message and nothing else.
    #[tauri::command]
    fn greet(name: &str) -> Result<String, String> {
        app_core::greet(name).map_err(|error| error.to_string())
    }

    /// The commands, on any runtime: the real webview in `run`, the mock one in
    /// the tests below.
    pub fn app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
        builder.invoke_handler(tauri::generate_handler![greet])
    }

    pub fn run() {
        app(tauri::Builder::default())
            .run(tauri::generate_context!())
            .expect("error while running the application");
    }

    #[cfg(test)]
    mod tests {
        use serde_json::{Value, json};
        use tauri::ipc::{CallbackFn, InvokeBody};
        use tauri::test::{INVOKE_KEY, get_ipc_response, mock_builder};
        use tauri::webview::InvokeRequest;
        use tauri::{WebviewUrl, WebviewWindowBuilder};

        /// Invoke `command` from a window labelled `main`, through the real
        /// configuration and the real capability on Tauri's mock runtime: the
        /// access control here is the one the shipped app enforces.
        fn call(command: &str, body: Value) -> Result<Value, Value> {
            let app = super::app(mock_builder())
                .build(tauri::generate_context!())
                .expect("the app builds");
            // The windows in tauri.conf.json are opened when the app runs,
            // which a test does not do. This one takes the same label, and the
            // capability grants by label.
            let window = WebviewWindowBuilder::new(&app, "main", WebviewUrl::default())
                .build()
                .expect("the main window opens on the mock runtime");
            let request = InvokeRequest {
                cmd: command.into(),
                callback: CallbackFn(0),
                error: CallbackFn(1),
                url: "tauri://localhost".parse().expect("a valid URL"),
                body: InvokeBody::Json(body),
                headers: Default::default(),
                invoke_key: INVOKE_KEY.to_string(),
            };
            get_ipc_response(&window, request)
                .map(|response| response.deserialize::<Value>().expect("a JSON response"))
        }

        #[test]
        fn the_main_window_may_call_greet() {
            assert_eq!(
                call("greet", json!({ "name": "Ada" })),
                Ok(json!("Hello, Ada."))
            );
        }

        #[test]
        fn a_refused_name_comes_back_as_its_message() {
            assert_eq!(
                call("greet", json!({ "name": " " })),
                Err(json!("the name is empty"))
            );
        }

        #[test]
        fn a_core_command_the_capability_does_not_grant_is_refused() {
            // core:app:default would allow this. The capability does not.
            assert!(call("plugin:app|version", json!({})).is_err());
        }
    }
    ```

    Verify: `test -f src-tauri/src/lib.rs`

16. Create `src-tauri/src/main.rs` with:

    ```rust
    // No console window behind a release build on Windows. Debug builds keep
    // it, for the logs.
    #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

    fn main() {
        app_lib::run();
    }
    ```

    Verify: `test -f src-tauri/src/main.rs`

17. Create `src-tauri/tauri.conf.json` with:

    ```json
    {
      "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
      "productName": "example",
      "version": "0.1.0",
      "identifier": "com.example.desktop",
      "build": {
        "beforeDevCommand": "npm run dev",
        "devUrl": "http://localhost:1420",
        "beforeBuildCommand": "npm run build",
        "frontendDist": "../dist"
      },
      "app": {
        "withGlobalTauri": false,
        "windows": [
          {
            "label": "main",
            "title": "example",
            "width": 800,
            "height": 600
          }
        ],
        "security": {
          "csp": "default-src 'self'; connect-src ipc: ipc.localhost; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          "freezePrototype": true
        }
      },
      "bundle": {
        "active": true,
        "targets": "all",
        "icon": [
          "icons/32x32.png",
          "icons/128x128.png",
          "icons/128x128@2x.png",
          "icons/icon.icns",
          "icons/icon.ico"
        ]
      }
    }
    ```

    Verify: `test -f src-tauri/tauri.conf.json`

18. Create `src-tauri/capabilities/default.json` with:

    ```json
    {
      "$schema": "../gen/schemas/desktop-schema.json",
      "identifier": "default",
      "description": "What the main window may call: the app's greet command, and nothing from Tauri's core or any plugin.",
      "windows": ["main"],
      "permissions": ["allow-greet"]
    }
    ```

    Verify: `test -f src-tauri/capabilities/default.json`

19. Create `src/tauri-policy.test.ts` with:

    ```typescript
    import { readdirSync, readFileSync } from 'node:fs';
    import { describe, expect, it } from 'vitest';

    // The shell's security surface, held to what this file declares. Tauri
    // enforces a capability at run time; nothing else stops the capability, the
    // CSP or the plugin list from growing one reasonable-looking change at a
    // time. Changing a number here is a decision, made in review.

    const CSP =
      "default-src 'self'; connect-src ipc: ipc.localhost; object-src 'none'; " +
      "base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

    const root = new URL('../', import.meta.url);
    const read = (path: string): string => readFileSync(new URL(path, root), 'utf8');

    interface Capability {
      identifier: string;
      windows: string[];
      permissions: unknown[];
      remote?: unknown;
      webviews?: unknown;
    }

    interface TauriConfig {
      app: {
        withGlobalTauri?: boolean;
        windows: { label?: string }[];
        security: {
          csp?: unknown;
          devCsp?: unknown;
          freezePrototype?: boolean;
          capabilities?: unknown;
          dangerousDisableAssetCspModification?: unknown;
        };
      };
      plugins?: Record<string, unknown>;
    }

    const config = JSON.parse(read('src-tauri/tauri.conf.json')) as TauriConfig;
    const capability = JSON.parse(read('src-tauri/capabilities/default.json')) as Capability;

    /** The comma-separated names inside the first match of `pattern`. */
    function names(source: string, pattern: RegExp): string[] {
      const list = pattern.exec(source)?.[1];
      if (list === undefined) throw new Error(`no match for ${String(pattern)}`);
      return list
        .split(',')
        .map((name) => name.trim().replace(/^"|"$/g, ''))
        .filter((name) => name.length > 0)
        .sort();
    }

    const declared = names(read('src-tauri/build.rs'), /\.commands\(&\[([^\]]*)\]\)/);
    const registered = names(read('src-tauri/src/lib.rs'), /generate_handler!\[([^\]]*)\]/);

    describe('the commands', () => {
      it('build.rs puts every registered command under access control', () => {
        expect(declared).toEqual(registered);
      });
    });

    describe('the capability', () => {
      it('is the only one', () => {
        expect(readdirSync(new URL('src-tauri/capabilities/', root))).toEqual(['default.json']);
      });

      it('applies to the main window and to no remote origin', () => {
        expect(capability.windows).toEqual(['main']);
        expect(capability.webviews).toBeUndefined();
        expect(capability.remote).toBeUndefined();
      });

      it("grants the app's own commands and nothing else", () => {
        const allowed = registered.map((command) => `allow-${command.replaceAll('_', '-')}`);
        expect([...capability.permissions].sort()).toEqual(allowed);
      });
    });

    describe('tauri.conf.json', () => {
      it('sets the content security policy the project was reviewed with', () => {
        expect(config.app.security.csp).toBe(CSP);
        expect(config.app.security.devCsp).toBeUndefined();
      });

      it("keeps Tauri's CSP handling and a frozen prototype", () => {
        expect(config.app.security.dangerousDisableAssetCspModification).toBeUndefined();
        expect(config.app.security.freezePrototype).toBe(true);
      });

      it('does not put the Tauri API on window', () => {
        expect(config.app.withGlobalTauri).toBe(false);
      });

      it('lets every capability file apply, so the test above sees them all', () => {
        expect(config.app.security.capabilities).toBeUndefined();
      });

      it('has one window, the one the capability names', () => {
        expect(config.app.windows.map((window) => window.label)).toEqual(['main']);
      });

      it('configures no plugin', () => {
        expect(config.plugins ?? {}).toEqual({});
      });
    });

    describe('the dependencies', () => {
      it('include no Tauri plugin crate', () => {
        expect(read('Cargo.lock')).not.toMatch(/^name = "tauri-plugin-/m);
      });

      it('include no Tauri plugin package', () => {
        const manifest = JSON.parse(read('package.json')) as {
          dependencies?: Record<string, string>;
        };
        const plugins = Object.keys(manifest.dependencies ?? {}).filter((name) =>
          name.startsWith('@tauri-apps/plugin-'),
        );
        expect(plugins).toEqual([]);
      });
    });
    ```

    Verify: `test -f src/tauri-policy.test.ts`

20. Create `scripts/placeholder-icon.mjs` with:

    ```javascript
    // Writes app-icon.png: a 1024x1024 placeholder, a filled circle on a
    // transparent square. `tauri icon` turns it into every size and format the
    // platforms need. Replace app-icon.png with real artwork and run
    // `npx tauri icon app-icon.png` again; this script is then never needed.
    import { writeFileSync } from 'node:fs';
    import { crc32, deflateSync } from 'node:zlib';

    const size = 1024;
    const radius = size * 0.42;
    const stride = 1 + size * 4;
    const pixels = Buffer.alloc(stride * size);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const at = y * stride + 1 + x * 4;
        const dx = x + 0.5 - size / 2;
        const dy = y + 0.5 - size / 2;
        pixels[at] = 0x24;
        pixels[at + 1] = 0x5e;
        pixels[at + 2] = 0xa8;
        pixels[at + 3] = dx * dx + dy * dy <= radius * radius ? 0xff : 0x00;
      }
    }

    function chunk(type, data) {
      const length = Buffer.alloc(4);
      length.writeUInt32BE(data.length);
      const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
      const checksum = Buffer.alloc(4);
      checksum.writeUInt32BE(crc32(body));
      return Buffer.concat([length, body, checksum]);
    }

    // Width, height, 8 bits per channel, colour type 6 (RGBA), then default
    // compression, filtering and no interlacing.
    const header = Buffer.alloc(13);
    header.writeUInt32BE(size, 0);
    header.writeUInt32BE(size, 4);
    header[8] = 8;
    header[9] = 6;

    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    writeFileSync(
      'app-icon.png',
      Buffer.concat([
        signature,
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(pixels)),
        chunk('IEND', Buffer.alloc(0)),
      ]),
    );
    ```

    Verify: `test -f scripts/placeholder-icon.mjs`

21. Write the placeholder icon: `node scripts/placeholder-icon.mjs`
    Verify: `test -s app-icon.png`

22. Generate the icon set `tauri.conf.json` lists, and the Windows icon the shell's build script needs, with the pinned Tauri CLI: `npx tauri icon app-icon.png`
    Verify: `test -f src-tauri/icons/icon.ico && test -f src-tauri/icons/icon.icns && test -f src-tauri/icons/128x128@2x.png`

23. Create `.gitignore` with:

    ```text
    /node_modules/
    /dist/
    /target/
    # Written by the shell's build script on every build.
    /src-tauri/gen/schemas/
    /src-tauri/permissions/autogenerated/
    ```

    Verify: `test -f .gitignore`

24. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      # The core crate and the frontend. Needs no system library, so it runs on
      # every push in about a minute and fails first.
      check:
        runs-on: ubuntu-24.04
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          # A pinned toolchain, so a new clippy lint arrives as a pull request
          # that moves this number rather than as a red build on a quiet day.
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.98.1'
              components: clippy, rustfmt
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: cargo fmt --all --check
          - run: cargo clippy --locked --all-targets -- -D warnings
          - run: cargo test --locked
          # npm ci, not npm install: the committed lock file is what gets built.
          - run: npm ci
          - run: npm run typecheck
          - run: npm test
          - run: npm run build

      # rust-version in Cargo.toml is a promise; this job keeps it for the core
      # crate. The shell is built with the pinned toolchain below.
      msrv:
        runs-on: ubuntu-24.04
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.85.0'
          - run: cargo test --locked

      # The desktop shell on Linux. WebKitGTK and the libraries Tauri links
      # against come from apt, which needs root: a pinned container is root
      # without anything else in this job being so.
      shell-linux:
        runs-on: ubuntu-24.04
        container:
          image: rust:1.98.1-bookworm@sha256:93ce27a88655056a51dbdd8f5f2d7ddc071c7b0070fb288a37b5a285fc83971e
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - name: Install the system libraries the shell links against
            run: apt-get update && apt-get install --yes --no-install-recommends libwebkit2gtk-4.1-dev libxdo-dev libssl-dev
          - run: rustup component add clippy
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: npm ci
          # The shell embeds dist/ at compile time, so the frontend comes first.
          - run: npm run build
          - run: cargo clippy --locked --package app --all-targets -- -D warnings
          # Through the real capability on Tauri's mock runtime.
          - run: cargo test --locked --package app
          - run: npm run tauri -- build --no-bundle

      # The shell on the other two platforms. Both runners already have what
      # Tauri needs: WebView2 and the MSVC tools on Windows, Xcode's tools on
      # macOS. On a private repository these runners bill at a multiple of
      # Linux minutes; remove one here if it is not a platform you ship to.
      shell:
        strategy:
          fail-fast: false
          matrix:
            os: [windows-2025, macos-15]
        runs-on: ${{ matrix.os }}
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: dtolnay/rust-toolchain@02cb101ec7c40f2c49e1d9714d64511d8e1b74de # v1
            with:
              toolchain: '1.98.1'
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: npm ci
          - run: npm run tauri -- build --no-bundle
    ```

    Verify: `test -f .github/workflows/ci.yml`

25. Create `README.md` with:

    ```markdown
    # example

    A desktop app on Tauri 2: the logic in `app-core/`, the desktop shell in
    `src-tauri/`, the interface in `src/`.

    ## Before the first run

    Building the shell needs your operating system's webview libraries. On
    Linux that is WebKitGTK 4.1 and a few others from your package manager, a
    one-time install with administrator rights; Windows 10 and 11 and macOS
    have what is needed once Rust's own prerequisites are in place. The list
    for each distribution is on Tauri's prerequisites page
    (v2.tauri.app/start/prerequisites).

    ## Commands

    - `npm ci` installs the frontend and the Tauri CLI from the lock file.
    - `npm run tauri dev` starts the app with the frontend on a dev server.
    - `npm run tauri build` builds the app and its installers, unsigned.
    - `cargo test` and `npm test` run the tests that need no webview.
    - `cargo test -p app` runs the shell's tests; it needs the libraries above.

    ## Add a command

    See `AGENTS.md`. The short version: the logic goes in `app-core` with its
    tests, the command in `src-tauri/src/lib.rs` wraps it, its name goes in
    `build.rs` and its `allow-` permission in the capability, and
    `src/commands.ts` gets one function that calls it.
    ```

    Verify: `test -f README.md`

26. Resolve the whole workspace, the shell included, and write the lock file, which is committed: `cargo generate-lockfile`
    Verify: `grep -A1 -x 'name = "tauri"' Cargo.lock | grep -qx 'version = "2.11.6"'`

27. Check the formatting of every crate, the shell included: `cargo fmt --all --check`
    Verify: `cargo fmt --all --check`

28. Check the core crate for the mistakes the compiler allows, with warnings as errors: `cargo clippy --locked --all-targets -- -D warnings`
    Verify: `cargo clippy --locked --all-targets -- -D warnings`

29. Run the core crate's tests against the lock file: `cargo test --locked`
    Verify: `cargo test --locked`

30. Type-check the frontend, its tests and the Vite config: `npm run typecheck`
    Verify: `npm run typecheck`

31. Run the frontend tests: the command contract, and the policy on the capability, the CSP and the plugin list: `npm test`
    Verify: `npm test`

32. Build the frontend the shell embeds: `npm run build`
    Verify: `test -f dist/index.html`

33. Confirm the built page carries no inline script, which the CSP would refuse: `grep -c '<script' dist/index.html`
    Verify: `test -z "$(grep -o '<script>' dist/index.html)"`

34. Load `tauri.conf.json` with the pinned Tauri CLI, which validates it against Tauri's configuration schema and refuses one that does not match: `npm run tauri -- info > tauri-info.txt 2>&1`
    Verify: `grep -q "ipc.localhost" tauri-info.txt`
