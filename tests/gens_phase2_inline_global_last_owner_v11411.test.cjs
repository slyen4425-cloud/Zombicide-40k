const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.join(__dirname,'..');
const source=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes(root).toString('utf8');
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

const CURRENT_INDEX_BLOB='2f2edfa5a1e229e4630889e7f0d5442199e221eb';
const HISTORICAL_TABLE_BLOB='18627cc0c5fc7945732c8a910504c59ef823b6ae';
assert.equal(blob,CURRENT_INDEX_BLOB,'current physical index must load external Capture seed; historical global table uses byte-exact restoration');
const guardLine='      if(!isCaptureContext138())return;\n';
assert.equal(source.split(guardLine).length-1,1,'single documented Capture138 timer guard');
const recovered=Buffer.from(source.replace(guardLine,''),'utf8');
const crypto=require('node:crypto');
const recoveredBlob=crypto.createHash('sha1').update(Buffer.from('blob '+recovered.length+'\0')).update(recovered).digest('hex');
assert.equal(recoveredBlob,HISTORICAL_TABLE_BLOB,'removing exactly the new line must recover the historical Phase 2 source');
const tableBlob=(table.match(/^# sourceIndexBlob=([a-f0-9]{40})$/m)||[])[1];
assert.equal(tableBlob,HISTORICAL_TABLE_BLOB,'historical inline-owner table fingerprint must not be rewritten');
assert.equal(distinctGlobals,428,'distinct explicit inline globals drifted');
assert.equal(assignments,739,'explicit inline global assignments drifted');
assert.equal(multiOwnerGlobals,114,'multi-owner inline globals drifted');

const expected=[
  '# GenSrpG Phase 2 — inline global last owners',
  '# sourceIndexBlob='+tableBlob,
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
  ['startConfiguredGame',2,'gensDungeonCore01Js'],
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
