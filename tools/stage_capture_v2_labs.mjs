// Capture V2 transport: only original, SHA-pinned main sources.
// No historical Capture engine, generated author fallback, second catalog, or game rules.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [combatArg,explorationArg,siteArg]=process.argv.slice(2);
if(!combatArg||!explorationArg||!siteArg){
 throw new Error('Usage: stage_capture_v2_labs.mjs <combat-main> <exploration-main> <_site>');
}
const combat=path.resolve(combatArg),exploration=path.resolve(explorationArg),site=path.resolve(siteArg);
const pins=JSON.parse(fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/source-pins-v1.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const head=folder=>execFileSync('git',['-C',folder,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const valid=x=>/^[0-9a-f]{40}$/.test(x);
if(pins.legacyCaptureRuntime!==false)throw Error('Legacy Capture runtime is forbidden');
for(const [name,folder] of [['combat',combat],['exploration',exploration]]){
 const expected=pins[name];
 if(expected.ref!=='main'||!valid(expected.sha)||head(folder)!==expected.sha)
  throw Error('Capture V2 '+name+' must use exact approved main SHA');
}
if(pins.combat.path!=='vendor/combat-lab/'||
   pins.exploration.path!=='vendor/exploration-lab/')
 throw Error('Unknown Capture V2 native vendor roots');
const combatOut=path.join(site,pins.combat.path);
const explorationOut=path.join(site,pins.exploration.path);
fs.mkdirSync(combatOut,{recursive:true});
const copy=(from,to)=>{
 const stat=fs.lstatSync(from);
 if(stat.isSymbolicLink())throw Error('Unexpected symlink in immutable Lab transport: '+from);
 if(stat.isDirectory()){
  fs.mkdirSync(to,{recursive:true});
  for(const entry of fs.readdirSync(from).sort())copy(path.join(from,entry),path.join(to,entry));
 }else if(stat.isFile()){
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(from,to);
 }else throw Error('Unexpected Lab transport file type: '+from);
};
for(const folder of ['src','data','examples/dom-demo'])
 copy(path.join(combat,folder),path.join(combatOut,folder));
const required={
 combat:[
  'examples/dom-demo/capture-editor-v2.html',
  'examples/dom-demo/bestiary.html',
  'src/ui/capture-combat-preview-v1.js',
  'src/ui/combat-2v2-test-ui.js'
 ],
 exploration:[
  'index.html','builder.html','world-assembler.html','src/main.js'
 ]
};
const transport=[];
for(const [name,folder] of [['combat',combat],['exploration',exploration]]){
 const dest=name==='combat'?combatOut:explorationOut;
 for(const rel of required[name]){
  const original=fs.readFileSync(path.join(folder,rel));
  const staged=fs.readFileSync(path.join(dest,rel));
  if(!staged.equals(original)||!staged.length)throw Error('Native '+name+' owner transport drift: '+rel);
  transport.push({
   owner:name,
   path:pins[name].path+rel,
   size:staged.length,
   sha256:hash(staged)
  });
 }
}
const originalHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const liveHtml=fs.readFileSync(path.join(site,'index.html'),'utf8');
for(const [name,html] of [['source',originalHtml],['site',liveHtml]]){
 if(/<script\b[^>]*src=["']assets\/gensrpg\/capture\//.test(html)||
    html.includes('id="captureGameHub"'))
  throw Error('Historical Capture owner reappeared in '+name);
 if(!html.includes('assets/gensrpg/capture-v2/identity-v1.js')||
    !html.includes('assets/gensrpg/capture-v2/shell-entry-v1.js'))
  throw Error('Clean Capture V2 missing from '+name);
}
for(const legacy of ['assets/gensrpg/capture/runtime-data','capture-world-2v2-test.html']){
 if(fs.existsSync(path.join(site,legacy)))
  throw Error('Old Capture demo/data published alongside clean V2: '+legacy);
}
const manifest={
 schema:'gensrpg-capture-v2-main-only-transport-v1',
 combat:{repository:pins.combat.repository,sha:pins.combat.sha,ref:'main'},
 exploration:{repository:pins.exploration.repository,sha:pins.exploration.sha,ref:'main'},
 legacyCaptureRuntime:false,
 featuresDeferred:pins.featuresDeferred,
 transport
};
const out=path.join(site,'assets/gensrpg/capture-v2/delivery-manifest.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');
console.log('Capture V2 staged: Combat '+pins.combat.sha+'; Exploration '+pins.exploration.sha+'; verified '+transport.length+' native source files; no legacy runtime');
