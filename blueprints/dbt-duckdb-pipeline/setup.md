# Setup

Creates a dbt Core project that runs on a local DuckDB file: two raw CSV files
read in place as sources, one seed, two staging views and one mart table with
an enforced contract, tested with generic data tests, a singular test and a
unit test, linted with sqlfluff, and proved by `dbt build` — then by two more
builds, on deliberately broken copies of the data, that have to fail.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.13 or newer. Nothing is installed outside the project's
virtual environment, nothing is written to your home directory, and nothing
needs an account: the only network the recipe uses is PyPI.

Every dbt command is prefixed with `DBT_PROFILES_DIR=.`, so the `profiles.yml`
in the project is the only one dbt reads — never one in `~/.dbt` left over from
another project.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   dbt-core==1.12.5
   dbt-duckdb==1.11.0
   duckdb==1.5.5
   ```

   Verify: `test -f requirements.txt`

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   sqlfluff==4.3.0
   ```

   Verify: `test -f requirements-dev.txt`

5. Install the pinned dependencies into the virtual environment: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import duckdb, dbt.adapters.duckdb, sqlfluff; assert duckdb.__version__ == '1.5.5'"`

6. Record where the install put the `dbt` executable, for the same reason as step 2: `if test -x ./.venv/bin/dbt; then echo ./.venv/bin/dbt > dbt.path; else echo ./.venv/Scripts/dbt.exe > dbt.path; fi`
   Verify: `test -x "$(cat dbt.path)"`

7. Create `dbt_project.yml` with:

   ```yaml
   name: pipeline
   version: '1.0.0'
   profile: pipeline
   # dbt 2.0 is a different engine (see overview.md); this project is dbt Core 1.x.
   require-dbt-version: ['>=1.12.0', '<2.0.0']

   model-paths: ['models']
   seed-paths: ['seeds']
   test-paths: ['tests']
   clean-targets: ['target', 'dbt_packages', 'logs']

   flags:
     # dbt Core sends anonymous usage events by default, and writes an id for
     # them to .user.yml beside profiles.yml. Off here, for every command,
     # because it is a project setting rather than something each machine has
     # to remember.
     send_anonymous_usage_stats: false

   models:
     pipeline:
       staging:
         +materialized: view
       marts:
         +materialized: table
   ```

   Verify: `grep -q "send_anonymous_usage_stats: false" dbt_project.yml`

8. Create `profiles.yml` with:

   ```yaml
   # In the project, not in ~/.dbt: DuckDB needs no credentials, so there is
   # nothing here that should not be committed. A warehouse profile is
   # different; see AGENTS.md before adding one.
   pipeline:
     target: dev
     outputs:
       dev:
         type: duckdb
         # Relative to the directory dbt runs from, which is the project root.
         path: "{{ env_var('DBT_DUCKDB_PATH', 'pipeline.duckdb') }}"
         threads: 4
         settings:
           # DuckDB downloads and loads a known extension the first time a
           # query needs one — httpfs for an https or s3 path — from its own
           # extension server, unpinned, at run time. Off: an extension this
           # project needs is added on purpose, under `extensions:`.
           autoinstall_known_extensions: false
           autoload_known_extensions: false
   ```

   Verify: `DBT_PROFILES_DIR=. "$(cat dbt.path)" debug --connection`

9. Create `data/raw_customers.csv` with:

   ```text
   id,name,signed_up_on
   1,Ada,2026-01-04
   2,Brook,2026-01-19
   3,Cyrus,2026-02-02
   4,Dana,2026-02-17
   5,Emil,2026-03-08
   ```

   Verify: `test -f data/raw_customers.csv`

10. Create `data/raw_orders.csv` with:

```text
id,customer_id,ordered_on,status,amount_cents
101,1,2026-02-01,completed,4200
102,1,2026-02-20,completed,1850
103,2,2026-02-21,returned,9900
104,2,2026-03-02,completed,2500
105,3,2026-03-05,cancelled,1200
106,3,2026-03-09,placed,3100
107,4,2026-03-11,shipped,750
108,1,2026-03-14,completed,600
```

