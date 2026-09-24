# Setup

Creates an agent on LangGraph with one narrow tool, a bounded loop, and tests
that drive the whole graph with a fake model — so the behaviour is verified
without an API key.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Python 3.10 or newer.

1. Create the virtual environment: `python -m venv .venv`
   Verify: `test -d .venv`

2. Record which interpreter this platform put in it. A virtual environment puts it in `bin` on Linux and macOS and in `Scripts` on Windows, and every step after this reads the answer instead of guessing again: `if test -x ./.venv/bin/python; then echo ./.venv/bin/python > python.path; else echo ./.venv/Scripts/python.exe > python.path; fi`
   Verify: `"$(cat python.path)" --version`

3. Create `requirements.txt` with:

   ```text
   langgraph==1.2.12
   langchain-core==1.6.4
   ```

   Verify: `test -f requirements.txt`

4. Create `requirements-dev.txt` with:

   ```text
   -r requirements.txt
   pytest==9.1.1
   ```

   Verify: `test -f requirements-dev.txt`

5. Install the pinned dependencies: `"$(cat python.path)" -m pip install -r requirements-dev.txt`
   Verify: `"$(cat python.path)" -c "import langgraph"`

6. Create `app/__init__.py` with:

   ```python

   ```

   Verify: `test -f app/__init__.py`

7. Create `app/tools.py` with:

   ```python
   """What the agent can actually do.

   This is the security boundary of the whole program. A model decides which
   tool to call and with what arguments, and those arguments are attacker-
   influenced whenever any part of the conversation is — a fetched page, a
   pasted email, a file somebody else wrote. So the tool refuses, in code,
   what the prompt is not allowed to talk it into (OWASP LLM 2025, excessive
   agency).

   The rule this file follows: a tool takes the narrowest argument that can
   express the job. Not a path — a name.
   """

   from pathlib import Path

   MAX_BYTES = 64 * 1024


   class ToolRefused(Exception):
       """A refusal the agent is allowed to see and reason about.

       Not an error: the graph turns this into a message, so the model learns
       it cannot do that and answers accordingly, rather than the process
       dying half-way through a conversation.
       """


   def read_note(root: Path, name: str) -> str:
       # A plain name only. No separators, no dot-files, nothing empty — the
       # check is on the shape of the input rather than on the resolved path,
       # because "../" is easier to reject than to reason about.
       if not name or "/" in name or "\\" in name or name.startswith("."):
           raise ToolRefused("name must be a plain file name")

       target = (root / name).resolve()

       # And again after resolving, because a symlink inside the directory can
       # point outside it. Two checks, because either alone has a hole.
       if not target.is_relative_to(root.resolve()):
           raise ToolRefused("refusing to read outside the notes directory")

       if not target.is_file():
           raise ToolRefused(f"no note called {name}")

       # A tool that can return an unbounded amount of text is a tool that can
       # fill a context window and a bill.
       if target.stat().st_size > MAX_BYTES:
           raise ToolRefused("that note is too large to read")

       return target.read_text(encoding="utf8")
   ```

   Verify: `test -f app/tools.py`

