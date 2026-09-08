const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.join(__dirname,'..');
const patcher=path.join(root,'tools','patch_generic_stat_grid_v167890.py');
const source=path.join(root,'index.html');
assert.ok(fs.existsSync(patcher));assert.ok(fs.existsSync(source));
// Permanent publication gates: an authored stat unknown to the engine must survive runtime,
// equipment and set editing; V16.79.02 also guarantees real-sheet reconciliation and
// selective merge-safe backup import.
cp.execFileSync('node',[path.join(root,'tests','gens_rpg_stat_service_v167901.test.cjs')],{stdio:'inherit'});
cp.execFileSync('node',[path.join(root,'tests','gens_stat_import_safety_v167902.test.cjs')],{stdio:'inherit'});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gens-v167902-')),target=path.join(tmp,'index.html');
fs.copyFileSync(source,target);cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
let html=fs.readFileSync(target,'utf8');
assert.match(html,/gensStatBuildNoRendererV167901/,'final build must mark the no-second-renderer architecture');
assert.doesNotMatch(html,/gensCanonicalStatGridV167898/,'legacy canonical stat renderer must not be injected');
assert.doesNotMatch(html,/GENS_CORE_STAT_IDS_V167897/,'hard-coded injected stat registry must be gone');
assert.doesNotMatch(html,/gensRenderCanonicalAttributesV167897/,'legacy build renderer must be gone');
assert.doesNotMatch(html,/function renderDungeonAttributes__native167890/,'native stat renderer must not be renamed by build patching');
assert.doesNotMatch(html,/function renderDungeonHeroStats__native167890/,'compact renderer must not be renamed by build patching');
assert.match(html,/d&&dungeonSheetTab==="skills"\?"block":"none"/,'talent tree must remain confined to the skills tab');
assert.doesNotMatch(html,/<span class="customHeroBadge">PERSONNALISÉ<\/span>/,'obsolete custom hero badge must not survive the final build');
assert.doesNotMatch(html,/badge\.textContent=h\.dungeonBuiltin\?"RPG INTÉGRÉ":"PERSONNALISÉ"/,'in-game hero cards must not show PERSONNALISÉ');
assert.match(html,/gensCurrentRpgProfileActiveV167894/,'active gameplay profile must remain authoritative');
assert.match(html,/gens-rpg-stat-reconcile-167902\.js\?v=167902/,'real hero-sheet reconciliation bridge must load');
assert.match(html,/gens-backup-import-safe-167902\.js\?v=167902/,'selective backup import bridge must load');
cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});html=fs.readFileSync(target,'utf8');
assert.equal((html.match(/gensStatBuildNoRendererV167901/g)||[]).length,1,'non-stat build cleanup must be idempotent');
assert.equal((html.match(/gens-rpg-stat-reconcile-167902\.js\?v=167902/g)||[]).length,1,'stat reconciliation bridge must load once');
assert.equal((html.match(/gens-backup-import-safe-167902\.js\?v=167902/g)||[]).length,1,'safe import bridge must load once');
const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){
 assert.match(site,/gensStatBuildNoRendererV167901/);assert.doesNotMatch(site,/gensCanonicalStatGridV167898/);assert.doesNotMatch(site,/GENS_CORE_STAT_IDS_V167897/);
 assert.match(site,/gens-rpg-stat-reconcile-167902\.js\?v=167902/);assert.match(site,/gens-backup-import-safe-167902\.js\?v=167902/);
}
console.log('GenSrpG V16.79.02 final build: dynamic stats + real sheet/rules + selective backup import guards OK');