Verify: `test -f data/raw_orders.csv`

11. Create `seeds/order_statuses.csv` with:

    ```text
    status,is_revenue,description
    placed,false,Accepted and not yet shipped
    shipped,false,On its way and still returnable
    completed,true,Delivered and past the return window
    returned,false,Sent back and refunded
    cancelled,false,Cancelled before it shipped
    ```

    Verify: `test -f seeds/order_statuses.csv`

12. Create `seeds/_seeds.yml` with:

    ```yaml
    seeds:
      - name: order_statuses
        description: >
          Every order status the business uses, and whether it counts as
          revenue. A lookup that changes when the business does, which is what
          a seed is for; raw data is a source, not a seed.
        config:
          # Declared rather than inferred, so a column of "true"/"false" cannot
          # become text because one row was mistyped.
          column_types:
            status: varchar
            is_revenue: boolean
            description: varchar
        columns:
          - name: status
            data_tests:
              - unique
              - not_null
          - name: is_revenue
            data_tests:
              - not_null
    ```

    Verify: `test -f seeds/_seeds.yml`

13. Create `models/staging/_sources.yml` with:

    ```yaml
    sources:
      - name: raw
        description: >
          Files as they land, read in place by DuckDB. On a warehouse these are
          tables somebody else loads; replace external_location with the
          database and schema they live in, and nothing downstream changes.
        config:
          meta:
            # DBT_RAW_DIR says where the files landed; data/ by default.
            # all_varchar: every column arrives as text. The reader guesses no
            # types, so staging's casts are the only type decisions, and the
            # tests below see exactly what was in the file.
            external_location: "read_csv('{{ env_var('DBT_RAW_DIR', 'data') }}/raw_{name}.csv', header = true, all_varchar = true)"
        tables:
          - name: customers
            columns:
              - name: id
                data_tests:
                  - unique
                  - not_null
                  - whole_number
          - name: orders
            columns:
              - name: id
                data_tests:
                  - unique
                  - not_null
                  - whole_number
              - name: customer_id
                data_tests:
                  - whole_number
              - name: amount_cents
                data_tests:
                  - whole_number
    ```

    Verify: `test -f models/staging/_sources.yml`

14. Create `models/staging/stg_customers.sql` with:

    ```sql
    select
        cast(id as integer) as customer_id,
        cast(name as varchar) as customer_name,
        cast(signed_up_on as date) as signed_up_on
    from {{ source('raw', 'customers') }}
    ```

    Verify: `test -f models/staging/stg_customers.sql`

15. Create `models/staging/stg_orders.sql` with:

    ```sql
    select
        cast(id as integer) as order_id,
        cast(customer_id as integer) as customer_id,
        cast(ordered_on as date) as ordered_on,
        cast(lower(trim(status)) as varchar) as status,
        cast(amount_cents as bigint) as amount_cents
    from {{ source('raw', 'orders') }}
    ```

    Verify: `test -f models/staging/stg_orders.sql`

16. Create `models/staging/_staging.yml` with:

    ```yaml
    models:
      - name: stg_customers
        description: One row per customer, typed and renamed. Nothing else.
        columns:
          - name: customer_id
            data_tests:
              - unique
              - not_null
      - name: stg_orders
        description: One row per order, typed and renamed. Amounts stay in integer cents.
        columns:
          - name: order_id
            data_tests:
              - unique
              - not_null
          - name: customer_id
            data_tests:
              - not_null
              - relationships:
                  arguments:
                    to: ref('stg_customers')
                    field: customer_id
          - name: status
            data_tests:
              - accepted_values:
                  arguments:
                    values: ['placed', 'shipped', 'completed', 'returned', 'cancelled']
              # The mart decides revenue by joining to the seed. A status the
              # seed does not know would count as nothing, silently; this makes
              # it a failed build instead.
              - relationships:
                  arguments:
                    to: ref('order_statuses')
                    field: status
          - name: amount_cents
            data_tests:
              - not_null
    ```

    Verify: `test -f models/staging/_staging.yml`

