'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165906,
  'Phase 7 authored terminal-exit RED must start from the real-exit GREEN runtime');
assert.equal(gitBlob,'1e3398755beb751786d825047bc60fe1a7179d79',
  'Phase 7 authored terminal-exit RED must start from the exact real-exit GREEN blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.isAuthoredTerminalExit,
  'function',
  'Phase 7 micro-lot 12 requires Dungeon-owned authored terminal-exit decision'
);

const terminal=sandbox.GensDungeonV1.movement.isAuthoredTerminalExit;
assert.equal(terminal('',1,true,1),false);
assert.equal(terminal('hero',-1,true,1),false);
assert.equal(terminal('hero',1,false,99),true);
assert.equal(terminal('hero',1,false,undefined),true);
assert.equal(terminal('hero',1,true,1),true);
assert.equal(terminal('hero',1,true,'1'),true);
assert.equal(terminal('hero',1,true,0),false);
assert.equal(terminal('hero',1,true,undefined),false);
assert.equal(terminal('hero',1,true,'abc'),false);

assert.doesNotMatch(
  entry,
  /dc305PositionalGameplay|gensGameplayModules|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure authored terminal-exit decision must not absorb runtime configuration, spatial state, DOM or storage'
);

assert.equal(
  (authored.match(/GensDungeonV1\.movement\.isAuthoredTerminalExit\(/g)||[]).length,
  1,
  'Authored Runtime must consume the pure terminal-exit decision exactly once'
);
assert.match(
  authored,
  /function atTerminalExit\(x\)\{const hero=activeHero\(x\),exitIdx=realExitIndex\(x\);return ROOT\.GensDungeonV1\.movement\.isAuthoredTerminalExit\(hero,exitIdx,positional\(\),x\?\.positions\?\.\[hero\]\)\}/,
  'Authored Runtime must retain hero exit positional and position reads around the pure decision'
);
assert.match(
  authored,
  /function travel\(\)\{[^\n]*if\(!atTerminalExit\(x\)\)\{notice\("🚪 Sortie finale","Place le héros actif sur la vraie case SORTIE pour terminer le donjon\."\);return false\}return finishTerminal\(\)/,
  'authored travel and finish policy must remain outside this micro-lot'
);

assert.ok(
  contract.invariants.some(x=>/terminal exit|terminal-exit/i.test(x)),
  'Dungeon contract must document the pure authored terminal-exit decision boundary'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored terminal exit owner',
  expected:'RED before pure terminal decision extraction, GREEN after direct atTerminalExit raccord',
  pureOwner:'GensDungeonV1.movement.isAuthoredTerminalExit',
  runtimeOwner:'DungeonAuthoredRuntime167839.atTerminalExit',
  travelOwner:'DungeonAuthoredRuntime167839.travel',
  spatialOwner:'DungeonSpatial313 unchanged'
},null,2));
