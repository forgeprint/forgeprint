# dbt + DuckDB Pipeline — agent context

A dbt Core 1.12 project on a local DuckDB file. Read this before adding a
model, a source or a test.

> This blueprint was generated from the catalog's demand research and its
> recipe runs in CI, but nobody has reviewed the steps by hand. Treat it as a
> starting point that works, not as a design somebody has shipped.

## The shape

```
data/raw_*.csv                raw files, read in place — the stand-in for a warehouse's raw tables
seeds/order_statuses.csv      a small lookup the business owns, loaded by dbt
models/staging/_sources.yml   where raw data enters, and the tests on it
models/staging/stg_*.sql      one view per source table: cast and rename, nothing else
models/marts/customer_orders  the table people read; its columns are a contract
models/marts/_unit_tests.yml  the mart's logic, on rows written by hand
tests/*.sql                   singular tests: a query that returns the rows that are wrong
tests/generic/whole_number    a generic test of our own, for raw text staging will cast
profiles.yml                  in the project, DuckDB only, no credentials
```

Lineage: `raw.customers`, `raw.orders` → `stg_customers`, `stg_orders` →
`customer_orders` ← `order_statuses`.

## Commands

Run from the project root, with `.venv` active and `DBT_PROFILES_DIR=.` set.
The DuckDB path in `profiles.yml` and the CSV paths in `_sources.yml` are
relative to the directory dbt runs from; run it from anywhere else and it
creates an empty database there and cannot find the files.

- `dbt build` — the proof. Seed, models, data tests, unit test and singular
  test, in dependency order; a failing test skips everything downstream.
- `dbt build --select +customer_orders` — one model and what it depends on.
- `sqlfluff lint models tests` — must pass before a commit; CI runs it first.
- `sqlfluff fix models tests` — then read the diff, do not trust it blind.
- `dbt docs generate` — writes `target/index.html` and `catalog.json`. The
  recipe does not serve them.

## Rules that are not style preferences

**Raw data enters through a source, never through `ref()` to a seed or a
hard-coded path in a model.** The source is the only file that knows where
raw data lives. On DuckDB that is `external_location`, with the directory from
`DBT_RAW_DIR` (default `data/`); on a warehouse it is a database and schema.
Keep it in one place and switching adapters is a `_sources.yml` edit instead
of a search through every model.

**DuckDB loads no extension it was not told to.** `autoinstall_known_extensions`
and `autoload_known_extensions` are off in `profiles.yml`. With them on, a
query that reads an `https://` or `s3://` path makes DuckDB download `httpfs`
from its own extension server, unpinned, in the middle of a build. If the
project needs an extension, list it under `extensions:` in the profile, where
a reviewer sees it — it is still fetched from that server on first use, which
is the trade-off to record when you add it.

**Seeds are for lookups the business owns, not for raw data.** A seed is
reloaded in full on every `dbt build` and lives in version control. A
thousand rows of reference data is a seed; a daily extract is a source.

**Staging only casts and renames.** One staging model per source table, no
joins, no filters, no business rules. A rule in staging is invisible to
everyone reading the mart, and applied before anything can test the raw
value it replaced. Casting is the point: the source reads every column as
text (`all_varchar = true`), so the casts in staging are the only type
decisions in the project.

**Test raw text before staging casts it.** DuckDB casts `'1850.5'` to an
integer by rounding it — to `1851`, with no error — and a declared column
type in `read_csv` rounds the same way. A malformed date fails loudly; a
fractional number does not. So every raw column that staging casts to an
integer carries the `whole_number` test on the source, and a half-cent in
the file fails the build before anything is built from it. A new integer
column gets the same test; a new decimal column gets a test that says how
many places it may have.

**Money is integer cents until the last possible moment.** `amount_cents` is
`bigint` from staging to the mart. A float sum of prices is wrong in the
second decimal place, and a decimal with the wrong scale is wrong silently.

