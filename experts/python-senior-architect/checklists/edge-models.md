# Edge models

Untrusted data is parsed by an edge model, business rules live on a domain
object, persistence lives on a row. Three classes, two conversions, and the
checklist is whether they are kept apart.

| #   | Check                                                                               | How                                                                        | Source                                                 |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| EM1 | Request and message bodies are parsed by pydantic models, never read from raw dicts | read each handler and consumer                                             | pydantic 2.13 — models                                 |
| EM2 | Edge models reject unknown fields                                                   | `model_config = ConfigDict(extra="forbid")` on input models                | pydantic 2.13 — configuration                          |
| EM3 | Domain objects are dataclasses (or plain classes) that import no framework          | `grep -rn "pydantic\|django\|sqlalchemy" src/<pkg>/domain` is empty        | Python 3.14 — `dataclasses`; import-linter 2.15        |
| EM4 | Value objects are immutable                                                         | `@dataclass(frozen=True)`                                                  | Python 3.14 — `dataclasses`                            |
| EM5 | No ORM row is returned from an endpoint or passed into the domain                   | read the response types and the service signatures                         | Django 6.1 — models; SQLAlchemy 2 — ORM mapping        |
| EM6 | The conversion between each pair of kinds lives in one named place                  | find the mapping functions; count the places a row becomes a domain object | Fowler, PoEAA — Data Mapper                            |
| EM7 | Settings are one `pydantic-settings` class, instantiated once at startup            | `grep -rn "os.environ\|getenv" src` hits only the settings module          | pydantic-settings 2.15                                 |
| EM8 | A missing required setting stops the process before it serves                       | unset one and start; it must exit non-zero                                 | pydantic-settings 2.15                                 |
| EM9 | Time crossing an edge is timezone-aware                                             | `ruff check --select DTZ`                                                  | ruff 0.16 — flake8-datetimez; Python 3.14 — `datetime` |

## Why each one

**EM5** is the one that costs the most to undo. Once an ORM row is the response
body, every column is an API field and every migration is a breaking change to
callers who never asked for that column.

**EM2** because pydantic's default is to ignore unknown fields. A client that
misspells an optional field gets a silent default instead of an error, and the
bug report arrives weeks later as "the setting does nothing".

**EM8** is EM7 proved: a settings class that is defined but only read lazily
fails on the first request that needs the value, on one instance, in
production.
