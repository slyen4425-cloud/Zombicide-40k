const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extractFunction(name){
  const sig=`function ${name}(`; const start=html.lastIndexOf(sig); if(start<0)return `NO FUNCTION ${name}\n`;
  const brace=html.indexOf('{',start); let depth=0,quote=null,esc=false;
  for(let i=brace;i<html.length;i++){
    const c=html[i];
    if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote=null;continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return html.slice(start,i+1)+'\n';
  }
  return `UNTERMINATED ${name}\n`;
}
function snippet(term,before=1800,after=3200){const i=html.lastIndexOf(term);return i<0?`NO MATCH ${term}\n`:html.slice(Math.max(0,i-before),Math.min(html.length,i+term.length+after))+'\n'}
function functionAt(pos){
  const start=html.lastIndexOf('function ',pos); if(start<0)return null;
  const nameMatch=html.slice(start,start+180).match(/^function\s+([A-Za-z0-9_$]+)\s*\(/); if(!nameMatch)return null;
  const brace=html.indexOf('{',start); if(brace<0||brace>pos)return null;
  let depth=0,quote=null,esc=false;
  for(let i=brace;i<html.length;i++){
    const c=html[i];
    if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote=null;continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0){if(pos<=i)return {name:nameMatch[1],text:html.slice(start,i+1)+'\n'};return null;}
  }
  return null;
}
function functionsContaining(term){
  let from=0,i=-1; const seen=new Set(),out=[];
  while((i=html.indexOf(term,from))>=0){const f=functionAt(i);if(f&&!seen.has(f.name)){seen.add(f.name);out.push(`\n--- ${term} in ${f.name} ---\n${f.text}`)}from=i+term.length;}
  return out.length?out.join(''):`NO CONTAINING FUNCTION ${term}\n`;
}
let out='';
for(const name of ['defaultDungeonRpgRules','normalizeDungeonRpgRules','loadDungeonRpgRules','saveDungeonRpgRules','fillDungeonRpgRulesEditor','readDungeonRpgRulesEditor','saveDungeonRpgRulesFromEditor','gensBlankRpgSettings','gensReferenceRpgSettings','ensureRpgProfileData','renderRpgUniverseEditor','saveRpgUniverseCombat','saveRpgUniverseEconomy','syncRpgUniverseCombatToDungeonRules','merchantItems','openMerchant','renderMerchant','merchantBuy','merchantSell','dc043ApplyEnemyAttack','dc315ResolveCombatWipe','explore'])out+=`\n===== FUNCTION ${name} =====\n${extractFunction(name)}`;
for(const term of ['explore()','dc315MoveHeroToRoom(','dc315SyncRoomEnemyView(','merchantBuy(','rpgEconomyTradeCard','drMinPhysicalDamage'])out+=`\n===== FUNCTIONS CONTAINING ${term} =====\n${functionsContaining(term)}`;
for(const term of ['id="rpgEconomyTradeCard"','id="drMinPhysicalDamage"','onclick="explore()"','>EXPLORER<','>Explorer<','dungeon-core-316.js'])out+=`\n===== SNIPPET ${term} =====\n${snippet(term)}`;
fs.writeFileSync(path.join(__dirname,'core317_targets_dump.txt'),out);
console.log('Wrote',out.length,'bytes');
