const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
const terms=['function state()','function initialState','function show()','function rt()','function saveRt','function setZoom','queuePaint','dc310','gensrpg_dungeon_runtime_v2','DEVICE_HERO_KEY','function role()','function assignedHero'];
for(const term of terms){
  let from=0,count=0;console.log('\n=== '+term+' ===');
  while(count<6){const i=src.indexOf(term,from);if(i<0)break;const a=Math.max(0,i-1200),b=Math.min(src.length,i+2600);console.log('\n--- hit '+(++count)+' @ '+i+' ---\n'+src.slice(a,b).replace(/\r/g,''));from=i+term.length}
  if(!count)console.log('(no hit)');
}
