import { renderQuestJournal } from './quest-journal-ui.js';
import { renderLootRecipientPicker, grantCreatureLootToSelectedRecipient } from './loot-recipient-ui.js';
import { mountRoomNpcInteraction } from './room-npc-interaction-ui.js';
import { resolveRoomRuntimeEventChoice } from './room-event-runtime.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function questList(universe={}){
  if(Array.isArray(universe.quests)) return universe.quests;
  return Object.values(universe.quests||{});
}

function roomLootEntries(roomRuntime){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const room=roomId?roomRuntime?.rooms?.[roomId]:null;
  return (room?.entities||[]).filter(entity=>{
    const runtime=entity?.kind==='creature'?entity.data?.creatureRuntime:null;
    return runtime?.defeated&&runtime?.lootClaimed&&!runtime?.lootGranted&&(runtime?.lootDrops||[]).length;
  });
}

function roomNpcInteractions(layout){
  return (layout?.interactions||[]).filter(interaction=>interaction&&interaction.enabled!==false&&['npc','ally'].includes(String(interaction.kind)));
}

function renderEventChoice(roomRuntime){
  const active=roomRuntime?.eventOrchestrator?.active?.eventState||null;
  const waiting=active?.status==='waiting-choice'?active.waitingChoice:null;
  if(!waiting) return '';
  const choices=(waiting.choices||[]).map(choice=>`<button type="button" class="primary-button" data-dungeon-event-choice="${esc(choice.id)}">${esc(choice.label||'Choisir')}</button>`).join('');
  return `<section class="editor-section dungeon-event-choice"><div class="section-title-row"><div><h3>❗ Choix d’événement</h3><p class="muted">La partie attend ta décision avant de poursuivre.</p></div></div><div class="action-row">${choices||'<p class="muted">Aucun choix disponible.</p>'}</div></section>`;
}

function renderNpcSection(layout){
  const interactions=roomNpcInteractions(layout);
  if(!interactions.length) return '';
  return `<section class="editor-section dungeon-npc-section"><div class="section-title-row"><div><h3>💬 Personnages</h3><p class="muted">Interactions disponibles dans cette salle.</p></div></div><div class="editor-list">${interactions.map(interaction=>`<div class="editor-card compact" data-dungeon-npc-host="${esc(interaction.id)}"><strong>💬 ${esc(interaction.name||'Personnage')}</strong><div data-dungeon-npc-body="${esc(interaction.id)}"></div></div>`).join('')}</div></section>`;
}

function renderLootSection(roomRuntime,lootRecipients=[]){
  const entries=roomLootEntries(roomRuntime);
  if(!entries.length) return '';
  return `<section class="editor-section dungeon-loot-section"><div class="section-title-row"><div><h3>🎁 Butin à distribuer</h3><p class="muted">Choisis qui reçoit chaque butin. Une attribution validée ne peut pas être redirigée ensuite.</p></div></div><div class="editor-list">${entries.map(entity=>{
    const runtime=entity.data.creatureRuntime;
    const drops=(runtime.lootDrops||[]).map(drop=>`<span>${esc(drop.itemId)} × ${Math.max(1,Number(drop.quantity)||1)}</span>`).join(' · ');
    return `<article class="editor-card compact" data-dungeon-loot="${esc(entity.id)}"><div class="editor-card-head"><strong>Butin ennemi</strong><span class="status-pill">${drops}</span></div>${renderLootRecipientPicker(lootRecipients,null)}<button type="button" class="primary-button" data-grant-dungeon-loot="${esc(entity.id)}" ${lootRecipients.length?'':'disabled'}>Attribuer le butin</button></article>`;
  }).join('')}</div></section>`;
}

