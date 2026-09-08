#!/usr/bin/env python3
"""GenSrpG V16.78.98 — final stat/talent sheet cleanup.

Keeps one canonical characteristic grid, lets the native Dungeon renderer rebuild the
important derived-stat/rule summaries before replacing only the primary grid, hides the
legacy compact duplicate stat strip, prevents the talent tree from escaping its tab,
and removes obsolete PERSONNALISÉ badges from in-game hero cards.
"""
from __future__ import annotations
import sys
from pathlib import Path

VERSION="16.78.98"
MARKER="gensCanonicalStatGridV167898"
PROFILE_MARKER="gensCurrentRpgProfileActiveV167894"
RENAMES={"renderDungeonAttributes":"renderDungeonAttributes__native167890","renderDungeonHeroStats":"renderDungeonHeroStats__native167890"}

OLD_PROFILE='''function currentRpgProfile(){
  const arr=rpgProfiles();
  if(rpgEditingId){
    const exact=arr.find(p=>String(p.id)===String(rpgEditingId));
    if(exact)return exact;
  }
  const active=arr.find(p=>String(p.id)===String(activeGameProfileId()));
  if(active)return active;
  return arr.find(p=>p.id===GAME_PROFILE_DUNGEON_ID)||arr[0]||null;
}'''
NEW_PROFILE='''function currentRpgProfile(){
  /* gensCurrentRpgProfileActiveV167894: editor profile only while the editor is visible. */
  const arr=rpgProfiles();let editorOpen=false;
  try{editorOpen=document.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){}
  if(editorOpen&&rpgEditingId){const exact=arr.find(p=>String(p.id)===String(rpgEditingId));if(exact)return exact}
  const active=arr.find(p=>String(p.id)===String(activeGameProfileId()));if(active)return active;
  if(rpgEditingId){const fallbackEdit=arr.find(p=>String(p.id)===String(rpgEditingId));if(fallbackEdit)return fallbackEdit}
  return arr.find(p=>p.id===GAME_PROFILE_DUNGEON_ID)||arr[0]||null;
}'''

