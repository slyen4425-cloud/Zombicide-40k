const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-hotfix-167827.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

function classList(){const s=new Set();return {add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},contains(x){return s.has(x)}}}
const elements=new Map();
function el(id=''){return {id,value:'',disabled:false,title:'',dataset:{},innerHTML:'',textContent:'',classList:classList(),style:{setProperty(k,v){this[k]=v}},attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},querySelector(){return null}}}
const panel=el('drv167826Panel');const sel=el('drv167826Context');const btn=el('drv167826Toggle');const legacy=el('dzc167824Launch');const randomPanel=el('drr167822Panel');
sel.value='world-1::zone-a';let changed=0;sel.onchange=()=>{changed++};
elements.set(panel.id,panel);elements.set(sel.id,sel);elements.set(btn.id,btn);elements.set(legacy.id,legacy);elements.set(randomPanel.id,randomPanel);
const head={appendChild(x){if(x.id)elements.set(x.id,x)}};
const document={readyState:'loading',head,body:{appendChild(x){if(x.id)elements.set(x.id,x)}},documentElement:{},getElementById(id){return elements.get(id)||null},createElement(){return el()},addEventListener(){}};
const context={console,document,setTimeout(){return 1},MutationObserver:function(){this.observe=()=>{}},DungeonRoomVisualConfig167826:{decorateGrid(){}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-room-visual-hotfix-167827.js'});
const api=context.DungeonRoomVisualHotfix167827;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.27');
assert.equal(api.autoSelectVisibleContext(),true,'la première zone visible doit devenir le vrai contexte interne');assert.equal(changed,1,'le select visible doit déclencher son onchange une fois');
assert.equal(api.autoSelectVisibleContext(),true);assert.equal(changed,1,'la sélection automatique ne doit pas boucler');
api.repairButton();assert.equal(btn.disabled,false,'le bouton doit être actif dès qu’une zone visible possède une valeur');
api.retireLegacyUi();assert.equal(legacy.style.display,'none');assert.equal(randomPanel.style.display,'none','le vieux panneau aléatoire Dungeon doit être masqué');
assert.match(loader,/dungeon-room-visual-hotfix-167827\.js\?v=167827/,'le loader doit charger le hotfix V16.78.27');
assert.match(loader,/dungeon-room-visual-config-167826\.js\?v=167827/,'le configurateur doit être cache-busté en V16.78.27');
assert.match(sw,/gensrpg-cache-16\.78\.27-config-context/,'le cache PWA doit être réellement remonté');
assert.match(sw,/dungeon-room-visual-config-167826\.js/);assert.match(sw,/dungeon-room-visual-hotfix-167827\.js/);
const htmlArg=process.argv[2];
if(htmlArg){
  const site=path.dirname(path.resolve(htmlArg));
  assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-visual-hotfix-167827.js')),'le hotfix V16.78.27 doit exister dans le site final construit');
  const builtLoader=fs.readFileSync(path.join(site,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');
  assert.match(builtLoader,/dungeon-room-visual-hotfix-167827\.js\?v=167827/,'le loader du site final doit demander le hotfix V16.78.27');
}
console.log('Dungeon Room visual hotfix V16.78.27 context regression: OK');
