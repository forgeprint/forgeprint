# Exceptions and logging

Service code raises domain exceptions. The web layer turns them into problem
details. The logging configuration turns everything else into one JSON line
with a traceback and a correlation id.

| #    | Check                                                                                                                          | How                                                                           | Source                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| XL1  | Services raise domain exceptions; `HTTPException` appears only in the web layer                                                | grep `HTTPException` outside routers and views                                | FastAPI 0.141 — Handling Errors                         |
| XL2  | Each domain exception maps to a status and a problem `type` in one registered handler per class                                | read `app.exception_handler(...)` registrations or the Django/DRF handler     | RFC 9457 §3                                             |
| XL3  | The fallback handler returns a generic 500 with no traceback, SQL or host in the body                                          | raise a bare `RuntimeError` in a test; assert on the body                     | OWASP ASVS 5.0.0 V16; RFC 9457 §5                       |
| XL4  | `raise ... from exc` inside every `except` that raises                                                                         | ruff B904                                                                     | ruff 0.16.8 — B904                                      |
| XL5  | No blind `except Exception` or bare `except` that continues                                                                    | ruff BLE001, E722                                                             | ruff 0.16.8 — BLE001                                    |
| XL6  | Errors are logged with `logger.exception` inside the handler, so the traceback is kept                                         | ruff TRY400                                                                   | ruff 0.16.8 — TRY400                                    |
| XL7  | Log calls pass arguments, not f-strings                                                                                        | ruff G004                                                                     | ruff 0.16.8 — G004                                      |
| XL8  | No `print` in the package                                                                                                      | ruff T201                                                                     | ruff 0.16.8 — T201                                      |
| XL9  | Logging is configured once, at startup, to JSON — `dictConfig` or structlog — and never with `basicConfig` in a library module | grep `basicConfig` and `dictConfig`                                           | Python 3.14 — logging.config; structlog 26.1            |
| XL10 | A middleware clears and binds a correlation id per request, from `traceparent` or generated                                    | read the middleware; send a request with `traceparent` and find it in the log | structlog 26.1 — contextvars; W3C Trace Context Level 1 |
| XL11 | Authorization headers, cookies and secret-named fields never reach a log line                                                  | read the request-logging middleware and any processor that dumps payloads     | OWASP ASVS 5.0.0 V16                                    |

## Why each one

**XL5** is where a failed authorization or a failed write turns into a 200. A
broad `except` that logs and carries on skips the step that failed and
reports success for everything after it.

**XL4** costs nothing and saves the one piece of evidence an incident needs.
Without `from`, the traceback shows where the new exception was raised, not the
database error that caused it.

**XL10** is what makes the rest searchable. Bound through contextvars, the id is
on every line a request produces, including the ones logged three calls deep by
code that never saw the request.
