# Releasing

What the core maintainer does to cut a release. Everything here is a command
that runs on a laptop; nothing waits on Actions (ADR 0002).

---

## The short version

```bash
pnpm forgeprint release 0.3.0
```

That is the whole release. It checks the repository, the versions and the
changelogs, asks GitHub whether CI is green on the commit being tagged, writes
a draft of the release notes the first time and stops so a human can rewrite
them, prints what it is about to do, asks once, and then tags, releases and
publishes each package — verifying every publish against the registry rather
than trusting what the publish command said.

It is safe to run again. Anything already done is skipped, so a release that
stopped halfway finishes by running the same command.

| Flag           | When                                                     |
| -------------- | -------------------------------------------------------- |
| `--dry-run`    | print the plan and stop                                  |
| `--skip-check` | CI already ran `pnpm run check` on this commit           |
| `--skip-ci`    | Actions is unavailable and you verified it yourself (§4) |
| `--no-wait`    | refuse rather than wait for a workflow still running     |
| `-y`           | do not ask; for a plan you have already read             |

Two things stay outside it, because both are someone else's registry and
neither is reversible: `mcp-publisher publish server.json`, and the
[dogfood test](dogfood.md). It prints both when it finishes.

The rest of this file is what the command does, in case it is unavailable or
you want to do a step by hand.

---

## 1. The catalog is correct

```bash
pnpm run check
pnpm forgeprint lint-setup --all
pnpm forgeprint similarity --all
```

`check` covers formatting, lint, types, every test suite, `validate` — which
now includes the skill format the distribution tools read (ADR 0006) — and the
committed site.

## 2. The recipes actually run

```bash
pnpm forgeprint test-setup --all --all-options
```

The full matrix, not one combination. CI runs this on every push to `main` and
every Monday; run it again before a release, because a release is what people
install.

## 3. Refresh the request snapshot

```bash
pnpm forgeprint build-requests
pnpm run build-site
```

The site reads the live queue in the browser, but it ships with a dated
snapshot for readers whose request fails (ADR 0007). A release is the moment to
make that snapshot current. Commit both files.

## 4. Verify the skill tools still agree

```bash
gh skill publish --dry-run .
npx skills add forgeprint/forgeprint --list
```

The first is the specification's own validator; if it disagrees with
`forgeprint validate`, the specification wins and the repository changes.
Record what was run in [ADR 0006](decisions/0006-skill-distribution.md).

## 5. Versions and changelogs

- Bump each published package in `packages/*/package.json`.
- Write the entry in that package's `CHANGELOG.md` — a bump without an entry is
  a defect, the same rule blueprints live under (rule 17).
- Blueprints carry their own versions; a blueprint that changed needs its bump
  and its entry in the same pull request that changed it.

## 6. Tag and release

```bash
git tag -a vX.Y.Z -m "Forgeprint X.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "Forgeprint X.Y.Z" --notes-file <notes>
```

Releases are immutable and tags are protected by the `protect-tags` ruleset, so
the notes have to be right before they are published, not after. Wait for the
`setup-test` matrix on the tagged commit to go green **before** pushing the
tag: a tag that cannot be moved should not point at a commit nobody verified.

`gh skill install` resolves the latest tag before the default branch, so this
step is also what ships a changed skill to everyone who installs one.

## 7. npm

```bash
pnpm publish -r --dry-run
pnpm publish -r --access public
```

Publishing is manual today. Replacing it with npm trusted publishing — Actions
OIDC and provenance — is on the roadmap; until then the token stays on the
maintainer's machine.

### When publish reports an error, check the registry before believing it

Two failures look alike and neither means what it says.

**`409 Conflict: Cannot publish over previously staged version "X.Y.Z"`** does
not mean a staged version is waiting for approval. It is npm's message for
"this version already exists" ([npm/cli#9889]), and it appears _after a publish
that succeeded_ — the package is on the registry and the client tried again.
Check `npm stage list <package>`: an empty list means nothing is staged and
there is nothing to approve or reject. Do not bump the version to escape it;
the version is published.

**`404 Not Found`** on publish means the credentials are rejected, not that the
package is missing. npm answers unauthorized requests for packages you cannot
write with 404. Confirm with `npm whoami`, which says `401` plainly.

In both cases, read the registry rather than the error:

```bash
npm cache clean --force
npm view forgeprint dist-tags --prefer-online
npm view forgeprint-mcp dist-tags --prefer-online
```

`--prefer-online` is not enough on its own — it has returned the previous
version for minutes after a publish that the package page already showed as
live. When the CLI and the package page on npmjs.com disagree, the page is
right.

If one package published and another did not, continue with
`pnpm publish --filter <package> --access public`. Re-running `pnpm publish -r`
makes the first package fail again and stops the run.

[npm/cli#9889]: https://github.com/npm/cli/issues/9889

## 8. Afterwards

- Check the site: https://forgeprint.github.io/forgeprint
- Check the install path a stranger uses:
  `npx -y forgeprint-mcp@latest` in an empty directory. Add `--prefer-online`
  if npm serves a stale version; npm's metadata cache has lied before.
- If the release changed anything a first-time user sees, the
  [dogfood test](dogfood.md) is due again.
