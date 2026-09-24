const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','assets/dungeon/dungeon-core-318.js'),'utf8');
const classes=new Set(['dc054AtEntrance']);
const classList={
  add:name=>classes.add(name),
  remove:name=>classes.delete(name),
  toggle:(name,on)=>{if(on)classes.add(name);else classes.delete(name);return !!on},
  contains:name=>classes.has(name)
};
const storage={
  gensrpg_dungeon_runtime_v2:JSON.stringify({room:1,participants:['hero'],index:0})
};
const sandbox={
  console,
  document:{body:{classList},querySelector:()=>null},
  localStorage:{
    getItem:key=>Object.prototype.hasOwnProperty.call(storage,key)?storage[key]:null,
    setItem:(key,value)=>{storage[key]=String(value)}
  },
  isDungeonMode:()=>true,
  DungeonCore01:{
    // Reproduces the obsolete Core 0.54 writer: it marks the body as entrance
    // even while the canonical runtime is already in a generated room.
    render(){classes.add('dc054AtEntrance');return 'rendered'},
    show(){classes.add('dc054AtEntrance');return 'shown'}
  },
  setTimeout:()=>1
};
sandbox.window=sandbox;

vm.runInNewContext(source,sandbox,{filename:'dungeon-core-318.js'});

assert.equal(classes.has('dc054AtEntrance'),false,'install must normalize stale entrance state from runtime room 1');
assert.equal(sandbox.DungeonCore01.render.__dc318EntranceAuthority,true,'render must expose the final entrance authority marker');
assert.equal(sandbox.DungeonCore01.show.__dc318EntranceAuthority,true,'show must expose the final entrance authority marker');

assert.equal(sandbox.DungeonCore01.render(),'rendered');
assert.equal(classes.has('dc054AtEntrance'),false,'legacy render cannot re-hide a generated Dungeon room');

storage.gensrpg_dungeon_runtime_v2=JSON.stringify({room:0,participants:['hero'],index:0});
classes.delete('dc054AtEntrance');
assert.equal(sandbox.DungeonCore01.show(),'shown');
assert.equal(classes.has('dc054AtEntrance'),true,'Dungeon entrance room 0 must retain the entrance-only presentation');

console.log('gens_dungeon_entrance_visibility_runtime_v1: GREEN');
