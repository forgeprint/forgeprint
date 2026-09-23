# TypeScript Library — agent context

A publishable TypeScript library. Read this before changing the public surface
or the release.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/index.ts        the public surface, and the only entry point
src/index.test.ts   the tests, which run against the built output
package.json        exports, files, engines — the contract with a consumer
.github/workflows/  ci on the supported Node versions; release from a tag
```

## Rules that are not style preferences

**`exports` is the contract, not `main`.** A consumer can only import what the
map lists. Adding a file to `src/` does not make it importable, and that is the
point: the public surface is a decision, not a side effect of the directory.

**`files` decides what ships.** Everything else in the repository stays out of
the tarball. `npm pack --dry-run` is the only way to know what a consumer
actually receives, and the setup runs it — a library that ships its tests is a
library whose consumers download them forever.

**The tests run against `dist/`, not `src/`.** They exercise the built
JavaScript and the declarations beside it, which is what a consumer gets. A
suite that runs against the sources can pass while the build is broken.

**`engines` is a promise and CI has to keep it.** The workflow runs the floor
and the current release. A library that only tests one version does not know
what its floor is worth.

**Publishing happens from a tag, never from a laptop.** The release workflow
has `id-token: write`, so npm verifies the token against the workflow and the
package carries a signed statement of which commit built it. No npm token is
stored anywhere. `prepublishOnly` builds and tests, so a broken tag cannot
publish.

**Every exported symbol is a support commitment.** Removing one is a major
version. Export the smallest surface that does the job.

## The trap this library exists to demonstrate

`String.prototype.normalize('NFKD')` splits an accented Latin letter into a
base letter and a combining mark, so removing the marks turns `é` into `e`.
Most slugifiers stop there.

It does nothing for letters that are not accented Latin. Turkish dotless `ı`
has no decomposition: it survives NFKD, fails the ASCII filter, and becomes a
separator — `Çınar` turns into `c-nar`. German `ß` disappears entirely.

So the letters that matter are mapped explicitly, before normalisation, and
three tests cover exactly those cases. If somebody later "simplifies" the
function back to normalise-and-strip — which looks equivalent — those three
tests fail. That is what they are for.

The general answer is a transliteration library. The wrong answer is to strip
marks and call the result universal.

## What this does not do

No bundler, no CommonJS build, no browser field, no source maps to original
sources beyond the declaration maps, no benchmark, no documentation site. It is
ESM-only: a consumer on CommonJS needs a dynamic `import()`, and adding a dual
build is a real decision rather than a flag.

The package name is `@example/slugify`. Change it before the first publish; a
scope you do not own fails at the registry rather than at review.
