const fs=require('node:fs');
const src=fs.readFileSync('index.html','utf8');
const terms=[
  'function openHero(id)','function openChar(id)','openChar(id)','function closeChar','closeChar(','Retour au jeu','RETOUR AU JEU','sheet.style.display',
  'DungeonCore01.quit=function','Sauvegarder et quitter le Dungeon','showGensRootHome','gensRootHome',
  'dc047Zoom','zoomIn','zoomOut','ZOOM','Zoom','--dc047','cellSize','scale(','transform:scale','dc047RoomBoard'
];
for(const term of terms){
  let from=0,count=0;console.log('\n=== '+term+' ===');
  while(count<10){const i=src.indexOf(term,from);if(i<0)break;const a=Math.max(0,i-1800),b=Math.min(src.length,i+3600);console.log('\n--- hit '+(++count)+' @ '+i+' ---\n'+src.slice(a,b).replace(/\r/g,''));from=i+term.length}
  if(!count)console.log('(no hit)');
}
