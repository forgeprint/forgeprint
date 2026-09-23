# Changelog — go-cli

## 1.0.0 — 2026-09-23

First version.

A Go command-line tool on Cobra 1.10, layered so that the work, the command
tree and the streams are three separate things, with tests that drive the real
parser.

**Generated** from
[the catalog plan](../../docs/research/2026-09-23-catalog-plan.md), where `cli`
was the emptiest `project_type` and Cobra — 44.6k stars, and the shape of
`kubectl`, `docker` and `hugo` — was the obvious Go answer. Its recipe runs in
CI like every other and nobody has built a tool on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

The one decision worth arguing about: `NewRootCommand` is a constructor taking
an `io.Writer`, which is **not** what `cobra-cli init` generates. A
package-level `rootCmd` holds its flag values in package-level variables, so
the second test in a run sees the `--shout` the first one set. That is a flake
nobody enjoys diagnosing, and a constructor costs one line to avoid it.

`SilenceUsage` and `SilenceErrors` are both on, so a typo answers with one line
rather than two screens of help text.
