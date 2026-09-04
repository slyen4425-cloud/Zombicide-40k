const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const patch=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-room-visual-config-167825.js'),'utf8');

function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const room={id:'room-a',name:'Crypte',width:4,height:4,cells:Array.from({length:16},()=>({terrain:'floor',object:null}))};
room.cells[5].object='enemy';room.cells[6].object='boss';room.cells[9].object='chest';room.cells[10].object='trap';room.cells[11].object='puzzle';
const graph={id:'world-1',name:'Monde test',nodes:[{id:'zone-1',roomId:'room-a',label:'Crypte entrée'}],edges:[]};
let content={mode:'inherit',enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]};
const localStorage=storage({gensrpg_zone_graphs_v1:JSON.stringify([graph])});
const context={console,Math,Date,localStorage,setTimeout(fn){fn();return 1},DungeonRoomCreator100:{findRoom(id){return id==='room-a'?JSON.parse(JSON.stringify(room)):null},loadLibrary(){return [JSON.parse(JSON.stringify(room))]}},DungeonZoneContent167824:{getZoneContent(){return JSON.parse(JSON.stringify(content))},saveZoneContent(d,n,c){assert.equal(d,'world-1');assert.equal(n,'zone-1');content=JSON.parse(JSON.stringify(c));return content},parseRewardItems(text){return String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(.+?)(?:\s*[x×*]\s*(\d+))?$/);return {itemId:m[1].trim(),qty:Number(m[2]||1)}})},rewardItemsText(items){return items.map(x=>x.itemId+(x.qty>1?' × '+x.qty:'')).join('\n')}}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(patch,context);
const api=context.DungeonRoomVisualConfig167825;
assert.ok(api,'API visuelle absente');
assert.equal(api.APP_VERSION,'16.78.25');

const uses=api.contextsForRoom('room-a');
assert.equal(uses.length,1);assert.equal(uses[0].dungeonName,'Monde test');assert.equal(uses[0].nodeLabel,'Crypte entrée');

api.configureElement('world-1','zone-1','room-a',5,'enemy',{enemyId:'dng_skeleton',qty:2,hasKey:true});
assert.equal(content.mode,'fixed','la première configuration visuelle doit rendre la zone exacte par défaut');
assert.equal(content.enemies.length,1);assert.equal(content.enemies[0].cell,5);assert.equal(content.enemies[0].qty,2);assert.equal(content.enemies[0].hasKey,true);
api.configureElement('world-1','zone-1','room-a',5,'enemy',{enemyId:'dng_orc',qty:1});
assert.equal(content.enemies.length,1,'reconfigurer la même icône ne doit pas dupliquer le monstre');assert.equal(content.enemies[0].enemyId,'dng_orc');

api.configureElement('world-1','zone-1','room-a',6,'boss',{enemyId:'dng_necromancer',qty:1});
assert.equal(content.enemies.length,2);assert.equal(content.enemies.find(x=>x.cell===6).role,'boss');

api.configureElement('world-1','zone-1','room-a',9,'chest',{rarity:'epic',gold:25,itemsText:'potion_soin × 2\nlame_cendre'});
assert.equal(content.chests.length,1);assert.equal(content.chests[0].cell,9);assert.equal(content.chests[0].rarity,'epic');assert.equal(content.chests[0].gold,25);assert.deepEqual(content.chests[0].items,[{itemId:'potion_soin',qty:2},{itemId:'lame_cendre',qty:1}]);
api.configureElement('world-1','zone-1','room-a',9,'chest',{rarity:'rare',gold:10,itemsText:'potion_soin'});
assert.equal(content.chests.length,1,'le coffre déjà placé doit être édité, pas ajouté une seconde fois');assert.equal(content.chests[0].gold,10);

api.configureElement('world-1','zone-1','room-a',10,'trap',{damage:4,trapType:'damage',once:true});
api.configureElement('world-1','zone-1','room-a',11,'puzzle',{refId:'enigme_porte_01',targetType:'cell'});
assert.equal(content.traps[0].cell,10);assert.equal(content.puzzles[0].cell,11);
api.removeElement('world-1','zone-1',10,'trap');assert.equal(content.traps.length,0);

assert.throws(()=>api.configureElement('world-1','zone-1','room-a',3,'chest',{gold:1}),/n’existe plus/,'on ne doit configurer que les éléments réellement placés dans la pièce');
assert.match(patch,/addEventListener\("pointerdown",intercept,true\)/,'le mode visuel doit intercepter le toucher avant l’outil de peinture du créateur');
assert.match(patch,/data-drc-index/,'la configuration doit se baser sur la case cliquée automatiquement');
console.log('Dungeon Room visual configuration V16.78.25: OK');
