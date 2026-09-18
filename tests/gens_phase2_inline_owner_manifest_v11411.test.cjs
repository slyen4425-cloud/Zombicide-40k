const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const indexPath=path.join(root,'index.html');
const source=fs.readFileSync(indexPath,'utf8');
const bytes=fs.readFileSync(indexPath);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8'));

const gitBlobSha=crypto.createHash('sha1')
  .update(Buffer.concat([Buffer.from('blob '+bytes.length+'\\0'),bytes]))
  .digest('hex');
assert.equal(gitBlobSha,manifest.sourceIndexBlob,'inline-owner manifest must target the exact current index.html blob');

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

const inlineScriptRe=new RegExp(
  '<script\\\\b[^>]*\\\\bid=["\\\']([^"\\\']+)["\\\'][^>]*>([\\\\s\\\\S]*?)<\\\\/script>',
  'gi'
);
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
