# Module graph

TypeScript has no access modifier for a module. Which file may import which is
decided by a dependency-cruiser rule set that fails the build, or it is not
decided.

| #   | Check                                                                                 | How                                                                           | Source                                       |
| --- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| MG1 | dependency-cruiser is a pinned dev dependency and its config is committed             | `package.json` and `.dependency-cruiser.cjs` exist                            | dependency-cruiser 18.4 — rules reference    |
| MG2 | The rule set forbids circular imports at `error` severity                             | a `to: { circular: true }` rule                                               | dependency-cruiser 18.4 — rules reference    |
| MG3 | The domain folder imports nothing from infrastructure, transport, or `node_modules`   | a `from`/`to` path rule; `npx depcruise --config .dependency-cruiser.cjs src` | dependency-cruiser 18.4 — rules reference    |
| MG4 | Production code does not import dev dependencies                                      | a `dependencyTypes: ['npm-dev']` rule                                         | dependency-cruiser 18.4 — rules reference    |
| MG5 | The cruiser runs in the same script CI runs, and a planted violation turns it red     | read the `check` script; break a rule on a branch                             | dependency-cruiser 18.4 — CLI                |
| MG6 | Every workspace package declares `"exports"`; nothing imports a path it does not list | read each `package.json`; grep for `/src/` in cross-package imports           | Node.js 24 — Packages: `"exports"`           |
| MG7 | No `paths` alias points into another package's source                                 | `npx tsc --showConfig`, read `paths`                                          | Node.js 24 — Packages: subpath imports       |
| MG8 | Next.js: every module that reads a secret or the database imports `server-only`       | `grep -rL "server-only"` over the data-access folder                          | Next.js 16.3 — Server and Client Components  |
| MG9 | NestJS: module boundaries are checked by MG3, not assumed from `@Module` `imports`    | the cruiser config names the Nest feature folders                             | dependency-cruiser 18.4; NestJS 12 — Modules |

## Why each one

**MG5** is what separates an architecture rule from a file in the repository.
A cruiser config that is never run, or that runs with `severity: 'warn'`, will
be green on the day the domain first imports the ORM, and nobody will notice
until the domain cannot be tested without a database.

**MG6** matters in a monorepo more than anywhere else. Without `"exports"`, any
file in any package is importable, so every internal becomes a public API the
day somebody reaches for it.

**MG8** is the Next.js-specific failure: a server module imported by a client
component moves into the browser bundle. `server-only` turns that into a build
error instead of a leak.
