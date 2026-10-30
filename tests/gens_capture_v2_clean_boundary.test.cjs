'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const test=require('node:test');
const root=path.resolve(__dirname,'..');
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=()=>text('index.html');
const pins=()=>JSON.parse(text('assets/gensrpg/capture-v2/source-pins-v1.json'));

test('real four-mode GenSrpg entry physically unloads ALL original Capture scripts',()=>{
 const html=index();
 const src=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(x=>x[1]);
 assert.equal(src.filter(x=>/^assets\/gensrpg\/capture\//.test(x)).length,0,
   'Old Capture engine/world/roster/editor/fix scripts MUST be removed, not hidden');
 assert.equal(src.filter(x=>x==='assets/gensrpg/capture-v2/identity-v1.js').length,1);
 assert.equal(src.filter(x=>x==='assets/gensrpg/capture-v2/shell-entry-v1.js').length,1);
 assert.equal(html.includes('id="captureGameHub"'),false,'historic Capture hub must be removed from DOM');
 assert.equal(html.includes('gensRenderCaptureStarterInline'),false,'historic starter selector must be removed');
 assert.ok(html.indexOf('assets/gensrpg/capture-v2/identity-v1.js')<
           html.indexOf('function gensShellActiveModuleV1'),
   'Pure Capture identity must load before the existing Shell classifier');
 assert.ok(html.indexOf('assets/gensrpg/capture-v2/shell-entry-v1.js')>
           html.indexOf('assets/gensrpg/shell/module-launch-final-authority-v1.js'),
   'Clean module must register only AFTER Shell registration exists');
});

test('Survival, Dungeon and PvP are preserved in the actual root application',()=>{
 const html=index();
 for(const src of [
   'assets/gensrpg/survival/entry-v1.js?v=1',
   'assets/gensrpg/dungeon/entry-v1.js?v=1',
   'assets/gensrpg/pvp/shell-composition-v1.js',
   'assets/gensrpg/shell/module-launch-final-authority-v1.js'
 ])assert.ok(html.includes('src="'+src+'"'),src);
});

test('new Capture shell delegates to two pinned mains; never loads the historic game engine',()=>{
 const entry=text('assets/gensrpg/capture-v2/shell-entry-v1.js');
 const identity=text('assets/gensrpg/capture-v2/identity-v1.js');
 const p=pins();
 assert.equal(p.legacyCaptureRuntime,false);
 assert.match(entry,/shell\.register\("capture",start\)/);
 assert.match(entry,/vendor\/exploration-lab\/index\.html/);
 assert.match(entry,/vendor\/combat-lab\/examples\/dom-demo\/capture-editor-v2\.html/);
 assert.match(entry,/vendor\/combat-lab\/examples\/dom-demo\/bestiary\.html/);
 assert.doesNotMatch(entry+identity, /captureStartBattleAutomatic|monster-capture-creatures|captureWorldState|gensrpg_capture_world/);
 assert.equal(p.combat.ref,'main');
 assert.equal(p.exploration.ref,'main');
 assert.match(p.combat.sha,/^[a-f0-9]{40}$/);
 assert.match(p.exploration.sha,/^[a-f0-9]{40}$/);
});

test('Pages pipeline stages the UNMODIFIED Exploration main owner, not its gh-pages version',()=>{
 const workflow=text('.github/workflows/main.yml');
 const p=pins();
 assert.match(workflow,/repository: slyen4425-cloud\/laboratoire_dynamique_exploration-/);
 assert.match(workflow,/ref: \$\{\{ steps\.capture_pages_pins\.outputs\.exploration \}\}/,
  'Exploration must resolve from the one canonical pin rather than a second hardcoded SHA');
 assert.match(workflow,/git ls-remote[^\n]+refs\/heads\/main/);
 assert.match(workflow,/cp -a exploration-lab\/src exploration-lab\/assets _site\/vendor\/exploration-lab\//);
 assert.match(workflow,/node tools\/stage_capture_v2_labs\.mjs combat-lab exploration-lab _site/);
 assert.match(workflow,/rsync -a --exclude='\/gensrpg\/capture\/'/,
  'old Capture scripts must not be in the actual Pages release');
 assert.doesNotMatch(workflow,/stage_capture_lab_delivery\.mjs|combat-assets/,
  'do not publish dormant/alternate Capture V1 alongside V2');
});

test('packaged native Exploration and Combat are present when Pages build is supplied',()=>{
 if(!process.env.CAPTURE_LAB_DELIVERY_SITE)return;
 const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE);
 for(const file of [
   'vendor/exploration-lab/index.html',
   'vendor/exploration-lab/src/main.js',
   'vendor/exploration-lab/builder.html',
   'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html',
   'vendor/combat-lab/examples/dom-demo/bestiary.html'
 ])assert.ok(fs.statSync(path.join(site,file)).size>0,file);
});

test('the original RPG Builders no longer authors Capture combat or trainer rules',()=>{
 const builder=text('assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js');
 assert.doesNotMatch(builder,/p\.rpgUniverse\.(?:captureCombat|trainerCombat)\s*=/,
  'Old builder cannot be a second writer of Combat Lab-owned rules');
 assert.doesNotMatch(builder,/set\("rpgCapture/,
  'Old Capture rules cannot be rendered as an alternative configured authority');
 assert.match(builder,/p\.rpgUniverse\.pvp\s*=/,
  'PvP belongs to its own domain and must not be deleted as Capture collateral');
});

test('original four-mode Capture card delegates to the clean registered Shell without legacy profile',()=>{
 const owner=text('assets/gensrpg/shell/legacy-hub-family-ui-v1.js');
 const start=owner.indexOf('function openGensFamily(family){');
 const end=owner.indexOf('function gensFamilyForProfileId(',start);
 assert.ok(start>=0&&end>start);
 const slice=owner.slice(start,end);
 assert.match(slice,/if\(family==="capture"\)\s*\{/);
 assert.match(slice,/return shell\.startModuleSession\("capture"\)/);
 assert.match(index(),/if\(String\(gensSelectedFamily\|\|""\)==="capture"\)return "capture"/);
 const entry=text('assets/gensrpg/capture-v2/shell-entry-v1.js');
 assert.doesNotMatch(entry,/loadSharedEntities|ensureBuiltinMonsterCapture|captureStartBattleAutomatic/);
});
