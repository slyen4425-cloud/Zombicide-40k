const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const fix135=scriptBody('captureFix135');
const fix138=scriptBody('captureFix138');
const fix139=scriptBody('captureFix139');
const core200=scriptBody('dungeonCore200Rebuild');

assert.match(
  fix135,
  /const\s+start135\s*=\s*window\.startConfiguredGame;[\s\S]*window\.startConfiguredGame\s*=\s*async\s+function\s*\(\)/,
  'user-regression guard: captureFix135 must retain its historical startConfiguredGame boundary until a replacement contract is proven on real user paths'
);
assert.match(
  fix135,
  /gensCapturePregameMode\(\)[\s\S]*ws\.day=1;ws\.turnIndex=0;ws\.round=1;ws\.last=null;[\s\S]*saveCaptureWorldState\(ws\)/,
  'captureFix135 must preserve Capture new-session reset semantics'
);
assert.match(fix138,/window\.isCaptureContext138\s*=\s*function/,'captureFix138 must remain present');
assert.match(fix139,/window\.startConfiguredGame\s*=\s*async\s+function/,'captureFix139 must remain the dedicated Capture launch interceptor');
assert.match(core200,/window\.startConfiguredGame\s*=\s*async\s+function/,'Dungeon Core 2.00 must remain the final Dungeon launch interceptor');

const assignments=(html.match(/window\.startConfiguredGame\s*=\s*async\s+function/g)||[]).length;
assert.equal(assignments,5,'rollback target must restore the characterized five-owner chain before any new Phase 5 consolidation');

console.log('Phase 5 user regression rollback guard: captureFix135 boundary restored, 5-owner chain preserved');
