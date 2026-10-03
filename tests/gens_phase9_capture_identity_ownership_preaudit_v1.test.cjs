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

assert.equal(bytes.length,8169430,'identity preaudit must use the Rule 26 verified public-entry runtime');
assert.equal(blob,'f523410e175ee4946059da8e8ee8519295fb63c5','identity preaudit must use the exact verified index blob');

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

assert.match(contentFamily,/if\(profile\.gameStyle!=="dungeon"\)return "survival"/);
assert.match(contentFamily,/mods\.capture && mods\.controllableCreatures/);
assert.match(gameplayModules,/if\(!p\|\|p\.gameStyle!=="dungeon"\)return empty/);

assert.match(shellActive,/profile\?\.gameStyle==="dungeon"/);
assert.match(shellActive,/family==="creature"\?"capture":"dungeon"/);
assert.match(pregame,/p\.gameStyle!=="dungeon"/);
assert.match(sheet,/p\.gameStyle!=="dungeon"/);
assert.match(c151,/p\?\.gameStyle==="dungeon" && fam==="creature"/);

assert.match(captureGameplay,/profile\.gameStyle!=="dungeon"/);
assert.match(captureGameplay,/ensureRpgProfileData\(profile\)/);
assert.match(captureGameplay,/g\.profile==="creature" \|\| \(!!g\.modules\?\.capture && !!g\.modules\?\.controllableCreatures\)/);

assert.match(normalize,/isDungeonMode\(\)/);
assert.match(available,/isDungeonMode\(\) && typeof ensureDungeonContent==="function"\)ensureDungeonContent\(\)/);

assert.match(c138,/window\.isCaptureContext138=function/);
assert.match(c138,/gensPureCaptureSheetMode/);
assert.match(c138,/gensCapturePregameMode/);
assert.match(c138,/fam==="creature"/);

assert.match(c162,/"gameStyle":"dungeon"/);
assert.match(c162,/"profile":"creature"/);
assert.match(c162,/"controllableCreatures":true/);
assert.match(c162,/"capture":true/);

assert.match(index,/const capture=typeof isCaptureContext138==="function"&&isCaptureContext138\(\);[\s\S]{0,180}const dungeon=typeof isDungeonMode==="function"&&isDungeonMode\(\)&&!capture;/);

assert.match(entry,/GensCaptureV1/);
assert.doesNotMatch(entry,/function\s+isProfile\s*\(/);

assert.match(preauditDoc,/GensCaptureV1\.isProfile\(profile\)/);
assert.match(preauditDoc,/isDungeonMode\(\).*reste inchangé dans ce seam/);
assert.match(preauditDoc,/profil gameplay .*creature.*ou.*capture \+ controllableCreatures/);

console.log(JSON.stringify({
  scenario:'Phase 9 Capture identity ownership preaudit',
  rule26:{bytes:bytes.length,blob},
  current:{
    captureStillDungeonStyle:true,
    isDungeonModeCalls:(index.match(/\bisDungeonMode\s*\(\s*\)/g)||[]).length,
    helperMutatesProfile:true,
    participantDungeonDependency:true
  },
  selectedAuthority:'GensCaptureV1.isProfile(profile)',
  firstRuntimeSeam:'identity boundaries only; isDungeonMode unchanged',
  runtimeChanged:false
},null,2));
