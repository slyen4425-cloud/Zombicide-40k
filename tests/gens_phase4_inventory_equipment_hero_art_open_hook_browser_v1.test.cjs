'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const root=path.join(__dirname,'..');
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const page=await browser.newPage({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR'
  });
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.setContent(`<!doctype html><html><head></head><body>
    <div id="equipmentEditorModal" style="display:none">
      <div class="eqEditorCard">
        <input id="eqEditId" value="">
        <div id="eqGeneralBox" class="eqSection"></div>
        <div class="eqField"><select id="eqBonusKind"><option>legacy</option></select></div>
        <div class="eqField"><select id="eqBonusMode"><option>legacy</option></select></div>
        <div class="eqField"><input id="eqBonusValue" value="1"></div>
        <div id="eqEvolutionBox" class="eqSection">
          <div class="eqEvolutionLevel"><input id="eqEvo2Xp" value="10"><div class="eqField"><input id="eqEvo2Force" value="2"></div></div>
          <div class="eqEvolutionLevel"><input id="eqEvo3Xp" value="20"><div class="eqField"><input id="eqEvo3Force" value="0"></div></div>
          <div class="eqEvolutionLevel"><input id="eqEvo4Xp" value="30"><div class="eqField"><input id="eqEvo4Force" value="0"></div></div>
        </div>
        <div id="eqSoundBox" class="eqSection"></div>
      </div>
    </div>
    <div id="participantList"><div class="participantRow"><span class="participantName">Aldren</span><img class="participantAvatar" src="assets/old/aldren.png"></div></div>
    <div id="dc01Heroes"><div class="dc01Hero">Aldren</div></div>
    <script>
      window.__item={"id":"ditem_ancient_helm","name":"Heaume des Anciens","dungeonBuiltin":true,"type":"Équipement","rpgSlot":"head","setId":"set_ancient","setPieceId":"head","rpgBonuses":{"armor":1,"esprit":1},"evolution":{"enabled":true,"levels":[{"level":2,"xp":10,"rpgBonuses":{"force":2}},{"level":3,"xp":20,"rpgBonuses":{"armor":1}},{"level":4,"xp":30,"rpgBonuses":{"esprit":2}}]}};
      window.__baseOpenCalls=0;
      window.__baseLoadEvolutionCalls=0;
      window.CHARS={dungeon_aldren:{image:'assets/old/aldren.png',avatar:'assets/old/aldren.png'}};
      window.ITEMS=[window.__item];
      window.DUNGEON_ITEM_IDS=[window.__item.id];
      window.DUNGEON_ITEM_DEFINITIONS_316=[window.__item];
      window.DUNGEON_EQUIPMENT_SETS={
        set_ancient:{
          id:'set_ancient',name:'Armure des Anciens',pieceCount:5,
          thresholds:[
            {pieces:2,bonuses:{armor:1}},
            {pieces:3,bonuses:{force:1}}
          ]
        }
      };
      window.DungeonEquipmentUI={
        supportedBonusFields:[
          {key:'armor',label:'Armure'},{key:'force',label:'Force'},
          {key:'esprit',label:'Esprit'},{key:'initiative',label:'Initiative'}
        ],
        refresh(){return true}
      };
      window.GensCleanRpgStats167874={
        runtimeDefs(){
          return [
            {id:'armor',name:'Armure',icon:'🛡️',min:0,max:99,defaultValue:0},
            {id:'force',name:'Force',icon:'💪',min:0,max:99,defaultValue:0},
            {id:'esprit',name:'Esprit',icon:'✨',min:0,max:99,defaultValue:0},
            {id:'initiative',name:'Initiative',icon:'⚡',min:0,max:99,defaultValue:0}
          ];
        },
        def(id){return this.runtimeDefs().find(x=>x.id===id)||null},
        value(){return 0}
      };
      window.GensEquipmentBonusSetsV1={totalBonus(){return 0}};
      window.GensEquipmentEvolutionV1={totalBonus(){return 0}};
      window.GensStatUpgradePolicy167898={decorateGame(){},injectEditor(){}};
      window.GensDungeonHeroIngameArt167898={repairBoard(){return 0}};
      window.GensDungeonUiCleanup1678100={run(){return true}};
      window.DungeonEventRuntimeFix167878={};
      window.DungeonAuthoredFinalExit167875={};
      window.DungeonAuthoredEventCells167877={};
      window.DungeonGridDisplayRecovery167856={};
      // Prevent Hero Art Repair from network-loading the two modules under test.
      // They are loaded explicitly below in the real production order.
      window.GensHeroEditorDynamic167897={__placeholder:true};
      window.GensEquipmentStatCleanup1678102={__placeholder:true};
      window.dungeonItems=()=>[window.__item];
      window.itemById=id=>id===window.__item.id?window.__item:null;
      window.loadCustomEquipment=()=>[];
      window.saveCustomEquipment=()=>true;
      window.loadDungeonItemOverrides=()=>({});
      window.saveDungeonItemOverrides=()=>true;
      window.ensureDungeonItems=()=>true;
      window.refreshCustomEquipmentIntoItems=()=>true;
      window.renderEquipmentLibrary=()=>true;
      window.renderGear=()=>true;
      window.renderDungeonGear=()=>true;
      window.dungeonEquippedItems=()=>[];
      window.isDungeonMode=()=>true;
      window.equipmentEvolutionFromEditor=()=>({enabled:true,levels:[]});
      window.loadEquipmentEvolutionEditor=function(){window.__baseLoadEvolutionCalls++;return true};
      window.saveEquipmentEditor=()=>true;
      window.openEquipmentEditor=function(id){
        window.__baseOpenCalls++;
        document.getElementById('eqEditId').value=String(id||'');
        document.getElementById('equipmentEditorModal').style.display='block';
        window.loadEquipmentEvolutionEditor(window.__item);
        return 'native-open';
      };
    </script>
  </body></html>`);

  await page.addScriptTag({path:path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-equipment-hotfix-167817.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-set-editor-167818.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js')});
  await page.evaluate(()=>{
    delete window.GensHeroEditorDynamic167897;
    delete window.GensEquipmentStatCleanup1678102;
  });
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js')});

  const result=await page.evaluate(()=>window.openEquipmentEditor('ditem_ancient_helm'));
  assert.equal(result,'native-open','wrapper chain must preserve native return value');

  await page.waitForTimeout(120);
  let state=await page.evaluate(()=>({
    baseOpenCalls:window.__baseOpenCalls,
    baseEvolutionCalls:window.__baseLoadEvolutionCalls,
    modal:getComputedStyle(document.getElementById('equipmentEditorModal')).display,
    canonicalBonus:!!document.getElementById('eqCanonicalRpgBonuses1678101'),
    canonicalBonusRows:document.querySelectorAll('#eqCanonicalRpgBonuses1678101 .gensEqCanonicalRow').length,
    setSection:!!document.getElementById('dseSection167818'),
    setValue:document.getElementById('dseItemSet')?.value||'',
    pieceValue:document.getElementById('dseItemPiece')?.value||'',
    canonicalEvolution:document.querySelectorAll('[data-evo-canonical]').length,
    legacyBonusHidden:getComputedStyle(document.getElementById('eqBonusKind').closest('.eqField')).display==='none',
    heroArt:window.CHARS?.dungeon_aldren?.image||'',
    participantArt:document.querySelector('#participantList img')?.getAttribute('src')||''
  }));

  assert.equal(state.baseOpenCalls,1,'native equipment editor must execute exactly once');
  assert.equal(state.baseEvolutionCalls,1,'native evolution loader must execute exactly once');
  assert.notEqual(state.modal,'none','equipment editor must remain open');
  assert.equal(state.canonicalBonus,true,'Hero Editor Dynamic must own the canonical rpgBonuses UI');
  assert.ok(state.canonicalBonusRows>=1,'canonical rpgBonuses UI must contain at least one row');
  assert.equal(state.setSection,true,'Set Editor must retain its section');
  assert.equal(state.setValue,'set_ancient','Set Editor must synchronize current set membership');
  assert.equal(state.pieceValue,'head','Set Editor must synchronize current set piece');
  assert.equal(state.canonicalEvolution,3,'Equipment Cleanup must own canonical evolution levels 2/3/4');
  assert.equal(state.legacyBonusHidden,true,'legacy single-stat controls must remain hidden');
  assert.equal(state.heroArt,'assets/dungeon/creatures/dng_aldren.png','Hero Art Repair install must retain built-in hero art repair');
  assert.equal(state.participantArt,'assets/dungeon/creatures/dng_aldren.png','Hero Art Repair scheduled participant repair must remain active');

  await page.waitForTimeout(3300);
  state=await page.evaluate(()=>({
    baseOpenCalls:window.__baseOpenCalls,
    canonicalBonus:!!document.getElementById('eqCanonicalRpgBonuses1678101'),
    setSection:!!document.getElementById('dseSection167818'),
    canonicalEvolution:document.querySelectorAll('[data-evo-canonical]').length,
    heroArt:window.CHARS?.dungeon_aldren?.image||'',
    participantArt:document.querySelector('#participantList img')?.getAttribute('src')||''
  }));
  assert.equal(state.baseOpenCalls,1,'delayed wrapper retries must not reopen the native editor');
  assert.equal(state.canonicalBonus,true,'canonical equipment bonus UI must survive delayed retries');
  assert.equal(state.setSection,true,'set editor must survive delayed retries');
  assert.equal(state.canonicalEvolution,3,'canonical evolution UI must survive delayed retries');
  assert.equal(state.heroArt,'assets/dungeon/creatures/dng_aldren.png');
  assert.equal(state.participantArt,'assets/dungeon/creatures/dng_aldren.png');
  assert.deepEqual(errors,[],'targeted Equipment owner composition must remain free of browser errors');

  await browser.close();
  console.log(JSON.stringify({
    scenario:'Phase 4 Equipment Hero Art open hook browser characterization',
    nativeOpenCalls:state.baseOpenCalls,
    canonicalBonusUi:state.canonicalBonus,
    setEditor:state.setSection,
    canonicalEvolutionLevels:state.canonicalEvolution,
    heroArtRepairStillActive:true,
    runtimeModified:false
  }));
})().catch(e=>{console.error(e);process.exit(1)});
