const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const indexPath=path.join(root,'index.html');
const index=fs.readFileSync(indexPath);
const source=index.toString('utf8');
const captureEntry=fs.readFileSync(path.join(root,'assets','gensrpg','capture','entry-v1.js'),'utf8');

const gitBlob=buffer=>{
  const header=Buffer.from('blob '+buffer.length+'\0');
  return crypto.createHash('sha1').update(Buffer.concat([header,buffer])).digest('hex');
};

assert.equal(index.length,8165906,'Rule 26 pre-retirement runtime size must stay pinned until the seed seam mutates');
assert.equal(gitBlob(index),'1e3398755beb751786d825047bc60fe1a7179d79','Rule 26 pre-retirement runtime blob must stay pinned until the seed seam mutates');

const marker='<script id="builtinMonsterCapture162"';
const start=source.indexOf(marker);
assert.ok(start>0,'builtin Monster Capture seed owner must exist');
const openEnd=source.indexOf('>',start);
const end=source.indexOf('</script>',openEnd);
assert.ok(openEnd>start&&end>openEnd,'builtin Monster Capture seed owner must have an exact script boundary');
const seed=source.slice(openEnd+1,end);

assert.match(seed,/const MC162_ID="gp_mt7ker7t_m2iw9"/,'Monster Capture built-in profile id must stay stable');
assert.match(seed,/name":"Monster Capture"/,'Monster Capture built-in profile name must stay stable');
assert.match(seed,/modules":\{"rules":true,"objects":true,"heroes":true,"enemies":true,"waves":false\}/,'Monster Capture built-in module contract must stay stable');
assert.match(seed,/controllableCreatures":true/,'Monster Capture must keep controllable-creature gameplay enabled');
assert.match(captureEntry,/isProfile\s*\(/,'public Capture entry must keep canonical profile identity');
assert.doesNotMatch(captureEntry,/gameStyle|isDungeonMode|DungeonCore|DungeonSpatial/,'public Capture entry must stay routing-only and independent from Dungeon identity');

assert.doesNotMatch(
  seed,
  /"gameStyle":"dungeon"/,
  'Phase 9 retirement requires the built-in Monster Capture seed/factory to stop declaring Dungeon identity'
);

console.log(JSON.stringify({
  scenario:'Phase 9 retire Monster Capture seed Dungeon identity',
  rule26:{bytes:index.length,blob:gitBlob(index)},
  seedOwner:'builtinMonsterCapture162',
  captureId:'gp_mt7ker7t_m2iw9',
  dungeonStyleOccurrences:(seed.match(/"gameStyle":"dungeon"/g)||[]).length
},null,2));
