# Docs as code

Documentation written, reviewed and tested with the same tools as the code, so
the pull request that changes behaviour is the one that changes its docs.

| #   | Check                                                                                                           | How                                                                                            | Source                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| DC1 | Documentation lives in the same repository as the code it describes                                             | find the docs folder; a wiki or a separate repository is the finding                           | Write the Docs — Docs as Code                                                                                       |
| DC2 | Pages are plain-text markup (Markdown, reStructuredText or AsciiDoc)                                            | `git ls-files` the docs folder; binary documents are a finding                                 | Write the Docs — Docs as Code                                                                                       |
| DC3 | A behaviour change and its documentation land in the same pull request                                          | sample five recent `feat` or `fix` merges; each touching user-facing behaviour has a docs diff | Write the Docs — Docs as Code                                                                                       |
| DC4 | `CODEOWNERS` assigns an owner to every docs path, so a docs change requests a reviewer                          | read `CODEOWNERS`; open a pull request's reviewer list                                         | GitHub Docs — About code owners                                                                                     |
| DC5 | One style guide is named in an ADR: Google developer documentation style guide or Microsoft Writing Style Guide | find the ADR; zero or two named guides is the finding                                          | Google developer documentation style guide (updated 2026-04-27); Microsoft Writing Style Guide (updated 2026-07-06) |
| DC6 | The precedence is written: project rules, then the guide, then the dictionary                                   | read the ADR or `CONTRIBUTING.md`                                                              | Google developer documentation style guide — overview                                                               |
| DC7 | Project exceptions to the guide are one word list in the repository                                             | find `accept.txt` and `reject.txt` under the linter's `config/vocabularies/<name>/`            | Vale 3.22.0 — vocabularies                                                                                          |
| DC8 | Documentation issues are tracked with the code's issues, with a label                                           | filter the tracker by the docs label                                                           | Write the Docs — Docs as Code                                                                                       |

## Why each one

**DC3 is the whole file.** Docs drift the moment a behaviour change merges
without them, and "docs to follow" is where the drift is scheduled. Sampling
five merges measures it in minutes.

**DC5** turns style review from preference into a lookup. Without one named
guide, a reviewer's comment is an opinion and the author is right to argue.

**DC4** makes review of docs automatic rather than remembered: GitHub requests
the owner as soon as a docs path changes.
