const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const zoneSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-zone-content-167824.js'),'utf8');
const authSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-runtime-167839.js'),'utf8');
const visualSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-config-167826.js'),'utf8');
const templateSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-template-content-167828.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2',CONTENT='gensrpg_zone_instance_content_v1',PRIMARY='gensrpg_dungeon_primary_selection_v167833';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},dump(k){return m.get(k)}}}
function cls(){const s=new Set();return {add(...x){x.forEach(v=>s.add(v))},remove(...x){x.forEach(v=>s.delete(v))},contains(v){return s.has(v)}}}
const elements=new Map();
function elem(text=''){return {id:'',textContent:text,innerHTML:'',style:{},classList:cls(),children:[],parentNode:null,remove(){this.removed=true},appendChild(c){c.parentNode=this;this.children.push(c);if(c.id)elements.set(c.id,c)},insertBefore(c){this.appendChild(c)},addEventListener(){},setAttribute(){},querySelector(){return null}}}
const chestCards=[elem('Coffre Commun'),elem('Coffre Rare'),elem('Coffre Épique'),elem('Coffre Légendaire')],otherCard=elem('Marchand');
const button=elem();button.id='dc01Explore';button.disabled=false;elements.set(button.id,button);
const body=elem(),head=elem();
const document={readyState:'complete',body,head,documentElement:elem(),createElement(){return elem()},getElementById(id){return elements.get(id)||null},querySelector(){return null},querySelectorAll(sel){return sel==='#dc200Scene .dc200SceneCard'?[...chestCards,otherCard]:[]},addEventListener(){}};
const room1={id:'room1',name:'Crypte',width:3,height:3,roomType:'room',theme:'stone',cells:Array.from({length:9},(_,i)=>({terrain:'floor',object:i===0?'entry':i===8?'exit':null}))};
room1.cells[4].object='puzzle';room1.cells[5].object='chest';room1.cells[6].object='trap';room1.cells[3].object='enemy';
const room2={id:'room2',name:'Suite',width:3,height:3,roomType:'room',theme:'stone',cells:Array.from({length:9},(_,i)=>({terrain:'floor',object:i===0?'entry':i===8?'exit':null}))};
const graph={id:'d1',name:'Monde',startNodeId:'n1',nodes:[{id:'n1',roomId:'room1',label:'Crypte'},{id:'n2',roomId:'room2',label:'Suite'}],edges:[{id:'e',fromNodeId:'n1',fromExitIndex:8,toNodeId:'n2',toEntryIndex:0}]};
const template={mode:'fixed',enemies:[{id:'enemy',enemyId:'dng_skeleton',qty:1,cell:3,role:'enemy',hp:null}],chests:[{id:'ch',cell:5,rarity:'rare',gold:7,items:[{itemId:'potion_heal',qty:2}]}],traps:[{id:'tr',cell:6,trapType:'reference',damage:0,refId:'dtrap_rune',label:'Rune explosive',once:true}],puzzles:[{id:'pch',cell:4,refId:'puzzle_chest',targetType:'chest',targetIndex:5,label:'Sceau du coffre'},{id:'pdoor',cell:4,refId:'puzzle_door',targetType:'door',targetIndex:8,label:'Sceau de la porte'}],npcs:[],items:[]};
const stale={mode:'fixed',enemies:[{id:'oldenemy',enemyId:'dng_skeleton',qty:1,cell:3,role:'enemy',hp:1}],chests:[{id:'oldch',cell:5,rarity:'common',gold:0,items:[{itemId:'wrong_item',qty:1}]}],traps:[{id:'oldtr',cell:6,trapType:'reference',refId:'dtrap_darts',once:true}],puzzles:[],npcs:[],items:[]};
const store=storage({[PRIMARY]:JSON.stringify({kind:'world',id:'d1'}),[CONTENT]:JSON.stringify({'__room_template__':{room1:template},d1:{n1:stale}})});
let enemies=[],seq=0,trapOpened='',puzzleOpened='';const heroState={inventory:[],gold:0,wounds:0};
function runtime(map){return {participants:['hero'],index:0,room:1,positions:{hero:0},remaining:{hero:3},enemyCells:{},roomStates:{},heroRooms:{hero:1},authored167839:{worldId:'d1',heroNodes:{hero:'n1'},nodeRooms:{n1:1},roomNodes:{1:'n1'},history:{hero:['n1']}},last:{kind:'world',room:1,authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:'d1',worldNodeId:'n1',map,objective:map.objective,exitLocked:false}}}
const spatial={ensure(x){x.roomStates=x.roomStates||{};return x},persist(x){x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))};return x},setRoom(){},activate(){}};
const core={render(){return true},show(){return true},explore(){return true},modal(){return true},start(){return true}};
const context={console,Math,Date,document,localStorage:store,setTimeout(){return 1},DungeonCore01:core,DungeonSpatial313:spatial,
  DungeonWorldBuilder167821:{findDungeon(id){return id==='d1'?JSON.parse(JSON.stringify(graph)):null},validation(){return {valid:true}}},
  DungeonRoomCreator100:{findRoom(id){const r=id==='room1'?room1:id==='room2'?room2:null;return r?JSON.parse(JSON.stringify(r)):null}},
  DungeonWorldRuntime167823:{saveConfig(c){return c}},activeDungeonAdventureId(){return 'a'},dc305PositionalGameplay(){return true},dungeonHeroMoveValue083(){return 3},
  loadActiveEnemies(){return enemies},saveActiveEnemies(v){enemies=v},trackSpawnedEnemyInstances(type,qty,roomNo){const ids=[];for(let i=0;i<qty;i++){const id='spawn-'+(++seq);ids.push(id);enemies.push({id,enemyId:type,hp:10,maxHp:10,dungeonRoom:roomNo})}return ids},
  loadState(){return heroState},key(){return 'hero'},makeInventoryEntry(itemId){return {itemId}},gensHeroGold(){return heroState.gold},showToast(){},modal(){},
  openDungeonTrap(id){trapOpened=id;return true},openDungeonChallenge(id){puzzleOpened=id;return true}};
