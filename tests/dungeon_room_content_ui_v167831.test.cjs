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
 itemsForMode(isDungeon){assert.equal(isDungeon,true);return [{id:'potion_heal',name:'Potion de soin',rarity:'common'},{id:'lame_cendre',name:'Lame de Cendre',rarity:'epic'}]}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-room-content-ui-167831.js'});
const api=context.DungeonRoomContentUI167831;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.31');
assert.deepEqual(JSON.parse(JSON.stringify(api.trapTypes())),[{id:'trap_existing_1',label:'Piège existant 1'},{id:'trap_existing_2',label:'Piège existant 2'}],'le menu piège doit venir du catalogue existant');
assert.deepEqual(JSON.parse(JSON.stringify(api.lootItems())),[{id:'lame_cendre',label:'Lame de Cendre',rarity:'epic'},{id:'potion_heal',label:'Potion de soin',rarity:'common'}],'le menu coffre doit venir du catalogue d’objets Dungeon existant');
assert.equal(zoneApi.__dui167831Patched,true);assert.equal(templateApi.__dui167831Patched,true);
assert.match(src,/1 marqueur = 1 ennemi/);assert.match(src,/itemsForMode\?\.\(true\)/);assert.match(src,/dungeonTrapTypes\?\.\(\)/);assert.match(src,/Ajouter au coffre/);assert.match(src,/TrapType\" value=\"reference/);
assert.doesNotMatch(src,/PV forcés/);assert.doesNotMatch(src,/Porte la clé/);assert.doesNotMatch(src,/>Quantité<input[^>]*Enemy/);
assert.match(loader,/dungeon-room-content-ui-167831\.js\?v=167831/);assert.match(loader,/dungeon-room-grid-capture-167830\.js\?v=167831/);assert.match(sw,/gensrpg-cache-16\.78\.31-intuitive-content-multiplayer/);assert.match(sw,/dungeon-room-content-ui-167831\.js/);
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-content-ui-167831.js')),'le menu intuitif doit être présent dans le site final');const built=fs.readFileSync(path.join(site,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');assert.match(built,/dungeon-room-content-ui-167831\.js\?v=167831/)}
console.log('Dungeon intuitive exact-content UI V16.78.31: OK');
