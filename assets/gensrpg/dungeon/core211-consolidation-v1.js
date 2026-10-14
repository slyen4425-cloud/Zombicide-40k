
(function(){
"use strict";
const RT="gensrpg_dungeon_runtime_v2";

function rt(){try{return JSON.parse(localStorage.getItem(RT)||"null")}catch(e){return null}}
function saveRt211(x){if(x)localStorage.setItem(RT,JSON.stringify(x))}
function profile(){
  try{
    const p=loadGameProfiles?.().find(x=>String(x.id)===String(activeGameProfileId?.()));
    return p?.rpgUniverse?.exploration||{}
  }catch(e){return {}}
}
function scene(){try{return loadDungeonSceneElements?.()||[]}catch(e){return []}}
function saveScene(a){try{saveDungeonSceneElements?.(a)}catch(e){}}
function activeHero211(x){return String(x?.participants?.[Number(x?.index)||0]||"")}
function heroName211(id){return CHARS?.[id]?.name||findCustomHero?.(id)?.name||String(id)}
function heroImg211(id){const c=CHARS?.[id]||findCustomHero?.(id)||{};return c.image||c.avatar||""}
function initials211(id){return heroName211(id).split(/\s+/).filter(Boolean).map(v=>v[0]).join("").slice(0,2).toUpperCase()}
function esc211(v){try{return z40kEscHtml(String(v??""))}catch(e){return String(v??"")}}
function heroStat211(id,stat){
  try{
    const st=loadState?.(id)||{},c=CHARS?.[id]||findCustomHero?.(id)||{};
    const aliases={
      agility:["agilite","agility"],agilite:["agilite","agility"],
      intelligence:["intelligence"],esprit:["esprit","spirit"],spirit:["esprit","spirit"],
      force:["force"],endurance:["endurance"],initiative:["initiative"]
    };
    for(const k of aliases[stat]||[stat]){
      if(st?.rpgAttributes?.[k]!=null)return Number(st.rpgAttributes[k])||0;
      if(c?.dungeonStats?.[k]!=null)return Number(c.dungeonStats[k])||0
    }
  }catch(e){}
  return 0
}
function heroAlive211(id){
  try{return Number(dungeonCombatHeroSnapshot?.(id)?.hp)>0}catch(e){
    try{
      const st=loadState?.(id)||{};
      return (st.campaignStatus||"available")!=="dead"
    }catch(_){return true}
  }
}
function livingEnemies211(x){
  const branch=!!x?.branch?.active,hero=activeHero211(x);
  try{return (loadActiveEnemies?.()||[]).filter(e=>
    !e.removed&&!e.defeated&&Number(e.hp)>0&&
    Number(e.dungeonRoom||0)===Number(x?.room||0)&&
    !e.dc200Bypassed&&!e.dc200BypassedBy?.[hero]&&(branch?e.dc200Branch===true:e.dc200Branch!==true)
  )}catch(e){return []}
}
function enemyDef211(e){try{return activeEnemyDefinition?.(e?.enemyId)||{}}catch(_){return {}}}
function enemyRadius211(e){
  const ex=profile(),d=enemyDef211(e),r=d?.rule||{};
  const own=Number(r.perception??r.detection??r.vision??d.perception??0);
  return Math.max(1,Math.min(20,own>0?own:(Number(ex.enemyDetectionRadius)||2)))
}
function neigh211(i,size,total){
  const r=Math.floor(i/size),c=i%size,a=[];
  if(r>0)a.push(i-size);if(r<size-1)a.push(i+size);if(c>0)a.push(i-1);if(c<size-1)a.push(i+1);
  return a.filter(n=>n>=0&&n<total)
}
function blocked211(v){return ["wall","void"].includes(String(v))}
function range211(from,rad,map){
  const out=new Map([[from,0]]),q=[from];let qi=0;
  while(qi<q.length){
    const cur=q[qi++],d=out.get(cur)||0;if(d>=rad)continue;
    for(const n of neigh211(cur,Number(map?.size)||5,map?.cells?.length||0)){
      if(out.has(n)||blocked211(map.cells[n]))continue;
      out.set(n,d+1);q.push(n)
    }
  }
  return out
}
function cells211(){return [...document.querySelectorAll("#dc047RoomBoard .dc047Grid > .dc047Cell")]}

function paintHeroes211(x,dom){
  dom.forEach(c=>c.querySelectorAll(".dc211HeroToken").forEach(n=>n.remove()));
  const active=activeHero211(x);
  (x?.participants||[]).forEach(id=>{
    if(window.DungeonSpatial313?.sameView(x,id)===false)return;
    const pos=Number(x.positions?.[id]);
    if(!Number.isInteger(pos)||!dom[pos])return;
    const t=document.createElement("span");t.className="dc211HeroToken"+(String(id)===active?" active":"");
    const img=heroImg211(id);
    if(img){
      const im=document.createElement("img");im.src=img;im.alt=heroName211(id);
      im.onerror=()=>{t.innerHTML=esc211(initials211(id))};
      t.appendChild(im)
    }else t.textContent=initials211(id);
    t.title=heroName211(id)+(String(id)===active?" · ACTIF":"");
    dom[pos].appendChild(t)
  })
}

function paintTraps211(x,dom){
  dom.forEach(c=>c.classList.remove("dc211Trap"));
  let n=0;
  scene().forEach(e=>{
    if(e.kind!=="trap"||Number(e.room||0)!==Number(x?.room||0)||e.detected!==true)return;
    const i=Number(e.cellIndex);if(Number.isInteger(i)&&dom[i]){dom[i].classList.add("dc211Trap");n++}
  });
  return n
}

function trapTestState211(x,id){
  x.dc211TrapTests=x.dc211TrapTests||{};
  return x.dc211TrapTests[String(x.room)+"|"+String(id)]||null
}
function setTrapTest211(x,id,data){
  x.dc211TrapTests=x.dc211TrapTests||{};
  x.dc211TrapTests[String(x.room)+"|"+String(id)]=data;saveRt211(x)
}
window.dc211TrapTest=function(){
  const x=rt();if(!x||Number(x.room||0)<=0)return;
  const ex=profile(),id=activeHero211(x);
  if(ex.trapDetection===false)return;
  if(ex.trapDetectionOnce!==false&&trapTestState211(x,id))return;
  const stat=String(ex.trapDetectionStat||"agilite");
  const val=heroStat211(id,stat);
  const base=Math.max(0,Math.min(100,Number(ex.trapDetectionBase)||50));
  const gain=Math.max(0,Number(ex.trapDetectionStatGain)||2);
  const chance=Math.max(0,Math.min(100,Math.round(base+val*gain)));
  const roll=1+Math.floor(Math.random()*100),ok=roll<=chance;
  const radius=Math.max(1,Number(ex.trapDetectionRadius)||2),pos=Number(x.positions?.[id]),map=x.last?.map;
  let found=0;
  if(ok&&map&&Number.isInteger(pos)){
    const z=range211(pos,radius,map),a=scene();let changed=false;
    a.forEach(e=>{
      if(e.kind!=="trap"||Number(e.room||0)!==Number(x.room||0))return;
      if(z.has(Number(e.cellIndex))){if(e.detected!==true){e.detected=true;changed=true}found++}
    });
    if(changed)saveScene(a)
  }
  setTrapTest211(x,id,{roll,chance,success:ok,found,at:Date.now()});
  try{
    DungeonCore01.modal(ok?"👁️ Détection réussie":"👁️ Détection échouée",
      "<strong>"+esc211(heroName211(id))+"</strong> · "+esc211(stat)+" "+val+
      "<br>D100 : <strong>"+roll+"</strong> · chance "+chance+"%"+
      (ok?("<br><br>"+(found?("✅ "+found+" piège"+(found>1?"s":"")+" repéré"+(found>1?"s":"")+"."):"✅ Aucun piège détecté dans la portée.")):
      "<br><br>❌ Le test est consommé pour cette salle."))
  }catch(e){}
  try{DungeonCore01.render?.()}catch(e){}
}

function paintEnemySense211(x,dom){
  dom.forEach(c=>c.classList.remove("dc211EnemySense","dc211HeroSpotted"));
  const ex=profile();if(ex.enemyDetection===false||!x?.last?.map)return [];
  const zones=[];
  livingEnemies211(x).forEach(e=>{
    const c=Number(x.enemyCells?.[e.id]);if(!Number.isInteger(c))return;
    const r=enemyRadius211(e),z=range211(c,r,x.last.map);
    if(ex.enemyDetectionShowZones!==false)z.forEach((_,i)=>dom[i]?.classList.add("dc211EnemySense"));
    zones.push({e,r,z})
  });
  return zones
}

let detectBusy211=false;
function resolveEnemyDetection211(x,zones,dom){
  const ex=profile();if(ex.enemyDetection===false||detectBusy211)return;
  const heroes=(x.participants||[]).filter(id=>window.DungeonSpatial313?.sameView(x,id)!==false).filter(heroAlive211);
  const spotted=[];
  heroes.forEach(id=>{
    const pos=Number(x.positions?.[id]);if(!Number.isInteger(pos))return;
    const by=zones.filter(z=>z.z.has(pos));
    if(by.length){dom[pos]?.classList.add("dc211HeroSpotted");spotted.push({id,by})}
  });
  if(!spotted.length)return;
  x.dc211EnemyDetection=x.dc211EnemyDetection||{};
  const sig=String(x.room)+"|"+spotted.map(s=>s.id+":"+s.by.map(z=>z.e.id).sort().join(",")).sort().join("|");
  if(x.dc211EnemyDetection[sig])return;
  x.dc211EnemyDetection[sig]=Date.now();saveRt211(x);
  if(ex.enemyDetectionAutoCombat!==false&&typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat==="function"){
    const ids=[...new Set(spotted.flatMap(s=>s.by.map(z=>String(z.e.id))))];
    detectBusy211=true;
    setTimeout(()=>{try{window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:ids,reason:"detection",entry:"dc211EnemyDetection"})}finally{setTimeout(()=>detectBusy211=false,250)}},80)
  }
}

