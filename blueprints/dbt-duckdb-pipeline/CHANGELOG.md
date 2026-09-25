# Changelog — dbt-duckdb-pipeline

## 1.0.0 — 2026-09-25

First version, and the catalog's first blueprint written in SQL.

A dbt Core project on a local DuckDB file: raw CSV files read in place as
sources, a seed for a lookup the business owns, staging views that only cast
and rename, and a mart with an enforced contract. Tested with `unique`,
`not_null`, `relationships` and `accepted_values`, a singular test that
reconciles the mart's revenue against staging, and a unit test on the mart's
logic. Linted with sqlfluff. Proved by `dbt build`, with `dbt docs generate`
as a second check. No warehouse, no account.

**Drafted by a tool** from the
[2026-09-24 expansion plan](../../docs/research/2026-09-24-expansion-plan.md),
where `dbt-core` showed 5.2M downloads a week on PyPI and the research marked
it CI-testable with the DuckDB adapter. Its recipe runs in CI like every other
and nobody has run a pipeline on it by hand, so it is `tier: community` and
`provenance: generated`, and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)).

Versions, each read from PyPI on 2026-09-25: `dbt-core` 1.12.5, `dbt-duckdb`
1.11.0, `duckdb` 1.5.5, `sqlfluff` 4.3.0. Actions pinned by commit SHA:
`actions/checkout` v7.0.1, `actions/setup-python` v7.0.0, both the latest
release on that date.

Decisions:

- **dbt Core 1.x, not dbt 2.0.** 2.0 is a Rust rewrite shipped as a binary
  outside PyPI; `dbt-duckdb` is a 1.x adapter. `require-dbt-version` refuses
  2.0 so an upgrade is a decision rather than an accident.
- **Raw data is a source with `external_location`, not a seed.** It is the
  one place that changes when the project moves to a warehouse.
- **sqlfluff on the jinja templater**, so linting needs no profile and no
  connection. The dbt templater (`sqlfluff-templater-dbt`) would be exact and
  needs a working profile, which on a warehouse means credentials in the lint
  job.
- **Usage statistics off** with `flags: send_anonymous_usage_stats: false` in
  `dbt_project.yml`. The last step checks that no `.user.yml` was written.
- **No dbt packages**, so nothing is fetched from hub.getdbt.com or git.
- **DuckDB's automatic extension install and load are off** in the profile,
  so a query can never make DuckDB download code from its extension server in
  the middle of a build; an extension is listed on purpose or not used.
- **Raw files are read as text** (`all_varchar = true`), so staging's casts
  are the only type decisions, and a generic test of the project's own,
  `whole_number`, checks the raw text of every column staging casts to an
  integer.
- **The setup proves the tests can fail, twice.** It copies the raw files into
  `target/`, adds one bad row — an unknown status in one copy, a half-cent
  amount in the other — builds into a separate database, and requires a
  non-zero exit, the right failed test and a skipped mart. `DBT_RAW_DIR` on
  the source is what makes that possible without touching the real files.

Found by running it:

- The enforced contract refused the mart on the first build: DuckDB returns
  `hugeint` for `sum(bigint)`. The model casts explicitly, and the comment
  beside the cast says why.
- sqlfluff's `structure.column_order` rule counts `cast(...)` as a simple
  target and a function around it as a calculation, so the cast is outermost
  in `stg_orders` and innermost in the mart.
- DuckDB casts the text `1850.5` to the integer `1851` without an error —
  whether the cast is in the model, the type is declared in `read_csv`, or
  the reader infers it. The only reliable guard found was a test on the raw
  text, which is why `whole_number` exists.
- `python -m dbt.cli.main` works and prints a `runpy` warning on every call;
  the recipe records the `dbt` executable once instead.
- Generic test parameters sit under `arguments:`. Without it dbt 1.12 still
  runs the test and prints `MissingArgumentsPropertyInGenericTestDeprecation`.

Verified: the full recipe, all 40 steps, with `forgeprint test-setup` on
Windows (Git Bash, Python 3.14); then the project it produced — install,
`sqlfluff lint`, `dbt build` (28 of 28) and `dbt docs generate` — in a
`python:3.13-slim` container, the Python CI uses. Neither run wrote anything to
the home directory. macOS was not run.