17. Create `models/marts/customer_orders.sql` with:

    ```sql
    with order_totals as (
        select
            orders.customer_id,
            min(orders.ordered_on) as first_ordered_on,
            count(*) as order_count,
            count(*) filter (where statuses.is_revenue) as revenue_order_count,
            sum(orders.amount_cents) filter (
                where statuses.is_revenue
            ) as lifetime_value_cents
        from {{ ref('stg_orders') }} as orders
        left join {{ ref('order_statuses') }} as statuses
            on orders.status = statuses.status
        group by orders.customer_id
    )

    select
        customers.customer_id,
        customers.customer_name,
        order_totals.first_ordered_on,
        coalesce(order_totals.order_count, 0) as order_count,
        coalesce(order_totals.revenue_order_count, 0) as revenue_order_count,
        -- DuckDB widens sum(bigint) to hugeint; the contract below refuses that.
        coalesce(cast(order_totals.lifetime_value_cents as bigint), 0) as lifetime_value_cents
    from {{ ref('stg_customers') }} as customers
    left join order_totals
        on customers.customer_id = order_totals.customer_id
    ```

    Verify: `test -f models/marts/customer_orders.sql`

18. Create `models/marts/_marts.yml` with:

    ```yaml
    models:
      - name: customer_orders
        description: >
          One row per customer, including customers who have never ordered, with
          what they ordered and what counted as revenue. The table other people
          read, so its columns and types are a contract.
        config:
          contract:
            enforced: true
        columns:
          - name: customer_id
            data_type: integer
            constraints:
              - type: not_null
            data_tests:
              - unique
              - not_null
          - name: customer_name
            data_type: varchar
          - name: first_ordered_on
            data_type: date
            description: Null for a customer who has never ordered.
          - name: order_count
            data_type: bigint
          - name: revenue_order_count
            data_type: bigint
          - name: lifetime_value_cents
            data_type: bigint
            description: Sum of the orders whose status counts as revenue, in cents. Zero, never null.
    ```

    Verify: `test -f models/marts/_marts.yml`

19. Create `models/marts/_unit_tests.yml` with:

    ```yaml
    # A unit test runs the model's SQL against the rows below instead of the
    # real inputs, before the model is built. The data tests say the output is
    # well-formed; this says the logic is right on the two cases that matter:
    # a non-revenue order is counted but not summed, and a customer with no
    # orders is kept with zeros rather than dropped or left null.
    unit_tests:
      - name: counts_only_revenue_and_keeps_customers_without_orders
        model: customer_orders
        given:
          - input: ref('stg_customers')
            format: csv
            rows: |
              customer_id,customer_name
              1,A
              2,B
          - input: ref('stg_orders')
            format: csv
            rows: |
              order_id,customer_id,ordered_on,status,amount_cents
              10,1,2026-01-01,completed,500
              11,1,2026-01-02,returned,900
          - input: ref('order_statuses')
            format: csv
            rows: |
              status,is_revenue
              completed,true
              returned,false
        # Only the columns that carry the rule; the others are not compared.
        expect:
          format: csv
          rows: |
            customer_id,order_count,revenue_order_count,lifetime_value_cents
            1,2,1,500
            2,0,0,0
    ```

    Verify: `test -f models/marts/_unit_tests.yml`

20. Create `tests/assert_revenue_reconciles.sql` with:

    ```sql
    -- Every cent of revenue in staging is in the mart exactly once: none lost
    -- to a join, none counted twice. Returns a row only when they differ.
    with mart as (
        select sum(lifetime_value_cents) as total_cents
        from {{ ref('customer_orders') }}
    ),

    staged as (
        select coalesce(sum(orders.amount_cents), 0) as total_cents
        from {{ ref('stg_orders') }} as orders
        inner join {{ ref('order_statuses') }} as statuses
            on orders.status = statuses.status
        where statuses.is_revenue
    )

    select
        mart.total_cents as mart_cents,
        staged.total_cents as staged_cents
    from mart
    cross join staged
    where mart.total_cents != staged.total_cents
    ```

    Verify: `test -f tests/assert_revenue_reconciles.sql`

