# Setup

Creates a typed Python library that is publishable: a `src` layout, a pinned
build backend, strict type checking, lint and format, tests with doctests and a
coverage floor, a lockfile, and a release workflow that publishes to PyPI from a
tag through trusted publishing.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.13 or newer and uv 0.12.18 or newer, both already installed.
The recipe installs neither: uv is set not to download an interpreter on its
own, so a missing Python fails loudly instead of arriving from somewhere nobody
chose.

1. Create `pyproject.toml` with:

   ```toml
   [project]
   name = "example-fairsplit"
   version = "0.1.0"
   description = "Split an amount of money into parts that add up to it exactly."
   readme = "README.md"
   license = "MIT"
   requires-python = ">=3.13"
   classifiers = [
     "Programming Language :: Python :: 3",
     "Programming Language :: Python :: 3.13",
     "Programming Language :: Python :: 3.14",
     "Typing :: Typed",
   ]
   dependencies = []

   [dependency-groups]
   dev = [
     "mypy==2.3.1",
     "pytest==9.1.1",
     "pytest-cov==7.1.0",
     "ruff==0.16.8",
     "twine==7.0.0",
   ]

   [build-system]
   # Pinned exactly: the backend decides what goes into the wheel, and a
   # backend that moves under you changes the artefact without a commit.
   requires = ["uv_build==0.12.18"]
   build-backend = "uv_build"

   [tool.uv]
   # An interpreter is installed on purpose, not fetched by a sync.
   python-downloads = "manual"

   [tool.pytest.ini_options]
   testpaths = ["src", "tests"]
   addopts = [
     "--import-mode=importlib",
     "--doctest-modules",
     "--strict-markers",
     "--strict-config",
     "--cov=example_fairsplit",
     "--cov-branch",
     "--cov-report=term-missing",
   ]
   xfail_strict = true
   filterwarnings = ["error"]

   [tool.coverage.report]
   fail_under = 95

   [tool.mypy]
   strict = true
   files = ["src", "tests"]

   [tool.ruff]
   target-version = "py313"

   [tool.ruff.lint]
   select = ["E", "W", "F", "I", "B", "UP", "SIM", "RUF", "PT"]
   ```

   Verify: `test -f pyproject.toml`

2. Create `src/example_fairsplit/_split.py` with:

   ```python
   """The implementation. Private by its name: import from ``example_fairsplit``."""

   from decimal import Decimal

   CENT = Decimal("0.01")


   def split(amount: Decimal, parts: int, *, quantum: Decimal = CENT) -> list[Decimal]:
       """Split ``amount`` into ``parts`` shares that add up to it exactly.

       Every share is a whole number of ``quantum``. What is left after dividing
       evenly is handed out one quantum at a time to the first shares, so no two
       shares differ by more than one quantum and the total is never off.

       >>> split(Decimal("100.00"), 3)
       [Decimal('33.34'), Decimal('33.33'), Decimal('33.33')]
       >>> split(Decimal("-0.05"), 2)
       [Decimal('-0.03'), Decimal('-0.02')]
       """
       # Checked at run time as well as by the type checker, because a caller
       # without one passes a float, and Decimal(0.1) is not one tenth: it is
       # 0.1000000000000000055511151231257827021181583404541015625.
       if not isinstance(amount, Decimal):
           raise TypeError(
               f"amount must be a Decimal, not {type(amount).__name__}; "
               "build it from a string, Decimal('0.10'), never from a float"
           )
       if not isinstance(quantum, Decimal) or not quantum.is_finite() or quantum <= 0:
           raise ValueError(f"quantum must be a positive Decimal, not {quantum!r}")
       # bool is a subclass of int, and split(amount, True) is a bug, not one part.
       if isinstance(parts, bool) or not isinstance(parts, int) or parts < 1:
           raise ValueError(f"parts must be a positive int, not {parts!r}")
       if not amount.is_finite():
           raise ValueError(f"amount must be finite, not {amount}")
       if amount % quantum != 0:
           raise ValueError(f"{amount} is not a whole number of {quantum}")

       if amount < 0:
           return [-share for share in split(-amount, parts, quantum=quantum)]

       units = int(amount / quantum)
       base, extra = divmod(units, parts)
       return [(base + 1 if index < extra else base) * quantum for index in range(parts)]
   ```

   Verify: `test -f src/example_fairsplit/_split.py`

