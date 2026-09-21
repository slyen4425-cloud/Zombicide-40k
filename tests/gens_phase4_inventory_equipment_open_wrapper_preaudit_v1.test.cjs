'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const ownersRaw=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const owners=ownersRaw.files||ownersRaw;
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const setEditor=read('assets/dungeon/dungeon-set-editor-167818.js');
const artRepair=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const heroDynamic=read('assets/gensrpg/gens-hero-editor-dynamic-167897.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');

const reachableHits=Object.keys(owners)
  .filter(p=>p.endsWith('.js')&&fs.existsSync(path.join(root,p)))
  .filter(p=>read(p).includes('openEquipmentEditor'))
  .sort();

const expected=[
  'assets/dungeon/dungeon-equipment-hotfix-167817.js',
  'assets/dungeon/dungeon-set-editor-167818.js',
  'assets/gensrpg/gens-equipment-stat-cleanup-1678102.js',
  'assets/gensrpg/gens-hero-editor-dynamic-167897.js'
].sort();

assert.deepStrictEqual(
  reachableHits,
  expected,
  'reachable external openEquipmentEditor participants changed; re-audit ownership before editing wrappers'
);

function ordered(source,names,label){
  let last=-1;
  for(const name of names){
    const pos=source.indexOf(name);
    assert.ok(pos>=0,label+': missing '+name);
    assert.ok(pos>last,label+': wrong order around '+name);
    last=pos;
  }
}

ordered(workflow,[
  'dungeon-equipment-hotfix-167817.js',
  'dungeon-set-editor-167818.js',
  'gens-rpg-stats-clean-167874.js',
  'gens-dungeon-hero-art-repair-167874.js'
],'Pages equipment/open composition');

ordered(preview,[
  'dungeon-equipment-hotfix-167817.js',
  'dungeon-set-editor-167818.js',
  'gens-rpg-stats-clean-167874.js',
  'gens-dungeon-hero-art-repair-167874.js'
],'preview equipment/open composition');

// Hotfix: opens the historical RPG bonus section.
assert.ok(hotfix.includes('const baseOpen=ROOT.openEquipmentEditor;'));
assert.ok(hotfix.includes('const result=baseOpen.apply(this,arguments);'));
assert.ok(hotfix.includes('loadEditor(findItem(id));'));
assert.ok(hotfix.includes('wrapped.__equipmentHotfix167817=true;wrapped.__original=baseOpen'));

// Set editor: synchronizes set membership/editor controls after the previous owner.
assert.ok(setEditor.includes('const baseOpen=ROOT.openEquipmentEditor;'));
assert.ok(setEditor.includes('const wrapped=function(){const result=baseOpen.apply(this,arguments);syncEditorFromCurrentItem();addNewButton();return result}'));
assert.ok(setEditor.includes('wrapped.__setEditor167818=true;wrapped.__original=baseOpen'));

// Hero Art Repair keeps its visual hook machinery but no longer owns the Equipment open lifecycle.
assert.ok(artRepair.includes('function hook(name)'));
assert.ok(artRepair.includes('repairDefs();schedule();return out'));
assert.ok(!artRepair.includes('"openEquipmentEditor"'));
assert.ok(artRepair.includes('w.__gdar167874=true;w.__original=old'));

// It then dynamically loads Hero Editor before Equipment Cleanup.
ordered(artRepair,[
  'loadScript(HERO_EDITOR_SRC',
  'loadScript(EQUIPMENT_CLEANUP_SRC'
],'hero-art runtime bridge load order');

// Hero Editor owns the canonical base-rpgBonuses UI and wraps openEquipmentEditor.
assert.ok(heroDynamic.includes('ensureEquipmentBonusUi'));
assert.ok(heroDynamic.includes('wrap("openEquipmentEditor"'));
assert.ok(heroDynamic.includes('setTimeout(()=>ensureEquipmentBonusUi'));
assert.ok(heroDynamic.includes('if(!api()){setTimeout(install,25);return false}'));
assert.ok(heroDynamic.includes('if(tries++<30)setTimeout(retry,100)'));
assert.ok(heroDynamic.includes('setTimeout(retry,50)'));

// Canonical cleanup wraps the editor too, but is single-install.
assert.ok(cleanup.includes('function wrapOpen()'));
assert.ok(cleanup.includes('setTimeout(()=>decorateEquipmentEditor(id),0)'));
assert.ok(cleanup.includes('w.__canonEq102=true;w.__original=old'));
assert.ok(cleanup.includes('if(installed)return true'));
assert.ok(cleanup.includes('if(!D||!api()){setTimeout(install,25);return false}'));

// The old hotfix section is intentionally hidden by the canonical cleanup.
assert.ok(cleanup.includes('deuiEquipmentEditorStats167817'));
assert.ok(cleanup.includes('old.style.setProperty("display","none","important")'));

// But hotfix open/save are coupled through those historical inputs: do not retire open alone yet.
assert.ok(hotfix.includes('function readEditorBonuses()'));
assert.ok(hotfix.includes('const bonuses=dungeon?readEditorBonuses():null;'));

// Set-editor open/save are likewise coupled around membership state.
assert.ok(setEditor.includes('persistItemMembership(id,setId,piece)'));

// The historical retry risk is retired: Hero Editor now checks the complete
// __original chain before adding another owner marker.
assert.ok(heroDynamic.includes('function wrapperChainHasFlag(fn,flag)'));
assert.ok(heroDynamic.includes('wrapperChainHasFlag(old,flag)'));
assert.ok(heroDynamic.includes('flag="__canon101"'));
assert.ok(cleanup.includes('__canonEq102'));

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment openEquipmentEditor wrapper preaudit',
  reachableExternalParticipants:reachableHits,
  currentComposition:[
    'equipment-hotfix-167817',
    'set-editor-167818',
    'hero-editor-dynamic-167897',
    'equipment-stat-cleanup-1678102'
  ],
  retryRisk:'retired: Hero Editor scans __original before rewrapping, so Cleanup marker interposition no longer duplicates __canon101',
  retiredParticipant:'hero-art-repair-167874',
  retirementProof:'dedicated owner guard + browser characterization required'
},null,2));
