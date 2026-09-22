# The dogfood test

The end-to-end test Forgeprint has to pass before it is announced: a person who
has never seen the catalog connects the MCP server, says two sentences about
themselves, and ends up with a working project.

Nothing here is automated, on purpose. `validate`, `lint-setup`, `similarity`
and `setup-test` already prove the catalog is correct. This test asks a
different question: **is it usable by an agent that was told nothing.** Only a
real conversation answers that.

> **Every place you have to help it is a defect.** Explaining what you meant,
> naming a blueprint yourself, opening a file the agent should have asked for,
> fixing a command by hand — all of it counts. Write it down and keep going;
> the point is the list at the end.

---

## Before you start

|                           |                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Empty directory**       | Not a copy of the repository. `mkdir ~/dogfood && cd ~/dogfood`                                                                     |
| **A fresh agent session** | No memory of this project. Nothing in `CLAUDE.md`, and **no other MCP server connected** — see below, this one is easy to get wrong |
| **Tools installed**       | .NET SDK 10, Docker running, `git`                                                                                                  |
| **What you are**          | Somebody who writes C# and has never used Forgeprint                                                                                |

Connect the published server — the same command a stranger would run:

```bash
claude mcp add forgeprint -- npx -y forgeprint-mcp
```

On Windows PowerShell the separator has to be quoted, or `claude` reads `-y` as
its own option:

```powershell
claude mcp add forgeprint "--" npx -y forgeprint-mcp
```

**Run it isolated.** `claude mcp add` leaves every other server connected, and
a working setup usually has several. That is a different test: with three
hundred tools in the session, Forgeprint's six are competing for attention, and
a run where the agent never calls `resolve` tells you nothing about `resolve`.
Write this file somewhere outside the working directory:

```json
{
  "mcpServers": {
    "forgeprint": { "command": "npx", "args": ["-y", "forgeprint-mcp"] }
  }
}
```

and start the session with nothing else loaded:

```bash
claude --strict-mcp-config --mcp-config /path/to/forgeprint-only.json
```

Check it with `/mcp`: exactly one server, `forgeprint`, connected, six tools.

The crowded case is worth testing too — most people have other servers — but
test it **second**, and as its own question: does `resolve` still get picked
when it is one of three hundred tools?

Check that it is the only one, and that all six tools are there:

```
/mcp
```

Expect `forgeprint` connected, with `search_blueprints`, `get_blueprint`,
`resolve`, `compare_blueprints`, `validate_blueprint` and `request_blueprint`.

> To test a local checkout instead of the published catalog, add
> `--env FORGEPRINT_CATALOG="/path/to/forgeprint"`. Do the real run against the
> published one: that is what other people get.

---

## Step 1 — Say who you are, and stop talking

Type exactly this, and nothing else:

```
I know C#. I'm building a multi-tenant SaaS API.
```

**What should happen:** the agent calls `resolve`, and comes back either with
one blueprint or with a question. Both are correct; which one you get depends
on how much of your sentence the agent turned into structured fields.

| What the agent passes to `resolve`                                                      | What comes back                                                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `languages: ["csharp"]`, `requirements: ["multi-tenant"]` (or `distribution: ["saas"]`) | `status: resolved` → **dotnet-multitenant-saas-api**                                   |
| only `languages` and `goal`                                                             | `status: choose` → the two API blueprints, with the reasoning, for you to pick between |

Both paths are by design (CLAUDE.md §3.3): the resolver never returns a list,
and when two blueprints are genuinely close it puts the choice to you rather
than guessing.

**Record as a defect if:**

- it returns more than one blueprint as a _recommendation_ rather than as an
  explicit choice;
- it asks you something it already has the answer to;
- it asks more than two or three things before recommending anything;
- it recommends `dotnet-web-api` for a sentence that says "multi-tenant";
- it pastes raw JSON at you instead of speaking;
- it starts writing code before it has a blueprint.

