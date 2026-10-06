'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const shellFinal=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8166499,'Rule 26 preaudit must stay on the exact Capture top-level GREEN runtime');
assert.equal(blob,'20381d1df0b10b664d5163f308f909cd7a6e45df','Rule 26 preaudit must stay on the exact Capture top-level GREEN blob');

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing '+id);
  return m[1];
}

const c139=block('captureFix139');

assert.match(c139,/const\s+start139\s*=\s*window\.startConfiguredGame/);
assert.match(c139,/window\.startConfiguredGame\s*=\s*async\s+function/);
assert.match(c139,/normalizeGameParticipants\(\)/);
assert.match(c139,/gensCaptureParticipantsReady/);
assert.match(c139,/current=String\(participants\[0\]\)/);
assert.match(c139,/state=loadState\(current\)/);
assert.match(c139,/saveGameParticipants\(\[\.\.\.participants\]\)/);
assert.match(c139,/applyCustomHeroesMulti\(\)/);
assert.match(c139,/applyPregameGoldToParticipants\(participants\)/);
assert.match(c139,/markSessionActive\(true\)/);
assert.match(c139,/captureWorldState\(\)/);
assert.match(c139,/saveCaptureWorldState\(ws\)/);
assert.match(c139,/captureEnsureStarterKitsForParticipants\(\)/);
assert.match(c139,/loadGameCustomization\(\)/);
assert.match(c139,/saveGameCustomization\(cfg\)/);
assert.match(c139,/startTurnManagerForGame\(\)/);
assert.match(c139,/saveTurnState\(null\)/);
assert.match(c139,/captureEnterWorld139\(\)/);
assert.match(c139,/setTimeout\([\s\S]*?1200\)/);
assert.match(c139,/GensCaptureV1\.install\(gensCaptureStartConfiguredGame139V1\)/);

assert.match(entry,/legacyStartConfiguredGame/);
assert.match(entry,/await legacyStartConfiguredGame\(\)/);
assert.match(entry,/GensCaptureV1\.install requires the Capture139 legacy start function/);
assert.match(shellFinal,/launchService\.startModuleSession\(moduleId\)/,
  'final Shell already owns the global startConfiguredGame routing boundary');
assert.doesNotMatch(shellFinal,/captureEnterWorld139|normalizeGameParticipants|captureWorldState/,
  'generic Shell must not absorb Capture session initialization');

assert.equal((index.match(/assets\/gensrpg\/capture\/session-start-v1\.js/g)||[]).length,0,
  'selected owner does not exist yet: this is a preaudit, not the runtime transfer');

console.log(JSON.stringify({
  scenario:'Phase 9 Capture session-start owner-transfer Rule 26 preaudit',
  rule26:{bytes:bytes.length,blob},
  currentOwner:'captureFix139 legacy start wrapper',
  shellRoutingAlreadyCanonical:true,
  selectedSeam:{
    newOwner:'assets/gensrpg/capture/session-start-v1.js',
    publicApi:'GensCaptureSessionStartV1',
    lexicalAdapter:'activateParticipant(current,state) only',
    deferred:'moduleScreenReturn / captureEnterWorld139 ownership remains a separate lot'
  },
  runtimeChanged:false
},null,2));
