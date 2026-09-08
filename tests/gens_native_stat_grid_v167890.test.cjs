const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');

const root=path.join(__dirname,'..');
const patcher=path.join(root,'tools','patch_generic_stat_grid_v167890.py');
const source=path.join(root,'index.html');
assert.ok(fs.existsSync(patcher),'V16.78.90 patcher must exist');
assert.ok(fs.existsSync(source),'root index.html must exist');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gens-v167890-'));
const target=path.join(tmp,'index.html');
fs.copyFileSync(source,target);
cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
const html=fs.readFileSync(target,'utf8');

assert.match(html,/function renderDungeonAttributes__native167890\(\)\{/,'native attribute renderer must be preserved under an internal name');
assert.match(html,/function renderDungeonHeroStats__native167890\(\)\{/,'native derived-stat renderer must be preserved under an internal name');
assert.match(html,/function renderDungeonAttributes\(\)\{[\s\S]*renderDungeonAttributes__native167890\.apply/,'public attribute renderer must keep the native render first');
assert.match(html,/function renderDungeonHeroStats\(\)\{[\s\S]*renderDungeonHeroStats__native167890\.apply/,'public derived renderer must keep the native render first');
assert.match(html,/dataset\.gensUnifiedStatGrid="167890"/,'native grid must carry the V16.78.90 marker');
assert.match(html,/GensGenericStats167887/,'native renderer must reuse the existing generic stat engine');
assert.match(html,/renderCustomStatsInMainGrid/,'active created characteristics must be rendered in the native grid');
assert.match(html,/patchSheetTexts/,'derived explanations must be refreshed from the same links');
assert.match(html,/GENSRPG_VERSION="16\.78\.90"/,'deployed app version must reflect V16.78.90');
assert.doesNotMatch(html.slice(html.indexOf('/* GenSrpG V16.78.90 — native characteristic grid unification. */'),html.indexOf('</script>',html.indexOf('/* GenSrpG V16.78.90 — native characteristic grid unification. */'))),/MutationObserver|setInterval|setTimeout|createElement\(["']script["']\)|enemyCells\s*=|dungeonRoom\s*=|startDungeonCombat/,'V16.78.90 wrapper must stay synchronous and outside spatial gameplay');

// Idempotence: a second build pass must not create duplicate wrappers/cards.
cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
const twice=fs.readFileSync(target,'utf8');
assert.equal((twice.match(/function gensUnifiedStatGridV167890\(\)/g)||[]).length,1,'patch must be idempotent');

const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){
  assert.match(site,/function gensUnifiedStatGridV167890\(\)/,'final Pages HTML must contain the native stat-grid wrapper');
  assert.match(site,/gens-custom-stat-runtime-profile-167889\.js\?v=167889/,'active-profile bridge must remain loaded');
  assert.match(site,/gens-stat-help-extension-167881\.js\?v=167881/,'generic stat/link source must remain loaded');
}
console.log('GenSrpG native unified stat grid V16.78.90 regression: OK');
