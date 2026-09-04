const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-session-bridge-167832.js'),'utf8');
function storage(){const m=new Map();return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const localStorage=storage();
let activeAdv='adv-100',ready=0,renders=0,started=0;
const cfgByAdv={'adv-100':{enabled:false,dungeonId:''},'adv-20':{enabled:false,dungeonId:''}};
const adventures={
 'adv-100':{id:'adv-100',name:'Morea',config:{rooms:100},theme:'Donjon'},
 'adv-20':{id:'adv-20',name:'Donjon court',config:{rooms:20},theme:'Donjon'}
};
const built={id:'world-test',name:'Nouveau donjon',startNodeId:'z1',nodes:[{id:'z1'},{id:'z2'}],edges:[{id:'e1'}]};
const core={start(){started++;return true}};
const context={console,document:null,localStorage,setTimeout(fn){fn();return 1},alert(msg){throw new Error(msg)},showToast(){},
 activeDungeonAdventureId(){return activeAdv},activeDungeonAdventure(){return adventures[activeAdv]},ensureDungeonAdventureLibrary(){return Object.values(adventures)},
 applyDungeonAdventure(id){activeAdv=String(id);renders++;return true},renderSessionDungeonLibrary(){renders++},renderSessionReadySummary(){ready++},openSessionDungeonSetup(){},
 loadDungeonConfig(){return {...adventures[activeAdv].config}},async startConfiguredGame(){started++;return true},DungeonCore01:core,
 DungeonWorldBuilder167821:{loadLibrary(){return [built]},validation(g){return {valid:g.id==='world-test',errors:[],warnings:[]}}},
 DungeonWorldRuntime167823:{getConfig(id){return {...(cfgByAdv[id]||{enabled:false,dungeonId:''})}},saveConfig(next,id){cfgByAdv[id]={...next};return {...cfgByAdv[id]}}}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-world-session-bridge-167832.js'});
const api=context.DungeonWorldSessionBridge167832;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.33');
assert.equal(api.worlds()[0].name,'Nouveau donjon');
assert.equal(api.selectWorld('world-test',false),true,'un donjon construit valide doit devenir le choix principal');
assert.deepEqual(JSON.parse(JSON.stringify(api.primary())),{kind:'world',id:'world-test',settingsAdventureId:'adv-100'});
assert.deepEqual(cfgByAdv['adv-100'],{enabled:true,dungeonId:'world-test'});
assert.equal(context.loadDungeonConfig().rooms,2,'un monde à 2 zones ne doit plus exposer les 100 salles de Morea au Core');
assert.equal(context.loadDungeonConfig().worldBuilderAuthoritative,true);

// Reproduit la régression réelle : l’ancien parcours réinitialise son réglage avant le lancement.
cfgByAdv['adv-100']={enabled:false,dungeonId:''};
(async()=>{
 await context.startConfiguredGame();
 assert.equal(started,1,'le démarrage Dungeon historique doit toujours être appelé une seule fois');
 assert.deepEqual(cfgByAdv['adv-100'],{enabled:true,dungeonId:'world-test'},'le monde choisi doit être resynchronisé juste avant le lancement');
 assert.equal(context.loadDungeonConfig().rooms,2);

 // Un clic explicite sur une aventure générée redevient l’unique sélection et désactive le monde construit.
 context.applyDungeonAdventure('adv-100',true);
 assert.deepEqual(JSON.parse(JSON.stringify(api.primary())),{kind:'adventure',id:'adv-100'});
 assert.deepEqual(cfgByAdv['adv-100'],{enabled:false,dungeonId:''});
 assert.equal(context.loadDungeonConfig().rooms,100,'revenir à Morea doit restaurer son nombre de salles générées');

 api.selectWorld('world-test',false);
 context.applyDungeonAdventure('adv-20',true);
 assert.equal(activeAdv,'adv-20');
 assert.deepEqual(JSON.parse(JSON.stringify(api.primary())),{kind:'adventure',id:'adv-20'});
 assert.deepEqual(cfgByAdv['adv-20'],{enabled:false,dungeonId:''});
 assert.equal(context.loadDungeonConfig().rooms,20);

 assert.equal(context.renderSessionDungeonLibrary.__dws167833,true,'la bibliothèque de préparation doit être enrichie sans deuxième moteur');
 assert.match(src,/PRIMARY_KEY="gensrpg_dungeon_primary_selection_v167833"/);
 assert.match(src,/syncSelectionForStart/);
 assert.match(src,/worldBuilderAuthoritative:true/);
 assert.match(src,/removeBadge/,'l’état ACTIF de l’aventure legacy doit être retiré quand un monde est sélectionné');
 assert.doesNotMatch(src,/data-dws-generated/,'il ne doit plus exister une deuxième carte Donjon généré active en parallèle');
 assert.doesNotMatch(src,/saveDungeonAdventures\s*=/,'le bridge ne doit pas recréer la bibliothèque Aventure Dungeon');
 const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 assert.match(loader,/dungeon-world-session-bridge-167832\.js\?v=167833/);
 assert.match(sw,/gensrpg-cache-16\.78\.35-real-room-sizes-world-geometry/);
 assert.match(sw,/dungeon-world-session-bridge-167832\.js/);
 const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-world-session-bridge-167832.js')),'le bridge World Builder doit être présent dans le site final')}
 console.log('Dungeon single adventure/world selection V16.78.35 cache compatibility: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
