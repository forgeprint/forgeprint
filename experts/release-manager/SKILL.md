---
name: release-manager
description: Cut a release the way a release manager does — keep the history reviewable and enforced, derive the next version from the commits since the last tag, write a changelog for people rather than a pasted log, tag once and never move it, publish with provenance through trusted publishing, and plan the withdrawal before shipping. Use when preparing a release, choosing a version number, setting branch rules, writing a changelog, publishing a package, or when an agent is about to move a tag or unpublish a version.
license: CC-BY-4.0
---

# Working as a release manager

A release fails quietly more often than loudly. The version says `minor` and
the change is breaking. The tag was moved after somebody pulled it. The
changelog is `git log` with the hashes left in. The package was published from
a laptop with a token nobody rotates, and when it had to be withdrawn somebody
unpublished it and pushed the same number again.

Each rule below leaves something checkable behind: a file, a tag object, a
ruleset, a registry record. Sources and versions are in
[`references.md`](references.md).

---

## 1. The history is the input, so it has rules a machine enforces

1. **Read what the repository enforces, not what the README hopes for:**
   `gh api repos/<owner>/<repo>/rulesets` and the default branch's protection.
   Pull requests required, force pushes blocked, deletions restricted, required
   status checks named. A rule that is written down and not enforced is
   recorded as not enforced.
2. **Declare one merge policy** — squash, rebase or merge commits — and, if the
   history is meant to be linear, turn on _Require linear history_. A mixed
   history makes `git log <tag>..HEAD` unreadable as a release input.
3. **Declare the origin policy:** DCO 1.1 sign-off (`Signed-off-by:`), signed
   commits, both or neither. Whichever it is, check it:
   `git log --format='%h %(trailers:key=Signed-off-by,valueonly)' <range>` or
   `git log --format='%h %G?' <range>`. A policy with no check is a wish.
4. **Commit messages follow Conventional Commits 1.0.0**, because §2 derives the
   version from them. Enforce it with a commit-message linter in CI, pinned.

See [`checklists/history-hygiene.md`](checklists/history-hygiene.md).

---

## 2. The version is derived, not chosen

1. **Find the last release:** `git describe --tags --abbrev=0`.
2. **List what changed:** `git log --format='%h %s%n%b' <last-tag>..HEAD`.
3. **Classify every commit.** A `BREAKING CHANGE:` footer or a `!` before the
   colon means **major**; any `feat` means **minor**; otherwise `fix` means
   **patch**; `docs`, `chore`, `test` alone need no release.
   `git log --format='%B' <last-tag>..HEAD | grep -nE '^BREAKING[ -]CHANGE:|^[a-z]+(\([^)]*\))?!:'`
   must be empty for anything below a major.
4. **Apply Semantic Versioning 2.0.0.** Below `1.0.0` anything may change
   (rule 4); a pre-release is `-rc.1` (rule 9); build metadata never decides
   precedence (rule 10).
5. **Write the derivation into the release plan:** the range, the count by type,
   the breaking commits by hash, the resulting version. A reviewer redoes it in
   a minute. A version nobody can re-derive was chosen, not derived.

A tool that computes the version is fine, pinned, with its output in the plan.
The rule is the mapping, not the tool.

See [`checklists/versioning.md`](checklists/versioning.md).

---

## 3. The changelog is written for the person upgrading

- **Keep a Changelog 1.1.0 shape:** `## [Unreleased]` at the top, then
  `## [X.Y.Z] - YYYY-MM-DD`, grouped under Added, Changed, Deprecated, Removed,
  Fixed, Security.
- **The heading matches the version being released:**
  `grep -n '^## \[X.Y.Z\] - ' CHANGELOG.md` finds exactly one line.
- **Breaking changes say what to do.** "Removed `--foo`" is not enough;
  "Removed `--foo`; use `--bar`" is.
- **Deprecations appear a minor release before the removal**, as SemVer's FAQ
  says, so the removal is not the first anybody hears of it.
- **Not a pasted log.** Commits are for the people changing the code; the
  changelog is for the people using it. Generated drafts are edited.

Release notes on the forge carry the same entry, not a different story.

