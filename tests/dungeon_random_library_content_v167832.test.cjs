const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-random-library-content-167832.js'),'utf8');
let spawned=[],made=[];
const context={console,Math:{...Math,random(){return 0}},document:null,setTimeout(fn){fn();return 1},
 enemiesForMode(dungeon){assert.equal(dungeon,true);return [{id:'custom_ogre',name:'Ogre'},{id:'dng_skeleton',name:'Squelette'}]},
 itemsForMode(dungeon){assert.equal(dungeon,true);return [{id:'potion_heal',name:'Potion'},{id:'lame_cendre',name:'Lame'}]},
 trackSpawnedEnemyInstances(type,qty,room){spawned.push({type,qty,room});return ['e1']},
 makeInventoryEntry(itemId){made.push(itemId);return {itemId}}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-random-library-content-167832.js'});
const api=context.DungeonRandomLibraryContent167832;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.32');
assert.deepEqual(Array.from(api.enemyPool()),['custom_ogre','dng_skeleton']);assert.deepEqual(Array.from(api.itemPool()),['potion_heal','lame_cendre']);
context.trackSpawnedEnemyInstances('__random_enemy__',1,7);assert.equal(spawned.at(-1).type,'custom_ogre','l’ennemi aléatoire doit être résolu depuis enemiesForMode(true) avant le spawn existant');
context.makeInventoryEntry('__random_item__');assert.equal(made.at(-1),'potion_heal','l’objet aléatoire doit être résolu depuis itemsForMode(true) avant l’inventaire existant');
context.trackSpawnedEnemyInstances('dng_skeleton',1,7);assert.equal(spawned.at(-1).type,'dng_skeleton','un choix exact ne doit pas être modifié');
context.makeInventoryEntry('lame_cendre');assert.equal(made.at(-1),'lame_cendre','un objet exact ne doit pas être modifié');
assert.doesNotMatch(src,/localStorage\.setItem\([^)]*enemy/i,'la couche aléatoire ne doit pas créer de seconde bibliothèque ennemie');
assert.doesNotMatch(src,/localStorage\.setItem\([^)]*item/i,'la couche aléatoire ne doit pas créer de seconde bibliothèque objet');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert.match(sw,/dungeon-random-library-content-167832\.js/);
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-random-library-content-167832.js')))}
console.log('Dungeon random library content V16.78.32: OK');
