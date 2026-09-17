const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function extractFunction(start,end){
  const a=index.indexOf(start);
  assert.ok(a>=0,'missing owner '+start);
  const b=index.indexOf(end,a);
  assert.ok(b>a,'missing end marker for '+start);
  return index.slice(a,b+2);
}

const renderOwner=extractFunction('function renderDungeonSkillTree(){','\n}\n\nconst DUNGEON_DEFAULT_ATTRIBUTES=');
const tabOwner=extractFunction('function applyDungeonSheetTabs(){','\n}\nfunction dungeonCombatHeroSnapshot');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:412,height:915}});
  try{
    await page.setContent(`<!doctype html><body class="dungeon-sheet">
      <div id="dungeonSheetTabs"><button data-dtab="character"></button><button data-dtab="skills"></button></div>
      <div class="panel" id="dungeonSkillTreePanel" style="display:none"></div>
      <div class="panel" id="zombicideSkillPanel" style="display:block"></div>
    </body>`);

    await page.addScriptTag({content:`
      let dungeonSheetTab='character';
      var current='dungeon_aldren';
      var state={skillPoints:0,xp:0};
      function isDungeonHeroSheet(){return true}
      function isDungeonMode(){return true}
      function dungeonSyncProgressionForState(){}
      ${renderOwner}
      ${tabOwner}
      window.__talentOwnerHarness={
        render:()=>renderDungeonSkillTree(),
        apply:()=>applyDungeonSheetTabs(),
        setTab:v=>{dungeonSheetTab=v}
      };
    `});

    const trace=await page.evaluate(()=>{
      const panel=document.getElementById('dungeonSkillTreePanel');
      const read=phase=>({phase,inline:panel.style.display,computed:getComputedStyle(panel).display});
      const out=[read('initial')];
      __talentOwnerHarness.render();
      out.push(read('after-renderDungeonSkillTree'));
      const host=document.createElement('div');
      host.id='dungeonSkillTree';
      panel.appendChild(host);
      __talentOwnerHarness.apply();
      out.push(read('after-applyDungeonSheetTabs-character'));
      __talentOwnerHarness.setTab('skills');
      __talentOwnerHarness.apply();
      out.push(read('after-applyDungeonSheetTabs-skills'));
      return out;
    });

    const initial=trace.find(x=>x.phase==='initial');
    const afterRender=trace.find(x=>x.phase==='after-renderDungeonSkillTree');
    const afterCharacter=trace.find(x=>x.phase==='after-applyDungeonSheetTabs-character');
    const afterSkills=trace.find(x=>x.phase==='after-applyDungeonSheetTabs-skills');

    assert.equal(initial.computed,'none');
    assert.equal(afterCharacter.computed,'none','Character tab must own Talent visibility and keep the panel hidden');
    assert.notEqual(afterSkills.computed,'none','Skills tab must still reveal the canonical Talent panel');
    assert.equal(afterRender.computed,'none','renderDungeonSkillTree must populate Talent content without overriding tab visibility; trace='+JSON.stringify(trace));

    console.log(JSON.stringify({scenario:'hero sheet Talent owner conflict',trace}));
  }finally{
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
