const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extractFunction(name){
  const sig=`function ${name}(`; const start=html.indexOf(sig); if(start<0)return `NO FUNCTION ${name}\n`;
  const brace=html.indexOf('{',start); let depth=0,quote=null,esc=false;
  for(let i=brace;i<html.length;i++){
    const c=html[i];
    if(quote){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===quote)quote=null;continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return html.slice(start,i+1)+'\n';
  }
  return `UNTERMINATED ${name}\n`;
}
function snippet(term,before=1100,after=1800){const i=html.indexOf(term);return i<0?`NO MATCH ${term}\n`:html.slice(Math.max(0,i-before),Math.min(html.length,i+term.length+after))+'\n'}
let out='';
for(const name of ['defaultDungeonRpgRules','normalizeDungeonRpgRules','fillDungeonRpgRulesEditor','readDungeonRpgRulesEditor','saveDungeonRpgRulesFromEditor','currentRpgEconomy','saveRpgUniverseEconomy','merchantItems','openMerchant','merchantBuy','merchantSell','dungeonSetHeroWounds','applyDamage48','applyBossAttackDamage','baseArmorSave','dc315ResolveCombatWipe','explore']){
 out+=`\n===== FUNCTION ${name} =====\n${extractFunction(name)}`;
}
for(const term of ['id="drMinPhysicalDamage"','id="rpgMinPhysicalDamage"','id="rpgMerchantBuyMultiplier"','id="merchantList"','DungeonCore315','dungeon-core-316.js']) out+=`\n===== SNIPPET ${term} =====\n${snippet(term)}`;
fs.writeFileSync(path.join(__dirname,'core317_targets_dump.txt'),out);
console.log('Wrote',out.length,'bytes');
