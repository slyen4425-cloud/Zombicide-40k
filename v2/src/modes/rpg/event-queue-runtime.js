function clone(value){return structuredClone(value);}

export function createEventQueueRuntime(){return {pending:[],history:[],sequence:0};}

function ensureQueue(queue){
  const next=clone(queue||createEventQueueRuntime());
  next.pending=Array.isArray(next.pending)?next.pending:[];
  next.history=Array.isArray(next.history)?next.history:[];
  next.sequence=Number(next.sequence)||0;
  return next;
}

export function enqueueEventRequest(queue,eventId,{source='gameplay',sourceId=null,metadata={}}={}){
  if(eventId==null||eventId==='') return {ok:false,reason:'event-missing',queue:ensureQueue(queue),request:null};
  const next=ensureQueue(queue);
  next.sequence+=1;
  const request={id:`event-request:${next.sequence}`,eventId:String(eventId),source:String(source||'gameplay'),sourceId:sourceId==null?null:String(sourceId),metadata:clone(metadata||{})};
  next.pending.push(request);
  next.history.push({type:'queued',...clone(request)});
  return {ok:true,queue:next,request:clone(request)};
}

export function dequeueEventRequest(queue){
  const next=ensureQueue(queue);
  if(!next.pending.length) return {ok:false,reason:'empty',queue:next,request:null};
  const request=next.pending.shift();
  next.history.push({type:'dequeued',...clone(request)});
  return {ok:true,queue:next,request:clone(request)};
}

export function peekEventRequest(queue){
  const next=ensureQueue(queue);
  return next.pending.length?clone(next.pending[0]):null;
}
