from pathlib import Path
import json

OLD_BLOB = "f523410e175ee4946059da8e8ee8519295fb63c5"
NEW_BLOB = "1d4bd0f6eddb6a58fa0939b666bbebdbb07dc3b1"

index = Path("index.html")
text = index.read_text(encoding="utf-8")

replacements = [
("""function gensIsCaptureGameplay(profile=getActiveGameProfile()){
  try{
    if(!profile||profile.gameStyle!=="dungeon")return false;
    ensureRpgProfileData(profile);
    const g=profile.rpgUniverse?.gameplay||{};
    return g.profile==="creature" || (!!g.modules?.capture && !!g.modules?.controllableCreatures);
  }catch(e){return false}
}""",
"""function gensIsCaptureGameplay(profile=getActiveGameProfile()){
  try{return !!GensCaptureV1.isProfile(profile)}
  catch(e){return false}
}"""),

("""function gensCapturePregameMode(){
  try{
    const p=getActiveGameProfile();
    if(!p||p.gameStyle!=="dungeon")return false;
    if(String(p.id)===String(GAME_PROFILE_DUNGEON_ID))return false;
    return typeof gensCurrentContentFamily==="function" && gensCurrentContentFamily()==="creature";
  }catch(e){return false}
}""",
"""function gensCapturePregameMode(){
  try{
    const p=getActiveGameProfile();
    return !!GensCaptureV1.isProfile(p);
  }catch(e){return false}
}"""),

("""function gensPureCaptureSheetMode(){
  try{
    const p=getActiveGameProfile();
    if(!p || p.gameStyle!=="dungeon")return false;
    if(String(p.id)===String(GAME_PROFILE_DUNGEON_ID))return false;
    return gensCurrentContentFamily()==="creature";
  }catch(e){return false}
}""",
"""function gensPureCaptureSheetMode(){
  try{
    const p=getActiveGameProfile();
    return !!GensCaptureV1.isProfile(p);
  }catch(e){return false}
}"""),

("""function gensShellActiveModuleV1(){
  if(String(gensSelectedFamily||"")==="pvp")return "pvp";
  let profile=null;
  try{profile=typeof activeGameProfileRaw==="function"?activeGameProfileRaw():null}catch(e){}
  if(!profile)try{profile=typeof getActiveGameProfile==="function"?getActiveGameProfile():null}catch(e){}
  if(profile?.gameStyle==="dungeon"){
    let family="";
    try{family=typeof gensContentFamilyForProfile==="function"?gensContentFamilyForProfile(profile):""}catch(e){}
    return family==="creature"?"capture":"dungeon";
  }
  return "survival";
}""",
"""function gensShellActiveModuleV1(){
  if(String(gensSelectedFamily||"")==="pvp")return "pvp";
  let profile=null;
  try{profile=typeof activeGameProfileRaw==="function"?activeGameProfileRaw():null}catch(e){}
  if(!profile)try{profile=typeof getActiveGameProfile==="function"?getActiveGameProfile():null}catch(e){}
  if(window.GensCaptureV1?.isProfile?.(profile))return "capture";
  if(profile?.gameStyle==="dungeon")return "dungeon";
  return "survival";
}"""),

("""function gensContentFamilyForProfile(profile){
  if(!profile)return "survival";
  if(profile.gameStyle!=="dungeon")return "survival";
  const g=profile.rpgUniverse?.gameplay||{};
  const mods=g.modules||{};
  // Les modules réellement actifs ont priorité sur le nom du preset.
  if(mods.capture && mods.controllableCreatures)return "creature";
  if(g.profile==="creature")return "creature";
  if(g.profile==="manga")return "manga";
  // RPG classique, narratif et personnalisé sans capture partagent le socle RPG.
  return "rpg";
}""",
"""function gensContentFamilyForProfile(profile){
  if(!profile)return "survival";
  if(window.GensCaptureV1?.isProfile?.(profile))return "creature";
  if(profile.gameStyle!=="dungeon")return "survival";
  const g=profile.rpgUniverse?.gameplay||{};
  if(g.profile==="manga")return "manga";
  // RPG classique, narratif et personnalisé sans capture partagent le socle RPG.
  return "rpg";
}"""),

("""function gensGameplayModules(){
  const empty={
    heroCombat:false,controllableCreatures:false,capture:false,companions:false,
    equipment:false,elements:false,economy:false,mana:false,progression:false,
    evolution:false,permadeath:false,ko:false,talentTrees:false,movement:false
  };
  try{
    const editorOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
    const id=editorOpen?rpgEditingId:activeGameProfileId();
    if(!id)return empty;
    const p=loadGameProfiles().find(x=>String(x.id)===String(id));
    if(!p||p.gameStyle!=="dungeon")return empty;
    const g=getStoredRpgGameplay(id);
    return {...empty,...(g.modules||{})};
  }catch(e){return empty}
}""",
"""function gensGameplayModules(){
  const empty={
    heroCombat:false,controllableCreatures:false,capture:false,companions:false,
    equipment:false,elements:false,economy:false,mana:false,progression:false,
    evolution:false,permadeath:false,ko:false,talentTrees:false,movement:false
  };
  try{
    const editorOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
    const id=editorOpen?rpgEditingId:activeGameProfileId();
    if(!id)return empty;
    const p=loadGameProfiles().find(x=>String(x.id)===String(id));
    if(!p)return empty;
    if(!window.GensCaptureV1?.isProfile?.(p) && p.gameStyle!=="dungeon")return empty;
    const g=getStoredRpgGameplay(id);
    return {...empty,...(g.modules||{})};
  }catch(e){return empty}
}"""),

("""window.isCaptureContext138=function(){
  try{
    if(typeof gensPureCaptureSheetMode==="function"&&gensPureCaptureSheetMode())return true;
    if(typeof gensCapturePregameMode==="function"&&gensCapturePregameMode())return true;
    const p=getActiveGameProfile?.();
    const fam=typeof gensCurrentContentFamily==="function"?gensCurrentContentFamily():"";
    return fam==="creature";
  }catch(e){return false}
};""",
"""window.isCaptureContext138=function(){
  try{
    const p=getActiveGameProfile?.();
    return !!window.GensCaptureV1?.isProfile?.(p);
  }catch(e){return false}
};"""),

("""window.gensMode151=function(){
  try{
    const p=getActiveGameProfile?.();
    const fam=typeof gensCurrentContentFamily==="function"?gensCurrentContentFamily():"";
    if(p?.gameStyle==="dungeon" && fam==="creature")return "capture";
    if(p?.gameStyle==="dungeon")return "dungeon";
    return "other";
  }catch(e){return "other"}
};""",
"""window.gensMode151=function(){
  try{
    const p=getActiveGameProfile?.();
    if(window.GensCaptureV1?.isProfile?.(p))return "capture";
    if(p?.gameStyle==="dungeon")return "dungeon";
    return "other";
  }catch(e){return "other"}
};""")
]

