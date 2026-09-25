# Tech Research Crew

_Assembled by @aliosmanmho_

Three experts for a technical decision that needs evidence from many places: a
library, a vendor, an approach. A researcher gathers and grades, a writer turns
it into a brief or an ADR, and a checker runs the claims the decision rests on.
It is the orchestrator-researchers-writer shape of Anthropic's research system
and the OpenAI research examples, with the verifier those examples add.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                            | What it brings                                                            | The question it asks first                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`research-engineer`](../../experts/research-engineer/SKILL.md)   | The question written first, a search log, every source graded and dated   | What exactly is being decided, and what would change the answer |
| [`technical-writer`](../../experts/technical-writer/SKILL.md)     | The brief or ADR, typed before its first sentence, shorter than the notes | Who reads this, and what do they do next                        |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md) | A small, deterministic check for each claim the decision depends on       | Which of these claims can be run, and did it hold               |

**The checking role is `qa-automation-lead`.** The research engineer checks its
own brief before handing it over, but a self-check is not verification — the
worker that did the work does not verify it
([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md), P2). The QA
lead takes the claims the recommendation rests on that can be executed — a
documented limit, a behaviour, a compatibility claim — and turns each into a
check that passes or fails the same way twice. A claim that cannot be run is
reported as unverified, not as confirmed.

There is no architect. In this catalog an architect is per language
([ADR 0015](../../docs/decisions/0015-experts-per-language.md)); if the
decision is architectural for one stack, add that architect.

## What they install

| Integration                                                 | Why this crew wants it                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`exa-mcp`](../../integrations/exa-mcp/README.md)           | Search and page content for the breadth-first half of the work                            |
| [`context7-mcp`](../../integrations/context7-mcp/README.md) | Library documentation at a stated version, so a claim about an API is about the right one |
| [`notion-mcp`](../../integrations/notion-mcp/README.md)     | Where the brief lives when the team keeps decisions outside the repository                |

All three are third-party software. Exa and Context7 send your query to their
services; Notion reads and writes the pages shared with it. Read each README
first, and keep anything confidential out of a search query.

## The order they are useful in

1. **Research engineer first.** The question in one file, the search log, the
   sources table with a grade and a date each, and `## Not found` and
   `## Not verified` headings that are allowed to be long.
2. **QA lead second**, on the claims the answer depends on. Each runnable claim
   gets a check; each result goes back into the sources table.
3. **Technical writer last**, turning the checked material into a brief or an
   ADR. Nothing the QA lead could not confirm is stated as fact.

They disagree in one place, and the disagreement is useful: the writer wants
the brief short, and the research engineer wants every disagreement between
sources reported. The disagreement stays — as one line and a link to the
sources table — because a decision taken without knowing the evidence was
split is a decision nobody can revisit.

## Why three, and why this shape

- Anthropic's lead-and-subagents research system beat a single agent by 90.2%
  on its internal research eval — and used about fifteen times the tokens of a
  chat. Research is the shape that earns that cost; a small question is not.
- MAST (Cemri et al.) found a fifth of multi-agent failures in task
  verification, and a high-level verification step the largest single fix
  measured (+15.6%). That is the QA lead's seat.
- Kim et al. measured sequential planning getting 39% to 70% worse with more
  agents. The writing half is sequential, so it is one member, not several.

## Where this crew is wrong

- **A question with one known answer.** One agent and one search. The crew
  spends fifteen times the tokens to reach the same line.
- **Anything that changes code.** This crew produces a document. Take the
  expert whose area the change is in.
- **A short note one agent can write in one pass.** Take the research engineer
  alone; its own checklist is enough.

## How to use it

Ask your agent for the crew by name, write the question down before the first
search, and do not let the writer start until the QA lead has marked each claim
checked, failed or not runnable.
