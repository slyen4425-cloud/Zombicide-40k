const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const stripQuery=value=>String(value||'').replace(/\?.*$/,'');
const index=read('index.html');
const preview=read('preview.html');
const workflow=read('.github/workflows/main.yml');
const ownerManifest=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const timerManifest=JSON.parse(read('docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json'));

const bytes=fs.readFileSync(path.join(root,'index.html'));
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');
assert.equal(blob,timerManifest.sourceIndexBlob,'timer classification must target exact index blob');

const rawDirect=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1]).filter(src=>/^assets\/(?:gensrpg|dungeon)\//.test(src)).map(stripQuery);
const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(workflowBlock&&previewBlock);
const injected=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>stripQuery(m[1]));
const previewInjected=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>stripQuery(m[1]));
assert.deepEqual(previewInjected,injected.filter(x=>x!=='assets/gensrpg/core/storage-v1.js'));

const productionDirect=[
  ...rawDirect.filter(x=>![
    'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
    'assets/gensrpg/shell/module-launch-final-authority-v1.js'
  ].includes(x)),
  ...injected
];
const assetRefs=source=>[...source.matchAll(/assets\/(?:gensrpg|dungeon)\/[^"'`\s)]+\.js(?:\?[^"'`\s)]*)?/g)]
  .map(m=>stripQuery(m[0])).filter(exists);
const reachable=new Set(),queue=[...productionDirect];
while(queue.length){
  const rel=queue.shift();
  if(reachable.has(rel))continue;
  reachable.add(rel);
  for(const dep of assetRefs(read(rel)))if(!reachable.has(dep))queue.push(dep);
}
assert.equal(reachable.size,timerManifest.expected.externalReachableFiles);
for(const rel of reachable)assert.ok(ownerManifest.files?.[rel],rel+' missing runtime owner');

const disabled=new Set([
  'dungeonCore081TacticalMovementDisabled','dungeonCore084MovementRuntimeFixDisabled',
  'dungeonCore086MovementStabilityDisabled','dungeonCore087InteractionRulesDisabled',
  'dungeonCore087ChestGuardDisabled','dungeonCore089TacticalInteractionsDisabled',
  'dungeonCore090MovementV2Disabled','dungeonCore094EndTurnFinalDisabled',
  'dungeonCore095SoloTurnFinalDisabled','dungeonCore097StabilityRollbackDisabled'
]);
const inline=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],source:m[2]}));
const activeInline=inline.filter(x=>!disabled.has(x.id));
assert.equal(activeInline.length,timerManifest.expected.activeInlineBlocks);

const timerCounts=source=>({
  setTimeouts:(source.match(/\bsetTimeout\s*\(/g)||[]).length,
  setIntervals:(source.match(/\bsetInterval\s*\(/g)||[]).length
});

const external=[...reachable].map(file=>({file,...timerCounts(read(file))}))
  .filter(x=>x.setTimeouts||x.setIntervals);
const inlineTimers=activeInline.map(x=>({id:x.id,...timerCounts(x.source)}))
  .filter(x=>x.setTimeouts||x.setIntervals);

assert.equal(external.length,timerManifest.expected.externalTimerSources);
assert.equal(external.reduce((n,x)=>n+x.setTimeouts,0),timerManifest.expected.externalSetTimeoutSyntax);
assert.equal(external.reduce((n,x)=>n+x.setIntervals,0),timerManifest.expected.externalSetIntervalSyntax);
assert.equal(inlineTimers.length,timerManifest.expected.inlineTimerSources);
assert.equal(inlineTimers.reduce((n,x)=>n+x.setTimeouts,0),timerManifest.expected.inlineSetTimeoutSyntax);
assert.equal(inlineTimers.reduce((n,x)=>n+x.setIntervals,0),timerManifest.expected.inlineSetIntervalSyntax);

const extMap=new Map(external.map(x=>[x.file,x]));
const inMap=new Map(inlineTimers.map(x=>[x.id,x]));
for(const file of timerManifest.bootstrapRetryExternal)assert.ok(extMap.has(file),'bootstrap/retry source lost timer: '+file);
for(const id of timerManifest.bootstrapRetryInline)assert.ok(inMap.has(id),'inline bootstrap/reassert source lost timer: '+id);
for(const id of timerManifest.gameplayPacingInline)assert.ok(inMap.has(id),'gameplay pacing source lost timer: '+id);

const extIntervals=external.filter(x=>x.setIntervals).map(x=>x.file);
const inIntervals=inlineTimers.filter(x=>x.setIntervals).map(x=>x.id);
assert.deepEqual(extIntervals,['assets/dungeon/dungeon-core-317.js'],'external interval owner drifted');
assert.deepEqual(inIntervals,['dungeonCore029AiTurnFix'],'inline interval owner drifted');

const core317=read('assets/dungeon/dungeon-core-317.js');
assert.match(core317,/attempts\s*>=\s*12/,'merchant retry must remain bounded');
assert.match(core317,/setInterval\([\s\S]*?,\s*250\)/,'merchant retry cadence drifted');
assert.match(read('assets/gensrpg/core/runtime-bootstrap-v1.js'),/setTimeout\(apply,250\);setTimeout\(apply,1200\);setTimeout\(apply,3000\)/);
assert.match(read('assets/gensrpg/gens-survival-mode-isolation-1678104.js'),/setTimeout\(install,0\);R\.setTimeout\(install,300\);R\.setTimeout\(install,1300\)/);
assert.match(read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'),/installWithRetries[\s\S]*\[80,220,600,1200,2500,5000\]/);
assert.match(read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js'),/installWithRetries[\s\S]*\[80,220,600,1200,2500,5000,7500,10000\]/);
assert.match(read('assets/gensrpg/gens-hero-editor-dynamic-167897.js'),/tries\+\+<30[\s\S]*setTimeout\(retry,100\)/);
assert.match(read('assets/gensrpg/gens-stat-upgrade-policy-167898.js'),/tries\+\+<20[\s\S]*setTimeout\(retry,100\)/);

const ai029=activeInline.find(x=>x.id==='dungeonCore029AiTurnFix')?.source||'';
assert.match(ai029,/setInterval\(dc029KickAi,700\)/,'AI watchdog interval drifted');

console.log(JSON.stringify({
  scenario:'Phase 2 timer classification',
  externalTimerSources:external.length,
  inlineTimerSources:inlineTimers.length,
  syntaxTotals:{
    externalTimeouts:external.reduce((n,x)=>n+x.setTimeouts,0),
    externalIntervals:external.reduce((n,x)=>n+x.setIntervals,0),
    inlineTimeouts:inlineTimers.reduce((n,x)=>n+x.setTimeouts,0),
    inlineIntervals:inlineTimers.reduce((n,x)=>n+x.setIntervals,0)
  },
  bootstrapRetryExternal:timerManifest.bootstrapRetryExternal.length,
  bootstrapRetryInline:timerManifest.bootstrapRetryInline.length,
  gameplayPacingInline:timerManifest.gameplayPacingInline.length,
  persistentIntervals:{external:extIntervals,inline:inIntervals}
},null,2));