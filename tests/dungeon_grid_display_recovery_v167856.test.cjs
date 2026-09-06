const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-grid-display-recovery-167856.js'),'utf8');
let renders=0,paints=0,syncs=0;const timers=[];
function baseRender(){renders++;return 'ok'}
function baseShow(){return 'show'}
function badRender(){return baseRender()};badRender.__cacheUx167853=true;badRender.__cacheUxOriginal=baseRender;
function badShow(){return baseShow()};badShow.__cacheUx167853=true;badShow.__cacheUxOriginal=baseShow;
const context={console,setTimeout(fn,ms){timers.push({fn,ms});return timers.length},DungeonCore01:{render:badRender,show:badShow},DungeonZoneLinks167846:{paintTravelButtons(){paints++}},DungeonAuthoredRuntime167839:{syncActionButton(){syncs++}}};context.window=context;context.globalThis=context;context.document={readyState:'complete'};
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-grid-display-recovery-167856.js'});
while(timers.length)timers.shift().fn();
assert.equal(context.DungeonCore01.render,baseRender,'stale cache UX render wrapper must be removed');
assert.equal(context.DungeonCore01.show,baseShow,'stale cache UX show wrapper must be removed');
assert.ok(renders>0,'normal renderer must be called after recovery');assert.ok(paints>0);assert.ok(syncs>0);
console.log('Dungeon grid display recovery V16.78.56: OK');
