# dbt + DuckDB Pipeline

A dbt Core project that runs entirely on a local DuckDB file: two raw CSV
files read in place as sources, one seed, two staging views and one mart
table with an enforced contract. It is tested four ways — generic data tests,
a singular reconciliation test, a unit test and the contract itself — linted
with sqlfluff, and proved by `dbt build` with no warehouse and no account, and
by two builds on broken data that must fail.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has run a production pipeline on
it first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- `dbt-core` 1.12.5 with `dbt-duckdb` 1.11.0 on `duckdb` 1.5.5, pinned in
  `requirements.txt`; `sqlfluff` 4.3.0 in `requirements-dev.txt`.
- `profiles.yml` in the project, pointing at `pipeline.duckdb` relative to the
  project root (or wherever `DBT_DUCKDB_PATH` says). Nothing is read from or
  written to `~/.dbt`.
- Sources declared in YAML and read as text, with `unique` and `not_null` on
  their keys and a generic test of the project's own, `whole_number`, on every
  column staging casts to an integer; staging that only casts and renames; a
  mart with `contract: enforced: true`.
- `unique`, `not_null`, `relationships` and `accepted_values` data tests; one
  singular test that reconciles the mart's revenue with staging; one unit test
  on the mart's logic, including the rows today's data does not contain.
- Two deliberately broken builds in the setup — an order with a status the
  seed does not know, and an amount of half a cent — each of which must fail
  on the right test with the mart left unbuilt. A suite that has never been
  seen to fail has not been tested.
- `sqlfluff` on the jinja templater, so linting needs no connection.
- Anonymous usage statistics off in `dbt_project.yml`, for every command and
  every machine; DuckDB's automatic extension downloads off in `profiles.yml`.
- A GitHub Actions workflow — actions pinned by commit SHA, read-only token,
  no persisted credentials — that lints, builds and generates the docs.

## Options

None. The blueprint is one adapter on one engine; a second adapter is a
different project, not a flag (see below).

## What it fits

- **Learning dbt.** Every concept a real project uses — source, seed, staging,
  mart, `ref()`, generic and singular tests, unit tests, contracts, docs — in
  a project that builds in seconds on a laptop with nothing to sign up for.
- **Local analytics.** CSV or Parquet files on disk, a question to answer, and
  a wish for the answer to be tested and reproducible rather than a notebook
  cell. DuckDB reads the files where they are.
- **CI-testable transformations.** Logic whose correctness matters and should
  be proved on every pull request against fixed inputs, without a warehouse
  bill or a credential in CI.
- **A prototype that will move to a warehouse.** The structure, the tests and
  most of the SQL carry over; see "Moving to a warehouse".

## What it is NOT for

- **A production warehouse.** Snowflake, BigQuery, Redshift, Databricks and
  Postgres each need their own adapter, a profile with real credentials, and
  usually an account. Not implemented here — deliberately, because no one of
  them can be tested in CI without the account this blueprint promises you do
  not need.
- **Orchestration.** No scheduler, no Airflow, Dagster or cron. `dbt build`
  runs when somebody runs it.
- **Ingestion.** The raw files are assumed to arrive. Getting them from an API
  or a database is a different tool's job.
- **Concurrent writers.** A DuckDB file has one writer at a time. Two `dbt
build`s against the same file, or a BI tool holding it open read-write, will
  fail. For shared access, use a warehouse or a read-only copy.
- **Python models or Python in general.** The project is SQL and YAML. dbt
  Python models run on DuckDB, but nothing here uses or tests them.
- **dbt packages.** No `dbt_utils`, no `dbt_expectations`. Packages come from
  hub.getdbt.com or git; add them deliberately and pin them.
- **dbt 2.0.** See "Which dbt this is".
- **A web service.** For an API over data, `fastapi-service`; for work that
  must happen outside a request, `python-background-worker`.

## Which dbt this is

dbt Labs publishes two engines. **dbt Core 1.x** is the Python implementation,
Apache-2.0, installed from PyPI as `dbt-core`, now maintained on the
`1.latest` branch; 1.12.5 was released on 2026-09-15. **dbt 2.0** is a
ground-up rewrite in Rust, released on GitHub from 2026-09-14 and distributed
as a self-contained binary; PyPI's `dbt-core` carries only 2.0 pre-releases,
so `pip` still resolves 1.12.5. Its source is Apache-2.0, and dbt Labs'
distribution of it carries a separate dbt product license.