context.window=context;context.globalThis=context;vm.createContext(context);
vm.runInContext(zoneSrc,context,{filename:'zone.js'});
vm.runInContext(authSrc,context,{filename:'auth.js'});
const zone=context.DungeonZoneContent167824,auth=context.DungeonAuthoredRuntime167839;
assert.equal(zone.APP_VERSION,'16.78.44');assert.equal(auth.APP_VERSION,'16.78.44');
const map=auth.mapFromRoom(room1);assert.equal(map.cells[6],'floor','le piège brut de la salle ne doit jamais être visible');assert.equal(map.cells[4],'floor','une énigme attachée ne doit pas créer un second marqueur autonome');
store.setItem(RT,JSON.stringify(runtime(map)));
const effective=auth.effectiveContent(graph,graph.nodes[0],room1);assert.equal(effective.templateLinked,true,'une ancienne copie de modèle doit redevenir liée');assert.equal(effective.chests[0].items[0].itemId,'potion_heal','le contenu courant du modèle remplace la vieille copie de coffre');
let raw=JSON.parse(store.getItem(CONTENT));assert.equal(Object.prototype.hasOwnProperty.call(raw.__room_template__.room1.enemies[0],'hp'),false,'les anciens PV forcés doivent être migrés hors du stockage');
assert.equal(zone.applyCurrentZone({force:true}),true);assert.equal(enemies.length,1);assert.equal(enemies[0].hp,10,'le squelette doit conserver les PV de sa fiche bestiaire');
let x=JSON.parse(store.getItem(RT));assert.equal(x.last.map.cells[5],'chest');assert.equal(x.last.map.cells[6],'floor');assert.equal(x.last.map.cells[4],'floor');
assert.ok(chestCards.every(c=>c.removed===true),'les quatre anciennes cartes de coffre doivent disparaître du plateau de jeu');assert.notEqual(otherCard.removed,true);
x.positions.hero=5;store.setItem(RT,JSON.stringify(x));assert.equal(zone.openChest('ch'),false,'un coffre protégé par énigme doit rester fermé');assert.equal(heroState.inventory.length,0);assert.equal(zone.solvePuzzle('pch'),true);assert.equal(puzzleOpened,'puzzle_chest');assert.equal(zone.openChest('ch'),true);assert.equal(heroState.gold,7);assert.equal(heroState.inventory.filter(i=>i.itemId==='potion_heal').length,2,'le coffre doit donner exactement les objets programmés');assert.equal(heroState.inventory.some(i=>i.itemId==='wrong_item'),false);
x=JSON.parse(store.getItem(RT));x.positions.hero=6;store.setItem(RT,JSON.stringify(x));core.render();assert.equal(trapOpened,'dtrap_rune','le piège doit utiliser exactement la référence choisie dans l’éditeur');x=JSON.parse(store.getItem(RT));assert.equal(x.worldContentState167824.d1.n1.triggeredTraps.tr,true);assert.equal(x.last.map.cells[6],'floor');
x.positions.hero=8;store.setItem(RT,JSON.stringify(x));core.render();assert.match(button.textContent,/ÉNIGME DE LA PORTE/,'une énigme liée à une porte doit remplacer temporairement le bouton de sortie');button.onclick();assert.equal(puzzleOpened,'puzzle_door');core.render();assert.match(button.textContent,/Vers Suite/,'après résolution la porte doit redevenir traversable');
assert.doesNotMatch(visualSrc,/PV forcés/);assert.doesNotMatch(templateSrc,/PV forcés/);assert.match(visualSrc,/TargetIndex/);assert.match(templateSrc,/TargetIndex/);assert.match(templateSrc,/templateLinked:true/);
for(const src of [zoneSrc,authSrc,visualSrc,templateSrc])assert.doesNotMatch(src,/new\s+MutationObserver/,'aucun observateur global ne doit revenir avec V16.78.44');
console.log('Dungeon authored content V16.78.44: OK');
