'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const corePath=path.join(root,'assets','gensrpg','core','equipment-evolution-v1.js');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing owner function '+name);
  const openParen=source.indexOf('(',start);
  let parenDepth=0,quote=null,escaped=false,line=false,block=false,closeParen=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')parenDepth++;
    else if(c===')'&&--parenDepth===0){closeParen=i;break}
  }
  assert.ok(closeParen>openParen,'missing owner parameter close '+name);
  const brace=source.indexOf('{',closeParen);
  let depth=0;quote=null;escaped=false;line=false;block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const items=[
  {
    id:'blade',
    evolution:{enabled:true,levels:[
      {level:2,xp:10,rpgBonuses:{force:2,armor:'bad'}},
      {level:3,xp:20,rpgBonuses:{force:'3',armor:1}},
      {level:4,xp:-5,rpgBonuses:{force:1}}
    ]}
  },
  {
    id:'shield',
    evolution:{enabled:true,levels:[
      {level:2,xp:'bad',rpgBonuses:{force:4}},
      {level:3,xp:30,rpgBonuses:{force:2}}
    ]}
  },
  {
    id:'disabled',
    evolution:{enabled:false,levels:[{level:2,xp:0,rpgBonuses:{force:99}}]}
  },
  {id:'missing-levels',evolution:{enabled:true}}
];

const ownerCtx={console,Math,Number};
ownerCtx.globalThis=ownerCtx;
vm.createContext(ownerCtx);
vm.runInContext('const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;'+extractFunction(cleanup,'evolutionBonusForItem'),ownerCtx,{filename:'cleanup#evolutionBonusForItem'});

const historical=(item,key,xp)=>ownerCtx.evolutionBonusForItem(item,key,xp);
assert.equal(historical(items[0],'force',-1),0,'negative current XP must not unlock a threshold normalized to zero');
assert.equal(historical(items[0],'force',0),1,'negative threshold XP must normalize to zero');
assert.equal(historical(items[0],'force',9),1);
assert.equal(historical(items[0],'force',10),3);
assert.equal(historical(items[0],'force',20),6,'all unlocked levels must accumulate');
assert.equal(historical(items[0],'armor',20),1,'non-numeric bonus must contribute zero');
assert.equal(historical(items[1],'force',0),4,'non-numeric threshold must normalize to zero');
assert.equal(historical(items[2],'force',100),0,'disabled evolution must contribute zero');
assert.equal(historical(items[3],'force',100),0,'missing levels must contribute zero');
assert.equal(historical(items[0],'missing',100),0,'missing bonus key must contribute zero');

const historicalTotal=(list,key,xp)=>(list||[]).reduce((sum,item)=>sum+historical(item,key,xp),0);
assert.equal(historicalTotal(items,'force',20),10,'multi-item evolution must aggregate unlocked bonuses');

assert.equal(fs.existsSync(corePath),true,'Core Equipment evolution contract module must exist');
const core=read('assets/gensrpg/core/equipment-evolution-v1.js');
assert.equal(/document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|equipmentBonusCache|cachedEvolutionBonus|dungeonEquipmentBonus/.test(core),false,
  'pure Equipment evolution Core must not depend on DOM, storage, timers, cache or runtime seams');

const ctx={console,Math,Number,Object,Array,globalThis:null};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(core,ctx,{filename:'equipment-evolution-v1.js'});
const api=ctx.GensEquipmentEvolutionV1;
assert.ok(api,'GensEquipmentEvolutionV1 export missing');

for(const xp of [-1,0,9,10,20,30,100]){
  for(const key of ['force','armor','missing']){
    for(const item of items){
      assert.equal(
        api.itemBonus(item,key,xp),
        historical(item,key,xp),
        'Core item evolution parity failed for '+item.id+' '+key+' xp='+xp
      );
    }
    assert.equal(
      api.totalBonus(items,key,xp),
      historicalTotal(items,key,xp),
      'Core total evolution parity failed for '+key+' xp='+xp
    );
  }
}

assert.equal(api.totalBonus(null,'force',20),0);
assert.equal(api.totalBonus([], 'force',20),0);

console.log(JSON.stringify({
  scenario:'Phase 4 pure Equipment evolution contract',
  owner:'evolutionBonusForItem',
  disabledEvolutionZero:true,
  thresholdNormalization:true,
  cumulativeLevels:true,
  nonNumericBonusZero:true,
  multipleItems:true,
  runtimeChanged:false
},null,2));
