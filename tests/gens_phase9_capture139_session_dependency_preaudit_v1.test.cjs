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

assert.equal(bytes.length,8165614,'Capture139 session preaudit must inspect the current verified pregame GREEN runtime');
assert.equal(blob,'560966d096134cd58ff4dc6ab2be589cee936ba7','Capture139 session preaudit must inspect the exact verified pregame GREEN runtime blob');

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

function functionSource(name){
  const marker='function '+name+'(';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing function '+name);
  const open=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<index.length;i++){
    const ch=index[i],next=index[i+1]||'';
    if(line){if(ch==='\n')line=false;continue}
    if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==='/'&&next==='/'){line=true;i++;continue}
    if(ch==='/'&&next==='*'){comment=true;i++;continue}
    if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0)return index.slice(start,i+1);
  }
  assert.fail('unterminated function '+name);
}

const c139=block('captureFix139');
assert.doesNotMatch(c139,/ensureBaseGameProfile\(\)/,'Capture139 must remain decoupled from Base/Dungeon profile preparation after the dedicated retirement seam');
assert.doesNotMatch(c139,/saveActiveEnemies|loadActiveEnemies|ACTIVE_ENEMIES_KEY/,'Capture139 must remain decoupled from the retired active-enemy dependency');

assert.match(captureEntry,/GensCaptureV1/);
assert.match(captureEntry,/startModuleSession/);
assert.doesNotMatch(captureEntry,/ensureBaseGameProfile|saveActiveEnemies|DungeonCore|DungeonSpatial/,
  'public Capture entry must remain routing-only and must not absorb historical session dependencies');

const ensureContexts=contextsFor('ensureBaseGameProfile');
const enemyContexts=contextsFor('saveActiveEnemies');
const ensureFn=functionSource('ensureBaseGameProfile');
const saveEnemiesFn=functionSource('saveActiveEnemies');

assert.ok(ensureContexts.length>=2,'preaudit must locate definition/use contexts for ensureBaseGameProfile');
assert.ok(enemyContexts.length>=2,'preaudit must locate definition/use contexts for saveActiveEnemies');

const exactFunctionMarkers={
  ensureBaseGameProfile:{
    baseProfile:/GAME_PROFILE_BASE_ID/.test(ensureFn),
    dungeonProfile:/GAME_PROFILE_DUNGEON_ID/.test(ensureFn),
    captureIdentity:/GensCaptureV1|MC162_ID|captureWorldState|creatureTeam/.test(ensureFn),
    profileSave:/saveGameProfiles|saveGameProfilesRaw|localStorage/.test(ensureFn),
    dom:/document\.|getElementById|querySelector/.test(ensureFn)
  },
  saveActiveEnemies:{
    localStorage:/localStorage/.test(saveEnemiesFn),
    renderActiveEnemyButtons:/renderActiveEnemyButtons/.test(saveEnemiesFn),
    updateDungeonExploreButtons:/updateDungeonExploreButtons/.test(saveEnemiesFn),
    pushSync:/z40kSchedulePush/.test(saveEnemiesFn),
    captureIdentity:/GensCaptureV1|captureWorldState|creatureTeam/.test(saveEnemiesFn)
  }
};

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
    ensureBaseGameProfileCall:false,
    saveActiveEnemiesResetCall:false
  },
  owners:{
    ensureBaseGameProfile:ownerCandidates('ensureBaseGameProfile'),
    saveActiveEnemies:ownerCandidates('saveActiveEnemies')
  },
  markers,
  exactFunctionMarkers,
  exactFunctions:{
    ensureBaseGameProfile:ensureFn,
    saveActiveEnemies:saveEnemiesFn
  },
  contexts:{
    ensureBaseGameProfile:ensureContexts,
    saveActiveEnemies:enemyContexts
  },
  decision:'Base/Dungeon profile preparation and Capture139 active-enemy reset dependencies are retired; legacy active-enemy authority remains for Survival/Dungeon',
  runtimeChanged:true
},null,2));
