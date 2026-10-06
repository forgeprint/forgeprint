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
| `--skip-npm`   | let the release workflow publish to npm (§7)             |
| `-y`           | do not ask; for a plan you have already read             |

One thing stays outside it: the [dogfood test](dogfood.md), which it prints
when it finishes.

### mcp-publisher has to be on the PATH of the shell you release from

The command publishes to the MCP Registry itself, and that needs the tool
findable. `mcp-publisher` is a single downloaded binary rather than a package,
so it sits wherever you put it — and on Windows that is usually `~/bin`, which
Git Bash searches and PowerShell does not. The same machine answers
`mcp-publisher 1.8.1` in one shell and "not recognized" in the other.

Check before you release, in the shell you will release from:

```bash
mcp-publisher --version
```

If it is missing, either add its directory to that shell's PATH or call it by
full path. `release` reports this case by name rather than as a failed publish,
because the tool is not what went wrong.

### Publishing under the organization

`server.json` is named `io.github.forgeprint/forgeprint`, and that namespace
belongs to the organization, not to a person. Two things decide whether you may
publish into it, and the error you get when either is wrong names neither.

**You must be an Owner of the organization.** Since July 2026 the registry
grants an organization namespace only to members whose role is `admin`;
ordinary membership no longer counts. Check it:

```bash
gh api user/memberships/orgs/forgeprint --jq .role
```

**The registry must be able to see that.** This is the one that cost 0.3.0 half
an hour. `mcp-publisher login github` runs a device flow as a GitHub App, and a
GitHub App that is not installed on the organization cannot read your
membership in it. The login succeeds, the publish is refused, and the refusal
says:

```
You have permission to publish: io.github.<you>/*.
Attempting to publish: io.github.forgeprint/forgeprint.
... you may need to make your organization membership public
```

**The advice at the end is out of date.** Public membership was the rule before
the Owner-only change, and making it public changes nothing now. Logging in
again changes nothing either — the same login gives the same answer.

What works is a classic personal access token with **only** `read:org`, which
is not bound to an app installation and can read your role directly:

1. Create one at `https://github.com/settings/tokens/new?scopes=read:org`.
   Tick nothing else: the registry never reads or writes code, and a token with
   `repo` in it would be handed to a third party for no reason.
2. Log in with it. The token goes in the **`-token` flag**: `mcp-publisher`
   1.8.1 reads no environment variable for it, and `mcp-publisher login github`
   on its own runs the device flow — the one that cannot see the organization.
   `login` is also the only command that takes it; `publish` uses the registry
   token `login` stored, so passing it to `publish` retries with the old login.

   ```bash
   read -rs PAT                                  # paste it; nothing is echoed or kept in history
   mcp-publisher login github -token "$PAT"      # no device code appears; that is the signal
   unset PAT
   mcp-publisher publish server.json
   ```

   If a device code appears, the flag did not arrive and nothing is logged in
   yet. Stop there rather than completing the device flow, which authenticates
   as you without the organization and is refused at publish.

3. Delete the token on GitHub. The registry token `login` stored is what later
   publishes use, so the PAT's job is over as soon as `login` succeeds.

`release` recognises this refusal and says so rather than telling you to log in
again.

`login github-oidc` is the path that ends all of this — GitHub Actions
authenticating as the repository, with no credential on anybody's laptop and no
app installation to reason about. The same answer as npm trusted publishing,
and the same open roadmap item.

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

**Use pnpm, not npm.** `forgeprint-mcp` depends on `forgeprint` through the
`workspace:*` protocol, and only pnpm rewrites that to a real version as it
packs. Publishing the server with plain `npm` ships a `package.json` nobody can
install. Confirm it landed right:

```bash
npm view forgeprint-mcp dependencies.forgeprint
```

### Two ways to publish, and which one to use

| Path                     | Command                                             | Authentication                 |
| ------------------------ | --------------------------------------------------- | ------------------------------ |
| **Workflow** (preferred) | `pnpm forgeprint release <v> --skip-npm`, then wait | npm trusted publishing (OIDC)  |
| **Laptop** (§4 fallback) | `pnpm forgeprint release <v>`                       | A granular access token, below |