8. Create `app/graph.py` with:

   ```python
   """The graph: assistant, tools, and a bound on the loop between them."""

   from pathlib import Path
   from typing import Annotated, TypedDict

   from langchain_core.language_models import BaseChatModel
   from langchain_core.messages import AIMessage, AnyMessage, ToolMessage
   from langgraph.graph import END, START, StateGraph
   from langgraph.graph.message import add_messages

   from app.tools import ToolRefused, read_note

   # An agent that can loop can loop forever. This is the difference between a
   # bug and an invoice (OWASP Agentic 2026; API4:2023, unbounded consumption).
   MAX_TOOL_CALLS = 5


   class State(TypedDict):
       messages: Annotated[list[AnyMessage], add_messages]
       tool_calls_made: int


   def build_graph(model: BaseChatModel, notes_root: Path):
       """The model and the notes directory are parameters, not imports.

       That is what makes the tests below possible: they pass a fake model and
       a temporary directory, and drive the real graph. A module that
       constructed its own client from the environment could only be tested
       with an API key, which means in practice it would not be tested.
       """

       def assistant(state: State) -> dict:
           return {"messages": [model.invoke(state["messages"])]}

       def tools(state: State) -> dict:
           last = state["messages"][-1]
           results: list[AnyMessage] = []

           for call in getattr(last, "tool_calls", []) or []:
               try:
                   text = read_note(notes_root, call["args"].get("name", ""))
               except ToolRefused as refusal:
                   # A refusal goes back as a message. The model can read it
                   # and say so; the process does not die mid-conversation.
                   text = f"refused: {refusal}"
               results.append(ToolMessage(content=text, tool_call_id=call["id"]))

           return {
               "messages": results,
               "tool_calls_made": state.get("tool_calls_made", 0) + 1,
           }

       def route(state: State) -> str:
           last = state["messages"][-1]
           if not isinstance(last, AIMessage) or not getattr(last, "tool_calls", None):
               return END
           if state.get("tool_calls_made", 0) >= MAX_TOOL_CALLS:
               return END
           return "tools"

       graph = StateGraph(State)
       graph.add_node("assistant", assistant)
       graph.add_node("tools", tools)
       graph.add_edge(START, "assistant")
       graph.add_conditional_edges("assistant", route, {"tools": "tools", END: END})
       graph.add_edge("tools", "assistant")

       # A tool that writes, spends or sends needs a person between the model
       # and the action, and this is where that checkpoint goes:
       #
       #     return graph.compile(
       #         checkpointer=InMemorySaver(),
       #         interrupt_before=["tools"],
       #     )
       #
       # interrupt_before needs a checkpointer, because the graph has to be
       # able to stop and be resumed. The caller then invokes with a thread id,
       # shows the pending tool call to a person, and calls invoke(None, config)
       # to continue. Reading a note does not need this. The next tool might.
       return graph.compile()
   ```

   Verify: `test -f app/graph.py`

9. Create `tests/test_tools.py` with:

   ```python
   """The tool's refusals, which are the part that matters.

   A test that only proves the happy path proves that the tool works for the
   caller you trust.
   """

   from pathlib import Path

   import pytest

   from app.tools import ToolRefused, read_note


   def test_reads_a_note(tmp_path: Path) -> None:
       (tmp_path / "a.md").write_text("hello", encoding="utf8")

       assert read_note(tmp_path, "a.md") == "hello"


   @pytest.mark.parametrize("name", ["../secrets.env", "sub/a.md", "..\\a.md", ".hidden", ""])
   def test_refuses_anything_that_is_not_a_plain_name(tmp_path: Path, name: str) -> None:
       with pytest.raises(ToolRefused):
           read_note(tmp_path, name)


   def test_refuses_a_missing_note(tmp_path: Path) -> None:
       with pytest.raises(ToolRefused):
           read_note(tmp_path, "nope.md")


   def test_refuses_a_note_that_is_too_large(tmp_path: Path) -> None:
       (tmp_path / "big.md").write_bytes(b"x" * (64 * 1024 + 1))

       with pytest.raises(ToolRefused):
           read_note(tmp_path, "big.md")
   ```

   Verify: `test -f tests/test_tools.py`

