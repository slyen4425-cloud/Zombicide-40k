import { dungeonCombatMovementState, moveActiveDungeonHeroInCombat } from './dungeon-combat-movement.js';
import { patchCombatTargetUiContext, syncDungeonCombatTargetControls } from './combat-target-ui.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function tacticalTargetConfig({roomRuntime,getSpatialConfig,getRoomLayout}={}){
  const roomId=roomRuntime?.currentRoomId||null;
  return {
    ...(getSpatialConfig?.()||{}),
    roomLayout:roomId?getRoomLayout?.(roomId)||null:null,
    roomRuntime:roomRuntime||null,
    roomId:roomId||null,
  };
}

function syncTargets(root,{combat,spatial,roomRuntime,getSpatialConfig,getRoomLayout}={}){
  patchCombatTargetUiContext({combat,spatial,config:tacticalTargetConfig({roomRuntime,getSpatialConfig,getRoomLayout})});
  return syncDungeonCombatTargetControls(root);
}

export function mountDungeonCombatMovementUi(root,{getCombat,getRoomRuntime,getHeroRuntimes,getSpatial,getSpatialConfig,getRoomLayout,onMove}={}){
  if(!root?.querySelectorAll) return {mounted:false,reason:'root-missing'};
  const combat=getCombat?.()||null;
  const heroRuntimes=getHeroRuntimes?.()||[];
  const roomRuntime=getRoomRuntime?.()||null;
  const spatial=getSpatial?.()||roomRuntime?.spatial||null;
  const state=dungeonCombatMovementState({combat,heroRuntimes,spatialConfig:getSpatialConfig?.()||{}});
  syncTargets(root,{combat,spatial,roomRuntime,getSpatialConfig,getRoomLayout});
  const board=root.querySelector('.dungeon-board-section');
  if(!board||!state.enabled) return {mounted:false,reason:state.reason||'board-missing',movement:state};

  let status=board.querySelector('[data-dungeon-combat-move-status]');
  if(!status){
    status=document.createElement('div');
    status.className='dungeon-combat-move-status';
    status.setAttribute('data-dungeon-combat-move-status','');
    board.append(status);
  }
  status.innerHTML=`<strong>👣 Déplacement tactique</strong><span>${state.remaining} / ${state.allowance} case${state.allowance>1?'s':''} restante${state.remaining>1?'s':''}</span>`;

  const move=cell=>{
    const raw=String(cell?.dataset?.dungeonBoardCell||'');
    const [xRaw,yRaw]=raw.split(',');
    const liveRuntime=getRoomRuntime?.()||roomRuntime;
    const out=moveActiveDungeonHeroInCombat({
      combat:getCombat?.()||combat,
      roomRuntime:liveRuntime,
      heroRuntimes:getHeroRuntimes?.()||heroRuntimes,
      spatial:getSpatial?.()||liveRuntime?.spatial||spatial,
      roomLayout:getRoomLayout?.(liveRuntime?.currentRoomId)||null,
      target:{x:Number(xRaw),y:Number(yRaw)},
      spatialConfig:getSpatialConfig?.()||{},
    });
    if(!out.ok){
      status.innerHTML=`<strong>👣 Déplacement tactique</strong><span>Refusé : ${esc(out.reason)}.</span>`;
      return;
    }
    syncTargets(root,{combat:out.combat,spatial:out.spatial,roomRuntime:out.roomRuntime||liveRuntime,getSpatialConfig,getRoomLayout});
    onMove?.(out);
  };

  root.querySelectorAll('[data-dungeon-board-cell]').forEach(cell=>{
    cell.classList.add('dungeon-combat-move-target');
    cell.setAttribute('role','button');
    cell.tabIndex=0;
    cell.addEventListener('click',()=>move(cell));
    cell.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();move(cell);}});
  });
  return {mounted:true,reason:null,movement:state};
}
