const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-action-fix-167857.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2',PRIMARY='gensrpg_dungeon_primary_selection_v167833';
const rt={room:3,index:0,participants:['lyra'],positions:{lyra:4},last:{authoredRuntime167839:true,worldDungeonId:'world-1',worldNodeId:'A'}};
const store={[RT]:JSON.stringify(rt),[PRIMARY]:JSON.stringify({kind:'world',id:'world-1'})},listeners={},timers=[];let paints=0,syncs=0,visuals=0,renders=0,persists=0;
function style(){return {display:'',setProperty(k,v){if(k==='display')this.display=v},removeProperty(k){if(k==='display')this.display=''}}}
function control(text){return {textContent:text,value:'',dataset:{},style:style(),hidden:false,disabled:false,setAttribute(){},removeAttribute(){},getAttribute(){return''},closest(sel){return sel.includes('button')?this:null}}}
const legacy=control('🔍 FOUILLER LE COFFRE'),exact=control('🎁 Ouvrir coffre legendary'),other=control('✅ FIN DU TOUR');
const document={readyState:'complete',addEventListener(n,fn){(listeners[n]||(listeners[n]=[])).push(fn)},querySelectorAll(){return [legacy,exact,other]}};
const spatial={persist(x){persists++;store[RT]=JSON.stringify(x);return true}};
const context={console,JSON,Math,Date,document,localStorage:{getItem(k){return store[k]||null}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},DungeonSpatial313:spatial,DungeonZoneLinks167846:{paintTravelButtons(){paints++}},DungeonAuthoredRuntime167839:{syncActionButton(){syncs++}},DungeonAuthoredCacheVisual167852:{sync(){visuals++}},DungeonCore01:{render(){renders++},show(){}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-action-fix-167857.js'});
const api=context.DungeonAuthoredActionFix167857;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.61');assert.equal(api.builtSelected(),true);assert.equal(context.DungeonSpatial313.persist.__daf167861,true);
api.syncActions();assert.equal(legacy.hidden,true);assert.equal(legacy.style.display,'none');assert.equal(exact.hidden,false);assert.ok(paints>0&&syncs>0&&visuals>0);
let prevented=false,stopped=false;api.blockLegacyChestClick({target:legacy,preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});assert.equal(prevented,true);assert.equal(stopped,true);
const moved=JSON.parse(store[RT]);moved.positions.lyra=5;context.DungeonSpatial313.persist(moved);assert.equal(persists,1);assert.ok(timers.some(t=>t.ms===0),'committed movement must queue immediate UI refresh');while(timers.length)timers.shift().fn();assert.ok(renders>=1,'native Dungeon render must run after committed movement');assert.ok(paints>1&&syncs>1&&visuals>1,'context actions must refresh after persisted movement');
const beforeRenders=renders;context.DungeonSpatial313.persist(JSON.parse(store[RT]));while(timers.length)timers.shift().fn();assert.equal(renders,beforeRenders,'same persisted position must not trigger another movement render');
const plain=JSON.parse(store[RT]);delete plain.last.authoredRuntime167839;store[RT]=JSON.stringify(plain);api.syncLegacyChestButton();assert.equal(legacy.hidden,true,'World Builder selection alone keeps legacy chest hidden');store[PRIMARY]=JSON.stringify({kind:'random',id:'x'});api.syncLegacyChestButton();assert.equal(legacy.hidden,false,'legacy control restores outside authored World Builder');
console.log('Dungeon authored action fix V16.78.61: OK');
