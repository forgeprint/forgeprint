# Streamlit Data App

A Streamlit dashboard over a CSV bundled with the project: a filter, a metric,
a bar chart and a table. The loading and the transforms are a plain pandas
module with ordinary unit tests; the page is driven headlessly with
Streamlit's `AppTest`; and a real server is started on loopback and probed
before the recipe finishes.

**Generated, CI-tested, not manually verified.** The recipe executes on every
push like every other blueprint here. Nobody has built a real dashboard on it
first, which is what `tier: official` means in this catalog and why this is
`community`.

## What you get

- `app/data.py` — loads `data/sales.csv`, refuses a file that is missing a
  column, has a value of the wrong type, a date in another format or a
  negative quantity, and exposes `filter_sales` and `monthly_revenue`. No
  Streamlit import.
- `streamlit_app.py` — a region multiselect, a revenue metric, revenue by month
  as a bar chart and the filtered rows as a table, with the load behind
  `st.cache_data`.
- Tests at three levels: unit tests for the transforms, `AppTest` tests that
  change the multiselect and assert the table, the metric and the chart, and a
  test that reads `.streamlit/config.toml` through Streamlit's own loader.
- `.streamlit/config.toml` with usage statistics off (Streamlit's default is
  on), the server bound to `127.0.0.1`, XSRF and CORS protection written down
  as on, and exception details kept out of the page.
- ruff for lint and format, and a GitHub Actions workflow with actions pinned
  by commit SHA that runs both and the tests.
- A recipe that ends by starting `streamlit run` headless on a port the
  operating system picks and checking `/_stcore/health`, the XSRF cookie, and
  the script health check.

## Options

None. A second data source, a second chart library or an upload widget would
each change what the tests have to prove; they are separate decisions, not
switches.

## What it fits

- An internal dashboard over a file somebody already has: a weekly export, a
  report a spreadsheet grew out of.
- Exploring a dataset with people who will not open a notebook, on one machine
  or behind something that already does authentication.
- A team writing Python that wants a page without writing any JavaScript.
- Learning where the seam goes in a Streamlit app. The page is the part that is
  hard to test, so the recipe keeps it thin and puts the logic somewhere
  pytest can reach directly.

## What it is NOT for

- **Anything with users who must log in.** There is no authentication, and the
  server listens on loopback for exactly that reason. Streamlit's OIDC support
  (`st.login`) or an authenticating proxy is the first thing to add before it
  is reachable from anywhere else, and this blueprint does neither.
- **A public product or high traffic.** Streamlit reruns the whole script per
  interaction and keeps a WebSocket open per viewer. That is fine for a team
  and the wrong architecture for thousands of concurrent users. Use
  `nextjs-fullstack-app` or another `web` blueprint.
- **Multi-user editing or writes.** The page reads. Anything that writes back
  needs authorization, concurrency and an audit trail, none of which is here.
- **Pipelines and scheduled jobs.** A dashboard is not where data is
  transformed on a schedule. `python-background-worker` runs jobs; a planned
  dbt and DuckDB blueprint is for pipelines.
- **An HTTP API over the data.** Use `fastapi-service`.
- **Large data.** The whole file is read into memory once per process. Past a
  few hundred megabytes, push the aggregation into a database or DuckDB and
  load the result.

## Pros

- **The logic is testable without Streamlit.** Every number the page shows
  comes from a function in `app/data.py` with a unit test.
- **The page is tested as a page.** `AppTest` changes the multiselect and
  asserts the table, the metric and the chart spec. A test that called the
  transform directly would pass with the widget wired to the wrong variable.
- **Bad data fails by name.** A missing column, a mistyped value, an ambiguous
  date or a negative quantity raises `SchemaError` at load rather than
  rendering a plausible, wrong dashboard.
- **Privacy and exposure decided up front.** Usage statistics off, loopback
  only, XSRF on, exception details in the terminal. A test fails if any of
  them is removed, and the recipe proves XSRF on the running server.
- **Proved running**, not only imported: the recipe starts the server, reads
  the port it chose, and checks health and a clean script run.
- **Two runtime dependencies.** Streamlit and pandas, pinned with `==`.

## Cons

- **Nobody has run this in anger.** See the notice above.
- **No authentication.** Stated above, and repeated because it is the thing a
  reader is most likely to miss when a colleague asks for the link.
- **`AppTest` is Streamlit's API, and it moves.** The page tests depend on its
  element tree; the chart test reads the Vega-Lite spec through the element's
  protobuf, because `AppTest` has no typed accessor for charts. A minor
  Streamlit upgrade can require test changes.
- **The script health check is an internal endpoint.** Streamlit documents
  `/_stcore/health`; `/_stcore/script-health-check` is marked experimental.
  The recipe turns it on for one run only, and a Streamlit upgrade may remove
  it.
- **Streamlit is a large dependency.** It brings pyarrow, a web server and a
  bundled frontend. The install takes longer than the code is long.
- **No lockfile.** Direct dependencies are pinned with `==`; transitive ones
  resolve at install time, as in every Python blueprint here.

## Trade-offs made on your behalf

- **pandas, not polars.** Streamlit depends on pandas already, so pandas adds
  no second dataframe library, and `st.dataframe` and the chart functions take
  a pandas frame without conversion. polars is faster on large data, which is
  the case this blueprint tells you to push into a database instead.
- **Only the load is cached.** The filtered result is recomputed on every
  interaction, because at this size it costs less than thinking about how the
  cache grows with every combination of inputs.
- **`showErrorDetails = "type"`**, not the default `"full"`. The developer
  loses the traceback in the page and keeps it in the terminal; a viewer never
  sees a file path or a query in an error.
- **CSV in the repository.** Synthetic, twenty rows. Real data does not belong
  in version control; replacing the file is the first change you make.
- **No container.** `streamlit run` on a laptop or a VM is the whole
  deployment story here. A Dockerfile is easy to add and is a decision about
  where it runs, which this blueprint does not make.

## Cost of adoption

About ten minutes with Python 3.13 installed; most of it is the install of
Streamlit and pyarrow. Nothing needs an account or a paid service.

## Compared with the alternatives here

- **`python-background-worker`** — the other `data` blueprint, and the opposite
  end of the problem: it runs jobs with no user interface, this one shows data
  with no jobs.
- **`fastapi-service`** — also Python, and the right start if other programs
  consume the data rather than people looking at it.
- **`python-cli`** — the same layering (the work in a module, the interface
  thin) for a tool somebody runs in a terminal instead of a page.
