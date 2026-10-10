'use strict';
// Phase 9: creator-defined Capture locations and profile-local world data
// must survive the physical extraction with zero gameplay rule changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/gensrpg/capture/world-exploration-v1.js'),'utf8');
const local=new Map(),writes=[];
const authored={id:'cap_forest',name:'Ma forêt personnalisée',desc:'Biome créé par le MJ',tags:[{tagId:'water',weight:97}]};
const mesa={id:'my_creator_mesa',name:'Plateau volcanique',desc:'Zone créée par le MJ',tags:[{tagId:'fire',weight:83}]};
const profiles=[
 {id:'my_capture_world',rpgUniverse:{encounters:{locations:[authored,mesa]}}},
 {id:'other_capture_world',rpgUniverse:{encounters:{locations:[]}}}
];
let active=profiles[0];
const context={
 console,Math,Number,String,JSON,Set,
 activeGameProfileId:()=>active.id,
 getActiveGameProfile:()=>active,
 ensureRpgProfileData:p=>{p.rpgUniverse??={};p.rpgUniverse.encounters??={};p.rpgUniverse.encounters.locations??=[];},
 gensMigrateLegacyLocationTags:x=>x.tags||[],
 gensPureCaptureSheetMode:()=>true,
 loadGameProfiles:()=>profiles,
 saveGameProfiles:arr=>writes.push(JSON.parse(JSON.stringify(arr))),
 normalizeGameParticipants:()=>['trainer_a','trainer_b'],
 CHARS:{trainer_a:{name:'A'},trainer_b:{name:'B'}},
 findCustomHero:()=>null,
 gensElementById:id=>({name:id}),
 z40kEscHtml:s=>String(s),z40kEscAttr:s=>String(s),
 localStorage:{getItem:k=>local.has(k)?local.get(k):null,setItem:(k,v)=>local.set(k,String(v))},
 document:{getElementById:id=>id==='captureLocationList'?{innerHTML:''}:null}
};
vm.createContext(context);
vm.runInContext(src,context,{timeout:2000,filename:'world-exploration-v1.js'});
for(const fn of ['captureWorldState','saveCaptureWorldState','captureDefaultLocations','captureProfileLocations','captureEnsureDefaultLocations','captureTravelTo','captureTogglePlayMode','captureNextPlayerTurn'])assert.equal(typeof context[fn],'function',fn);
const clone=v=>JSON.parse(JSON.stringify(v));
const locs=clone(context.captureProfileLocations());
assert.equal(locs.length,7,'custom entries keep default fallbacks');
assert.equal(locs[0].name,authored.name,'creator overrides default forest');
assert.deepEqual(locs[0].tags,authored.tags,'authored tag weights preserved');
assert.equal(locs[1].id,mesa.id);
assert.equal(locs.filter(x=>x.id==='cap_forest').length,1,'no duplicate overridden default');
assert.ok(locs.some(x=>x.id==='cap_cave'));
context.captureEnsureDefaultLocations();
assert.deepEqual(clone(profiles[0].rpgUniverse.encounters.locations),[authored,mesa]);
assert.equal(writes.length,0,'no unwanted rewrite of creator locations');
context.renderCaptureWorldHub=()=>{}; // Stub only rendering; real state/turn/locations are exercised.
context.captureTravelTo(mesa.id);
let world=context.captureWorldState();
assert.equal(world.locationId,mesa.id);
assert.equal(world.locationName,mesa.name);
assert.equal(world.last.type,'travel');
context.captureTogglePlayMode();
assert.equal(context.captureWorldState().playMode,'turns');
context.captureNextPlayerTurn();
assert.equal(context.captureWorldState().day,1);
assert.equal(context.captureWorldState().turnIndex,1);
context.captureNextPlayerTurn();
assert.equal(context.captureWorldState().day,2);
assert.equal(context.captureWorldState().turnIndex,0);
const savedKey='gensrpg_capture_world_v1_'+profiles[0].id,saved=local.get(savedKey);
assert.ok(saved);
active=profiles[1];
assert.equal(context.captureWorldState().day,1,'other profile must not inherit world days');
assert.equal(context.captureWorldState().locationId,'');
assert.equal(context.captureProfileLocations().length,6);
context.captureEnsureDefaultLocations();
assert.equal(writes.length,1,'only an empty profile receives default locations');
assert.equal(profiles[1].rpgUniverse.encounters.locations.length,6);
assert.equal(local.get(savedKey),saved,'other profile cannot mutate saved world');
context.captureNextPlayerTurn();
assert.equal(context.captureWorldState().day,2);
assert.ok(local.has('gensrpg_capture_world_v1_'+profiles[1].id));
active=profiles[0];
assert.equal(context.captureWorldState().day,2,'restore original profile world');
assert.equal(context.captureWorldState().locationId,mesa.id);
assert.deepEqual(clone(profiles[0].rpgUniverse.encounters.locations),[authored,mesa]);
assert.ok([...local.keys()].every(k=>k.startsWith('gensrpg_capture_world_v1_')),'no Dungeon or unrelated world writes');
console.log(JSON.stringify({scenario:'Capture world creator values and persisted per-profile separation',creatorOverride:true,tagWeights:true,defaultFallbacks:true,noOverwrite:true,separateWorlds:true,dayTurnPersistence:true}));
