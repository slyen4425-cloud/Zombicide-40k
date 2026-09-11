import { transitionDungeonRoom } from './room-runtime.js';
import { queueRoomTransitionAudio } from './audio-runtime.js';

function byRoomId(index,roomId){
  return index?.rooms?.[String(roomId)]||null;
}

export function transitionDungeonRoomWithAudio({
  worldIndex,
  runtime,
  linkId,
  audioState,
  audioDefinitions={},
  layoutProvider=null,
  conditionEvaluator=null,
  audioOptions={},
}={}){
  const fromRoomId=String(runtime?.currentRoomId||'');
  const moved=transitionDungeonRoom(worldIndex,runtime,linkId,{layoutProvider,conditionEvaluator});
  if(!moved.ok) return {ok:false,reason:moved.reason,runtime,audioState,audio:null};

  const toRoomId=String(moved.runtime?.currentRoomId||'');
  const audio=queueRoomTransitionAudio({
    state:audioState,
    fromRoom:byRoomId(worldIndex,fromRoomId),
    toRoom:byRoomId(worldIndex,toRoomId),
    definitions:audioDefinitions,
    options:audioOptions,
  });

  return {
    ...moved,
    audioState:audio.state,
    audio,
    fromRoomId,
    toRoomId,
  };
}
