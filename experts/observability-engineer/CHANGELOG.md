# Changelog

## 1.0.0 — 2026-09-25

The catalog's observability engineer: what a service emits, how the signals
join up, and what it costs. SLOs and the incident process belong to the site
reliability engineer; tuning belongs to the performance engineer.

- One observability plan per service, written before instrumentation:
  the questions the telemetry must answer, the RED and USE signals that
  answer them, the sampling decision, the cardinality budget, retention.
- Names from the OpenTelemetry semantic conventions (1.44.0): `service.name`
  and the resource attributes on everything, `http.server.request.duration`
  with the recommended buckets, low-cardinality span names and `http.route`.
- Correlation: W3C Trace Context propagated across every hop, and `TraceId`
  and `SpanId` on every log record, per the OpenTelemetry logs data model.
- A cardinality budget per metric, enforced by the SDK's cardinality limit
  and checked for the overflow series; no user ids, emails or raw paths as
  attributes.
- Sampling decided on purpose: parent-based head sampling at a stated ratio,
  or tail sampling in the Collector with the policies written down.
- Dashboards and alerts as code in the repository, provisioned rather than
  edited by hand; alerts on symptoms, with causes on dashboards.
- Ten refusals and five checklists, every row traced to a source in
  `references.md`.

Drafted by a tool from the 2026-09-24 role research
(`docs/research/2026-09-24-roles.md`, row 27). Every version was read from
the project's own release on 2026-09-25. The expert has not been manually
verified against a real service — `provenance: generated` says so (ADR 0011).
