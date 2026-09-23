# Changelog — forgeprint-mcp

The MCP server. It installs nothing and runs nothing: every tool returns text,
and blueprint content is data rather than instructions for the agent
(rules 21 and 22).

## 0.3.0 — 2026-09-24

Four new tools, for the two questions the catalog answers besides "what are you
building" (ADR 0012).

- **`recommend_experts`** returns at most one crew **or** at most three
  experts, each with a reason, and says how many it left out. A crew wins only
  when the task is plainly the whole job it is assembled for.
- **`get_expert`** returns the manifest, `SKILL.md`, the checklists and the
  references, plus the file paths the named agent reads.
- **`get_crew`** resolves members to full entries and returns the install
  command for each integration, for that agent.
- **`get_integration`** returns the pinned upstream, the permissions, the
  secrets and the install command — and says so plainly when an agent has no
  verified syntax, rather than guessing one.
- **`resolve` gains `intent`**, which routes rather than answers. This tool
  returns one blueprint or nothing; handing back an expert would break that
  rule quietly, so a non-project intent comes back as "use this tool, pass
  this".

`FORGEPRINT_FILES_URL` now points at the repository root rather than at
`blueprints/`, because reading a file needs a kind.

## 0.2.10 — 2026-09-23

- No change to the server. The version follows the workspace.

## 0.2.9 — 2026-09-23

- No change to the server. The version follows the workspace.

## 0.2.8 — 2026-09-23

- **`suggested_alongside` in `get_blueprint`, `resolve` and
  `compare_blueprints`.** A blueprint's `provides.mcp` and `provides.skills`
  have been in the schema and the index since the first version and were read
  by nothing, so a blueprint could name the MCP servers it expects and the
  agent would never hear about them — while CLAUDE.md §3.3 says `get_blueprint`
  returns exactly that. Absent rather than empty: a blueprint that suggests
  nothing says nothing.

## 0.2.7 — 2026-09-23

- **A generated blueprint says so in `tier_note`**: _"Generated, CI-tested, not
  manually verified."_ It appears in `get_blueprint`, `resolve` and
  `compare_blueprints`, alongside the community note where both apply, so an
  agent can tell the user which kind of confidence is on offer before it starts
  following the recipe (ADR 0011).

## 0.2.6 — 2026-09-22

- No change to the server. The release is `forgeprint release`, and the version
  follows the workspace.

## 0.2.5 — 2026-09-22

- No change to the server. The catalog it serves gained `fastapi-service`, its
  first blueprint in Python, and the version follows the workspace.

## 0.2.4 — 2026-09-22

- No change to the server. The catalog it serves gained `ts-mcp-server`, and
  the version follows the workspace.

## 0.2.3 — 2026-09-22

Hardening the resolver along the two failure classes the dogfood run exposed,
rather than the two instances of them.

- **A value in the wrong field is scored from the right one.** "SaaS" arrived
  as a requirement — a reasonable mistake, it is a distribution model — and was
  scored as a requirement nothing covers, so a multi-tenant SaaS blueprint was
  reported as not covering SaaS. A value the caller's field does not know but
  exactly one other vocabulary does is moved there, scored there, and reported
  as `moved_to_the_right_field`: "requirements: SaaS → did you mean
  distribution: saas?". A spelling two vocabularies both claim is left alone,
  because moving it would be a guess.
- **Spellings.** `schema/taxonomy.yaml` gains an `aliases` section: `golang`
  for `go`, `k8s` for `kubernetes`, `multi-tenancy` for `multi-tenant`,
  `authentication` for `auth`. Not new values — the vocabularies stay closed
  (rule 8) and an alias pointing at a missing id is refused. Separator folding
  now covers the dot as well, so `Node.js`, `node-js` and `nodejs` are one
  thing, and `.NET` reaches `dotnet`.
- **`resolve` accepts a `stack`.** It was in the scoring weights and in the
  profile type but not in the tool's input schema, so a stack an agent sent was
  dropped before anything could score it.