3. Create `src/example_fairsplit/__init__.py` with:

   ```python
   """Split an amount of money into parts that add up to it exactly.

   The public surface is what ``__all__`` lists and nothing else. The code lives
   in private modules, so moving it between them is not a breaking change;
   renaming or removing a name listed here is.
   """

   from example_fairsplit._split import split

   __all__ = ["split"]
   ```

   Verify: `test -f src/example_fairsplit/__init__.py`

4. Create the empty marker that tells a type checker this package ships its own types, `src/example_fairsplit/py.typed`, with:

   ```text

   ```

   Verify: `test -f src/example_fairsplit/py.typed`

5. Create `tests/test_split.py` with:

   ```python
   """What split promises, including the inputs it refuses rather than guesses at."""

   from decimal import Decimal

   import pytest

   from example_fairsplit import split


   def test_splits_evenly_when_it_can() -> None:
       assert split(Decimal("9.00"), 3) == [Decimal("3.00")] * 3


   def test_hands_the_remainder_to_the_first_shares() -> None:
       assert split(Decimal("100.00"), 3) == [
           Decimal("33.34"),
           Decimal("33.33"),
           Decimal("33.33"),
       ]


   @pytest.mark.parametrize("amount", ["0.00", "0.01", "0.05", "10.00", "999.99"])
   @pytest.mark.parametrize("parts", [1, 2, 3, 7, 12])
   def test_the_shares_always_add_up_to_the_amount(amount: str, parts: int) -> None:
       shares = split(Decimal(amount), parts)

       assert len(shares) == parts
       assert sum(shares) == Decimal(amount)
       assert max(shares) - min(shares) <= Decimal("0.01")


   def test_the_trap_rounding_each_share_loses_a_cent() -> None:
       # What split exists to replace. Every share is right on its own and the
       # total is wrong, which nobody notices until an invoice does not balance.
       naive = [round(Decimal("100.00") / 3, 2)] * 3

       assert sum(naive) == Decimal("99.99")
       assert sum(split(Decimal("100.00"), 3)) == Decimal("100.00")


   def test_splits_a_negative_amount_as_the_mirror_of_the_positive_one() -> None:
       assert split(Decimal("-0.05"), 2) == [Decimal("-0.03"), Decimal("-0.02")]


   def test_works_in_a_quantum_other_than_a_cent() -> None:
       assert split(Decimal("1.00"), 3, quantum=Decimal("0.05")) == [
           Decimal("0.35"),
           Decimal("0.35"),
           Decimal("0.30"),
       ]


   def test_refuses_a_float() -> None:
       with pytest.raises(TypeError, match="Decimal"):
           split(0.1, 3)  # type: ignore[arg-type]


   @pytest.mark.parametrize("parts", [0, -1, True])
   def test_refuses_parts_that_are_not_a_positive_int(parts: int) -> None:
       with pytest.raises(ValueError, match="parts"):
           split(Decimal("1.00"), parts)


   def test_refuses_an_amount_finer_than_the_quantum() -> None:
       with pytest.raises(ValueError, match="whole number"):
           split(Decimal("10.005"), 2)


   @pytest.mark.parametrize("amount", ["NaN", "Infinity", "-Infinity"])
   def test_refuses_an_amount_that_is_not_finite(amount: str) -> None:
       with pytest.raises(ValueError, match="finite"):
           split(Decimal(amount), 2)


   @pytest.mark.parametrize("quantum", ["0", "-0.01", "NaN"])
   def test_refuses_a_quantum_that_is_not_positive(quantum: str) -> None:
       with pytest.raises(ValueError, match="quantum"):
           split(Decimal("1.00"), 2, quantum=Decimal(quantum))
   ```

   Verify: `test -f tests/test_split.py`

6. Create `tests/test_public_api.py` with:

   ```python
   """The public surface, pinned.

   Adding a name to ``__all__`` is a promise to support it, and removing one is a
   major version. These tests fail on both, so either happens on purpose.
   """

   import example_fairsplit


   def test_the_public_surface_is_exactly_what_all_lists() -> None:
       assert example_fairsplit.__all__ == ["split"]


   def test_nothing_public_is_exported_by_accident() -> None:
       public = {name for name in vars(example_fairsplit) if not name.startswith("_")}

       assert public == set(example_fairsplit.__all__)
   ```

   Verify: `test -f tests/test_public_api.py`

