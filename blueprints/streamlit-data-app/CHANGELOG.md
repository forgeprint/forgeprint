# Changelog — streamlit-data-app

## 1.0.0 — 2026-09-25

First version.

A Streamlit 1.64 dashboard over a bundled CSV, with pandas 3.0 transforms in a
module that never imports Streamlit, `AppTest` tests that drive the region
multiselect, and a configuration test that reads `.streamlit/config.toml`
through Streamlit's own loader.

**Generated** from
[the 2026-09-24 expansion plan](../../docs/research/2026-09-24-expansion-plan.md)
(Phase 6), on the demand recorded in
[the 2026-09-24 demand report](../../docs/research/2026-09-24-demand.md):
`streamlit` 4.6M and `pandas` 128.0M downloads a week on PyPI. Its recipe runs
in CI like every other and nobody has built a dashboard on it, so it is
`tier: community` and says so wherever it is served
([ADR 0011](../../docs/decisions/0011-generated-blueprints.md)). CI-tested,
not manually verified.

Versions were read from the PyPI JSON API on 2026-09-25: streamlit 1.64.0,
pandas 3.0.6, pytest 9.1.1, ruff 0.16.9. Each has wheels for Python 3.13, which
is what CI runs. Actions pinned by SHA: `actions/checkout` v7.0.1 and
`actions/setup-python` v7.0.0, both the latest release on that date.

Verified against the installed Streamlit rather than from memory:

- `browser.gatherUsageStats` defaults to **true**; this project sets it false.
- `server.enableXsrfProtection` defaults to true; a running server sets the
  `_streamlit_xsrf` cookie on `/_stcore/health`, which the recipe checks.
- The health endpoint is `/_stcore/health` and answers `ok`. The script health
  check at `/_stcore/script-health-check` is off by default, marked
  experimental, and is enabled on the command line for the recipe's run only.
- `--server.port 0` asks the operating system for a port and prints the one it
  got, so the recipe reads it back instead of assuming 8501.
- `AppTest.from_file` resolves a relative path against the calling test file,
  not the working directory. `st.bar_chart` appears in the element tree as
  `vega_lite_chart`, with no typed accessor.

Two things came out of running the recipe rather than describing it:

- **A served recipe loses blank lines.** The catalog's option resolver
  collapses every run of blank lines to one, inside code blocks too, so the
  Python files arrive one blank line short of what `ruff format` wants before
  a top-level function. Step 19 runs `ruff format .` once, before the lint
  step, so a project built from the served recipe passes its own CI.
- **`get_where_defined` spells the path the way the process's working
  directory does.** On Windows that can be the short 8.3 form, so the config
  test compares files with `samefile` rather than paths with `==`.

`forgeprint test-setup streamlit-data-app` passed locally, all 27 steps, on
Windows with Python 3.14 under Git Bash: 16 tests, ruff clean, the server
started on an OS-chosen port, and health, the XSRF cookie and the script
health check all answered. CI runs it on Linux with Python 3.13.

### Planned

- **File upload.** Left out so that `requirements` claims only what is tested.
  `AGENTS.md` says what adding it takes: a size limit, the same column
  contract, and a test of a bad upload.
- **Authentication.** Out of scope; the server is loopback-only because of it.
