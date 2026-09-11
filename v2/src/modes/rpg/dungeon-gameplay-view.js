import { renderQuestJournal } from './quest-journal-ui.js';
import { renderLootRecipientPicker, grantCreatureLootToSelectedRecipient } from './loot-recipient-ui.js';
import { mountRoomNpcInteraction } from './room-npc-interaction-ui.js';
import { resolveRoomRuntimeEventChoice } from './room-event-runtime.js';
import { availableRoomLinks } from './world-engine.js';
import { transitionDungeonRoom, transitionDungeonHeroRoom, setFocusedDungeonHero } from './room-runtime.js';
import { activeDungeonEnemies, startDungeonCombat, reconcileDungeonCombatResult, dungeonHeroCombatSkills, executeDungeonHeroSkill } from './dungeon-combat-runtime.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clone(value){return structuredClone(value);}

function questList(universe={}){
  if(Array.isArray(universe.quests)) return universe.quests;
  return Object.values(universe.quests||{});
}

function heroList(universe={}){
  if(Array.isArray(universe.heroes)) return universe.heroes;
  return Object.values(universe.heroes||{});
}

function heroDefinition(universe,heroId){
  return heroList(universe).find(hero=>String(hero?.id)===String(heroId))||null;
}

function currentRoom(runtime){
  const roomId=runtime?.currentRoomId?String(runtime.currentRoomId):null;
  return roomId?runtime?.rooms?.[roomId]||null:null;
}

function focusedHeroSession(roomRuntime){
  const heroId=roomRuntime?.focusedHeroId?String(roomRuntime.focusedHeroId):null;
  const location=heroId?roomRuntime?.heroLocations?.[heroId]:null;
  if(!location) return roomRuntime?.worldSession||null;
  return {
    ...(roomRuntime.worldSession||{}),
    currentRoomId:String(location.roomId||''),
    visitedRoomIds:clone(location.visitedRoomIds||[]),
    history:clone(location.history||[]),
    sequence:Number(location.sequence)||0,
  };
}

export function dungeonLootEntries(roomRuntime){
  return (currentRoom(roomRuntime)?.entities||[]).filter(entity=>{
    const runtime=entity?.kind==='creature'?entity.data?.creatureRuntime:null;
    return runtime?.defeated&&runtime?.lootClaimed&&!runtime?.lootGranted&&(runtime?.lootDrops||[]).length;
  });
}

export function grantDungeonCreatureLoot(roomRuntime,instanceId,recipients=[],selectedKey=null,definitions={}){
  const room=currentRoom(roomRuntime);
  if(!room) return {ok:false,reason:'room-runtime-missing',roomRuntime,recipients:clone(recipients||[]),selectedKey:null,drops:[]};
  const granted=grantCreatureLootToSelectedRecipient(room,instanceId,recipients,selectedKey,definitions);
  if(!granted.ok) return {...granted,roomRuntime};
  const next=clone(roomRuntime);
  next.rooms[next.currentRoomId]=granted.roomRuntime;
  return {...granted,roomRuntime:next};
}

export function reconcileEndedDungeonCombat({combat,roomRuntime,heroRuntimes=[],universe={},random=Math.random}={}){
  if(!combat||combat.phase!=='ended') return {ok:false,reason:'combat-not-ended',combat,roomRuntime,heroRuntimes:clone(heroRuntimes||[]),defeatedEnemyIds:[]};
  return reconcileDungeonCombatResult({combat,roomRuntime,heroRuntimes,universe,random});
}

function combatReconcileKey(combat){
  if(!combat||combat.phase!=='ended') return null;
  return [combat.metadata?.roomId||'',combat.winner||'',Number(combat.round)||0,Number(combat.turnSequence)||0,(combat.log||[]).length].join('|');
}

function roomNpcInteractions(layout){
  return (layout?.interactions||[]).filter(interaction=>interaction&&interaction.enabled!==false&&['npc','ally'].includes(String(interaction.kind)));
}

