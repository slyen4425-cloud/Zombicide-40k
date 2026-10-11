'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const mod=fs.readFileSync(path.join(root,'assets/gensrpg/capture/team-roster-v1.js'),'utf8');
const tag='<script src="assets/gensrpg/capture/team-roster-v1.js?v=1"></script>';
const world='<script src="assets/gensrpg/capture/world-exploration-v1.js?v=1"></script>';
assert.equal(html.split(tag).length-1,1,'one Capture roster loader');
assert.ok(html.indexOf(tag)>html.indexOf(world),'Capture world precedes roster');
assert.ok(html.indexOf(tag)<html.indexOf('<script>\n\nconst Z40K_GENERIC_SHEET_BG'),'roster precedes legacy inline');
const names=['captureActiveHeroId','captureActiveHeroState','captureTeamEntityRoster','captureFindOwnedCreature','ensureHeroCreatureState','heroCreatureState','creatureInstance','creatureEntityForInstance','saveHeroCreatureState','captureCreatureCardHtml','renderCaptureHeroTeam','renderCaptureHeroReserve','creatureCanEvolveInstance','moveCreatureToReserve','moveCreatureToTeam','releaseCreature','openCreatureReserve','closeCreatureReserve','renderCreatureReserve'];
for(const n of names){
 assert.match(mod,new RegExp('(?:^|\\n)function '+n+'\\('),'extracted owner '+n);
 assert.doesNotMatch(html,new RegExp('(?:^|\\n)function '+n+'\\('),'inline owner still active '+n);
}
assert.equal((mod.match(/\/\/ BEGIN_CAPTURE_TEAM_SECTION_/g)||[]).length,5);
for(const n of ['captureStartBattleAutomatic','renderCaptureWorldHub','attemptCreatureCapture'])
 assert.doesNotMatch(mod,new RegExp('function '+n+'\\('),'unrelated gameplay unchanged');
assert.ok(mod.includes('st.creatureTeam=st.creatureTeam.filter(Boolean).slice(0,6)'),'historical limit');
assert.ok(mod.includes('localStorage.setItem(key(heroId),JSON.stringify(st))'),'historical persisted schema');
const section=n=>{const m=mod.match(new RegExp('// BEGIN_CAPTURE_TEAM_SECTION_'+n+'\\n([\\s\\S]*?)// END_CAPTURE_TEAM_SECTION_'+n+'\\n'));assert.ok(m);return m[1]};
const stored=new Map([['hero:trainer',JSON.stringify({
 creatureTeam:[{uid:'u1',entityId:'fire',level:8,xp:79,abilities:['custom'],extra:'owner'},{uid:'u2',entityId:'water',level:5,xp:10}],
 creatureReserve:[{uid:'u3',entityId:'earth',level:12,xp:44,statAlloc:{power:5}}],
 inventory:[{itemId:'ball',qty:3}],notes:'player-created'})]]);
const events=[];
const ctx={current:'trainer',state:null,console,
 localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},
 key:id=>'hero:'+id,loadState:id=>JSON.parse(stored.get('hero:'+id)),
 loadSharedEntities:()=>[{id:'fire',hp:12},{id:'water',hp:20},{id:'earth',hp:33}],
 normalizeGameParticipants:()=>['trainer'],CHARS:{},findCustomHero:()=>null,
 document:{getElementById:()=>null},renderHeroCreatureTeam:()=>events.push('render'),
 gensCaptureCombatConfig:()=>({teamSize:6}),confirm:()=>true,
 alert:()=>{throw Error('unexpected alert')}};
vm.createContext(ctx);
for(let n=1;n<=5;n++)vm.runInContext(section(n),ctx,{timeout:3000});
assert.equal(vm.runInContext('captureTeamEntityRoster()',ctx).length,2);
vm.runInContext('moveCreatureToReserve(0)',ctx);
let st=JSON.parse(stored.get('hero:trainer'));
assert.deepEqual(st.creatureTeam.map(x=>x.uid),['u2']);
assert.deepEqual(st.creatureReserve.map(x=>x.uid),['u3','u1']);
assert.equal(st.creatureReserve[1].xp,79);
vm.runInContext('moveCreatureToTeam("u3")',ctx);
st=JSON.parse(stored.get('hero:trainer'));
assert.deepEqual(st.creatureTeam.map(x=>x.uid),['u2','u3']);
assert.deepEqual(st.creatureReserve.map(x=>x.uid),['u1']);
assert.equal(st.creatureTeam[1].statAlloc.power,5);
assert.deepEqual(st.inventory,[{itemId:'ball',qty:3}]);
assert.equal(st.notes,'player-created');
vm.runInContext('releaseCreature("u1","reserve")',ctx);
st=JSON.parse(stored.get('hero:trainer'));
assert.equal(st.creatureReserve.length,0);
assert.equal(st.creatureTeam[1].xp,44);
const dirty={creatureTeam:[null,...Array.from({length:7},(_,i)=>({uid:'x'+i}))],creatureReserve:[null,{uid:'stock'}],custom:'untouched'};
ctx.ensureHeroCreatureState(dirty);
assert.equal(dirty.creatureTeam.length,6);assert.equal(dirty.creatureReserve.length,1);assert.equal(dirty.custom,'untouched');
assert.deepEqual(events,['render','render','render']);
console.log(JSON.stringify({name:'Capture Team/Reserve single owner',extractedOwners:names.length,sections:5,storageAndCustomFieldsPreserved:true}));
