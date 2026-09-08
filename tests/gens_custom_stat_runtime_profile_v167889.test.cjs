const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-custom-stat-runtime-profile-167889.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.96 unified custom-stat runtime must be valid JS');
assert.match(src,/APP_VERSION="16\.78\.96"/);
assert.match(src,/customStatAuthorityV167895/,'one-time activation repair marker must remain stable');
assert.match(src,/function renderUnifiedStats\(\)/,'final unified renderer must exist');
assert.match(src,/gcsHeroStats.*remove/,'legacy attrRow custom-stat block must be removed by the final renderer');
assert.match(src,/gsrCustomStatDescription/,'authored stat descriptions must render');
assert.match(src,/gsrCustomStatLinks/,'configured influences must render');
assert.match(src,/gsrCustomStatControls/,'plus/minus controls must render');
assert.match(src,/Points disponibles : /,'point-mode stats must expose the remaining pool');
assert.match(src,/api\.renderHero=renderUnifiedStats/,'external custom-stat render calls must use the final renderer');
assert.match(src,/wrapAfter\("renderDungeonAttributes"/,'native attribute render must finish through the final renderer');
assert.match(src,/wrapAfter\("render",core\)/,'Dungeon core render must finish through the final renderer');
assert.doesNotMatch(src,/MutationObserver|setInterval|setTimeout|createElement\("script"\)|startDungeonCombat|enemyCells\s*=|dungeonRoom\s*=/,'renderer must not add risky workers/loaders/spatial mutations');

const legacy={id:'dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{
  active:['force','furtivite'],
  customStats:[
    {id:'furtivite',name:'Furtivité',icon:'🥷',visible:true,editMode:'points',kind:'score',defaultValue:10,description:'Se déplacer sans être repéré.'},
    {id:'mouvement',name:'Mouvement',icon:'👣',visible:true,editMode:'points',kind:'score',defaultValue:3,description:'Mobilité tactique.'}
  ]
}}};
let store=[legacy],currentProfile=()=>legacy;
const heroState={statPoints:2,customStats:{furtivite:12,mouvement:4},rpgAttributes:{furtivite:12,mouvement:4},rpgStatSpent:{furtivite:2,mouvement:1}};
function mkHost(){const listeners={};return {dataset:{},listeners,addEventListener:(n,fn)=>{listeners[n]=fn}}}
const primary=mkHost(),custom=mkHost(),cards=[];
let oldLegacyPresent=true;
const oldLegacy={remove(){oldLegacyPresent=false}};
const grid={
  dataset:{},
  querySelectorAll(sel){return sel==='.gsrCustomStatCard'?cards.slice():[]},
  appendChild(node){cards.push(node)}
};
function makeNode(){return {className:'',dataset:{},innerHTML:'',remove(){const i=cards.indexOf(this);if(i>=0)cards.splice(i,1)}}}
const modal={style:{display:'none'}};
const document={
  readyState:'complete',
  createElement:()=>makeNode(),
  getElementById:id=>id==='rpgUniverseEditorModal'?modal:id==='rpgStatsList'?primary:id==='gcs167879Box'?custom:id==='dungeonAttributeGrid'?grid:id==='gcsHeroStats'&&oldLegacyPresent?oldLegacy:null
};
const sandbox={console,document,window:null,globalThis:null,current:'hero_test'};sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.loadGameProfiles=()=>store;sandbox.saveGameProfiles=all=>{store=all};
sandbox.getActiveGameProfile=()=>store.find(x=>x.id==='dungeon');
sandbox.loadState=id=>id==='hero_test'?heroState:null;
Object.defineProperty(sandbox,'currentRpgProfile',{get:()=>currentProfile,set:v=>{currentProfile=v},configurable:true});
let legacyEnsureCalls=0;
const api={
 defs(){legacyEnsureCalls++;const p=sandbox.currentRpgProfile();if(!p.rpgUniverse.stats.active.includes('furtivite'))p.rpgUniverse.stats.active.push('furtivite');return p.rpgUniverse.stats.customStats},
 activeIds(){const p=sandbox.currentRpgProfile();if(!p.rpgUniverse.stats.active.includes('furtivite'))p.rpgUniverse.stats.active.push('furtivite');return new Set(p.rpgUniverse.stats.active)},
 isActive(id){return this.activeIds().has(id)},
 value(hero,id){this.defs();return Number(heroState.customStats[id]||0)},
 setValue(){this.defs();return true},
 change(id,delta){this.defs();const d=legacy.rpgUniverse.stats.customStats.find(x=>x.id===id);if(!d)return false;if(delta>0&&d.editMode==='points'){if(heroState.statPoints<=0)return false;heroState.statPoints--;heroState.rpgStatSpent[id]=(heroState.rpgStatSpent[id]||0)+1}else if(delta<0&&d.editMode==='points'){if((heroState.rpgStatSpent[id]||0)<=0)return false;heroState.statPoints++;heroState.rpgStatSpent[id]--}heroState.customStats[id]+=delta;heroState.rpgAttributes[id]=heroState.customStats[id];return true},
 syncHero(){this.defs();return true},syncPrimaryList(){return true},persist(){return true},renderHero(){return 'legacy'}
};
sandbox.GensCustomStats167879=api;
sandbox.GensGenericStats167887={patchSheetTexts:()=>true,descriptionForSource:id=>id==='furtivite'?'Esquive, détection':id==='mouvement'?'Déplacement':'Aucune liaison automatique.'};
sandbox.renderDungeonAttributes=()=>true;sandbox.renderDungeonHeroStats=()=>true;sandbox.renderRpgUniverseEditor=()=>true;
sandbox.DungeonCore01={render:()=>true,show:()=>true};
vm.runInNewContext(src,sandbox);
const bridge=sandbox.GensCustomStatRuntimeProfile167889,p=sandbox.getActiveGameProfile();
assert.equal(p.rpgUniverse.stats.customStatAuthorityV167895,true,'migration must be marked once');
assert.deepEqual([...p.rpgUniverse.stats.active].sort(),['force','furtivite','mouvement'].sort(),'legacy Mouvement must be repaired into stats.active');
assert.equal(bridge.setActive('mouvement',false),true);assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),false);
bridge.migrateProfile(p);assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),false,'one-time migration must not reactivate disabled stats');
assert.equal(bridge.setActive('mouvement',true),true);
assert.equal(bridge.setActive('furtivite',false),true);sandbox.GensCustomStats167879.defs();
assert.equal(sandbox.GensCustomStats167879.isActive('furtivite'),false,'Furtivité must not regain privileged activation');
assert.ok(legacyEnsureCalls>0);assert.equal(bridge.setActive('furtivite',true),true);

