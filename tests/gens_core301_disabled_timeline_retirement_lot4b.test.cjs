const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.doesNotMatch(
  html,
  /<script\s+id=["']dungeonCore301Timeline["'][^>]*>/,
  'Lot 4B: the disabled Core 3.01 timeline script must be retired instead of modernized'
);

assert.match(
  html,
  /<style\s+id=["']dungeonCore301TimelineCss["']>/,
  'Lot 4B is script-only: neighboring historical CSS stays out of scope'
);

const activeStart=html.indexOf('<script id="dungeonCore303TimelineRootFix">');
assert.ok(activeStart>=0,'Active Core 3.03 timeline owner must remain present');
const activeEnd=html.indexOf('</script>',activeStart);
assert.ok(activeEnd>activeStart,'Active Core 3.03 timeline script must remain complete');
const active=html.slice(activeStart,activeEnd);
assert.match(active,/const oldStart301=window\.dc200StartCombat;/,'Lot 4B must not alter the active Core 3.03 start wrapper');
assert.match(active,/window\.dc200StartCombat=function\(\)/,'Lot 4B must not alter the active Core 3.03 start wrapper body');

const count=(name)=>(html.match(new RegExp('\\b'+name+'\\b','g'))||[]).length;
assert.equal(count('dc200StartCombat'),9,'Lot 4B must remove exactly the two references owned by disabled Core 3.01');
assert.equal(count('openDungeonCombatSetup'),1,'Lot 4B must not change old setup rollback inventory');
assert.equal(count('launchCombat200'),2,'Lot 4B must not change internal launch inventory');
assert.equal(count('startCombat'),6,'Lot 4B must not change Core 2.x direct start inventory');

console.log(JSON.stringify({lot:'4B',retired:'dungeonCore301Timeline',dc200StartCombat:count('dc200StartCombat'),activeOwner:'dungeonCore303TimelineRootFix'}));
