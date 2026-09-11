import { renderQuestJournal } from './quest-journal-ui.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function questList(universe={}){
  if(Array.isArray(universe.quests)) return universe.quests;
  return Object.values(universe.quests||{});
}

export function renderDungeonGameplayView(universe={},roomRuntime=null){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  const hasRuntime=Boolean(roomRuntime&&roomId);
  const activeEvent=roomRuntime?.eventOrchestrator?.active?.eventState||null;
  const eventStatus=activeEvent?.status==='waiting-choice'?'Choix en attente':activeEvent?'Événement en cours':'Aucun événement bloquant';
  return `<section class="workspace-head dungeon-gameplay-head"><div><p class="eyebrow">RPG · DONJON</p><h2>🎮 Partie Donjon</h2><p class="muted">${hasRuntime?`Salle actuelle : ${esc(roomId)} · ${esc(eventStatus)}`:'Aucune partie Donjon active.'}</p></div><button class="help-button" type="button" data-help="rpg-dungeon-gameplay">?</button></section><div class="dungeon-gameplay-grid"><section class="editor-section dungeon-gameplay-status"><h3>État de la partie</h3>${hasRuntime?`<p><strong>Salle :</strong> ${esc(roomId)}</p><p><strong>Visites :</strong> ${Number(roomRuntime.rooms?.[roomId]?.visits)||0}</p><p><strong>Événements en attente :</strong> ${(roomRuntime.eventQueue?.pending||[]).length}</p>`:'<p class="muted">Lance ou reprends une partie pour afficher l’état du donjon.</p>'}</section>${renderQuestJournal(questList(universe),roomRuntime?.questRuntime||null)}</div>`;
}

export function mountDungeonGameplayView(host,{universe={},roomRuntime=null}={}){
  let currentUniverse=universe||{};
  let currentRuntime=roomRuntime||null;
  const render=()=>{host.innerHTML=renderDungeonGameplayView(currentUniverse,currentRuntime);};
  render();
  return {
    render,
    setRoomRuntime(nextRuntime){currentRuntime=nextRuntime||null;render();return currentRuntime;},
    setUniverse(nextUniverse){currentUniverse=nextUniverse||{};render();return currentUniverse;},
    getRoomRuntime:()=>currentRuntime,
  };
}
