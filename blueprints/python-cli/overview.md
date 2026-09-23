# Python CLI

A command-line tool in Python on Typer, with the commands tested through the
real parser and a module that runs with `python -m app`.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has built a real tool on it first,
which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- The script that grew flags. Python is where most of those start, and Typer
  turns the annotations you already wrote into a parser.
- An internal tool around something that exists: a migration runner, a data
  loader, a report generator.
- A team already writing Python that does not want its one command-line tool to
  be the only Node project in the repository.
- Learning where the seams go. The layering is the lesson: the work in one
  module, the parsing in another, the entry point doing nothing.

## What it is NOT for

- **Publishing to PyPI.** No `pyproject.toml` with a build backend, no console
  entry point. Publishing is versioning, provenance and a changelog somebody
  reads; halfway would be worse than not at all.
- **Interactive tools.** No prompts, no spinners. A tool that asks questions
  only works when a human is watching, which makes it useless in a pipeline.
- **Configuration files.** Options and arguments only. The moment a config file
  exists, precedence between file, environment and flag is a real design
  question and it is not answered here.
- **Shell completion.** Typer can install it; this does not.
- **Distribution as a binary.** No PyInstaller, no zipapp. Users need Python.

## Pros

- **The tests drive the parser.** `CliRunner` invokes the real command line —
  argument names, option spellings, exit codes. A test that called `greet()`
  directly would pass while `--shout` was misspelled in the command definition,
  and that is the part of a CLI that actually breaks.
- **The callback is there from the first command**, so adding a second one
  does not silently change the interface of the first. This is the specific
  Typer trap that bites later rather than immediately, and the recipe explains
  it where it happens rather than in a footnote.
- **The recipe checks what a user sees.** It runs the tool, reads its output,
  reads `--help` for the command name, and confirms a bad invocation exits
  non-zero. Not "it imported".
- **Versions pinned**, including the development set, and CI installs from the
  same file the recipe does.
- **One dependency.** Typer, and pytest for the tests.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **`python -m app` is not `mytool`.** Without packaging there is no short
  command name, which is fine for an internal tool and annoying for anything
  people type often. Fixing it means the packaging this blueprint deliberately
  leaves out.
- **Typer's help is rich-formatted** — boxes and colour. It looks good in a
  terminal and it is noisier than plain text when captured into a log.
- **One example command.** You are meant to delete `greet`. If you wanted a
  catalogue of patterns — nested groups, config precedence, completion — this
  is not it.
- **The layering costs a module.** For a thirty-line script, three files is
  more ceremony than it deserves. It pays off at the second command.

## Compared with the alternatives here

- **`node-cli`** — the same shape in TypeScript on Commander, and the same
  three layers. Pick by what the surrounding repository already is; there is no
  other difference worth deciding on.
- **`fastapi-service`** — also Python, but a service rather than a tool. If the
  thing needs to answer HTTP, this is the wrong starting point.
