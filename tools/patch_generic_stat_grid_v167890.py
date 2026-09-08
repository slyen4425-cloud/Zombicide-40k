#!/usr/bin/env python3
"""GenSrpG V16.79.01 — non-stat final build cleanup.

The RPG stat renderer is now owned exclusively by gens-custom-stat-runtime-profile-167889.js
(GensRpgStatService167901). This build patcher MUST NOT create, rename or wrap any stat
renderer. It only keeps three unrelated historical final-build fixes:
- resolve the active RPG profile correctly outside the editor;
- keep the Dungeon talent tree inside the Talents tab;
- remove obsolete PERSONNALISÉ badges from in-game hero cards.
"""
from __future__ import annotations
import sys
from pathlib import Path

VERSION="16.79.01"
MARKER="gensStatBuildNoRendererV167901"
PROFILE_MARKER="gensCurrentRpgProfileActiveV167894"
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
TALENT_OLD='if(p)p.style.display=d?"block":"none";if(z)z.style.display=d?"none":"block";'
TALENT_NEW='if(p)p.style.display=d&&dungeonSheetTab==="skills"?"block":"none";if(z)z.style.display=d?"none":"block";'
BADGE_OLD='badge.textContent=h.dungeonBuiltin?"RPG INTÉGRÉ":"PERSONNALISÉ";'
BADGE_NEW='badge.textContent=h.dungeonBuiltin?"RPG":"";badge.style.display=h.dungeonBuiltin?"inline-block":"none";'
MARKER_SCRIPT='''\n<script>/* gensStatBuildNoRendererV167901 — stat rendering belongs to GensRpgStatService167901 only. */</script>\n'''

def patch_text(html:str)->str:
    # Strip the old injected V16.78.98 renderer if this patcher is accidentally run on an
    # already-patched intermediate page. Production source normally does not contain it.
    old_start=html.find("/* gensCanonicalStatGridV167898 — sole primary characteristic renderer. */")
    if old_start>=0:
        script_start=html.rfind("<script",0,old_start)
        script_end=html.find("</script>",old_start)
        # Only remove a standalone legacy injection script. Never remove the monolith script.
        if script_start>=0 and script_end>=0 and html.rfind("</script>",script_start,old_start)==-1:
            block=html[script_start:script_end+9]
            if "GENS_CORE_STAT_IDS_V167897" in block and "gensRenderCanonicalAttributesV167897" in block:
                html=html[:script_start]+html[script_end+9:]
    if PROFILE_MARKER not in html:
        count=html.count(OLD_PROFILE)
        if count!=1: raise RuntimeError(f"V16.79.01: expected one legacy currentRpgProfile(), found {count}")
        html=html.replace(OLD_PROFILE,NEW_PROFILE,1)
    if TALENT_NEW not in html:
        if TALENT_OLD not in html: raise RuntimeError("V16.79.01: talent panel display hook missing")
        html=html.replace(TALENT_OLD,TALENT_NEW,1)
    html=html.replace(BADGE_OLD,BADGE_NEW)
    html=html.replace("'<span class=\"customHeroBadge\">PERSONNALISÉ</span>'","''")
    if MARKER not in html:
        close=html.rfind("</body>")
        if close<0: raise RuntimeError("V16.79.01: </body> missing")
        html=html[:close]+MARKER_SCRIPT+html[close:]
    # Hard safety assertions: the build patcher must never inject another stat renderer.
    forbidden=("gensRenderCanonicalAttributesV167897","GENS_CORE_STAT_IDS_V167897","function renderDungeonAttributes__native167890")
    for token in forbidden:
        if token in MARKER_SCRIPT: raise RuntimeError("V16.79.01: stat renderer leaked into marker script")
    return html

def main()->int:
    if len(sys.argv)!=2:
        print("usage: patch_generic_stat_grid_v167890.py <index.html>",file=sys.stderr);return 2
    path=Path(sys.argv[1]);html=patch_text(path.read_text(encoding="utf-8"));path.write_text(html,encoding="utf-8")
    print(f"GenSrpG V{VERSION}: final non-stat cleanup applied (no stat renderer injected)");return 0
if __name__=="__main__":raise SystemExit(main())
