const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const zoneSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-zone-content-167824.js'),'utf8');
const fixSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-content-hotfix-167841.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2',CONTENT='gensrpg_zone_instance_content_v1';
function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)},dump(k){return m.get(k)}}}
function el(text=''){return {textContent:text,removed:false,style:{},remove(){this.removed=true}}}
const chestCard=el('Coffre Commun Va sur la case 🎁 pour le fouiller.'),merchantCard=el('Marchand itinérant');
const elements=new Map();
function node(){return {id:'',style:{},classList:{add(){},remove(){}},appendChild(){},remove(){},innerHTML:'',textContent:'',addEventListener(){},parentNode:null}}
const document={readyState:'complete',head:{appendChild(){}},body:{appendChild(){}},documentElement:{},createElement(){return node()},getElementById(id){return elements.get(id)||null},querySelector(sel){return null},querySelectorAll(sel){return sel==='#dc200Scene .dc200SceneCard'?[chestCard,merchantCard]:[]},addEventListener(){}};
const runtime={participants:['aldren'],index:0,room:1,positions:{aldren:0},remaining:{aldren:3},enemyCells:{},roomStates:{},last:{kind:'enemy',authoredRuntime167839:true,worldRuntime167823:true,worldDungeonId:'d1',worldNodeId:'n1',map:{size:3,width:3,height:3,cells:['entry','floor','floor','floor','floor','floor','trap','floor','exit'],entryIdx:0,exitIdx:8}}};
const content={d1:{n1:{mode:'fixed',enemies:[{id:'e1',enemyId:'dng_skeleton',qty:1,cell:4,role:'enemy',hasKey:false,hp:null}],chests:[{id:'ch1',cell:5,rarity:'common',gold:0,items:[]}],traps:[{id:'t1',cell:6,trapType:'damage',damage:3,once:true}],puzzles:[],npcs:[],items:[]}}};
const store=storage({[RT]:JSON.stringify(runtime),[CONTENT]:JSON.stringify(content)});
let enemies=[],seq=0;const heroState={inventory:[],gold:0,wounds:0};
const room={id:'room1',name:'Crypte',width:3,height:3,cells:Array.from({length:9},(_,i)=>({terrain:'floor',object:i===0?'entry':i===8?'exit':null}))};
const graph={id:'d1',name:'Monde',startNodeId:'n1',nodes:[{id:'n1',roomId:'room1',label:'Crypte'}],edges:[]};
const spatial={ensure(x){x.roomStates=x.roomStates||{};return x},persist(x){x.roomStates[String(x.room)]={last:JSON.parse(JSON.stringify(x.last)),enemyCells:JSON.parse(JSON.stringify(x.enemyCells||{}))};return x}};
const core={render(){return true},show(){return true},explore(){return true}};
const context={console,Math,Date,document,localStorage:store,setTimeout(){return 1},
 DungeonWorldBuilder167821:{findDungeon(id){return id==='d1'?graph:null},loadLibrary(){return [graph]}},DungeonRoomCreator100:{findRoom(id){return id==='room1'?JSON.parse(JSON.stringify(room)):null}},DungeonWorldRuntime167823:{getConfig(){return {enabled:true,dungeonId:'d1'}}},DungeonSpatial313:spatial,DungeonCore01:core,
 DungeonAuthoredRuntime167839:{active(){return true}},loadActiveEnemies(){return enemies},saveActiveEnemies(v){enemies=v},
 trackSpawnedEnemyInstances(type,qty,roomNo){const ids=[];for(let i=0;i<qty;i++){const id='spawn-'+(++seq);ids.push(id);enemies.push({id,enemyId:type,hp:10,maxHp:10,dungeonRoom:roomNo})}return ids},
 loadState(){return heroState},key(id){return 'hero:'+id},makeInventoryEntry(itemId){return {itemId}},gensHeroGold(){return heroState.gold},showToast(){},modal(){}}
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(zoneSrc,context,{filename:'dungeon-zone-content-167824.js'});vm.runInContext(fixSrc,context,{filename:'dungeon-authored-content-hotfix-167841.js'});
const fix=context.DungeonAuthoredContentFix167841,api=context.DungeonZoneContent167824;
assert.ok(fix);assert.equal(fix.APP_VERSION,'16.78.41');assert.equal(api.__dacf167841,true);
let raw=JSON.parse(store.getItem(CONTENT));assert.equal(Object.prototype.hasOwnProperty.call(raw.d1.n1.enemies[0],'hp'),false,'la migration doit supprimer le hp=1/null historique non explicite');
assert.equal(api.applyCurrentZone(),true);
assert.equal(enemies.length,1);assert.equal(enemies[0].hp,10,'un squelette sans PV forcés doit conserver ses PV complets issus de sa fiche');assert.equal(enemies[0].maxHp,10);
let x=JSON.parse(store.getItem(RT));assert.equal(x.last.map.cells[5],'chest','le coffre exact reste visible sur sa case');assert.equal(x.last.map.cells[6],'floor','un piège non révélé ne doit pas dessiner sa position sur la grille');
assert.equal(chestCard.removed,true,'les anciennes cartes Coffre de scène doivent disparaître dans un donjon construit');assert.equal(merchantCard.removed,false,'les autres cartes de scène ne doivent pas être supprimées');
x.positions.aldren=6;store.setItem(RT,JSON.stringify(x));core.render();assert.equal(heroState.wounds,3,'le piège caché doit toujours se déclencher lorsque le héros marche dessus');x=JSON.parse(store.getItem(RT));assert.equal(x.worldContentState167824.d1.n1.triggeredTraps.t1,true);assert.equal(x.last.map.cells[6],'floor');
const explicit=fix.sanitizeContentInput({enemies:[{enemyId:'dng_skeleton',hp:6},{enemyId:'dng_skeleton',hp:null},{enemyId:'dng_skeleton',hp:1}]});assert.equal(explicit.enemies[0].hp,6,'un PV explicitement supérieur à 1 reste supporté');assert.equal(Object.prototype.hasOwnProperty.call(explicit.enemies[1],'hp'),false);assert.equal(Object.prototype.hasOwnProperty.call(explicit.enemies[2],'hp'),false,'le 1 historique issu du bug est migré vers les PV par défaut');
assert.doesNotMatch(fixSrc,/new\s+MutationObserver/,'le hotfix ne doit pas réintroduire un observateur global du DOM');assert.doesNotMatch(fixSrc,/function\s+(?:moveTo|launchCombat200|endTurn|goBackRoom)\s*\(/,'le hotfix ne doit pas réécrire déplacement/combat/timeline');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8'),sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert.match(workflow,/dungeon_authored_content_hotfix_v167841\.test\.cjs/);assert.match(workflow,/dungeon-authored-content-hotfix-167841\.js\?v=167841/);assert.match(sw,/dungeon-authored-content-hotfix-167841\.js/);assert.match(sw,/gensrpg-cache-16\.78\.41-authored-content-fixes/);
const htmlArg=process.argv[2];if(htmlArg){const html=fs.readFileSync(htmlArg,'utf8');const zone=html.indexOf('dungeon-zone-content-167824.js?v=167824'),auth=html.indexOf('dungeon-authored-runtime-167839.js?v=167840'),fixIx=html.indexOf('dungeon-authored-content-hotfix-167841.js?v=167841');assert.ok(zone>=0&&auth>zone&&fixIx>auth,'le site final doit charger le hotfix après le contenu exact et le runtime construit');const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-authored-content-hotfix-167841.js')))}
console.log('Authored content HP/trap/chest hotfix V16.78.41: OK');
