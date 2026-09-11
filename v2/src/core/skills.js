import { evaluateConditions } from './conditions.js';
import { applyEffect } from './effects.js';
import { resolveDefinedActorCheck } from './checks.js';

function clone(value){return structuredClone(value);}

export function ensureSkillRuntime(actorState={},skill={}){
  const next=clone(actorState);
  next.skillRuntime=next.skillRuntime||{};
  const id=String(skill.id||'');
  if(!next.skillRuntime[id]){
    next.skillRuntime[id]={
      cooldown:0,
      charges:skill.maxCharges==null?null:Math.max(0,Number(skill.maxCharges)||0),
    };
  }
  return next;
}

function conditionContext(actorState={},context={}){
  return {
    ...(context||{}),
    stats:actorState.stats||{},
    resources:actorState.resources||{},
    level:actorState.level??context.level,
    xp:actorState.xp??context.xp,
  };
}

export function skillAvailability(skill,actorState={},context={}){
  if(!skill||skill.enabled===false) return {ok:false,reason:'disabled',actorState};
  const prepared=ensureSkillRuntime(actorState,skill);
  const runtime=prepared.skillRuntime[String(skill.id)];
  if(runtime.cooldown>0) return {ok:false,reason:'cooldown',actorState:prepared};
  if(runtime.charges!=null&&runtime.charges<=0) return {ok:false,reason:'no-charges',actorState:prepared};
  const conditions=context.conditions||skill.conditions||[];
  if(!evaluateConditions(conditions,conditionContext(prepared,context),context.conditionMode||skill.conditionMode||'all')) return {ok:false,reason:'conditions',actorState:prepared};
  if(skill.costResourceId){
    const resource=prepared.resources?.[skill.costResourceId];
    const current=Number(resource?.current??resource??0);
    if(current<Math.max(0,Number(skill.costValue)||0)) return {ok:false,reason:'insufficient-resource',actorState:prepared};
  }
  return {ok:true,actorState:prepared};
}

export function consumeSkillUse(skill,actorState={}){
  let next=ensureSkillRuntime(actorState,skill);
  const runtime=next.skillRuntime[String(skill.id)];
  if(skill.costResourceId){
    next.resources=next.resources||{};
    const old=next.resources[skill.costResourceId]||{current:0,max:0};
    const current=Number(old.current??old)||0;
    next.resources[skill.costResourceId]={...((typeof old==='object'&&old)||{}),current:Math.max(0,current-Math.max(0,Number(skill.costValue)||0))};
  }
  if(runtime.charges!=null) runtime.charges=Math.max(0,runtime.charges-1);
  runtime.cooldown=Math.max(0,Number(skill.cooldown)||0);
  return next;
}

export function tickSkillCooldowns(actorState={},amount=1){
  const next=clone(actorState);
  next.skillRuntime=next.skillRuntime||{};
  const step=Math.max(0,Number(amount)||0);
  for(const runtime of Object.values(next.skillRuntime)) runtime.cooldown=Math.max(0,(Number(runtime.cooldown)||0)-step);
  return next;
}

export function recoverSkillCharges(actorState={},skills=[],rule='combat'){
  const next=clone(actorState);
  next.skillRuntime=next.skillRuntime||{};
  for(const skill of skills){
    if(skill.maxCharges==null||String(skill.recovery||'combat')!==String(rule)) continue;
    const id=String(skill.id);
    next.skillRuntime[id]=next.skillRuntime[id]||{cooldown:0,charges:0};
    next.skillRuntime[id].charges=Math.max(0,Number(skill.maxCharges)||0);
  }
  return next;
}

export function canUseSkill(skill,actorState={},context={}){
  const out=skillAvailability(skill,actorState,context);
  return {ok:out.ok,reason:out.reason};
}

export function resolveSkillUse(skill,actorState,targetState,definitions={},context={}){
  const conditions=(skill?.conditionIds||[]).map(id=>(definitions.conditions||[]).find(x=>String(x.id)===String(id))).filter(Boolean);
  const availability=skillAvailability(skill,actorState,{...context,conditions});
  if(!availability.ok) return {resolved:false,reason:availability.reason,actorState,targetState,check:null,log:[]};

  const actor=consumeSkillUse(skill,availability.actorState);
  const usesCheck=Boolean(skill?.checkId)||(skill?.roll?.enabled===true);
  let check=null;
  if(usesCheck){
    const checked=resolveDefinedActorCheck({
      checkId:skill.checkId||null,
      fallback:skill.roll?.enabled===true?skill.roll:null,
      definitions,
      actor:availability.actorState,
      random:context.random||Math.random,
      roll:context.roll??null,
    });
    if(!checked.ok) return {resolved:false,reason:checked.reason,actorState:actor,targetState,check:null,log:[]};
    check=checked.check;
    if(!check.success) return {resolved:true,success:false,actorState:actor,targetState:clone(targetState||{}),check,log:[{kind:'check',success:false,check}]};
  }

  let target=clone(targetState||{});
  const log=check?[{kind:'check',success:true,check}]:[];
  for(const effectId of skill.effectIds||[]){
    const effect=(definitions.effects||[]).find(x=>String(x.id)===String(effectId));
    if(!effect) continue;
    const applied=applyEffect(effect,target,definitions,context);
    if(applied.applied) target=applied.state;
    log.push({kind:'effect',effectId:String(effect.id),applied:applied.applied,reason:applied.reason||null});
  }
  return {resolved:true,success:true,actorState:actor,targetState:target,check,log};
}
