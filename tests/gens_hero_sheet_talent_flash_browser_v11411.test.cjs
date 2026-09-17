const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');

function sliceBetween(startMarker,endMarker){
  const start=source.indexOf(startMarker);
  assert.ok(start>=0,'missing source marker: '+startMarker);
  const end=source.indexOf(endMarker,start);
  assert.ok(end>start,'missing source marker: '+endMarker);
  return source.slice(start,end);
}

// Execute the real native functions from index.html instead of copying a replacement renderer.
const renderDungeonSkillTreeSource=sliceBetween(
  'function renderDungeonSkillTree(){',
  '\n\nconst DUNGEON_DEFAULT_ATTRIBUTES'
);
const applyDungeonSheetTabsSource=sliceBetween(
  'function applyDungeonSheetTabs(){',
  '\nfunction dungeonCombatHeroSnapshot'
);

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  try{
    await page.setContent(`<!doctype html><html><body class="dungeon-sheet"><div id="sheet">
      <div id="dungeonSheetTabs" style="display:grid">
        <button data-dtab="character" class="active">PERSONNAGE</button>
        <button data-dtab="skills">COMPÉTENCES</button>
      </div>
      <div id="dungeonSkillTreePanel" class="panel" style="display:none">
        <div id="dungeonSkillTree"></div>
      </div>
      <div id="zombicideSkillPanel" class="panel"></div>
      <div id="zombicideXpBar"></div>
      <div id="xpMarker"></div>
      <div id="dungeonProgressText"></div>
    </div></body></html>`);

    await page.addScriptTag({content:`
      var dungeonSheetTab='character';
      var current='dungeon_aldren';
      var state={xp:0,skillPoints:1,skillTreeUnlocked:[]};
      var DUNGEON_TALENT_TIER_WIDTHS=[];
      function isDungeonHeroSheet(){return true}
      function isDungeonMode(){return true}
      function dungeonSyncProgressionForState(){}
      function loadDungeonRpgRules(){return {xpPerLevel:10}}
      function dungeonRpgLevelFromXp(){return 1}
      function dungeonRpgXpIntoLevel(){return 0}
      function dungeonTalentSetById(){return {name:'Guerrier'}}
      function dungeonHeroTalentSetId(){return 'warrior'}
      function dungeonTreeDisplayNodes(){return []}
      function dungeonNodeUnlocked(){return false}
      function dungeonNodeAvailable(){return false}
      function dungeonTreeNodes(){return []}
      function z40kEscHtml(v){return String(v)}
      function resetDungeonSheetTabArtifacts(){}
      ${renderDungeonSkillTreeSource}
      ${applyDungeonSheetTabsSource}
    `});

    const observed=await page.evaluate(()=>{
      const panel=document.getElementById('dungeonSkillTreePanel');
      const host=document.getElementById('dungeonSkillTree');

      // Real opening order: Talent content renderer runs, tab visibility owner follows.
      renderDungeonSkillTree();
      const afterTalentRenderer=getComputedStyle(panel).display;
      const contentBeforeTabOwner=host.textContent;
      applyDungeonSheetTabs();
      const afterCharacterTabOwner=getComputedStyle(panel).display;

      // The Skills tab must still be able to reveal the already-rendered Talent content.
      dungeonSheetTab='skills';
      panel.style.display='none';
      renderDungeonSkillTree();
      applyDungeonSheetTabs();
      const afterSkillsTabOwner=getComputedStyle(panel).display;

      return {afterTalentRenderer,afterCharacterTabOwner,afterSkillsTabOwner,contentBeforeTabOwner};
    });

    assert.match(observed.contentBeforeTabOwner,/24 emplacements/,'Talent content renderer must still populate the native tree');
    assert.equal(
      observed.afterTalentRenderer,
      'none',
      'character tab owns section visibility: Talent renderer must not flash #dungeonSkillTreePanel visible before applyDungeonSheetTabs()'
    );
    assert.equal(observed.afterCharacterTabOwner,'none','character tab must keep the Talent panel hidden');
    assert.notEqual(observed.afterSkillsTabOwner,'none','skills tab must reveal the Talent panel');
    assert.deepEqual(errors,[],'Talent flash characterization must remain free of browser errors');

    console.log(JSON.stringify({
      scenario:'hero sheet Talent visibility authority',
      viewport:'412x915 @2.625 touch',
      characterTab:{afterTalentRenderer:observed.afterTalentRenderer,afterTabOwner:observed.afterCharacterTabOwner},
      skillsTab:{afterTabOwner:observed.afterSkillsTabOwner}
    }));
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exit(1)});
