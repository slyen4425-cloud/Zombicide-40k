const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-session-bridge-167832.js'),'utf8');
function storage(){const m=new Map();return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}}}
const localStorage=storage();
let activeAdv='adv-100',ready=0,renders=0,started=0;
const generatedConfig={rooms:100,difficulty:'hard',growth:'normal',boss:'random',bossChance:77,bossRooms:'5,10',roomWeights:{enemy:10,ambush:90,trap:70,chest:60,merchant:40,rest:30,mystery:20},challengeDoorChance:88,challengeChestChance:66,secondaryObjectiveChance:55,specialBranchChance:44,chestTrapChance:33,events:true,eventChance:100};
const cfgByAdv={'adv-100':{enabled:false,dungeonId:''},'adv-20':{enabled:false,dungeonId:''}};
const adventures={
 'adv-100':{id:'adv-100',name:'Morea',config:{...generatedConfig},theme:'Donjon'},
 'adv-20':{id:'adv-20',name:'Donjon court',config:{...generatedConfig,rooms:20,bossChance:12,eventChance:25},theme:'Donjon'}
};
const built={id:'world-test',name:'Nouveau donjon',startNodeId:'z1',nodes:[{id:'z1'},{id:'z2'}],edges:[{id:'e1'}]};
const core={start(){started++;return true}};
const context={console,document:null,localStorage,setTimeout(fn){fn();return 1},alert(msg){throw new Error(msg)},showToast(){},
 activeDungeonAdventureId(){return activeAdv},activeDungeonAdventure(){return adventures[activeAdv]},ensureDungeonAdventureLibrary(){return Object.values(adventures)},
 applyDungeonAdventure(id){activeAdv=String(id);renders++;return true},renderSessionDungeonLibrary(){renders++},renderSessionReadySummary(){ready++},openSessionDungeonSetup(){},
 loadDungeonConfig(){return {...adventures[activeAdv].config,roomWeights:{...adventures[activeAdv].config.roomWeights}}},
 currentRpgEventSettings(){return {roundEvents:true,eventTrigger:'both',eventChance:100,restEnabled:true,restHeal:2,activeTags:['dungeon']}},
 async startConfiguredGame(){started++;return true},DungeonCore01:core,
 DungeonWorldBuilder167821:{loadLibrary(){return [built]},validation(g){return {valid:g.id==='world-test',errors:[],warnings:[]}}},
 DungeonWorldRuntime167823:{getConfig(id){return {...(cfgByAdv[id]||{enabled:false,dungeonId:''})}},saveConfig(next,id){cfgByAdv[id]={...next};return {...cfgByAdv[id]}}}};
context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-world-session-bridge-167832.js'});
const api=context.DungeonWorldSessionBridge167832;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.38');assert.equal(api.VERSION,'2.1.0');
assert.equal(api.worlds()[0].name,'Nouveau donjon');
assert.equal(api.selectWorld('world-test',false),true,'un donjon construit valide doit devenir le choix principal');
assert.deepEqual(JSON.parse(JSON.stringify(api.primary())),{kind:'world',id:'world-test',settingsAdventureId:'adv-100'});
assert.deepEqual(cfgByAdv['adv-100'],{enabled:true,dungeonId:'world-test'});
const builtCfg=context.loadDungeonConfig();
assert.equal(builtCfg.rooms,2,'un monde à 2 zones ne doit plus exposer les 100 salles de Morea au Core');
assert.equal(builtCfg.worldBuilderAuthoritative,true);assert.equal(builtCfg.worldBuilderAutoGeneration,false);
assert.equal(builtCfg.difficulty,'hard','les règles communes restent héritées');
assert.equal(builtCfg.boss,'none');assert.equal(builtCfg.bossChance,0);assert.equal(builtCfg.bossRooms,'');
assert.deepEqual(JSON.parse(JSON.stringify(builtCfg.roomWeights)),{enemy:0,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0});
for(const k of ['challengeDoorChance','challengeChestChance','secondaryObjectiveChance','specialBranchChance','chestTrapChance','eventChance'])assert.equal(builtCfg[k],0,k+' doit être neutralisé dans un monde construit');
assert.equal(builtCfg.events,false);
const builtEvents=context.currentRpgEventSettings();assert.equal(builtEvents.roundEvents,false);assert.equal(builtEvents.eventTrigger,'manual');assert.equal(builtEvents.eventChance,0);assert.equal(builtEvents.restHeal,2,'les réglages communs non aléatoires restent disponibles');

