
(function(){
"use strict";
function requestCombat201(enemyIds,reason){return window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:Array.isArray(enemyIds)?enemyIds.map(String):[],reason:reason,entry:"dc201EncounterPanel"})}
const RT_KEY="gensrpg_dungeon_runtime_v2";

function clone201(v){return JSON.parse(JSON.stringify(v))}
function esc201(v){try{return z40kEscHtml(String(v??""))}catch(e){return String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}}
function rt201(){try{return JSON.parse(localStorage.getItem(RT_KEY)||"null")}catch(e){return null}}
function save201(x){if(!x)return;localStorage.setItem(RT_KEY,JSON.stringify(x));try{saveDungeonState?.({room:x.room||0,last:x.last||null})}catch(e){}}
function cfg201(){try{return loadDungeonConfig?.()||{}}catch(e){return {}}}
function activeHero201(x=rt201()){return String(x?.participants?.[x?.index||0]||"")}
function scene201(){try{return loadDungeonSceneElements?.()||[]}catch(e){return []}}
function saveScene201(a){try{saveDungeonSceneElements?.(a)}catch(e){}}
function live201(){
  const x=rt201(); if(!x)return [];
  try{
    const branch=!!x?.branch?.active,hero=activeHero201(x);
    return (loadActiveEnemies?.()||[]).filter(e=>!e.removed&&!e.defeated&&Number(e.hp)>0&&Number(e.dungeonRoom||0)===Number(x.room||0)&&!e.dc200Bypassed&&!e.dc200BypassedBy?.[hero]&&(branch?e.dc200Branch===true:e.dc200Branch!==true));
  }catch(e){return []}
}
function enemyName201(e){try{return activeEnemyDefinition?.(e?.enemyId)?.name||e?.name||"Ennemi"}catch(_){return e?.name||"Ennemi"}}

/* ---------------------------------------------------------
   ÉLÉMENTS : la carte est la source de vérité.
   Si un élément visuel existe encore sur la carte mais que son
   objet scène a disparu, on le reconstruit au lieu de le perdre.
---------------------------------------------------------- */
function repairFeatures201(){
  const x=rt201(),m=x?.last?.map;
  if(!x||!m||!Array.isArray(m.cells))return;
  let a=scene201(),changed=false;
  const inRoom=e=>Number(e.room||0)===Number(x.room||0) && (!!e.branch200===!!x.branch?.active);

  const chestIdx=[];
  const branchIdx=[];
  m.cells.forEach((v,i)=>{
    if(String(v)==="chest"||String(v)==="cache")chestIdx.push(i);
    if(["trapdoor","stairs_down","stairs_up"].includes(String(v)))branchIdx.push(i);
  });

  chestIdx.forEach(i=>{
    const ok=a.some(e=>inRoom(e)&&e.kind==="chest"&&Number(e.cellIndex)===i);
    if(!ok){
      const rarity=typeof dungeonPickChestRarity==="function"?dungeonPickChestRarity(cfg201()):"common";
      const created=addDungeonSceneElement?.({
        kind:"chest",name:"Coffre "+(dungeonRarityLabel?.(rarity)||rarity),
        rarity:rarity||"common",trapped:false,room:x.room,cellIndex:i,fromMap:true,branch200:!!x.branch?.active
      });
      if(created){a=scene201();changed=true}
    }
  });

  branchIdx.forEach(i=>{
    const ok=a.some(e=>inRoom(e)&&["trapdoor","stairs_down","stairs_up"].includes(e.kind)&&Number(e.cellIndex)===i);
    if(!ok){
      const created=addDungeonSceneElement?.({
        kind:"trapdoor",name:"Passage secret",room:x.room,cellIndex:i,
        branchType:"treasure",branch200:!!x.branch?.active
      });
      if(created){a=scene201();changed=true}
    }
  });

  if(changed)saveScene201(a);
}

