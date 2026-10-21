
(function(){
'use strict';
const RT_KEY='gensrpg_dungeon_runtime_v2';
const CORE_KEY='gensrpg_dungeon_core02_v1';
const DEVICE_HERO_KEY='gensrpg_dungeon_core01_device_hero_v1';
let active200=false;
let modalDone200=null;

function esc(v){try{return z40kEscHtml(String(v??''))}catch(e){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}}
function clone(v){return JSON.parse(JSON.stringify(v))}
function rt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||'null');return x&&typeof x==='object'?x:null}catch(e){return null}}
function spatial(){return window.DungeonSpatial313||null}
function spatialEnsure(x){try{return spatial()?.ensure(x)||x}catch(e){console.warn('DC313 spatial ensure',e);return x}}
function spatialPersist(x){try{return spatial()?.persist(x)||x}catch(e){console.warn('DC313 spatial persist',e);return x}}
function spatialActivate(x,id){try{return spatial()?.activate(x,id)||x}catch(e){console.warn('DC313 spatial activate',e);return x}}
function spatialSetRoom(x,id,room){try{return spatial()?.setRoom(x,id,room)||x}catch(e){return x}}
function spatialHeroesHere(x){try{const a=spatial()?.heroesHere(x);return Array.isArray(a)?a:[activeHero(x)].filter(Boolean)}catch(e){return [activeHero(x)].filter(Boolean)}}
function spatialSameView(x,id){try{return spatial()?.sameView(x,id)!==false}catch(e){return true}}
function spatialClearBranch(x,id){try{return spatial()?.clearBranch(x,id)||x}catch(e){return x}}
function saveRt(x){spatialPersist(x);localStorage.setItem(RT_KEY,JSON.stringify(x||{}));syncLegacy(x)}
function party(){try{return [...new Set((loadGameParticipants?.()||[]).map(String).filter(Boolean))]}catch(e){return []}}
function heroName(id){return CHARS?.[id]?.name||findCustomHero?.(id)?.name||String(id||'—')}
function initials(id){return heroName(id).split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'H'}
function role(){try{return isGameMasterDevice?.()?'gm':'player'}catch(e){return 'player'}}
function assigned(){return localStorage.getItem(DEVICE_HERO_KEY)||''}
function canAct(x=rt()){if(!x)return false;if(role()==='gm')return true;return !!assigned()&&String(assigned())===String(x.participants?.[x.index]||'')}
function activeHero(x=rt()){return String(x?.participants?.[x?.index||0]||'')}
function cfg(){try{return loadDungeonConfig?.()||{}}catch(e){return {}}}
function movementCfg(){try{return getActiveGameProfile?.()?.rpgUniverse?.movement||{}}catch(e){return {}}}
function tactical(){
  try{
    if(typeof window.dc305PositionalGameplay==="function")return window.dc305PositionalGameplay();
    const mods=typeof gensGameplayModules==="function"?gensGameplayModules():{};
    if(mods?.movement!==true)return false;
    const m=movementCfg();
    return ["tactical","hybrid"].includes(String(m.mode||"narrative"));
  }catch(e){return false}
}
function moveMax(id){try{return Math.max(0,Number(dungeonHeroMoveValue083?.(id))||Number(CHARS?.[id]?.dungeonStats?.movement)||3)}catch(e){return 3}}
function syncLegacy(x){
 if(!x)return;
 try{localStorage.setItem(CORE_KEY,JSON.stringify({version:200,participants:x.participants||[],round:x.round||1,index:x.index||0,phase:x.phase||'exploration',environment:'dungeon'}))}catch(e){}
 try{saveDungeonState?.({room:x.room||0,last:x.last||null})}catch(e){}
}
function newRt(ids){return spatialEnsure({version:200,participants:[...ids],round:1,index:0,phase:'exploration',room:0,last:null,positions:{},remaining:{},enemyCells:{},branch:null,pendingEvent:null,heroRooms:{},roomStates:{},heroBranchStates:{}})}
function hideLegacy(){['setup','editorHub','pregameSetup','menu','sheet','gameProfileEditor','heroManager','enemyManager','objectManager','zombieManager','gameCustomization','sessionHeroSetup','sessionObjectSetup','sessionWaveSetup','dungeonAdvancedEditor'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'})}
function shell(){return document.getElementById('gensDungeonCore01')}
function ensureModal(){
 let m=document.getElementById('dc200Modal');if(m)return m;
 m=document.createElement('div');m.id='dc200Modal';m.innerHTML='<div id="dc200ModalBox"><div id="dc200ModalTitle"></div><div id="dc200ModalBody"></div><div id="dc200ModalActions"><button type="button" class="dc01Btn primary" id="dc200ModalOk">CONTINUER</button></div></div>';
 document.body.appendChild(m);document.getElementById('dc200ModalOk').onclick=closeModal;return m;
}
function modal(title,html,onDone){const m=ensureModal(),ok=document.getElementById('dc200ModalOk');document.getElementById('dc200ModalTitle').textContent=title||'Dungeon';document.getElementById('dc200ModalBody').innerHTML=html||'';modalDone200=typeof onDone==='function'?onDone:null;if(String(title).includes('coffre'))console.info('DC200_MODAL_ARM',title,!!modalDone200);if(ok){ok.textContent='CONTINUER';ok.className='dc01Btn primary';ok.onclick=closeModal;ok.disabled=false}m.classList.remove('dc212VictoryOpen');m.classList.add('open')}
function closeModal(){const m=ensureModal();m.classList.remove('open');const cb=modalDone200;if(document.getElementById('dc200ModalTitle')?.textContent?.toLowerCase().includes('coffre'))console.info('DC200_MODAL_CLOSE',document.getElementById('dc200ModalTitle')?.textContent,!!cb);modalDone200=null;if(cb)try{cb()}catch(e){console.error('DC200 modal callback',e)}render()}

function liveEnemies(){try{const x=rt(),branch=!!x?.branch?.active,hero=activeHero(x);return (loadActiveEnemies?.()||[]).filter(e=>!e.removed&&!e.defeated&&Number(e.hp)>0&&Number(e.dungeonRoom||0)===Number(x?.room||0)&&!e.dc200Bypassed&&!e.dc200BypassedBy?.[hero]&&(branch?e.dc200Branch===true:e.dc200Branch!==true))}catch(e){return []}}
function visibleEnemies(){try{const x=rt(),branch=!!x?.branch?.active;return (loadActiveEnemies?.()||[]).filter(e=>!e.removed&&!e.defeated&&Number(e.hp)>0&&Number(e.dungeonRoom||0)===Number(x?.room||0)&&!e.dc200Bypassed&&(branch?e.dc200Branch===true:e.dc200Branch!==true))}catch(e){return []}}
function enemyName(e){try{return activeEnemyDefinition?.(e?.enemyId)?.name||e?.name||'Ennemi'}catch(_){return e?.name||'Ennemi'}}
function map(){return rt()?.last?.map||null}
function cells(){return map()?.cells||[]}
function spawnIndex(m){if(!m||!Array.isArray(m.cells))return -1;for(const v of [m.heroIdx,m.entryIdx,m.cells.indexOf('hero'),m.cells.indexOf('entry')]){const n=Number(v);if(Number.isInteger(n)&&n>=0&&n<m.cells.length)return n}return m.cells.findIndex(v=>!['wall','void'].includes(String(v)))}
function exitIndex(m){if(!m||!Array.isArray(m.cells))return -1;for(const v of [m.exitIdx,m.cells.indexOf('exit')]){const n=Number(v);if(Number.isInteger(n)&&n>=0)return n}return -1}
function blocked(t){return ['wall','void'].includes(String(t))}
function neighbours(i,size,total){const r=Math.floor(i/size),c=i%size,a=[];if(r>0)a.push(i-size);if(r<size-1)a.push(i+size);if(c>0)a.push(i-1);if(c<size-1)a.push(i+1);return a.filter(n=>n>=0&&n<total)}
function distanceMap(from,m,max,x){const size=Number(m?.size)||Math.round(Math.sqrt(m?.cells?.length||0))||1,d=new Map([[from,0]]),q=[from];let qi=0;const occupied=new Set(Object.values(x?.enemyCells||{}).map(Number));while(qi<q.length){const cur=q[qi++],cd=d.get(cur)||0;if(cd>=max)continue;if(cur!==from&&occupied.has(cur))continue;for(const n of neighbours(cur,size,m.cells.length)){if(d.has(n)||blocked(m.cells[n]))continue;d.set(n,cd+1);q.push(n)}}return d}
function position(id,x=rt()){const n=Number(x?.positions?.[id]);return Number.isInteger(n)?n:-1}
function activePos(x=rt()){return position(activeHero(x),x)}
function heroAlive200(id){try{return Number(dungeonCombatHeroSnapshot?.(id)?.hp)>0}catch(e){return false}}
function participationRange200(){const n=Number(movementCfg()?.combatParticipationRange);return Number.isFinite(n)?Math.max(0,Math.min(20,n)):3}
function combatHeroes200(x){
 const leader=activeHero(x),model=spatial();
 const ids=typeof model?.participatingHeroes==="function"
   ?model.participatingHeroes(x,leader,participationRange200(),tactical())
   :spatialHeroesHere(x);
 return ids.filter(heroAlive200)
}
function enemyAt(idx,x=rt()){const pair=Object.entries(x?.enemyCells||{}).find(([,c])=>Number(c)===Number(idx));if(!pair)return null;return liveEnemies().find(e=>String(e.id)===String(pair[0]))||null}
function keyCarrier(x=rt()){const id=String(x?.last?.keyEnemyId||'');return id?liveEnemies().find(e=>String(e.id)===id)||null:null}
function exitLocked(x=rt()){
 if(!x?.last)return false;
 if(x.last.kind==='boss'){if(liveEnemies().length)return true;x.last.exitLocked=false;x.last.keyEnemyId='';saveRt(x);return false}
 if(!x.last.exitLocked)return false;
 const k=keyCarrier(x);if(!k){x.last.exitLocked=false;x.last.keyEnemyId='';saveRt(x);try{showToast?.('🔑 Clé récupérée ! La sortie est ouverte.')}catch(e){};return false}return true
}
function assignEnemyCells(x){
 const m=x?.last?.map;if(!m||!Array.isArray(m.cells))return;
  /* La visibilité est commune à la salle. Un héros ayant réussi une approche
     furtive peut éviter le combat, mais ne doit pas effacer les pions ennemis
     pour les autres héros quand son tour devient actif. */
  const live=visibleEnemies(),liveIds=new Set(live.map(e=>String(e.id)));x.enemyCells=x.enemyCells||{};
 Object.keys(x.enemyCells).forEach(id=>{if(!liveIds.has(String(id)))delete x.enemyCells[id]});
 const used=new Set(Object.values(x.enemyCells).map(Number));const markers=[];m.cells.forEach((v,i)=>{if(String(v)==='enemy')markers.push(i)});
 // preserve valid assignments
 live.forEach(e=>{const n=Number(x.enemyCells[e.id]);if(Number.isInteger(n)&&n>=0&&n<m.cells.length){m.cells[n]='enemy';used.add(n)}});
 const heroCells=new Set((x.participants||[]).filter(id=>spatialSameView(x,id)).map(id=>Number(x.positions?.[id])).filter(Number.isInteger));const free=[];m.cells.forEach((v,i)=>{if(blocked(v)||['entry','exit','chest','cache','trap','puzzle'].includes(String(v))||used.has(i)||heroCells.has(i))return;free.push(i)});
 live.forEach(e=>{if(Number.isInteger(Number(x.enemyCells[e.id])))return;let n=markers.find(i=>!used.has(i));if(n===undefined)n=free.shift();if(n===undefined)return;x.enemyCells[e.id]=n;m.cells[n]='enemy';used.add(n)});
 // only clear orphan enemy markers
 m.cells.forEach((v,i)=>{if(String(v)==='enemy'&&![...Object.values(x.enemyCells)].some(n=>Number(n)===i))m.cells[i]='floor'});
 try{const all=loadActiveEnemies?.()||[];all.forEach(e=>{if(x.enemyCells[e.id]!==undefined)e.dungeonCell200=Number(x.enemyCells[e.id])});saveActiveEnemies?.(all)}catch(e){}
}
function ensurePositions(x,reset=false){const m=x?.last?.map;if(!m)return;const sp=spawnIndex(m);x.positions=x.positions||{};x.remaining=x.remaining||{};(x.participants||[]).forEach(id=>{if(reset||!Number.isInteger(Number(x.positions[id])))x.positions[id]=sp;if(reset||!Number.isFinite(Number(x.remaining[id])))x.remaining[id]=moveMax(id)})}

function movementRender(x){
 const grid=document.querySelector('#dc047RoomBoard .dc047Grid');if(!grid)return;
 const els=[...grid.querySelectorAll(':scope>.dc047Cell')];
 // Core 2.07: chaque cellule DOM reçoit explicitement son index de carte.
 // Toutes les interactions visuelles utilisent désormais cette même source.
 els.forEach((c,i)=>{
   c.dataset.dcMapIndex=String(i);
   c.classList.remove('dc200Reach','dc200Hero','dc200Enemy','dc200Key','dc200Feature','dc206ChestCell');
   delete c.dataset.dc200Hero;delete c.dataset.dc200Feature;delete c.dataset.dc206ChestId
 });
 Object.entries(x.enemyCells||{}).forEach(([id,n])=>{if(els[n]){els[n].classList.add('dc200Enemy');if(String(x.last?.keyEnemyId||'')===String(id))els[n].classList.add('dc200Key')}});sceneForRoom(x).forEach(e=>{
 const n=Number(e.cellIndex);
 if(!Number.isInteger(n)||!els[n])return;
 if(['trapdoor','stairs_down','stairs_up'].includes(e.kind)){
   els[n].classList.add('dc200Feature');els[n].dataset.dc200Feature='🕳️'
 }
 if(e.kind==='chest' && !!e.branch200===!!x.branch?.active){
   els[n].classList.add('dc200Feature','dc206ChestCell');
   els[n].dataset.dc200Feature='🎁';
   els[n].dataset.dc206ChestId=String(e.id||'')
 }
});
 const id=activeHero(x),pos=position(id,x),rem=Math.max(0,Number(x.remaining?.[id])||0);if(els[pos]){els[pos].classList.add('dc200Hero');els[pos].dataset.dc200Hero=initials(id)}
 if(tactical()&&pos>=0){distanceMap(pos,x.last.map,rem,x).forEach((d,n)=>{if(d>0&&d<=rem&&els[n]&&!blocked(x.last.map.cells[n]))els[n].classList.add('dc200Reach')})}
 let p=document.getElementById('dc200MovePanel');const board=document.getElementById('dc047RoomBoard');if(!p&&board){p=document.createElement('div');p.id='dc200MovePanel';board.insertAdjacentElement('afterend',p)}if(p){
  const on=tactical();
  p.style.display=on?'':'none';
  p.innerHTML=on?'<strong>👣 '+esc(heroName(id))+' : '+rem+' / '+moveMax(id)+' cases</strong><br><small>Position conservée immédiatement. Fin du tour recharge le mouvement du prochain héros.</small>':'';
}
}
function renderHeroes(x){const host=document.getElementById('dc01Heroes');if(!host)return;host.innerHTML='';const cur=activeHero(x),my=assigned();(x.participants||[]).forEach(id=>{const b=document.createElement('button');b.type='button';b.className='dc01Hero'+(id===cur?' active':'')+((role()!=='gm'&&my&&id!==my)?' locked':'');const c=CHARS?.[id]||findCustomHero?.(id)||{},heroRoom=Number(x.heroRooms?.[id])||0;const img=c.image||c.avatar||'';b.innerHTML=(img?'<img src="'+img+'" alt="">':'<div style="height:92px;display:grid;place-items:center;font-size:38px;background:#222;border-radius:8px">🧙</div>')+'<div class="dc01HeroName">'+esc(heroName(id))+'</div><div class="dc01HeroRole">'+esc(c.role||'Héros')+' · '+(heroRoom>0?'Salle '+heroRoom:'Entrée')+'</div>'+(id===cur?'<span class="dc01HeroTurn">ACTIF</span>':'');b.onclick=()=>openHero(id);host.appendChild(b)})}
function sceneForRoom(x){try{return (loadDungeonSceneElements?.()||[]).filter(e=>!Number(e.room||0)||Number(e.room||0)===Number(x.room||0))}catch(e){return []}}
function renderScene200(x){
  let host=document.getElementById('dc200Scene');
  const base=document.getElementById('dc02Scene');
  if(!host&&base){host=document.createElement('div');host.id='dc200Scene';base.insertAdjacentElement('afterend',host)}
  if(base)base.innerHTML='';
  if(!host)return;
  const positional=tactical();
  const arr=sceneForRoom(x).filter(e=>['chest','merchant','trapdoor','stairs_down','stairs_up','objective'].includes(e.kind));
  host.innerHTML=arr.map(e=>{
    if(e.kind==='chest'){
      const locked=e.challenge&&!e.challengeDone;
      const chestFile=String(e.rarity||'common')==='legendary'?'dungeon_chest_legendary.png':String(e.rarity||'common')==='rare'?'dungeon_chest_rare.png':String(e.rarity||'common')==='epic'?'dungeon_treasure_chest.png':'dungeon_chest_common.png';
      return '<div class="dc200SceneCard"><img class="dc309SceneChest" src="assets/dungeon/creatures/'+chestFile+'" alt="Coffre"><div class="grow"><strong>'+esc(e.name||'Coffre')+'</strong><small>'+
        (locked?'🧩 Verrouillé · ':'')+
        (positional?('Va sur la case 🎁 pour '+(locked?'le déverrouiller':'le fouiller')+'.'):(locked?'Déverrouille le coffre pour accéder au butin.':'Fouille disponible dans cette salle.'))+
        '</small></div>'+
        (!positional?'<button type="button" class="dc01Btn primary" onclick="DungeonCore01.searchChest(\''+String(e.id).replace(/'/g,'')+'\')">'+(locked?'🧩 DÉVERROUILLER':'🔍 FOUILLER')+'</button>':'')+
        '</div>'
    }
    if(e.kind==='merchant')return '<div class="dc200SceneCard"><div>🧙‍♂️</div><div class="grow"><strong>'+esc(e.name||'Marchand')+'</strong></div><button type="button" onclick="dc051OpenMerchant?.()">💰 COMMERcer</button></div>';
    if(['trapdoor','stairs_down','stairs_up'].includes(e.kind))return '<div class="dc200SceneCard"><div>🕳️</div><div class="grow"><strong>'+esc(e.name||'Passage secret')+'</strong><small>Accès à une sous-salle.</small></div><button type="button" onclick="dc200EnterBranch(\''+String(e.id).replace(/'/g,'')+'\')">ENTRER</button></div>';
    if(e.kind==='objective'){const q=Math.max(1,Number(e.qty)||1),p=Math.max(0,Number(e.progress)||0);return '<div class="dc200SceneCard"><div>🎯</div><div class="grow"><strong>'+esc(e.name||'Objectif secondaire')+'</strong><small>'+p+' / '+q+' · ⭐ '+Math.max(0,Number(e.xp)||0)+' XP groupe</small></div></div>'}
    return ''
  }).join('')
} function renderRule(x){
  let r=document.getElementById('dc200Rule');
  const board=document.getElementById('dc047RoomBoard');
  if(!r&&board){r=document.createElement('div');r.id='dc200Rule';board.insertAdjacentElement('beforebegin',r)}
  if(!r)return;
  const live=liveEnemies(),locked=exitLocked(x),k=keyCarrier(x),positional=tactical();
  r.className=locked||(!positional&&live.length)?'locked':'open';
  if(x.branch?.active){
    if(!positional&&live.length)r.innerHTML='⚔️ <strong>Cache non sécurisée :</strong> vaincs les ennemis avant de revenir.';
    else r.innerHTML='🕳️ <strong>Sous-salle</strong> · <button type="button" onclick="dc200LeaveBranch()">↩ Retour à la salle principale</button>';
  }else if(locked&&x.last?.kind==='boss')r.innerHTML='👑 <strong>Sortie verrouillée :</strong> le Boss doit être vaincu.';
  else if(locked)r.innerHTML='🔑 <strong>Sortie verrouillée :</strong> '+(k?esc(enemyName(k))+' porte la clé.':'un ennemi porte la clé.');
  else if(live.length&&!positional)r.innerHTML='⚔️ <strong>Salle non sécurisée :</strong> vaincs les '+live.length+' ennemi'+(live.length>1?'s':'')+' avant de poursuivre.';
  else if(live.length)r.innerHTML='🟢 <strong>Sortie libre.</strong> Les ennemis peuvent être évités, sauf intervention pendant un combat. <button type="button" onclick="dc047StealthPrompt?.()">🥷 TENTER FURTIVITÉ</button>';
  else r.innerHTML='🟢 <strong>Sortie libre.</strong>'
} function syncChestAuthority208(x){
 try{
   const m=x?.last?.map;
   if(!m||!Array.isArray(m.cells))return;
   const branch=!!x.branch?.active;
   const all=loadDungeonSceneElements?.()||[];
   const roomChests=all.filter(e=>
     e.kind==='chest' &&
     Number(e.room||0)===Number(x.room||0) &&
     !!e.branch200===branch
   );
   const mapCells=[];
   m.cells.forEach((v,i)=>{if(String(v)==='chest'||String(v)==='cache')mapCells.push(i)});

   // La carte est l'autorité visuelle. Chaque coffre scène est relié
   // à une vraie case 🎁 de la carte, dans l'ordre, sans position fantôme.
   let changed=false;
   roomChests.forEach((e,k)=>{
     let idx=mapCells[k];
     if(!Number.isInteger(idx)){
       // Coffre scène sans case : créer une vraie case libre.
       idx=nearestFree(x);
       if(Number.isInteger(idx)&&idx>=0){
         m.cells[idx]='chest';
         mapCells.push(idx);
         changed=true;
       }
     }
     if(Number.isInteger(idx)&&idx>=0&&Number(e.cellIndex)!==idx){
       e.cellIndex=idx;
       changed=true;
     }
   });

   // Case 🎁 sans objet scène : reconstruire l'objet interactif sur CETTE case.
   mapCells.forEach((idx,k)=>{
     if(roomChests[k])return;
     const rarity=dungeonPickChestRarity?.(cfg())||'common';
     const created=addDungeonSceneElement?.({
       kind:'chest',
       name:'Coffre '+(dungeonRarityLabel?.(rarity)||rarity),
       rarity,
       trapped:false,
       room:x.room,
       cellIndex:idx,
       fromMap:true,
       branch200:branch
     });
     // Conserver dans la sauvegarde finale le coffre que le propriétaire
     // de scène vient de créer ; "all" précède cet ajout.
     if(created?.id&&!all.some(e=>String(e.id)===String(created.id)))all.push(created);
     changed=true;
   });

   if(changed){
     saveDungeonSceneElements?.(all);
     saveRt(x);
   }
 }catch(e){console.warn('Core 2.08 chest authority',e)}
}
function chestAt(pos,x){
 syncChestAuthority208(x);
 const branch=!!x?.branch?.active;
 return sceneForRoom(x).find(e=>
   e.kind==='chest' &&
   !!e.branch200===branch &&
   Number(e.cellIndex)===Number(pos)
 )||null
}
function mainAction(x){
  const b=document.getElementById('dc01Explore');if(!b)return;
  const positional=tactical(),live=liveEnemies();
  const roomChests=sceneForRoom(x).filter(e=>e.kind==='chest');
  const target=positional?enemyAt(activePos(x),x):null;
  const chest=positional?chestAt(activePos(x),x):roomChests[0]||null;
  b.disabled=!canAct(x);b.classList.remove('dc053CombatAction');
  if(!canAct(x)){b.textContent='⏳ TOUR D’UN AUTRE HÉROS';b.onclick=null;return}

  if(!positional&&live.length){
    if(!combatEnabled200()){b.textContent='⚔️ ENNEMIS PRÉSENTS — GESTION MJ';b.disabled=true;b.onclick=null;return}
    b.classList.add('dc053CombatAction');
    b.textContent='⚔️ ENGAGER LE COMBAT · '+live.length+' ENNEMI'+(live.length>1?'S':'');
    b.onclick=()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'manual',entry:'dc200ManualAction'});
    return
  }
  if(target){
    if(!combatEnabled200()){b.textContent='⚔️ ENNEMI PRÉSENT — GESTION MJ';b.disabled=true;b.onclick=null;return}
    b.classList.add('dc053CombatAction');b.textContent='⚔️ ATTAQUER '+enemyName(target).toUpperCase();b.onclick=()=>startCellCombat(target,x);return
  }
  if(chest){
    b.textContent=chest.challenge&&!chest.challengeDone?'🧩 DÉVERROUILLER LE COFFRE':'🔍 FOUILLER LE COFFRE';
    b.onclick=()=>window.DungeonCore01?.searchChest?.(String(chest.id));return
  }
  if(x.last?.kind==='ambush'&&live.length){b.classList.add('dc053CombatAction');b.textContent='⚔️ EMBUSCADE — COMBATTRE';b.onclick=()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true});return}
  if(x.branch?.active){
    if(exitLocked(x)){b.textContent='🔑 SORTIE DE CACHE VERROUILLÉE';b.onclick=()=>modal('🔑 Sortie verrouillée','Vaincs le gardien de la cache.');return}
    const bx=exitIndex(x.last?.map);
    if(!positional||activePos(x)===bx){b.textContent='↩️ RETOURNER À LA SALLE';b.onclick=leaveBranch;return}
    b.textContent='↩️ REJOINDRE LA SORTIE DE LA CACHE';b.onclick=()=>modal('🕳️ Retour','Place le héros actif sur la case SORTIE.');return
  }
  if(exitLocked(x)){b.textContent='🔑 SORTIE VERROUILLÉE — TROUVE LE PORTEUR';b.onclick=()=>modal('🔑 Sortie verrouillée',keyCarrier(x)?'<strong>'+esc(enemyName(keyCarrier(x)))+'</strong> porte la clé. Va sur sa case pour l’attaquer.':'Un ennemi porte la clé.');return}
  const ex=exitIndex(x.last?.map);
  if(positional&&x.room>0&&activePos(x)!==ex){b.textContent='🚪 REJOINDRE LA SORTIE';b.onclick=()=>modal('🚪 Sortie','Place le héros actif sur la case <strong>SORTIE</strong>.');return}
  b.textContent=x.room<=0?'🚪 ENTRER DANS LE DONJON':'🚪 EXPLORER LA SALLE SUIVANTE';b.onclick=explore
} function syncEntranceState200(x){document.body?.classList?.toggle('dc054AtEntrance',Number(x?.room||0)<=0)}
function render(){const x=spatialEnsure(rt());if(!active200||!x)return;syncEntranceState200(x);syncChestAuthority208(x);const e=shell();if(e){e.style.display='block';e.classList.add('dc200Active')}hideLegacy();document.getElementById('dc01Round').textContent='TOUR '+(x.round||1);document.getElementById('dc01ActiveHero').textContent='🎯 '+heroName(activeHero(x));document.getElementById('dc01Phase').textContent='Exploration · héros '+((x.index||0)+1)+'/'+Math.max(1,x.participants.length);renderHeroes(x);const sRole=document.getElementById('dc01Role');if(sRole)sRole.value=role();const as=document.getElementById('dc01DeviceHero');if(as){as.innerHTML=x.participants.map(id=>'<option value="'+esc(id)+'">'+esc(heroName(id))+'</option>').join('');if(x.participants.includes(assigned()))as.value=assigned()}const wrap=document.getElementById('dc01HeroAssignWrap');if(wrap)wrap.style.display=role()==='gm'?'none':'';const meta=document.getElementById('dc01RoomMeta');if(meta)meta.textContent=(Number(x.room)>0?'Salle '+x.room:'Entrée')+' / '+(Number(cfg().rooms)||0)+' · positions individuelles';const eh=document.getElementById('dc01Enemies'),visible=visibleEnemies();if(eh)eh.innerHTML=visible.length?'<div class="dc01Enemy">⚔️ '+visible.length+' ennemi(s) vivant(s) : '+visible.slice(0,5).map(e=>esc(enemyName(e))).join(', ')+'</div>':'<div class="dc01Meta">Aucun ennemi vivant dans la salle.</div>';const board=document.getElementById('dc047RoomBoard');if(board){board.innerHTML=x.last?.map?dungeonMapHtml(x.last.map):''}assignEnemyCells(x);saveRt(x);renderScene200(x);renderRule(x);movementRender(x);mainAction(x);const end=document.getElementById('dc01EndTurn');if(end)end.disabled=!canAct(x);const gm=document.getElementById('dc01Gm');if(gm)gm.style.display=role()==='gm'?'':'none';const hint=document.getElementById('dc01ActionHint');if(hint)hint.textContent=canAct(x)?'✅ '+heroName(activeHero(x))+' peut agir.':'⏳ Tour de '+heroName(activeHero(x))+'.'}
function show(){let x=rt();const resumable=Array.isArray(x?.participants)&&x.participants.length>0;if(!isDungeonMode?.()&&!resumable)return false;active200=true;hideLegacy();const e=shell();if(e)e.style.display='block';window.scrollTo(0,0);if(!x){const ids=party();if(!ids.length)return false;x=newRt(ids);saveRt(x)}else{spatialEnsure(x);const id=activeHero(x),expected=Number(x.heroRooms?.[id])||0;if(Number(x.room)!==expected)spatialActivate(x,id);saveRt(x)}render();return true}
function start(){
 try{ensureDungeonContent?.();applyCustomHeroesMulti?.()}catch(e){}
 let ids=party().filter(id=>CHARS?.[id]||findCustomHero?.(id));
 if(!ids.length){
   ids=(typeof DUNGEON_HERO_IDS!=='undefined'?DUNGEON_HERO_IDS:[]).filter(id=>CHARS?.[id]);
   if(ids.length)saveGameParticipants?.(ids)
 }
 if(!ids.length){alert('Sélectionne au moins un héros.');return false}

 try{
   markSessionActive?.(true);
   applyPregameGoldToParticipants?.(ids);
   saveActiveEnemies?.([]);
   saveDungeonSceneElements?.([]);
   dungeonBuildDeckState075?.();

   // Core 2.04 : une NOUVELLE aventure Dungeon repart avec une réserve Dungeon fraîche.
   // On ne touche qu'aux IDs Dungeon, jamais aux réserves des autres modes.
   const reserve=(typeof loadZombieReserve==="function"?loadZombieReserve():{})||{};
   const configured=(typeof loadZombieConfig==="function"?loadZombieConfig():{})||{};
   if(typeof DUNGEON_ENEMY_IDS!=="undefined"){
     DUNGEON_ENEMY_IDS.forEach(id=>{
       const def=typeof activeEnemyDefinition==="function"?activeEnemyDefinition(id):null;
       const n=Number(configured[id]);
       reserve[id]=Math.max(0,Number.isFinite(n)?n:(Number(def?.defaultCount)||1));
     });
   }
   if(typeof saveZombieReserve==="function")saveZombieReserve(reserve);
 }catch(e){console.warn("Dungeon 2.04 start reset",e)}

 for(let i=0;i<=150;i++)try{localStorage.removeItem('gensrpg_dc064_door_challenge_'+i)}catch(e){}

 const x=newRt(ids);
 saveRt(x);

 if(role()==='player'&&!ids.includes(assigned()))localStorage.setItem(DEVICE_HERO_KEY,ids[0]);
 active200=true;

 // Core 2.04 : on reste en salle 0 / entrée.
 // Le joueur déclenche lui-même "ENTRER DANS LE DONJON".
 show();
 return true
}
function chooseKind(room){const c=cfg();
 // Core 2.05 : si les Boss automatiques ne sont pas désactivés,
 // la dernière salle est toujours une épreuve de Boss.
 const bossPlan=GensDungeonV1.exploration.planGeneratedBossPolicy(room,c.rooms,c.boss,c.bossEvery,c.bossRooms,c.bossChance);if(bossPlan.status==='boss')return'boss';if(bossPlan.status==='random'&&Math.random()*100<bossPlan.chance)return'boss';
 return GensDungeonV1.exploration.pickWeightedGeneratedRoomKind(c.roomWeights,Math.random())}