WRAPPER=r'''
/* gensCanonicalStatGridV167898 — sole primary characteristic renderer. */
const GENS_CORE_STAT_IDS_V167897=new Set(["force","agilite","intelligence","esprit","endurance","initiative"]);
const GENS_STAT_ALIAS_V167897={agility:"agilite",spirit:"esprit"};
const GENS_STAT_FALLBACK_V167897=[
 {id:"force",name:"Force",icon:"💪",defaultValue:10,editMode:"points",visible:true,description:"Dégâts physiques et précision de mêlée."},
 {id:"agilite",name:"Agilité",icon:"🏃",defaultValue:10,editMode:"points",visible:true,description:"Précision à distance, critique, esquive et initiative."},
 {id:"intelligence",name:"Intelligence",icon:"🧠",defaultValue:10,editMode:"points",visible:true,description:"Dégâts et précision magiques."},
 {id:"esprit",name:"Esprit",icon:"✨",defaultValue:10,editMode:"points",visible:true,description:"Mana et résistance magique."},
 {id:"endurance",name:"Endurance",icon:"❤️",defaultValue:10,editMode:"points",visible:true,description:"Points de vie maximum."},
 {id:"initiative",name:"Initiative",icon:"⚡",defaultValue:0,editMode:"points",visible:true,description:"Ordre d'action et tests d'initiative selon les règles de l'univers."}
];
function gensCanonStatIdV167897(id){return GENS_STAT_ALIAS_V167897[String(id||"")]||String(id||"")}
function gensEscStatV167897(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function gensCurrentHeroIdV167891(){try{return current?String(current):""}catch(error){return ""}}
function gensCanonicalStatDefsV167897(){
  try{
    const api=globalThis.GensCanonicalStatRegistry167897;if(api?.defs){const x=api.defs();if(Array.isArray(x)&&x.length)return x}
    const p=currentRpgProfile(),s=p?.rpgUniverse?.stats||{},defs=Array.isArray(s.customStats)?s.customStats:[];
    return defs.length?defs:GENS_STAT_FALLBACK_V167897;
  }catch(error){return GENS_STAT_FALLBACK_V167897}
}
function gensCanonicalActiveSetV167897(){
  try{const p=currentRpgProfile(),raw=p?.rpgUniverse?.stats?.active||[];return new Set(raw.map(gensCanonStatIdV167897))}catch(error){return new Set(GENS_STAT_FALLBACK_V167897.map(x=>x.id))}
}
function gensCanonicalActiveDefsV167897(){
  const active=gensCanonicalActiveSetV167897(),seen=new Set();
  return gensCanonicalStatDefsV167897().map(d=>({...d,id:gensCanonStatIdV167897(d.id)})).filter(d=>d.id&&d.visible!==false&&active.has(d.id)&&!seen.has(d.id)&&(seen.add(d.id),true));
}
function gensCanonicalAssignedValueV167897(id,def){
  id=gensCanonStatIdV167897(id);const direct=Number(state?.rpgAttributes?.[id]);if(Number.isFinite(direct))return direct;
  const custom=Number(state?.customStats?.[id]);if(Number.isFinite(custom))return custom;
  if(GENS_CORE_STAT_IDS_V167897.has(id)){try{return Number(dungeonBaseAttributeFromDefinition(current,id))||0}catch(error){}}
  return Number(def?.defaultValue)||0;
}
function gensCanonicalDisplayValueV167897(id,def){
  id=gensCanonStatIdV167897(id);
  if(GENS_CORE_STAT_IDS_V167897.has(id)){try{return Number(dungeonAttributeValue(id))||0}catch(error){}}
  return gensCanonicalAssignedValueV167897(id,def);
}
function gensChangeCanonicalStatV167897(id,delta){
  if(!isDungeonHeroSheet()||!current||!state)return false;
  id=gensCanonStatIdV167897(id);delta=Number(delta)||0;if(!delta)return false;
  const def=gensCanonicalStatDefsV167897().find(d=>gensCanonStatIdV167897(d.id)===id);if(!def||def.editMode==="runtime")return false;
  state.rpgAttributes=state.rpgAttributes&&typeof state.rpgAttributes==="object"?state.rpgAttributes:{};
  state.customStats=state.customStats&&typeof state.customStats==="object"?state.customStats:{};
  state.rpgStatSpentById=state.rpgStatSpentById&&typeof state.rpgStatSpentById==="object"?state.rpgStatSpentById:{};
  dungeonSyncProgressionForState(current,state);
  const prog=dungeonActiveProgressionConfig(),free=prog.attributeEditMode==="free"||def.editMode==="free";
  const base=GENS_CORE_STAT_IDS_V167897.has(id)?Math.max(Number(def.min)||0,Number(dungeonBaseAttributeFromDefinition(current,id))||0):Math.max(Number(def.min)||0,Number(def.defaultValue)||0);
  const min=Number.isFinite(Number(def.min))?Number(def.min):0,max=Number.isFinite(Number(def.max))?Number(def.max):999;
  const cur=gensCanonicalAssignedValueV167897(id,def),next=Math.max(min,Math.min(max,cur+delta));if(next===cur)return false;
  const actual=next-cur;
  if(!free&&def.editMode!=="free"){
    if(actual>0){
      if(Math.max(0,Number(state.statPoints)||0)<actual){alert("Aucun point de caractéristique disponible.");return false}
      state.rpgStatSpent=Math.max(0,Number(state.rpgStatSpent)||0)+actual;
      state.rpgStatSpentById[id]=Math.max(0,Number(state.rpgStatSpentById[id])||0)+actual;
    }else if(actual<0){
      if(cur<=base)return false;
      const byId=Math.max(0,Number(state.rpgStatSpentById[id])||0),legacy=Math.max(0,Number(state.rpgStatSpent)||0);
      const refund=Math.min(-actual,byId>0?byId:legacy);if(refund<=0)return false;
      state.rpgStatSpent=Math.max(0,legacy-refund);state.rpgStatSpentById[id]=Math.max(0,byId-refund);
    }
  }
  state.rpgAttributes[id]=next;state.customStats[id]=next;
  dungeonSyncProgressionForState(current,state);save();renderDungeonAttributes();renderDungeonHeroStats();return true;
}
function gensRenderCanonicalAttributesV167897(){
  const host=document.getElementById("dungeonAttributeGrid");if(!host||!isDungeonHeroSheet())return false;
  dungeonSyncProgressionForState(current,state);
  const defs=gensCanonicalActiveDefsV167897(),rulesApi=globalThis.GensGenericStats167887;
  let pointsBanner=document.getElementById("dungeonStatPointsBanner073");if(!pointsBanner){pointsBanner=document.createElement("div");pointsBanner.id="dungeonStatPointsBanner073";host.parentNode?.insertBefore(pointsBanner,host)}
  const prog=dungeonActiveProgressionConfig(),freeStats=prog.attributeEditMode==="free";
  pointsBanner.className="dungeonStatPointsBanner073 "+(freeStats?"free":"points");
  pointsBanner.innerHTML=freeStats?'<strong>🎭 MODE ROLEPLAY — CARACTÉRISTIQUES LIBRES</strong><small>Les + / − ne consomment aucun point.</small>':'<strong>📊 '+Math.max(0,Number(state.statPoints)||0)+' POINT'+(Number(state.statPoints)===1?'':'S')+' DE CARACTÉRISTIQUE À DISTRIBUER</strong><small>+1 consomme 1 point · −1 rembourse un point dépensé.</small>';
  host.innerHTML=defs.map(def=>{
    const id=gensCanonStatIdV167897(def.id),v=gensCanonicalDisplayValueV167897(id,def),raw=gensCanonicalAssignedValueV167897(id,def),core=GENS_CORE_STAT_IDS_V167897.has(id);
    const gear=core?dungeonEquipmentBonus(id):0,skill=core?dungeonSkillEffectTotal("attribute",null,id):0;
    const fallback=GENS_STAT_FALLBACK_V167897.find(x=>x.id===id)?.description||"";
    const desc=String(def.description||fallback||"").trim(),links=String(rulesApi?.descriptionForSource?.(id)||"").trim();
    const mode=String(def.editMode||"points"),editable=mode!=="runtime";
    const baseText=core?('Base '+raw+(gear?' · équipement '+(gear>0?'+':'')+gear:'')+(skill?' · talents +'+skill:'')):'Base '+(Number(def.defaultValue)||0);
    return '<div class="dungeonStatBox gsrCanonicalStatCard" data-stat-id="'+gensEscStatV167897(id)+'"><strong>'+gensEscStatV167897((def.icon?def.icon+' ':'')+(def.name||id))+'</strong><span>'+v+'</span><small style="display:block">'+gensEscStatV167897(baseText)+'</small>'+(desc?'<small class="gsrCustomStatDescription" style="display:block;color:#d6c18a;margin:4px 0">'+gensEscStatV167897(desc)+'</small>':'')+(links&&links!=="Aucune liaison automatique."?'<small class="gsrCustomStatLinks" style="display:block;color:#bdb19b;margin:4px 0">Influence : '+gensEscStatV167897(links)+'</small>':'')+(editable?'<div class="controls"><button data-stat="'+gensEscStatV167897(id)+'" onclick="gensChangeCanonicalStatV167897(this.dataset.stat,-1)">−</button><button data-stat="'+gensEscStatV167897(id)+'" onclick="gensChangeCanonicalStatV167897(this.dataset.stat,1)">+</button></div>':'')+'</div>';
  }).join("");
  host.querySelectorAll("#gcsHeroStats,.gsrCustomStatCard").forEach(n=>n.remove());
  host.dataset.gensUnifiedStatGrid="167898";host.dataset.gensActiveCanonicalStatIds=defs.map(d=>gensCanonStatIdV167897(d.id)).join(",");return true;
}
function gensRenderActiveCustomStatsV167892(){return gensRenderCanonicalAttributesV167897()}
function gensUnifiedStatGridV167890(){try{globalThis.current=gensCurrentHeroIdV167891();globalThis.GensGenericStats167887?.patchSheetTexts?.();gensRenderCanonicalAttributesV167897()}catch(error){console.warn("GenSrpG V16.78.98 canonical stat grid",error)}}
function renderDungeonAttributes(){
  const out=renderDungeonAttributes__native167890.apply(this,arguments);
  gensRenderCanonicalAttributesV167897();
  const compact=document.getElementById("dungeonHeroStats");if(compact){compact.style.display="none";compact.innerHTML=""}
  return out;
}
function renderDungeonHeroStats(){
  const compact=document.getElementById("dungeonHeroStats");if(compact){compact.style.display="none";compact.innerHTML=""}
  gensRenderCanonicalAttributesV167897();
  return true;
}
try{globalThis.GENSRPG_VERSION="16.78.98";globalThis.GENSRPG_CANONICAL_STATS=true}catch(error){}
'''.strip()

