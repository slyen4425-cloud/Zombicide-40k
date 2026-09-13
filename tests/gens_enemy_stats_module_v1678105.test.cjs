const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-enemy-canonical-stats-1678105.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src),'enemy canonical module syntax');
assert.match(src,/APP_VERSION="16\.78\.105"/);
assert.match(src,/data-gmodule=\\?"enemyStats/,'universe must expose enemy stats toggle');
assert.match(src,/runtimeDefs/,'enemy editor must use canonical active stats');
assert.match(src,/enemyFormObject/,'canonical enemy stats must be merged into native save object');
assert.match(bridge,/gens-enemy-canonical-stats-1678105\.js\?v=1678105/,'always loaded bridge must load enemy stats module');
assert.match(sw,/gensrpg-cache-16\.78\.105-enemy-stats-module/);
assert.match(sw,/gens-enemy-canonical-stats-1678105\.js/);
let modules={};
const ctx={console,globalThis:null,window:null,document:null,setTimeout:()=>0,
 GensCleanRpgStats167874:{runtimeDefs:()=>[{id:'force',name:'Force',defaultValue:10},{id:'necromancie',name:'Nécromancie',defaultValue:0}],defs:()=>[],def:id=>({force:{id:'force'},necromancie:{id:'necromancie'}}[id]||null)},
 gensGameplayModules:()=>modules,
 dungeonEnemyRpgStats:def=>({force:Number(def?.rule?.rpgStats?.force??10),agilite:10,intelligence:10,esprit:10,endurance:10,defense:10,armor:0,initiative:0,movement:1,perception:0})
};ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-enemy-canonical-stats-1678105.js'});
const api=ctx.GensEnemyCanonicalStats1678105;assert.ok(api);
assert.equal(api.enabled(),true,'missing setting must preserve legacy behavior: enemy stats ON');
modules={enemyStats:false};assert.equal(api.enabled(),false);
api.wrapRuntime();
let s=ctx.dungeonEnemyRpgStats({rule:{strength:3,armor:2,initiative:4,movement:2,rpgStats:{force:99,necromancie:50}}});
assert.equal(s.force,3,'OFF must ignore RPG force and keep simple monster strength');
assert.equal(s.agilite,0,'OFF must remove RPG agility contribution');
assert.equal(s.initiative,4);assert.equal(s.movement,2);
modules={enemyStats:true};
s=ctx.dungeonEnemyRpgStats({rule:{strength:3,rpgStats:{force:18,necromancie:7}}});
assert.equal(s.force,18,'ON must retain existing RPG enemy stat behavior');
assert.equal(s.necromancie,7,'ON must expose custom canonical enemy stats');
console.log('V16.78.105 enemy stats: universe ON/OFF + canonical custom stats + legacy simple fallback OK');
