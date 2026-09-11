function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`audio_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}

export const AUDIO_CHANNELS=['ui','music','ambience','voice','sfx','combat'];

export function createAudioDefinition({
  id=uid(),name='Nouveau son',src='',enabled=true,channel='sfx',loop=false,volume=1,delayMs=0,probability=100,tags=[],metadata={}
}={}){
  return {
    id:String(id),name:String(name||'Son'),src:String(src||''),enabled:enabled!==false,
    channel:AUDIO_CHANNELS.includes(channel)?channel:'sfx',loop:Boolean(loop),
    volume:Math.max(0,Math.min(1,Number(volume??1)||0)),delayMs:Math.max(0,Number(delayMs)||0),
    probability:Math.max(0,Math.min(100,Number(probability??100)||0)),tags:[...(tags||[])].map(String),metadata:clone(metadata||{}),
  };
}

export function validateAudioDefinition(definition){
  const errors=[];
  if(!definition?.id) errors.push({code:'missing-id'});
  if(!definition?.name) errors.push({code:'missing-name'});
  if(!definition?.src) errors.push({code:'missing-src'});
  if(!AUDIO_CHANNELS.includes(definition?.channel)) errors.push({code:'invalid-channel'});
  return {valid:errors.length===0,errors};
}

export function createAudioState({channelVolumes={},muted=false}={}){
  return {muted:Boolean(muted),channelVolumes:Object.fromEntries(AUDIO_CHANNELS.map(channel=>[channel,Math.max(0,Math.min(1,Number(channelVolumes?.[channel]??1)||0))])),playing:{},history:[],sequence:0};
}

export function resolveAudioRequest(audioId,definitions={},options={}){
  const definition=list(definitions,'audio').find(x=>String(x.id)===String(audioId));
  if(!definition||definition.enabled===false) return {ok:false,reason:'audio-missing'};
  const audio=createAudioDefinition({...definition,...options,id:definition.id,src:definition.src});
  const random=options.random||Math.random;
  if(Number(random())*100>=audio.probability) return {ok:false,reason:'probability'};
  return {ok:true,request:{id:uid(),audioId:audio.id,src:audio.src,channel:audio.channel,loop:audio.loop,volume:audio.volume,delayMs:audio.delayMs,metadata:clone(options.metadata||{})}};
}

export function queueAudio(state,audioId,definitions={},options={}){
  const resolved=resolveAudioRequest(audioId,definitions,options);
  if(!resolved.ok) return {ok:false,reason:resolved.reason,state};
  const next=clone(state||createAudioState());
  next.sequence=(Number(next.sequence)||0)+1;
  const request={...resolved.request,seq:next.sequence};
  next.history=[...(next.history||[]),{type:'queued',...clone(request)}];
  return {ok:true,state:next,request};
}

export function startAudio(state,request){
  const next=clone(state||createAudioState());
  if(!request?.id) return {ok:false,reason:'request-missing',state};
  if(next.muted) return {ok:false,reason:'muted',state:next};
  const channelVolume=Math.max(0,Math.min(1,Number(next.channelVolumes?.[request.channel]??1)||0));
  const started={...clone(request),effectiveVolume:Math.max(0,Math.min(1,Number(request.volume??1)||0))*channelVolume};
  next.playing=next.playing||{}; next.playing[String(request.id)]=started;
  next.history=[...(next.history||[]),{type:'started',requestId:String(request.id),audioId:String(request.audioId)}];
  return {ok:true,state:next,playback:started};
}

export function stopAudio(state,requestId){
  const next=clone(state||createAudioState());
  if(!next.playing?.[String(requestId)]) return {ok:false,reason:'not-playing',state};
  const audioId=next.playing[String(requestId)].audioId;
  delete next.playing[String(requestId)];
  next.history=[...(next.history||[]),{type:'stopped',requestId:String(requestId),audioId:String(audioId)}];
  return {ok:true,state:next};
}
