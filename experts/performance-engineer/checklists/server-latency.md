# Server latency and resources

Services are read with RED, the resources under them with USE. The two answer
different questions — is the user waiting, and which resource is making them
wait — and a diagnosis needs both.

| #   | Check                                                                                                  | How                                                                        | Source                             |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------- |
| SV1 | Every service exposes rate, errors and duration                                                        | find the three metrics per endpoint or per operation                       | RED method                         |
| SV2 | Duration is recorded as a histogram, so percentiles are computed rather than averaged                  | read the metric type; a gauge of the mean fails                            | RED method; Google SRE Book — SLOs |
| SV3 | Latency is reported at p50 and at p95 or p99, never as an average alone                                | read the dashboard or the report                                           | Google SRE Book — SLOs             |
| SV4 | Every resource on the path is checked for utilisation, saturation and errors                           | list CPU, memory, disk, network, and each pool; three readings for each    | USE method                         |
| SV5 | Software resources — connection pools, thread pools, locks — are on the USE list, not only hardware    | read the list from SV4                                                     | USE method                         |
| SV6 | Saturation is read directly: queue length, wait time, or pool exhaustion                               | find the metric; high utilisation is not the same signal                   | USE method                         |
| SV7 | Queries are counted per request before any single query is tuned                                       | a trace or the query log for one request; count the statements             | Rails guides — N+1                 |
| SV8 | No query is issued once per row of a previous result                                                   | read the data access path, or look for N identical statements in the trace | Rails guides — N+1                 |
| SV9 | The workload is characterised — who calls, how often, with what payload — before capacity is discussed | read the report's workload section                                         | Systems Performance 2e, ch. 2      |

## Why each one

**SV3 is the reason averages are refused.** Google's SRE book gives the case
directly: most requests fast, a small share twenty times slower, and an average
that shows neither the tail nor a change in it. Users meet the tail.

**SV6** is the USE row people skip. Utilisation says a resource is busy;
saturation says work is queueing for it, and queueing is where latency comes
from. A pool at 100% utilisation with nothing waiting is fine. A pool at 70%
with a queue is the problem.

**SV7** saves the most time. An endpoint issuing one query per row is fixed by
changing how it loads data, and an afternoon spent on one query's plan while
there are two hundred of them is an afternoon lost. Once it is one query, its
plan goes to [`sql-data-engineer`](../../sql-data-engineer/SKILL.md).
