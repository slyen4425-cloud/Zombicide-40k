import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHeroSheetModel, renderHeroSheet } from '../src/modes/rpg/hero-sheet.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const definitions={
  stats:[{id:'force',name:'Force',icon:'💪',enabled:true,visible:true,baseValue:10}],
  resources:[{id:'hp',name:'PV',icon:'❤️',enabled:true,visible:true,min:0,max:{mode:'fixed',value:12}}],
  skills:[{id:'slash',name:'Frappe',icon:'⚔️',kind:'active',enabled:true}],
  items:[
    {id:'sword',name:'Épée',icon:'🗡️',kind:'weapon',rarity:'rare',enabled:true,stackable:false,maxStack:1,equipSlots:['main-hand'],occupiesSlots:[],effectIds:[],skillIds:[]},
    {id:'potion',name:'Potion',icon:'🧪',kind:'consumable',rarity:'common',enabled:true,stackable:true,maxStack:99,equipSlots:[],occupiesSlots:[],effectIds:[],skillIds:[]},
  ],
  itemSets:[],effects:[],heroForms:[],
};
const hero={id:'hero',name:'Aldren',icon:'🧙',enabled:true,statValues:{force:12},resourceValues:{hp:12},skillIds:['slash'],inventorySlots:['main-hand','body'],startingItems:[{itemId:'sword',quantity:1},{itemId:'potion',quantity:2}],startingEquipment:[{itemId:'sword',slot:'main-hand'}]};
const model=buildHeroSheetModel(hero,definitions);
assert.equal(model.name,'Aldren');
assert.equal(model.inventory.length,2);
assert.equal(model.inventory.find(x=>x.itemId==='sword')?.equipped,true);
assert.equal(model.inventory.find(x=>x.itemId==='potion')?.quantity,2);
assert.equal(model.equipment.find(x=>x.slot==='main-hand')?.item?.itemId,'sword');
assert.equal(model.equipment.find(x=>x.slot==='body')?.empty,true);
const html=renderHeroSheet(model);
assert.match(html,/Équipement/);
assert.match(html,/Inventaire/);
assert.match(html,/Compétences/);
assert.match(html,/hero-sheet-section-nav/);
assert.match(html,/Épée/);
assert.match(html,/Potion/);
assert.match(html,/main-hand/);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src/ui/hero-sheet-ui.css'),'utf8');
assert.match(index,/hero-sheet-ui\.css/);
assert.match(css,/hero-equipment-grid/);
assert.match(css,/hero-inventory-grid/);
assert.match(css,/@media\(max-width:720px\)/);
console.log('rpg-hero-sheet-presentation: ok');
