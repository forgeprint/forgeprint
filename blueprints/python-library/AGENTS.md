# Python Library — agent context

A typed, publishable Python library managed with uv. Read this before changing
the public surface, the dependencies or the release.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/example_fairsplit/__init__.py   the public surface: __all__ and nothing else
src/example_fairsplit/_split.py     the implementation, private by its name
src/example_fairsplit/py.typed      the marker that makes the types reach consumers
tests/test_public_api.py            pins __all__, so the surface changes on purpose
tests/test_split.py                 the behaviour, including what is refused
pyproject.toml                      metadata, pinned backend, every tool's config
uv.lock                             every version, direct and transitive
.github/workflows/                  ci on the floor and current Python; release from a tag
```

## Commands

- `uv sync --locked` — the environment, exactly as locked. Never plain
  `uv sync` in CI: `--locked` fails on a stale lockfile instead of rewriting it.
- `uv run --locked ruff format .` then `uv run --locked ruff check .`
- `uv run --locked mypy` — strict, over `src` and `tests`.
- `uv run --locked pytest` — tests, doctests and branch coverage, floor 95%.
- `uv build --no-sources` then `uv run --locked twine check --strict dist/*`.

## Rules that are not style preferences

**`__all__` is the contract.** Whatever it lists is supported; whatever it does
not list is private, however it is spelled. `tests/test_public_api.py` pins the
list and fails if anything public appears in the package namespace without
being in it. Adding a name is a minor version and a promise; removing or
renaming one is a major version.

**Implementation lives in `_`-prefixed modules.** A consumer who imports
`example_fairsplit._split` has been told it is private. That is what lets code
move between modules without a breaking change.

**The `src` layout is load-bearing.** The project root has no importable
package, so a test, a doctest or a consumer check can only import the installed
copy. With a flat layout, `import example_fairsplit` from the root silently
picks up the working tree, and a wheel missing a file still passes every test.

**`py.typed` ships, and the recipe proves it.** Without it every consumer's type
checker treats the package as untyped, and the annotations here help nobody but
this repository. Setup step 25 type-checks a consumer against the wheel alone
and expects the error a typed package produces.

**Money is `Decimal`, never `float`.** `split` checks at run time as well as in
its signature, because a caller without a type checker passes `0.1`, and
`Decimal(0.1)` is not one tenth. Do not "helpfully" accept floats.

**The shares add up. Always.** The remainder is handed out one quantum at a
time; it is never rounded away. `test_the_shares_always_add_up_to_the_amount`
is the invariant, and `test_the_trap_rounding_each_share_loses_a_cent` is the
reason. If either fails, the change is wrong, not the test.

**Runtime dependencies are a cost every consumer pays.** `dependencies` is
empty. Adding one means every project that installs this resolves it against
its own versions; use a lower bound, not an exact pin, for a runtime
dependency. Development tools go in `[dependency-groups]`, pinned exactly, and
never reach a consumer.

**The build backend is pinned exactly.** `uv_build==0.12.18` decides what goes
into the wheel. Upgrade it deliberately, and re-run the wheel checks when you do.

**Publishing happens from a tag, never from a laptop.** The release workflow
checks the tag equals `v` plus the version in `pyproject.toml`, builds in one
job, and publishes in another that alone has `id-token: write`. PyPI verifies
that short-lived token against the workflow and the `pypi` environment. No
PyPI token exists anywhere to leak.

## Before the first release

1. Rename the distribution and the package. `example-fairsplit` is a
   placeholder; a name you do not own fails at the registry.
2. On PyPI, add a trusted publisher (a "pending publisher" for a new project)
   naming this repository, the workflow file `release.yml`, and the
   environment `pypi`.
3. In the repository settings, create the `pypi` environment. Adding a required
   reviewer there means a pushed tag waits for a person before it publishes.

## When you are asked to add a function

1. Write it in a private module with full annotations; mypy is strict.
2. Give it a docstring with an example that runs. `--doctest-modules` checks it.
3. Export it from `__init__.py` and add it to `__all__`, then update
   `tests/test_public_api.py` — that edit is the moment to ask whether it
   should be public at all.
4. Test what it refuses as well as what it returns.
5. Add an `Unreleased` entry to `CHANGELOG.md`.

## What this does not do

No documentation site, no runtime dependencies, no C extension, no
multi-version test runner beyond the CI matrix, no dynamic version from git
tags, no signing beyond what trusted publishing attests. Each is a decision a
real library makes once it knows what it is.