21. Create `tests/generic/whole_number.sql` with:

    ```sql
    {% test whole_number(model, column_name) %}
    -- DuckDB casts '1850.5' to an integer by rounding it, without an error, so a
    -- raw column that staging casts to an integer is checked as text first.
    select {{ column_name }}
    from {{ model }}
    where not regexp_full_match({{ column_name }}, '[0-9]+')
    {% endtest %}
    ```

    Verify: `test -f tests/generic/whole_number.sql`

22. Create `.sqlfluff` with:

    ```ini
    [sqlfluff]
    dialect = duckdb
    # The jinja templater, not the dbt one: it renders ref() and source() from
    # built-in stand-ins, so linting needs no profile, no connection and no
    # warehouse credentials, and keeps working after the adapter changes.
    templater = jinja
    max_line_length = 100

    [sqlfluff:templater:jinja]
    apply_dbt_builtins = True

    [sqlfluff:rules:capitalisation.keywords]
    capitalisation_policy = lower

    [sqlfluff:rules:capitalisation.functions]
    extended_capitalisation_policy = lower

    [sqlfluff:rules:capitalisation.literals]
    capitalisation_policy = lower

    [sqlfluff:rules:capitalisation.types]
    extended_capitalisation_policy = lower
    ```

    Verify: `test -f .sqlfluff`

23. Create `.sqlfluffignore` with:

    ```text
    .venv/
    target/
    dbt_packages/
    logs/
    ```

    Verify: `test -f .sqlfluffignore`

24. Create `.gitignore` with:

    ```text
    .venv/
    __pycache__/
    target/
    dbt_packages/
    logs/
    *.duckdb
    *.duckdb.wal
    .user.yml
    python.path
    dbt.path
    ```

    Verify: `test -f .gitignore`

25. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-latest
        timeout-minutes: 15
        env:
          # The profiles.yml in the repository, never one from a home directory.
          DBT_PROFILES_DIR: .
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          # The same file the setup installs from, so CI and a laptop cannot
          # disagree about which versions were tested.
          - run: pip install -r requirements-dev.txt
          - run: sqlfluff lint models tests
          # Seeds, models, data tests, the unit test and the singular test, in
          # dependency order. A failed test stops everything downstream of it.
          - run: dbt build
          - run: dbt docs generate
    ```

    Verify: `test -f .github/workflows/ci.yml`

26. Create `README.md` with:

    ```markdown
    # pipeline

    A dbt Core project on a local DuckDB file.

    ## Run it

    Activate `.venv`, then from this directory:

    - `dbt build` — load the seed, build every model and run every test
    - `sqlfluff lint models tests` — lint the SQL
    - `dbt docs generate` — write the documentation site to `target/`

    `profiles.yml` is in this directory; set `DBT_PROFILES_DIR=.` so dbt never
    reads one from your home directory. The database is `pipeline.duckdb`, or
    wherever `DBT_DUCKDB_PATH` points; the raw files are read from `data/`, or
    wherever `DBT_RAW_DIR` points.

    ## Add a model

    See `AGENTS.md`. The short version: raw data enters through a source,
    staging only types and renames, the mart carries a contract, and every
    model has tests in YAML beside it.
    ```

    Verify: `test -f README.md`

27. Parse the project, which reads every YAML file and resolves every `ref()` and `source()` without touching the database: `DBT_PROFILES_DIR=. "$(cat dbt.path)" parse`
    Verify: `test -f target/manifest.json`

28. Lint the SQL, and keep what it said: `"$(cat python.path)" -m sqlfluff lint models tests > lint.txt`
    Verify: `grep -q "All Finished" lint.txt`

29. Build everything — the seed, the models, and every test, in dependency order: `DBT_PROFILES_DIR=. "$(cat dbt.path)" build`
    Verify: `"$(cat python.path)" -c "import json; r = json.load(open('target/run_results.json'))['results']; assert len(r) == 28 and all(x['status'] in ('success', 'pass') for x in r), r; assert sum(x['unique_id'].startswith('unit_test.') for x in r) == 1"`

30. Read the mart back from the database file, the way a consumer would, and keep what it holds: `"$(cat python.path)" -c "import duckdb; con = duckdb.connect('pipeline.duckdb', read_only=True); print(con.sql('select customer_id, lifetime_value_cents from customer_orders order by customer_id').fetchall())" > mart.txt`
    Verify: `grep -qxF "[(1, 6650), (2, 2500), (3, 0), (4, 0), (5, 0)]" mart.txt`

31. Generate the documentation, which also reads the column types back from the database: `DBT_PROFILES_DIR=. "$(cat dbt.path)" docs generate`
    Verify: `grep -q '"model.pipeline.customer_orders"' target/catalog.json`

32. Now prove the tests can fail, twice, on copies of the raw files under `target/`, which is ignored and cleaned, so the real ones are never touched. First copy: `cp -r data target/bad-status`
    Verify: `test -f target/bad-status/raw_orders.csv`

33. Add an order whose status the seed does not know — the change that would otherwise count as zero revenue without a word: `echo "109,1,2026-03-15,lost,100" >> target/bad-status/raw_orders.csv`
    Verify: `grep -q ",lost," target/bad-status/raw_orders.csv`

34. Build from that copy into a separate database and a separate target directory, and keep the exit code: `DBT_PROFILES_DIR=. DBT_RAW_DIR=target/bad-status DBT_DUCKDB_PATH=target/bad-status.duckdb "$(cat dbt.path)" build --no-use-colors --target-path target/bad-status-run > target/bad-status.txt 2>&1; echo "$?" > target/bad-status.code`
    Verify: `grep -qv '^0$' target/bad-status.code`

35. Confirm why it failed: the test that ties a status to the seed caught the row, and the mart was skipped rather than built from it: `grep -E "FAIL 1 relationships_stg_orders_status|SKIP relation main.customer_orders" target/bad-status.txt > target/bad-status.why`
    Verify: `test "$(wc -l < target/bad-status.why)" -eq 2`

36. Second copy, for a value that would otherwise be rounded: `cp -r data target/bad-amount`
    Verify: `test -f target/bad-amount/raw_orders.csv`

37. Add an order for half a cent. DuckDB would cast `1850.5` to `1851` without a word: `echo "109,1,2026-03-15,completed,1850.5" >> target/bad-amount/raw_orders.csv`
    Verify: `grep -q ",1850.5$" target/bad-amount/raw_orders.csv`

38. Build from that copy the same way, and keep the exit code: `DBT_PROFILES_DIR=. DBT_RAW_DIR=target/bad-amount DBT_DUCKDB_PATH=target/bad-amount.duckdb "$(cat dbt.path)" build --no-use-colors --target-path target/bad-amount-run > target/bad-amount.txt 2>&1; echo "$?" > target/bad-amount.code`
    Verify: `grep -qv '^0$' target/bad-amount.code`

39. Confirm why it failed: the source test caught the raw text before staging could round it, and nothing downstream was built: `grep -E "FAIL 1 source_whole_number_raw_orders_amount_cents|SKIP relation main.customer_orders" target/bad-amount.txt > target/bad-amount.why`
    Verify: `test "$(wc -l < target/bad-amount.why)" -eq 2`

40. Confirm dbt kept its usage statistics to itself. With them on, dbt writes an anonymous id to `.user.yml` beside `profiles.yml` — here, the project directory: `ls -a > files.txt`
    Verify: `! grep -qx ".user.yml" files.txt`
