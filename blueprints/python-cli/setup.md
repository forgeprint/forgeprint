# Setup

Creates a command-line tool in Python on Typer, with the commands tested
through the real parser and a module that runs with `python -m`.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.10 or newer.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   typer==0.27.2
   ```

   Verify: `test -f requirements.txt`

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   ```

   Verify: `test -f requirements-dev.txt`

5. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import typer"`

6. Create `app/__init__.py` with:

   ```python

   ```

   Verify: `test -f app/__init__.py`

7. Create `app/greet.py` with:

   ```python
   """What the tool does, with no idea that a command line exists.

   Keeping the work out of the command handler is what makes it testable
   without parsing anything, and what lets the same function be called from
   somewhere else later without dragging Typer along.
   """


   def greet(name: str, *, shout: bool = False) -> str:
       line = f"Hello, {name}."
       return line.upper() if shout else line
   ```

   Verify: `"$(cat python.path)" -c "from app.greet import greet; assert greet('Ada') == 'Hello, Ada.'"`

8. Create `app/cli.py` with:

   ```python
   """The command surface, and nothing else.

   Every handler parses and calls; the work lives in its own module. The
   moment logic is inside a handler it can only be tested by parsing a command
   line, and it can never be called from anywhere else.
   """

   import typer

   from app.greet import greet

   app = typer.Typer(help="An example CLI.", no_args_is_help=True)


   @app.callback()
   def main() -> None:
       """An example CLI.

       The callback is not decoration. A Typer app with exactly one command
       collapses that command to the top level — `tool NAME` instead of
       `tool greet NAME` — and then adding a second command silently changes
       the interface of the first. Declaring a callback keeps this a group
       from the start, and is where a global option like --verbose would go.
       """


   @app.command("greet")
   def greet_command(
       name: str = typer.Argument(..., help="who to greet"),
       shout: bool = typer.Option(False, "--shout", help="in capitals"),
   ) -> None:
       """Greet someone by name."""
       typer.echo(greet(name, shout=shout))
   ```

   Verify: `test -f app/cli.py`

9. Create `app/__main__.py` with:

   ```python
   """The entry point, so the tool runs as `python -m app`.

   Nothing else here: Typer turns an uncaught exception into an exit code and
   a message on stderr, which is what a shell script needs.
   """

   from app.cli import app

   if __name__ == "__main__":
       app()
   ```

   Verify: `test -f app/__main__.py`

10. Create `tests/test_cli.py` with:

    ```python
    """The parser, driven in-process.

    CliRunner invokes the real command line: the argument names, the option
    spellings, the exit codes. A test that called greet() directly would pass
    while --shout was misspelled in the command definition, and that is the
    part of a CLI that actually breaks.
    """

    from typer.testing import CliRunner

    from app.cli import app

    runner = CliRunner()


    def test_greets() -> None:
        result = runner.invoke(app, ["greet", "Ada"])

        assert result.exit_code == 0
        assert result.stdout.strip() == "Hello, Ada."


    def test_shouts_when_asked() -> None:
        result = runner.invoke(app, ["greet", "Ada", "--shout"])

        assert result.exit_code == 0
        assert result.stdout.strip() == "HELLO, ADA."


    def test_refuses_a_missing_argument_instead_of_guessing() -> None:
        # Exit codes are the interface a shell script reads. A tool that
        # returns zero after doing nothing is worse than one that fails.
        result = runner.invoke(app, ["greet"])

        assert result.exit_code != 0
    ```

    Verify: `test -f tests/test_cli.py`

11. Create `pytest.ini` with:

    ```ini
    [pytest]
    testpaths = tests
    ```

    Verify: `test -f pytest.ini`

12. Create `.gitignore` with:

    ```text
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    python.path
    ```

    Verify: `test -f .gitignore`

13. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          # The same file the setup installs from, so CI and a laptop cannot
          # disagree about which versions were tested.
          - run: pip install -r requirements-dev.txt
          - run: python -m pytest -q
    ```

    Verify: `test -f .github/workflows/ci.yml`

14. Create `README.md` with:

    ```markdown
    # example-cli

    A command-line tool on Typer.

    ## Run it

    `python -m app greet Ada`, or `python -m app --help`.

    ## Add a command

    See `AGENTS.md`. The short version: the work goes in its own module, the
    handler only parses and calls it, and the test drives the parser through
    `CliRunner` rather than calling the function.
    ```

    Verify: `test -f README.md`

15. Run the tests: `"$(cat python.path)" -m pytest -q`
    Verify: `"$(cat python.path)" -m pytest -q`

16. Run the tool the way a user would, and read what it printed: `"$(cat python.path)" -m app greet Ada --shout > greeted.txt`
    Verify: `grep -qx "HELLO, ADA." greeted.txt`

17. Confirm the help lists the command and exits zero. A reader sees `--help` first, and so does every script that checks the status code: `"$(cat python.path)" -m app --help > help.txt`
    Verify: `grep -q "greet" help.txt`

18. Confirm a bad invocation fails rather than doing something surprising: `"$(cat python.path)" -m app greet > bad.txt 2>&1; echo "$?" > bad.code`
    Verify: `grep -qv '^0$' bad.code`
