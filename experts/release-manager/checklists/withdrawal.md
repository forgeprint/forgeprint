# Withdrawal

A published version is immutable. Withdrawing it means warning people off it
and publishing a fix — planned before the release, not invented during one.

| #   | Check                                                                                   | How                                                                              | Source                                 |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| W1  | The release plan names the withdrawal command before publishing                         | the plan contains the exact `npm deprecate` or yank step for this version        | Semantic Versioning 2.0.0, rule 3      |
| W2  | On npm, withdrawal is `npm deprecate <pkg>@X.Y.Z "<reason>"`, not `npm unpublish`       | read the runbook's withdrawal step                                               | npm Docs — unpublish policy            |
| W3  | Nobody plans to reuse a withdrawn number                                                | the runbook says the fix is `X.Y.Z+1`; npm forbids reuse even after unpublishing | npm Docs — unpublish policy            |
| W4  | On PyPI, withdrawal is a yank, and the plan notes that `==` pins still install it       | read the runbook                                                                 | PEP 592 (Final)                        |
| W5  | The plan names who holds the permission to deprecate or yank, and it is not one person  | read the plan; check the registry's maintainer list                              | NIST SSDF SP 800-218 v1.1, RV.1.3      |
| W6  | The plan says what withdrawal does not undo: existing installs, lockfiles, written data | read the plan's limits section                                                   | PEP 592; npm Docs — unpublish policy   |
| W7  | The withdrawn version is marked `[YANKED]` in the changelog                             | `grep -n '\[YANKED\]' CHANGELOG.md` after a withdrawal                           | Keep a Changelog 1.1.0                 |
| W8  | Rolling back a running deployment is handed to the platform plan, not improvised here   | the release plan links the deployment's rollback, owned elsewhere                | ADR 0012 (experts name their boundary) |

## Why each one

**W2** is the most common wrong instinct. Unpublishing breaks every consumer who
already pinned the version, and npm permanently burns the number. Deprecation
warns new installs and leaves existing ones working.

**W6** is the half nobody writes down. A withdrawn version has already been
installed; the plan says so, so the release note tells people to upgrade rather
than implying the problem went away.

**W8** keeps two operations apart that fail differently: a registry withdrawal
cannot take code off a running server, and a deployment rollback cannot take a
version off a registry.