export function dungeonTransitionEntries(worldIndex,roomRuntime,{conditionEvaluator=null,inventory=null}={}){
  const session=focusedHeroSession(roomRuntime);
  if(!worldIndex||!session) return [];
  return availableRoomLinks(worldIndex,session,{conditionEvaluator,inventory}).map(link=>({
    id:String(link.id),
    label:String(link.label||'Passage'),
    targetRoomId:String(link.targetRoomId),
    targetRoomName:String(worldIndex.rooms?.[String(link.targetRoomId)]?.name||'Salle suivante'),
    traversal:String(link.traversal||'forward'),
  }));
}

export function eventPresentationEntries(eventState){
  const entries=[];
  for(const row of eventState?.log||[]){
    if(row.type==='event-text'&&row.text) entries.push({kind:'text',icon:'💬',text:String(row.text)});
    else if(row.type==='event-check-resolved') entries.push({kind:'check',icon:'🎲',text:`Jet ${row.success?'réussi':'échoué'}`});
    else if(row.type==='event-effect-applied') entries.push({kind:'effect',icon:'✨',text:'Un effet a été appliqué.'});
    else if(row.type==='event-reward') entries.push({kind:'reward',icon:'🎁',text:`Récompense reçue : ${row.quantity||1} × ${row.itemId||'objet'}`});
    else if(row.type==='event-flag-set') entries.push({kind:'flag',icon:'📌',text:'L’état de l’aventure a été modifié.'});
    else if(row.type==='event-door-updated') entries.push({kind:'door',icon:'🚪',text:'Une porte a changé d’état.'});
    else if(row.type==='event-spawn') entries.push({kind:'spawn',icon:'⚔️',text:row.created===false?'Une présence était déjà sur place.':'Une nouvelle présence apparaît.'});
    else if(row.type==='event-transition-requested') entries.push({kind:'transition',icon:'➡️',text:'Un déplacement vers une autre zone est demandé.'});
    else if(row.type==='event-choice-selected') entries.push({kind:'choice',icon:'✅',text:`Choix : ${row.label||'décision validée'}`});
  }
  return entries;
}

function renderEventPresentation(eventState){
  const entries=eventPresentationEntries(eventState);
  if(!entries.length) return '';
  return `<section class="editor-section dungeon-event-presentation"><div class="section-title-row"><div><h3>📜 Événement</h3><p class="muted">Ce qui vient de se produire dans la partie.</p></div></div><div class="editor-list">${entries.map(entry=>`<div class="editor-card compact dungeon-event-line"><strong>${entry.icon}</strong> <span>${esc(entry.text)}</span></div>`).join('')}</div></section>`;
}

function renderEventChoice(roomRuntime){
  const active=roomRuntime?.eventOrchestrator?.active?.eventState||null;
  const waiting=active?.status==='waiting-choice'?active.waitingChoice:null;
  if(!waiting) return '';
  const choices=(waiting.choices||[]).map(choice=>`<button type="button" class="primary-button" data-dungeon-event-choice="${esc(choice.id)}">${esc(choice.label||'Choisir')}</button>`).join('');
  return `<section class="editor-section dungeon-event-choice"><div class="section-title-row"><div><h3>❗ Choix d’événement</h3><p class="muted">La partie attend ta décision avant de poursuivre.</p></div></div><div class="action-row">${choices||'<p class="muted">Aucun choix disponible.</p>'}</div></section>`;
}

function renderHeroFocusSection(universe,roomRuntime,worldIndex){
  const locations=Object.values(roomRuntime?.heroLocations||{});
  if(!locations.length) return '';
  const focusedId=String(roomRuntime.focusedHeroId||locations[0]?.heroId||'');
  const options=locations.map(location=>{
    const heroId=String(location.heroId);
    const hero=heroDefinition(universe,heroId);
    const roomName=worldIndex?.rooms?.[String(location.roomId)]?.name||String(location.roomId||'Salle inconnue');
    return `<option value="${esc(heroId)}" ${heroId===focusedId?'selected':''}>${esc(hero?.icon||'🧙')} ${esc(hero?.name||heroId)} · ${esc(roomName)}</option>`;
  }).join('');
  return `<section class="editor-section dungeon-hero-focus"><div class="section-title-row"><div><h3>🧙 Héros actif</h3><p class="muted">Chaque héros conserve sa propre salle et son propre trajet.</p></div></div><label>Jouer avec<select data-dungeon-hero-focus>${options}</select></label></section>`;
}