function sensePanel211(x,detected,zones){
  const board=document.getElementById("dc047RoomBoard");if(!board)return;
  let p=document.getElementById("dc211SensePanel");
  if(!p){p=document.createElement("div");p.id="dc211SensePanel";board.insertAdjacentElement("beforebegin",p)}
  if(Number(x?.room||0)<=0){p.style.display="none";return}
  p.style.display="";
  const ex=profile(),id=activeHero211(x),used=trapTestState211(x,id);
  const stat=String(ex.trapDetectionStat||"agilite"),val=heroStat211(id,stat);
  const chance=Math.max(0,Math.min(100,Math.round((Number(ex.trapDetectionBase)||50)+val*(Number(ex.trapDetectionStatGain)||2))));
  p.innerHTML='<div class="dc211SenseRow"><strong>👁️ DÉTECTION</strong><span>Pièges visibles : '+detected+' · Ennemis : '+zones.length+'</span></div>'+
    (ex.trapDetection===false?'<small>Détection de pièges désactivée dans l’éditeur.</small>':
      '<div class="dc211SenseRow"><span>Pièges · '+esc211(stat)+' '+val+' · '+chance+'% · rayon '+Math.max(1,Number(ex.trapDetectionRadius)||2)+' case(s)</span>'+
      (used?'<button disabled>TEST DÉJÀ UTILISÉ</button>':'<button type="button" onclick="dc211TrapTest()">🎲 TESTER LA DÉTECTION</button>')+'</div>')+
    (ex.enemyDetection===false?'<small>Détection ennemie désactivée.</small>':
      '<small>🔴 Zone rouge = portée de perception ennemie'+(ex.enemyDetectionAutoCombat!==false?' · repérage = combat.':'.')+'</small>')
}

