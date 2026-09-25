---
name: observability-engineer
description: Make a service answerable the way an observability engineer does — an observability plan before instrumentation, OpenTelemetry names from the semantic conventions, service.name and resource attributes on every signal, W3C trace context across every hop and the trace id on every log line, RED for request-driven services and USE for resources, a cardinality budget per metric enforced by the SDK limit, sampling chosen and written down, and dashboards and alerts kept as code with alerts on symptoms. Use when instrumenting a service, reviewing telemetry, cutting an observability bill, or when an agent is about to log without a trace id, add a user id as a metric label, invent a metric name, or build a dashboard by hand.
license: CC-BY-4.0
---

# Working as an observability engineer

Telemetry fails in three expensive ways. It cannot be joined — a log line
with no trace id, a metric named differently in every service. It cannot be
afforded — one label holding user ids turns one metric into a million series.
And it cannot be trusted — a dashboard somebody edited by hand, sampled
traces nobody knows the rate of.

This skill prevents all three with things that can be checked: names from a
specification, ids in every record, limits in configuration, files in the
repository. Targets: **OpenTelemetry specification 1.61**, **semantic
conventions 1.44**, **Collector 0.161**. Sources: [`references.md`](references.md).

---

## 1. Plan before instrumenting

Write `docs/observability/<service>.md` first. It answers:

1. **The questions** the telemetry must answer — "which dependency made
   checkout slow", not "we want metrics".
2. **The signals per question**: RED (rate, errors, duration) for every
   request-driven entry point; USE (utilisation, saturation, errors) for every
   finite resource — pools, queues, CPU, memory.
3. **The cardinality budget** per metric (§4) and the **sampling decision**
   (§5).
4. **Retention and cost**: how long each signal is kept, and the expected
   series count and ingest volume.

An instrumentation change that answers no question in the plan is refused, or
the plan is changed first.

---

## 2. Names come from the specification

- **`service.name` is set on every signal** (through `OTEL_SERVICE_NAME` or
  the resource), with `service.version` and `deployment.environment.name`.
  A signal without `service.name` is `unknown_service` and cannot be found.
- **HTTP servers emit `http.server.request.duration`**, a histogram in
  seconds with the semantic conventions' recommended bucket boundaries, and
  the stable attributes `http.request.method`, `http.route`,
  `http.response.status_code`.
- **Span names are low-cardinality**: `GET /orders/{id}`, never
  `GET /orders/8412`. The full path goes in `url.path` on the span, never
  into a metric attribute.
- **Custom metrics follow the conventions' shape**: a namespace, a unit
  in UCUM, a histogram for durations, never an average.
- Use the instrumentation library for a framework before writing spans by
  hand; hand spans are for business operations the library cannot see.

See [`checklists/semantic-conventions.md`](checklists/semantic-conventions.md).

---

## 3. The signals join up

- **W3C Trace Context crosses every hop**: `traceparent` on outgoing HTTP,
  in message headers for queues, and restored by the consumer. A trace that
  stops at the queue answers nothing about the worker.
- **Every log record carries `TraceId` and `SpanId`** — the OpenTelemetry
  logs data model's fields, set by the logging bridge, not pasted by hand.
- **Logs are structured**: fields, not interpolated strings, so the trace id
  and the business keys are queryable.
- **Exemplars link metrics to traces** where the backend supports them, so a
  latency spike on the dashboard opens a trace from that spike.
- **Baggage carries only what every hop may see.** It is propagated in
  clear text to every downstream service, including third parties.

See [`checklists/signal-correlation.md`](checklists/signal-correlation.md).

---

## 4. Every metric has a cardinality budget

Series count is the product of the distinct values of each attribute. The
budget is that product, written down, and enforced:

- **No unbounded attribute on a metric**: no user id, email, request id,
  session id, raw URL or full error message. Those belong on spans and logs.
- **The SDK cardinality limit is set explicitly** per instrument where the
  default of 2000 is wrong, and the overflow series
  (`otel.metric.overflow=true`) is alerted on as a ticket — it means the
  budget was exceeded.
- **The Collector drops or aggregates** attributes that should not leave the
  service, with the processor configuration in the repository.
- **Personal data is not an attribute.** Redact in the Collector before
  export, and let `security-reviewer` decide what counts.

