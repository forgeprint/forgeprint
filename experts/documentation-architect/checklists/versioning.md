# Versioning

Which product versions have documentation, which one a reader lands on, and
what an old page tells the person who arrives at it from a search.

| #   | Check                                                                                                    | How                                                                  | Source                              |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| V1  | A written policy says which versions are documented, derived from the supported-versions list            | find the policy; compare it with `SECURITY.md` or the release policy | Read the Docs — Versions            |
| V2  | Documentation is versioned per major version where behaviour is incompatible                             | read the switcher; one entry per supported major                     | Semantic Versioning 2.0.0, §8       |
| V3  | The default version is the latest stable release, not the default branch                                 | open the site root; note which version it serves                     | Read the Docs — Versions (`stable`) |
| V4  | Non-stable versions carry a banner saying so                                                             | open an old and an unreleased version                                | Read the Docs — Versions (warnings) |
| V5  | Unsupported versions are hidden from navigation and search, not deleted                                  | an old version's URL still resolves; it is absent from the switcher  | Read the Docs — Versions (hidden)   |
| V6  | A page whose behaviour differs by version names the version it was checked against                       | grep the pages that mention a version for a stated one               | Semantic Versioning 2.0.0           |
| V7  | User-visible changes per version are in the changelog, and pages link to it instead of narrating history | grep pages for "used to" and "previously"                            | Keep a Changelog 1.1.0              |

## Why each one

**V5 protects every inbound link.** Deleting an old version turns years of
search results and forum answers into 404s; hiding it with a banner keeps them
working while telling the reader where the current page is.

**V3** decides what most readers see. A site that serves the default branch
documents features that have not shipped, to people running the release.

**V1** is the row that makes the rest decidable: without a policy, every old
version is kept forever or dropped by whoever is annoyed first.
