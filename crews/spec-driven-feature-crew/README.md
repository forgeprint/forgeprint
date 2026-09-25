# Spec-Driven Feature Crew

_Assembled by @aliosmanmho_

Four experts for one feature, taken the long way on purpose: a spec before a
plan, a plan before code, a failing test before each change, and a check at the
end that the builder did not run. It is the shape spec-kit, BMAD, MetaGPT and
the official `feature-dev` plugin all ship — roles in sequence, each handing a
document to the next.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                          | What it brings                                                                   | The question it asks first                                            |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`product-manager`](../../experts/product-manager/SKILL.md)                     | The problem before the solution, and acceptance criteria somebody could fail     | What result would mean this feature did not work                      |
| [`technical-program-manager`](../../experts/technical-program-manager/SKILL.md) | The spec as a file with section numbers, a task graph, and an assumption log     | Is the plan wide enough to split at all, or is it one agent, in order |
| [`test-engineer`](../../experts/test-engineer/SKILL.md)                         | One failing example before each change, cases derived by a named technique       | Which scenario on the list fails first, and for the reason expected   |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)               | The end-to-end check against the acceptance criteria, and what a red build means | Would the suite notice if the feature were deleted                    |

**The checking role is `qa-automation-lead`.** It verifies against the product
manager's acceptance criteria, not against the builder's account of what was
built. That is the technical program manager's own rule — nothing is done until
something other than the worker has checked it — given a member of its own.

The test engineer and the QA lead are both about tests, and the line between
them is written into each: the test engineer works inside the code, one unit
and one change at a time; the QA lead owns the journeys across the system and
the gate. One is the maker's discipline, the other is the checker.

There is no architect. In this catalog an architect is per language
([ADR 0015](../../docs/decisions/0015-experts-per-language.md)), and this crew
is not tied to one. If the feature moves a boundary — a new service, a new
store, a changed public contract — load the architect for your stack alongside
it.

## What they install

| Integration                                                 | Why this crew wants it                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`github-mcp`](../../integrations/github-mcp/README.md)     | The spec, the plan and the review live as an issue and a pull request, where the next member reads them as files           |
| [`context7-mcp`](../../integrations/context7-mcp/README.md) | Library documentation at the version the project actually pins, so the plan and the tests are written against the real API |

Both are third-party software. Read each README first — the GitHub token reaches
every repository it can see, and Context7 sends the library name and your query
to its service.

## The order they are useful in

1. **Product manager first.** A brief whose problem statement somebody could
   disagree with, a metric that could come back negative, acceptance criteria a
   tester could fail, and a list of what is not being built. Nothing below
   starts until those exist as a file.
2. **Technical program manager second.** The request kept verbatim, the spec
   numbered `S1`, `S2`, the task graph drawn and its width counted, and every
   critical assumption put to the user before anyone builds on it. If the width
   is one, it says so, and the rest of the crew is run by one agent in order.
3. **Test engineer third**, doing the build: one scenario at a time, red for
   the expected reason, green with the least code, refactor with the bar green.
   Each task points at the spec section it implements.
4. **QA lead last**, against the acceptance criteria from step 1 rather than
   against the plan from step 2. A criterion with no check that could fail is
   reported as unverified, not as passed.

Each hand-off is a file — the brief, the plan, the diff, the report — not a
summary. A request retold three times is three requests.

They disagree in two places, and the disagreement is useful:

- The product manager writes the whole scope; the technical program manager
  will not let a critical assumption in it reach the build until the user has
  approved it. The brief is not wrong for containing the guess, and the plan is
  not slow for stopping on it. Resolve it by asking the user once, with every
  open assumption on one list.
- The test engineer's suite goes green with doubles at the boundaries; the QA
  lead does not count a criterion as met until a journey through the real
  system shows it. Both are right about their own layer. A unit that passes
  against a fake the real adapter does not match is exactly what the last step
  is there to catch.

## Why four, and why in sequence

- The failure study behind the technical program manager (Cemri et al., MAST)
  read more than 1,600 multi-agent traces and found failure rates from 41% to
  86.7%. A fifth of the failures were in verification, and adding a high-level
  verification step was the largest single fix it measured, +15.6%. That is why
  the checker is a member of its own and not a step the builder performs.
- The same study found sharper role specifications worth +9.4%. Four members
  whose jobs do not overlap is the point; a fifth would have to overlap one of
  them.
- Kim et al. ("Towards a Science of Scaling Agent Systems") measured multi-agent
  set-ups from +80.8% on decomposable work to −39% to −70% on sequential
  planning, and errors amplified 17.2 times with independent agents. A feature
  is mostly sequential. This crew is four sets of checklists one agent loads in
  turn, not four agents working side by side
  ([ADR 0014](../../docs/decisions/0014-crew-runtime-deferred.md)).

## Where this crew is wrong

- **A one-line fix, or a change confined to one file.** The brief, the plan and
  the hand-offs cost more than the change. Take the test engineer alone: a
  failing test, the fix, the bar green.
- **A prototype with no spec.** If the point is to find out what the feature
  should be, acceptance criteria written now will be wrong, and the crew will
  hold the code to them.
- **A project with no tests.** The build step and the check step both assume a
  suite. Start with the QA lead alone and a test plan.
- **Several features at once, split across agents.** That is the parallel shape
  the evidence above warns against, and it waits for Scenario D.

## How to use it

Ask your agent for the crew by name, then run the members in the order above,
one at a time, each reading the previous one's file. If the technical program
manager's width count comes back as one — and for most features it will — that
is the answer working, not the crew failing.
