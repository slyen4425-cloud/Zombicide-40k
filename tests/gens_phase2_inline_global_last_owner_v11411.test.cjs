const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.join(__dirname,'..');
const source=execFileSync('git',['show','HEAD:index.html'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const blob=execFileSync('git',['rev-parse','HEAD:index.html'],{cwd:root,encoding:'utf8'}).trim();
const table=fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv'),'utf8');

const disabled=new Set([
  'dungeonCore081TacticalMovementDisabled',
  'dungeonCore084MovementRuntimeFixDisabled',
  'dungeonCore086MovementStabilityDisabled',
  'dungeonCore087InteractionRulesDisabled',
  'dungeonCore087ChestGuardDisabled',
  'dungeonCore089TacticalInteractionsDisabled',
  'dungeonCore090MovementV2Disabled',
  'dungeonCore094EndTurnFinalDisabled',
  'dungeonCore095SoloTurnFinalDisabled',
  'dungeonCore097StabilityRollbackDisabled'
]);

const blockRe=/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;
const assignmentRe=/\bwindow\.([A-Za-z_$][\w$]*)\s*=/g;
const chains=new Map();

for(const match of source.matchAll(blockRe)){
  const id=match[1];
  if(disabled.has(id))continue;
  for(const hit of match[2].matchAll(assignmentRe)){
    const name=hit[1];
    if(!chains.has(name))chains.set(name,[]);
    chains.get(name).push(id);
  }
}

const distinctGlobals=chains.size;
const assignments=[...chains.values()].reduce((sum,chain)=>sum+chain.length,0);
const multiOwnerGlobals=[...chains.values()].filter(chain=>chain.length>1).length;

assert.equal(blob,'95f8c96e7e221eb743f7c8013ffa8af499eca1c8','Phase 2 inline global table must target the current committed index blob');
assert.equal(distinctGlobals,436,'distinct explicit inline globals drifted');
assert.equal(assignments,760,'explicit inline global assignments drifted');
assert.equal(multiOwnerGlobals,119,'multi-owner inline globals drifted');

const expected=[
  '# GenSrpG Phase 2 — inline global last owners',
  '# sourceIndexBlob='+blob,
  '# scope=explicit window.<name> assignments in 119 active inline blocks',
  '# distinctGlobals='+distinctGlobals+' assignments='+assignments+' multiOwnerGlobals='+multiOwnerGlobals,
  '# name\tassignmentCount\tlastOwner',
  ...[...chains.keys()].sort().map(name=>{
    const chain=chains.get(name);
    return name+'\t'+chain.length+'\t'+chain.at(-1);
  })
].join('\n')+'\n';

if(table!==expected){
  const actualLines=table.split('\n');
  const expectedLines=expected.split('\n');
  const max=Math.max(actualLines.length,expectedLines.length);
  let first=-1;
  for(let i=0;i<max;i++){if(actualLines[i]!==expectedLines[i]){first=i;break}}
  assert.fail('inline global last-owner table drifted at line '+(first+1)+
    '\nactual:   '+JSON.stringify(actualLines[first])+
    '\nexpected: '+JSON.stringify(expectedLines[first]));
}

for(const [name,count,lastOwner] of [
  ['renderDungeonCombatRound',30,'dungeonCore303TimelineRootFix'],
  ['captureRenderBattleLive',15,'coreCombatPoolFix156'],
  ['startConfiguredGame',5,'dungeonCore200Rebuild'],
  ['resumeGame',1,'dungeonCore310PersistenceAndTokens']
]){
  const chain=chains.get(name)||[];
  assert.equal(chain.length,count,name+' assignment count drifted');
  assert.equal(chain.at(-1),lastOwner,name+' last owner drifted');
}

console.log(JSON.stringify({
  scenario:'Phase 2 inline global last-owner table',
  sourceIndexBlob:blob,
  distinctGlobals,
  assignments,
  multiOwnerGlobals
},null,2));
