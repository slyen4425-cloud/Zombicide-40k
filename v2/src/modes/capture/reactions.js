const clone=value=>structuredClone(value);

export const CAPTURE_REACTION_CONTRACT=Object.freeze({
  isolatedFromRpg:true,
  fixedDodgeFormula:false,
  fixedIFrames:false,
  evaluatorInjected:true,
  exactRealtimeTiming:'future_design_not_frozen',
});

export function normalizeCaptureReaction(def={}){
  return {
    id:String(def.id||''),
    type:String(def.type||'dodge'),
    enabled:def.enabled!==false,
    negatesEffect:def.negatesEffect!==false,
    cost:def.cost==null?null:Math.max(0,Number(def.cost)||0),
    metadata:def.metadata==null?null:clone(def.metadata),
    source:def.source||'capture',
  };
}

export function resolveCaptureReaction({battle,action,ability,reactionDef,evaluator=null}={}){
  const reaction=normalizeCaptureReaction(reactionDef||{});
  if(!reaction.id||!reaction.enabled) return {ok:true,triggered:false,reaction:null};
  if(typeof evaluator!=='function') return {ok:true,triggered:false,reaction,reason:'capture-reaction-evaluator-missing'};
  const evaluated=evaluator({battle:clone(battle),action:clone(action),ability:clone(ability),reaction:clone(reaction)});
  if(evaluated?.ok===false) return {ok:false,reason:evaluated.reason||'capture-reaction-evaluation-failed',reaction};
  return {
    ok:true,
    triggered:!!evaluated?.triggered,
    reaction,
    outcome:evaluated?.outcome==null?null:clone(evaluated.outcome),
  };
}
