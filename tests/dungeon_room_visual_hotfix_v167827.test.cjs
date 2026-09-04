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
const panel=el('drv167826Panel'),sel=el('drv167826Context'),btn=el('drv167826Toggle'),legacy=el('dzc167824Launch'),randomPanel=el('drr167822Panel');sel.value='world-1::zone-a';let changed=0;sel.onchange=()=>{changed++};for(const e of [panel,sel,btn,legacy,randomPanel])elements.set(e.id,e);
const head={appendChild(x){if(x.id)elements.set(x.id,x)}};const document={readyState:'loading',head,body:{appendChild(x){if(x.id)elements.set(x.id,x)}},documentElement:{},getElementById(id){return elements.get(id)||null},createElement(){return el()},addEventListener(){}};
const context={console,document,setTimeout(){return 1},MutationObserver:function(){throw new Error('global MutationObserver interdit dans le hotfix UI')},DungeonRoomVisualConfig167826:{decorateGrid(){}}};context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-room-visual-hotfix-167827.js'});
const api=context.DungeonRoomVisualHotfix167827;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.29');assert.equal(api.autoSelectVisibleContext(),true);assert.equal(changed,1);assert.equal(api.autoSelectVisibleContext(),true);assert.equal(changed,1);api.repairButton();assert.equal(btn.disabled,false);api.retireLegacyUi();assert.equal(legacy.style.display,'none');assert.equal(randomPanel.style.display,'none');
assert.doesNotMatch(src,/new\s+MutationObserver/,'le hotfix contexte ne doit plus observer tout le DOM');
assert.doesNotMatch(loader,/new\s+MutationObserver/,'le loader/feedback ne doit plus observer tout le DOM');
assert.match(loader,/dungeon-room-visual-hotfix-167827\.js\?v=167832/);assert.match(loader,/dungeon-room-visual-config-167826\.js\?v=167832/);assert.match(loader,/dungeon-room-grid-capture-167830\.js\?v=167832/);assert.match(loader,/dungeon-room-content-ui-167831\.js\?v=167832/);assert.match(sw,/gensrpg-cache-16\.78\.32-random-content-world-selection/);assert.match(sw,/dungeon-room-visual-config-167826\.js/);assert.match(sw,/dungeon-room-visual-hotfix-167827\.js/);assert.match(sw,/dungeon-room-grid-capture-167830\.js/);assert.match(sw,/dungeon-room-content-ui-167831\.js/);
const htmlArg=process.argv[2];if(htmlArg){const site=path.dirname(path.resolve(htmlArg));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-visual-hotfix-167827.js')));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-grid-capture-167830.js')));assert.ok(fs.existsSync(path.join(site,'assets','dungeon','dungeon-room-content-ui-167831.js')));const builtLoader=fs.readFileSync(path.join(site,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');assert.match(builtLoader,/dungeon-room-visual-hotfix-167827\.js\?v=167832/);assert.match(builtLoader,/dungeon-room-grid-capture-167830\.js\?v=167832/);assert.match(builtLoader,/dungeon-room-content-ui-167831\.js\?v=167832/);assert.doesNotMatch(builtLoader,/new\s+MutationObserver/)}
console.log('Dungeon Room visual hotfix V16.78.32 loading regression: OK');
require('./dungeon_room_template_content_v167828.test.cjs');
