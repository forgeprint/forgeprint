---
name: crew-author
description: Assemble a named package of experts and integrations as a Forgeprint crew. Use when contributing a crew, when asked "which experts should work together on X", when drafting a crew manifest and README, or when a crew pull request needs to pass validate before review.
license: CC-BY-4.0
---

# Authoring a crew

A crew is somebody's opinion about who belongs together on a job, published
under their name. It is the one unit in this catalog that is explicitly a
judgement call — which is why it carries a byline and why its README has to say
where it is wrong.

**A crew composes and copies nothing.** It names members by slug. Editing an
expert changes every crew that names it, and that is the point: there is no
inheritance here, so ADR 0001 is untouched.

---

## 1. Before you write one, ask whether it should exist

Most questions do not need a crew. Three checks, in order:

1. **Is this one job, or several?** A crew is assembled for a stretch of work
   with a shape — "from an empty repository to a first paying customer", "an
   API that already has users". If you cannot say the stretch in one sentence,
   you have a list of experts you like rather than a crew.
2. **Would somebody take all of them?** If a reader would plausibly use two of
   the five, the other three are padding, and padding is what turns a
   recommendation into a catalog dump.
3. **Do the members disagree anywhere?** If not, look harder. Two experts with
   nothing to argue about are probably one expert, and the places they pull
   against each other are the most useful paragraphs in the README.

Six members is the cap, and most good crews are three or four. Beyond that it
is not a team, it is the catalog with a title.

---

## 2. The files

```
crews/<slug>/
├── manifest.yaml     # members[], integrations[], for_what, not_for, byline
├── README.md
└── CHANGELOG.md
```

```yaml
schema: 1
slug: saas-launch-crew
name: 'SaaS Launch Crew'
version: 1.0.0
tier: community
provenance: human
maintainers: [your-handle]
summary: 'Who is on it and what stretch of work it is for, in one sentence.'
byline: 'Assembled by @your-handle' # your name on your judgement
members: [dotnet-senior-architect, sql-data-engineer] # at most 6, by slug
integrations: [github-mcp, sentry-mcp] # optional, by slug
for_what: 'The stretch of work this is assembled for, specifically.'
not_for: 'Where it is the wrong team. "Nothing" is not an answer.'
agents: [claude-code]
deprecated: false
supersedes: null
```

`validate` refuses a member or an integration that is not in the catalog, and
refuses a second crew with the same member-and-integration set (rule 9): two
crews with the same people are one crew under two names.

---

## 3. The README is the crew

The manifest is metadata; the README is the thing somebody reads before
committing a week to your recommendation. Five sections, and three of them are
the ones people skip:

**Who is in it.** A table: the expert, what it brings, and the question it
stops you skipping. That third column is what makes the table worth reading —
"what it brings" is a summary anybody could copy from the expert.

**What they install.** One row per integration, and _why this crew wants it_
rather than what it does. Every integration is third-party software with real
permissions; say so and point at its README.

**The order they are useful in.** Almost never the order they are listed in.
Say which one goes first and why, because a reader who takes them in the wrong
order gets a design review of code that should not have been written yet.

**Where the members disagree.** The section that makes a crew honest. Two
experts pulling against each other is information — say where, and say how to
resolve it, because the reader will hit it and will otherwise think one of them
is wrong.

**Where this crew is wrong.** Concrete cases: the project size it is overkill
for, the stack one member does not transfer to, the stage it is too early or
too late for. A reader deciding _not_ to use your crew because of this section
is the section working.

---

## 4. Before you open the pull request

```bash
pnpm forgeprint validate
```

Then the part no command does. Read your own `not_for` and ask whether you
would have written it if you were trying to make the crew look good. If the
answer is no, it is not finished.

Two more things a reviewer will look for:

- **The byline is yours.** A crew published under the catalog's name rather
  than a person's is a recommendation nobody is accountable for.
- **Nothing is copied.** If your crew's README explains what an expert does
  rather than linking to it, the explanation will drift from the expert within
  two changes. Link.

---

## 5. What gets a crew rejected

| Rejected                                                | Why                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Seven or more members                                   | Not a team; the cap is 6 and most good ones are 3 or 4                         |
| A member or integration that is not in the catalog      | It resolves to nothing while looking complete — composition's own failure mode |
| The same member set as an existing crew                 | Rule 9. One crew under two names                                               |
| An evasive `not_for`                                    | A crew that is right for everything is a catalog with a title                  |
| Content copied from a member instead of linked          | It drifts, and then two files disagree                                         |
| No byline, or the catalog's name in place of a person's | A recommendation nobody is accountable for                                     |
| Members who never disagree                              | Probably one expert wearing two hats                                           |
