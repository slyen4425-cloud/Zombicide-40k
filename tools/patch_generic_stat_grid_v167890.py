#!/usr/bin/env python3
"""GenSrpG V16.78.91 — native hero stat grid + canonical current-hero bridge.

The polished native renderer stays unchanged. At build time we expose the lexical
`current` hero through one tiny compatibility bridge, then run the existing generic-stat
renderer synchronously after the native render. No observer, timer, loader or parallel
state is introduced.
"""
from __future__ import annotations
import sys
from pathlib import Path

VERSION = "16.78.91"
MARKER = "gensUnifiedStatGridV167890"
RENAMES = {
    "renderDungeonAttributes": "renderDungeonAttributes__native167890",
    "renderDungeonHeroStats": "renderDungeonHeroStats__native167890",
}

WRAPPER = r'''
/* GenSrpG V16.78.91 — native characteristic grid + current hero bridge. */
function gensCurrentHeroIdV167891(){
  try{return current?String(current):String(globalThis.current||"")}catch(error){return String(globalThis.current||"")}
}
function gensUnifiedStatGridV167890(){
  try{
    const heroId=gensCurrentHeroIdV167891();
    if(heroId)globalThis.current=heroId;
    const grid=document.getElementById("dungeonAttributeGrid");
    if(grid)grid.dataset.gensUnifiedStatGrid="167891";
    const api=globalThis.GensGenericStats167887;
    if(api){
      api.renderCustomStatsInMainGrid?.();
      api.patchSheetTexts?.();
    }
  }catch(error){console.warn("GenSrpG V16.78.91 stat grid",error)}
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
try{globalThis.GENSRPG_VERSION="16.78.91"}catch(error){}
'''.strip()


def patch_text(html: str) -> str:
    if MARKER in html:
        return html
    positions=[]
    for old,new in RENAMES.items():
        needle=f"function {old}(){{"
        count=html.count(needle)
        if count!=1:
            raise RuntimeError(f"V16.78.91: expected exactly one {needle!r}, found {count}")
        pos=html.index(needle)
        html=html.replace(needle,f"function {new}(){{",1)
        positions.append(pos)
    close=html.find("</script>",max(positions))
    if close<0:
        raise RuntimeError("V16.78.91: could not find closing </script> for native stat renderer")
    html=html[:close]+"\n"+WRAPPER+"\n"+html[close:]
    if MARKER not in html or "gensCurrentHeroIdV167891" not in html:
        raise RuntimeError("V16.78.91: stat-grid/current-hero bridge missing after patch")
    return html


def main()->int:
    if len(sys.argv)!=2:
        print("usage: patch_generic_stat_grid_v167890.py <index.html>",file=sys.stderr);return 2
    path=Path(sys.argv[1]);html=path.read_text(encoding="utf-8")
    path.write_text(patch_text(html),encoding="utf-8")
    print(f"GenSrpG V{VERSION}: native stat grid/current hero bridge applied")
    return 0
if __name__=="__main__": raise SystemExit(main())
