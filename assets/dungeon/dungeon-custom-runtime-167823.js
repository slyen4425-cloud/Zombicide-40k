/* GenSrpG V16.78.23 — custom dungeon graph runtime bridge.
   Connects Phase-3 zone graphs to the stable Dungeon Runtime 2.00.
   Reuses DungeonCore01 explore/chest/branch surfaces and DungeonSpatial313 state.
   Does not replace movement, combat, timeline or enemy AI. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="16.78.23";
const RT_KEY="gensrpg_dungeon_runtime_v2";
const ACTIVE_KEY="gensrpg_custom_dungeon_active_v1";
const DEVICE_HERO_KEY="gensrpg_dungeon_core01_device_hero_v1";
const BASE_ROOM_NO=1000;
let native=null;
let installed=false;
let syncBusy=false;

function arr(v){return Array.isArray(v)?v:[]}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function writeRt(x){
  if(!x)return null;
  try{ROOT.DungeonSpatial313?.ensure?.(x)}catch(e){}
  try{localStorage.setItem(RT_KEY,JSON.stringify(x))}catch(e){}
  try{ROOT.saveDungeonState?.({room:Number(x.room)||0,last:x.last||null})}catch(e){}
  return x;
}
function spatial(){return ROOT.DungeonSpatial313||null}
function persist(x){try{return spatial()?.persist?.(x)||x}catch(e){return x}}
function setRoom(x,id,room){try{return spatial()?.setRoom?.(x,id,room)||x}catch(e){x.heroRooms=x.heroRooms||{};x.heroRooms[id]=room;return x}}
function activate(x,id){try{return spatial()?.activate?.(x,id)||x}catch(e){return x}}
function builder(){return ROOT.DungeonWorldBuilder167821||null}
function roomApi(){return ROOT.DungeonRoomCreator100||null}
function interApi(){return ROOT.DungeonRoomCreatorV2||null}
function activeMeta(x=readRt()){return x?.dc323&&x.dc323.graphId?x.dc323:null}
function activeGraph(x=readRt()){const m=activeMeta(x);return m?builder()?.findDungeon?.(m.graphId)||null:null}
function activeHero(x=readRt()){return String(x?.participants?.[Number(x?.index)||0]||"")}
function heroName(id){try{return ROOT.CHARS?.[id]?.name||ROOT.findCustomHero?.(id)?.name||String(id||"Héros")}catch(e){return String(id||"Héros")}}
function role(){try{return ROOT.isGameMasterDevice?.()?"gm":"player"}catch(e){return "player"}}
function canAct(x=readRt()){if(!x)return false;if(role()==="gm")return true;return String(localStorage.getItem(DEVICE_HERO_KEY)||"")===activeHero(x)}
function tactical(){
  try{
    if(typeof ROOT.dc305PositionalGameplay==="function")return !!ROOT.dc305PositionalGameplay();
    const mods=typeof ROOT.gensGameplayModules==="function"?ROOT.gensGameplayModules():{};
    if(mods?.movement!==true)return false;
    const m=ROOT.getActiveGameProfile?.()?.rpgUniverse?.movement||{};
    return ["tactical","hybrid"].includes(String(m.mode||"narrative"));
  }catch(e){return false}
}
function modal(title,html){try{return ROOT.DungeonCore01?.modal?.(title,html)}catch(e){if(typeof alert==="function")alert(String(title||"")+"\n"+String(html||"").replace(/<[^>]+>/g," "))}}
function setText(el,text){if(el&&String(el.textContent||"")!==String(text||""))el.textContent=String(text||"")}
function nodeRoom(meta,nodeId){return Number(meta?.nodeRooms?.[String(nodeId)]||0)}
function nodeIdByRoom(meta,room){room=Number(room)||0;return Object.keys(meta?.nodeRooms||{}).find(id=>Number(meta.nodeRooms[id])===room)||""}
function node(graph,nodeId){return graph?.nodes?.find(n=>String(n.id)===String(nodeId))||null}
function zone(nodeId){
  const n=node(activeGraph(),nodeId);if(!n)return null;
  const room=roomApi()?.findRoom?.(n.roomId)||null;
  const interactions=interApi()?.roomMeta?.(n.roomId)||{attachments:[],cacheLinks:[]};
  return {node:n,room,interactions};
}
function currentNodeId(x=readRt()){return nodeIdByRoom(activeMeta(x),Number(x?.room)||0)}
function roomRuntimeIndex(room,originalIndex){
  const w=Math.max(1,Number(room?.width)||1),size=Math.max(w,Math.max(1,Number(room?.height)||1));
  const i=Math.max(0,Math.trunc(Number(originalIndex)||0)),y=Math.floor(i/w),xx=i%w;
  return y*size+xx;
}
function runtimeOriginalIndex(room,runtimeIndex){
  const w=Math.max(1,Number(room?.width)||1),h=Math.max(1,Number(room?.height)||1),size=Math.max(w,h);
  const i=Math.max(0,Math.trunc(Number(runtimeIndex)||0)),y=Math.floor(i/size),xx=i%size;
  return y<h&&xx<w?y*w+xx:-1;
}
function syntheticAttachments(z){
  const out=arr(z?.interactions?.attachments).map(clone);
  arr(z?.room?.cells).forEach((c,i)=>{
    const obj=String(c?.object||"");
    if(!["trap","puzzle"].includes(obj))return;
    if(out.some(a=>a.kind===obj&&a.targetType==="cell"&&Number(a.targetIndex)===i))return;
    out.push({id:"v1_"+obj+"_"+i,kind:obj,targetType:"cell",targetIndex:i,refId:"",label:"V1"});
  });
  return out;
}
function attachmentKey(nodeId,a){return String(nodeId)+":"+String(a?.id||a?.kind+"_"+a?.targetIndex)}
function isResolved(x,key){return !!x?.dc323?.resolved?.[key]}
function markResolved(x,key){x.dc323.resolved=x.dc323.resolved||{};x.dc323.resolved[key]=Date.now();writeRt(x)}
function pendingAttachments(x,nodeId,targetType,targetIndex){
  const z=zone(nodeId);if(!z)return [];
  return syntheticAttachments(z).filter(a=>String(a.targetType)===String(targetType)&&Number(a.targetIndex)===Number(targetIndex)&&!isResolved(x,attachmentKey(nodeId,a)));
}
function challengeFor(att,key){
  let lib=[];
  try{lib=arr(ROOT.loadChallengeLibrary069?.())}catch(e){}
  if(!lib.length){try{lib=arr(ROOT.challengePool051?.())}catch(e){}}
  if(!lib.length)return null;
  const ref=String(att?.refId||"").trim();
  let ch=ref?lib.find(c=>String(c?.id||"")===ref||String(c?.title||"")===ref):null;
  if(!ch){let h=0;for(const c of String(key||""))h=(h*31+c.charCodeAt(0))>>>0;ch=lib[h%lib.length]}
  return clone(ch);
}
function trapIdFor(att){
  const ref=String(att?.refId||"").trim();
  try{const all=ROOT.dungeonTrapTypes?.()||{};if(ref&&all[ref])return ref}catch(e){}
  try{return String(ROOT.dungeonPickTrapType?.(ROOT.loadDungeonConfig?.())?.id||"dart")}catch(e){return "dart"}
}
function resolveTrap(x,nodeId,att,title){
  const key=attachmentKey(nodeId,att);if(isResolved(x,key))return true;
  const hero=activeHero(x),trapId=trapIdFor(att);let res=null;
  try{res=ROOT.dungeonResolveTrapAgainstHero?.(trapId,hero,false)}catch(e){}
  markResolved(x,key);
  modal(title||"🪤 Piège",res?.html||"Le piège se déclenche. Il est maintenant consommé.");
  return false;
}
function openPuzzle(x,nodeId,att,mode,sceneId){
  const key=attachmentKey(nodeId,att);if(isResolved(x,key))return true;
  const ch=challengeFor(att,key);
  if(!ch){markResolved(x,key);modal("🧩 Énigme","Aucune énigme compatible n'est disponible dans la bibliothèque : l'interaction est ignorée pour ne pas bloquer la partie.");return false}
  x.dc323.puzzleAttempts=x.dc323.puzzleAttempts||{};
  if(mode==="chest"){
    const list=arr(ROOT.loadDungeonSceneElements?.()),el=list.find(e=>String(e.id)===String(sceneId));
    if(!el)return false;
    el.challenge=clone(ch);el.challengeDone=false;el.challengeAttempts=Number(x.dc323.puzzleAttempts[key])||0;el.dc323PuzzleKey=key;el.dc323NodeId=nodeId;
    try{ROOT.saveDungeonSceneElements?.(list)}catch(e){}
    try{(ROOT.dc201OpenPuzzle||ROOT.dc051OpenChallenge)?.("chest",sceneId)}catch(e){modal("🧩 Énigme",esc(ch.prompt||"Résous cette énigme."))}
    return false;
  }
  x.last=x.last||{};x.last.map=x.last.map||{};
  x.last.map.objective={type:"challenge",status:"locked",title:"Défi personnalisé",challenge:clone(ch),challengeAttempts:Number(x.dc323.puzzleAttempts[key])||0,dc323PuzzleKey:key,dc323NodeId:nodeId,dc323Cell:mode==="cell"};
  x.last.objective=x.last.map.objective;writeRt(x);
  try{(ROOT.dc201OpenPuzzle||ROOT.dc051OpenChallenge)?.("door","")}catch(e){modal("🧩 Énigme",esc(ch.prompt||"Résous cette énigme."))}
  return false;
}
function syncPuzzleCompletion(x){
  if(!x?.dc323)return false;let changed=false;
  const obj=x?.last?.map?.objective;
  if(obj?.dc323PuzzleKey){
    x.dc323.puzzleAttempts=x.dc323.puzzleAttempts||{};x.dc323.puzzleAttempts[obj.dc323PuzzleKey]=Number(obj.challengeAttempts)||0;
    if(obj.status==="done"){
      x.dc323.resolved=x.dc323.resolved||{};x.dc323.resolved[obj.dc323PuzzleKey]=Date.now();
      delete x.last.map.objective;delete x.last.objective;changed=true;
    }
  }
  const scenes=arr(ROOT.loadDungeonSceneElements?.());
  scenes.forEach(el=>{
    if(el?.dc323PuzzleKey){
      x.dc323.puzzleAttempts=x.dc323.puzzleAttempts||{};x.dc323.puzzleAttempts[el.dc323PuzzleKey]=Number(el.challengeAttempts)||0;
      if(el.challengeDone&&!x.dc323.resolved?.[el.dc323PuzzleKey]){x.dc323.resolved=x.dc323.resolved||{};x.dc323.resolved[el.dc323PuzzleKey]=Date.now();changed=true}
    }
  });
  if(changed)writeRt(x);return changed;
}
function processTarget(x,nodeId,targetType,targetIndex,mode,sceneId){
  const pending=pendingAttachments(x,nodeId,targetType,targetIndex);
  const trap=pending.find(a=>a.kind==="trap");if(trap)return resolveTrap(x,nodeId,trap,targetType==="chest"?"🪤 Coffre piégé":"🪤 Piège sur le passage");
  const puzzle=pending.find(a=>a.kind==="puzzle");if(puzzle)return openPuzzle(x,nodeId,puzzle,mode||"door",sceneId);
  return true;
}
function mapForZone(z,nodeId){
  const room=z?.room;if(!room)return null;
  const w=Math.max(1,Number(room.width)||1),h=Math.max(1,Number(room.height)||1),size=Math.max(w,h),cells=Array(size*size).fill("void");
  let entryIdx=-1,exitIdx=-1,enemyCount=0,bossCount=0;
  arr(room.cells).forEach((c,i)=>{
    const ri=roomRuntimeIndex(room,i);let v=c?.terrain==="wall"?"wall":"floor";const o=String(c?.object||"");
    if(c?.terrain!=="wall"){
      if(o==="entry"){v="entry";if(entryIdx<0)entryIdx=ri}
      else if(o==="exit"){v="exit";if(exitIdx<0)exitIdx=ri}
      else if(o==="enemy"){v="enemy";enemyCount++}
      else if(o==="boss"){v="enemy";bossCount++}
      else if(o==="chest")v="chest";
      else if(o==="cache")v="trapdoor";
      else if(["trap","puzzle","merchant","rest"].includes(o))v="floor";
    }
    cells[ri]=v;
  });
  if(entryIdx<0)entryIdx=cells.findIndex(v=>v==="floor");
  if(exitIdx<0)exitIdx=cells.findIndex(v=>v==="exit");
  return {version:323,size,cells,entryIdx,exitIdx,dc323NodeId:nodeId,dc323Width:w,dc323Height:h,dc323EnemyCount:enemyCount,dc323BossCount:bossCount};
}
function graphDepth(graph,nodeId){
  if(!graph?.startNodeId)return 1;const q=[[graph.startNodeId,1]],seen=new Set();
  while(q.length){const [id,d]=q.shift();if(id===nodeId)return d;if(seen.has(id))continue;seen.add(id);arr(graph.edges).filter(e=>e.fromNodeId===id).forEach(e=>q.push([e.toNodeId,d+1]))}
  return 1;
}
function zoneKind(z){const room=z?.room||{},cells=arr(room.cells),hasBoss=cells.some(c=>c?.object==="boss");if(hasBoss||room.roomType==="boss")return "boss";if(cells.some(c=>c?.object==="enemy"))return "enemy";if(cells.some(c=>c?.object==="chest"))return "chest";if(room.roomType==="rest"||cells.some(c=>c?.object==="rest"))return "rest";if(room.roomType==="merchant"||cells.some(c=>c?.object==="merchant"))return "merchant";return "custom"}
function cleanupOldCustomArtifacts(){
  try{ROOT.saveDungeonSceneElements?.(arr(ROOT.loadDungeonSceneElements?.()).filter(e=>!e?.dc323Custom))}catch(e){}
  try{ROOT.saveActiveEnemies?.(arr(ROOT.loadActiveEnemies?.()).filter(e=>!e?.dc323Custom))}catch(e){}
}
function sceneByCustom(nodeId,originalIndex,kind){return arr(ROOT.loadDungeonSceneElements?.()).find(e=>e?.dc323Custom&&String(e.dc323NodeId)===String(nodeId)&&Number(e.dc323OriginalIndex)===Number(originalIndex)&&(!kind||e.kind===kind))||null}
function instantiateScenes(x,nodeId,z,isBranch){
  const graph=activeGraph(x),room=z.room,roomNo=nodeRoom(x.dc323,nodeId),atts=syntheticAttachments(z);
  arr(room.cells).forEach((c,i)=>{
    const obj=String(c?.object||"");const ri=roomRuntimeIndex(room,i);
    if(obj==="chest"&&!sceneByCustom(nodeId,i,"chest")){
      let rarity="common";try{rarity=ROOT.dungeonPickChestRarity?.(ROOT.loadDungeonConfig?.())||"common"}catch(e){}
      const inter=atts.filter(a=>a.targetType==="chest"&&Number(a.targetIndex)===i);
      const puzzle=inter.find(a=>a.kind==="puzzle"),trap=inter.find(a=>a.kind==="trap");
      const data={kind:"chest",name:"Coffre personnalisé",rarity,trapped:false,room:roomNo,cellIndex:ri,fromMap:true,dc323Custom:true,dc323RunId:x.dc323.runId,dc323NodeId:nodeId,dc323OriginalIndex:i,dc323TrapKey:trap?attachmentKey(nodeId,trap):""};
      if(puzzle){const key=attachmentKey(nodeId,puzzle),ch=challengeFor(puzzle,key);if(ch){data.challenge=ch;data.challengeDone=isResolved(x,key);data.dc323PuzzleKey=key}}
      try{ROOT.addDungeonSceneElement?.(data)}catch(e){}
    }else if(obj==="merchant"&&!sceneByCustom(nodeId,i,"merchant")){
      try{ROOT.addDungeonSceneElement?.({kind:"merchant",name:"Marchand",room:roomNo,cellIndex:ri,dc323Custom:true,dc323RunId:x.dc323.runId,dc323NodeId:nodeId,dc323OriginalIndex:i})}catch(e){}
    }else if(obj==="cache"&&!sceneByCustom(nodeId,i,"trapdoor")){
      const bind=arr(graph?.cacheBindings).find(b=>b.sourceNodeId===nodeId&&Number(b.sourceIndex)===i);
      try{ROOT.addDungeonSceneElement?.({kind:"trapdoor",name:"Cache / passage secret",room:roomNo,cellIndex:ri,environment:"dungeon",branchType:"secret",dc323Custom:true,dc323Cache:true,dc323RunId:x.dc323.runId,dc323NodeId:nodeId,dc323OriginalIndex:i,dc323TargetNodeId:String(bind?.targetNodeId||"")})}catch(e){}
    }
  });
}
function spawnZoneEnemies(x,nodeId,z,isBranch){
  const roomNo=nodeRoom(x.dc323,nodeId),map=x.last?.map,depth=graphDepth(activeGraph(x),nodeId),normal=Math.max(0,Number(map?.dc323EnemyCount)||0),boss=Math.max(0,Number(map?.dc323BossCount)||0);
  const before=new Set(arr(ROOT.loadActiveEnemies?.()).map(e=>String(e.id)));
  try{if(normal>0)ROOT.dungeonEncounter?.(depth);if(boss>0)ROOT.dungeonBossRoom?.(depth)}catch(e){console.warn("DC323 spawn",e)}
  try{
    const all=arr(ROOT.loadActiveEnemies?.());
    all.forEach(e=>{if(!before.has(String(e.id))){e.dungeonRoom=roomNo;e.dc200Branch=!!isBranch;e.dc323Custom=true;e.dc323RunId=x.dc323.runId;e.dc323NodeId=nodeId}});
    ROOT.saveActiveEnemies?.(all);
  }catch(e){}
}
function retagZoneEnemies(x,nodeId,isBranch){
  const roomNo=nodeRoom(x.dc323,nodeId);try{const all=arr(ROOT.loadActiveEnemies?.());let ch=false;all.forEach(e=>{if(e?.dc323Custom&&e.dc323RunId===x.dc323.runId&&String(e.dc323NodeId)===String(nodeId)){if(e.dungeonRoom!==roomNo||!!e.dc200Branch!==!!isBranch){e.dungeonRoom=roomNo;e.dc200Branch=!!isBranch;ch=true}}});if(ch)ROOT.saveActiveEnemies?.(all)}catch(e){}
}
function applyRestIfNeeded(x,nodeId,z){
  if(x.dc323.restApplied?.[nodeId])return;const isRest=z?.room?.roomType==="rest"||arr(z?.room?.cells).some(c=>c?.object==="rest");if(!isRest)return;
  x.dc323.restApplied=x.dc323.restApplied||{};x.dc323.restApplied[nodeId]=true;
  try{
    const ex=ROOT.getActiveGameProfile?.()?.rpgUniverse?.exploration||{},heal=ex.restEnabled===false?0:Math.max(0,Number(ex.restHeal)||0),mana=ex.restEnabled===false?0:Math.max(0,Number(ex.restMana)||0);
    const ids=arr(x.participants).filter(id=>Number(x.heroRooms?.[id])===Number(x.room));
    ids.forEach(id=>{if(heal)ROOT.dungeonSetHeroWounds?.(id,-heal);if(mana){const st=ROOT.loadState?.(id);if(st){st.mana=Math.max(0,Number(st.mana)||0)+mana;try{localStorage.setItem(ROOT.key(id),JSON.stringify(st))}catch(e){}}}});
  }catch(e){}
}
function captureZoneState(x=readRt()){
  if(!x?.dc323||!x.last)return x;const nodeId=currentNodeId(x);if(!nodeId)return x;
  x.dc323.zoneStates=x.dc323.zoneStates||{};
  x.dc323.zoneStates[nodeId]={last:clone(x.last),enemyCells:clone(x.enemyCells||{}),updatedAt:Date.now()};
  writeRt(x);return x;
}
function restoreZoneState(x,nodeId){const s=x?.dc323?.zoneStates?.[nodeId];if(!s)return false;x.last=clone(s.last);x.enemyCells=clone(s.enemyCells||{});return true}
function initZone(x,nodeId,isBranch){
  const z=zone(nodeId);if(!z?.room)throw new Error("Pièce du donjon introuvable : "+nodeId);
  x.dc323.initialized=x.dc323.initialized||{};x.dc323.zoneStates=x.dc323.zoneStates||{};
  if(!restoreZoneState(x,nodeId)){
    const map=mapForZone(z,nodeId);x.last={kind:zoneKind(z),room:Number(x.room)||0,at:Date.now(),title:z.node.label||z.room.name||"Pièce personnalisée",map,exitLocked:map.dc323BossCount>0,keyEnemyId:""};x.enemyCells={};
  }
  instantiateScenes(x,nodeId,z,isBranch);
  if(!x.dc323.initialized[nodeId]){spawnZoneEnemies(x,nodeId,z,isBranch);x.dc323.initialized[nodeId]=Date.now();applyRestIfNeeded(x,nodeId,z)}else retagZoneEnemies(x,nodeId,isBranch);
  captureZoneState(x);return z;
}
function customLiving(x=readRt()){
  if(!x?.dc323)return [];
  const hero=activeHero(x),branch=!!x.branch?.active;
  try{return arr(ROOT.loadActiveEnemies?.()).filter(e=>!e.removed&&!e.defeated&&Number(e.hp)>0&&Number(e.dungeonRoom||0)===Number(x.room||0)&&!e.dc200Bypassed&&!e.dc200BypassedBy?.[hero]&&(branch?e.dc200Branch===true:e.dc200Branch!==true))}catch(e){return []}
}
function firstEntryRuntime(z){const i=arr(z?.room?.cells).findIndex(c=>c?.object==="entry");return i>=0?roomRuntimeIndex(z.room,i):0}
function outgoing(graph,nodeId){return arr(graph?.edges).filter(e=>e.fromNodeId===nodeId)}
function edgeLabels(graph,edges){return edges.map(e=>{const n=node(graph,e.toNodeId),z=zone(e.toNodeId);return {edge:e,label:n?.label||z?.room?.name||"Pièce"}})}
function preserveMovement(x,hero){const n=Number(x?.remaining?.[hero]);return Number.isFinite(n)?Math.max(0,n):3}
function enterNodeViaEdge(edge){
  let x=readRt();const graph=activeGraph(x),meta=activeMeta(x),hero=activeHero(x),targetId=edge.toNodeId,targetNo=nodeRoom(meta,targetId),z=zone(targetId);if(!x||!graph||!targetNo||!z)return false;
  const movement=preserveMovement(x,hero);captureZoneState(x);persist(x);setRoom(x,hero,targetNo);
  const existing=x.roomStates?.[String(targetNo)]?.last;
  if(existing){activate(x,hero);restoreZoneState(x,targetId)}else{x.room=targetNo;x.branch=null;x.enemyCells={};x.last=null;x.heroRooms=x.heroRooms||{};x.heroRooms[hero]=targetNo;initZone(x,targetId,false)}
  x.positions=x.positions||{};x.remaining=x.remaining||{};x.positions[hero]=roomRuntimeIndex(z.room,edge.toEntryIndex);x.remaining[hero]=movement;x.dc313LastTransition={heroId:hero,from:Number(edge.fromNodeId?nodeRoom(meta,edge.fromNodeId):0),to:targetNo,created:!existing,at:Date.now(),dc323:true};
  retagZoneEnemies(x,targetId,false);captureZoneState(x);writeRt(x);native?.render?.();sync();modal("🚪 "+heroName(hero)+" avance","Entrée dans <strong>"+esc(z.node.label||z.room.name)+"</strong>. Les autres héros restent à leur position.");return true;
}
function enterStart(){
  let x=readRt();const graph=activeGraph(x),meta=activeMeta(x),hero=activeHero(x),targetId=graph?.startNodeId,targetNo=nodeRoom(meta,targetId),z=zone(targetId);if(!x||!targetId||!targetNo||!z)return false;
  const movement=preserveMovement(x,hero);persist(x);setRoom(x,hero,targetNo);x.room=targetNo;x.branch=null;x.enemyCells={};x.last=null;x.heroRooms=x.heroRooms||{};x.heroRooms[hero]=targetNo;initZone(x,targetId,false);x.positions=x.positions||{};x.remaining=x.remaining||{};x.positions[hero]=firstEntryRuntime(z);x.remaining[hero]=movement;x.dc313LastTransition={heroId:hero,from:0,to:targetNo,created:true,at:Date.now(),dc323:true};captureZoneState(x);writeRt(x);native?.render?.();sync();modal("🏰 "+(graph.name||"Donjon personnalisé"),"<strong>"+esc(heroName(hero))+"</strong> entre dans <strong>"+esc(z.node.label||z.room.name)+"</strong>. Les autres héros restent à l'entrée jusqu'à leur propre déplacement.");return true;
}
function processDoorForEdge(x,edge){
  const sourceId=edge.fromNodeId,targetId=edge.toNodeId;
  if(!processTarget(x,sourceId,"door",edge.fromExitIndex,"door",""))return false;
  x=readRt();if(!processTarget(x,targetId,"door",edge.toEntryIndex,"door",""))return false;
  return true;
}
function traverseEdge(edgeId){
  let x=readRt();const graph=activeGraph(x),edge=arr(graph?.edges).find(e=>String(e.id)===String(edgeId));if(!x||!edge)return false;
  if(!canAct(x))return modal("⏳ Action refusée","Ce n'est pas le tour du héros contrôlé par ce téléphone.");
  const source=zone(edge.fromNodeId),hero=activeHero(x),exitRi=roomRuntimeIndex(source.room,edge.fromExitIndex);
  if(tactical()&&Number(x.positions?.[hero])!==exitRi)return modal("🚪 Sortie","Place le héros actif sur la sortie correspondante avant de franchir cette porte.");
  if(!processDoorForEdge(x,edge))return false;x=readRt();
  const living=customLiving(x);if(!tactical()&&living.length)return modal("⚔️ Salle non sécurisée","Tu dois vaincre les ennemis présents avant de poursuivre.");
  if(x.last?.exitLocked&&living.length)return modal("🔑 Sortie verrouillée","Cette pièce reste verrouillée tant que son Boss est vivant.");
  return enterNodeViaEdge(edge);
}
function customExplore(){
  let x=readRt();const graph=activeGraph(x);if(!x?.dc323||!graph)return native?.explore?.();
  syncPuzzleCompletion(x);x=readRt();
  if(!canAct(x))return modal("⏳ Action refusée","Ce n'est pas le tour du héros contrôlé par ce téléphone.");
  if(x.branch?.active&&x.branch?.dc323Custom){
    const z=zone(currentNodeId(x)),hero=activeHero(x),ex=arr(z?.room?.cells).findIndex(c=>c?.object==="exit"),ri=ex>=0?roomRuntimeIndex(z.room,ex):-1;
    if(!tactical()||Number(x.positions?.[hero])===ri)return leaveCustomBranch();
    return modal("🕳️ Retour","Rejoins la case SORTIE de la sous-pièce pour revenir dans la pièce source.");
  }
  if(Number(x.room||0)===0)return enterStart();
  const nodeId=currentNodeId(x),edges=outgoing(graph,nodeId);if(!edges.length)return modal("🏆 Fin du parcours","Cette pièce n'a aucune sortie reliée dans le constructeur. Tu es arrivé au bout de ce chemin.");
  if(tactical()){
    const z=zone(nodeId),pos=Number(x.positions?.[activeHero(x)]),here=edges.filter(e=>roomRuntimeIndex(z.room,e.fromExitIndex)===pos);
    if(here.length===1)return traverseEdge(here[0].id);
    if(!here.length){const labels=edgeLabels(graph,edges).map(v=>"• "+esc(v.label)).join("<br>");return modal("🚪 Choisir une sortie","Place le héros sur l'une des sorties reliées :<br><br>"+labels)}
  }
  if(edges.length===1)return traverseEdge(edges[0].id);
  const buttons=edgeLabels(graph,edges).map(v=>'<button type="button" class="dc01Btn primary" style="width:100%;margin-top:7px" onclick="dc323TraverseEdge(\''+esc(v.edge.id)+'\')">🚪 '+esc(v.label)+'</button>').join("");
  return modal("🚪 Choisir une sortie",buttons);
}
function customChest(id){
  let x=readRt();if(x?.dc323){syncPuzzleCompletion(x);x=readRt()}const scenes=arr(ROOT.loadDungeonSceneElements?.()),el=scenes.find(e=>String(e.id)===String(id));if(!x?.dc323||!el?.dc323Custom)return native?.searchChest?.(id);
  const hero=activeHero(x);if(tactical()&&Number(x.positions?.[hero])!==Number(el.cellIndex))return modal("🎁 Coffre","📍 Place le héros actif exactement sur la case du coffre.");
  const nodeId=String(el.dc323NodeId||currentNodeId(x)),original=Number(el.dc323OriginalIndex);
  if(!processTarget(x,nodeId,"chest",original,"chest",id))return false;
  return native?.searchChest?.(id);
}
function enterCustomBranch(id){
  let x=readRt();const scene=arr(ROOT.loadDungeonSceneElements?.()).find(e=>String(e.id)===String(id));if(!x?.dc323||!scene?.dc323Custom||!scene?.dc323Cache)return native?.enterBranch?.(id);
  const targetId=String(scene.dc323TargetNodeId||"");if(!targetId)return modal("🕳️ Cache","Cette cache n'est pas encore affectée à une instance de sous-pièce dans le constructeur.");
  const sourceNodeId=String(scene.dc323NodeId||currentNodeId(x)),targetNo=nodeRoom(x.dc323,targetId),z=zone(targetId);if(!targetNo||!z)return modal("🕳️ Cache","La sous-pièce liée n'est plus disponible.");
  captureZoneState(x);const beforeEnemies=new Set(arr(ROOT.loadActiveEnemies?.()).map(e=>String(e.id)));
  const ok=native?.enterBranch?.(id);if(ok===false)return false;
  x=readRt();if(!x?.branch?.active)return false;
  try{ROOT.saveDungeonSceneElements?.(arr(ROOT.loadDungeonSceneElements?.()).filter(e=>!e?.branch200))}catch(e){}
  try{const all=arr(ROOT.loadActiveEnemies?.()).filter(e=>beforeEnemies.has(String(e.id))||!e?.dc200Branch);ROOT.saveActiveEnemies?.(all)}catch(e){}
  const hero=activeHero(x),movement=preserveMovement(x,hero);x.room=targetNo;x.heroRooms=x.heroRooms||{};x.heroRooms[hero]=targetNo;x.branch.dc323Custom=true;x.branch.dc323SourceNodeId=sourceNodeId;x.branch.dc323TargetNodeId=targetId;x.branch.parentRoom=nodeRoom(x.dc323,sourceNodeId);x.branch.sourceId=String(id);x.branch.sourceCell=Number(scene.cellIndex);x.last=null;x.enemyCells={};
  initZone(x,targetId,true);x.positions=x.positions||{};x.remaining=x.remaining||{};x.positions[hero]=firstEntryRuntime(z);x.remaining[hero]=movement;retagZoneEnemies(x,targetId,true);captureZoneState(x);writeRt(x);native?.render?.();sync();modal("🕳️ Sous-pièce",heroName(hero)+" entre dans <strong>"+esc(z.node.label||z.room.name)+"</strong>. Les autres héros restent exactement où ils étaient.");return true;
}
function leaveCustomBranch(){
  let x=readRt();if(!x?.branch?.active||!x.branch.dc323Custom)return native?.leaveBranch?.();
  const targetId=String(x.branch.dc323TargetNodeId||currentNodeId(x)),sourceNodeId=String(x.branch.dc323SourceNodeId||""),sourceId=String(x.branch.sourceId||"");captureZoneState(x);
  const scene=arr(ROOT.loadDungeonSceneElements?.()).find(e=>String(e.id)===sourceId)||null;
  const ok=native?.leaveBranch?.();if(ok===false)return false;
  x=readRt();if(scene){try{const all=arr(ROOT.loadDungeonSceneElements?.());if(!all.some(e=>String(e.id)===sourceId)){all.push(scene);ROOT.saveDungeonSceneElements?.(all)}}catch(e){}}
  if(x?.dc323){retagZoneEnemies(x,targetId,true);captureZoneState(x);writeRt(x)}native?.render?.();sync();modal("↩️ Retour",heroName(activeHero(x))+" revient dans <strong>"+esc(zone(sourceNodeId)?.node?.label||zone(sourceNodeId)?.room?.name||"la pièce précédente")+"</strong>.");return true;
}
function cellInteraction(){
  let x=readRt();if(!x?.dc323)return false;const nodeId=currentNodeId(x),z=zone(nodeId),hero=activeHero(x),original=runtimeOriginalIndex(z?.room,Number(x.positions?.[hero]));if(original<0)return false;
  const pending=pendingAttachments(x,nodeId,"cell",original);const trap=pending.find(a=>a.kind==="trap");if(trap)return resolveTrap(x,nodeId,trap,"🪤 Piège sur la case");const puzzle=pending.find(a=>a.kind==="puzzle");if(puzzle)return openPuzzle(x,nodeId,puzzle,"cell","");return false;
}
function patchCellCard(x){
  if(!DOC)return;const host=DOC.getElementById("dc200Scene")||DOC.getElementById("dc02Scene");if(!host)return;let card=DOC.getElementById("dc323CellInteraction");const nodeId=currentNodeId(x),z=zone(nodeId),hero=activeHero(x),original=runtimeOriginalIndex(z?.room,Number(x.positions?.[hero]));const pending=original>=0?pendingAttachments(x,nodeId,"cell",original):[];
  if(!pending.length){card?.remove?.();return}
  if(!card){card=DOC.createElement("div");card.id="dc323CellInteraction";card.className="dc200SceneCard";host.appendChild(card)}
  const trap=pending.find(a=>a.kind==="trap"),puzzle=pending.find(a=>a.kind==="puzzle");const html='<div>'+(trap?'🪤':'🧩')+'</div><div class="grow"><strong>'+(trap?'Piège sur cette case':'Énigme sur cette case')+'</strong><small>'+(trap?'Le piège se déclenche au contact.':'Résous l’énigme pour valider cette interaction.')+'</small></div><button type="button" onclick="dc323ResolveCellInteraction()">'+(trap?'⚠️ RÉSOUDRE':'🧩 RÉSOUDRE')+'</button>';if(card.innerHTML!==html)card.innerHTML=html;
  x.dc323.lastCell=x.dc323.lastCell||{};const visit=nodeId+":"+original;if(x.dc323.lastCell[hero]!==visit){x.dc323.lastCell[hero]=visit;writeRt(x);if(trap&&!DOC.querySelector?.("#dc200Modal.open,#dc01Modal.open"))setTimeout(()=>cellInteraction(),0)}
}
function patchMetaAndAction(x){
  if(!DOC||!x?.dc323)return;const graph=activeGraph(x),nodeId=currentNodeId(x),z=zone(nodeId),meta=DOC.getElementById("dc01RoomMeta");setText(meta,Number(x.room)===0?"Entrée · "+String(graph?.name||"Donjon personnalisé"):String(graph?.name||"Donjon personnalisé")+" · "+String(z?.node?.label||z?.room?.name||"Pièce")+" · positions individuelles");
  const b=DOC.getElementById("dc01Explore");if(!b)return;b.disabled=!canAct(x);b.onclick=()=>ROOT.dc323Explore();
  if(x.branch?.active&&x.branch.dc323Custom){const ex=arr(z?.room?.cells).findIndex(c=>c?.object==="exit"),at=ex>=0&&Number(x.positions?.[activeHero(x)])===roomRuntimeIndex(z.room,ex);setText(b,!tactical()||at?"↩️ RETOURNER À LA PIÈCE":"🕳️ REJOINDRE LA SORTIE DE LA SOUS-PIÈCE");return}
  if(Number(x.room)===0){setText(b,"🚪 ENTRER — "+String(zone(graph?.startNodeId)?.node?.label||zone(graph?.startNodeId)?.room?.name||"Départ"));return}
  const edges=outgoing(graph,nodeId);if(!edges.length){setText(b,"🏆 FIN DU PARCOURS");return}
  if(edges.length>1){setText(b,"🚪 CHOISIR UNE SORTIE");return}
  const dest=zone(edges[0].toNodeId);const ex=roomRuntimeIndex(z.room,edges[0].fromExitIndex),at=Number(x.positions?.[activeHero(x)])===ex;setText(b,tactical()&&!at?"🚪 REJOINDRE LA SORTIE — "+String(dest?.node?.label||dest?.room?.name||"suite"):"🚪 ALLER — "+String(dest?.node?.label||dest?.room?.name||"suite"));
}
function sync(){
  if(syncBusy)return;syncBusy=true;try{let x=readRt();if(!x?.dc323){localStorage.removeItem(ACTIVE_KEY);return}syncPuzzleCompletion(x);x=readRt();captureZoneState(x);x=readRt();patchMetaAndAction(x);patchCellCard(x);injectBuilderPlay()}catch(e){console.warn("DC323 sync",e)}finally{syncBusy=false}
}
function launch(graphId){
  const b=builder(),g=b?.findDungeon?.(graphId);if(!b||!g)return false;const v=b.validation?.(g)||{valid:false,errors:["Structure invalide"]};if(!v.valid){if(typeof alert==="function")alert("Impossible de lancer ce donjon :\n"+arr(v.errors).join("\n"));return false}
  cleanupOldCustomArtifacts();try{b.close?.()}catch(e){};const ok=native?.start?.();if(ok===false)return false;let x=readRt();if(!x)return false;
  const nodeRooms={};arr(g.nodes).forEach((n,i)=>nodeRooms[n.id]=BASE_ROOM_NO+i+1);x.dc323={version:1,runId:"dc323_"+Date.now().toString(36),graphId:g.id,nodeRooms,resolved:{},puzzleAttempts:{},initialized:{},zoneStates:{},restApplied:{},lastCell:{},startedAt:Date.now()};x.room=0;x.last=null;x.branch=null;x.enemyCells={};x.roomStates={};x.heroBranchStates={};x.heroRooms=x.heroRooms||{};arr(x.participants).forEach(id=>x.heroRooms[id]=0);writeRt(x);localStorage.setItem(ACTIVE_KEY,g.id);native?.render?.();sync();modal("🏰 Donjon construit prêt","<strong>"+esc(g.name)+"</strong> est chargé.<br><br>Le héros actif peut maintenant entrer dans la pièce de départ. Les autres héros resteront à l’entrée jusqu’à leur propre tour."+(v.warnings?.length?"<br><br>⚠️ "+arr(v.warnings).map(esc).join("<br>⚠️ "):""));return true;
}
function selectedBuilderGraphId(){return String(DOC?.querySelector?.("#drc300Library .drc300Card.active [data-open]")?.dataset?.open||"")}
function injectBuilderPlay(){
  if(!DOC||!builder())return;const box=DOC.getElementById("drc300Validation");if(!box||DOC.getElementById("dc323PlayBuiltDungeon"))return;const btn=DOC.createElement("button");btn.id="dc323PlayBuiltDungeon";btn.type="button";btn.className="drc300Primary";btn.style.cssText="width:100%;margin-top:9px;padding:12px;font-size:15px";btn.textContent="▶️ TESTER / JOUER CE DONJON";btn.onclick=()=>{const id=selectedBuilderGraphId();if(id)launch(id);else if(typeof alert==="function")alert("Ouvre d’abord un donjon dans la bibliothèque.")};box.parentNode?.insertBefore(btn,box.nextSibling)
}
function wrapCore(){
  const c=ROOT.DungeonCore01;if(!c||native)return false;
  native={start:c.start?.bind(c),show:c.show?.bind(c),render:c.render?.bind(c),explore:c.explore?.bind(c),endTurn:c.endTurn?.bind(c),searchChest:c.searchChest?.bind(c),quit:c.quit?.bind(c),enterBranch:typeof ROOT.dc200EnterBranch==="function"?ROOT.dc200EnterBranch.bind(ROOT):null,leaveBranch:typeof ROOT.dc200LeaveBranch==="function"?ROOT.dc200LeaveBranch.bind(ROOT):null};
  c.explore=function(){return activeMeta()?customExplore():native.explore?.apply(this,arguments)};
  c.searchChest=function(id){return activeMeta()?customChest(id):native.searchChest?.apply(this,arguments)};
  c.render=function(){const r=native.render?.apply(this,arguments);setTimeout(sync,0);return r};
  c.show=function(){const r=native.show?.apply(this,arguments);setTimeout(sync,0);return r};
  c.endTurn=function(){let x=readRt();if(x?.dc323)captureZoneState(x);const r=native.endTurn?.apply(this,arguments);x=readRt();if(x?.dc323&&x.branch?.active&&x.branch.dc323Custom){const nid=currentNodeId(x);restoreZoneState(x,nid);writeRt(x);native.render?.()}setTimeout(sync,0);return r};
  c.quit=function(){const r=native.quit?.apply(this,arguments);setTimeout(sync,0);return r};
  if(native.enterBranch)ROOT.dc200EnterBranch=function(id){return activeMeta()?enterCustomBranch(id):native.enterBranch(id)};
  if(native.leaveBranch)ROOT.dc200LeaveBranch=function(){return activeMeta()?leaveCustomBranch():native.leaveBranch()};
  return true;
}
function install(){
  if(installed)return;if(!wrapCore()){if(DOC)setTimeout(install,0);return}installed=true;injectBuilderPlay();sync();try{ROOT.GENSRPG_VERSION=VERSION}catch(e){}
  ROOT.dc323Explore=customExplore;ROOT.dc323TraverseEdge=traverseEdge;ROOT.dc323ResolveCellInteraction=cellInteraction;ROOT.dc323Launch=launch;
  if(DOC&&typeof MutationObserver==="function")new MutationObserver(()=>{injectBuilderPlay();if(activeMeta())sync()}).observe(DOC.documentElement,{childList:true,subtree:true});
}
ROOT.DungeonCustomRuntime167823={VERSION,RT_KEY,ACTIVE_KEY,launch,customExplore,traverseEdge,customChest,enterCustomBranch,leaveCustomBranch,cellInteraction,sync,mapForZone,pendingAttachments,attachmentKey,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
