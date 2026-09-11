import { materializeRoomLayout } from './room-runtime.js';

export function resolveRuntimeRoomLayout(config={}){
  if(config?.roomLayout) return config.roomLayout;
  const base=config?.baseRoomLayout||config?.layout||null;
  if(!base) return null;
  const runtime=config?.dungeonRuntime||config?.roomRuntime||null;
  if(!runtime) return base;
  const roomId=config?.roomId||runtime?.currentRoomId||base?.roomId||null;
  if(!roomId) return base;
  return materializeRoomLayout(runtime,roomId,base);
}
