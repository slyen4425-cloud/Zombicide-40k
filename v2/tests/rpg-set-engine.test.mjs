import assert from 'node:assert/strict';
import {createInventoryState,createItemDefinition,addItem,equipItem} from '../src/modes/rpg/inventory-engine.js';
import {createSetDefinition,validateSetDefinition,equippedSetProgress,resolveEquippedSetBonuses,formatSetProgress} from '../src/modes/rpg/set-engine.js';

const items=[
  createItemDefinition({id:'ancient-head',name:'Casque ancien',kind:'armor',equipSlots:['head']}),
  createItemDefinition({id:'ancient-body',name:'Plastron ancien',kind:'armor',equipSlots:['body']}),
  createItemDefinition({id:'ancient-hands',name:'Gantelets anciens',kind:'armor',equipSlots:['hands']}),
  createItemDefinition({id:'ancient-legs',name:'Jambières anciennes',kind:'armor',equipSlots:['legs']}),
  createItemDefinition({id:'ancient-feet',name:'Bottes anciennes',kind:'armor',equipSlots:['feet']}),
];
const definitions={items,effects:[{id:'set2-def'},{id:'set3-resist'},{id:'set5-power'}],skills:[{id:'ancient-guard'}]};
const set=createSetDefinition({
  id:'ancient-set',name:'Armure des Anciens',itemIds:items.map(x=>x.id),
  thresholds:[
    {pieces:2,effectIds:['set2-def'],label:'Défense ancienne'},
    {pieces:3,effectIds:['set3-resist']},
    {pieces:5,effectIds:['set5-power'],skillIds:['ancient-guard']},
  ]
});
definitions.sets=[set];
assert.equal(validateSetDefinition(set,definitions).valid,true);

let inv=createInventoryState({slots:['head','body','hands','legs','feet']});
for(const item of items){const out=addItem(inv,item.id,1,definitions); assert.equal(out.ok,true); inv=out.inventory;}
for(const [itemId,slot] of [['ancient-head','head'],['ancient-body','body'],['ancient-hands','hands']]){
  const entry=inv.entries.find(e=>e.itemId===itemId); const out=equipItem(inv,entry.entryId,slot,definitions); assert.equal(out.ok,true); inv=out.inventory;
}
let progress=equippedSetProgress(inv,set);
assert.equal(progress.equipped,3); assert.equal(progress.total,5); assert.equal(progress.activeThresholds.length,2);
assert.equal(formatSetProgress(set,progress),'Armure des Anciens — 3/5');
let bonuses=resolveEquippedSetBonuses(inv,definitions);
assert.deepEqual(bonuses.effectIds,['set2-def','set3-resist']); assert.deepEqual(bonuses.skillIds,[]);

for(const [itemId,slot] of [['ancient-legs','legs'],['ancient-feet','feet']]){const entry=inv.entries.find(e=>e.itemId===itemId); inv=equipItem(inv,entry.entryId,slot,definitions).inventory;}
progress=equippedSetProgress(inv,set); bonuses=resolveEquippedSetBonuses(inv,definitions);
assert.equal(progress.equipped,5); assert.equal(progress.activeThresholds.length,3);
assert.deepEqual(bonuses.effectIds,['set2-def','set3-resist','set5-power']); assert.deepEqual(bonuses.skillIds,['ancient-guard']);

const broken=createSetDefinition({id:'broken',name:'Cassé',itemIds:['missing'],thresholds:[{pieces:2,effectIds:['missing-effect']}]});
assert.equal(validateSetDefinition(broken,definitions).valid,false);
console.log('rpg set engine ok');
