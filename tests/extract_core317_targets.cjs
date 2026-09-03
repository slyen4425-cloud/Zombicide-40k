const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const terms=['minPhysicalDamage','rpgMinPhysicalDamage','dungeonCombatHeroSnapshot','dungeonCombatEnemy','marchand','Marchand','merchant','Merchant','rpgMerchantBuyMultiplier','function explore()','dc315ResolveCombatWipe','wounds'];
let out='';
for(const term of terms){
  out+=`\n===== ${term} =====\n`;
  let pos=0,hits=0;
  while(hits<4){
    const i=html.indexOf(term,pos); if(i<0) break;
    hits++;
    out+=`\n--- ${hits} @ ${i} ---\n`+html.slice(Math.max(0,i-900),Math.min(html.length,i+term.length+1400))+'\n';
    pos=i+term.length;
  }
  if(!hits) out+='NO MATCH\n';
}
const fn=[...html.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
out+='\n===== FUNCTIONS =====\n'+[...new Set(fn.filter(n=>/(merchant|marchand|combat|damage|armor|armure|shop|buy|achat|explore|room)/i.test(n)))].sort().join('\n')+'\n';
fs.writeFileSync(path.join(__dirname,'core317_targets_dump.txt'),out);
console.log('Wrote',out.length,'bytes');
