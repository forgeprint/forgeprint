# /review-pr — Forgeprint PR review

Argument: PR number (`$ARGUMENTS`). If empty, list all open PRs and run this on each in order.

You are Forgeprint's review agent. You decide; you **never** merge or approve. Merging happens only through the repo owner's Approve.

## 0. Preconditions

- If `gh auth status` fails, stop and tell the user.
- CLAUDE.md §5 (rules 8–22) is the review standard. Read it from the file; do not work from memory.
- `skills/blueprint-review/SKILL.md` is the judgment standard: what counts as a duplicate, what makes a recipe or an AGENTS.md acceptable, and how to write the review. Read it before section 3.

## 1. Gather context

```bash
gh pr view $ARGUMENTS --json number,title,author,body,labels,files,baseRefName,headRefName
gh pr diff $ARGUMENTS
gh pr checkout $ARGUMENTS
```

If the PR touches more than one `blueprints/<slug>/` folder → verdict `CHANGES` immediately: "One PR, one blueprint."

## 2. Deterministic checks (local, no Actions needed)

```bash
pnpm install
pnpm run build
pnpm forgeprint validate
pnpm forgeprint lint-setup <slug>
pnpm forgeprint similarity <slug>
```

`validate` covers the whole catalog and takes no argument; the other two take the slug, not a path.

**Read `validate`'s output before deciding what its redness means.** One of its problems is not a fix list:

- `same stack + project_type + requirements combination as "<slug>" (rule 9)` → verdict `DUPLICATE`, immediately, whatever else is red. It is the same finding `similarity` reports as REJECTED, and it is a different conversation from "fix these things": the contributor is redirected to an existing blueprint, not asked to patch this one.

Otherwise: if `validate` or `lint-setup` is red, do not continue the review; put the output in a `CHANGES` comment and stop.

`similarity` is not a pass/fail gate. It fails the command only when the blueprint claims the same `stack + project_type + requirements` triple as an existing one (rule 9) — that is a `DUPLICATE` verdict, immediately. A `RED FLAG` line means "above the threshold, different triple": the command still succeeds, and answering it is section 3's job. Keep the whole report — the three scores and the tag diff — for the comment.

## 3. Judgment checks

Answer each with **yes/no + one-sentence rationale**:

1. Is the PR template section "closest blueprint / difference / why not a PR against it" filled in and convincing?
2. Does the difference from the closest blueprint form a **new `stack + project_type + requirements` triple**? If not, this is a duplicate and belongs in that blueprint's `options`.
3. Any sign of a variant/inheritance (`extends`, "based on X", copied AGENTS.md)?
4. Are `setup.md` steps single command/single operation, each with a verification, all versions pinned?
5. Is `AGENTS.md` specific to this stack, or generic "write good code" advice? Generic → `CHANGES`.
6. Is the change type (`fix|update|feature|breaking`) declared, and are `version` and `CHANGELOG.md` consistent?
7. If this edits an existing blueprint: has a listed `maintainers` member approved? If not and the PR is younger than 14 days → `WAIT_MAINTAINER`. **Unless the author is themselves a listed maintainer** — GitHub does not let anyone approve their own pull request, so waiting for it would deadlock. Authorship satisfies rule 18; the owner's Approve is still required by the ruleset.
8. Security: `curl | sh`, `sudo`, `rm -rf`, network access outside package registries?

## 4. Verdict

Exactly one of four:

| Verdict | Meaning | Label |
|---|---|---|
| `MERGE` | All checks passed; waiting for the owner's Approve | `ready-to-merge` |
| `DUPLICATE` | Copy/variant of existing `<slug>`; redirect there as an option or PR | `duplicate` |
| `CHANGES` | Concrete fix list provided | `changes-requested` |
| `WAIT_MAINTAINER` | Waiting for the blueprint maintainer's approval | `awaiting-maintainer` |

When unsure, do not issue `MERGE`; issue `CHANGES` and state what is unclear. A wrong merge costs more than a wrong rejection.

## 5. Post the comment and label

Comment template:

```
## Forgeprint review — verdict: <MERGE|DUPLICATE|CHANGES|WAIT_MAINTAINER>

**Closest existing blueprint:** <slug> (similarity <score>)
**Why this is / isn't a duplicate:** <one paragraph>

### Checks
- [x] schema / lint / similarity
- [x|✗] distinct stack+type+requirements
- ...

### Required changes (if any)
1. ...

_Automated review by the maintainer's Claude Code agent. Final merge decision rests with @<repo-owner>._
```

```bash
gh pr comment $ARGUMENTS --body-file /tmp/review.md
gh pr edit $ARGUMENTS --add-label "<label>" --remove-label "needs-review"
```

**Never:** `gh pr review --approve`, `gh pr merge`, or pushing to the PR branch. Those belong to the owner.

## 6. Summary for the owner

Three lines: verdict, one-sentence rationale, the single action the owner must take ("click Approve" / "close; contributor redirected to X" / "wait").
