---
name: blueprint-author
description: Turn an existing, working project into a Forgeprint blueprint. Use when contributing a blueprint, when asked to "make a blueprint out of this project", when drafting manifest.yaml / AGENTS.md / overview.md / setup.md for the catalog, or when a blueprint pull request needs to pass validate, lint-setup and similarity before review.
---

# Authoring a blueprint

A blueprint is a working project turned into instructions another agent can
follow on an empty directory. You are not writing documentation about a
project; you are writing the recipe that reproduces it, plus the context that
keeps the next change consistent with it.

**The bar:** somebody with the listed tools, an empty directory, and no
knowledge of the source project runs `setup.md` top to bottom and ends up with
a working project. If you have not actually done that, the blueprint is not
ready.

---

## 0. Check whether this blueprint should exist

Before writing anything, look for what is already in the catalog. Read
`docs/index.json`, or the site.

If something close exists, the answer is almost always **not** a new blueprint:

| What you have                                                      | What to do instead                                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| The same stack with a different database or auth mechanism         | Add an **option** to the existing blueprint                                              |
| The same stack done better                                         | Write yours, set `supersedes: <old-slug>`, mark the old one `deprecated: true`           |
| The same stack plus one capability                                 | Ask whether that capability changes the project's shape. If it does not, it is an option |
| A genuinely different `stack + project_type + requirements` triple | A new blueprint                                                                          |

Two blueprints may not claim the same triple. `forgeprint validate` rejects the
second one, and no amount of writing quality changes that.

There are no variants. `extends`, `inherits` and `fork_of` do not exist in the
schema. Variation is `options`: at most **3 fields**, at most **3 values** each.
If your idea needs a fourth, it is two blueprints or it is not an option.

---

## 1. Read the source project

Work from a project that runs, not from memory or a tutorial. Extract:

- **Versions that are actually installed.** Read the lock file, the `.csproj`,
  the `package.json`, the `go.mod`. Do not write "latest" and do not write the
  version you remember.
- **The commands the project actually uses.** Its CI workflow is usually the
  most honest description of how it is built and tested.
- **The decisions that are not obvious from the code.** Why this database, why
  this layout, what the health endpoint promises. These become `AGENTS.md`.
- **The parts that are specific to its owner.** Company names, internal
  registries, private packages, real hostnames, seeded credentials. These are
  removed, not renamed to something plausible.

Ignore: the project's own history, its issue tracker, its team conventions that
do not affect the code, and anything you cannot verify from the repository.

---

## 2. Fill in manifest.yaml against the taxonomy

Every tag comes from `schema/taxonomy.yaml`. There is no free text.

If a value you need is missing, **open a separate pull request that adds the
term first**. A taxonomy change bundled with the blueprint that needs it gets
both rejected, because the term then never gets judged on its own.

Before reaching for a new term, check whether an existing one already says it.
`containerization` is already there when you were about to add `docker`;
`observability` covers logging, metrics and tracing.

Field by field:

- `slug` — lower kebab-case, equals the folder name. Name the thing, not the
  fashion: `dotnet-web-api`, not `dotnet-clean-arch-starter-v2`.
- `languages` — the heaviest criterion in the resolver. Only languages somebody
  actually writes in this project.
- `requirements` — capabilities the blueprint **sets up**, not what it is built
  with. "What do I need?" belongs here; "what is it made of?" is `stack`.
- `audience` — `advanced` when the blueprint depends on behaviour that is easy
  to get subtly wrong. Do not flatter the reader.
- `agents` — only agents the blueprint has actually been exercised with. Listing
  four because the SDK supports four is a false claim.
- `maintainers` — you, if you intend to answer issues about it. This becomes
  `.github/CODEOWNERS`.
- `requires_tools` — everything the recipe invokes, including tools used only by
  a verification step.

---

## 3. Write setup.md by running it

This is the part that separates a blueprint from a blog post. Open an empty
directory and follow your own draft, command by command, fixing the draft as you
go.

Rules the linter enforces:

- **One step, one action.** A command or a single file operation. "Install the
  required packages" is not a step; the command that installs them is.
- **Every step ends with a ``Verify: `command` `` line.** Something that fails loudly if
  the step did not work. The verification is not the same as the step: a step
  that writes a file verifies the file exists or the project still builds.
- **Pin every version.** `dotnet add package X --version 1.2.3`,
  `npm install x@1.2.3`, `image:1.2` and never `:latest`.
- **Nothing privileged, nothing global.** No shell pipe from a download, no
  privilege escalation, no recursive force deletes, no writing outside the
  project directory, no network host that is not a package registry.
- **Option branches are guards:**

  ```markdown
  <!-- if options.database == postgres -->

  ...
  <!-- endif -->
  ```

  One level only. If you find yourself wanting a branch inside a branch, the two
  options are entangled — split the file they configure so that each half is
  guarded on one option. That restructuring is usually the right design anyway.

Things that go wrong in practice:

- **A template's default dependency has an advisory.** Run the build and read
  the warnings. If the scaffolder installs something vulnerable, pin past it and
  say so in `CHANGELOG.md`.
- **Two packages resolve different versions of a shared dependency.** The build
  prints a unification warning. Pin the versions that agree.
- **A pinned SDK that is too specific.** Pin the feature band base, not the
  exact patch you happen to have, or the recipe fails on a machine one patch
  behind.
