# Node.js CLI — agent context

A command-line tool on Commander. Read this before adding a command.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
src/greet.ts      the work, with no idea a command line exists
src/cli.ts        createProgram(write): the command surface, and nothing else
src/bin.ts        the only file that touches the real streams
src/cli.test.ts   the parser, driven in-process
```

Three layers, and the middle one is the point. `createProgram` takes its output
as a parameter instead of calling `console.log`, so a test reads what the tool
would have printed by passing a function. Everything else follows from that.

## Rules that are not style preferences

**The work does not live in the command handler.** A handler parses and calls;
the thing it calls knows nothing about flags. The moment logic is inside
`.action()`, it can only be tested by parsing a command line, and it can never
be called from anywhere else.

**Nothing prints except `bin.ts`.** A `console.log` inside a command makes that
command untestable and unusable as a library. Take a `write` function, or
return a value.

**`exitOverride()` is not optional.** Without it Commander calls `process.exit`
on a parse error, which inside a test kills the test runner rather than failing
the test. The third test in the suite exists to prove this is still wired.

**Exit codes are the API.** A CLI's caller is a shell script. Zero means it
worked, anything else means it did not, and the message goes to stderr so that
`tool > file` contains output rather than an error.

**Every option needs a description.** `--shout` with no text is invisible in
`--help`, and `--help` is the only documentation most people will read.

## Adding a command

1. Write the work as a plain function in its own module, with its own types.
2. Register the command in `createProgram`, with a description for the command
   and for every option.
3. Add a test that goes through `parse(...)`, not one that calls your function.
   A test that calls the function passes while the flag is misspelled in the
   command definition — which is the failure that actually happens.

## What this does not do

No configuration file, no interactive prompts, no colour, no update check, no
subcommand plugins. Commander does subcommands and this shows one; the rest are
decisions a real tool makes once it knows what it is.

It is also not published to npm. `private: true` is deliberate — publishing is
its own set of decisions (provenance, versioning, a changelog somebody reads)
and belongs to a library blueprint rather than being half-done here.
