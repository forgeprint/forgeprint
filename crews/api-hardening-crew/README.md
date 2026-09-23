# API Hardening Crew

_Assembled by @aliosmanmho_

Three specialists for an API that already has users. The work here is not
deciding what to build — that decision was taken and it is living in
production. It is finding what is wrong with it, and making the next change
survivable.

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                        | What it brings                                                            | The question it asks first                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`security-reviewer`](../../experts/security-reviewer/SKILL.md)               | Trust boundaries, then every read and write of an object                  | Which endpoint checks that you are logged in and never checks that the row is yours |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)             | A deterministic suite whose green means something                         | Does the suite go red when you delete a validation rule                             |
| [`devops-platform-engineer`](../../experts/devops-platform-engineer/SKILL.md) | Pinned pipeline, least-privilege build, a rollback somebody has performed | When was a rollback last performed, by whom, following what document                |

Three rather than four, and deliberately. Each of those three questions has a
factual answer that somebody either has or does not have, and finding out which
takes an afternoon.

## What they install

| Integration                                                     | Why this crew wants it                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`github-mcp`](../../integrations/github-mcp/README.md)         | The pipeline, its runs and its permissions are what the platform engineer reviews, and they live in the repository |
| [`playwright-mcp`](../../integrations/playwright-mcp/README.md) | End-to-end checks against a running instance, which is where the QA lead's critical-path layer actually goes       |

Both are third-party software. Read each README first — Playwright drives a
real browser with the agent's instructions and no human between the two, so
point it at a development environment rather than at a session logged in to
anything.

## The order they are useful in

1. **Security reviewer first**, and specifically object-level authorization.
   It is the most common real API vulnerability, it is invisible to a scanner,
   and everything else can wait a week. Find the endpoint that lacks the check
   rather than admiring the one that has it.
2. **Platform engineer second**, starting with the pipeline triggers. Does any
   of them run untrusted code with access to a secret? That question has a
   yes-or-no answer and it outranks the rest of the review.
3. **QA lead third**, because the first two will produce changes and the suite
   is what makes those changes safe. Run it shuffled, run it in parallel, then
   delete a validation rule and see whether it notices.

They overlap in one place on purpose. The platform engineer reviews the
pipeline's own security; the security reviewer reviews the application's. Both
will look at secrets, from different ends, and the finding that matters is
usually at the join.

## Where this crew is wrong

- **Greenfield.** Nothing to harden, and the decisions worth taking are
  architectural. Start with the
  [`saas-launch-crew`](../saas-launch-crew/README.md) instead.
- **A system with no users.** Two of the three questions above become
  hypothetical, and a hypothetical answer costs the same effort and is worth
  less.
- **When you already know what is wrong.** If the finding is identified and the
  work is fixing it, a crew is overhead. Take the one expert whose area it is.
- **As a substitute for a penetration test.** This crew reads. It does not
  probe a live system, and the security reviewer refuses to.

## How to use it

Ask your agent for the crew by name, then take the three questions in the table
above and answer them before doing anything else. If all three have good
answers, the crew has already told you something valuable and you can stop.
