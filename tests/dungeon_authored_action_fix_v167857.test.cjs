const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-action-fix-167857.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const rt={room:3,index:0,participants:['lyra'],positions:{lyra:4},last:{authoredRuntime167839:true,worldDungeonId:'world-1',worldNodeId:'A'}};
const store={[RT]:JSON.stringify(rt)},listeners={},timers=[];let paints=0,syncs=0,visuals=0,renders=0;
function style(){return {display:'',setProperty(k,v){if(k==='display')this.display=v},removeProperty(k){if(k==='display')this.display=''}}}
function control(text,kind='button'){const el={textContent:text,dataset:{},style:style(),hidden:false,setAttribute(){},removeAttribute(){},closest(sel){return sel.includes(kind)?this:null}};return el}
const legacy=control('🔍 FOUILLER LE COFFRE'),exact=control('🎁 Ouvrir coffre legendary'),other=control('✅ FIN DU TOUR');
const cell={closest(sel){return sel==='#dc047RoomBoard .dc047Grid .dc047Cell'?this:null}};
const document={readyState:'complete',addEventListener(n,fn){(listeners[n]||(listeners[n]=[])).push(fn)},querySelectorAll(){return [legacy,exact,other]}};
const context={console,JSON,Math,Date,document,localStorage:{getItem(k){return store[k]||null}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},DungeonZoneLinks167846:{paintTravelButtons(){paints++}},DungeonAuthoredRuntime167839:{syncActionButton(){syncs++}},DungeonAuthoredCacheVisual167852:{sync(){visuals++}},DungeonCore01:{render(){renders++},show(){}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-action-fix-167857.js'});
const api=context.DungeonAuthoredActionFix167857;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.58');
api.syncActions();assert.equal(legacy.hidden,true,'legacy generic chest control must be hidden in authored worlds');assert.equal(legacy.style.display,'none');assert.equal(exact.hidden,false,'exact legendary button must stay visible');assert.equal(other.hidden,false);assert.ok(paints>0&&syncs>0&&visuals>0);
let prevented=false,stopped=false;api.blockLegacyChestClick({target:legacy,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert.equal(prevented,true);assert.equal(stopped,true,'legacy generic chest click must be blocked');
for(const fn of listeners.click||[])fn({target:cell,preventDefault(){},stopImmediatePropagation(){}});
assert.ok(timers.some(t=>t.ms===60),'grid movement must schedule one native Dungeon refresh');while(timers.length)timers.shift().fn();assert.ok(renders>=1,'native Dungeon render must run after grid movement');assert.ok(paints>1,'cache/return actions must repaint after native refresh');
const plain=JSON.parse(store[RT]);delete plain.last.authoredRuntime167839;store[RT]=JSON.stringify(plain);api.syncLegacyChestButton();assert.equal(legacy.hidden,false,'legacy control must be restored outside authored runtime');
console.log('Dungeon authored action fix V16.78.58: OK');
