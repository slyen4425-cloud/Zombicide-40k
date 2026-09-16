const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function buttonOnclick(id){
  const re=new RegExp(`<button\\b[^>]*\\bid="${id}"[^>]*\\bonclick="([^"]+)"[^>]*>`,'i');
  const match=html.match(re);
  assert.ok(match,`button ${id} with onclick not found`);
  return match[1];
}

for(const id of ['dungeonCombatMenuBtn','dungeonCombatSheetBtn']){
  const onclick=buttonOnclick(id);
  assert.match(onclick,/GensRpgTacticalCombatV2Bridge\.requestCombat\(window,/,
    `${id} must route directly through the single Bridge requestCombat contract`);
  assert.match(onclick,/reason:'manual-setup'/,
    `${id} must preserve the manual setup reason`);
  assert.match(onclick,new RegExp(`entry:'${id}'`),
    `${id} must keep an explicit diagnostic entry`);
  assert.doesNotMatch(onclick,/openDungeonCombatSetup/,
    `${id} must no longer depend on the historical openDungeonCombatSetup adapter`);
}

console.log('GenSrpG combat UI migration lot 1 OK: two native manual buttons -> Bridge.requestCombat');
