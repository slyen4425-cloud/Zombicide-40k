function clone(value){return structuredClone(value);}

export function createProgressionConfig({
  enabled=true,maxLevel=null,curve={kind:'linear',baseXp:10,stepXp:0},skillPointsPerLevel=1,statPointsPerLevel=0,
  levelUpEventId=null,healOnLevelUp=false,healResourceId=null
}={}){
  return {
    enabled:enabled!==false,maxLevel:maxLevel==null?null:Math.max(1,Math.floor(Number(maxLevel)||1)),
    curve:normalizeCurve(curve),skillPointsPerLevel:Math.max(0,Number(skillPointsPerLevel)||0),
    statPointsPerLevel:Math.max(0,Number(statPointsPerLevel)||0),levelUpEventId:levelUpEventId==null?null:String(levelUpEventId),
    healOnLevelUp:Boolean(healOnLevelUp),healResourceId:healResourceId==null?null:String(healResourceId),
  };
}

export function normalizeCurve(curve={}){
  const kind=['linear','table'].includes(curve?.kind)?curve.kind:'linear';
  if(kind==='table'){
    const thresholds=[...(curve.thresholds||[])].map(v=>Math.max(0,Number(v)||0)).sort((a,b)=>a-b);
    return {kind,thresholds};
  }
  return {kind:'linear',baseXp:Math.max(1,Number(curve?.baseXp)||10),stepXp:Math.max(0,Number(curve?.stepXp)||0)};
}

export function createProgressionState({level=1,xp=0,skillPoints=0,statPoints=0}={}){
  return {level:Math.max(1,Math.floor(Number(level)||1)),xp:Math.max(0,Number(xp)||0),skillPoints:Math.max(0,Number(skillPoints)||0),statPoints:Math.max(0,Number(statPoints)||0),history:[]};
}

export function xpRequiredForLevel(level,config={}){
  const cfg=createProgressionConfig(config); const target=Math.max(2,Math.floor(Number(level)||2));
  if(cfg.curve.kind==='table') return Number(cfg.curve.thresholds[target-2]??Infinity);
  const n=target-1;
  let total=0;
  for(let i=1;i<=n;i++) total+=cfg.curve.baseXp+cfg.curve.stepXp*(i-1);
  return total;
}

export function levelForXp(xp,config={}){
  const cfg=createProgressionConfig(config); const totalXp=Math.max(0,Number(xp)||0);
  let level=1;
  while(true){
    if(cfg.maxLevel!=null&&level>=cfg.maxLevel) break;
    const next=level+1; const required=xpRequiredForLevel(next,cfg);
    if(!Number.isFinite(required)||totalXp<required) break;
    level=next;
    if(level>10000) break;
  }
  return level;
}

export function grantXp(state,amount,config={},{source=null}={}){
  const cfg=createProgressionConfig(config); if(!cfg.enabled) return {ok:false,reason:'disabled',state};
  const gained=Math.max(0,Number(amount)||0); if(gained<=0) return {ok:false,reason:'invalid-xp',state};
  const next=clone(state||createProgressionState()); next.history=Array.isArray(next.history)?next.history:[];
  const previousLevel=Math.max(1,Number(next.level)||1); next.xp=Math.max(0,Number(next.xp)||0)+gained;
  const newLevel=levelForXp(next.xp,cfg); const levelsGained=Math.max(0,newLevel-previousLevel); next.level=newLevel;
  next.skillPoints=Math.max(0,Number(next.skillPoints)||0)+levelsGained*cfg.skillPointsPerLevel;
  next.statPoints=Math.max(0,Number(next.statPoints)||0)+levelsGained*cfg.statPointsPerLevel;
  next.history.push({type:'xp',amount:gained,source,fromLevel:previousLevel,toLevel:newLevel});
  const levelUps=[];
  for(let level=previousLevel+1;level<=newLevel;level++) levelUps.push({
    level,skillPoints:cfg.skillPointsPerLevel,statPoints:cfg.statPointsPerLevel,
    eventId:cfg.levelUpEventId,heal:cfg.healOnLevelUp?{resourceId:cfg.healResourceId}:null,
  });
  return {ok:true,state:next,gainedXp:gained,levelsGained,levelUps};
}

export function spendSkillPoints(state,amount=1){
  const cost=Math.max(0,Number(amount)||0); if(cost<=0) return {ok:false,reason:'invalid-cost',state};
  if(Number(state?.skillPoints||0)<cost) return {ok:false,reason:'not-enough-skill-points',state};
  const next=clone(state); next.skillPoints-=cost; return {ok:true,state:next};
}

export function spendStatPoints(state,amount=1){
  const cost=Math.max(0,Number(amount)||0); if(cost<=0) return {ok:false,reason:'invalid-cost',state};
  if(Number(state?.statPoints||0)<cost) return {ok:false,reason:'not-enough-stat-points',state};
  const next=clone(state); next.statPoints-=cost; return {ok:true,state:next};
}

export function progressionSnapshot(state,config={}){
  const currentLevel=Math.max(1,Number(state?.level)||1); const nextLevel=currentLevel+1;
  const nextRequired=(config?.maxLevel!=null&&currentLevel>=Number(config.maxLevel))?null:xpRequiredForLevel(nextLevel,config);
  return {level:currentLevel,xp:Math.max(0,Number(state?.xp)||0),nextLevel,nextRequired,skillPoints:Number(state?.skillPoints||0),statPoints:Number(state?.statPoints||0)};
}
