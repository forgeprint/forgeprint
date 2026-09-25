# Bundler discipline

Bundler resolves the application's whole dependency tree, including native
extensions compiled for one platform. What it resolves and whether a changed
gem can slip in are decided by a handful of lines in the lockfile and the
environment.

| #   | Check                                                    | How                                                                          | Source                                       |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| BD1 | `Gemfile.lock` is committed                              | `git ls-files Gemfile.lock` prints the file                                  | Bundler 4.0 — `bundle install`               |
| BD2 | The lockfile has a `CHECKSUMS` section                   | `grep -c "^CHECKSUMS" Gemfile.lock` is 1; else `bundle lock --add-checksums` | Bundler 4.0 — `bundle config`, `bundle lock` |
| BD3 | Checksum validation is not disabled                      | no `BUNDLE_DISABLE_CHECKSUM_VALIDATION` in `.bundle/config` or CI env        | Bundler 4.0 — `bundle config`                |
| BD4 | The deployment platform is in `PLATFORMS`                | read `PLATFORMS`; `bundle lock --add-platform x86_64-linux` if missing       | Bundler 4.0 — `bundle lock`                  |
| BD5 | CI and production install frozen                         | `BUNDLE_FROZEN=true` in CI and the image, or `bundle config set frozen true` | Bundler 4.0 — `bundle config`: `frozen`      |
| BD6 | The Ruby version has one source                          | `.ruby-version` exists; the Gemfile says `ruby file: ".ruby-version"`        | Bundler 4.0 — Gemfile `ruby`                 |
| BD7 | That Ruby line is maintained                             | compare `.ruby-version` with ruby-lang.org's branch status                   | Ruby maintenance branches (ruby-lang.org)    |
| BD8 | `bin/bundler-audit` runs in CI and fails the job         | read the workflow or `config/ci.rb`                                          | bundler-audit 0.9.3; Rails 8.1 app generator |
| BD9 | `bin/brakeman --exit-on-warn --exit-on-error` runs in CI | read the workflow or `config/ci.rb`; the flags are present                   | Brakeman 8.0.6; Rails 8.1 app generator      |

## Why each one

**BD2** because a lockfile without checksums records a gem's name and version,
not its content. A republished or tampered gem with the same version
installs without complaint. Bundler 4 writes checksums into new lockfiles by
default; an application whose lock predates that has to add them once.

**BD4** is the row that produces "works locally, fails in the container".
A lock resolved on macOS with no Linux platform makes the image resolve
native gems at build time — different versions, or a compile that needs
headers the image does not have.

**BD9** because Rails 8.1 generates Brakeman into both `config/ci.rb` and the
workflow. Removing the step to get a pull request through turns a
code-level security check off for every later change.
