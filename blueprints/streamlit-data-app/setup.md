# Setup

Creates a Streamlit dashboard over a CSV bundled with the project: the loading
and the transforms in a plain pandas module with ordinary unit tests, the page
driven headlessly with Streamlit's `AppTest`, the configuration held by a test,
and a real server started on loopback and probed.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.13 or newer, and `curl` for the checks against the running
server.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   streamlit==1.64.0
   pandas==3.0.6
   ```

   Verify: `test -f requirements.txt`

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   ruff==0.16.9
   ```

   Verify: `test -f requirements-dev.txt`

5. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import pandas, streamlit; assert streamlit.__version__ == '1.64.0'"`

6. Create `.streamlit/config.toml` with:

   ```toml
   # Read by `streamlit run` from the directory it is started in. Every value
   # here is a decision, and tests/test_config.py fails if one is removed or
   # misspelled.

   [browser]
   # Streamlit sends usage statistics from the browser by default. Off, because
   # a dashboard over internal data should not report on its viewers to a third
   # party without somebody deciding that it should.
   gatherUsageStats = false

   [server]
   # Loopback only. There is no login in this app, so the only safe audience is
   # the machine it runs on. Widening this is a decision for whoever adds
   # authentication or puts an authenticating proxy in front; see AGENTS.md.
   address = "127.0.0.1"
   # Both are Streamlit's defaults, written down so that turning either off is
   # a visible diff rather than a missing line. Disabling XSRF protection is the
   # usual answer found online to a proxy problem, and it is the wrong one.
   enableXsrfProtection = true
   enableCORS = true

   [client]
   # The default, "full", shows the exception message and traceback in the
   # page. "type" shows the exception type there and keeps the rest in the
   # terminal that started the server.
   showErrorDetails = "type"
   ```

   Verify: `test -f .streamlit/config.toml`

7. Create `data/sales.csv` with:

   ```csv
   date,region,product,units,unit_price
   2026-01-05,North,Widget,12,4.50
   2026-01-09,South,Widget,7,4.50
   2026-01-14,East,Gadget,3,19.00
   2026-01-20,West,Gizmo,9,7.25
   2026-01-27,North,Gadget,4,19.00
   2026-02-03,South,Gizmo,11,7.25
   2026-02-10,East,Widget,15,4.50
   2026-02-12,West,Widget,6,4.50
   2026-02-18,North,Gizmo,8,7.25
   2026-02-25,South,Gadget,2,19.00
   2026-03-02,East,Gizmo,10,7.25
   2026-03-08,West,Gadget,5,19.00
   2026-03-15,North,Widget,14,4.50
   2026-03-21,South,Widget,9,4.50
   2026-03-28,East,Gadget,4,19.00
   2026-04-04,West,Gizmo,12,7.25
   2026-04-11,North,Gadget,6,19.00
   2026-04-17,South,Gizmo,7,7.25
   2026-04-23,East,Widget,18,4.50
   2026-04-30,West,Widget,8,4.50
   ```

   Verify: `test -f data/sales.csv`

8. Create `app/__init__.py` with:

   ```python

   ```

   Verify: `test -f app/__init__.py`

9. Create `app/data.py` with:

   ```python
   """Loading and shaping the data, with no idea that Streamlit exists.

   Every function here takes a DataFrame or a path and returns a DataFrame, so
   each one is an ordinary unit test. The page in streamlit_app.py reads
   widgets and calls these; the moment a transform lives in the page it can
   only be tested by running the page.
   """

   from pathlib import Path

   import pandas as pd

   DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "sales.csv"

   # The contract with the file. A column that is renamed upstream fails here,
   # by name, instead of as a KeyError three functions later.
   COLUMNS = ("date", "region", "product", "units", "unit_price")


   class SchemaError(ValueError):
       """The file does not have the shape this app is written against."""


   def load_sales(path: Path = DATA_FILE) -> pd.DataFrame:
       frame = pd.read_csv(path)

       missing = [column for column in COLUMNS if column not in frame.columns]
       if missing:
           raise SchemaError(f"missing columns: {', '.join(missing)}")

       frame = frame.loc[:, list(COLUMNS)]
       try:
           # An explicit format: a date the parser has to guess at is a date it
           # can guess wrong, silently, per row.
           frame["date"] = pd.to_datetime(frame["date"], format="%Y-%m-%d")
           frame = frame.astype({"units": "int64", "unit_price": "float64"})
       except (ValueError, TypeError) as error:
           raise SchemaError(f"a value does not match its column: {error}") from error

       if (frame["units"] < 0).any():
           raise SchemaError("units cannot be negative")

       frame["revenue"] = frame["units"] * frame["unit_price"]
       return frame


   def filter_sales(frame: pd.DataFrame, regions: list[str]) -> pd.DataFrame:
       """The rows in the chosen regions. No regions means no rows, not all rows."""
       return frame[frame["region"].isin(regions)].reset_index(drop=True)


   def monthly_revenue(frame: pd.DataFrame) -> pd.DataFrame:
       """Revenue per calendar month, oldest first, one row per month."""
       return (
           frame.assign(month=frame["date"].dt.strftime("%Y-%m"))
           .groupby("month", as_index=False)["revenue"]
           .sum()
           .sort_values("month")
           .reset_index(drop=True)
       )
   ```

   Verify: `"$(cat python.path)" -c "from app.data import load_sales; assert len(load_sales()) == 20"`

