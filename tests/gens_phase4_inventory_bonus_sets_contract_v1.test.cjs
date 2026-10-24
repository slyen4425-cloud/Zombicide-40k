'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const core316=read('assets/dungeon/dungeon-core-316.js');
const corePath=path.join(root,'assets','gensrpg','core','equipment-bonus-sets-v1.js');

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
  assert.ok(brace>closeParen,'missing owner body '+name);
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

const registry={
  leather:{
    id:'leather',
    thresholds:[
      {pieces:2,bonuses:{armor:1,agilite:1}},
      {pieces:3,bonuses:{armor:2,dodge:5}}
    ]
  },
  runic:{
    id:'runic',
    thresholds:{
      1:{magicDefense:1},
      2:{magicDefense:2,mana:'3'}
    }
  }
};

const items=[
  {id:'leather_head',setId:'leather',setPieceId:'head',rpgBonuses:{armor:1,force:'2'}},
  {id:'leather_torso',setId:'leather',setPieceId:'torso',rpgBonuses:{armor:2,force:1}},
  {id:'leather_torso_copy',setId:'leather',setPieceId:'torso',rpgBonuses:{armor:4}},
  {id:'leather_hands',setId:'leather',setPieceId:'hands',rpgBonuses:{armor:'bad'}},
  {id:'runic_ring',setId:'runic',rpgBonuses:{mana:1}},
  {id:'runic_charm',setId:'runic',rpgBonuses:{mana:2}},
  {id:'orphan',setId:'missing',rpgBonuses:{armor:3}}
];

const directCtx={console,Math,Number,dungeonEquippedItems:()=>items};
directCtx.window=directCtx;directCtx.globalThis=directCtx;
vm.createContext(directCtx);
vm.runInContext(extractFunction(index,'dungeonEquipmentBonus'),directCtx,{filename:'index#dungeonEquipmentBonus'});
const historicalDirect={
  armor:directCtx.dungeonEquipmentBonus('armor'),
  force:directCtx.dungeonEquipmentBonus('force'),
  mana:directCtx.dungeonEquipmentBonus('mana'),
  missing:directCtx.dungeonEquipmentBonus('missing')
};
assert.deepEqual(historicalDirect,{armor:10,force:3,mana:3,missing:0});

const setCtx={console,Math,Number,DUNGEON_EQUIPMENT_SETS:registry};
setCtx.window=setCtx;setCtx.globalThis=setCtx;
vm.createContext(setCtx);
vm.runInContext(extractFunction(core316,'thresholds316'),setCtx,{filename:'core316#thresholds316'});
vm.runInContext(extractFunction(core316,'setState316'),setCtx,{filename:'core316#setState316'});
const historicalState=JSON.parse(JSON.stringify(setCtx.setState316(items,registry)));
assert.equal(historicalState.length,2,'historical set owner must keep two known sets');
const leather=historicalState.find(x=>x.setId==='leather');
const runic=historicalState.find(x=>x.setId==='runic');
assert.equal(leather.count,3,'duplicate torso piece must count once');
assert.deepEqual(leather.pieces,['head','torso','hands']);
assert.deepEqual(leather.bonuses,{armor:3,agilite:1,dodge:5},'all reached leather thresholds must accumulate');
assert.equal(runic.count,2);
assert.deepEqual(runic.bonuses,{magicDefense:3,mana:3},'object-form thresholds must sort and accumulate');
assert.equal(historicalState.some(x=>x.setId==='missing'),false,'unknown sets must be ignored');

const historicalSetBonus=(key)=>historicalState.reduce((sum,set)=>sum+(Number(set.bonuses?.[key])||0),0);
assert.equal(historicalSetBonus('armor'),3);
assert.equal(historicalSetBonus('mana'),3);
assert.equal(historicalSetBonus('magicDefense'),3);

assert.equal(fs.existsSync(corePath),true,'Core Equipment bonus + sets contract module must exist');
const core=read('assets/gensrpg/core/equipment-bonus-sets-v1.js');
assert.equal(/document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|dungeonEquipmentBonus|dungeonEquippedItems/.test(core),false,
  'pure Equipment bonus + sets Core must not depend on DOM, storage, timers or runtime seams');

const ctx={console,Math,Number,Object,Array,Set,globalThis:null};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(core,ctx,{filename:'equipment-bonus-sets-v1.js'});
const api=ctx.GensEquipmentBonusSetsV1;
assert.ok(api,'GensEquipmentBonusSetsV1 export missing');

assert.equal(api.directBonus(items,'armor'),historicalDirect.armor);
assert.equal(api.directBonus(items,'force'),historicalDirect.force);
assert.equal(api.directBonus(items,'mana'),historicalDirect.mana);
assert.equal(api.directBonus(items,'missing'),0);

const coreState=JSON.parse(JSON.stringify(api.setState(items,registry)));
assert.deepEqual(coreState,historicalState,'Core set state must match Core 3.16 semantics');
assert.equal(api.setBonus(items,'armor',registry),historicalSetBonus('armor'));
assert.equal(api.setBonus(items,'mana',registry),historicalSetBonus('mana'));
assert.equal(api.setBonus(items,'magicDefense',registry),historicalSetBonus('magicDefense'));
assert.equal(api.totalBonus(items,'armor',registry),historicalDirect.armor+historicalSetBonus('armor'));
assert.equal(api.totalBonus(items,'mana',registry),historicalDirect.mana+historicalSetBonus('mana'));

console.log(JSON.stringify({
  scenario:'Phase 4 pure Equipment direct bonus + sets contract',
  directBonusParity:true,
  duplicateSetPieceDeduped:true,
  cumulativeThresholds:true,
  multipleSets:true,
  unknownSetsIgnored:true,
  totalDirectPlusSet:true
},null,2));
