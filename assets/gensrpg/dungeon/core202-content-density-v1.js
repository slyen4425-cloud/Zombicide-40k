
(function(){
"use strict";
const RT_KEY="gensrpg_dungeon_runtime_v2";

function rt202(){try{return JSON.parse(localStorage.getItem(RT_KEY)||"null")}catch(e){return null}}
function authored202(x){return !!x?.last?.authoredRuntime167839}
function save202(x){if(!x)return;localStorage.setItem(RT_KEY,JSON.stringify(x));try{saveDungeonState?.({room:x.room||0,last:x.last||null})}catch(e){}}
function cfg202(){try{return loadDungeonConfig?.()||{}}catch(e){return {}}}
function clone202(v){return JSON.parse(JSON.stringify(v))}
function esc202(v){try{return z40kEscHtml(String(v??""))}catch(e){return String(v??"")}}
function scene202(){try{return loadDungeonSceneElements?.()||[]}catch(e){return []}}
function live202(){
  const x=rt202(); if(!x)return [];
  try{
    const branch=!!x?.branch?.active,hero=String(x?.participants?.[Number(x?.index)||0]||"");
    return (loadActiveEnemies?.()||[]).filter(e=>!e.removed&&!e.defeated&&Number(e.hp)>0&&Number(e.dungeonRoom||0)===Number(x.room||0)&&!e.dc200Bypassed&&!e.dc200BypassedBy?.[hero]&&(branch?e.dc200Branch===true:e.dc200Branch!==true));
  }catch(e){return []}
}

/* ------------------------------------------------------------------
   DENSITÉ : éviter les séries de salles "vides".
   On ne change pas les réglages de l'éditeur : on ajoute seulement
   une sécurité de rythme dans le runtime.
------------------------------------------------------------------- */
function history202(x){
  x.dc202History=Array.isArray(x.dc202History)?x.dc202History:[];
  return x.dc202History;
}
function classify202(kind){
  if(["enemy","ambush","boss"].includes(kind))return "combat";
  if(kind==="trap")return "trap";
  if(kind==="chest")return "loot";
  if(kind==="merchant")return "merchant";
  if(kind==="rest")return "rest";
  return "calm";
}
function recordRoom202(x){
  const h=history202(x);
  if(!h.some(e=>Number(e.room)===Number(x.room))){
    h.push({room:Number(x.room)||0,kind:String(x.last?.kind||""),type:classify202(String(x.last?.kind||""))});
    if(h.length>30)h.splice(0,h.length-30);
    save202(x);
  }
}
function recentNoCombat202(x,n=2){
  const h=history202(x).filter(e=>Number(e.room)<Number(x.room)).slice(-n);
  return h.length>=n && h.every(e=>e.type!=="combat");
}
function recentNoPuzzle202(x,n=3){
  const h=history202(x).filter(e=>Number(e.room)<Number(x.room)).slice(-n);
  return h.length>=n && h.every(e=>!e.puzzle);
}

/* ------------------------------------------------------------------
   ENNEMIS : si une salle est déclarée combat mais aucun ennemi n'existe
   réellement après génération, recréer une rencontre immédiatement.
------------------------------------------------------------------- */
function ensureEncounter202(x){
  if(authored202(x)||!x||!["enemy","ambush","boss"].includes(String(x.last?.kind||"")))return;
  if(live202().length)return;
  try{
    if(x.last.kind==="boss")dungeonBossRoom?.(x.room);
    else dungeonEncounter?.(x.room);
  }catch(e){console.warn("Core 2.02 encounter regeneration",e)}

  try{
    const all=loadActiveEnemies?.()||[];
    all.forEach(e=>{
      if(Number(e.dungeonRoom||0)===Number(x.room||0)&&e.dc200Branch===undefined)e.dc200Branch=!!x.branch?.active;
    });
    saveActiveEnemies?.(all);
  }catch(e){}
  try{window.dungeonEnsureEnemyCells201?.()}catch(e){}
}

/* ------------------------------------------------------------------
   PIÈGES : une vraie case dans la carte, pas seulement un texte.
------------------------------------------------------------------- */
function chooseFree202(x){
  const m=x?.last?.map;if(!m||!Array.isArray(m.cells))return -1;
  const bad=new Set(["wall","void","entry","exit","enemy","chest","cache","trapdoor","stairs_down","stairs_up","puzzle","trap"]);
  const hero=new Set((x.participants||[]).filter(id=>window.DungeonSpatial313?.sameView(x,id)!==false).map(id=>Number(x.positions?.[id])).filter(Number.isInteger));
  const arr=[];
  m.cells.forEach((v,i)=>{if(!bad.has(String(v))&&!hero.has(i))arr.push(i)});
  if(!arr.length)return -1;
  return arr[Math.floor(Math.random()*arr.length)];
}
function ensureTrap202(x){
  if(authored202(x)||!x||String(x.last?.kind)!=="trap")return;
  const m=x.last?.map;if(!m||!Array.isArray(m.cells))return;
  let idx=m.cells.findIndex(v=>String(v)==="trap");
  if(idx<0){
    idx=chooseFree202(x);
    if(idx>=0)m.cells[idx]="trap";
  }
  if(idx<0)return;

  x.last.trapCell202=idx;
  save202(x);

  let all=scene202();
  if(!all.some(e=>Number(e.room||0)===Number(x.room||0)&&e.kind==="trap"&&Number(e.cellIndex)===idx)){
    try{
      addDungeonSceneElement?.({
        kind:"trap",name:"Piège",room:x.room,cellIndex:idx,
        trapId:x.last?.trapId||"trap",detected:false,dc202:true
      });
    }catch(e){}
  }
}
function paintTrap202(){
  const x=rt202();if(!x)return;
  const cells=[...document.querySelectorAll("#dc047RoomBoard .dc047Grid > .dc047Cell")];
  cells.forEach(c=>c.classList.remove("dc202TrapVisible"));
  const detected=(scene202()||[]).filter(e=>
    e.kind==="trap" &&
    Number(e.room||0)===Number(x.room||0) &&
    e.detected===true
  );
  detected.forEach(e=>{
    const idx=Number(e.cellIndex);
    if(Number.isInteger(idx)&&cells[idx])cells[idx].classList.add("dc202TrapVisible");
  });
}

/* ------------------------------------------------------------------
   ÉNIGMES : sécurité de fréquence.
   Si 3 salles se sont succédé sans énigme, la prochaine salle non-boss
   reçoit un défi de porte si une bibliothèque est sélectionnée.
------------------------------------------------------------------- */
function selectedChallenges202(){
  try{
    const c=cfg202(),raw=Array.isArray(c.challenges)?c.challenges:null;
    const lib=(typeof loadChallengeLibrary069==="function"?loadChallengeLibrary069():GensStorageV1.readJson(localStorage,"gensrpg_challenge_library_v1",[]))||[];
    if(raw===null)return lib.map(clone202);
    if(!raw.length)return [];
    const objects=raw.filter(x=>x&&typeof x==="object"&&x.id);
    if(objects.length)return objects.map(clone202);
    const set=new Set(raw.map(x=>String(x?.id??x)));
    return lib.filter(ch=>set.has(String(ch.id))).map(clone202);
  }catch(e){return []}
}
function ensurePuzzle202(x){
  if(authored202(x)||!x||!x.last?.map||x.last.kind==="boss"||x.last.exitLocked)return;
  const obj=x.last.map.objective;
  if(obj?.type==="challenge"){
    const h=history202(x);const row=h.find(e=>Number(e.room)===Number(x.room));if(row)row.puzzle=true;
    save202(x);return;
  }

  const pool=selectedChallenges202();
  if(!pool.length)return;

  const c=cfg202();
  const base=Math.max(0,Math.min(100,Number(c.challengeDoorChance)||22));
  const force=recentNoPuzzle202(x,3);
  const chance=Math.max(base,32);

  if(force || Math.random()*100<chance){
    const ch=clone202(pool[Math.floor(Math.random()*pool.length)]);
    x.last.map.objective={
      type:"challenge",status:"locked",title:"Défi de la porte",
      challenge:ch,text:"Un mécanisme bloque la sortie."
    };
    x.last.objective=x.last.map.objective;
    const h=history202(x);const row=h.find(e=>Number(e.room)===Number(x.room));if(row)row.puzzle=true;
    save202(x);
  }
}

/* ------------------------------------------------------------------
   RYTHME DE RENCONTRE :
   si deux salles précédentes sans combat, la salle suivante devient
   une rencontre normale, sauf boss explicite.
------------------------------------------------------------------- */
function maybeForceCombatRoom202(x){
  if(authored202(x)||!x||x.room<=1||x.last?.kind==="boss")return false;
  if(!recentNoCombat202(x,2))return false;
  if(["enemy","ambush"].includes(String(x.last?.kind||"")))return false;

  x.last.kind="enemy";
  x.last.title="Rencontre";
  try{
    dungeonEncounter?.(x.room);
    const all=loadActiveEnemies?.()||[];
    all.forEach(e=>{
      if(Number(e.dungeonRoom||0)===Number(x.room||0)&&e.dc200Branch===undefined)e.dc200Branch=!!x.branch?.active;
    });
    saveActiveEnemies?.(all);
  }catch(e){console.warn("Core 2.02 forced encounter",e)}

  return true;
}

/* ------------------------------------------------------------------
   Panneau d'ambiance simple pour rendre la nature de la salle lisible.
------------------------------------------------------------------- */
function roomFlavor202(x){
  let host=document.getElementById("dc202RoomFlavor");
  const board=document.getElementById("dc047RoomBoard");
  if(!board)return;
  if(!host){
    host=document.createElement("div");
    host.id="dc202RoomFlavor";
    board.insertAdjacentElement("beforebegin",host);
  }
  const kind=String(x?.last?.kind||"");
  let text="";
  if(["enemy","ambush","boss"].includes(kind))text="⚔️ Présence hostile détectée.";
  else if(kind==="trap")text="🔎 Cette salle mérite une exploration prudente.";
  else if(kind==="chest")text="🎁 Quelque chose peut être fouillé ici.";
  else if(x?.last?.map?.objective?.type==="challenge")text="🧩 La sortie est protégée par une énigme.";
  else text="🔎 Salle d’exploration.";
  host.innerHTML=text;
}

/* ------------------------------------------------------------------
   Hook APRÈS exploration 2.00 :
   on ne remplace pas déplacement/combat/coffres.
------------------------------------------------------------------- */
if(window.DungeonCore01&&typeof DungeonCore01.explore==="function"){
  const prev=window.DungeonCore01.explore;
  window.DungeonCore01.explore=function(){
    const before=Number(rt202()?.room)||0;
    const r=prev.apply(this,arguments);
    const x=rt202();
    if(authored202(x))return r;
    const transition=x?.dc313LastTransition;
    if(x&&Number(x.room)>before&&transition?.created===true&&Number(transition.to)===Number(x.room)){
      recordRoom202(x);

      /* La décision de rythme regarde les salles antérieures. */
      if(maybeForceCombatRoom202(x)){
        const h=history202(x),row=h.find(e=>Number(e.room)===Number(x.room));
        if(row){row.kind="enemy";row.type="combat"}
      }

      ensureEncounter202(x);
      ensureTrap202(x);
      ensurePuzzle202(x);
      save202(x);

      try{DungeonCore01.render?.()}catch(e){}
    }
    return r;
  };
}

function decorate202(){
  const x=rt202();if(!x)return;
  try{
    if(authored202(x)){paintTrap202();return}
    recordRoom202(x);
    /*
      Une rencontre ne doit être réparée qu'au moment où la salle vient
      d'être créée (hook explore ci-dessus). La relancer depuis chaque
      render/show recréait immédiatement des ennemis après une victoire,
      particulièrement dans les salles d'embuscade.
    */
    ensureTrap202(x);
    paintTrap202();
    roomFlavor202(x);
  }catch(e){console.warn("Core 2.02 decorate",e)}
}

if(window.DungeonCore01&&typeof DungeonCore01.render==="function"){
  const prev=window.DungeonCore01.render;
  window.DungeonCore01.render=function(){
    const r=prev.apply(this,arguments);
    decorate202();
    requestAnimationFrame(decorate202);
    return r;
  };
}
if(window.DungeonCore01&&typeof DungeonCore01.show==="function"){
  const prev=window.DungeonCore01.show;
  window.DungeonCore01.show=function(){
    const r=prev.apply(this,arguments);
    decorate202();
    requestAnimationFrame(decorate202);
    return r;
  };
}

setTimeout(decorate202,0);

window.dungeonDebug202=function(){
  const x=rt202();
  return {
    room:x?.room,
    kind:x?.last?.kind,
    history:x?.dc202History||[],
    enemies:live202().length,
    trapCell:x?.last?.trapCell202,
    puzzle:x?.last?.map?.objective?.type==="challenge"
  };
};

try{
  const badge=document.querySelector(".dc01Badge");if(badge)badge.textContent="NOUVEAU MOTEUR · CORE 3.06";
  const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core 3.06 · densité aventure · pièges visibles · énigmes régulières.";
}catch(e){}
})();