10. Create `tests/test_graph.py` with:

    ```python
    """The whole graph, driven with a fake model.

    No API key, no network, no cost, and no flakiness from a model that
    answers differently on Tuesday. What is being tested here is the graph —
    routing, the tool node, the bound — and a fake model is the right way to
    test it, because the model's own judgement is not the thing under test.
    """

    from pathlib import Path

    from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
    from langchain_core.messages import AIMessage, HumanMessage

    from app.graph import build_graph


    def model_saying(*messages):
        return GenericFakeChatModel(messages=iter(messages))


    def test_answers_without_calling_a_tool(tmp_path: Path) -> None:
        graph = build_graph(model_saying(AIMessage(content="no tool needed")), tmp_path)

        out = graph.invoke({"messages": [HumanMessage(content="hi")], "tool_calls_made": 0})

        assert out["messages"][-1].content == "no tool needed"
        assert out["tool_calls_made"] == 0


    def test_calls_the_tool_then_answers(tmp_path: Path) -> None:
        (tmp_path / "a.md").write_text("the note body", encoding="utf8")
        call = AIMessage(
            content="",
            tool_calls=[{"name": "read_note", "args": {"name": "a.md"}, "id": "1"}],
        )
        graph = build_graph(model_saying(call, AIMessage(content="done")), tmp_path)

        out = graph.invoke({"messages": [HumanMessage(content="read a.md")], "tool_calls_made": 0})

        assert "the note body" in [m.content for m in out["messages"]]
        assert out["messages"][-1].content == "done"


    def test_a_refused_tool_call_becomes_a_message_not_a_crash(tmp_path: Path) -> None:
        # The model asking for something it may not have is normal, not
        # exceptional — including when a prompt injection is what asked.
        call = AIMessage(
            content="",
            tool_calls=[{"name": "read_note", "args": {"name": "../secrets.env"}, "id": "1"}],
        )
        graph = build_graph(model_saying(call, AIMessage(content="ok")), tmp_path)

        out = graph.invoke({"messages": [HumanMessage(content="read it")], "tool_calls_made": 0})

        assert any("refused" in str(m.content) for m in out["messages"])
    ```

    Verify: `test -f tests/test_graph.py`

11. Create `pytest.ini` with:

    ```ini
    [pytest]
    testpaths = tests
    ```

    Verify: `test -f pytest.ini`

12. Create `.gitignore` with:

    ```text
    .venv/
    __pycache__/
    *.pyc
    .pytest_cache/
    python.path
    .env*
    notes/
    ```

    Verify: `test -f .gitignore`

13. Create `.github/workflows/ci.yml` with:

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
          - run: pip install -r requirements-dev.txt
          # No API key is needed, and none is configured. A test suite that
          # requires a secret is a test suite that stops running on forks.
          - run: python -m pytest -q
    ```

    Verify: `test -f .github/workflows/ci.yml`

14. Create `README.md` with:

    ```markdown
    # agent

    An agent on LangGraph with one narrow tool and a bounded loop.

    ## Run it

    `build_graph(model, notes_root)` takes the model as a parameter. Supply a
    real one — `langchain-openai`, `langchain-anthropic` or another provider
    package — from your own configuration. None is installed here, because
    which provider you use is your decision and not this blueprint's.

    ## The tool is the security boundary

    See `AGENTS.md`. The short version: the model chooses the arguments, so
    the tool has to refuse in code what a prompt could otherwise talk it into.
    ```

    Verify: `test -f README.md`

15. Run the tests. There is no API key anywhere and there does not need to be: `"$(cat python.path)" -m pytest -q`
    Verify: `"$(cat python.path)" -m pytest -q`

16. Create `scripts/check_boundary.py` with:

    ```python
    """The assertion the whole blueprint rests on, outside the test suite.

    The tests prove this too. This exists so the check survives somebody
    deleting a test file, and so the setup itself fails rather than reporting
    success on an agent whose tool will read whatever it is asked to.
    """

    import sys
    from pathlib import Path

    from app.tools import ToolRefused, read_note

    ESCAPES = ["../etc/passwd", "sub/a.md", ".env", ""]

    for name in ESCAPES:
        try:
            read_note(Path("."), name)
        except ToolRefused:
            continue
        sys.exit(f"the tool accepted {name!r}, which it must not")

    print("the tool refuses every escape tried", file=sys.stderr)
    ```

    Verify: `test -f scripts/check_boundary.py`

17. Run it. `PYTHONPATH` because Python puts the script's own directory on the import path rather than the one you ran it from. This is the step that fails rather than reporting success on an agent whose tool will read whatever it is asked to: `PYTHONPATH="$PWD" "$(cat python.path)" scripts/check_boundary.py`
    Verify: `PYTHONPATH="$PWD" "$(cat python.path)" scripts/check_boundary.py`

18. Confirm no provider package is installed, so the claim that this runs without an API key is checked rather than asserted: `"$(cat python.path)" -m pip list --format=freeze > installed.txt`
    Verify: `grep -qvE "langchain-(openai|anthropic|google)" installed.txt`
