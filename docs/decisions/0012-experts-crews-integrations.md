# 12. Experts, crews and integrations: three more dimensions, one composition rule

- Status: Accepted
- Date: 2026-09-23
- Deciders: core maintainer
- Extends: CLAUDE.md §1 (what Forgeprint is) and §3 (architecture)
- Constrained by: [ADR 0001](0001-no-variants.md) (no variants), rule 9 (one
  slug per combination)

## Context

A blueprint answers one question: **what are you building?** It returns a
project's context package — `AGENTS.md`, a deterministic recipe, the MCP and
plugin configuration — and an agent executes it.

That is not the whole of what somebody needs when they start. Two more
questions are asked in the same breath and answered nowhere:

- **How should the agent work?** "Set up an ASP.NET Core API" and "review this
  API the way a senior architect would" are different requests. The second one
  has no unit in the catalog; today it is answered by whatever the user
  improvises into a prompt.
- **With which tools?** Installing an MCP server correctly means finding the
  upstream, pinning a version, knowing which secrets it wants and what it can
  reach with them. Every user works this out again, from a README, and the
  security-relevant parts are the ones most often skipped.

There is also a packaging question. The catalog's unit of contribution is a
folder, and a folder is a poor unit for "the four specialists I want on a SaaS
launch". Asking a contributor to express that as a blueprint pushes them
towards a copy of an existing blueprint with a different name, which rule 9
exists to refuse.

## Decision

Forgeprint becomes three-dimensional, with a fourth unit for composition:

| Dimension | Question | Unit |
|---|---|---|
| Blueprint | What are you building? | `blueprints/<slug>/` |
| Expert | How should the agent work? | `experts/<slug>/` |
| Integration | With which tools? | `integrations/<slug>/` |
| Crew | A named package of the above | `crews/<slug>/` |

**1. An expert is a way of working, not a persona.** It is a skill in the
SKILL.md format, and it is accepted only if it is checkable. Its manifest names
what it produces (`deliverables`), which checklists it applies (`checklists`),
and `references.md` carries every source it rests on with a version and a
last-checked date — the discipline `docs/review-standards.md` already applies
to reviews (§5c). Text that only asserts seniority is rejected. The test a
reviewer applies: **does this change what an agent does, or only what it calls
itself?**

**2. A crew composes; it never copies.** A crew manifest lists members by slug
and integrations by slug, and holds no content of its own beyond a README that
says what it is for and what it is not for. This is composition, so ADR 0001
is untouched: nothing inherits, nothing is forked, and editing an expert
changes every crew that names it. A crew holds at most six experts, because
beyond that it is not a team, it is the catalog with a title.

**3. An integration hosts no code.** It is an installation recipe for something
somebody else publishes: a verified upstream URL, a pinned version, the
install command per agent, the secrets it needs, and a one-line summary of what
those secrets grant. `latest` is refused the same way it is refused in a setup
recipe. The agent never enters a secret; it tells the user where to get one
(rule 21 — the server returns text, it does not act).

**4. Rule 9 extends to all three.** One expert per `role + domain + seniority`
(widened by [ADR 0015](0015-experts-per-language.md) to include `languages`)
triple, one crew per member-and-integration set, one integration per upstream.
A better one replaces the old one through `supersedes`, exactly as for
blueprints. `similarity` gains the corresponding comparisons.

**5. The taxonomy grows wide; the content stays narrow.** `roles`, `domains`,
`seniority` and `deliverables` are added to `schema/taxonomy.yaml`, and the
role list is deliberately larger than anything the catalog will hold soon —
past software into data, security, product, design, documentation, research,
finance, legal, education, marketing, operations and support. Every role
without an expert behind it is published as a **requested expert**. An empty
slot is a contribution call, not a gap to be embarrassed about. Every expert
that fills one still passes the same gates.

**6. A blueprint may recommend, never require.** Blueprint manifests gain
`recommended_experts`, `recommended_crew` and `integrations`. `get_blueprint`
returns them as a suggestion. Nothing in a setup recipe depends on an expert
existing, because a recipe that did would stop being deterministic.

## Consequences

- The resolver's single-answer discipline now has to hold across four unit
  types. `resolve` gains an `intent` field (`project | expert | crew |
  integration`) and `recommend_experts` returns at most one crew **or** three
  experts. Anything wider is a comparison, and comparison has its own tool.
- Three new manifest schemas, three new folder layouts, and `validate`,
  `similarity` and the lint rules extended to each. The cost is real and it is
  paid once.
- Integrations carry third-party risk the rest of the catalog does not. Every
  integration page states that the upstream is somebody else's code and that
  the permissions are the reader's to review, and integration pull requests get
  an extra check: is the upstream real, are the permissions described, does the
  install snippet contain a secret.
- The licence split is unchanged: experts, crews and integration metadata are
  content, under CC BY 4.0; the tooling stays PolyForm Shield (§8).
- Outside software, the core maintainer cannot personally verify an expert.
  Those enter as `community` with `provenance` set, never `official` — the same
  line ADR 0011 draws for blueprints, for the same reason.

## Alternatives considered

**Experts as a blueprint field.** A `persona:` string on a blueprint, or a
`skills/` folder with a role file. Rejected: an expert is reusable across
blueprints and across projects that have no blueprint at all, and burying it in
one blueprint makes the other twenty copy it. That is the variant problem in a
different costume.

**Crews as a blueprint variant.** `extends: saas-api` with extra members.
Rejected outright — this is precisely what ADR 0001 forbids, and the reasons
have not changed.

**Hosting integration code.** Vendoring or wrapping MCP servers so the install
is one step. Rejected: it makes Forgeprint responsible for somebody else's
security updates, and the catalog's answer to supply chain risk cannot be to
become part of the supply chain.

**A narrow role list, grown on demand.** Consistent with how `stack` is
governed, and rejected here for a specific reason: the role list is also the
demand signal. A list that only names what exists cannot advertise what is
missing, and the requested-expert page is the mechanism by which non-software
domains get contributors at all.
