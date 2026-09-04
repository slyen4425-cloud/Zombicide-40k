const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-world-summary-167820.js'),'utf8');
const builtArg=process.argv[2];
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

const values=new Map();
const localStorage={
 getItem(k){return values.has(k)?values.get(k):null},
 setItem(k,v){values.set(k,String(v))},
 removeItem(k){values.delete(k)}
};
const dungeonProfile={id:'game_profile_dungeon_demo',heroPool:['old_h'],objectPool:Array.from({length:12},(_,i)=>'old_'+i),enemyConfig:{old_enemy:{}}};
const captureProfile={id:'gp_mt7ker7t_m2iw9',heroPool:['trainer_1'],objectPool:[],enemyConfig:{},rpgUniverse:{gameplay:{profile:'creature'}}};
const customProfile={id:'custom_world',heroPool:['a','b'],objectPool:['x','y','z'],enemyConfig:{m1:{},m2:{},m3:{},m4:{}}};
const allHeroes=[
 {id:'d_custom',gameMode:'dungeon',contentFamily:'rpg'},
 {id:'trainer_1',gameMode:'dungeon',universeId:'gp_mt7ker7t_m2iw9',contentFamily:'creature',role:'Héros personnalisé'},
 {id:'survival_old',name:'Survivant sans gameMode'}
];
const allItems=[
 {id:'i1',gameMode:'dungeon',dungeonBuiltin:true},
 {id:'d_custom_item',gameMode:'dungeon',contentFamily:'rpg'},
 {id:'capture_orb_basic',gameMode:'dungeon',type:'Objet de capture',contentFamily:'creature'},
 {id:'capture_custom',gameMode:'dungeon',contentFamily:'creature',universeId:'gp_mt7ker7t_m2iw9'},
 {id:'capture_other_world',gameMode:'dungeon',contentFamily:'creature',universeId:'other_capture'},
 {id:'survival_old_item',name:'Objet survie sans gameMode'}
];
const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage,
 rpgProfiles(){return [dungeonProfile,captureProfile,customProfile]},
 dungeonContentIds(){return {heroes:['h1','h2','h3'],objects:['i1','i2','i3','i4'],enemies:['e1','e2']}},
 dungeonItems(){return [{id:'i1'},{id:'i2'},{id:'i3'},{id:'i4'}]},
 loadCustomHeroesMulti(){return allHeroes},
 loadCustomEquipment(){return allItems},
 loadCustomEnemies(){return [{id:'e3',gameMode:'dungeon',contentFamily:'rpg'},{id:'surv_enemy'}]},
 enemiesForMode(){return [{id:'e1',gameMode:'dungeon'},{id:'e2',gameMode:'dungeon'},{id:'creature_enemy',gameMode:'dungeon',contentFamily:'creature'}]},
 gensStarterCaptureItems(){return ['capture_orb_basic','capture_orb_plus','capture_orb_ultra','capture_orb_master'].map(id=>({id,type:'Objet de capture',contentFamily:'creature'}))}
};
ctx.window=ctx;ctx.globalThis=ctx;
values.set('gensrpg_shared_entities_v1__gp_mt7ker7t_m2iw9',JSON.stringify([
 {id:'c1',category:'creature',contentFamily:'creature'},
 {id:'c2',category:'creature',contentFamily:'creature'},
 {id:'c2',category:'creature',contentFamily:'creature'}
]));
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-world-summary-167820.js'});
const api=ctx.GensWorldSummary167820;
assert.ok(api,'live world summary API missing');
assert.equal(api.VERSION,'16.78.20');

const dungeon=api.summarizeProfile(dungeonProfile);
assert.equal(dungeon.live,true);
assert.equal(dungeon.heroes,4,'Dungeon must use 3 built-in heroes + 1 real Dungeon custom hero, not stale heroPool');
assert.equal(dungeon.objects,5,'Dungeon must use live item library + real Dungeon custom item, not stale 12-object pool');
assert.equal(dungeon.monsters,3,'Dungeon must count live Dungeon enemies and exclude Capture/survival content');
assert.equal(dungeon.text,'4 héros · 5 objets · 3 monstres');
assert.notEqual(dungeon.objects,dungeonProfile.objectPool.length,'stale objectPool must not drive Dungeon summary');

const capture=api.summarizeProfile(captureProfile);
assert.equal(capture.trainers,1);
assert.equal(capture.creatures,2,'Capture must count unique entities from its scoped live roster');
assert.equal(capture.objects,5,'Capture must count 4 starter capture items + exact-world custom capture item');
assert.equal(capture.text,'1 dresseur · 2 créatures · 5 objets');

const custom=api.summarizeProfile(customProfile);
assert.equal(custom.live,false,'custom worlds keep legacy profile summary behavior');
assert.equal(custom.text,'2 héros · 3 objets · 4 monstres');

assert.match(src,/MutationObserver/,'world cards must be repatched after the existing renderer redraws them');
assert.match(src,/gensUniverseCard\[data-rpg-profile\]/,'world card selector missing');
assert.match(workflow,/gens-world-summary-167820\.js/,'Pages workflow must inject live world summaries');
assert.match(workflow,/gens_world_summary_v167820\.test\.cjs/,'Pages workflow must run live-summary regression');
assert.match(sw,/gens-world-summary-167820\.js/,'live-summary module must be pre-cached');
assert.match(sw,/gensrpg-cache-16\.78\.20-/,'PWA cache must advance to V16.78.20');
if(builtArg){
 const html=fs.readFileSync(builtArg,'utf8');
 assert.match(html,/assets\/gensrpg\/gens-world-summary-167820\.js\?v=167820/,'final HTML must load the V16.78.20 world summary module');
}
console.log('GenSrpG world summaries V16.78.20: OK');
