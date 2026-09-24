# Report

Against the brief — quoted verbatim at the top of [the plan](delivery-plan.yaml) — and not against the plan itself (D7).

## Result

**Done: all five tasks verified**, and the whole suite and the build pass
together (T4). Nothing below is a caveat to that sentence; it is what the
sentence rests on.

| Task | Status   | Attempts | Evidence                |
| ---- | -------- | -------- | ----------------------- |
| T0   | verified | 1 of 2   | `delivery/evidence/T0/` |
| T1   | verified | 1 of 2   | `delivery/evidence/T1/` |
| T2   | verified | 1 of 2   | `delivery/evidence/T2/` |
| T3   | verified | 2 of 2   | `delivery/evidence/T3/` |
| T4   | verified | 1 of 2   | `delivery/evidence/T4/` |

## What went wrong on the way

- **T3, attempt 1: rejected.** Its tests passed, but it mounted its own router
  in `src/app.ts`, which belonged to T4. Accepted as it was, T4 would have
  mounted the router a second time. Redone inside its paths on attempt 2.

## Still open

- **A4** — whether a task can move to another project. Assumed no; not
  critical, and not confirmed. One route changes if the answer is yes.

## Not done

Nothing in the brief. Out of scope and not attempted: pagination on the list
routes, which the brief did not ask for.
