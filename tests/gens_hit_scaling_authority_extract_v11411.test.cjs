const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function extract(name){
  const patterns=[new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`),new RegExp(`window\\.${name}\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{`)];
  let m=null;for(const re of patterns){m=re.exec(html);if(m)break}if(!m)return null;
  const brace=html.indexOf('{',m.index);let depth=0,quote='',esc=false;
  for(let i=brace;i<html.length;i++){
    const c=html[i];
    if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote='';continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return html.slice(m.index,i+1);
  }
  return null;
}
for(const name of ['applyDungeonCombatScaling','dungeonHitBonusForMode','dungeonAttributeValue']){
  const body=extract(name);assert.ok(body,`${name} authority missing`);console.log(`\n--- ${name} ---\n${body}\n`);
}
console.log('GenSrpG V114.11 hit scaling authorities extracted');
