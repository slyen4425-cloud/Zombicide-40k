#!/usr/bin/env python3
"""GenSrpG V16.78.93 — render custom stats from the same lexical RPG profile as the native hero sheet.

The polished native renderer stays unchanged. The build-time wrapper executes inside the
same classic script as `current`, `currentRpgProfile()` and `loadState()`, so the custom
stat cards no longer depend on a second global-profile bridge. No observer, timer,
dynamic loader or parallel stat store is introduced.
"""
from __future__ import annotations
import sys
from pathlib import Path

VERSION = "16.78.93"
MARKER = "gensUnifiedStatGridV167890"
RENAMES = {
    "renderDungeonAttributes": "renderDungeonAttributes__native167890",
    "renderDungeonHeroStats": "renderDungeonHeroStats__native167890",
}

WRAPPER = r'''
/* GenSrpG V16.78.93 — native characteristic grid + lexical RPG profile source. */
function gensCurrentHeroIdV167891(){
  try{return current?String(current):String(globalThis.current||"")}catch(error){return String(globalThis.current||"")}
}
function gensEscStatV167892(value){
  return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function gensCurrentRpgProfileV167893(){
  try{return currentRpgProfile()||null}catch(error){return null}
}
function gensActiveCustomStatDefsV167893(){
  try{
    const profile=gensCurrentRpgProfileV167893(),stats=profile?.rpgUniverse?.stats||{};
    const active=new Set((Array.isArray(stats.active)?stats.active:[]).map(String));
    return (Array.isArray(stats.customStats)?stats.customStats:[]).filter(def=>def&&def.id&&active.has(String(def.id)));
  }catch(error){return []}
}
function gensCustomStatValueV167893(heroId,def){
  try{
    const state=loadState(heroId)||{},id=String(def?.id||"");
    const direct=Number(state?.customStats?.[id]);if(Number.isFinite(direct))return direct;
    const mirrored=Number(state?.rpgAttributes?.[id]);if(Number.isFinite(mirrored))return mirrored;
    return Number(def?.defaultValue)||0;
  }catch(error){return Number(def?.defaultValue)||0}
}
function gensRenderActiveCustomStatsV167892(){
  try{
    const grid=document.getElementById("dungeonAttributeGrid"),genericApi=globalThis.GensGenericStats167887;
    if(!grid)return false;
    grid.querySelectorAll(".gsrCustomStatCard").forEach(node=>node.remove());
    const heroId=gensCurrentHeroIdV167891();if(!heroId)return false;
    const list=gensActiveCustomStatDefsV167893();
    const state=loadState(heroId)||{},points=Math.max(0,Number(state.statPoints)||0);
    for(const def of list){
      const id=String(def.id),value=gensCustomStatValueV167893(heroId,def),base=Number(def.defaultValue)||0,card=document.createElement("div");
      card.className="dungeonStatBox gsrCustomStatCard";
      card.dataset.statId=id;
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
    grid.dataset.gensActiveCustomStatIds=list.map(def=>String(def.id)).join(",");
    return true;
  }catch(error){console.warn("GenSrpG V16.78.93 custom stat cards",error);return false}
}
function gensUnifiedStatGridV167890(){
  try{
    const heroId=gensCurrentHeroIdV167891();
    if(heroId)globalThis.current=heroId;
    const grid=document.getElementById("dungeonAttributeGrid");
    if(grid)grid.dataset.gensUnifiedStatGrid="167893";
    const api=globalThis.GensGenericStats167887;
    if(api)api.patchSheetTexts?.();
    gensRenderActiveCustomStatsV167892();
  }catch(error){console.warn("GenSrpG V16.78.93 stat grid",error)}
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
try{globalThis.GENSRPG_VERSION="16.78.93"}catch(error){}
'''.strip()


def patch_text(html: str) -> str:
    if MARKER in html:
        return html
    positions=[]
    for old,new in RENAMES.items():
        needle=f"function {old}(){{"
        count=html.count(needle)
        if count!=1:
            raise RuntimeError(f"V16.78.93: expected exactly one {needle!r}, found {count}")
        pos=html.index(needle)
        html=html.replace(needle,f"function {new}(){{",1)
        positions.append(pos)
    close=html.find("</script>",max(positions))
    if close<0:
        raise RuntimeError("V16.78.93: could not find closing </script> for native stat renderer")
    html=html[:close]+"\n"+WRAPPER+"\n"+html[close:]
    if MARKER not in html or "gensActiveCustomStatDefsV167893" not in html:
        raise RuntimeError("V16.78.93: lexical-profile custom-stat wrapper missing after patch")
    return html


def main()->int:
    if len(sys.argv)!=2:
        print("usage: patch_generic_stat_grid_v167890.py <index.html>",file=sys.stderr);return 2
    path=Path(sys.argv[1]);html=path.read_text(encoding="utf-8")
    path.write_text(patch_text(html),encoding="utf-8")
    print(f"GenSrpG V{VERSION}: lexical-profile custom-stat grid applied")
    return 0
if __name__=="__main__": raise SystemExit(main())
