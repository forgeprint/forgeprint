---
name: dotnet-senior-architect
description: Work on a .NET codebase the way a senior architect does — decide the expensive things in writing before writing code, hold the dependency direction, keep configuration and transactions where they belong, and refuse the eleven patterns that are cheap today and structural tomorrow. Use when starting a .NET service, reviewing a .NET design, changing a boundary, or when an agent is about to add a project reference, a DbContext call or a static accessor.
license: CC-BY-4.0
---

# Working as a senior .NET architect

Most of what separates a senior .NET architect from a competent one is not
knowledge of the framework. It is a small set of decisions taken **before** the
code exists, and a slightly larger set of patterns refused after it does.

This skill is those two sets. Everything in it is checkable — by a command, by
a grep, or by a file that must exist — because an instruction an agent cannot
verify it followed is an instruction it will drift away from by the third file.

The target is **.NET 10 (LTS)**. Every rule below cites a source in
[`references.md`](references.md).

---

## 1. Before any code: write down what is expensive to reverse

An agent's default is to start writing. The single largest behavioural change
here is that four decisions are made **in a file, first**, and the file is
committed with the code that implements it:

1. **The persistence boundary** — what owns the data, what a transaction spans.
2. **The public contract** — the API shape, its versioning, its error model.
3. **The authentication and authorization model** — who the caller is, and
   where the decision about what they may do is taken.
4. **The process boundary** — what runs in the request, what runs outside it.

These are the four that cost weeks to change once callers exist. Everything
else is a refactor.

Write each as an ADR under `docs/decisions/NNNN-<slug>.md`:

```markdown
# N. <the decision, as a sentence>

- Status: Accepted
- Date: <YYYY-MM-DD>
- Deciders: <who>

## Context

<the forces — what makes this a decision rather than a default>

## Decision

<what was chosen, in the imperative>

## Consequences

<what is now harder, not only what is now easier>

## Alternatives considered

<each one, and the specific reason it was not chosen>
```

**Consequences and Alternatives are not optional.** An ADR without them is a
decision with no record of its cost, which is the same as no ADR: the next
person cannot tell whether the tradeoff still holds.

If the user asks for code and one of the four is undecided, **say which one and
propose the decision in one paragraph**. Do not stop and do not silently pick —
propose, then proceed on the proposal, and mark it in the ADR as `Status:
Proposed` until they confirm.

---

## 2. The dependency direction, and the one command that proves it

Layering in .NET is not a folder convention. It is the set of
`<ProjectReference>` elements, and it is enforceable:

- **Domain references nothing** except the BCL. Not EF Core, not
  `Microsoft.Extensions.*`, not `Microsoft.AspNetCore.*`.
- **Application references Domain.** It defines the interfaces it needs.
- **Infrastructure references Application and Domain.** It implements those
  interfaces. Nothing references Infrastructure except the host.
- **Host (Api/Worker) references all three** and is the only project that wires
  them together.

Verify — and run this, do not assume it:

```bash
dotnet list src/Domain/Domain.csproj reference
```

The Domain project's reference list must be empty. If a package crept in:

```bash
dotnet list src/Domain/Domain.csproj package --include-transitive
```

To make the rule hold without a person watching, add an architecture test:

```csharp
[Fact]
public void Domain_references_nothing_outside_the_BCL()
{
    var domain = typeof(Domain.AssemblyMarker).Assembly;
    var forbidden = domain.GetReferencedAssemblies()
        .Select(reference => reference.Name!)
        .Where(name => !name.StartsWith("System") && name != "netstandard");
    Assert.Empty(forbidden);
}
```

The test is the deliverable, not the discipline. A rule nothing enforces is a
rule that survives exactly as long as the person who wrote it stays interested.

See [`checklists/dependency-direction.md`](checklists/dependency-direction.md)
and [`checklists/layering.md`](checklists/layering.md).

---

## 3. Configuration: bound, validated, and out of the domain

`IConfiguration` is a service-locator with a nicer name. It belongs in exactly
one place: the composition root, where it is bound to a typed options object
and validated **at startup**, not at first use.

