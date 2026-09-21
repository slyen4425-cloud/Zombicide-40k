'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const root=path.join(__dirname,'..');
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.setContent(`<!doctype html><html><head></head><body>
    <div id="equipmentEditorModal"><input id="eqEditId" value="item1"><div id="eqGeneralBox"></div>
      <div class="eqField"><select id="eqBonusKind"></select></div>
      <div class="eqField"><select id="eqBonusMode"></select></div>
      <div class="eqField"><input id="eqBonusValue" value="0"></div>
      <div class="eqEvolutionLevel"><input id="eqEvo2Xp" value="10"><div class="eqField"><input id="eqEvo2Force"></div></div>
      <div class="eqEvolutionLevel"><input id="eqEvo3Xp" value="20"><div class="eqField"><input id="eqEvo3Force"></div></div>
      <div class="eqEvolutionLevel"><input id="eqEvo4Xp" value="30"><div class="eqField"><input id="eqEvo4Force"></div></div>
    </div>
    <script>
      window.__baseOpen=0; window.__baseSave=0;
      window.__item={id:'item1',name:'Objet',type:'Équipement',rpgBonuses:{force:1},evolution:{enabled:true,levels:[]}};
      window.CHARS={};
      window.ITEMS=[window.__item];
      window.DUNGEON_ITEM_IDS=[];
      window.DUNGEON_ITEM_DEFINITIONS_316=[];
      window.DUNGEON_EQUIPMENT_SETS={};
      window.GensCleanRpgStats167874={
        runtimeDefs(){return [{id:'force',name:'Force',icon:'',min:0,max:99,defaultValue:0}]},
        def(id){return id==='force'?this.runtimeDefs()[0]:null},
        value(){return 0}
      };
      window.GensEquipmentBonusSetsV1={totalBonus(){return 0}};
      window.GensEquipmentEvolutionV1={totalBonus(){return 0}};
      window.GensStatUpgradePolicy167898={decorateGame(){},injectEditor(){}};
      window.GensDungeonHeroIngameArt167898={repairBoard(){return 0}};
      window.GensDungeonUiCleanup1678100={run(){return true}};
      window.DungeonEquipmentUI={supportedBonusFields:[{key:'force',label:'Force'}],refresh(){return true}};
      window.dungeonItems=()=>[window.__item];
      window.itemById=id=>id==='item1'?window.__item:null;
      window.loadCustomEquipment=()=>[window.__item];
      window.saveCustomEquipment=()=>true;
      window.loadDungeonItemOverrides=()=>({});
      window.saveDungeonItemOverrides=()=>true;
      window.ensureDungeonItems=()=>true;
      window.refreshCustomEquipmentIntoItems=()=>true;
      window.renderEquipmentLibrary=()=>true;
      window.renderGear=()=>true;
      window.renderDungeonGear=()=>true;
      window.dungeonEquippedItems=()=>[];
      window.isDungeonMode=()=>false;
      window.equipmentEvolutionFromEditor=()=>({enabled:true,levels:[]});
      window.loadEquipmentEvolutionEditor=()=>true;
      window.openEquipmentEditor=function(){window.__baseOpen++;return 'open'};
      window.saveEquipmentEditor=function(){window.__baseSave++;return 'save'};
    </script>
  </body></html>`);

  await page.addScriptTag({path:path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-equipment-hotfix-167817.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-set-editor-167818.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js')});

  const describe=await page.evaluate(()=>{
    const chain=fn=>{
      const out=[];let cur=fn,guard=0;
      while(typeof cur==='function'&&guard++<12){
        out.push({
          canon101:!!cur.__canon101,
          canonEq102:!!cur.__canonEq102,
          eqCache1021:!!cur.__eqCache1021,
          setEditor:!!cur.__setEditor167818,
          hotfix:!!cur.__equipmentHotfix167817
        });
        cur=cur.__original;
      }
      return out;
    };
    return {open:chain(window.openEquipmentEditor),save:chain(window.saveEquipmentEditor)};
  });

  await page.waitForTimeout(3300);

  const final=await page.evaluate(()=>{
    const chain=fn=>{
      const out=[];let cur=fn,guard=0;
      while(typeof cur==='function'&&guard++<12){
        out.push({
          canon101:!!cur.__canon101,
          canonEq102:!!cur.__canonEq102,
          eqCache1021:!!cur.__eqCache1021,
          setEditor:!!cur.__setEditor167818,
          hotfix:!!cur.__equipmentHotfix167817
        });
        cur=cur.__original;
      }
      return out;
    };
    const open=chain(window.openEquipmentEditor),save=chain(window.saveEquipmentEditor);
    window.openEquipmentEditor('item1');
    window.saveEquipmentEditor();
    return {open,save};
  });
  await page.waitForTimeout(100);

  const counts=await page.evaluate(()=>({baseOpen:window.__baseOpen,baseSave:window.__baseSave}));

  const count=(chain,key)=>chain.filter(x=>x[key]).length;
  assert.equal(count(final.open,'canon101'),2,'Hero Editor Dynamic must currently appear twice in final open wrapper chain');
  assert.equal(count(final.open,'canonEq102'),1,'Equipment Cleanup must appear once in final open wrapper chain');
  assert.equal(count(final.open,'setEditor'),1);
  assert.equal(count(final.open,'hotfix'),1);
  assert.equal(final.open[0].canon101,true,'Hero Editor retry must currently become the final outer open wrapper');

  assert.equal(count(final.save,'canon101'),2,'Hero Editor Dynamic must currently appear twice in final save wrapper chain');
  assert.equal(count(final.save,'eqCache1021'),1,'Equipment cache invalidator must appear once in final save wrapper chain');
  assert.equal(count(final.save,'setEditor'),1);
  assert.equal(count(final.save,'hotfix'),1);
  assert.equal(final.save[0].canon101,true,'Hero Editor retry must currently become the final outer save wrapper');

  assert.equal(counts.baseOpen,1,'wrapper duplication must not duplicate the native open call');
  assert.equal(counts.baseSave,1,'wrapper duplication must not duplicate the native save call');
  assert.deepEqual(errors,[],'wrapper characterization fixture must remain free of browser errors');

  await browser.close();
  console.log(JSON.stringify({
    scenario:'Phase 4 Equipment wrapper reinstall browser preaudit',
    chainSoonAfterLoad:describe,
    chainAfterRetryWindow:final,
    heroOpenWrappersAfterRetry:count(final.open,'canon101'),
    heroSaveWrappersAfterRetry:count(final.save,'canon101'),
    nativeCalls:counts,
    runtimeModified:false
  },null,2));
})().catch(e=>{console.error(e);process.exit(1)});
