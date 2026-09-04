const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const editor=fs.readFileSync(process.argv[2], 'utf8');
const built=process.argv[3]?fs.readFileSync(process.argv[3], 'utf8'):'';
const workflow=fs.readFileSync(process.argv[4]||'.github/workflows/main.yml','utf8');
const sw=fs.readFileSync(process.argv[5]||'service-worker.js','utf8');

function storage(initial={}){const m=new Map(Object.entries(initial));return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
let itemOverrides={};
const ancient=[
 {id:'ditem_ancient_helm',name:'Heaume des Anciens',type:'Équipement',rpgSlot:'head',setId:'set_ancient',setPieceId:'head',dungeonBuiltin:true},
 {id:'ditem_ancient_chest',name:'Plastron des Anciens',type:'Équipement',rpgSlot:'torso',setId:'set_ancient',setPieceId:'torso',dungeonBuiltin:true},
 {id:'ditem_ancient_gauntlets',name:'Gantelets des Anciens',type:'Équipement',rpgSlot:'hands',setId:'set_ancient',setPieceId:'hands',dungeonBuiltin:true}
];
const ctx={console,Math,Date,localStorage:storage(),
 DUNGEON_EQUIPMENT_SETS:{set_ancient:{id:'set_ancient',name:'Armure des Anciens',pieceCount:5,thresholds:[{pieces:2,bonuses:{armor:1}},{pieces:3,bonuses:{magicDefense:1}},{pieces:4,bonuses:{endurance:2}},{pieces:5,bonuses:{defense:1,force:1}}]}},
 DUNGEON_ITEM_DEFINITIONS_316:ancient,
 dungeonItems(){return ancient.map(item=>({...item,...(itemOverrides[item.id]||{})}))},
 itemById(id){return ctx.dungeonItems().find(x=>x.id===id)||null},
 loadDungeonItemOverrides(){return JSON.parse(JSON.stringify(itemOverrides))},
 saveDungeonItemOverrides(next){itemOverrides=JSON.parse(JSON.stringify(next))},
 dungeonSetStateFromItems316(items,registry){registry=registry||ctx.DUNGEON_EQUIPMENT_SETS;const groups={};for(const item of items){if(!item.setId||!registry[item.setId])continue;const g=groups[item.setId]||(groups[item.setId]={set:registry[item.setId],pieces:new Set(),items:[]});if(!g.pieces.has(item.setPieceId)){g.pieces.add(item.setPieceId);g.items.push(item)}}return Object.entries(groups).map(([setId,g])=>{const count=g.pieces.size,bonuses={};for(const t of g.set.thresholds.filter(t=>count>=t.pieces))for(const [k,v] of Object.entries(t.bonuses||{}))bonuses[k]=(bonuses[k]||0)+Number(v||0);return {setId,set:g.set,count,items:g.items,bonuses}})}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(editor,ctx,{filename:'dungeon-set-editor-167818.js'});
assert.ok(ctx.DungeonSetEditor,'éditeur de sets exposé');
assert.equal(ctx.DungeonSetEditor.VERSION,'16.78.18');
let result=ctx.DungeonSetEditor.saveSetDefinition({id:'set_ancient',name:'Armure des Anciens reforgée',pieceCount:5,thresholds:[{pieces:2,bonuses:{armor:2,crit:5}},{pieces:3,bonuses:{force:2}},{pieces:5,bonuses:{defense:3}}]});
assert.equal(result.ok,true);assert.equal(ctx.DUNGEON_EQUIPMENT_SETS.set_ancient.name,'Armure des Anciens reforgée');
let state=ctx.dungeonSetStateFromItems316(ctx.dungeonItems(),ctx.DUNGEON_EQUIPMENT_SETS)[0];
assert.equal(state.count,3);assert.equal(state.bonuses.armor,2);assert.equal(state.bonuses.crit,5);assert.equal(state.bonuses.force,2);assert.equal(state.bonuses.magicDefense,undefined);
const stored=JSON.parse(ctx.localStorage.getItem(ctx.DungeonSetEditor.STORAGE_KEY));assert.equal(stored.set_ancient.thresholds[0].bonuses.crit,5);
result=ctx.DungeonSetEditor.persistItemMembership('ditem_ancient_helm','custom_set_test','head');assert.equal(result.persisted,true);assert.equal(itemOverrides.ditem_ancient_helm.setId,'custom_set_test');
result=ctx.DungeonSetEditor.saveSetDefinition({id:'custom_set_test',name:'Set test',pieceCount:2,thresholds:[{pieces:2,bonuses:{endurance:4}}]});assert.ok(ctx.DUNGEON_EQUIPMENT_SETS.custom_set_test);
result=ctx.DungeonSetEditor.resetSetDefinition('custom_set_test');assert.equal(result.set,null);assert.equal(ctx.DUNGEON_EQUIPMENT_SETS.custom_set_test,undefined);
result=ctx.DungeonSetEditor.resetSetDefinition('set_ancient');assert.equal(result.set.name,'Armure des Anciens');assert.equal(result.set.thresholds[0].bonuses.armor,1);
for(const label of ['Nom du set','Nombre de pièces','Pièces associées','Ajouter un palier','Enregistrer le set','Armure','Défense magique','Critique %'])assert.match(editor,new RegExp(label));
assert.match(editor,/paliers sont <strong>cumulatifs<\/strong>/);
assert.match(workflow,/dungeon-set-editor-167818\.js/);assert.match(workflow,/dungeon_set_editor_v167818\.test\.cjs/);
assert.match(sw,/const CACHE_NAME\s*=\s*"gensrpg-cache-16\.78\.\d+-[^"]+"/);assert.match(sw,/dungeon-set-editor-167818\.js/);
if(built){const hotfixPos=built.lastIndexOf('dungeon-equipment-hotfix-167817.js');const setEditorPos=built.lastIndexOf('dungeon-set-editor-167818.js');assert.ok(setEditorPos>hotfixPos,'éditeur de sets doit charger après le hotfix équipement');}
console.log('Dungeon set editor V16.78.18: OK');
