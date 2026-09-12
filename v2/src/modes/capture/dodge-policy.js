const clone=value=>structuredClone(value);

export const CAPTURE_DODGE_POLICY_CONTRACT=Object.freeze({
  dataDriven:true,
  fixedGlobalChance:false,
  deterministicWithInjectedRoll:true,
  universalFormula:false,
  isolatedFromRpg:true,
});

export function normalizeCaptureDodgePolicy(def={}){
  const rawChance=def.chancePercent;
  const chancePercent=rawChance==null?null:Math.min(100,Math.max(0,Number(rawChance)||0));
  return {
    mode:String(def.mode||'chance'),
    chancePercent,
    enabled:def.enabled!==false,
    tags:Array.isArray(def.tags)?def.tags.map(String):[],
    metadata:def.metadata==null?null:clone(def.metadata),
  };
}

export function createCaptureDodgeEvaluator({rng=Math.random}={}){
  return ({reaction}={})=>{
    const policy=normalizeCaptureDodgePolicy(reaction?.metadata?.dodgePolicy||{});
    if(reaction?.type!=='dodge') return {ok:true,triggered:false,outcome:{reason:'not-dodge-reaction'}};
    if(!policy.enabled) return {ok:true,triggered:false,outcome:{reason:'dodge-policy-disabled',policy}};
    if(policy.mode!=='chance') return {ok:false,reason:'capture-dodge-policy-mode-unsupported'};
    if(policy.chancePercent==null) return {ok:true,triggered:false,outcome:{reason:'dodge-chance-unconfigured',policy}};
    const roll=Math.min(0.999999999,Math.max(0,Number(rng())||0));
    const rollPercent=roll*100;
    return {
      ok:true,
      triggered:rollPercent<policy.chancePercent,
      outcome:{policy,rollPercent},
    };
  };
}
