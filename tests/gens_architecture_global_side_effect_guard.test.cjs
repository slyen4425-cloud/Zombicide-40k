const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

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

// Existing legacy files are deliberately frozen as historical debt. This list is not a
// permission to add more global authority inside them; it only prevents this first guard
// from trying to rewrite the current V114.11 runtime before characterization is complete.
// Any NEW module is clean-by-default and must use explicit contracts/lifecycle.
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
  'assets/gensrpg/gens-survival-mode-isolation-1678104.js',
  'assets/gensrpg/gens-ui-recovery-167843.js',
  'assets/gensrpg/gens-world-summary-167820.js'
]);

const allFiles=walk(root).map(rel).sort();
for(const old of legacyFiles) assert.ok(allFiles.includes(old),`legacy architecture baseline changed: missing ${old}`);

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

for(const file of newFiles){
  const text=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  for(const [name,re] of rules){
    re.lastIndex=0;
    if(re.test(text)) violations.push(`${file}: ${name}`);
  }
}

assert.deepEqual(violations,[],
  'new GenSrpG modules must not introduce hidden/global runtime authority; use explicit contracts, install()/dispose(), or update the architecture decision deliberately:\n'+violations.join('\n'));

// Target architecture folders are additionally required to remain explicit even when
// an old top-level filename is later moved there.
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
    assert.equal(re.test(text),false,`${file}: target architecture cannot contain ${name}`);
  }
}

console.log(`GenSrpG global side-effect guard OK (${allFiles.length} legacy/current modules, ${newFiles.length} new modules)`);
