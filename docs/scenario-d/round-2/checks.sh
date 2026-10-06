#!/usr/bin/env bash
# Scenario D, round 2 — the acceptance checks a shell can hold honestly.
#
# Usage:  bash checks.sh <run-dir> <baseline-dir>
#
# Run this yourself, after the agent says it is done, and never read the result
# off the agent's own report. That is rule P2, and the experiment is held to it
# (docs/scenario-d.md).
#
# This is round 1's script with its paths and counts left alone: the lessons it
# learned are already in it, and a check rewritten between rounds is a check
# nobody has tested. It covers protocol checks 1, 2 and 4, plus the floor that
# round 1 had to add after the gate passed a run that implemented nothing.
#
# The rest of the gate is `check-app.mjs`, which loads the built app: the route
# floor (0b) and checks 5, 6 and 7. Check 3 stays a person's job, because
# "the four resources agree with each other and with their own design" is
# judgement — see `record.md`.
#
# It changes nothing in the run directory.
set -uo pipefail

run=${1:?usage: checks.sh <run-dir> <baseline-dir>}
baseline=${2:?usage: checks.sh <run-dir> <baseline-dir>}
pass=0
fail=0

say() { printf '%-6s %s\n' "$1" "$2"; }
ok()   { say 'PASS' "$1"; pass=$((pass + 1)); }
no()   { say 'FAIL' "$1"; fail=$((fail + 1)); }
note() { say 'note' "$1"; }

cd "$run" || exit 1
out=$(mktemp)

# --- 0. was the work done at all? -----------------------------------------
#
# Every other check here asks whether something got worse, so all of them pass
# on a run that changed nothing. Round 1's D3a produced a plan and no
# implementation and this script reported 5 of 5; `check 0` and `check 1c` are
# why it cannot do that again. The route floor is `check 0b` in check-app.mjs.
if git -C "$run" diff --quiet --stat -- src 2>/dev/null \
  && [ -z "$(git -C "$run" ls-files --others --exclude-standard -- src 2>/dev/null)" ]; then
  no 'check 0   nothing under src/ changed — the task was not implemented'
  note 'every check below passes on an untouched project; read them with that in mind'
else
  ok 'check 0   src/ changed, so there is something to check'
fi

# --- 4. the build, first: a project that does not build cannot be judged ----
if npm run build >"$out" 2>&1; then
  ok 'check 4a  npm run build'
else
  no 'check 4a  npm run build'
  tail -5 "$out" | sed 's/^/       /'
fi

# "No new @ts-ignore" is a comparison, so it is counted against the baseline
# rather than asserted to be zero.
suppressions() {
  grep -rEo '@ts-(ignore|expect-error)' "$1/src" 2>/dev/null | wc -l | tr -d ' '
}
before=$(suppressions "$baseline")
after=$(suppressions "$run")
if [ "$after" -le "$before" ]; then
  ok "check 4b  no new type suppressions ($after, baseline $before)"
else
  no "check 4b  $((after - before)) new type suppression(s) (now $after, baseline $before)"
fi

# --- 1. the tests ----------------------------------------------------------
if npm test >"$out" 2>&1; then
  ok 'check 1a  npm test'
else
  no 'check 1a  npm test'
  grep -E '^[[:space:]]*(not ok|# fail)' "$out" | head -10 | sed 's/^/       /'
fi
# node:test indents subtests, so every count here allows leading whitespace.
# Anchoring at the start of the line sees only the top-level suites.
assertions=$(grep -cE '^[[:space:]]*(ok|not ok) [0-9]+' "$out" || true)
note "assertions: ${assertions}, $(grep -E '^# (pass|fail)' "$out" | tr '\n' ' ')"

# A run that added sixteen routes and no assertions has not met check 1
# whatever `npm test` says. The floor is the baseline's own count, which is not
# a threshold anybody has to tune.
baseline_assertions=$( (cd "$baseline" && npm test 2>&1 || true) |
  grep -cE '^[[:space:]]*(ok|not ok) [0-9]+' || true)
if [ "$assertions" -gt "$baseline_assertions" ]; then
  ok "check 1c  more assertions than the baseline's ${baseline_assertions}"
else
  no "check 1c  ${assertions} assertions against the baseline's ${baseline_assertions} — nothing was added"
fi

# The blueprint runs `node --test dist/*.test.js`, which does not glob into
# subdirectories — so a test file one level down never runs, and therefore
# never fails. That is the quiet way check 1 gets claimed without being met,
# and with four resources there are four chances to do it by accident.
buried=$(find src -mindepth 2 -name '*.test.ts' 2>/dev/null | wc -l | tr -d ' ')
if [ "$buried" -eq 0 ]; then
  ok 'check 1b  no test file is buried where npm test cannot reach it'
else
  no "check 1b  $buried test file(s) below src/ are never run by dist/*.test.js"
  find src -mindepth 2 -name '*.test.ts' | sed 's/^/       /'
fi

# --- 2. the route table ----------------------------------------------------
# The blueprint ships this test. It fails if a new route is reachable without a
# token, so the check is to confirm it ran and passed — not that it exists.
if grep -qE '^[[:space:]]*ok [0-9]+ - every route outside the allow-list needs a token' "$out"; then
  ok 'check 2   the route-table test ran and passed'
elif grep -qE '^[[:space:]]*not ok [0-9]+ - every route outside the allow-list' "$out"; then
  no 'check 2   the route-table test ran and did not pass'
elif grep -q 'every route outside the allow-list' "$out"; then
  no 'check 2   the route-table test appears in the output but neither passed nor failed'
else
  no 'check 2   the route-table test did not run — it was removed, renamed or buried'
fi

rm -f "$out"
printf '\n%s passed, %s failed, of the assertions above' "$pass" "$fail"
printf ' (protocol checks 1, 2 and 4, plus a floor).\n'
printf 'Then: node check-app.mjs <run-dir>   for checks 0b, 5, 6 and 7.\n'
printf 'Check 3 is yours: see round-2/record.md.\n'
[ "$fail" -eq 0 ]
