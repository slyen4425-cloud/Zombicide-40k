'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/gensrpg/gens-hero-editor-dynamic-167897.js'),'utf8');

const scheduled=[];
const sandbox={
  console,
  setTimeout(fn,ms,...args){
    scheduled.push({fn,ms,args});
    return scheduled.length;
  },
  clearTimeout(){},
  GensCleanRpgStats167874:{
    runtimeDefs(){return []},
    def(){return null},
    value(){return 0}
  },
  CHARS:{},
  openEquipmentEditor(){return 'native-open'},
  saveEquipmentEditor(){return 'native-save'}
};
sandbox.globalThis=sandbox;

vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'gens-hero-editor-dynamic-167897.js'});

const api=sandbox.GensHeroEditorDynamic167897;
assert.ok(api&&typeof api.install==='function','Hero Editor API/install must be available');
assert.equal(api.install(),true,'initial Hero Editor install must succeed');

function wrapOutside(name,flag){
  const old=sandbox[name];
  const w=function(){return old.apply(this,arguments)};
  w[flag]=true;
  w.__original=old;
  sandbox[name]=w;
}
function countFlag(name,flag){
  let fn=sandbox[name],count=0,guard=0;
  const seen=new Set();
  while(typeof fn==='function'&&!seen.has(fn)&&guard++<32){
    seen.add(fn);
    if(fn[flag])count++;
    fn=fn.__original;
  }
  return count;
}

assert.equal(countFlag('openEquipmentEditor','__canon101'),1,'initial open must have one Hero Editor owner');
assert.equal(countFlag('saveEquipmentEditor','__canon101'),1,'initial save must have one Hero Editor owner');

wrapOutside('openEquipmentEditor','__canonEq102');
wrapOutside('saveEquipmentEditor','__eqCache1021');

// This function did not exist during the initial install. The retry must still
// connect it when it appears later.
sandbox.openDungeonTalentNodeEditor=function(){return 'late-native'};

const retry50=scheduled.find(x=>x.ms===50);
assert.ok(retry50,'Hero Editor 50 ms retry must remain scheduled');
retry50.fn(...retry50.args);

assert.equal(
  countFlag('openEquipmentEditor','__canon101'),
  1,
  'retry must not add a second Hero Editor owner when __canon101 already exists inside __original'
);
assert.equal(
  countFlag('saveEquipmentEditor','__canon101'),
  1,
  'retry must not add a second Hero Editor save owner when __canon101 already exists inside __original'
);
assert.equal(
  !!sandbox.openDungeonTalentNodeEditor.__canon101,
  true,
  'retry must still wrap a genuinely late-defined function that has no Hero Editor owner in its chain'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment wrapper retry owner fix',
  openHeroOwners:countFlag('openEquipmentEditor','__canon101'),
  saveHeroOwners:countFlag('saveEquipmentEditor','__canon101'),
  lateDefinedStillConnected:!!sandbox.openDungeonTalentNodeEditor.__canon101,
  retryPreserved:true
},null,2));
