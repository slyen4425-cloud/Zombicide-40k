'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const owners=manifest.files||manifest;

const hits=[];
for(const p of Object.keys(owners).sort()){
  if(!p.endsWith('.js'))continue;
  const abs=path.join(root,p);
  if(!fs.existsSync(abs))continue;
  const src=read(p);
  if(!src.includes('saveEquipmentEditor'))continue;
  hits.push({
    path:p,
    owner:owners[p]?.owner||'',
    domain:owners[p]?.domain||'',
    role:owners[p]?.role||'',
    assigns:/\b(?:ROOT|R|window)\.saveEquipmentEditor\s*=/.test(src),
    wrapsGeneric:/wrap\(["']saveEquipmentEditor["']/.test(src),
    capturesBase:/\b(?:baseSave|old)\s*=\s*(?:ROOT|R|window)\.saveEquipmentEditor/.test(src),
    callsPersistMembership:/persistItemMembership\s*\(/.test(src),
    callsSaveCustomEquipment:/saveCustomEquipment\??\.?(?:\s*)\(/.test(src)||/saveCustomEquipment\s*\(/.test(src),
    invalidatesCache:/invalidateEquipmentBonusCache\s*\(/.test(src)
  });
}

const expected=[
  'assets/dungeon/dungeon-equipment-hotfix-167817.js',
  'assets/dungeon/dungeon-set-editor-167818.js',
  'assets/gensrpg/gens-equipment-stat-cleanup-1678102.js',
  'assets/gensrpg/gens-hero-editor-dynamic-167897.js'
].sort();

assert.deepEqual(
  hits.map(x=>x.path).sort(),
  expected,
  'reachable external saveEquipmentEditor participants changed; re-audit ownership before editing wrappers'
);

console.log(JSON.stringify({
  scenario:'Phase 4 saveEquipmentEditor exhaustive runtime inventory',
  reachableExternalFiles:Object.keys(owners).filter(p=>p.endsWith('.js')).length,
  participantCount:hits.length,
  participants:hits,
  runtimeModified:false
},null,2));
