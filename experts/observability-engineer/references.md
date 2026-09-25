# References

Every rule in [`SKILL.md`](SKILL.md) and every checklist row rests on one of
these. An item that cites nothing is somebody's opinion and does not belong in
a review ([ADR 0010](../../docs/decisions/0010-review-standards.md)).

Each row carries the version current when it was read and the date of that
reading. OpenTelemetry versions were read from each repository's latest
release on the date shown. **Re-check every 90 days**; the specification and
the semantic conventions release roughly monthly, and the HTTP conventions
cited here are stable, so a re-check should change versions, not rules.

> **Next re-check due: 2026-12-24.**

## OpenTelemetry

| Reference                                                                                                                                                  | Version                                       | Checked    | Used for                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| [OpenTelemetry specification](https://opentelemetry.io/docs/specs/otel/)                                                                                   | 1.61.0 (2026-09-14)                           | 2026-09-25 | SKILL.md target; SC8; CO2, CO3 — context propagation                                  |
| [Logs data model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)                                                                               | 1.61.0; status Stable                         | 2026-09-25 | SKILL.md §3; CO4–CO6 — `TraceId`, `SpanId`, `Attributes`, `Body`                      |
| [Metrics SDK — cardinality limits](https://opentelemetry.io/docs/specs/otel/metrics/sdk/#cardinality-limits)                                               | 1.61.0; default limit 2000                    | 2026-09-25 | SKILL.md §4; CB3, CB4 — the limit and `otel.metric.overflow`; CO7 exemplars           |
| [Trace SDK — sampling](https://opentelemetry.io/docs/specs/otel/trace/sdk/#sampling)                                                                       | 1.61.0                                        | 2026-09-25 | SKILL.md §5; SA1, SA2, SA6, SA7 — ParentBased, TraceIdRatioBased, `ot=th`             |
| [Resource SDK](https://opentelemetry.io/docs/specs/otel/resource/sdk/)                                                                                     | 1.61.0                                        | 2026-09-25 | SC1                                                                                   |
| [SDK configuration — general environment variables](https://opentelemetry.io/docs/languages/sdk-configuration/general/)                                    | 1.61.0                                        | 2026-09-25 | SC1 `OTEL_SERVICE_NAME`; CO1 `OTEL_PROPAGATORS`; SA2, SA3 `OTEL_TRACES_SAMPLER(_ARG)` |
| [Semantic conventions](https://opentelemetry.io/docs/specs/semconv/)                                                                                       | 1.44.0 (2026-08-04)                           | 2026-09-25 | SKILL.md §2; SC7 (UCUM units); CB2                                                    |
| [Semantic conventions — HTTP metrics](https://opentelemetry.io/docs/specs/semconv/http/http-metrics/)                                                      | 1.44.0; `http.server.request.duration` Stable | 2026-09-25 | SC3–SC5, SC9 — unit, bucket boundaries, attributes, `OTEL_SEMCONV_STABILITY_OPT_IN`   |
| [Semantic conventions — HTTP spans](https://opentelemetry.io/docs/specs/semconv/http/http-spans/)                                                          | 1.44.0                                        | 2026-09-25 | SC6 — `{method} {target}` span names, `http.route`                                    |
| [Semantic conventions — resource](https://opentelemetry.io/docs/specs/semconv/resource/)                                                                   | 1.44.0                                        | 2026-09-25 | SC2 — `service.version`, `deployment.environment.name`                                |
| [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)                                                                                        | 0.161.0 (core and contrib)                    | 2026-09-25 | SKILL.md §4; CB5                                                                      |
| [Collector contrib — tail sampling processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/tailsamplingprocessor) | 0.161.0                                       | 2026-09-25 | SKILL.md §5; SA4, SA5 — policies, same-instance requirement, load-balancing tier      |
| [Collector contrib — redaction processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/redactionprocessor)        | 0.161.0                                       | 2026-09-25 | CB6                                                                                   |

## Propagation standards

| Reference                                                 | Version            | Checked    | Used for                                               |
| --------------------------------------------------------- | ------------------ | ---------- | ------------------------------------------------------ |
| [W3C Trace Context](https://www.w3.org/TR/trace-context/) | W3C Recommendation | 2026-09-25 | SKILL.md §3; CO1, CO2 — `traceparent`                  |
| [W3C Baggage](https://www.w3.org/TR/baggage/)             | current at check   | 2026-09-25 | SKILL.md §3; CO8 — privacy and security considerations |

## Methods

| Reference                                                                                                          | Version           | Checked    | Used for                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ----------------- | ---------- | --------------------------------------------------------- |
| [The RED method — Tom Wilkie](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/) | 2018              | 2026-09-25 | SKILL.md §1, §6; DA3 — rate, errors, duration             |
| [The USE method — Brendan Gregg](https://www.brendangregg.com/usemethod.html)                                      | current at check  | 2026-09-25 | SKILL.md §1, §6; DA3 — utilisation, saturation, errors    |
| [Prometheus — metric and label naming](https://prometheus.io/docs/practices/naming/)                               | Prometheus 3.14.0 | 2026-09-25 | CB2 — no user ids or emails as labels                     |
| [Prometheus — instrumentation: use labels](https://prometheus.io/docs/practices/instrumentation/)                  | Prometheus 3.14.0 | 2026-09-25 | CB1, CB7 — cardinality guidance                           |
| [Prometheus — histograms and summaries](https://prometheus.io/docs/practices/histograms/)                          | Prometheus 3.14.0 | 2026-09-25 | DA5 — percentiles from histograms                         |
| [SRE Book ch. 6 — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)     | 2016 edition      | 2026-09-25 | SKILL.md §6; DA6, DA8 — symptoms versus causes            |
| [SRE Workbook ch. 4 — Monitoring](https://sre.google/workbook/monitoring/)                                         | 2018 edition      | 2026-09-25 | DA4, DA8, DA9; SA6 — monitoring as code, changes reviewed |
| [SRE Workbook ch. 5 — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)                             | 2018 edition      | 2026-09-25 | DA7 — burn-rate alerts belong to the SLO                  |

## Dashboards as code

| Reference                                                                                      | Version        | Checked    | Used for                                            |
| ---------------------------------------------------------------------------------------------- | -------------- | ---------- | --------------------------------------------------- |
| [Grafana — provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/) | Grafana 13.2.2 | 2026-09-25 | SKILL.md §6; DA1, DA2                               |
| [Perses](https://perses.dev/)                                                                  | 0.54.0         | 2026-09-25 | SKILL.md §6; DA1 — an open dashboard-as-code format |

## Deferred to elsewhere

- SLO definitions, error budget policy, burn-rate thresholds, incidents and
  postmortems: the site reliability engineer (open pull request #146).
- What counts as personal or secret data: [`security-reviewer`](../security-reviewer/SKILL.md)
  and [`docs/review-standards.md`](../../docs/review-standards.md).
- Profiling and load tests: [`performance-engineer`](../performance-engineer/SKILL.md).
- Running the Collector, pipelines and infrastructure:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
