# Tauri Desktop App — agent context

A Tauri 2 desktop app. Read this before adding a command, a window, a plugin or
anything that loads content into the webview.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app-core/src/lib.rs                  the logic, with no Tauri and no window; unit-tested
src-tauri/src/lib.rs                 IPC commands: thin wrappers around app-core
src-tauri/build.rs                   the list of commands under access control
src-tauri/capabilities/default.json  what the main window may call
src-tauri/tauri.conf.json            the window, the CSP, the bundle
src/commands.ts                      the only module that calls invoke()
src/main.ts                          the page: reads the form, shows the result
src/tauri-policy.test.ts             the security surface, pinned by tests
```

Two trust zones. The webview runs whatever HTML and JavaScript it is given; the
Rust process can touch the file system, the network and everything else the
user can. The IPC commands are the only door between them, and the capability
decides which doors a window can open.

## Rules that are not style preferences

**Logic goes in `app-core`, never in a command.** A `#[tauri::command]`
function takes its arguments, calls `app_core`, and maps the error to a
string. Anything more there can only be tested with the shell built, and the
shell needs WebKitGTK on Linux; logic in `app-core` is tested by a plain
`cargo test` on any machine. `app-core` does not depend on `tauri` — adding
that dependency is how the boundary quietly disappears.

**Every argument from the webview is untrusted input.** A compromised or
injected script in the webview can call any command the capability grants,
with any arguments. Validate in `app-core` — length, characters, ranges, paths
— as you would a request body on a server. A command that takes a path must
refuse one outside the directory it is meant for.

**An error crosses IPC as a message for the user, and nothing else.** The
command returns `Result<T, String>` built from the error's `Display`. Do not
serialize an error type with a source chain, a path or a stack; the webview is
not a log.

**A new command is four edits, and the tests hold them together.** The
function in `src-tauri/src/lib.rs` and its name in `generate_handler!`; the
same name in `build.rs`'s `commands(&[...])`; `allow-<name>` (underscores
become hyphens) in `capabilities/default.json`; and one function in
`src/commands.ts`. `src/tauri-policy.test.ts` fails if `build.rs` and
`generate_handler!` disagree, or if the capability grants anything that is not
one of the app's own commands. Leaving a command out of `build.rs` does not
make it private — it makes it callable from every window without a grant,
which is why the test exists.

**The capability grants nothing from Tauri's core or any plugin.** No
`core:default`: the page does not need window, event, path or app APIs, and
each of those is a command the webview could call. When a feature needs one,
add the single permission it needs (`core:window:allow-set-title`, not
`core:window:default`), update the test in the same change, and say why in the
pull request.

**No plugin without a reason written down.** `shell`, `fs`, `http` and
`opener` each hand the webview a capability the Rust side had, and the policy
test fails on any `tauri-plugin-*` crate or `@tauri-apps/plugin-*` package.
If one is genuinely needed, scope it (an `fs` scope naming one directory, an
`http` scope naming one origin), change the test, and review the scope rather
than the plugin's default permission set.

**The CSP is strict and tested.** `default-src 'self'`, IPC in `connect-src`,
no `object-src`, no `base-uri`, no framing. The page loads nothing remote and
runs no inline script — Vite emits the entry as a file and the CSP would
refuse an inline one. `ipc.localhost` is written without a scheme: CSP matches
it against the page's own scheme, which is `http` on Windows, where Tauri
serves IPC at `http://ipc.localhost`; on macOS and Linux `ipc:` covers it. Do
not add `'unsafe-inline'`, `'unsafe-eval'` or a remote origin to make a
library work; find the library that does not need it.

**Remote content never gets IPC.** Do not add a `remote` block to a
capability, do not point a window at a URL outside the app, and do not turn on
`withGlobalTauri`, which puts the whole API on `window` for any script in the
page. Links to the web open in the user's browser, and that takes a scoped
plugin — see the rule above.

**Text from Rust goes into the page as text.** `textContent`, never
`innerHTML`. The greeting echoes what the user typed; so will most of what a
real app shows.

**Versions are exact.** `=2.11.6` for `tauri`, `=2.6.3` for `tauri-build`,
exact npm versions, and both lock files committed. The Rust crates and the
`@tauri-apps/api` / `@tauri-apps/cli` packages are released together; move them
together, in one change, and read the Tauri changelog for the versions
crossed.

## Commands

- `npm ci` — install the frontend and the Tauri CLI from `package-lock.json`.
- `cargo test` and `cargo clippy --all-targets -- -D warnings` — the core
  crate only (the workspace's `default-members`). No webview needed.
- `npm run typecheck`, `npm test`, `npm run build` — the frontend.
- `npm run tauri dev` — the app, with the frontend on Vite's dev server.
- `cargo test -p app` — the shell's tests: `greet` through the real
  capability on Tauri's mock runtime, and a core command refused.
- `npm run tauri build` — the app and its installers, unsigned.

The shell needs the platform's webview libraries: WebKitGTK 4.1 and friends on
Linux (a one-time install with the system package manager), nothing extra on
Windows 10/11 or macOS beyond Rust's own prerequisites.

## When you are asked to add a command

1. Write the function in `app-core/src/lib.rs` with its own error type and
   unit tests, including the inputs it refuses.
2. Add a `#[tauri::command]` wrapper in `src-tauri/src/lib.rs` and put it in
   `generate_handler!`.
3. Add its name to `commands(&[...])` in `src-tauri/build.rs`.
4. Add `allow-<name>` to `src-tauri/capabilities/default.json`.
5. Add one function to `src/commands.ts`, and a test in
   `src/commands.test.ts` that pins the command name and argument names — a
   renamed Rust argument is otherwise a runtime error nobody sees until they
   click.
6. `cargo test`, `npm test`, and `cargo test -p app` where the shell builds.

## When you are asked to add a window

Give it a label in `tauri.conf.json`. It gets no capability until one names
it: add it to an existing capability's `windows` only if it should call the
same commands, otherwise write a new capability file with only what it needs,
and extend `src/tauri-policy.test.ts` to pin that file too.

## Not here yet

Signing, notarization, installers in CI and the updater are not set up; see
`overview.md`. Do not add the updater plugin without a signing key kept
outside the repository and an update endpoint you control.
