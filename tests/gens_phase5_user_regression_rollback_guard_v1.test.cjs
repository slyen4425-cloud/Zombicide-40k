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

assert.doesNotMatch(
  fix135,
  /window\.startConfiguredGame\s*=/,
  'user-regression guard: captureFix135 global startConfiguredGame owner must remain retired'
);
assert.match(fix135,/target135\(/,'captureFix135 ally-targeting responsibility must remain');
assert.match(fix135,/render135\(/,'captureFix135 battle rendering/log responsibility must remain');
assert.match(fix135,/captureBattleLiveBody/,'captureFix135 detailed combat-log UI must remain');
assert.match(fix135,/captureCreatureDetailBody/,'captureFix135 creature stats/detail UX must remain');
assert.match(fix135,/oldPlayerText135/,'captureFix135 player-text compatibility layer must remain');
assert.match(fix138,/window\.isCaptureContext138\s*=\s*function/,'captureFix138 must remain present');
assert.match(fix139,/window\.startConfiguredGame\s*=\s*async\s+function/,'captureFix139 must remain the dedicated Capture launch interceptor');
assert.match(core200,/const\s+gensDungeonStartConfiguredGame200V1\s*=\s*async\s+function/,'Dungeon Core 2.00 must retain its stable local Dungeon launch dispatcher');
assert.doesNotMatch(core200,/window\.startConfiguredGame\s*=\s*async\s+function/,'Dungeon Core 2.00 global launch owner must remain retired');

const assignments=(html.match(/window\.startConfiguredGame\s*=\s*async\s+function/g)||[]).length;
assert.equal(assignments,3,'rollback guard must preserve the three remaining historical global owners after captureFix135 retirement');

console.log('Phase 5 user regression rollback guard: captureFix135 non-wrapper responsibilities preserved, global owner retired, 3-owner chain preserved, Core200 local dispatcher retained');
