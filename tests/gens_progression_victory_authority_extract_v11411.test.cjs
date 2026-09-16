const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function scripts(){
  const out=[];const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;let m,n=0;
  while((m=re.exec(html))){const id=(m[1]||'').match(/\bid=["']([^"']+)["']/i)?.[1]||`inline-${++n}`;out.push({id,body:m[2]||''});}
  return out;
}
function bodyOfFunction(src,name){
  const startRe=new RegExp(`function\\s+${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\s*\\([^)]*\\)\\s*\\{`);
  const m=startRe.exec(src);if(!m)return null;
  const brace=src.indexOf('{',m.index);let depth=0,quote='',esc=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i];
    if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(m.index,i+1);
  }
  return null;
}
function assignmentBody(src,name){
  const needle=`window.${name}=function`;const p=src.indexOf(needle);if(p<0)return null;
  const f=src.indexOf('function',p),brace=src.indexOf('{',f);let depth=0,quote='',esc=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i];if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(p,i+1);
  }return null;
}
const all=scripts();
const names=['dungeonSyncProgressionForState','changeXP','awardDungeonDefeatXp','dungeonRecordCombatReward','dungeonCombatVictoryHtml','openDungeonCombatVictoryPopup','finishDungeonCombatVictory'];
const report={};
for(const name of names){
  const hits=[];for(const s of all){const b=bodyOfFunction(s.body,name)||assignmentBody(s.body,name);if(b)hits.push({script:s.id,body:b});}
  report[name]=hits;
}
for(const id of ['dungeonCore044HeroProgression','dungeonCore071LevelUp','dungeonCore212RenderVictory','dungeonCore312TurnAndPopupFixes']){
  const s=all.find(x=>x.id===id);if(s)report[`script:${id}`]=s.body;
}
assert.ok(report.dungeonSyncProgressionForState.length,'progression sync body missing');
assert.ok(report.awardDungeonDefeatXp.length,'Dungeon XP award body missing');
assert.ok(report.dungeonCombatVictoryHtml.length,'victory HTML body missing');
assert.ok(report.openDungeonCombatVictoryPopup.length,'victory popup body missing');
console.log('=== GENSRPG EXACT PROGRESSION / VICTORY AUTHORITIES ===');
for(const [name,value] of Object.entries(report)){
  console.log(`\n--- ${name} ---`);
  if(Array.isArray(value)){for(const hit of value)console.log(`[${hit.script}]\n${hit.body}`)}else console.log(value);
}
console.log('\n=== END EXACT AUTHORITIES ===');
