
(function(){
"use strict";
const RT="gensrpg_dungeon_runtime_v2";

function rt(){try{return JSON.parse(localStorage.getItem(RT)||"null")}catch(e){return null}}
function saveRt(x){if(x)localStorage.setItem(RT,JSON.stringify(x))}
function cells(){return [...document.querySelectorAll("#dc047RoomBoard .dc047Grid > .dc047Cell")]}
function heroName(id){return CHARS?.[id]?.name||findCustomHero?.(id)?.name||String(id)}
function heroImg(id){
  const c=CHARS?.[id]||findCustomHero?.(id)||{};
  if(c.image||c.avatar)return c.image||c.avatar;
  return window.GensAssetResolverV1.dungeonHeroPath(id)
}
function initials(id){return heroName(id).split(/\s+/).filter(Boolean).map(v=>v[0]).join("").slice(0,2).toUpperCase()}
function liveEnemies(x){
  const branch=!!x?.branch?.active,hero=String(x?.participants?.[Number(x?.index)||0]||"");
  try{
    return (loadActiveEnemies?.()||[]).filter(e=>
      !e.removed&&!e.defeated&&Number(e.hp)>0 &&
      Number(e.dungeonRoom||0)===Number(x?.room||0) &&
      !e.dc200Bypassed && !e.dc200BypassedBy?.[hero] &&
      (branch?e.dc200Branch===true:e.dc200Branch!==true)
    )
  }catch(e){return []}
}
function enemyName(e){try{return activeEnemyDefinition?.(e.enemyId)?.name||e.name||"Ennemi"}catch(_){return e?.name||"Ennemi"}}
function blocked(v){return ["wall","void","entry","exit","chest","cache","trap","puzzle"].includes(String(v))}

/* -------- deterministic unique enemy cells -------- */
function normalizeEnemyCells(x){
  const m=x?.last?.map;if(!m||!Array.isArray(m.cells))return;
  const live=liveEnemies(x), ids=new Set(live.map(e=>String(e.id)));
  x.enemyCells=x.enemyCells||{};

  Object.keys(x.enemyCells).forEach(id=>{
    const n=Number(x.enemyCells[id]);
    if(!ids.has(String(id))||!Number.isInteger(n)||n<0||n>=m.cells.length)delete x.enemyCells[id]
  });

  const heroCells=new Set((x.participants||[]).filter(id=>window.DungeonSpatial313?.sameView(x,id)!==false).map(id=>Number(x.positions?.[id])).filter(Number.isInteger));
  const claimed=new Set();

  /* Deduplicate existing assignments: only the first enemy may keep a cell. */
  live.forEach(e=>{
    const n=Number(x.enemyCells[e.id]);
    if(!Number.isInteger(n)||n<0||n>=m.cells.length||heroCells.has(n)||blocked(m.cells[n])||claimed.has(n)){
      delete x.enemyCells[e.id];return
    }
    claimed.add(n)
  });

  const markers=[];
  m.cells.forEach((v,i)=>{if(String(v)==="enemy"&&!heroCells.has(i)&&!claimed.has(i))markers.push(i)});
  const free=[];
  m.cells.forEach((v,i)=>{
    if(heroCells.has(i)||claimed.has(i)||blocked(v))return;
    free.push(i)
  });

  live.forEach(e=>{
    if(Number.isInteger(Number(x.enemyCells[e.id])))return;
    let n=markers.find(i=>!claimed.has(i));
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

/* -------- one visual token system, with offsets for shared hero cells -------- */
function paintTokens(){
  const x=rt();if(!x||Number(x.room||0)<=0)return;
  normalizeEnemyCells(x);
  const dom=cells();if(!dom.length)return;

  dom.forEach(c=>{
    c.querySelectorAll(".dc209AllyToken,.dc211HeroToken,.dc212HeroToken,.dc212EnemyToken,.dc213HeroToken,.dc213EnemyToken").forEach(n=>n.remove())
  });

  const active=String(x.participants?.[Number(x.index)||0]||"");
  const groups={};
  (x.participants||[]).forEach(id=>{
    if(window.DungeonSpatial313?.sameView(x,id)===false)return;
    const p=Number(x.positions?.[id]);if(!Number.isInteger(p)||!dom[p])return;
    (groups[p]||(groups[p]=[])).push(String(id))
  });
  const offsets=[[2,2],[34,2],[2,34],[34,34],[18,18],[48,18]];

  Object.entries(groups).forEach(([pos,ids])=>{
    ids.forEach((id,k)=>{
      const t=document.createElement("span");
      t.className="dc213HeroToken"+(id===active?" active":"");
      const [l,tp]=offsets[k%offsets.length];
      t.style.left=l+"px";t.style.top=tp+"px";
      const img=heroImg(id);
      if(img){
        const im=document.createElement("img");im.src=img;im.alt=heroName(id);
        im.onerror=()=>{t.innerHTML="";t.textContent=initials(id)};
        t.appendChild(im)
      }else t.textContent=initials(id);
      t.title=heroName(id)+(id===active?" · ACTIF":"");
      dom[Number(pos)].appendChild(t)
    })
  });

  liveEnemies(x).forEach(e=>{
    const p=Number(x.enemyCells?.[e.id]);if(!Number.isInteger(p)||!dom[p])return;
    const t=document.createElement("span");
    t.className="dc213EnemyToken"+(String(x.last?.keyEnemyId||"")===String(e.id)?" key":"");
    t.textContent="👹";t.title=enemyName(e);
    dom[p].appendChild(t)
  })
}

/* -------- combat equipment: explicit unarmed + ammo counter + reload -------- */
function stateFor(id){try{return loadState(id)}catch(e){return null}}
function itemOf(entry){try{return getItemFromEntry(entry)}catch(e){return null}}
function equippedWeapon(id){
  const st=stateFor(id);if(!st)return {st:null,idx:null,it:null,entry:null};
  const idx=[st.rightHand,st.leftHand].find(i=>Number.isInteger(i)&&itemOf(st.inventory?.[i])?.type==="Arme");
  return {st,idx,it:Number.isInteger(idx)?itemOf(st.inventory[idx]):null,entry:Number.isInteger(idx)?st.inventory[idx]:null}
}
window.dc213Unarmed=function(id){
  const st=stateFor(id);if(!st)return;
  st.rightHand=null;st.leftHand=null;
  localStorage.setItem(key(id),JSON.stringify(st));
  if(String(current||"")===String(id))state=st;
  try{renderDungeonCombatRound()}catch(e){}
};
window.dc213Reload=function(id){
  const {st,idx,it,entry}=equippedWeapon(id);if(!st||!it||!Number(it.ammoCapacity))return;
  const kind=String(it.rpgAmmoKind||"");
  const ri=st.inventory.findIndex((r,j)=>{
    if(j===idx||j===st.rightHand||j===st.leftHand)return false;
    const q=itemOf(r);if(!q)return false;
    return kind?String(q.rpgReloadKind||"")===kind:Number(q.reloads)>0
  });
  if(ri<0){alert(kind==="arrows"?"Aucun carquois de flèches disponible.":"Aucune recharge compatible.");return}
  entry.ammo=Number(it.ammoCapacity);
  const r=st.inventory[ri],q=itemOf(r);
  if(Number(r.qty)>1)r.qty=Number(r.qty)-1;
  else if(Number(r.reloads??q.reloads)>1)r.reloads=Number(r.reloads??q.reloads)-1;
  else{
    st.inventory.splice(ri,1);
    ["rightHand","leftHand"].forEach(k=>{
      if(st[k]===ri)st[k]=null;else if(Number.isInteger(st[k])&&st[k]>ri)st[k]--
    })
  }
  localStorage.setItem(key(id),JSON.stringify(st));
  if(String(current||"")===String(id))state=st;
  try{renderDungeonCombatRound()}catch(e){}
};
function injectCombatTools(){
  const cards=[...document.querySelectorAll("#combatHeroSide .combatantCard")];
  if(!cards.length)return;
  const ids=[...(dungeonCombatSelection?.heroes||[])]
    .sort((a,b)=>(dungeonCombatHeroSnapshot?.(b)?.initiative||0)-(dungeonCombatHeroSnapshot?.(a)?.initiative||0));

  cards.forEach((card,i)=>{
    card.querySelector(".dc211CombatTools,.dc213CombatTools")?.remove();
    const id=String(ids[i]||"");if(!id)return;
    const {it,entry}=equippedWeapon(id);
    const box=document.createElement("div");box.className="dc213CombatTools";
    const ammo=it&&Number(it.ammoCapacity)>0
      ?Math.max(0,Number(entry?.ammo??it.ammoCapacity))+"/"+Number(it.ammoCapacity)
      :"—";
    box.innerHTML=
      '<div class="ammo">🗡️ '+(it?String(it.name):"Mains nues")+
      (it&&Number(it.ammoCapacity)>0?' · 🏹 Flèches : <strong>'+ammo+'</strong>':'')+'</div>'+
      '<button type="button" onclick="dc213Unarmed(\''+id.replace(/'/g,"")+'\')">👊 MAINS NUES</button>'+
      (it&&Number(it.ammoCapacity)>0
        ?'<button type="button" onclick="dc213Reload(\''+id.replace(/'/g,"")+'\')">🔄 RECHARGER</button>'
        :'<button type="button" disabled>🔄 RECHARGER</button>');
    card.appendChild(box)
  })
}

/* -------- chest/cache: explicit OPEN button, no hidden callback -------- */
function roomScene(){try{return loadDungeonSceneElements?.()||[]}catch(e){return []}}
function chestById(id){return roomScene().find(e=>String(e.id)===String(id)&&e.kind==="chest")}
function activeHero(x){return String(x?.participants?.[Number(x.index)||0]||"")}
function activePos(x){return Number(x?.positions?.[activeHero(x)])}
function chestCell(el,x){
  const n=Number(el?.cellIndex);if(Number.isInteger(n)&&n>=0)return n;
  const m=x?.last?.map;
  if(!m)return -1;
  const c=m.cells.findIndex(v=>["chest","cache"].includes(String(v)));
  return c
}
function removeChest213(id){
  const x=rt(),el=chestById(id);if(!x||!el)return;
  const cp=chestCell(el,x),hero=activeHero(x);let drop=null;
  try{
    if(el.trapped){
      const t=dungeonPickTrapType?.(loadDungeonConfig?.()||{});
      if(t)dungeonResolveTrapAgainstHero?.(t.id,hero,true)
    }
    drop=dungeonGrantLootByRarity?.(el.rarity||"common",hero)
  }catch(e){console.warn("Core 2.13 chest loot",e)}
  try{removeDungeonSceneElement?.(id)}catch(e){}
  if(x.last?.map&&cp>=0)x.last.map.cells[cp]="floor";
  // Le marqueur existant Core051 doit appartenir aussi au runtime Dungeon.
  // Sinon Core200 republie le snapshot sans marqueur et recrée le coffre.
  if(el.fromMap&&x.last?.map)x.last.map._dc051ChestConsumed=true;
  saveRt(x);
  const m=document.getElementById("dc200Modal");if(m)m.classList.remove("open");
  try{DungeonCore01?.render?.()}catch(e){}
  try{
    DungeonCore01?.modal?.("🎁 Coffre fouillé",
      drop?("<strong>"+heroName(hero)+"</strong> obtient <strong>"+String(drop.item?.name||"Objet")+"</strong>."):"Le coffre est vide.")
  }catch(e){}
}
window.dc213OpenChest=function(id){removeChest213(String(id))};

function openChest213(id){
  const x=rt(),el=chestById(id);if(!x||!el){
    try{DungeonCore01?.modal?.("🎁 Coffre","Ce coffre n’est plus disponible.")}catch(e){}
    return
  }
  const cp=chestCell(el,x);
  const positional=typeof window.dc305PositionalGameplay==="function"&&window.dc305PositionalGameplay();
  if(positional&&activePos(x)!==cp){
    try{DungeonCore01?.modal?.("🎁 Coffre","📍 Place le héros actif exactement sur la case du coffre.")}catch(e){}
    return
  }
  if(el.challenge&&!el.challengeDone&&typeof dc201OpenPuzzle==="function"){
    return dc201OpenPuzzle("chest",id)
  }
  const trap=el.trapped?"<br>⚠️ Il peut être piégé.":"";
  try{
    DungeonCore01?.modal?.("🎁 Ouvrir le coffre",
      'Le coffre est devant toi.'+trap+
      '<div id="dc213ChestActions"><button class="dc01Btn primary" type="button" onclick="dc213OpenChest(\''+
      String(id).replace(/'/g,"")+'\')">🎁 OUVRIR / FOUILLER</button></div>')
  }catch(e){}
}
if(window.DungeonCore01)DungeonCore01.searchChest=openChest213;

/* Catch every chest cell click after movement if hero is on it. */
document.addEventListener("click",function(ev){
  const cell=ev.target?.closest?.("#dc047RoomBoard .dc047Grid > .dc047Cell");
  if(!cell)return;
  const x=rt();if(!x)return;
  const idx=Number(cell.dataset.dcMapIndex);
  if(!Number.isInteger(idx))return;
  const positional=typeof window.dc305PositionalGameplay==="function"&&window.dc305PositionalGameplay();
  if(positional&&activePos(x)!==idx)return;
  const branch=!!x.branch?.active;
  const ch=roomScene().find(e=>e.kind==="chest"&&Number(e.room||0)===Number(x.room||0)&&
    !!e.branch200===branch&&Number(e.cellIndex)===idx);
  if(!ch)return;
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  openChest213(ch.id)
},true);

/* -------- puzzle drought guard -------- */
function library(){
  try{
    const a=typeof loadChallengeLibrary069==="function"?loadChallengeLibrary069():[];
    return Array.isArray(a)?a:[]
  }catch(e){return []}
}
function ensurePuzzle213(){
  const x=rt();if(!x||Number(x.room||0)<=0||!x.last?.map||x.last.kind==="boss")return;
  const cfg=loadDungeonConfig?.()||{};
  const pool=library();if(!pool.length)return;
  const obj=x.last.map.objective;
  if(obj?.type==="challenge"){
    x.dc213LastPuzzleRoom=Number(x.room);saveRt(x);return
  }

  /* Preserve editor choice: if door puzzles are explicitly 0%, no forced puzzle. */
  const chance=Math.max(0,Number(cfg.challengeDoorChance)||0);
  if(chance<=0)return;

  const last=Number(x.dc213LastPuzzleRoom)||0;
  const drought=Number(x.room)-last>=3;
  const roll=Math.random()*100<chance;
  if(!drought&&!roll)return;

  const ch=JSON.parse(JSON.stringify(pool[Math.floor(Math.random()*pool.length)]));
  x.last.map.objective={
    type:"challenge",status:"locked",title:"Défi de la porte",
    challenge:ch,text:"Un mécanisme bloque la sortie."
  };
  x.last.objective=x.last.map.objective;
  x.dc213LastPuzzleRoom=Number(x.room);
  saveRt(x);
  try{DungeonCore01?.render?.()}catch(e){}
}
if(window.DungeonCore01&&typeof DungeonCore01.explore==="function"){
  const prev=DungeonCore01.explore;
  DungeonCore01.explore=function(){
    const before=Number(rt()?.room)||0;
    const r=prev.apply(this,arguments);
    const after=Number(rt()?.room)||0;
    if(after>before)setTimeout(ensurePuzzle213,0);
    return r
  }
}

/* -------- total party defeat: close damage popups and never freeze -------- */
function heroHp(id){
  try{return Number(dungeonCombatHeroSnapshot?.(id)?.hp)||0}catch(e){return 0}
}
function allPartyDown(){
  let ids=[];
  try{ids=(JSON.parse(localStorage.getItem("gensrpg_dungeon_runtime_v2")||"null")?.participants||[]).map(String).filter(Boolean)}catch(e){}
  if(!ids.length)try{ids=(loadGameParticipants?.()||[]).map(String).filter(Boolean)}catch(e){}
  return ids.length>0&&ids.every(id=>heroHp(id)<=0)
}
function closeDamageLayers(){
  ["specialDiceModal","attackDiceModal","turnModal","dc036AiPopup","dc032AiPopup",
   "dungeonCombatStatsModal","dungeonCombatModal","dungeonCombatVictoryModal","dc104SafeModal","dc200Modal"]
  .forEach(id=>{
    const e=document.getElementById(id);if(!e)return;
    e.classList.remove("open","dc200CombatOpen");
    e.style.display="none";
    e.style.removeProperty("pointer-events")
  });
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("pointer-events");
  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("pointer-events");
}
function defeatModal(){
  let m=document.getElementById("dc213DefeatModal");
  if(!m){
    m=document.createElement("div");m.id="dc213DefeatModal";
    m.innerHTML='<div id="dc213DefeatBox"><h2>☠️ DÉFAITE</h2><p>Tout le groupe est hors combat.</p>'+
      '<button class="dc01Btn primary" type="button" onclick="dc213QuitAfterDefeat()">QUITTER LE DONJON</button></div>';
    document.body.appendChild(m)
  }
  m.style.display="flex";m.classList.add("open")
}
window.dc213QuitAfterDefeat=function(){ window.dc304DefeatExited=true; defeatBusy=true; if(typeof window.dc304HardDefeatExit==="function")return window.dc304HardDefeatExit();
  const m=document.getElementById("dc213DefeatModal");if(m){m.classList.remove("open");m.style.display="none"}
  closeDamageLayers();
  try{dungeonCombatActive=false}catch(e){}
  try{markSessionActive?.(false)}catch(e){}
  const core=document.getElementById("gensDungeonCore01");if(core)core.style.display="none";
  const setup=document.getElementById("setup");if(setup)setup.style.display="block";
  try{showGensRootHome?.()}catch(e){}
  const root=document.getElementById("gensRootHome");if(root)root.style.display="block";
  window.scrollTo(0,0)
};
let defeatBusy=false;
function checkDefeat(){ if(window.dc304DefeatExited===true)return false; if(defeatBusy||!allPartyDown())return false;
  defeatBusy=true;
  try{
    if(window.dungeonTurn156){dungeonTurn156.active=false;dungeonTurn156.aiBusy=false}
  }catch(e){}
  closeDamageLayers();defeatModal();
  return true
}

/* Final combat renderer wrapper. */
if(typeof window.renderDungeonCombatRound==="function"){
  const prev=window.renderDungeonCombatRound;
  window.renderDungeonCombatRound=function(){
    if(checkDefeat())return;
    const r=prev.apply(this,arguments);
    if(checkDefeat())return r;
    injectCombatTools();
    return r
  }
}

/* Damage entry point wrapper catches the fatal hit before another turn popup opens. */
if(typeof window.dungeonApplyHeroDamage==="function"){
  const prev=window.dungeonApplyHeroDamage;
  window.dungeonApplyHeroDamage=function(){
    const r=prev.apply(this,arguments);
    setTimeout(checkDefeat,0);
    return r
  }
}

/* Repaint tactical tokens after every Runtime render. */
if(window.DungeonCore01&&typeof DungeonCore01.render==="function"){
  const prev=window.DungeonCore01.render;
  DungeonCore01.render=function(){
    const r=prev.apply(this,arguments);
    paintTokens();requestAnimationFrame(paintTokens);
    return r
  }
}
setTimeout(()=>{try{paintTokens();ensurePuzzle213()}catch(e){}},0);

window.dungeonDebug213=function(){
  const x=rt();
  return {
    room:x?.room,
    heroTokens:document.querySelectorAll(".dc213HeroToken").length,
    enemyTokens:document.querySelectorAll(".dc213EnemyToken").length,
    heroes:(x?.participants||[]).map(id=>({id,cell:Number(x.positions?.[id])})),
    enemies:liveEnemies(x).map(e=>({id:e.id,cell:Number(x.enemyCells?.[e.id])})),
    objective:x?.last?.map?.objective||null,
    partyDown:allPartyDown()
  }
};

try{
 const badge=document.querySelector(".dc01Badge");if(badge)badge.textContent="NOUVEAU MOTEUR · CORE 3.06";
 const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core 3.06 · stabilité combat, coffres, pions et énigmes.";
}catch(e){}
})();