10. Create `streamlit_app.py` with:

    ```python
    """The page: read the widgets, call app.data, draw the result.

    Streamlit runs this file top to bottom on every interaction. Nothing here
    computes anything a test would want to check on its own; that lives in
    app/data.py, where it is an ordinary function with an ordinary unit test.
    """

    import pandas as pd
    import streamlit as st

    from app.data import filter_sales, load_sales, monthly_revenue

    st.set_page_config(page_title="Sales", layout="wide")


    @st.cache_data
    def sales() -> pd.DataFrame:
        # The script reruns on every click. Without the cache the file is read and
        # parsed each time; with it, once per process. The cache hands every run
        # its own copy, so a page that mutates the frame cannot corrupt the next
        # run. Call sales.clear() if the file can change while the app is running.
        return load_sales()


    data = sales()
    all_regions = sorted(data["region"].unique())

    st.title("Sales")

    # An explicit key, so tests find the widget by name rather than by position
    # and adding a second multiselect above it does not retarget them.
    regions = st.multiselect("Regions", options=all_regions, default=all_regions, key="regions")

    if not regions:
        st.info("Choose at least one region.")
        st.stop()

    selected = filter_sales(data, regions)

    st.metric("Revenue", f"{selected['revenue'].sum():,.2f}")
    st.bar_chart(monthly_revenue(selected), x="month", y="revenue")
    st.dataframe(selected, hide_index=True)
    ```

    Verify: `test -f streamlit_app.py`

11. Create `tests/test_data.py` with:

    ```python
    """The transforms, as ordinary functions: no Streamlit, no page, no server.

    This is where the numbers are checked. The page tests only prove the page
    wires a widget to these functions; whether the functions are right is
    decided here, in milliseconds.
    """

    from pathlib import Path

    import pytest

    from app.data import COLUMNS, SchemaError, filter_sales, load_sales, monthly_revenue


    def write_csv(tmp_path: Path, text: str) -> Path:
        path = tmp_path / "sales.csv"
        path.write_text(text, encoding="utf-8")
        return path


    def test_loads_the_bundled_file_with_its_types() -> None:
        frame = load_sales()

        assert list(frame.columns) == [*COLUMNS, "revenue"]
        assert len(frame) == 20
        assert frame["date"].dtype.kind == "M"
        assert frame["units"].dtype == "int64"


    def test_refuses_a_file_missing_a_column(tmp_path: Path) -> None:
        path = write_csv(tmp_path, "date,region,product,units\n2026-01-05,North,Widget,12\n")

        with pytest.raises(SchemaError, match="unit_price"):
            load_sales(path)


    def test_refuses_a_value_that_does_not_fit_its_column(tmp_path: Path) -> None:
        path = write_csv(
            tmp_path,
            "date,region,product,units,unit_price\n2026-01-05,North,Widget,twelve,4.50\n",
        )

        with pytest.raises(SchemaError):
            load_sales(path)


    def test_refuses_a_date_in_another_format(tmp_path: Path) -> None:
        # 05/01/2026 is the fifth of January in one country and the first of May
        # in another. Guessing is how a month of data moves without an error.
        path = write_csv(
            tmp_path,
            "date,region,product,units,unit_price\n05/01/2026,North,Widget,12,4.50\n",
        )

        with pytest.raises(SchemaError):
            load_sales(path)


    def test_refuses_negative_units(tmp_path: Path) -> None:
        path = write_csv(
            tmp_path,
            "date,region,product,units,unit_price\n2026-01-05,North,Widget,-3,4.50\n",
        )

        with pytest.raises(SchemaError, match="negative"):
            load_sales(path)


    def test_filters_to_the_chosen_regions() -> None:
        north = filter_sales(load_sales(), ["North"])

        assert set(north["region"]) == {"North"}
        assert len(north) == 5


    def test_no_regions_means_no_rows_not_all_rows() -> None:
        assert filter_sales(load_sales(), []).empty


    def test_monthly_revenue_is_one_row_per_month_and_adds_up() -> None:
        frame = load_sales()

        monthly = monthly_revenue(frame)

        assert list(monthly["month"]) == ["2026-01", "2026-02", "2026-03", "2026-04"]
        assert monthly.loc[0, "revenue"] == pytest.approx(283.75)
        assert monthly["revenue"].sum() == pytest.approx(frame["revenue"].sum())
    ```

    Verify: `test -f tests/test_data.py`