The workflow path exists so that no token has to exist. `--skip-npm` stops the
release command after the tag and the GitHub release; pushing the tag is what
starts [`.github/workflows/release.yml`](../.github/workflows/release.yml),
which runs the gate again and then `forgeprint publish <v> --trusted`. npm
exchanges the job's OIDC token for publish rights and attaches provenance
itself — on a public repository you get provenance whether or not you ask.

Then finish the release, because the MCP Registry cannot be done by a workflow:

```bash
gh run watch                     # or the Actions tab, workflow "release"
pnpm forgeprint release 0.3.0    # npm is already served, so this does the registry step
```

That second run publishes nothing: every package is already on the registry, so
it skips to the MCP Registry, which proves ownership by reading `mcpName` out of
the **published** npm package and therefore could never have gone first.

The laptop path is unchanged and is not deprecated. Actions being unavailable
delays a release; it does not block one (§4).

#### The one-time setup, which only the maintainer can do

Nothing in this repository can configure the other end. On npmjs.com, for each
of `forgeprint` and `forgeprint-mcp`, under **Settings → Trusted publisher**:

| Field             | Value                      |
| ----------------- | -------------------------- |
| Organization      | `forgeprint`               |
| Repository        | `forgeprint`               |
| Workflow filename | `release.yml`              |
| Environment       | leave empty                |
| Allowed actions   | must include `npm publish` |

Every field is case-sensitive, and the workflow field is the **filename**, not
the path — `release.yml`, never `.github/workflows/release.yml`. Getting it
wrong produces `E404 Not Found - PUT https://registry.npmjs.org/<package>`,
which reads as "no such package" and means "the OIDC exchange was refused".
`forgeprint publish` says so when it sees a 401 or 404 from a `--trusted` run,
because that error message has cost other projects an afternoon.

Three things are worth knowing before the first attempt:

- **Do not give `actions/setup-node` a `registry-url`.** With one it writes an
  `.npmrc` containing `_authToken=${NODE_AUTH_TOKEN}` and points
  `NPM_CONFIG_USERCONFIG` at it. Trusted publishing sets no `NODE_AUTH_TOKEN`,
  so npm finds an auth token already configured, sends that empty value, and
  never asks GitHub for an OIDC token at all: the registry answers
  `ENEEDAUTH`. It reads like a credentials problem and is a configuration one,
  in the workflow rather than on npmjs.com. `registry.npmjs.org` is npm's
  default, so the field buys nothing. This is how 0.4.0's release failed.
- **A brand-new package cannot be published this way.** A trusted publisher is
  configured on a package that exists, so the first version of anything new
  goes up from a laptop with a token. Both current packages exist.
- **OIDC authenticates `npm publish` only** — not `npm dist-tag`, `npm whoami`
  or `npm deprecate`. Those still need a token when they are needed.

### An unverified CI is a question, not a note

`release` asks GitHub whether CI is green on the commit it is about to tag, and
there are four answers rather than two:

| Answer            | What `release` does                                           |
| ----------------- | ------------------------------------------------------------- |
| failed            | refuses                                                       |
| green             | proceeds                                                      |
| `--skip-ci`       | proceeds, and the flag is your statement that you verified it |
| could not be read | asks, and `--yes` is refused with the flag that answers it    |

The last row is the one that bit. `gh` timing out used to print
`CI state unknown` and continue, so 0.4.1 was tagged while `setup-test` was
still running. Releasing without Actions has to stay possible — §4 — so this
is a question rather than a refusal; it just is not answered by default, and
`--yes` does not answer it, because "do not ask whether I meant it" is a
different statement from "an unverifiable check counts as verified".

**Rehearse it before spending a version.** `release.yml` takes a manual run:

```bash
gh workflow run release.yml --ref main
```

That path publishes nothing. It reports the environment and then tries to
publish a version npmjs.com already serves, which cannot be published over —
so npm has to authenticate first and is refused for the version instead.
`E403 cannot publish over the previously published versions` is the pass;
`ENEEDAUTH` means it is still not working. The rehearsal belongs in that file
and nowhere else, because the publisher is matched on the workflow
**filename** — the same rehearsal in its own workflow is refused for not
matching, with the identical error message.

