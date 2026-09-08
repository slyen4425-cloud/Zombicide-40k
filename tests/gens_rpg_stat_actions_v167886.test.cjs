const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-stats-actions-fix-167886.js'),'utf8');
const profile={id:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[{id:'force',name:'Force'}],active:['force'],unifiedEffects85:[]}}};
let saved=[profile],redraws=0,clickHandler=null;
const document={readyState:'complete',__gsActions167886:false,addEventListener:(type,fn,capture)=>{if(type==='click'&&capture===true)clickHandler=fn}};
const ctx={console,Date,Math,document,
 currentRpgProfile:()=>profile,getActiveGameProfile:()=>profile,loadGameProfiles:()=>saved,saveGameProfiles:a=>{saved=a},
 GensCleanRpgStats167874:{root:p=>p.rpgUniverse.stats,canon:id=>String(id||''),def:id=>profile.rpgUniverse.stats.dynamicDefinitions.find(x=>x.id===id)||null},
 GensUnifiedStats167885:{renderEditor:()=>{redraws++}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-rpg-stats-actions-fix-167886.js'});
const api=ctx.GensRpgStatActions167886;assert.ok(api,'stat action API missing');
assert.equal(typeof clickHandler,'function','document capture click handler must be installed');
assert.equal(api.addStat(),true);assert.ok(profile.rpgUniverse.stats.dynamicDefinitions.some(x=>x.id==='nouvelle_stat'),'direct addStat must create a stat');
assert.equal(api.addEffect('force'),true);assert.equal(profile.rpgUniverse.stats.unifiedEffects85.at(-1).source,'force','direct addEffect must create an effect on Force');
const statCount=profile.rpgUniverse.stats.dynamicDefinitions.length;
const newStatButton={matches:q=>q==='[data-u85-newstat]',dataset:{},closest:()=>newStatButton};
clickHandler({target:newStatButton,preventDefault(){},stopImmediatePropagation(){}});
assert.equal(profile.rpgUniverse.stats.dynamicDefinitions.length,statCount+1,'mobile click on New stat must create a stat');
const effectCount=profile.rpgUniverse.stats.unifiedEffects85.length;
const addEffectButton={matches:q=>q==='[data-u85-add]',dataset:{u85Add:'force'},closest:()=>addEffectButton};
clickHandler({target:addEffectButton,preventDefault(){},stopImmediatePropagation(){}});
assert.equal(profile.rpgUniverse.stats.unifiedEffects85.length,effectCount+1,'mobile click on Add effect must create an effect');
assert.equal(profile.rpgUniverse.stats.unifiedEffects85.at(-1).source,'force');
assert.ok(redraws>=4,'each successful action must redraw the editor');
console.log('GenSrpG V16.78.86 stat editor actions: new stat + add effect mobile capture OK');