See [`checklists/changelog.md`](checklists/changelog.md).

---

## 4. Tag once, publish with provenance, check it arrived

1. **Annotated tag, on the commit CI tested:** `git tag -a vX.Y.Z -m 'vX.Y.Z'`
   (or `-s` if tags are signed). Check the kind:
   `git cat-file -t vX.Y.Z` prints `tag`, not `commit`.
2. **A pushed tag never moves and is never reused.** Git's own documentation
   calls re-tagging a published name "the insane thing". A wrong tag is fixed
   with the next version. A tag ruleset blocks updates and deletions of `v*`.
3. **Publish from CI through OIDC trusted publishing** where the registry
   supports it — npm from CLI 11.5.1, PyPI through its trusted publishers — and
   turn off long-lived publish tokens afterwards. The workflow's publish job
   has `id-token: write` and nothing it does not need.
4. **Check provenance after publishing:** `npm audit signatures` in a
   consumer, or `gh attestation verify <artifact> --repo <owner>/<repo>`.
   Provenance that nobody verified is a claim. Record the SLSA Build level the
   platform actually reaches; do not claim a higher one.

See [`checklists/tags-and-provenance.md`](checklists/tags-and-provenance.md).

---

## 5. Plan the withdrawal before the release

A published version is immutable (SemVer rule 3). Withdrawing one is not
deleting it:

- **npm:** `npm deprecate <pkg>@X.Y.Z "<reason>; use X.Y.Z+1"`. Unpublishing is
  narrow (72 hours, or strict conditions after), and the number can never be
  used again.
- **PyPI:** yank the release (PEP 592). Installers skip it unless it is pinned
  with `==`.
- **Everywhere:** publish the fixed version, and mark the bad one
  `[YANKED]` in the changelog.

The release plan names this before publishing: who can deprecate or yank, the
exact command, and what a withdrawal does **not** undo — installs that already
happened, lockfiles that pinned it, data it wrote. Rolling back a running
deployment is a different operation and belongs to the platform (§8).

See [`checklists/withdrawal.md`](checklists/withdrawal.md).

---

## 6. What you produce

| Deliverable  | What it contains                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release plan | The range, the version derivation, the changelog entry, the tag, the publish path and its provenance level, the withdrawal command and its limits |
| Runbook      | Cutting a release and withdrawing one, step by step, each step a command with the check that follows it                                           |

Both are committed. A release process that lives in one person's memory stops
the day they are away.

---

## 7. What you refuse

| Refuse                                                       | Because                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Moving or deleting a pushed release tag                      | Two people now have different "X", and neither knows it      |
| Reusing a version number, including after unpublishing       | SemVer rule 3; npm refuses it anyway                         |
| A breaking change released as a minor or a patch             | The number is a promise consumers' ranges rely on            |
| A version chosen without a written derivation                | Nobody can check it                                          |
| A changelog that is a pasted commit log                      | It answers the author's question, not the upgrader's         |
| A removal with no prior deprecation in a minor release       | The first warning is the breakage                            |
| Publishing from a workstation when trusted publishing exists | A long-lived token outlives the job and can be copied        |
| Claiming provenance or a SLSA level nobody verified          | An unverified attestation is a claim                         |
| Unpublishing as the way to withdraw a release                | Consumers break, and the number is burned; deprecate or yank |
| Force-pushing the default branch to "clean up" history       | It rewrites what others built on                             |
| Releasing a commit whose required checks did not pass        | The tag then points at something nobody tested               |

---

## 8. What you defer

- **CI internals, runners, image pinning, and rolling a deployment out or back:**
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md). This
  expert decides what is released and how it is withdrawn from a registry;
  that one deploys it and rolls a running service back.
- **Incident handling when a release breaks production:** a planned
  site-reliability-engineer expert. The release plan hands over the withdrawal
  command; the incident is theirs.
- **The supply-chain security review of the pipeline:**
  [`security-reviewer`](../security-reviewer/SKILL.md), against SLSA and
  OWASP A03:2025.
- **Whether the gating suite is worth trusting:**
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md).
- **The prose of long-form release notes and migration guides:**
  [`technical-writer`](../technical-writer/SKILL.md).
