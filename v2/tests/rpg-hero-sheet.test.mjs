import assert from 'node:assert/strict';
import { buildHeroSheetModel, renderHeroSheet } from '../src/modes/rpg/hero-sheet.js';

const definitions={
  stats:[{id:'force',name:'Force',icon:'💪',baseValue:5,visible:true,enabled:true},{id:'hidden',name:'Cachée',baseValue:99,visible:false,enabled:true}],
  resources:[{id:'pv',name:'PV',icon:'❤️',min:0,maxFormula:{kind:'stat',statId:'force',multiplier:2,add:10},visible:true,enabled:true}],
  skills:[{id:'slash',name:'Taillade',icon:'⚔️',kind:'active'}],
  items:[{id:'sword',name:'Épée',icon:'🗡️',enabled:true}],
  sets:[],effects:[],forms:[]
};
const hero={id:'aldren',name:'Aldren',icon:'🛡️',statValues:{force:7},resourceValues:{pv:20},skillIds:['slash'],inventorySlots:['main-hand'],startingItems:[{itemId:'sword',quantity:1}]};
const model=buildHeroSheetModel(hero,definitions);
assert.equal(model.name,'Aldren');
assert.equal(model.stats.length,1);
assert.equal(model.stats[0].value,7);
assert.equal(model.resources[0].max,24);
assert.equal(model.resources[0].current,20);
assert.equal(model.skills[0].name,'Taillade');
assert.equal(model.startingItems[0].name,'Épée');
const html=renderHeroSheet(model);
assert.match(html,/FICHE HÉROS/);
assert.match(html,/Aldren/);
assert.match(html,/20\/24/);
assert.match(html,/Taillade/);
assert.match(html,/Épée/);
console.log('rpg hero sheet ok');