function selectedChallenges(){try{
 const c=cfg();
 const raw=Array.isArray(c.challenges)?c.challenges:null;
 const lib=(typeof loadChallengeLibrary069==='function'?loadChallengeLibrary069():GensStorageV1.readJson(localStorage,'gensrpg_challenge_library_v1',[]))||[];
 // Valeur par défaut/null = bibliothèque intégrée active.
 if(raw===null)return lib.map(clone);
 if(!raw.length)return [];
 // L'éditeur 0.69 sauvegarde les objets complets.
 const objects=raw.filter(x=>x&&typeof x==='object'&&x.id);
 if(objects.length)return objects.map(clone);
 // Compatibilité avec les anciennes aventures qui sauvegardaient seulement les IDs.
 const set=new Set(raw.map(x=>String(x?.id??x)));
 return lib.filter(ch=>set.has(String(ch.id))).map(clone)
 }catch(e){return []}}
function maybeDoorChallenge(x){const c=cfg();if(x.last.kind==='boss'||x.last.exitLocked)return;const pool=selectedChallenges();if(!pool.length||Math.random()*100>=Math.max(0,Number(c.challengeDoorChance)||0))return;const ch=clone(pool[Math.floor(Math.random()*pool.length)]);x.last.map.objective={type:'challenge',status:'locked',title:'Défi de la porte',challenge:ch,text:'Un mécanisme bloque la sortie.'};x.last.objective=x.last.map.objective}
function createRoom(room,kind){let result={title:'Salle',text:'',enemyQty:0,enemyName:''};if(kind==='enemy'||kind==='ambush')result=dungeonEncounter(room);else if(kind==='boss')result=dungeonBossRoom(room);else{const t=kind==='trap'?(dungeonPickTrapType?.(cfg())||{name:'Piège',id:'trap'}):null;result=GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult(kind,t)}try{const all=loadActiveEnemies?.()||[];all.forEach(e=>{if(GensDungeonV1.exploration.shouldDefaultGeneratedRoomEnemyBranch(e,room))e.dc200Branch=false});saveActiveEnemies?.(all)}catch(e){}const mapPlan=GensDungeonV1.exploration.planGeneratedRoomMapBoundary(cfg().map,kind,result);const mapObj=mapPlan.status==="disabled"?null:generateDungeonMap(mapPlan.kind,mapPlan.enemyQty);return {result,map:mapObj}}
function placeSceneForRoom(x,kind,result){const room=x.room,m=x.last.map;if(!m)return;if(kind==='chest'){const rarity=dungeonPickChestRarity?.(cfg())||'common',trapped=Math.random()*100<Math.max(0,Number(cfg().chestTrapChance)||0),idx=m.cells.indexOf('chest');const el=addDungeonSceneElement?.({kind:'chest',name:'Coffre '+(dungeonRarityLabel?.(rarity)||rarity),rarity,trapped,room,cellIndex:idx,fromMap:true});if(el){el.cellIndex=idx;const a=loadDungeonSceneElements?.()||[];const z=a.find(v=>String(v.id)===String(el.id));if(z){z.cellIndex=idx;const pool=selectedChallenges();if(pool.length&&Math.random()*100<Math.max(0,Number(cfg().challengeChestChance)||0)){z.challenge=clone(pool[Math.floor(Math.random()*pool.length)]);z.challengeDone=false}}saveDungeonSceneElements?.(a)}}else if(kind==='merchant')addDungeonSceneElement?.({kind:'merchant',name:'Marchand itinérant',room});try{dc077MaybeCreateObjective?.(room,kind)}catch(e){}}
function initLock(x){const live=liveEnemies();if(x.last.kind==='boss'&&live.length){x.last.exitLocked=true;x.last.keyEnemyId=live[0]?.id||'';return}if(['enemy','ambush'].includes(x.last.kind)&&live.length&&Math.random()*100<20){x.last.exitLocked=true;const c=live[Math.floor(Math.random()*live.length)];x.last.keyEnemyId=String(c?.id||'')}else{x.last.exitLocked=false;x.last.keyEnemyId=''}}
function maybeSpecialBranch(x){const c=cfg(),m=x?.last?.map;if(!m||!Array.isArray(m.cells)||!GensDungeonV1.exploration.shouldCreateGeneratedBranch(c.specialBranchChance,Math.random()))return null;const i=nearestFree(x);if(i<0)return null;const type=GensDungeonV1.exploration.pickWeightedGeneratedBranchType(c.specialBranchWeights,Math.random());const el=addDungeonSceneElement?.(GensDungeonV1.exploration.buildGeneratedBranchSceneElement(x.room,i,type));m.cells[i]='trapdoor';return el}
function applyRest200(x){try{const ex=(getActiveGameProfile?.()?.rpgUniverse?.exploration)||{},heal=ex.restEnabled===false?0:Math.max(0,Number(ex.restHeal)||0),mana=ex.restEnabled===false?0:Math.max(0,Number(ex.restMana)||0);spatialHeroesHere(x).forEach(id=>{if(heal)dungeonSetHeroWounds?.(id,-heal);if(mana){const hs=loadState?.(id);if(hs){let max=0;try{const oldC=window.current,oldS=window.state;window.current=id;window.state=hs;max=Number(dungeonMaxMana?.())||0;window.current=oldC;window.state=oldS}catch(e){}hs.mana=Math.min(max||999,Math.max(0,Number(hs.mana)||0)+mana);localStorage.setItem(key(id),JSON.stringify(hs))}}})}catch(e){console.warn('DC200 rest',e)}}
function combatEnabled200(){try{return typeof dc045HeroCombatEnabled==='function'?!!dc045HeroCombatEnabled():true}catch(e){return true}}
function roomIntro(x,result){const n=cfg().narration!==false?dungeonNarrativeText?.(x.last.kind,result.enemyName||'une créature',result.enemyQty||1,x.room):'';let body=(n?'<div class="dc01Notice">'+esc(n)+'</div>':'')+(result.text||'');if(x.last.kind==='ambush')body='<strong>⚠️ EMBUSCADE.</strong><br>'+body;modal('🏰 SALLE '+x.room+' / '+(Number(cfg().rooms)||0)+' — '+(result.title||''),body,()=>maybeEvent('room'))}
function explore(){
  let x=rt();
  if(!x||!canAct(x))return modal('⏳ Action refusée','Ce n’est pas le tour du héros contrôlé par ce téléphone.');
  spatialEnsure(x);
  const heroId=activeHero(x);
  if(x.branch?.active){
    const live=liveEnemies();
    if(!tactical()&&live.length)return modal('⚔️ Cache non sécurisée','Vaincs les ennemis présents avant de revenir dans la salle principale.');
    const ex=exitIndex(x.last?.map);
    if(!tactical()||activePos(x)===ex)return leaveBranch();
    return modal('🕳️ Retour','Rejoins la case SORTIE de la cache pour revenir dans la salle principale.');
  }
  if(x.room>0){
    const obj=x.last?.map?.objective;
    if(obj?.type==='challenge'&&obj.status!=='done')return dc051OpenChallenge?.('door','');
    const livingNow=liveEnemies();
    if(!tactical()&&livingNow.length)return modal('⚔️ Salle non sécurisée','Tu dois vaincre les ennemis présents avant d’explorer la salle suivante.');
    if(exitLocked(x))return modal('🔑 Sortie verrouillée','Trouve et bats le porteur de la clé.');
    if(tactical()&&activePos(x)!==exitIndex(x.last?.map))return modal('🚪 Sortie','Place le héros actif sur la case SORTIE.');
  }
  const advancePlan=GensDungeonV1.exploration.planGeneratedAdvance(x.room,Number(cfg().rooms||10),x.roomStates);
  if(advancePlan.status==='complete')return modal('🏆 Donjon terminé','Le groupe a terminé le donjon.');
  const targetRoom=advancePlan.targetRoom;
  const movementLeft=Number.isFinite(Number(x.remaining?.[heroId]))
    ?Math.max(0,Number(x.remaining[heroId])):moveMax(heroId);
  spatialPersist(x);

  /* Une salle n'est créée qu'une fois. Les héros suivants la rejoignent
     à leur propre tour, sans déplacer ceux qui sont restés derrière. */
  const existing=x.roomStates?.[String(targetRoom)];
  if(advancePlan.status==='existing'&&existing?.last){
    spatialSetRoom(x,heroId,targetRoom);
    spatialActivate(x,heroId);
    const entry=spawnIndex(x.last?.map);
    if(Number.isInteger(entry)&&entry>=0)x.positions[heroId]=entry;
    x.remaining[heroId]=movementLeft;
    x.dc313LastTransition=GensDungeonV1.exploration.buildGeneratedRoomTransition(heroId,targetRoom-1,targetRoom,false,Date.now());
    saveRt(x);render();
    return modal('🚪 '+heroName(heroId)+' avance','Le héros rejoint la salle '+targetRoom+'. Les autres héros conservent leur salle et leur position.');
  }

  x.room=targetRoom;x.enemyCells={};x.branch=null;x.last=null;
  spatialSetRoom(x,heroId,targetRoom);
  // Le générateur d'ennemis lit la salle publiée via loadDungeonState().
  // Publier la nouvelle salle avant dungeonEncounter/createRoom, pas après.
  saveRt(x);
  const kind=chooseKind(x.room),made=createRoom(x.room,kind);
  x.last={kind,room:x.room,at:Date.now(),title:made.result.title,map:made.map,narrative:'',exitLocked:false,keyEnemyId:''};
  const entry=spawnIndex(x.last?.map);
  if(Number.isInteger(entry)&&entry>=0)x.positions[heroId]=entry;
  x.remaining[heroId]=movementLeft;
  x.dc313LastTransition=GensDungeonV1.exploration.buildGeneratedRoomTransition(heroId,targetRoom-1,targetRoom,true,Date.now());
  saveRt(x);placeSceneForRoom(x,kind,made.result);
  if(kind==='rest')applyRest200(x);
  maybeSpecialBranch(x);assignEnemyCells(x);initLock(x);maybeDoorChallenge(x);saveRt(x);render();roomIntro(x,made.result)
} function moveTo(idx){const x=rt();if(!x||!tactical()||!canAct(x))return false;const id=activeHero(x),from=position(id,x),rem=Math.max(0,Number(x.remaining?.[id])||0),d=distanceMap(from,x.last.map,rem,x).get(Number(idx));if(!Number.isFinite(d)||d<=0||d>rem)return false;x.positions[id]=Number(idx);x.remaining[id]=rem-d;saveRt(x);render();handleCell(x,Number(idx));return true}
function handleCell(x,idx){const type=String(x.last?.map?.cells?.[idx]||'');if(type==='trap'){try{const t=dungeonPickTrapType?.(cfg());if(t)dungeonResolveTrapAgainstHero?.(t.id,activeHero(x),true)}catch(e){}x.last.map.cells[idx]='floor';saveRt(x);render()} }
function nearbyInterveners(target,x){const base=Number(x.enemyCells?.[target.id]),m=x.last.map,size=Number(m.size)||5,out=[];liveEnemies().forEach(e=>{if(String(e.id)===String(target.id))return;const n=Number(x.enemyCells?.[e.id]);if(!Number.isInteger(n)||!Number.isInteger(base))return;const d=Math.abs(Math.floor(n/size)-Math.floor(base/size))+Math.abs(n%size-base%size);
 // Core 2.05 : renforts visibles mais non systématiques.
 const chance=d===1?65:d===2?30:0;
 if(chance&&Math.random()*100<chance)out.push(e)});
 return out}