**A trusted publisher is configured per package, and the symptom of a missing
one is a login error.** 0.4.0 and 0.4.1 both failed this way. What npm reports
is `ENEEDAUTH`, "This command requires you to be logged in"; what actually
happened is one line further down, and only at `--loglevel verbose`:

```
npm http fetch GET  .../idtoken/...?audience=npm%3Aregistry.npmjs.org 200
npm http fetch POST 404 https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/forgeprint
npm verbose oidc Failed token exchange request with body message:
                 OIDC token exchange error - package not found
```

GitHub issued the token; the registry declined the exchange. That endpoint is
per package, so "package not found" on a package npm plainly serves means no
publisher is registered **on that package** — configuring one package does not
cover the other. npm then falls through to an unauthenticated publish, which
is where the login error comes from. `forgeprint publish` asks for verbose
output and names this case now, because the symptom points at the wrong half
of the setup.

Requirements, which the workflow already pins: npm CLI 11.5.1 or later and Node
22.14.0 or later. Node 22 bundles npm 10, so the workflow installs npm itself;
leaving that out is the other way this fails.

Until the trusted publishers are configured, `--skip-npm` has nothing to hand
the work to. Use the laptop path.

### The token, which is where the time goes

A granular access token carries a write permission level and, separately, a
bypass-2FA checkbox. Two of the three combinations cannot publish this
repository:

| Permission                  | What happens                                            |
| --------------------------- | ------------------------------------------------------- |
| Read and write              | Correct. Prompts for 2FA in the browser at publish time |
| Read and write (stage only) | Every publish fails `403 E_STAGE_REQUIRED`              |
| Read and write + bypass 2FA | Works today, loses direct publish in January 2027       |

Pick **Read and write**, the one with nothing in parentheses, and leave
**Bypass two-factor authentication** unchecked. The bypass box is not a
convenience being preserved: npm
[announced](https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens/)
that bypass-2FA tokens lose direct publish, targeting January 2027, and their
publishing surface drops to staging.

The trap is that **nothing on your machine can tell you which one you picked.**
`npm token list --json` reports `bypass_2fa` and a `package: write` permission
for a stage-only token exactly as it does for a working one. `npm whoami`
answers with your username. The 403 at publish time is the only signal, and it
arrives after the tag and the GitHub release are already pushed.

So when a publish fails with `E_STAGE_REQUIRED`, do not debug npm, pnpm, 2FA or
the registry. Generate a new token at the right permission level, point the
user config at it, and run the release command again:

```bash
npm config set --location=user //registry.npmjs.org/:_authToken=<new token>
```

Store it in the user config, never in the repository. The repository's own
`.npmrc` holds `engine-strict=true` and must never hold anything else.

### When publish reports an error, check the registry before believing it

Three failures look alike and none means what it says.

**`403 E_STAGE_REQUIRED`** is the token, not the package. See above.

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

The `npm stage` subcommands need **npm 11.15.0 or later**; older npm answers
`Unknown command: "stage"`, which is a stale CLI and not an answer about your
packages. Run them from a throwaway install rather than upgrading the npm your
toolchain depends on:

```bash
npm i npm@latest --prefix /tmp/npm-latest --no-save
node /tmp/npm-latest/node_modules/npm/bin/npm-cli.js stage list forgeprint
```

In every case, read the registry rather than the error:

```bash
npm cache clean --force
npm view forgeprint dist-tags --prefer-online
npm view forgeprint-mcp dist-tags --prefer-online
```

`--prefer-online` is not enough on its own — it has returned the previous
version for minutes after a publish that the package page already showed as
live. When the CLI and the package page on npmjs.com disagree, the page is
right.

**A publish that says it worked can 404 for a minute.** 0.3.0 reported
`Published`, and for roughly ninety seconds afterwards the registry returned
404 for that exact version while `npm stage list` reported nothing staged —
which together look like a silent failure and are not one. Ask the registry
document for the truth, because it carries a timestamp and `npm view` does not:

```bash
curl -s https://registry.npmjs.org/forgeprint | \
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const p=JSON.parse(s);console.log(p['dist-tags'].latest,p.time.modified)})"
```

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
