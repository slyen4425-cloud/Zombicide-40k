'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('assets/gensrpg/core/inventory-equipped-view-v1.js');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');
const sw=read('service-worker.js');
const graph=read('tests/gens_phase2_runtime_load_graph_v11411.test.cjs');

function before(text,a,b,label){
  const ia=text.indexOf(a),ib=text.indexOf(b);
  assert.ok(ia>=0,label+' missing '+a);
  assert.ok(ib>=0,label+' missing '+b);
  assert.ok(ia<ib,label+' must load '+a+' before '+b);
}

for(const text of [pages,preview]){
  before(text,'inventory-equipped-view-v1.js','dungeon-equipment-hotfix-167817.js',text===pages?'Pages':'preview');
}
assert.ok(sw.includes('./assets/gensrpg/core/inventory-equipped-view-v1.js'),'PWA must precache connected Inventory Core service');

assert.match(hotfix,/GensInventoryEquippedViewV1/,'hotfix must depend on Core Inventory equipped-view authority');
assert.match(hotfix,/equippedItems\(/,'hotfix must delegate equipped view to the Core service');
assert.equal((hotfix.match(/ROOT\.dungeonEquippedItems=wrapped/g)||[]).length,1,'raccord must reuse the existing last owner instead of adding another wrapper');
assert.equal(/baseEquipped\.apply\(/.test(hotfix),false,'runtime equipped view must no longer execute the historical sheet-guarded owner');

const ancient=[
  {id:'helm',name:'Helm'},
  {id:'chest',name:'Chest'},
  {id:'gloves',name:'Gloves'}
];
const map=Object.fromEntries(ancient.map(x=>[x.id,x]));
let baseCalls=0;
const ctx={
  console,Date,Math,Number,Set,Object,
  state:{
    inventory:[{itemId:'helm'},{itemId:'chest'},{itemId:'gloves'}],
    rightHand:0,leftHand:0,
    rpgGear:{head:0,torso:1,hands:2,offhand:null}
  },
  dungeonEquippedItems(){baseCalls++;return []},
  getItemFromEntry(entry){return map[entry?.itemId]||null},
  itemById(id){return map[id]||null},
  dungeonItems(){return ancient},
  equipmentSummary(){return ''},
  equipmentCardStatsHtml(){return ''},
  openEquipmentEditor(){},
  saveEquipmentEditor(){},
  isDungeonMode(){return true},
  ITEMS:[...ancient],
  DUNGEON_EQUIPMENT_SETS:{}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(core,ctx,{filename:'inventory-equipped-view-v1.js'});
vm.runInContext(hotfix,ctx,{filename:'dungeon-equipment-hotfix-167817.js'});

const equipped=Array.from(ctx.dungeonEquippedItems(),x=>x.id);
assert.deepEqual(equipped,['helm','chest','gloves']);
assert.equal(baseCalls,0,'Core raccord must not consult historical dungeonEquippedItems');

ctx.isDungeonMode=()=>false;
assert.deepEqual(Array.from(ctx.dungeonEquippedItems()),[],'non-Dungeon semantics must remain empty');

assert.ok(graph.includes("'assets/gensrpg/core/inventory-equipped-view-v1.js'"));
const connectedStart=graph.indexOf('const phase4ConnectedServices=[');
const inertStart=graph.indexOf('const phase4InertServices=[');
const pos=graph.indexOf("'assets/gensrpg/core/inventory-equipped-view-v1.js'");
assert.ok(pos>connectedStart&&pos<inertStart,'runtime graph must classify Inventory equipped view as connected after raccord');

console.log(JSON.stringify({
  scenario:'Phase 4 Inventory equipped view runtime authority raccord',
  coreLoadedBeforeHotfix:true,
  historicalEquippedOwnerCalls:baseCalls,
  coreEquippedAuthority:true,
  nonDungeonEmpty:true,
  noAdditionalWrapper:true
},null,2));