function renderTransitionSection(worldIndex,roomRuntime,options={}){
  if(!roomRuntime?.currentRoomId) return '';
  const links=dungeonTransitionEntries(worldIndex,roomRuntime,options);
  const heroId=roomRuntime?.focusedHeroId;
  const heroName=heroId?(heroDefinition(options.universe||{},heroId)?.name||heroId):null;
  return `<section class="editor-section dungeon-transition-section"><div class="section-title-row"><div><h3>🚪 Passages</h3><p class="muted">${heroName?`${esc(heroName)} se déplace seul. `:''}Passages actuellement accessibles depuis cette salle.</p></div></div><div class="action-row">${links.map(link=>`<button type="button" class="secondary-button" data-dungeon-transition="${esc(link.id)}">${link.traversal==='reverse'?'↩️':'➡️'} ${esc(link.label)} · ${esc(link.targetRoomName)}</button>`).join('')||'<p class="muted">Aucun passage accessible pour le moment.</p>'}</div></section>`;
}

function combatActorName(universe,actor,id){
  if(actor?.side==='heroes') return heroDefinition(universe,actor.metadata?.heroId||id)?.name||id;
  const creature=(universe.bestiary||[]).find(entry=>String(entry.id)===String(actor?.metadata?.creatureId));
  return creature?.name||actor?.metadata?.creatureId||id;
}

export function dungeonCombatTargetEntries(universe,combat){
  const actor=combat?.actors?.[combat?.activeActorId];
  if(!actor) return [];
  return Object.values(combat.actors||{}).filter(candidate=>candidate&&!candidate.ko).map(candidate=>({
    id:String(candidate.id),
    side:String(candidate.side||''),
    self:String(candidate.id)===String(actor.id),
    name:combatActorName(universe,candidate,candidate.id),
  }));
}

function renderCombatSection(universe,roomRuntime,{heroRuntimes=[],activeCombat=null,message=''}={}){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  if(!roomId) return '';
  const enemies=activeDungeonEnemies(roomRuntime,roomId);
  if(activeCombat?.metadata?.roomId===roomId&&activeCombat.phase!=='ended'){
    const names=(activeCombat.order||[]).map(id=>combatActorName(universe,activeCombat.actors?.[id],id));
    const actor=activeCombat.actors?.[activeCombat.activeActorId];
    const actorName=combatActorName(universe,actor,activeCombat.activeActorId||'—');
    let actions='';
    if(actor?.side==='heroes'){
      const skills=dungeonHeroCombatSkills({combat:activeCombat,heroRuntimes,universe});
      const targets=dungeonCombatTargetEntries(universe,activeCombat);
      actions=skills.length
        ?`<div class="combat-actions dungeon-combat-actions"><label>Compétence<select data-dungeon-combat-skill>${skills.map(skill=>`<option value="${esc(skill.id)}">${esc(skill.icon||'✨')} ${esc(skill.name||'Compétence')}</option>`).join('')}</select></label><label>Cible<select data-dungeon-combat-target>${targets.map(target=>`<option value="${esc(target.id)}">${target.self?'👤 ':target.side==='heroes'?'🛡️ ':'👹 '}${esc(target.name)}</option>`).join('')}</select></label><button type="button" class="primary-button" data-dungeon-use-skill>Utiliser la compétence</button></div>`
        :'<p class="muted">Aucune compétence disponible pour ce héros.</p>';
    } else {
      actions='<p class="muted">Tour ennemi : les actions IA seront raccordées à cette même timeline.</p>';
    }
    return `<section class="editor-section dungeon-combat-section"><div class="section-title-row"><div><h3>⚔️ Combat en cours</h3><p class="muted">Le moteur D100 utilise les participants réellement présents dans cette salle.</p></div></div><p><strong>Participants :</strong> ${names.map(esc).join(' · ')}</p><p><strong>Tour :</strong> ${Number(activeCombat.round)||1} · ${esc(actorName)}</p>${actions}${message?`<div class="combat-result" aria-live="polite">${esc(message)}</div>`:''}</section>`;
  }
  if(!enemies.length) return '<section class="editor-section dungeon-combat-section"><h3>⚔️ Combat</h3><p class="muted">Aucun ennemi actif dans cette salle.</p></section>';
  const enemyNames=enemies.map(entry=>{
    const creature=(universe.bestiary||[]).find(candidate=>String(candidate.id)===String(entry.runtime.creatureId));
    return creature?.name||entry.runtime.name||'Ennemi';
  });
  const heroId=roomRuntime?.focusedHeroId?String(roomRuntime.focusedHeroId):null;
  const heroName=heroId?(heroDefinition(universe,heroId)?.name||heroId):'le héros actif';
  const hasHeroRuntime=(Array.isArray(heroRuntimes)?heroRuntimes:Object.values(heroRuntimes||{})).some(hero=>String(hero?.instanceId||hero?.heroId||'')===heroId);
  return `<section class="editor-section dungeon-combat-section"><div class="section-title-row"><div><h3>⚔️ Ennemis présents</h3><p class="muted">${enemyNames.map(esc).join(' · ')}</p></div></div><button type="button" class="primary-button" data-dungeon-start-combat ${heroId&&hasHeroRuntime?'':'disabled'}>Engager le combat avec ${esc(heroName)}</button>${hasHeroRuntime?'':'<p class="muted">Le runtime du héros actif doit être chargé pour engager ce combat.</p>'}</section>`;
}

