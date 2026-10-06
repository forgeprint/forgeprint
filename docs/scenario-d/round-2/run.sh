#!/usr/bin/env bash
# Scenario D, round 2 — the driver.
#
#   bash run.sh start d1 a <baseline-dir> <work-dir>
#   bash run.sh reply <work-dir> d1a
#
# Round 1's six runs were started by hand, and that invocation survives only
# because a record happens to quote it. This script is the invocation, so the
# nine runs of round 2 differ in the prompt file and in nothing else.
#
# What it does NOT do: judge. The gate is `checks.sh` and `check-app.mjs`, run
# by the person afterwards, and the reply is sent only on the mechanical
# condition in `reply.md`.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../../.." && pwd)

# The exact invocation, in one place. `--bare` is deliberately absent: it is
# what the protocol's "clean session" asks for, but it also drops
# authentication, which round 1 measured rather than assumed.
claude_run() {
  claude -p --strict-mcp-config --model opus \
    --permission-mode bypassPermissions --output-format json "$@"
}

start() {
  local config=$1 attempt=$2 baseline=$3 work=$4
  case "$config" in
    d1 | d2 | d3) ;;
    *)
      echo "config must be d1, d2 or d3" >&2
      exit 2
      ;;
  esac
  local id="${config}${attempt}"
  local run="$work/run-$id"

  [ -d "$baseline" ] || { echo "no baseline at $baseline" >&2; exit 2; }
  [ -e "$run" ] && { echo "$run already exists — a run is never re-used" >&2; exit 2; }

  mkdir -p "$work"
  cp -R "$baseline" "$run"

  # D3 needs the expert on disk, or the run is D2 with a longer prompt.
  if [ "$config" = d3 ]; then
    (cd "$repo" && pnpm forgeprint get technical-program-manager \
      --agent claude-code --expert --out "$run")
    [ -f "$run/.claude/skills/technical-program-manager/SKILL.md" ] || {
      echo "the expert did not land in $run — stopping rather than running D2 twice" >&2
      exit 1
    }
  fi

  # The prompt is read from the file rather than retyped, and the HTML comment
  # at the top of it is instructions to the person, not to the agent.
  local prompt
  prompt=$(sed -n '/^Starting/,$p' "$here/prompt-$config.md")

  date +%s >"$work/$id.start"
  set +e
  (cd "$run" && claude_run "$prompt") >"$work/$id.json" 2>"$work/$id.err"
  echo $? >"$work/$id.exit"
  set -e
  date +%s >"$work/$id.end"

  echo
  echo "run      $run"
  echo "usage    $work/$id.json   (cost, turns, subagent_stats)"
  echo "wall     $(($(cat "$work/$id.end") - $(cat "$work/$id.start"))) s"
  echo
  echo "next     bash $here/checks.sh $run $baseline"
  echo "         node $here/check-app.mjs $run"
  echo "         if check 0 failed: bash $here/run.sh reply $work $id"
}

# The one reply, fired by the one mechanical condition (reply.md). It resumes
# the same session, so turn 2 is the same run rather than a second one.
reply() {
  local work=$1 id=$2
  local session
  session=$(node -e "process.stdout.write(require('$work/$id.json').session_id)")
  local text='Approved — proceed with all four proposals as written. Add nothing.'

  date +%s >"$work/$id.turn2.start"
  set +e
  claude_run --resume "$session" "$text" >"$work/$id.turn2.json" 2>"$work/$id.turn2.err"
  echo $? >"$work/$id.turn2.exit"
  set -e
  date +%s >"$work/$id.turn2.end"
  echo "turn 2 recorded in $work/$id.turn2.json — record it as '1, by policy'"
}

case "${1:-}" in
  start)
    shift
    [ $# -eq 4 ] || { echo "usage: run.sh start <d1|d2|d3> <attempt> <baseline-dir> <work-dir>" >&2; exit 2; }
    start "$@"
    ;;
  reply)
    shift
    [ $# -eq 2 ] || { echo "usage: run.sh reply <work-dir> <run-id>" >&2; exit 2; }
    reply "$@"
    ;;
  *)
    sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
    exit 2
    ;;
esac