7. Create `README.md` with:

   ```markdown
   # example-fairsplit

   Split an amount of money into parts that add up to it exactly:
   `split(Decimal("100.00"), 3)` returns `33.34`, `33.33` and `33.33`.

   ## Why not divide and round

   Rounding each share on its own is right for every share and wrong for the
   total: three times `round(Decimal("100.00") / 3, 2)` is `99.99`. `split`
   hands the remainder out one cent at a time to the first shares instead.

   It takes a `Decimal` and refuses a `float`, because `Decimal(0.1)` is not one
   tenth.

   ## Releasing

   Bump `version` in `pyproject.toml`, move the `Unreleased` entry in
   `CHANGELOG.md` under that version, then push a tag `vX.Y.Z`. The release
   workflow checks that the tag and the version agree, builds, and publishes to
   PyPI through trusted publishing. No token is stored anywhere.
   ```

   Verify: `test -f README.md`

8. Create `CHANGELOG.md` with:

   ```markdown
   # Changelog

   Every release is recorded here. Versions follow Semantic Versioning: a name
   removed from `__all__` or a changed signature is a major version.

   ## Unreleased

   ## 0.1.0

   First version. `split(amount, parts, *, quantum)`.
   ```

   Verify: `test -f CHANGELOG.md`

9. Create `.gitignore` with:

   ```text
   .venv/
   __pycache__/
   *.pyc
   .pytest_cache/
   .mypy_cache/
   .ruff_cache/
   .coverage
   dist/
   recipe-output/
   ```

   Verify: `test -f .gitignore`

10. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      check:
        runs-on: ubuntu-latest
        strategy:
          matrix:
            # The floor in requires-python and the current release. A library
            # that tests one version does not know what its floor is worth.
            python-version: ['3.13', '3.14']
        env:
          UV_PYTHON: ${{ matrix.python-version }}
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: ${{ matrix.python-version }}
          - uses: astral-sh/setup-uv@c18668ad3cf93ea998bef934396af7bb5c839dc7 # v10.2.0
            with:
              version: '0.12.18'
          # --locked fails if uv.lock is out of date rather than rewriting it,
          # so CI tests the versions that were committed.
          - run: uv sync --locked
          - run: uv run --locked ruff check .
          - run: uv run --locked ruff format --check .
          - run: uv run --locked mypy
          - run: uv run --locked pytest
          - run: uv build --no-sources
          - run: uv run --locked twine check --strict dist/*
    ```

    Verify: `test -f .github/workflows/ci.yml`

11. Create `.github/workflows/release.yml` with:

    ```yaml
    name: release

    on:
      push:
        tags: ['v*']

    permissions: {}

    jobs:
      build:
        runs-on: ubuntu-latest
        permissions:
          contents: read
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          - uses: astral-sh/setup-uv@c18668ad3cf93ea998bef934396af7bb5c839dc7 # v10.2.0
            with:
              version: '0.12.18'
          - run: uv sync --locked
          - run: uv run --locked pytest
          # A tag that disagrees with pyproject.toml would publish a version
          # nobody tagged. Through the environment, so the tag stays a value.
          - name: The tag matches the version
            env:
              TAG: ${{ github.ref_name }}
            run: test "v$(uv version --short)" = "$TAG"
          - run: uv build --no-sources
          - run: uv run --locked twine check --strict dist/*
          - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
            with:
              name: dist
              path: dist/
              if-no-files-found: error

      publish:
        needs: build
        runs-on: ubuntu-latest
        # The environment is what the PyPI trusted publisher is bound to, and
        # where a required reviewer can hold a release.
        environment:
          name: pypi
          url: https://pypi.org/p/example-fairsplit
        permissions:
          # Only this job can mint the short-lived token PyPI verifies against
          # this workflow. The build job never holds it, and no PyPI token is
          # stored anywhere.
          id-token: write
        steps:
          - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
            with:
              name: dist
              path: dist/
          - uses: astral-sh/setup-uv@c18668ad3cf93ea998bef934396af7bb5c839dc7 # v10.2.0
            with:
              version: '0.12.18'
          - run: uv publish --trusted-publishing always
    ```

    Verify: `test -f .github/workflows/release.yml`

12. Create the directory the checks below write their evidence into, which `.gitignore` already leaves out: `mkdir recipe-output`
    Verify: `test -d recipe-output`

13. Resolve every dependency, direct and transitive, into a lockfile: `uv lock`
    Verify: `uv lock --check`

14. Create the environment from the lockfile exactly, with the library itself installed in editable mode: `uv sync --locked`
    Verify: `uv run --locked python -c "import example_fairsplit"`

15. Format the code. The files above are written in the formatter's style, but a copy of this recipe that passed through a Markdown tool can arrive with the blank lines between definitions collapsed, and the formatter restores them rather than failing on them: `uv run --locked ruff format .`
    Verify: `uv run --locked ruff format --check .`

16. Lint: `uv run --locked ruff check .`
    Verify: `uv run --locked ruff check .`

17. Type-check the library and its tests in strict mode: `uv run --locked mypy`
    Verify: `uv run --locked mypy`

18. Confirm the examples in the docstrings are collected as tests. A doctest that is never collected is documentation that has stopped being checked, and nothing says so: `uv run --locked pytest --collect-only -q --no-cov > recipe-output/collected.txt`
    Verify: `grep -q "_split.py::example_fairsplit._split.split" recipe-output/collected.txt`

19. Run the tests and the doctests, with branch coverage: `uv run --locked pytest`
    Verify: `uv run --locked coverage report --fail-under=95`

20. Build the source distribution and the wheel, ignoring any local source overrides so the artefact is what a consumer would build: `uv build --no-sources`
    Verify: `test -f dist/example_fairsplit-0.1.0-py3-none-any.whl`

21. Check both artefacts' metadata the way PyPI will read it: `uv run --locked twine check --strict dist/*`
    Verify: `test -f dist/example_fairsplit-0.1.0.tar.gz`

22. List what the wheel actually contains, read from the archive itself: `uv run --locked python -c "import zipfile; names = zipfile.ZipFile('dist/example_fairsplit-0.1.0-py3-none-any.whl').namelist(); assert names, 'empty wheel'; print('\n'.join(names))" > recipe-output/wheel.txt`
    Verify: `grep -q "^example_fairsplit/py.typed" recipe-output/wheel.txt`

23. Count what the wheel ships outside the package and its metadata. Tests, the lockfile and the recipe's own output belong in the repository, not in every consumer's environment: `uv run --locked python -c "import zipfile; names = zipfile.ZipFile('dist/example_fairsplit-0.1.0-py3-none-any.whl').namelist(); assert names, 'empty wheel'; print(sum(1 for n in names if not n.startswith(('example_fairsplit/', 'example_fairsplit-0.1.0.dist-info/'))))" > recipe-output/stray.count`
    Verify: `grep -qE "^0\s*$" recipe-output/stray.count`

24. Install the wheel into a fresh, throwaway environment with nothing else in it, and use it the way a consumer would. The `src` layout is what makes this honest: the project directory has no `example_fairsplit` folder to import by accident, so the import can only succeed from the installed wheel: `uv run --isolated --no-project --with ./dist/example_fairsplit-0.1.0-py3-none-any.whl python -c "import example_fairsplit as m; from decimal import Decimal; assert 'site-packages' in m.__file__, m.__file__; print(m.split(Decimal('100.00'), 3))" > recipe-output/consumer.txt`
    Verify: `grep -qF "[Decimal('33.34'), Decimal('33.33'), Decimal('33.33')]" recipe-output/consumer.txt`

25. Confirm the types reach a consumer. A strict type check of code that passes a `float`, against the installed wheel alone, must report the wrong argument; without `py.typed` in the wheel it would report a missing stub instead. The empty `--config-file=` keeps the project's own mypy settings out of it, because a consumer does not have them. Exit code 1 is mypy finding the error it was given, and anything else is a failure: `uv run --isolated --no-project --with ./dist/example_fairsplit-0.1.0-py3-none-any.whl --with mypy==2.3.1 mypy --config-file= --strict -c "from example_fairsplit import split; split(0.1, 3)" > recipe-output/consumer-types.txt || test "$?" -eq 1`
    Verify: `grep -q 'incompatible type "float"; expected "Decimal"' recipe-output/consumer-types.txt`

26. Confirm the release workflow's tag check can read the version it compares against: `uv version --short > recipe-output/version.txt`
    Verify: `grep -qE "^0\.1\.0\s*$" recipe-output/version.txt`
