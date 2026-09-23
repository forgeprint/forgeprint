# DevOps Platform Engineer

## What it changes

The pipeline is the most privileged thing most organisations own — write access
to the registry, credentials for production, and it runs code from every pull
request — and it is the part nobody reviews, because it is "just YAML". Four
things change with this expert:

- **Everything is pinned by digest, not by tag.** An action pinned to a tag lets
  a third party change what runs inside your build, with your credentials,
  after your review passed. The objection that this makes updates manual is
  answered by a bot raising pull requests, not by a floating tag.
- **The build has the least privilege that works**, declared per job, and no
  trigger lets a fork's pull request reach a secret. Untrusted input — a branch
  name, a title, an issue body — never reaches a shell step by interpolation.
- **Rollback is a tested path.** The plan says which command, how long, and
  what it does **not** undo: the migration, the consumed message, the sent
  email, the charged card. And somebody has actually performed it, following
  the written steps.
- **The SLO comes before the dashboard.** User journey, then indicator, then a
  number with a window, then an error budget. Pages fire on symptoms; every
  page has a runbook.

Five checklists — pipeline integrity, secrets in CI, container image, rollout
and rollback, SLO and alerting — and thirteen refusals.

## What it fits

- Writing or reviewing a CI pipeline, where the first question is which
  triggers run untrusted code with access to a secret.
- Containerising a service, or reviewing a Dockerfile against the
  image-and-Dockerfile half of the benchmark.
- Planning a release, and specifically planning what the rollback cannot undo.
- Defining an SLO, or cutting a dashboard down to something that answers a
  question.
- GitHub Actions directly. The principles hold anywhere; the syntax and the
  trigger names do not.

## What it does not fit

- **Infrastructure as code in depth.** It reviews what a pipeline does; it does
  not write Terraform modules or Kubernetes operators.
- **Cloud architecture.** Which managed service, which region, which network
  topology — a cloud architect's work, and the taxonomy has a role for it.
- **Application security.** The overlap is deliberate and one-directional: this
  expert checks the pipeline's own security, not the application's. Pair it
  with [`security-reviewer`](../security-reviewer/SKILL.md).
- **Incident command.** It writes runbooks; it does not run the incident.
- **Cost optimisation at scale.** A cost review here names where the spend is
  and what drives it. FinOps is a discipline, not a checklist item.
- **A project with no pipeline yet.** Most of this is overhead before there is
  something to deploy, and it will say so.

## Pros and cons

**In its favour:** it treats the pipeline as a production system rather than as
configuration, and almost every check is a grep or a question with a factual
answer. The rollback question — when was one last performed, by whom, following
what document — takes thirty seconds and predicts the worst outage better than
anything else on the list.

**Against it:** the pinning discipline has a real ongoing cost, and a team
without an update bot will find it painful rather than safe. It is GitHub
Actions-shaped in its specifics, so a reader on another platform has to
translate the trigger semantics, which is exactly the part that matters most.
And it overlaps three other experts at the edges — testing, security,
migrations — which is why `references.md` says explicitly where each boundary
is rather than letting them argue.
