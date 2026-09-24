# Baseline support

Which browser features the UI may rely on, decided once and checked per
feature. Baseline's core browser set is Chrome and Edge, Firefox and Safari,
desktop and mobile. **Newly available** means all of them support it;
**Widely available** means 30 months have passed since then.

| #   | Check                                                                                             | How                                                            | Source                      |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------- |
| BL1 | The target is declared in the targets file: Widely available by default, or a named Baseline year | the file states it                                             | Baseline                    |
| BL2 | The build's browser target — the bundler or transpiler setting — matches the declared Baseline    | read the build configuration                                   | Baseline                    |
| BL3 | Every web platform feature the change introduces has its Baseline status looked up, with the date | the review names the feature, its status and where it was read | Baseline; web-features 3.39 |
| BL4 | A feature outside the target is behind feature detection or has a fallback                        | command BL4; for each such feature find the guard              | Baseline                    |
| BL5 | Without that feature, the user can still complete the task                                        | switch the enhanced path off and complete the task once        | Baseline                    |

## Commands

```sh
# BL4 — the guards that exist, to match against the features that need one
grep -rnE '@supports|CSS\.supports\(' src
grep -rnE "'[A-Za-z]+' in (window|navigator|document)" src
```

## Why each one

**BL3 is the whole checklist in one row.** Support tables are exactly the kind
of fact a model recalls confidently and wrongly, because they change every few
months. A status looked up and dated is evidence; one recalled is a guess that
reads like evidence.

**BL5** is the difference between progressive enhancement and a feature
detected and then ignored. A guard that leaves the user with a blank region on
an older browser is still a broken page.
