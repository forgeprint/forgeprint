---
name: expert-author
description: Turn how somebody actually works into a Forgeprint expert. Use when contributing an expert, when asked to "make an expert out of how I review code", when drafting manifest.yaml / SKILL.md / checklists / references.md for the catalog, or when an expert pull request needs to pass validate and similarity before review.
license: CC-BY-4.0
---

# Authoring an expert

An expert is a way of working, written down so an agent behaves differently for
having read it. It is not a persona, and the difference is not stylistic — it
is whether the text contains anything a machine can check it followed.

**The bar, and it is one question:** _is there an instruction in here the agent
cannot verify it obeyed?_ Every one that fails that question is decoration.
Delete it or turn it into a command, a grep, or a file that must exist.

The second bar: **run it.** Take a real project, follow the expert you wrote,
and see whether the output is different from what the agent would have produced
anyway. If it is not, you have written a job title.

---

## 1. Start from what you refuse, not from what you value

An agent asked to write an expert will produce a list of virtues: "prioritise
maintainability", "consider the user", "write clean code". All true, none
checkable, and an agent that read them behaves exactly as before.

Start at the other end. Ask the contributor:

1. **What do you refuse?** Which patterns do you push back on in review, every
   time, even when they work? That list is the spine of the expert — each entry
   is a grep and a one-sentence reason.
2. **What do you decide before you start?** The decisions that are expensive to
   reverse in this role. Those become the procedure.
3. **What do you produce?** Name the artefacts. If nothing comes out of this
   role that somebody could hold, the role is not one this catalog can carry.
4. **What do you check, and how would somebody else check it?** Each answer is
   a checklist row: the check, the command or the reading that performs it, and
   the source it rests on.
5. **What do you defer to somebody else?** An expert that covers everything
   covers nothing. Name the boundary.

Question 1 is the one that produces the most usable material and the one people
are least ready for. Ask for concrete examples, not principles.

---

## 2. The files, and what each one has to contain

```
experts/<slug>/
├── manifest.yaml       # role + domain + seniority (+ languages), deliverables, checklists
├── SKILL.md            # how it works — the Agent Skills format
├── overview.md         # what it fits, what it does not, pros and cons
├── references.md       # every source with a version and a date checked
├── CHANGELOG.md
├── checklists/         # one file per name in manifest.checklists
└── examples/           # optional
```

**`SKILL.md`** carries the frontmatter the spec requires — `name` matching the
folder, and a `description` that says what it does **and when to use it**,
because that sentence is what an agent matches against. Then the procedure,
the refusals, what it produces, and how to run it. Sections numbered, so a
review can cite one.

**`checklists/<name>.md`** is a table: the check, how to perform it, and the
source. Then a short "why each one" naming the two or three rows that are
load-bearing and saying what failure each prevents. A checklist that is only a
table is a list somebody will skim.

**`references.md`** is the file that separates an expert from an opinion. Every
row carries the source, the version that was current when it was read, and the
date it was read, and **every checklist row cites one**. Put a re-check date at
the top; 90 days, matching `docs/review-standards.md`.

Where the catalog already tracks a standard, **point at it rather than copying
it**. `docs/review-standards.md` holds OWASP, NIST, SLSA, CIS and WCAG at
checked versions. Two copies of a standard is one copy that is wrong, and the
wrong one is the copy somebody remembers.

**`overview.md`** needs its "what it does not fit" section to be real. An
expert with a short or evasive one has not been thought about, and it is the
section a reader uses to decide.

---

## 3. The manifest

```yaml
schema: 1
slug: dotnet-senior-architect
name: '.NET Senior Software Architect'
version: 1.0.0
tier: community # `official` is a claim only the core maintainer makes
provenance: human # `generated` if a tool drafted it (ADR 0011)
maintainers: [your-handle]
summary: 'What it changes, in one sentence somebody could disagree with.'
role: software-architect # taxonomy: roles
domain: software # taxonomy: domains
seniority: senior # mid | senior | principal
languages: [csharp] # optional; omit for a role that is not code-bound
stack: [dotnet, aspnetcore] # optional
deliverables: [adr, architecture-review] # taxonomy: deliverables
checklists: [layering, dependency-direction] # one file each, or validate fails
pairs_with: [security-reviewer] # optional
agents: [claude-code] # only the ones you actually tested
deprecated: false
supersedes: null
```

Three things `validate` will refuse, and they are the three that matter:

- A `checklists` name with no `checklists/<name>.md` behind it. An expert with
  nothing under it is the thing this unit type exists to refuse.
- A second expert with the same `role + domain + seniority + languages`
  (rule 9, ADR 0015). If yours is better, `supersedes` the old one; if it is
  different, one of the four fields is wrong. A language-specific expert is
  allowed beside the stack-neutral one only when its checklists are about the
  language — ones that would read differently with the language swapped.
- `provenance: generated` with `tier: official`. A tool drafted it and CI
  checked it is a different claim from a person standing behind it (ADR 0011).

`agents` means **tested**, not supported. Put one agent there and add more when
you have run it with them.

---

## 4. Before you open the pull request

```bash
pnpm forgeprint validate
pnpm forgeprint similarity --expert <slug>
pnpm forgeprint render-check
```

`similarity --expert` compares your `SKILL.md` and your checklists against
every other expert. A `REJECTED` line means rule 9: the same role, domain and
seniority already exists, and the answer is to improve that one or supersede
it. A `RED FLAG` is a question the pull request template makes you answer —
what is different, and why is this not a change to that expert instead.

Then the part no command does: **use it on something real**, and say in the
pull request what came out differently. A reviewer's first question is whether
this changes what an agent does, and "I tried it on X and it caught Y" is the
only answer that settles it.

---

## 5. What gets an expert rejected

| Rejected                                             | Why                                                                           |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Instructions nobody can verify were followed         | The whole bar. "Write maintainable code" is not an instruction                |
| No `references.md`, or rows with no version and date | Then it rests on somebody's memory, including about things that have changed  |
| A checklist row citing nothing                       | An item with no source is an opinion, and a review built on it is an argument |
| Restating a standard the catalog already tracks      | Two copies, one of them eventually wrong                                      |
| "You are a senior X" with no procedure               | A title, not a way of working                                                 |
| No "what it does not fit"                            | Not thought about, and the reader has no way to decide                        |
| A role, domain, seniority and languages that exist   | Rule 9. Improve or supersede                                                  |
| `agents` listing agents nobody ran it with           | `agents` means tested, and a wrong claim there is worse than a short list     |

---

## 6. Where to look for an expert nobody has written

The site publishes every role in the taxonomy with no expert behind it. That
list is long on purpose: the vocabulary is deliberately wider than the catalog,
so an empty role reads as a contribution call rather than a gap (ADR 0012).

Pick one you actually do. An expert written from research rather than from
practice is `provenance: generated`, it says so, and it will be read with the
scepticism that deserves.
