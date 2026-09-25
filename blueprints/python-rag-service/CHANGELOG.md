# Changelog — python-rag-service

## 1.0.0 — 2026-09-25

First version: a FastAPI retrieval-augmented generation service on PostgreSQL
18 with pgvector 0.8.6, Alembic migrations, and a deterministic fake model
that runs every test and every setup check without a key.

**Generated** from the 2026-09-24 demand research
([report](../../docs/research/2026-09-24-demand.md), candidate 12), which
measured `pgvector` at 6.9M, `openai` at 69.1M and `anthropic` at 33.8M weekly
downloads on PyPI and flagged the overlap with `fastapi-service` and
`langgraph-agent` as the risk. The recipe runs in CI like every other and
nobody has run it against a real provider, so it is `tier: community` and
says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

What was decided:

- **Retrieved text is fenced and escaped**, and the system instruction says
  passage text is data. Tests feed a chunk and a question that try to close
  the fence.
- **Citations are checked against what was retrieved.** Invented ids are
  dropped; an answer citing nothing retrieved is withheld as `not_grounded`.
  An empty store answers `nothing_to_answer_from` without calling the model.
- **HNSW, not IVFFlat**, because the index is built on an empty table.
- **The embedding width is one constant** that the migration, the adapter and
  a test against the live column all read.
- **Ingest is guarded by an operator token**, because whoever writes documents
  writes into every later prompt. Ask is open and `overview.md` says so.
- **The real provider refuses to start without a key and a chat model**; the
  fake has to be chosen, and every answer names the provider.
- **Bounds on every request:** field lengths, a Content-Length check before
  parsing, `top_k`, answer tokens and a provider timeout.
- **pip and `requirements.txt`**, the same packaging as `fastapi-service`,
  rather than `uv`, which the catalog's CI does not install yet.

Reviewed before the pull request opened
([2026-09-25](../../docs/reviews/python-rag-service/2026-09-25.md), verdict
MERGE, no critical or high findings). Two findings were closed in this
version as rules in `AGENTS.md`: the service runs with a role that can only
read and insert, not the one that migrates, and `answer` is rendered as text.

What was verified: every version pinned here was read from PyPI and Docker
Hub on 2026-09-25 (FastAPI 0.141.1, uvicorn 0.53.0, SQLAlchemy 2.1.0, psycopg
3.3.6, pgvector 0.5.0, Alembic 1.20.0, pydantic-settings 2.15.0, openai
3.19.2, pytest 9.1.1, httpx 0.28.1, `pgvector/pgvector:0.8.6-pg18-trixie`,
`python:3.13.15-slim-trixie`). The recipe was run end to end with
`forgeprint test-setup` on Windows 11 with Git Bash, Python 3.14 and Docker
29.7, and in CI on Ubuntu with Python 3.13.

### Planned

- Per-document ownership and a retrieval filter, with pgvector iterative index
  scans and a cross-owner test. Left out because it needs an identity source
  this blueprint does not have.
- Hybrid retrieval (a `tsvector` column alongside the vectors) and a relevance
  threshold before generation.
- Delete and re-ingest endpoints.
