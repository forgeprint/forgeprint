# Swift Senior Software Architect — overview

## What it is

A way of deciding and reviewing the structure of a Swift codebase where six
things have a file or a command behind them: the module graph, the public
surface, whether library evolution is on, each target's default actor
isolation, the dependency list, and the warning policy.

Target: Swift 6.4 as it ships in Xcode 27.

## What it fits

- A Swift codebase of more than a handful of modules, on any Apple platform or
  across platforms.
- A package others depend on, where `public` is a promise and an API diff is
  worth a CI job.
- A project turning on Swift 6 language mode across several targets, where the
  isolation defaults are the decision that makes the migration small.
- A codebase where `public` has been typed wherever `internal` stopped
  working, which `package` has been able to fix since Swift 5.9.
- A review that has to produce an ADR rather than an opinion.

## What it does not fit

- **One app target.** With no module boundary there is nothing for §1 to
  decide, and §2's API diff has no client. §4 and §7 still apply; the rest is
  ceremony.
- **Writing the app.** Views, observation, storage, migrations and tests are
  [`swift-mobile-engineer`](../swift-mobile-engineer/SKILL.md)'s. The two
  overlap at one row on purpose: the engineer reads the isolation setting this
  expert chose.
- **A public HTTP API's shape.** Resources, status codes and versioning over
  the wire are [`api-designer`](../api-designer/SKILL.md)'s;
  this expert is about the Swift API surface.
- **A security review.** §5 asks for an SBOM and a written justification; the
  threat model and the depth are
  [`security-reviewer`](../security-reviewer/SKILL.md)'s.
- **Server-side Swift specifics.** Vapor or Hummingbird work gets §1, §2, §5
  and §7, and nothing about routing, persistence or deployment.
- **A diagram for its own sake.** A C4 diagram is produced when somebody will
  read it; the structure decisions are the deliverable.

## What is good about it

- **It names the keyword that fixes the most common Swift boundary failure.**
  `package` has existed since 5.9 and is still reached for less often than
  `public`, including by people who know it exists.
- **The API diff is used with its limits stated.** The tool compares `package`
  declarations, has missed a protocol's default `associatedtype`, and has
  reported a defaulted parameter as a break. The expert says to read the
  output rather than trust the exit code.
- **It says which way the isolation default should point per target**, and
  asks for the reason in an ADR rather than in a build setting.
- **It says "not yet" with a reason.** Per-file default isolation is accepted,
  not shipped, and the checklist explains what would change when it is.
- **The dependency audit has a command now**, not a maintained table.

## What is not

- **`provenance: generated`.** Written from the sources in
  [`references.md`](references.md), not from a codebase somebody ships, and
  not yet run against a real Swift project — the catalog has no Swift
  blueprint to run it against. ADR 0011 says what that is worth.
- **No Apple reference page is cited.** They render client-side and could not
  be read on the date checked, so every row rests on a swift-evolution
  proposal, a release announcement, a tool's own documentation or an issue
  tracker. Where a platform API matters, it belongs to the engineer expert.
- **`-enable-library-evolution` is treated as a specialist setting.** A team
  that genuinely distributes binary frameworks will want more than §3 says,
  and will find it in SE-0260 rather than here.
