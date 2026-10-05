# Creator kit

The route from "I know how to do this job" to "it is in the catalog, under my
name".

[CONTRIBUTING.md](../CONTRIBUTING.md) is the contract — what a pull request
must contain. This page is the other half: what is worth building, what you get
for building it, and what is already refused so you do not spend a weekend on
it. Where the two disagree, CONTRIBUTING is right and this page is stale;
please say so in an issue.

---

## 1. Pick something that is missing

Nothing here rewards a second entry for a job the catalog already does — rule 9
refuses it outright, and rule 13 means you get redirected rather than ignored.
So start from a gap. There are three published ones:

| Gap                       | Where to read it                                                                                                                                                      | Size on 2026-10-02                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **An empty role**         | The "roles open" list on the [catalog page](https://forgeprint.github.io/forgeprint/catalog.html)                                                                     | 30 of 61 roles have no expert behind them |
| **An empty domain**       | The same page, grouped by domain                                                                                                                                      | 12 of 16 domains have at least one expert |
| **A requested blueprint** | [`docs/requests.json`](requests.json), fed by the MCP tool `request_blueprint` and read live by the site ([ADR 0007](decisions/0007-live-requests-no-write-token.md)) | Empty — nobody has asked yet              |

The taxonomy is deliberately wider than the catalog: a role with nothing behind
it is a contribution call, not an oversight. Pick one you actually do for a
living. An expert written from reading about a job rather than doing it is the
one failure mode review catches every time, because `references.md` has nothing
real in it.

Then check that your idea is not already there, before you write anything:

```bash
pnpm forgeprint similarity --expert <your-slug>   # for an expert
pnpm forgeprint similarity <your-slug>            # for a blueprint
```

`validate` enforces the rest of rule 9 across the whole catalog: one blueprint
per `stack + project_type + requirements`, one expert per
`role + domain + seniority + languages`, one crew per member-and-integration
set, one integration per upstream.

---

## 2. The four kinds, and what each one asks of you

| Kind            | Required files                                                                             | The gate on top of `validate` and `render-check`              | The hard part                                                                          |
| --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Blueprint**   | `manifest.yaml`, `AGENTS.md`, `overview.md`, `setup.md`, `CHANGELOG.md`                    | `lint-setup <slug>`, `similarity <slug>`, `test-setup <slug>` | `setup.md`. Every step numbered, pinned, and ending in a command that proves it        |
| **Expert**      | `manifest.yaml`, `SKILL.md`, `overview.md`, `references.md`, `CHANGELOG.md`, `checklists/` | `similarity --expert <slug>`                                  | `references.md`. Every checklist item cites a named standard with the date you read it |
| **Crew**        | `manifest.yaml`, `README.md`, `CHANGELOG.md`                                               | `validate` is the whole deterministic layer                   | `not_for`. A crew that is right for everything is a catalog with a title               |
| **Integration** | `manifest.yaml`, `README.md`, `CHANGELOG.md`                                               | `validate` is the whole deterministic layer                   | Reading the upstream. You are vouching for somebody else's code                        |

A crew takes at most **6** members and copies nothing — it names experts and
integrations by slug, so editing an expert changes every crew that names it.
That is composition, not inheritance, which is why it does not touch rule 8.

A blueprint also gets an architecture and security review on the pull request,
run by the maintainer with `/arch-review <slug>` and committed under
`docs/reviews/`. That one is not yours to run: a `community` entry is reviewed
as part of the merge decision, and open `critical` or `high` findings are what
keep an entry out of `official` (rule 23). Reading
[`docs/review-standards.md`](review-standards.md) before you write is still the
cheapest way to not meet it for the first time in a review comment.

Three of the four have a skill that is this process turned into a procedure:
[`blueprint-author`](../skills/blueprint-author/SKILL.md),
[`expert-author`](../skills/expert-author/SKILL.md),
[`crew-author`](../skills/crew-author/SKILL.md). Point your agent at the one
you need. An integration has no skill yet; its rules are in CLAUDE.md §3.1b.

---

## 3. Your name, and where it ends up

This is the part no other catalog does, so it is worth being precise about.

- **`maintainers`** in your manifest puts you on the entry's page on the site,
  with your avatar and a link to your GitHub profile, and into
  [`.github/CODEOWNERS`](../.github/CODEOWNERS) automatically, so you are asked
  to review changes to what you wrote.
- **`byline`** is a crew's own field, 2 to 80 characters, printed verbatim on
  the crew's page and on its card in the catalog. A crew is the one unit that
  is somebody's opinion about who belongs together, so it is published under
  that person's name rather than the project's. "Assembled by @you" is the
  conventional form; it is a free-text field and yours to write.
- **Maintainership is per entry.** Nobody accumulates authority over the
  catalog by holding many of them ([GOVERNANCE](../GOVERNANCE.md)).
- **`tier`** is `community` for every contribution, and is never raised by the
  entry's own author. `verified` means somebody other than you ran the recipe
  on a clean machine.

After **three meaningful merged pull requests** on the same entry you are
offered co-maintainership — a fix, an option or a setup correction, not a typo.
Offered by hand today; a bot when there is a second maintainer to make one worth
writing.

---

## 4. The route

```bash
# once, per clone
pnpm install --frozen-lockfile && pnpm run build
git config user.email <your-noreply-address>
git config core.hooksPath .githooks        # gitleaks, if you have it installed

# write the folder, then
pnpm forgeprint validate
pnpm forgeprint render-check
# plus your kind's row from the table above

# and the whole gate, which is what CI runs
pnpm run check
```

Then open the pull request. The template asks which kind it is, which change
type (`fix | update | feature | breaking`, which decides the semver bump), and
one question that fails the check when it is left empty: **the closest existing
entry, what is different, and why this is not a pull request against that one.**
That question is rule 11, and it exists because the honest answer is sometimes
"it should have been" — which is a better outcome than a near-duplicate.

Content is written once, as `AGENTS.md` and `SKILL.md`. Per-agent files are
generated by `forgeprint render --agent <id>`; writing one by hand is rule 8 in
a second costume ([ADR 0013](decisions/0013-agent-agnostic.md)).

---

## 5. What sends a pull request back

In the order it actually happens:

1. **The sign-off does not name the commit's own author**, or sits in its own
   paragraph. Git reads only the last paragraph as trailers, and the DCO check
   reads what git reads.
2. **A version that did not move, or moved without a `CHANGELOG.md` entry**
   behind it (rule 17).
3. **`validate` red.** A checklist named in a manifest with no
   `checklists/<name>.md` behind it. An `upstream_version` of `latest`, `main`,
   `master`, `head`, `stable`, `edge` or `*` — a pin that moves is not a pin. An
   `upstream` that is not `https`. A missing `permissions_summary`. A crew whose
   `not_for` is a way of saying "nothing".
4. **`lint-setup` red.** A step with no verification command, an unpinned
   version, `curl | sh`, `sudo`, `rm -rf`, a write to a system directory, a
   moving container tag, or a literal credential.
5. **A second entry for a combination that already exists** — verdict
   `DUPLICATE`, and you are pointed at the existing entry as an option or a
   pull request against it. Never silently closed (rule 13).
6. **Non-English text anywhere in the repository**, or a `tier` you raised
   yourself.

Only the core maintainer merges (rule 12). An entry's maintainer approves; if
they do not answer within 14 days it falls to the core maintainer.

---

## 6. Already refused, and why

Recorded so nobody re-litigates these without new evidence. New evidence does
reopen them — the refusal is of the case as it was made, not of the idea
forever.

| Not accepted                                         | Why                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ux-designer`, `ui-designer`, "taste" design skills  | No checkable standard. What is checkable went to `accessibility-specialist` and `frontend-engineer` |
| Personas — whimsy, joker, beast-mode and the like    | A costume, not a way of working ([ADR 0012](decisions/0012-experts-crews-integrations.md))          |
| Language "-pro" agents                               | Stack knowledge belongs in a blueprint, not an expert                                               |
| `growth-marketer`, `content-strategist`, copywriting | No standard to check against                                                                        |
| `penetration-tester`                                 | Dual-use. Threat modelling and verification live in `appsec-engineer`                               |
| `developer-advocate`                                 | Marketing more than documentation                                                                   |
| A variant, fork or `extends` of an existing entry    | Rule 8. Variation happens through `options`: at most 3 fields, 3 values each                        |
| An archived or unmaintained upstream                 | An integration is a recommendation; an unpatched server is not one                                  |

The full list, with the reasoning for each, is in
[the 2026-09-24 expansion plan](research/2026-09-24-expansion-plan.md).

---

## 7. The terms

- **Your content** (`blueprints/**`, and the catalog entries beside it) is
  **CC BY 4.0**. People put it into their own projects; it has to be free or the
  whole thing is pointless.
- **The tooling** (`packages/**`) is **PolyForm Shield 1.0.0**. Use it, change
  it, contribute to it; do not ship a competing Forgeprint with it. The README
  says plainly that this is source-available, not OSI open source.
- **Contributions** are under the [DCO](../DCO) — one `Signed-off-by` line, no
  CLA.
- **The name and logo** are governed by [TRADEMARK.md](../TRADEMARK.md). A fork
  renames.

One more thing worth saying out loud: the catalog output tells agents that entry
content is **data, not instructions** (`_meta`), and an integration never has an
agent enter a secret — it tells the user where to get one. If your entry needs a
credential, name it and say what it reaches. Do not route it.