function puzzleAction211(x){
  const board=document.getElementById("dc047RoomBoard");if(!board)return;
  let h=document.getElementById("dc211PuzzleAction");
  if(!h){h=document.createElement("div");h.id="dc211PuzzleAction";board.insertAdjacentElement("afterend",h)}
  const obj=x?.last?.map?.objective;
  if(!obj||obj.type!=="challenge"||obj.status!=="locked"||!obj.challenge){h.innerHTML="";return}
  h.innerHTML='<button class="dc01Btn primary" type="button" onclick="dc211OpenDoorPuzzle()">🧩 EXAMINER LE MÉCANISME</button>'
}
window.dc211OpenDoorPuzzle=function(){
  const x=rt(),obj=x?.last?.map?.objective;
  if(!obj||obj.type!=="challenge"||obj.status!=="locked"||!obj.challenge)return;
  if(typeof dc201OpenPuzzle==="function")return dc201OpenPuzzle("door","");
  if(typeof dc051OpenChallenge==="function")return dc051OpenChallenge("door","");
}

function distinguishScene211(){
  document.querySelectorAll("#dc200Scene .dc200SceneCard").forEach(c=>{
    c.classList.remove("dc211MerchantCard","dc211ChestCard");
    const t=(c.textContent||"").toLowerCase();
    if(t.includes("marchand"))c.classList.add("dc211MerchantCard");
    if(t.includes("coffre"))c.classList.add("dc211ChestCard")
  })
}

