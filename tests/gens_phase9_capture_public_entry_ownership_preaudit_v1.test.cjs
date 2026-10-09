'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const owner=read('assets/gensrpg/capture/session-start-v1.js');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const audit=read('docs/GENSRPG_PHASE9_CAPTURE_PUBLIC_ENTRY_OWNERSHIP_PREAUDIT.md');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8165398,'preaudit must inspect the current verified Phase 9 runtime');
assert.equal(blob,'18627cc0c5fc7945732c8a910504c59ef823b6ae','preaudit must inspect the exact verified Capture session-owner runtime');

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

assert.doesNotMatch(c139,/window\.startConfiguredGame\s*=|const\s+start139\s*=|gensCaptureStartConfiguredGame139V1|legacyStartConfiguredGame/,
  'Capture139 must remain retired from session-start ownership');
assert.doesNotMatch(c139,/_captureStarting139|setTimeout\([\s\S]*?1200/,
  'dead Capture139 launch lock/timer must remain retired');
assert.doesNotMatch(c139,/const\s+participants\s*=\s*normalizeGameParticipants\(\)/,
  'Capture139 must no longer own Capture participant/session initialization');
assert.match(c139,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 may only wire explicit dependencies into the dedicated Capture session owner');
assert.match(c139,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/,
  'Capture public entry must bind the dedicated session owner');
assert.doesNotMatch(c139,/GensShellModuleLaunchV1\.register\("capture"/,
  'Capture139 must not own the public provider registration');
assert.ok(!c139.includes('gensEnsureDungeonAdventureButton139'),
  'Capture139 must remain free of the retired Dungeon pregame button owner');

assert.match(owner,/GensCaptureSessionStartV1/);
assert.match(owner,/async\s+function\s+start\s*\(/);
assert.match(owner,/function\s+dispose\s*\(/);
assert.doesNotMatch(owner,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/,
  'Capture session owner must consume injected contracts only');

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
assert.ok(contract.owns.includes('Capture session initialization'));
assert.ok(contract.consumes.includes('Capture session-start owner public API'));
assert.ok(contract.invariants.some(x=>/Capture139 no longer owns session initialization/i.test(x)));

assert.equal((index.match(/assets\/gensrpg\/capture\/entry-v1\.js/g)||[]).length,1);
assert.equal((index.match(/assets\/gensrpg\/capture\/session-start-v1\.js/g)||[]).length,1);
assert.match(entry,/GensCaptureV1/);
assert.match(entry,/sessionStartOwner/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);
assert.doesNotMatch(entry,/legacyStartConfiguredGame|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/);
assert.ok(index.includes('src="assets/gensrpg/survival/entry-v1.js?v=1"'));
assert.ok(index.includes('src="assets/gensrpg/dungeon/entry-v1.js?v=1"'));

assert.ok(audit.includes('02a052bc231728eb383e17c83e61a958be0ac58c'),
  'completed historical preaudit must preserve the verified Rule 26 source blob');
assert.match(audit,/Shell -> GensCaptureV1 -> legacy Capture139|Shell -> GensCaptureV1 -> référence stable Capture139/,
  'historical preaudit must preserve the seam that was intentionally transferred');

console.log(JSON.stringify({
  scenario:'Phase 9 Capture public-entry ownership preaudit after session-owner transfer',
  rule26:{bytes:bytes.length,blob},
  capture139:{
    stableLegacyReference:false,
    directPrivateDungeonRuntime:false,
    providerStillInline:false,
    sessionInitializer:false
  },
  historicalDebts:[
    'legacy saveActiveEnemies still updates Dungeon explore UI outside Capture139'
  ],
  retiredDebts:[
    'normalizeGameParticipants no longer uses Dungeon identity for Capture',
    'Capture139 no longer invokes ensureBaseGameProfile',
    'Capture139 no longer owns Dungeon pregame button maintenance',
    'Capture139 no longer owns Capture session initialization'
  ],
  identityBoundary:'GensCaptureV1.isProfile(profile)',
  selectedRuntimeSeam:'Shell -> GensCaptureV1 -> GensCaptureSessionStartV1',
  runtimeChanged:true
},null,2));
