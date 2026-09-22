---
name: catalog-research
description: Decide what the Forgeprint catalog should hold next, from evidence rather than taste. Use when choosing which blueprint to write or commission, when triaging blueprint requests, when asked "what is missing from the catalog", or before opening a good-first-blueprint issue.
license: CC-BY-4.0
---

# Researching what the catalog is missing

The catalog grows by demand, not by enthusiasm. This is the procedure for
finding out what the demand is, and the discipline that keeps "what would be
fun to write" out of it.

**This produces candidates, not blueprints.** The output is a list somebody can
argue with, and issues a contributor can pick up. Writing the blueprint is a
different job with a different skill (`blueprint-author`).

---

## 1. Read the demand that already exists

In this order, because the first is about people who came to us and the rest is
about people who did not:

1. **Open `blueprint-request` issues.** Somebody wanted something and said so.
   This outranks every external signal, including a bigger one, because it is a
   person you can answer.
   ```bash
   gh issue list --label blueprint-request --state open
   ```
2. **The catalog's own blind spots.** A value in the taxonomy with no blueprint
   behind it is a question `resolve` cannot answer at all: it returns
   `no_match`, and the user leaves. `project_type` and `languages` are the two
   heaviest criteria, so gaps there cost the most.
   ```bash
   node -e "const i=require('./docs/index.json');/* compare i.taxonomy to i.blueprints */"
   ```
3. **The ecosystem.** Framework and database usage surveys, package registry
   counts, what the MCP registry actually carries. Prefer a number you can
   fetch over an article that quotes one: an article is somebody else's
   reading, and it is usually a year old.

Write down **where each number came from and when**. A signal with no source is
an opinion, and six months from now nobody will remember which it was.

---

## 2. Filter hard

A candidate has to survive all five. Most ideas die here, which is the point.

| Filter                                                           | Why                                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **The recipe can be executed in CI** on an ordinary Linux runner | A blueprint whose setup cannot run is a description, and the catalog already refuses those. No proprietary SDK, no paid service, no device, no account |
| **The triple is new** — `stack + project_type + requirements`    | Rule 9. If it is not new, this is an option on an existing blueprint, or a `supersedes`, or nothing                                                    |
| **It fits the closed taxonomy**                                  | A candidate that needs a new vocabulary value is two pull requests, and the taxonomy one comes first and on its own                                    |
| **Somebody will maintain it**                                    | A blueprint with no maintainer is `orphaned` in ninety days (rule 18). Name who, or mark it as needing one                                             |
| **We can tell it is right**                                      | The recipe's verifications have to prove something. "It builds" is not proof that it does what the blueprint claims                                    |

The filters are not a scoring system. One failure removes a candidate; a
strong signal does not buy an exception.

---

## 3. Write the candidate down

One entry each, and keep it short enough that somebody reads all of them:

- **Slug and one-line summary**, the way the manifest would say it.
- **The triple**, written out. This is what rule 9 is checked against.
- **The demand**, with its source and date.
- **What makes it testable** — the verification that would prove the recipe
  worked, not just that it compiled.
- **The risk** — the reason this might be a bad idea. Every candidate has one.
  A candidate with no stated risk has not been thought about.

Then file it: an issue labelled `blueprint-request`, and
`good-first-blueprint` when the recipe is short and the stack is common. The
site's request list reads those issues, so a candidate that stays in a document
is invisible to the people who might write it.

---

## 4. Provenance, before anybody writes code

Most blueprints are derived from a project that already exists — that is what
`blueprint-author` does. So the candidate says, up front, **which project it is
derived from and under what licence**, and the manifest records it in
`provenance` (ADR 0008).

This is not bookkeeping. A blueprint carries somebody else's design decisions
into other people's projects under CC BY 4.0, and the catalog cannot credit
what it did not write down. A candidate derived from a source whose licence
does not allow it is not a candidate.

---

## Never

- **Do not write the blueprint here.** Research stops at the issue.
- **Do not add a candidate because the catalog looks thin.** An empty
  `project_type` is a signal, not a mandate; a bad blueprint in an empty
  category is worse than the gap.
- **Do not turn one candidate into three by splitting an option.** Postgres and
  SQL Server are an option field, not two blueprints (ADR 0001).
- **Do not count a blueprint request twice** because it also appears in a
  survey. One person asking is one signal.
