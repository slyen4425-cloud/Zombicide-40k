function clamp01(value){const n=Number(value);return Math.max(0,Math.min(1,Number.isFinite(n)?n:1));}

export function createBrowserAudioOutput({
  audioFactory=src=>new Audio(src),
  setTimeoutFn=(fn,ms)=>setTimeout(fn,ms),
  clearTimeoutFn=id=>clearTimeout(id),
}={}){
  const active=new Map();

  function stop(requestId){
    const id=String(requestId||'');
    const entry=active.get(id);
    if(!entry) return {ok:false,reason:'not-active'};
    if(entry.timer!=null) clearTimeoutFn(entry.timer);
    if(entry.element){
      try{entry.element.pause?.();}catch{}
      try{entry.element.currentTime=0;}catch{}
    }
    active.delete(id);
    return {ok:true,requestId:id};
  }

  function play(request={}){
    if(!request?.id||!request?.src) return {ok:false,reason:'invalid-request'};
    const id=String(request.id);
    if(active.has(id)) stop(id);
    const element=audioFactory(String(request.src));
    if(!element) return {ok:false,reason:'audio-element-missing'};
    element.loop=Boolean(request.loop);
    element.volume=clamp01(request.effectiveVolume??request.volume??1);
    const entry={request:{...request,id},element,timer:null,channel:String(request.channel||'sfx')};
    const start=()=>{
      entry.timer=null;
      try{
        const result=element.play?.();
        if(result&&typeof result.catch==='function') result.catch(()=>{});
      }catch{}
    };
    const delay=Math.max(0,Number(request.delayMs)||0);
    if(delay>0) entry.timer=setTimeoutFn(start,delay); else start();
    active.set(id,entry);
    return {ok:true,requestId:id};
  }

  function stopChannel(channel){
    const target=String(channel||'');
    const stopped=[];
    for(const [requestId,entry] of [...active.entries()]){
      if(entry.channel!==target) continue;
      if(stop(requestId).ok) stopped.push(requestId);
    }
    return {ok:true,channel:target,stopped};
  }

  function dispose(){
    const stopped=[];
    for(const requestId of [...active.keys()]) if(stop(requestId).ok) stopped.push(requestId);
    return {ok:true,stopped};
  }

  function activeRequests(){return [...active.values()].map(entry=>({...entry.request}));}

  return {play,stop,stopChannel,dispose,activeRequests};
}
