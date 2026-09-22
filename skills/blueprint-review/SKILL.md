---
name: blueprint-review
description: Review a Forgeprint blueprint for duplication and quality, and produce a verdict. Use when reviewing a blueprint contribution or pull request, when asked whether a blueprint is a duplicate, when judging setup.md or AGENTS.md quality, or when deciding between MERGE, DUPLICATE, CHANGES and WAIT_MAINTAINER.
---

# Reviewing a blueprint

The catalog's value is that everything in it was worth adding. Review protects
that, and the main thing it protects against is not bad blueprints — it is
blueprints that should have been a change to an existing one.

**You decide; you never merge and never approve.** The merge decision belongs to
the core maintainer. Nothing in this skill authorises `gh pr review --approve`,
`gh pr merge`, or pushing to somebody's branch.

For the pull request workflow — fetching, commenting, labelling — use the
`/review-pr` command, which applies this skill to a GitHub pull request. This
skill is the judgment; that command is the plumbing.

---

## 1. The deterministic layer runs first

```bash
pnpm run build
pnpm forgeprint validate
pnpm forgeprint lint-setup <slug>
pnpm forgeprint similarity <slug>
```

A red result here is not a review question, it is a fix. Report the output and
stop; do not spend judgment on a blueprint that does not pass the machine.

Read the similarity report carefully rather than reading only its verdict:

| Line          | Meaning                                                                      | What to do                                          |
| ------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| `REJECTED`    | Same `stack + project_type + requirements` as an existing blueprint (rule 9) | `DUPLICATE`. Not arguable                           |
| `RED FLAG`    | Above the threshold, different triple                                        | A question, not a verdict. Answer it with section 2 |
| Three numbers | Tag overlap, `AGENTS.md`, `setup.md`                                         | See below                                           |

The three numbers say different things. High **tag** overlap with low text
similarity usually means two genuinely different blueprints that a six-field tag
summary cannot separate — worth noting for the resolver, not a reason to reject.
High **`setup.md`** similarity means the recipes are the same work. High
**`AGENTS.md`** similarity means the context was copied, which is the strongest
signal that this should have been a change to the existing blueprint.

---

## 2. Is this a duplicate?

Ask in this order and stop at the first clear answer.

1. **Does it claim a new `stack + project_type + requirements` triple?** No →
   `DUPLICATE`.
2. **Could the difference be an option on the existing blueprint?** A different
   database, auth mechanism, transport or runtime usually can, as long as the
   existing blueprint stays within 3 option fields and 3 values each. If it can
   → `DUPLICATE`, and say which option to add.
3. **Is it the same blueprint done better?** Then it should arrive as
   `supersedes` plus a deprecation of the old one, not as a sibling. If it does
   not → `CHANGES`.
4. **Does the difference change the shape of the project, not just a
   dependency?** Tenant isolation, a different protocol, a different deployment
   model change the shape. A different logging library does not.

A duplicate is never closed silently. The response names the existing blueprint
and gives the contributor a route: add an option, send a fix, or supersede. A
rejection without a route is a governance failure, not a tidy catalog.

---

## 3. Quality checks

Answer each with yes/no and one sentence. A "no" is a `CHANGES` item with a
concrete fix, not a complaint.

### setup.md

- Is every step a single command or a single file operation?
- Does every step end with a verification that would actually fail?
- Is every version pinned, including container image tags?
- Do the option guards reference declared options, one level deep?
- Does the recipe end by proving the result works — a request, a handshake, a
  test run — rather than by building successfully?
- Does the contributor say they ran it, on what platform, with what tool
  versions? An unrun recipe is the most common source of a broken blueprint.

### AGENTS.md

- Would any sentence still be true if the stack were different? If most of the
  file would, it is generic advice and costs context for nothing → `CHANGES`.
- Does each rule name the failure it prevents?
- Does it match what `setup.md` actually produces? A rule about a file the
  recipe does not create is a copied file.

### overview.md

- Is there a "what it is NOT for" section, and does it name alternatives?
- Are the trade-offs stated, including the ones a reasonable person would make
  differently?
- Does it promise anything the recipe does not deliver?

### manifest.yaml

- Is every tag in the taxonomy? (`validate` catches this, but check the values
  are _right_, not merely legal: a blueprint tagged `beginner` that depends on
  subtle framework behaviour is mis-tagged.)
- Does `agents` list only agents it was actually exercised with?
- Does `requires_tools` include everything the recipe invokes?
- Is `tier` correct? Contributions default to `community`. `verified` requires
  somebody other than the author to have run the setup, and `official` is the
  core maintainer's.

### Versioning and ownership

- Is the change type declared, and do `version` and `CHANGELOG.md` agree with
  it?
- For an edit to an existing blueprint: has a listed maintainer approved? If not
  and the pull request is younger than 14 days → `WAIT_MAINTAINER`.

### Security

- Anything privileged, anything piping a download into a shell, anything
  deleting recursively, anything writing outside the project?
- Any network host that is not a package registry?
- Any credential, token or real hostname left in a file?
- Does `AGENTS.md` tell the agent to treat request input as trusted anywhere?

`lint-setup` catches the mechanical ones. The last two are yours.

---

## 4. Verdict

Exactly one:

| Verdict           | When                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `MERGE`           | Everything passes; waiting only for the owner                                |
| `DUPLICATE`       | Belongs in an existing blueprint; the route is named                         |
| `CHANGES`         | A concrete, numbered list of fixes                                           |
| `WAIT_MAINTAINER` | The blueprint's maintainer has not answered yet, and 14 days have not passed |

When unsure, issue `CHANGES` and say what is unclear. A wrong merge costs the
catalog more than a wrong rejection costs a contributor — the contributor can
answer; a merged duplicate stays.

---

## 5. Write the review a contributor can act on

- Lead with the verdict and the one thing that decides it.
- Number the required changes. "Improve the setup steps" is not actionable;
  "step 7 has no verification; add ``Verify: `dotnet build` ``" is.
- Quote the similarity numbers rather than asserting similarity.
- Separate **must fix** from **worth considering**. Reviews that mix them get
  read as a wall.
- Say what is good, briefly and specifically. A contributor who cannot tell what
  worked will change the wrong things next time.
- Never rewrite their blueprint in the review. Say what is wrong; the fix is
  theirs.

---

## Reviewing your own blueprint

The core maintainer writes blueprints too. The same checks apply, and the
temptation to skip section 2 is strongest there: an `official` blueprint that
duplicates another `official` blueprint is the fastest way to teach contributors
that the rule is decorative.
