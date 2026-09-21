'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

(async()=>{
  const root=path.join(__dirname,'..');
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true,locale:'fr-FR'});
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
          <div class="eqEvolutionLevel"><input id="eqEvo2Xp" value="10"><div class="eqField"><input id="eqEvo2Force" value="0"></div></div>
          <div class="eqEvolutionLevel"><input id="eqEvo3Xp" value="20"><div class="eqField"><input id="eqEvo3Force" value="0"></div></div>
          <div class="eqEvolutionLevel"><input id="eqEvo4Xp" value="30"><div class="eqField"><input id="eqEvo4Force" value="0"></div></div>
        </div>
        <div id="eqSoundBox" class="eqSection"></div>
      </div>
    </div>
    <script>
      window.__custom={
        id:'custom_save_probe',name:'Custom Save Probe',type:'Équipement',rpgSlot:'head',
        setId:'',setPieceId:'',rpgBonuses:{force:1},
        evolution:{enabled:true,levels:[]}
      };
      window.__builtin={
        id:'builtin_save_probe',name:'Builtin Save Probe',type:'Équipement',rpgSlot:'head',
        dungeonBuiltin:true,setId:'',setPieceId:'',rpgBonuses:{force:2},
        evolution:{enabled:true,levels:[]}
      };
      window.__customEquipment=[structuredClone(window.__custom)];
      window.__builtinItem=structuredClone(window.__builtin);
      window.__overrides={};
      window.__baseOpenCalls=0;
      window.__baseSaveCalls=0;
      window.__saveCustomEquipmentCalls=0;
      window.__saveDungeonItemOverridesCalls=0;

      window.DUNGEON_ITEM_IDS=[window.__builtin.id];
      window.DUNGEON_ITEM_DEFINITIONS_316=[window.__builtinItem];
      window.DUNGEON_EQUIPMENT_SETS={
        set_probe:{id:'set_probe',name:'Set Probe',pieceCount:2,thresholds:[{pieces:2,bonuses:{force:1}}]}
      };
      window.ITEMS=[window.__customEquipment[0],window.__builtinItem];

      window.DungeonEquipmentUI={
        supportedBonusFields:[{key:'force',label:'Force'},{key:'armor',label:'Armure'}],
        refresh(){return true}
      };
      window.GensCleanRpgStats167874={
        runtimeDefs(){return [
          {id:'force',name:'Force',icon:'💪',min:0,max:99,defaultValue:0},
          {id:'armor',name:'Armure',icon:'🛡️',min:0,max:99,defaultValue:0}
        ]},
        def(id){return this.runtimeDefs().find(x=>x.id===id)||null},
        value(){return 0}
      };
      window.GensEquipmentBonusSetsV1={totalBonus(){return 0}};
      window.GensEquipmentEvolutionV1={totalBonus(){return 0}};

      window.loadCustomEquipment=()=>window.__customEquipment;
      window.saveCustomEquipment=list=>{
        window.__saveCustomEquipmentCalls++;
        window.__customEquipment=structuredClone(list);
        const i=window.ITEMS.findIndex(x=>String(x?.id)==='custom_save_probe');
        if(i>=0)window.ITEMS[i]=window.__customEquipment[0];
        return true;
      };
      window.loadDungeonItemOverrides=()=>structuredClone(window.__overrides);
      window.saveDungeonItemOverrides=overrides=>{
        window.__saveDungeonItemOverridesCalls++;
        window.__overrides=structuredClone(overrides||{});
        const ov=window.__overrides[window.__builtin.id]||{};
        Object.assign(window.__builtinItem,ov);
        return true;
      };
      window.ensureDungeonItems=()=>{
        if(!window.ITEMS.some(x=>String(x?.id)===window.__builtin.id))window.ITEMS.push(window.__builtinItem);
        return true;
      };
      window.refreshCustomEquipmentIntoItems=()=>true;
      window.renderEquipmentLibrary=()=>true;
      window.renderGear=()=>true;
      window.renderDungeonGear=()=>true;
      window.dungeonItems=()=>[...window.__customEquipment,window.__builtinItem];
      window.itemById=id=>window.dungeonItems().find(x=>String(x?.id)===String(id))||null;
      window.dungeonEquippedItems=()=>[];
      window.isDungeonMode=()=>true;
      window.equipmentEvolutionFromEditor=()=>({enabled:true,levels:[]});
      window.loadEquipmentEvolutionEditor=()=>true;

      window.openEquipmentEditor=function(id){
        window.__baseOpenCalls++;
        document.getElementById('eqEditId').value=String(id||'');
        document.getElementById('equipmentEditorModal').style.display='block';
        window.loadEquipmentEvolutionEditor(window.itemById(id));
        return 'native-open';
      };
      window.openEquipmentEditor.__nativeEquipment=true;
      window.saveEquipmentEditor=function(){
        window.__baseSaveCalls++;
        return 'native-save';
      };
      window.saveEquipmentEditor.__nativeEquipment=true;

      window.__describeSaveChain=function(){
        const out=[];let fn=window.saveEquipmentEditor,guard=0;
        while(typeof fn==='function'&&guard++<16){
          if(fn.__eqCache1021)out.push('equipment-cleanup:__eqCache1021');
          else if(fn.__canon101)out.push('hero-editor:__canon101');
          else if(fn.__setEditor167818)out.push('set-editor:__setEditor167818');
          else if(fn.__equipmentHotfix167817)out.push('equipment-hotfix:__equipmentHotfix167817');
          else if(fn.__nativeEquipment)out.push('native');
          else out.push('unmarked');
          fn=fn.__original;
        }
        return out;
      };
      window.__resetSaveCounters=()=>{
        window.__baseSaveCalls=0;
        window.__saveCustomEquipmentCalls=0;
        window.__saveDungeonItemOverridesCalls=0;
      };
    </script>
  </body></html>`);

  await page.addScriptTag({path:path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-equipment-hotfix-167817.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-set-editor-167818.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js')});

  await page.waitForTimeout(3300);

  const chain=await page.evaluate(()=>window.__describeSaveChain());
  assert.deepEqual(chain,[
    'equipment-cleanup:__eqCache1021',
    'hero-editor:__canon101',
    'set-editor:__setEditor167818',
    'equipment-hotfix:__equipmentHotfix167817',
    'native'
  ],'saveEquipmentEditor wrapper chain changed');

  await page.evaluate(()=>window.openEquipmentEditor('custom_save_probe'));
  await page.waitForTimeout(50);
  await page.evaluate(()=>{
    const row=document.querySelector('#eqCanonicalRpgBonuses1678101 .gensEqCanonicalRow');
    row.querySelector('[data-eq-stat]').value='force';
    row.querySelector('[data-eq-value]').value='7';
    document.getElementById('dseItemSet').value='set_probe';
    document.getElementById('dseItemPiece').value='head';
    window.__resetSaveCounters();
  });
  const customResult=await page.evaluate(()=>window.saveEquipmentEditor());
  assert.equal(customResult,'native-save');
  await page.waitForTimeout(120);

  const custom=await page.evaluate(()=>({
    baseSaveCalls:window.__baseSaveCalls,
    customWrites:window.__saveCustomEquipmentCalls,
    overrideWrites:window.__saveDungeonItemOverridesCalls,
    item:structuredClone(window.__customEquipment.find(x=>x.id==='custom_save_probe'))
  }));

  assert.equal(custom.baseSaveCalls,1,'custom save must call native save exactly once');
  assert.equal(custom.customWrites,3,'custom save currently has three distinct wrapper persistence writes');
  assert.equal(custom.overrideWrites,0);
  assert.equal(custom.item.rpgBonuses.force,7,'Hero Editor canonical bonus writer must win for custom equipment');
  assert.equal(custom.item.setId,'set_probe','Set Editor membership writer must persist custom membership');
  assert.equal(custom.item.setPieceId,'head');

  await page.evaluate(()=>window.openEquipmentEditor('builtin_save_probe'));
  await page.waitForTimeout(50);
  await page.evaluate(()=>{
    const row=document.querySelector('#eqCanonicalRpgBonuses1678101 .gensEqCanonicalRow');
    row.querySelector('[data-eq-stat]').value='force';
    row.querySelector('[data-eq-value]').value='9';
    document.getElementById('dseItemSet').value='set_probe';
    document.getElementById('dseItemPiece').value='head';
    window.__resetSaveCounters();
  });
  const builtinResult=await page.evaluate(()=>window.saveEquipmentEditor());
  assert.equal(builtinResult,'native-save');
  await page.waitForTimeout(120);

  const builtin=await page.evaluate(()=>({
    baseSaveCalls:window.__baseSaveCalls,
    customWrites:window.__saveCustomEquipmentCalls,
    overrideWrites:window.__saveDungeonItemOverridesCalls,
    overrides:structuredClone(window.__overrides),
    item:structuredClone(window.__builtinItem)
  }));

  assert.equal(builtin.baseSaveCalls,1,'builtin save must call native save exactly once');
  assert.equal(builtin.customWrites,0,'Hero Editor custom-equipment writer has no builtin target');
  assert.equal(builtin.overrideWrites,2,'builtin save uses hotfix bonus override plus Set Editor membership override');
  assert.equal(builtin.overrides.builtin_save_probe.rpgBonuses.force,2,
    'current builtin path persists the hidden hotfix bonus value, not the edited canonical Hero Editor value');
  assert.equal(builtin.overrides.builtin_save_probe.setId,'set_probe');
  assert.equal(builtin.overrides.builtin_save_probe.setPieceId,'head');
  assert.deepEqual(errors,[],'saveEquipmentEditor characterization must remain free of browser errors');

  await browser.close();
  console.log(JSON.stringify({
    scenario:'Phase 4 saveEquipmentEditor browser preaudit',
    chain,
    custom:{
      nativeCalls:custom.baseSaveCalls,
      customPersistenceWrites:custom.customWrites,
      overrideWrites:custom.overrideWrites,
      finalBonus:custom.item.rpgBonuses.force,
      finalSet:custom.item.setId
    },
    builtin:{
      nativeCalls:builtin.baseSaveCalls,
      customPersistenceWrites:builtin.customWrites,
      overrideWrites:builtin.overrideWrites,
      canonicalEditedValue:9,
      persistedBonus:builtin.overrides.builtin_save_probe.rpgBonuses.force,
      finalSet:builtin.overrides.builtin_save_probe.setId
    },
    finding:'custom save has three distinct writes; builtin canonical bonus edit is not persisted by Hero Editor and falls back to hidden hotfix value',
    runtimeModified:false
  },null,2));
})().catch(e=>{console.error(e);process.exit(1)});
