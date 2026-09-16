const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

function read(rel){return fs.readFileSync(path.join(root,rel),'utf8')}
function write(rel,s){fs.writeFileSync(path.join(root,rel),s)}
function replaceOnce(src,re,replacement,label){
  const matches=[...src.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
  if(matches.length!==1)throw new Error(`${label}: expected exactly one match, got ${matches.length}`);
  return src.replace(re,replacement);
}

// 1) Core stats stays the single effect-calculation authority and exposes only the
// contribution from one source stat to one target. No formula is duplicated in Tactical.
{
  const rel='assets/gensrpg/gens-rpg-stats-clean-167874.js';
  let src=read(rel);
  if(!src.includes('function sourceEffectTotal(')){
    src=replaceOnce(src,
      /function extraTotal\(target,hero=String\(R\.current\|\|""\),seen=new Set\(\)\)\{return effects\(\)\.filter\(e=>e\.enabled&&e\.target===target\)\.reduce\(\(n,e\)=>n\+effectAmount\(e,hero,seen\),0\)\}/,
      'function extraTotal(target,hero=String(R.current||""),seen=new Set()){return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmount(e,hero,seen),0)}\nfunction sourceEffectTotal(target,source,hero=String(R.current||""),seen=new Set()){source=canon(source);return effects().filter(e=>e.enabled&&e.target===target&&e.source===source).reduce((n,e)=>n+effectAmount(e,hero,seen),0)}',
      'Core stats source effect helper');
    src=replaceOnce(src,
      /allEffects,value,extraTotal,changeCustom/,
      'allEffects,value,extraTotal,sourceEffectTotal,changeCustom',
      'Core stats API export');
  }
  write(rel,src);
}

// 2) Tactical keeps the already-computed hit chance and only fixes attribution in the
// visible breakdown. Canonical stat contribution is not added again.
{
  const rel='assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js';
  let src=read(rel);
  if(!src.includes('sourceEffectTotal?.("hit:"+mode')){
    const old=/      let attributeValue=0,statBonus=0;\n      try\{withHero\(rt,id,\(\)=>\{\n        attributeValue=num\(call\(rt,"dungeonAttributeValue",attribute\),canonicalStat\(rt,id,attribute,0\)\);\n        const derived=call\(rt,"dungeonHitBonusForMode",mode,attributeValue\);\n        statBonus=Number\.isFinite\(Number\(derived\)\)\?num\(derived\):Math\.max\(0,attributeValue\)\*num\(scaling\.chancePerPoint,0\);\n      \}\)\}catch\(e\)\{\}/;
    const next='      let attributeValue=0,statBonus=0;\n      try{withHero(rt,id,()=>{\n        attributeValue=num(call(rt,"dungeonAttributeValue",attribute),canonicalStat(rt,id,attribute,0));\n        let canonicalDerived=NaN;\n        try{canonicalDerived=rt?.GensCleanRpgStats167874?.sourceEffectTotal?.("hit:"+mode,attribute,id)}catch(e){}\n        const derived=call(rt,"dungeonHitBonusForMode",mode,attributeValue);\n        statBonus=Number.isFinite(Number(canonicalDerived))&&Number(canonicalDerived)!==0?num(canonicalDerived):(Number.isFinite(Number(derived))&&Number(derived)!==0?num(derived):Math.max(0,attributeValue)*num(scaling.chancePerPoint,0));\n      })}catch(e){}';
    src=replaceOnce(src,old,next,'Tactical canonical hit attribution');
  }
  write(rel,src);
}

// 3) Hero editor remains the base-definition editor. The in-game card keeps using the
// canonical total but labels base and total honestly instead of calling the total “Base”.
{
  const rel='assets/gensrpg/gens-hero-editor-dynamic-167897.js';
  let src=read(rel);
  if(!src.includes('function gameStatValues(')){
    const old=/function statBoxHtml\(d\)\{[^\n]*\}\nfunction completeGameStats\(\)\{[^\n]*\}/;
    const next='function gameStatValues(d){const hero=String(R.current||""),rec=heroRecord(hero),base=num(canonicalValue(d.id,d,rec),d.defaultValue||0),total=num(api()?.value?.(hero,d.id),base);return {base,total}}\nfunction statBoxHtml(d){const id=esc(d.id),vals=gameStatValues(d),desc=esc(d.description||"");return \'<div class="dungeonStatBox" data-canonical-stat-box="\'+id+\'"><strong>\'+esc((d.icon?d.icon+" ":"")+d.name)+\'</strong><span>\'+vals.total+\'</span><small data-canonical-stat-values="1" style="display:block">Base héros \'+vals.base+\' · Total \'+vals.total+\'</small><small data-clean-stat-explanation="1" style="display:block;color:#d6c18a;margin:4px 0">\'+desc+\'</small><div class="controls"><button data-attr="\'+id+\'" onclick="changeDungeonAttribute(this.dataset.attr,-1)">−</button><button data-attr="\'+id+\'" onclick="changeDungeonAttribute(this.dataset.attr,1)">+</button></div></div>\'}\nfunction completeGameStats(){if(!D||!api())return false;const host=D.getElementById("dungeonAttributeGrid");if(!host)return false;const defs=activeDefs(),wanted=new Set(defs.map(d=>d.id));for(const box of [...host.querySelectorAll(".dungeonStatBox")]){const id=box.querySelector("[data-attr]")?.dataset?.attr||box.getAttribute("data-canonical-stat-box")||"";if(id&&!wanted.has(id))box.remove()}for(const d of defs){let box=[...host.querySelectorAll(".dungeonStatBox")].find(b=>(b.querySelector("[data-attr]")?.dataset?.attr||b.getAttribute("data-canonical-stat-box"))===d.id);if(!box){host.insertAdjacentHTML("beforeend",statBoxHtml(d));box=host.lastElementChild}const strong=box.querySelector("strong"),span=box.querySelector("span"),vals=gameStatValues(d),values=box.querySelector("[data-canonical-stat-values]");if(strong)strong.textContent=(d.icon?d.icon+" ":"")+d.name;if(span)span.textContent=String(vals.total);if(values)values.textContent="Base héros "+vals.base+" · Total "+vals.total}try{R.GensStatUpgradePolicy167898?.decorateGame?.()}catch(e){}return true}';
    src=replaceOnce(src,old,next,'Hero in-game stat semantics');
    src=replaceOnce(src,
      /activeDefs,render:renderHero,read:readHero/,
      'activeDefs,gameStatValues,render:renderHero,read:readHero',
      'Hero stats presentation API export');
  }
  write(rel,src);
}

console.log('Canonical stats consistency owner patch applied.');
