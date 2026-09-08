const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-custom-stat-runtime-profile-167889.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.95 custom-stat authority bridge must be valid JS');
assert.match(src,/APP_VERSION="16\.78\.95"/);
assert.match(src,/customStatAuthorityV167895/,'one-time repair marker must live on canonical stats data');
assert.match(src,/getActiveGameProfile/,'gameplay must resolve custom stats from the active RPG profile');
assert.match(src,/stats\.active|s\.active/,'stats.active must remain the activation source');
assert.match(src,/for\(const d of s\.customStats\)/,'legacy custom definitions must be repaired into active once');
assert.match(src,/api\.activeIds=function/,'legacy Furtivité force-activation must be bypassed for exported API reads');
assert.match(src,/api\.isActive=function/,'activation checks must read canonical active list directly');
assert.match(src,/data-gcs-primary/,'custom characteristic checkboxes must autosave activation');
assert.match(src,/\[data-gcs\],\[data-e\]/,'custom stat definition changes must autosave');
assert.doesNotMatch(src,/MutationObserver|setInterval|setTimeout|createElement\("script"\)|startDungeonCombat|enemyCells\s*=|dungeonRoom\s*=/,'authority bridge must not add risky workers/loaders/spatial mutations');

const legacy={id:'dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{
  active:['force','furtivite'],
  customStats:[
    {id:'furtivite',name:'Furtivité'},
    {id:'mouvement',name:'Mouvement',description:'Mobilité tactique.'}
  ]
}}};
let store=[legacy];
let currentProfile=()=>legacy;
function mkHost(){const listeners={};return {dataset:{},listeners,addEventListener:(n,fn)=>{listeners[n]=fn}}}
const primary=mkHost(),custom=mkHost();
const document={
  readyState:'complete',
  getElementById:id=>id==='rpgUniverseEditorModal'?{style:{display:'none'}}:id==='rpgStatsList'?primary:id==='gcs167879Box'?custom:null
};
const sandbox={console,document,window:null,globalThis:null};sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.loadGameProfiles=()=>store;
sandbox.saveGameProfiles=all=>{store=all};
sandbox.getActiveGameProfile=()=>store.find(x=>x.id==='dungeon');
Object.defineProperty(sandbox,'currentRpgProfile',{get:()=>currentProfile,set:v=>{currentProfile=v},configurable:true});
let legacyEnsureCalls=0;
const api={
 defs(){legacyEnsureCalls++;const p=sandbox.currentRpgProfile();if(!p.rpgUniverse.stats.active.includes('furtivite'))p.rpgUniverse.stats.active.push('furtivite');return p.rpgUniverse.stats.customStats},
 activeIds(){const p=sandbox.currentRpgProfile();if(!p.rpgUniverse.stats.active.includes('furtivite'))p.rpgUniverse.stats.active.push('furtivite');return new Set(p.rpgUniverse.stats.active)},
 isActive(id){return this.activeIds().has(id)},
 value(hero,id){this.defs();return id==='mouvement'?4:12},
 setValue(){this.defs();return true},
 change(){this.defs();return true},
 syncHero(){this.defs();return true},
 syncPrimaryList(){return true},
 persist(){return true}
};
sandbox.GensCustomStats167879=api;
sandbox.GensGenericStats167887={patchSheetTexts:()=>true};
sandbox.renderDungeonAttributes=()=>true;sandbox.renderDungeonHeroStats=()=>true;
sandbox.renderRpgUniverseEditor=()=>true;
vm.runInNewContext(src,sandbox);
const bridge=sandbox.GensCustomStatRuntimeProfile167889;
const p=sandbox.getActiveGameProfile();
assert.equal(p.rpgUniverse.stats.customStatAuthorityV167895,true,'migration must be marked once');
assert.deepEqual([...p.rpgUniverse.stats.active].sort(),['force','furtivite','mouvement'].sort(),'existing Mouvement must be repaired into the same active list as Furtivité');
assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),true,'Mouvement must be active after migration');
assert.equal(bridge.setActive('mouvement',false),true);
assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),false,'manual deactivation must persist after migration');
bridge.migrateProfile(p);
assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),false,'one-time migration must not reactivate a user-disabled stat');
assert.equal(bridge.setActive('furtivite',false),true);
assert.equal(sandbox.GensCustomStats167879.isActive('furtivite'),false,'Furtivité must no longer have privileged activation');
sandbox.GensCustomStats167879.defs();
assert.equal(sandbox.GensCustomStats167879.isActive('furtivite'),false,'legacy ensure may run internally but exported API must restore canonical activation');
assert.ok(legacyEnsureCalls>0);

const fakeInput={value:'mouvement',checked:true,closest:sel=>sel.includes('data-gcs-primary')?fakeInput:null};
primary.listeners.change?.({target:fakeInput});
assert.equal(sandbox.GensCustomStats167879.isActive('mouvement'),true,'primary custom checkbox must autosave activation');

const fakeCustomField={matches:sel=>sel==='[data-gcs],[data-e]'};
let persisted=0;sandbox.GensCustomStats167879.persist=()=>{persisted++;return true};
custom.listeners.change?.({target:fakeCustomField});
assert.equal(persisted,1,'custom stat definition changes must autosave through the existing canonical persist function');

const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site)assert.match(site,/gens-custom-stat-runtime-profile-167889\.js\?v=167889/,'final site must load the canonical authority bridge slot');
console.log('GenSrpG custom stat authority + active-profile bridge V16.78.95: OK');
