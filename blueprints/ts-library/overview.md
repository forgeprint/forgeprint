# TypeScript Library

A publishable TypeScript library: an exports map, type declarations, a test
suite that runs against the built output, and a release workflow that publishes
from a tag with npm provenance and no stored token.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has published a real package from
it first, which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- Extracting something from an application into a package other projects can
  depend on.
- A small, single-purpose library where the interesting decisions are the
  public surface and the release rather than the architecture.
- A team that wants publishing to be a tag rather than somebody's laptop.
- Anyone who has been bitten by a package that shipped its tests, or by an
  `exports` map that forgot the type declarations.

## What it is NOT for

- **Dual ESM and CommonJS.** This is ESM-only. A consumer on CommonJS needs a
  dynamic `import()`. A dual build is a real decision — two output trees, two
  sets of declarations, a conditional exports map — and is not made here.
- **Browser packages.** No bundler, no `browser` field, no tree-shaking
  verification beyond `sideEffects: false`.
- **Monorepos.** One package, one `package.json`. Workspaces change the release
  story entirely.
- **A documentation site.** A README and the declarations.
- **Anything needing a runtime dependency.** The example has none, and the
  moment it does, the `files` field and the tarball check matter more rather
  than less.

## Pros

- **What ships is proved, not assumed.** `npm pack --dry-run` runs in the
  recipe, asserts the type declarations are present, and asserts no source or
  test file is in the tarball. These are the two failures nobody notices until
  a consumer reports them.
- **Publishing is a tag with provenance.** The release workflow uses
  `id-token: write`, so npm verifies against the workflow and the package
  carries a signed statement of which commit built it. No token is stored
  anywhere — which is the thing this catalog's own maintainer learned the hard
  way while releasing it.
- **`prepublishOnly` builds and tests**, so a broken tag cannot publish.
- **CI runs the floor and the current Node**, so `engines` means something.
- **The tests run against `dist/`** — the built JavaScript a consumer gets, not
  the sources.
- **The trap is in the code, and three tests hold it.** See below; it is the
  reason to read this blueprint rather than a template generator.

## The trap it demonstrates

The example is a slugifier, and it is not arbitrary. The usual implementation
normalises with `NFKD` and strips combining marks, which turns `é` into `e` and
looks universal.

It is not. Turkish dotless `ı` has no decomposition, so it survives
normalisation, fails the ASCII filter and becomes a separator: `Çınar` becomes
`c-nar`. German `ß` vanishes. The letters that matter are therefore mapped
explicitly, and three tests cover exactly those cases — so that "simplifying"
the function back to normalise-and-strip, which looks equivalent, fails.

That is what a library blueprint is for: not the folder layout, but the
decision somebody would otherwise get wrong and ship.

## Cons

- **Nobody has published from it.** See the notice above.
- **ESM-only will exclude somebody.** It is the right default in 2026 and it is
  still a decision that costs you CommonJS consumers.
- **No bundler means no minification and no single-file output.** For a library
  this is usually correct; for one intended to be loaded in a browser directly,
  it is not enough.
- **One entry point.** Sub-path exports (`@example/slugify/unicode`) are a
  design worth having and are not shown.
- **The example is tiny.** A real library's hard part is versioning a surface
  over time, and no blueprint can rehearse that.
- **`npm pack --dry-run --json` output shape is npm's, not a standard.** The
  two assertions in the recipe read it with `grep`, which is fine and will need
  attention if npm changes the format.

## Compared with the alternatives here

Nothing else in this catalog is a `lib` blueprint — this is the first. The
closest neighbour is `node-cli`, which shares the language and the build but
solves the opposite problem: a CLI is deliberately `private: true` and never
published, because publishing is exactly the set of decisions this blueprint
takes on.
