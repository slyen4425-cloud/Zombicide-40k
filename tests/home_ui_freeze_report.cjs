const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const htmlPath=path.join(root,'index.html');
const html=fs.readFileSync(htmlPath,'utf8');
const lines=html.split(/\r?\n/);
const out=[];
function add(s=''){out.push(String(s));}
function occurrences(term){const hits=[];for(let i=0;i<lines.length;i++)if(lines[i].includes(term))hits.push(i);return hits;}
function contexts(term,before=10,after=35){const hits=occurrences(term);add(`\n## ${term} (${hits.length})`);for(const i of hits){add(`-- hit line ${i+1} --`);for(let j=Math.max(0,i-before);j<Math.min(lines.length,i+after+1);j++)add(`${j+1}: ${lines[j]}`);}}
add('# HOME UI FREEZE REPORT');
add(`index lines: ${lines.length}`);
for(const term of [
  'function switchGameModeFromHome',
  'switchGameModeFromHome=',
  'window.switchGameModeFromHome',
  'function renderHomeGameModeSwitcher',
  'MODE AVENTURE RPG',
  'function openGensBuiltInGame',
  'window.openGensBuiltInGame',
  'gensSwitchUniverse155',
  'hasActiveSession',
  'gensModeSwitchToken'
]) contexts(term);
add('\n## Potential full-screen interceptors in index');
for(let i=0;i<lines.length;i++){
  const s=lines[i];
  if(/position\s*:\s*fixed|inset\s*:\s*0|pointer-events\s*:|z-index\s*:\s*[1-9]\d{3,}/i.test(s)) add(`${i+1}: ${s}`);
}
add('\n## MutationObserver in assets');
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&/\.js$/i.test(ent.name)){const src=fs.readFileSync(p,'utf8');const ls=src.split(/\r?\n/);for(let i=0;i<ls.length;i++)if(/MutationObserver/.test(ls[i]))add(`${path.relative(root,p)}:${i+1}: ${ls[i]}`);}}}
walk(path.join(root,'assets'));
fs.mkdirSync(path.join(root,'diagnostics'),{recursive:true});
fs.writeFileSync(path.join(root,'diagnostics','home-ui-freeze-report.txt'),out.join('\n'));
console.log('wrote diagnostics/home-ui-freeze-report.txt');
