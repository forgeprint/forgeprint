# Release Crew

_Assembled by @aliosmanmho_

Four experts for cutting a release of a running service the same way every
time: a version derived from the history, a gate whose red means stop, a staged
rollout with a rollback somebody has actually run, and a watch on the error
budget afterwards that decides whether it stays out.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                          | What it brings                                                            | The question it asks first                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`release-manager`](../../experts/release-manager/SKILL.md)                     | A version derived from the history, a changelog, a tag that never moves   | How is this release withdrawn, written down before it ships |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)               | The release gate, and what a red build means                              | Is anything quarantined that should be blocking             |
| [`devops-platform-engineer`](../../experts/devops-platform-engineer/SKILL.md)   | A pinned pipeline, a staged rollout, and a rollback that is a tested path | When was a rollback last performed, and by whom             |
| [`site-reliability-engineer`](../../experts/site-reliability-engineer/SKILL.md) | The error budget policy and the burn-rate watch after the deploy          | Is there budget left to spend on this release at all        |

**Two checkers, before and after.** The QA lead is the gate before the
rollout; the SRE is the check after it, on burn rate against the SLO. Neither
is the member that cut the release.

## What they install

| Integration                                             | Why this crew wants it                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`github-mcp`](../../integrations/github-mcp/README.md) | Tags, releases, workflow runs and the history the version is derived from   |
| [`sentry-mcp`](../../integrations/sentry-mcp/README.md) | New errors by release, which is the first thing the post-deploy watch reads |

Both are third-party software with write access: the GitHub token can push to
every repository it can see, and Sentry can resolve issues. Read each README,
and give the release a token scoped to the one repository.

## The order they are useful in

1. **SRE first, briefly**: is there error budget left? If the written policy
   says releases stop, they stop, and the rest of the crew waits.
2. **Release manager second**: the version from the commit history, the
   changelog entry, the withdrawal plan.
3. **QA lead third**: the gate, run as the pipeline runs it, with every
   quarantined test accounted for.
4. **Platform engineer fourth**: the staged rollout, and the rollback criteria
   written before the first stage.
5. **SRE last**: the burn-rate watch through the rollout; a fast burn triggers
   the rollback the platform engineer already tested.

They disagree in two places, and the disagreement is useful:

- The release manager has a date; the SRE's budget policy can freeze releases.
  The written policy wins, because it was agreed before anybody wanted this
  release out.
- Under pressure, the platform engineer will want to re-point a tag at a
  hot-fixed build. The release manager refuses: a published version never
  changes, and the fix is a new version.

## Why four, and why often one

- The crews research rated this shape medium risk because it is "often one
  agent following a checklist". Kim et al. measured sequential work getting
  39% to 70% worse with more agents. A release is sequential, so the crew is
  four checklists loaded in turn, not four agents at once
  ([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md)).
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification.
  The gate before and the watch after are two different verifications, owned
  by two members who did not cut the release.

## Where this crew is wrong

- **Feature design.** Nothing here decides what goes in the release.
- **Building infrastructure from nothing.** Take the platform engineer alone.
- **A routine patch release.** Small and sequential: one agent follows the
  release manager's checklist in order and is done.

## How to use it

Ask your agent for the crew by name at the start of the release, and let the
SRE's budget question go first.
