# Bundle budget

A budget is a number in the repository and a command that fails when the build
exceeds it. Anything else is an intention.

| #   | Check                                                                                               | How                                                       | Source         |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------- |
| BB1 | A budget exists in the repository as numbers, per route or entry, for compressed JavaScript and CSS | the file exists and has a number per entry                | Budgets 101    |
| BB2 | A command measures the **build output** against it and exits non-zero on excess                     | run it; then exceed the budget on purpose and see it fail | Budgets 101    |
| BB3 | That command runs wherever the project gates a merge, not only on request                           | read the scripts or the workflow that gate                | Budgets 101    |
| BB4 | The number measured is the compressed size, because that is what crosses the network                | read the command                                          | Budgets 101    |
| BB5 | A pull request that adds a dependency states its compressed size on the routes that load it         | read the pull request                                     | Budgets 101    |
| BB6 | Every increase to a budget carries a written reason                                                 | `git log -p` on the budget file                           | Budgets 101    |
| BB7 | Code not needed for the initial route is loaded on demand, not shipped with it                      | read the entry's static imports for whole features        | Code splitting |

## Commands

A total is a sanity check, not a budget; the budget is per route. Adjust `dist`
and the extensions to the project's build output.

```sh
# BB4 — compressed bytes of all built JavaScript, as one number
find dist -name '*.js' -exec cat {} + | gzip -9 | wc -c

# BB6 — every change to the budget, with its commit message
git log -p -- <budget-file>
```

Whatever tool the project uses for BB2 — a bundler plugin, a size checker, or a
short script over `gzip` — the check is the same: it reads built files, compares
against the committed numbers, and its exit code gates.

## Why each one

**BB2's second half is the one people skip.** A budget check that has never been
seen to fail may not be able to. Exceed it once, on purpose, and watch the exit
code.

**BB6** is what stops a budget from ratcheting. Without a reason on each
increase, the budget moves up every time it is hit and stops measuring
anything; with one, the increase is a decision somebody can revisit.

**BB7** is where most of the weight comes from in practice: a whole feature,
imported statically at the entry, shipped to every user whether they reach it
or not.
