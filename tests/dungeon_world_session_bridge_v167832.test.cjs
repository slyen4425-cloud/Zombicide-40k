const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-session-bridge-167832.js'),'utf8');
let cfg={enabled:false,dungeonId:''},ready=0,renders=0,opens=0;
const built={id:'world-test',name:'Donjon test 2 pièces',startNodeId:'z1',nodes:[{id:'z1'},{id:'z2'}],edges:[{id:'e1'}]};
const context={console,document:null,setTimeout(fn){fn();return 1},alert(msg){throw new Error(msg)},showToast(){},
 activeDungeonAdventureId(){return 'adv-1'},ensureDungeonAdventureLibrary(){return [{id:'adv-1'}]},
 renderSessionDungeonLibrary(){renders++},renderSessionReadySummary(){ready++},openSessionDungeonSetup(){opens++},
 DungeonWorldBuilder167821:{loadLibrary(){return [built]},validation(g){return {valid:g.id==='world-test',errors:[],warnings:[]}}},
 DungeonWorldRuntime167823:{getConfig(id){assert.equal(id,'adv-1');return {...cfg}},saveConfig(next,id){assert.equal(id,'adv-1');cfg={...next};return {...cfg}}}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-world-session-bridge-167832.js'});
const api=context.DungeonWorldSessionBridge167832;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.32');
assert.equal(api.worlds()[0].name,'Donjon test 2 pièces');
assert.equal(api.selectWorld('world-test',false),true,'un donjon construit valide doit pouvoir être sélectionné depuis la préparation');assert.deepEqual(cfg,{enabled:true,dungeonId:'world-test'});assert.ok(ready>0);
assert.equal(api.selectGenerated(false),true,'le joueur doit pouvoir revenir au donjon généré');assert.deepEqual(cfg,{enabled:false,dungeonId:''});
assert.equal(typeof context.renderSessionDungeonLibrary,'function');assert.equal(context.renderSessionDungeonLibrary.__dws167832,true,'la bibliothèque de préparation doit être enrichie sans remplacer son ancien système');
assert.match(src,/sessionDungeonLibrary/);assert.match(src,/Donjons construits dans le World Builder/);assert.match(src,/DungeonWorldBuilder167821/);assert.match(src,/DungeonWorldRuntime167823/);assert.doesNotMatch(src,/saveDungeonAdventures\s*=/,'le bridge ne doit pas recréer la bibliothèque Aventure Dungeon');
const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert.match(loader,/dungeon-world-session-bridge-167832\.js\?v=167832/);assert.match(sw,/dungeon-world-session-bridge-167832\.js/);
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-world-session-bridge-167832.js')),'le bridge World Builder doit être présent dans le site final')}
console.log('Dungeon World Builder session bridge V16.78.32: OK');
