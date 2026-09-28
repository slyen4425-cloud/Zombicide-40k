'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169990,
  'Phase 7 movement allowance characterization must track the micro-lot 6 runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 movement allowance characterization must track the exact micro-lot 6 blob');

assert.match(authored,/function heroMoveAllowance\(id\)\{/,
  'Authored runtime must still own hero movement allowance lookup before this micro-lot');
assert.match(authored,/function movementForEntry\(x,hero\)\{const raw=x\?\.remaining\?\.\[hero\];return Number\.isFinite\(Number\(raw\)\)\?Math\.max\(0,Number\(raw\)\):heroMoveAllowance\(hero\)\}/,
  'Authored movementForEntry historical rule drifted');
assert.match(authored,/const s=ensureState\(x,g\),movement=movementForEntry\(x,hero\)/,
  'enterNode must still resolve entry movement once before spatial transition');
assert.equal((authored.match(/x\.remaining\[hero\]=movement/g)||[]).length,2,
  'Authored enterNode must keep exactly two entry-movement assignments (restore/create)');

function makeContext(moveValue=4,charMove=9){
  const store=new Map();
  const localStorage={
    getItem(k){return store.has(k)?store.get(k):null},
    setItem(k,v){store.set(k,String(v))},
    removeItem(k){store.delete(k)}
  };
  const ctx={
    console,Math,Date,JSON,localStorage,
    setTimeout(){return 1},clearTimeout(){},
    dungeonHeroMoveValue083(){return moveValue},
    CHARS:{hero:{dungeonStats:{movement:charMove}}},
    DungeonCore01:{},
    DungeonWorldBuilder167821:{findDungeon(){return null},validation(){return {valid:false}}},
    DungeonRoomCreator100:{},
    DungeonZoneContent167824:{},
    DungeonWorldRuntime167823:{saveConfig(){}},
    activeDungeonAdventureId(){return 'adv'},
    gensGameplayModules(){return {movement:true}}
  };
  ctx.window=ctx;
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(authored,ctx,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
  return ctx;
}

const ctx=makeContext(4,9);
const api=ctx.DungeonAuthoredRuntime167839;
assert.ok(api,'DungeonAuthoredRuntime167839 API missing');
assert.equal(typeof api.heroMoveAllowance,'function');
assert.equal(typeof api.movementForEntry,'function');

const cases=[
  [{remaining:{}},'hero',4,'missing remaining uses authored hero allowance'],
  [{remaining:{hero:undefined}},'hero',4,'undefined remaining uses fallback'],
  [{remaining:{hero:'bad'}},'hero',4,'NaN remaining uses fallback'],
  [{remaining:{hero:Infinity}},'hero',4,'infinite remaining uses fallback'],
  [{remaining:{hero:2}},'hero',2,'positive remaining is preserved'],
  [{remaining:{hero:'2'}},'hero',2,'numeric-string remaining is preserved'],
  [{remaining:{hero:0}},'hero',0,'zero remaining is preserved'],
  [{remaining:{hero:-3}},'hero',0,'negative remaining clamps to zero'],
  [{remaining:{hero:null}},'hero',0,'null keeps historical Number(null) semantics']
];
for(const [state,hero,expected,label] of cases){
  assert.equal(api.movementForEntry(state,hero),expected,label);
}
assert.equal(api.heroMoveAllowance('hero'),4,
  'heroMoveAllowance must remain authored-owned during this micro-lot');

const fallbackCtx=makeContext(0,6);
assert.equal(fallbackCtx.DungeonAuthoredRuntime167839.movementForEntry({remaining:{}},'hero'),6,
  'fallback resolution through existing authored heroMoveAllowance must remain unchanged');

const entrySandbox={};
entrySandbox.window=entrySandbox;
entrySandbox.globalThis=entrySandbox;
vm.createContext(entrySandbox);
vm.runInContext(entry,entrySandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(typeof entrySandbox.GensDungeonV1?.movement?.normalizeEntryRemaining,'undefined',
  'characterization must remain GREEN before movement remaining normalization extraction');

assert.doesNotMatch(authored,/GensDungeonV1\.movement\.normalizeEntryRemaining/,
  'Authored runtime must not consume the future movement helper before RED extraction');

console.log(JSON.stringify({
  scenario:'Phase 7 authored entry movement allowance characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.movementForEntry',
  fallbackOwner:'DungeonAuthoredRuntime167839.heroMoveAllowance',
  cases:cases.length+1,
  spatial:'DungeonSpatial313 unchanged',
  decision:'characterized-before-extraction'
},null,2));
