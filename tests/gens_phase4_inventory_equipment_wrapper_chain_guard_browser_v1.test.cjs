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
      <input id="eqEditId" value="">
      <div id="eqGeneralBox" class="eqSection"></div>
      <div class="eqField"><select id="eqBonusKind"><option>legacy</option></select></div>
      <div class="eqField"><select id="eqBonusMode"><option>legacy</option></select></div>
      <div class="eqField"><input id="eqBonusValue" value="1"></div>
      <div class="eqEvolutionLevel"><input id="eqEvo2Xp" value="10"><div class="eqField"><input id="eqEvo2Force" value="1"></div></div>
      <div class="eqEvolutionLevel"><input id="eqEvo3Xp" value="20"><div class="eqField"><input id="eqEvo3Force" value="0"></div></div>
      <div class="eqEvolutionLevel"><input id="eqEvo4Xp" value="30"><div class="eqField"><input id="eqEvo4Force" value="0"></div></div>
    </div>
    <div id="dungeonAttributeGrid"></div>
    <script>
      window.__item={
        id:'ditem_chain_guard',rpgBonuses:{force:2},
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
      window.__lateRenderCalls=0;
      window.GensCleanRpgStats167874={
        runtimeDefs(){return [{id:'force',name:'Force',icon:'💪',min:0,max:99,defaultValue:0}]},
        def(id){return id==='force'?this.runtimeDefs()[0]:null},
        value(){return 0}
      };
      window.GensEquipmentBonusSetsV1={totalBonus(){return 0}};
      window.GensEquipmentEvolutionV1={totalBonus(){return 0}};
      window.CHARS={};
      window.current='';
      window.loadCustomHeroesMulti=()=>[];
      window.saveCustomHeroesMulti=()=>true;
      window.loadCustomEquipment=()=>window.__customEquipment;
      window.saveCustomEquipment=list=>{window.__saveCustomEquipmentCalls++;window.__customEquipment=list;return true};
      window.dungeonItems=()=>[window.__item];
      window.dungeonEquippedItems=()=>[];
      window.equipmentEvolutionFromEditor=()=>({enabled:true,levels:[]});
      window.loadEquipmentEvolutionEditor=()=>true;
      window.dungeonEquipmentBonus=()=>0;
      window.openEquipmentEditor=function(id){
        window.__baseOpenCalls++;
        document.getElementById('eqEditId').value=String(id||'');
        document.getElementById('equipmentEditorModal').style.display='block';
        return 'native-open';
      };
      window.openEquipmentEditor.__nativeEquipment=true;
      window.saveEquipmentEditor=function(){window.__baseSaveCalls++;return 'native-save'};
      window.saveEquipmentEditor.__nativeEquipment=true;
      window.renderDungeonAttributes=function(){return 'initial-render'};
      window.renderDungeonAttributes.__nativeInitial=true;

      window.__chain=function(name){
        const out=[],seen=new Set();
        let fn=window[name];
        while(typeof fn==='function'&&!seen.has(fn)){
          seen.add(fn);
          out.push({
            canon101:!!fn.__canon101,
            canonEq102:!!fn.__canonEq102,
            eqCache1021:!!fn.__eqCache1021,
            lateRender:!!fn.__lateRender,
            nativeEquipment:!!fn.__nativeEquipment
          });
          fn=fn.__original;
        }
        return out;
      };

      window.__realSetTimeout=window.setTimeout.bind(window);
      window.__held=[];
      window.setTimeout=function(fn,ms,...args){
        if(Number(ms)>=50){
          window.__held.push({fn,ms,args});
          return 70000+window.__held.length;
        }
        return window.__realSetTimeout(fn,ms,...args);
      };
      window.__runRetry50=function(){
        const i=window.__held.findIndex(x=>x.ms===50);
        if(i<0)return false;
        const t=window.__held.splice(i,1)[0];
        t.fn(...t.args);
        return true;
      };
    </script>
  </body></html>`);

  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js')});
  await page.addScriptTag({path:path.join(root,'assets','gensrpg','gens-equipment-stat-cleanup-1678102.js')});
  await page.waitForTimeout(20);

  const before=await page.evaluate(()=>({
    open:window.__chain('openEquipmentEditor'),
    save:window.__chain('saveEquipmentEditor')
  }));
  assert.equal(before.open.filter(x=>x.canon101).length,1,'initial open chain must have one Hero Editor owner');
  assert.equal(before.save.filter(x=>x.canon101).length,1,'initial save chain must have one Hero Editor owner');

  await page.evaluate(()=>{
    const late=function(){window.__lateRenderCalls++;return 'late-render'};
    late.__lateRender=true;
    window.renderDungeonAttributes=late;
  });

  const ran=await page.evaluate(()=>window.__runRetry50());
  assert.equal(ran,true,'historical 50 ms retry must still execute');

  const after=await page.evaluate(()=>({
    open:window.__chain('openEquipmentEditor'),
    save:window.__chain('saveEquipmentEditor'),
    render:window.__chain('renderDungeonAttributes')
  }));

  assert.equal(
    after.open.filter(x=>x.canon101).length,
    1,
    'retry must not duplicate Hero Editor openEquipmentEditor ownership through Cleanup'
  );
  assert.equal(
    after.save.filter(x=>x.canon101).length,
    1,
    'retry must not duplicate Hero Editor saveEquipmentEditor ownership through Cleanup'
  );
  assert.equal(after.render[0]?.canon101,true,'retry must still wrap a genuinely late replacement');
  assert.equal(after.render[1]?.lateRender,true,'late replacement must remain directly below the recovered Hero wrapper');

  const openResult=await page.evaluate(()=>window.openEquipmentEditor(window.__item.id));
  assert.equal(openResult,'native-open');
  await page.waitForTimeout(30);

  const saveResult=await page.evaluate(()=>window.saveEquipmentEditor());
  assert.equal(saveResult,'native-save');
  await page.waitForTimeout(80);

  const effects=await page.evaluate(()=>({
    baseOpenCalls:window.__baseOpenCalls,
    baseSaveCalls:window.__baseSaveCalls,
    saveCustomEquipmentCalls:window.__saveCustomEquipmentCalls,
    canonicalBonusBoxes:document.querySelectorAll('#eqCanonicalRpgBonuses1678101').length,
    canonicalEvolutionLevels:document.querySelectorAll('[data-evo-canonical]').length,
    modal:getComputedStyle(document.getElementById('equipmentEditorModal')).display,
    renderResult:window.renderDungeonAttributes(),
    lateRenderCalls:window.__lateRenderCalls
  }));

  assert.equal(effects.baseOpenCalls,1,'native Equipment open must execute exactly once');
  assert.equal(effects.baseSaveCalls,1,'native Equipment save must execute exactly once');
  assert.equal(effects.saveCustomEquipmentCalls,1,'one Equipment save must produce one Hero Editor persistence write');
  assert.equal(effects.canonicalBonusBoxes,1,'canonical bonus UI must remain unique');
  assert.equal(effects.canonicalEvolutionLevels,3,'canonical evolution UI must remain complete');
  assert.notEqual(effects.modal,'none','Equipment modal must remain open');
  assert.equal(effects.renderResult,'late-render','late replacement return value must survive recovered wrapper');
  assert.equal(effects.lateRenderCalls,1,'late replacement must execute exactly once');
  assert.deepEqual(errors,[],'chain-guard browser regression must remain free of browser errors');

  await browser.close();
  console.log(JSON.stringify({
    scenario:'Phase 4 Hero Editor wrapper retry chain guard browser',
    before,
    after,
    effects,
    lateReplacementRecovered:true
  },null,2));
})().catch(e=>{console.error(e);process.exit(1)});
