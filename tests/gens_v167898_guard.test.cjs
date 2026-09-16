const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const artSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-ingame-art-167898.js'),'utf8');
const policySrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-stat-upgrade-policy-167898.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(artSrc));
assert.doesNotThrow(()=>new Function(policySrc));
assert.match(bridge,/gens-dungeon-hero-ingame-art-167898\.js\?v=1678100/);
assert.match(bridge,/gens-stat-upgrade-policy-167898\.js\?v=1678100/);
assert.match(sw,/gensrpg-cache-16\.78\.100-ui-cleanup/);
assert.ok(sw.includes('gens-dungeon-hero-ingame-art-167898.js'));
assert.ok(sw.includes('gens-stat-upgrade-policy-167898.js'));

// In-game art repair must use canonical hero data and keep built-in art only as a fallback.
const custom='data:image/png;base64,ALDREN_CUSTOM';
const chars={dungeon_aldren:{name:'Aldren',image:custom,avatar:custom,portrait:custom,art:'',image_data:'',token:''}};
const artCtx={console,CHARS:chars,current:'dungeon_aldren'};artCtx.window=artCtx;artCtx.globalThis=artCtx;
vm.createContext(artCtx);vm.runInContext(artSrc,artCtx);
const artApi=artCtx.GensDungeonHeroIngameArt167898;assert.ok(artApi);assert.equal(artApi.repairDefs(),0);
assert.equal(chars.dungeon_aldren.image,custom,'custom canonical art must not be pinned back to built-in');
assert.equal(artApi.canonicalArt('dungeon_aldren'),custom);
const fakeImg={tagName:'IMG',attrs:{src:'broken.png'},style:{display:'none'},hidden:true,getAttribute(k){return this.attrs[k]||''},setAttribute(k,v){this.attrs[k]=v;if(k==='src')this.src=v}};
assert.ok(artApi.ensureTokenArt(fakeImg,'dungeon_aldren')>=1);
assert.equal(fakeImg.attrs.src,custom);
assert.equal(fakeImg.hidden,false);

// Movement: default 10 characteristic points for +1, configurable and lockable.
const profile={id:'p1',gameStyle:'dungeon',rpgUniverse:{stats:{}}};
const st={rpgAttributes:{movement:3},rpgStatSpent:0,statPoints:20};
const ctx={console,setTimeout,clearTimeout,current:'dungeon_aldren',state:st,
 GensCleanRpgStats167874:{def:id=>({id,name:id==='movement'?'Mouvement':id})},
 isDungeonMode:()=>true,currentRpgProfile:()=>profile,getActiveGameProfile:()=>profile,
 loadGameProfiles:()=>[profile],saveGameProfiles:()=>{},dungeonActiveProgressionConfig:()=>({attributeEditMode:'points'}),
 dungeonSyncProgressionForState:(_h,s)=>{s.statPoints=Math.max(0,20-(Number(s.rpgStatSpent)||0))},
 dungeonAttributeValue:id=>Number(st.rpgAttributes[id]||0),
 changeDungeonAttribute:(id,delta)=>{if(delta>0&&st.statPoints<1)return false;st.rpgAttributes[id]=(Number(st.rpgAttributes[id])||0)+delta;st.rpgStatSpent=Math.max(0,(Number(st.rpgStatSpent)||0)+(delta>0?1:-1));ctx.dungeonSyncProgressionForState('',st);return true},
 save:()=>{},renderDungeonAttributes:()=>{},renderDungeonHeroStats:()=>{},alert:()=>{}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(policySrc,ctx);
const pApi=ctx.GensStatUpgradePolicy167898;assert.ok(pApi);assert.deepEqual(JSON.parse(JSON.stringify(pApi.policy('movement'))),{enabled:true,cost:10});pApi.install();
assert.equal(ctx.changeDungeonAttribute('movement',1),true);assert.equal(st.rpgAttributes.movement,4);assert.equal(st.rpgStatSpent,10);assert.equal(st.statPoints,10);
assert.equal(ctx.changeDungeonAttribute('movement',1),true);assert.equal(st.rpgAttributes.movement,5);assert.equal(st.rpgStatSpent,20);assert.equal(st.statPoints,0);
assert.equal(ctx.changeDungeonAttribute('movement',1),false);assert.equal(st.rpgAttributes.movement,5);
pApi.savePolicy('movement',{enabled:false,cost:10});assert.equal(ctx.changeDungeonAttribute('movement',-1),false,'locked stat must block +/-');
console.log('V16.78.100 compatibility guard: canonical in-game hero art + configurable stat lock/cost + Movement 10 points OK');
