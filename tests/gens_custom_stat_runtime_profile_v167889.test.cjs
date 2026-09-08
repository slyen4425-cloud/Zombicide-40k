const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-custom-stat-runtime-profile-167889.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'V16.78.99 final stat bridge must be valid JS');
assert.match(src,/APP_VERSION="16\.78\.99"/);assert.match(src,/GensStatService167899/);
assert.match(src,/function contextAllowed\(\)/);assert.match(src,/function editorContext\(\)/);assert.match(src,/function runtimeContext\(\)/);
assert.match(src,/syncLegacyBonusFields/);assert.match(src,/DungeonEquipmentHotfix167817/);assert.match(src,/DungeonSetEditor/);
assert.doesNotMatch(src,/function renderUnifiedStats|function profileStats|canonicalStatAuthority/,'bridge must not implement another stat engine');
const removed=[];
const document={readyState:'complete',getElementById:id=>({remove(){removed.push(id)}}),querySelectorAll:()=>[],};
const hot={FIELDS:[{key:'force',label:'Force'}]},set={FIELDS:[{key:'force',label:'Force'}]};
let allowed=true,editor=true,runtime=true;
const service={
 contextAllowed:()=>allowed,editorContext:()=>editor,runtimeContext:()=>runtime,
 bonusFields:()=>[{key:'armor',label:'Armure'},{key:'chance',label:'Chance'}],
 installRuntime(){},patchCompatibility(){},renderEditor(){},renderSheet(){}
};
const sandbox={console,document,window:null,globalThis:null,GensStatService167899:service,DungeonEquipmentHotfix167817:hot,DungeonSetEditor:set};sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(src,sandbox);
const bridge=sandbox.GensCustomStatRuntimeProfile167889;
assert.ok(bridge);
assert.deepEqual(Array.from(hot.FIELDS,x=>x.key),['armor','chance']);assert.deepEqual(Array.from(set.FIELDS,x=>x.key),['armor','chance']);
assert.ok(removed.includes('gcsHeroStats'));assert.ok(removed.includes('gcs167879Box'));

// Outside Dungeon/Capture/home: bridge must be inert and preserve pre-existing UI/config.
allowed=false;editor=false;runtime=false;hot.FIELDS.splice(0,hot.FIELDS.length,{key:'force',label:'Force'});set.FIELDS.splice(0,set.FIELDS.length,{key:'force',label:'Force'});const removedBefore=removed.length;
assert.equal(bridge.syncLegacyBonusFields(),false);assert.equal(bridge.clean(),false);bridge.install();
assert.deepEqual(Array.from(hot.FIELDS,x=>x.key),['force']);assert.deepEqual(Array.from(set.FIELDS,x=>x.key),['force']);assert.equal(removed.length,removedBefore);
const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){assert.match(site,/gens-custom-stat-runtime-profile-167889\.js\?v=167889/);assert.match(site,/gens-stat-service-167899\.js\?v=167899/)}
console.log('GenSrpG final shared-stat bridge V16.78.99 + isolation: OK');