# TypeScript Senior Software Architect

## What it changes

An agent working on a TypeScript codebase without this expert writes code that
type-checks. What it does not do is notice that type-checking is the only
thing holding the design together — that types are erased at runtime, that a
folder name enforces nothing, and that a cast on a `fetch` response is a claim
nobody verifies.

This expert moves the architecture into the tools that run:

- **Four decisions in writing first** — module format and runtime, the
  TypeScript 7 / TypeScript 6 split, one schema library, the package graph.
- **A tsconfig checked as resolved**, not as written: the flags outside
  `strict` (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`), and the lint rules that close `any` and
  `@ts-ignore`.
- **A dependency-cruiser rule set that fails the build** — no cycles, a pure
  domain, no dev dependency in production code — and `"exports"` on every
  package so nothing deep-imports another.
- **One module format per package**, with the dual package hazard and
  `require(esm)`'s limits named.
- **A schema at every boundary**, with the static type derived from it and
  `process.env` parsed once at startup.
- **No floating promises**, a timeout on every outbound call, and nothing
  synchronous on a request path.

## What it fits

- Starting a TypeScript service or a pnpm monorepo, before the module format
  and the package graph are fixed.
- Reviewing a Node.js, NestJS or Next.js codebase's structure, or a change that
  adds a package or moves a boundary.
- Upgrading to TypeScript 7.0, where the compiler API gap forces a decision.
- TypeScript 6.0 and 7.0 on Node.js 24 LTS. The rules hold on Node.js 22; the
  `require(esm)` and type-stripping notes assume 24.

## What it does not fit

- **Browser-only front ends.** Component design, state management, rendering
  strategy and bundle size belong to a front-end expert; this one covers the
  module graph and the boundary a front end shares with a server, not the UI.
- **Application security.** Deferred to `security-reviewer` and
  `docs/review-standards.md`. A schema checks the shape of input; it does not
  make a query safe or a token valid.
- **Tests and CI.** `qa-automation-lead` and `devops-platform-engineer`.
- **Deno and Bun specifics.** The compiler and module-graph rules transfer;
  the Node.js runtime checks (`require(esm)`, `--unhandled-rejections`, type
  stripping) do not.
- **A single-file script.** A dependency-cruiser config and a workspace are
  overhead for a tool with one module, and this expert will say so.

## Pros and cons

**In its favour:** every rule names the tool that enforces it and the command
that proves the tool is on. The expert's output is mostly configuration that
keeps working after the conversation ends.

**Against it:** it is written at a moment of churn. TypeScript 7.0 has no
compiler API and 7.1 will ship a different one, so the side-by-side install in
§1 is a transition, not a destination, and this expert will need re-reading
when 7.1 lands. It also prefers ESM firmly, which is the wrong call for a
library whose main consumers are still on CommonJS — and the ADR in §1 is
where a team says so.