function startCellCombat(target,x=rt()){if(!x||!target)return false;let chosen=liveEnemies().filter(e=>String(e.id)===String(target.id));if(!chosen.length)return false;const extras=nearbyInterveners(chosen[0],x);chosen=[...chosen,...extras.filter(e=>!chosen.some(c=>String(c.id)===String(e.id)))];const begin=()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:chosen.map(e=>String(e.id)),reason:'cell',entry:'dc200CellAction',limitEnemyIdsToRequest:true});if(extras.length){const names=extras.map(e=>esc(enemyName(e))).join(', ');modal('⚔️ RENFORTS ENNEMIS','<strong>'+extras.length+' ennemi'+(extras.length>1?'s rejoignent':' rejoint')+' le combat.</strong><br><br>'+names,begin);return true}return begin()}
function launchCombat200(x,chosen){try{dungeonCombatRestoreHeroContext();const here=spatialHeroesHere(x).filter(heroAlive200),heroes=combatHeroes200(x),excluded=here.filter(id=>!heroes.includes(id));dungeonCombatSelection={heroes:heroes.length?heroes:[activeHero(x)].filter(heroAlive200),enemies:chosen.map(e=>e.id)};x.dc315LastCombatParticipation={leader:activeHero(x),range:tactical()?participationRange200():null,heroes:[...dungeonCombatSelection.heroes],excluded,at:Date.now()};saveRt(x);resetDungeonCombatRewards?.();dungeonCombatActive=true;const modalEl=document.getElementById('dungeonCombatModal'),host=document.getElementById('dungeonCombatSetupView');if(modalEl){modalEl.classList.add('dc200CombatOpen');modalEl.style.display='block'}document.body.style.overflow='hidden';if(typeof window.__dc302RenderCombat==='function')window.__dc302RenderCombat();else if(typeof window.__dc214RenderCombat==='function')window.__dc214RenderCombat();else if(typeof window.__dc200StableRenderCombatRound==='function')window.__dc200StableRenderCombatRound();else renderDungeonCombatRound();if(host&&!(host.innerHTML||'').trim())throw new Error('Le rendu du combat est vide.');return true}catch(e){console.error('DC200 start combat',e);cleanupCombat();modal('⚠️ Combat impossible','Le moteur a intercepté une erreur avant de bloquer l’interface : <strong>'+esc(e.message||e)+'</strong>.');return false}}
function startCombat(ids,reason){const x=rt();if(!x)return false;let chosen=liveEnemies().filter(e=>ids.map(String).includes(String(e.id)));if(!chosen.length)return false;const begin=()=>launchCombat200(x,chosen);if(reason==='detection'||reason==='stealth_fail'){const names=chosen.map(e=>esc(enemyName(e))).join(', ');modal(reason==='stealth_fail'?'🥷 REPÉRAGE ÉCHOUÉ':'👁️ HÉROS REPÉRÉ','<strong>'+esc(heroName(activeHero(x)))+' est détecté.</strong><br><br>'+names+(chosen.length>1?' attaquent et engagent le combat.':' attaque et engage le combat.'),begin);return true}return begin()}
function cleanupCombat(){try{dungeonCombatRestoreHeroContext();dungeonCombatActive=false}catch(e){}['dungeonCombatModal','dungeonCombatVictoryModal','dungeonCombatStatsModal','specialDiceModal','attackDiceModal','dc036AiPopup','dc032AiPopup'].forEach(id=>{const e=document.getElementById(id);if(e){e.classList.remove('open','dc200CombatOpen');e.style.display='none';e.style.removeProperty('pointer-events')}});document.body.style.removeProperty('overflow');document.body.style.removeProperty('pointer-events');document.documentElement.style.removeProperty('overflow');document.documentElement.style.removeProperty('pointer-events')}
function partyIds200(x=rt()){const ids=(x?.participants||party()).map(String).filter(Boolean);return [...new Set(ids)]}
function engagedDown200(){const ids=(dungeonCombatSelection?.heroes||[]).map(String).filter(Boolean);return ids.length>0&&ids.every(id=>!heroAlive200(id))}
function wholePartyDown200(x=rt()){const ids=partyIds200(x);return ids.length>0&&ids.every(id=>!heroAlive200(id))}
function resolveLocalCombatDefeat200(){
 const x=rt();if(!x||!dungeonCombatActive)return false;
 const partyIds=partyIds200(x),engaged=(dungeonCombatSelection?.heroes||[]).map(String),living=partyIds.filter(heroAlive200);
 const scope=typeof spatial()?.combatDefeatScope==="function"?spatial().combatDefeatScope(partyIds,engaged,living):(engagedDown200()?(wholePartyDown200(x)?"global":"local"):"none");
 if(scope!=="local")return false;
 const fallen=engaged.map(heroName);
 cleanupCombat();spatialPersist(x);
 const next=living[0];if(next){const i=(x.participants||[]).map(String).indexOf(String(next));if(i>=0)x.index=i;spatialActivate(x,next);try{window.current=next;window.state=loadState?.(next)}catch(e){}}
 dungeonCombatSelection={heroes:[],enemies:[]};resetDungeonCombatRewards?.();saveRt(x);render();
 modal('☠️ COMBATTANTS HORS COMBAT','<strong>'+esc(fallen.join(', '))+'</strong> '+(fallen.length>1?'sont KO':'est KO')+'.<br><br>Le donjon continue avec <strong>'+esc(heroName(next))+'</strong>. Les ennemis restent dans la salle.');
 return true
}
window.dc315ResolveCombatWipe=resolveLocalCombatDefeat200;
function finishVictory(){const x=rt();cleanupCombat();if(x){assignEnemyCells(x);exitLocked(x);saveRt(x)}render();modal('🏆 Victoire',typeof window.__dc200StableCombatVictoryHtml==='function'?window.__dc200StableCombatVictoryHtml():(typeof dungeonCombatVictoryHtml==='function'?dungeonCombatVictoryHtml():'Combat terminé.'));return true}
window.openDungeonCombatVictoryPopup=function(){if(!dungeonCombatActive)return;try{dungeonCombatRewards.shown=true}catch(e){}const html=typeof window.__dc200StableCombatVictoryHtml==='function'?window.__dc200StableCombatVictoryHtml():(typeof dungeonCombatVictoryHtml==='function'?dungeonCombatVictoryHtml():'Combat terminé.');const m=ensureModal();document.getElementById('dc200ModalTitle').textContent='🏆 VICTOIRE';document.getElementById('dc200ModalBody').innerHTML=html;modalDone200=()=>{cleanupCombat();const x=rt();if(x){assignEnemyCells(x);exitLocked(x);saveRt(x)}render()};m.classList.add('open')};
window.finishDungeonCombatVictory=function(){closeModal()};
window.dc200StartCombat=startCombat;
function endTurn(){const x=rt();if(!x||!canAct(x))return modal('⏳ Tour verrouillé','Seul le héros actif ou le MJ peut terminer ce tour.');spatialEnsure(x);const ended=activeHero(x);try{const hs=loadState?.(ended);if(Array.isArray(hs?.dc067ChallengeDebuffs)){hs.dc067ChallengeDebuffs=hs.dc067ChallengeDebuffs.map(e=>({...e,remaining:Math.max(0,Number(e.remaining)||0)-1})).filter(e=>e.remaining>0);localStorage.setItem(key(ended),JSON.stringify(hs))}}catch(e){}spatialPersist(x);x.index=(Number(x.index)||0)+1;let full=false;if(x.index>=x.participants.length){x.index=0;x.round=(Number(x.round)||1)+1;full=true;try{tickAllTurnCooldowns?.();tickDungeonTalentRuntimeEffects?.();applyDungeonHeroStatusRoundEffects?.();applyDungeonPassiveRoundEffects?.()}catch(e){}}const next=activeHero(x);spatialActivate(x,next);x.remaining[next]=moveMax(next);saveRt(x);try{window.current=next;window.state=loadState(next)}catch(e){}render();if(full)maybeEvent('round');try{showToast?.('🔄 Tour de '+heroName(next)+' · '+(Number(x.room)>0?'salle '+x.room:'entrée'))}catch(e){}}
function maybeEvent(trigger){
  try{
    const settings=currentRpgEventSettings?.()||{};
    if(settings.roundEvents===false)return;
    const mode=String(settings.eventTrigger||'round');
    const x0=rt();
    let effective=trigger;

    /* In narrative mode there are no movement rounds to pace exploration.
       A "round" event gets one roll when a new room is entered. */
    if(!tactical()&&trigger==='room'&&mode==='round'){
      if(Number(x0?.dc306NarrativeEventRoom)===Number(x0?.room))return;
      if(x0){x0.dc306NarrativeEventRoom=Number(x0.room);saveRt(x0)}
      effective='round';
    }
    if(trigger==='round'&&!tactical()&&mode==='round'&&Number(x0?.dc306NarrativeEventRoom)===Number(x0?.room))return;
    if(effective==='room'&&!['room','both'].includes(mode))return;
    if(effective==='round'&&!['round','both'].includes(mode))return;
    if(Math.random()*100>=Math.max(0,Math.min(100,Number(settings.eventChance)||0)))return;

    const x=rt(),evt=dungeonWeightedEventPick?.(dungeonEligibleEvents?.(Number(x.room)||1)||[]);
    if(!evt)return;
    const before=new Set((loadActiveEnemies?.()||[]).map(e=>String(e.id)));
    applyDungeonTurnEvent?.(evt,x.round);
    try{
      const all=loadActiveEnemies?.()||[];
      all.forEach(e=>{if(!before.has(String(e.id))&&Number(e.dungeonRoom||0)===Number(x.room))e.dc200Branch=!!x.branch?.active});
      saveActiveEnemies?.(all)
    }catch(e){}
    setTimeout(()=>{const y=rt();if(y){assignEnemyCells(y);saveRt(y);render()}},0)
  }catch(e){console.warn('DC200 event',e)}
} function chestCell(el,x){
 syncChestAuthority208(x);
 const n=Number(el?.cellIndex);
 if(Number.isInteger(n)&&n>=0)return n;
 const m=x?.last?.map;
 for(const v of [m?.cells?.indexOf('chest'),m?.cells?.indexOf('cache'),m?.chestIdx,m?.cacheIdx]){
   const z=Number(v);if(Number.isInteger(z)&&z>=0)return z
 }
 return -1
}
function consumeChest(id){const x=rt(),all=loadDungeonSceneElements?.()||[],el=all.find(e=>String(e.id)===String(id)&&e.kind==='chest');console.info('DC200_CHEST_CONSUME',id,!!el);if(!el)return;const cp=chestCell(el,x),hero=activeHero(x);let drop=null;try{if(el.trapped){const t=dungeonPickTrapType?.(cfg());if(t)dungeonResolveTrapAgainstHero?.(t.id,hero,true)}drop=dungeonGrantLootByRarity?.(el.rarity||'common',hero)}catch(e){console.warn(e)}try{removeDungeonSceneElement?.(id)}catch(e){}if(x.last?.map&&cp>=0)x.last.map.cells[cp]='floor';saveRt(x);render();modal('🎁 Coffre fouillé',drop?'<strong>'+esc(heroName(hero))+'</strong> obtient <strong>'+esc(drop.item?.name||'Objet')+'</strong>.':'Le coffre est vide.')}
function searchChest(id){const x=rt(),el=(loadDungeonSceneElements?.()||[]).find(e=>String(e.id)===String(id)&&e.kind==='chest');if(!el)return modal('🎁 Coffre','Ce coffre n’est plus disponible.');if(el.challenge&&!el.challengeDone)return dc051OpenChallenge?.('chest',id);const cp=chestCell(el,x);if(tactical()&&activePos(x)!==cp)return modal('🎁 Coffre','📍 Place le héros actif exactement sur la case du coffre.');modal('🎁 Ouvrir le coffre','Le coffre est devant toi.'+(el.trapped?'<br>⚠️ Il peut être piégé.':''),()=>consumeChest(id))}
function nearestFree(x){const m=x?.last?.map;if(!m)return-1;const bad=new Set(['wall','void','entry','exit','enemy','chest','cache','trap','puzzle']);const hp=activePos(x),size=Number(m.size)||5,a=[];m.cells.forEach((v,i)=>{if(bad.has(String(v))||i===hp)return;a.push({i,d:Math.abs(Math.floor(i/size)-Math.floor(hp/size))+Math.abs(i%size-hp%size)})});a.sort((a,b)=>a.d-b.d);return a[0]?.i??-1}
function gmChest(rarity){if(role()!=='gm')return;const x=rt(),i=nearestFree(x);if(i<0)return modal('🎁 Coffre MJ','Aucune case libre.');const trapped=Math.random()*100<Math.max(0,Number(cfg().chestTrapChance)||0),el=addDungeonSceneElement?.({kind:'chest',name:'Coffre '+(dungeonRarityLabel?.(rarity)||rarity),rarity,trapped,room:x.room,cellIndex:i,gmAdded:true});x.last.map.cells[i]='chest';saveRt(x);render();modal('🎁 Coffre ajouté','Le coffre a été placé sur une vraie case de la salle.')}
function openGm(){if(role()!=='gm')return;modal('🎛️ OUTILS MJ','<div class="dc01Actions"><button onclick="DungeonCore01.gmChest(\'common\')">🎁 Coffre commun</button><button onclick="DungeonCore01.gmChest(\'rare\')">💙 Coffre rare</button><button onclick="DungeonCore01.gmChest(\'epic\')">💜 Coffre épique</button><button onclick="DungeonCore01.gmChest(\'legendary\')">💛 Coffre légendaire</button><button onclick="DungeonCore01.addFeature(\'trapdoor\')">🕳️ Trappe</button><button onclick="DungeonCore01.legacyGm()">⚙️ Réglages MJ complets</button></div>')}
function addFeature(kind){if(role()!=='gm')return;const x=rt(),i=nearestFree(x),el=addDungeonSceneElement?.({kind,name:kind==='trapdoor'?'Trappe':kind==='stairs_up'?'Escalier montant':'Escalier descendant',room:x.room,cellIndex:i,environment:'dungeon',branchType:kind==='trapdoor'?'treasure':'secret'});if(x?.last?.map&&i>=0)x.last.map.cells[i]='trapdoor';saveRt(x);render();modal('🗺️ Élément ajouté',(el?.name||'Passage')+' a été ajouté à la salle.')}
function openHero(id){const x=rt();if(!x?.participants?.includes(String(id)))return;if(role()!=='gm'&&String(assigned())!==String(id))return modal('🔒 Héros non contrôlé','Ce téléphone contrôle '+esc(heroName(assigned()))+'.');const e=shell();if(e)e.style.display='none';try{openChar?.(String(id))}catch(err){show();modal('⚠️ Erreur fiche',esc(err.message||err))}}
function enterBranch(id){const x=rt(),el=(loadDungeonSceneElements?.()||[]).find(e=>String(e.id)===String(id));if(!x||!el)return false;const hero=activeHero(x),cp=Number(el.cellIndex);if(tactical()&&activePos(x)!==cp)return modal('🕳️ Passage','📍 Place le héros actif sur la case du passage.');if(x.branch?.active)return false;const movementLeft=Number.isFinite(Number(x.remaining?.[hero]))?Math.max(0,Number(x.remaining[hero])):moveMax(hero);spatialPersist(x);x.branch={active:true,heroId:hero,parentRoom:Number(x.room)||0,sourceId:String(id),sourceCell:Number(el.cellIndex)};x.enemyCells={};const size=5,cs=Array(size*size).fill('floor');cs[22]='entry';cs[2]='exit';cs[12]=el.branchType==='boss'?'enemy':'chest';x.last={kind:el.branchType==='boss'?'boss':'chest',room:x.room,title:'Sous-salle secrète',map:{version:2,size,cells:cs,entryIdx:22,exitIdx:2},exitLocked:false,keyEnemyId:''};x.positions[hero]=22;x.remaining[hero]=movementLeft;saveRt(x);if(el.branchType==='boss'){const before=new Set((loadActiveEnemies?.()||[]).map(e=>String(e.id)));try{dungeonBossRoom?.(x.room)}catch(e){}try{const all=loadActiveEnemies?.()||[];all.forEach(e=>{if(!before.has(String(e.id))&&Number(e.dungeonRoom||0)===Number(x.room))e.dc200Branch=true});saveActiveEnemies?.(all)}catch(e){}assignEnemyCells(x);initLock(x)}else{const rarity=dungeonPickChestRarity?.(cfg())||'rare';addDungeonSceneElement?.({kind:'chest',name:'Coffre secret',rarity,trapped:false,room:x.room,cellIndex:12,branch200:true})}saveRt(x);render();modal('🕳️ Sous-salle',heroName(hero)+' entre seul dans la zone séparée. Les autres héros restent à leur position.')}
function leaveBranch(){const x=rt();if(!x?.branch?.active)return false;if(x.last?.kind==='boss'&&liveEnemies().length){modal('👑 Boss présent','Le Boss doit être vaincu avant de remonter.');return false}const hero=activeHero(x),source=x.branch.sourceId,sourceCell=Number(x.branch.sourceCell),parentRoom=Number(x.branch.parentRoom??x.room)||0;spatialClearBranch(x,hero);x.branch=null;spatialSetRoom(x,hero,parentRoom);spatialActivate(x,hero);if(Number.isInteger(sourceCell)&&sourceCell>=0)x.positions[hero]=sourceCell;try{removeDungeonSceneElement?.(source);const a=(loadDungeonSceneElements?.()||[]).filter(e=>!e.branch200);saveDungeonSceneElements?.(a)}catch(e){}saveRt(x);render();return true}
window.dc200EnterBranch=enterBranch;window.dc200LeaveBranch=leaveBranch;
function changeRole(v){try{setDeviceGameRole?.(v)}catch(e){}render()}
function assignHero(id){const x=rt();if(x?.participants?.includes(String(id)))localStorage.setItem(DEVICE_HERO_KEY,String(id));render()}
function legacyGm(){closeModal();try{openDungeonMasterPanel?.()}catch(e){modal('⚠️ Outils MJ',esc(e.message||e))}}
function quit(){if(!confirm('Quitter la partie Dungeon ?'))return;active200=false;try{markSessionActive?.(false)}catch(e){}const e=shell();if(e)e.style.display='none';try{showGensRootHome?.()}catch(e){}}

