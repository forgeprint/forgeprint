# Composer discipline

Composer is the only build a PHP application has. What it resolves, for which
PHP, and what it is allowed to run during an install are architecture
decisions whether or not anybody took them.

| #   | Check                                                                                 | How                                                         | Source                                       |
| --- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| CD1 | `composer.lock` is committed for an application                                       | `git ls-files composer.lock` prints the file                | Composer 2.10 — basic usage: commit the lock |
| CD2 | CI and deploy run `composer install`, never `composer update`                         | grep the workflow and deploy scripts for `composer update`  | Composer 2.10 — basic usage                  |
| CD3 | `config.platform.php` is set to the production PHP version                            | read `composer.json` `config.platform`                      | Composer 2.10 — config: `platform`           |
| CD4 | `require.php` is a constraint matching the ADR's PHP line, and that line is supported | read `require.php`; compare with php.net supported versions | PHP supported versions (php.net)             |
| CD5 | The production image satisfies the platform                                           | `composer check-platform-reqs --no-dev` inside the image    | Composer 2.10 — CLI: `check-platform-reqs`   |
| CD6 | `composer validate --strict` passes                                                   | run it                                                      | Composer 2.10 — CLI: `validate`              |
| CD7 | `composer audit --locked` runs in CI and fails the job on a finding                   | read the workflow; the step has no `\|\| true`              | Composer 2.10 — CLI: `audit`                 |
| CD8 | The dependency policy is not disabled                                                 | `grep -n '"policy": false' composer.json` returns nothing   | Composer 2.10 — config: `policy`             |
| CD9 | `allow-plugins` names each plugin; it is never `true` for all                         | read `config.allow-plugins`                                 | Composer 2.10 — config: `allow-plugins`      |

## Why each one

**CD3** is the row a developer's laptop breaks. Without it, a developer on PHP
8.5 runs `composer update`, Composer picks versions that need 8.5, the lock is
committed, and production on 8.4 fails at install — or worse, at the first
call into the new code path. The platform pin makes the lock describe
production.

**CD8** because Composer 2.10 blocks versions with active security advisories
during `update` and `require` by default. A single `"policy": false` added to
get past one blocked install turns that off for every package, permanently,
and nothing reports that it happened.

**CD9** because a Composer plugin is PHP that runs during `composer install`
with the installing user's permissions. `allow-plugins: true` accepts every
future plugin any dependency brings in.
