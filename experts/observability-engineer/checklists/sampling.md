# Sampling

Keeping every trace is rarely affordable, and dropping them at random loses
the ones that matter. Sampling is the decision about which traces survive,
and it has to be written down to be trusted.

| #   | Check                                                                                    | How                                                                                     | Source                                           |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| SA1 | The sampling strategy is in the plan: head, tail, or both, with the rate                 | `docs/observability/<service>.md` names it and the reason                               | OTel spec 1.61 — trace SDK: sampling             |
| SA2 | Head sampling is parent-based, so a child follows its parent's decision                  | `OTEL_TRACES_SAMPLER=parentbased_traceidratio` (or the SDK equivalent)                  | OTel spec 1.61 — ParentBased, TraceIdRatioBased  |
| SA3 | The configured ratio matches the plan                                                    | `OTEL_TRACES_SAMPLER_ARG` in the deployment, compared with the plan                     | OTel SDK configuration                           |
| SA4 | Tail sampling, where used, keeps every error and every trace above the latency threshold | the `tail_sampling` processor's policies in the Collector configuration                 | Collector contrib — tail sampling processor      |
| SA5 | With tail sampling, every span of a trace reaches the same Collector instance            | a load-balancing exporter tier in front of the tail-sampling tier, or a single instance | Collector contrib — tail sampling processor      |
| SA6 | Rates, error ratios and SLIs come from metrics, never from sampled traces                | the SLI queries read metrics; no dashboard counts spans                                 | OTel spec 1.61 — metrics; SRE Workbook ch. 4     |
| SA7 | The sampling rate is visible to whoever reads a trace                                    | the threshold in `tracestate` (`ot=th:...`), or the backend's sampling metadata         | OTel spec 1.61 — TraceState probability sampling |

## Why each one

**SA2** because a service that samples independently of its caller produces
broken traces: the parent kept, the child dropped, or the reverse. Parent-based
sampling makes the decision once, at the root, and every hop honours it.

**SA5** is the operational catch in tail sampling. The decision is made
after all spans of a trace have arrived; with several Collector replicas
behind a plain load balancer, each sees a fragment and decides on it. The
processor's own documentation requires a load-balancing tier keyed on trace
id.

**SA6** because a count taken from sampled traces is wrong by the sampling
factor, and wrong in a way that changes whenever somebody tunes the rate.
Metrics are not sampled; SLIs are computed from them.
