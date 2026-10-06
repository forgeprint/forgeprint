#!/usr/bin/env bash
# Scenario D acceptance checks — the deterministic ones.
#
# Usage:  bash checks.sh <run-dir> <baseline-dir>
#
# Run this yourself, after the agent says it is done, and never read the result
# off the agent's own report. That is rule P2, and the experiment is held to it
# (docs/scenario-d.md).
#
# It covers checks 1, 2 and 4 of the five. Checks 3 and 5 are deliberately not
# here:
#
#   3  "deleting a project that has tasks does what the agent's own design says
#      it does" needs the design, which is judgement.
#   5  a malformed body to each create route answering 400 needs a token and the
#      app's internals. Any script robust enough to mint one has to assume
#      module names and exports the agent may legitimately have restructured —
#      and a check that fails on a legitimate choice corrupts the measurement
#      rather than making it. Do it by hand; docs/scenario-d/record.md says how.
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
# Anchoring at the start of the line sees only the top-level suites, which is
# how this script first reported a passing baseline as a failure.
note "assertions: $(grep -cE '^[[:space:]]*(ok|not ok) [0-9]+' "$out" || true), \
$(grep -E '^# (pass|fail)' "$out" | tr '\n' ' ')"

# The blueprint runs `node --test dist/*.test.js`, which does not glob into
# subdirectories — so a test file one level down never runs, and therefore
# never fails. That is the quiet way check 1 gets claimed without being met.
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
printf '\n%s passed, %s failed, of the five assertions above' "$pass" "$fail"
printf ' (protocol checks 1, 2 and 4).\n'
printf 'Checks 3 and 5 are yours: see docs/scenario-d/record.md.\n'
[ "$fail" -eq 0 ]
