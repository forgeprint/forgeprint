# forgeprint

The [Forgeprint](https://github.com/forgeprint/forgeprint) catalog tooling.
Every check that runs in CI is a command here, so a contributor gets the same
answer on a laptop that the pipeline gives on a pull request — by design, not
by luck ([ADR 0002](https://github.com/forgeprint/forgeprint/blob/main/docs/decisions/0002-actions-optional.md)).

```bash
npx forgeprint validate
```

## Commands

| Command                        | What it does                                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forgeprint validate`          | Schema, taxonomy, required files, and the catalog-wide rules: one blueprint per stack + project type + requirements, a CHANGELOG entry per version, generated files that are not stale |
| `forgeprint lint-setup <slug>` | Holds `setup.md` to a script's standards: numbered steps, a verification per step, pinned versions, no privileged or unpinned commands, option guards that resolve                     |
| `forgeprint similarity <slug>` | Duplicate report — tag overlap plus TF-IDF similarity of `AGENTS.md` and `setup.md` against every other blueprint                                                                      |
| `forgeprint build-index`       | Regenerate `docs/index.json`                                                                                                                                                           |
| `forgeprint build-schema`      | Regenerate `schema/manifest.schema.json` from the taxonomy                                                                                                                             |
| `forgeprint build-codeowners`  | Regenerate `.github/CODEOWNERS` from the manifests                                                                                                                                     |

Run them from anywhere inside a Forgeprint checkout; the repository root is
found the way git finds it.

## As a library

The catalog reader, the manifest schema, the setup linter, the option resolver
and the similarity report are all exported, which is what
[`forgeprint-mcp`](https://www.npmjs.com/package/forgeprint-mcp) is built on.

```ts
import { lintSetup, resolveSetupOptions, validateCatalog } from 'forgeprint';
```

`forgeprint/testing` exposes the fixture helpers used by the test suite.

## Licence

PolyForm Shield 1.0.0 — see `LICENSE`. Forgeprint is source-available, not OSI
open source. The blueprints in the catalog are CC BY 4.0.
