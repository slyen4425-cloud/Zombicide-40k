#!/usr/bin/env python3
"""Repair the profile/hero bootstrapping dependency cycle. Exact verified base only."""
import hashlib
from pathlib import Path
import sys

EXPECTED_SHA256="e89bf6218200386fdf59740508aa993836819b466034b2698fbd9f029e09229e"
EXPECTED_BLOB="260f00aa179c939f35188ca854f9875971ce8a7b"
p=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
raw=p.read_bytes()
sha=hashlib.sha256(raw).hexdigest()
blob=hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()
assert sha==EXPECTED_SHA256 and blob==EXPECTED_BLOB, f"Wrong index base {sha} {blob}"
s=raw.decode("utf8")

old='''function gensCurrentContentFamily(){
  try{
    const editorOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
    if(editorOpen && rpgEditingId){
      const p=loadGameProfiles().find(x=>String(x.id)===String(rpgEditingId));
      if(p)return gensContentFamilyForProfile(p);
    }
  }catch(e){}
  try{return gensContentFamilyForProfile(getActiveGameProfile?.())}catch(e){return isDungeonMode()?"rpg":"survival"}
}'''
new='''function gensCurrentContentFamily(){
  // This lookup is also used inside profile/hero migration. Rebuilding the
  // profiles from here would recursively restart ensureBaseGameProfile().
  // Only the profile owner is permitted to create/migrate profiles.
  try{
    const profiles=loadGameProfilesRaw();
    const editorOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
    if(editorOpen && rpgEditingId){
      const p=profiles.find(x=>String(x.id)===String(rpgEditingId));
      if(p)return gensContentFamilyForProfile(p);
    }
    const activeId=activeGameProfileId();
    const p=profiles.find(x=>String(x.id)===String(activeId));
    if(p)return gensContentFamilyForProfile(p);
  }catch(e){}
  return isDungeonMode()?"rpg":"survival";
}'''
assert s.count(old)==1,"Unexpected gensCurrentContentFamily body"
s=s.replace(old,new)

old='''function gensCurrentUniverseId(){
  try{
    const rpgOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
    if(rpgOpen && rpgEditingId){
      const p=loadGameProfiles().find(x=>String(x.id)===String(rpgEditingId));
      if(p?.gameStyle==="dungeon")return String(p.id);
    }
  }catch(e){}
  try{
    const p=getActiveGameProfile?.();
    if(p?.gameStyle==="dungeon")return String(p.id);
  }catch(e){}
  return "";
}'''
new='''function gensCurrentUniverseId(){
  // Legacy hero migration asks for this ID while profiles are still building.
  // Resolve existing profiles without recursively rebuilding them.
  try{
    const profiles=loadGameProfilesRaw();
    const rpgOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
    if(rpgOpen && rpgEditingId){
      const p=profiles.find(x=>String(x.id)===String(rpgEditingId));
      if(p?.gameStyle==="dungeon")return String(p.id);
    }
    const id=activeGameProfileId();
    const p=profiles.find(x=>String(x.id)===String(id));
    if(p?.gameStyle==="dungeon")return String(p.id);
    if(!p && String(id)===String(GAME_PROFILE_DUNGEON_ID))return String(id);
  }catch(e){}
  return "";
}'''
assert s.count(old)==1,"Unexpected gensCurrentUniverseId body"
s=s.replace(old,new)

old='''function gensFamilyForUniverseId(id){
  try{
    const p=loadGameProfiles().find(x=>String(x.id)===String(id));
    return p?gensContentFamilyForProfile(p):"rpg";
  }catch(e){return "rpg"}
}'''
new='''function gensFamilyForUniverseId(id){
  // Read-only: called from content migration while profiles may be incomplete.
  try{
    const p=loadGameProfilesRaw().find(x=>String(x.id)===String(id));
    return p?gensContentFamilyForProfile(p):"rpg";
  }catch(e){return "rpg"}
}'''
assert s.count(old)==1,"Unexpected gensFamilyForUniverseId body"
s=s.replace(old,new)

old='''function gensInferUniverseForLegacyId(contentId,poolField){
  try{
    const profiles=loadGameProfiles().filter(p=>p?.gameStyle==="dungeon");'''
new='''function gensInferUniverseForLegacyId(contentId,poolField){
  try{
    // Do not reenter ensureBaseGameProfile() from its legacy-hero migration.
    const profiles=loadGameProfilesRaw().filter(p=>p?.gameStyle==="dungeon");'''
assert s.count(old)==1,"Unexpected gensInferUniverseForLegacyId body"
s=s.replace(old,new)

p.write_bytes(s.encode("utf8"))
print("GENSRPG_HERO_LOOP_PATCH_OK",hashlib.sha256(p.read_bytes()).hexdigest(),p.stat().st_size)
