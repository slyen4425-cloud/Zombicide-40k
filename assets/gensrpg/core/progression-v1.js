/* GenSrpG Phase 4 — pure progression primitives.
   XP-to-level calculation only; explicit progression config, no runtime ownership. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

function configObject(config){
  return config&&typeof config==="object"?config:{};
}

function levelFromXp(xp,progressionConfig){
  const p=configObject(progressionConfig);
  const value=Math.max(0,Number(xp)||0);
  const max=Math.max(1,Number(p.maxLevel)||100);

  if((p.xpCurveMode||"linear")==="custom"){
    let level=1;
    const per=Math.max(1,Number(p.xpPerLevel)||10);
    const thresholds=p.xpThresholds&&typeof p.xpThresholds==="object"?p.xpThresholds:{};
    for(let next=2;next<=max;next++){
      const required=Math.max(0,Number(thresholds[next])||((next-1)*per));
      if(value>=required)level=next;
      else break;
    }
    return level;
  }

  return Math.min(max,1+Math.floor(value/Math.max(1,Number(p.xpPerLevel)||10)));
}

function xpIntoLevel(xp,progressionConfig,fallbackXpPerLevel){
  const p=progressionConfig&&typeof progressionConfig==="object"?progressionConfig:null;
  const value=Math.max(0,Number(xp)||0);

  if(!p||(p.xpCurveMode||"linear")!=="custom"){
    const per=Math.max(1,Number(p&&p.xpPerLevel)||Number(fallbackXpPerLevel)||10);
    return value%per;
  }

  const level=levelFromXp(value,p);
  const thresholds=p.xpThresholds&&typeof p.xpThresholds==="object"?p.xpThresholds:{};
  const start=Math.max(0,Number(thresholds[level])||0);
  return Math.max(0,value-start);
}

ROOT.GensProgressionV1=Object.freeze({
  VERSION,
  levelFromXp,
  xpIntoLevel
});

})(typeof window!=="undefined"?window:globalThis);
