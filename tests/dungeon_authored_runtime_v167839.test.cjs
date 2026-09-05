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
let generatorCalls=0,renderCalls=0,legacyConfigEnabledWrites=0,zoneApply=0;
/* Important regression: first authored room starts with NO remaining movement entry. */
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
 modal(){return true}
};
const contentStore={
 '__room_template__':{'room-a':{mode:'fixed',enemies:[],chests:[{id:'ch',cell:2,rarity:'rare',gold:4,items:[]}],traps:[],puzzles:[],npcs:[],items:[]}},
 'world-authored':{'A':{mode:'inherit',enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]},'B':{mode:'fixed',enemies:[{id:'boss',enemyId:'dng_lich',qty:1,cell:2,role:'boss'}],chests:[],traps:[],puzzles:[],npcs:[],items:[]}}
};
const zoneApi={getZoneContent(d,n){return JSON.parse(JSON.stringify(contentStore[d]?.[n]||{mode:'inherit',enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]}))},saveZoneContent(d,n,c){contentStore[d]=contentStore[d]||{};contentStore[d][n]=JSON.parse(JSON.stringify(c));return this.getZoneContent(d,n)},applyCurrentZone(){zoneApply++;const x=read();if(x?.last)x.last.worldContentApplied167824={mode:this.getZoneContent(x.last.worldDungeonId,x.last.worldNodeId).mode};write(x);return true}};
const context={console,Math,Date,document,localStorage,setTimeout(fn){fn();return 1},showToast(){},activeDungeonAdventureId(){return 'adv'},dc305PositionalGameplay(){return true},dungeonHeroMoveValue083(id){assert.equal(id,'hero');return 4},CHARS:{hero:{dungeonStats:{movement:9}}},DungeonCore01:core,DungeonSpatial313:spatial,DungeonZoneContent167824:zoneApi,
 DungeonWorldBuilder167821:{findDungeon(id){return id===graph.id?JSON.parse(JSON.stringify(graph)):null},validation(g){return {valid:!!g?.startNodeId,errors:[],warnings:[]}}},
 DungeonRoomCreator100:{findRoom(id){const r=rooms.find(x=>x.id===String(id));return r?JSON.parse(JSON.stringify(r)):null}},
 DungeonWorldRuntime167823:{saveConfig(cfg){if(cfg.enabled)legacyConfigEnabledWrites++;return cfg}},gensGameplayModules(){return {movement:true}}
};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.40');assert.equal(api.VERSION,'1.0.1');assert.equal(api.active(),true);
assert.equal(api.heroMoveAllowance('hero'),4,'le runtime construit doit réutiliser la valeur publique de déplacement Dungeon');
assert.equal(api.movementForEntry({remaining:{}},'hero'),4,'une première entrée sans mouvement initialisé doit recevoir la valeur du héros');
assert.equal(api.movementForEntry({remaining:{hero:0}},'hero'),0,'un vrai reste à 0 ne doit jamais être rechargé par un passage de porte');
assert.equal(api.movementForEntry({remaining:{hero:2}},'hero'),2,'le mouvement restant doit être conservé entre deux pièces');
assert.equal(core.explore.__dar167839,true);assert.equal(core.explore.__drr167822,true);assert.equal(core.explore.__dlr167835,true);assert.equal(core.explore.__dwr167823,true,'les anciens wrappers ne doivent plus reprendre la main après le moteur dédié');

(async()=>{
 await api.startConfigured(async()=>{core.start();return true},null,[]);
 let x=read();assert.equal(x.room,0,'le démarrage garde l’entrée hors donjon avant le premier clic');assert.equal(generatorCalls,0);
 assert.match(button.textContent,/ENTRER DANS Entrée exacte/);assert.equal(button.onclick,api.travel,'le bouton visible doit pointer vers le moteur dédié, pas vers le explore privé legacy');
 button.onclick();x=read();
 assert.equal(generatorCalls,0,'entrer dans un monde construit ne doit jamais appeler le générateur');assert.equal(x.room,1);assert.equal(x.last.authoredRuntime167839,true);assert.equal(x.last.worldGeneratorBypassed167839,true);assert.equal(x.last.authoredMovementReady167840,true);assert.equal(x.last.customRoomId,'room-a');assert.equal(x.last.worldNodeId,'A');
 assert.equal(x.last.map.width,3);assert.equal(x.last.map.height,2);assert.deepEqual(x.last.map.cells,['entry','wall','chest','floor','wall','exit'],'la géométrie exacte Room Creator doit être chargée telle quelle');assert.equal(x.positions.hero,0);assert.equal(x.remaining.hero,4,'BUG V16.78.39 : la première vraie salle ne doit plus démarrer à 0 mouvement');
 assert.equal(contentStore['world-authored'].A.mode,'fixed','le contenu exact du modèle doit être copié à la zone lors du premier passage');assert.ok(zoneApply>=1);
 x.positions.hero=5;x.remaining.hero=2;write(x);core.render();assert.match(button.textContent,/Vers Boss exact/);assert.equal(button.onclick,api.travel,'chaque render legacy doit être réparé immédiatement par le moteur dédié');
 button.onclick();x=read();assert.equal(generatorCalls,0);assert.equal(x.room,2);assert.equal(x.last.customRoomId,'room-b');assert.equal(x.last.worldNodeId,'B');assert.equal(x.last.kind,'boss');assert.equal(x.last.map.width,4);assert.equal(x.last.map.height,2);assert.deepEqual(x.last.map.cells,['entry','wall','boss','floor','floor','wall','floor','exit']);assert.equal(x.remaining.hero,2,'changer de pièce ne doit pas rendre les mouvements dépensés');
 assert.equal(legacyConfigEnabledWrites,0,'le vieux World Runtime ne doit jamais être réactivé pour un monde construit');
 core.explore();assert.equal(generatorCalls,0,'même un appel public DungeonCore01.explore doit rester dans le moteur construit tant que le monde est actif');
 localStorage.setItem(PRIMARY,JSON.stringify({kind:'adventure',id:'adv'}));core.explore();assert.equal(generatorCalls,1,'le mode aventure aléatoire doit conserver exactement son ancien explore une fois le monde construit désactivé');
 assert.match(src,/private legacy explore\(\) cannot leak through/);assert.match(src,/btn\.onclick=travel/);assert.match(src,/movementForEntry/);assert.match(src,/authoredMovementReady167840/);assert.doesNotMatch(src,/generateDungeonMap\?\.|ROOT\.generateDungeonMap|dungeonEncounter\?\.|dungeonBossRoom\?\./,'le moteur construit ne doit contenir aucun appel au générateur de salles/rencontres');
 const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8'),sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert.match(workflow,/dungeon_authored_runtime_v167839\.test\.cjs/);assert.match(workflow,/dungeon-authored-runtime-167839\.js\?v=167840/);assert.match(sw,/dungeon-authored-runtime-167839\.js/);assert.match(sw,/gensrpg-cache-16\.78\.41-authored-content-fixes/);
 const htmlArg=process.argv[2];if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');const zone=html.indexOf('dungeon-zone-content-167824.js?v=167824'),auth=html.indexOf('dungeon-authored-runtime-167839.js?v=167840');assert.ok(zone>=0&&auth>zone,'le site final doit charger le moteur construit V16.78.40 après le contenu exact');}
 console.log('Dedicated authored Dungeon movement V16.78.40: OK');
})().catch(e=>{console.error(e);process.exitCode=1});