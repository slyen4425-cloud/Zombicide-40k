const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..','assets','gensrpg');

function walk(dir){
  if(!fs.existsSync(dir)) return [];
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(p));
    else if(entry.isFile()&&entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function rel(file){return path.relative(path.join(__dirname,'..'),file).replaceAll(path.sep,'/');}

const legacyFiles=new Set([
  'assets/gensrpg/gens-dungeon-hero-art-repair-167874.js',
  'assets/gensrpg/gens-dungeon-hero-ingame-art-167898.js',
  'assets/gensrpg/gens-dungeon-ingame-hero-art-167898.js',
  'assets/gensrpg/gens-dungeon-sheet-art-stability-167899.js',
  'assets/gensrpg/gens-dungeon-ui-cleanup-1678100.js',
  'assets/gensrpg/gens-equipment-stat-cleanup-1678102.js',
  'assets/gensrpg/gens-hero-editor-dynamic-167897.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
  'assets/gensrpg/gens-multiplayer-entry-167831.js',
  'assets/gensrpg/gens-rpg-runtime-repair-1678106.js',
  'assets/gensrpg/gens-rpg-stats-clean-167874.js',
  'assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-hotfix-1678114.js',
  'assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js',
  'assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js',
  'assets/gensrpg/gens-rpg-tactical-session-guard-16781144.js',
  'assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js',
  'assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js',
  'assets/gensrpg/gens-stat-manual-cost-167898.js',
  'assets/gensrpg/gens-stat-upgrade-policy-167898.js',
  'assets/gensrpg/gens-ui-recovery-167843.js',
  'assets/gensrpg/gens-world-summary-167820.js'
]);

const RUNTIME_BOOTSTRAP='assets/gensrpg/core/runtime-bootstrap-v1.js';
const TACTICAL_ENTRY='assets/gensrpg/tactical/entry-v1.js';
const DUNGEON_CORE200='assets/gensrpg/dungeon/core200-rebuild-v1.js';
const DUNGEON_CORE213='assets/gensrpg/dungeon/core213-stability-v1.js';
const core213=fs.readFileSync(path.join(__dirname,'..',DUNGEON_CORE213));
const core213Blob=crypto.createHash('sha1').update(Buffer.from('blob '+core213.length+'\0')).update(core213).digest('hex');
assert.equal(core213.length,17519,'D6 moved Core213 exact byte length');
assert.equal(core213Blob,'af4bf724315180becd80833af251504130751ad3','D6 Core213 must remain exactly original inline bytes');
assert.equal((core213.toString().match(/\.stopImmediatePropagation\s*\(/g)||[]).length,1,'D6 historic Core213 had one propagation hard-stop');

// D4 moved this unchanged active inline owner into a physical JS file. Allow
// only two original historical patterns, tied to the exact audited JS blob.
// Existing D4 exceptions remain pinned to its original owner Git blob.
 // The narrowly reviewed Phase12 Core200 fix is separately guarded byte-for-byte
 // in tests/gensrpg_phase12_dungeon_core200_spawn_order_guard.test.cjs.
// The live owner is scanned by the rules below. Historical allowances must
// instead be verified against the exact immutable D4 bytes (not a later owner
// and not a git-show path from a revision where the file did not yet exist).
const core200=fs.readFileSync(path.join(__dirname,'..','tests/fixtures/gensrpg_phase12_d4_core200_original_2026-10-22.txt'));
const core200Blob=crypto.createHash('sha1').update(Buffer.from('blob '+core200.length+'\0')).update(core200).digest('hex');
assert.equal(core200.length,55842,'D4 legacy Core200 physical owner size locked');
assert.equal(core200Blob,'5649ae0af69064dde72e6ea28b8dbefd105cb527','D4 legacy Core200 must remain byte-identical');
assert.equal((core200.toString().match(/\.stopImmediatePropagation\s*\(/g)||[]).length,1,'D4 owner had exactly one historical hard-stop');
assert.equal((core200.toString().match(/(?:window|R)\.(?:dc200StartCombat|openDungeonCombatSetup|launchCombat200|startCombat)\s*=/g)||[]).length,1,'D4 owner had exactly one historical combat public assignment');
// R05 physically moves an existing local-backup import/reload effect without modifying it.
// This is an exact historical exception, NOT permission for future Core modules to reload pages.
const CLOUD_SYNC_R05='assets/gensrpg/core/legacy-cloud-sync-backup-v1.js';
const cloudSyncR05=fs.readFileSync(path.join(__dirname,'..',CLOUD_SYNC_R05));
const cloudSyncR05Blob=crypto.createHash('sha1').update(Buffer.from('blob '+cloudSyncR05.length+'\0')).update(cloudSyncR05).digest('hex');
assert.equal(cloudSyncR05.length,53746,'R05 original online sync and local-backup JS size');
assert.equal(cloudSyncR05Blob,'8d7f8179676b096a53816cd1ca2530c120e3cf18','R05 must preserve original inline JS byte-identically');
assert.equal((cloudSyncR05.toString().match(/(?:window\.|R\.)?location\.reload\s*\(/g)||[]).length,1,'one historical local-backup import reload');
const explicitRuleExceptions=new Map([
  [CLOUD_SYNC_R05,new Set(['direct page reload'])],
  [RUNTIME_BOOTSTRAP,new Set(['hidden script injection'])],
  [TACTICAL_ENTRY,new Set(['hidden script injection'])],
  [DUNGEON_CORE200,new Set(['event propagation hard-stop','protected Dungeon combat global replacement'])],
  [DUNGEON_CORE213,new Set(['event propagation hard-stop'])]
]);

const allFiles=walk(root).map(rel).sort();
for(const old of legacyFiles) assert.ok(allFiles.includes(old),`legacy architecture baseline changed: missing ${old}`);
assert.ok(allFiles.includes(RUNTIME_BOOTSTRAP),'explicit RuntimeBootstrap V1 must exist');
assert.ok(allFiles.includes(TACTICAL_ENTRY),'explicit Tactical public composition entry must exist');

const newFiles=allFiles.filter(f=>!legacyFiles.has(f));
const violations=[];
const rules=[
  ['global MutationObserver target',/\.observe\s*\(\s*(?:document\.|D\.)?(?:body|documentElement)\b/g],
  ['global capture listener',/(?:document|window|D|R)\.addEventListener\s*\([^\n;]{0,240},\s*true\s*\)/g],
  ['event propagation hard-stop',/\.stopImmediatePropagation\s*\(/g],
  ['permanent heartbeat/setInterval',/\bsetInterval\s*\(/g],
  ['direct page reload',/(?:window\.|R\.)?location\.reload\s*\(/g],
  ['direct location replacement',/(?:window\.|R\.)?location\.(?:href|assign|replace)\s*(?:=|\()/g],
  ['hidden script injection',/createElement\s*\(\s*["']script["']\s*\)/g],
  ['protected Dungeon combat global replacement',/(?:window|R)\.(?:dc200StartCombat|openDungeonCombatSetup|launchCombat200|startCombat)\s*=/g]
];

function allowed(file,name){return explicitRuleExceptions.get(file)?.has(name)===true}

for(const file of newFiles){
  const text=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  for(const [name,re] of rules){
    re.lastIndex=0;
    if(re.test(text)&&!allowed(file,name))violations.push(`${file}: ${name}`);
  }
}

assert.deepEqual(violations,[],
  'new GenSrpG modules must not introduce hidden/global runtime authority; only Core RuntimeBootstrap may load a public entry and Tactical entry may compose Tactical private scripts:\n'+violations.join('\n'));

const targetPrefixes=[
  'assets/gensrpg/core/',
  'assets/gensrpg/shell/',
  'assets/gensrpg/survival/',
  'assets/gensrpg/dungeon/',
  'assets/gensrpg/tactical/',
  'assets/gensrpg/capture/',
  'assets/gensrpg/pvp/',
  'assets/gensrpg/builders/'
];
for(const file of allFiles.filter(f=>targetPrefixes.some(p=>f.startsWith(p)))){
  const text=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  for(const [name,re] of rules){
    re.lastIndex=0;
    if(allowed(file,name))continue;
    assert.equal(re.test(text),false,`${file}: target architecture cannot contain ${name}`);
  }
}

assert.deepEqual([...explicitRuleExceptions.keys()],[CLOUD_SYNC_R05,RUNTIME_BOOTSTRAP,TACTICAL_ENTRY,DUNGEON_CORE200,DUNGEON_CORE213],
  'only the two composition entrypoints and the exact byte-verified D4 legacy owner may claim named exceptions');
console.log(`GenSrpG global side-effect guard OK (${allFiles.length} modules; Core loads public entry, Tactical entry owns private composition)`);
