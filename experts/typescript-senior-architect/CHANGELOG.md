# Changelog

## 1.0.0 — 2026-09-24

The catalog's TypeScript architect, and the second language-specific one
after `dotnet-senior-architect` (ADR 0015).

- Four decisions in writing before code: module format and runtime, the
  TypeScript 7.0 / 6.0 split forced by 7.0 shipping no compiler API, one
  boundary schema library, and the package graph.
- The resolved tsconfig checked with `tsc --showConfig`, for the flags `strict`
  does not include, plus typescript-eslint's `strict-type-checked` rules for
  `any`, `@ts-ignore` and unsafe values.
- Module boundaries enforced by a pinned dependency-cruiser rule set and by
  `"exports"`, with `server-only` for Next.js and the note that a NestJS
  `@Module` is not an import boundary.
- One module format per package; the dual package hazard and the limits of
  `require(esm)` on Node.js 24.
- A schema at every boundary, types derived from it, environment parsed once.
- Promise discipline: no floating promises, timeouts on outbound calls,
  nothing synchronous on a request path.
- Nine refusals and six checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule.
Every tool version was read from its registry or its vendor's page on
2026-09-24. The expert has not been manually verified against a real project —
`provenance: generated` says so (ADR 0011).
