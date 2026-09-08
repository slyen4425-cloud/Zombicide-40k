#!/usr/bin/env python3
"""GenSrpG V16.78.92 — complete active custom-stat cards in the native hero grid.

The polished native renderer stays unchanged. The build-time wrapper exposes the
lexical `current` hero, lets the existing generic engine refresh derived texts, then
renders every active custom characteristic from the active RPG profile in the same
native grid. No observer, timer, loader or parallel stat store is introduced.
"""
from __future__ import annotations
import sys
from pathlib import Path

VERSION = "16.78.92"
MARKER = "gensUnifiedStatGridV167890"
RENAMES = {
    "renderDungeonAttributes": "renderDungeonAttributes__native167890",
    "renderDungeonHeroStats": "renderDungeonHeroStats__native167890",
}

WRAPPER = r'''
/* GenSrpG V16.78.92 — native characteristic grid + complete active custom stats. */
function gensCurrentHeroIdV167891(){
  try{return current?String(current):String(globalThis.current||"")}catch(error){return String(globalThis.current||"")}
}
function gensEscStatV167892(value){
  return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function gensRenderActiveCustomStatsV167892(){
  try{
    const grid=document.getElementById("dungeonAttributeGrid"),customApi=globalThis.GensCustomStats167879,genericApi=globalThis.GensGenericStats167887;
    if(!grid||!customApi)return false;
    grid.querySelectorAll(".gsrCustomStatCard").forEach(node=>node.remove());
    const heroId=gensCurrentHeroIdV167891();if(!heroId)return false;
    const profile=globalThis.getActiveGameProfile?.()||globalThis.currentRpgProfile?.()||null;
    const stats=profile?.rpgUniverse?.stats||{},active=new Set((Array.isArray(stats.active)?stats.active:[]).map(String));
    const list=(Array.isArray(stats.customStats)?stats.customStats:[]).filter(def=>def&&def.id&&active.has(String(def.id)));
    const state=globalThis.loadState?.(heroId)||{},points=Math.max(0,Number(state.statPoints)||0);
    for(const def of list){
      const id=String(def.id),value=Number(customApi.value?.(heroId,id))||0,base=Number(def.defaultValue)||0,card=document.createElement("div");
      card.className="dungeonStatBox gsrCustomStatCard";
      const canEdit=def.editMode!=="runtime",canAdd=def.editMode!=="points"||points>0;
      const ownDescription=String(def.description||"").trim();
      const links=String(genericApi?.descriptionForSource?.(id)||"").trim();
      const descriptionHtml=ownDescription?'<small class="gsrCustomStatDescription" style="display:block;margin-top:10px;color:#d6c18a">'+gensEscStatV167892(ownDescription)+'</small>':'';
      const linksHtml=links&&links!=="Aucune liaison automatique."?'<small class="gsrCustomStatLinks" style="display:block;margin-top:6px;color:#bdb19b">Influence : '+gensEscStatV167892(links)+'</small>':'';
      const minus=canEdit?'<button type="button" onclick="GensCustomStats167879.change(\''+gensEscStatV167892(id)+'\',-1)">−</button>':'';
      const plus=canEdit?'<button type="button" '+(canAdd?'':'disabled title="Aucun point de caractéristique disponible"')+' onclick="GensCustomStats167879.change(\''+gensEscStatV167892(id)+'\',1)">＋</button>':'';
      card.innerHTML='<strong>'+gensEscStatV167892((def.icon?def.icon+' ':'')+(def.name||id))+'</strong><div style="font-size:36px;font-weight:900;line-height:1.05;margin:4px 0">'+value+(def.kind==="gauge"?' / '+Number(def.max||0):'')+'</div><small>Base '+base+'</small>'+descriptionHtml+linksHtml+(canEdit?'<div style="display:flex;gap:8px;justify-content:center;margin-top:12px">'+minus+plus+'</div>':'');
      grid.appendChild(card);
    }
    grid.dataset.gensActiveCustomStats=String(list.length);
    return true;
  }catch(error){console.warn("GenSrpG V16.78.92 custom stat cards",error);return false}
}
function gensUnifiedStatGridV167890(){
  try{
    const heroId=gensCurrentHeroIdV167891();
    if(heroId)globalThis.current=heroId;
    const grid=document.getElementById("dungeonAttributeGrid");
    if(grid)grid.dataset.gensUnifiedStatGrid="167892";
    const api=globalThis.GensGenericStats167887;
    if(api)api.patchSheetTexts?.();
    gensRenderActiveCustomStatsV167892();
  }catch(error){console.warn("GenSrpG V16.78.92 stat grid",error)}
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
try{globalThis.GENSRPG_VERSION="16.78.92"}catch(error){}
'''.strip()


def patch_text(html: str) -> str:
    if MARKER in html:
        return html
    positions=[]
    for old,new in RENAMES.items():
        needle=f"function {old}(){{"
        count=html.count(needle)
        if count!=1:
            raise RuntimeError(f"V16.78.92: expected exactly one {needle!r}, found {count}")
        pos=html.index(needle)
        html=html.replace(needle,f"function {new}(){{",1)
        positions.append(pos)
    close=html.find("</script>",max(positions))
    if close<0:
        raise RuntimeError("V16.78.92: could not find closing </script> for native stat renderer")
    html=html[:close]+"\n"+WRAPPER+"\n"+html[close:]
    if MARKER not in html or "gensRenderActiveCustomStatsV167892" not in html:
        raise RuntimeError("V16.78.92: complete custom-stat grid wrapper missing after patch")
    return html


def main()->int:
    if len(sys.argv)!=2:
        print("usage: patch_generic_stat_grid_v167890.py <index.html>",file=sys.stderr);return 2
    path=Path(sys.argv[1]);html=path.read_text(encoding="utf-8")
    path.write_text(patch_text(html),encoding="utf-8")
    print(f"GenSrpG V{VERSION}: complete active custom-stat grid applied")
    return 0
if __name__=="__main__": raise SystemExit(main())
