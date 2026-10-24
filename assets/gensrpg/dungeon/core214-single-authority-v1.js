
(function(){
"use strict";
const RT="gensrpg_dungeon_runtime_v2";
let combatRendering=false, defeatOpen=false;

function rt(){try{return JSON.parse(localStorage.getItem(RT)||"null")}catch(e){return null}}
function saveRt(x){if(x)localStorage.setItem(RT,JSON.stringify(x))}
function boardCells(){return [...document.querySelectorAll("#dc047RoomBoard .dc047Grid > .dc047Cell")]}
function heroDef(id){return CHARS?.[id]||findCustomHero?.(id)||{}}
function heroName(id){return heroDef(id).name||String(id)}
function heroArt(id){
  const c=heroDef(id);
  if(c.image||c.avatar)return c.image||c.avatar;
  return window.GensAssetResolverV1.dungeonHeroPath(id)
}
function initials(id){return heroName(id).split(/\s+/).filter(Boolean).map(v=>v[0]).join("").slice(0,2).toUpperCase()}
function live(x){
  const branch=!!x?.branch?.active;
  try{
    return (loadActiveEnemies?.()||[]).filter(e=>
      !e.removed&&!e.defeated&&Number(e.hp)>0 &&
      Number(e.dungeonRoom||0)===Number(x?.room||0) &&
      !e.dc200Bypassed &&
      (branch?e.dc200Branch===true:e.dc200Branch!==true)
    )
  }catch(e){return []}
}
function enemyName(e){try{return activeEnemyDefinition?.(e.enemyId)?.name||e.name||"Ennemi"}catch(_){return e?.name||"Ennemi"}}
function forbidden(v){return ["wall","void","entry","exit","chest","cache","trap","puzzle"].includes(String(v))}

function normalizeEnemyPositions(x){
  const m=x?.last?.map;if(!m||!Array.isArray(m.cells))return;
  const enemies=live(x), validIds=new Set(enemies.map(e=>String(e.id)));
  x.enemyCells=x.enemyCells||{};

  Object.keys(x.enemyCells).forEach(id=>{
    const n=Number(x.enemyCells[id]);
    if(!validIds.has(String(id))||!Number.isInteger(n)||n<0||n>=m.cells.length)delete x.enemyCells[id]
  });

  const heroes=new Set((x.participants||[]).filter(id=>window.DungeonSpatial313?.sameView(x,id)!==false).map(id=>Number(x.positions?.[id])).filter(Number.isInteger));
  const claimed=new Set();
  enemies.forEach(e=>{
    const n=Number(x.enemyCells[e.id]);
    if(!Number.isInteger(n)||heroes.has(n)||forbidden(m.cells[n])||claimed.has(n)){
      delete x.enemyCells[e.id]
    }else claimed.add(n)
  });

  const preferred=[],free=[];
  m.cells.forEach((v,i)=>{
    if(heroes.has(i)||claimed.has(i)||forbidden(v))return;
    if(String(v)==="enemy")preferred.push(i);else free.push(i)
  });

  enemies.forEach(e=>{
    if(Number.isInteger(Number(x.enemyCells[e.id])))return;
    let n=preferred.find(i=>!claimed.has(i));
    if(!Number.isInteger(n))n=free.find(i=>!claimed.has(i));
    if(!Number.isInteger(n))return;
    x.enemyCells[e.id]=n;claimed.add(n);m.cells[n]="enemy"
  });

  const occupied=new Set(Object.values(x.enemyCells).map(Number));
  m.cells.forEach((v,i)=>{if(String(v)==="enemy"&&!occupied.has(i))m.cells[i]="floor"});

  try{
    const all=loadActiveEnemies?.()||[];
    all.forEach(e=>{if(x.enemyCells[e.id]!==undefined)e.dungeonCell200=Number(x.enemyCells[e.id])});
    saveActiveEnemies?.(all)
  }catch(e){}
  saveRt(x)
}

function paintUnits(){
  const x=rt();if(!x||Number(x.room||0)<=0)return;
  normalizeEnemyPositions(x);
  const cells=boardCells();if(!cells.length)return;

  cells.forEach(c=>{
    c.querySelectorAll(".dc209AllyToken,.dc211HeroToken,.dc212HeroToken,.dc212EnemyToken,.dc213HeroToken,.dc213EnemyToken,.dc214Hero,.dc214Enemy").forEach(n=>n.remove())
  });

  const active=String(x.participants?.[Number(x.index)||0]||"");
  const byCell={};
  (x.participants||[]).forEach(id=>{
    if(window.DungeonSpatial313?.sameView(x,id)===false)return;
    const p=Number(x.positions?.[id]);
    if(Number.isInteger(p)&&cells[p])(byCell[p]||(byCell[p]=[])).push(String(id))
  });

  const offsets=[[2,2],[34,2],[2,34],[34,34],[18,18],[48,18]];
  Object.entries(byCell).forEach(([p,ids])=>ids.forEach((id,k)=>{
    const t=document.createElement("span");
    t.className="dc214Hero"+(id===active?" active":"");
    t.style.left=offsets[k%offsets.length][0]+"px";
    t.style.top=offsets[k%offsets.length][1]+"px";
    const art=heroArt(id);
    if(art){
      const img=document.createElement("img");img.src=art;img.alt=heroName(id);
      img.onerror=()=>{t.innerHTML="";t.textContent=initials(id)};
      t.appendChild(img)
    }else t.textContent=initials(id);
    t.title=heroName(id);
    cells[Number(p)].appendChild(t)
  }));

  live(x).forEach(e=>{
    const p=Number(x.enemyCells?.[e.id]);if(!Number.isInteger(p)||!cells[p])return;
    const t=document.createElement("span");
    t.className="dc214Enemy"+(String(x.last?.keyEnemyId||"")===String(e.id)?" key":"");
    t.textContent="👹";t.title=enemyName(e);
    cells[p].appendChild(t)
  })
}

/* -------- Combat single authority -------- */
function st(id){try{return loadState(id)}catch(e){return null}}
function item(entry){try{return getItemFromEntry(entry)}catch(e){return null}}
function allWeapons(id){
  const s=st(id);if(!s)return [];
  return (s.inventory||[]).map((e,i)=>({i,e,it:item(e)})).filter(x=>x.it?.type==="Arme")
}
function equipped(id){
  const s=st(id);if(!s)return null;
  for(const i of [s.rightHand,s.leftHand]){
    if(Number.isInteger(i)){
      const it=item(s.inventory?.[i]);
      if(it?.type==="Arme")return {s,i,e:s.inventory[i],it}
    }
  }
  return {s,i:-1,e:null,it:null}
}
function saveHero(id,s){
  localStorage.setItem(key(id),JSON.stringify(s));
  if(String(current||"")===String(id))state=s
}
window.dc214Equip=function(id,value){
  const s=st(id);if(!s)return;
  if(String(value)==="unarmed"){
    s.rightHand=null;s.leftHand=null;saveHero(id,s);window.__dc214RenderCombat();return
  }
  const i=Number(value),e=s.inventory?.[i],it=item(e);
  if(!Number.isInteger(i)||!it||it.type!=="Arme")return;
  s.rightHand=i;s.leftHand=Number(it.hands)>=2?i:null;
  saveHero(id,s);window.__dc214RenderCombat()
};
window.dc214Reload=function(id){
  const q=equipped(id);if(!q?.it||!Number(q.it.ammoCapacity))return;
  const kind=String(q.it.rpgAmmoKind||"");
  const ri=q.s.inventory.findIndex((r,j)=>{
    if(j===q.i||j===q.s.rightHand||j===q.s.leftHand)return false;
    const it=item(r);if(!it)return false;
    return kind?String(it.rpgReloadKind||"")===kind:Number(it.reloads)>0
  });
  if(ri<0){alert(kind==="arrows"?"Aucun carquois de flèches disponible.":"Aucune recharge compatible.");return}
  q.e.ammo=Number(q.it.ammoCapacity);
  const r=q.s.inventory[ri],reload=item(r);
  if(Number(r.qty)>1)r.qty=Number(r.qty)-1;
  else if(Number(r.reloads??reload.reloads)>1)r.reloads=Number(r.reloads??reload.reloads)-1;
  else{
    q.s.inventory.splice(ri,1);
    ["rightHand","leftHand"].forEach(k=>{
      if(q.s[k]===ri)q.s[k]=null;
      else if(Number.isInteger(q.s[k])&&q.s[k]>ri)q.s[k]--
    })
  }
  saveHero(id,q.s);window.__dc214RenderCombat()
};
function decorateCombat(){
  const cards=[...document.querySelectorAll("#combatHeroSide .combatantCard")];
  const ids=[...(dungeonCombatSelection?.heroes||[])]
    .sort((a,b)=>(dungeonCombatHeroSnapshot?.(b)?.initiative||0)-(dungeonCombatHeroSnapshot?.(a)?.initiative||0));

  cards.forEach((card,i)=>{
    const id=String(ids[i]||"");if(!id)return;
    card.dataset.actorId=id;
    card.querySelectorAll(".dc211CombatTools,.dc213CombatTools,.dc214CombatGear").forEach(n=>n.remove());

    const q=equipped(id),weapons=allWeapons(id);
    const box=document.createElement("div");box.className="dc214CombatGear";
    const selected=q?.i??-1;
    const opts='<option value="unarmed"'+(selected<0?' selected':'')+'>👊 Mains nues</option>'+
      weapons.map(w=>'<option value="'+w.i+'"'+(w.i===selected?' selected':'')+'>'+String(w.it.name)+'</option>').join("");
    let ammo="";
    if(q?.it&&Number(q.it.ammoCapacity)>0){
      const left=Math.max(0,Number(q.e?.ammo??q.it.ammoCapacity));
      ammo='<div class="dc214Ammo '+(left<=0?'empty':'')+'">🏹 FLÈCHES : '+left+' / '+Number(q.it.ammoCapacity)+'</div>'+
        (left<=0?'<div class="dc214Hint">Plus de flèches : recharge l’arc ou passe en mains nues.</div>':'');
    }else{
      ammo='<div class="dc214Ammo">⚔️ '+(q?.it?String(q.it.name):"Mains nues")+'</div>'
    }

    box.innerHTML=ammo+
      '<div class="row"><select onchange="dc214Equip(\''+id.replace(/'/g,"")+'\',this.value)">'+opts+'</select>'+
      '<button type="button" onclick="dc214Reload(\''+id.replace(/'/g,"")+'\')"'+
      (!(q?.it&&Number(q.it.ammoCapacity)>0)?' disabled':'')+'>🔄 RECHARGER</button></div>';
    card.appendChild(box);

    /* Empty ranged weapon cannot stay as a misleading usable attack. */
    if(q?.it&&Number(q.it.ammoCapacity)>0&&Math.max(0,Number(q.e?.ammo??q.it.ammoCapacity))<=0){
      card.querySelectorAll(".dungeonHeroCombatAttackBtn").forEach(btn=>{
        if((btn.textContent||"").includes(q.it.name)){btn.disabled=true;btn.title="Plus de flèches"}
      })
    }
  })
}

function partyDown(){
  let ids=[];
  try{ids=(JSON.parse(localStorage.getItem("gensrpg_dungeon_runtime_v2")||"null")?.participants||[]).map(String).filter(Boolean)}catch(e){}
  if(!ids.length)try{ids=(loadGameParticipants?.()||[]).map(String).filter(Boolean)}catch(e){}
  if(!ids.length)return false;
  return ids.every(id=>{
    try{return Number(dungeonCombatHeroSnapshot(id)?.hp)<=0}catch(e){return false}
  })
}
function hideCombatLayers(){
  ["specialDiceModal","attackDiceModal","turnModal","dc036AiPopup","dc032AiPopup",
   "dungeonCombatStatsModal","dungeonCombatVictoryModal","dc104SafeModal","dc200Modal"]
  .forEach(id=>{
    const e=document.getElementById(id);if(!e)return;
    e.classList.remove("open","dc200CombatOpen");e.style.display="none";
    e.style.removeProperty("pointer-events")
  });
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("pointer-events")
}
function showDefeat(){ if(window.dc304DefeatExited===true)return; if(defeatOpen)return;
  defeatOpen=true;
  try{
    if(window.dungeonTurn156){
      dungeonTurn156.active=false;dungeonTurn156.aiBusy=false;dungeonTurn156.order=[];dungeonTurn156.index=0
    }
  }catch(e){}
  hideCombatLayers();
  const combat=document.getElementById("dungeonCombatModal");
  if(combat){combat.classList.remove("open","dc200CombatOpen");combat.style.display="none"}
  let m=document.getElementById("dc214Defeat");
  if(!m){
    m=document.createElement("div");m.id="dc214Defeat";
    m.innerHTML='<div><h2>☠️ DÉFAITE</h2><p>Tout le groupe est hors combat.</p>'+
      '<button class="dc01Btn primary" type="button" onclick="dc214Quit()">QUITTER LE DONJON</button></div>';
    document.body.appendChild(m)
  }
  m.style.display="flex";m.classList.add("open")
}
window.dc214Quit=function(){ window.dc304DefeatExited=true; defeatOpen=true; if(typeof window.dc304HardDefeatExit==="function")return window.dc304HardDefeatExit();
  const m=document.getElementById("dc214Defeat");if(m){m.classList.remove("open");m.style.display="none"}
  defeatOpen=false;hideCombatLayers();
  try{dungeonCombatActive=false}catch(e){}
  try{markSessionActive?.(false)}catch(e){}
  const core=document.getElementById("gensDungeonCore01");if(core)core.style.display="none";
  try{showGensRootHome?.()}catch(e){}
  const root=document.getElementById("gensRootHome");if(root)root.style.display="block";
  window.scrollTo(0,0)
};

/* This is now the only combat renderer used by Runtime 2.x. */
window.__dc214RenderCombat=function(){ if(window.dc304DefeatExited===true)return;
  if(combatRendering)return;
  combatRendering=true;
  try{
    if(window.dungeonTurn156){
      dungeonTurn156.active=false;
      dungeonTurn156.aiBusy=false;
      dungeonTurn156.order=[];
      dungeonTurn156.index=0
    }
    if(partyDown()){showDefeat();return}
    if(typeof window.__dc200StableRenderCombatRound==="function"){
      window.__dc200StableRenderCombatRound()
    }
    if(partyDown()){showDefeat();return}
    decorateCombat()
  }finally{combatRendering=false}
};
window.renderDungeonCombatRound=window.__dc214RenderCombat;

/* Directly neutralize stale AI timeline entry points while Runtime 2.x combat is active. */
if(typeof window.dungeonRunAi156==="function"){
  window.dungeonRunAi156=function(){if(window.dungeonTurn156){dungeonTurn156.aiBusy=false;dungeonTurn156.active=false}}
}
if(typeof window.dungeonAdvanceTurn156==="function"){
  window.dungeonAdvanceTurn156=function(){if(window.dungeonTurn156){dungeonTurn156.aiBusy=false;dungeonTurn156.active=false}}
}

/* -------- Puzzle guard: configured library, visible objective -------- */
function puzzlePool(){
  try{
    const cfg=loadDungeonConfig?.()||{}, raw=Array.isArray(cfg.challenges)?cfg.challenges:null;
    const lib=loadChallengeLibrary069?.()||[];
    if(raw===null||!raw.length)return lib;
    const objs=raw.filter(x=>x&&typeof x==="object"&&x.id);
    if(objs.length)return objs;
    const ids=new Set(raw.map(x=>String(x?.id??x)));
    return lib.filter(x=>ids.has(String(x.id)))
  }catch(e){return []}
}
function ensurePuzzle(){
  const x=rt();if(!x||Number(x.room||0)<=0||!x.last?.map||x.last.kind==="boss")return;
  const cfg=loadDungeonConfig?.()||{}, chance=Math.max(0,Number(cfg.challengeDoorChance)||0);
  if(chance<=0)return;
  if(x.last.map.objective?.type==="challenge"){
    x.dc214LastPuzzleRoom=Number(x.room);saveRt(x);return
  }
  const pool=puzzlePool();if(!pool.length)return;
  const last=Number(x.dc214LastPuzzleRoom)||0;
  const force=Number(x.room)>=3&&Number(x.room)-last>=3;
  if(!force&&Math.random()*100>=chance)return;
  const ch=JSON.parse(JSON.stringify(pool[Math.floor(Math.random()*pool.length)]));
  x.last.map.objective={type:"challenge",status:"locked",title:"Défi de la porte",challenge:ch,text:"Un mécanisme bloque la sortie."};
  x.last.objective=x.last.map.objective;x.dc214LastPuzzleRoom=Number(x.room);saveRt(x)
}
function puzzleButton(){
  const x=rt(),board=document.getElementById("dc047RoomBoard");if(!board)return;
  let h=document.getElementById("dc214Puzzle");
  if(!h){h=document.createElement("div");h.id="dc214Puzzle";board.insertAdjacentElement("afterend",h)}
  const o=x?.last?.map?.objective;
  if(o?.type==="challenge"&&o.status==="locked"&&o.challenge){
    h.innerHTML='<button class="dc01Btn primary" style="width:100%" type="button" onclick="dc201OpenPuzzle(\'door\',\'\')">🧩 RÉSOUDRE L’ÉNIGME</button>'
  }else h.innerHTML=""
}

function postRender(){
  paintUnits();ensurePuzzle();puzzleButton()
}
if(window.DungeonCore01&&typeof DungeonCore01.render==="function"){
  const old=DungeonCore01.render;
  DungeonCore01.render=function(){
    const r=old.apply(this,arguments);
    postRender();requestAnimationFrame(postRender);
    return r
  }
}
if(window.DungeonCore01&&typeof DungeonCore01.show==="function"){
  const old=DungeonCore01.show;
  DungeonCore01.show=function(){
    const r=old.apply(this,arguments);
    postRender();requestAnimationFrame(postRender);
    return r
  }
}

setTimeout(()=>{try{postRender()}catch(e){}},0);

window.dungeonDebug214=function(){
  const x=rt();
  return {
    room:x?.room,
    heroTokens:document.querySelectorAll(".dc214Hero").length,
    enemyTokens:document.querySelectorAll(".dc214Enemy").length,
    heroes:(x?.participants||[]).map(id=>({id,cell:Number(x.positions?.[id])})),
    enemies:live(x).map(e=>({id:e.id,cell:Number(x.enemyCells?.[e.id])})),
    combatRenderer:window.renderDungeonCombatRound===window.__dc214RenderCombat,
    aiActive:!!window.dungeonTurn156?.active,
    aiBusy:!!window.dungeonTurn156?.aiBusy,
    objective:x?.last?.map?.objective||null
  }
};

try{
 const b=document.querySelector(".dc01Badge");if(b)b.textContent="NOUVEAU MOTEUR · CORE 3.06";
 const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core 3.06 · autorité unique carte/combat.";
}catch(e){}
})();
