'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/gensrpg/gens-hero-editor-dynamic-167897.js'),'utf8');

const timers=[];
const sandbox={
  console,
  GensCleanRpgStats167874:{
    runtimeDefs(){return []},
    def(){return null},
    value(){return 0}
  },
  CHARS:{},
  openEquipmentEditor:function(){return 'native-open'},
  saveEquipmentEditor:function(){return 'native-save'},
  loadCustomEquipment(){return []},
  saveCustomEquipment(){return true},
  setTimeout(fn,ms,...args){
    timers.push({fn,ms,args});
    return timers.length;
  },
  clearTimeout(){},
};
sandbox.globalThis=sandbox;

vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'gens-hero-editor-dynamic-167897.js'});
assert.ok(sandbox.GensHeroEditorDynamic167897,'Hero Editor Dynamic API must load');

sandbox.GensHeroEditorDynamic167897.install();

function chain(name){
  const out=[];
  const seen=new Set();
  let fn=sandbox[name];
  while(typeof fn==='function'&&!seen.has(fn)){
    seen.add(fn);
    out.push({
      canon101:!!fn.__canon101,
      canonEq102:!!fn.__canonEq102,
      eqCache1021:!!fn.__eqCache1021
    });
    fn=fn.__original;
  }
  return out;
}

assert.equal(chain('openEquipmentEditor').filter(x=>x.canon101).length,1,'initial open must have one Hero Editor layer');
assert.equal(chain('saveEquipmentEditor').filter(x=>x.canon101).length,1,'initial save must have one Hero Editor layer');

{
  const old=sandbox.openEquipmentEditor;
  const w=function(){return old.apply(this,arguments)};
  w.__canonEq102=true;
  w.__original=old;
  sandbox.openEquipmentEditor=w;
}
{
  const old=sandbox.saveEquipmentEditor;
  const w=function(){return old.apply(this,arguments)};
  w.__eqCache1021=true;
  w.__original=old;
  sandbox.saveEquipmentEditor=w;
}

const retry50=timers.find(x=>x.ms===50);
assert.ok(retry50,'Hero Editor historical 50 ms retry must remain');
retry50.fn(...retry50.args);

assert.equal(
  chain('openEquipmentEditor').filter(x=>x.canon101).length,
  1,
  'retry must not add a second Hero Editor open wrapper when __canon101 already exists in __original chain'
);
assert.equal(
  chain('saveEquipmentEditor').filter(x=>x.canon101).length,
  1,
  'retry must not add a second Hero Editor save wrapper when __canon101 already exists in __original chain'
);

assert.ok(
  timers.some(x=>x.ms===100),
  'retry scheduling must remain active for genuinely late globals'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Hero Editor wrapper retry dedup owner contract',
  openHeroLayers:chain('openEquipmentEditor').filter(x=>x.canon101).length,
  saveHeroLayers:chain('saveEquipmentEditor').filter(x=>x.canon101).length,
  historicalRetryPreserved:true
},null,2));