12. Create `tests/test_app.py` with:

    ```python
    """The page, driven headlessly.

    AppTest runs streamlit_app.py the way the server does, top to bottom with
    widget state, but with no browser and no port. A test that called
    filter_sales() directly would pass while the multiselect was wired to the
    wrong variable, and that wiring is the part of a Streamlit page that breaks.
    """

    import json

    from streamlit.testing.v1 import AppTest

    # Relative to this file, not to the working directory: that is how
    # AppTest.from_file resolves a relative path.
    APP = "../streamlit_app.py"


    def run_app() -> AppTest:
        return AppTest.from_file(APP, default_timeout=30).run()


    def test_shows_every_region_by_default() -> None:
        at = run_app()

        assert not at.exception
        assert at.multiselect(key="regions").value == ["East", "North", "South", "West"]
        assert len(at.dataframe[0].value) == 20
        assert at.metric[0].value == "1,269.75"


    def test_narrowing_the_regions_narrows_the_table_and_the_total() -> None:
        at = run_app()

        at.multiselect(key="regions").set_value(["North"]).run()

        assert not at.exception
        table = at.dataframe[0].value
        assert set(table["region"]) == {"North"}
        assert len(table) == 5
        assert at.metric[0].value == "365.00"


    def test_an_empty_selection_says_so_instead_of_drawing_nothing() -> None:
        at = run_app()

        at.multiselect(key="regions").set_value([]).run()

        assert not at.exception
        assert "at least one region" in at.info[0].value
        assert len(at.dataframe) == 0


    def test_draws_revenue_by_month_as_bars() -> None:
        at = run_app()

        # AppTest has no typed accessor for charts; the element carries the
        # Vega-Lite spec the browser would draw, and that is what is checked.
        charts = at.get("vega_lite_chart")
        assert len(charts) == 1
        spec = json.loads(charts[0].proto.spec)
        assert spec["mark"]["type"] == "bar"
        assert spec["encoding"]["x"]["field"] == "month"
        assert spec["encoding"]["y"]["field"] == "revenue"
    ```

    Verify: `test -f tests/test_app.py`

13. Create `tests/test_config.py` with:

    ```python
    """The settings in .streamlit/config.toml that are decisions, held by a test.

    Read through Streamlit's own config loader rather than parsed as TOML, so a
    misspelled key fails here: Streamlit ignores an option it does not know, and
    a typo would leave the default in force without a word.
    """

    from pathlib import Path

    from streamlit import config

    PROJECT_CONFIG = Path(".streamlit/config.toml")


    def test_usage_statistics_are_off_and_this_project_says_so() -> None:
        # Streamlit's default is on. Checking where the value came from, not only
        # the value, is what stops a developer's own global config from making
        # this pass on one machine and not on the next.
        assert config.get_option("browser.gatherUsageStats") is False
        # samefile, not ==: the same file can be spelled two ways on Windows.
        assert Path(config.get_where_defined("browser.gatherUsageStats")).samefile(PROJECT_CONFIG)


    def test_xsrf_protection_is_on() -> None:
        assert config.get_option("server.enableXsrfProtection") is True


    def test_listens_on_loopback_only() -> None:
        assert config.get_option("server.address") == "127.0.0.1"


    def test_error_details_stay_out_of_the_browser() -> None:
        assert config.get_option("client.showErrorDetails") == "type"
    ```

    Verify: `test -f tests/test_config.py`

