const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const deploy=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sheetSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const failures=[];
function check(name,fn){try{fn();console.log('OK',name)}catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,'-',e.message)}}

check('preview makes Dungeon progression runtime a blocking prerequisite',()=>{
  const progression='assets/gensrpg/dungeon/progression-runtime-v1.js';
  const perf='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
  assert.ok(preview.includes(progression),'preview must load progression directly instead of waiting for the dynamic bootstrap chain');
  assert.ok(preview.indexOf(progression)<preview.indexOf(perf),'progression must execute before the final performance/bootstrap layer and before preview-ready');
});

check('GitHub Pages composition makes Dungeon progression runtime a blocking prerequisite',()=>{
  const progression='assets/gensrpg/dungeon/progression-runtime-v1.js';
  const perf='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
  assert.ok(deploy.includes(progression),'Pages build must inject progression directly');
  assert.ok(deploy.indexOf(progression)<deploy.indexOf(perf),'Pages build must inject progression before the performance/bootstrap layer');
});

check('hero sheet never leaves the previous bitmap visible while a new hero art is loading',()=>{
  let src='assets/dungeon/creatures/dng_aldren.png';
  const listeners={};
  const img={
    id:'charImage',className:'heroPortrait',alt:'Aldren',title:'',hidden:false,
    style:{display:'',visibility:'visible'},complete:true,naturalWidth:100,
    getAttribute(k){return k==='src'?src:null},
    setAttribute(k,v){if(k==='src'){src=String(v);this.complete=false;this.naturalWidth=0}},
    removeAttribute(){},
    addEventListener(type,fn,opt){listeners[type]=fn},
    removeEventListener(type,fn){if(listeners[type]===fn)delete listeners[type]}
  };
  Object.defineProperty(img,'src',{get(){return src},set(v){src=String(v);img.complete=false;img.naturalWidth=0}});
  const sheet={
    textContent:'Lyra',
    getAttribute(k){return k==='data-hero-id'?'dungeon_lyra':null},
    querySelectorAll(sel){return sel==='img'||/charImage|heroPortrait|heroAvatar|characterPortrait/.test(sel)?[img]:[]}
  };
  const document={
    readyState:'complete',addEventListener(){},
    querySelectorAll(sel){if(/#sheet|heroSheet|characterSheet|dungeonSheet|customSheet/.test(sel))return [sheet];return []}
  };
  const ctx={console,document,current:'dungeon_lyra',CHARS:{dungeon_lyra:{name:'Lyra',image:'slow-lyra.png'}}};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(sheetSrc,ctx,{filename:'gens-dungeon-sheet-art-stability-167899.js'});
  ctx.GensDungeonSheetArtStability167899.repairSheet();
  assert.equal(src,'slow-lyra.png','canonical Lyra source must be selected immediately');
  assert.equal(img.style.visibility,'hidden','Aldren bitmap must disappear immediately while Lyra is still loading');
  assert.equal(typeof listeners.load,'function','the new hero art must reveal itself on load without a timer/observer');
  img.complete=true;img.naturalWidth=100;listeners.load();
  assert.equal(img.style.visibility,'visible','Lyra must become visible as soon as its image load completes');
});

if(failures.length){
  console.error('\nLive preview latency characterization failed as expected:\n- '+failures.join('\n- '));
  process.exitCode=1;
}else console.log('GenSrpG V114.11 live preview latency contract green');