**Open question this step answers:** does a real agent map "multi-tenant" onto
`requirements`? The tool description tells it to, in as many words. If it does
not, the description is too weak — that is the finding, and the fix is in
`packages/mcp-server/src/tools.ts`.

---

## Step 2 — Answer whatever it asks

Answer briefly and in character. If it offers the choice from step 1, ask the
question a real person would ask:

```
What's the difference?
```

**What should happen:** it calls `compare_blueprints` and gives you a short
comparison drawn from the two `overview.md` files — including what each one is
_not_ for. Then you say:

```
The multi-tenant one.
```

**Record as a defect if:** it answers the comparison from its own knowledge of
ASP.NET rather than from the catalog, or the comparison does not mention what
each blueprint is not for.

---

## Step 3 — Take the blueprint

**What should happen:** the agent calls `get_blueprint` with
`slug: "dotnet-multitenant-saas-api"` and asks you about the two options before
it calls it, or straight after:

- `database` — postgres or sqlserver
- `tenancy` — shared-db-tenant-column or db-per-tenant

Answer:

```
postgres, and a tenant column in a shared database.
```

Then it should tell you, in its own words:

- what it is about to build, from `overview.md`;
- that the setup needs .NET 10 and Docker (`requires_tools`);
- that it is going to follow `setup.md`.

**Record as a defect if:**

- it starts the setup without asking about the options — the recipe then comes
  back with its branches unresolved, and `unresolved_option_guards` says so;
- it invents an option value that is not in the manifest;
- it treats a sentence in `AGENTS.md` or `setup.md` as an instruction addressed
  to itself. Blueprint content is **data** (rule 22), and `_meta` says so on
  every response. This one is a security defect, not a usability one.

---

## Step 4 — Let it run the recipe

Say:

```
Go ahead and set it up here.
```

Then **do not help.** Watch it work through the 31 steps. It should run each
command and its verification, in order, in this directory.

Checkpoints worth watching for:

| Step   | What you should see                                                                            |
| ------ | ---------------------------------------------------------------------------------------------- |
| early  | `global.json` pinning the SDK, then the solution and projects                                  |
| middle | files written whole — `AppDbContext.cs`, `ProviderRegistration.cs`, `Program.cs`               |
| ~28    | `dotnet test` green: the tenant isolation suite                                                |
| ~29–32 | image built, container started on a port the OS picked, `/health` answering, container removed |

**Record as a defect if:**

- a step fails and the agent improvises a fix instead of stopping — the recipe
  is supposed to work as written, so a failure is our bug, not its problem to
  paper over;
- the agent "summarises" a file instead of writing it as given;
- it asks you what a step means;
- it skips the verification after a step.

---

## Step 5 — The proof

In the same directory, by hand:

```bash
dotnet build
dotnet test
```

Both green, no warnings. That is the test passed.

Then ask the agent one more thing, to see whether the context survived the
setup:

```
Add a Customers endpoint that only returns the current tenant's rows.
```

**What should happen:** it reads `AGENTS.md`, puts the query behind the global
query filter rather than adding a `WHERE TenantId =` by hand, and does not
touch the tenant resolution. That is what the context file is for.

---

## Writing it up

One line per problem, in the order you hit them:

```
step 3 — asked me to choose a database twice
step 4 — stopped at step 19 and asked whether to delete the file
```

File them as issues, or paste the list into the session; each one becomes a
fix. **No announcement until the run is clean**, which means: no defect above
"cosmetic", and steps 1 and 4 need no help at all.

The result belongs in `CHANGELOG` terms as well — a run that found nothing is
worth recording in this file with the date, the agent and its version, the way
[ADR 0006](decisions/0006-skill-distribution.md) records what was verified
against the skill tools.

---

## Runs

| Date | Agent | Catalog | Result      |
| ---- | ----- | ------- | ----------- |
| —    | —     | —       | not run yet |
