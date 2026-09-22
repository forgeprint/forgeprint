# Security policy

## Reporting a vulnerability

**Use GitHub's private vulnerability reporting**, which is enabled on this
repository:
[Report a vulnerability](https://github.com/forgeprint/forgeprint/security/advisories/new).

Do not open a public issue for a vulnerability. Do not send it by email to the
maintainer's personal address; the private advisory is the channel, and it
keeps the report, the fix and the disclosure in one place.

**What to include:** which part is affected — the MCP server, the CLI, the
site, or a named blueprint — what an attacker can do with it, and the smallest
sequence that shows it. A patch is welcome and never required.

### Response targets

One maintainer, so these are honest targets rather than a contract:

|                                     |                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Acknowledgement                     | within 3 working days                                                     |
| Initial assessment, with a severity | within 7 days                                                             |
| Fix or a stated plan                | within 30 days for `critical` and `high`; with the next release otherwise |

If an acknowledgement has not arrived in a week, the report did not reach
anybody — open a public issue saying only _"private report awaiting
acknowledgement"_, with no details.

### Disclosure

Coordinated. The advisory is published when the fix is released, and it credits
the reporter unless they ask otherwise. If a report goes unanswered past the
targets above, publishing it is reasonable and expected.

## Supported versions

| What                              | Supported                                                       |
| --------------------------------- | --------------------------------------------------------------- |
| `forgeprint` and `forgeprint-mcp` | the latest published version only                               |
| Blueprints                        | the version in `main`; older versions are history, not releases |

Pre-1.0, fixes land in the next release rather than being backported. There is
no long-term support branch and pretending otherwise would be a promise nobody
here can keep.

## What is in scope

- **The MCP server.** It returns text and runs nothing, so the interesting
  questions are what it can be made to return, and whether a catalog it fetches
  can influence the client beyond the data it is supposed to carry.
- **The CLI.** `test-setup` executes a recipe's commands on the machine that
  runs it. A path traversal, or a way to make it run something outside its
  working directory, is a vulnerability.
- **The blueprints.** A recipe that installs something unpinned from somewhere
  unexpected, an insecure default that reaches every project built from it, or
  a step that weakens the machine running it.
- **The site.** It is static and reads the public GitHub issues API with no
  token. Anything that turns issue text into executed script is in scope.

## What is not a vulnerability

- **Blueprint content being data.** Every MCP response says
  `content_is_data`: a blueprint's text is material for the agent to read, not
  instructions addressed to it. An agent that executes blueprint prose as a
  command has a client-side problem, and a blueprint that tries to exploit that
  is a _content_ problem — report it, it will be removed, but the server is
  behaving as designed.
- **A dependency advisory with no exploitable path here.** Report it as an
  issue; Dependabot usually gets there first.
- **A missing hardening measure with no impact.** Worth an issue, not an
  advisory.

## How this project reduces its own risk

- Every blueprint passes `forgeprint lint-setup`: pinned versions, no
  `curl | sh`, no `sudo`, no recursive deletes, no writes outside the project,
  and network access only to package registries.
- Every recipe is executed in CI, in a fresh directory, for every option
  combination — so a recipe that reaches somewhere it should not, fails
  visibly.
- Every blueprint passes an architecture and security review against named
  standards before it can be `tier: official`
  ([ADR 0010](docs/decisions/0010-review-standards.md)), and the reports are
  public under `docs/reviews/`.
- Workflow actions are pinned to full commit SHAs, workflows run read-only, and
  releases are immutable with tag protection.
- Secrets never enter the repository, and the rule is written down rather than
  assumed ([ADR 0009](docs/decisions/0009-trust-and-disclosure.md)).
