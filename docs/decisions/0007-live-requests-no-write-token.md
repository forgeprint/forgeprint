# 7. The request list is read live by the browser, not written by a workflow

- Status: Accepted
- Date: 2026-09-22
- Deciders: core maintainer
- Implements: CLAUDE.md §3.4, the public "requested blueprints" list

## Context

`request_blueprint` turns "nothing in the catalog fits" into a public issue,
and that queue is the signal the catalog grows by. It has to be visible on the
site, which is a set of static files served from a branch.

Three ways to get issues onto a static page:

1. **A scheduled workflow commits the list.** It needs `contents: write`, and
   `main` is protected by a ruleset that requires a pull request, a review from
   Code Owners and four status checks. So the workflow would need a token that
   bypasses all of that — a key with write access to the whole repository,
   created and stored so a list of issue titles can be refreshed. The blast
   radius of that key is the entire catalog; what it protects is a list nobody
   would miss for a week.
2. **The maintainer refreshes it by hand.** Safe, and always behind.
3. **The browser reads the issues API.** No token, no workflow, no write
   access anywhere. Unauthenticated requests are rate-limited per IP (60 an
   hour), and a reader who is over that limit, offline, or behind something
   that blocks the API gets nothing.

## Decision

**All three, in the order that makes each one's weakness somebody else's
strength.**

- The page ships with the committed snapshot from `docs/requests.json`,
  rendered as ordinary HTML. A reader with no JavaScript, no network and no
  patience sees a real list.
- The snapshot says **how old it is** — "Snapshot from 2026-09-22" — so it is
  never mistaken for the current queue. `renderRequests` therefore writes a
  `generated_on` date, which is the one place in the generated output where a
  date is allowed.
- On load the page reads the live list from
  `api.github.com/repos/forgeprint/forgeprint/issues?labels=blueprint-request&state=open`,
  and on success replaces the list and removes the snapshot note. The result is
  cached in `sessionStorage` for ten minutes, so moving around the site costs
  one request per tab, not one per page.
- On any failure — rate limit, offline, blocked — nothing happens: the dated
  snapshot stays.
- `forgeprint build-requests` refreshes the snapshot, by hand, and the
  [release checklist](../releasing.md) says to run it. It is deliberately
  **not** drift-checked: `validate` cannot regenerate a file that comes from
  outside the repository, and a stale queue is not a build failure.

**No token reaches the page, and no workflow gains write access.** That is the
point of the whole arrangement.

## Consequences

- Issue titles are written by whoever opened the issue, so the page builds
  every element with `createElement` and `textContent` and never assigns
  `innerHTML`. A link is only followed when its URL starts with
  `https://github.com/forgeprint/forgeprint/issues/`, and the issues endpoint's
  pull requests are filtered out. A test asserts both.
- The snapshot and the live list can disagree, which is correct: one is dated
  and the other is current.
- The rate limit is per reader, not per site, so it does not scale with
  traffic.
- If the list ever needs to be authenticated — private issues, or a filter the
  API cannot express — this decision is the thing to revisit, and the answer is
  probably still not a write token.

## Verified

2026-09-22, against the built site served locally:

| Check | Result |
| --- | --- |
| `GET api.github.com/.../issues?labels=blueprint-request&state=open` from the page | 200, list rendered, snapshot note removed |
| `sessionStorage` after the fetch | `{"at":…,"items":[]}` |
| Reload inside ten minutes | served from the cache, no second request |
| An issue title of `<img src=x onerror=alert(1)>` | rendered as text; no element injected |
