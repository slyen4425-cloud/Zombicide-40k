const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const core317=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-core-317.js'),'utf8');

function script(id){
  const m=html.match(new RegExp(`<script id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`));
  assert.ok(m,`script ${id} introuvable`);return m[1];
}
function storage(initial={}){
  const values=new Map(Object.entries(initial));
  return {getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}};
}
function loadCore317(runtime){
  const listeners={};
  const context={
    console,
    localStorage:storage(runtime?{gensrpg_dungeon_runtime_v2:JSON.stringify(runtime)}:{}),
    document:{readyState:'loading',documentElement:{},addEventListener(type,fn){listeners[type]=fn},getElementById(){return null},createElement(){return {}}},
    MutationObserver:class{observe(){}},
    requestAnimationFrame(fn){fn()},setTimeout(fn){fn();return 1},alert(){},
    Date,Math
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(script('dungeonCore313SpatialModel'),context);
  vm.runInContext(core317,context);
  return context;
}

function testPatchMarkers(){
  assert.match(html,/assets\/dungeon\/dungeon-core-317\.js/,'index.html doit charger Core 3.17');
  assert.match(html,/id="rpgMerchantStockWeapons"/,'stock Armes éditable manquant');
  assert.match(html,/id="rpgMerchantStockEquipment"/,'stock Équipements éditable manquant');
  assert.match(html,/id="rpgMerchantStockConsumables"/,'stock Consommables éditable manquant');
  assert.match(html,/id="rpgMerchantStockOther"/,'stock Autres éditable manquant');
  assert.match(html,/id="drArmorZeroBlockChance"/,'chance de blocage total manquante');
  assert.match(html,/DungeonCore317\.resolveArmorFloor\(elemental,reduction,configuredMin,profile\.damageType,rules\)/,'résolution d’armure 3.17 non branchée');
  assert.match(sw,/gensrpg-cache-16\.78\.11-dungeon-core317/,'cache PWA 16.78.11 manquant');
  assert.match(sw,/assets\/dungeon\/dungeon-core-317\.js/,'Core 3.17 doit être pré-caché');
}

function testArmor75_25AndMagicUntouched(){
  const c=loadCore317();const f=c.DungeonCore317.resolveArmorFloor;
  const rules={armorZeroBlockChance:75};
  assert.equal(f(2,5,1,'physical',rules,0),0);
  assert.equal(f(2,5,1,'physical',rules,74.999),0);
  assert.equal(f(2,5,1,'physical',rules,75),1);
  assert.equal(f(2,5,1,'physical',rules,99.999),1);
  assert.equal(f(4,2,1,'physical',rules,0),2,'la règle 75/25 ne s’applique que si la réduction atteindrait zéro');
  assert.equal(f(2,5,1,'magic',rules,0),1,'les dégâts magiques conservent leur plancher actuel');
  assert.equal(f(2,5,1,'feu',rules,0),1,'les dégâts élémentaires ne doivent pas recevoir le blocage physique');
  assert.equal(f(1,5,1,'physical',{armorZeroBlockChance:0},0),1);
  assert.equal(f(1,5,1,'physical',{armorZeroBlockChance:100},99.99),0);
}

function testMerchantCategoriesAndLimits(){
  const c=loadCore317(),d=c.DungeonCore317;
  assert.equal(d.merchantCategory({type:'Arme',name:'Épée'}),'weapons');
  assert.equal(d.merchantCategory({type:'Équipement',rpgSlot:'torso'}),'equipment');
  assert.equal(d.merchantCategory({type:'Consommable',name:'Potion'}),'consumables');
  assert.equal(d.merchantCategory({type:'Objet',name:'Vieille pièce'}),'other');
  assert.deepEqual(JSON.parse(JSON.stringify(d.stockLimits({merchantStockLimits:{weapons:2,equipment:4,consumables:7,other:1}}))),{weapons:2,equipment:4,consumables:7,other:1});
  assert.match(core317,/RUPTURE/,'le marchand doit afficher une rupture de stock');
  assert.match(core317,/stock\[id\]=qty-1/,'un achat doit décrémenter le stock');
  assert.match(core317,/stock\[id\]=Math\.max\(0,Number\(stock\[id\]\)\|\|0\)\+1/,'une revente doit remettre l’objet en stock');
}

function testBackwardRoomRoundTripKeepsHeroesAndEnemies(){
  const runtime={
    participants:['aldren','lyra'],index:0,room:3,
    last:{kind:'enemy',room:3,marker:'room-three',map:{size:2,cells:['entry','floor','enemy','exit'],entryIdx:0,exitIdx:3}},
    positions:{aldren:0,lyra:1},remaining:{aldren:2,lyra:3},enemyCells:{e3:2},
    heroRooms:{aldren:3,lyra:2},heroBranchStates:{},
    roomStates:{
      '2':{last:{kind:'enemy',room:2,marker:'room-two',map:{size:2,cells:['entry','floor','enemy','exit'],entryIdx:0,exitIdx:3}},enemyCells:{e2:2}},
      '3':{last:{kind:'enemy',room:3,marker:'room-three',map:{size:2,cells:['entry','floor','enemy','exit'],entryIdx:0,exitIdx:3}},enemyCells:{e3:2}}
    }
  };
  const c=loadCore317(runtime),spatial=c.DungeonSpatial313;
  assert.equal(c.DungeonCore317.goBackRoom({silent:true,skipRender:true,ignorePosition:true}),true);
  let x=JSON.parse(c.localStorage.getItem('gensrpg_dungeon_runtime_v2'));
  spatial.ensure(x);
  assert.equal(spatial.roomOf(x,'aldren'),2,'Aldren doit revenir en salle 2');
  assert.equal(spatial.roomOf(x,'lyra'),2,'Lyra doit rester en salle 2');
  assert.equal(x.last.marker,'room-two','la salle 2 doit être rechargée, pas recréée');
  assert.equal(x.enemyCells.e2,2,'les ennemis persistants de la salle 2 doivent être resynchronisés');
  assert.equal(x.remaining.aldren,2,'le mouvement restant ne doit pas être réinitialisé au retour');
  assert.equal(x.positions.lyra,1,'le retour d’Aldren ne doit pas téléporter Lyra');

  spatial.persist(x);
  spatial.setRoom(x,'aldren',3);
  spatial.activate(x,'aldren');
  x.remaining.aldren=2;
  assert.equal(spatial.roomOf(x,'aldren'),3);
  assert.equal(spatial.roomOf(x,'lyra'),2,'le trajet 2→3 ne doit toujours pas déplacer Lyra');
  assert.equal(x.last.marker,'room-three','la salle 3 déjà visitée doit être rechargée');
  assert.equal(x.enemyCells.e3,2,'les ennemis persistants de la salle 3 doivent être restaurés');
  assert.equal(x.remaining.aldren,2,'le mouvement restant doit survivre au trajet 3→2→3');
}

testPatchMarkers();
testArmor75_25AndMagicUntouched();
testMerchantCategoriesAndLimits();
testBackwardRoomRoundTripKeepsHeroesAndEnemies();
console.log('Core 3.17 regressions: OK');
