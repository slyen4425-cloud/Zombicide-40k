'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const preauditDoc=read('docs/GENSRPG_PHASE9_CAPTURE_IDENTITY_OWNERSHIP_PREAUDIT.md');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8165614,'identity preaudit must use the current verified Phase 9 runtime');
assert.equal(blob,'560966d096134cd58ff4dc6ab2be589cee936ba7','identity preaudit must use the exact verified post-participant-raccord index blob');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

function functionFrom(src,marker){
  const start=src.indexOf(marker);
  assert.ok(start>=0,'missing function '+marker);
  const open=src.indexOf('{',start);
  assert.ok(open>start,'missing body '+marker);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
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
    if(c==='}'&&--depth===0)return src.slice(start,i+1);
  }
  assert.fail('unterminated '+marker);
}

const dungeonMode=functionFrom(index,'function isDungeonMode()');
const contentFamily=functionFrom(index,'function gensContentFamilyForProfile(');
const gameplayModules=functionFrom(index,'function gensGameplayModules()');
const shellActive=functionFrom(index,'function gensShellActiveModuleV1()');
const pregame=functionFrom(index,'function gensCapturePregameMode()');
const sheet=functionFrom(index,'function gensPureCaptureSheetMode()');
const normalize=functionFrom(index,'function normalizeGameParticipants()');
const available=functionFrom(index,'function availableParticipantHeroIds()');
const captureGameplay=functionFrom(index,'function gensIsCaptureGameplay(');
const c138=block('captureFix138');
const c151=block('gensStability151');
const c162=block('builtinMonsterCapture162');

assert.match(dungeonMode,/return p\?\.gameStyle==="dungeon"/);
assert.ok((index.match(/\bisDungeonMode\s*\(\s*\)/g)||[]).length>=120);

assert.match(contentFamily,/GensCaptureV1/);
assert.match(contentFamily,/isProfile/);
assert.ok(contentFamily.indexOf('isProfile')<contentFamily.indexOf('profile.gameStyle!=="dungeon"'));
assert.match(gameplayModules,/GensCaptureV1/);
assert.match(gameplayModules,/isProfile/);
assert.match(gameplayModules,/p\.gameStyle!=="dungeon"/);

assert.match(shellActive,/GensCaptureV1/);
assert.match(shellActive,/isProfile/);
assert.match(shellActive,/profile\?\.gameStyle==="dungeon"/);
assert.match(pregame,/GensCaptureV1\.isProfile\(p\)/);
assert.doesNotMatch(pregame,/p\.gameStyle/);
assert.match(sheet,/GensCaptureV1\.isProfile\(p\)/);
assert.doesNotMatch(sheet,/p\.gameStyle/);
assert.match(c151,/GensCaptureV1/);
assert.match(c151,/isProfile/);
assert.match(c151,/p\?\.gameStyle==="dungeon"/);

assert.match(captureGameplay,/GensCaptureV1\.isProfile\(profile\)/);
assert.doesNotMatch(captureGameplay,/gameStyle|ensureRpgProfileData/);

assert.match(normalize,/GensCaptureV1\.isProfile\(getActiveGameProfile\(\)\)/);
assert.match(normalize,/isDungeonMode\(\)/);
assert.match(available,/GensCaptureV1\.isProfile\(getActiveGameProfile\(\)\)/);
assert.match(available,/!capture && isDungeonMode\(\) && typeof ensureDungeonContent==="function"\)ensureDungeonContent\(\)/);

assert.match(c138,/window\.isCaptureContext138=function/);
assert.match(c138,/GensCaptureV1/);
assert.match(c138,/isProfile/);
assert.doesNotMatch(c138,/gensPureCaptureSheetMode|gensCapturePregameMode|fam==="creature"/);

assert.doesNotMatch(c162,/"gameStyle":"dungeon"/,
  'built-in Capture seed must stay retired from historical Dungeon identity');
assert.match(c162,/"profile":"creature"/);
assert.match(c162,/"controllableCreatures":true/);
assert.match(c162,/"capture":true/);

assert.match(index,/const capture=typeof isCaptureContext138==="function"&&isCaptureContext138\(\);[\s\S]{0,180}const dungeon=typeof isDungeonMode==="function"&&isDungeonMode\(\)&&!capture;/);

assert.match(entry,/GensCaptureV1/);
assert.match(entry,/function\s+isProfile\s*\(profile\)/);
const identityFn=functionFrom(entry,'function isProfile');
assert.doesNotMatch(identityFn,/gameStyle|isDungeonMode|document\.|localStorage|sessionStorage|ensureRpgProfileData|setTimeout|MutationObserver/);

assert.match(preauditDoc,/GensCaptureV1\.isProfile\(profile\)/);
assert.match(preauditDoc,/isDungeonMode\(\).*reste inchangé dans ce seam/);
assert.match(preauditDoc,/profil gameplay .*creature.*ou.*capture \+ controllableCreatures/);

console.log(JSON.stringify({
  scenario:'Phase 9 Capture identity ownership preaudit',
  rule26:{bytes:bytes.length,blob},
  current:{
    captureSeedStillDungeonStyle:false,
    isDungeonModeCalls:(index.match(/\bisDungeonMode\s*\(\s*\)/g)||[]).length,
    boundaryIdentityCanonical:true,
    participantDungeonDependency:false
  },
  selectedAuthority:'GensCaptureV1.isProfile(profile)',
  firstRuntimeSeam:'identity boundaries only; isDungeonMode unchanged',
  runtimeChanged:true
},null,2));