TALENT_OLD='if(p)p.style.display=d?"block":"none";if(z)z.style.display=d?"none":"block";'
TALENT_NEW='if(p)p.style.display=d&&dungeonSheetTab==="skills"?"block":"none";if(z)z.style.display=d?"none":"block";'
BADGE_OLD='badge.textContent=h.dungeonBuiltin?"RPG INTÉGRÉ":"PERSONNALISÉ";'
BADGE_NEW='badge.textContent=h.dungeonBuiltin?"RPG":"";badge.style.display=h.dungeonBuiltin?"inline-block":"none";'

def patch_text(html:str)->str:
    if PROFILE_MARKER not in html:
        count=html.count(OLD_PROFILE)
        if count!=1: raise RuntimeError(f"V16.78.98: expected one legacy currentRpgProfile(), found {count}")
        html=html.replace(OLD_PROFILE,NEW_PROFILE,1)
    if MARKER in html:return html
    positions=[]
    for old,new in RENAMES.items():
        needle=f"function {old}(){{";count=html.count(needle)
        if count!=1:raise RuntimeError(f"V16.78.98: expected exactly one {needle!r}, found {count}")
        pos=html.index(needle);html=html.replace(needle,f"function {new}(){{",1);positions.append(pos)
    if TALENT_OLD not in html:raise RuntimeError("V16.78.98: talent panel display hook missing")
    html=html.replace(TALENT_OLD,TALENT_NEW,1)
    html=html.replace(BADGE_OLD,BADGE_NEW)
    html=html.replace("'<span class=\"customHeroBadge\">PERSONNALISÉ</span>'","''")
    close=html.find("</script>",max(positions))
    if close<0:raise RuntimeError("V16.78.98: could not find closing </script> for native stat renderer")
    html=html[:close]+"\n"+WRAPPER+"\n"+html[close:]
    if MARKER not in html or PROFILE_MARKER not in html:raise RuntimeError("V16.78.98: canonical grid/profile patch missing")
    return html

def main()->int:
    if len(sys.argv)!=2:
        print("usage: patch_generic_stat_grid_v167890.py <index.html>",file=sys.stderr);return 2
    path=Path(sys.argv[1]);path.write_text(patch_text(path.read_text(encoding="utf-8")),encoding="utf-8")
    print(f"GenSrpG V{VERSION}: stat/talent sheet cleanup applied");return 0
if __name__=="__main__":raise SystemExit(main())