# Performance Engineer

## What it changes

An agent asked to make something faster will change it and say it is faster.
This expert makes it prove that, and makes the proof checkable afterwards:

- **The baseline comes first, and the commit order shows it.** Raw tool output,
  the tool's version, the environment and the command are committed under
  `perf/<run>/baseline/` before the change is.
- **One change per measurement.** Two changes measured together are one
  unexplained number.
- **A result carries its variance.** Several runs, read at the median, with the
  spread. A difference smaller than the spread is reported as "no measurable
  change", which is a legitimate outcome and is written down as one.
- **Web pages are judged the way users experience them**: Core Web Vitals from
  field data at the 75th percentile, with Lighthouse — pinned, five runs — as
  the lab instrument for finding causes, never as the verdict.
- **Services are judged in percentiles**, read with RED, with USE for the
  resources underneath, a profile before any optimisation, and queries counted
  per request before any one of them is tuned.

Five checklists — measurement discipline, Core Web Vitals, server latency, load
testing, profiling — and twelve refusals.

## What it fits

- "This page is slow" or "this endpoint is slow", where the first job is
  turning the complaint into a question with a metric, a percentile and a
  target.
- Reviewing a pull request that claims a performance improvement.
- Setting a performance budget and wiring it into the build so it fails.
- Planning and running a load test with k6, and reading its result honestly.
- Any stack. Nothing here is tied to a language; the commands name tools, not
  frameworks.

## What it does not fit

- **Setting SLOs, alerting, on-call or rollout.** It measures against a target;
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md) sets and
  operates the target.
- **Tuning an individual query or designing indexes.** It finds the N+1 and
  hands the single slow query to [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
  A database-administrator expert is planned for schema and index design.
- **Frontend implementation.** It says which interaction is slow and proves the
  fix worked; rewriting the component is a planned frontend-engineer's work.
- **Capacity planning and cost.** A load test here answers a question about one
  workload. Forecasting growth and buying for it is a different discipline.
- **Mobile-app, game-engine or embedded performance.** The method holds; the
  metrics and tools named here do not.
- **Load testing a system you do not own.** It refuses, and it refuses
  production without the owner's written agreement and a stop condition.

## Pros and cons

**In its favour:** almost every rule leaves a file behind, so whether it was
followed is a matter of looking — the baseline folder exists or it does not,
its commit precedes the change or it does not. The "no measurable change"
verdict is the most useful thing in it: it stops noise shipping as a win, and
it is the result agents are least inclined to report on their own.

**Against it:** the discipline is slow. Five Lighthouse runs per side and three
load-test runs per profile make a small fix take an afternoon, and on a
prototype that is overhead nobody should pay. It covers web and server in one
expert, which keeps each half shallower than a specialist's — the 2026-09-24
research suggested splitting them, and a later version may. And it has not yet
been run on a real project by a person; `provenance: generated` is the honest
label.
