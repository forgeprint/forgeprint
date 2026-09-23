---
name: catalog-research
description: Decide what the Forgeprint catalog should hold next — blueprints and experts — from evidence rather than taste. Use when choosing which blueprint or expert to write or commission, when triaging requests, when asked "what is missing from the catalog", or before opening a good-first issue.
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
3. **The ecosystem.** Two halves, and both go into the report.

   **Stack combinations** — what people build with, and more importantly what
   they build with _together_. A blueprint is a combination, so a package that
   is popular alone says less than two that are always installed side by side.

   | Source                                 | What it is good for                        |
   | -------------------------------------- | ------------------------------------------ |
   | Stack Overflow Developer Survey        | framework and database share, year on year |
   | JetBrains State of Developer Ecosystem | language share and perceived growth        |
   | State of JS, State of Python           | satisfaction and retention, not just usage |
   | GitHub Octoverse                       | active users per language, growth rates    |
   | npm, PyPI, NuGet download APIs         | installs, fetchable and exactly dated      |
   | Stars on the awesome list for a stack  | rough attention, and nothing more          |

   **MCP servers and Claude Code plugins** — what a blueprint should put in
   `provides.mcp`. The official registry, Smithery, PulseMCP and Glama, the
   `@modelcontextprotocol/*` download counts, `awesome-mcp-servers`. Tag each
   one with which stacks it actually suits; a server that fits everything fits
   nothing in particular and does not belong in a manifest.

   Fifteen rows each, ordered by signal strength.

**Fetch the number; do not quote somebody's reading of it.** These are primary
and take one command each:

```bash
curl -s "https://api.npmjs.org/downloads/point/last-week/next"
curl -s "https://pypistats.org/api/packages/fastapi/recent"
curl -s "https://azuresearch-usnc.nuget.org/query?q=packageid:Microsoft.EntityFrameworkCore"
curl -s "https://api.github.com/repos/vercel/next.js"
```

Two traps worth naming, because both have produced confident nonsense:

- **A directory's server count is not an install count.** "50,000 MCP servers
  indexed" says how much a directory has crawled, not what anybody runs.
- **Downloads are not developers.** CI reinstalls the same package every run,
  and a transitive dependency counts like a chosen one. Downloads are a floor
  on attention. Survey percentages are people who answered a survey. Read both;
  where they disagree, say so rather than picking the flattering one.

Write the result to `docs/research/<YYYY-MM-DD>-demand.md` with those two
sections, every row carrying its source and the date it was read.

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

Two separate questions, and the candidate answers both before a line is
written.

**Where did it come from?** Most blueprints are derived from a project that
already exists — that is what `blueprint-author` does. The candidate says
which project and under what licence, and the manifest records it in
`derived_from` (ADR 0008). This is not bookkeeping: a blueprint carries
somebody else's design decisions into other people's projects under CC BY 4.0,
and the catalog cannot credit what it did not write down. A candidate derived
from a source whose licence does not allow it is not a candidate.

**Who wrote it?** A draft produced by an agent from this research carries
`provenance: generated`, and a generated blueprint can never be `tier: official`
— the schema refuses it (ADR 0011). It also carries, everywhere it is served,
_"Generated, CI-tested, not manually verified."_ A generated draft passes
`validate`, `similarity`, `lint-setup`, `test-setup` **and** an architecture and
security review (§5c) before its pull request opens.

Nothing is drafted before the core maintainer picks it from the candidate list.
Research produces candidates; picking is not research (CLAUDE.md §10).

---

## 5. Roles, which are the same question about a different unit

The taxonomy holds 58 roles and the catalog fills a handful. The role list is
deliberately wider than the content, so **an empty role is not a gap, it is a
slot** — and the question is which empty ones have evidence rather than which
sound important (ADR 0012).

The bar, and it is narrower than it looks:

> An expert is worth writing when somebody is already asking an agent to do
> that job and getting an unopinionated answer. Not when the role is important.

Almost every role is important. That is why the bar is the first half.

**Where the evidence is:**

1. **The open-roles list on the site**, and the issues opened against it.
   Demand stated by the person who has it beats demand inferred from a survey,
   every time. Read this first.
2. **Surveys of what people actually use agents for.** DORA's annual report is
   the usable one because it names task categories rather than sentiment. Take
   the task list, not the headline number.
3. **What the existing experts defer to.** Every `references.md` has a
   "deferred to elsewhere" section naming a role nobody has filled. Those are
   gaps the catalog found by using itself, which is the strongest signal
   available short of a request.

**Two filters, both of which reject most candidates:**

- **Is it checkable?** An expert has to be able to name what it produces and
  what it checks, each row citing a source. A role whose expertise is taste —
  and several are — cannot pass the quality gate, and writing one anyway
  produces the persona this catalog refuses.
- **Can anybody here verify it?** Outside software, usually not. That entry
  gets `community` and `provenance: generated`, says so on its page, and never
  `official` (ADR 0011). If that sounds too weak to be worth publishing, do not
  publish it.

Write the round up as a dated report under `docs/research/`, the way the
blueprint demand report is written: the numbers with their sources and dates,
what follows, **and what the round deliberately did not do and why**. The last
section is the one that keeps the next round honest.

## When to run this

Monthly, and whenever a `blueprint-request` issue arrives. The roadmap carries
the cadence (CLAUDE.md §6); the reason for it is that the numbers move faster
than the catalog does, and a report nobody refreshed is worse than none — it
still looks like evidence.

Each run writes a new dated file rather than editing the last one. Two reports
a month apart are the only way to see a trend, and a file that gets overwritten
can never show one.

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
