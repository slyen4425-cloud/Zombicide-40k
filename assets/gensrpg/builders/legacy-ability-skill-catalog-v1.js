const GENSRPG_ABILITY_LIBRARY_KEY="gensrpg_ability_library_v1";
const GENSRPG_ABILITY_LIBRARY_SETTINGS_KEY="gensrpg_ability_library_settings_v1";
const GENSRPG_ABILITY_LIBRARIES=[["survival","☠️ Survie"],["rpg","🧙 RPG"],["creature","🐲 Créatures"],["trainer","🥊 Dresseur"],["companion","🐺 Compagnons"]];
function gensAbilityLibraryId(a){if(a?.libraryId)return String(a.libraryId);const u=gensAbilityUsages(a);if(a?.builtinCreature||u.includes("captureCreature"))return "creature";if(u.includes("trainer")&&!u.includes("rpgHero"))return "trainer";if(u.includes("companion")&&!u.includes("rpgHero"))return "companion";return "rpg"}
function gensAbilityLibraryLabel(id){return (GENSRPG_ABILITY_LIBRARIES.find(x=>x[0]===id)||["","Autre"])[1]}
function gensDefaultAbilityLibrarySettings(){return {rpg:{mode:"mana",value:0,recovery:"rest"},creature:{mode:"charges",value:10,recovery:"combat"},trainer:{mode:"cooldown",value:1,recovery:"combat"},companion:{mode:"cooldown",value:1,recovery:"combat"}}}
function loadAbilityLibrarySettings(){let x={};try{x=JSON.parse(localStorage.getItem(GENSRPG_ABILITY_LIBRARY_SETTINGS_KEY)||"{}")||{}}catch(e){};return {...gensDefaultAbilityLibrarySettings(),...x}}
function saveAbilityLibrarySettings(x){localStorage.setItem(GENSRPG_ABILITY_LIBRARY_SETTINGS_KEY,JSON.stringify(x||gensDefaultAbilityLibrarySettings()))}
function gensAbilityUseRule(a){const lib=gensAbilityLibraryId(a),base=loadAbilityLibrarySettings()[lib]||{mode:"free",value:0,recovery:"combat"},o=a?.useRuleOverride;return o?.enabled?{mode:o.mode||base.mode,value:Math.max(0,Number(o.value)||0),recovery:o.recovery||base.recovery,source:"custom"}:{...base,source:"library"}}
function gensAbilityUseRuleText(a){if(a?.type!=="active")return "Passif";const r=gensAbilityUseRule(a);if(r.mode==="charges")return "🔢 "+r.value+" charge"+(r.value>1?"s":"");if(r.mode==="mana")return "🔵 "+r.value+" Mana";if(r.mode==="cooldown")return "⏱️ recharge "+r.value+" tour"+(r.value>1?"s":"");return "♾️ Libre"}
let gensAbilityLibraryTab="rpg";
function gensAbilityLibraryForTarget(t){
  if(!t){
    try{
      const hub=document.getElementById("editorHub");
      if(hub&&hub.style.display!=="none"&&typeof editorHubIsRpgContext==="function"&&!editorHubIsRpgContext())return "survival";
    }catch(e){}
  }
  if(t?.kind==="sharedEntity")return sharedEntityEditingCategory==="companion"?"companion":"creature";
  if(t?.kind==="trainer")return "trainer";
  return "rpg";
}
function gensSetAbilityLibraryTab(id){gensAbilityLibraryTab=id||"rpg";renderAbilityLibraryTabs();renderAbilityLibrary()}
function renderAbilityLibraryTabs(){
  const h=document.getElementById("abilityLibraryTabs");if(!h)return;
  h.innerHTML=GENSRPG_ABILITY_LIBRARIES.map(([id,label])=>'<button type="button" class="v2Btn '+(gensAbilityLibraryTab===id?"primary":"")+'" onclick="gensSetAbilityLibraryTab(\''+id+'\')">'+label+'</button>').join("");
  const survival=gensAbilityLibraryTab==="survival",modal=document.getElementById("abilityLibraryModal");
  const rules=modal?.querySelector('button[onclick="gensOpenAbilityLibrarySettings()"]');if(rules)rules.style.display=survival?"none":"";
  const add=modal?.querySelector('button[onclick="newAbilityLibraryEntry()"]');if(add)add.style.display=survival?"none":"";
}
function gensOpenAbilityLibrarySettings(){const id=gensAbilityLibraryTab||"rpg",all=loadAbilityLibrarySettings(),r=all[id]||{mode:"free",value:0,recovery:"combat"};const q=prompt("Mode par défaut : free / charges / mana / cooldown",r.mode);if(q===null)return;const mode=["free","charges","mana","cooldown"].includes(String(q).toLowerCase())?String(q).toLowerCase():r.mode;let value=0;if(mode!=="free"){const n=prompt(mode==="charges"?"Charges par défaut :":mode==="mana"?"Coût Mana par défaut :":"Recharge par défaut (tours) :",String(r.value||0));if(n===null)return;value=Math.max(0,Number(n)||0)}let recovery=r.recovery||"combat";if(mode==="charges"){const z=prompt("Récupération : combat / rest / manual",recovery);if(z!==null&&["combat","rest","manual"].includes(String(z).toLowerCase()))recovery=String(z).toLowerCase()}all[id]={mode,value,recovery};saveAbilityLibrarySettings(all);renderAbilityLibrary()}

