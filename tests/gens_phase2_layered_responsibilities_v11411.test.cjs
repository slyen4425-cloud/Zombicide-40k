const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const manifest=JSON.parse(read('docs/GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json'));
const tsv=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const rows=new Map();
for(const line of tsv.split(/\r?\n/)){
  if(!line||line.startsWith('#'))continue;
  const [name,count,lastOwner]=line.split('\t');
  if(name&&count&&lastOwner)rows.set(name,{assignmentCount:Number(count),lastOwner});
}
assert.equal(rows.size,435,'last-owner table size drifted');

for(const h of manifest.hotspots){
  const row=rows.get(h.name);
  assert.ok(row,'layered responsibility hotspot missing: '+h.name);
  assert.equal(row.assignmentCount,h.assignmentCount,h.name+' assignment count drifted');
  assert.equal(row.lastOwner,h.lastOwner,h.name+' last owner drifted');
  assert.ok(h.assignmentCount>=6,h.name+' is not a high-density hotspot');
  assert.ok(typeof h.classification==='string'&&h.classification.trim());
  assert.ok(typeof h.responsibility==='string'&&h.responsibility.trim());
}
assert.equal(new Set(manifest.hotspots.map(x=>x.name)).size,manifest.hotspots.length,'duplicate hotspot records');
assert.ok(manifest.hotspots.some(x=>x.name==='renderDungeonCombatRound'&&x.assignmentCount===30));
assert.ok(manifest.hotspots.some(x=>x.name==='captureRenderBattleLive'&&x.assignmentCount===15));

console.log(JSON.stringify({
  scenario:'Phase 2 layered responsibility hotspots',
  hotspots:manifest.hotspots.length,
  classifications:[...new Set(manifest.hotspots.map(x=>x.classification))].sort(),
  maxAssignments:Math.max(...manifest.hotspots.map(x=>x.assignmentCount))
},null,2));