# Python RAG Service

A FastAPI service that answers questions from the documents it has been given,
and only from them. Ingest splits text into chunks by a stated rule and stores
each chunk with its embedding in PostgreSQL with pgvector. Ask embeds the
question, retrieves the closest chunks through an HNSW index, and has a model
answer from them, citing the chunks it used. Tests and setup checks run the
whole path against a real pgvector database and a deterministic fake model, so
nothing needs a key.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run it against a real model
provider, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- `POST /documents` (ingest, guarded by an operator token) and `POST /ask`
  (retrieve, then generate), plus `/health` and the OpenAPI document at
  `/docs` and `/openapi.json`.
- A chunking rule stated in one module and tested word by word: at most 200
  words per chunk, 40 words of overlap, and any word over 32 characters cut, so
  a document without spaces cannot become one chunk of any size.
- An Alembic migration that creates the `vector` extension, `documents`,
  `chunks` with a `vector(1536)` column, and an HNSW index with cosine
  operators. The width is one named constant, `EMBEDDING_DIMENSIONS`, and a
  test compares it with the live column.
- A prompt that fences every retrieved chunk in `<passage id="N">`, escapes
  angle brackets so a chunk cannot close its fence, and a system instruction
  that says passage text is data and never an instruction.
- Citations checked against what was retrieved. An invented chunk id is
  dropped; an answer that cites nothing it was shown comes back as
  `not_grounded` with no answer text. An empty store comes back as
  `nothing_to_answer_from` without calling the model at all.
- Limits on document, title and question length (in the OpenAPI schema), a
  body-size check from Content-Length before anything is parsed, a bounded
  `top_k`, a bounded answer length and a provider timeout.
- An OpenAI adapter (`openai` 3.19.2) for embeddings and generation, used only
  when `MODEL_PROVIDER=openai` with `OPENAI_API_KEY` and `OPENAI_CHAT_MODEL`
  set. Without them the service refuses to start and names what is missing.
  The adapter asks the provider not to store requests.
- A non-root container image, a Compose file for pgvector and the service on
  loopback ports the operating system chooses, and a CI workflow that runs
  the migration and the tests against a pgvector service container.

## Options

None. The database is the point of the blueprint, and the provider is a file,
not an option: a second one is a sibling of `app/openai_provider.py`.

## What it fits

- Question answering over a document set one team controls: internal
  handbooks, product documentation, runbooks.
- A team that already runs PostgreSQL and would rather add an extension than
  operate a separate vector database.
- A RAG service that has to be tested in CI without a model key: the fake
  embedder is deterministic enough that "the most similar chunk comes first"
  is a real assertion against pgvector.
- Anyone who needs the injection-and-grounding decisions made visibly, in code
  and tests, rather than left to the prompt.

## What it is NOT for

- **Per-user or multi-tenant documents.** Every caller of `/ask` retrieves from
  every document. There is no ownership column and no filter. Adding one is
  authorization over documents, and the vector index needs iterative scans to
  filter without returning short; `AGENTS.md` says how.
- **User authentication.** One shared operator token guards ingest; `/ask` is
  open to whoever reaches the port. There are no users, sessions or roles. Put
  it behind something that authenticates callers, or start from
  `fastapi-service`, which verifies bearer tokens.
- **Full-text or hybrid search.** Retrieval is vector similarity only. There is
  no `tsvector` column and no keyword matching, so an exact product code or an
  error string can rank below a paraphrase. The manifest's `search` tag means
  this semantic search; the catalog has no narrower term for it.
- **Reranking, query rewriting, or a relevance threshold.** The top `k` chunks
  by cosine distance go to the model, however far away they are. The model is
  told to say it cannot answer, and an uncited answer is withheld, but nothing
  scores relevance before generation.
- **Agents and tools.** There is no loop and no tool call: one retrieval, one
  generation. For an agent that acts, use `langgraph-agent`.
- **PDFs, HTML, or files.** Ingest takes plain text in JSON. Extraction from
  other formats is left to the caller.
- **Rate limiting or spend tracking.** Each request is bounded; how many
  requests arrive is not. Put a rate limit in front before exposing `/ask`.
- **Deleting or updating documents.** There is no endpoint for either. The
  foreign key cascades, so deletion is one statement when you add it.

## Trade-offs made on your behalf

- **pgvector rather than a dedicated vector database.** One database to back
  up, migrate and secure, and transactions that cover the document and its
  chunks together. A dedicated store scales further and filters better at
  tens of millions of vectors; this is not built for that size.
- **HNSW rather than IVFFlat.** IVFFlat learns its lists from the rows present
  when the index is built, and the migration builds it on an empty table, so
  its recall would be poor until somebody rebuilt it. HNSW has no training
  step and better recall at the same speed, at the cost of a slower build and
  more memory.
- **Cosine distance, 1536 dimensions.** Matches `text-embedding-3-small` at its
  native width. HNSW in pgvector indexes `vector` up to 2000 dimensions, so a
  wider model needs `halfvec` or a reduced `dimensions` request.
- **Words, not tokens, for chunking.** No tokenizer to install or keep in step
  with the model. The price is that 200 words is only approximately a number
  of tokens.
- **Synchronous SQLAlchemy and psycopg 3.** Every route is a plain `def`, run
  in FastAPI's thread pool, so a blocking provider call cannot stall the event
  loop. The cost is a thread per in-flight request.
- **Withholding uncited answers.** Some correct answers will come back as
  `not_grounded` because the model forgot a citation. That is chosen over
  passing on answers that cannot be traced to a document.
- **No default chat model.** Which model to pay for is yours to decide, and a
  default model name would go stale in the recipe.
- **The fake is chosen explicitly.** The default provider is the real one, and
  it refuses to start without a key rather than falling back to answers that
  look real and are not.

## Pros

- The two claims that matter, retrieval order and grounded citations, are
  tested against a real pgvector index, not a mock of it.
- A hostile chunk and a hostile question are tested against the fence.
- A provider failure is a 502 with a generic message, and a test proves nothing
  was stored.
- The provider boundary is one file, and the tests drive the real adapter with
  a stub client, so what it asks the provider for is checked without a key.

## Cons

- **Nobody has run it against a real provider.** The OpenAI adapter is tested
  against a stub of the client; the real API's behaviour, latency and cost are
  not.
- **The fake proves the plumbing, not answer quality.** Hashed bag-of-words
  vectors make retrieval order testable; they say nothing about how well a
  real embedding model retrieves.
- **The fence is a mitigation.** A capable enough injection can still change
  what the model writes. What it cannot do is act, because the model has no
  tools, and what it writes is withheld unless it cites retrieved chunks.
- **The ingest token is shared.** It is one secret with no rotation story and
  no per-writer audit.

## Compared with the alternatives here

- **`fastapi-service`** — the same framework and database, as a general API
  with bearer token verification and no retrieval or generation. Start there
  for an API that is not question answering; start here when retrieval and
  generation are the product.
- **`langgraph-agent`** — an agent that loops and calls a tool. This has no
  loop and no tools: one retrieval, one generation, and the model can only
  return text. Choose that one when the model has to act, this one when it
  has to answer from documents.
- **`python-mcp-server`** — exposes tools to somebody else's agent. A RAG
  service can sit behind one, but that is a second project.

## Cost of adoption

About half an hour with Python 3.13, Docker with Compose and `curl` installed.
Real answers additionally need an OpenAI API key, which is a paid account and
the only part of this that costs money.
