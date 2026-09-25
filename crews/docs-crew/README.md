# Docs Crew

_Assembled by @aliosmanmho_

Three experts for the documentation of a codebase or SDK: the shape of the set
held by files and CI, an API reference generated from a linted contract, and
guides, tutorials and ADRs whose samples were run. There is no developer
advocate in it on purpose; that role is marketing more than documentation
([expansion plan](../../docs/research/2026-09-24-expansion-plan.md), D19).

A crew composes and copies nothing. Editing any member below changes this crew.

## Who is in it

| Expert                                                                      | What it brings                                                                     | The question it asks first                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`documentation-architect`](../../experts/documentation-architect/SKILL.md) | Typed sections, no orphan pages, docs in the same PR as code, a failing docs build | Which type is this page, and what links to it             |
| [`api-designer`](../../experts/api-designer/SKILL.md)                       | The OpenAPI document, linted, as the one source of the reference                   | Does the reference come from the contract, or from memory |
| [`technical-writer`](../../experts/technical-writer/SKILL.md)               | Pages written for the reader's task, every sample run, more deleted than added     | Who reads this, and what are they trying to do            |

**The checking role is `documentation-architect`.** The writer writes; the
architect's docs build is what fails when a page has no type, no inbound link,
a broken link or a sample that no longer runs. The architect does not write the
pages it checks.

There is no architect for the code. In this catalog a software architect is per
language ([ADR 0015](../../docs/decisions/0015-experts-per-language.md)); add
the one for your stack if the docs include architecture decisions for it.

## What they install

| Integration                                                 | Why this crew wants it                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`context7-mcp`](../../integrations/context7-mcp/README.md) | Documentation of the libraries the samples use, at the versions the project pins      |
| [`github-mcp`](../../integrations/github-mcp/README.md)     | Docs change in the pull request that changes the code; this is where both are visible |

Both are third-party software. Context7 sends your query to its service; the
GitHub token reaches every repository it can see. Read each README first.

## The order they are useful in

1. **Documentation architect first**: the information architecture, the page
   types, where the docs live, and a docs build CI can fail.
2. **API designer second**: the OpenAPI document linted, so the reference is
   generated rather than written.
3. **Technical writer third**: tutorials, how-to guides, explanations and
   ADRs, each typed before its first sentence, each sample run.
4. **Documentation architect last**: the docs build over the whole set.

They disagree in two places, and the disagreement is useful:

- The writer deletes more than it adds; the architect's structure wants a page
  for every type. Resolve it per page: a section with nothing a reader needs is
  deleted, not filled.
- The API designer wants every endpoint described only in the contract; the
  writer wants to explain it in prose. Both, but never the same fact twice:
  what a field is lives in the contract, why you would use it lives in a guide.

## Why three

- Writing is sequential. Kim et al. measured sequential work getting 39% to 70%
  worse with more agents, and the crews research noted two members may be
  enough for documentation. Three is the smallest set with a checker that did
  not write the pages.
- MAST (Cemri et al.) found a fifth of multi-agent failures in verification. A
  docs build that fails is a verification step nobody has to remember.

## Where this crew is wrong

- **Marketing copy.** No member here writes it.
- **Translation.** The catalog is English-only, and so is this crew.
- **Fixing one page or one README.** Small, same-file work for the technical
  writer alone.

## How to use it

Ask your agent for the crew by name, let the architect set the page types
first, and treat a red docs build the way you treat a red test.
