'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const slice=(begin,end)=>{
 const a=src.indexOf(begin),b=src.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'missing canonical owner seam '+begin);
 return src.slice(a,b);
};
const mode=slice('window.gensMode151=function(){','window.dungeonMjRules151=function(){');
const context={window:{GensCaptureV1:{isProfile:p=>p?.rpgUniverse?.gameplay?.profile==='creature'||!!(p?.modules?.capture&&p?.modules?.controllableCreatures)}}};
let profile=null;
context.getActiveGameProfile=()=>profile;
vm.createContext(context);
vm.runInContext(mode,context);
const cases=[
 ['Capture with legacy Dungeon style',{gameStyle:'dungeon',rpgUniverse:{gameplay:{profile:'creature'}}},'capture'],
 ['Capture module flags',{gameStyle:'dungeon',modules:{capture:true,controllableCreatures:true}},'capture'],
 ['Real Dungeon',{gameStyle:'dungeon'},'dungeon'],
 ['Survival',{gameStyle:'survival'},'other'],
 ['No active profile',null,'other']
];
for(const [scenario,p,expected] of cases){profile=p;assert.equal(context.window.gensMode151(),expected,scenario)}
const apply=slice('function applyModeEditorVisibility(){','function gensEnforceModeIsolation(){');
const sync=slice('function syncEditorHubForActiveFamily(){','function updateGameplayEditorHubCards(){');
const editor=slice('function openDungeonAdvancedEditor(){','function closeDungeonAdvancedEditor(){');
const canon='gensMode151()==="dungeon"';
assert.ok(apply.includes('if(dae)dae.style.display='+canon+'?"":"none";'),'one authoritative visibility policy is canonical mode');
assert.ok(!sync.includes('getElementById("dungeonAdvancedEditorBtn")')&&!sync.includes('if(dungeonBtn)'),"editor sync must not read/write Dungeon button; static structural exclusion IDs are not visibility ownership");
assert.ok(editor.includes('if(gensMode151()!=="dungeon")return;'),'direct entry rejects non-Dungeon using same canonical authority');
assert.ok(!apply.includes('if(dae)dae.style.display=dungeon&&'),'old family-based masking removed');
assert.equal((src.match(/if\(dae\)dae\.style\.display=/g)||[]).length,1,'exactly one active Dungeon editor visibility writer');
assert.ok(!editor.includes('GensCaptureV1?.isProfile'),'do not add another Capture-only gate');
console.log(JSON.stringify({scenario:'Single owner of Dungeon editor access',cases:cases.length,onlyCanonicalIdentity:true,singleVisibilityWriter:true,noCaptureOnlyPatch:true}));
