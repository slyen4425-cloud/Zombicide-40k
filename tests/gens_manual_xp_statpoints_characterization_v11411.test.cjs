const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
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

const changeXPRaw=functionSource('changeXP');
const changeXP=changeXPRaw.replace(/\s+/g,' ');
const renderAttrs=functionSource('renderDungeonAttributes').replace(/\s+/g,' ');
console.log('\n--- changeXP ---\n'+changeXP+'\n--- end ---');

assert.match(changeXP,/dungeonSyncProgressionForState\(current,state\)/,'manual Dungeon XP must synchronize progression');
assert.match(changeXP,/dungeonHandleLevelUp071/,'manual Dungeon XP must reuse the canonical level-up handler');
assert.match(changeXP,/\bsave\s*\(/,'manual Dungeon XP must explicitly persist the modified hero');
assert.match(renderAttrs,/statPoints/,'Dungeon attribute renderer must expose available characteristic points');

function runCase({xp,delta,dungeon=true}){
  const calls={sync:0,level:[],save:0,render:0,sound:0};
  const context={
    state:{xp},current:'hero_test',
    isDungeonHeroSheet:()=>dungeon,
    dungeonSyncProgressionForState:(id,st)=>{calls.sync++;st.rpgLevel=1+Math.floor(st.xp/10);return st},
    dungeonHandleLevelUp071:(id,before,st)=>{calls.level.push({id,before,after:st.xp});return st.xp>=10&&before<10},
    save:()=>{calls.save++},
    render:()=>{calls.render++},
    z40kPlayUiSound:()=>{calls.sound++},
  };
  vm.runInNewContext(changeXPRaw+';changeXP('+Number(delta)+');',context);
  return {state:context.state,calls};
}

{
  const r=runCase({xp:4,delta:1});
  assert.equal(r.state.xp,5);
  assert.equal(r.calls.sync,1,'Dungeon manual XP must use canonical progression sync exactly once');
  assert.equal(r.calls.level.length,1,'Dungeon manual XP must consult canonical level-up handler exactly once');
  assert.deepEqual(r.calls.level[0],{id:'hero_test',before:4,after:5});
  assert.equal(r.calls.save,1,'Dungeon manual XP must persist even without crossing a level');
  assert.equal(r.calls.render,1,'manual XP must render exactly once');
}

{
  const r=runCase({xp:9,delta:1});
  assert.equal(r.state.xp,10);
  assert.equal(r.calls.sync,1);
  assert.equal(r.calls.level.length,1,'crossing a threshold must reach canonical level-up handler');
  assert.deepEqual(r.calls.level[0],{id:'hero_test',before:9,after:10});
  assert.equal(r.calls.save,1,'level-up path must finish with explicit persistence of the action');
  assert.equal(r.calls.render,1);
}

{
  const r=runCase({xp:10,delta:-1});
  assert.equal(r.state.xp,9);
  assert.equal(r.calls.sync,1);
  assert.equal(r.calls.level.length,1,'decrease still resynchronizes through the same authority');
  assert.deepEqual(r.calls.level[0],{id:'hero_test',before:10,after:9});
  assert.equal(r.calls.save,1);
  assert.equal(r.calls.render,1);
}

{
  const r=runCase({xp:4,delta:1,dungeon:false});
  assert.equal(r.state.xp,5);
  assert.equal(r.calls.sync,0,'non-Dungeon behavior must not be routed through Dungeon progression');
  assert.equal(r.calls.level.length,0);
  assert.equal(r.calls.save,0,'this focused change must not alter legacy non-Dungeon persistence semantics');
  assert.equal(r.calls.render,1);
}

console.log('GenSrpG manual XP target contract: native changeXP -> canonical sync -> canonical level handler -> persistence -> single render');