**The mart has an enforced contract. Change the YAML in the same commit as
the SQL.** `contract: enforced: true` makes dbt compare the model's column
names and types with `_marts.yml` before building, and refuse on any
difference. It already caught one: DuckDB widens `sum(bigint)` to `hugeint`,
which is why `lifetime_value_cents` carries an explicit `cast`. A consumer
reading this table gets the types the YAML promises or no table at all.

**Every model has tests in YAML beside it.** At minimum `unique` and
`not_null` on the key. A foreign key gets `relationships`. A column with a
closed set of values gets `accepted_values`. Tests go under `data_tests:` —
`tests:` is the older name — and their parameters go under `arguments:`.
Without it dbt 1.12 still runs the test and prints
`MissingArgumentsPropertyInGenericTestDeprecation`, and a warning nobody reads
is how a deprecation becomes a broken upgrade.

**A status the seed does not know must fail the build.** The mart decides
revenue by joining `stg_orders` to `order_statuses`. An order with a new
status would join to nothing and count as zero revenue, and every total would
still look plausible. The `relationships` test from `stg_orders.status` to the
seed is what turns that into a failure — and the setup proves it, by building
from a copy of the data with a `lost` order in it and requiring that build to
fail and the mart to be skipped. It does the same for a half-cent amount. Adding a status means adding a seed
row and extending `accepted_values`, in the same commit.

**Logic gets a unit test; data gets a data test.** A data test checks what is
in the table today. A unit test checks what the SQL does with rows you wrote,
including the rows today's data does not have — a customer with no orders, an
order that was returned. `_unit_tests.yml` is where the mart's rules are
written down as examples. Change the rule, change the example.

**A singular test returns the rows that are wrong.** Zero rows is a pass.
`assert_revenue_reconciles.sql` compares the mart's total with staging's; a
join that drops or duplicates an order changes the total and fails it.

**No dbt packages.** There is no `packages.yml`, so `dbt deps` has nothing to
do and nothing is fetched from outside PyPI. `dbt_utils` and friends are
installed from hub.getdbt.com or from git, neither of which is a package
registry this recipe may reach. Add one deliberately, pinned to an exact
version, and commit `package-lock.yml`.

**Usage statistics are off in `dbt_project.yml`, and stay off.** dbt Core
sends anonymous usage events by default and keeps an id for them in
`.user.yml`. `flags: send_anonymous_usage_stats: false` turns that off for
everyone who runs the project; `DO_NOT_TRACK=1` in the environment does the
same for one machine.

**`profiles.yml` holds no secret, and must never hold one.** It is committed
because DuckDB needs no credentials. A warehouse profile does: put it in the
same file with every credential read through `env_var('...')` and no default,
so a missing variable fails loudly instead of connecting as somebody else.

## When you are asked to add a model

1. If it reads new raw data, add the table to `_sources.yml` with `unique` and
   `not_null` on its key, and `whole_number` on every column staging will cast
   to an integer.
2. Add a `stg_<table>.sql` that casts every column and renames it, and its
   entry in `_staging.yml` with tests.
3. Put joins and rules in a mart under `models/marts/`. Declare every column
   with its `data_type` in the YAML and set `contract: enforced: true`, as
   `customer_orders` does.
4. If the model encodes a rule, add a unit test with a row that exercises the
   rule's edge — not only the rows that happen to exist.
5. `sqlfluff lint models tests`, then `dbt build`. Both green before a commit.

## When you are asked to move to a warehouse

Not implemented here, on purpose; `overview.md` says what changes. In short:
install the adapter at a pinned version, add a target to `profiles.yml` with
credentials from `env_var()`, replace `external_location` in `_sources.yml`
with the real database and schema, and expect SQL that leans on DuckDB (the
`filter` clause, `read_csv`, `regexp_full_match` in `whole_number`) to need a
rewrite for the target dialect — `sqlfluff`'s `dialect` changes with it. Raw
tables in a warehouse are usually typed already; keep `whole_number` only on
columns that still arrive as text.
