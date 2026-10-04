'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167091,'Capture139 session preaudit must inspect the current verified pregame GREEN runtime');
assert.equal(blob,'8a42d15ed218895690a3b8490bbe636d9d2d27c6','Capture139 session preaudit must inspect the exact verified pregame GREEN runtime blob');

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing '+id);
  return m[1];
}

function contextsFor(symbol,limit=12){
  const out=[];
  let at=0;
  while(out.length<limit){
    const i=index.indexOf(symbol,at);
    if(i<0)break;
    out.push(index.slice(Math.max(0,i-220),Math.min(index.length,i+symbol.length+420)).replace(/\s+/g,' ').trim());
    at=i+symbol.length;
  }
  return out;
}

function ownerCandidates(symbol){
  const out=[];
  const inline=/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=inline.exec(index))){
    const count=m[2].split(symbol).length-1;
    if(count)out.push({id:m[1],count});
  }
  return out;
}

const c139=block('captureFix139');
assert.match(c139,/ensureBaseGameProfile\(\)/,'Capture139 must still expose the historical profile-preparation dependency during preaudit');
assert.match(c139,/saveActiveEnemies\(\[\]\)/,'Capture139 must still expose the historical active-enemy reset dependency during preaudit');

assert.match(captureEntry,/GensCaptureV1/);
assert.match(captureEntry,/startModuleSession/);
assert.doesNotMatch(captureEntry,/ensureBaseGameProfile|saveActiveEnemies|DungeonCore|DungeonSpatial/,
  'public Capture entry must remain routing-only and must not absorb historical session dependencies');

const ensureContexts=contextsFor('ensureBaseGameProfile');
const enemyContexts=contextsFor('saveActiveEnemies');
assert.ok(ensureContexts.length>=2,'preaudit must locate definition/use contexts for ensureBaseGameProfile');
assert.ok(enemyContexts.length>=2,'preaudit must locate definition/use contexts for saveActiveEnemies');

const markers={
  ensureBaseGameProfile:{
    isDungeonMode:ensureContexts.some(x=>/isDungeonMode/.test(x)),
    ensureDungeonContent:ensureContexts.some(x=>/ensureDungeonContent/.test(x)),
    dungeonNamed:ensureContexts.some(x=>/Dungeon|dungeon/.test(x)),
    storage:ensureContexts.some(x=>/localStorage|sessionStorage|indexedDB|CoreStorage/.test(x)),
    dom:ensureContexts.some(x=>/document\.|getElementById|querySelector/.test(x)),
    profileMutation:ensureContexts.some(x=>/activeGameProfile|gameProfile|profile/.test(x))
  },
  saveActiveEnemies:{
    dungeonUi:enemyContexts.some(x=>/updateDungeonExploreButtons|Dungeon|dungeon/.test(x)),
    storage:enemyContexts.some(x=>/localStorage|sessionStorage|indexedDB|CoreStorage/.test(x)),
    dom:enemyContexts.some(x=>/document\.|getElementById|querySelector/.test(x)),
    events:enemyContexts.some(x=>/dispatchEvent|CustomEvent|EventBus/.test(x))
  }
};

console.log(JSON.stringify({
  scenario:'Phase 9 Capture139 session dependency preaudit',
  rule26:{bytes:bytes.length,blob},
  capture139:{
    ensureBaseGameProfileCall:true,
    saveActiveEnemiesResetCall:true
  },
  owners:{
    ensureBaseGameProfile:ownerCandidates('ensureBaseGameProfile'),
    saveActiveEnemies:ownerCandidates('saveActiveEnemies')
  },
  markers,
  contexts:{
    ensureBaseGameProfile:ensureContexts,
    saveActiveEnemies:enemyContexts
  },
  decision:'diagnostic only; no runtime mutation and no seam selected yet',
  runtimeChanged:false
},null,2));
