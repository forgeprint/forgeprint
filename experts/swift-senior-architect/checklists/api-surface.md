# API surface

A published API is a promise. The architect's job is to make the promise small,
and to make breaking it visible before a release rather than in somebody's
build.

| #   | Check                                                                                                              | How                                                                           | Source                          |
| --- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------- |
| AS1 | The public surface is deliberate: every `public` symbol has a client outside the package                           | `grep -rn "public " Sources` against the importing modules                    | SE-0386                         |
| AS2 | Names follow the API design guidelines: clarity at the use site, no abbreviations, arguments that read as a phrase | read the signatures                                                           | Swift API Design Guidelines     |
| AS3 | A type that is part of the promise documents what callers may rely on, and what they may not                       | read the doc comments on public types                                         | Swift API Design Guidelines     |
| AS4 | CI diffs the API against the last release tag: `swift package diagnose-api-breaking-changes <tag>`                 | read the CI job                                                               | `diagnose-api-breaking-changes` |
| AS5 | `-enable-library-evolution` is **off** unless the module ships as a binary somebody else links                     | read the build settings                                                       | SE-0260                         |
| AS6 | Where evolution mode is on, `@frozen` is used on purpose and the reason is written down                            | `grep -rn "@frozen" Sources`                                                  | SE-0260                         |
| AS7 | A client of an evolution-mode library handles future enum cases with `@unknown default`                            | `grep -rn "@unknown default" Sources` against the switches over library enums | SE-0260                         |
| AS8 | A deprecation is announced before it is removed, with the release that removes it named                            | `grep -rn "@available(\*, deprecated" Sources`                                | Swift API Design Guidelines     |

## Why each one

**AS4 is the row with the caveats, and they belong in the review rather than
in a surprise.** The tool compares `package` declarations too, because it has
no access-level filter; it has missed a breaking change to a protocol's default
`associatedtype`; and it has reported a newly defaulted parameter as a break.
So it is a gate that needs a human reading its output, not a green tick — and
that is still better than finding the break in a client's build.

**AS5 is the one most often wrong in the wrong direction.** Library evolution
mode costs performance — layout and field offsets become runtime questions —
and the proposal says libraries shipped inside an app are not meant to use it.
A package compiled into one app does not need an ABI promise to anybody.

**AS7 is what AS5 costs a client.** Turning evolution mode on makes enums
non-frozen, and every exhaustive switch in a client becomes a future compile
error without `@unknown default`. That is the only part of the mode a caller
sees directly, and it should be a decision rather than a discovery.
