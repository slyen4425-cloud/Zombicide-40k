'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167013,'residual Capture/Dungeon seam preaudit must inspect current runtime');
assert.equal(blob,'40598938bc5211240cf2aa92442f59bc9d21f804','residual Capture/Dungeon seam preaudit must inspect exact current runtime blob');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

function extractFunction(name){
  const markers=['function '+name+'(','window.'+name+'=function('];
  let start=-1;
  for(const marker of markers){
    const p=index.indexOf(marker);
    if(p>=0){start=p;break}
  }
  assert.ok(start>=0,'missing function '+name);
  const open=index.indexOf('{',start);
  assert.ok(open>start,'missing function body '+name);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue}
    if(quote){
      if(escaped){escaped=false;continue}
      if(c==='\\'){escaped=true;continue}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){comment=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const c137=block('captureFix137');
const c139=block('captureFix139');
const ensureBase=extractFunction('ensureBaseGameProfile');
const saveEnemies=extractFunction('saveActiveEnemies');

assert.match(c137,/window\.openSessionDungeonSetup=\(function\(old\)/,
  'Capture137 historical Dungeon setup guard must still be present during preaudit');
assert.match(c137,/gensCapturePregameMode/,
  'Capture137 setup guard must still explicitly recognize Capture');
assert.doesNotMatch(c137,/cleanDungeonPregame137/,
  'previous GREEN seam must keep duplicate Capture137 UI cleanup retired');

assert.match(c139,/gensEnsureDungeonAdventureButton139/,
  'Capture139 must remain owner of Dungeon Adventure button');
assert.match(c139,/ensureBaseGameProfile\(\)/,
  'Capture139 launch still uses historical base-profile seam');
assert.match(c139,/saveActiveEnemies\(\[\]\)/,
  'Capture139 launch still clears active enemies through historical seam');

const inlineBlocks=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function ownerContexts(token){
  const out=[];
  for(const {id,body} of inlineBlocks){
    let pos=body.indexOf(token);
    if(pos<0)continue;
    const contexts=[];
    while(pos>=0&&contexts.length<6){
      contexts.push(body.slice(Math.max(0,pos-140),Math.min(body.length,pos+token.length+220))
        .replace(/\s+/g,' ').trim());
      pos=body.indexOf(token,pos+token.length);
    }
    out.push({id,count:(body.split(token).length-1),contexts});
  }
  return out;
}

const openDungeonOwners=ownerContexts('openSessionDungeonSetup');
const ensureBaseOwners=ownerContexts('ensureBaseGameProfile');
const saveEnemiesOwners=ownerContexts('saveActiveEnemies');

assert.ok(openDungeonOwners.some(x=>x.id==='captureFix137'),
  'preaudit must retain Capture137 setup guard owner');
assert.ok(openDungeonOwners.some(x=>x.id==='captureFix139'),
  'preaudit must expose Capture139 Dungeon Adventure button callsite');
assert.ok(ensureBaseOwners.some(x=>x.id==='captureFix139'),
  'preaudit must expose Capture139 ensureBaseGameProfile call');
assert.ok(saveEnemiesOwners.some(x=>x.id==='captureFix139'),
  'preaudit must expose Capture139 saveActiveEnemies call');

const features={
  ensureBaseGameProfile:{
    length:ensureBase.length,
    isDungeonMode:/isDungeonMode\s*\(/.test(ensureBase),
    ensureDungeonContent:/ensureDungeonContent\s*\(/.test(ensureBase),
    updateDungeonExploreButtons:/updateDungeonExploreButtons\s*\(/.test(ensureBase),
    gameStyleDungeon:/gameStyle[\s\S]{0,30}dungeon/.test(ensureBase),
    captureIdentity:/GensCaptureV1|isCaptureContext138|gensCapture/.test(ensureBase),
    storage:/localStorage|sessionStorage|indexedDB/.test(ensureBase),
    dom:/document\./.test(ensureBase)
  },
  saveActiveEnemies:{
    length:saveEnemies.length,
    isDungeonMode:/isDungeonMode\s*\(/.test(saveEnemies),
    ensureDungeonContent:/ensureDungeonContent\s*\(/.test(saveEnemies),
    updateDungeonExploreButtons:/updateDungeonExploreButtons\s*\(/.test(saveEnemies),
    gameStyleDungeon:/gameStyle[\s\S]{0,30}dungeon/.test(saveEnemies),
    captureIdentity:/GensCaptureV1|isCaptureContext138|gensCapture/.test(saveEnemies),
    storage:/localStorage|sessionStorage|indexedDB/.test(saveEnemies),
    dom:/document\./.test(saveEnemies)
  }
};

for(const proof of [
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain available for the future seam');
}

console.log(JSON.stringify({
  scenario:'Phase 9 residual Capture/Dungeon seams preaudit',
  rule26:{bytes:bytes.length,blob},
  owners:{
    openSessionDungeonSetup:openDungeonOwners,
    ensureBaseGameProfile:ensureBaseOwners,
    saveActiveEnemies:saveEnemiesOwners
  },
  features,
  sourceSamples:{
    ensureBaseGameProfile:ensureBase.slice(0,2200),
    saveActiveEnemies:saveEnemies.slice(0,2200)
  },
  decision:'diagnostic only; choose exactly one next seam after evidence review',
  runtimeChanged:false
},null,2));
