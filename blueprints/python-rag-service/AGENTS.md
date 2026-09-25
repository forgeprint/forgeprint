# Python RAG Service — agent context

A FastAPI service that answers questions from documents it was given. Ingest
chunks text and stores each chunk with its embedding in PostgreSQL with
pgvector; ask embeds the question, retrieves the closest chunks, and has a
model answer from them with citations. Read this before changing anything
under `app/` or `migrations/`.

## The shape

```
app/settings.py          configuration, from the environment only
app/providers.py         Embedder and Generator protocols, EMBEDDING_DIMENSIONS, provider choice
app/openai_provider.py   the only file that imports a provider SDK
app/fake_provider.py     the deterministic stand-in used by tests and local checks
app/chunking.py          the chunking rule, stated once
app/prompt.py            the system instruction, the fence, and which citations count
app/store.py             every SQL query; the pgvector distance lives here
app/db.py                one engine per process; the session dependency
app/main.py              routes, the body-size limit, the ingest token
migrations/versions/     the schema, including the vector column and its HNSW index
tests/                   chunking and prompt with no database; the API against real pgvector
```

## Rules that are not style preferences

**Retrieved text is data, never instructions.** Everything in `chunks.content`
was written by whoever wrote the documents. It goes to the model only through
`build_user_message`, which fences each chunk in `<passage id="N">` and escapes
angle brackets so a chunk cannot close its fence or open another. The system
instruction says what the fence means. Do not concatenate chunk text into a
prompt anywhere else, do not put it in the system message, and do not remove
the escaping because an answer "looks better" without it. The tests in
`tests/test_prompt.py` feed a hostile chunk and a hostile question; keep them.

**The model gets no tools and no side effects.** The fence lowers the odds of
indirect prompt injection; it does not remove them. What makes an injected
instruction harmless here is that the model can do nothing but return text. A
tool call, a URL fetch, or a write driven by model output is a different
design, with a human checkpoint, and `langgraph-agent` is the shape for it.

**A citation counts only if the chunk was retrieved.** `cited_ids` drops any
`[chunk:N]` the model invents. An answer with no valid citation is returned as
`not_grounded` with `answer: null`, not passed on. Do not relax this to "return
the text anyway": an uncited answer is the model speaking from its own
training, which is what this service exists not to do.

**An empty store never reaches the model.** `nothing_to_answer_from` is
returned without a generation call, and a test counts the calls. Anything a
model says with nothing retrieved is a guess.

**`EMBEDDING_DIMENSIONS` is part of the schema.** The first migration creates
`vector(1536)` from it, the OpenAI adapter asks for exactly that many
dimensions and refuses a response of any other width, and
`test_the_column_is_as_wide_as_the_vectors_the_code_makes` compares the live
column to the constant. Changing the number, or switching to an embedding
model whose vectors live in a different space, is a new migration that alters
the column plus a re-embed of every chunk. Vectors from two models are not
comparable even at the same width.

**Keep `nearest` in the shape the index serves.** `ORDER BY embedding <=> $1
LIMIT k`, cosine distance to match the `vector_cosine_ops` index. A second sort
key makes Postgres scan every row. A `WHERE` clause (per-user or per-tenant
filtering) is applied after the HNSW index picks its candidates, so it can
return fewer than `k` rows; if you add one, enable pgvector's iterative index
scans (`SET hnsw.iterative_scan = relaxed_order`) and test that `k` rows still
come back.

**Only `app/openai_provider.py` imports a provider SDK.** Routes and the store
depend on the `Embedder` and `Generator` protocols. A second provider is a
sibling file and one branch in `build_providers`. Anthropic has no embeddings
API, so switching generation to Claude still needs an embedder from somewhere
else.

**The fake is never a silent default.** `MODEL_PROVIDER` defaults to `openai`,
and `openai` without `OPENAI_API_KEY` and `OPENAI_CHAT_MODEL` refuses to start,
naming the variables. `fake` has to be chosen, and every response says
`"provider": "fake"`.

**Limits are part of the contract.** `MAX_DOCUMENT_CHARS`, `MAX_QUESTION_CHARS`
and `MAX_TITLE_CHARS` are field limits that appear in `/openapi.json`;
`MAX_BODY_BYTES` refuses a POST from its Content-Length before the body is
read; `top_k`, `max_answer_tokens` and `provider_timeout_seconds` bound what a
single question costs. Raising one is a decision about cost, not a bug fix.

**Ingest is guarded; ask is not.** `POST /documents` needs `INGEST_TOKEN`,
compared with `hmac.compare_digest`. Anyone who can write documents can plant
instructions in every future answer, so writing to the corpus is an operator
action. `/ask` is open to whoever reaches the port; put the service behind
something that authenticates callers before exposing it.

**Embed before writing.** `ingest` computes every vector before inserting
anything, so a provider failure (502) leaves no half-stored document.

**`/health` stays trivial.** It touches neither the database nor the model.

**The service does not need the role that migrates.** The migration creates
an extension, which needs a privileged role; the service only reads and
inserts rows. Compose uses one superuser because it is local. In any shared
environment, run `alembic upgrade head` as the owner and give the service a
role with `SELECT, INSERT` on `documents` and `chunks` and `USAGE` on their
sequences, so a bug that reaches SQL cannot drop or alter anything.

**Model output is untrusted text.** `answer` is whatever the model wrote,
including markup a document planted. A client renders it as text, never as
HTML, and nothing here executes or fetches anything it names.

**Migrations are Alembic, run as their own step.** The container does not
migrate on start. Write the next migration by hand as
`migrations/versions/0002_<what>.py` with `down_revision = "0001"`, in SQL
through `op.execute`, and never edit `0001` once it has run anywhere.

## Commands

```bash
docker compose up -d --wait db
export DATABASE_URL="postgresql+psycopg://rag:local-development-only@$(docker compose port db 5432)/rag"
python -m alembic upgrade head
TEST_DATABASE_URL="$DATABASE_URL" python -m pytest -q   # empties that database
INGEST_TOKEN=local-development-only-not-a-real-secret MODEL_PROVIDER=fake uvicorn app.main:app --reload
```

## When you are asked to add a field to what is stored

1. A new migration in `migrations/versions/`, never an edit to `0001`.
2. The column in `app/store.py`'s table declaration.
3. The insert in `add_document`, and the select in `nearest` if answers need it.
4. If it reaches the model, it goes inside the passage fence and through
   `_escape`, like the content.
5. A test in `tests/test_api.py` that reads it back from the database.

## When you are asked to filter what a caller can retrieve

That is authorization over documents, and this blueprint does not have it.
Decide where the caller's identity comes from first, then filter in
`nearest` with a column the migration indexes, enable iterative scans, and
write the test that one caller asks for another's document and gets nothing
from it (OWASP LLM08, API1).
