#!/usr/bin/env bash
# Run retired Capture V1 characterization against its immutable last-production
# checkpoint. Current V2 is validated independently by the Capture V2 gates.
# This does NOT patch/restore legacy owners into the V2 runtime.
set -euo pipefail
if [[ $# -lt 1 ]]; then echo 'Historical test command required' >&2; exit 64; fi
root="$(git rev-parse --show-toplevel)"
sha="900cbcba0cdd517db773ff39c9c56264c16b32ed"
hist="${RUNNER_TEMP:-/tmp}/gensrpg-capture-v1-checkpoint-900cbcba"
cd "$root"
if ! git cat-file -e "$sha^{commit}" 2>/dev/null; then
  git fetch --no-tags --depth=1 origin "$sha"
fi
if [[ ! -d "$hist/.git" && ! -f "$hist/.git" ]]; then
  git worktree add --detach "$hist" "$sha" >&2
fi
actual="$(git -C "$hist" rev-parse HEAD)"
if [[ "$actual" != "$sha" ]]; then echo "Historical checkout drift: $actual" >&2; exit 1; fi
if [[ -d "$root/node_modules" && ! -e "$hist/node_modules" ]]; then
  ln -s "$root/node_modules" "$hist/node_modules"
fi
printf 'Certified retired Capture V1 test: %s / %s\n' "$sha" "$*" >&2
cd "$hist"
"$@"
