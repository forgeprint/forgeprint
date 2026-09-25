# Release Manager

## What it changes

An agent asked to "cut a release" bumps whatever number feels right, writes a
changelog from `git log`, tags the commit it happens to be on, and publishes
with whatever token is in the environment. When the release is bad, it
unpublishes it. This expert changes five things:

- **The version is derived and the derivation is written down.** Commits since
  the last tag, classified by Conventional Commits type, mapped to SemVer. A
  breaking marker anywhere in the range makes it a major, and the grep that
  proves there is none is in the procedure.
- **The repository enforces its own history rules.** It reads the rulesets
  rather than the README: pull requests required, force pushes blocked, a merge
  policy and a sign-off or signature policy that a command checks.
- **The changelog is for the upgrader.** Keep a Changelog 1.1.0 shape, one
  heading per version, a replacement named for every breaking change, and a
  deprecation one minor release before any removal.
- **Tags never move, and provenance is verified.** Annotated tags protected by
  a ruleset; OIDC trusted publishing instead of long-lived tokens; a
  consumer-side verification command after publishing, and the SLSA level the
  platform actually reaches, not a higher one.
- **Withdrawal is planned before release.** Deprecate or yank, publish the
  next number, mark the old one `[YANKED]`. Never unpublish and reuse.

Five checklists — history hygiene, versioning, changelog, tags and provenance,
withdrawal — and eleven refusals.

## What it fits

- A library or CLI published to a registry, where the version number is a
  contract with every consumer's dependency range.
- Setting up a repository's branch and tag rules, and its commit conventions,
  so that releases can be derived rather than decided.
- Moving a project from publishing by hand with a token to trusted publishing
  from CI.
- Reviewing a release pull request: is the number right, does the changelog
  match it, and is there a way back.
- Any language. The commands are git, the forge's CLI and the registry's own
  tools.

## What it does not fit

- **Deploying and rolling back a running service.** Canaries, feature flags,
  blue-green, a rollback of a deployment:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md). This
  expert withdraws a version from a registry; it cannot take code off a server.
- **CI internals** — runners, caching, image pinning, workflow permissions
  beyond the publish job: also the platform engineer's.
- **Incident handling** when a release breaks production: a planned
  site-reliability-engineer expert owns the incident and the postmortem. This
  one hands over the withdrawal command.
- **Release trains, calendars and cross-team scheduling.** The 2026-09-24
  research found the demand is for git hygiene and the release itself; a
  release-train coordinator is a programme role, closer to
  [`technical-program-manager`](../technical-program-manager/SKILL.md).
- **App-store releases.** Store review, staged rollouts and signing identities
  follow the store's rules, which are not covered here.
- **Calendar versioning or a project that deliberately does not use SemVer.**
  The derivation in §2 assumes SemVer; the tag, changelog and withdrawal rules
  still apply.

## Pros and cons

**In its favour:** nearly every rule is a command with an expected output —
`git cat-file -t` prints `tag`, the breaking-change grep is empty, the changelog
heading appears once, the attestation verifies. Its most useful refusal is the
least intuitive: never unpublish. That instinct is what burns version numbers
and breaks consumers who pinned exactly the release being withdrawn.

**Against it:** it assumes a forge with rulesets and a registry with trusted
publishing. Self-hosted runners are not supported by npm's trusted publishing
at the time of checking, and on those the token stays. The derivation depends on
disciplined commit messages; in a repository that never had them, the first
release under this expert is a manual classification. And it has not been run
on a real project by a person — `provenance: generated` is the honest label.