14. Create `pytest.ini` with:

    ```ini
    [pytest]
    testpaths = tests
    pythonpath = .
    ```

    Verify: `test -f pytest.ini`

15. Create `ruff.toml` with:

    ```toml
    target-version = "py313"
    line-length = 100

    [lint]
    # pyflakes and pycodestyle, import order, bugbear, and upgrades to the
    # syntax the pinned Python allows.
    select = ["E", "F", "I", "B", "UP"]
    ```

    Verify: `test -f ruff.toml`

16. Create `.gitignore` with:

    ```text
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    .ruff_cache/
    # Where Streamlit reads st.secrets from. It never belongs in the repository.
    .streamlit/secrets.toml
    python.path
    server.log
    server.pid
    server.url
    health.txt
    health.headers
    xsrf.txt
    script-health.txt
    ```

    Verify: `test -f .gitignore`

17. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          # The same file the setup installs from, so CI and a laptop cannot
          # disagree about which versions were tested.
          - run: pip install -r requirements-dev.txt
          - run: ruff check .
          - run: ruff format --check .
          - run: python -m pytest -q
    ```

    Verify: `test -f .github/workflows/ci.yml`

18. Create `README.md` with:

    ```markdown
    # sales-dashboard

    A Streamlit dashboard over `data/sales.csv`.

    ## Run it

    `streamlit run streamlit_app.py` from the project directory, with the
    virtual environment active. It listens on 127.0.0.1 only; there is no
    login, so that is deliberate.

    ## Test it

    `python -m pytest -q` runs the transforms as unit tests and the page
    headlessly through `AppTest`. `ruff check .` and `ruff format --check .`
    are what CI runs before them.

    ## Change it

    See `AGENTS.md`. The short version: a transform goes in `app/data.py`
    with a unit test, the page only reads widgets and calls it, and a new
    widget gets a `key` and an `AppTest` test that drives it.
    ```

    Verify: `test -f README.md`

19. Format the code once with the pinned ruff. The files above are already formatted as written; this is here because a recipe served by the catalog has runs of blank lines collapsed to one, and Python wants two before a top-level function: `"$(cat python.path)" -m ruff format .`
    Verify: `"$(cat python.path)" -m ruff format --check .`

20. Lint the project: `"$(cat python.path)" -m ruff check .`
    Verify: `"$(cat python.path)" -m ruff check .`

21. Run the tests: `"$(cat python.path)" -m pytest -q`
    Verify: `"$(cat python.path)" -m pytest -q`

22. Start the app headless on a port the operating system chooses, and keep its process id. A fixed port can already be taken, and then the check either fails or answers from somebody else's server. The script health check is off by default and is turned on for this run only, on the command line, so it never lands in the committed config: `"$(cat python.path)" -m streamlit run streamlit_app.py --server.headless true --server.port 0 --server.scriptHealthCheckEnabled true > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

23. Read the address it chose out of its own log. Sixty seconds, because the first start after an install is slower than the steady state: `for attempt in $(seq 60); do grep -oE "http://127\.0\.0\.1:[0-9]+" server.log | head -1 > server.url && test -s server.url && break; sleep 1; done`
    Verify: `test -s server.url`

24. Ask the server whether it is ready, and keep the headers it answered with: `curl -fsS -D health.headers -o health.txt "$(cat server.url)/_stcore/health"`
    Verify: `grep -qx "ok" health.txt`

25. Confirm XSRF protection is on in the running server, not only in the file. With it on, Streamlit sets its token cookie on every response, and the day somebody turns it off this step fails: `grep -i "^set-cookie:" health.headers > xsrf.txt`
    Verify: `grep -qi "_streamlit_xsrf=" xsrf.txt`

26. Ask the server to run the script and report whether it finished without an exception. The health check above only proves the server is up; this proves the page it serves works under the committed configuration: `curl -fsS -o script-health.txt "$(cat server.url)/_stcore/script-health-check"`
    Verify: `grep -qx "ok" script-health.txt`

27. Stop the app: `kill "$(cat server.pid)"`
    Verify: `test -f server.pid`