/* ---------------------------------------------------------
   ENNEMIS : ne plus dépendre du type de case déjà peint.
   On garde une affectation stable et on dessine un vrai pion DOM.
---------------------------------------------------------- */
function repairEnemies201(){
  const x=rt201(),m=x?.last?.map;
  if(!x||!m||!Array.isArray(m.cells))return;
  const live=live201();
  x.enemyCells=x.enemyCells||{};
  const ids=new Set(live.map(e=>String(e.id)));

  Object.keys(x.enemyCells).forEach(id=>{
    if(!ids.has(String(id)))delete x.enemyCells[id];
  });

  const used=new Set(Object.values(x.enemyCells).map(Number).filter(Number.isInteger));
  const heroes=new Set((x.participants||[]).filter(id=>window.DungeonSpatial313?.sameView(x,id)!==false).map(id=>Number(x.positions?.[id])).filter(Number.isInteger));
  const forbidden=new Set(["wall","void","entry","exit","chest","cache","trap","puzzle","trapdoor","stairs_down","stairs_up"]);

  const candidates=[];
  m.cells.forEach((v,i)=>{
    if(!forbidden.has(String(v))&&!heroes.has(i)&&!used.has(i))candidates.push(i);
  });

  live.forEach(e=>{
    let n=Number(x.enemyCells[e.id]);
    if(!Number.isInteger(n)||n<0||n>=m.cells.length){
      n=m.cells.findIndex((v,i)=>String(v)==="enemy"&&!used.has(i)&&!heroes.has(i));
      if(n<0)n=candidates.shift();
      if(Number.isInteger(n)&&n>=0){x.enemyCells[e.id]=n;used.add(n)}
    }
    if(Number.isInteger(Number(x.enemyCells[e.id])))m.cells[Number(x.enemyCells[e.id])]="enemy";
  });
  save201(x);
}

function paintEnemies201(){
  const x=rt201();if(!x)return;
  const grid=document.querySelector("#dc047RoomBoard .dc047Grid");
  if(!grid)return;
  const cells=[...grid.querySelectorAll(":scope > .dc047Cell")];
  cells.forEach(c=>{c.classList.remove("dc201EnemyToken","dc201Key");delete c.dataset.dc201Enemy});
  const live=live201();
  live.forEach(e=>{
    const n=Number(x.enemyCells?.[e.id]);
    if(!Number.isInteger(n)||!cells[n])return;
    cells[n].classList.add("dc201EnemyToken");
    cells[n].dataset.dc201Enemy="👹";
    if(String(x.last?.keyEnemyId||"")===String(e.id))cells[n].classList.add("dc201Key");
    cells[n].title=enemyName201(e);
  });
}