This blueprint uses dbt Core 1.12.5, and `dbt_project.yml` refuses anything
from 2.0 on (`require-dbt-version: ['>=1.12.0', '<2.0.0']`). Three reasons:
`dbt-duckdb` is a 1.x Python adapter; everything installs from PyPI, which is
the only network a recipe here may use; and 2.0 is stricter at parse time, so
moving to it is a change to review on its own rather than a version bump.
Whether 2.0 runs this project on DuckDB has not been checked.

## Moving to a warehouse

Described, not implemented:

1. Install the warehouse's adapter at a pinned version next to `dbt-core`.
2. Add a target to `profiles.yml` whose every credential comes from
   `env_var('...')` with no default, and keep secrets out of the file.
3. In `_sources.yml`, replace `external_location` with the `database` and
   `schema` the raw tables live in. Nothing downstream of the source changes.
4. Change `dialect` in `.sqlfluff`, run `sqlfluff lint`, and rewrite what
   leans on DuckDB: the `filter (where …)` clause, `regexp_full_match` in the
   `whole_number` test, and `read_csv` if it survives anywhere.
5. Run the unit test and the data tests against the new target. The contract
   will name any type the new warehouse returns differently.

## Pros

- **Four kinds of test, each proving something different.** Data tests check
  today's rows; the unit test checks the logic on rows written by hand,
  including a customer with no orders and an order that does not count; the
  singular test reconciles the mart against staging so a join that drops or
  duplicates an order fails; the contract checks the types.
- **The contract already earned its place.** DuckDB widens `sum(bigint)` to
  `hugeint`; the contract refused the table until the cast was explicit. That
  is exactly the silent type drift a consumer would otherwise find.
- **Raw data enters in one file.** `_sources.yml` is the only place that knows
  the data is CSV on disk, which is what makes the warehouse move small.
- **The tests are seen to fail.** The setup builds once from good data and
  twice from copies with one bad row each, and requires both of those builds
  to fail on the right test with the mart skipped.
- **A half-cent cannot slip through.** DuckDB rounds `'1850.5'` to `1851` when
  casting to an integer, even with the column type declared in `read_csv`. The
  source is read as text and tested as text, so the file's value is checked
  before anything can round it.
- **Nothing leaves the project.** Profile in the project, database in the
  project, usage statistics off, no packages, no `~/.dbt`, and no DuckDB
  extension fetched at run time behind your back.
- **Linting works offline and survives an adapter change,** because the jinja
  templater needs no connection.
- **Fast.** The whole build is under a second after the install.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **Toy data.** Five customers and eight orders, invented. The shape is the
  point; the numbers are not.
- **The jinja templater is an approximation.** It renders `ref()` and
  `source()` from stand-ins rather than from the real project, so a macro or
  a `var()` the stand-ins do not know is linted as a guess. The dbt templater
  is exact and needs a working profile; for a warehouse, that means
  credentials in the lint job.
- **DuckDB SQL is not portable SQL.** `filter (where …)` and `read_csv` are
  convenient and specific; see "Moving to a warehouse".
- **Paths are relative to where dbt runs.** Run it from anywhere but the
  project root and it creates an empty database there and cannot find the
  files. `AGENTS.md` says so; nothing enforces it.
- **Reading remote files takes a deliberate step.** With automatic extensions
  off, `read_csv('https://…')` or an `s3://` path fails until `httpfs` is
  listed under `extensions:` in the profile. That is the point, and it is also
  friction.
- **No incremental models, snapshots or exposures.** Every build is a full
  rebuild, which is right at this size and wrong at a warehouse's.

## What CI cannot prove

- That the SQL is correct on data other than the committed sample. The unit
  test pins the rules; it cannot pin rules nobody wrote down.
- That the project runs on any warehouse, or on dbt 2.0.
- That `dbt docs serve` works or looks right — the docs are generated, not
  served or opened.
- Behaviour on a large file: memory, spilling to disk, or a second process
  holding the database open.
- macOS. The recipe runs on Linux in CI and was run on Windows while writing
  it; macOS is listed because nothing in it is platform-specific, not because
  it was run there.

## Cost of adoption

Python 3.13 or newer. The install is about eighty packages from PyPI into
a virtual environment — a minute or two — and the build takes seconds. No
account, no service, no container.

## Compared with the alternatives here

`python-background-worker` is the other `data` blueprint, and it is a
different kind of thing: a Celery worker that runs Python jobs off a queue.
This one transforms tables with SQL and tests the result. They combine
naturally — a worker that lands files, and a dbt project that models them —
but neither replaces the other.
