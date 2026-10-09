const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.join(__dirname,'..');
const source=execFileSync('git',['show','HEAD:index.html'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8'));

const gitBlobSha=execFileSync('git',['rev-parse','HEAD:index.html'],{cwd:root,encoding:'utf8'}).trim();
const CURRENT_BLOB='1a61147d5a32889fa85e6a09e846049103b9f0bf';
const HISTORICAL_BLOB='18627cc0c5fc7945732c8a910504c59ef823b6ae';
assert.equal(gitBlobSha,CURRENT_BLOB,'inline-owner guard must match the exact reviewed Capture138 index');
// Phase 2 metadata is historical cartography, not a fingerprint of every
// later UI change. Undo only the reviewed 40-byte Capture138 timer guard.
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
