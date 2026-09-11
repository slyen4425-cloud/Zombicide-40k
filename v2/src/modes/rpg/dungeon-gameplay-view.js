import { renderQuestJournal } from './quest-journal-ui.js';
import { renderLootRecipientPicker, findLootRecipient, grantCreatureLootToSelectedRecipient } from './loot-recipient-ui.js';

function clone(value){return structuredClone(value);}
function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function questList(universe={}){
  if(Array.isArray(universe.quests)) return universe.quests;
  return Object.values(universe.quests||{});
}

export function dungeonLootEntries(roomRuntime=null){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const room=roomId?roomRuntime?.rooms?.[roomId]:null;
  if(!room) return [];
  return (room.entities||[]).filter(entity=>{
    const creature=entity?.data?.creatureRuntime;
    return entity?.kind==='creature'&&Boolean(creature?.defeated)&&Boolean(creature?.lootClaimed)&&!creature?.lootGranted;
  }).map(entity=>({
    instanceId:String(entity.id),
    creatureId:entity.data.creatureRuntime?.creatureId==null?null:String(entity.data.creatureRuntime.creatureId),
    dropCount:(entity.data.creatureRuntime?.lootDrops||[]).reduce((sum,drop)=>sum+Math.max(0,Number(drop.quantity)||0),0),
  }));
}

export function grantDungeonCreatureLoot(roomRuntime,instanceId,recipients=[],selectedKey=null,definitions={}){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const room=roomId?roomRuntime?.rooms?.[roomId]:null;
  if(!room) return {ok:false,reason:'room-not-instantiated',roomRuntime,recipients,recipient:null,drops:[]};
  const granted=grantCreatureLootToSelectedRecipient(room,instanceId,recipients,selectedKey,definitions);
  if(!granted.ok) return {...granted,roomRuntime};
  const next=clone(roomRuntime);
  next.rooms=next.rooms||{};
  next.rooms[roomId]=clone(granted.roomRuntime);
  return {...granted,roomRuntime:next};
}

function renderLootSection(roomRuntime,recipients=[],selectedKey=null){
  const entries=dungeonLootEntries(roomRuntime);
  if(!entries.length) return '<section class="editor-section dungeon-loot"><h3>🎁 Butin</h3><p class="muted">Aucun butin à distribuer.</p></section>';
  const recipient=findLootRecipient(recipients,selectedKey);
  return `<section class="editor-section dungeon-loot"><div class="section-title-row"><div><h3>🎁 Butin</h3><p class="muted">Choisis qui reçoit le butin. Un butin déjà attribué ne peut pas être redirigé.</p></div><button class="help-button" type="button" data-help="rpg-dungeon-loot">?</button></div>${renderLootRecipientPicker(recipients,recipient?`${recipient.kind}:${recipient.id==null?'':recipient.id}`:null)}<div class="editor-list">${entries.map((entry,index)=>`<article class="editor-card compact"><div class="editor-card-head"><div><strong>Butin ${index+1}</strong><p class="muted">${entry.dropCount} objet(s) à récupérer</p></div><button class="primary-button" type="button" data-dungeon-loot="${esc(entry.instanceId)}" ${recipient?'':'disabled'}>Donner le butin</button></div></article>`).join('')}</div></section>`;
}

export function renderDungeonGameplayView(universe={},roomRuntime=null,{lootRecipients=[],selectedLootRecipientKey=null}={}){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const hasRuntime=Boolean(roomRuntime&&roomId);
  const activeEvent=roomRuntime?.eventOrchestrator?.active?.eventState||null;
  const eventStatus=activeEvent?.status==='waiting-choice'?'Choix en attente':activeEvent?'Événement en cours':'Aucun événement bloquant';
  return `<section class="workspace-head dungeon-gameplay-head"><div><p class="eyebrow">RPG · DONJON</p><h2>🎮 Partie Donjon</h2><p class="muted">${hasRuntime?`Salle actuelle : ${esc(roomId)} · ${esc(eventStatus)}`:'Aucune partie Donjon active.'}</p></div><button class="help-button" type="button" data-help="rpg-dungeon-gameplay">?</button></section><div class="dungeon-gameplay-grid"><section class="editor-section dungeon-gameplay-status"><h3>État de la partie</h3>${hasRuntime?`<p><strong>Salle :</strong> ${esc(roomId)}</p><p><strong>Visites :</strong> ${Number(roomRuntime.rooms?.[roomId]?.visits)||0}</p><p><strong>Événements en attente :</strong> ${(roomRuntime.eventQueue?.pending||[]).length}</p>`:'<p class="muted">Lance ou reprends une partie pour afficher l’état du donjon.</p>'}</section>${renderLootSection(roomRuntime,lootRecipients,selectedLootRecipientKey)}${renderQuestJournal(questList(universe),roomRuntime?.questRuntime||null)}</div>`;
}

export function mountDungeonGameplayView(host,{universe={},roomRuntime=null,lootRecipients=[],selectedLootRecipientKey=null,onLootGranted=null}={}){
  let currentUniverse=universe||{};
  let currentRuntime=roomRuntime||null;
  let currentRecipients=clone(lootRecipients||[]);
  let currentSelectedKey=selectedLootRecipientKey||null;
  const render=()=>{
    host.innerHTML=renderDungeonGameplayView(currentUniverse,currentRuntime,{lootRecipients:currentRecipients,selectedLootRecipientKey:currentSelectedKey});
    host.querySelector('[data-loot-recipient]')?.addEventListener('change',event=>{currentSelectedKey=event.target.value||null;});
    host.querySelectorAll('[data-dungeon-loot]').forEach(button=>button.addEventListener('click',()=>{
      const out=grantDungeonCreatureLoot(currentRuntime,button.dataset.dungeonLoot,currentRecipients,currentSelectedKey,currentUniverse);
      if(!out.ok) return;
      currentRuntime=out.roomRuntime;
      currentRecipients=out.recipients;
      currentSelectedKey=out.selectedKey;
      onLootGranted?.({roomRuntime:currentRuntime,recipients:clone(currentRecipients),selectedKey:currentSelectedKey},out);
      render();
    }));
  };
  render();
  return {
    render,
    setRoomRuntime(nextRuntime){currentRuntime=nextRuntime||null;render();return currentRuntime;},
    setUniverse(nextUniverse){currentUniverse=nextUniverse||{};render();return currentUniverse;},
    setLootRecipients(nextRecipients,selectedKey=currentSelectedKey){currentRecipients=clone(nextRecipients||[]);currentSelectedKey=selectedKey||null;render();return clone(currentRecipients);},
    getRoomRuntime:()=>currentRuntime,
    getLootRecipients:()=>clone(currentRecipients),
  };
}
