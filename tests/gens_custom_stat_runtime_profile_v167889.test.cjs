const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-custom-stat-runtime-profile-167889.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.89 bridge must be valid JS');
assert.match(src,/APP_VERSION="16\.78\.89"/);
assert.match(src,/getActiveGameProfile/,'gameplay must resolve custom stats from the active RPG profile');
assert.match(src,/currentRpgProfile/,'bridge must reuse the canonical API by redirecting its profile lookup');
assert.match(src,/GensCustomStats167879/,'canonical custom-stat engine must remain the implementation authority');
assert.doesNotMatch(src,/MutationObserver|setInterval|setTimeout|createElement\("script"\)|startDungeonCombat|enemyCells\s*=|dungeonRoom\s*=/,'bridge must not add risky UI workers, dynamic loaders or spatial gameplay mutations');

const editor={rpgUniverse:{stats:{customStats:[{id:'editor_stat'}],active:['editor_stat']}}};
const active={rpgUniverse:{stats:{customStats:[{id:'necro'}],active:['necro']}}};
let currentProfile=()=>editor;
const document={readyState:'complete',getElementById:id=>id==='rpgUniverseEditorModal'?{style:{display:'none'}}:null};
const sandbox={console,document,window:null,globalThis:null};sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.getActiveGameProfile=()=>active;
Object.defineProperty(sandbox,'currentRpgProfile',{get:()=>currentProfile,set:v=>{currentProfile=v},configurable:true});
const api={
 defs(){return sandbox.currentRpgProfile().rpgUniverse.stats.customStats},
 isActive(id){return sandbox.currentRpgProfile().rpgUniverse.stats.active.includes(id)},
 value(hero,id){return sandbox.currentRpgProfile().rpgUniverse.stats.customStats.some(x=>x.id===id)?12:0},
 change(hero,delta){return sandbox.currentRpgProfile()===active}
};
sandbox.GensCustomStats167879=api;
sandbox.GensGenericStats167887={patchSheetTexts:()=>true};
vm.runInNewContext(src,sandbox);
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.GensCustomStats167879.defs())),[{id:'necro'}],'closed editor must use active gameplay profile');
assert.equal(sandbox.GensCustomStats167879.isActive('necro'),true);
assert.equal(sandbox.GensCustomStats167879.value('h','necro'),12);
assert.equal(sandbox.GensCustomStats167879.change('necro',1),true,'point changes must still go through canonical change implementation while using active profile');
document.getElementById=id=>id==='rpgUniverseEditorModal'?{style:{display:'block'}}:null;
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.GensCustomStats167879.defs())),[{id:'editor_stat'}],'open editor must keep the editor profile context');

const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site)assert.match(site,/gens-custom-stat-runtime-profile-167889\.js\?v=167889/,'final site must load V16.78.89 runtime-profile bridge');
console.log('GenSrpG custom stat active-profile bridge V16.78.89: OK');
