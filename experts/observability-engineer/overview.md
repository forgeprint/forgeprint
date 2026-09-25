# Observability Engineer

## What it changes

An agent asked to "add observability" without this expert installs an SDK,
logs with interpolated strings, invents metric names, adds a `user_id` label
because it seemed useful, samples traces at whatever the default was, and
builds a dashboard by hand. Each piece works in isolation. Together they
cannot be joined, cost more every week, and describe a system nobody can
check against the code.

This expert turns each of those into something a reviewer can verify:

- **A plan before instrumentation** — the questions the telemetry must
  answer, RED and USE signals for them, a cardinality budget, the sampling
  decision and retention.
- **Names from the OpenTelemetry semantic conventions** — `service.name` on
  everything, `http.server.request.duration` with its stable attributes,
  low-cardinality span names.
- **Signals that join** — W3C Trace Context across HTTP and queues, `TraceId`
  and `SpanId` on every log record, exemplars from latency to traces.
- **A cardinality budget per metric** — no unbounded attributes, the SDK's
  limit set on purpose, the overflow series watched, personal data redacted
  in the Collector.
- **Sampling on purpose** — parent-based head sampling at a recorded ratio,
  or tail sampling with written policies and a load-balancing tier.
- **Dashboards and alerts as code** — provisioned from the repository, RED
  first, alerts on symptoms.

## What it fits

- Instrumenting a new service, or a service whose logs and traces do not
  join up.
- An observability bill that grew without anybody deciding it — the cost
  review deliverable.
- Reviewing a pull request that adds a metric, a log field, a span or a
  dashboard.
- Any language: the rules are about OpenTelemetry's specification and
  configuration, which every SDK implements.

## What it does not fit

- **SLO targets, error budgets and incident process** — the site reliability
  engineer (drafted in the same round). This expert makes sure the SLI metrics
  exist and are right; it does not choose the objective.
- **Making a service faster** — `performance-engineer`. Telemetry says where
  the time goes; tuning is somebody else's job.
- **Running the telemetry platform** — Collector deployment, storage, scaling:
  `devops-platform-engineer`.
- **A vendor's proprietary agent with no OpenTelemetry path.** The principles
  hold; the checks name OpenTelemetry fields and environment variables.

## Pros and cons

**In its favour:** it rests on a specification with stable parts — the logs
data model, the HTTP semantic conventions, the metrics SDK's cardinality
limit — so most rows are a grep, an environment variable or a configuration
file. It is backend-neutral: the same checks apply whether the data goes to
an open-source stack or a vendor.

**Against it:** an observability plan is a document a team has to keep
current, and it is the first thing to rot. Tail sampling adds a stateful
Collector tier to operate. And the cardinality rules push high-cardinality
questions ("which customer?") onto traces and logs, which some teams would
rather answer with metrics and pay for.
