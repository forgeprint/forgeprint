# Load testing

A load test is an experiment, and it has the same failure modes as any other:
an unrepeatable setup, a model that quietly measures something else, and a
result nobody checks.

| #   | Check                                                                                               | How                                                                                     | Source                         |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------ |
| LT1 | The tool is pinned, and its version is saved with the results                                       | `k6 version` output in the baseline folder; no `latest` image tag                       | k6 2.3.0                       |
| LT2 | A test plan exists before the run: workload model, arrival rate, duration, data set, stop condition | read the test plan                                                                      | Systems Performance 2e, ch. 12 |
| LT3 | Behaviour under a given arrival rate is tested with an open model                                   | the scenario uses `constant-arrival-rate` or `ramping-arrival-rate`                     | k6 — open and closed models    |
| LT4 | A closed-model result is never reported as capacity under overload                                  | read the executor next to the claim; coordinated omission flatters the latency          | k6 — open and closed models    |
| LT5 | The target is written as a threshold, so a miss exits non-zero                                      | read `options.thresholds`, e.g. `http_req_duration: ['p(95)<400']`; check the exit code | k6 — thresholds                |
| LT6 | The data volume is production-like, and the cache is warmed before measuring                        | read the setup; an empty database measures nothing anyone runs                          | Systems Performance 2e, ch. 12 |
| LT7 | The load generator is not the bottleneck                                                            | read the generator's own CPU and network during the run                                 | USE method                     |
| LT8 | The same profile is run at least three times per side                                               | count the saved outputs                                                                 | Systems Performance 2e, ch. 12 |
| LT9 | Raw output is saved, not only the summary on screen                                                 | `k6 run load.js 2>&1 \| tee perf/<run>/<side>/k6-<n>.txt`                               | Systems Performance 2e, ch. 12 |

## Why each one

**LT3 and LT4 are the rows that change the answer.** In a closed model each
virtual user waits for its response before sending the next request, so a
slowing system receives less load exactly when the test should be pushing it.
The latency it reports is the latency of a system under less pressure than the
plan said — k6's documentation names this coordinated omission.

**LT5** turns a load test from a chart into a check. A threshold makes k6 exit
non-zero when the target is missed, so the same script can gate a build.

**LT7** is the quiet one. A load generator at 100% CPU produces a latency curve
that belongs to the generator, and it looks exactly like the system under test
falling over.