- **Steps that only work on your OS.** Paths, executable extensions, shell
  built-ins. If the manifest lists three platforms, the commands must work on
  three platforms.

End the recipe with a step that proves the result works — a request against the
running service, a protocol handshake, a test run — not with "the build
succeeds".

Then run it with `forgeprint test-setup`, which is what turns "every step is a
command" from a style rule into something enforced. Three things it catches
that reading does not:

- **A fixed port.** `-p 8080:8080` fails on any machine already using 8080, and
  a fixed port on a check can even be answered by somebody else's server, which
  passes while proving nothing. Ask the operating system for a port and read it
  back.
- **A process that never returns.** A step that starts a server in the
  foreground can be followed by a human and never by a script. Start it in the
  background, record the process id, and stop it in a later step.
- **Configuration the recipe never supplies.** A container that refuses to
  start without a setting will exit before the check that was meant to prove it
  works.

---

## 4. Write AGENTS.md as rules, not encouragement

`AGENTS.md` is read by an agent about to change the project. Generic advice
("write clean code", "add tests") is worse than nothing: it fills the context
window and changes no decision.

Write the things that are true of **this** project and not of every project:

- Where a kind of code goes, and what must not go there.
- Invariants that are easy to break and expensive to break: what the health
  endpoint must not depend on, which file is allowed to name a provider, what
  must never be read from a request.
- The failure mode each rule prevents. A rule with a reason survives review; a
  rule without one gets ignored.
- The commands for build, test, run.
- A short "when you are asked to add X" checklist for the most common change.

A good test: delete every sentence that would still be true if the stack were
different. If most of the file goes, it was not written yet.

---

## 5. Write overview.md, including what it is not for

`overview.md` is what `compare_blueprints` reads, so it is where honesty pays.

Required sections:

- **What you get** — concrete, not adjectives.
- **Options** — what each value actually changes.
- **What it fits** — the situation where this is the right pick.
- **What it is NOT for** — required. Name the blueprints somebody should use
  instead. A blueprint that fits everything helps nobody choose.
- **Trade-offs made on your behalf** — every decision that a reasonable person
  would make differently, with the reasoning. This is the section experienced
  readers check first.
- **Cost of adoption** — roughly how long, and what has to be installed.

If you cannot name three things the blueprint is wrong for, you do not
understand it well enough to publish it.

---

## 6. CHANGELOG.md

`1.0.0` for a new blueprint, with an entry that records what was decided and
what was verified: the platform, the tool versions, what was run, what passed.
A version bump without an entry fails validation.

Put anything deliberately left out under a "Planned" heading, so a reviewer can
tell the difference between an omission and a decision.

---

## 7. Run the gate before asking anyone to look

```bash
pnpm install
pnpm run build
pnpm forgeprint build-index
pnpm forgeprint validate
pnpm forgeprint lint-setup <slug>
pnpm forgeprint similarity <slug>
pnpm forgeprint test-setup <slug>
pnpm run check
```

- `validate` red — schema, taxonomy, a missing file, a stale generated file, or
  a duplicate triple. Fix; none of these are arguable.
- `lint-setup` red — the recipe is not deterministic yet.
- `similarity` prints **REJECTED** — same triple as an existing blueprint. Go
  back to step 0.
- `test-setup` red — the recipe does not work. It runs in a fresh directory,
  checks the tools your manifest declares, executes every step and its
  verification, and stops at the first failure with the command and its output.
  This is the check that finds what reading cannot: a fixed port that is
  already taken, a container started without the configuration it refuses to
  boot without, a step that starts a server in the foreground and never
  returns. Run `--all-options` before you open the pull request.
- `similarity` prints **RED FLAG** — above the threshold but a different triple.
  The command passes; the pull request is where you justify it. Note that tag
  overlap can be high between genuinely different blueprints, because six tag
  fields is a coarse summary. Compare the `AGENTS.md` and `setup.md` numbers
  too: if those are also high, you probably copied.

Commit the regenerated `docs/index.json`.

---

## 8. Prepare the pull request

- One blueprint per pull request. Taxonomy changes are their own.
- Answer the template's required section — closest blueprint, what is different,
  why this is not a change to that one — with the similarity numbers in hand.
  An empty answer fails the check.
- State the change type: `feature` for a new blueprint.
- Sign off every commit: `git commit -s`.
- Paste what you ran and on what, including the platform and tool versions. A
  reviewer cannot re-run every recipe; the record is what makes `verified`
  possible later.

---

## Anti-patterns

| Smell                                                 | Why it fails                                        |
| ----------------------------------------------------- | --------------------------------------------------- |
| `AGENTS.md` that would fit any project                | Costs context, changes no decision                  |
| A setup step with no verification                     | The first silent failure surfaces three steps later |
| "Install the latest version of X"                     | Not deterministic; the recipe rots on its own       |
| A new taxonomy term inside the blueprint pull request | The term never gets reviewed on its own merits      |
| Four option values "for flexibility"                  | The matrix stops being testable; ADR 0001           |
| An `overview.md` with no "not for" section            | Makes the catalog unchoosable                       |
| A blueprint for a project you have not run            | It will not survive its first user                  |
| `agents` listing every agent you know of              | A claim you cannot back                             |
