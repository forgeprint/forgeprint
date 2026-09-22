# 9. What goes in the repository, and what never does

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer
- Implements: CLAUDE.md §5b

> Numbered 0009 rather than 0005: that number, and the three after it, were
> already taken. Renumbering an accepted decision breaks every link to it.

## Context

The repository is public, every commit is world-readable, and git does not
forget. A secret that reaches `main` is compromised the moment it is pushed;
deleting it later removes it from the tip, not from the history, not from the
forks, and not from whatever already scraped it.

Two things make this sharper here than in an ordinary project.

**A blueprint is written from a working project.** The method the catalog is
built on — `blueprint-author` — starts by reading something real, which is
exactly where a connection string, an internal hostname or a client's project
name comes from. The risk is not carelessness; it is the process working as
designed.

**The maintainer is one person with an employer, other projects, and a
machine.** Paths, tool names and internal URLs leak through examples and error
messages far more easily than through code.

At the same time, a curated catalog asks strangers to trust its judgment.
Trust of that kind is bought with disclosure: showing the reasoning, the review
verdicts and the failures. So the rule cannot be "share less" — it has to say
precisely what is shared and precisely what is not.

## Decision

Two lists, both binding, in CLAUDE.md §5b.

**Never:** secrets of any kind, including examples that look real; personal
data, including local paths and machine names; employer, client and internal
identifiers; the maintainer's other projects; and the human context behind a
decision. ADRs carry technical reasoning only.

**Always:** every ADR, every review verdict with its reasoning, every
CHANGELOG, every security review report, plus `SECURITY.md` and `PRIVACY.md`.

Examples are obviously fake or they are not examples. `sk-EXAMPLE-0000` and
`local-development-only-not-a-real-secret` are usable in a document because no
reader could mistake either for a live value.

**Mechanical protection, in the order it catches things:**

1. `.gitignore` — the files that should never be staged.
2. `gitleaks` as a pre-commit hook — a secret that was staged anyway.
3. `forgeprint lint-setup` — secret patterns inside blueprint files, which is
   where a recipe would carry one to a reader.
4. Reading the diff before committing.
5. GitHub push protection, which is the last line and the weakest: by the time
   it refuses, the commit exists on the machine and possibly in a branch.

## Consequences

- An example value in a blueprint that reads like a real credential is a
  defect, even when it is inert. It teaches the reader to paste a real one in
  the same place.
- A recipe may not print a local path. Recipes run in a fresh directory and
  refer to files relatively, which was already true and now has a second
  reason.
- The reviewer's question "is anything here specific to where this came from?"
  is now part of the review rather than a matter of taste.
- The hook cannot be enforced for contributors — a pull request is reviewed
  before it merges, and `gitleaks` in the `validate` workflow would be the way
  to enforce it if contributions start arriving.
- Nothing here retroactively cleans history. If a secret ever does land, the
  answer is to rotate it, not to rewrite the past.