function renderNpcSection(layout){
  const interactions=roomNpcInteractions(layout);
  if(!interactions.length) return '';
  return `<section class="editor-section dungeon-npc-section"><div class="section-title-row"><div><h3>💬 Personnages</h3><p class="muted">Interactions disponibles dans cette salle.</p></div></div><div class="editor-list">${interactions.map(interaction=>`<div class="editor-card compact" data-dungeon-npc-host="${esc(interaction.id)}"><strong>💬 ${esc(interaction.name||'Personnage')}</strong><div data-dungeon-npc-body="${esc(interaction.id)}"></div></div>`).join('')}</div></section>`;
}

function renderLootSection(roomRuntime,lootRecipients=[],selectedLootRecipientKey=null){
  const entries=dungeonLootEntries(roomRuntime);
  if(!entries.length) return '<section class="editor-section dungeon-loot-section"><h3>🎁 Butin</h3><p class="muted">Aucun butin à distribuer.</p></section>';
  return `<section class="editor-section dungeon-loot-section"><div class="section-title-row"><div><h3>🎁 Butin à distribuer</h3><p class="muted">Choisis qui reçoit chaque butin. Une attribution validée ne peut pas être redirigée ensuite.</p></div></div><div class="editor-list">${entries.map(entity=>{
    const runtime=entity.data.creatureRuntime;
    const drops=(runtime.lootDrops||[]).map(drop=>`<span>${esc(drop.itemId)} × ${Math.max(1,Number(drop.quantity)||1)}</span>`).join(' · ');
    return `<article class="editor-card compact" data-dungeon-loot="${esc(entity.id)}"><div class="editor-card-head"><strong>Butin ennemi</strong><span class="status-pill">${drops}</span></div>${renderLootRecipientPicker(lootRecipients,selectedLootRecipientKey)}<button type="button" class="primary-button" data-grant-dungeon-loot="${esc(entity.id)}" ${lootRecipients.length?'':'disabled'}>Attribuer le butin</button></article>`;
  }).join('')}</div></section>`;
}

