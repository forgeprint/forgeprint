# Python Library

A typed, publishable Python library on uv: a `src` layout, a pinned build
backend, strict mypy, ruff, pytest with doctests and a coverage floor, a
lockfile, a wheel proven to install and type-check in a fresh environment, and
a release workflow that publishes to PyPI from a tag through trusted
publishing, with no stored token.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has published a real package from
it first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- `pyproject.toml` (PEP 621) with `uv_build` pinned exactly, Python 3.13 as
  the floor, the `Typing :: Typed` classifier, and every tool configured in
  one file.
- `src/example_fairsplit/` with a public surface defined by `__all__`, the
  implementation in a private module, and `py.typed`.
- `uv.lock`, so development and CI install the same transitive versions.
- Tests that pin the public surface, test the refusals as well as the results,
  and run the docstring examples.
- A CI workflow on Python 3.13 and 3.14, and a release workflow that builds in
  one job and publishes from another with `id-token: write`.

## What it fits

- Extracting code from an application into a package other projects install.
- A small, typed, pure-Python library where the decisions that matter are the
  public surface, the types and the release, not the architecture.
- A team moving from `setup.py` or a hand-rolled `pip` workflow to uv and a
  lockfile.
- Anyone who has shipped a wheel without `py.typed`, a wheel with the tests in
  it, or a release from a laptop.

## What it is NOT for

- **A command-line tool.** Use `python-cli`: it is built around a parser and a
  `python -m` entry point, and deliberately does not publish.
- **A web service.** Use `fastapi-service`, or `python-mcp-server` for a tool a
  model calls.
- **C or Rust extensions.** `uv_build` builds pure-Python wheels. A compiled
  extension needs a different backend (scikit-build-core, maturin) and a
  wheel-per-platform build matrix.
- **Python older than 3.13.** The floor is a decision; lowering it means
  widening the CI matrix to match.
- **A monorepo of packages.** One distribution, one `pyproject.toml`. uv
  workspaces change the release story.
- **A documentation site.** A README and the docstrings.

## Options

None. The build backend, the type checker and the test runner are one choice
each, because a library's tooling matters less than its surface, and a matrix
of tool choices would test the tools rather than the library.

## Trade-offs made on your behalf

- **uv rather than pip, Poetry, Hatch or PDM.** One tool for the environment,
  the lockfile, the build and the publish. The cost is a dependency on one
  vendor's tool; the `pyproject.toml` stays standard (PEP 621, PEP 735), so
  leaving is a change of commands rather than of files.
- **`uv_build` rather than hatchling or setuptools.** It is the backend uv
  itself generates, it is fast, and it is strict about the `src` layout. It is
  also younger; hatchling is the conservative choice and swapping is two lines.
- **mypy rather than pyright.** mypy installs from PyPI as a Python package;
  pyright's PyPI wrapper fetches a Node runtime on first use, which is a
  download from outside the package registry.
- **`python-downloads = "manual"`.** uv does not fetch an interpreter on its
  own. A missing Python is an error, not a surprise download.
- **Exact pins for development tools, none for consumers.** The lockfile and
  the `==` pins make CI reproducible; `dependencies` is empty, and a runtime
  dependency added later should take a range, because a library that pins
  exactly forces its version on every consumer.
- **A 95% branch-coverage floor.** High enough that untested code is noticed,
  low enough that nobody writes a test to satisfy a number.
- **The version lives in `pyproject.toml` only.** No `__version__`, no version
  derived from git tags. The release checks the tag against it instead.

## Pros

- **What ships is proved, not assumed.** The recipe reads the wheel: `py.typed`
  is in it, nothing outside the package and its metadata is, it installs into
  a throwaway environment and imports from there, and a strict type check
  against the wheel alone sees the types.
- **Publishing is a tag, with no token.** Trusted publishing through OIDC; the
  id-token permission exists only in the publish job, behind an environment.
- **The tag cannot disagree with the version.** The release fails before it
  builds if they differ.
- **The public surface is pinned by a test**, so exporting something is a
  decision somebody made, not an import that leaked.
- **The example is a real trap.** Splitting money by dividing and rounding
  loses a cent; the tests show it and the code does not do it.

## Cons

- **Nobody has published from it.** See the notice above.
- **Python 3.13 or newer.** Current, and still a floor some environments are
  not on.
- **uv is required.** Contributors who only have pip need to install it once.
- **`uv_build` builds pure Python only.** The moment you need a compiled
  extension, the backend changes.
- **The example is small.** A library's hard part is evolving its surface over
  years, and no recipe can rehearse that.

## Cost of adoption

About ten minutes with Python 3.13 and uv already installed; most of it is the
first dependency download. Then rename the package, register a pending
publisher on PyPI, and create the `pypi` environment before the first tag.

## Compared with the alternatives here

- **`python-cli`** — also Python, the opposite decision on publishing. It
  runs from `python -m app`, installs from `requirements.txt` with pip, and has
  no build backend on purpose. This one is nothing but the build, the types
  and the release.
- **`ts-library`** — the same job in TypeScript: a pinned public surface, what
  ships asserted from the artefact, and publishing from a tag with no stored
  token. Pick by the language your consumers write.
