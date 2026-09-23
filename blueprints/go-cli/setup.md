# Setup

Creates a command-line tool in Go on Cobra, with the commands tested through
the real parser and a binary that builds from a checkout.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Go 1.22 or newer.

1. Start the module: `go mod init example.com/example-cli`
   Verify: `test -f go.mod`

2. Add Cobra at a pinned version: `go get github.com/spf13/cobra@v1.10.2`
   Verify: `grep -q "spf13/cobra v1.10.2" go.mod`

3. Create `internal/greet/greet.go` with:

   ```go
   // Package greet is what the tool does, with no idea that a command line
   // exists. Keeping the work out of the command handler is what makes it
   // testable without parsing anything, and what lets it be called from
   // somewhere else later without dragging Cobra along.
   package greet

   import "strings"

   func Greet(name string, shout bool) string {
   	line := "Hello, " + name + "."
   	if shout {
   		return strings.ToUpper(line)
   	}
   	return line
   }
   ```

   Verify: `test -f internal/greet/greet.go`

4. Create `cmd/root.go` with:

   ```go
   // Package cmd is the command surface, and nothing else. Every handler
   // parses and calls; the work lives in internal/.
   package cmd

   import (
   	"io"

   	"github.com/spf13/cobra"

   	"example.com/example-cli/internal/greet"
   )

   // NewRootCommand builds the whole command tree and takes its output.
   //
   // A constructor rather than a package-level variable, and an io.Writer
   // rather than os.Stdout: a test builds a fresh tree, points it at a
   // buffer, and reads what the tool would have printed. A package-level
   // rootCmd — which is what `cobra-cli init` generates — shares flag state
   // between tests, so the second test sees the first one's --shout.
   func NewRootCommand(out io.Writer) *cobra.Command {
   	root := &cobra.Command{
   		Use:   "example",
   		Short: "An example CLI.",
   		// Cobra prints usage on any returned error by default, which buries
   		// the message under a wall of help text. Errors are reported once, in
   		// main, to stderr.
   		SilenceUsage:  true,
   		SilenceErrors: true,
   	}
   	root.SetOut(out)
   	root.AddCommand(newGreetCommand())
   	return root
   }

   func newGreetCommand() *cobra.Command {
   	var shout bool

   	command := &cobra.Command{
   		Use:   "greet NAME",
   		Short: "Greet someone by name.",
   		// Without this, `greet` with no argument panics on args[0] instead of
   		// telling the user what it wanted.
   		Args: cobra.ExactArgs(1),
   		RunE: func(cmd *cobra.Command, args []string) error {
   			cmd.Println(greet.Greet(args[0], shout))
   			return nil
   		},
   	}
   	command.Flags().BoolVar(&shout, "shout", false, "in capitals")

   	return command
   }
   ```

   Verify: `test -f cmd/root.go`

5. Create `main.go` with:

   ```go
   package main

   import (
   	"fmt"
   	"os"

   	"example.com/example-cli/cmd"
   )

   // The only place that touches the real streams and the only place that
   // decides the exit code. Everything above it is callable from a test.
   func main() {
   	if err := cmd.NewRootCommand(os.Stdout).Execute(); err != nil {
   		fmt.Fprintln(os.Stderr, "error:", err)
   		os.Exit(1)
   	}
   }
   ```

   Verify: `test -f main.go`

6. Create `cmd/greet_test.go` with:

   ```go
   package cmd

   import (
   	"bytes"
   	"strings"
   	"testing"
   )

   // run drives the real command tree: the argument count, the flag spelling,
   // the error. A test that called greet.Greet directly would pass while
   // --shout was misspelled in the flag definition, and that is the part of a
   // CLI that actually breaks.
   func run(t *testing.T, args ...string) (string, error) {
   	t.Helper()

   	var out bytes.Buffer
   	root := NewRootCommand(&out)
   	root.SetArgs(args)
   	err := root.Execute()

   	return strings.TrimSpace(out.String()), err
   }

   func TestGreets(t *testing.T) {
   	got, err := run(t, "greet", "Ada")
   	if err != nil {
   		t.Fatalf("unexpected error: %v", err)
   	}
   	if got != "Hello, Ada." {
   		t.Fatalf("got %q, want %q", got, "Hello, Ada.")
   	}
   }

   func TestShoutsWhenAsked(t *testing.T) {
   	got, err := run(t, "greet", "Ada", "--shout")
   	if err != nil {
   		t.Fatalf("unexpected error: %v", err)
   	}
   	if got != "HELLO, ADA." {
   		t.Fatalf("got %q, want %q", got, "HELLO, ADA.")
   	}
   }

   func TestRefusesAMissingArgument(t *testing.T) {
   	// Exit codes are the interface a shell script reads. A tool that
   	// succeeds after doing nothing is worse than one that fails.
   	if _, err := run(t, "greet"); err == nil {
   		t.Fatal("expected an error for a missing argument")
   	}
   }
   ```

   Verify: `test -f cmd/greet_test.go`

7. Create `.gitignore` with:

   ```text
   example
   example.exe
   /dist/
   ```

   Verify: `test -f .gitignore`

8. Create `.github/workflows/ci.yml` with:

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
         - uses: actions/setup-go@d35c59abb061a4a6fb18e82ac0862c26744d6ab5 # v5.5.0
           with:
             go-version: '1.22'
         - run: go build ./...
         - run: go vet ./...
         - run: go test ./...
   ```

   Verify: `test -f .github/workflows/ci.yml`

9. Create `README.md` with:

   ```markdown
   # example-cli

   A command-line tool on Cobra.

   ## Run it from a checkout

   `go run . greet Ada`, or `go build -o example . && ./example --help`.

   ## Add a command

   See `AGENTS.md`. The short version: the work goes in `internal/`, the
   handler only parses and calls it, and the test drives the command tree
   rather than the function.
   ```

   Verify: `test -f README.md`

10. Tidy the module so the checked-in files match what is imported: `go mod tidy`
    Verify: `test -f go.sum`

11. Build it: `go build ./...`
    Verify: `go build ./...`

12. Check it for the mistakes the compiler allows: `go vet ./...`
    Verify: `go vet ./...`

13. Run the tests: `go test ./...`
    Verify: `go test ./...`

14. Run the tool the way a user would, and read what it printed: `go run . greet Ada --shout > greeted.txt`
    Verify: `grep -qx "HELLO, ADA." greeted.txt`

15. Confirm the help lists the command and exits zero. A reader sees `--help` first, and so does every script that checks the status code: `go run . --help > help.txt`
    Verify: `grep -q "greet" help.txt`

16. Confirm a bad invocation fails rather than doing something surprising: `go run . greet > bad.txt 2>&1; echo "$?" > bad.code`
    Verify: `grep -qv '^0$' bad.code`
