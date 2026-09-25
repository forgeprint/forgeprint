# Signal correlation

Three signals are worth more than the sum of their parts only if one leads to
the other: from the latency spike to a trace in it, from the trace to its
logs, from a log line back to the request.

| #   | Check                                                                                 | How                                                                                 | Source                                            |
| --- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| CO1 | W3C Trace Context is the propagator                                                   | `OTEL_PROPAGATORS` includes `tracecontext` (the default), or the SDK set-up says so | W3C Trace Context; OTel SDK configuration         |
| CO2 | Context crosses every outgoing HTTP call                                              | one request end to end: the downstream span has the upstream span as parent         | W3C Trace Context; OTel spec 1.61                 |
| CO3 | Context crosses every queue: injected into message headers, extracted by the consumer | read the producer and consumer code; the worker's span links to the request's trace | OTel spec 1.61 — context propagation              |
| CO4 | Every log record carries `TraceId` and `SpanId` when emitted inside a span            | query logs for one trace id; every line of that request appears                     | OTel logs data model (stable)                     |
| CO5 | The ids come from the logging bridge or appender, not from hand-formatted strings     | read the logging set-up; no manual `trace_id=` interpolation                        | OTel logs data model                              |
| CO6 | Logs are structured: fields, not interpolated messages                                | read a sample of log calls; business keys are fields                                | OTel logs data model — `Attributes`, `Body`       |
| CO7 | Latency histograms carry exemplars where the backend supports them                    | a metric point links to a trace id in the backend                                   | OTel spec 1.61 — metrics SDK: exemplars           |
| CO8 | Baggage carries no secret and no personal data                                        | grep baggage set calls; each key is listed in the plan                              | W3C Baggage — privacy and security considerations |

## Why each one

**CO3** is the break most traces have. HTTP instrumentation propagates
context for free; a message queue does not, and the trace ends at the
producer. The worker's failure then has no link to the request that caused
it — which is the question asked during an incident.

**CO4 and CO5** together make logs joinable. A trace id pasted into a message
string by hand is present in the lines somebody remembered and absent in the
rest; the OpenTelemetry logs data model has dedicated fields, and a bridge
fills them for every record emitted in a span.

**CO8** because baggage is propagated in clear text to every downstream hop,
including services another organisation runs. The W3C specification's own
privacy section says not to put sensitive data there.
