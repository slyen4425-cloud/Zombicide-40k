import {getActorPosition} from '../../core/spatial-engine.js';
import {moveCaptureBattleCreature} from './capture.js';

const clone=value=>structuredClone(value);

export const CAPTURE_PLAYER_MOVE_ACTION_CONTRACT=Object.freeze({
  usesAuthoritativeBattleMove:true,
  readsAuthoritativePlayerPosition:true,
  cardinalStepOnly:true,
  oneCellPerCommand:true,
  diagonal:false,
  neverUsesRpgRuntime:true,
});

const OFFSETS=Object.freeze({
  up:{x:0,y:-1},
  down:{x:0,y:1},
  left:{x:-1,y:0},
  right:{x:1,y:0},
});

export function executeCapturePlayerMove(state,{direction}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  if(state.battle.status!=='active') return {ok:false,reason:'battle-not-active',state};
  if(state.battle.player?.vitals?.ko) return {ok:false,reason:'capture-actor-ko',state};
  const offset=OFFSETS[String(direction||'')]||null;
  if(!offset) return {ok:false,reason:'capture-move-direction-invalid',state};
  const actorId=state.battle.player?.actorId;
  const current=actorId?getActorPosition(state.battle.spatial,actorId):null;
  if(!current) return {ok:false,reason:'capture-player-position-missing',state};
  const target={
    x:Number(current.x)+offset.x,
    y:Number(current.y)+offset.y,
    zoneId:current.zoneId,
  };
  const moved=moveCaptureBattleCreature(state,'player',target,{movement:1,diagonal:false});
  if(!moved.ok) return moved;
  return {...moved,direction:String(direction),from:clone(current),to:clone(target)};
}
