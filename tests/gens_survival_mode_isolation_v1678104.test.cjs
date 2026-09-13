const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-survival-mode-isolation-1678104.js'),'utf8');

const data=new Map([
  ['gensrpg_session_family_guard_v1','survival'],
  ['gensrpg_dungeon_runtime_v2',JSON.stringify({participants:['dungeon_aldren'],room:4})]
]);
const localStorage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
let survivalResume=0,dungeonResume=0,dungeonShow=0,dungeonSetup=0;
const sandbox={
  console,localStorage,
  currentGameStyle:()=> 'survival',
  isDungeonMode:()=>true,
  resumeGame(){if(localStorage.getItem('gensrpg_dungeon_runtime_v2'))dungeonResume++;else survivalResume++},
  DungeonCore01:{show(){dungeonShow++;return 'shown'}},
  openDungeonCombatSetup(){dungeonSetup++;return 'legacy'},
  openGensFamily(){return true},
  openGensBuiltInGame(){return true},
  setGameStyle(){return true},
  applyGameProfile(){return true},
  document:{getElementById(){return null},body:{classList:{remove(){}}}},
  setTimeout(fn){fn();return 1}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(src,sandbox);

assert.equal(sandbox.isDungeonMode(),false,'explicit Survival family must override stale Dungeon mode');
sandbox.resumeGame();
assert.equal(survivalResume,1,'Survival resume must reach the Survival path');
assert.equal(dungeonResume,0,'stale Dungeon runtime must be hidden while Survival resumes');
assert.ok(localStorage.getItem('gensrpg_dungeon_runtime_v2'),'Dungeon save must be preserved, not deleted');
assert.equal(sandbox.DungeonCore01.show(),false,'Dungeon screen must not be allowed to leak into Survival');
assert.equal(dungeonShow,0);
assert.equal(sandbox.openDungeonCombatSetup(),false,'legacy Dungeon combat entry must be blocked in Survival');
assert.equal(dungeonSetup,0);

sandbox.openGensFamily('adventure');
assert.equal(localStorage.getItem('gensrpg_session_family_guard_v1'),'adventure');
assert.equal(sandbox.isDungeonMode(),true,'Adventure selection must restore Dungeon mode');
assert.equal(sandbox.DungeonCore01.show(),'shown');
assert.equal(dungeonShow,1);

sandbox.openGensFamily('survival');
assert.equal(localStorage.getItem('gensrpg_session_family_guard_v1'),'survival');
console.log('V16.78.104 Survival/RPG hard isolation OK');
