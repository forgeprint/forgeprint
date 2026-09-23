# Node.js CLI

A command-line tool in TypeScript on Commander, with the parsing tested
in-process and a binary that runs from a checkout.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has built a real tool on it first,
which is what `tier: official` means in this catalog and why this is
`community`.

## What it fits

- An internal tool: a script that grew flags and now deserves a real interface.
- The command-line half of a project that already exists — a migration runner,
  a data loader, a one-off that turned out not to be one-off.
- Learning where the seams go in a CLI. The layering here is the whole lesson:
  the work in one place, the flags in another, the streams in a third.
- Anywhere the tool will be called from a shell script, because exit codes and
  stderr are treated as the interface rather than as an afterthought.

## What it is NOT for

- **Publishing to npm.** `private: true`, deliberately. Publishing is
  versioning, provenance and a changelog somebody reads, and doing it halfway
  here would be worse than not doing it.
- **Interactive tools.** No prompts, no spinners, no colour. A tool that asks
  questions is a different design, and one that only works when a human is
  watching.
- **A plugin system.** Commander supports subcommands as separate executables;
  this does not set that up.
- **Configuration files.** Flags and arguments only. The moment a config file
  exists, precedence between file, environment and flag becomes a real design
  question, and it is not answered here.
- **Distribution as a single binary.** No bundler, no `pkg`, no SEA. Users run
  it with Node.

## Pros

- **The tests drive the parser.** `createProgram` takes its output as a
  parameter, so a test reads what the tool would have printed by passing a
  function — no stream capture, no subprocess, no mock. A test that called the
  underlying function instead would pass while the flag was misspelled in the
  command definition, which is the failure that actually happens.
- **One test guards `exitOverride`.** Without it a parse error calls
  `process.exit` and takes the test runner with it. That is a confusing
  afternoon the first time; the test makes it a red line instead.
- **The recipe checks what a user sees.** It runs the tool, reads its output,
  reads `--help` for the command name, and confirms a bad invocation exits
  non-zero. Not "it compiled".
- **Versions pinned**, and CI installs from the same file the recipe does.
- **No dependencies beyond Commander.** The test runner is Node's own.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **Commander 15 is ESM-first**, and this blueprint is `"type": "module"`
  throughout. Dropping it into a CommonJS project is not a copy and paste.
- **TypeScript 7 needs `"types": ["node"]`** spelled out; it no longer picks up
  `@types/node` on its own. The recipe sets it — but it is the kind of thing
  that wastes an hour if you build this from memory instead.
- **One example command.** You are meant to delete `greet`. If you wanted a
  catalogue of patterns — subcommands, config precedence, shell completion —
  this is not it.
- **The layering costs a file.** For a twenty-line tool, three modules is more
  ceremony than the tool deserves. It pays off at the second command, not the
  first.

## Compared with the alternatives here

Nothing else in this catalog is a `cli` blueprint — this is the first. The
nearest comparison is `ts-mcp-server`, which is also TypeScript and also splits
a surface from the transport that carries it; if you are building something for
an agent to call rather than for a person to type, that is the one you want.
