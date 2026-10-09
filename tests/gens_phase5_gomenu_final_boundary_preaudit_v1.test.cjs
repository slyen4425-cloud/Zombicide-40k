'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const source=indexBuf.toString('utf8');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const shellContract=JSON.parse(read('assets/gensrpg/shell/module-contract-v1.json'));
const captureContract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const dungeonEntry=read('assets/gensrpg/dungeon/entry-v1.js');

function gitBlob(buf){
  return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}
function row(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}
const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));
function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  return blocks.filter(b=>re.test(b.body)).map(b=>b.id);
}

assert.equal(indexBuf.length,8165398,'goMenu boundary guard must use the current Phase 7 Dungeon generated Boss policy runtime');
assert.equal(gitBlob(indexBuf),'18627cc0c5fc7945732c8a910504c59ef823b6ae','goMenu boundary Phase 7 generated Boss policy runtime blob drifted');
assert.equal(owners.sourceIndexBlob,'18627cc0c5fc7945732c8a910504c59ef823b6ae','owner manifest must target current Phase 7 generated Boss policy runtime');

assert.equal(/^goMenu\t/m.test(lastOwners),false,'Phase 2 inline table must no longer contain an explicit goMenu owner');
assert.deepEqual(chainFor('goMenu'),[],
  'Dungeon S2 must remove the final inline goMenu override');

assert.equal(owners.blocks.captureFix139.primaryDomain,'capture');
assert.equal(owners.blocks.dungeonCore200Rebuild.primaryDomain,'dungeon');

const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
const dungeon=blocks.find(b=>b.id==='dungeonCore200Rebuild')?.body||'';
assert.doesNotMatch(capture,/window\.goMenu\s*=/,
  'Capture S1 must no longer assign the global goMenu boundary');
assert.match(capture,/GensCaptureScreenReturnV1\.install/,
  'Capture139 must only wire the owner');
assert.match(read('assets/gensrpg/capture/screen-return-v1.js'),/shell\.register\("capture",returnToPrimaryView\)/,
  'Capture screen-return owner must register exactly one public Shell provider');
const hubOwner=read('assets/gensrpg/capture/hub-entry-v1.js');
assert.equal((capture.match(/enterWorld:\(\)=>window\.GensCaptureHubEntryV1\.enterWorld\(\)/g)||[]).length,2,
  'Capture SessionStart and ScreenReturn must delegate to the same owner-local Hub entry');
assert.match(capture,/renderCaptureWorldHub:\(\)=>renderCaptureWorldHub\(\)/,
  'Capture world renderer stays historical and separate from the visual transition');
assert.doesNotMatch(capture,/window\.captureEnterWorld139\s*=/,
  'legacy global Hub UI transition must remain retired');
assert.match(hubOwner,/root\.GensCaptureHubEntryV1=Object\.freeze/,
  'Capture must own its Hub UI transition through a dedicated module');
assert.doesNotMatch(hubOwner,/GensShellScreenReturnV1|DungeonCore|window\.goMenu\s*=/,
  'new Hub owner must not steal global Shell or Dungeon responsibilities');
assert.doesNotMatch(dungeon,/window\.goMenu\s*=/,
  'Dungeon S2 must no longer assign the global goMenu boundary');
assert.doesNotMatch(dungeon,/const goOutside200=window\.goMenu/,
  'Dungeon S2 must no longer capture the previous goMenu boundary');
assert.match(dungeon,/GensShellScreenReturnV1/,
  'Dungeon S2 must register through the Shell public contract');
assert.match(dungeon,/register\?\.\("dungeon"/,
  'Dungeon S2 must register under the dungeon provider id');
assert.match(dungeon,/if\(!active200\|\|!isDungeonMode\?\.\(\)\)return false;/,
  'Dungeon S2 must preserve the historical active Dungeon guard');
assert.match(dungeon,/return show\(\)===true/,
  'Dungeon S2 must keep show() as the owner-local transition');

assert.ok(shellContract.owns.includes('global screen transitions'),
  'Shell contract must own global screen transitions');
assert.ok(shellContract.consumes.includes('module public entry contracts'),
  'Shell contract must consume module public entry contracts');
assert.equal(shellContract.status,'contract-only-not-loaded');
assert.equal(captureContract.status,'partial-runtime-loaded');
assert.equal(captureContract.activatedPhase,9);
assert.equal(captureContract.publicRuntimeApi,'GensCaptureV1');
assert.equal(dungeonContract.status,'partial-runtime-loaded');
assert.equal(dungeonContract.activatedPhase,7);
assert.equal(dungeonContract.publicRuntimeApi,'GensDungeonV1');

assert.doesNotMatch(shellEntry,/window\.[A-Za-z_$][\w$]*\s*=/,
  'Shell Phase 3 entry must remain inert during this preaudit');
assert.doesNotMatch(shellEntry,/addEventListener|MutationObserver|setTimeout|setInterval/,
  'Shell Phase 3 entry must not gain compatibility side effects');
assert.match(captureEntry,/GensCaptureV1/);
assert.doesNotMatch(captureEntry,/returnToPrimaryView|GensShellScreenReturnV1|document\.|localStorage|sessionStorage|addEventListener|MutationObserver|setTimeout|setInterval/,
  'Capture module-launch activation must not take screen-return or side-effect authority');
assert.match(dungeonEntry,/function planGeneratedAdvance\(/,
  'Dungeon Phase 7 entry must retain the pure generated-advance planner');
assert.match(dungeonEntry,/function pickWeightedGeneratedRoomKind\(/,
  'Dungeon Phase 7 entry must expose the second pure generated room-kind selector');
assert.match(dungeonEntry,/root\.GensDungeonV1=Object\.freeze\(/,
  'Dungeon Phase 7 entry must publish only its public GensDungeonV1 namespace');
assert.doesNotMatch(
  dungeonEntry,
  /goMenu|GensShellScreenReturnV1|startConfiguredGame|document\.|localStorage|sessionStorage|addEventListener|MutationObserver|setTimeout|setInterval/,
  'Dungeon Phase 7 entry must not acquire Shell transition, launch, DOM, storage, listener or timer authority'
);

assert.equal(captureContract.publicEntries?.moduleScreenReturn?.operation,'returnToPrimaryView');
assert.equal(dungeonContract.publicEntries?.moduleScreenReturn?.operation,'returnToPrimaryView');

console.log(JSON.stringify({
  scenario:'Phase 5 final goMenu boundary preaudit',
  runtime:{size:indexBuf.length,blob:gitBlob(indexBuf)},
  chain:[],
  owners:{
    capture:owners.blocks.captureFix139.responsibility,
    dungeon:owners.blocks.dungeonCore200Rebuild.responsibility
  },
  shellTarget:{
    ownsGlobalScreenTransitions:true,
    consumesModulePublicEntryContracts:true
  },
  decision:{
    captureMigratedToPublicContract:true,
    dungeonMigratedToPublicContract:true,
    shellNativeGoMenuSoleAuthority:true,
    reason:'Capture and Dungeon own their module transitions while Shell owns the single global return boundary',
    nextBoundary:'preserve the consolidated boundary while continuing Phase 5'
  },
  runtimeChanged:true
},null,2));
