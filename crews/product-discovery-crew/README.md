# Product Discovery Crew

_Assembled by @aliosmanmho_

Four experts for the stretch before any code: an idea turned into a brief with
a problem somebody could disagree with, tested against real users by method
rather than taste, written down as requirements a tester could fail, and
planned with its assumptions approved. It is the Analyst-to-PM shape BMAD,
MetaGPT and spec-kit's `specify` and `clarify` steps ship, with a checker in
it.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                          | What it brings                                                              | The question it asks first                                 |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`product-manager`](../../experts/product-manager/SKILL.md)                     | The problem before the solution, and a metric that could come back negative | Who has this problem, how often, and what do they do today |
| [`ux-researcher`](../../experts/ux-researcher/SKILL.md)                         | A research plan, success criteria fixed before sessions, consent first      | What would we have to see to decide this is not a problem  |
| [`business-analyst`](../../experts/business-analyst/SKILL.md)                   | Requirements that are sourced, singular and traced both ways                | Could a tester fail this requirement as written            |
| [`technical-program-manager`](../../experts/technical-program-manager/SKILL.md) | The epics as a delivery plan, and the assumption log put to the user        | Which assumption, if wrong, would mean redoing a branch    |

**The checking role is `business-analyst`.** It checks the product manager's
stories against its requirement-quality and acceptance-criteria checklists:
a story a tester could not fail goes back, split or rewritten, with the reason.

## What they install

| Integration                                                   | Why this crew wants it                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`notion-mcp`](../../integrations/notion-mcp/README.md)       | The brief, the research plan and the findings, where the team already reads them |
| [`exa-mcp`](../../integrations/exa-mcp/README.md)             | Desk research on the market and the workarounds people use today                 |
| [`atlassian-mcp`](../../integrations/atlassian-mcp/README.md) | The epics and stories as Jira work items, and the specs as Confluence pages      |

All three are third-party software. The Atlassian server creates and edits work
items and pages with the signed-in user's own permissions, not only reads them;
Notion reads and writes what is shared with it; Exa sends the query to its
service. Read each README first, and keep participant data out of all three.

## The order they are useful in

1. **Product manager first**: the four answers about the problem, a metric with
   a counter-metric, and what is not being built.
2. **UX researcher second**, testing the problem statement with users: the
   plan and success criteria written before the first session, consent before
   anything is recorded, observations kept apart from interpretation.
3. **Business analyst third**: requirements and acceptance criteria from the
   brief and the findings, each traced to its source, and the PM's stories
   checked against them.
4. **Technical program manager last**: the epics as a plan, every critical
   assumption put to the user in one list before anything is built on it.

They disagree in two places, and the disagreement is useful:

- The product manager wants the metric to move; the UX researcher's five
  sessions find problems but measure nothing. The researcher's sample-size
  checklist says what the study can claim, and the brief quotes that limit.
- The business analyst will split a story the product manager wrote as one.
  Both are right: the PM's version says why; the analyst's version says what a
  tester checks. Keep both, linked.

## Why four, in sequence

- Kim et al. measured sequential planning getting 39% to 70% worse with more
  agents. Discovery is sequential — each member needs the previous one's file
  — so the members hand over in order.
- MAST (Cemri et al.) found sharper role specifications worth +9.4%. These four
  do not overlap: problem, evidence, requirement, plan.

## Where this crew is wrong

- **Implementation.** It produces documents, not code. For the build, the
  `spec-driven-feature-crew` picks up
  where this one stops.
- **A mature product with a settled backlog.** The discovery has been done.
- **A single small story.** One product manager writes it in one pass.

## How to use it

Ask your agent for the crew by name, write the problem in one sentence somebody
could disagree with, and do not let the business analyst start until the
research findings exist as a file.
