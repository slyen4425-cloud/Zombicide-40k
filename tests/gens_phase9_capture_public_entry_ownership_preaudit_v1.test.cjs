'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const contract=JSON.parse(fs.readFileSync(path.join(root,'assets/gensrpg/capture/module-contract-v1.json'),'utf8'));
const audit=fs.readFileSync(path.join(root,'docs/GENSRPG_PHASE9_CAPTURE_PUBLIC_ENTRY_OWNERSHIP_PREAUDIT.md'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8165614,'preaudit must inspect the current verified Phase 9 runtime');
assert.equal(blob,'560966d096134cd58ff4dc6ab2be589cee936ba7','preaudit must inspect the exact verified post-participant-raccord index blob');

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
  assert.ok(start>=0,'missing function marker '+marker);
  const open=src.indexOf('{',start);
  assert.ok(open>start,'missing function body '+marker);
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
  assert.fail('unterminated function '+marker);
}

const c139=block('captureFix139');
const start139=functionFrom(c139,'window.startConfiguredGame=async function()');

assert.ok(start139.includes('if(!isCaptureContext138())return await start139.apply(this,arguments);'));
assert.ok(start139.includes('normalizeGameParticipants()'));
assert.ok(start139.includes('gensCaptureParticipantsReady'));
assert.ok(!start139.includes('ensureBaseGameProfile()'),'Capture139 must remain decoupled from Base/Dungeon profile preparation after the dedicated Phase 9 retirement seam');
assert.ok(start139.includes('captureWorldState()'));
assert.ok(start139.includes('saveCaptureWorldState(ws)'));
assert.ok(start139.includes('captureEnsureStarterKitsForParticipants()'));
assert.ok(!start139.includes('saveActiveEnemies([])'),'Capture139 active-enemy reset must remain retired after the dedicated Phase 9 seam');
assert.ok(start139.includes('captureEnterWorld139()'));
assert.doesNotMatch(start139,/DungeonCore01|DungeonSpatial|startTacticalCombat|GensTacticalV1/);

assert.ok(c139.includes('const gensCaptureStartConfiguredGame139V1=window.startConfiguredGame;'));
assert.ok(c139.includes('window.GensCaptureV1.install(gensCaptureStartConfiguredGame139V1);'));
assert.ok(!c139.includes('const gensCaptureStartModuleSessionV1=async()=>{'));
assert.ok(!c139.includes('window.GensShellModuleLaunchV1.register("capture",gensCaptureStartModuleSessionV1);'));
assert.ok(!c139.includes('gensEnsureDungeonAdventureButton139'),'Capture139 must remain free of the retired Dungeon pregame button owner');

const pregame=functionFrom(index,'function gensCapturePregameMode()');
const pureSheet=functionFrom(index,'function gensPureCaptureSheetMode()');
const shellModule=functionFrom(index,'function gensShellActiveModuleV1()');
const participants=functionFrom(index,'function normalizeGameParticipants()');
const ensureProfile=functionFrom(index,'function ensureBaseGameProfile()');
const saveEnemies=functionFrom(index,'function saveActiveEnemies(a)');

assert.ok(pregame.includes('GensCaptureV1.isProfile(p)'));
assert.ok(!pregame.includes('p.gameStyle'));
assert.ok(pureSheet.includes('GensCaptureV1.isProfile(p)'));
assert.ok(!pureSheet.includes('p.gameStyle'));
assert.ok(shellModule.includes('GensCaptureV1?.isProfile?.(profile)')||shellModule.includes('GensCaptureV1.isProfile(profile)'));
assert.ok(shellModule.includes('profile?.gameStyle==="dungeon"'));
assert.ok(participants.includes('isDungeonMode()'));
assert.ok(ensureProfile.includes('ensureDungeonContent()'));
assert.ok(saveEnemies.includes('updateDungeonExploreButtons'));

assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.activatedPhase,9);
assert.equal(contract.publicRuntimeApi,'GensCaptureV1');
assert.equal((index.match(/assets\/gensrpg\/capture\/entry-v1\.js/g)||[]).length,1);
assert.match(entry,/GensCaptureV1/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);
assert.doesNotMatch(entry,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/);
assert.ok(index.includes('src="assets/gensrpg/survival/entry-v1.js?v=1"'));
assert.ok(index.includes('src="assets/gensrpg/dungeon/entry-v1.js?v=1"'));
assert.ok(audit.includes('02a052bc231728eb383e17c83e61a958be0ac58c'),'completed preaudit must preserve the verified Rule 26 source blob');
assert.match(audit,/Shell -> GensCaptureV1 -> legacy Capture139|Shell -> GensCaptureV1 -> référence stable Capture139/);

console.log(JSON.stringify({
  scenario:'Phase 9 Capture public-entry ownership preaudit',
  rule26:{bytes:bytes.length,blob},
  capture139:{
    stableLegacyReference:true,
    directPrivateDungeonRuntime:false,
    providerStillInline:false
  },
  historicalDebts:[
    'legacy saveActiveEnemies still updates Dungeon explore UI outside Capture139'
  ],
  retiredDebts:[
    'normalizeGameParticipants no longer uses Dungeon identity for Capture',
    'Capture139 no longer invokes ensureBaseGameProfile',
    'Capture139 no longer owns Dungeon pregame button maintenance'
  ],
  identityBoundary:'GensCaptureV1.isProfile(profile)',
  selectedRuntimeSeam:'Shell -> GensCaptureV1 -> legacy Capture139',
  runtimeChanged:true
},null,2));
