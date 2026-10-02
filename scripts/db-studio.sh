#!/bin/sh

set -eu

AUTH_PORT=4983
MERCHANTS_PORT=4984

cleanup_stale_drizzle() {
  port="$1"
  pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"

  for pid in $pids; do
    command="$(ps -p "$pid" -o command= 2>/dev/null || true)"

    if printf '%s' "$command" | grep -q "drizzle-kit studio"; then
      echo "Stopping stale Drizzle Studio process $pid on port $port"
      kill "$pid" 2>/dev/null || true
    else
      echo "Port $port is already in use by a non-Drizzle process: $command"
      exit 1
    fi
  done
}

cleanup_stale_drizzle "$AUTH_PORT"
cleanup_stale_drizzle "$MERCHANTS_PORT"

cleanup() {
  if [ -n "${AUTH_PID:-}" ]; then
    kill "$AUTH_PID" 2>/dev/null || true
  fi

  if [ -n "${MERCHANTS_PID:-}" ]; then
    kill "$MERCHANTS_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

npm run db:studio --workspace=auth &
AUTH_PID=$!

npm run db:studio --workspace=merchants &
MERCHANTS_PID=$!

wait "$AUTH_PID" "$MERCHANTS_PID"
