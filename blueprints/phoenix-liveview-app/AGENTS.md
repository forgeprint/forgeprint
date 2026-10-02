# Phoenix LiveView App — agent context

A Phoenix 1.8 application on Postgres: one LiveView page that is pushed to
from the server, `mix phx.gen.auth` magic-link authentication in front of it,
and a production configuration that refuses to start on anything less than a
real secret. Read this before changing anything under `lib/`, `config/` or
`test/`.

## The shape

```
mix.exs                                  every direct dependency pinned exactly; `precommit` is the gate
config/config.exs                        what every environment shares
config/dev.exs                           DATABASE_URL or the compose credentials; loopback; a labelled fake secret
config/test.exs                          the same URL with `_test` appended; Ecto sandbox
config/prod.exs                          force_ssl and the digest manifest — compile-time settings live here
config/runtime.exs                       DATABASE_URL, SECRET_KEY_BASE, PHX_HOST; missing means the boot stops
lib/liveview_app/application.ex          the supervision tree, in start order
lib/liveview_app/counter.ex              the demonstration context: state, and the only module that names its topic
lib/liveview_app/accounts.ex             users, tokens, magic links, sudo mode (generated)
lib/liveview_app_web/router.ex           every route, the CSP, and which live_session a page belongs to
lib/liveview_app_web/user_auth.ex        the plug and the on_mount hooks (generated)
lib/liveview_app_web/live/counter_live.ex  the page: no state of its own
test/liveview_app_web/live/counter_live_test.exs  the realtime claim, as three assertions
test/liveview_app/runtime_config_test.exs         what production refuses to start without
```

## Rules that are not style preferences

**A LiveView never assigns its own answer in `handle_event/3`.** The event
handler calls the context; the context writes and broadcasts; `handle_info/2`
assigns what came back. `CounterLive` is written that way on purpose. Update
the socket directly in the event handler and the page is right for the
browser that clicked and wrong for every other browser on it — which is the
one bug this framework is chosen to avoid, and the one CI cannot see unless
the test opens a second door. `counter_live_test.exs` does: one test clicks,
another increments from a different process, and both assert the same
element.

**Two gates protect a route, not one.** The first HTTP request is stopped by
`:require_authenticated_user` in the pipeline; the websocket that follows it
is a separate connection and is stopped by the `on_mount` hook on the
`live_session`. A `live` route added to the authenticated scope but to a
`live_session` without the hook answers anyone who connects a socket to it.
Put a new protected page inside `live_session :require_authenticated_user`,
and add the anonymous-visitor assertion to its test — both halves, HTTP and
socket, the way `counter_live_test.exs` does it.

**`config/runtime.exs` is for values read at boot; `config/prod.exs` is for
the ones Phoenix reads while compiling.** `force_ssl`, `cache_static_manifest`
and the endpoint's compile-time options belong in `prod.exs`. Moving
`force_ssl` into `runtime.exs` is accepted without complaint and silently does
nothing, and the site then serves over plain http forever. The reverse mistake
is worse: a secret in `prod.exs` is baked into the release.

**Production refuses rather than guesses.** `DATABASE_URL`, `SECRET_KEY_BASE`
and `PHX_HOST` have no defaults; a secret shorter than 64 bytes, or equal to
the development one, raises by name. When a new deployment value is added,
read it in `runtime.exs` with a `raise` and add its refusal to
`runtime_config_test.exs` in the same change. A default that "works in
staging" is how staging's value reaches production.

**Nothing reads a request to decide what to trust.** `PHX_HOST` comes from the
environment, not from the `Host` header, because the magic link in the sign-in
email is built from it: a host taken from a request lets a visitor send
themselves a working login link pointing anywhere. The same applies to
anything derived from the current scope — read `socket.assigns.current_scope`,
never a parameter naming a user.

