const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function contexts(pattern,label,limit=24,radius=900){
  const out=[];let m;
  pattern.lastIndex=0;
  while((m=pattern.exec(html))&&out.length<limit){
    const i=m.index;
    out.push(html.slice(Math.max(0,i-radius),Math.min(html.length,i+radius)).replace(/\s+/g,' '));
    if(pattern.lastIndex===i)pattern.lastIndex++;
  }
  console.log(`\n--- ${label} (${out.length}) ---\n${out.join('\n###\n')}\n--- end ---`);
  return out;
}

const levelWrites=contexts(/\.rpgLevel\s*=|\brpgLevel\s*=/g,'rpgLevel assignments');
const levelControls=contexts(/(?:id|name)=["'][^"']*(?:level|niveau)[^"']*["']/gi,'level-like controls');
const explicitLevelFns=contexts(/function\s+[A-Za-z0-9_$]*(?:Level|Niveau)[A-Za-z0-9_$]*\s*\(/g,'level functions');
const xpWrites=contexts(/\.xp\s*=|\bxp\s*=/g,'xp assignments',32,650);

assert.ok(levelWrites.length,'expected at least the canonical rpgLevel synchronization assignment');
assert.ok(levelControls.length||explicitLevelFns.length,'expected at least one level-related UI/function path');
assert.ok(xpWrites.length,'expected XP write paths');
console.log('GenSrpG V114.11 manual-level authority candidates characterized');