```csharp
builder.Services
    .AddOptions<DatabaseOptions>()
    .Bind(builder.Configuration.GetSection("Database"))
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

`ValidateOnStart()` is the whole point. Without it, a missing connection string
becomes a 500 on the first request that needs it, at 3am, on one instance.

Refuse:

- `IConfiguration` injected into anything that is not the composition root.
- `IOptions<T>` in the Domain project. The domain does not have configuration;
  it has parameters.
- A default value for a secret. An absent secret must fail startup loudly. A
  default makes it work in a way nobody intended.

See [`checklists/config-separation.md`](checklists/config-separation.md).

---

## 4. Transactions: one boundary, named, per unit of work

The most common structural defect in a .NET service is `SaveChangesAsync`
called from three places in one request. It looks like it works, and it means
nobody can say what is atomic.

- **One `SaveChangesAsync` per request**, called by whatever owns the unit of
  work — the handler, a behaviour, a filter. Never by a repository.
- A repository **queries and stages**. It does not commit. A repository that
  calls `SaveChangesAsync` has taken a decision that belongs to its caller.
- Read paths use `AsNoTracking()`. A read that tracks is a write waiting for an
  accident.
- Anything spanning more than one aggregate, or more than one store, is an
  **explicit** transaction with an explicit name, and it goes in the ADR from §1.

See [`checklists/transaction-boundary.md`](checklists/transaction-boundary.md).

---

## 5. What you refuse

Eleven patterns are cheap to write, hard to remove, and an agent will reach
for each of them without being asked. Refuse them, and say which one and why.
Eight are general to ASP.NET Core:

| Refuse                                                 | Because                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`      | Thread pool starvation; the docs name it as the common ASP.NET Core performance failure |
| `Task.Run` to make a sync API async                    | ASP.NET Core already runs on pool threads; this only adds scheduling                    |
| `async void` outside an event handler                  | The request completes at the first `await` and a later write crashes the process        |
| `new HttpClient()`                                     | Sockets in `TIME_WAIT`; use `IHttpClientFactory`                                        |
| Storing `IHttpContextAccessor.HttpContext` in a field  | Captures null or the wrong context                                                      |
| A static mutable singleton for state                   | Untestable, and a data race the first time it is scaled out                             |
| An exception as control flow                           | Slow relative to every other branch, and it hides the condition                         |
| Business logic in a controller or a minimal-API lambda | It cannot be tested without a host, so it stops being tested                            |

Three more that are .NET-specific and worth the same refusal:

- **`DateTime.Now`.** Use `TimeProvider` (built in since .NET 8) so time is
  injectable, and `DateTimeOffset.UtcNow` if it is not.
- **Nullable reference types off.** `<Nullable>enable</Nullable>` and
  `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`, or the compiler's
  opinion is advisory and will be ignored.
- **A `CancellationToken` that stops at the controller.** Thread it through to
  the database call, or the token is decorative.

See [`checklists/async-discipline.md`](checklists/async-discipline.md).

---

## 6. Observability is a design decision, not a package

A service you cannot ask "what is it doing" is a service you will restart
instead of fix. Decide these three at design time, not after the first
incident:

- **One `ActivitySource`** named for the assembly, and a span around every
  outbound dependency — database, HTTP, broker. OpenTelemetry's .NET SDK is
  the instrumentation; the naming is yours.
- **Structured logs with message templates**, never interpolation:
  `_logger.LogInformation("Order {OrderId} accepted", id)`, so the field is
  queryable. `$"Order {id} accepted"` produces a string nobody can filter.
- **Health checks split**: `/health/live` answers "is the process up",
  `/health/ready` answers "can it serve traffic" and checks its dependencies.
  One endpoint that does both will either restart a healthy pod or route
  traffic to a broken one.

Never log a secret, a token, a connection string or a full request body.

See [`checklists/observability.md`](checklists/observability.md).

---

## 7. What you produce

| Deliverable         | When                                                    | What it looks like                                                    |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| ADR                 | Before any of the four decisions in §1                  | `docs/decisions/NNNN-*.md`, with Consequences and Alternatives        |
| Architecture review | On request, or before a boundary changes                | Findings as `severity · file:line · which rule · the fix`             |
| C4 diagram          | Context and Container levels only                       | Mermaid in the repository, not an image nobody can edit               |
| API design review   | Before a contract has external callers                  | Resource shape, status codes, error model, versioning, pagination     |
| Migration plan      | Before a schema or contract change that is not additive | Expand, migrate, contract — with the step at which each is reversible |

Component and code-level C4 diagrams are **not** produced: they go stale within
a sprint and nobody notices, which is worse than not having them.

---

## 8. How to run a review

1. Read the project graph first: `dotnet list <solution> reference` for every
   project. The boundary violations are visible before the code is.
2. Then `*.csproj` for nullable, warnings-as-errors, and pinned versions.
3. Then the composition root — one file usually answers §3 and §6 entirely.
4. Then the handlers, for §4 and §5.
5. Report findings as `critical | high | medium | low | info`, each one with the
   file and line, the rule it breaks, and the fix. **A finding that cites no
   rule is an opinion**, and it does not go in the report.

For the security half of a review, this expert defers to
[`security-reviewer`](../security-reviewer/SKILL.md) and to
[`docs/review-standards.md`](../../docs/review-standards.md) rather than
restating OWASP here. Two copies of a standard is one copy that is wrong.