// Stealth uses the existing test UI, but the result is owned by Runtime 2.00.
window.dc047ResolveStealth=function(success){const x=rt();if(!x)return;if(success){const hero=activeHero(x);try{const all=loadActiveEnemies?.()||[];const branch=!!x.branch?.active;all.forEach(e=>{if(Number(e.dungeonRoom||0)===Number(x.room)&&!e.defeated&&Number(e.hp)>0&&(branch?e.dc200Branch===true:e.dc200Branch!==true)){e.dc200BypassedBy=e.dc200BypassedBy&&typeof e.dc200BypassedBy==='object'?e.dc200BypassedBy:{};e.dc200BypassedBy[hero]=true}});saveActiveEnemies?.(all)}catch(e){}saveRt(x);const m=ensureModal();m.classList.remove('open');modal('🥷 Passage réussi',heroName(hero)+' passe sans engager les créatures. Les autres héros devront réussir leur propre passage.');render();return}const enemies=liveEnemies(),ids=enemies.map(e=>String(e.id));const m=ensureModal();m.classList.remove('open');if(ids.length){const names=enemies.map(e=>esc(enemyName(e))).join(', ');modal('🥷 REPÉRAGE ÉCHOUÉ','<strong>'+esc(heroName(activeHero(x)))+' est détecté.</strong><br><br>'+names+(enemies.length>1?' attaquent et engagent le combat.':' attaque et engage le combat.'),()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:ids,reason:'stealth_fail',entry:'dc200StealthFailure'}))}else render()};

