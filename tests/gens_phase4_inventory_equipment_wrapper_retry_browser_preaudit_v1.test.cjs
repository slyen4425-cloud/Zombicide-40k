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
    <script>
      window.__item={
        id:'ditem_retry_probe',name:'Retry Probe',dungeonBuiltin:true,type:'Équipement',
        rpgSlot:'head',setId:'set_probe',setPieceId:'head',
        rpgBonuses:{force:2},
        evolution:{enabled:true,levels:[
          {level:2,xp:10,rpgBonuses:{force:1}},
          {level:3,xp:20,rpgBonuses:{force:1}},
          {level:4,xp:30,rpgBonuses:{force:1}}
        ]}
      };
      window.__customEquipment=[window.__item];
      window.__baseOpenCalls=0;
      window.__baseSaveCalls=0;
      window.__saveCustomEquipmentCalls=0;
      window.ITEMS=[window.__item];
      window.DUNGEON_ITEM_IDS=[window.__item.id];
      window.DUNGEON_ITEM_DEFINITIONS_316=[window.__item];
      window.DUNGEON_EQUIPMENT_SETS={
        set_probe:{id:'set_probe',name:'Set Probe',pieceCount:2,thresholds:[{pieces:2,bonuses:{force:1}}]}
      };
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
      window.CHARS={};
      window.dungeonItems=()=>[window.__item];
      window.itemById=id=>id===window.__item.id?window.__item:null;
      window.loadCustomEquipment=()=>window.__customEquipment;
      window.saveCustomEquipment=list=>{window.__saveCustomEquipmentCalls++;window.__customEquipment=list;return true};
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
      window.loadEquipmentEvolutionEditor=()=>true;
      window.openEquipmentEditor=function(id){
        window.__baseOpenCalls++;
        document.getElementById('eqEditId').value=String(id||'');
        document.getElementById('equipmentEditorModal').style.display='block';
        window.loadEquipmentEvolutionEditor(window.__item);
        return 'native-open';
      };
      window.openEquipmentEditor.__nativeEquipment=true;
      window.saveEquipmentEditor=function(){
        window.__baseSaveCalls++;
        return 'native-save';
      };
      window.saveEquipmentEditor.__nativeEquipment=true;

      window.__describeWrapperChain=function(name){
        const out=[];
        let fn=window[name],guard=0;
        while(typeof fn==='function'&&guard++<16){
          if(fn.__canon101)out.push('hero-editor:__canon101');
          else if(fn.__canonEq102)out.push('equipment-cleanup:__canonEq102');
          else if(fn.__eqCache1021)out.push('equipment-cleanup:__eqCache1021');
          else if(fn.__setEditor167818)out.push('set-editor:__setEditor167818');
          else if(fn.__equipmentHotfix167817)out.push('equipment-hotfix:__equipmentHotfix167817');
          else if(fn.__nativeEquipment)out.push('native');
          else out.push('unmarked');
          fn=fn.__original;
        }
        return out;
      };

      // Hold only delayed timers >=50 ms so the initial post-load chain can be
      // captured deterministically. Zero-delay owner work remains real.
      window.__realSetTimeout=window.setTimeout.bind(window);
      window.__heldDelayedTimers=[];
      window.setTimeout=function(fn,ms,...args){
        if(Number(ms)>=50){
          window.__heldDelayedTimers.push({fn,ms,args});
          return 9000+window.__heldDelayedTimers.length;
        }
        return window.__realSetTimeout(fn,ms,...args);
      };
    </script>
  </body></html>`);

  await page.addScriptTag({path:path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-equipment-hotfix-167817.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-set-editor-167818.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js')});

  await page.waitForTimeout(20);

  const initial=await page.evaluate(()=>({
    open:window.__describeWrapperChain('openEquipmentEditor'),
    save:window.__describeWrapperChain('saveEquipmentEditor'),
    held:window.__heldDelayedTimers.map(x=>x.ms)
  }));

  assert.deepEqual(initial.open,[
    'equipment-cleanup:__canonEq102',
    'hero-editor:__canon101',
    'set-editor:__setEditor167818',
    'equipment-hotfix:__equipmentHotfix167817',
    'native'
  ],'initial open chain changed');

  assert.deepEqual(initial.save,[
    'equipment-cleanup:__eqCache1021',
    'hero-editor:__canon101',
    'set-editor:__setEditor167818',
    'equipment-hotfix:__equipmentHotfix167817',
    'native'
  ],'initial save chain changed');

  assert.ok(initial.held.includes(50),'Hero Editor initial 50 ms retry must be held for deterministic characterization');

  await page.evaluate(()=>{
    const held=window.__heldDelayedTimers.splice(0);
    window.setTimeout=window.__realSetTimeout;
    for(const timer of held){
      if(timer.ms===50){timer.fn(...timer.args);break}
    }
  });

  await page.waitForTimeout(3300);

  const finalChain=await page.evaluate(()=>({
    open:window.__describeWrapperChain('openEquipmentEditor'),
    save:window.__describeWrapperChain('saveEquipmentEditor')
  }));

  assert.deepEqual(finalChain.open,[
    'hero-editor:__canon101',
    'equipment-cleanup:__canonEq102',
    'hero-editor:__canon101',
    'set-editor:__setEditor167818',
    'equipment-hotfix:__equipmentHotfix167817',
    'native'
  ],'Hero Editor retry must be characterized as a second open wrapper around Cleanup');

  assert.deepEqual(finalChain.save,[
    'hero-editor:__canon101',
    'equipment-cleanup:__eqCache1021',
    'hero-editor:__canon101',
    'set-editor:__setEditor167818',
    'equipment-hotfix:__equipmentHotfix167817',
    'native'
  ],'Hero Editor retry must be characterized as a second save wrapper around Cleanup invalidation');

  assert.equal(finalChain.open.filter(x=>x==='hero-editor:__canon101').length,2);
  assert.equal(finalChain.save.filter(x=>x==='hero-editor:__canon101').length,2);

  const openResult=await page.evaluate(()=>window.openEquipmentEditor(window.__item.id));
  assert.equal(openResult,'native-open');
  await page.waitForTimeout(80);

  const saveResult=await page.evaluate(()=>window.saveEquipmentEditor());
  assert.equal(saveResult,'native-save');
  await page.waitForTimeout(120);

  const effects=await page.evaluate(()=>({
    baseOpenCalls:window.__baseOpenCalls,
    baseSaveCalls:window.__baseSaveCalls,
    saveCustomEquipmentCalls:window.__saveCustomEquipmentCalls,
    canonicalBonusBoxes:document.querySelectorAll('#eqCanonicalRpgBonuses1678101').length,
    setSections:document.querySelectorAll('#dseSection167818').length,
    canonicalEvolutionLevels:document.querySelectorAll('[data-evo-canonical]').length,
    modal:getComputedStyle(document.getElementById('equipmentEditorModal')).display
  }));

  assert.equal(effects.baseOpenCalls,1,'native open must still execute once through the duplicated wrappers');
  assert.equal(effects.baseSaveCalls,1,'native save must still execute once through the duplicated wrappers');
  assert.equal(effects.saveCustomEquipmentCalls,2,
    'one user save currently triggers two Hero Editor Dynamic persistence writes after retry rewrap');
  assert.equal(effects.canonicalBonusBoxes,1,'duplicate wrappers must not create duplicate canonical bonus boxes');
  assert.equal(effects.setSections,1,'Set Editor section must remain unique');
  assert.equal(effects.canonicalEvolutionLevels,3,'canonical evolution decoration must remain unique');
  assert.notEqual(effects.modal,'none','equipment editor must remain open');
  assert.deepEqual(errors,[],'wrapper retry characterization fixture must remain free of browser errors');

  await browser.close();
  console.log(JSON.stringify({
    scenario:'Phase 4 Equipment wrapper retry browser preaudit',
    initial,
    finalChain,
    effects,
    finding:'Hero Editor Dynamic owns two wrapper layers after retry; one save produces two saveCustomEquipment writes'
  },null,2));
})().catch(e=>{console.error(e);process.exit(1)});
