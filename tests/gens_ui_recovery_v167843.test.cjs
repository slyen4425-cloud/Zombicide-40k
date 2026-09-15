const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

const recoveryPath=path.join(root,'assets','gensrpg','gens-ui-recovery-167843.js');
const gridPath=path.join(root,'assets','dungeon','dungeon-room-grid-capture-167830.js');
const swPath=path.join(root,'service-worker.js');
for(const p of [recoveryPath,gridPath,swPath])assert.ok(fs.existsSync(p),`missing ${p}`);

const styles=[];
function classList(initial=[]){const s=new Set(initial);return {contains:v=>s.has(v),add:v=>s.add(v),remove:v=>s.delete(v),values:()=>[...s]}}
const modal300={id:'drc300Modal',classList:classList(['open'])};
const modal100={id:'drc100Modal',classList:classList([])};
const byId=new Map([['drc300Modal',modal300],['drc100Modal',modal100]]);
const head={appendChild(el){styles.push(el);if(el.id)byId.set(el.id,el)}};
const document={readyState:'complete',head,documentElement:head,getElementById(id){return byId.get(id)||null},createElement(tag){return {tagName:String(tag).toUpperCase(),id:'',textContent:''}},addEventListener(){}};
const context={console,document,window:null,globalThis:null,setTimeout:()=>0};context.window=context;context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(recoveryPath,'utf8'),context,{filename:recoveryPath});

assert.ok(context.GenSrpGUiRecovery167843,'recovery API missing');
assert.equal(context.GenSrpGUiRecovery167843.APP_VERSION,'16.78.114.14');
assert.equal(modal300.classList.contains('open'),false,'Phase 3 modal must be closed on startup');
assert.ok(byId.has('gensUiRecovery167843Styles'),'recovery style missing');
const css=byId.get('gensUiRecovery167843Styles').textContent;
assert.match(css,/#drc300Modal:not\(\.open\)/,'Phase 3 hidden guard missing');
assert.match(css,/#drc100Modal:not\(\.open\)/,'Room Creator hidden guard missing');
assert.match(css,/data-gens-dungeon-view/,'V114.14 single Dungeon view authority missing');
assert.match(css,/dng_wall_block\.jpg/,'V114.14 native wall texture fallback missing');

const grid=fs.readFileSync(gridPath,'utf8');
assert.match(grid,/gens-ui-recovery-167843\.js\?v=167843/,'network-first bootstrap missing');
assert.match(grid,/loadUiRecovery\(\)/,'recovery bootstrap not called');

const sw=fs.readFileSync(swPath,'utf8');
assert.match(sw,/gensrpg-cache-16\.78\.114\.14-view-wall-authority/,'current V114.14 cache missing');
assert.match(sw,/gensrpg-cache-16\.78\.72-perceptual-actor-scale/,'historical V16.78.72 compatibility marker missing');
assert.match(sw,/gensrpg-cache-16\.78\.40-authored-movement/,'authored-movement compatibility marker missing');
assert.match(sw,/gens-ui-recovery-167843\.js/,'recovery asset not precached');
assert.match(sw,/request\.destination==="script"\|\|request\.destination==="style"/,'JS/CSS network-first guard missing');
assert.match(sw,/cache:"reload"/,'install must bypass stale HTTP cache');

console.log('V16.78.114.14 UI recovery/view authority/cache regression: OK');
