const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const lines=html.split(/\r?\n/);
function contexts(term,radius=18){
  const hits=[];
  for(let i=0;i<lines.length;i++)if(lines[i].includes(term))hits.push(i);
  console.log(`\n=== ${term}: ${hits.length} occurrence(s) ===`);
  for(const i of hits){
    const a=Math.max(0,i-radius),b=Math.min(lines.length,i+radius+1);
    console.log(`--- lines ${a+1}-${b} (hit ${i+1}) ---`);
    for(let j=a;j<b;j++)console.log(String(j+1).padStart(6,' ')+': '+lines[j]);
  }
}
let syntaxErrors=0,inlineCount=0;
const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m;
while((m=re.exec(html))){
  if(/\bsrc\s*=/.test(m[1]))continue;
  inlineCount++;
  const startLine=html.slice(0,m.index).split(/\r?\n/).length;
  try{new vm.Script(m[2],{filename:`index-inline-${inlineCount}-line-${startLine}.js`});}
  catch(e){syntaxErrors++;console.error(`INLINE SCRIPT SYNTAX ERROR #${inlineCount} near HTML line ${startLine}:`);console.error(e.stack||e);}
}
console.log(`Inline scripts compiled: ${inlineCount}; syntax errors: ${syntaxErrors}`);
for(const term of ['function switchGameModeFromHome','switchGameModeFromHome=','window.switchGameModeFromHome','function renderHomeGameModeSwitcher','function openGensBuiltInGame','window.openGensBuiltInGame','gensSwitchUniverse155','hasActiveSession','MODE AVENTURE RPG'])contexts(term);
console.log('\n=== fixed/inset overlays in index CSS/markup ===');
for(let i=0;i<lines.length;i++)if(/position\s*:\s*fixed|inset\s*:\s*0/.test(lines[i]))console.log(String(i+1).padStart(6,' ')+': '+lines[i]);
console.log('\n=== MutationObserver across JS assets ===');
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&/\.js$/.test(ent.name)){const s=fs.readFileSync(p,'utf8');if(s.includes('MutationObserver'))console.log(path.relative(path.join(__dirname,'..'),p));}}}
walk(path.join(__dirname,'..','assets'));
if(syntaxErrors)process.exitCode=2;
