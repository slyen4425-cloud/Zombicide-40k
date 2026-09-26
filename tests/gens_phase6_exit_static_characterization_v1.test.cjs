const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const survivalDir=path.join(root,'assets','gensrpg','survival');
const entry=fs.readFileSync(path.join(survivalDir,'entry-v1.js'),'utf8');
const contract=JSON.parse(fs.readFileSync(path.join(survivalDir,'module-contract-v1.json'),'utf8'));
const tsv=fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv'),'utf8');

const jsFiles=fs.readdirSync(survivalDir).filter(name=>name.endsWith('.js')).sort();
assert.deepEqual(jsFiles,['entry-v1.js'],'Phase 6 exit audit must track the current Survival JS entry set');

assert.doesNotMatch(entry,/\bDungeon\w*\b|\bdungeon\w*\b/,'Survival entry must not consume private Dungeon runtime');
assert.doesNotMatch(entry,/\bTactical\w*\b|\btactical\w*\b/,'Survival entry must not consume private Tactical runtime');
assert.doesNotMatch(entry,/assets\/gensrpg\/(?:dungeon|tactical)\//,'Survival entry must not import private module files');
assert.match(entry,/root\.GensSurvivalV1=Object\.freeze\(/,'Survival entry must expose the public GensSurvivalV1 namespace');

for(const forbidden of ['Dungeon private runtime','Tactical private runtime','Capture private runtime','PvP private runtime']){
  assert.ok(contract.forbidden.includes(forbidden),'Survival contract must forbid '+forbidden);
}
assert.equal(contract.publicRuntimeApi,'GensSurvivalV1','Survival contract must name the public runtime API');

const owners=new Map();
for(const line of tsv.split(/\r?\n/)){
  if(!line||line.startsWith('#'))continue;
  const [name,count,lastOwner]=line.split('\t');
  if(name&&count&&lastOwner)owners.set(name,{count:Number(count),lastOwner});
}
const residual={
  openZombieRule:owners.get('openZombieRule'),
  enemyCardHtml:owners.get('enemyCardHtml'),
  renderActiveEnemies:owners.get('renderActiveEnemies'),
  activeEnemyDefinition:owners.get('activeEnemyDefinition')
};
assert.deepEqual(residual.openZombieRule,{count:3,lastOwner:'dungeonDirectImageBinding166'});
assert.deepEqual(residual.enemyCardHtml,{count:3,lastOwner:'dungeonDirectImageBinding166'});
assert.deepEqual(residual.renderActiveEnemies,{count:3,lastOwner:'dungeonDirectImageBinding166'});
assert.deepEqual(residual.activeEnemyDefinition,{count:2,lastOwner:'dungeonArtRenderFix165'});

console.log(JSON.stringify({
  scenario:'Phase 6 exit static characterization',
  survivalJs:jsFiles,
  publicApi:contract.publicRuntimeApi,
  forbidden:contract.forbidden,
  residualDungeonOwners:residual
},null,2));
