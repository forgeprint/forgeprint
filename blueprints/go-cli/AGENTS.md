# Go CLI — agent context

A command-line tool on Cobra. Read this before adding a command.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
internal/greet/greet.go   the work, with no idea a command line exists
cmd/root.go               NewRootCommand(out): the command tree, and nothing else
main.go                   the only file that touches the real streams
cmd/greet_test.go         the command tree, driven in-process
```

## Rules that are not style preferences

**`NewRootCommand` is a constructor, not a package-level `rootCmd`.** This is
the single most important line in the blueprint and it is the opposite of what
`cobra-cli init` generates. A package-level command holds its flag values in
package-level variables, so the second test in a run sees the `--shout` the
first one set. A constructor gives every test a fresh tree, and lets the caller
choose where output goes.

**Commands take an `io.Writer`, and handlers use `cmd.Println`.** Not
`fmt.Println`. Anything that writes to `os.Stdout` directly is invisible to a
test and impossible to redirect.

**The work lives in `internal/`.** A handler parses and calls. Logic inside
`RunE` can only be tested by building a command line, and can never be reused.

**`SilenceUsage` and `SilenceErrors` are both on.** By default Cobra prints the
full help text after any returned error, which buries the message. Errors are
reported once, in `main`, on stderr. Leaving the defaults is why so many Go
tools answer a typo with two screens of usage.

**Declare `Args`.** `cobra.ExactArgs(1)` is what turns a missing argument into
a message instead of a panic on `args[0]`. A command with no `Args` accepts
anything.

**`main` owns the exit code.** `RunE` returns an error; `main` prints it to
stderr and exits non-zero. That split is what makes the tool usable from a
shell script and testable without a subprocess.

## Adding a command

1. Write the work as a plain function in `internal/`, with its own types.
2. Add a `newXCommand()` constructor in `cmd/`, declare `Args`, and register
   every flag with a description.
3. Wire it in `NewRootCommand` with `AddCommand`.
4. Add a test that goes through the tree, not one that calls your function. A
   test that calls the function passes while the flag is misspelled in the
   command definition — which is the failure that actually happens.

## What this does not do

No configuration file, no environment binding, no Viper, no shell completion
installed, no release build, no version stamping via `-ldflags`. Cobra has
hooks for most of it; each one is a decision a real tool makes once it knows
what it is.

The module path is `example.com/example-cli`. Change it before anybody imports
anything, because changing it later is a rename across every file.
