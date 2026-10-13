
(function(){
'use strict';
const CORE_KEY='gensrpg_dungeon_core02_v1';
const DEVICE_HERO_KEY='gensrpg_dungeon_core01_device_hero_v1';
let coreActive=false;
function eligible(){try{return isDungeonMode() && typeof gensCurrentContentFamily==='function' && gensCurrentContentFamily()==='rpg'}catch(e){return false}}
function heroName(id){return CHARS?.[id]?.name||findCustomHero?.(id)?.name||String(id||'—')}
function heroImage(id){return CHARS?.[id]?.image||findCustomHero?.(id)?.avatar||''}
function loadCore(){try{const x=JSON.parse(localStorage.getItem(CORE_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function saveCore(x){localStorage.setItem(CORE_KEY,JSON.stringify(x||{}))}
function participants(){return [...new Set((loadGameParticipants?.()||[]).map(String).filter(Boolean))]}
function role(){try{return isGameMasterDevice?.()?'gm':'player'}catch(e){return 'player'}}
function controlMode(){try{return dungeonMjRules151?.().enemyControl||'ai'}catch(e){return 'ai'}}
function assignedHero(){return localStorage.getItem(DEVICE_HERO_KEY)||''}
function setAssignedHero(id){if(id)localStorage.setItem(DEVICE_HERO_KEY,String(id));else localStorage.removeItem(DEVICE_HERO_KEY)}
function initialState(ids){return {version:2,participants:[...ids],round:1,index:0,phase:'exploration',environment:'dungeon',startedAt:Date.now()}}
function state(){let x=loadCore(),ids=participants();if(!Array.isArray(x.participants)||!x.participants.length||x.participants.some(id=>!ids.includes(String(id)))||ids.some(id=>!x.participants.map(String).includes(id))){x=initialState(ids);saveCore(x)}x.index=Math.max(0,Math.min(Number(x.index)||0,Math.max(0,x.participants.length-1)));return x}
function activeHero(){const x=state();return x.participants?.[x.index]||null}
function canAct(){if(role()==='gm')return true;const a=assignedHero(),cur=activeHero();return !!a&&!!cur&&String(a)===String(cur)}
function hideLegacy(){['setup','editorHub','pregameSetup','menu','sheet','gameProfileEditor','heroManager','enemyManager','objectManager','zombieManager','gameCustomization','sessionHeroSetup','sessionObjectSetup','sessionWaveSetup','sessionDungeonSetup','dungeonAdvancedEditor'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'})}
function show(){if(!eligible())return false;coreActive=true;hideLegacy();const e=document.getElementById('gensDungeonCore01');if(e)e.style.display='block';window.scrollTo(0,0);render();return true}
function start(){
  try{ensureDungeonContent?.();applyCustomHeroesMulti?.()}catch(e){}
  // Core 0.96 : prendre directement la sélection de préparation Dungeon.
  // Ne pas passer par le vieux turn-manager, qui pouvait remettre des héros anciens.
  let ids=[...new Set((loadGameParticipants?.()||[]).map(String).filter(Boolean))]
    .filter(id=>CHARS?.[id]||findCustomHero?.(id));
  if(!ids.length){ids=(typeof DUNGEON_HERO_IDS!=='undefined'?DUNGEON_HERO_IDS:[]).filter(id=>CHARS?.[id]);if(ids.length)saveGameParticipants(ids)}
  if(!ids.length){alert('Sélectionne au moins un héros dans la configuration de partie.');return false}
  saveGameParticipants(ids);try{markSessionActive(true)}catch(e){}
  try{applyPregameGoldToParticipants?.(ids)}catch(e){}
  try{saveActiveEnemies?.([])}catch(e){}
  try{
    saveDungeonState?.({room:0,last:null});
    saveDungeonSceneElements?.([]);
    try{dungeonBuildDeckState075?.()}catch(e){console.warn("Core 0.75 reset pioche Dungeon",e)}
    // Aucun plan ne doit exister avant le premier clic EXPLORER.
    const board=document.getElementById("dc047RoomBoard");if(board)board.innerHTML="";
    const scene=document.getElementById("dc02Scene");if(scene)scene.innerHTML="";
    for(let i=localStorage.length-1;i>=0;i--){
      const k=String(localStorage.key(i)||"");
      if(k.startsWith("gensrpg_dc064_door_challenge_"))localStorage.removeItem(k);
    }
  }catch(e){}
  saveCore(initialState(ids));
  if(role()==='player'&&!ids.includes(assignedHero()))setAssignedHero(ids[0]);
  return show();
}
function renderHeroes(x){const host=document.getElementById('dc01Heroes');if(!host)return;host.innerHTML='';const cur=activeHero();const my=assignedHero();x.participants.forEach(id=>{const b=document.createElement('button');b.type='button';b.className='dc01Hero'+(String(id)===String(cur)?' active':'')+((role()!=='gm'&&my&&String(id)!==String(my))?' locked':'');const img=heroImage(id);b.innerHTML=(img?'<img src="'+img+'" alt="">':'<div style="height:92px;display:grid;place-items:center;font-size:38px;background:#222;border-radius:8px">🧙</div>')+'<div class="dc01HeroName">'+z40kEscHtml(heroName(id))+'</div><div class="dc01HeroRole">'+z40kEscHtml(CHARS?.[id]?.role||'Héros')+'</div>'+(String(id)===String(cur)?'<span class="dc01HeroTurn">ACTIF</span>':'');b.onclick=()=>openHero(id);host.appendChild(b)})}
function openHero(id){id=String(id);const x=state();if(!x.participants.includes(id))return;if(role()!=='gm'&&String(assignedHero())!==id){modal('🔒 Héros non contrôlé','Ce téléphone contrôle <strong>'+z40kEscHtml(heroName(assignedHero()))+'</strong>.');return}const core=document.getElementById('gensDungeonCore01');if(core)core.style.display='none';try{openChar(id)}catch(e){console.error(e);show();modal('⚠️ Erreur fiche',z40kEscHtml(e.message||String(e)))}}
function featureAsset(kind){const names={trapdoor:['dungeon_trapdoor.png','dungeon_trap_door.png','dng_trapdoor.png','dng_trap_door.png'],stairs_down:['dungeon_stairs_down.png','dungeon_stairs.png','dng_stairs_down.png','dng_stairs.png'],stairs_up:['dungeon_stairs_up.png','dungeon_stairs.png','dng_stairs_up.png','dng_stairs.png']};return (names[kind]||[]).map(n=>'assets/dungeon/creatures/'+n)}
function featureImg(kind){const a=featureAsset(kind);if(!a.length)return '';return '<img src="'+a[0]+'" data-alt-index="0" onerror="(function(i){var a='+JSON.stringify(a)+',n=Number(i.dataset.altIndex||0)+1;i.dataset.altIndex=n;if(n<a.length)i.src=a[n];else i.style.display=\'none\'})(this)" alt="">'}
function sceneElements(){try{return (loadDungeonSceneElements?.()||[]).filter(el=>{const r=Number(el.room||0),cur=Number(loadDungeonState?.()?.room||0);return !r||r===cur})}catch(e){return[]}}
function currentChest(){return sceneElements().find(el=>el.kind==='chest')||null}
function chestLabel(r){return dungeonRarityLabel?.(r||'common')||String(r||'Commun')}
function renderScene(){const host=document.getElementById('dc02Scene');if(!host)return;const els=sceneElements();if(!els.length){host.innerHTML='';return}host.innerHTML=els.map(el=>{if(el.kind==='chest'){const r=el.rarity||'common';return '<div class="dc02Feature dc02Chest-'+r+'"><div style="font-size:38px">🎁</div><div class="dc02FeatureBody"><div class="dc02FeatureTitle">Coffre '+z40kEscHtml(chestLabel(r))+(el.trapped?' · ⚠️ piégé':'')+'</div><div class="dc02FeatureMeta">Le héros actif peut fouiller ce coffre.</div></div><button onclick="DungeonCore01.searchChest(\''+el.id+'\')">🔍 FOUILLER</button></div>'}if(el.kind==='trapdoor'||el.kind==='stairs_down'||el.kind==='stairs_up'){const label=el.kind==='trapdoor'?'Trappe':el.kind==='stairs_up'?'Escalier montant':'Escalier descendant';return '<div class="dc02Feature">'+featureImg(el.kind)+'<div class="dc02FeatureBody"><div class="dc02FeatureTitle">'+label+'</div><div class="dc02FeatureMeta">Élément de plan · '+z40kEscHtml(el.environment||'dungeon')+'</div></div></div>'}return ''}).join('')}
function searchChest(id){if(!canAct()){modal('⏳ Action refusée','Seul le héros actif ou le MJ peut fouiller.');return}const a=loadDungeonSceneElements?.()||[],el=a.find(x=>String(x.id)===String(id)&&x.kind==='chest');if(!el){modal('🎁 Coffre','Ce coffre n’est plus disponible.');render();return}const heroId=activeHero();if(el.trapped){const trap=dungeonPickTrapType(loadDungeonConfig());el.trapped=false;saveDungeonSceneElements(a);const resolved=dungeonResolveTrapAgainstHero(trap.id,heroId,false);modal('🪤 Coffre piégé',resolved?.html||'Le piège se déclenche. Le coffre reste disponible.');render();return}const drop=dungeonGrantLootByRarity(el.rarity||'common',heroId);removeDungeonSceneElement(id);if(drop)modal('🎁 Coffre '+chestLabel(el.rarity),'<strong>'+z40kEscHtml(heroName(heroId))+'</strong> obtient <strong>'+z40kEscHtml(drop.item?.name||'Objet')+'</strong>.');else modal('🎁 Coffre vide','Aucun objet compatible n’est disponible dans la pioche.');render()}
function addFeature(kind){if(role()!=='gm')return;const room=Number(loadDungeonState?.()?.room||0);addDungeonSceneElement({kind,name:kind==='trapdoor'?'Trappe':kind==='stairs_up'?'Escalier montant':'Escalier descendant',room,environment:'dungeon'});render();modal('🗺️ Élément ajouté',(kind==='trapdoor'?'Une trappe':'Un escalier')+' a été placé dans la salle actuelle.')}
function render(){if(!coreActive&&!eligible())return;const x=state(),cur=activeHero(),s=loadDungeonState?.()||{room:0};const cfg=loadDungeonConfig?.()||{rooms:0};document.getElementById('dc01Round').textContent='TOUR '+(x.round||1);document.getElementById('dc01ActiveHero').textContent=cur?'🎯 '+heroName(cur):'Aucun héros';document.getElementById('dc01Phase').textContent=(x.phase==='combat'?'Combat':'Exploration')+' · héros '+(x.index+1)+'/'+Math.max(1,x.participants.length);renderHeroes(x);
 const roleSel=document.getElementById('dc01Role');if(roleSel)roleSel.value=role();const assign=document.getElementById('dc01DeviceHero');if(assign){assign.innerHTML=x.participants.map(id=>'<option value="'+id+'">'+z40kEscHtml(heroName(id))+'</option>').join('');if(x.participants.includes(assignedHero()))assign.value=assignedHero()}const wrap=document.getElementById('dc01HeroAssignWrap');if(wrap)wrap.style.display=role()==='gm'?'none':'';const cm=controlMode();document.getElementById('dc01ControlMode').textContent='Mode de contrôle : '+(cm==='mj'?'🎛️ MJ contrôle tout':cm==='mixed'?'🤝 Mixte IA / MJ':'🤖 IA automatique');document.getElementById('dc01RoomMeta').textContent='Salle '+(Number(s.room)||0)+' / '+(Number(cfg.rooms)||0)+' · environnement : '+(x.environment||'dungeon');
 renderScene();const enemies=(dungeonLivingEnemies?.()||[]);const eh=document.getElementById('dc01Enemies');eh.innerHTML=enemies.length?'<div class="dc01Enemy">⚔️ '+enemies.length+' ennemi(s) vivant(s) dans cette salle : '+enemies.slice(0,4).map(e=>z40kEscHtml(activeEnemyDefinition?.(e.enemyId)?.name||'Ennemi')).join(', ')+(enemies.length>4?'…':'')+'</div>':'<div class="dc01Meta">Aucun ennemi vivant dans la salle.</div>';
 const act=canAct(),
 blocked=enemies.length>0 && (typeof window.dungeonRoomExitLocked102==="function"
   ? window.dungeonRoomExitLocked102()
   : true);const ex=document.getElementById('dc01Explore');if(ex){ex.disabled=!act||blocked;ex.textContent=blocked?'🔐 TROUVER LA CLÉ':'🚪 EXPLORER'}const end=document.getElementById('dc01EndTurn');if(end)end.disabled=!act;const gm=document.getElementById('dc01Gm');if(gm)gm.style.display=role()==='gm'?'':'none';const hint=document.getElementById('dc01ActionHint');if(hint){if(role()!=='gm'&&!assignedHero())hint.textContent='Choisis le héros contrôlé par ce téléphone.';else if(!act)hint.textContent='⏳ Ce n’est pas le tour de ce téléphone. Tour actif : '+heroName(cur)+'.';else if(blocked)hint.textContent='🔑 La sortie est verrouillée : un ennemi porte la clé.';else hint.textContent='✅ '+heroName(cur)+' peut agir.'}}
function changeRole(v){try{setDeviceGameRole?.(v)}catch(e){}if(v==='player'){const ids=state().participants;if(!ids.includes(assignedHero()))setAssignedHero(ids[0]||'')}render()}
function assignHero(id){if(state().participants.includes(String(id)))setAssignedHero(id);render()}
function endTurn(){
  if(!canAct()){modal('⏳ Tour verrouillé','Seul le héros actif ou le MJ peut terminer ce tour.');return}
  const x=state();if(!x.participants.length)return;

  // Core 0.67 : les malus d'énigme durent un nombre réel de tours du héros.
  const ended=x.participants[x.index]||null;
  if(ended){
    try{
      const hs=loadState(ended);
      if(Array.isArray(hs.dc067ChallengeDebuffs)){
        hs.dc067ChallengeDebuffs=hs.dc067ChallengeDebuffs.map(e=>({...e,remaining:Math.max(0,Number(e.remaining)||0)-1})).filter(e=>e.remaining>0);
        localStorage.setItem(key(ended),JSON.stringify(hs));
      }
    }catch(e){}
  }
  x.index++;
  if(x.index>=x.participants.length){
    x.index=0;x.round=(Number(x.round)||1)+1;
    try{tickAllTurnCooldowns?.();tickDungeonTalentRuntimeEffects?.();applyDungeonHeroStatusRoundEffects?.();applyDungeonPassiveRoundEffects?.()}catch(e){}
  }
  x.phase='exploration';
  saveCore(x);

  // Core 0.64 : la sélection globale suit le héros dont c'est réellement le tour.
  // Sinon certaines interfaces continuaient d'afficher/utiliser le héros précédent.
  const next=x.participants[x.index]||null;
  if(next){
    try{
      /* Core 0.93 : IMPORTANT — ne jamais assigner la variable locale `state`.
         `state()` est la fonction d'état du moteur Dungeon. L'ancienne ligne
         la remplaçait par l'objet du héros et cassait tous les rendus suivants. */
      window.current=String(next);
      window.state=loadState(window.current);
    }catch(e){}
  }
  try{renderMenuStatuses?.()}catch(e){}
  render();
  try{
    if(typeof showToast==="function")showToast("🔄 Tour de "+heroName(activeHero()));
  }catch(e){}
  try{window.dungeonMovementTurnChanged086?.(activeHero())}catch(e){}
}
function modal(title,html){document.getElementById('dc01ModalTitle').textContent=title||'Dungeon';document.getElementById('dc01ModalBody').innerHTML=html||'';document.getElementById('dc01Modal').classList.add('open')}
function closeModal(){document.getElementById('dc01Modal').classList.remove('open');render()}
function explore(){if(!canAct()){modal('⏳ Action refusée','Ce n’est pas le tour du héros contrôlé par ce téléphone.');return}const living=dungeonLivingEnemies?.()||[];const exitLocked=living.length>0 && (typeof window.dungeonRoomExitLocked102==="function"?window.dungeonRoomExitLocked102():true);if(exitLocked){modal('🔐 Sortie verrouillée','La sortie de cette salle est verrouillée. La clé est portée par un ennemi : éliminez le porteur pour poursuivre.');return}const cfg=loadDungeonConfig(),s=loadDungeonState();if((Number(s.room)||0)>=Number(cfg.rooms||0)){modal('🏆 Donjon terminé','Vous avez exploré les '+Number(cfg.rooms||0)+' salles du donjon.');return}s.room=Math.max(0,Number(s.room)||0)+1;const room=s.room;saveDungeonState(s);let kind=null;const explicitBossRooms=String(cfg.bossRooms||'').split(/[,; ]+/).map(Number).filter(n=>Number.isFinite(n)&&n>0);if(cfg.boss==='final'&&room===cfg.rooms)kind='boss';else if(cfg.boss==='everyN'&&room%Math.max(1,Number(cfg.bossEvery)||5)===0)kind='boss';else if(cfg.boss==='specific'&&explicitBossRooms.includes(room))kind='boss';else if(cfg.boss==='random'&&room>2&&Math.random()<(Math.max(0,Math.min(100,Number(cfg.bossChance)||13))/100))kind='boss';if(!kind){const w={enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11,...(cfg.roomWeights||{})};const entries=[['enemy',w.enemy],['ambush',w.ambush],['trap',w.trap],['chest',w.chest],['merchant',w.merchant],['rest',w.rest],['mystery',w.mystery]].map(([k,v])=>[k,Math.max(0,Number(v)||0)]);let r=Math.random()*(entries.reduce((n,x)=>n+x[1],0)||1);kind='enemy';for(const [k,v] of entries){r-=v;if(r<=0){kind=k;break}}}
 let result;if(kind==='enemy'){
  result=dungeonEncounter(room);
  result.text='<strong>⚔️ Des ennemis occupent la salle.</strong><br>Ferme cette fenêtre puis utilise <strong>ENGAGER LE COMBAT</strong> lorsque tu es prêt.<br><br>'+result.text;
}else if(kind==='ambush'){result=dungeonEncounter(room);result.title='⚡ EMBUSCADE — '+String(result.title||'Rencontre').replace(/^⚔️\s*Rencontre\s*—\s*/,'');result.text='<strong>⚠️ EMBUSCADE : les ennemis surprennent le groupe.</strong><br>La règle de proximité est ignorée pour cette rencontre : le combat peut être lancé immédiatement.<br><br>'+result.text;}else if(kind==='boss')result=dungeonBossRoom(room);else if(kind==='trap'){const trap=dungeonPickTrapType(cfg);result={title:'🪤 '+trap.name,text:'Un piège est présent dans la salle. En mode tactique, il ne se déclenche qu’au contact de sa case.',enemyQty:0,enemyName:'',trapId:trap.id}}else if(kind==='chest'){const rarity=dungeonPickChestRarity(cfg),trapped=Math.random()*100<Math.max(0,Math.min(100,Number(cfg.chestTrapChance)||0));const el=addDungeonSceneElement({kind:'chest',name:'Coffre '+dungeonRarityLabel(rarity),rarity,trapped,room});result={title:'🎁 '+(el?.name||'Coffre découvert'),text:'Un coffre <strong>'+z40kEscHtml(dungeonRarityLabel(rarity).toLowerCase())+'</strong> est présent dans la salle.'+(trapped?'<br>⚠️ Il peut être piégé.':''),enemyQty:0,enemyName:''}}else if(kind==='merchant'){const el=addDungeonSceneElement({kind:'merchant',name:'Marchand itinérant',room});result={title:'🧙‍♂️ Marchand itinérant',text:'Un marchand a installé son étal dans cette salle. Le groupe peut commercer avant de repartir.',enemyQty:0,enemyName:''}}else if(kind==='rest'){
  const ex=(getActiveGameProfile?.()?.rpgUniverse?.exploration)||{},restOn=ex.restEnabled!==false,heal=restOn?Math.max(0,Number(ex.restHeal)||0):0,mana=restOn?Math.max(0,Number(ex.restMana)||0):0,notes=[];
  dungeonParticipants().forEach(id=>{
    if(heal>0){dungeonSetHeroWounds(id,-heal);notes.push((CHARS[id]?.name||id)+' +'+heal+' PV')}
    if(mana>0){const hs=loadState(id),oc=window.current,os=window.state;try{window.current=id;window.state=hs;hs.mana=Math.min(dungeonMaxMana(),Math.max(0,Number(hs.mana)||0)+mana)}finally{window.current=oc;window.state=os}localStorage.setItem(key(id),JSON.stringify(hs))}
  });
  result={title:'⛩️ Sanctuaire de repos',text:(heal||mana)?('Le sanctuaire restaure le groupe.<br><strong>PV : +'+heal+' · Mana : +'+mana+'</strong>'):'Un sanctuaire ancien offre un lieu sûr, sans restauration automatique.',enemyQty:0,enemyName:''}
}else result={title:'✨ Salle calme',text:'La salle est vide. Le groupe peut souffler avant de poursuivre.',enemyQty:0,enemyName:''};const narrative=cfg.narration!==false?dungeonNarrativeText(kind,result.enemyName||'une créature',result.enemyQty||1,room):'';const map=cfg.map!==false?generateDungeonMap(kind,result.enemyQty||0):null;s.last={kind,room,at:Date.now(),narrative,map,title:result.title};saveDungeonState(s);try{dc077MaybeCreateObjective?.(room,kind)}catch(e){}const mapText=map?'<div class="dc01Map"><strong>🗺️ Configuration</strong><br>'+dungeonMapHtml(map)+'</div>':'';try{queueDungeonRoomEvent074?.(room,kind)}catch(e){}const ambushAction=kind==='ambush'
  ?'<button class="dc01Btn primary dc076AmbushBtn" style="width:100%;margin-top:12px" onclick="dc076StartAmbushCombat()">⚔️ COMMENCER LE COMBAT</button>'
  :'';
modal('🏰 SALLE '+room+' / '+cfg.rooms+' — '+result.title,(narrative?'<div class="dc01Notice">'+z40kEscHtml(narrative)+'</div>':'')+result.text+mapText+ambushAction);
render();
}
window.dc076StartAmbushCombat=function(){
  try{
    const st=loadDungeonState?.()||{};
    if(st.last?.kind!=='ambush')return;
    const living=(dungeonLivingEnemies?.()||[]).filter(e=>e&&!e.defeated&&Number(e.hp)>0);
    if(!living.length){
      DungeonCore01.closeModal?.();
      DungeonCore01.render?.();
      return;
    }
    DungeonCore01.closeModal?.();
    if(typeof dc030EngageCombat==='function')dc030EngageCombat();
    else if(typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat==='function')window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:living.map(e=>String(e.id)),reason:'embuscade',entry:'dc076AmbushFallback'});
  }catch(e){
    console.warn('Core 0.76 embuscade',e);
    try{DungeonCore01.modal?.('⚠️ Embuscade','Impossible d’ouvrir le combat : '+z40kEscHtml(String(e?.message||e)))}catch(_){}
  }
};
function openGm(){if(role()!=='gm')return;modal('🎛️ OUTILS MJ — SALLE','<div class="dc01Notice">Les éléments ajoutés ici modifient réellement la salle actuelle.</div><div class="dc01Actions" style="margin-top:10px"><button onclick="DungeonCore01.gmChest(\'common\')">🎁 Coffre commun</button><button onclick="DungeonCore01.gmChest(\'rare\')">💙 Coffre rare</button><button onclick="DungeonCore01.gmChest(\'epic\')">💜 Coffre épique</button><button onclick="DungeonCore01.gmChest(\'legendary\')">💛 Coffre légendaire</button><button onclick="DungeonCore01.addFeature(\'trapdoor\')">🕳️ Trappe</button><button onclick="DungeonCore01.addFeature(\'stairs_down\')">🪜 Escalier ↓</button><button onclick="DungeonCore01.addFeature(\'stairs_up\')">🪜 Escalier ↑</button><button onclick="DungeonCore01.legacyGm()">⚙️ Réglages MJ complets</button></div>')}
function gmChest(rarity){if(role()!=='gm')return;const room=Number(loadDungeonState?.()?.room||0),cfg=loadDungeonConfig?.()||{};const trapped=Math.random()*100<Math.max(0,Math.min(100,Number(cfg.chestTrapChance)||0));addDungeonSceneElement({kind:'chest',name:'Coffre '+chestLabel(rarity),rarity,trapped,room});closeModal();render();modal('🎁 Coffre ajouté','Coffre <strong>'+z40kEscHtml(chestLabel(rarity))+'</strong> ajouté à la salle.'+(trapped?'<br>⚠️ Il est piégé.':'')+'<br>Le bouton <strong>FOUILLER</strong> est maintenant disponible.')}
function legacyGm(){closeModal();try{openDungeonMasterPanel?.()}catch(e){modal('⚠️ Outils MJ',z40kEscHtml(e.message||String(e)))}}
function quit(){if(!confirm('Quitter la partie Dungeon ?'))return;coreActive=false;try{markSessionActive(false)}catch(e){}const core=document.getElementById('gensDungeonCore01');if(core)core.style.display='none';try{showGensRootHome?.()}catch(e){const setup=document.getElementById('setup');if(setup)setup.style.display='block'}}
const oldStart=window.startConfiguredGame;window.startConfiguredGame=async function(){if(eligible())return start();return oldStart?.apply(this,arguments)};
const oldCloseCfg=window.closeGameCustomization;window.closeGameCustomization=function(){if(coreActive&&eligible()){const e=document.getElementById('gameCustomization');if(e)e.style.display='none';show();return}return oldCloseCfg?.apply(this,arguments)};
window.__dc097NativeEndTurn=endTurn;
window.__dc097NativeAmbush=window.dc076StartAmbushCombat;
window.DungeonCore01={eligible,start,show,render,openHero,changeRole,assignHero,endTurn,explore,modal,closeModal,openGm,gmChest,searchChest,addFeature,legacyGm,quit,get active(){return coreActive}};
document.addEventListener('DOMContentLoaded',()=>{
  // Core 0.68 : ne jamais rouvrir automatiquement une partie au lancement.
  // Une sauvegarde active reste disponible via le bouton REPRENDRE depuis l'accueil.
});
})();
