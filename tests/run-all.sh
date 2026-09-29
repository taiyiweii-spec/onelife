#!/usr/bin/env bash
# Run every pre-publish check. Usage: bash tests/run-all.sh [One_Life.html] [lives, default 6]
# Prints a short summary; full output only on failure.
set -uo pipefail
F=${1:-One_Life.html}; LIVES=${2:-6}
D=$(dirname "$0"); T=$(mktemp -d); fail=0
run(){ n=$1; shift; if "$@" >"$T/$n" 2>&1; then echo "PASS $n"; else echo "FAIL $n"; cat "$T/$n"; fail=1; fi; }
run syntax   node "$D/syntax.js" "$F";                 tail -1 "$T/syntax"
run playtest node "$D/playtest.js" "$F" --lives "$LIVES"; tail -2 "$T/playtest"
run oldsaves node "$D/oldsaves.js" "$F";               grep -E "failed" "$T/oldsaves" | tail -1
run balance  node "$D/balance.js" "$F";                tail -1 "$T/balance"
rm -rf "$T"; exit $fail
