# Setup

Creates an MCP server in Python on the official SDK, with one working tool,
tests that speak the protocol, and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires Python 3.10 or newer.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   mcp==2.2.0
   ```

   Verify: `test -f requirements.txt`

<!-- if options.transport == stdio -->

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   pytest-asyncio==1.4.0
   ```

   Verify: `test -f requirements-dev.txt`

<!-- endif -->

<!-- if options.transport == http -->

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   pytest-asyncio==1.4.0
   uvicorn==0.53.0
   ```

   Verify: `test -f requirements-dev.txt`

<!-- endif -->

5. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import mcp"`

6. Create `app/__init__.py` with:

   ```python
   ```

   Verify: `test -f app/__init__.py`

7. Create `app/server.py` with:

   ```python
   """The server, as a function that builds one.

   A function rather than a module-level object: the tests need a fresh server
   per test, and the entry points need one built after the environment has been
   read. A singleton created at import time makes the first impossible and the
   second a surprise.
   """

   from mcp.server import MCPServer


   def create_server() -> MCPServer:
       server = MCPServer(name="example-mcp", version="0.1.0")

       @server.tool()
       def add(a: int, b: int) -> int:
           """Add two integers and return the sum.

           The docstring is not for you. The SDK sends it to the client as the
           tool's description, and it is the only thing a model has when
           deciding whether to call this. Delete this tool and write yours.
           """
           return a + b

       return server
   ```

   Verify: `"$(cat python.path)" -c "from app.server import create_server; create_server()"`

<!-- if options.transport == stdio -->

8. Create `app/__main__.py` with:

   ```python
   """The stdio entry point.

   Nothing here may write to stdout: under stdio, stdout is the protocol. The
   SDK writes its own logging to stderr, and so must anything you add.
   """

   from app.server import create_server


   def main() -> None:
       create_server().run(transport="stdio")


   if __name__ == "__main__":
       main()
   ```

   Verify: `test -f app/__main__.py`

<!-- endif -->

<!-- if options.transport == http -->

8. Create `app/http.py` with:

   ```python
   """The streamable HTTP entry point.

   A loopback port is reachable from a page in the user's browser, which is the
   DNS-rebinding problem. TransportSecuritySettings is the SDK's answer and it
   is on by default; an empty allowed_origins refuses every request that
   carries an Origin header, which is every request from a page.

   Do not add "*" here to make a client work. A step below sends a foreign
   Origin and requires a 403, so widening this breaks a step rather than going
   unnoticed.
   """

   import os

   import uvicorn

   from mcp.server.transport_security import TransportSecuritySettings

   from app.server import create_server

   ALLOWED_ORIGINS = [
       origin for origin in os.environ.get("ALLOWED_ORIGINS", "").split(",") if origin
   ]


   def main() -> None:
       app = create_server().streamable_http_app(
           transport_security=TransportSecuritySettings(
               allowed_origins=ALLOWED_ORIGINS,
               allowed_hosts=["127.0.0.1", "127.0.0.1:*", "localhost", "localhost:*"],
           )
       )
       # Port 0: the operating system chooses a free one. A fixed port can
       # already be taken, and then the server either fails to start or — worse
       # — you end up talking to somebody else's.
       uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "0")))


   if __name__ == "__main__":
       main()
   ```

   Verify: `test -f app/http.py`

<!-- endif -->

9. Create `tests/test_server.py` with:

   ```python
   """The protocol, driven in-process.

   Client takes the server object directly, so these tests speak real MCP with
   no subprocess and no port. That matters: a test that called add() would pass
   while the tool was not registered at all, and registration is the part that
   breaks.
   """

   import pytest

   from mcp.client import Client

   from app.server import create_server


   @pytest.mark.asyncio
   async def test_the_tool_is_registered() -> None:
       async with Client(create_server()) as client:
           listed = await client.list_tools()

       assert [tool.name for tool in listed.tools] == ["add"]


   @pytest.mark.asyncio
   async def test_the_tool_answers() -> None:
       async with Client(create_server()) as client:
           result = await client.call_tool("add", {"a": 2, "b": 3})

       assert result.is_error is False
       assert result.structured_content == {"result": 5}


   @pytest.mark.asyncio
   async def test_the_description_reaches_the_client() -> None:
       # The docstring is the only thing a model has when deciding whether to
       # call this tool. An empty one is a bug no type checker can see.
       async with Client(create_server()) as client:
           listed = await client.list_tools()

       description = listed.tools[0].description
       assert description is not None and description.strip() != ""
   ```

   Verify: `test -f tests/test_server.py`