export function renderDungeonGameplayView(universe={},roomRuntime=null,{lootRecipients=[],selectedLootRecipientKey=null,roomLayout=null,eventPresentationState=null,worldIndex=null,conditionEvaluator=null,inventory=null,heroRuntimes=[],activeCombat=null,combatMessage=''}={}){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const hasRuntime=Boolean(roomRuntime&&roomId);
  const activeEvent=roomRuntime?.eventOrchestrator?.active?.eventState||null;
  const eventStatus=activeEvent?.status==='waiting-choice'?'Choix en attente':activeEvent?'Événement en cours':'Aucun événement bloquant';
  const presentation=eventPresentationState||activeEvent;
  const roomName=worldIndex?.rooms?.[roomId]?.name||roomId;
  const focusedHero=roomRuntime?.focusedHeroId?heroDefinition(universe,roomRuntime.focusedHeroId):null;
  const heroLabel=focusedHero?.name||roomRuntime?.focusedHeroId||null;
  return `<section class="workspace-head dungeon-gameplay-head"><div><p class="eyebrow">RPG · DONJON</p><h2>🎮 Partie Donjon</h2><p class="muted">${hasRuntime?`${heroLabel?`${esc(heroLabel)} · `:''}Salle actuelle : ${esc(roomName)} · ${esc(eventStatus)}`:'Aucune partie Donjon active.'}</p></div><button class="help-button" type="button" data-help="rpg-dungeon-gameplay">?</button></section><div class="dungeon-gameplay-grid">${renderHeroFocusSection(universe,roomRuntime,worldIndex)}<section class="editor-section dungeon-gameplay-status"><h3>État de la partie</h3>${hasRuntime?`<p><strong>Salle :</strong> ${esc(roomName)}</p><p><strong>Visites :</strong> ${Number(roomRuntime.rooms?.[roomId]?.visits)||0}</p><p><strong>Événements en attente :</strong> ${(roomRuntime.eventQueue?.pending||[]).length}</p>`:'<p class="muted">Lance ou reprends une partie pour afficher l’état du donjon.</p>'}</section>${renderEventPresentation(presentation)}${renderEventChoice(roomRuntime)}${renderCombatSection(universe,roomRuntime,{heroRuntimes,activeCombat,message:combatMessage})}${renderTransitionSection(worldIndex,roomRuntime,{conditionEvaluator,inventory,universe})}${renderNpcSection(roomLayout)}${renderLootSection(roomRuntime,lootRecipients,selectedLootRecipientKey)}${renderQuestJournal(questList(universe),roomRuntime?.questRuntime||null)}</div>`;
}

