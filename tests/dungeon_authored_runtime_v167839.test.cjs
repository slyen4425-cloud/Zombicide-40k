const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-runtime-167839.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2',PRIMARY='gensrpg_dungeon_primary_selection_v167833';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const localStorage=storage({[PRIMARY]:JSON.stringify({kind:'world',id:'world-authored',settingsAdventureId:'adv'})});
const rooms=[
 {id:'room-a',name:'Entrée façonnée',width:3,height:2,roomType:'room',theme:'stone',cells:[{terrain:'floor',object:'entry'},{terrain:'wall',object:null},{terrain:'floor',object:'chest'},{terrain:'floor',object:null},{terrain:'wall',object:null},{terrain:'floor',object:'exit'}]},
 {id:'room-b',name:'Salle finale personnalisée',width:4,height:2,roomType:'boss',theme:'lava',cells:[{terrain:'floor',object:'entry'},{terrain:'wall',object:null},{terrain:'floor',object:'boss'},{terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'wall',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]}
];
const graph={id:'world-authored',name:'Donjon 2 pièces',startNodeId:'A',nodes:[{id:'A',roomId:'room-a',label:'Entrée exacte'},{id:'B',roomId:'room-b',label:'Boss exact'}],edges:[{id:'AB',fromNodeId:'A',fromExitIndex:5,toNodeId:'B',toEntryIndex:0}]};
const button={id:'dc01Explore',textContent:'',disabled:false,onclick:null};
const document={readyState:'complete',getElementById(id){return id==='dc01Explore'?button:null},addEventListener(){}};
let generatorCalls=0,renderCalls=0,legacyConfigEnabledWrites=0,zoneApply=0,finalExitCalls=0,modalCalls=0;
function newRuntime(){return {participants:['hero'],index:0,round:1,room:0,last:null,positions:{hero:-1},remaining:{},enemyCells:{},roomStates:{},heroRooms:{hero:0}}}
function read(){return JSON.parse(localStorage.getItem(RT)||'null')}
function write(x){localStorage.setItem(RT,JSON.stringify(x))}
function privateLegacyExplore(){generatorCalls++;return 'legacy-private'}
const spatial={
 ensure(x){x.roomStates=x.roomStates||{};x.heroRooms=x.heroRooms||{};x.positions=x.positions||{};x.remaining=x.remaining||{};x.enemyCells=x.enemyCells||{};return x},
 persist(x){this.ensure(x);if(Number(x.room)>0)x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))};return x},
 setRoom(x,h,r){this.ensure(x);x.heroRooms[h]=Number(r)},
 activate(x,h){this.ensure(x);const r=Number(x.heroRooms[h]||0);x.room=r;const s=x.roomStates[String(r)];if(s){x.last=JSON.parse(JSON.stringify(s.last));x.enemyCells=JSON.parse(JSON.stringify(s.enemyCells||{}))}}
};
const core={
 start(){write(newRuntime());this.render();return true},
 show(){this.render();return true},
 render(){renderCalls++;button.textContent='🚪 EXPLORER LA SALLE SUIVANTE';button.onclick=privateLegacyExplore;return true},
 explore(){generatorCalls++;return 'legacy-public'},
 modal(){modalCalls++;return true}
};
const contentStore={
 '__room_template__':{'room-a':{mode:'fixed',enemies:[],chests:[{id:'ch',cell:2,rarity:'rare',gold:4,items:[]}],traps:[],puzzles:[],npcs:[],items:[]}},
 'world-authored':{'A':{mode:'inherit',enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]},'B':{mode:'fixed',enemies:[{id:'boss',enemyId:'dng_lich',qty:1,cell:2,role:'boss'}],chests:[],traps:[],puzzles:[],npcs:[],items:[]}}
};
const zoneApi={getZoneContent(d,n){return JSON.parse(JSON.stringify(contentStore[d]?.[n]||{mode:'inherit',enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]}))},saveZoneContent(d,n,c){contentStore[d]=contentStore[d]||{};contentStore[d][n]=JSON.parse(JSON.stringify(c));return this.getZoneContent(d,n)},applyCurrentZone(){zoneApply++;const x=read();if(x?.last)x.last.worldContentApplied167824={mode:this.getZoneContent(x.last.worldDungeonId,x.last.worldNodeId).mode};write(x);return true}};
const context={console,Math,Date,document,localStorage,setTimeout(fn){fn();return 1},showToast(){},activeDungeonAdventureId(){return 'adv'},dc305PositionalGameplay(){return true},dungeonHeroMoveValue083(id){assert.equal(id,'hero');return 4},CHARS:{hero:{dungeonStats:{movement:9}}},DungeonCore01:core,DungeonSpatial313:spatial,DungeonZoneContent167824:zoneApi,
 DungeonWorldBuilder167821:{findDungeon(id){return id===graph.id?JSON.parse(JSON.stringify(graph)):null},validation(g){return {valid:!!g?.startNodeId,errors:[],warnings:[]}}},
 DungeonRoomCreator100:{findRoom(id){const r=rooms.find(x=>x.id===String(id));return r?JSON.parse(JSON.stringify(r)):null}},
 DungeonWorldRuntime167823:{saveConfig(cfg){if(cfg.enabled)legacyConfigEnabledWrites++;return cfg}},gensGameplayModules(){return {movement:true}},
 DungeonAuthoredFinalExit167875:{finish(){finalExitCalls++;return true}}
};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.80');assert.equal(api.VERSION,'1.0.3');assert.equal(api.active(),true);
assert.equal(api.heroMoveAllowance('hero'),4);
assert.equal(api.movementForEntry({remaining:{}},'hero'),4);
assert.equal(api.movementForEntry({remaining:{hero:0}},'hero'),0);
assert.equal(api.movementForEntry({remaining:{hero:2}},'hero'),2);
assert.equal(core.explore.__dar167839,true);assert.equal(core.explore.__drr167822,true);assert.equal(core.explore.__dlr167835,true);assert.equal(core.explore.__dwr167823,true);