**Every dependency is pinned exactly in `mix.exs`.** `~>` in this file is a
review comment waiting to happen. Raise a pin deliberately with
`mix deps.update <name>`, read what changed, and commit `mix.lock` with it.
CI runs `mix deps.get --check-locked`, so a lock that disagrees with `mix.exs`
fails before anything is compiled.

**The counter is a demonstration.** Delete `lib/liveview_app/counter.ex`, its
LiveView, its route and its test as soon as the first real page exists. Keep
the shape: state in a context, the broadcast after the write, `handle_info/2`
as the only place the socket is assigned. When the state becomes a row rather
than an `Agent`, broadcast **after** the transaction commits — a broadcast
inside `Ecto.Repo.transaction/1` tells every client about a write that may
still roll back.

**Tests that touch the counter are `async: false`.** It is one `Agent` for the
whole node, so two async tests incrementing it see each other. Anything that
lives in Postgres stays `async: true`: the Ecto sandbox is what makes that
safe, and giving it up for convenience costs the whole suite its speed.

**The authentication defaults are `phx.gen.auth`'s, and two of them are
unfinished.** Token lifetimes are module attributes in
`lib/liveview_app/accounts/user_token.ex`: a magic link lasts 15 minutes, a
session 14 days absolutely, an email-change link 7 days, and there is no
inactivity timeout. Change a number there and change the paragraph in
`overview.md` in the same commit — OWASP ASVS 5.0 **7.1.1** asks for the
lifetimes to be written down, and a number nobody wrote down is a number
nobody chose. Nothing rate-limits `POST /users/log-in` or the registration
LiveView; ASVS **6.1.1** and **6.3.1** ask for anti-automation at Level 1, and
the first person to notice will be whoever receives a hundred sign-in emails.
Add the limiter before launch, not after.

## Commands

| What                | Command                                                           |
| ------------------- | ----------------------------------------------------------------- |
| Everything CI runs  | `mix precommit`                                                   |
| The database        | `docker compose up -d --wait`, then `docker compose port db 5432` |
| Run it              | `mix phx.server`, on <http://127.0.0.1:4000>                      |
| Tests               | `mix test` (it creates and migrates the test database first)      |
| One test            | `mix test test/liveview_app_web/live/counter_live_test.exs:42`    |
| Security scan       | `mix sobelow --exit Low --private`                                |
| Advisories          | `mix deps.audit`                                                  |
| A new migration     | `mix ecto.gen.migration <name>`, then `mix ecto.migrate`          |
| A production secret | `mix phx.gen.secret`                                              |

`DATABASE_URL` has to be exported for all of these, or they fall back to
`127.0.0.1:5432`, which is only right if that is where your Postgres is.

## When you are asked to add a page

1. A context module under `lib/liveview_app/` holds the state and the writes,
   and it is the only module that names its PubSub topic.
2. The LiveView goes in `lib/liveview_app_web/live/`, subscribes in `mount/3`
   behind `connected?(socket)`, and assigns only in `handle_info/2`.
3. The route goes inside `live_session :require_authenticated_user` unless the
   page is genuinely public, in which case it goes in the `:current_user`
   session and the reason goes in the commit message.
4. The test asserts three things: anonymous over HTTP, anonymous over the
   socket, and a change made in another process arriving at a mounted client.
5. `mix precommit` before the commit. A Sobelow finding is not a warning to
   silence; `--exit Low` is set so that it cannot be.

## What is deliberately not here

No Tailwind, no daisyUI, no heroicons: the generator fetches those binaries
and assets from a source-hosting site, and this recipe keeps every download on
a package registry. The generated markup still carries Tailwind class names,
so adding `{:tailwind, "~> 0.5"}` and `mix tailwind.install` styles the whole
application at once — that is a deliberate choice for the reader to make, not
a missing step.

No releases, no Dockerfile, no Kamal. `mix phx.gen.release --docker` writes
both when they are wanted, and a container image this blueprint never runs is
a container image nobody has checked.
