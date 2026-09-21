'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

function extractNativeSave(root){
  const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const start=source.indexOf('function saveEquipmentEditor(){');
  const end=source.indexOf('function resetDungeonItem(',start);
  assert.ok(start>=0&&end>start,'native saveEquipmentEditor must be extractable from exact index.html');
  return source.slice(start,end).trim();
}

(async()=>{
  const root=path.join(__dirname,'..');
  const nativeSave=extractNativeSave(root);
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.setContent(`<!doctype html><html><head></head><body>
    <div id="equipmentEditorModal" style="display:none"><div class="eqEditorCard">
      <input id="eqEditId" value=""><input id="eqName" value="Probe">
      <select id="eqCategory"><option value="Équipement" selected>Équipement</option></select>
      <input id="eqPrice" value="0"><select id="eqRpgRarity"><option value="common" selected>common</option></select>
      <input id="eqImageData" value=""><input id="eqCropJson" value="{}"><textarea id="eqDescription"></textarea>
      <input id="eqCharges" value="0"><div id="eqResistanceEditor"></div>
      <div class="eqField"><select id="eqBonusKind"><option value="" selected>Aucun</option></select></div>
      <div class="eqField"><select id="eqBonusMode"><option value="flat" selected>flat</option></select></div>
      <div class="eqField"><input id="eqBonusValue" value="0"></div>
      <div id="eqGeneralBox" class="eqSection"></div>
      <div id="eqEvolutionBox" class="eqSection">
        <div class="eqEvolutionLevel"><input id="eqEvo2Xp" value="10"><div class="eqField"><input id="eqEvo2Force" value="0"></div></div>
        <div class="eqEvolutionLevel"><input id="eqEvo3Xp" value="20"><div class="eqField"><input id="eqEvo3Force" value="0"></div></div>
        <div class="eqEvolutionLevel"><input id="eqEvo4Xp" value="30"><div class="eqField"><input id="eqEvo4Force" value="0"></div></div>
      </div>
      <div id="eqSoundBox" class="eqSection"></div><select id="eqSoundUse"><option value="none" selected>none</option></select>
    </div></div>
    <div id="dungeonAttributeGrid"></div>
    <script>
      window.__builtinBase={id:'dng_save_probe',name:'Builtin Probe',dungeonBuiltin:true,type:'Équipement',gameMode:'dungeon',rpgSlot:'head',setId:'set_alpha',setPieceId:'head',rpgBonuses:{force:2},evolution:{enabled:true,levels:[]}};
      window.__customSeed={id:'custom_save_probe',name:'Custom Probe',customEquipment:true,type:'Équipement',gameMode:'dungeon',rpgSlot:'head',setId:'set_alpha',setPieceId:'head',rpgBonuses:{force:2},evolution:{enabled:true,levels:[]}};
      window.__customEquipment=[structuredClone(window.__customSeed)];
      window.__overrides={dng_save_probe:{rpgBonuses:{force:2},setId:'set_alpha',setPieceId:'head'}};
      window.__customWrites=[];window.__overrideWrites=[];window.__deckWrites=0;
      window.__holdZero=false;window.__heldZero=[];
      window.__realSetTimeout=window.setTimeout.bind(window);
      window.setTimeout=function(fn,ms,...args){if(window.__holdZero&&Number(ms)===0){window.__heldZero.push({fn,args});return 90000+window.__heldZero.length}return window.__realSetTimeout(fn,ms,...args)};
      window.__flushZero=async function(){const held=window.__heldZero.splice(0);for(const t of held)t.fn(...t.args);await new Promise(r=>window.__realSetTimeout(r,10));};
      window.__clone=v=>structuredClone(v);
      window.__builtin=()=>({...window.__builtinBase,...(window.__overrides.dng_save_probe||{}),dungeonBuiltin:true,customEquipment:false});
      window.__rebuildItems=()=>{window.ITEMS=[window.__builtin(),...window.__customEquipment.map(window.__clone)]};
      window.__rebuildItems();
      window.DUNGEON_ITEM_IDS=['dng_save_probe'];
      window.DUNGEON_ITEM_DEFINITIONS_316=[window.__builtinBase];
      window.DUNGEON_EQUIPMENT_SETS={
        set_alpha:{id:'set_alpha',name:'Alpha',pieceCount:2,thresholds:[]},
        set_beta:{id:'set_beta',name:'Beta',pieceCount:2,thresholds:[]}
      };
      window.DungeonEquipmentUI={supportedBonusFields:[{key:'force',label:'Force'}],refresh(){return true}};
      window.GensCleanRpgStats167874={runtimeDefs(){return [{id:'force',name:'Force',icon:'💪',min:0,max:99,defaultValue:0}]},def(id){return id==='force'?this.runtimeDefs()[0]:null},value(){return 0}};
      window.GensEquipmentBonusSetsV1={totalBonus(){return 0}};
      window.GensEquipmentEvolutionV1={totalBonus(){return 0}};
      window.CHARS={};window.current='';window.state={inventory:[],rightHand:null,leftHand:null,rpgGear:{},xp:0};
      window.loadCustomHeroesMulti=()=>[];window.saveCustomHeroesMulti=()=>true;
      window.loadCustomEquipment=()=>window.__clone(window.__customEquipment);
      window.saveCustomEquipment=list=>{window.__customEquipment=window.__clone(list||[]);window.__customWrites.push(window.__clone(window.__customEquipment));window.__rebuildItems();return true};
      window.loadDungeonItemOverrides=()=>window.__clone(window.__overrides);
      window.saveDungeonItemOverrides=ovs=>{window.__overrides=window.__clone(ovs||{});window.__overrideWrites.push(window.__clone(window.__overrides));window.__rebuildItems();return true};
      window.ensureDungeonItems=()=>{window.__rebuildItems();return window.ITEMS};
      window.refreshCustomEquipmentIntoItems=()=>{window.__rebuildItems();return true};
      window.itemById=id=>id==='dng_save_probe'?window.__builtin():window.__customEquipment.find(x=>String(x.id)===String(id))||null;
      window.dungeonItems=()=>[window.__builtin(),...window.__customEquipment.map(window.__clone)];
      window.dungeonEquippedItems=()=>[];
      window.isDungeonMode=()=>true;
      window.gensGameplayModules=()=>({capture:false});
      window.gensCurrentUniverseId=()=> 'dungeon';window.GAME_PROFILE_DUNGEON_ID='dungeon';window.gensCurrentContentFamily=()=> 'dungeon';
      window.gensCurrentElementSettings=()=>({enabled:false});window.gensNormCrop=v=>v||{};window.gensReadResistanceEditor=()=>({});
      window.equipmentEvolutionFromEditor=()=>({enabled:false,levels:[]});window.loadEquipmentEvolutionEditor=()=>true;
      window.loadDeckConfig=()=>({custom_save_probe:0,dng_save_probe:0});window.saveDeckConfig=()=>{window.__deckWrites++;return true};
      window.closeEquipmentEditor=()=>{document.getElementById('equipmentEditorModal').style.display='none'};
      window.renderEquipmentLibrary=()=>true;window.renderDeckConfig=()=>true;window.renderGear=()=>true;window.renderDungeonGear=()=>true;
      window.alert=msg=>{throw new Error('unexpected alert: '+msg)};
      window.openEquipmentEditor=function(id){
        const item=window.itemById(id);if(!item)throw new Error('missing item '+id);
        document.getElementById('eqEditId').value=String(id);document.getElementById('eqName').value=String(item.name||'Probe');
        document.getElementById('eqCategory').value='Équipement';document.getElementById('equipmentEditorModal').style.display='block';
        return 'native-open';
      };
      window.__chain=function(){const out=[],seen=new Set();let fn=window.saveEquipmentEditor;while(typeof fn==='function'&&!seen.has(fn)){seen.add(fn);out.push({eqCache1021:!!fn.__eqCache1021,canon101:!!fn.__canon101,setEditor167818:!!fn.__setEditor167818,equipmentHotfix167817:!!fn.__equipmentHotfix167817,native:!!fn.__nativeEquipment});fn=fn.__original}return out};
      window.__resetLogs=()=>{window.__customWrites=[];window.__overrideWrites=[];window.__heldZero=[];window.__holdZero=false};
    </script>
  </body></html>`);

  await page.addScriptTag({content:nativeSave});
  await page.evaluate(()=>{window.saveEquipmentEditor.__nativeEquipment=true});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-equipment-hotfix-167817.js')});
  await page.addScriptTag({path:path.join(root,'assets','dungeon','dungeon-set-editor-167818.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js')});
  await page.waitForTimeout(120);

  const chain=await page.evaluate(()=>window.__chain());
  assert.deepEqual(chain.map(x=>Object.keys(x).find(k=>x[k])||'unknown'),[
    'eqCache1021','canon101','setEditor167818','equipmentHotfix167817','native'
  ],'saveEquipmentEditor must stabilize on Cleanup -> Hero -> Set -> Hotfix -> native');

  async function prepareAndSave(id){
    await page.evaluate(id=>{window.__resetLogs();window.openEquipmentEditor(id)},id);
    await page.waitForTimeout(40);
    await page.evaluate(()=>{
      const rows=[...document.querySelectorAll('#eqCanonicalRpgBonuses1678101 .gensEqCanonicalRow')];
      const row=rows.find(r=>r.querySelector('[data-eq-stat]')?.value==='force')||rows[0];
      if(!row)throw new Error('canonical force row missing');
      row.querySelector('[data-eq-stat]').value='force';row.querySelector('[data-eq-value]').value='9';
      const set=document.getElementById('dseItemSet'),piece=document.getElementById('dseItemPiece');
      if(!set||!piece)throw new Error('set membership controls missing');
      set.value='set_beta';piece.value='probe_piece';
      window.__holdZero=true;
      window.saveEquipmentEditor();
    });
    const sync=await page.evaluate(()=>({customWrites:window.__clone(window.__customWrites),overrideWrites:window.__clone(window.__overrideWrites),held:window.__heldZero.length}));
    await page.evaluate(()=>window.__flushZero());
    const final=await page.evaluate(()=>({customWrites:window.__clone(window.__customWrites),overrideWrites:window.__clone(window.__overrideWrites),custom:window.__clone(window.__customEquipment),overrides:window.__clone(window.__overrides)}));
    return {sync,final};
  }

  const custom=await prepareAndSave('custom_save_probe');
  assert.equal(custom.sync.customWrites.length,3,'custom save must synchronously write native, historical bonuses, then set membership');
  assert.equal(custom.sync.overrideWrites.length,0,'custom save must not write builtin overrides');
  assert.ok(custom.sync.held>=1,'canonical Hero writer must remain deferred');
  assert.equal(custom.final.customWrites.length,4,'custom save must add one deferred canonical Hero write');
  assert.equal(custom.final.customWrites[0][0].rpgBonuses,undefined,'native custom write must not own rpgBonuses');
  assert.equal(custom.final.customWrites[0][0].setId,undefined,'native custom write must not own set membership');
  assert.equal(custom.final.customWrites[1][0].rpgBonuses?.force,2,'hotfix write must persist the historical bonus fields');
  assert.equal(custom.final.customWrites[2][0].setId,'set_beta','Set Editor write must persist membership after hotfix');
  assert.equal(custom.final.customWrites[3][0].rpgBonuses?.force,9,'Hero Editor deferred write must persist canonical custom bonuses last');
  assert.equal(custom.final.custom[0].rpgBonuses?.force,9,'custom canonical bonus must survive the full chain');
  assert.equal(custom.final.custom[0].setId,'set_beta','custom set membership must survive the full chain');

  const builtin=await prepareAndSave('dng_save_probe');
  assert.equal(builtin.sync.overrideWrites.length,3,'builtin save must synchronously write native, historical bonuses, then set membership');
  assert.equal(builtin.sync.customWrites.length,0,'builtin synchronous chain must not write the custom list');
  assert.ok(builtin.sync.held>=1,'Hero canonical writer is still scheduled for builtin save');
  assert.equal(builtin.final.customWrites.length,0,'Hero canonical writer currently finds no builtin target in custom equipment');
  assert.equal(builtin.final.overrideWrites.length,3,'builtin canonical Hero callback currently adds no override write');
  assert.equal(builtin.final.overrideWrites[0].dng_save_probe.rpgBonuses,undefined,'native builtin write must not own rpgBonuses');
  assert.equal(builtin.final.overrideWrites[0].dng_save_probe.setId,undefined,'native builtin write must not own set membership');
  assert.equal(builtin.final.overrideWrites[1].dng_save_probe.rpgBonuses?.force,2,'hotfix must restore historical builtin bonuses');
  assert.equal(builtin.final.overrideWrites[2].dng_save_probe.setId,'set_beta','Set Editor must restore builtin membership');
  assert.equal(builtin.final.overrides.dng_save_probe.rpgBonuses?.force,2,'canonical edit 9 is currently not persisted for builtin equipment');
  assert.equal(builtin.final.overrides.dng_save_probe.setId,'set_beta','builtin set membership must still persist');

  assert.deepEqual(errors,[],'saveEquipmentEditor preaudit browser characterization must remain free of browser errors');
  await browser.close();

  console.log(JSON.stringify({
    scenario:'Phase 4 Equipment saveEquipmentEditor browser preaudit',
    exactNativeOwner:true,
    chain,
    custom:{syncWrites:3,totalCustomWrites:4,canonicalForce:custom.final.custom[0].rpgBonuses?.force,setId:custom.final.custom[0].setId},
    builtin:{syncOverrideWrites:3,totalOverrideWrites:3,customWrites:0,requestedCanonicalForce:9,persistedForce:builtin.final.overrides.dng_save_probe.rpgBonuses?.force,setId:builtin.final.overrides.dng_save_probe.setId},
    characterizedDefect:'builtin canonical rpgBonuses edit is not persisted by Hero Editor because its writer only targets custom equipment',
    runtimeModified:false
  },null,2));
})().catch(e=>{console.error(e);process.exit(1)});
