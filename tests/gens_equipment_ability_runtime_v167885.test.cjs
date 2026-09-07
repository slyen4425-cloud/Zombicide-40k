const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-equipment-ability-runtime-167885.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'equipment ability runtime must stay syntactically valid');
assert.match(src,/APP_VERSION="16\.78\.85"/);
assert.match(src,/rpgAbilityRefs/,'equipment references must remain the grant source');
assert.match(src,/loadAbilityLibrary/,'ability definitions must come from the existing library');
assert.match(src,/dungeonTreeNodesForHero/);
assert.match(src,/dungeonUnlockedActiveTalents/);
assert.match(src,/dungeonUnlockedSkillEffectsForHero/);
assert.doesNotMatch(src,/dungeonTalentCalculatedAmount|applyDungeonAttackDamage|effectiveAttackStats|dungeonHeroMoveValue083|enemyCells\s*=|dungeonRoom\s*=|setInterval|MutationObserver/,'V16.78.85 must stay isolated from combat math, movement and global observers');

const abilities=[
 {id:'shadow_step',name:'Pas d’ombre',type:'active',usageScopes:['rpgHero'],effects:[{kind:'buff',value:1}]},
 {id:'iron_skin',name:'Peau de fer',type:'passive',usageScopes:['rpgHero'],effects:[{kind:'armor',value:2}]},
 {id:'capture_only',name:'Capture',type:'active',usageScopes:['capture']}
];
const items={
 sword:{id:'sword',rpgAbilityRefs:['shadow_step','shadow_step']},
 armor:{id:'armor',rpgAbilityRefs:['iron_skin','capture_only']}
};
let state={inventory:[{itemId:'sword'},{itemId:'armor'}],rightHand:0,leftHand:null,equipment:null,rpgGear:{armor:1}};
const sandbox={console,window:null,globalThis:null};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
sandbox.loadAbilityLibrary=()=>abilities;
sandbox.gensAbilityUsages=a=>a.usageScopes;
sandbox.loadState=()=>state;
sandbox.itemById=id=>items[id]||null;
sandbox.dungeonTreeNodesForHero=()=>[{id:'base_node',type:'active'}];
sandbox.dungeonUnlockedActiveTalents=()=>[{id:'base_active',type:'active'}];
sandbox.dungeonUnlockedSkillEffectsForHero=()=>[{kind:'base',value:1}];
vm.runInNewContext(src,sandbox);
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.GensEquipmentAbilityRuntime167885.grantedAbilityIds('h'))),['shadow_step','iron_skin','capture_only'],'equipped items should expose their stored refs once each');
const granted=sandbox.GensEquipmentAbilityRuntime167885.grantedAbilities('h');
assert.deepEqual(granted.map(x=>x.id),['shadow_step','iron_skin'],'only RPG-library abilities should be granted');
assert.equal(granted[0].grantedByEquipment,true);
assert.equal(granted[0].cost,0);
assert.deepEqual(sandbox.dungeonUnlockedActiveTalents('h').map(x=>x.id),['base_active','shadow_step'],'equipped active ability should join the existing active talent list');
assert.deepEqual(sandbox.dungeonTreeNodesForHero('h').map(x=>x.id),['base_node','shadow_step','iron_skin'],'equipment abilities should join the existing talent tree result without duplicates');
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.dungeonUnlockedSkillEffectsForHero('h'))),[{kind:'base',value:1},{kind:'armor',value:2}],'equipped passive ability effects should reuse the existing passive effect pipeline');
state={inventory:[{itemId:'sword'},{itemId:'armor'}],rightHand:null,leftHand:null,equipment:null,rpgGear:{}};
assert.deepEqual(sandbox.dungeonUnlockedActiveTalents('h').map(x=>x.id),['base_active'],'unequipping the item must immediately remove the granted ability');
assert.equal(abilities[0].cost,undefined,'library definitions must not be mutated');
console.log('GenSrpG equipment ability runtime V16.78.85 regression: OK');