const GENSRPG_ABILITY_CATEGORIES=[
  ["stat","📈 Bonus de caractéristiques"],
  ["spell","✨ Sort"],
  ["heal","❤️ Soin"],
  ["melee","⚔️ Mêlée"],
  ["ranged","🏹 Distance"],
  ["defense","🛡️ Défense"],
  ["control","🌀 Contrôle"],
  ["utility","🧰 Utilitaire"]
];
const GENSRPG_ABILITY_USAGE_SCOPES=[
  ["rpgHero","🧙 Héros RPG"],
  ["captureCreature","🐲 Créature capturable"],
  ["enemy","👹 Ennemi / monstre"],
  ["trainer","🥊 Dresseur"],
  ["companion","🐺 Compagnon"]
];
function gensAbilityUsageLabel(id){return (GENSRPG_ABILITY_USAGE_SCOPES.find(x=>x[0]===id)||["","Autre"])[1]}
function gensAbilityUsages(a){
  if(Array.isArray(a?.usageScopes)&&a.usageScopes.length)return [...new Set(a.usageScopes.map(String))];
  if(a?.builtinCreature)return ["captureCreature","enemy"];
  // Anciennes compétences génériques : compatibles héros par défaut.
  return ["rpgHero","enemy"];
}
function gensAbilityAllowedForTarget(a,target){
  const uses=gensAbilityUsages(a);
  if(!target)return true;
  if(target.kind==="sharedEntity"){
    return uses.includes(sharedEntityEditingCategory==="companion"?"companion":"captureCreature");
  }
  if(target.kind==="enemy")return uses.includes("enemy");
  if(target.kind==="talent")return uses.includes("rpgHero");
  if(target.kind==="trainer")return uses.includes("trainer");
  return true;
}
function gensActiveAbility(id,name,category,desc,element="",effects=[]){
  return {
    id,name,category,type:"active",desc,element,
    effects:effects.length?effects:[{kind:"damage",base:1,element}],
    activeMeta:{manaCost:0,weapon:"",cooldown:0},
    usageScopes:["captureCreature","enemy"],
    builtin:true,builtinCreature:true
  };
}
function gensCaptureExpandedAbilityRoster(){return [{"id":"cap_fire_atk_1","name":"Étincelle","category":"spell","type":"active","desc":"Attaque Feu de puissance 3. Disponible au niveau 1.","element":"fire","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_atk_2","name":"Morsure ardente","category":"melee","type":"active","desc":"Attaque Feu de puissance 4. Disponible au niveau 5.","element":"fire","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_atk_3","name":"Charge de braise","category":"melee","type":"active","desc":"Attaque Feu de puissance 5. Disponible au niveau 10.","element":"fire","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_atk_4","name":"Impact flamboyant","category":"melee","type":"active","desc":"Attaque Feu de puissance 6. Disponible au niveau 16.","element":"fire","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_atk_5","name":"Vague incendiaire","category":"spell","type":"active","desc":"Attaque Feu de puissance 7. Disponible au niveau 24.","element":"fire","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_atk_6","name":"Tempête de flammes","category":"spell","type":"active","desc":"Attaque Feu de puissance 8. Disponible au niveau 34.","element":"fire","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_atk_7","name":"Brasier primordial","category":"spell","type":"active","desc":"Attaque Feu de puissance 10. Disponible au niveau 46.","element":"fire","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"fire","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_special_1","name":"Cendre aveuglante","category":"control","type":"active","desc":"Technique Feu utilitaire. Disponible au niveau 12.","element":"fire","power":2,"requiredLevel":12,"effects":[{"kind":"damage","base":2,"element":"fire","target":"enemy"},{"kind":"debuff","stat":"agility","value":-2,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_fire_special_2","name":"Surchauffe","category":"control","type":"active","desc":"Technique Feu utilitaire. Disponible au niveau 28.","element":"fire","power":6,"requiredLevel":28,"effects":[{"kind":"damage","base":6,"element":"fire","target":"enemy"},{"kind":"debuff","stat":"defense","value":-3,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_1","name":"Goutte vive","category":"spell","type":"active","desc":"Attaque Eau de puissance 3. Disponible au niveau 1.","element":"water","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_2","name":"Morsure de marée","category":"melee","type":"active","desc":"Attaque Eau de puissance 4. Disponible au niveau 5.","element":"water","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_3","name":"Jet pressurisé","category":"melee","type":"active","desc":"Attaque Eau de puissance 5. Disponible au niveau 10.","element":"water","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_4","name":"Impact torrentiel","category":"melee","type":"active","desc":"Attaque Eau de puissance 6. Disponible au niveau 16.","element":"water","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_5","name":"Déferlante","category":"spell","type":"active","desc":"Attaque Eau de puissance 7. Disponible au niveau 24.","element":"water","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_6","name":"Tempête marine","category":"spell","type":"active","desc":"Attaque Eau de puissance 8. Disponible au niveau 34.","element":"water","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_atk_7","name":"Raz-de-marée ancestral","category":"spell","type":"active","desc":"Attaque Eau de puissance 10. Disponible au niveau 46.","element":"water","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"water","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_special_1","name":"Brume apaisante","category":"heal","type":"active","desc":"Technique Eau utilitaire. Disponible au niveau 12.","element":"water","power":4,"requiredLevel":12,"effects":[{"kind":"heal","base":4,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_water_special_2","name":"Voile aqueux","category":"defense","type":"active","desc":"Technique Eau utilitaire. Disponible au niveau 28.","element":"water","power":0,"requiredLevel":28,"effects":[{"kind":"buff","stat":"defense","value":3,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_1","name":"Jet de pierre","category":"spell","type":"active","desc":"Attaque Terre de puissance 3. Disponible au niveau 1.","element":"earth","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_2","name":"Coup minéral","category":"melee","type":"active","desc":"Attaque Terre de puissance 4. Disponible au niveau 5.","element":"earth","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_3","name":"Charge tellurique","category":"melee","type":"active","desc":"Attaque Terre de puissance 5. Disponible au niveau 10.","element":"earth","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_4","name":"Impact rocheux","category":"melee","type":"active","desc":"Attaque Terre de puissance 6. Disponible au niveau 16.","element":"earth","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_5","name":"Faille terrestre","category":"spell","type":"active","desc":"Attaque Terre de puissance 7. Disponible au niveau 24.","element":"earth","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_6","name":"Tempête de roc","category":"spell","type":"active","desc":"Attaque Terre de puissance 8. Disponible au niveau 34.","element":"earth","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_atk_7","name":"Séisme primordial","category":"spell","type":"active","desc":"Attaque Terre de puissance 10. Disponible au niveau 46.","element":"earth","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"earth","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_special_1","name":"Peau de pierre","category":"defense","type":"active","desc":"Technique Terre utilitaire. Disponible au niveau 12.","element":"earth","power":0,"requiredLevel":12,"effects":[{"kind":"buff","stat":"defense","value":3,"duration":3,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_earth_special_2","name":"Entrave racinaire","category":"control","type":"active","desc":"Technique Terre utilitaire. Disponible au niveau 28.","element":"earth","power":2,"requiredLevel":28,"effects":[{"kind":"damage","base":2,"element":"earth","target":"enemy"},{"kind":"debuff","stat":"speed","value":-4,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_1","name":"Souffle","category":"spell","type":"active","desc":"Attaque Air de puissance 3. Disponible au niveau 1.","element":"air","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_2","name":"Lame de vent","category":"melee","type":"active","desc":"Attaque Air de puissance 4. Disponible au niveau 5.","element":"air","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_3","name":"Charge aérienne","category":"melee","type":"active","desc":"Attaque Air de puissance 5. Disponible au niveau 10.","element":"air","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_4","name":"Piqué cyclonique","category":"melee","type":"active","desc":"Attaque Air de puissance 6. Disponible au niveau 16.","element":"air","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_5","name":"Rafale majeure","category":"spell","type":"active","desc":"Attaque Air de puissance 7. Disponible au niveau 24.","element":"air","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_6","name":"Tempête céleste","category":"spell","type":"active","desc":"Attaque Air de puissance 8. Disponible au niveau 34.","element":"air","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_atk_7","name":"Ouragan primordial","category":"spell","type":"active","desc":"Attaque Air de puissance 10. Disponible au niveau 46.","element":"air","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"air","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_special_1","name":"Vent arrière","category":"defense","type":"active","desc":"Technique Air utilitaire. Disponible au niveau 12.","element":"air","power":0,"requiredLevel":12,"effects":[{"kind":"buff","stat":"speed","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_air_special_2","name":"Danse aérienne","category":"defense","type":"active","desc":"Technique Air utilitaire. Disponible au niveau 28.","element":"air","power":0,"requiredLevel":28,"effects":[{"kind":"buff","stat":"agility","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_1","name":"Étincelle statique","category":"spell","type":"active","desc":"Attaque Électricité de puissance 3. Disponible au niveau 1.","element":"electric","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_2","name":"Crocs voltés","category":"melee","type":"active","desc":"Attaque Électricité de puissance 4. Disponible au niveau 5.","element":"electric","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_3","name":"Charge éclair","category":"melee","type":"active","desc":"Attaque Électricité de puissance 5. Disponible au niveau 10.","element":"electric","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_4","name":"Impact foudroyant","category":"melee","type":"active","desc":"Attaque Électricité de puissance 6. Disponible au niveau 16.","element":"electric","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_5","name":"Arc majeur","category":"spell","type":"active","desc":"Attaque Électricité de puissance 7. Disponible au niveau 24.","element":"electric","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_6","name":"Orage furieux","category":"spell","type":"active","desc":"Attaque Électricité de puissance 8. Disponible au niveau 34.","element":"electric","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_atk_7","name":"Foudre primordiale","category":"spell","type":"active","desc":"Attaque Électricité de puissance 10. Disponible au niveau 46.","element":"electric","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"electric","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_special_1","name":"Onde paralysante","category":"control","type":"active","desc":"Technique Électricité utilitaire. Disponible au niveau 12.","element":"electric","power":1,"requiredLevel":12,"effects":[{"kind":"damage","base":1,"element":"electric","target":"enemy"},{"kind":"debuff","stat":"speed","value":-5,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_electric_special_2","name":"Surcharge","category":"control","type":"active","desc":"Technique Électricité utilitaire. Disponible au niveau 28.","element":"electric","power":5,"requiredLevel":28,"effects":[{"kind":"damage","base":5,"element":"electric","target":"enemy"},{"kind":"debuff","stat":"defense","value":-2,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_1","name":"Lueur","category":"spell","type":"active","desc":"Attaque Lumière de puissance 3. Disponible au niveau 1.","element":"light","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_2","name":"Rayon clair","category":"melee","type":"active","desc":"Attaque Lumière de puissance 4. Disponible au niveau 5.","element":"light","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_3","name":"Charge solaire","category":"melee","type":"active","desc":"Attaque Lumière de puissance 5. Disponible au niveau 10.","element":"light","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_4","name":"Impact radiant","category":"melee","type":"active","desc":"Attaque Lumière de puissance 6. Disponible au niveau 16.","element":"light","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_5","name":"Onde lumineuse","category":"spell","type":"active","desc":"Attaque Lumière de puissance 7. Disponible au niveau 24.","element":"light","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_6","name":"Tempête astrale","category":"spell","type":"active","desc":"Attaque Lumière de puissance 8. Disponible au niveau 34.","element":"light","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_atk_7","name":"Jugement solaire","category":"spell","type":"active","desc":"Attaque Lumière de puissance 10. Disponible au niveau 46.","element":"light","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"light","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_special_1","name":"Soin lumineux","category":"heal","type":"active","desc":"Technique Lumière utilitaire. Disponible au niveau 12.","element":"light","power":5,"requiredLevel":12,"effects":[{"kind":"heal","base":5,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_light_special_2","name":"Éblouissement","category":"control","type":"active","desc":"Technique Lumière utilitaire. Disponible au niveau 28.","element":"light","power":1,"requiredLevel":28,"effects":[{"kind":"damage","base":1,"element":"light","target":"enemy"},{"kind":"debuff","stat":"agility","value":-4,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_1","name":"Ombre vive","category":"spell","type":"active","desc":"Attaque Ombre de puissance 3. Disponible au niveau 1.","element":"shadow","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_2","name":"Crocs obscurs","category":"melee","type":"active","desc":"Attaque Ombre de puissance 4. Disponible au niveau 5.","element":"shadow","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_3","name":"Charge nocturne","category":"melee","type":"active","desc":"Attaque Ombre de puissance 5. Disponible au niveau 10.","element":"shadow","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_4","name":"Impact spectral","category":"melee","type":"active","desc":"Attaque Ombre de puissance 6. Disponible au niveau 16.","element":"shadow","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_5","name":"Onde noire","category":"spell","type":"active","desc":"Attaque Ombre de puissance 7. Disponible au niveau 24.","element":"shadow","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_6","name":"Tempête abyssale","category":"spell","type":"active","desc":"Attaque Ombre de puissance 8. Disponible au niveau 34.","element":"shadow","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_atk_7","name":"Nuit primordiale","category":"spell","type":"active","desc":"Attaque Ombre de puissance 10. Disponible au niveau 46.","element":"shadow","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"shadow","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_special_1","name":"Drain nocturne","category":"control","type":"active","desc":"Technique Ombre utilitaire. Disponible au niveau 12.","element":"shadow","power":3,"requiredLevel":12,"effects":[{"kind":"damage","base":3,"element":"shadow","target":"enemy"},{"kind":"heal","base":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_shadow_special_2","name":"Voile nocturne","category":"defense","type":"active","desc":"Technique Ombre utilitaire. Disponible au niveau 28.","element":"shadow","power":0,"requiredLevel":28,"effects":[{"kind":"buff","stat":"agility","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_1","name":"Dard toxique","category":"spell","type":"active","desc":"Attaque Poison de puissance 3. Disponible au niveau 1.","element":"poison","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_2","name":"Morsure venimeuse","category":"melee","type":"active","desc":"Attaque Poison de puissance 4. Disponible au niveau 5.","element":"poison","power":4,"requiredLevel":5,"effects":[{"kind":"damage","base":4,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_3","name":"Jet acide","category":"melee","type":"active","desc":"Attaque Poison de puissance 5. Disponible au niveau 10.","element":"poison","power":5,"requiredLevel":10,"effects":[{"kind":"damage","base":5,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_4","name":"Impact toxique","category":"melee","type":"active","desc":"Attaque Poison de puissance 6. Disponible au niveau 16.","element":"poison","power":6,"requiredLevel":16,"effects":[{"kind":"damage","base":6,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_5","name":"Nuage corrosif","category":"spell","type":"active","desc":"Attaque Poison de puissance 7. Disponible au niveau 24.","element":"poison","power":7,"requiredLevel":24,"effects":[{"kind":"damage","base":7,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_6","name":"Tempête de venin","category":"spell","type":"active","desc":"Attaque Poison de puissance 8. Disponible au niveau 34.","element":"poison","power":8,"requiredLevel":34,"effects":[{"kind":"damage","base":8,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_atk_7","name":"Fléau primordial","category":"spell","type":"active","desc":"Attaque Poison de puissance 10. Disponible au niveau 46.","element":"poison","power":10,"requiredLevel":46,"effects":[{"kind":"damage","base":10,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_special_1","name":"Venin persistant","category":"control","type":"active","desc":"Technique Poison utilitaire. Disponible au niveau 12.","element":"poison","power":2,"requiredLevel":12,"effects":[{"kind":"damage","base":1,"element":"poison","target":"enemy"},{"kind":"dot","base":2,"value":2,"duration":3,"element":"poison","target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_poison_special_2","name":"Brouillard toxique","category":"control","type":"active","desc":"Technique Poison utilitaire. Disponible au niveau 28.","element":"poison","power":2,"requiredLevel":28,"effects":[{"kind":"damage","base":2,"element":"poison","target":"enemy"},{"kind":"debuff","stat":"power","value":-3,"duration":3,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_1","name":"Coup vif","category":"melee","type":"active","desc":"Technique neutre de puissance 3. Disponible au niveau 1.","element":"","power":3,"requiredLevel":1,"effects":[{"kind":"damage","base":3,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_2","name":"Charge","category":"melee","type":"active","desc":"Technique neutre de puissance 4. Disponible au niveau 4.","element":"","power":4,"requiredLevel":4,"effects":[{"kind":"damage","base":4,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_3","name":"Feinte","category":"melee","type":"active","desc":"Technique neutre de puissance 3. Disponible au niveau 8.","element":"","power":3,"requiredLevel":8,"effects":[{"kind":"damage","base":3,"target":"enemy"},{"kind":"debuff","stat":"defense","value":-1,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_4","name":"Concentration","category":"utility","type":"active","desc":"Technique neutre de puissance —. Disponible au niveau 10.","element":"","power":0,"requiredLevel":10,"effects":[{"kind":"buff","stat":"agility","value":2,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_5","name":"Coup lourd","category":"melee","type":"active","desc":"Technique neutre de puissance 6. Disponible au niveau 14.","element":"","power":6,"requiredLevel":14,"effects":[{"kind":"damage","base":6,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_6","name":"Garde","category":"utility","type":"active","desc":"Technique neutre de puissance —. Disponible au niveau 18.","element":"","power":0,"requiredLevel":18,"effects":[{"kind":"buff","stat":"defense","value":4,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_7","name":"Percée","category":"melee","type":"active","desc":"Technique neutre de puissance 6. Disponible au niveau 22.","element":"","power":6,"requiredLevel":22,"effects":[{"kind":"damage","base":6,"target":"enemy"},{"kind":"debuff","stat":"defense","value":-2,"duration":2,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_8","name":"Récupération","category":"melee","type":"active","desc":"Technique neutre de puissance 6. Disponible au niveau 26.","element":"","power":6,"requiredLevel":26,"effects":[{"kind":"heal","base":6,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_9","name":"Furie","category":"melee","type":"active","desc":"Technique neutre de puissance 8. Disponible au niveau 32.","element":"","power":8,"requiredLevel":32,"effects":[{"kind":"damage","base":8,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_10","name":"Instinct supérieur","category":"utility","type":"active","desc":"Technique neutre de puissance —. Disponible au niveau 38.","element":"","power":0,"requiredLevel":38,"effects":[{"kind":"buff","stat":"agility","value":5,"duration":2,"target":"self"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_11","name":"Impact ultime","category":"melee","type":"active","desc":"Technique neutre de puissance 10. Disponible au niveau 45.","element":"","power":10,"requiredLevel":45,"effects":[{"kind":"damage","base":10,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true},{"id":"cap_neutral_12","name":"Dernier recours","category":"melee","type":"active","desc":"Technique neutre de puissance 12. Disponible au niveau 55.","element":"","power":12,"requiredLevel":55,"effects":[{"kind":"damage","base":12,"target":"enemy"}],"activeMeta":{"manaCost":0,"weapon":"","cooldown":0},"usageScopes":["captureCreature","enemy"],"builtin":true,"builtinCreature":true,"captureRoster":true}];}
function gensBasicAbilityLibrary(){
  const A=(id,name,category,type,desc,effects=[],usageScopes=["rpgHero","enemy"])=>({
    id,name,category,type,desc,effects,
    activeMeta:type==="active"?{manaCost:0,weapon:"",cooldown:0}:null,
    usageScopes,builtin:true
  });
  const C=(id,name,category,desc,element="",effects=[])=>({
    id,name,category,type:"active",desc,element,
    effects:effects.length?effects:[{kind:"damage",base:1,element}],
    activeMeta:{manaCost:0,weapon:"",cooldown:0},
    usageScopes:["captureCreature","enemy"],
    builtin:true,builtinCreature:true
  });

  return [
    // ===== SOCLE GÉNÉRIQUE RPG / HÉROS =====
    A("lib_stat_force_1","+1 Force","stat","passive","Augmente la Force de 1.",[{kind:"attribute",attribute:"force",value:1,valueMode:"flat"}]),
    A("lib_stat_force_10","+10% Force","stat","passive","Augmente la Force de 10%.",[{kind:"attribute",attribute:"force",value:10,valueMode:"percent"}]),
    A("lib_stat_agility_1","+1 Agilité","stat","passive","Augmente l’Agilité de 1.",[{kind:"attribute",attribute:"agilite",value:1,valueMode:"flat"}]),
    A("lib_stat_agility_10","+10% Agilité","stat","passive","Augmente l’Agilité de 10%.",[{kind:"attribute",attribute:"agilite",value:10,valueMode:"percent"}]),
    A("lib_stat_int_1","+1 Intelligence","stat","passive","Augmente l’Intelligence de 1.",[{kind:"attribute",attribute:"intelligence",value:1,valueMode:"flat"}]),
    A("lib_stat_spirit_1","+1 Esprit","stat","passive","Augmente l’Esprit de 1.",[{kind:"attribute",attribute:"esprit",value:1,valueMode:"flat"}]),
    A("lib_stat_endurance_1","+1 Endurance","stat","passive","Augmente l’Endurance de 1.",[{kind:"attribute",attribute:"endurance",value:1,valueMode:"flat"}]),
    A("lib_stat_initiative_1","+1 Initiative","stat","passive","Augmente l’Initiative de 1.",[{kind:"initiative",value:1,valueMode:"flat"}]),
    A("lib_hp_5","+5 PV max","stat","passive","Augmente les PV maximum de 5.",[{kind:"maxHp",value:5,valueMode:"flat"}]),
    A("lib_hp_10pct","+10% PV max","stat","passive","Augmente les PV maximum de 10%.",[{kind:"maxHp",value:10,valueMode:"percent"}]),
    A("lib_mana_5","+5 Mana max","stat","passive","Augmente le Mana maximum de 5.",[{kind:"mana",value:5,valueMode:"flat"}]),
    A("lib_defense_2","+2 Défense","defense","passive","Augmente la Défense de 2.",[{kind:"defense",value:2,valueMode:"flat"}]),
    A("lib_armor_1","+1 Armure","defense","passive","Augmente l’Armure de 1.",[{kind:"armor",value:1,valueMode:"flat"}]),
    A("lib_crit_5","+5% Critique","stat","passive","Augmente les chances de critique de 5%.",[{kind:"crit",value:5,valueMode:"percent"}]),
    A("lib_dodge_5pct","+5% Esquive","defense","passive","Augmente l’esquive de 5%.",[{kind:"dodge",value:5,valueMode:"percent"}]),
    A("lib_regen_hp_1","Régénération +1 PV","heal","passive","Récupère 1 PV par tour.",[{kind:"regenHp",value:1,valueMode:"flat"}]),
    A("lib_regen_mana_1","Régénération +1 Mana","utility","passive","Récupère 1 Mana par tour.",[{kind:"regenMana",value:1,valueMode:"flat"}]),

    A("lib_melee_strike","Frappe","melee","active","Attaque de mêlée simple.",[{kind:"damage",base:3}]),
    A("lib_power_strike","Frappe puissante","melee","active","Attaque de mêlée plus lente mais plus forte.",[{kind:"damage",base:5}]),
    A("lib_guard_break","Brise-garde","melee","active","Inflige des dégâts et réduit la Défense.",[{kind:"damage",base:3},{kind:"debuff",stat:"defense",value:-2,duration:2}]),
    A("lib_stunning_blow","Coup étourdissant","melee","active","Frappe lourde qui réduit l’Initiative.",[{kind:"damage",base:4},{kind:"debuff",stat:"initiative",value:-3,duration:1}]),
    A("lib_cleave","Balayage","melee","active","Attaque plusieurs cibles proches.",[{kind:"damage",base:4,target:"multi"}]),

    A("lib_ranged_shot","Tir précis","ranged","active","Attaque simple à distance.",[{kind:"damage",base:3}]),
    A("lib_multi_shot","Tir multiple","ranged","active","Attaque plusieurs cibles à distance.",[{kind:"damage",base:2,target:"multi"}]),
    A("lib_aimed_shot","Tir visé","ranged","active","Attaque à distance puissante.",[{kind:"damage",base:5}]),

    A("lib_magic_bolt","Projectile magique","spell","active","Attaque magique neutre.",[{kind:"damage",base:3}]),
    A("lib_arcane_burst","Explosion arcanique","spell","active","Attaque magique de zone.",[{kind:"damage",base:4,target:"zone"}]),
    A("lib_slow","Ralentissement","control","active","Réduit temporairement l’Initiative.",[{kind:"debuff",stat:"initiative",value:-3,duration:2}]),
    A("lib_weakness","Faiblesse","control","active","Réduit temporairement la Force.",[{kind:"debuff",stat:"force",value:-2,duration:2}]),

    A("lib_heal_5","Soin mineur","heal","active","Rend 5 PV à une cible.",[{kind:"heal",base:5}]),
    A("lib_heal_10","Soin majeur","heal","active","Rend 10 PV à une cible.",[{kind:"heal",base:10}]),
    A("lib_regen","Régénération","heal","active","Rend progressivement des PV.",[{kind:"hot",base:2,duration:3}]),
    A("lib_magic_barrier","Barrière magique","defense","active","Augmente temporairement la Défense.",[{kind:"buff",stat:"defense",value:3,duration:2}]),
    A("lib_dodge_5","Esquive instinctive","defense","active","Augmente temporairement l’Agilité.",[{kind:"buff",stat:"agilite",value:3,duration:2}]),


    // ===== POOL RPG ÉTENDU RESTAURÉ =====
    A("rpg_heal_group","Soin de groupe","heal","active","Soigne tous les alliés.",[
      {kind:"heal_all",base:3,scaleAttribute:"esprit",scaleCoeff:0.2,target:"all_allies",duration:0}
    ]),
    A("rpg_regen_active","Régénération","heal","active","Soigne progressivement pendant 3 tours.",[
      {kind:"hot",base:2,scaleAttribute:"esprit",scaleCoeff:0.15,target:"ally",duration:3}
    ]),
    A("rpg_heal_big","Soin majeur","heal","active","Soigne fortement un allié.",[
      {kind:"heal",base:8,scaleAttribute:"esprit",scaleCoeff:0.5,target:"ally",duration:0}
    ]),

    A("rpg_slash_bleed","Frappe tranchante","melee","active","Inflige des dégâts puis un saignement pendant 3 tours.",[
      {kind:"damage",base:3,scaleAttribute:"force",scaleCoeff:0.5,target:"enemy",damageType:"physical",duration:0},
      {kind:"dot",base:2,scaleAttribute:"force",scaleCoeff:0.15,target:"enemy",damageType:"physical",status:"bleed",duration:3}
    ]),
    A("rpg_cleave","Frappe circulaire","melee","active","Frappe tous les ennemis proches.",[
      {kind:"area_damage",base:3,scaleAttribute:"force",scaleCoeff:0.45,target:"all_enemies",damageType:"physical"}
    ]),
    A("rpg_guard_break","Brise-garde","melee","active","Inflige des dégâts et réduit la Défense pendant 2 tours.",[
      {kind:"damage",base:2,scaleAttribute:"force",scaleCoeff:0.4,target:"enemy",damageType:"physical"},
      {kind:"stat_mod",stat:"defense",value:-3,target:"enemy",duration:2}
    ]),
    A("rpg_stunning_blow","Coup étourdissant","melee","active","Coup lourd qui pénalise fortement l’Initiative de la cible.",[
      {kind:"damage",base:2,scaleAttribute:"force",scaleCoeff:0.35,target:"enemy",damageType:"physical"},
      {kind:"stat_mod",stat:"initiative",value:-5,target:"enemy",duration:1}
    ]),
    A("rpg_lifesteal_strike","Frappe vampirique","melee","active","Inflige des dégâts et rend une partie des PV.",[
      {kind:"life_steal",base:4,scaleAttribute:"force",scaleCoeff:0.45,target:"enemy",damageType:"physical"}
    ]),

    A("rpg_piercing_shot","Tir perforant","ranged","active","Tir précis qui réduit temporairement la Défense.",[
      {kind:"damage",base:4,scaleAttribute:"agilite",scaleCoeff:0.55,target:"enemy",damageType:"physical"},
      {kind:"stat_mod",stat:"defense",value:-2,target:"enemy",duration:1}
    ]),
    A("rpg_burst_shot","Tir en rafale","ranged","active","Effectue plusieurs impacts rapides sur une cible.",[
      {kind:"double_strike",base:2,scaleAttribute:"agilite",scaleCoeff:0.3,target:"enemy",damageType:"physical"}
    ]),
    A("rpg_multi_shot","Tir multiple","ranged","active","Touche plusieurs ennemis.",[
      {kind:"area_damage",base:3,scaleAttribute:"agilite",scaleCoeff:0.4,target:"all_enemies",damageType:"physical"}
    ]),
    A("rpg_poison_shot","Tir empoisonné","ranged","active","Inflige des dégâts puis un poison pendant 3 tours.",[
      {kind:"damage",base:2,scaleAttribute:"agilite",scaleCoeff:0.35,target:"enemy",damageType:"physical"},
      {kind:"dot",base:2,scaleAttribute:"esprit",scaleCoeff:0.1,target:"enemy",damageType:"physical",element:"poison",status:"poison",duration:3}
    ]),

    A("rpg_magic_bolt","Projectile magique","spell","active","Inflige des dégâts magiques neutres.",[
      {kind:"magic_damage",base:5,scaleAttribute:"intelligence",scaleCoeff:0.6,target:"enemy",damageType:"magical"}
    ]),
    A("rpg_fire_bolt","Trait de feu","spell","active","Projectile magique de Feu.",[
      {kind:"magic_damage",base:5,scaleAttribute:"intelligence",scaleCoeff:0.55,target:"enemy",damageType:"magical",element:"fire"}
    ]),
    A("rpg_fireball","Boule de feu","spell","active","Dégâts magiques de zone de Feu.",[
      {kind:"area_damage",base:6,scaleAttribute:"intelligence",scaleCoeff:0.7,target:"all_enemies",damageType:"magical",element:"fire"}
    ]),
    A("rpg_burning_touch","Brûlure","spell","active","Inflige de lourds dégâts de Feu sur une courte durée.",[
      {kind:"dot",base:3,scaleAttribute:"intelligence",scaleCoeff:0.2,target:"enemy",damageType:"magical",element:"fire",status:"burn",duration:2}
    ]),
    A("rpg_chain_lightning","Éclair en chaîne","spell","active","Frappe plusieurs ennemis avec de l’électricité.",[
      {kind:"area_damage",base:5,scaleAttribute:"intelligence",scaleCoeff:0.55,target:"all_enemies",damageType:"magical",element:"electric"}
    ]),
    A("rpg_drain","Drain vital","spell","active","Inflige des dégâts magiques et rend des PV.",[
      {kind:"life_steal",base:5,scaleAttribute:"intelligence",scaleCoeff:0.45,target:"enemy",damageType:"magical",element:"shadow"}
    ]),

    A("rpg_affliction","Affliction","control","active","Inflige des dégâts magiques sur la durée.",[
      {kind:"dot",base:2,scaleAttribute:"esprit",scaleCoeff:0.2,target:"enemy",damageType:"magical",duration:3}
    ]),
    A("rpg_slow","Entrave","control","active","Réduit l’Initiative de la cible pendant 2 tours.",[
      {kind:"stat_mod",stat:"initiative",value:-4,target:"enemy",duration:2}
    ]),
    A("rpg_def_down","Brise-garde magique","control","active","Réduit la Défense d’un ennemi pendant 2 tours.",[
      {kind:"stat_mod",stat:"defense",value:-3,target:"enemy",duration:2}
    ]),

    A("rpg_earth_guard","Peau de pierre","defense","active","Augmente la résistance physique pendant 3 tours.",[
      {kind:"resistance_mod",resistanceKind:"physical",value:30,target:"self",duration:3}
    ]),
    A("rpg_magic_barrier","Barrière magique","defense","active","Augmente la résistance magique d’un allié.",[
      {kind:"resistance_mod",resistanceKind:"magic",value:30,target:"ally",duration:3}
    ]),
    A("rpg_res_protection","Protection","defense","active","Accorde +25% de résistance physique pendant 2 tours.",[
      {kind:"resistance_mod",resistanceKind:"physical",value:25,target:"ally",duration:2}
    ]),
    A("rpg_team_defense","Cri protecteur","defense","active","Augmente la Défense de toute l’équipe pendant 2 tours.",[
      {kind:"stat_mod",stat:"defense",value:3,target:"all_allies",duration:2}
    ]),

    A("rpg_res_phys_10","+10% Résistance physique","defense","passive","Réduit de 10% les dégâts physiques.",[
      {kind:"resistance",value:10,valueMode:"percent",resistanceKind:"physical",scope:"self",condition:"always"}
    ]),
    A("rpg_res_mag_10","+10% Résistance magique","defense","passive","Réduit de 10% les dégâts magiques.",[
      {kind:"resistance",value:10,valueMode:"percent",resistanceKind:"magic",scope:"self",condition:"always"}
    ]),
    A("rpg_regen_hp_passive","Régénération passive","heal","passive","Rend 1 PV au début de chaque tour.",[
      {kind:"regenHp",value:1,valueMode:"flat",scope:"self",condition:"always"}
    ]),
    A("rpg_regen_mana_passive","Régénération de Mana","utility","passive","Rend 1 Mana au début de chaque tour.",[
      {kind:"regenMana",value:1,valueMode:"flat",scope:"self",condition:"always"}
    ]),

    // ===== COMPÉTENCES DE CRÉATURES CAPTURABLES =====
    C("lib_fire_bolt","Étincelle ardente","spell","Projectile de feu rapide.","fire",[{kind:"damage",base:3,element:"fire"}]),
    C("lib_fireball","Boule de braise","spell","Explosion de feu plus puissante.","fire",[{kind:"damage",base:5,element:"fire"}]),
    C("lib_flame_bite","Morsure brûlante","melee","Morsure chargée de feu.","fire",[{kind:"damage",base:4,element:"fire"}]),
    C("lib_heat_wave","Vague de chaleur","control","Affaiblit temporairement la défense adverse.","fire",[{kind:"debuff",stat:"defense",value:-2,duration:2}]),

    C("lib_water_bolt","Jet d’eau","ranged","Attaque d’eau à distance.","water",[{kind:"damage",base:3,element:"water"}]),
    C("lib_tidal_bite","Morsure de marée","melee","Frappe aquatique lourde.","water",[{kind:"damage",base:4,element:"water"}]),
    C("lib_aqua_heal","Onde régénérante","heal","Rend des PV à une cible alliée.","water",[{kind:"heal",base:4}]),
    C("lib_mist_guard","Brume protectrice","defense","Augmente temporairement la défense.","water",[{kind:"buff",stat:"defense",value:2,duration:2}]),

    C("lib_rock_slam","Impact rocheux","melee","Coup de roche puissant.","earth",[{kind:"damage",base:5,element:"earth"}]),
    C("lib_earth_guard","Carapace minérale","defense","Renforce l’armure temporairement.","earth",[{kind:"buff",stat:"armor",value:2,duration:2}]),
    C("lib_root_snare","Entrave racinaire","control","Réduit l’agilité de la cible.","earth",[{kind:"debuff",stat:"agilite",value:-2,duration:2}]),
    C("lib_quake","Secousse","spell","Attaque de zone terrestre.","earth",[{kind:"damage",base:4,element:"earth",target:"zone"}]),

    C("lib_chain_lightning","Arc électrique","spell","Éclair pouvant se propager.","electric",[{kind:"damage",base:4,element:"electric"}]),
    C("lib_static_bite","Crocs statiques","melee","Morsure électrique.","electric",[{kind:"damage",base:3,element:"electric"}]),
    C("lib_thunder_dash","Charge foudroyante","melee","Attaque rapide chargée d’électricité.","electric",[{kind:"damage",base:4,element:"electric"}]),
    C("lib_paralyze","Paralysie","control","Réduit fortement l’Initiative adverse.","electric",[{kind:"debuff",stat:"initiative",value:-4,duration:2}]),

    C("lib_gust","Rafale","ranged","Attaque d’air à distance.","air",[{kind:"damage",base:3,element:"air"}]),
    C("lib_wind_blade","Lame de vent","ranged","Tranche à distance avec une lame d’air.","air",[{kind:"damage",base:4,element:"air"}]),
    C("lib_aerial_dive","Piqué","melee","Attaque rapide depuis les airs.","air",[{kind:"damage",base:4,element:"air"}]),
    C("lib_tailwind","Vent arrière","utility","Augmente temporairement l’Initiative.","air",[{kind:"buff",stat:"initiative",value:3,duration:2}]),

    C("lib_light_bolt","Rayon lumineux","spell","Attaque de lumière.","light",[{kind:"damage",base:3,element:"light"}]),
    C("lib_flash","Éblouissement","control","Réduit temporairement l’Initiative.","light",[{kind:"debuff",stat:"initiative",value:-2,duration:2}]),

    C("lib_shadow_bite","Morsure obscure","melee","Attaque d’ombre au contact.","shadow",[{kind:"damage",base:4,element:"shadow"}]),
    C("lib_drain","Drain d’ombre","spell","Inflige des dégâts et affaiblit la cible.","shadow",[{kind:"damage",base:3,element:"shadow"},{kind:"debuff",stat:"force",value:-2,duration:2}]),
    C("lib_lifesteal_strike","Frappe vampirique","melee","Blesse puis rend une partie des PV.","shadow",[{kind:"damage",base:4,element:"shadow"},{kind:"heal",base:2,target:"self"}]),
    C("lib_night_veil","Voile nocturne","defense","Augmente temporairement l’Agilité.","shadow",[{kind:"buff",stat:"agilite",value:3,duration:2}])
  ];
}

function gensCaptureNormalizeMoveBalance(a){
  if(!a||gensAbilityLibraryId(a)!=="creature")return a;
  const damage=(a.effects||[]).find(e=>String(e?.kind||"").toLowerCase()==="damage");
  if(a.power===undefined)a.power=Math.max(0,Number(damage?.base)||0);
  if(a.requiredLevel===undefined){
    const p=Math.max(0,Number(a.power)||0);
    a.requiredLevel=p<=3?1:p<=4?5:p<=5?10:p<=6?16:p<=7?24:p<=8?34:46;
  }
  return a;
}
function loadAbilityLibrary(){
  let arr=[];
  try{arr=JSON.parse(localStorage.getItem(GENSRPG_ABILITY_LIBRARY_KEY)||"[]")}catch(e){arr=[]}
  if(!Array.isArray(arr))arr=[];

  const base=[...gensBasicAbilityLibrary(),...gensCaptureExpandedAbilityRoster()];
  const byId=new Map(arr.map(x=>[String(x.id),x]));
  let changed=false;

  base.forEach(def=>{
    const old=byId.get(String(def.id));
    if(!old){
      arr.push(def);changed=true;return;
    }
    if(!Array.isArray(old.usageScopes)){
      old.usageScopes=gensAbilityUsages({...def,...old});changed=true;
    }
  });

  arr.forEach(a=>{
    if(gensAbilityLibraryId(a)==="creature"){
      const before=JSON.stringify({power:a.power,requiredLevel:a.requiredLevel});
      gensCaptureNormalizeMoveBalance(a);
      if(before!==JSON.stringify({power:a.power,requiredLevel:a.requiredLevel}))changed=true;
    }
    if(!a.libraryId){a.libraryId=gensAbilityLibraryId(a);changed=true}
    if(!Array.isArray(a.usageScopes)||!a.usageScopes.length){
      a.usageScopes=gensAbilityUsages(a);changed=true;
    }
    // Une compétence générique intégrée non spécifique aux créatures doit être visible côté héros.
    if(a.builtin && !a.builtinCreature && !a.usageScopes.includes("rpgHero")){
      a.usageScopes.push("rpgHero");changed=true;
    }
  });

  if(changed)try{localStorage.setItem(GENSRPG_ABILITY_LIBRARY_KEY,JSON.stringify(arr))}catch(e){}
  return arr;
}
function saveAbilityLibrary(arr){localStorage.setItem(GENSRPG_ABILITY_LIBRARY_KEY,JSON.stringify(Array.isArray(arr)?arr:[]));}
function abilityById(id){return loadAbilityLibrary().find(x=>String(x.id)===String(id))||null}
function gensAbilityCategoryLabel(id){return (GENSRPG_ABILITY_CATEGORIES.find(x=>x[0]===id)||["","🧰 Autre"])[1]}
function gensAbilityClone(a){return JSON.parse(JSON.stringify(a||{}))}
function gensAbilityToTalentNode(a,slotIndex,existing=null,set=null){
  a=gensAbilityClone(a);
  const node={
    id:existing?.id||("tal_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5)),
    librarySkillId:a.id,
    name:a.name||"Compétence",
    desc:a.desc||"",
    type:a.type==="active"?"active":"passive",
    slotIndex,
    tier:dungeonTalentSlotTier(slotIndex),
    cost:Math.max(1,Number(existing?.cost)||1),
    requires:dungeonAutoPrerequisitesForSlot(set,slotIndex),
    effects:gensAbilityClone(a.effects||[])
  };
  if(node.type==="active"){
    node.activeMeta=gensAbilityClone(a.activeMeta||{manaCost:0,weapon:"",cooldown:0});
    const first=node.effects[0]||{};
    node.active={kind:first.kind||"damage",amount:Math.max(0,Number(first.base)||0),manaCost:node.activeMeta.manaCost||0,weapon:node.activeMeta.weapon||"",cooldown:node.activeMeta.cooldown||0};
  }
  return node;
}
function syncTalentNodesFromAbilityLibrary(){
  const lib=new Map(loadAbilityLibrary().map(a=>[String(a.id),a]));
  const sets=loadDungeonTalentSets();
  let changed=false;
  sets.forEach(set=>{
    set.nodes=(set.nodes||[]).map(n=>{
      if(!n?.librarySkillId)return n;
      const a=lib.get(String(n.librarySkillId));if(!a)return n;
      const fresh=gensAbilityToTalentNode(a,Number(n.slotIndex)||0,n,set);
      fresh.id=n.id;fresh.cost=n.cost;fresh.requires=dungeonAutoPrerequisitesForSlot(set,Number(n.slotIndex)||0);
      changed=true;return fresh;
    });
  });
  if(changed)localStorage.setItem(GENS_DUNGEON_TALENT_SETS_KEY,JSON.stringify(sets.map(normalizeDungeonTalentSetSlots)));
}

const Z40K_SKILL_LIBRARY_KEY="z40k_skill_library_v2";

const Z40K_NATIVE_SKILLS=[
{id:"native_tourelle",name:"Tourelle",type:"deployable",desc:"Déploie une tourelle : 3 PV, 3 tirs, touche automatiquement, Force 1.",native:true,deployable:{name:"Tourelle",hp:3,dice:3,autoHit:true,accuracy:1,strength:1,range:0,recoverable:true,destroyedPermanent:true}},
{id:"native_chien",name:"Chien Robot",type:"deployable",desc:"3 PV, attaque 2 dés, précision 3+, Force 1.",native:true,deployable:{name:"Chien Robot",hp:3,dice:2,autoHit:false,accuracy:3,strength:1,range:0,recoverable:false,destroyedPermanent:true}},
{id:"native_miracle",name:"Miracle",type:"active",desc:"Ressuscite un allié selon la règle.",native:true,active:{uses:1,roll:false}},
{id:"native_extermination",name:"Extermination",type:"active",desc:"Détruit tous les zombies de la zone selon la règle.",native:true,active:{uses:2,roll:false}},
{id:"native_soins",name:"Soins intensifs",type:"active",desc:"Rend 1 PV à tous les alliés de la zone.",native:true,active:{uses:2,roll:false}},
{id:"native_grappin",name:"Grappin",type:"text",desc:"Attire un allié en ligne de vue jusqu'à sa zone. 1 action.",native:true},
{id:"native_diversion",name:"Diversion",type:"text",desc:"Place une diversion selon la règle.",native:true},
{id:"native_econome",name:"Économe",type:"text",desc:"Effet automatique : quand le héros recharge, lance 1D6 ; sur 5/6 il conserve le chargeur.",native:true},
{id:"native_action",name:"+1 Action",type:"text",desc:"Effet automatique : ajoute 1 action au total lorsque la compétence est débloquée.",native:true},
{id:"native_melee_die",name:"+1 dé de mêlée",type:"text",desc:"Effet automatique : ajoute +1 dé à chaque attaque de mêlée.",native:true,effect:{kind:"combat_dice",mode:"melee",value:1}},
{id:"native_ranged_die",name:"+1 dé à distance",type:"text",desc:"Effet automatique : ajoute +1 dé à chaque attaque à distance.",native:true,effect:{kind:"combat_dice",mode:"ranged",value:1}},
{id:"native_combat_die",name:"+1 dé de combat",type:"text",desc:"Effet automatique : ajoute +1 dé aux attaques de mêlée et à distance.",native:true,effect:{kind:"combat_dice",mode:"all",value:1}},
{id:"native_melee_result",name:"+1 au résultat de mêlée",type:"text",desc:"Effet automatique : ajoute +1 au résultat de chaque dé d'attaque de mêlée.",native:true,effect:{kind:"combat_result",mode:"melee",value:1}},
{id:"native_ranged_result",name:"+1 au résultat à distance",type:"text",desc:"Effet automatique : ajoute +1 au résultat de chaque dé d'attaque à distance.",native:true,effect:{kind:"combat_result",mode:"ranged",value:1}},
{id:"native_combat_result",name:"+1 au résultat des jets de combat",type:"text",desc:"Effet automatique : ajoute +1 au résultat de chaque dé de mêlée et de tir.",native:true,effect:{kind:"combat_result",mode:"all",value:1}},
{id:"native_melee_force",name:"+1 Force en mêlée",type:"text",desc:"Effet automatique : +1 Force pour les attaques de mêlée.",native:true,effect:{kind:"strength",mode:"melee",value:1}},
{id:"native_ranged_force",name:"+1 Force à distance",type:"text",desc:"Effet automatique : +1 Force pour les attaques à distance.",native:true,effect:{kind:"strength",mode:"ranged",value:1}},
{id:"native_combat_force",name:"+1 Force de combat",type:"text",desc:"Effet automatique : +1 Force en mêlée et à distance.",native:true,effect:{kind:"strength",mode:"all",value:1}},
{id:"native_armor_save",name:"+1 au jet de sauvegarde",type:"text",desc:"Effet automatique : améliore de +1 le résultat des jets de sauvegarde d'armure.",native:true,effect:{kind:"armor_result",value:1}},
{id:"native_move",name:"+1 déplacement gratuit",type:"text",desc:"Effet automatique : donne 1 action de déplacement gratuite.",native:true,effect:{kind:"free_move",value:1}},
{id:"native_max_hp",name:"+1 PV maximum",type:"text",desc:"Effet automatique : augmente de 1 le maximum de PV du héros.",native:true,effect:{kind:"max_hp",value:1}}
];
function allSelectableSkills(){
  const norm=s=>String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const seen=new Set();
  const out=[];

  Z40K_NATIVE_SKILLS.forEach(s=>{
    const k=norm(s.name)+"|"+(s.type||"text");
    if(seen.has(k))return;
    seen.add(k);out.push(s);
  });

  loadSkillLibrary().forEach(s=>{
    const k=norm(s.name)+"|"+(s.type||"text");
    if(seen.has(k))return;
    seen.add(k);out.push(s);
  });

  return out;
}
function findSelectableSkill(id){return allSelectableSkills().find(s=>s.id===id)||null}

let seEditingId=null;

let libraryTargetSlot=null;

function chooseSkillFromLibrary(id){
  const skill=findSelectableSkill(id);
  if(!skill)return;

  // If the library was opened from a specific hero slot, assign immediately.
  if(libraryTargetSlot!==null){
    hcAssignedSkillIds[libraryTargetSlot]=id;
    renderHeroSkillSlots(null,true);
    closeSkillLibrary();
    libraryTargetSlot=null;
    return;
  }

  // Otherwise ask which slot to use with an in-app selector.
  openSkillSlotPicker(id);
}

function openSkillLibraryForSlot(i){
  if(isDungeonMode()){
    alert("En mode Dungeon, les compétences se débloquent dans l’arbre de compétences du héros.");
    return;
  }
  libraryTargetSlot=i;
  openSkillLibrary();
}

function openSkillSlotPicker(skillId){
  const ov=document.getElementById("skillSlotPickerOverlay");
  if(!ov)return;
  ov.dataset.skillId=skillId;
  document.getElementById("skillSlotPickerTitle").textContent="Choisir l'emplacement";
  ov.classList.add("open");
}

function closeSkillSlotPicker(){
  const ov=document.getElementById("skillSlotPickerOverlay");
  if(ov)ov.classList.remove("open");
}

function assignLibrarySkillToSlot(i){
  const ov=document.getElementById("skillSlotPickerOverlay");
  const id=ov?.dataset.skillId;
  if(!id)return;
  hcAssignedSkillIds[i]=id;
  renderHeroSkillSlots(null,true);
  closeSkillSlotPicker();
  closeSkillLibrary();
}

let hcAssignedSkillIds=[null,null,null,null,null,null,null];


function migrateLegacyCustomSkillsToLibrary(){
  const lib=loadSkillLibrary();
  const norm=s=>String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const nativeKeys=new Set(Z40K_NATIVE_SKILLS.map(s=>norm(s.name)+"|"+(s.type||"text")));
  const bySignature=new Set(lib.map(s=>(s.name||"").trim().toLowerCase()+"|"+(s.desc||"").trim().toLowerCase()));
  let changed=false;

  loadCustomHeroesMulti().forEach(h=>{
    (h.skills||[]).forEach(s=>{
      const name=(s.title||"").trim();
      const desc=(s.desc||"").trim();
      if(!name)return;
      if(name==="Compétence personnalisée" && !desc)return;

      const type=s.mechanic==="deployable"?"deployable":s.mechanic==="active"?"active":"text";
      if(nativeKeys.has(norm(name)+"|"+type))return;

      const sig=name.toLowerCase()+"|"+desc.toLowerCase();
      if(bySignature.has(sig))return;

      lib.push({
        id:"migrated_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),
        name,type,desc,
        deployable:s.deployable||null,
        active:s.active||null,
        migrated:true
      });
      bySignature.add(sig);
      changed=true;
    });
  });

  if(changed)saveSkillLibrary(lib);
  return changed;
}

function loadSkillLibrary(){
  try{
    const a=JSON.parse(localStorage.getItem(Z40K_SKILL_LIBRARY_KEY)||"[]");
    return Array.isArray(a)?a:[];
  }catch(e){return[]}
}
function saveSkillLibrary(list){
  localStorage.setItem(Z40K_SKILL_LIBRARY_KEY,JSON.stringify(list));
}
function findSkillInLibrary(id){return loadSkillLibrary().find(s=>s.id===id)||null}

function renderHeroSkillSlots(hero=null,preserve=false){
  if(!preserve){
    hcProgressionSlots=hcNormalizeProgressionSlots(hero);
    const skills=hero?.skills||[];
    hcAssignedSkillIds=hcProgressionSlots.map((slot,i)=>skills[i]?.libraryId||null);
  }
  if(!hcProgressionSlots.length)hcProgressionSlots=hcClassicProgressionSlots();
  while(hcAssignedSkillIds.length<hcProgressionSlots.length)hcAssignedSkillIds.push(null);
  hcAssignedSkillIds.length=hcProgressionSlots.length;
  const host=document.getElementById("hcSkillSlots");if(!host)return;
  host.innerHTML=hcProgressionSlots.map((slot,i)=>{
    const sk=hcAssignedSkillIds[i]?findSelectableSkill(hcAssignedSkillIds[i]):null;
    return '<div class="v2SkillSlot '+z40kEscAttr(slot.color)+'">'+
      '<div style="display:grid;grid-template-columns:1fr 92px 100px;gap:6px;align-items:end">'+
        '<label class="small">Nom du palier<input value="'+z40kEscAttr(slot.label)+'" onchange="hcUpdateProgressionSlot('+i+',\'label\',this.value)"></label>'+
        '<label class="small">Seuil XP<input type="number" min="0" value="'+Number(slot.unlock||0)+'" onchange="hcUpdateProgressionSlot('+i+',\'unlock\',this.value)"></label>'+
        '<label class="small">Couleur<select onchange="hcUpdateProgressionSlot('+i+',\'color\',this.value)">'+hcProgressionColorOptions(slot.color)+'</select></label>'+
      '</div>'+
      '<div class="v2Assigned" style="margin-top:7px">'+(sk?'<strong>'+z40kEscHtml(sk.name)+'</strong><small>'+z40kEscHtml(sk.desc||"")+'</small>':'<span class="small">Aucune compétence assignée</span>')+'</div>'+
      '<div class="v2LibActions"><button type="button" onclick="openSkillLibraryForSlot('+i+')">📚 CHOISIR</button>'+
      (sk&&!sk.native?'<button type="button" onclick="openSkillEditor(\''+z40kEscAttr(sk.id)+'\')">✏️ ÉDITER</button>':'')+
      (sk?'<button type="button" class="creatorDelete" onclick="clearSkillSlot('+i+')">✕ RETIRER</button>':'')+
      '<button type="button" onclick="hcMoveProgressionTier('+i+',-1)" '+(i===0?'disabled':'')+'>↑</button>'+
      '<button type="button" onclick="hcMoveProgressionTier('+i+',1)" '+(i===hcProgressionSlots.length-1?'disabled':'')+'>↓</button>'+
      '<button type="button" class="creatorDelete" onclick="hcRemoveProgressionTier('+i+')">🗑 PALIER</button></div></div>';
  }).join("");
}

let skillPickerSlot=null;

function chooseSkillForSlot(i){
  openSkillPicker(i);
}

function openSkillPicker(i){
  migrateLegacyCustomSkillsToLibrary();
  skillPickerSlot=i;
  const slot=HC_SKILL_TEMPLATE[i];
  document.getElementById("skillPickerTitle").textContent="📚 Choisir — "+slot.label;
  document.getElementById("skillPickerSearch").value="";
  document.getElementById("skillPickerOverlay").classList.add("open");
  renderCustomSkillPickerStatic();
  filterSkillPickerStatic();
}

function closeSkillPicker(){
  document.getElementById("skillPickerOverlay").classList.remove("open");
  skillPickerSlot=null;
}

function skillPickerBackdrop(e){
  if(e.target && e.target.id==="skillPickerOverlay")closeSkillPicker();
}

function renderCustomSkillPickerStatic(){
  const box=document.getElementById("customSkillPickerList");
  if(!box)return;
  box.innerHTML="";
}

function filterSkillPickerStatic(){
  const q=(document.getElementById("skillPickerSearch")?.value||"").toLowerCase().trim();
  document.querySelectorAll("#skillPickerContent .skillPickCard").forEach(card=>{
    const hay=(card.getAttribute("data-search")||"").toLowerCase();
    card.style.display=(!q||hay.includes(q))?"block":"none";
  });
}

function assignSkillToCurrentSlot(id){
  if(skillPickerSlot===null)return;
  const skill=findSelectableSkill(id);
  if(!skill){alert("Compétence introuvable : "+id);return;}
  hcAssignedSkillIds[skillPickerSlot]=id;
  renderHeroSkillSlots(null,true);
  closeSkillPicker();
}

function clearSkillSlot(i){
  hcAssignedSkillIds[i]=null;
  renderHeroSkillSlots(null,true);
}
function skillTypeLabel(type){
  if(type==="deployable")return "Déployable";
  if(type==="active")return "Activable";
  if(type==="stat")return "Bonus de stats";
  return "Textuelle";
}

function openSkillLibrary(){
  migrateLegacyCustomSkillsToLibrary();
  const lib=document.getElementById("skillLibraryPanel");
  const editor=document.getElementById("skillEditorPanel");
  if(editor && editor.style.display!=="none")closeSkillEditor();
  if(!lib){alert("Panneau Mes compétences introuvable.");return}
  lib.style.display="block";
  renderSkillLibrary();
  setTimeout(()=>lib.scrollIntoView({behavior:"smooth",block:"start"}),20);
}
function closeSkillLibrary(){
  const lib=document.getElementById("skillLibraryPanel");
  if(lib)lib.style.display="none";
}
function renderSkillLibrary(){
  const box=document.getElementById("skillLibraryList"); if(!box)return;

  const all=allSelectableSkills();

  if(!all.length){
    box.innerHTML='<div class="empty">Aucune compétence disponible.</div>';
    return;
  }

  box.innerHTML=
    '<div class="skillPickerSection">Toutes les compétences</div>'+
    all.map(s=>
      '<div class="v2LibCard">'+
        '<div class="v2LibHead">'+
          '<strong>'+z40kEscHtml(s.name)+'</strong>'+
          '<span class="badge">'+skillTypeLabel(s.type)+'</span>'+
        '</div>'+
        '<div class="small">'+z40kEscHtml(s.desc||"")+'</div>'+
        '<div class="v2LibActions">'+
          '<button type="button" onclick="chooseSkillFromLibrary(\''+s.id+'\')">✅ SÉLECTIONNER</button>'+
          (!s.native?'<button type="button" onclick="openSkillEditor(\''+s.id+'\')">✏️ MODIFIER</button>':'')+
          (!s.native?'<button type="button" class="creatorDelete" onclick="deleteSkillById(\''+s.id+'\')">🗑️ SUPPRIMER</button>':'')+
        '</div>'+
      '</div>'
    ).join("");
}

function openSkillEditor(id=null){
  seEditingId=id;
  const s=id?findSkillInLibrary(id):null;
  const panel=document.getElementById("skillEditorPanel");
  panel.style.display="block";
  document.getElementById("skillEditorTitle").textContent=id?"✏️ Modifier la compétence":"➕ Créer une compétence";
  document.body.style.overflow="hidden";
  panel.scrollTop=0;
  document.getElementById("seName").value=s?.name||"";
  document.getElementById("seType").value=s?.type||"text";
  document.getElementById("seDesc").value=s?.desc||"";
  const d=s?.deployable||{},a=s?.active||{},e=s?.effect||{};
  document.getElementById("seStatKind").value=e.kind||"combat_dice";
  document.getElementById("seStatMode").value=e.mode||"all";
  document.getElementById("seStatValue").value=(e.value??1);
  document.getElementById("seDepName").value=d.name||"Tourelle personnalisée";
  document.getElementById("seDepHp").value=d.hp||3;
  document.getElementById("seDepDice").value=d.dice||1;
  document.getElementById("seDepAcc").value=d.autoHit?"auto":String(d.accuracy||3);
  document.getElementById("seDepStrength").value=d.strength||1;
  document.getElementById("seDepRange").value=d.range||0;
  document.getElementById("seDepRecover").checked=d.recoverable!==false;
  document.getElementById("seDepPermanent").checked=d.destroyedPermanent!==false;
  document.getElementById("seActiveUses").value=a.uses||1;
  document.getElementById("seActiveCooldown").value=Math.max(0,Number(a.cooldownRounds)||0);
  const seEl=document.getElementById("seElement");if(seEl){const skillElement=s?.element||a.element||"";seEl.innerHTML=gensElementOptions(skillElement);seEl.value=skillElement;}const seRes=document.getElementById("seResistanceEditor");if(seRes)seRes.innerHTML=gensResistanceEditorHtml(s?.resistances||a?.resistances||[],"seRes");const seResDur=document.getElementById("seResistanceDuration");if(seResDur)seResDur.value=Math.max(1,Number(s?.resistanceDuration||a?.resistanceDuration||1));
  document.getElementById("seActiveRoll").value=a.roll?"yes":"no";
  document.getElementById("seActiveDice").value=a.dice||1;
  document.getElementById("seActiveAcc").value=a.autoHit?"auto":String(a.accuracy||3);
  document.getElementById("seActiveStrength").value=a.strength||0;
  document.getElementById("seActiveRange").value=a.range||0;
  document.getElementById("seActiveSuccessTitle").value=a.successTitle||"";
  document.getElementById("seActiveSuccessText").value=a.successText||"";
  document.getElementById("seActiveFailTitle").value=a.failTitle||"";
  document.getElementById("seActiveFailText").value=a.failText||"";
  renderSkillEditorType();
}
function closeSkillEditor(){
  const panel=document.getElementById("skillEditorPanel");
  if(panel)panel.style.display="none";
  seEditingId=null;
  document.body.style.overflow="";
}
function renderSkillEditorType(){
  const t=document.getElementById("seType").value;
  document.getElementById("seTextBox").style.display=t==="text"?"block":"none";
  document.getElementById("seDeployBox").style.display=t==="deployable"?"block":"none";
  document.getElementById("seActiveBox").style.display=t==="active"?"block":"none";
  document.getElementById("seStatBox").style.display=t==="stat"?"block":"none";
  document.getElementById("seActiveRollStats").style.display=
    (t==="active"&&document.getElementById("seActiveRoll").value==="yes")?"block":"none";
  const seElementWrap=document.getElementById("seElementWrap"),seElement=document.getElementById("seElement"),seCfg=gensCurrentElementSettings();
  if(seElement){const cur=seElement.value;seElement.innerHTML=gensElementOptions(cur);seElement.value=cur;}
  if(seElementWrap)seElementWrap.style.display=seCfg.enabled?"block":"none";const seResDurWrap=document.getElementById("seResistanceDurationWrap");if(seResDurWrap)seResDurWrap.style.display=t==="active"?"block":"none";
  if(t==="stat")renderStatBonusOptions();
}
function renderStatBonusOptions(){
  const kind=document.getElementById("seStatKind")?.value||"combat_dice";
  const mode=document.getElementById("seStatMode");
  const combat=["combat_dice","combat_result","strength"].includes(kind);
  if(mode){
    mode.disabled=!combat;
    if(!combat)mode.value="all";
  }
  const value=Number(document.getElementById("seStatValue")?.value)||0;
  const labels={
    combat_dice:"dés",
    combat_result:"précision",
    strength:"Force",
    max_hp:"PV maximum",
    armor_result:"sauvegarde",
    free_move:"déplacement"
  };
  const pv=document.getElementById("seStatPreview");
  if(pv)pv.textContent="Effet automatique : "+(value>=0?"+":"")+value+" "+(labels[kind]||"bonus")+
    (combat&&mode ? " · "+({all:"tous les combats",melee:"mêlée",ranged:"distance"}[mode.value]) : "");
}
function saveSkillToLibrary(){
  const name=(document.getElementById("seName")?.value||"").trim();
  if(!name){alert("Donne un nom à la compétence.");return}

  const type=document.getElementById("seType")?.value||"text";
  const skillId=seEditingId||("skill_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6));

  const skill={
    id:skillId,
    name,
    type,
    desc:(document.getElementById("seDesc")?.value||"").trim(),
    element:gensCurrentElementSettings().enabled?(document.getElementById("seElement")?.value||""):"",
    deployable:null,
    active:null,
    effect:null
  };

  if(type==="stat"){
    const kind=document.getElementById("seStatKind")?.value||"combat_dice";
    const combat=["combat_dice","combat_result","strength"].includes(kind);
    skill.effect={
      kind,
      mode:combat?(document.getElementById("seStatMode")?.value||"all"):"all",
      value:Number(document.getElementById("seStatValue")?.value)||0
    };
  }

  if(type==="deployable"){
    const depAcc=document.getElementById("seDepAcc")?.value||"3";
    skill.deployable={
      name:(document.getElementById("seDepName")?.value||"").trim()||"Déployable",
      hp:Math.max(1,Number(document.getElementById("seDepHp")?.value)||3),
      dice:Math.max(1,Number(document.getElementById("seDepDice")?.value)||1),
      autoHit:depAcc==="auto",
      accuracy:depAcc==="auto"?1:(Number(depAcc)||3),
      strength:Math.max(1,Number(document.getElementById("seDepStrength")?.value)||1),
      range:Math.max(0,Number(document.getElementById("seDepRange")?.value)||0),
      recoverable:!!document.getElementById("seDepRecover")?.checked,
      destroyedPermanent:!!document.getElementById("seDepPermanent")?.checked
    };
  }

  if(type==="active"){
    const actAcc=document.getElementById("seActiveAcc")?.value||"3";
    skill.active={
      uses:Math.max(1,Number(document.getElementById("seActiveUses")?.value)||1),
      cooldownRounds:Math.max(0,Number(document.getElementById("seActiveCooldown")?.value)||0),
      element:gensCurrentElementSettings().enabled?(document.getElementById("seElement")?.value||""):"",
      roll:(document.getElementById("seActiveRoll")?.value||"no")==="yes",
      dice:Math.max(1,Number(document.getElementById("seActiveDice")?.value)||1),
      autoHit:actAcc==="auto",
      accuracy:actAcc==="auto"?1:(Number(actAcc)||3),
      strength:Math.max(0,Number(document.getElementById("seActiveStrength")?.value)||0),
      range:Math.max(0,Number(document.getElementById("seActiveRange")?.value)||0),
      successTitle:(document.getElementById("seActiveSuccessTitle")?.value||"").trim(),
      successText:(document.getElementById("seActiveSuccessText")?.value||"").trim(),
      failTitle:(document.getElementById("seActiveFailTitle")?.value||"").trim(),
      failText:(document.getElementById("seActiveFailText")?.value||"").trim()
    };
  }

  try{
    const lib=loadSkillLibrary();
    const idx=lib.findIndex(s=>s.id===skill.id);
    if(idx>=0)lib[idx]=skill;
    else lib.push(skill);

    saveSkillLibrary(lib);

    // Si cette compétence est déjà utilisée par un héros créé,
    // mettre également à jour sa copie sauvegardée.
    const heroes=loadCustomHeroesMulti();
    let heroesChanged=false;
    heroes.forEach(h=>{
      (h.skills||[]).forEach((hs,i)=>{
        if(hs?.libraryId!==skill.id)return;
        const slot=HC_SKILL_TEMPLATE[i]||{};
        h.skills[i]={
          libraryId:skill.id,
          color:slot.color||hs.color,
          unlock:slot.unlock??hs.unlock??0,
          title:skill.name,
          desc:skill.desc||"",
          element:skill.element||skill.active?.element||"",
          mechanic:skill.type==="deployable"?"deployable":skill.type==="active"?"active":skill.type==="stat"?"stat":"text",
          deployable:skill.deployable||null,
          active:skill.active||null,
          effect:skill.effect||null
        };
        heroesChanged=true;
      });
    });
    if(heroesChanged)saveCustomHeroesMulti(heroes);

    seEditingId=skill.id;
    renderSkillLibrary();
    renderHeroSkillSlots(null,true);
    applyCustomHeroesMulti();

    // Confirmation très visible : ferme l'éditeur après sauvegarde.
    document.getElementById("skillEditorPanel").style.display="none";
    alert("Compétence « "+skill.name+" » enregistrée ✅");
  }catch(e){
    console.error("Erreur sauvegarde compétence",e);
    alert("Impossible de sauvegarder la compétence : "+(e?.name||"Erreur")+" — "+(e?.message||"détail inconnu"));
  }
}
function deleteSkillFromLibrary(){
  if(!seEditingId){alert("Aucune compétence sélectionnée.");return}
  deleteSkillById(seEditingId);
  closeSkillEditor();
}
function deleteSkillById(id){
  const s=findSkillInLibrary(id); if(!s)return;
  if(!confirm("Supprimer la compétence « "+s.name+" » ?"))return;

  saveSkillLibrary(loadSkillLibrary().filter(x=>x.id!==id));
  hcAssignedSkillIds=hcAssignedSkillIds.map(x=>x===id?null:x);

  const heroes=loadCustomHeroesMulti();
  let changed=false;
  heroes.forEach(h=>{
    (h.skills||[]).forEach((hs,i)=>{
      if(hs?.libraryId!==id)return;
      const slot=HC_SKILL_TEMPLATE[i]||{};
      h.skills[i]={
        libraryId:null,
        color:slot.color||hs.color,
        unlock:slot.unlock??hs.unlock??0,
        title:"",desc:"",mechanic:"text",deployable:null,active:null
      };
      changed=true;
    });
  });
  if(changed)saveCustomHeroesMulti(heroes);

  applyCustomHeroesMulti();
  renderHeroSkillSlots(null,true);
  renderSkillLibrary();
  renderCustomSkillPickerStatic();
}
function seedBuiltInSkills(){}

