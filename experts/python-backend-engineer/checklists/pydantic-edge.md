# Pydantic at the edge

Python type hints are not enforced at runtime. The only thing standing between
a request and the service code is a pydantic model, so the model has to refuse
what it was not told about and bound what it was.

| #   | Check                                                                                                   | How                                                                                       | Source                                                     |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| PE1 | Every request body is a pydantic model; no endpoint takes `dict`, `Any` or `Request.json()` unvalidated | grep endpoint signatures for `dict`, `Any`, `await request.json()`                        | OWASP ASVS 5.0.0 V2; FastAPI — Request Body                |
| PE2 | Request models set `extra="forbid"`                                                                     | grep `model_config` on every request model                                                | Pydantic 2.13 — Models, extra data                         |
| PE3 | Strings, lists and numbers carry bounds (`max_length`, `le`, `max_length` on lists)                     | read each request model                                                                   | OWASP ASVS 5.0.0 V2; OWASP API4:2023                       |
| PE4 | The request model is a separate class from the ORM model and from the response model                    | compare the classes the endpoint binds, stores and returns                                | OWASP API3:2023                                            |
| PE5 | Raw JSON is parsed with `model_validate_json`, not `json.loads` followed by `model_validate`            | grep `json.loads(` on request and message payloads                                        | Pydantic 2.13 — Models, validating data                    |
| PE6 | Settings are one `BaseSettings` class instantiated at startup; a secret field has no default            | read the settings module; start without the secret — startup must fail                    | pydantic-settings 2.15; The Twelve-Factor App — III Config |
| PE7 | `os.environ` and `os.getenv` appear only in the settings module                                         | grep both across the package                                                              | The Twelve-Factor App — III Config                         |
| PE8 | `RequestValidationError` (FastAPI) or the framework's equivalent is mapped to problem details           | send an invalid body; the response is `application/problem+json`, not `{"detail": [...]}` | FastAPI 0.141 — Handling Errors; RFC 9457 §3               |
| PE9 | Upstream responses are validated with a model before their fields are used                              | read each outbound client for `.json()` used directly                                     | OWASP ASVS 5.0.0 V2                                        |

## Why each one

**PE2** is the row most Python services miss, because the default looks
harmless. Pydantic ignores extra fields; the handler never sees `role` or
`tenant_id`, so nobody notices the caller tried to set them. The day somebody
writes `Order(**payload)` from the raw body instead of the model, the ignored
field is suddenly honoured.

**PE4** is the mass-assignment defence that does not depend on anybody
remembering PE2. If the class the caller fills is not the class that is saved,
there is no field for the caller to reach.

**PE6** moves a missing secret from the first request that needs it to the
moment the process starts, which is the moment somebody is watching the deploy.
