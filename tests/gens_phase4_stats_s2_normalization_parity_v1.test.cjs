const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const legacyPath=path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const corePath=path.join(root,'assets','gensrpg','core','stats-normalization-v1.js');

const legacySrc=fs.readFileSync(legacyPath,'utf8');
const coreSrc=fs.readFileSync(corePath,'utf8');

const marker='R.GensCleanRpgStats167874={';
assert.ok(legacySrc.includes(marker),'legacy Stats API anchor missing');
const instrumented=legacySrc.replace(
  marker,
  'R.__GENS_STATS_S2_INTERNALS={slug,canon,normDef,targetValid,normEffect,compare};'+marker
);

const legacyCtx={console};
legacyCtx.window=legacyCtx;
legacyCtx.globalThis=legacyCtx;
vm.createContext(legacyCtx);
vm.runInContext(coreSrc,legacyCtx,{filename:'stats-normalization-v1.js'});
vm.runInContext(instrumented,legacyCtx,{filename:'gens-rpg-stats-clean-167874.js'});
const legacy=legacyCtx.__GENS_STATS_S2_INTERNALS;
assert.ok(legacy,'legacy pure internals missing');

const coreCtx={console};
coreCtx.window=coreCtx;
coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc,coreCtx,{filename:'stats-normalization-v1.js'});
const core=coreCtx.GensStatsNormalizationV1;
assert.ok(core,'Core Stats normalization API missing');

const plain=v=>v==null?v:JSON.parse(JSON.stringify(v));

for(const input of [
  '',null,undefined,'force','strength','agility','spirit','dexterity','wisdom',
  'constitution','defence','armour','move','unknown'
]){
  assert.equal(core.canon(input),legacy.canon(input),'canon parity: '+String(input));
}

for(const input of [
  '',null,undefined,' Force ','Énergie Mystique','hello-world','défense++',
  '__Already__','a  b---c','Àéîõü'
]){
  assert.equal(core.slug(input),legacy.slug(input),'slug parity: '+String(input));
}

const defCases=[
  null,
  undefined,
  {},
  {name:'Énergie Mystique'},
  {id:'strength',name:'Puissance',icon:'💪',defaultValue:12,min:0,max:99,visible:true,description:'x'},
  {id:'weird stat',name:'Weird',icon:null,defaultValue:99,min:5,max:2,visible:false,description:123},
  {id:'chance',defaultValue:'7',min:'-2',max:'20'},
  {id:'move',defaultValue:'bad',min:'bad',max:'bad'}
];
for(const d of defCases){
  assert.deepEqual(
    plain(core.normalizeDefinition(d)),
    plain(legacy.normDef(d)),
    'definition parity: '+JSON.stringify(d)
  );
}

const targets=[
  'damage:physical','damage:melee','damage:ranged','damage:magic',
  'hit:melee','hit:ranged','hit:magic','max_hp','max_mana','crit','dodge',
  'magic_resistance','defense','armor','movement','initiative','enemy_vision',
  'stat:force','stat:custom','not:a:target','',null
];
for(const t of targets){
  assert.equal(core.isValidTarget(t),legacy.targetValid(t),'target parity: '+String(t));
}

const effectCases=[
  null,
  undefined,
  {},
  {source:'force',target:'bad'},
  {source:'',target:'max_hp'},
  {source:'strength',target:'damage:physical',mode:'step',step:10,gain:2,enabled:true},
  {source:'agility',target:'stat:force',mode:'threshold',threshold:12,comparator:'gte',gain:3},
  {id:'x',source:'force',target:'max_hp',mode:'other',step:0,gain:'4',threshold:'8',comparator:'nope',enabled:false},
  {source:'move',target:'movement',step:-3,gain:null,threshold:null}
];
effectCases.forEach((e,i)=>{
  assert.deepEqual(
    plain(core.normalizeEffect(e,i)),
    plain(legacy.normEffect(e,i)),
    'effect parity index '+i+': '+JSON.stringify(e)
  );
});

for(const [v,c,t] of [
  [5,'gt',4],[5,'gt',5],[5,'gte',5],[5,'lt',6],[5,'lte',5],
  [5,'eq',5],[5,'eq','5'],[5,'unknown',4]
]){
  assert.equal(core.compare(v,c,t),legacy.compare(v,c,t),`compare parity ${v} ${c} ${t}`);
}

const contributionCases=[
  [{enabled:false,mode:'step',step:10,gain:2},30,0],
  [{enabled:true,mode:'step',step:10,gain:2},30,6],
  [{enabled:true,mode:'step',step:0,gain:2},3,6],
  [{enabled:true,mode:'threshold',threshold:10,comparator:'gte',gain:4},10,4],
  [{enabled:true,mode:'threshold',threshold:10,comparator:'gt',gain:4},10,0],
  [{enabled:true,mode:'threshold',threshold:10,comparator:'lt',gain:-2},5,-2]
];
for(const [effect,value,expected] of contributionCases){
  assert.equal(core.effectContribution(effect,value),expected,'pure effect contribution');
}

for(const forbidden of ['document','localStorage','MutationObserver','setTimeout','setInterval','CHARS','currentRpgProfile']){
  assert.equal(coreSrc.includes(forbidden),false,'Core normalization must stay pure: '+forbidden);
}
assert.equal(/\bstate\b/.test(coreSrc),false,'Core normalization must not read runtime state');
assert.equal(/function\s+value\s*\(/.test(coreSrc),false,'S2 must not extract full canonical value');
assert.equal(/dungeon|tactical|inventory|equipment|skill|challenge/i.test(coreSrc),false,'S2 Core module must remain domain-agnostic');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S2 pure normalization parity',
  api:'GensStatsNormalizationV1',
  aliases:true,
  definitions:defCases.length,
  targets:targets.length,
  effects:effectCases.length,
  comparisons:8,
  contributionCases:contributionCases.length,
  pure:true
},null,2));
