'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('assets/gensrpg/shell/legacy-hub-family-ui-v1.js','utf8');
const context={
  GAME_PROFILE_DUNGEON_ID:'game_profile_dungeon_demo',
  console,
  z40kEscAttr:s=>String(s),
  z40kEscHtml:s=>String(s),
  ensureRpgProfileData:p=>p,
  gensContentFamilyForProfile:p=>p.contentFamily||'rpg',
  createNewRpgUniverse:()=>{},
};
let reads=0,writes=0, profiles=[];
context.rpgProfiles=()=>{reads++;return profiles};
context.loadGameProfiles=()=>{reads++;return profiles};
context.saveGameProfiles=()=>{writes++};
const sandbox=vm.createContext(context);
vm.runInContext(src,sandbox);
const ids=html=>[...html.matchAll(/data-rpg-profile="([^"]+)"/g)].map(x=>x[1]);
const render=family=>vm.runInContext('renderGensRpgUniverseCards('+JSON.stringify(family)+')',sandbox);
const dungeon={id:'game_profile_dungeon_demo',name:'Dungeon',builtIn:true,contentFamily:'rpg',rpgUniverse:{icon:'🧭'},heroPool:[1,2,3],objectPool:[1],enemyConfig:{}};
const other={id:'custom_01',name:'Dungeon',contentFamily:'rpg',rpgUniverse:{icon:'🧭'},heroPool:[],objectPool:[],enemyConfig:{}};
const capture={id:'creature1',name:'Capture',contentFamily:'creature',rpgUniverse:{icon:'🐲'},heroPool:[],objectPool:[],enemyConfig:{}};
profiles=[dungeon,...Array.from({length:4},()=>structuredClone(dungeon)),other,capture];
const before=JSON.stringify(profiles);
const adventure=render('adventure');
assert.deepEqual(ids(adventure),['game_profile_dungeon_demo','custom_01'],
  'five copies of built-in Dungeon become one card; distinct same-name user profile stays visible');
assert.equal((adventure.match(/onclick="selectRpgUniverseProfile\('game_profile_dungeon_demo'\);openRpgUniverseEditor\(\)"/g)||[]).length,1,
  'Dungeon edit action remains available');
assert.match(adventure,/openGensBuiltInGame\('game_profile_dungeon_demo','adventure'\)/,
  'Dungeon launch action remains available');
assert.equal((adventure.match(/class="creatorDelete"/g)||[]).length,1,
  'only user-created profile may show deletion action');
const cap=render('capture');
assert.deepEqual(ids(cap),['creature1'],'Capture remains isolated');
assert.equal(JSON.stringify(profiles),before,'renderer must not change objects or saved duplicates');
assert.equal(writes,0,'renderer must not write storage');
assert.equal(reads,2,'no additional profile reads or recursive fetches');
profiles=[{...dungeon,id:'blank_1',name:'Dungeon 1'},{...dungeon,id:'blank_2',name:'Dungeon 2'}];
assert.deepEqual(ids(render('adventure')),['blank_1','blank_2'],'distinct ids never removed');
console.log('GREEN: Shell renders only one card per real profile ID, preserves distinct same-name worlds, Capture and storage.');