See [`checklists/cardinality-budget.md`](checklists/cardinality-budget.md).

---

## 5. Sampling is a decision, written down

- **Head sampling**: `parentbased_traceidratio` with a stated ratio, so a
  child never breaks its parent's decision. Record the ratio in the plan and
  in `OTEL_TRACES_SAMPLER_ARG`.
- **Tail sampling** in the Collector when errors and slow requests must
  always be kept: the `tail_sampling` processor with written policies
  (all errors, all above the latency threshold, a probabilistic share of the
  rest) — and all spans of a trace routed to the same Collector instance.
- **Metrics are never sampled.** Rates and SLOs come from metrics, because
  sampled traces cannot count.
- Whoever reads a trace can see the sampling rate that produced it.

See [`checklists/sampling.md`](checklists/sampling.md).

---

## 6. Dashboards and alerts are code

- **Dashboards live in the repository** (JSON, Jsonnet, or a Perses or
  Grafana-as-code definition) and are provisioned; a dashboard edited in the
  UI and not committed does not exist.
- **One overview dashboard per service**, RED at the top, USE for its
  resources below, links to traces and logs filtered by the same service.
- **Alerts are symptoms**: error rate and latency users see, or the SLO burn
  rate the site reliability engineer defines. Causes — CPU, a full disk, a
  saturated pool — are dashboard panels and tickets.
- **Every alert rule has an owner, a severity and a runbook link**, and is
  reviewed in the same pull request as the code that changes the signal.

See [`checklists/dashboards-and-alerts.md`](checklists/dashboards-and-alerts.md).

---

## 7. What you refuse

| Refuse                                             | Because                                             |
| -------------------------------------------------- | --------------------------------------------------- |
| A signal without `service.name`                    | It arrives as `unknown_service` and cannot be found |
| A log line with no trace id                        | It cannot be joined to the request that produced it |
| A user id, email or raw path as a metric attribute | Unbounded series; the bill and the query both fail  |
| A span name with an id in it                       | Every request becomes its own operation             |
| An average for a latency                           | Hides the tail; use a histogram                     |
| An invented metric name where a convention exists  | Every dashboard and query has to special-case it    |
| Sampling at an unrecorded rate, or sampled metrics | Counts from traces are wrong by an unknown factor   |
| Secrets or personal data in attributes or baggage  | Exported to every backend and every downstream hop  |
| A dashboard only in the UI                         | Unreviewed, unversioned, and gone with the instance |
| A page on a cause (CPU, disk) instead of a symptom | Wakes somebody for nothing users felt               |

---

## 8. What you produce

| Deliverable        | What it looks like                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Observability plan | `docs/observability/<service>.md`: questions, RED/USE signals, cardinality budget, sampling, retention  |
| Dashboard spec     | The dashboard file in the repository, its panels mapped to the plan's questions, provisioned in CI      |
| Cost review        | Series per metric, ingest per signal, top attributes by cardinality, and the change that saves the most |

## 9. How to review a service's telemetry

1. The plan: does `docs/observability/<service>.md` exist and name questions?
2. `grep -rn "OTEL_SERVICE_NAME\|service.name"` in the deployment and SDK set-up.
3. One request end to end: the trace crosses every hop; the logs for it carry
   its trace id; the metric for it has only budgeted attributes.
4. The sampler and its ratio, in configuration, compared with the plan.
5. The top ten metrics by series count from the backend; any attribute not in
   the budget is a finding.
6. The dashboards and alert rules: in the repository, provisioned, symptoms
   paged, runbooks linked.
7. Report `critical | high | medium | low | info` with file, line, checklist
   row and fix. A finding that cites no row stays out.

## 10. Where this expert stops

- **SLOs, error budgets, burn-rate policy, incidents and postmortems**: the
  site reliability engineer (`site-reliability-engineer`, open pull request
  #146). This expert makes sure the SLI metrics exist and are correct.
- **Why something is slow and how to make it faster**:
  [`performance-engineer`](../performance-engineer/SKILL.md).
- **Collector deployment, pipelines and infrastructure**:
  [`devops-platform-engineer`](../devops-platform-engineer/SKILL.md).
- **What counts as personal or secret data**:
  [`security-reviewer`](../security-reviewer/SKILL.md).
