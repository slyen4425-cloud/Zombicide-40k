const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const terms=['dungeonAdvanceTurn156','dungeonRunAi156','dungeonCurrentTurn156','initiative','D100','d100','esquive','Échec','Echec','show036','resolve036','dc036PendingFinish'];
function scriptAround(pos){
 const before=html.lastIndexOf('<script',pos), after=html.indexOf('</script>',pos);
 const head=before>=0?html.slice(before,Math.min(before+300,after)):'';
 const id=(head.match(/id=["']([^"']+)/)||[])[1]||'inline';
 return {id,before,after};
}
for(const term of terms){
 let p=0,n=0;
 while((p=html.indexOf(term,p))>=0 && n<12){
   const s=scriptAround(p); const a=Math.max(s.before>=0?s.before:p-900,p-1100),b=Math.min(s.after>=0?s.after+9:p+1500,p+1800);
   console.log(`\n=== ${term} #${++n} script=${s.id} pos=${p} ===\n`+html.slice(a,b).replace(/\s+/g,' ').slice(0,3200));
   p+=term.length;
 }
 console.log(`COUNT ${term} >= ${n}`);
}
