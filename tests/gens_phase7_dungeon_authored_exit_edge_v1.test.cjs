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

assert.equal(bytes.length,8169447,
  'Phase 7 authored exit-edge RED must start from the move-allowance GREEN runtime');
assert.equal(gitBlob,'106d2ec6e82f3b777e1d724cd3f74f30a22fdf39',
  'Phase 7 authored exit-edge RED must start from the exact move-allowance GREEN blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.selectAuthoredOutgoingEdge,
  'function',
  'Phase 7 micro-lot 10 requires Dungeon-owned authored outgoing-edge selection'
);

const select=sandbox.GensDungeonV1.movement.selectAuthoredOutgoingEdge;
const edges=[
  {id:'AB',fromExitIndex:5,toNodeId:'B'},
  {id:'AC',fromExitIndex:9,toNodeId:'C'}
];

assert.equal(select(edges,5,true)?.id,'AB');
assert.equal(select([{id:'AB',fromExitIndex:'5',toNodeId:'B'}],5,true)?.id,'AB');
assert.equal(select([
  {id:'first',fromExitIndex:5,toNodeId:'B'},
  {id:'second',fromExitIndex:5,toNodeId:'C'}
],5,true)?.id,'first');
assert.equal(select([{id:'AB',fromExitIndex:5,toNodeId:'B'}],2,true),null);
assert.equal(select([{id:'AB',fromExitIndex:5,toNodeId:'B'}],2,false)?.id,'AB');
assert.equal(select(edges,2,false),null);
assert.equal(select(edges,9,false)?.id,'AC');
assert.equal(select([],2,false),null);

assert.doesNotMatch(
  entry,
  /dc305PositionalGameplay|gensGameplayModules|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure authored outgoing-edge selector must not absorb runtime configuration, spatial state, DOM or storage'
);

assert.equal(
  (authored.match(/GensDungeonV1\.movement\.selectAuthoredOutgoingEdge\(/g)||[]).length,
  1,
  'Authored Runtime must consume the pure outgoing-edge selector exactly once'
);
assert.match(
  authored,
  /function positional\(\)\{try\{if\(typeof ROOT\.dc305PositionalGameplay==="function"\)return !!ROOT\.dc305PositionalGameplay\(\)\}catch\(e\)\{\}try\{return ROOT\.gensGameplayModules\?\.\(\)\?\.movement===true\}catch\(e\)\{return false\}\}/,
  'Authored Runtime must retain positional configuration reads'
);
assert.match(
  authored,
  /const list=outgoing\(g,current\),pos=Number\(x\?\.positions\?\.\[hero\]\),edge=ROOT\.GensDungeonV1\.movement\.selectAuthoredOutgoingEdge\(list,pos,positional\(\)\);return \{hero,s,currentNodeId:current,targetNodeId:String\(edge\?\.toNodeId\|\|""\),edge,first:false,needsExit:!!list\.length&&!edge,outgoing:list\}/,
  'Authored Runtime plan must retain graph/position/config ownership around the pure selector'
);
assert.match(
  authored,
  /function atTerminalExit\(x\)\{const hero=activeHero\(x\),exitIdx=realExitIndex\(x\);return ROOT\.GensDungeonV1\.movement\.isAuthoredTerminalExit\(hero,exitIdx,positional\(\),x\?\.positions\?\.\[hero\]\)\}/,
  'terminal-exit policy must remain outside outgoing-edge selection after its later dedicated extraction'
);

assert.ok(
  contract.invariants.some(x=>/outgoing edge|exit edge|outgoing-edge|exit-edge/i.test(x)),
  'Dungeon contract must document the pure authored outgoing-edge selection boundary'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored exit-edge selection owner',
  expected:'RED before pure selector extraction, GREEN after direct plan raccord',
  pureOwner:'GensDungeonV1.movement.selectAuthoredOutgoingEdge',
  runtimeOwner:'DungeonAuthoredRuntime167839.plan',
  positionalOwner:'DungeonAuthoredRuntime167839.positional',
  spatialOwner:'DungeonSpatial313 unchanged'
},null,2));
