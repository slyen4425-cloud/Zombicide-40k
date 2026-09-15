const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
const terms=['function renderHeroes','openHero','function openChar','openChar(','function quit','quit(){','save & quitter','Sauvegarder et quitter','dungeonMapHtml','dng_wall_block.jpg','dc047Cell','dc01Heroes','showGensRootHome','gensRootHome'];
for(const term of terms){
  let from=0,count=0;console.log('\n=== '+term+' ===');
  while(count<8){const i=src.indexOf(term,from);if(i<0)break;const a=Math.max(0,i-900),b=Math.min(src.length,i+1800);console.log('\n--- hit '+(++count)+' @ '+i+' ---\n'+src.slice(a,b).replace(/\r/g,''));from=i+term.length}
  if(!count)console.log('(no hit)');
}
