const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-runtime-167823.js'),'utf8');
const htmlArg=process.argv[2];
const RT='gensrpg_dungeon_runtime_v2';

function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const rooms=[
  {id:'room_a',name:'Entrée antique',width:2,height:2,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:'exit'},{terrain:'floor',object:'exit'}]},
  {id:'room_b',name:'Salle des gardes',width:3,height:2,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:'enemy'},{terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]},
  {id:'room_c',name:'Crypte',width:2,height:3,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'},{terrain:'floor',object:null}]}
];
const graph={id:'world_1',name:'Monde test',startNodeId:'A',nodes:[
  {id:'A',roomId:'room_a',label:'Entrée'},
  {id:'B',roomId:'room_b',label:'Gardes'},
  {id:'C',roomId:'room_c',label:'Crypte'}
],edges:[
  {id:'ab',fromNodeId:'A',fromExitIndex:2,toNodeId:'B',toEntryIndex:0},
  {id:'ac',fromNodeId:'A',fromExitIndex:3,toNodeId:'C',toEntryIndex:0},
  {id:'ca',fromNodeId:'C',fromExitIndex:4,toNodeId:'A',toEntryIndex:0}
]};
const localStorage=storage({[RT]:JSON.stringify({participants:['hero'],index:0,room:0,last:null,positions:{hero:-1},remaining:{hero:3},enemyCells:{},roomStates:{},heroRooms:{hero:0}})});
let generatorCalls=0,zoneApplyCalls=0,renderCalls=0;
function read(){return JSON.parse(localStorage.getItem(RT)||'null')}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
const spatial={
  ensure(x){x.roomStates=x.roomStates||{};x.heroRooms=x.heroRooms||{};x.positions=x.positions||{};x.remaining=x.remaining||{};x.enemyCells=x.enemyCells||{}},
  persist(x){this.ensure(x);if(Number(x.room)>0)x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))}},
  setRoom(x,h,r){this.ensure(x);x.heroRooms[h]=Number(r)},
  activate(x,h){this.ensure(x);const r=Number(x.heroRooms[h]||0);x.room=r;const s=x.roomStates[String(r)];if(s){x.last=JSON.parse(JSON.stringify(s.last));x.enemyCells=JSON.parse(JSON.stringify(s.enemyCells||{}))}}
};
const core={
  render(){renderCalls++;return true},show(){return true},
  explore(){generatorCalls++;const x=read(),h=x.participants[x.index]||'hero',to=Number(x.room||0)+1;x.room=to;x.heroRooms[h]=to;x.last={kind:'enemy',map:{size:9,width:9,height:9,cells:Array(81).fill('enemy'),entryIdx:0,exitIdx:80}};x.positions[h]=0;write(x);return true}
};
const ctx={console,Math,Date,localStorage,setTimeout(fn){fn();return 1},clearTimeout(){},globalThis:null,window:null,DungeonCore01:core,DungeonSpatial313:spatial,
  DungeonWorldBuilder167821:{findDungeon(id){return id==='world_1'?JSON.parse(JSON.stringify(graph)):null},loadLibrary(){return [JSON.parse(JSON.stringify(graph))]},validation(g){return {valid:!!g?.startNodeId,errors:[],warnings:[]}}},
  DungeonRoomCreator100:{findRoom(id){const r=rooms.find(x=>x.id===String(id));return r?JSON.parse(JSON.stringify(r)):null}},
  DungeonZoneContent167824:{applyCurrentZone(){zoneApplyCalls++;const x=read();if(x?.last)x.last.worldContentApplied167824={mode:'test'};write(x);return true}},
  activeDungeonAdventureId(){return 'adv_1'},showToast(){},modal(){return false},dungeonRoomExitLocked102(){return false}
};
ctx.globalThis=ctx;ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-world-runtime-167823.js'});
const api=ctx.DungeonWorldRuntime167823;
assert.ok(api);
assert.equal(api.APP_VERSION,'16.78.38');assert.equal(api.VERSION,'1.3.0');
assert.equal(api.chooseEdge(graph,'A',2).toNodeId,'B');
assert.equal(api.chooseEdge(graph,'A',3).toNodeId,'C');
assert.equal(api.chooseEdge(graph,'A',99),null);
assert.equal(core.render.__dwr167838,true,'le rafraîchissement du bouton de sortie doit être raccordé au render, pas au DOM entier');

api.saveConfig({enabled:true,dungeonId:'world_1'},'adv_1');
api.saveZoneContent('world_1','B',{mode:'fixed',enemies:[{enemyId:'__random_enemy__',cell:1}]});
api.saveZoneContent('world_1','C',{mode:'mixed',traps:[{cell:2,damage:2}]});

