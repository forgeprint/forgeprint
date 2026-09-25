# AGENTS.md — Streamlit data app

A Streamlit dashboard over a CSV bundled with the project. pandas does the
work in `app/data.py`; `streamlit_app.py` reads widgets, calls it, and draws.
There is no login and the server listens on loopback only.

## Commands

| What                   | Command                                            |
| ---------------------- | -------------------------------------------------- |
| Install                | `python -m pip install -r requirements-dev.txt`    |
| Run                    | `streamlit run streamlit_app.py`                   |
| Test                   | `python -m pytest -q`                              |
| Lint                   | `ruff check .` and `ruff format --check .`         |
| Health (while running) | `curl -fsS http://127.0.0.1:<port>/_stcore/health` |

Run everything from the project root. Streamlit reads `.streamlit/config.toml`
from the directory it is started in, and `tests/test_config.py` reads it from
there too; started elsewhere, the configuration silently falls back to
Streamlit's defaults, which include sending usage statistics.

## Layout

| Path                     | What goes there                                                            |
| ------------------------ | -------------------------------------------------------------------------- |
| `app/data.py`            | Loading, validation and every transform. Imports pandas, never Streamlit   |
| `streamlit_app.py`       | Widgets, layout, `st.cache_data`, and calls into `app.data`. No arithmetic |
| `data/sales.csv`         | The bundled data. Small, synthetic, committed                              |
| `.streamlit/config.toml` | Server and browser settings. Every line is a decision a test holds         |
| `tests/test_data.py`     | Unit tests for `app/data.py`                                               |
| `tests/test_app.py`      | `AppTest` tests that drive a widget and assert what the page shows         |
| `tests/test_config.py`   | The configuration, read through Streamlit's own loader                     |

## Rules

1. **Nothing in `app/` imports `streamlit`.** A transform that calls `st.*` can
   only be tested by running a page, and it cannot be reused from a script or
   a notebook. If a function needs a widget's value, the page reads the widget
   and passes the value in.
2. **The page does no arithmetic.** A sum, a filter, a group-by in
   `streamlit_app.py` is a number no unit test checks. The one exception is
   formatting a value for display.
3. **Every widget has a `key`.** `AppTest` finds widgets by key or by
   position; tests written by position retarget silently when a widget is
   added above them.
4. **Every widget a user can change has an `AppTest` test that changes it** and
   asserts what the page then shows. Calling the transform directly does not
   prove the widget is wired to it.
5. **`load_sales` refuses a file that does not match `COLUMNS`**, by raising
   `SchemaError` with the column's name. Do not catch it in the page to show
   an empty table: an empty dashboard over broken data is read as "no sales".
   Let it fail, or show `st.error` and `st.stop()`.
6. **Dates are parsed with an explicit format.** `pd.to_datetime` without one
   guesses per value, and `05/01/2026` is two different days depending on who
   wrote it.
7. **Loading goes through `st.cache_data`, and only loading.** The script
   reruns on every interaction; caching the read keeps that cheap. Do not
   cache a function that takes a widget's value unless you have thought about
   the cache growing with every distinct input, and set `max_entries` when
   you do. Never `st.cache_resource` a DataFrame: it is shared, not copied,
   and one session mutating it changes every other session's data.
8. **`.streamlit/config.toml` is security configuration.** Do not turn off
   `enableXsrfProtection` or `enableCORS` to make a reverse proxy work; fix the
   proxy's headers. Do not set `gatherUsageStats` back to true, and do not
   move `showErrorDetails` back to `full` for anything other than your own
   machine. The tests fail if you do, which is the point.
9. **`server.address` stays `127.0.0.1` until there is authentication.** The
   app has no login. Binding it to `0.0.0.0` publishes every row of the data
   to anybody who can reach the port. Authentication comes first, either
   Streamlit's OIDC support (`st.login`, an extra dependency and an identity
   provider) or an authenticating reverse proxy in front.
10. **Secrets go in `.streamlit/secrets.toml` or the environment**, read with
    `st.secrets` or `os.environ`. That file is in `.gitignore`. Never write a
    connection string into `streamlit_app.py` or `app/data.py`.
11. **Data is shown through `st.dataframe`, `st.metric` and the chart
    functions, never through `unsafe_allow_html=True`.** Those escape what
    they render. A value from the file passed to `st.markdown` with HTML
    allowed is markup injection the day the file comes from somewhere else. If you need formatting, format the value, not the markup.
12. **Pin with `==` in `requirements*.txt`.** Streamlit's `AppTest` API and
    its element tree are what the page tests are written against, and they
    move between minor versions.

## When you are asked to add a filter

1. Add a function to `app/data.py` that takes the frame and the filter's value
   and returns a frame. No Streamlit.
2. Unit-test it in `tests/test_data.py`, including the empty case: decide what
   "nothing selected" means and assert it.
3. Add the widget in `streamlit_app.py` with a `key`, read its value, and pass
   it to the new function.
4. Add an `AppTest` test in `tests/test_app.py` that sets the widget with
   `at.<widget>(key=...).set_value(...).run()` and asserts the table, the
   metric or the chart changed.
5. `ruff check .`, `ruff format --check .`, `python -m pytest -q`.

## When you are asked to read a different file or a database

- A different CSV: change `COLUMNS` and the tests in `tests/test_data.py`
  first, then `data/`. Keep it small and synthetic if it is committed; real
  data does not go in the repository.
- A database: the query goes in `app/data.py` behind a function that returns
  a DataFrame, the connection string comes from `st.secrets` or the
  environment and is passed in by the page, and the unit tests use a frame
  built in the test rather than a live database.

## When you are asked to let users upload a file

This blueprint does not accept uploads. If you add `st.file_uploader`:

- Set `server.maxUploadSize` in `.streamlit/config.toml` to what the data
  actually needs, in megabytes. The default is 200.
- Pass the upload through the same validation as `load_sales` — the column
  contract, the date format, the value checks — and show `SchemaError`'s
  message with `st.error`. Test a bad upload with `AppTest`.
- Accept only the types you parse (`type=["csv"]`), and never write the upload
  to disk under a name the user chose.
