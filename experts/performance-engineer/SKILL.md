---
name: performance-engineer
description: Find and fix what makes a web page or a service slow the way a performance engineer does — record a baseline before touching anything, change one thing, measure again with the same method, and report the result with its variance. Core Web Vitals at the 75th percentile for pages; latency percentiles, USE and RED for services; a pinned load-test tool and a profile before any optimisation. Use when something is "slow", before and after an optimisation, when setting a performance budget, or when an agent is about to add a cache without a number.
license: CC-BY-4.0
---

# Working as a performance engineer

Most performance work fails the same way: somebody changes three things, runs
the page once, sees a better number and ships it. Nobody can say which change
helped, whether the number moved more than it moves on its own, or whether
users see any of it.

This skill is the procedure that prevents that. Every step leaves a file or a
number behind, so it can be checked afterwards that the step happened.

---

## 1. The loop: measure, change one thing, measure again

1. **Create the run folder** before anything else:
   `perf/<YYYY-MM-DD>-<topic>/`. Everything below is written into it.
2. **Write the question** in `perf/<run>/question.md`: which user journey or
   endpoint, which metric, which percentile, and the target. "Checkout is slow"
   is a complaint; "p95 of `POST /checkout` under 400 ms at 50 requests per
   second" is a question.
3. **Record the baseline** in `perf/<run>/baseline/`: the raw output of every
   run, the tool and its version, the environment (hardware, network profile,
   data volume, build or commit), and the command that produced it. **Commit
   it before the change.** Then the order is provable:
   `git log --format='%h %s' -- perf/<run>/baseline` shows a commit older than
   the change.
4. **Change one thing.** One commit, one hypothesis. Two changes measured
   together are one unexplained change.
5. **Measure again** into `perf/<run>/after/` with the same command, the same
   environment and the same number of runs.
6. **Write the report** (§6). If the difference is inside the run-to-run
   spread, the report says "no measurable change" and the change is reverted
   or justified on other grounds.

**Verify it was followed:** `perf/<run>/baseline/` and `perf/<run>/after/`
both exist, contain raw output rather than a summary typed by hand, and the
baseline commit precedes the change commit.

See [`checklists/measurement-discipline.md`](checklists/measurement-discipline.md).

---

## 2. Numbers that mean something

- **Percentiles, never an average alone.** An average hides the tail, and the
  tail is where users leave. Report p50 with p95 or p99, and say which.
- **Several runs, read at the median, with the spread.** One run measures the
  weather. For Lighthouse, five runs and the median; for a load test, at least
  three runs of the same profile.
- **A difference smaller than the spread is not a difference.** If the
  baseline runs range over 300 ms, a 100 ms improvement is noise until more
  runs say otherwise.
- **The environment is part of the number.** A laptop on office Wi-Fi and a
  production-sized instance behind a load balancer are two different
  experiments. Write down which one this was.

---

## 3. Web: field data decides, lab data explains

The Core Web Vitals, judged at the **75th percentile** of page loads, mobile
and desktop separately:

| Metric | Good     | Poor     |
| ------ | -------- | -------- |
| LCP    | ≤ 2.5 s  | > 4.0 s  |
| INP    | ≤ 200 ms | > 500 ms |
| CLS    | ≤ 0.1    | > 0.25   |

- **Field data is what users experience**; if it exists, it sets the priority.
  A lab score is not a Core Web Vitals result, and a report never calls it one.
- **Lighthouse is the lab instrument** — for finding causes and for gating a
  build — pinned by version:
  `npx lighthouse@13.5.0 <url> --only-categories=performance --output=json --output-path=perf/<run>/baseline/lh-1.json`,
  five times, median.
- **INP needs interaction.** A page-load lab run has no user input, so it
  cannot measure INP. Use field data, or a scripted interaction trace.
- **A performance budget is a failing check, not a slide.** Bytes of
  JavaScript, image weight, LCP in the lab run — enforced in CI so that a
  regression fails the build that introduced it.

See [`checklists/core-web-vitals.md`](checklists/core-web-vitals.md).

---

## 4. Server: resources with USE, services with RED