function decorate211(){
  const x=rt();if(!x)return;
  const dom=cells211();
  const positional=typeof window.dc305PositionalGameplay==="function"&&window.dc305PositionalGameplay();
  if(!positional){
    dom.forEach(c=>c.classList.remove("dc211EnemySense","dc211HeroSpotted","dc211Trap"));
    const p=document.getElementById("dc211SensePanel");if(p)p.style.display="none";
    puzzleAction211(x);
    distinguishScene211();
    return;
  }
  paintHeroes211(x,dom);
  if(Number(x.room||0)<=0)return;
  const traps=paintTraps211(x,dom),zones=paintEnemySense211(x,dom);
  sensePanel211(x,traps,zones);
  puzzleAction211(x);
  distinguishScene211();
  resolveEnemyDetection211(x,zones,dom)
}

/* Combat: mains nues + recharge spécifique au héros. */
window.dc211CombatUnequip=function(heroId){
  const st=loadState(heroId);st.rightHand=null;st.leftHand=null;
  localStorage.setItem(key(heroId),JSON.stringify(st));
  if(String(current||"")===String(heroId))state=st;
  renderDungeonCombatRound()
}
window.dc211CombatReload=function(heroId,idx){
  const st=loadState(heroId),i=Number(idx),e=st.inventory?.[i],it=getItemFromEntry(e);
  if(!e||!it||!Number(it.ammoCapacity))return;
  if(Number(e.ammo??0)>=Number(it.ammoCapacity))return;
  const kind=String(it.rpgAmmoKind||"");
  let ri=st.inventory.findIndex((r,j)=>{
    if(j===i||j===st.rightHand||j===st.leftHand)return false;
    const q=getItemFromEntry(r);if(!q)return false;
    if(kind&&String(q.rpgReloadKind||"")===kind)return true;
    return !kind&&Number(q.reloads)>0
  });
  if(ri<0){alert(kind==="arrows"?"Aucun carquois de flèches disponible.":"Aucune recharge compatible.");return}
  const r=st.inventory[ri],q=getItemFromEntry(r);
  e.ammo=Number(it.ammoCapacity);
  if(Number(r.qty)>1)r.qty=Number(r.qty)-1;
  else if(Number(r.reloads??q.reloads)>1)r.reloads=Number(r.reloads??q.reloads)-1;
  else{
    st.inventory.splice(ri,1);
    for(const k of ["rightHand","leftHand","equipment"]){
      if(st[k]===ri)st[k]=null;else if(Number.isInteger(st[k])&&st[k]>ri)st[k]--
    }
  }
  localStorage.setItem(key(heroId),JSON.stringify(st));
  if(String(current||"")===String(heroId))state=st;
  renderDungeonCombatRound()
}
function combatTools211(){
  document.querySelectorAll("#combatHeroSide .combatantCard").forEach(card=>{
    const heroId=String(card.dataset.actorId||"");if(!heroId)return;
    card.querySelector(".dc211CombatTools")?.remove();
    const st=loadState(heroId);
    const idx=[st.rightHand,st.leftHand].find(i=>Number.isInteger(i)&&getItemFromEntry(st.inventory?.[i])?.type==="Arme");
    const it=Number.isInteger(idx)?getItemFromEntry(st.inventory?.[idx]):null;
    const box=document.createElement("div");box.className="dc211CombatTools";
    box.innerHTML='<button type="button" onclick="dc211CombatUnequip(\''+heroId.replace(/'/g,"")+'\')">👊 MAINS NUES</button>'+
      (it&&Number(it.ammoCapacity)>0?'<button type="button" onclick="dc211CombatReload(\''+heroId.replace(/'/g,"")+'\',\''+idx+'\')">🔄 RECHARGER '+Math.max(0,Number(st.inventory[idx]?.ammo)||0)+'/'+Number(it.ammoCapacity)+'</button>':'');
    card.appendChild(box)
  })
}

/* Dead hero must never remain current in the combat timeline. */
function normalizeCombatTurn211(){
  try{
    if(!window.dungeonTurn156?.active||typeof dungeonCurrentTurn156!=="function")return;
    let guard=0,cur=dungeonCurrentTurn156();
    while(cur?.kind==="hero"&&!heroAlive211(cur.id)&&guard++<20){
      dungeonAdvanceTurn156();cur=dungeonCurrentTurn156()
    }
  }catch(e){}
}
if(typeof window.dungeonBuildOrder156==="function"){
  const prev=window.dungeonBuildOrder156;
  window.dungeonBuildOrder156=function(){
    return (prev.apply(this,arguments)||[]).filter(a=>a.kind!=="hero"||heroAlive211(a.id))
  }
}

/* Exploration turn: skip KO/dead heroes too. */
if(window.DungeonCore01&&typeof DungeonCore01.endTurn==="function"){
  const prev=DungeonCore01.endTurn;
  DungeonCore01.endTurn=function(){
    const r=prev.apply(this,arguments),x=rt();
    if(x?.participants?.length){
      let guard=0;
      while(!heroAlive211(activeHero211(x))&&guard++<x.participants.length){
        x.index=(Number(x.index)+1)%x.participants.length
      }
      saveRt211(x)
    }
    requestAnimationFrame(()=>{try{DungeonCore01.render?.()}catch(e){}});
    return r
  }
}

/* Extend combat weapon selector: explicit unarmed option. */
if(typeof window.dungeonCombatSwitchWeapon071==="function"){
  const prev=window.dungeonCombatSwitchWeapon071;
  window.dungeonCombatSwitchWeapon071=function(heroId,idx){
    if(String(idx)==="__unarmed__")return dc211CombatUnequip(heroId);
    return prev.apply(this,arguments)
  }
}
function addUnarmedOption211(){
  document.querySelectorAll(".dc071Weapon select").forEach(sel=>{
    if(sel.querySelector('option[value="__unarmed__"]'))return;
    const o=document.createElement("option");o.value="__unarmed__";o.textContent="👊 Mains nues";
    sel.appendChild(o)
  })
}

/* Puzzles: if challenge chance is enabled but stale config has empty pool, use the built-in library. */
function repairPuzzlePool211(){
  try{
    const c=loadDungeonConfig?.();if(!c)return;
    if(Number(c.challengeDoorChance||0)<=0&&Number(c.challengeChestChance||0)<=0)return;
    if(Array.isArray(c.challenges)&&c.challenges.length===0){
      const lib=typeof loadChallengeLibrary069==="function"?loadChallengeLibrary069():[];
      if(lib.length){c.challenges=lib.map(x=>JSON.parse(JSON.stringify(x)));saveDungeonConfig?.(c)}
    }
  }catch(e){}
}
repairPuzzlePool211();

if(window.DungeonCore01&&typeof DungeonCore01.render==="function"){
  const prev=DungeonCore01.render;
  DungeonCore01.render=function(){
    const r=prev.apply(this,arguments);
    decorate211();requestAnimationFrame(decorate211);
    return r
  }
}
if(typeof window.renderDungeonCombatRound==="function"){
  const prev=window.renderDungeonCombatRound;
  window.renderDungeonCombatRound=function(){
    normalizeCombatTurn211();
    const r=prev.apply(this,arguments);
    try{combatTools211();addUnarmedOption211()}catch(e){}
    return r
  }
}
setTimeout(()=>{try{decorate211()}catch(e){}},0);

window.dungeonDebug211=function(){
  const x=rt(),ex=profile();
  return {
    room:x?.room,activeHero:activeHero211(x),
    heroes:(x?.participants||[]).map(id=>({id,alive:heroAlive211(id),cell:Number(x.positions?.[id])})),
    detection:ex,
    trapTest:trapTestState211(x,activeHero211(x)),
    objective:x?.last?.map?.objective||null
  }
};
try{
 const badge=document.querySelector(".dc01Badge");if(badge)badge.textContent="NOUVEAU MOTEUR · CORE 3.06";
 const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core 3.06 · détection testable · héros visibles · combat consolidé.";
}catch(e){}
})();
