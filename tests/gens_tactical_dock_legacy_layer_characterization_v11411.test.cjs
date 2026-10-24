const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dock=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const repair=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-runtime-repair-1678106.js'),'utf8');

const dockZ=Number(dock.match(/\.gtv2111Dock\{[^}]*z-index:(\d+)/)?.[1]||0);
const tacticalZ=Number(fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8').match(/\.gtv2Overlay\{[^}]*z-index:(\d+)/)?.[1]||0);
const legacyCombatZ=Number(index.match(/#dungeonCombatModal\{z-index:(\d+)!important\}/)?.[1]||0);
const legacyDiceZ=Number(index.match(/#specialDiceModal\.open,#attackDiceModal\.open\{[^}]*z-index:(\d+)!important/)?.[1]||0);

assert.equal(tacticalZ,30000,'canonical Tactical overlay z-index changed unexpectedly');
assert.equal(dockZ,31850,'floating Dock z-index changed unexpectedly');
assert.equal(legacyCombatZ,100900,'legacy Dungeon combat host z-index changed unexpectedly');
assert.equal(legacyDiceZ,101500,'legacy Dungeon dice layer z-index changed unexpectedly');
assert.ok(legacyCombatZ>dockZ,'legacy Dungeon combat host can cover the floating Dock if it stays open');
assert.ok(legacyDiceZ>dockZ,'legacy Dungeon dice layer can cover the floating Dock if it stays open');

assert.match(repair,/function closeLegacyCombat\(rt=R\)/,'V106 must retain the existing legacy combat cleanup owner');
assert.match(repair,/return \{VERSION,APP_VERSION,[^}]*closeLegacyCombat,/,'V106 must expose its existing cleanup instead of duplicating it elsewhere');
assert.match(repair,/if\(opened\?\.ok\)\{\s*closeLegacyCombat\(rt\)/,'legacy renderer interception must still close the legacy host after Tactical opens');
assert.match(bridge,/GensRpgRuntimeRepair1678106\?\.closeLegacyCombat\?\.\(rt\)/,
  'direct Bridge routing must reuse the V106 legacy-layer cleanup owner');
assert.match(bridge,/function retireLegacyCombatLayer\(rt=R,options=\{\}\)\{[\s\S]*?runtime-renderer:/,
  'Bridge cleanup must skip only the historical renderer path that already performs the same cleanup');
assert.doesNotMatch(bridge,/getElementById\?\.\("dungeonCombatModal"\)|classList\?\.remove\?\.\("dc200CombatOpen"/,
  'Bridge must not duplicate V106 DOM cleanup internals');

console.log('GenSrpG Tactical Dock legacy-layer authority OK',{
  tacticalZ,dockZ,legacyCombatZ,legacyDiceZ,
  directBridgeCleanup:true,
  cleanupOwner:'GensRpgRuntimeRepair1678106.closeLegacyCombat'
});
