const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-final-exit-167875.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={getItem(k){return store.has(k)?store.get(k):null},setItem(k,v){store.set(k,String(v))}};
let popup=null,homeCalls=0,renderCalls=0;
const btn={textContent:'EXPLORER',disabled:false,onclick(){return 'normal'},dataset:{}};
const elements={dc01Explore:btn,gensRootHome:{style:{display:'none'}}};
const document={readyState:'complete',body:{style:{removeProperty(){}}},documentElement:{style:{removeProperty(){}}},getElementById(id){return elements[id]||null},addEventListener(){}};
const graph={id:'world_1'};
const authored={active(){return true},graph(){return graph},plan(){return {currentNodeId:'last',outgoing:[]}},positional(){return true}};
const core={explore(){return 'normal-explore'},render(){renderCalls++;return true},show(){renderCalls++;return true},modal(title,text,cb){popup={title,text,cb};return true}};
const timers=[];
const ctx={console,Math,Date,localStorage,document,DungeonAuthoredRuntime167839:authored,DungeonCore01:core,markSessionActive(){},showGensRootHome(){homeCalls++},setTimeout(fn,ms){timers.push({fn,ms});return timers.length}};
ctx.window=ctx;ctx.globalThis=ctx;
function save(pos,extra={}){localStorage.setItem(RT,JSON.stringify({participants:['aldren'],index:0,room:3,positions:{aldren:pos},last:{authoredRuntime167839:true,worldDungeonId:'world_1',worldNodeId:'last',map:{cells:['floor','cache','exit'],exitIdx:2}},branch:null,...extra}))}
save(1);
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-authored-final-exit-167875.js'});
const api=ctx.DungeonAuthoredFinalExit167875;
assert.ok(api);assert.equal(api.APP_VERSION,'16.78.79');
assert.equal(core.explore(),'normal-explore');
let state=api.finalState();assert.equal(state.hasExit,true);assert.equal(state.atExit,false);
const originalText=btn.textContent;api.syncButton();assert.equal(btn.textContent,originalText);assert.equal(api.finish(),false);

save(2,{authored167847ReturnStacks:{aldren:[{sourceNodeId:'last',sourceIndex:1,targetNodeId:'branch_last_1_cache'}]}});
assert.equal(api.finalState(),null,'une branche secondaire/cache ne doit jamais être considérée comme fin de donjon');
api.syncButton();assert.equal(btn.textContent,originalText,'aucun bouton terminer dans une cache/branche secondaire');

save(2);api.syncButton();assert.equal(btn.textContent,'🏆 TERMINER LE DONJON');
assert.equal(api.finish(),true);assert.equal(popup?.title,'🏆 Donjon terminé');assert.equal(homeCalls,0);popup.cb();
while(timers.length){const t=timers.shift();if(t.ms<=160)t.fn()}
assert.ok(homeCalls>=1);assert.equal(elements.gensRootHome.style.display,'block');
assert.doesNotMatch(src,/wrapExplore\s*\(/);
console.log('Authored final exit V16.78.79: OK');
