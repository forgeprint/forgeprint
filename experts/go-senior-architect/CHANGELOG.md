# Changelog

## 1.0.0 — 2026-09-24

The catalog's Go architect, a language-specific sibling of
`dotnet-senior-architect` under ADR 0015.

- Four decisions in writing before code: one module or several, the package
  map, the Go version floor, and concurrency ownership.
- Package layout as architecture: `internal/` by default, a `main` that only
  wires, no grab-bag packages, no `replace` in a released module, no `init()`
  doing I/O.
- Toolchain gates pinned with the Go 1.24 `tool` directive: `go vet` in full,
  staticcheck 2026.2, govulncheck 1.8, `go mod tidy -diff`, `go test -race`,
  and golangci-lint 2.14's depguard for import direction.
- Interfaces declared by their consumers; constructors return concrete types.
- Context passed first and never stored, with Gin's `c.Request.Context()` and
  `c.Copy()` rules.
- Errors wrapped with `%w` as a deliberate API choice, matched with
  `errors.Is`, `errors.As` or Go 1.26's `errors.AsType`.
- Goroutines with owners and ends: `errgroup`, `sync.WaitGroup.Go`, graceful
  shutdown, and Go 1.27's `goroutineleak` profile.
- Nine refusals and six checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`), under ADR 0015's per-language rule.
Every version was read from `go.dev` or the Go module proxy on 2026-09-24. The
expert has not been manually verified against a real project —
`provenance: generated` says so (ADR 0011).
