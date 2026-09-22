# Changelog — forgeprint-mcp

The MCP server. It installs nothing and runs nothing: every tool returns text,
and blueprint content is data rather than instructions for the agent
(rules 21 and 22).

## 0.2.2 — 2026-09-22

Found by the dogfood test, on the first sentence a first-time user types.

- **`resolve` and `search_blueprints` now accept a taxonomy label where they
  previously demanded the identifier.** "I know C#" reached the resolver as
  `languages: ["C#"]`, the catalog stores `csharp`, and the heaviest criterion
  scored zero: the answer came back as `no_match`, or as a match whose
  reasoning said "written in C#, which you did not list" and had to be
  explained away. Both spellings are understood now, for languages, stack,
  project type, platforms, distribution and requirements, folding case and the
  separators people vary on — never a word, so `db-per-tenant` can never reach
  `per-tenant`.
- A value that matches nothing comes back in `unrecognised_values` instead of
  being scored as a silent zero, and the `no_match` instruction tells the agent
  to check it before reporting that the catalog has nothing.
- The input schemas say so: ids or labels, `["csharp"]` and `["C#"]` alike.

## 0.2.1 — 2026-09-22

- `mcpName` in the package manifest, which is how the official MCP registry
  verifies that this npm package belongs to the server it lists. No behaviour
  changed; the version moves so the published package carries the field.

## 0.2.0 — 2026-09-22

No tool behaviour changed. The version moves with the workspace so that a
report can name one number, and the server now ships against `forgeprint`
0.2.0.

- The catalog the server serves is the one whose recipes are executed in CI:
  all three blueprints are at 1.0.1, verified end to end across every option
  combination.
- `SERVER_VERSION`, which a client reads in the MCP handshake, reported `0.1.0`
  whatever was installed. It now reports the package version, and a test keeps
  the two in step.

## 0.1.1 — 2026-09-22

- Depends on the CLI by its published name, `forgeprint`. `0.1.0` depended on
  `@forgeprint/cli`, which does not exist, so `npx forgeprint-mcp` could not
  install; it is deprecated on npm.

## 0.1.0 — 2026-09-22

First release. Six tools over stdio, with the published catalog index as the
data source and the repository as a fallback.

- `resolve` — a profile in, **one** blueprint out, or the questions to ask
  first. It asks in rounds: what is required before what merely
  discriminates, and only between candidates that are genuinely tied. It never
  returns a second blueprint, and when nothing fits it says so and names the
  closest one and why it does not.
- `search_blueprints`, `get_blueprint` (with options resolved in `setup.md`),
  `compare_blueprints`, `validate_blueprint`, `request_blueprint`.
- `_meta` on every response: `content_is_data`, the catalog it came from, and
  the locale the agent should present in. The catalog itself stays English
  (§9).
