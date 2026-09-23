# Observability

Decided at design time, or bolted on during the first incident — which is the
worst possible moment to be choosing span names.

| #   | Check                                                                            | How                                                      | Source                                         |
| --- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| O1  | One `ActivitySource`, named for the assembly                                     | grep its construction                                    | OpenTelemetry .NET                             |
| O2  | A span around every outbound dependency: database, HTTP, broker                  | read the infrastructure adapters                         | OpenTelemetry semantic conventions             |
| O3  | Logs use message templates, never string interpolation                           | grep the log calls for interpolated strings              | Structured logging                             |
| O4  | No secret, token, connection string or full body is logged                       | read every log call on the auth and infrastructure paths | ASP.NET Core security guidance                 |
| O5  | Liveness and readiness are separate endpoints, and readiness checks dependencies | read the health check registration                       | Kubernetes probe semantics                     |
| O6  | Trace context crosses the process boundary and appears in the logs               | check the outbound HTTP and broker adapters              | W3C Trace Context                              |
| O7  | Levels mean something; nothing routine is logged as an error                     | scan the levels in one busy path                         | An alert that fires constantly is not an alert |

## Why each one

**O5** has a failure mode in both directions. A liveness probe that checks the
database restarts a perfectly healthy instance when the database blips; a
readiness probe that checks nothing routes traffic to an instance that cannot
serve it. One endpoint doing both picks one of those failures arbitrarily.

**O6** is what makes the other six worth having. A trace that stops at the
process boundary answers "what did this service do" and never "where did the
request go", and the second question is the one asked during an incident.