/* ---------------------------------------------------------
   ÉNIGMES 2.01 : runtime natif, sans loadDungeonState ancien.
---------------------------------------------------------- */
let puzzleCtx201=null;
function norm201(v){return String(v??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ")}
function puzzleSource201(kind,id){
  const x=rt201();
  if(kind==="chest"){
    const all=scene201(),el=all.find(e=>String(e.id)===String(id));
    return el?.challenge?{kind,id,ch:el.challenge,attempts:Number(el.challengeAttempts)||0}:null;
  }
  const obj=x?.last?.map?.objective;
  return obj?.type==="challenge"&&obj?.challenge?{kind:"door",id:"",ch:obj.challenge,attempts:Number(obj.challengeAttempts)||0}:null;
}
function modal201(title,html,onClose){
  if(typeof DungeonCore01?.modal==="function")DungeonCore01.modal(title,html,onClose);
}
function openPuzzle201(kind,id){
  const ctx=puzzleSource201(kind,id);if(!ctx)return modal201("🧩 Énigme","Aucune énigme active.");
  puzzleCtx201=ctx;
  const ch=ctx.ch;
  let body='<div class="dc201PuzzlePrompt">'+esc201(ch.prompt||"Résous ce défi.")+'</div>';
  if(ch.type==="choice"){
    const opts=String(ch.options||"").split(",").map(x=>x.trim()).filter(Boolean);
    body+='<div class="dc201PuzzleActions">'+opts.map((o,i)=>'<button class="dc01Btn" onclick="dc201PuzzleAnswer('+i+')">'+esc201(o)+'</button>').join("")+'</div>';
    puzzleCtx201.options=opts;
  }else if(ch.type==="stat"){
    let chance=50;
    try{
      const hero=activeHero201(),st=loadState?.(hero),stat=String(ch.stat||"intelligence");
      const val=Number(st?.dungeonStats?.[stat]??CHARS?.[hero]?.dungeonStats?.[stat]??10);
      chance=Math.max(5,Math.min(95,50+(val-10)*3));
    }catch(e){}
    puzzleCtx201.chance=chance;
    body+='<p>Test de <strong>'+esc201(ch.stat||"intelligence")+'</strong> · '+chance+'%.</p>'+
      '<button class="dc01Btn primary" style="width:100%" onclick="dc201PuzzleRoll()">🎲 LANCER LE D100</button>';
  }else{
    body+='<input id="dc201PuzzleInput" type="text" placeholder="Ta réponse…" style="width:100%;padding:11px;border-radius:9px;background:#0c0b09;color:#fff;border:1px solid #65503a">'+
      '<button class="dc01Btn primary" style="width:100%;margin-top:8px" onclick="dc201PuzzleText()">VALIDER</button>';
  }
  modal201((kind==="chest"?"🎁 Coffre":"🚪 Porte")+" — Énigme",body);
}
function finishPuzzle201(ok){
  const ctx=puzzleCtx201;if(!ctx)return;
  const x=rt201();
  if(ctx.kind==="chest"){
    const a=scene201(),el=a.find(e=>String(e.id)===String(ctx.id));
    if(!el)return;
    if(ok){el.challengeDone=true;el.challengeAttempts=0}
    else el.challengeAttempts=(Number(el.challengeAttempts)||0)+1;
    saveScene201(a);
  }else{
    const obj=x?.last?.map?.objective;
    if(!obj)return;
    if(ok){obj.status="done";obj.challengeAttempts=0}
    else obj.challengeAttempts=(Number(obj.challengeAttempts)||0)+1;
    x.last.objective=obj;
    save201(x);
  }

  if(ok){
    modal201("✅ Défi réussi",ctx.kind==="chest"?"Le coffre est déverrouillé.":"Le mécanisme se désactive.",()=>{DungeonCore01?.render?.()});
  }else{
    modal201("❌ Échec","Le défi n’est pas résolu. Tu peux réessayer.",()=>openPuzzle201(ctx.kind,ctx.id));
  }
}
window.dc201OpenPuzzle=openPuzzle201;
window.dc201PuzzleAnswer=function(i){
  const ctx=puzzleCtx201;if(!ctx)return;
  const ans=ctx.options?.[Number(i)]||"";
  finishPuzzle201(norm201(ans)===norm201(ctx.ch.solution));
};
window.dc201PuzzleText=function(){
  const v=document.getElementById("dc201PuzzleInput")?.value||"";
  finishPuzzle201(norm201(v)===norm201(puzzleCtx201?.ch?.solution));
};
window.dc201PuzzleRoll=function(){
  const chance=Math.max(5,Math.min(95,Number(puzzleCtx201?.chance)||50));
  const roll=1+Math.floor(Math.random()*100);
  const ok=roll<=chance;
  modal201("🎲 Test","D100 : <strong>"+roll+"</strong><br>"+(ok?"✅ Réussi":"❌ Échec"),()=>finishPuzzle201(ok));
};

/* Remplace l'appel ancien utilisé par le runtime 2.00. */
window.dc051OpenChallenge=function(kind,id){return openPuzzle201(kind,id)};

/* ---------------------------------------------------------
   COMBAT : rendre l'accès visible et fiable.
   Le bouton reste contextuel, mais les ennemis sont maintenant visibles.
   Ajoute aussi un bouton rencontre permanent quand il y a des ennemis.
---------------------------------------------------------- */
function encounterPanel201(){
  const x=rt201(),live=live201();
  let host=document.getElementById("dc201Encounter");
  const anchor=document.getElementById("dc01Enemies");
  if(!host&&anchor){host=document.createElement("div");host.id="dc201Encounter";anchor.insertAdjacentElement("afterend",host)}
  if(!host)return;
  if(!live.length){host.innerHTML="";return}
  const positional=typeof window.dc305PositionalGameplay==="function"&&window.dc305PositionalGameplay();
  const pos=Number(x?.positions?.[activeHero201(x)]);
  const on=live.find(e=>Number(x.enemyCells?.[e.id])===pos);
  const ids=live.map(e=>String(e.id));
  host.innerHTML='<div class="dc200SceneCard"><div>⚔️</div><div class="grow"><strong>'+live.length+' ennemi'+(live.length>1?'s':'')+' dans la salle</strong><small>'+live.map(enemyName201).join(", ")+'</small></div>'+
    (!positional
      ?'<button type="button" class="dc01Btn primary" onclick=\'requestCombat201('+JSON.stringify(ids)+',"manual")\'>⚔️ ENGAGER LE COMBAT</button>'
      :(on?'<button type="button" class="dc01Btn primary" onclick="requestCombat201([\''+String(on.id).replace(/'/g,"")+'\'],\'cell\')">ATTAQUER</button>':'<span class="badge">Va sur une case ennemie</span>'))+
    '</div>';
}

/* ---------------------------------------------------------
   SCÈNE : si une carte spéciale existe dans la map, elle doit avoir
   un élément interactif. Puis laisser le rendu 2.00 faire son travail.
---------------------------------------------------------- */
function decorate201(){
  try{
    repairFeatures201();
    repairEnemies201();
    /* Le rendu 2.00 peut avoir peint la map avant l'assignation :
       repeindre uniquement les pions DOM après coup. */
    paintEnemies201();
    encounterPanel201();
  }catch(e){console.warn("Core 2.01 decorate",e)}
}

if(window.DungeonCore01&&typeof DungeonCore01.render==="function"){
  const prev=window.DungeonCore01.render;
  window.DungeonCore01.render=function(){
    const r=prev.apply(this,arguments);
    decorate201();
    requestAnimationFrame(decorate201);
    return r;
  };
}
if(window.DungeonCore01&&typeof DungeonCore01.show==="function"){
  const prev=window.DungeonCore01.show;
  window.DungeonCore01.show=function(){
    const r=prev.apply(this,arguments);
    decorate201();
    requestAnimationFrame(decorate201);
    return r;
  };
}
if(window.DungeonCore01&&typeof DungeonCore01.explore==="function"){
  const prev=window.DungeonCore01.explore;
  window.DungeonCore01.explore=function(){
    const r=prev.apply(this,arguments);
    decorate201();
    requestAnimationFrame(decorate201);
    return r;
  };
}

/* Coffres verrouillés : forcer le puzzle 2.01 avant fouille. */
if(window.DungeonCore01&&typeof DungeonCore01.searchChest==="function"){
  const prev=window.DungeonCore01.searchChest;
  window.DungeonCore01.searchChest=function(id){
    const el=scene201().find(e=>String(e.id)===String(id));
    if(el?.challenge&&!el.challengeDone)return openPuzzle201("chest",id);
    return prev.apply(this,arguments);
  };
}

/* Au démarrage/résumé, réparer sans attendre un changement de salle. */
setTimeout(()=>{try{decorate201()}catch(e){}},0);

window.dungeonDebug201=function(){
  const x=rt201();
  return {
    room:x?.room,
    kind:x?.last?.kind,
    enemies:live201().map(e=>({id:e.id,name:enemyName201(e),cell:x?.enemyCells?.[e.id],hp:e.hp})),
    features:scene201().filter(e=>Number(e.room||0)===Number(x?.room||0)).map(e=>({id:e.id,kind:e.kind,cell:e.cellIndex,name:e.name})),
    objective:x?.last?.map?.objective||null
  };
};

try{
  const meta=document.getElementById("dc01RoomMeta");
  if(meta&&/moteur Dungeon 2\.00/i.test(meta.textContent||""))meta.textContent=(meta.textContent||"").replace("2.00","2.01");
  const badge=document.querySelector(".dc01Badge");if(badge)badge.textContent="NOUVEAU MOTEUR · CORE 3.06";
  const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core 3.06 · ennemis visibles · éléments persistants · énigmes natives.";
}catch(e){}
})();
