const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-event-cells-167877.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const values=new Map();
const localStorage={getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}};
const runtime={participants:['aldren'],index:0,room:4,round:2,positions:{aldren:1},last:{authoredRuntime167839:true,worldDungeonId:'world_test',worldNodeId:'room_B',map:{cells:['floor','event','floor'],exitIdx:2}},branch:null};
localStorage.setItem(RT,JSON.stringify(runtime));
const ambush={id:'d_evt_ambush',name:'Embuscade',enabled:true,effect:{kind:'spawn',qty:1}};
const reinf={id:'d_evt_reinf',name:'Renforts',enabled:true,effect:{kind:'spawn',qty:2}};
const custom={id:'evt_custom_new',name:'Pluie de runes',enabled:true,effect:{kind:'message'}};
let library=[ambush,reinf,custom],applied=[];
const classList={contains(){return false},add(){},remove(){}};
const document={readyState:'complete',head:{appendChild(){}},body:{appendChild(){}},getElementById(){return null},createElement(){return {id:'',textContent:'',innerHTML:'',dataset:{},classList,style:{},setAttribute(){}}},addEventListener(){}};
const core={render(){return true},show(){return true},modal(){return true}};
const ctx={console,Math,Date,localStorage,document,setTimeout(fn){fn();return 1},DungeonCore01:core,DungeonRoomCreator100:{TOOLS:{}},DungeonCore318:{withRoom(room,fn){assert.equal(room,4);return fn()}},loadDungeonEvents(){return library},dungeonEligibleEvents(){return [ambush,reinf]},dungeonWeightedEventPick(list){return list[0]},applyDungeonTurnEvent(evt,round){applied.push({id:evt.id,round});return {event:evt}},showEffectPopup(){},showToast(){}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-authored-event-cells-167877.js'});
const api=ctx.DungeonAuthoredEventCells167877;
assert.ok(api);assert.equal(api.APP_VERSION,'16.78.81');assert.equal(api.RANDOM_EVENT_ID,'__random_event__');
assert.equal(ctx.DungeonRoomCreator100.TOOLS.event.label,'Événement');
assert.deepEqual(Array.from(api.eventLibrary().map(x=>x.id)),['d_evt_ambush','evt_custom_new','d_evt_reinf'].sort((a,b)=>({d_evt_ambush:'Embuscade',evt_custom_new:'Pluie de runes',d_evt_reinf:'Renforts'}[a]).localeCompare(({d_evt_ambush:'Embuscade',evt_custom_new:'Pluie de runes',d_evt_reinf:'Renforts'}[b]),'fr')));
api.saveConfig('world_test','room_B',1,'evt_custom_new');
assert.equal(api.getConfig('world_test','room_B',1).eventId,'evt_custom_new');
api.fire();
assert.equal(applied.length,1);assert.equal(applied[0].id,'evt_custom_new','un événement précis doit être exécuté au lieu du tirage aléatoire');
let x=JSON.parse(localStorage.getItem(RT));assert.equal(x.authoredEventCells167877['world_test::room_B::1'].configuredEventId,'evt_custom_new');

// Nouvelle zone + nouveau choix créé après le chargement du module : doit apparaître dynamiquement et être sélectionnable.
library.push({id:'evt_created_later',name:'Portail instable',enabled:true,effect:{kind:'message'}});
assert.ok(api.eventLibrary().some(x=>x.id==='evt_created_later'),'un événement créé plus tard doit apparaître sans modifier le code');
x.last.worldNodeId='room_C';x.authoredEventCells167877={};localStorage.setItem(RT,JSON.stringify(x));api.saveConfig('world_test','room_C',1,'evt_created_later');api.fire();
assert.equal(applied.at(-1).id,'evt_created_later');

// Mode aléatoire conserve le moteur existant.
x=JSON.parse(localStorage.getItem(RT));x.last.worldNodeId='room_D';x.authoredEventCells167877={};localStorage.setItem(RT,JSON.stringify(x));api.saveConfig('world_test','room_D',1,api.RANDOM_EVENT_ID);api.fire();
assert.equal(applied.at(-1).id,'d_evt_ambush');
assert.match(src,/loadDungeonEvents/);assert.match(src,/Aléatoire — bibliothèque des événements/);assert.match(src,/applyDungeonTurnEvent/);assert.doesNotMatch(src,/trackSpawnedEnemyInstances/);
console.log('Authored Dungeon configurable event cells V16.78.81: OK');