cards.length=0;oldLegacyPresent=true;
assert.equal(bridge.renderUnifiedStats(),true);
assert.equal(oldLegacyPresent,false,'legacy attrRow block must be removed');
assert.equal(cards.length,2,'two active authored stats must render together');
assert.deepEqual(cards.map(c=>c.dataset.statId),['furtivite','mouvement']);
assert.match(cards[0].innerHTML,/Furtivité/);assert.match(cards[0].innerHTML,/Se déplacer sans être repéré\./);
assert.match(cards[0].innerHTML,/Influence : Esquive, détection/);assert.match(cards[0].innerHTML,/Points disponibles : 2/);
assert.match(cards[0].innerHTML,/GensCustomStatRuntimeProfile167889\.change\('furtivite',-1\)/);assert.match(cards[0].innerHTML,/＋/);
assert.match(cards[1].innerHTML,/Mobilité tactique\./);assert.equal(grid.dataset.gensUnifiedCustomStats,'167896');
assert.equal(grid.dataset.gensActiveCustomStatIds,'furtivite,mouvement');

assert.equal(bridge.change('mouvement',1),true,'plus button bridge must spend a point through the canonical engine');
assert.equal(heroState.customStats.mouvement,5);assert.equal(heroState.statPoints,1);
assert.ok(cards.some(c=>c.dataset.statId==='mouvement'&&/Points disponibles : 1/.test(c.innerHTML)),'rerender must expose updated point pool');
assert.equal(bridge.change('mouvement',-1),true,'minus button bridge must refund through the canonical engine');
assert.equal(heroState.customStats.mouvement,4);assert.equal(heroState.statPoints,2);

const fakeInput={value:'mouvement',checked:false,closest:sel=>sel.includes('data-gcs-primary')?fakeInput:null};
primary.listeners.change?.({target:fakeInput});assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),false,'editor activation checkbox must autosave');
const fakeCustomField={matches:sel=>sel==='[data-gcs],[data-e]'};let persisted=0;sandbox.GensCustomStats167879.persist=()=>{persisted++;return true};
custom.listeners.change?.({target:fakeCustomField});assert.equal(persisted,1,'definition edits must autosave');

const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){
  assert.match(site,/gens-custom-stat-runtime-profile-167889\.js\?v=167889/,'final site must load the final stat runtime after the canonical engine');
  const canonical=site.indexOf('gens-custom-stats-167881.js?v=167881'),runtime=site.indexOf('gens-custom-stat-runtime-profile-167889.js?v=167889');
  assert.ok(canonical>=0&&runtime>canonical,'unified final renderer must load after the canonical custom-stat engine');
}
console.log('GenSrpG unified dynamic hero stats V16.78.96: OK');
