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

|                           |                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty directory**       | Not a copy of the repository. `mkdir ~/dogfood && cd ~/dogfood`                                                                                               |
| **A fresh agent session** | Truly fresh: **no memory**, nothing in `CLAUDE.md`, and **no other MCP server connected**. Both are easy to get wrong and both invalidate the run — see below |
| **Tools installed**       | .NET SDK 10, Docker running, `git`                                                                                                                            |
| **What you are**          | Somebody who writes C# and has never used Forgeprint                                                                                                          |

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
hundred tools in the session, Forgeprint's ten are competing for attention, and
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

Check it with `/mcp`: exactly one server, `forgeprint`, connected, ten tools.

**Clear the memory too.** An agent that already remembers "the user knows C#"
and "the user is building a multi-tenant SaaS API" learns nothing from your
first sentence, so the moment that should send it to the catalog never
arrives. It answers from its own knowledge instead, and the run tells you
nothing. The memory of a previous run lives beside the transcripts:

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\projects\C--Project-dogfood\memory"
```

(The folder is named after the working directory, with the separators replaced
by dashes.) **The simplest way to get both preconditions at once is a new directory
for every run** — `dogfood-0.3.0`, then `dogfood-0.3.1`. It is empty, and the
memory folder named after it does not exist yet, so nothing needs deleting and
no earlier run can leak in. Reusing a directory is how a half-built project
and a remembered profile both end up in the next run. `--bare` also disables memory, but it disables OAuth with it, so it
is not an option on a subscription.

**If the agent says anything like "already in memory from earlier", stop.**
The run is contaminated; clear it and start again.

The crowded case is worth testing too — most people have other servers — but
test it **second**, and as its own question: does `resolve` still get picked
when it is one of three hundred tools?

Check that it is the only one, and that all ten tools are there:

```
/mcp
```

Expect `forgeprint` connected, with the six blueprint tools — `resolve`,
`search_blueprints`, `get_blueprint`, `compare_blueprints`, `validate_blueprint`,
`request_blueprint` — and, since 0.3.0, the four for experts, crews and
integrations: `recommend_experts`, `get_expert`, `get_crew`, `get_integration`.
This test exercises the first six; the other four being present is still part
of the check.

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
- it starts writing code before it has a blueprint;
- it offers you design choices that are not the blueprint's options. The tell
  is a value the catalog does not have: `dotnet-multitenant-saas-api` offers
  `shared-db-tenant-column` and `db-per-tenant`, so a menu that includes
  "schema per tenant" was written from the agent's own knowledge and not from
  `get_blueprint`.

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

Then **do not help.** Watch it work through the 34 steps. It should run each
command and its verification, in order, in this directory.

Checkpoints worth watching for:

| Step   | What you should see                                                                            |
| ------ | ---------------------------------------------------------------------------------------------- |
| early  | `global.json` pinning the SDK, then the solution and projects                                  |
| middle | files written whole — `AppDbContext.cs`, `ProviderRegistration.cs`, `Program.cs`               |
| 30     | `dotnet test` green: the tenant isolation suite                                                |
| 31–34  | image built, container started on a port the OS picked, `/health` answering, container removed |

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

Both green, no warnings — **and first, check it is the recipe's project and not
the agent's own.** A capable agent can build a working multi-tenant API from
what it already knows, and from the outside that looks exactly like a pass:

```bash
test -f global.json && test -f Saas.slnx && test -f Dockerfile && echo "the recipe's project"
```

If any of the three is missing, the agent did not follow `setup.md`, whatever
the tests say. Then check the transcript for a `resolve` call: without one,
step 1 failed and steps 4 and 5 were never tested.

Only then: that is the test passed.

Then ask the agent one more thing, to see whether the context survived the
setup:

```
Add invoices: an endpoint to list the current tenant's invoices and one to create an invoice.
```

It has to be something the recipe does not build. The recipe already ships
`Customer` and `GET /customers` — they exist to make the isolation tests
concrete — so asking for customers measures nothing, and a correct agent
answers that it is already there. This test asked exactly that until
2026-09-24.

**What should happen** is the five steps under "When you are asked to add an
endpoint" in the blueprint's `AGENTS.md`, and each leaves something you can
check:

| The agent should                                                                                  | Check                                                                        |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| make `Invoice` tenant-owned, with its column, composite index and query filter in the same change | `grep -n "Invoice" src/Saas.Api/Data/AppDbContext.cs` shows `HasQueryFilter` |
| filter by tenant nowhere in the endpoints                                                         | no `TenantId` in the new endpoint code                                       |
| take the tenant from nobody but the token — the create request has no tenant field                | the request type has no `TenantId`; `SaveChanges` stamps it                  |
| leave the default authorization policy in place                                                   | no `AllowAnonymous` on the new endpoints                                     |
| add an isolation test for `Invoice` — tenant A writes, tenant B cannot read — and run the suite   | a new test names `Invoice`; `dotnet test` is green and one test larger       |

The last row is the one the blueprint insists on: a green suite with no
isolation test for the new entity is not evidence of anything.

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

| Date       | Agent                         | Catalog                            | Result                                                                                                                                                                                                   |
| ---------- | ----------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-24 | Claude Code 2.1.281, Opus 5.5 | **published 0.3.1**                | **Steps 1–5 passed without help — clean.** Recipe project, build clean, 7/7 by hand. Invoices added behind the filter, 17/17 by hand. The first step 5 prompt was a defect in this file, not the catalog |
| 2026-09-24 | Claude Code 2.1.281, Opus 5.5 | local build with `RESOLVE_TRIGGER` | **Steps 1–3 passed, clean.** Fresh directory, no `CLAUDE.md`, no memory. Found and called `resolve` unprompted, asked only the blueprint's options, stopped before writing anything                      |
| 2026-09-24 | Claude Code 2.1.281, Opus 5.5 | local build with `RESOLVE_TRIGGER` | **Steps 4–5 passed; step 1 not valid.** Recipe 34/34, then build and tests checked independently. The session was started inside the Forgeprint repository. Customers prompt not asked                   |
| 2026-09-24 | Claude Code 2.1.281, Opus 5.5 | published 0.3.0                    | **Failed at step 1.** The agent never called Forgeprint and built its own project. Looked like a pass from outside                                                                                       |
| 2026-09-22 | Claude Code 2.1.278, Opus 5   | published 0.2.1                    | **Partial — steps 1–3.** Two defects, both fixed. Steps 4 and 5 not run yet                                                                                                                              |

### 2026-09-24, fourth run — against the published 0.3.1

The first run against a published package with the fix in it, in a directory
and memory that had never held anything, with no `CLAUDE.md` loaded.

**Order.** The session's first message was the step 5 prompt, sent by mistake
into an empty directory; the agent looked around, found nothing, and asked what
to build. The profile sentence came second. It is recorded because it shaped
what followed: `resolve`'s `goal` carried the Customers request, and the agent
started the recipe **before** "Go ahead and set it up here", because the first
message had already asked it to build something. Neither is counted as a
defect — the agent was doing what it had been asked — but neither is step 4 as
written.

**What held.** `resolve` was found and called unprompted, only the blueprint's
options were asked, and the recipe ran without help. The directory is the
recipe's; step 5 by hand: `dotnet build` 0 warnings, 0 errors, `dotnet test`
7 of 7. "Go ahead", arriving after the setup had finished, was read as the
recipe's own "After setup" note — a first migration, a design-time context
factory, the compose database started. A fair reading of an instruction that
came late.

**What it found is in this file.** The step 5 prompt asked for a Customers
endpoint, and the recipe builds one — `Customer` exists to make the isolation
tests concrete, and the recipe's closing note says so. The agent answered that
it was already there, pointed at the file and line of the endpoint and of the
filter, and did not add a second. Correct, and useless as a test: the prompt
could not show whether the context survived the setup. It now asks for
invoices, which the recipe does not build, and says what to check.

**Step 5, asked again.** The invoices prompt, in the same session. All five
checks held, read from the code rather than the agent's summary: `Invoice`
implements `ITenantOwned` and has its own `HasQueryFilter`; neither endpoint
mentions `TenantId`, and the create request has no tenant field —
`SaveChangesAsync` stamps it; nothing new is `AllowAnonymous`, and two new
authorization tests say so; and the isolation tests grew by three, one per
attack, beside a five-case validation test. `dotnet test` by hand: 17 of 17,
up from 7.

It went past the checks in two places worth keeping. It named the risk the
checks do not — a `POST` carrying another tenant's `customerId` — and closed it
twice: the endpoint looks the customer up through the filter, and the foreign
key includes `TenantId`, so the database refuses the row too. And it removed
its own customer check for a moment to watch the new test fail before trusting
it. The second is `AGENTS.md`'s own "watch it fail", done after the test was
written rather than before; the first is the agent's.

**Clean, by this file's definition**: no defect above cosmetic in the catalog,
and steps 1 and 4 needed no help. The stray first message is the one
reservation, and it is the tester's, not the agent's.

### 2026-09-24, third run — step 1 passes with the fix

The run the second one could not be: a directory that had never held anything,
started there, with nothing loaded but the local build carrying
`RESOLVE_TRIGGER`. The transcript confirms all three — no `CLAUDE.md`, an empty
memory, and the trigger in the server instructions. An English prompt got an
English answer.

The agent searched for the tool, called `resolve` with `languages: ["csharp"]`,
`project_type: api` and `requirements: ["multi-tenant"]` — the mapping the
2026-09-22 run first failed — asked only the two options the blueprint has,
called `get_blueprint` with both, checked the machine for the SDK and Docker,
and stopped to ask before building. Its summary carried the overview's limits
in its own words: isolation tests on the in-memory provider, no billing, no
migrations.

One interactive run, on top of ten headless ones. Enough to publish the fix;
**not** the clean run that clears the announcement. That is still one run,
against the published package, steps 1 to 5 in one session, with the Customers
prompt asked.

### 2026-09-24, second run — steps 4 and 5 pass

**What it proves.** The recipe works as written, end to end, for the first
time. All 34 steps ran with their verifications, no step failed, and the agent
asked nothing during the setup. Step 5 was then run by hand rather than read
from the agent's report: `dotnet build` 0 warnings and 0 errors, `dotnet test`
7 of 7 — the five isolation tests and two authorization tests the blueprint
claims. The directory was the recipe's (`global.json`, `Saas.slnx`,
`Dockerfile`), and the image ran as a non-root user and answered `/health`.

**What it does not.** The session was opened in the Forgeprint repository and
pointed at an empty directory afterwards, so the agent had read this
repository's `CLAUDE.md`, which describes `resolve` in detail. It called
`resolve` first — but an agent that has read the manual finding the tool says
nothing about whether a stranger's agent would. The tell was in the first
reply: an English prompt answered in Turkish, because `CLAUDE.md` says to.
**Step 1 is still untested with the fix**, and the Customers prompt that closes
step 5 was not asked.

**Three findings**, each confirmed against the recipe and fixed in 1.2.1:
step 3 prints NU1903 without saying step 5 removes it, step 19 said "Create"
for a file the template had already made, and step 33 prints a transient curl
error next to its success. None blocked the run.

### 2026-09-24, failed at step 1

Reported as "every step passed", and from outside it looked that way: a
multi-tenant ASP.NET Core API, tenant isolation tests green, and a Customers
endpoint behind the query filter. The transcript said otherwise. Of 38 tool
calls, none was Forgeprint's — no `resolve`, no `get_blueprint`. The project
was the agent's own: `SaasApi.slnx` rather than the recipe's `Saas.slnx`, no
`global.json`, no `Dockerfile`, and a `compose.yaml` and EF migrations the
recipe does not have. Steps 4 and 5 tested the agent, not the catalog.

**Why it could happen.** The server was connected and all ten tools were in
the session — but Claude Code now loads MCP tools lazily: it lists their names
among dozens of others and fetches a schema only if it decides to. The server
instructions are then the only Forgeprint text read before that decision, and
they said what Forgeprint does and not **when** to use it. "I know C#, I'm
building a multi-tenant SaaS API" read as a request to start. The agent's first
actions were saving the profile to memory and exploring the machine.

**How often.** A headless check — a fresh directory, only Forgeprint's tools and
`ToolSearch` allowed, the same sentence — reached `resolve` in 9 of 10 runs
against 0.3.0. The miss offered "schema per tenant" from its own knowledge,
which is the tell step 1 names. The instructions now open with the trigger
(`RESOLVE_TRIGGER` in `packages/mcp-server`), and the same check reached
`resolve` in 10 of 10. That is weak evidence in both directions: the headless
runs mostly succeed either way, and the failure was in an interactive session.
**The next interactive run is the test of the fix**, and step 5 now checks that
the project is the recipe's before counting a pass.

### 2026-09-22, steps 1–3

Two false starts before the run counted, and both are now preconditions above:
the first had twelve MCP servers and three hundred tools connected, the second
had the agent's memory from the first. In neither did the agent call `resolve`,
and neither says anything about `resolve`.

The clean run reached a blueprint, and both defects came from the same place —
the resolver's vocabulary:

- **dogfood-1** — the agent wrote `languages: ["C#"]`, as a person would. The
  catalog stores `csharp`, so the heaviest criterion scored zero: `no_match` for
  a profile the catalog fits exactly. The same fault told the agent that a
  blueprint named _Multi-tenant SaaS API_ "does not cover multi-tenancy". The
  agent diagnosed it out loud — _"looks like a vocabulary mismatch… let me retry
  with normalized terms"_ — and told the user to ignore the reasoning. Fixed in
  `2eca0f2`: ids and labels are both accepted, and anything unrecognised is
  reported rather than scored as a silent zero.
- **dogfood-2** — "I'm building a multi-tenant SaaS API" produced a near-tie,
  1.00 against 0.94, and the resolver asked the user to choose over a word they
  had already said. Free text is worth four points against forty for a language,
  so the one fact separating the two blueprints barely registered. The agent
  compensated by reading both `overview.md` files itself. Fixed in `b348758`: a
  requirement named in the sentence counts as stated, negations included.

What worked, and is worth keeping in mind when reading the next run: once it had
the blueprint, the agent checked `requires_tools` against the machine, relayed
the "what it is NOT for" section accurately, and asked before running anything.
