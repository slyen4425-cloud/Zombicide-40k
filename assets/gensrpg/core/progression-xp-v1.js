/* GenSrpG Phase 4 — pure XP-to-level progression contract.
   Explicit progression configuration; no active-profile, state or presentation ownership. */
(function(ROOT,factory){
"use strict";

const api=factory();
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(ROOT)ROOT.GensProgressionXpV1=api;

})(typeof window!=="undefined"?window:null,function(){
"use strict";

const VERSION="1.0.0";

function config(value){
  return value!==null&&typeof value==="object"&&!Array.isArray(value)?value:{};
}

function levelFromXp(xp,progressionConfig){
  const p=config(progressionConfig);
  const v=Math.max(0,Number(xp)||0);
  const max=Math.max(1,Number(p.maxLevel)||100);

  if((p.xpCurveMode||"linear")==="custom"){
    let level=1;
    const per=Math.max(1,Number(p.xpPerLevel)||10);
    for(let lv=2;lv<=max;lv++){
      const req=Math.max(
        0,
        Number(p.xpThresholds?.[lv])||((lv-1)*per)
      );
      if(v>=req)level=lv;
      else break;
    }
    return level;
  }

  return Math.min(
    max,
    1+Math.floor(v/Math.max(1,Number(p.xpPerLevel)||10))
  );
}

return Object.freeze({
  VERSION,
  levelFromXp
});

});
