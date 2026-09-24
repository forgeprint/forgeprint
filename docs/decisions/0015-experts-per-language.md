# 15. An expert may be specific to a language

- Status: Accepted
- Date: 2026-09-24
- Deciders: core maintainer
- Amends: [ADR 0012](0012-experts-crews-integrations.md), point 4 (rule 9 for
  experts)
- Constrained by: [ADR 0001](0001-no-variants.md) (no variants), rule 9

## Context

ADR 0012 extended rule 9 to experts as one expert per
`role + domain + seniority`. The catalog's first architect,
`dotnet-senior-architect`, is `software-architect / software / senior` with
`languages: [csharp]`, and its checklists are .NET's: project layout, EF Core
boundaries, the dependency rules a .NET solution can enforce. That is what made
it useful.

It also meant the triple was taken. The 2026-09-24 research
([roles](../research/2026-09-24-roles.md), [crews](../research/2026-09-24-crews.md))
found the architect slot needed by five of fifteen proposed crews, across
TypeScript, Python, Go and Java projects, and found the same shape for backend
and mobile engineers: a role that says nothing checkable until it is tied to a
stack. Under ADR 0012 the only ways to add a Java architect were a different
seniority, which would be a false claim, or making the .NET expert
stack-neutral, which would throw away the part that works.

## Decision

**The expert key is `role + domain + seniority + languages`.**

- `languages` is compared as a set: `[csharp, sql]` and `[sql, csharp]` are the
  same expert.
- An expert that names no `languages` is the **stack-neutral** one for its
  triple. There is still at most one of those.
- Language-specific experts sit beside it: `dotnet-senior-architect`, and later
  `java-senior-architect`, `typescript-senior-architect` and so on.

Blueprints, crews and integrations are unchanged.

## Why this is not a variant

ADR 0001 forbids a unit that is a copy of another with a few things changed. A
language-specific expert is not that, and the gate is what keeps it from
becoming it:

- Its **checklists** have to be about the language — rules a Java project can
  be checked against and a Python one cannot. An expert whose checklists would
  read the same with the language swapped is the stack-neutral expert with a
  label, and review refuses it.
- `similarity` still compares the text. Two architects above the threshold are
  a red flag whatever their key says.
- It names no parent and inherits nothing. There is no `extends`; each one is
  written whole.

## Consequences

- `validate` and `similarity` key experts on the four fields; a duplicate is
  reported as the same `role + domain + seniority + languages`.
- CLAUDE.md rule 9, ADR 0012's point 4, the pull request template and the
  `expert-author` skill say the same.
- The catalog can grow per stack where a role only means something per stack —
  architects, backend engineers, mobile engineers — without a false seniority.
- The cost is more experts to maintain. The mitigation is the same as for
  blueprints: each one has a maintainer, and an unmaintained one is `orphaned`
  after ninety days (rule 18).

## What would reopen this

Two language-specific experts that `similarity` keeps flagging above 70% — the
sign that the language is a label rather than a difference. Then the answer is
one stack-neutral expert, and the rule goes back to three fields.
