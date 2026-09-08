#!/usr/bin/env python3
"""GenSrpG V16.78.90 — patch the native hero stat renderers at build time.

The source app keeps its existing polished Dungeon stat card renderer. We rename the
native render functions and put a tiny synchronous wrapper in the same classic script.
The wrapper asks the existing generic-stat engine to add active custom characteristics
and refresh generated descriptions. No observer, timer, dynamic loader or parallel
stat store is introduced.
"""
from __future__ import annotations

import sys
from pathlib import Path

VERSION = "16.78.90"
MARKER = "gensUnifiedStatGridV167890"
RENAMES = {
    "renderDungeonAttributes": "renderDungeonAttributes__native167890",
    "renderDungeonHeroStats": "renderDungeonHeroStats__native167890",
}

WRAPPER = r'''
/* GenSrpG V16.78.90 — native characteristic grid unification. */
function gensUnifiedStatGridV167890(){
  try{
    const grid=document.getElementById("dungeonAttributeGrid");
    if(grid)grid.dataset.gensUnifiedStatGrid="167890";
    const api=globalThis.GensGenericStats167887;
    if(api){
      api.renderCustomStatsInMainGrid?.();
      api.patchSheetTexts?.();
    }
  }catch(error){console.warn("GenSrpG V16.78.90 stat grid",error)}
}
function renderDungeonAttributes(){
  const out=renderDungeonAttributes__native167890.apply(this,arguments);
  gensUnifiedStatGridV167890();
  return out;
}
function renderDungeonHeroStats(){
  const out=renderDungeonHeroStats__native167890.apply(this,arguments);
  gensUnifiedStatGridV167890();
  return out;
}
try{globalThis.GENSRPG_VERSION="16.78.90"}catch(error){}
'''.strip()


def patch_text(html: str) -> str:
    if MARKER in html:
        return html

    positions = []
    for old, new in RENAMES.items():
        needle = f"function {old}(){{"
        count = html.count(needle)
        if count != 1:
            raise RuntimeError(f"V16.78.90: expected exactly one {needle!r}, found {count}")
        pos = html.index(needle)
        html = html.replace(needle, f"function {new}(){{", 1)
        positions.append(pos)

    # Put the wrappers inside the classic inline script that owns the native renderers.
    # Looking for the script terminator is intentionally simpler/safer than parsing a
    # multi-megabyte legacy JS body and cannot alter any gameplay function body.
    insert_after = max(positions)
    close = html.find("</script>", insert_after)
    if close < 0:
        raise RuntimeError("V16.78.90: could not find closing </script> for native stat renderer")
    html = html[:close] + "\n" + WRAPPER + "\n" + html[close:]

    if html.count(MARKER) < 1:
        raise RuntimeError("V16.78.90: wrapper marker missing after patch")
    for new in RENAMES.values():
        if f"function {new}(){{" not in html:
            raise RuntimeError(f"V16.78.90: renamed native renderer missing: {new}")
    return html


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: patch_generic_stat_grid_v167890.py <index.html>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    html = path.read_text(encoding="utf-8")
    patched = patch_text(html)
    path.write_text(patched, encoding="utf-8")
    print(f"GenSrpG V{VERSION}: native stat grid patch applied")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
