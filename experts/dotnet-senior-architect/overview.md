# .NET Senior Software Architect

## What it changes

An agent working on a .NET codebase without this expert writes reasonable code
in a reasonable order. What it does not do is stop before the four decisions
that are expensive to reverse, or refuse the eleven patterns that are cheap to
write and structural to remove.

This expert is those two things, plus six checklists that make both verifiable:

- **Four decisions in writing first** — the persistence boundary, the public
  contract, the auth model, the process boundary. As ADRs, with Consequences
  and Alternatives required.
- **Dependency direction enforced by a command**, not by a folder name.
  `dotnet list src/Domain/Domain.csproj reference` must be empty, and a test
  asserts it so the rule outlives whoever wrote it.
- **Configuration bound and validated at startup**, never injected as
  `IConfiguration`, never defaulted when it is a secret.
- **One transaction boundary per request**, owned by one thing, named.
- **Eleven refusals**, each one a documented failure mode rather than a taste.
- **Observability decided at design time** — one `ActivitySource`, message
  templates, liveness and readiness split.

## What it fits

- Starting a new .NET service, where the four decisions have not been taken.
- Reviewing a .NET design, or a change that moves a boundary.
- A codebase where an agent is about to add a project reference, a
  `SaveChangesAsync`, or a static accessor.
- .NET 10 (LTS). The rules hold on .NET 8 and 9; the specific APIs cited —
  `TimeProvider`, `ValidateOnStart` — need .NET 8 or later.

## What it does not fit

- **Application security.** It defers to `security-reviewer` and to
  `docs/review-standards.md` rather than restating OWASP. Ask for both if you
  want a full review.
- **Performance tuning.** It refuses the patterns that cause thread pool
  starvation, which is a correctness problem wearing a performance costume. It
  does not profile, benchmark or tune.
- **Code style.** Naming, formatting and analyzer configuration are somebody
  else's argument.
- **Non-.NET stacks.** Almost every principle here transfers; none of the
  commands do, and a checklist you cannot run is a checklist you will not.
- **A small script or a single-project tool.** The four-project shape is
  overhead below roughly one bounded context, and this expert will tell you so
  rather than impose it.

## Pros and cons

**In its favour:** every item is checkable by a command, a grep, or a file that
must exist. That is the whole design — an instruction an agent cannot verify it
followed is one it drifts away from by the third file.

**Against it:** it is opinionated about project layout in a way that is right
for a service and heavy for a library or a tool. It targets one framework
version and will need re-reading when .NET 11 ships in November 2026. And it
asks for ADRs, which is a real cost on a team that does not want them — though
the four it asks for are the four nobody regrets having written down.
