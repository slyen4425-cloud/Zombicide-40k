const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-action-fix-167857.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2',PRIMARY='gensrpg_dungeon_primary_selection_v167833';
const rt={room:3,index:0,participants:['lyra'],positions:{lyra:4},last:{authoredRuntime167839:true,worldDungeonId:'world-1',worldNodeId:'A'}};
const store={[RT]:JSON.stringify(rt),[PRIMARY]:JSON.stringify({kind:'world',id:'world-1'})},listeners={},timers=[];let paints=0,syncs=0,visuals=0,refreshClicks=0;
function style(){return {display:'',setProperty(k,v){if(k==='display')this.display=v},removeProperty(k){if(k==='display')this.display=''}}}
function control(text){return {textContent:text,value:'',dataset:{},style:style(),hidden:false,disabled:false,setAttribute(){},removeAttribute(){},getAttribute(){return''},click(){refreshClicks++},closest(sel){return sel.includes('button')?this:null}}}
const legacy=control('🔍 FOUILLER LE COFFRE'),exact=control('🎁 Ouvrir coffre legendary'),refresh=control('↻ ACTUALISER'),other=control('✅ FIN DU TOUR');
const cell={closest(sel){return sel==='#dc047RoomBoard .dc047Grid .dc047Cell'?this:null}};
const document={readyState:'complete',addEventListener(n,fn){(listeners[n]||(listeners[n]=[])).push(fn)},querySelectorAll(){return [legacy,exact,refresh,other]}};
const context={console,JSON,Math,Date,document,localStorage:{getItem(k){return store[k]||null}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},DungeonZoneLinks167846:{paintTravelButtons(){paints++}},DungeonAuthoredRuntime167839:{syncActionButton(){syncs++}},DungeonAuthoredCacheVisual167852:{sync(){visuals++}},DungeonZoneContent167824:{install(){}},DungeonCore01:{render(){},show(){}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-action-fix-167857.js'});
const api=context.DungeonAuthoredActionFix167857;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.60');assert.equal(api.builtSelected(),true);assert.equal(api.positionKey(JSON.parse(store[RT])),'lyra|3|4');
api.syncActions();assert.equal(legacy.hidden,true);assert.equal(legacy.style.display,'none');assert.equal(exact.hidden,false);assert.equal(refresh.hidden,false);assert.ok(paints>0&&syncs>0&&visuals>0);
let prevented=false,stopped=false;api.blockLegacyChestClick({target:legacy,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert.equal(prevented,true);assert.equal(stopped,true);
for(const fn of listeners.click||[])fn({target:cell,preventDefault(){},stopImmediatePropagation(){}});
assert.ok(timers.some(t=>t.ms===25)&&timers.some(t=>t.ms===1400),'movement watcher must wait for the persisted position');
const zero=timers.findIndex(t=>t.ms===0);if(zero>=0)timers.splice(zero,1)[0].fn();assert.equal(refreshClicks,0,'Actualiser must not fire before the persisted hero position changes');
const moved=JSON.parse(store[RT]);moved.positions.lyra=5;store[RT]=JSON.stringify(moved);
while(timers.length){const t=timers.shift();t.fn();if(refreshClicks)break}
assert.equal(refreshClicks,1,'the real Actualiser control must fire once after the committed movement is visible');assert.ok(paints>1);
const plain=JSON.parse(store[RT]);delete plain.last.authoredRuntime167839;store[RT]=JSON.stringify(plain);api.syncLegacyChestButton();assert.equal(legacy.hidden,true,'World Builder selection alone must keep legacy chest hidden even if authored runtime flag lags');
store[PRIMARY]=JSON.stringify({kind:'random',id:'x'});api.syncLegacyChestButton();assert.equal(legacy.hidden,false,'legacy control must restore outside World Builder authored context');
console.log('Dungeon authored action fix V16.78.60: OK');
