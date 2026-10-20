const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.join(__dirname,'..');
const source=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes(root).toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8'));

const gitBlobSha=execFileSync('git',['hash-object','index.html'],{cwd:root,encoding:'utf8'}).trim();
const HISTORICAL_CAPTURE_HUB_BLOB='613b4a21d83e9adcdd091be82240a3a6f9cf5bf7';
const CURRENT_BLOB='dab5be5dedfa56c49d76d40a4cb824a0098903f0';
const hubPatch=require('./fixtures/gens_phase9_capture_root_hub_exact_edits_v1.json');
assert.equal(hubPatch.fromBlob,'b64eae3650081af624155c8a4b8e47e4a1791658');
assert.equal(hubPatch.toBlob,HISTORICAL_CAPTURE_HUB_BLOB);
const HISTORICAL_BLOB='18627cc0c5fc7945732c8a910504c59ef823b6ae';
assert.equal(gitBlobSha,CURRENT_BLOB,'physical index must load the extracted world module and seed; legacy snapshot remains independently byte-verified');
const activeIndex=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(activeIndex,/class="gensRootModeCard capture"/,'new Shell root exposes independent Capture family');
assert.equal(activeIndex.split('<script src="assets/gensrpg/capture/world-exploration-v1.js?v=1"></script>').length-1,1,'physical world owner must load exactly once');
assert.equal(activeIndex.split('<script src="assets/gensrpg/capture/combat-core-v1.js?v=1"></script>').length-1,1,'physical Combat Core owner must load exactly once');
// Phase 2 metadata is historical cartography. First reconstruct the exact
// old Capture seed inline from its external source, then undo ONLY the 40-byte
// Capture138 timer guard; the historical code and manifest remain protected.
const guardLine='      if(!isCaptureContext138())return;\n';
assert.equal(source.split(guardLine).length-1,1,'Capture138 guard must appear exactly once');
const historical=Buffer.from(source.replace(guardLine,''),'utf8');
const crypto=require('node:crypto');
const historyBlob=crypto.createHash('sha1').update(Buffer.from('blob '+historical.length+'\0')).update(historical).digest('hex');
assert.equal(historyBlob,HISTORICAL_BLOB,'rollback must recover the exact historical index bytes');
assert.equal(manifest.sourceIndexBlob,historyBlob,'Phase 2 owner manifest must retain its historical source');

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

const inlineScriptRe=/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;
const blocks=[...source.matchAll(inlineScriptRe)]
  .map((m,i)=>({id:m[1],source:m[2],order:i+1}));

assert.equal(blocks.length,manifest.expected.total,'inline block total drifted');
assert.equal(blocks.filter(x=>!disabled.has(x.id)).length,manifest.expected.active,'active inline block count drifted');
assert.equal(blocks.filter(x=>disabled.has(x.id)).length,manifest.expected.disabled,'disabled inline block count drifted');

const mapped=manifest.blocks||{};
assert.equal(Object.keys(mapped).length,blocks.length,'every inline block must have one owner record');
assert.deepEqual(Object.keys(mapped),blocks.map(x=>x.id),'manifest order must match production inline order');

const allowed=new Set(manifest.allowedPrimaryDomains||[]);
for(const block of blocks){
  const rec=mapped[block.id];
  assert.ok(rec,'missing owner record for '+block.id);
  assert.equal(rec.order,block.order,block.id+' order drifted');
  assert.equal(rec.status,disabled.has(block.id)?'disabled':'active',block.id+' status drifted');
  assert.ok(allowed.has(rec.primaryDomain),block.id+' unknown primary domain '+String(rec.primaryDomain));
  assert.ok(typeof rec.responsibility==='string'&&rec.responsibility.trim(),block.id+' must have a dominant responsibility');
  assert.ok(Array.isArray(rec.crossDomains),block.id+' crossDomains must be explicit');
}

const domainCounts={},statusCounts={};
let crossDomainBlocks=0;
for(const rec of Object.values(mapped)){
  domainCounts[rec.primaryDomain]=(domainCounts[rec.primaryDomain]||0)+1;
  statusCounts[rec.status]=(statusCounts[rec.status]||0)+1;
  if(rec.crossDomains.length)crossDomainBlocks++;
}

console.log(JSON.stringify({
  scenario:'Phase 2 inline owner manifest',
  sourceIndexBlob:gitBlobSha,
  total:blocks.length,
  statusCounts,
  domainCounts,
  crossDomainBlocks
},null,2));
