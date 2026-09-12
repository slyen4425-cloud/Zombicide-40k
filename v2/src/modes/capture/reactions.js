import {
  canUseCaptureReactionState,
  reactionStateFromCreature,
  spendCaptureReactionState,
} from './reaction-state.js';
import {evaluateCaptureReactionWindow,normalizeCaptureReactionWindow} from './reaction-window.js';

const clone=value=>structuredClone(value);

export const CAPTURE_REACTION_CONTRACT=Object.freeze({
  isolatedFromRpg:true,
  fixedDodgeFormula:false,
  fixedIFrames:false,
  evaluatorInjected:true,
  creatureOwnedConfiguration:true,
  perInstanceState:true,
  explicitReactionWindow:true,
  exactRealtimeTiming:'future_design_not_frozen',
});

export function normalizeCaptureReaction(def={}){
  return {
    id:String(def.id||''),
    type:String(def.type||'dodge'),
    enabled:def.enabled!==false,
    negatesEffect:def.negatesEffect!==false,
    cost:def.cost==null?null:Math.max(0,Number(def.cost)||0),
    cooldown:Math.max(0,Number(def.cooldown)||0),
    window:normalizeCaptureReactionWindow(def.window||def.metadata?.reactionWindow||{}),
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

export function resolveCaptureReaction({battle,action,ability,reactionDef=null,evaluator=null,reactionTime=null}={}){
  const targetSide=String(action?.targetSide||'opponent');
  const creature=battle?.[targetSide]?.creature||{};
  const configured=reactionDef||captureReactionFromCreature(creature);
  const reaction=normalizeCaptureReaction(configured||{});
  if(!reaction.id||!reaction.enabled) return {ok:true,triggered:false,reaction:null,reactionState:null,reactionWindow:null};

  const effectiveReactionTime=reactionTime??battle?.timing?.reactionTime??null;
  const window=evaluateCaptureReactionWindow(reaction.window,effectiveReactionTime);
  if(!window.ok) return {ok:true,triggered:false,reaction,reactionState:null,reactionWindow:window,reason:window.reason};
  if(!window.open) return {ok:true,triggered:false,reaction,reactionState:null,reactionWindow:window,reason:window.reason};

  const stored=battle?.[targetSide]?.reactionState?.[reaction.id]
    ?? reactionStateFromCreature(creature,reaction.id);
  const usable=canUseCaptureReactionState(stored,reaction);
  if(!usable.ok) return {ok:true,triggered:false,reaction,reactionState:usable.state,reactionWindow:window,reason:usable.reason};
  if(typeof evaluator!=='function') return {ok:true,triggered:false,reaction,reactionState:usable.state,reactionWindow:window,reason:'capture-reaction-evaluator-missing'};

  const evaluated=evaluator({battle:clone(battle),action:clone(action),ability:clone(ability),reaction:clone(reaction),reactionState:clone(usable.state),reactionWindow:clone(window)});
  if(evaluated?.ok===false) return {ok:false,reason:evaluated.reason||'capture-reaction-evaluation-failed',reaction,reactionState:usable.state,reactionWindow:window};
  const triggered=!!evaluated?.triggered;
  if(!triggered){
    return {
      ok:true,
      triggered:false,
      reaction,
      reactionState:usable.state,
      reactionWindow:window,
      outcome:evaluated?.outcome==null?null:clone(evaluated.outcome),
    };
  }

  const spent=spendCaptureReactionState(usable.state,reaction);
  if(!spent.ok) return {ok:true,triggered:false,reaction,reactionState:spent.state,reactionWindow:window,reason:spent.reason};
  return {
    ok:true,
    triggered:true,
    reaction,
    reactionState:spent.state,
    reactionWindow:window,
    outcome:evaluated?.outcome==null?null:clone(evaluated.outcome),
  };
}
