# The 30-second demo

The GIF at the top of the README. It is the dogfood test with the waiting cut
out — same conversation, same catalog, nothing staged that does not happen for
real.

**One idea per demo, and this one is:** two sentences in, a working project
out. Not the tool count, not the site, not the CI. Those are below the fold.

---

## Before recording

|           |                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Terminal  | 100 × 28 characters, 16–18 px font, no transparency                                                                 |
| Prompt    | Shorten it to `~/demo $`. A prompt with a machine name, a git branch and a token counter costs a third of the frame |
| Directory | Empty. `mkdir ~/demo && cd ~/demo`                                                                                  |
| Agent     | A fresh Claude Code session with only the Forgeprint MCP connected                                                  |
| Screen    | Nothing else visible: no tabs, no notifications, no second pane                                                     |
| Preflight | Do a full run first, off camera. Docker images and NuGet packages must be warm, or half the GIF is a download       |

Record the terminal only. Cut nothing mid-sentence; speed the long parts up
instead, and keep the speed-up honest by leaving the step counter visible.

---

## The frames

**0:00–0:03 — the install line.** Start on an empty prompt, type it, let it
connect.

```bash
claude mcp add forgeprint -- npx -y forgeprint-mcp
```

Hold two seconds on the line that says the server is connected. This is the
only setup anyone has to do, and showing it is the point.

**0:03–0:08 — the ask.** Type it at human speed; do not paste.

```
I know C#. I'm building a multi-tenant SaaS API.
```

**0:08–0:14 — one answer.** The agent calls `resolve` and names one blueprint:
**Multi-tenant SaaS API**, with why it fits. Frame this so the words "one
blueprint" and the reasoning are both on screen.

If the run offers a choice between the two API blueprints instead, answer
`the multi-tenant one` and keep it — a resolver that asks rather than guesses
is the product, not a blemish. But do not record a version where you had to
explain yourself twice.

**0:14–0:18 — the two decisions.** It asks about `database` and `tenancy`.
Answer in one line:

```
postgres, and a tenant column in a shared database.
```

**0:18–0:26 — the recipe runs.** `get_blueprint`, then the steps. Speed this
up 8–10×, with the step counter climbing visibly. Do not cut to the end: the
whole claim is that these steps run.

Land the speed-up on the two frames that matter:

- `dotnet test` — the tenant isolation suite, green;
- the container answering `/health`.

**0:26–0:30 — the proof, by hand.** Drop out of the agent and type it yourself,
so it is clear the project is real and not a transcript:

```bash
dotnet test
```

End on the green summary. Last frame holds for a full second.

---

## Rules for the cut

- **No text overlays and no captions.** If a frame needs explaining, the frame
  is wrong.
- **Never speed up a question.** The user's typing and the agent's questions
  play at normal speed; only the machine work is compressed.
- **No failures on camera**, and nothing retried. If a step fails during
  recording, that is a bug — fix it, then record again.
- **No error, no warning, no yellow.** The final `dotnet test` frame decides
  whether anyone believes the rest.
- Target under 4 MB so GitHub plays it inline; 12–15 fps is enough for a
  terminal, and a palette-optimised GIF at 100 × 28 lands well under that.

---

## The caption under it

One line in the README, no adjectives:

```markdown
Two sentences in. A project whose setup ran, step by step, in CI.
```

---

## What a second demo would show

Not now — after launch, and only if the first one lands:

- **`compare_blueprints`** — asking "what's the difference?" and getting an
  answer built from the catalog's own "what it is NOT for" sections. It is the
  most honest thing the product does and nothing else in the category does it.
- **`request_blueprint`** — asking for something that does not exist and
  getting told so plainly, with the closest blueprint named and why it does not
  fit. A catalog that says "no" is the reason to trust it when it says yes.
