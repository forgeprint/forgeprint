# SaaS Launch Crew

_Assembled by @aliosmanmho_

Four specialists and two integrations, for the stretch between an empty
repository and a first paying customer. That stretch has a specific property:
almost every decision in it is cheap now and expensive once there is data, and
the ones you get wrong are not discovered until there is.

A crew composes and copies nothing. Editing any member below changes this crew,
because this file names them rather than containing them.

## Who is in it

| Expert                                                                      | What it brings                                                                           | The question it stops you skipping                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`dotnet-senior-architect`](../../experts/dotnet-senior-architect/SKILL.md) | The four decisions written down before code, and the dependency direction held by a test | What owns the data, and what a transaction spans          |
| [`sql-data-engineer`](../../experts/sql-data-engineer/SKILL.md)             | The grain of every table, and migrations in three deploys                                | How do you change this schema once it has customers in it |
| [`security-reviewer`](../../experts/security-reviewer/SKILL.md)             | Trust boundaries first, then object-level authorization                                  | Does this endpoint check that the row is _theirs_         |
| [`qa-automation-lead`](../../experts/qa-automation-lead/SKILL.md)           | A suite that is deterministic and whose green means something                            | Would the suite notice if you deleted a validation rule   |

## What they install

| Integration                                             | Why this crew wants it                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [`github-mcp`](../../integrations/github-mcp/README.md) | Issues, pull requests and Actions runs, so the agent works against the project's real state rather than a description of it |
| [`sentry-mcp`](../../integrations/sentry-mcp/README.md) | The actual error with its stack trace, once there are users producing errors                                                |

Both are third-party software with real permissions. Read each README before
installing — the GitHub token in particular reaches every repository it can
see, and Sentry events routinely contain user data.

## The order they are useful in

1. **Architect first**, before the first `dotnet new`. The persistence
   boundary, the public contract, the auth model and the process boundary are
   the four that cost weeks later, and three of them constrain the schema.
2. **Data engineer second**, on the schema those decisions imply — grain,
   keys, constraints — and on the tenant discriminator specifically, which is
   the column the security review will come back to.
3. **Security reviewer third**, once there are endpoints. Trust boundaries,
   then every read and write of an object. On a multi-tenant system this is the
   review that matters most and the one a scanner cannot do.
4. **QA lead alongside all three**, not after them. A suite written at the end
   tests what was built; a suite written alongside tests what was decided.

They disagree in two places, and the disagreement is useful:

- The architect wants one `SaveChangesAsync` per request; the data engineer
  wants migrations that leave the previous version running. Both are right and
  they constrain each other — resolve it in the ADR, not in the code review.
- The security reviewer will ask for the tenant check in a place the architect
  put business logic. The check belongs where it cannot be forgotten, which is
  usually lower than either of them wants it.

## Where this crew is wrong

- **A prototype or an internal tool.** Four experts on a project with no
  customers produce four opinions nobody has time to reconcile. Take the
  architect alone, and add the others when there is something to protect.
- **Single-tenant.** Half of what makes this crew coherent is the tenant
  boundary. Without one, the security reviewer and the data engineer are
  answering a much smaller question.
- **A stack that is not .NET.** Three of the four are stack-agnostic; the
  architect is not, and its commands are `dotnet`. The shape of the crew
  transfers; that member does not.
- **After launch.** This is assembled for the decisions taken before there is
  data. For a system already in production with users on it, the
  [`api-hardening-crew`](../api-hardening-crew/README.md) is the shape you
  want.

## How to use it

Ask your agent for the crew by name, then work through the members in the order
above. Nothing here is a requirement — a crew is a recommendation with a name
on it, and the person who assembled it is accountable for the recommendation
rather than for your project.
