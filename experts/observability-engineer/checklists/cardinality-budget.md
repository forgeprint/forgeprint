# Cardinality budget

A metric's series count is the product of the distinct values of its
attributes. Nothing warns when it grows; it shows up as a slow query and an
invoice. The budget makes the growth a decision.

| #   | Check                                                                                     | How                                                                                       | Source                                                 |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| CB1 | The plan lists each metric's attributes and their expected distinct values                | `docs/observability/<service>.md` has the table; the product is written                   | Prometheus — instrumentation: use labels               |
| CB2 | No unbounded value is a metric attribute: user id, email, request id, session id, raw URL | grep instrument calls and views for those keys                                            | Prometheus — naming: labels; Semantic conventions 1.44 |
| CB3 | The SDK cardinality limit is set explicitly where the default (2000) is wrong             | the view or reader configuration names the limit per instrument                           | OTel spec 1.61 — metrics SDK: cardinality limits       |
| CB4 | The overflow series is watched                                                            | a ticket-level alert on any series with `otel.metric.overflow="true"`                     | OTel spec 1.61 — metrics SDK: overflow attribute       |
| CB5 | Attributes that must not leave the service are dropped or aggregated in the Collector     | the Collector configuration in the repository, with the processor for each                | OpenTelemetry Collector 0.161                          |
| CB6 | Personal data is redacted before export                                                   | a redaction processor, or an allow-list of attribute keys, in the Collector configuration | Collector contrib — redaction processor                |
| CB7 | The top metrics by series count are reviewed on a schedule                                | the cost review lists the ten largest and the attribute driving each                      | Prometheus — instrumentation                           |

## Why each one

**CB2** is where nearly all cardinality incidents start. One `user_id` label
on a request counter turns a handful of series into one per user, and every
dashboard query now scans all of them. Those values belong on spans and
logs, where they are sampled or indexed, not on metrics, where they are
multiplied.

**CB3 and CB4** make the budget enforceable in the SDK itself. The
specification defines a cardinality limit per metric stream — 2000 by
default — beyond which new attribute sets are folded into one overflow
series marked `otel.metric.overflow=true`. Setting the limit makes the
budget explicit; watching the overflow series is how anyone finds out it was
exceeded.

**CB6** because telemetry is exported to systems with wider access and longer
retention than the application database. An email in a span attribute is an
email in every backend the Collector feeds.
