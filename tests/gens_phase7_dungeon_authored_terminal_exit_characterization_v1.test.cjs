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

assert.equal(bytes.length,8169990,
  'Phase 7 authored terminal-exit characterization must track the real-exit GREEN runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 authored terminal-exit characterization must track the exact real-exit GREEN blob');

assert.match(
  authored,
  /function atTerminalExit\(x\)\{const hero=activeHero\(x\),exitIdx=realExitIndex\(x\);if\(!hero\|\|exitIdx<0\)return false;if\(!positional\(\)\)return true;return Number\(x\?\.positions\?\.\[hero\]\)===exitIdx\}/,
  'historical atTerminalExit must remain local to Authored Runtime before extraction'
);

let positionalEnabled=true;
const context={
  console,Math,Date,JSON,
  localStorage:{getItem(){return null},setItem(){}},
  dc305PositionalGameplay(){return positionalEnabled}
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,context,{filename:'assets/dungeon/dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;
assert.ok(api,'authored runtime API must load');

function state({hero=true,cells=['floor','exit'],exitIdx=1,position=1}={}){
  return {
    participants:hero?['hero']:[],
    index:0,
    positions:hero?{hero:position}:{},
    last:{map:{cells,exitIdx}}
  };
}

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({hero:false})),false,
  'missing active hero must block terminal exit');

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({cells:['floor','door'],exitIdx:1})),false,
  'missing real exit must block terminal exit');

positionalEnabled=false;
assert.equal(api.atTerminalExit(state({position:99})),true,
  'non-positional authored play must accept a valid real exit without position matching');

positionalEnabled=false;
assert.equal(api.atTerminalExit(state({position:undefined})),true,
  'non-positional authored play must not require a stored hero position');

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({position:1})),true,
  'positional authored play must accept matching numeric hero position');

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({position:'1'})),true,
  'positional authored play must preserve Number coercion for hero position');

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({position:0})),false,
  'positional authored play must reject a different hero position');

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({position:undefined})),false,
  'positional authored play must reject a missing hero position');

positionalEnabled=true;
assert.equal(api.atTerminalExit(state({position:'abc'})),false,
  'positional authored play must reject a non-numeric hero position');

const pureSandbox={};
pureSandbox.window=pureSandbox;
pureSandbox.globalThis=pureSandbox;
vm.createContext(pureSandbox);
vm.runInContext(entry,pureSandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pureSandbox.GensDungeonV1?.movement?.isAuthoredTerminalExit,
  'undefined',
  'pre-extraction characterization must prove the pure terminal-exit helper is not connected yet'
);

assert.doesNotMatch(
  entry,
  /dc305PositionalGameplay|gensGameplayModules|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon public entry must remain pure before terminal-exit extraction'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored terminal exit characterization after real-exit GREEN',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.atTerminalExit',
  semantics:{
    heroRequired:true,
    realExitRequired:true,
    nonPositionalAllowsTerminal:true,
    positionalRequiresPositionMatch:true,
    numericPositionCoercion:true
  },
  pureTarget:'GensDungeonV1.movement.isAuthoredTerminalExit'
},null,2));
