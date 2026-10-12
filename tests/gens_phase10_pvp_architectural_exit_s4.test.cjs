"use strict";

/**
 * Phase 10 structural exit: this is NOT a duel gameplay test.
 * Guard the genuine production script graph, declared owners and deferred UI.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const contract=JSON.parse(read("assets/gensrpg/pvp/module-contract-v1.json"));
const index=read("index.html");
const pvpRoot="assets/gensrpg/pvp/";
const expected=[
  "session-v1.js",
  "module-launch-v1.js",
  "shell-composition-v1.js"
];
assert.equal(contract.phase,3);
assert.equal(contract.activatedPhase,10);
assert.equal(contract.module,"pvp");
assert.equal(contract.stage,"S4-architectural-closure");
assert.equal(contract.status,"shell-registered-structural-module-no-gameplay");
assert.deepEqual(contract.runtime.productionLoadedInOrder,expected.map(x=>pvpRoot+x));
assert.match(contract.shell.userFacingEntry,/PVP — À VENIR/);
assert.match(contract.runtime.setupUi,/not loaded\/mounted in production/);
assert.match(contract.runtime.combatOwner,/not implemented/);

// The real source HTML must carry exactly one, in-order composition.
// Unlike isolated mocks, this validates the actual production load graph.
let prev=-1;
for(const file of expected){
  const tag='<script src="'+pvpRoot+file+'"></script>';
  const at=index.indexOf(tag);
  assert.ok(at>prev,"PvP script missing or misordered: "+file);
  assert.equal(index.lastIndexOf(tag),at,"PvP script double-loaded: "+file);
  prev=at;
}
const connect='window.GensPvpShellCompositionV1.connect()';
const atConnect=index.indexOf(connect);
const finalAuthority=index.indexOf('<script src="assets/gensrpg/shell/module-launch-final-authority-v1.js"></script>');
assert.ok(atConnect>prev,"only the Shell composition point can explicitly connect PvP");
assert.ok(finalAuthority>atConnect,"Shell final launcher remains the last authority");
assert.equal(index.lastIndexOf(connect),atConnect,"PvP must not be composed twice");
assert.match(index,/PVP — À VENIR/,"PvP home entry is deliberately not playable");
assert.doesNotMatch(index,/<script[^>]+src="assets\/gensrpg\/pvp\/setup-ui-v1\.js"/,"S3 UI must remain opt-in");
assert.doesNotMatch(index,/<script[^>]+src="assets\/gensrpg\/pvp\/entry-v1\.js"/,"Phase 3 stub must stay inert");

const ownerGlobalNames=[
  ["session-v1.js","GensPvpSessionV1"],
  ["module-launch-v1.js","GensPvpModuleLaunchV1"],
  ["shell-composition-v1.js","GensPvpShellCompositionV1"],
  ["setup-ui-v1.js","GensPvpSetupUiV1"]
];
const forbidden=/\b(?:window|root)\.(?:GensCaptureV1|GensDungeonV1|GensSurvivalV1|startConfiguredGame|openGensFamily)\s*=/;
for(const [file,ownedGlobal] of ownerGlobalNames){
  const code=read(pvpRoot+file);
  assert.ok(code.includes("root."+ownedGlobal+"="),"Missing declared PvP API "+file);
  assert.doesNotMatch(code,forbidden,"foreign module authority replaced by "+file);
  assert.doesNotMatch(code,/\b(?:localStorage|sessionStorage|MutationObserver|setInterval|setTimeout|stopImmediatePropagation)\b/,
    "PvP must not install foreign-global side effects: "+file);
}
assert.equal(contract.runtime.legacyEntry,pvpRoot+"entry-v1.js (historical inert Phase 3 stub, not used as production entry)");
assert.match(read(pvpRoot+"entry-v1.js"),/no runtime code/);
assert.equal(contract.outOfScope.includes("PvP duel combat gameplay"),true);
assert.equal(contract.outOfScope.includes("making PvP Hub card playable"),true);
console.log(JSON.stringify({
  scenario:"Phase 10 architectural exit - owned PvP interfaces only",
  realProductionComposition:true,
  foreignOwnersUnchanged:true,
  setupScreenPrivate:true,
  duelGameplayOutOfScope:true
}));
