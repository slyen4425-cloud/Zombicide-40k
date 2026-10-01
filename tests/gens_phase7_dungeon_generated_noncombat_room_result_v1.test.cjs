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

assert.equal(bytes.length,8169555,
  'non-combat room result RED must start from the exact materialization-characterization runtime size');
assert.equal(gitBlob,'02a052bc231728eb383e17c83e61a958be0ac58c',
  'non-combat room result RED must start from the exact materialization-characterization runtime blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.buildGeneratedNonCombatRoomResult,
  'function',
  'Phase 7 lot 31 requires Dungeon-owned pure non-combat generated room result builder'
);

const build=sandbox.GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult;
const plain=v=>JSON.parse(JSON.stringify(v));

assert.deepEqual(plain(build('trap',{name:'Rune',id:'rune'})),{
  title:'🪤 Rune',
  text:'Un piège est présent dans la salle.',
  enemyQty:0,
  trapId:'rune'
},'trap descriptor must preserve exact historical shape');

assert.deepEqual(plain(build('chest',null)),{
  title:'🎁 Coffre',
  text:'Un coffre est présent dans la salle.',
  enemyQty:0
},'chest descriptor must preserve exact historical shape');

assert.deepEqual(plain(build('merchant',null)),{
  title:'🧙‍♂️ Marchand',
  text:'Un marchand attend le groupe.',
  enemyQty:0
},'merchant descriptor must preserve exact historical shape');

assert.deepEqual(plain(build('rest',null)),{
  title:'⛩️ Sanctuaire',
  text:'Un lieu de repos.',
  enemyQty:0
},'rest descriptor must preserve exact historical shape');

assert.deepEqual(plain(build('mystery',null)),{
  title:'✨ Salle calme',
  text:'La salle semble calme.',
  enemyQty:0
},'default descriptor must preserve exact historical shape');

assert.notEqual(build('chest',null),build('chest',null),
  'non-combat result builder must return a fresh plain object');

const fnMatch=entry.match(/function buildGeneratedNonCombatRoomResult\(kind,trapType\)\{[\s\S]*?\n  \}/);
assert.ok(fnMatch,'pure non-combat room result builder source must remain extractable');
assert.doesNotMatch(fnMatch[0],
  /Math\.random|\bcfg\(|document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|loadActiveEnemies|saveActiveEnemies|generateDungeonMap|dungeonEncounter|dungeonBossRoom/,
  'non-combat room result builder must stay pure and infrastructure-free');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
const core200=block('dungeonCore200Rebuild');
const createMatch=core200.match(/function createRoom\(room,kind\)\{[\s\S]*?\}\nfunction placeSceneForRoom\(/);
assert.ok(createMatch,'Core 2.00 createRoom source must remain extractable');
const createSource=createMatch[0].replace(/\nfunction placeSceneForRoom\([\s\S]*$/,'');

assert.match(createSource,
  /if\(kind==='enemy'\|\|kind==='ambush'\)result=dungeonEncounter\(room\);else if\(kind==='boss'\)result=dungeonBossRoom\(room\)/,
  'enemy/ambush and Boss active paths must remain Core 2.00 responsibilities');

assert.equal((createSource.match(/GensDungeonV1\.exploration\.buildGeneratedNonCombatRoomResult\(/g)||[]).length,1,
  'Core 2.00 createRoom must delegate non-combat result construction exactly once');

assert.match(createSource,
  /else\{const t=kind==='trap'\?\(dungeonPickTrapType\?\.\(cfg\(\)\)\|\|\{name:'Piège',id:'trap'\}\):null;result=GensDungeonV1\.exploration\.buildGeneratedNonCombatRoomResult\(kind,t\)\}/,
  'trap choice and fallback must remain at Core 2.00 while descriptor construction delegates to Dungeon entry');

assert.doesNotMatch(createSource,
  /title:'🎁 Coffre'|title:'🧙‍♂️ Marchand'|title:'⛩️ Sanctuaire'|title:'✨ Salle calme'|title:'🪤 '/,
  'Core 2.00 must retire duplicated non-combat result descriptor construction');

assert.match(createSource,/loadActiveEnemies\?\.\(\)\|\|\[\]/,
  'active-enemy normalization must remain Core 2.00');
assert.match(createSource,/saveActiveEnemies\?\.\(all\)/,
  'enemy persistence must remain Core 2.00');
assert.match(createSource,/cfg\(\)\.map===false\?null:generateDungeonMap\(kind,result\.enemyQty\|\|0\)/,
  'map enablement and generation must remain Core 2.00');

assert.doesNotMatch(authored,/buildGeneratedNonCombatRoomResult/,
  'authored World Builder must remain outside generated non-combat result construction');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated non-combat room result owner',
  expected:'RED before pure builder + Core 2.00 raccord; GREEN after isolated micro-diff',
  pureOwner:'GensDungeonV1.exploration.buildGeneratedNonCombatRoomResult',
  activeOwners:['dungeonEncounter','dungeonBossRoom'],
  retainedCoreResponsibilities:[
    'trap selection',
    'dc200Branch normalization',
    'enemy persistence',
    'map enablement',
    'generateDungeonMap'
  ]
},null,2));
