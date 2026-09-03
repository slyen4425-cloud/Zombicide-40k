const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');

function around(term, radius=1400){
  console.log(`\n===== ${term} =====`);
  let from=0,count=0;
  while(count<12){
    const i=html.indexOf(term,from);if(i<0)break;
    console.log(`\n--- match ${++count} @ ${i} ---\n`+html.slice(Math.max(0,i-radius),Math.min(html.length,i+term.length+radius)));
    from=i+term.length;
  }
  if(!count) console.log('NO MATCH');
}
for(const term of [
  'minPhysicalDamage','rpgMinPhysicalDamage','dungeonCombatHeroSnapshot',
  'dungeonCombatEnemy','applyDungeonHero','wounds +=','wounds=',
  'merchant','Merchant','marchand','Marchand','rpgMerchantBuyMultiplier',
  'function explore()','dungeonCombatSelection'
]) around(term);

console.log('\n===== candidate global function declarations =====');
const names=[...html.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
console.log([...new Set(names.filter(n=>/(merchant|marchand|combat|damage|armor|armure|shop|buy|achat)/i.test(n)))].sort().join('\n'));