export function renderDungeonGameplayView(universe={},roomRuntime=null,{lootRecipients=[],roomLayout=null}={}){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const hasRuntime=Boolean(roomRuntime&&roomId);
  const activeEvent=roomRuntime?.eventOrchestrator?.active?.eventState||null;
  const eventStatus=activeEvent?.status==='waiting-choice'?'Choix en attente':activeEvent?'Événement en cours':'Aucun événement bloquant';
  return `<section class="workspace-head dungeon-gameplay-head"><div><p class="eyebrow">RPG · DONJON</p><h2>🎮 Partie Donjon</h2><p class="muted">${hasRuntime?`Salle actuelle : ${esc(roomId)} · ${esc(eventStatus)}`:'Aucune partie Donjon active.'}</p></div><button class="help-button" type="button" data-help="rpg-dungeon-gameplay">?</button></section><div class="dungeon-gameplay-grid"><section class="editor-section dungeon-gameplay-status"><h3>État de la partie</h3>${hasRuntime?`<p><strong>Salle :</strong> ${esc(roomId)}</p><p><strong>Visites :</strong> ${Number(roomRuntime.rooms?.[roomId]?.visits)||0}</p><p><strong>Événements en attente :</strong> ${(roomRuntime.eventQueue?.pending||[]).length}</p>`:'<p class="muted">Lance ou reprends une partie pour afficher l’état du donjon.</p>'}</section>${renderEventChoice(roomRuntime)}${renderNpcSection(roomLayout)}${renderLootSection(roomRuntime,lootRecipients)}${renderQuestJournal(questList(universe),roomRuntime?.questRuntime||null)}</div>`;
}

export function mountDungeonGameplayView(host,{universe={},roomRuntime=null,lootRecipients=[],layoutProvider=null,eventWorld={},onRoomRuntimeChange=null}={}){
  let currentUniverse=universe||{};
  let currentRuntime=roomRuntime||null;
  let currentLootRecipients=lootRecipients||[];
  let currentEventWorld=eventWorld||{};

  const notify=(out=null)=>onRoomRuntimeChange?.(currentRuntime,out);

  const render=()=>{
    const roomId=currentRuntime?.currentRoomId||null;
    const roomLayout=roomId&&typeof layoutProvider==='function'?layoutProvider(roomId):null;
    host.innerHTML=renderDungeonGameplayView(currentUniverse,currentRuntime,{lootRecipients:currentLootRecipients,roomLayout});

    host.querySelectorAll('[data-grant-dungeon-loot]').forEach(button=>button.addEventListener('click',()=>{
      const card=button.closest('[data-dungeon-loot]');
      const selectedKey=card?.querySelector('[data-loot-recipient]')?.value||null;
      const out=grantCreatureLootToSelectedRecipient(currentRuntime?.rooms?.[currentRuntime?.currentRoomId],button.dataset.grantDungeonLoot,currentLootRecipients,selectedKey,currentUniverse);
      if(!out.ok) return;
      const next=structuredClone(currentRuntime);
      next.rooms[next.currentRoomId]=out.roomRuntime;
      currentRuntime=next;
      currentLootRecipients=out.recipients;
      notify(out);
      render();
    }));

    host.querySelectorAll('[data-dungeon-event-choice]').forEach(button=>button.addEventListener('click',()=>{
      const out=resolveRoomRuntimeEventChoice(currentRuntime,button.dataset.dungeonEventChoice,currentUniverse,{roomId:currentRuntime?.currentRoomId||null,world:currentEventWorld});
      if(!out.ok) return;
      currentRuntime=out.roomRuntime;
      currentEventWorld=out.world;
      notify(out);
      render();
    }));

    for(const interaction of roomNpcInteractions(roomLayout)){
      const npcHost=host.querySelector(`[data-dungeon-npc-body="${CSS.escape(String(interaction.id))}"]`);
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
          const next=structuredClone(state.roomRuntime||currentRuntime||{});
          next.allyRoster=state.roster;
          next.wallet=state.wallet;
          currentRuntime=next;
        },
        onEventStateChange(eventState,out){if(out?.world) currentEventWorld=out.world;},
      });
    }
  };

  render();
  return {
    render,
    setRoomRuntime(nextRuntime){currentRuntime=nextRuntime||null;render();return currentRuntime;},
    setUniverse(nextUniverse){currentUniverse=nextUniverse||{};render();return currentUniverse;},
    setLootRecipients(nextRecipients){currentLootRecipients=nextRecipients||[];render();return currentLootRecipients;},
    setEventWorld(nextWorld){currentEventWorld=nextWorld||{};render();return currentEventWorld;},
    getRoomRuntime:()=>currentRuntime,
    getLootRecipients:()=>currentLootRecipients,
    getEventWorld:()=>currentEventWorld,
  };
}
