import { getActorPosition } from './spatial-engine.js';
import { interactionsAtCell } from './interaction-engine.js';
import { attemptRoomInteraction, openRoomDoor, updateRoomInteractionState } from './room-runtime.js';

function clone(value){return structuredClone(value);}
function list(source){return Array.isArray(source)?source:Object.values(source||{});}
function heroRuntimeFor(heroRuntimes,heroId){return list(heroRuntimes).find(hero=>String(hero?.instanceId||hero?.heroId||'')===String(heroId))||null;}

export const DUNGEON_GRID_INTERACTION_CONTRACT=Object.freeze({
  sameCellRequired:true,
  usesRuntimeDoorState:true,
  usesRoomInteractionEngine:true,
  outsideCombatOnly:true,
  mutatesDefinitions:false,
});

export function focusedDungeonGridActions({roomRuntime=null,heroRuntimes=[],spatial=null,roomLayout=null,activeCombat=null}={}){
  if(!roomRuntime?.currentRoomId||!roomRuntime?.focusedHeroId||!roomLayout) return [];
  if(activeCombat&&activeCombat.phase!=='ended') return [];
  const heroId=String(roomRuntime.focusedHeroId);
  const hero=heroRuntimeFor(heroRuntimes,heroId);
  if(!hero||hero.ko||hero.dead||hero.active===false) return [];
  const activeSpatial=spatial||roomRuntime.spatial||null;
  const pos=getActorPosition(activeSpatial,heroId);
  if(!pos) return [];

  const actions=[];
  for(const door of roomLayout.doors||[]){
    if(Number(door.x)!==Number(pos.x)||Number(door.y)!==Number(pos.y)) continue;
    if(String(door.state||'closed')==='open'&&!door.locked) continue;
    actions.push({id:`door:${door.id}`,kind:'door',targetId:String(door.id),label:door.locked?'Déverrouiller la porte':'Ouvrir la porte',x:Number(pos.x),y:Number(pos.y)});
  }

  for(const interaction of interactionsAtCell(roomLayout,pos.x,pos.y)){
    const state=roomRuntime.rooms?.[String(roomRuntime.currentRoomId)]?.interactions?.[String(interaction.id)]||null;
    if(state?.completed) continue;
    const labels={chest:'Fouiller le coffre',trap:'Examiner le piège',puzzle:'Résoudre l’énigme',event:'Interagir',switch:'Activer',portal:'Utiliser le portail',object:'Examiner',npc:'Parler',ally:'Interagir'};
    actions.push({id:`interaction:${interaction.id}`,kind:'interaction',interactionKind:String(interaction.kind||'object'),targetId:String(interaction.id),label:labels[interaction.kind]||'Interagir',name:String(interaction.name||'Interaction'),x:Number(pos.x),y:Number(pos.y)});
  }
  return actions;
}

export function executeFocusedDungeonGridAction({roomRuntime=null,heroRuntimes=[],spatial=null,roomLayout=null,inventory=null,universe={},activeCombat=null,actionId=null,random=Math.random,roll=null}={}){
  const actions=focusedDungeonGridActions({roomRuntime,heroRuntimes,spatial,roomLayout,activeCombat});
  const action=actions.find(entry=>String(entry.id)===String(actionId));
  if(!action) return {ok:false,reason:'dungeon-grid-action-unavailable',roomRuntime,inventory};
  const heroId=String(roomRuntime.focusedHeroId);
  const hero=heroRuntimeFor(heroRuntimes,heroId);
  if(action.kind==='door'){
    const out=openRoomDoor(roomRuntime,roomRuntime.currentRoomId,action.targetId,inventory,{consumeKey:false});
    return {...out,action:clone(action),heroId};
  }
  const interaction=(roomLayout.interactions||[]).find(entry=>String(entry.id)===String(action.targetId));
  if(!interaction) return {ok:false,reason:'interaction-missing',roomRuntime,inventory,action:clone(action),heroId};
  let out=attemptRoomInteraction(roomRuntime,roomRuntime.currentRoomId,interaction,hero,{definitions:universe,random,roll,quests:universe.quests||[],questDefinitions:universe});
  if(!out.ok) return {...out,inventory,action:clone(action),heroId};
  let nextRuntime=out.runtime;
  if(out.success&&interaction.kind==='chest'){
    const marked=updateRoomInteractionState(nextRuntime,roomRuntime.currentRoomId,interaction.id,{opened:true,completed:true});
    if(marked.ok) nextRuntime=marked.runtime;
  }
  return {...out,runtime:nextRuntime,roomRuntime:nextRuntime,inventory,action:clone(action),heroId};
}
