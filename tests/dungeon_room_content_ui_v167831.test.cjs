const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-content-ui-167831.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const zoneApi={openEditor(){return true}};
const templateApi={openEditor(){return true}};
const context={console,document:null,DungeonRoomVisualConfig167826:zoneApi,DungeonRoomTemplateContent167828:templateApi,
 dungeonTrapTypes(){return [{id:'trap_existing_1',label:'Piège existant 1'},{id:'trap_existing_2',label:'Piège existant 2'}]},
 enemiesForMode(isDungeon){assert.equal(isDungeon,true);return [{id:'custom_ogre',name:'Ogre de test'},{id:'dng_skeleton',name:'Squelette'}]},
 itemsForMode(isDungeon){assert.equal(isDungeon,true);return [{id:'potion_heal',name:'Potion de soin',rarity:'common'},{id:'lame_cendre',name:'Lame de Cendre',rarity:'epic'}]}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-room-content-ui-167831.js'});
const api=context.DungeonRoomContentUI167831;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.32');
assert.deepEqual(JSON.parse(JSON.stringify(api.trapTypes())),[{id:'trap_existing_1',label:'Piège existant 1'},{id:'trap_existing_2',label:'Piège existant 2'}],'le menu piège doit venir du catalogue existant');
assert.deepEqual(JSON.parse(JSON.stringify(api.enemyItems())),[{id:'custom_ogre',label:'Ogre de test'},{id:'dng_skeleton',label:'Squelette'}],'le menu monstre doit venir de la bibliothèque Dungeon existante');
assert.deepEqual(JSON.parse(JSON.stringify(api.lootItems())),[{id:'lame_cendre',label:'Lame de Cendre',rarity:'epic'},{id:'potion_heal',label:'Potion de soin',rarity:'common'}],'le menu coffre doit venir du catalogue d’objets Dungeon existant');
assert.equal(api.RANDOM_ENEMY_ID,'__random_enemy__');assert.equal(api.RANDOM_ITEM_ID,'__random_item__');
assert.equal(zoneApi.__dui167831Patched,true);assert.equal(templateApi.__dui167831Patched,true);
assert.match(src,/Aléatoire — bibliothèque des monstres/);assert.match(src,/Aléatoire — bibliothèque des objets/);assert.match(src,/enemiesForMode\?\.\(true\)/);assert.match(src,/itemsForMode\?\.\(true\)/);assert.match(src,/dungeonTrapTypes\?\.\(\)/);assert.match(src,/Ajouter au coffre/);
assert.doesNotMatch(src,/PV forcés/);assert.doesNotMatch(src,/Porte la clé/);assert.doesNotMatch(src,/>Quantité<input[^>]*Enemy/);
assert.match(loader,/dungeon-random-library-content-167832\.js\?v=167833/);assert.match(loader,/dungeon-world-session-bridge-167832\.js\?v=167833/);assert.match(loader,/dungeon-room-content-ui-167831\.js\?v=167833/);
assert.match(sw,/gensrpg-cache-16\.78\.37-built-world-isolation/);assert.match(sw,/dungeon-room-content-ui-167831\.js/);assert.match(sw,/dungeon-random-library-content-167832\.js/);assert.match(sw,/dungeon-world-session-bridge-167832\.js/);
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));for(const f of ['dungeon-room-content-ui-167831.js','dungeon-random-library-content-167832.js','dungeon-world-session-bridge-167832.js'])assert.ok(fs.existsSync(path.join(site,'assets','dungeon',f)),f+' doit être présent dans le site final');const built=fs.readFileSync(path.join(site,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');assert.match(built,/dungeon-room-content-ui-167831\.js\?v=167833/);assert.match(built,/dungeon-random-library-content-167832\.js\?v=167833/);assert.match(built,/dungeon-world-session-bridge-167832\.js\?v=167833/)}
console.log('Dungeon intuitive random-library UI V16.78.37 loading: OK');