// Capture board clicks before every legacy tactical listener.
document.addEventListener('click',function(ev){if(!active200||!tactical())return;const cell=ev.target?.closest?.('#dc047RoomBoard .dc047Grid>.dc047Cell');if(!cell)return;if(ev.target?.closest?.('button,a,input,select,textarea,label'))return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();const all=[...cell.parentElement.querySelectorAll(':scope>.dc047Cell')],i=all.indexOf(cell);if(i>=0)moveTo(i)},true);

// Final combat victory is owned by this runtime. Keep the existing attack/dice mechanics.
const oldCloseCombat=window.closeDungeonCombat;window.closeDungeonCombat=function(){cleanupCombat();render()};

// Replace public Dungeon API instead of wrapping it.
const old=window.DungeonCore01||{};
window.DungeonCore01={eligible:()=>{try{return isDungeonMode?.()}catch(e){return false}},start,show,render,openHero,changeRole,assignHero,endTurn,explore,modal,closeModal,openGm,gmChest,searchChest,addFeature,legacyGm,quit};
Object.defineProperty(window.DungeonCore01,'active',{get:()=>active200});

// Final game start interception: other modes go through their existing chain untouched.
const startOutside200=window.startConfiguredGame;
const gensDungeonStartConfiguredGame200V1=async function(){if(isDungeonMode?.()&&!(typeof isCaptureContext138==="function"&&isCaptureContext138()))return start();return startOutside200?.apply(this,arguments)};
const gensDungeonStartModuleSessionV1=async()=>{
  if(gensShellActiveModuleV1()!=="dungeon")return false;
  await gensDungeonStartConfiguredGame200V1();
  return true;
};
window.GensShellModuleLaunchV1.register("dungeon",gensDungeonStartModuleSessionV1);
window.GensShellScreenReturnV1?.register?.("dungeon",function(){
  if(!active200||!isDungeonMode?.())return false;
  const sh=document.getElementById('sheet');if(sh)sh.style.display='none';
  return show()===true;
});

window.dungeonDebug200=function(){const x=rt(),h=activeHero(x);return {runtime:x,activeHero:h,position:position(h,x),remaining:x?.remaining?.[h],living:liveEnemies().map(e=>({id:e.id,name:enemyName(e),cell:x?.enemyCells?.[e.id],hp:e.hp})),target:enemyAt(activePos(x),x)?.id||null,locked:exitLocked(x),tactical:tactical(),combatActive:typeof dungeonCombatActive!=='undefined'?!!dungeonCombatActive:null,combatHostLen:(document.getElementById('dungeonCombatSetupView')?.innerHTML||'').length}};
try{const b=document.querySelector('.dc01Badge');if(b)b.textContent='MOTEUR DUNGEON · CORE 2.00';const f=document.querySelector('.dc01Footer');if(f)f.textContent='Dungeon Core 3.06 · runtime reconstruit et isolé.'}catch(e){}
})();