(async()=>{
 await api.startConfigured(async()=>{core.start();return true},null,[]);
 let x=read();assert.equal(x.room,0);assert.equal(generatorCalls,0);
 assert.match(button.textContent,/ENTRER DANS Entrée exacte/);assert.equal(button.onclick,api.travel);
 button.onclick();x=read();
 assert.equal(generatorCalls,0);assert.equal(x.room,1);assert.equal(x.last.authoredRuntime167839,true);assert.equal(x.last.worldGeneratorBypassed167839,true);assert.equal(x.last.authoredMovementReady167840,true);assert.equal(x.last.customRoomId,'room-a');assert.equal(x.last.worldNodeId,'A');
 assert.equal(x.last.map.width,3);assert.equal(x.last.map.height,2);assert.deepEqual(x.last.map.cells,['entry','wall','chest','floor','wall','exit']);assert.equal(x.positions.hero,0);assert.equal(x.remaining.hero,4);
 assert.equal(contentStore['world-authored'].A.mode,'inherit');assert.equal(contentStore['__room_template__']['room-a'].mode,'fixed');assert.ok(zoneApply>=1);
 x.positions.hero=5;x.remaining.hero=2;write(x);core.render();assert.match(button.textContent,/Vers Boss exact/);assert.equal(button.onclick,api.travel);
 button.onclick();x=read();assert.equal(generatorCalls,0);assert.equal(x.room,2);assert.equal(x.last.customRoomId,'room-b');assert.equal(x.last.worldNodeId,'B');assert.equal(x.last.kind,'boss');assert.equal(x.last.map.width,4);assert.equal(x.last.map.height,2);assert.deepEqual(x.last.map.cells,['entry','wall','boss','floor','floor','wall','floor','exit']);assert.equal(x.positions.hero,0);assert.equal(x.remaining.hero,2);
 assert.equal(legacyConfigEnabledWrites,0);
 core.render();assert.match(button.textContent,/REJOINDRE LA SORTIE FINALE/,'hors de la vraie sortie, le bouton ne doit jamais proposer de terminer le donjon');
 assert.equal(api.atTerminalExit(read()),false);core.explore();assert.equal(finalExitCalls,0,'hors de la sortie, explorer ne doit jamais terminer le donjon');assert.ok(modalCalls>=1,'hors de la sortie, un rappel de position peut être affiché');assert.equal(generatorCalls,0);
 x=read();x.positions.hero=7;write(x);core.render();assert.equal(api.atTerminalExit(read()),true);assert.match(button.textContent,/TERMINER LE DONJON/,'sur la vraie case sortie, le bouton de fin doit apparaître');
 core.explore();assert.equal(finalExitCalls,1,'sur la vraie sortie, le runtime principal doit appeler la procédure de fin');assert.equal(generatorCalls,0);
 localStorage.setItem(PRIMARY,JSON.stringify({kind:'adventure',id:'adv'}));core.explore();assert.equal(generatorCalls,1);
 assert.match(src,/private legacy explore\(\) cannot leak through/);assert.match(src,/btn\.onclick=travel/);assert.match(src,/movementForEntry/);assert.match(src,/authoredMovementReady167840/);assert.match(src,/REJOINDRE LA SORTIE FINALE/);assert.match(src,/TERMINER LE DONJON/);assert.match(src,/atTerminalExit/);assert.doesNotMatch(src,/SORTIE NON RELIÉE|Sortie non reliée/,'le runtime principal ne doit plus exposer le message de sortie non reliée pour une zone terminale');assert.doesNotMatch(src,/generateDungeonMap\?\.|ROOT\.generateDungeonMap|dungeonEncounter\?\.|dungeonBossRoom\?\./);
 const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8'),sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert.match(workflow,/dungeon_authored_runtime_v167839\.test\.cjs/);assert.match(workflow,/dungeon-authored-runtime-167839\.js\?v=167840/);assert.match(sw,/dungeon-authored-runtime-167839\.js/);assert.match(sw,/gensrpg-cache-16\.78\.40-authored-movement/);assert.match(sw,/gensrpg-cache-16\.78\.76-direct-final-exit/);
 const htmlArg=process.argv[2];if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');const zone=html.indexOf('dungeon-zone-content-167824.js?v=167824'),auth=html.indexOf('dungeon-authored-runtime-167839.js?v=167840');assert.ok(zone>=0&&auth>zone);}
 console.log('Dedicated authored Dungeon movement + terminal exit position V16.78.80: OK');
})().catch(e=>{console.error(e);process.exitCode=1});