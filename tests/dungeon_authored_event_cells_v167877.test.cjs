const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-event-cells-167877.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const values=new Map();
const localStorage={getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}};
const runtime={participants:['aldren'],index:0,room:4,round:2,positions:{aldren:0},last:{authoredRuntime167839:true,worldDungeonId:'world_test',worldNodeId:'room_B',customRoomId:'template_room',map:{cells:['floor','event','floor'],exitIdx:2}},branch:null};
localStorage.setItem(RT,JSON.stringify(runtime));
const ambush={id:'d_evt_ambush',name:'Embuscade',enabled:true,effect:{kind:'spawn',qty:1}};
const reinf={id:'d_evt_reinf',name:'Renforts',enabled:true,effect:{kind:'spawn',qty:2}};
const custom={id:'evt_custom_new',name:'Pluie de runes',enabled:true,effect:{kind:'message'}};
let library=[ambush,reinf,custom],applied=[];
const classList={contains(){return false},add(){},remove(){}};
const document={readyState:'complete',head:{appendChild(){}},body:{appendChild(){}},getElementById(){return null},createElement(){return {id:'',type:'',textContent:'',innerHTML:'',dataset:{},classList,style:{},setAttribute(){},appendChild(){}}},addEventListener(){}};
const core={render(){return true},show(){return true},modal(){return true}};
const ctx={console,Math,Date,localStorage,document,setTimeout(fn){fn();return 1},DungeonCore01:core,DungeonRoomCreator100:{TOOLS:{}},DungeonCore318:{withRoom(room,fn){assert.equal(room,4);return fn()}},loadDungeonEvents(){return library},dungeonEligibleEvents(){return [ambush,reinf]},dungeonWeightedEventPick(list){return list[0]},applyDungeonTurnEvent(evt,round){applied.push({id:evt.id,round});return {event:evt}},showEffectPopup(){},showToast(){}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-authored-event-cells-167877.js'});
const api=ctx.DungeonAuthoredEventCells167877;
assert.ok(api);assert.equal(api.APP_VERSION,'16.78.84');assert.equal(api.RANDOM_EVENT_ID,'__random_event__');assert.equal(api.TEMPLATE_DUNGEON_ID,'__room_template__');
assert.equal(ctx.DungeonRoomCreator100.TOOLS.event.label,'Événement');
assert.equal(typeof api.ensurePaletteButton,'function');assert.equal(typeof api.decorateEventCells,'function');
assert.match(src,/dae167884NeedsConfig/,'une case événement non configurée doit avoir un état visuel distinct');
assert.match(src,/dae167884Configured/,'une case événement configurée doit avoir un état visuel distinct');
assert.match(src,/drt167828Toggle/,'le mode Contenu exact doit ouvrir la configuration événement');
assert.ok(api.eventLibrary().some(x=>x.id==='evt_custom_new'));

// Configuration du modèle de pièce : aucune zone n'est nécessaire.
assert.equal(api.rawConfig(api.TEMPLATE_DUNGEON_ID,'template_room',1),null);
api.saveConfig(api.TEMPLATE_DUNGEON_ID,'template_room',1,'evt_custom_new');
assert.ok(api.rawConfig(api.TEMPLATE_DUNGEON_ID,'template_room',1),'un choix enregistré doit être considéré comme configuré');
assert.equal(api.getConfig(api.TEMPLATE_DUNGEON_ID,'template_room',1).eventId,'evt_custom_new');
assert.equal(api.resolveConfig('world_test','room_B',1,'template_room').eventId,'evt_custom_new');
assert.equal(api.resolveConfig('world_test','room_B',1,'template_room').source,'template');
let x=JSON.parse(localStorage.getItem(RT));x.positions.aldren=1;localStorage.setItem(RT,JSON.stringify(x));api.fire();
assert.equal(applied.length,1);assert.equal(applied[0].id,'evt_custom_new','le runtime doit hériter du choix événement du modèle de pièce');
x=JSON.parse(localStorage.getItem(RT));assert.equal(x.authoredEventCells167877['world_test::room_B::1'].configuredEventId,'evt_custom_new');assert.equal(x.authoredEventCells167877['world_test::room_B::1'].configSource,'template');

// Une variante par zone doit prendre le dessus sur le modèle.
library.push({id:'evt_created_later',name:'Portail instable',enabled:true,effect:{kind:'message'}});
assert.ok(api.eventLibrary().some(x=>x.id==='evt_created_later'));
x.last.worldNodeId='room_C';x.authoredEventCells167877={};x.positions.aldren=1;localStorage.setItem(RT,JSON.stringify(x));api.saveConfig('world_test','room_C',1,'evt_created_later');
assert.equal(api.resolveConfig('world_test','room_C',1,'template_room').source,'zone');api.fire();
assert.equal(applied.at(-1).id,'evt_created_later');

// Aléatoire explicite reste une configuration réelle (donc état visuel configuré).
x=JSON.parse(localStorage.getItem(RT));x.last.worldNodeId='room_D';x.authoredEventCells167877={};x.positions.aldren=1;localStorage.setItem(RT,JSON.stringify(x));api.saveConfig('world_test','room_D',1,api.RANDOM_EVENT_ID);assert.ok(api.rawConfig('world_test','room_D',1));api.fire();
assert.equal(applied.at(-1).id,'d_evt_ambush');
assert.match(src,/loadDungeonEvents/);assert.match(src,/Aléatoire — bibliothèque des événements/);assert.match(src,/applyDungeonTurnEvent/);assert.doesNotMatch(src,/trackSpawnedEnemyInstances/);
console.log('Authored Dungeon event highlighting V16.78.84: OK');