assert.equal(core.explore(),true,'la première zone World Builder doit être créée directement même en inherit');
let x=read();
assert.equal(generatorCalls,0,'aucun réglage de génération de salle ne doit être consulté');
assert.equal(x.room,1);assert.equal(x.last.worldNodeId,'A');assert.equal(x.last.customRoomId,'room_a');
assert.equal(x.last.map.width,2);assert.equal(x.last.map.height,2);assert.equal(x.last.map.cells.length,4);
assert.equal(x.last.worldGeneratorBypassed167837,true);assert.equal(x.last.worldGeneratorBypassed167838,true);
assert.equal(x.last.map.worldGeneratorBypassed167838,true);
assert.equal(zoneApplyCalls,0,'inherit vide ne doit pas inventer de contenu');

x.positions.hero=3;write(x);
assert.equal(core.explore(),true,'la connexion A -> C doit charger la pièce C directement');
x=read();assert.equal(generatorCalls,0);assert.equal(x.last.worldNodeId,'C');assert.equal(x.last.map.width,2);assert.equal(x.last.map.height,3);assert.equal(x.last.map.cells.length,6);assert.equal(zoneApplyCalls,1,'le contenu mixed explicite est appliqué sans générateur');

x.positions.hero=4;write(x);
assert.equal(core.explore(),true,'le retour vers A doit réutiliser son snapshot');
x=read();assert.equal(generatorCalls,0);assert.equal(x.room,1);assert.equal(x.last.worldNodeId,'A');assert.equal(x.last.worldGeneratorBypassed167838,true);

x.positions.hero=2;write(x);
assert.equal(core.explore(),true,'la connexion A -> B doit charger la pièce B directement');
x=read();assert.equal(generatorCalls,0);assert.equal(x.last.worldNodeId,'B');assert.equal(x.last.map.width,3);assert.equal(x.last.map.height,2);assert.equal(x.last.map.cells.length,6);assert.equal(zoneApplyCalls,2,'le contenu fixed, y compris un choix aléatoire explicite, passe par le système de contenu existant');

api.saveConfig({enabled:false,dungeonId:'world_1'},'adv_1');
core.explore();assert.equal(generatorCalls,1,'une aventure générée conserve le générateur historique');

function templateFallbackScenario(){
  localStorage.setItem(RT,JSON.stringify({participants:['hero'],index:0,room:0,last:null,positions:{hero:-1},remaining:{hero:3},enemyCells:{},roomStates:{},heroRooms:{hero:0}}));
  generatorCalls=0;zoneApplyCalls=0;api.saveConfig({enabled:true,dungeonId:'world_1'},'adv_1');
  api.saveZoneContent('world_1','A',{mode:'inherit'});
  api.saveZoneContent('__room_template__','room_a',{mode:'fixed',chests:[{cell:1,rarity:'rare'}]});
  assert.equal(core.explore(),true);
  assert.equal(generatorCalls,0);
  assert.equal(api.getZoneContent('world_1','A').mode,'fixed','un ancien nœud inherit récupère le contenu exact du modèle de pièce');
  assert.equal(zoneApplyCalls,1);
}
templateFallbackScenario();

assert.doesNotMatch(src,/prepareLegacyExit/,'le World Builder ne doit plus préparer puis appeler le générateur legacy');
assert.doesNotMatch(src,/content\.mode==="fixed"\)\s*\{/,'le contournement du générateur ne doit plus dépendre du mode fixed');
assert.match(src,/worldGeneratorBypassed167838:true/);
assert.match(src,/TEMPLATE_DUNGEON_ID="__room_template__"/);
assert.match(src,/function directFixedNode/,'le nom public historique est conservé pour compatibilité');
assert.match(src,/installRenderWrapper/,'le rafraîchissement UI doit être événementiel');
assert.doesNotMatch(src,/new\s+MutationObserver/,'le World Runtime ne doit plus observer toute l’application');
assert.doesNotMatch(src,/dwr167823Enabled|dwr167823Save|UTILISER CE MONDE|World Builder comme autorité de cette aventure/,'le second sélecteur d’activation dans l’éditeur doit disparaître');
assert.match(src,/retireLegacyPanel/);
assert.match(src,/Sortie non reliée/);

if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');const builderPos=html.indexOf('assets/dungeon/dungeon-world-builder-167821.js?v=167821');const roomRuntimePos=html.indexOf('assets/dungeon/dungeon-room-runtime-167822.js?v=167822');const worldRuntimePos=html.indexOf('assets/dungeon/dungeon-world-runtime-167823.js?v=167838');assert.ok(builderPos>=0&&roomRuntimePos>builderPos&&worldRuntimePos>roomRuntimePos,'final HTML must load builder, room runtime, then isolated world runtime V16.78.38')}
console.log('Dungeon built World isolation + single activation V16.78.38 regressions: OK');
