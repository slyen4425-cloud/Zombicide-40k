const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const lines=html.split(/\r?\n/);
const out=[];
function clean(s){s=String(s);if(s.length>700)return s.slice(0,320)+' …[LONG LINE OMITTED]… '+s.slice(-160);return s;}
function add(s=''){out.push(clean(s));}
function hits(term){const a=[];for(let i=0;i<lines.length;i++)if(lines[i].includes(term))a.push(i);return a;}
function ctx(term,b=8,a=28){const hs=hits(term);add(`\n## ${term} (${hs.length})`);for(const i of hs){add(`-- line ${i+1} --`);for(let j=Math.max(0,i-b);j<Math.min(lines.length,i+a+1);j++)add(`${j+1}: ${lines[j]}`);}}
function range(a,b,title){add(`\n## ${title} [${a}-${b}]`);for(let j=a-1;j<Math.min(lines.length,b);j++)add(`${j+1}: ${lines[j]}`);}
add('# HOME UI FREEZE FOCUSED REPORT');
for(const t of ['function switchGameModeFromHome','switchGameModeFromHome(','function renderHomeGameModeSwitcher','MODE AVENTURE RPG','onclick="switchGameModeFromHome','function openGensBuiltInGame','window.openGensBuiltInGame','gensSwitchUniverse155','function backHome','function renderHome()','function hasActiveSession'])ctx(t);
range(2600,2675,'home card markup');
range(8968,9035,'home mode handler');
range(12245,12295,'backHome / view reset');
for(const center of [31258,31269,31897,41740,42216,43524])range(Math.max(1,center-12),center+18,`overlay context near ${center}`);
add('\n## Fixed/inset rules without obvious display:none on same line');
for(let i=0;i<lines.length;i++){const s=lines[i];if(/position\s*:\s*fixed/i.test(s)&&/inset\s*:\s*0/i.test(s)&&!/display\s*:\s*none/i.test(s))add(`${i+1}: ${s}`)}
add('\n## pointer-events auto / overlays');
for(let i=0;i<lines.length;i++){const s=lines[i];if(/pointer-events\s*:\s*auto/i.test(s))add(`${i+1}: ${s}`)}
add('\n## MutationObserver in assets with context');
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&/\.js$/i.test(ent.name)){const ls=fs.readFileSync(p,'utf8').split(/\r?\n/);for(let i=0;i<ls.length;i++)if(/MutationObserver/.test(ls[i])){add(`-- ${path.relative(root,p)}:${i+1} --`);for(let j=Math.max(0,i-5);j<Math.min(ls.length,i+8);j++)add(`${j+1}: ${ls[j]}`)}}}}
walk(path.join(root,'assets'));
fs.mkdirSync(path.join(root,'diagnostics'),{recursive:true});
fs.writeFileSync(path.join(root,'diagnostics','home-ui-freeze-report.txt'),out.join('\n'));
console.log('wrote focused report');
