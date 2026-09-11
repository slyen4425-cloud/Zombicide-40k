function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

function normalizeAnswer(value,{caseSensitive=false,trim=true}={}){
  let out=String(value??'');
  if(trim) out=out.trim();
  if(!caseSensitive) out=out.toLocaleLowerCase('fr-FR');
  return out;
}

export function createPuzzleDefinition({
  id:puzzleId=uid(),
  name='Nouvelle énigme',
  prompt='',
  enabled=true,
  answers=[],
  hints=[],
  caseSensitive=false,
  trimAnswer=true,
  maxAttempts=null,
  penaltyEffectIds=[],
  failureEventId=null,
  successEventId=null,
  audioId=null,
}={}){
  return {
    id:String(puzzleId),
    name:String(name||'Énigme'),
    prompt:String(prompt||''),
    enabled:enabled!==false,
    answers:[...(answers||[])].map(String).filter(Boolean),
    hints:[...(hints||[])].map(String).filter(Boolean),
    caseSensitive:Boolean(caseSensitive),
    trimAnswer:trimAnswer!==false,
    maxAttempts:maxAttempts==null?null:Math.max(1,Math.floor(Number(maxAttempts)||1)),
    penaltyEffectIds:[...(penaltyEffectIds||[])].map(String),
    failureEventId:failureEventId?String(failureEventId):null,
    successEventId:successEventId?String(successEventId):null,
    audioId:audioId?String(audioId):null,
  };
}

export function createPuzzleState(definition){
  const def=createPuzzleDefinition(definition||{});
  return {
    puzzleId:def.id,
    enabled:def.enabled,
    solved:false,
    failed:false,
    attempts:0,
    revealedHints:0,
    lastAnswer:null,
    completedAtAttempt:null,
  };
}

export function revealPuzzleHint(definition,state){
  const def=createPuzzleDefinition(definition||{});
  const next=clone(state||createPuzzleState(def));
  if(!next.enabled) return {ok:false,reason:'disabled',state:next,hint:null};
  if(next.solved) return {ok:false,reason:'already-solved',state:next,hint:null};
  if(next.revealedHints>=def.hints.length) return {ok:false,reason:'no-more-hints',state:next,hint:null};
  const hint=def.hints[next.revealedHints];
  next.revealedHints+=1;
  return {ok:true,state:next,hint,index:next.revealedHints-1};
}

export function submitPuzzleAnswer(definition,state,answer){
  const def=createPuzzleDefinition(definition||{});
  const next=clone(state||createPuzzleState(def));
  if(!next.enabled) return {ok:false,reason:'disabled',state:next};
  if(next.solved) return {ok:false,reason:'already-solved',state:next};
  if(next.failed) return {ok:false,reason:'already-failed',state:next};
  if(!def.answers.length) return {ok:false,reason:'no-answers-configured',state:next};

  next.attempts=(Number(next.attempts)||0)+1;
  next.lastAnswer=String(answer??'');
  const options={caseSensitive:def.caseSensitive,trim:def.trimAnswer};
  const submitted=normalizeAnswer(answer,options);
  const correct=def.answers.some(candidate=>normalizeAnswer(candidate,options)===submitted);

  if(correct){
    next.solved=true;
    next.completedAtAttempt=next.attempts;
    return {
      ok:true,
      correct:true,
      state:next,
      effectIds:[],
      eventId:def.successEventId,
      audioId:def.audioId,
    };
  }

  if(def.maxAttempts!=null&&next.attempts>=def.maxAttempts) next.failed=true;
  return {
    ok:true,
    correct:false,
    state:next,
    effectIds:[...def.penaltyEffectIds],
    eventId:next.failed?def.failureEventId:null,
    audioId:null,
    attemptsRemaining:def.maxAttempts==null?null:Math.max(0,def.maxAttempts-next.attempts),
  };
}

export function puzzleProgress(definition,state){
  const def=createPuzzleDefinition(definition||{});
  const current=state||createPuzzleState(def);
  return {
    solved:Boolean(current.solved),
    failed:Boolean(current.failed),
    attempts:Number(current.attempts)||0,
    maxAttempts:def.maxAttempts,
    revealedHints:Number(current.revealedHints)||0,
    totalHints:def.hints.length,
    nextHintAvailable:!current.solved&&!current.failed&&(Number(current.revealedHints)||0)<def.hints.length,
  };
}