cfgByAdv['adv-100']={enabled:false,dungeonId:''};
(async()=>{
 await context.startConfiguredGame();
 assert.equal(started,1,'le démarrage Dungeon historique doit toujours être appelé une seule fois');
 assert.deepEqual(cfgByAdv['adv-100'],{enabled:true,dungeonId:'world-test'},'le monde choisi doit être resynchronisé juste avant le lancement');
 assert.equal(context.loadDungeonConfig().rooms,2);
 assert.equal(context.currentRpgEventSettings().eventChance,0,'les événements automatiques restent bloqués au lancement');
 context.applyDungeonAdventure('adv-100',true);
 assert.deepEqual(JSON.parse(JSON.stringify(api.primary())),{kind:'adventure',id:'adv-100'});
 assert.deepEqual(cfgByAdv['adv-100'],{enabled:false,dungeonId:''});
 const generated=context.loadDungeonConfig();assert.equal(generated.rooms,100,'revenir à Morea doit restaurer son nombre de salles générées');assert.equal(generated.bossChance,77);assert.equal(generated.roomWeights.ambush,90);assert.equal(generated.specialBranchChance,44);assert.equal(generated.eventChance,100);
 const generatedEvents=context.currentRpgEventSettings();assert.equal(generatedEvents.roundEvents,true);assert.equal(generatedEvents.eventTrigger,'both');assert.equal(generatedEvents.eventChance,100,'les événements restent disponibles pour une vraie aventure générée');
 api.selectWorld('world-test',false);
 context.applyDungeonAdventure('adv-20',true);
 assert.equal(activeAdv,'adv-20');
 assert.deepEqual(JSON.parse(JSON.stringify(api.primary())),{kind:'adventure',id:'adv-20'});
 assert.deepEqual(cfgByAdv['adv-20'],{enabled:false,dungeonId:''});
 assert.equal(context.loadDungeonConfig().rooms,20);
 assert.equal(context.renderSessionDungeonLibrary.__dws167838,true,'la bibliothèque de préparation doit être enrichie sans deuxième moteur');
 assert.match(src,/PRIMARY_KEY="gensrpg_dungeon_primary_selection_v167833"/);
 assert.match(src,/generationNeutralConfig/);assert.match(src,/patchEventSettings/);assert.match(src,/roundEvents:false/);assert.match(src,/eventTrigger:"manual"/);assert.match(src,/ZERO_ROOM_WEIGHTS/);
 assert.match(src,/génération aléatoire désactivée/);assert.match(src,/Embuscades, renforts, boss et fréquences de salles automatiques/);
 assert.doesNotMatch(src,/réglages :/,'un monde construit ne doit plus être présenté comme dépendant des réglages de génération d’une aventure');
 assert.match(src,/retireLegacyWorldRuntimePanel/,'le second sélecteur World Runtime historique doit être retiré de l’interface');
 assert.doesNotMatch(src,/data-dws-generated/,'il ne doit plus exister une deuxième carte Donjon généré active en parallèle');
 assert.doesNotMatch(src,/saveDungeonAdventures\s*=/,'le bridge ne doit pas recréer la bibliothèque Aventure Dungeon');
 const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 assert.match(loader,/dungeon-world-session-bridge-167832\.js\?v=167838/);
 assert.match(sw,/gensrpg-cache-16\.78\.38-built-world-no-auto-generation/);
 assert.match(sw,/dungeon-world-session-bridge-167832\.js/);
 const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-world-session-bridge-167832.js')),'le bridge World Builder doit être présent dans le site final');const builtLoader=fs.readFileSync(path.join(site,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');assert.match(builtLoader,/dungeon-world-session-bridge-167832\.js\?v=167838/)}
 console.log('Dungeon built-world generation settings isolation V16.78.38: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
