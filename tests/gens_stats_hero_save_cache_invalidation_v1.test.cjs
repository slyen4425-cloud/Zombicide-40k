'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-mobile-combat-performance-16781022.js'),'utf8');

let definitionValue=10;
let canonicalCalls=0;
let saves=0;

const sandbox={
  console,
  Math,
  Date,
  JSON,
  Set,
  Map,
  WeakMap,
  performance:{now:()=>0},
  setTimeout:()=>0,
  clearTimeout:()=>{},
  current:'hero_editor_cache_probe',
  state:{rpgAttributes:{force:10}},
  navigator:{vibrate(){}},
  document:null,
  GensCleanRpgStats167874:{
    value(hero,id){
      canonicalCalls++;
      return hero==='hero_editor_cache_probe'&&id==='force'?definitionValue:0;
    }
  },
  saveCustomHero(){
    saves++;
    definitionValue=23;
    return true;
  },
  dungeonEquipmentBonus:()=>0,
  dungeonAttributeValue:()=>10,
  dungeonEnemyRpgStats:()=>({}),
  currentGameStyle:()=> 'dungeon'
};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;

vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'gens-mobile-combat-performance-16781022.js'});

assert.equal(
  sandbox.GensCleanRpgStats167874.value('hero_editor_cache_probe','force'),
  10,
  'fixture must read the initial canonical hero value'
);
assert.equal(canonicalCalls,1,'first canonical read must hit the underlying Stats owner');

assert.equal(
  sandbox.GensCleanRpgStats167874.value('hero_editor_cache_probe','force'),
  10
);
assert.equal(canonicalCalls,1,'second identical read must come from the performance cache');

assert.equal(sandbox.saveCustomHero(),true,'real hero-save seam must remain callable');
assert.equal(saves,1);
assert.equal(definitionValue,23,'hero save fixture must change the underlying hero definition');

assert.equal(
  sandbox.GensCleanRpgStats167874.value('hero_editor_cache_probe','force'),
  23,
  'saving a hero definition must invalidate the canonical Stats cache'
);
assert.equal(
  canonicalCalls,
  2,
  'post-save canonical read must reach the Stats owner again instead of returning stale cache'
);

console.log(JSON.stringify({
  scenario:'hero editor save invalidates canonical Stats cache',
  initial:10,
  saved:23,
  canonicalCalls
},null,2));