for old,new in replacements:
    assert text.count(old) == 1, "identity seam drifted"
    text = text.replace(old,new,1)

index.write_text(text,encoding="utf-8",newline="")

entry = Path("assets/gensrpg/capture/entry-v1.js")
entry.write_text("""\
"use strict";

(function installGensCaptureV1(root){
  const VERSION="1.1.0";
  let legacyStartConfiguredGame=null;
  let installed=false;

  function isProfile(profile){
    const gameplay=profile?.rpgUniverse?.gameplay;
    if(!gameplay||typeof gameplay!=="object")return false;
    if(gameplay.profile==="creature")return true;
    const modules=gameplay.modules;
    return !!(modules&&modules.capture===true&&modules.controllableCreatures===true);
  }

  async function startModuleSession(){
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.activeModule!=="function")return false;
    if(shell.activeModule()!=="capture")return false;
    if(typeof legacyStartConfiguredGame!=="function")return false;
    await legacyStartConfiguredGame();
    return true;
  }

  function install(legacyStart){
    if(typeof legacyStart!=="function")throw new TypeError("GensCaptureV1.install requires the Capture139 legacy start function");
    if(installed){
      if(legacyStartConfiguredGame!==legacyStart)throw new Error("GensCaptureV1 legacy start owner already bound");
      return true;
    }
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.register!=="function")throw new Error("GensCaptureV1 requires GensShellModuleLaunchV1");
    legacyStartConfiguredGame=legacyStart;
    shell.register("capture",startModuleSession);
    installed=true;
    return true;
  }

  function status(){
    return Object.freeze({installed,legacyBound:typeof legacyStartConfiguredGame==="function"});
  }

  root.GensCaptureV1=Object.freeze({VERSION,isProfile,install,startModuleSession,status});
})(typeof window!=="undefined"?window:globalThis);
""",encoding="utf-8",newline="")

contract_path=Path("assets/gensrpg/capture/module-contract-v1.json")
contract=json.loads(contract_path.read_text(encoding="utf-8"))
assert contract["status"]=="partial-runtime-loaded"
assert contract["publicRuntimeApi"]=="GensCaptureV1"
if "Capture profile identity classification" not in contract["owns"]:
    contract["owns"].append("Capture profile identity classification")
identity_invariant="Capture profile identity is owned only by pure GensCaptureV1.isProfile(profile) and does not depend on Dungeon identity"
if identity_invariant not in contract["invariants"]:
    contract["invariants"].append(identity_invariant)
contract_path.write_text(json.dumps(contract,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="")
