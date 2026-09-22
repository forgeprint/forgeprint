# 4. The catalog is English only; localization happens in the user's agent

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer

## Context

Forgeprint's users speak many languages, and a blueprint they cannot read is a
blueprint they will not trust. The obvious answer — translate the catalog — is a
trap. Every translated `manifest.yaml`, `setup.md`, and `AGENTS.md` doubles the
review surface, and translations go stale silently: a setup step fixed in
English stays broken in five other languages, and CI cannot tell which copy is
authoritative. Matching would also have to run against translated tag values,
which breaks the controlled taxonomy.

There is a property of this product that makes translation unnecessary.
Forgeprint never talks to a human. It returns structured data to the user's
coding agent, and that agent already speaks the user's language.

## Decision

All catalog content is written in English: blueprints, manifests, resolver
questions, rationales, and comparisons. The taxonomy has English values only.

`resolve`, `get_blueprint`, and `compare_blueprints` accept an optional `locale`
hint. The server does not translate anything; it echoes the hint back in
`_meta.present_in` so the calling agent knows which language to present its
answer in. Presentation is the agent's job, translation is not the catalog's.

Community translations are permitted in exactly one place:
`blueprints/<slug>/i18n/<lang>/overview.md`. They are never required, never
consumed by `resolve`, and never affect matching. Each translation records the
English `version` it was made from; when the English version moves ahead, the
index and the site mark the translation `stale` until it is updated.

The Pages site translates its own chrome — navigation, buttons, labels — only.
Blueprint pages stay English and rely on the reader's browser translation.

## Consequences

- One authoritative copy of every file. A fix lands once.
- The user still experiences Forgeprint in their own language, because their
  agent answers in it.
- Matching stays deterministic: tag values come from one controlled English
  vocabulary.
- Contributors must write English. This raises the bar for some authors, and
  `blueprint-author` helps by generating the draft from an existing project.
- Translated overviews carry a visible staleness signal instead of quietly
  drifting.
