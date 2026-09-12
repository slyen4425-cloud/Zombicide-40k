import { focusedDungeonGridActions, executeFocusedDungeonGridAction } from './dungeon-grid-interactions.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function mountDungeonGridInteractionControls(host,{universe={},getRoomRuntime=()=>null,getHeroRuntimes=()=>[],getSpatial=()=>null,getCombat=()=>null,getInventory=()=>null,getRoomLayout=()=>null,onChange=null}={}){
  const board=host?.querySelector?.('.dungeon-board-section');
  if(!board) return {actions:[]};
  board.querySelector('[data-dungeon-grid-actions]')?.remove();
  const roomRuntime=getRoomRuntime();
  const roomLayout=getRoomLayout(roomRuntime?.currentRoomId||null);
  const actions=focusedDungeonGridActions({roomRuntime,heroRuntimes:getHeroRuntimes(),spatial:getSpatial(),roomLayout,activeCombat:getCombat()});
  const html=`<div class="dungeon-grid-actions" data-dungeon-grid-actions><strong>Interactions sur cette case</strong>${actions.length?`<div class="action-row">${actions.map(action=>`<button type="button" class="secondary-button" data-dungeon-grid-action="${esc(action.id)}">${esc(action.label)}${action.name?` · ${esc(action.name)}`:''}</button>`).join('')}</div>`:'<p class="muted">Aucune interaction disponible sur la case du héros.</p>'}<p class="combat-result" data-dungeon-grid-action-status aria-live="polite"></p></div>`;
  board.insertAdjacentHTML('beforeend',html);
  const status=board.querySelector('[data-dungeon-grid-action-status]');
  board.querySelectorAll('[data-dungeon-grid-action]').forEach(button=>button.addEventListener('click',()=>{
    const out=executeFocusedDungeonGridAction({roomRuntime:getRoomRuntime(),heroRuntimes:getHeroRuntimes(),spatial:getSpatial(),roomLayout:getRoomLayout(getRoomRuntime()?.currentRoomId||null),inventory:getInventory(),universe,activeCombat:getCombat(),actionId:button.dataset.dungeonGridAction});
    if(!out.ok){if(status) status.textContent=`Interaction refusée : ${out.reason}.`;return;}
    if(status) status.textContent=out.action?.kind==='door'?'Porte ouverte.':out.success===false?'Interaction échouée.':'Interaction réussie.';
    onChange?.(out);
  }));
  return {actions};
}