- **A goal that says nothing is a question again.** "hi" was treated as a
  stated goal, which let the resolver normalise a score over one criterion and
  return whatever blueprint was written in the right language. A goal of fewer
  than three words now counts only when one of them is a term the catalog
  knows, so "a CLI" is an answer and "hi" is not.
- **No more questions that cannot change the answer.** When the catalog holds
  nothing in a language the user stated, the resolver said so only after asking
  about platforms and distribution first. It now goes straight to `no_match`:
  language is the heaviest criterion, and no answer to any other question can
  move it.

The table in `resolve.test.ts` is the specification for all of this: fifteen
profiles, each with the answer it must produce, and the rule they all share —
one blueprint, or a question, never an invented match.

## 0.2.2 — 2026-09-22

Found by the dogfood test, on the first sentence a first-time user types.

- **`resolve` and `search_blueprints` now accept a taxonomy label where they
  previously demanded the identifier.** "I know C#" reached the resolver as
  `languages: ["C#"]`, the catalog stores `csharp`, and the heaviest criterion
  scored zero: the answer came back as `no_match`, or as a match whose
  reasoning said "written in C#, which you did not list" and had to be
  explained away. Both spellings are understood now, for languages, stack,
  project type, platforms, distribution and requirements, folding case and the
  separators people vary on — never a word, so `db-per-tenant` can never reach
  `per-tenant`.
- A value that matches nothing comes back in `unrecognised_values` instead of
  being scored as a silent zero, and the `no_match` instruction tells the agent
  to check it before reporting that the catalog has nothing.
- The input schemas say so: ids or labels, `["csharp"]` and `["C#"]` alike.
- **The resolver reads the requirements out of the goal sentence.** "I'm
  building a multi-tenant SaaS API" put the decisive word in the weakest field
  — free text is worth four points against forty for a language — so two
  blueprints landed within three points of each other and the user was asked to
  choose between them over a word they had already said. A requirement named in
  the sentence now counts as stated, and `read_from_your_description` says
  which ones, so a wrong reading is visible rather than silent. "not
  multi-tenant" and "no authentication" are not requirements: a negation within
  four words suppresses the match. Only requirements are read this way;
  guessing a language or a platform from prose would be guessing.

## 0.2.1 — 2026-09-22

- `mcpName` in the package manifest, which is how the official MCP registry
  verifies that this npm package belongs to the server it lists. No behaviour
  changed; the version moves so the published package carries the field.

## 0.2.0 — 2026-09-22

No tool behaviour changed. The version moves with the workspace so that a
report can name one number, and the server now ships against `forgeprint`
0.2.0.

- The catalog the server serves is the one whose recipes are executed in CI:
  all three blueprints are at 1.0.1, verified end to end across every option
  combination.
- `SERVER_VERSION`, which a client reads in the MCP handshake, reported `0.1.0`
  whatever was installed. It now reports the package version, and a test keeps
  the two in step.

## 0.1.1 — 2026-09-22

- Depends on the CLI by its published name, `forgeprint`. `0.1.0` depended on
  `@forgeprint/cli`, which does not exist, so `npx forgeprint-mcp` could not
  install; it is deprecated on npm.

## 0.1.0 — 2026-09-22

First release. Six tools over stdio, with the published catalog index as the
data source and the repository as a fallback.

- `resolve` — a profile in, **one** blueprint out, or the questions to ask
  first. It asks in rounds: what is required before what merely
  discriminates, and only between candidates that are genuinely tied. It never
  returns a second blueprint, and when nothing fits it says so and names the
  closest one and why it does not.
- `search_blueprints`, `get_blueprint` (with options resolved in `setup.md`),
  `compare_blueprints`, `validate_blueprint`, `request_blueprint`.
- `_meta` on every response: `content_is_data`, the catalog it came from, and
  the locale the agent should present in. The catalog itself stays English
  (§9).
