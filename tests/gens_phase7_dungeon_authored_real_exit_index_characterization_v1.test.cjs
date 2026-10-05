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
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165906,
  'Phase 7 authored real-exit characterization must track the exit-edge GREEN runtime');
assert.equal(gitBlob,'1e3398755beb751786d825047bc60fe1a7179d79',
  'Phase 7 authored real-exit characterization must track the exact exit-edge GREEN blob');

assert.match(
  authored,
  /function realExitIndex\(x\)\{const map=x\?\.last\?\.map\|\|\{\},cells=Array\.isArray\(map\.cells\)\?map\.cells:\[\];return ROOT\.GensDungeonV1\.movement\.resolveAuthoredRealExitIndex\(cells,map\.exitIdx\)\}/,
  'post-raccord realExitIndex must preserve map reads and delegate only pure exit resolution'
);
assert.match(
  authored,
  /function atTerminalExit\(x\)\{const hero=activeHero\(x\),exitIdx=realExitIndex\(x\);return ROOT\.GensDungeonV1\.movement\.isAuthoredTerminalExit\(hero,exitIdx,positional\(\),x\?\.positions\?\.\[hero\]\)\}/,
  'terminal-exit policy must remain outside realExitIndex after its later dedicated extraction'
);

const context={
  console,Math,Date,JSON,
  localStorage:{getItem(){return null},setItem(){}}
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,context,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;
assert.ok(api,'authored runtime API must load');

function value(cells,exitIdx,expected){
  assert.equal(
    api.realExitIndex({last:{map:{cells,exitIdx}}}),
    expected,
    'realExitIndex parity failed for exitIdx='+String(exitIdx)+' cells='+JSON.stringify(cells)
  );
}

value(['floor','exit'],1,1);
value(['floor','exit'],'1',1);
value(['exit','floor','exit'],2,2);
value(['floor','EXIT'],1,1);
value(['floor','exit'],0,1);
value(['floor','exit'],-1,1);
value(['floor','exit'],1.5,1);
value(['floor','exit'],99,1);
value(['EXIT','floor'],undefined,0);
value(['floor','door'],1,-1);
assert.equal(api.realExitIndex({last:{map:{exitIdx:0}}}),-1);
assert.equal(api.realExitIndex({}),-1);

const pureSandbox={};
pureSandbox.window=pureSandbox;
pureSandbox.globalThis=pureSandbox;
vm.createContext(pureSandbox);
vm.runInContext(entry,pureSandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pureSandbox.GensDungeonV1?.movement?.resolveAuthoredRealExitIndex,
  'function',
  'post-raccord characterization requires the Dungeon-owned authored real-exit resolver'
);

assert.doesNotMatch(
  entry,
  /DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon public entry must remain pure before real-exit extraction'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored real exit index post-raccord characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.realExitIndex consumer',
  semantics:{
    validDirectPriority:true,
    numericDirectCoercion:true,
    invalidDirectFallsBack:true,
    caseInsensitiveExit:true,
    firstFallbackExit:true,
    missingExitMinusOne:true
  },
  pureTarget:'GensDungeonV1.movement.resolveAuthoredRealExitIndex',
  terminalPolicy:'unchanged'
},null,2));
