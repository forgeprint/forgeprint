# Python CLI — agent context

A command-line tool on Typer. Read this before adding a command.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
app/greet.py        the work, with no idea a command line exists
app/cli.py          the Typer app: the commands, and nothing else
app/__main__.py     the entry point, so `python -m app` works
tests/test_cli.py   the parser, driven in-process by CliRunner
```

## Rules that are not style preferences

**The callback is not decoration.** A Typer app with exactly one command
collapses that command to the top level: `tool Ada` instead of
`tool greet Ada`. Adding a second command later silently changes the interface
of the first, and every script that called it breaks. `@app.callback()` keeps
this a command group from the first command, and is where a global option like
`--verbose` belongs.

**The work does not live in the handler.** A handler parses and calls; the
thing it calls knows nothing about options. Logic inside a handler can only be
tested by parsing a command line, and can never be reused.

**Type the parameters.** Typer builds the parser from the annotations, so
`name: str` is what makes `name` a string argument. An untyped parameter is a
string whatever you meant, and the validation you write in the body happens
after the user already got it wrong.

**Every argument and option needs `help`.** It is the only documentation most
people read, and Typer puts it in `--help` for free. An option with no help
text is invisible.

**Exit codes are the API.** The caller is a shell script. Typer exits non-zero
on a parse error and turns `typer.Exit(code=...)` into whatever you need; a
tool that returns zero after failing is worse than one that crashes.

**`typer.echo`, not `print`.** It handles encoding and the test runner's
capture consistently, and it is what `CliRunner` reads.

## Adding a command

1. Write the work as a plain function in its own module, with type hints.
2. Add the handler to `app/cli.py` with `@app.command("name")`, annotate every
   parameter, and give each one `help`.
3. Add a test that goes through `CliRunner`, not one that calls your function.
   A test that calls the function passes while the option is misspelled in the
   command definition — which is the failure that actually happens.

## What this does not do

No configuration file, no prompts, no progress bars, no colour beyond what
Typer does by default, no shell completion installed, no packaging to PyPI.
Typer supports most of that; each one is a decision a real tool makes once it
knows what it is.

It is not published either: there is no `pyproject.toml` with a build backend
and no entry point. Publishing is versioning, provenance and a changelog
somebody reads, and doing it halfway here would be worse than not doing it.
