import assert from 'node:assert/strict';
import {createHeroDefinition,validateHeroDefinition,createHeroRuntime,resolveHeroSkillIds,heroSheetSnapshot,setHeroKo,setHeroDead} from '../src/modes/rpg/hero-engine.js';
import {createItemDefinition,addItem,equipItem} from '../src/modes/rpg/inventory-engine.js';
import {createSetDefinition} from '../src/modes/rpg/set-engine.js';

const stats=[{id:'force',name:'Force',baseValue:2,min:0,max:20},{id:'agi',name:'Agilité',baseValue:3,min:0,max:20}];
const resources=[{id:'pv',name:'PV',min:0,maxFormula:{kind:'stat',statId:'force',multiplier:5,add:10}}];
const skills=[{id:'slash',name:'Taillade'},{id:'bow-shot',name:'Tir'},{id:'set-skill',name:'Ancienne garde'},{id:'form-skill',name:'Rage'}];
const sword=createItemDefinition({id:'sword',name:'Épée',kind:'weapon',equipSlots:['main-hand'],skillIds:['slash']});
const helm=createItemDefinition({id:'helm',name:'Casque ancien',kind:'armor',equipSlots:['head']});
const chest=createItemDefinition({id:'chest',name:'Plastron ancien',kind:'armor',equipSlots:['body']});
const oldSet=createSetDefinition({id:'ancient',name:'Armure des Anciens',itemIds:['helm','chest'],thresholds:[{pieces:2,skillIds:['set-skill']}]});
const definitions={stats,resources,skills,items:[sword,helm,chest],sets:[oldSet],effects:[]};

const hero=createHeroDefinition({
  id:'aldren',name:'Aldren',statValues:{force:6},resourceValues:{pv:22},skillIds:['bow-shot'],inventorySlots:['main-hand','head','body'],startingItems:[{itemId:'sword',quantity:1}]
});
assert.equal(validateHeroDefinition(hero,definitions).valid,true);
let runtime=createHeroRuntime(hero,definitions);
assert.equal(runtime.state.stats.force,6);
assert.equal(runtime.state.stats.agi,3);
assert.equal(runtime.state.resources.pv.max,40);
assert.equal(runtime.state.resources.pv.current,22);
assert.equal(runtime.progression.level,1);

let out=addItem(runtime.inventory,'sword',1,definitions); runtime.inventory=out.inventory;
out=equipItem(runtime.inventory,runtime.inventory.entries.find(e=>e.itemId==='sword').entryId,'main-hand',definitions); runtime.inventory=out.inventory;
out=addItem(runtime.inventory,'helm',1,definitions); runtime.inventory=out.inventory;
out=equipItem(runtime.inventory,runtime.inventory.entries.find(e=>e.itemId==='helm').entryId,'head',definitions); runtime.inventory=out.inventory;
out=addItem(runtime.inventory,'chest',1,definitions); runtime.inventory=out.inventory;
out=equipItem(runtime.inventory,runtime.inventory.entries.find(e=>e.itemId==='chest').entryId,'body',definitions); runtime.inventory=out.inventory;
runtime.activeForms=[{id:'rage-form',addedSkillIds:['form-skill']}];
assert.deepEqual(resolveHeroSkillIds(runtime,definitions),['bow-shot','slash','set-skill','form-skill']);
const sheet=heroSheetSnapshot(runtime,definitions);
assert.equal(sheet.setProgress[0].equipped,2);
assert.deepEqual(sheet.skillIds,['bow-shot','slash','set-skill','form-skill']);

runtime=setHeroKo(runtime,true); assert.equal(runtime.ko,true); assert.equal(runtime.active,false);
runtime=setHeroKo(runtime,false); assert.equal(runtime.ko,false); assert.equal(runtime.active,true);
runtime=setHeroDead(runtime,true); assert.equal(runtime.dead,true); assert.equal(runtime.ko,true); assert.equal(runtime.active,false);

const broken=createHeroDefinition({id:'bad',name:'Cassé',statValues:{missing:1},skillIds:['ghost'],startingItems:[{itemId:'void',quantity:1}]});
const check=validateHeroDefinition(broken,definitions);
assert.equal(check.valid,false);
assert.equal(check.errors.some(e=>e.code==='missing-stat'),true);
assert.equal(check.errors.some(e=>e.code==='missing-skill'),true);
assert.equal(check.errors.some(e=>e.code==='missing-item'),true);
console.log('rpg hero engine ok');
