const clone=value=>structuredClone(value);

export const CAPTURE_REACTION_CONTRACT=Object.freeze({
  isolatedFromRpg:true,
  fixedDodgeFormula:false,
  fixedIFrames:false,
  evaluatorInjected:true,
  creatureOwnedConfiguration:true,
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

export function captureReactionFromCreature(creature={}){
  const candidates=Array.isArray(creature?.reactions)
    ? creature.reactions
    : creature?.reaction
      ? [creature.reaction]
      : [];
  for(const raw of candidates){
    const reaction=normalizeCaptureReaction(raw||{});
    if(reaction.id&&reaction.enabled) return reaction;
  }
  return null;
}

export function resolveCaptureReaction({battle,action,ability,reactionDef=null,evaluator=null}={}){
  const targetSide=String(action?.targetSide||'opponent');
  const configured=reactionDef||captureReactionFromCreature(battle?.[targetSide]?.creature||{});
  const reaction=normalizeCaptureReaction(configured||{});
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
