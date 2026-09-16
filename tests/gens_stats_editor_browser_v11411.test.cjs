const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const root=path.join(__dirname,'..');
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.setContent(`<!doctype html><html><body>
    <div id="rpgStatsList"></div>
    <div id="hcRpgStatsFields"><div id="hcRpgElementsWrap"></div></div>
    <script>
      window.__profiles=[{id:'dungeon',name:'Dungeon',gameStyle:'dungeon',rpgUniverse:{
        stats:{dynamicDefinitions:[],active:['force','agilite','intelligence','esprit','endurance','initiative']},
        movement:{defaults:{hero:3}}
      }}];
      window.currentRpgProfile=()=>window.__profiles[0];
      window.getActiveGameProfile=()=>window.__profiles[0];
      window.loadGameProfiles=()=>window.__profiles;
      window.saveGameProfiles=a=>{window.__profiles=a};
      window.activeGameProfileId=()=>window.__profiles[0].id;
      window.getActiveGameProfileId=()=>window.__profiles[0].id;
      window.loadDungeonRpgRules=()=>({physicalDamageStep:10,physicalDamageGain:1,rangedHitStep:10,rangedHitGain:1});
      window.saveDungeonRpgRules=()=>{};
      window.isDungeonMode=()=>false;
      window.showToast=()=>{};
      window.alert=()=>{};
      window.renderRpgUniverseEditor=function(){
        const host=document.getElementById('rpgStatsList');
        const labels={force:'Force',agility:'Agilité',intelligence:'Intelligence',spirit:'Esprit',endurance:'Endurance',initiative:'Initiative'};
        host.innerHTML=Object.entries(labels).map(([id,label])=>'<label class="smodPoolRow"><input type="checkbox" value="'+id+'" checked><span>'+label+'</span></label>').join('');
      };
      window.saveRpgUniverseStats=()=>true;
      window.changeDungeonAttribute=()=>false;
      window.dungeonAttributeValue=()=>10;
      window.renderDungeonAttributes=()=>true;
      window.renderDungeonHeroStats=()=>true;
      window.ensureDungeonHeroes=()=>true;
      window.renderParticipantSelector=()=>true;
      window.renderMenu=()=>true;
      window.openHeroCreator=()=>true;
      window.hcRenderRpgStatsUsage=()=>true;
      window.openEquipmentEditor=()=>true;
      window.CHARS={};
      window.DungeonEventRuntimeFix167878={};
      window.DungeonAuthoredFinalExit167875={};
      window.DungeonAuthoredEventCells167877={};
      window.DungeonGridDisplayRecovery167856={};
      window.GensHeroEditorDynamic167897={};
      window.GensDungeonHeroIngameArt167898={repairBoard:()=>0};
      window.GensDungeonSheetArtStability167899={repairSheet:()=>0};
      window.GensDungeonUiCleanup1678100={run:()=>true};
      window.GensEquipmentStatCleanup1678102={cleanupLegacyEquipmentUi:()=>true};
    </script>
  </body></html>`);

  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-stat-upgrade-policy-167898.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js')});

  await page.evaluate(()=>window.renderRpgUniverseEditor());
  await page.waitForTimeout(150);

  let state=await page.evaluate(()=>({
    cards:document.querySelectorAll('#rpgStatsList [data-stat-card]').length,
    names:document.querySelectorAll('#rpgStatsList [data-name]').length,
    descs:document.querySelectorAll('#rpgStatsList [data-desc]').length,
    addEffects:document.querySelectorAll('#rpgStatsList [data-add-effect]').length,
    fallback:document.querySelectorAll('#rpgStatsList .smodPoolRow').length,
    policies:document.querySelectorAll('#rpgStatsList [data-upgrade-policy]').length
  }));
  assert.ok(state.cards>=6,'rich canonical stat cards must replace native checkbox fallback');
  assert.equal(state.fallback,0,'native checkbox-only rows must not remain as final editor UI');
  assert.equal(state.names,state.cards,'each canonical stat card must expose editable name');
  assert.equal(state.descs,state.cards,'each canonical stat card must expose editable description');
  assert.equal(state.addEffects,state.cards,'each canonical stat card must expose Add effect');
  assert.equal(state.policies,state.cards,'upgrade policy must decorate each canonical card without replacing it');

  await page.evaluate(()=>window.GensCleanRpgStats167874.addEffect(document.getElementById('rpgStatsList'),'force'));
  await page.waitForTimeout(50);
  const targets=await page.evaluate(()=>[...document.querySelectorAll('#rpgStatsList [data-stat-card="force"] [data-effect-target] option')].map(o=>o.value));
  assert.ok(targets.includes('damage:melee'),'Force editor must allow a melee-damage effect');
  assert.ok(targets.includes('damage:ranged'),'Force editor must allow a ranged-damage effect');
  assert.ok(targets.includes('hit:ranged'),'editor must retain ranged-hit target');

  // Historical wrappers used retries for several seconds. Verify the rich editor remains final after those retries.
  await page.waitForTimeout(3300);
  state=await page.evaluate(()=>({
    cards:document.querySelectorAll('#rpgStatsList [data-stat-card]').length,
    fallback:document.querySelectorAll('#rpgStatsList .smodPoolRow').length,
    addEffects:document.querySelectorAll('#rpgStatsList [data-add-effect]').length
  }));
  assert.ok(state.cards>=6,'rich editor must still be present after all historical retry windows');
  assert.equal(state.fallback,0,'checkbox fallback must not retake authority after delayed retries');
  assert.equal(state.addEffects,state.cards,'effect controls must survive delayed retries');
  assert.deepEqual(errors,[],'browser fixture must remain free of runtime errors');

  await browser.close();
  console.log('GenSrpG stats editor browser contract OK: rich editor remains final after delayed retries');
})().catch(e=>{console.error(e);process.exit(1)});
