# Active Record boundaries

An Active Record model is the easiest place in a Rails application to put
anything, which is why it ends up holding everything. These checks keep a
model about its own table and push the rest into code that can be named.

| #   | Check                                                                                   | How                                                                                                | Source                                             |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AR1 | No `before_*`/`after_save`/`after_create`/`after_update` callback touches another model | read each callback; any foreign constant is a finding                                              | Rails 8.1 — Active Record callbacks                |
| AR2 | No callback calls an external system except from `after_commit`                         | `grep -rn "after_save\|after_create\|after_destroy" app packs`; read for HTTP, mail, jobs          | Rails 8.1 — callbacks: `after_commit`              |
| AR3 | Jobs enqueued inside a transaction wait for the commit                                  | `self.enqueue_after_transaction_commit = true` in `ApplicationJob`, or enqueue from `after_commit` | Rails 8.1 — Active Job: transactional integrity    |
| AR4 | A callback does not reference another pack's constant                                   | `bin/packwerk check` reports the reference                                                         | Packwerk 3.3 — usage                               |
| AR5 | No `default_scope`                                                                      | `grep -rn "default_scope" app packs`; `Rails/DefaultScope` enabled in `.rubocop.yml`               | rubocop-rails 2.38 — `Rails/DefaultScope`          |
| AR6 | A concern holds shared behaviour, not one domain's rules                                | read `app/models/concerns`; a concern included by one model or holding a domain rule is a finding  | Rails 8.1 — `ActiveSupport::Concern` API           |
| AR7 | Validation-skipping writes are deliberate and commented                                 | `Rails/SkipsModelValidations` enabled; each `update_column(s)`/`update_all` has a reason           | rubocop-rails 2.38 — `Rails/SkipsModelValidations` |

## Why each one

**AR2** is the failure the Rails guide shows with its own example: a file
deleted in `after_destroy` stays deleted when a later step raises and the
transaction rolls back. The same holds for a mail sent or an API called from
`after_save`. `after_commit` runs only once the change is durable.

**AR3** because Solid Queue in the same database gives transactional
enqueueing for free, and moving Solid Queue to its own database later
silently takes it away. `enqueue_after_transaction_commit` keeps the
guarantee whatever the queue backend is — the guide recommends it for that
reason.

**AR1** is what a pack boundary means inside a model. A callback on `Order`
that updates `Inventory` is a dependency nobody sees in a controller, a
service or a test name, and it fires on every save, including the ones in a
data migration.
