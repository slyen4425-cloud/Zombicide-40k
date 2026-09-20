const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const legacyPath=path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const corePath=path.join(root,'assets','gensrpg','core','stats-v1.js');

assert.ok(fs.existsSync(corePath),'Core Stats S2 service assets/gensrpg/core/stats-v1.js must exist');

const legacyRaw=fs.readFileSync(legacyPath,'utf8');
const marker='R.GensCleanRpgStats167874=';
assert.ok(legacyRaw.includes(marker),'legacy Stats export marker missing');
const legacySrc=legacyRaw.replace(
  marker,
  'R.__LegacyStatsS2=Object.freeze({slug,canon,num,clamp,normDef,targetValid,normEffect,compare});\n'+marker
);
const coreSrc=fs.readFileSync(corePath,'utf8');

function context(){
  const ctx={console,Math,Date,JSON,Set,Map};
  ctx.window=ctx;
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  return ctx;
}
function plain(v){
  if(v===undefined||v===null||typeof v!=='object')return v;
  return JSON.parse(JSON.stringify(v));
}

const legacyCtx=context();
vm.runInContext(legacySrc,legacyCtx,{filename:'gens-rpg-stats-clean-167874.js'});
const legacy=legacyCtx.__LegacyStatsS2;
assert.ok(legacy,'legacy private S2 helpers were not exposed in test VM');

const coreCtx=context();
vm.runInContext(coreSrc,coreCtx,{filename:'core/stats-v1.js'});
const core=coreCtx.GensStatsV1;
assert.ok(core,'GensStatsV1 missing');

const canonCases=[
  undefined,null,'','force','strength','agility','spirit','dexterity','wisdom',
  'constitution','defence','armour','move','Strength','custom_stat'
];
for(const value of canonCases){
  assert.equal(core.canon(value),legacy.canon(value),'canon parity '+String(value));
}

const slugCases=[
  undefined,null,'',' Force ','Agilité','Défense / Armure','  foo---bar  ',
  'Épuisement héroïque','A B C','___x___','🔥 Feu'
];
for(const value of slugCases){
  assert.equal(core.slug(value),legacy.slug(value),'slug parity '+String(value));
}

const numberCases=[
  [undefined,7],[null,7],['',7],['12',7],['12.5',7],['abc',7],
  [Infinity,7],[-3,7],[false,7],[true,7]
];
for(const [value,fallback] of numberCases){
  assert.equal(core.number(value,fallback),legacy.num(value,fallback),'number parity '+String(value));
}

for(const [n,a,b] of [[5,0,10],[-2,0,10],[20,0,10],[5,5,5]]){
  assert.equal(core.clamp(n,a,b),legacy.clamp(n,a,b),'clamp parity');
}

const definitions=[
  null,
  {},
  {id:'strength',name:'Force',defaultValue:10,min:0,max:999},
  {id:'Défense',name:'Défense',icon:'🛡️',defaultValue:20,min:5,max:10,visible:false,description:42},
  {name:'Épuisement héroïque',defaultValue:'12',min:'2',max:'30'},
  {id:'x',defaultValue:99,min:5,max:2},
  {id:'🔥',name:'🔥'}
];
for(const def of definitions){
  assert.deepEqual(
    plain(core.normalizeDefinition(def)),
    plain(legacy.normDef(def)),
    'definition parity '+JSON.stringify(def)
  );
}

const targets=[
  'damage:physical','damage:melee','damage:ranged','damage:magic',
  'hit:melee','hit:ranged','hit:magic','max_hp','max_mana','crit','dodge',
  'magic_resistance','defense','armor','movement','initiative','enemy_vision',
  'stat:force','stat:custom','not:a:target',''
];
for(const target of targets){
  assert.equal(core.targetValid(target),legacy.targetValid(target),'target parity '+target);
}

const effects=[
  null,
  {},
  {id:'a',source:'strength',target:'damage:physical',mode:'step',step:10,gain:2,enabled:true},
  {source:'agility',target:'stat:force',mode:'threshold',threshold:12,comparator:'gte',gain:-3},
  {source:'force',target:'max_hp',mode:'other',step:0,gain:'4',threshold:'8',comparator:'wat',enabled:false},
  {source:'',target:'max_hp',gain:1},
  {source:'force',target:'bad',gain:1}
];
effects.forEach((effect,index)=>{
  assert.deepEqual(
    plain(core.normalizeEffect(effect,index)),
    plain(legacy.normEffect(effect,index)),
    'effect parity '+index
  );
});

const comparisons=[
  [10,'gt',9,true],[10,'gt',10,false],[10,'gte',10,true],
  [10,'lt',11,true],[10,'lte',10,true],[10,'eq',10,true],[10,'wat',9,true]
];
for(const [value,comp,threshold,expected] of comparisons){
  assert.equal(core.compare(value,comp,threshold),legacy.compare(value,comp,threshold),'compare parity '+comp);
  assert.equal(core.compare(value,comp,threshold),expected,'compare expected '+comp);
}

const contributionCases=[
  [{enabled:false,mode:'step',step:10,gain:5},20,0],
  [{enabled:true,mode:'step',step:10,gain:5},20,10],
  [{enabled:true,mode:'step',step:0,gain:2},3,6],
  [{enabled:true,mode:'threshold',threshold:10,comparator:'gte',gain:4},10,4],
  [{enabled:true,mode:'threshold',threshold:10,comparator:'gt',gain:4},10,0],
  [{enabled:true,mode:'threshold',threshold:10,comparator:'lt',gain:-2},9,-2]
];
for(const [effect,value,expected] of contributionCases){
  assert.equal(core.effectContribution(effect,value),expected,'effect contribution parity contract');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S2 normalization parity',
  canonCases:canonCases.length,
  slugCases:slugCases.length,
  definitionCases:definitions.length,
  effectCases:effects.length,
  contributionCases:contributionCases.length,
  parity:true
},null,2));