10. Create `pytest.ini` with:

    ```ini
    [pytest]
    asyncio_mode = auto
    testpaths = tests
    ```

    Verify: `test -f pytest.ini`

11. Create `.gitignore` with:

    ```text
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    python.path
    server.log
    server.pid
    server.url
    ```

    Verify: `test -f .gitignore`

12. Create `.github/workflows/ci.yml` with:

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
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
            with:
              python-version: '3.13'
          # The same file the setup installs from, so CI and a laptop cannot
          # disagree about which versions were tested.
          - run: pip install -r requirements-dev.txt
          - run: python -m pytest -q
    ```

    Verify: `test -f .github/workflows/ci.yml`

13. Create `README.md` with:

    ```markdown
    # MCP server

    An MCP server on the official Python SDK.

    ## Rules that are not style preferences

    See `AGENTS.md`. The one that costs the most time when ignored: nothing may
    write to stdout under the stdio transport, because stdout is the protocol.

    ## Add a tool

    Write it inside `create_server()`, annotate every parameter, and write the
    docstring for a model rather than for a reviewer. Then add a test that
    calls it through `Client` — one that calls the function directly passes
    while the tool is not registered at all.
    ```

    Verify: `test -f README.md`

14. Run the tests: `"$(cat python.path)" -m pytest -q`
    Verify: `"$(cat python.path)" -m pytest -q`

<!-- if options.transport == stdio -->

15. Create `scripts/probe.py` with:

    ```python
    """Speak MCP to the server as a client would, over stdio.

    The tests drive the server object. This drives the process, which is where
    a different set of failures live: an import error, a stray print corrupting
    the stream, an entry point that does not exist.
    """

    import asyncio
    import sys

    from mcp import StdioServerParameters
    from mcp.client import Client


    async def main() -> None:
        parameters = StdioServerParameters(command=sys.executable, args=["-m", "app"])
        async with Client(parameters) as client:
            listed = await client.list_tools()
            names = [tool.name for tool in listed.tools]
            if names != ["add"]:
                raise SystemExit(f"expected one tool named add, got {names}")

            result = await client.call_tool("add", {"a": 2, "b": 3})
            if result.structured_content != {"result": 5}:
                raise SystemExit(f"add returned {result.structured_content}")

        print("probe ok", file=sys.stderr)


    asyncio.run(main())
    ```

    Verify: `test -f scripts/probe.py`

16. Speak MCP to the server as a client would, and confirm it answers: `"$(cat python.path)" scripts/probe.py`
    Verify: `"$(cat python.path)" scripts/probe.py`

<!-- endif -->

<!-- if options.transport == http -->

15. Start the server on a port the operating system chooses, and keep its process id: `"$(cat python.path)" -m app.http > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

16. Read the address it chose out of its own log. Sixty seconds, because the first run after an install is slower than the steady state: `for attempt in $(seq 60); do grep -oE "http://127\.0\.0\.1:[0-9]+" server.log | head -1 > server.url && test -s server.url && break; sleep 1; done`
    Verify: `test -s server.url`

17. Ask it to initialize, and keep the answer: `curl -fsS -o initialize.json -X POST "$(cat server.url)/mcp" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1.0.0"}}}'`
    Verify: `grep -q '"protocolVersion"' initialize.json`

18. Confirm a request claiming to come from a web page is refused. This is the step that proves the rebinding guard, and it fails loudly the day somebody widens the allow-list to make a client work: `curl -sS -o rejected.txt -w "%{http_code}" -X POST "$(cat server.url)/mcp" -H "Origin: https://example.com" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' > rejected.code`
    Verify: `grep -q '^403$' rejected.code`

19. Stop the server: `kill "$(cat server.pid)"`
    Verify: `test -f server.pid`

<!-- endif -->
