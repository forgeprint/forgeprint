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

**Decide the kind first**, from the folders the PR touches. Everything after this is kind-dependent:

| Folders touched | Kind | Rule |
|---|---|---|
| `blueprints/<slug>/` | blueprint | More than one folder → `CHANGES`: "One PR, one blueprint" |
| `experts/<slug>/` | expert | More than one folder → `CHANGES`: "One PR, one expert" |
| `crews/<slug>/` | crew | A crew PR may not also edit a member; link, do not change |
| `integrations/<slug>/` | integration | More than one folder → `CHANGES` |
| Only a manifest's `agents` list, plus evidence in the body | **agent-verification** | See §3c. This is the small PR type, reviewed differently |
| `schema/`, `packages/`, `docs/` | tooling | Not this command's job; review it as ordinary code |

A PR that mixes kinds → `CHANGES`. They are reviewed against different rules
and a mixed one gets the weaker half of both.

## 2. Deterministic checks (local, no Actions needed)

```bash
pnpm install
pnpm run build
pnpm forgeprint validate
pnpm forgeprint render-check
```

Then, for the kind this PR is:

```bash
# blueprint
pnpm forgeprint lint-setup <slug>
pnpm forgeprint similarity <slug>

# expert
pnpm forgeprint similarity --expert <slug>

# crew and integration — `validate` is the whole deterministic layer.
# It checks members and integrations resolve, the member set is unique
# (rule 9), the upstream is pinned and https, and the install commands
# pass the same safety rules a setup step does.
```

`validate` covers the whole catalog and takes no argument; the other two take the slug, not a path.

**Read `validate`'s output before deciding what its redness means.** One of its problems is not a fix list:

- `same stack + project_type + requirements combination as "<slug>" (rule 9)` → verdict `DUPLICATE`, immediately, whatever else is red. It is the same finding `similarity` reports as REJECTED, and it is a different conversation from "fix these things": the contributor is redirected to an existing blueprint, not asked to patch this one.

Otherwise: if `validate` or `lint-setup` is red, do not continue the review; put the output in a `CHANGES` comment and stop.

`similarity` is not a pass/fail gate. It fails the command only when the blueprint claims the same `stack + project_type + requirements` triple as an existing one (rule 9) — that is a `DUPLICATE` verdict, immediately. A `RED FLAG` line means "above the threshold, different triple": the command still succeeds, and answering it is section 3's job. Keep the whole report — the three scores and the tag diff — for the comment.

## 3. Judgment checks — blueprint

Answer each with **yes/no + one-sentence rationale**:

1. Is the PR template section "closest blueprint / difference / why not a PR against it" filled in and convincing?
2. Does the difference from the closest blueprint form a **new `stack + project_type + requirements` triple**? If not, this is a duplicate and belongs in that blueprint's `options`.
3. Any sign of a variant/inheritance (`extends`, "based on X", copied AGENTS.md)?
4. Are `setup.md` steps single command/single operation, each with a verification, all versions pinned?
5. Is `AGENTS.md` specific to this stack, or generic "write good code" advice? Generic → `CHANGES`.
6. Is the change type (`fix|update|feature|breaking`) declared, and are `version` and `CHANGELOG.md` consistent?
7. If this edits an existing blueprint: has a listed `maintainers` member approved? If not and the PR is younger than 14 days → `WAIT_MAINTAINER`. **Unless the author is themselves a listed maintainer** — GitHub does not let anyone approve their own pull request, so waiting for it would deadlock. Authorship satisfies rule 18; the owner's Approve is still required by the ruleset.
8. Security: `curl | sh`, `sudo`, `rm -rf`, network access outside package registries?

## 3b. Judgment checks — expert, crew, integration

Answer each with **yes/no + one sentence**. The standard is
`skills/expert-author/SKILL.md` and `skills/crew-author/SKILL.md`; read whichever
applies before deciding.

**Expert**

1. Is there an instruction in `SKILL.md` the agent cannot verify it followed?
   One is a note; several is the verdict. That is the bar this unit type exists
   for.
2. Does `references.md` carry a source, a version and a date on every row, and
   does every checklist row cite one?
3. Does it restate a standard `docs/review-standards.md` already tracks? Two
   copies is one copy that is wrong → `CHANGES`.
4. Does every `checklists` name have a file? (`validate` catches this; say it in
   the comment rather than leaving the contributor to read CI.)
5. Is `overview.md`'s "what it does not fit" real, or evasive?
6. Does the author say what came out differently when they used it on something
   real? Absent → `CHANGES`; it is the only evidence that settles the first
   question.
7. Is `provenance` honest? Written from research rather than practice is
   `generated`, and `generated` cannot be `official` (ADR 0011).

**Crew**

1. Is `not_for` concrete, or does it avoid saying anything? Evasive →
   `CHANGES`.
2. Does the README say where the members disagree? Members who never disagree
   are probably one expert wearing two hats.
3. Does it copy anything from a member rather than linking? Copied content
   drifts within two changes.
4. Is the byline a person's? A crew under the catalog's name is a
   recommendation nobody is accountable for.
5. At most six members, and would a reader plausibly take all of them?

**Integration**

This is the kind that points at somebody else's code, so it gets the extra
check rule 22 asks for:

1. **Is the upstream real?** Open it. Does the project exist, is it the
   project the manifest names, and is the maintainer who you would expect? A
   package whose maintainer is not its original author is worth a question in
   the review, not a silent merge.
2. Is `upstream_version` a pin that exists upstream? Check the release or the
   registry; do not take the manifest's word.
3. Does `permissions_summary` describe what the secret actually reaches, in
   plain words a user could refuse?
4. Does any install command contain a literal credential, a moving tag, a pipe
   into a shell, or `sudo`? (`validate` refuses these; confirm the command
   *references a variable* rather than merely passing the linter.)
5. Is there a command for an agent nobody verified? A guessed command is worse
   than a missing one → `CHANGES`.

## 3c. Judgment checks — agent-verification

The small pull request type: somebody ran an existing entry with an agent that
was not on its list, and adds that agent to `agents[]`. Nothing else changes.

1. Does the diff touch **only** the `agents` list and the version and
   CHANGELOG? Anything else makes it an ordinary PR of its kind.
2. Is the agent in `schema/agents.yaml`? If not, that is a separate PR first.
3. **Is there evidence in the body?** A transcript, a log, a screenshot, or a
   description specific enough that somebody could repeat it. `agents[]` means
   tested, and a claim with no evidence is the one thing this field cannot
   afford (ADR 0013).
4. Does the evidence show the entry working with that agent, rather than the
   agent starting up?

No evidence → `CHANGES`, and say exactly what would satisfy it. This is a
friendly PR type and the bar is still evidence.

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

**Kind:** <blueprint|expert|crew|integration|agent-verification>
**Closest existing entry:** <slug> (similarity <score>, or "not applicable")
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