export function mountDungeonGameplayView(host,{universe={},roomRuntime=null,lootRecipients=[],selectedLootRecipientKey=null,layoutProvider=null,eventWorld={},worldIndex=null,conditionEvaluator=null,inventory=null,heroRuntimes=[],spatial=null,spatialConfig={},activeCombat=null,onCombatStart=null,onCombatChange=null,onCombatEnd=null,onRoomRuntimeChange=null}={}){
  let currentUniverse=universe||{};
  let currentRuntime=roomRuntime||null;
  let currentLootRecipients=clone(lootRecipients||[]);
  let currentLootRecipientKey=selectedLootRecipientKey||null;
  let currentEventWorld=clone(eventWorld||{});
  let currentWorldIndex=worldIndex||null;
  let currentInventory=inventory||null;
  let currentHeroRuntimes=clone(heroRuntimes||[]);
  let currentSpatial=spatial?clone(spatial):null;
  let currentSpatialConfig=clone(spatialConfig||{});
  let currentCombat=activeCombat?clone(activeCombat):null;
  let currentCombatMessage='';
  let lastReconciledCombatKey=null;
  let currentEventPresentation=currentRuntime?.eventOrchestrator?.active?.eventState?clone(currentRuntime.eventOrchestrator.active.eventState):null;

  const notify=(out=null)=>onRoomRuntimeChange?.(currentRuntime,out);
  const reconcileCurrentCombat=()=>{
    const key=combatReconcileKey(currentCombat);
    if(!key||key===lastReconciledCombatKey) return null;
    const out=reconcileEndedDungeonCombat({combat:currentCombat,roomRuntime:currentRuntime,heroRuntimes:currentHeroRuntimes,universe:currentUniverse});
    if(!out.ok) return out;
    lastReconciledCombatKey=key;
    currentRuntime=out.roomRuntime;
    currentHeroRuntimes=clone(out.heroRuntimes||[]);
    notify(out);
    onCombatEnd?.(clone(currentCombat),out);
    return out;
  };

  const render=()=>{
    reconcileCurrentCombat();
    const roomId=currentRuntime?.currentRoomId||null;
    const roomLayout=roomId&&typeof layoutProvider==='function'?layoutProvider(roomId):null;
    host.innerHTML=renderDungeonGameplayView(currentUniverse,currentRuntime,{lootRecipients:currentLootRecipients,selectedLootRecipientKey:currentLootRecipientKey,roomLayout,eventPresentationState:currentEventPresentation,worldIndex:currentWorldIndex,conditionEvaluator,inventory:currentInventory,heroRuntimes:currentHeroRuntimes,activeCombat:currentCombat,combatMessage:currentCombatMessage});

    host.querySelector('[data-dungeon-hero-focus]')?.addEventListener('change',event=>{
      if(!currentRuntime) return;
      const previousRoomId=currentRuntime.currentRoomId;
      const out=setFocusedDungeonHero(currentRuntime,event.target.value);
      if(!out.ok) return;
      currentRuntime=out.runtime;
      if(String(previousRoomId)!==String(currentRuntime.currentRoomId)) currentEventPresentation=null;
      notify(out);
      render();
    });

    host.querySelector('[data-dungeon-start-combat]')?.addEventListener('click',()=>{
      if(!currentRuntime) return;
      const out=startDungeonCombat({
        roomRuntime:currentRuntime,
        heroRuntimes:currentHeroRuntimes,
        engagerHeroId:currentRuntime.focusedHeroId,
        universe:currentUniverse,
        spatial:currentSpatial,
        spatialConfig:currentSpatialConfig,
      });
      if(!out.ok) return;
      currentCombat=out.combat;
      currentCombatMessage='Combat engagé.';
      lastReconciledCombatKey=null;
      onCombatStart?.(clone(currentCombat),out);
      render();
    });

    host.querySelector('[data-dungeon-use-skill]')?.addEventListener('click',()=>{
      if(!currentCombat) return;
      const skillId=host.querySelector('[data-dungeon-combat-skill]')?.value||null;
      const targetId=host.querySelector('[data-dungeon-combat-target]')?.value||null;
      const out=executeDungeonHeroSkill({
        combat:currentCombat,
        heroRuntimes:currentHeroRuntimes,
        universe:currentUniverse,
        skillId,
        targetId,
        spatial:currentSpatial,
        spatialConfig:currentSpatialConfig,
      });
      if(!out.ok){currentCombatMessage=`Action refusée : ${out.reason}.`;render();return;}
      currentCombat=out.combat;
      const skill=(currentUniverse.skills||[]).find(entry=>String(entry.id)===String(out.skillId));
      currentCombatMessage=`${skill?.name||'Compétence'} : ${out.check?.success===false?'échec':'résolue'}${out.check?.roll!=null?` · jet ${out.check.roll}`:''}.`;
      onCombatChange?.(clone(currentCombat),out);
      render();
    });

    host.querySelectorAll('[data-dungeon-transition]').forEach(button=>button.addEventListener('click',()=>{
      if(!currentWorldIndex||!currentRuntime) return;
      const heroId=currentRuntime.focusedHeroId?String(currentRuntime.focusedHeroId):null;
      const transitionOptions={
        layoutProvider,
        conditionEvaluator,
        inventory:currentInventory,
        quests:questList(currentUniverse),
        questDefinitions:currentUniverse,
        questContext:{world:currentEventWorld},
      };
      const out=heroId&&currentRuntime.heroLocations?.[heroId]
        ?transitionDungeonHeroRoom(currentWorldIndex,currentRuntime,heroId,button.dataset.dungeonTransition,transitionOptions)
        :transitionDungeonRoom(currentWorldIndex,currentRuntime,button.dataset.dungeonTransition,transitionOptions);
      if(!out.ok) return;
      const previousRoomId=currentRuntime.currentRoomId;
      currentRuntime=out.runtime;
      if(String(previousRoomId)!==String(currentRuntime.currentRoomId)) currentEventPresentation=null;
      notify(out);
      render();
    }));

    host.querySelectorAll('[data-grant-dungeon-loot]').forEach(button=>button.addEventListener('click',()=>{
      const card=button.closest('[data-dungeon-loot]');
      const selectedKey=card?.querySelector('[data-loot-recipient]')?.value||null;
      const out=grantDungeonCreatureLoot(currentRuntime,button.dataset.grantDungeonLoot,currentLootRecipients,selectedKey,currentUniverse);
      if(!out.ok) return;
      currentRuntime=out.roomRuntime;
      currentLootRecipients=out.recipients;
      currentLootRecipientKey=out.selectedKey;
      notify(out);
      render();
    }));

    host.querySelectorAll('[data-dungeon-event-choice]').forEach(button=>button.addEventListener('click',()=>{
      const out=resolveRoomRuntimeEventChoice(currentRuntime,button.dataset.dungeonEventChoice,currentUniverse,{roomId:currentRuntime?.currentRoomId||null,world:currentEventWorld});
      if(!out.ok) return;
      currentRuntime=out.roomRuntime;
      currentEventWorld=out.world;
      if(out.eventState) currentEventPresentation=clone(out.eventState);
      notify(out);
      render();
    }));

    for(const interaction of roomNpcInteractions(roomLayout)){
      const npcHost=[...host.querySelectorAll('[data-dungeon-npc-body]')].find(node=>String(node.dataset.dungeonNpcBody)===String(interaction.id));
      if(!npcHost) continue;
      mountRoomNpcInteraction(npcHost,{
        roomRuntime:currentRuntime,
        roomId:currentRuntime?.currentRoomId,
        roomInteraction:interaction,
        definitions:currentUniverse,
        quests:questList(currentUniverse),
        roster:currentRuntime?.allyRoster||null,
        wallet:currentRuntime?.wallet||{},
        onRoomRuntimeChange(nextRuntime,out){currentRuntime=nextRuntime;notify(out);render();},
        onAllyStateChange(state){
          const next=clone(state.roomRuntime||currentRuntime||{});
          next.allyRoster=state.roster;
          next.wallet=state.wallet;
          currentRuntime=next;
        },
        onEventStateChange(eventState,out){
          if(eventState) currentEventPresentation=clone(eventState);
          if(out?.world) currentEventWorld=out.world;
          render();
        },
      });
    }
  };

  render();
  return {
    render,
    setRoomRuntime(nextRuntime){
      const previousRoomId=currentRuntime?.currentRoomId||null;
      currentRuntime=nextRuntime||null;
      if(previousRoomId&&String(previousRoomId)!==String(currentRuntime?.currentRoomId||'')) currentEventPresentation=null;
      if(currentRuntime?.eventOrchestrator?.active?.eventState) currentEventPresentation=clone(currentRuntime.eventOrchestrator.active.eventState);
      render();return currentRuntime;
    },
    setUniverse(nextUniverse){currentUniverse=nextUniverse||{};render();return currentUniverse;},
    setWorldIndex(nextWorldIndex){currentWorldIndex=nextWorldIndex||null;render();return currentWorldIndex;},
    setInventory(nextInventory){currentInventory=nextInventory||null;render();return currentInventory;},
    setHeroRuntimes(nextHeroes){currentHeroRuntimes=clone(nextHeroes||[]);render();return clone(currentHeroRuntimes);},
    setSpatial(nextSpatial,nextConfig=currentSpatialConfig){currentSpatial=nextSpatial?clone(nextSpatial):null;currentSpatialConfig=clone(nextConfig||{});render();return currentSpatial?clone(currentSpatial):null;},
    setCombat(nextCombat){currentCombat=nextCombat?clone(nextCombat):null;currentCombatMessage='';if(currentCombat?.phase!=='ended') lastReconciledCombatKey=null;render();return currentCombat?clone(currentCombat):null;},
    setLootRecipients(nextRecipients,selectedKey=currentLootRecipientKey){currentLootRecipients=clone(nextRecipients||[]);currentLootRecipientKey=selectedKey||null;render();return clone(currentLootRecipients);},
    setEventWorld(nextWorld){currentEventWorld=clone(nextWorld||{});render();return clone(currentEventWorld);},
    getRoomRuntime:()=>currentRuntime,
    getLootRecipients:()=>clone(currentLootRecipients),
    getHeroRuntimes:()=>clone(currentHeroRuntimes),
    getSpatial:()=>currentSpatial?clone(currentSpatial):null,
    getCombat:()=>currentCombat?clone(currentCombat):null,
    getEventWorld:()=>clone(currentEventWorld),
    getEventPresentation:()=>currentEventPresentation?clone(currentEventPresentation):null,
  };
}