- **USE, for every resource** — CPU, memory, disk, network, and software
  resources like connection pools and thread pools: **U**tilisation,
  **S**aturation, **E**rrors. Saturation is the one people skip, and a queue is
  where latency comes from.
- **RED, for every service**: **R**ate, **E**rrors, **D**uration — duration as
  a histogram, so percentiles can be computed rather than averaged.
- **Count the queries per request before tuning any one of them.** A request
  issuing a query per row (N+1) is fixed by changing the access pattern, not
  by an index. The plan of an individual slow query goes to
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md).
- **Profile before optimising.** A CPU profile or a flame graph names where the
  time goes. Optimising the function you suspect is a guess with a commit
  message.

See [`checklists/server-latency.md`](checklists/server-latency.md) and
[`checklists/profiling.md`](checklists/profiling.md).

---

## 5. Load tests that do not lie

- **Pin the tool.** k6 at a stated version — `k6 version` goes into the
  baseline folder. A load test run with whatever was installed is not
  repeatable.
- **Use an open model** (`constant-arrival-rate` or `ramping-arrival-rate`)
  when the question is behaviour under a given arrival rate. A closed model
  sends less load exactly when the system slows down, and the latency it
  reports is flattered by it.
- **Thresholds fail the run.** `http_req_duration: ['p(95)<400']` makes k6 exit
  non-zero when the target is missed, so the load test is a check, not a chart.
- **Realistic data and a warm-up.** An empty database and a cold cache measure
  a system nobody runs.
- **Never against a system you do not own**, and never against production
  without the owner's written agreement and a stop condition.

Save the output: `k6 run load.js 2>&1 | tee perf/<run>/baseline/k6-1.txt`.

See [`checklists/load-testing.md`](checklists/load-testing.md).

---

## 6. What you produce

| Deliverable        | What it contains                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance report | The question, the baseline, the one change, the method (tool, version, environment, runs), the result as median and spread, and the verdict       |
| Test plan          | For a load test: the workload model, arrival rate, duration, data set, environment, thresholds, and the stop condition                            |
| Observability plan | Per service: RED metrics with duration as a histogram; per resource: the USE signals and where saturation is read. SLOs are not defined here (§8) |

A performance report ends with one of three verdicts: **improved** (outside
the spread, with the number), **no measurable change**, or **regressed**. The
second is a legitimate result and it is written down as one.

---

## 7. What you refuse

| Refuse                                                       | Because                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| An optimisation with no before-and-after number              | Nobody can tell whether it helped, including its author       |
| A baseline recorded after the change                         | It measures the new code twice                                |
| Several changes measured together                            | Which one helped is unknowable, and one of them may have hurt |
| An average as the only latency figure                        | It hides the tail, which is what users feel                   |
| One run as evidence                                          | Run-to-run spread is often larger than the effect             |
| A lab score reported as a Core Web Vitals pass               | The assessment is field data at the 75th percentile           |
| An INP claim from a page-load lab run                        | There was no interaction to measure                           |
| A closed-model load test reported as capacity under overload | It sends less load when the system slows, and hides the queue |
| A load-test tool at an unstated or `latest` version          | The run cannot be repeated                                    |
| Optimising code no profile pointed at                        | A guess with a commit message                                 |
| Tuning one query before counting queries per request         | N+1 is fixed by the access pattern, not by an index           |
| A load test against a system you do not own, or unannounced  | It is indistinguishable from an attack, and it may become one |

---

## 8. What you defer

- **SLOs, alerting and rollout** — which objective, which window, what pages
  somebody: [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
  This expert measures against a target; that one sets and operates it.
- **Whether the suite that gates the build is trustworthy**:
  [`qa-automation-lead`](../qa-automation-lead/SKILL.md). A performance check
  in CI is one more signal it owns.
- **An individual slow query's plan, and index design**:
  [`sql-data-engineer`](../sql-data-engineer/SKILL.md) today; a
  database-administrator expert is planned for schema and indexes.
- **Frontend implementation** — rewriting the component, choosing the
  framework: a planned frontend-engineer expert. This one says what is slow and
  proves the fix worked.
