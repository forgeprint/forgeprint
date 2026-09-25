# Semantic conventions

A name invented per service is a query written per service. The
OpenTelemetry semantic conventions exist so that `http.server.request.duration`
means the same thing everywhere, and a dashboard built once works for all of
them.

| #   | Check                                                                                    | How                                                                                                       | Source                                           |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| SC1 | Every signal carries `service.name`                                                      | `OTEL_SERVICE_NAME` in the deployment, or the resource in SDK set-up; no `unknown_service` in the backend | OTel spec 1.61 — resource SDK; SDK configuration |
| SC2 | `service.version` and `deployment.environment.name` are on the resource                  | read the resource attributes                                                                              | Semantic conventions 1.44 — resource             |
| SC3 | HTTP servers emit `http.server.request.duration` as a histogram in seconds               | the metric exists with unit `s`                                                                           | Semantic conventions 1.44 — HTTP metrics         |
| SC4 | Its buckets are the recommended boundaries, or a written reason for others               | the view or advisory configuration                                                                        | Semantic conventions 1.44 — HTTP metrics         |
| SC5 | HTTP metrics carry `http.request.method`, `http.route`, `http.response.status_code` only | list the metric's attributes; no `url.path`, no `url.full`                                                | Semantic conventions 1.44 — HTTP metrics         |
| SC6 | Span names are low-cardinality: `{method} {route}`, never a concrete path                | sample span names in the backend; any id in a name is a finding                                           | Semantic conventions 1.44 — HTTP spans           |
| SC7 | Custom metrics have a namespace, a UCUM unit and the right instrument                    | read each instrument definition; durations are histograms                                                 | Semantic conventions 1.44 — general metrics      |
| SC8 | Instrumentation libraries are used for frameworks and clients before hand-written spans  | the dependency list; hand spans only around business operations                                           | OpenTelemetry specification 1.61                 |
| SC9 | A service migrating HTTP conventions says which mode it emits                            | `OTEL_SEMCONV_STABILITY_OPT_IN` value recorded in the plan                                                | Semantic conventions 1.44 — HTTP migration       |

## Why each one

**SC1** is the first thing to check because everything else is filtered by
it. A service that does not set `service.name` shows up as
`unknown_service`, merged with every other service that forgot, and no
dashboard or alert can select it.

**SC5 and SC6** are where cardinality enters through naming. `url.path`
holds the concrete path — `/orders/8412` — and is fine on a span; as a
metric attribute or a span name it makes every order its own series or
operation. `http.route` holds the template and exists for exactly this.

**SC4** because a histogram's buckets decide which percentiles are
meaningful. Custom buckets that stop at one second cannot show a
three-second tail, and the dashboard will say p99 is "over 1s" forever.
