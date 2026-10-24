#!/usr/bin/env bash
# Validate frozen R06-R08 extraction with certified source; do not assert
# that the mutable production index equals a historical blob.
set -euo pipefail
sha=3f197edeccd10d7f103126a6eb8c3f5db92bf609
expected_blob=260f00aa179c939f35188ca854f9875971ce8a7b
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
if ! git cat-file -e "$sha^{commit}" 2>/dev/null; then
  git fetch --no-tags --depth=1 origin "$sha"
fi
tmp="$(mktemp -d "/tmp/gensrpg-r06-certified-XXXXXXXX")"
cleanup(){
  cd "$root"
  git worktree remove --force "$tmp" 2>/dev/null || true
  rmdir "$tmp" 2>/dev/null || true
}
trap cleanup EXIT
git worktree add --detach "$tmp" "$sha"
cd "$tmp"
test "$(git hash-object index.html)" = "$expected_blob"
python3 tools/gensrpg_phase12_r08_shared_catalog_extract_apply.py --verify
python3 tests/gens_phase12_exit_inventory_v1.test.py
node tests/gens_phase12_r07_magic_sound_extraction_v1.test.cjs
node tests/gens_phase12_r08_shared_catalog_extraction_v1.test.cjs
printf 'GENSRPG_HISTORICAL_R07_R08_GREEN %s\n' "$sha"
