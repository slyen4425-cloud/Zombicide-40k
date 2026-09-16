const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function functionSource(name){
  const marker='function '+name+'(';
  const start=html.indexOf(marker);
  assert.ok(start>=0,`missing function ${name}`);
  const brace=html.indexOf('{',start);assert.ok(brace>start);
  let depth=0,quote='',escape=false;
  for(let i=brace;i<html.length;i++){
    const c=html[i];
    if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++;else if(c==='}'&&--depth===0)return html.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const changeXP=functionSource('changeXP').replace(/\s+/g,' ');
const renderAttrs=functionSource('renderDungeonAttributes').replace(/\s+/g,' ');
console.log('\n--- changeXP ---\n'+changeXP+'\n--- end ---');
console.log('\n--- renderDungeonAttributes ---\n'+renderAttrs+'\n--- end ---');

assert.match(changeXP,/dungeonSyncProgressionForState\(current,state\)/,'manual Dungeon XP must synchronize progression');
assert.doesNotMatch(changeXP,/dungeonHandleLevelUp071/,'characterization: manual XP currently bypasses the level-up handler');
assert.doesNotMatch(changeXP,/\bsave\s*\(/,'characterization: manual XP currently has no explicit persistence call');
assert.match(renderAttrs,/statPoints/,'Dungeon attribute renderer must expose available characteristic points');
console.log('GenSrpG V114.11 manual XP characterization: syncs points in memory, bypasses level handler and explicit save');
