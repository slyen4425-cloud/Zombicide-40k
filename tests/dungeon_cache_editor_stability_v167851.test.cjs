const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-cache-editor-stability-167851.js'),'utf8');
const timers=[];
let openCalls=0;
const graph={id:'g1',name:'Test',nodes:[{id:'A'},{id:'B'}],edges:[{id:'e1'}],cacheBindings:[{sourceNodeId:'A',sourceIndex:2,targetRoomId:'attic'}]};
const validationBox={className:'',innerHTML:''};
const nameInput={value:'Test'};
const listeners={};
const document={
 readyState:'complete',
 addEventListener(type,fn,capture){(listeners[type]||(listeners[type]=[])).push({fn,capture})},
 getElementById(id){if(id==='drc300Name')return nameInput;if(id==='drc300Validation')return validationBox;return null}
};
const builder={
 loadLibrary(){return [JSON.parse(JSON.stringify(graph))]},
 validation(g){return {valid:true,errors:[],warnings:[],nodeCount:g.nodes.length,edgeCount:g.edges.length,cacheCount:0}},
 open(){openCalls++;return true}
};
const context={console,JSON,Math,Date,document,setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},DungeonWorldBuilder167821:builder,DungeonZoneLinks167846:{refreshEditors(){},renderWorldCacheBindings(){}}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-cache-editor-stability-167851.js'});
const api=context.DungeonCacheEditorStability167851;
assert.ok(api);assert.equal(api.APP_VERSION,'16.78.51');
assert.equal(api.actualCacheCount(graph),1,'secondary cache binding must count directly from cacheBindings');
const oldOpen=builder.open;
assert.equal(api.shieldLegacyOpen(),true);
builder.open('g1');
assert.equal(openCalls,0,'legacy WorldBuilder.open must be suppressed during Lier');
assert.notEqual(builder.open,oldOpen);
while(timers.length)timers.shift()();
assert.equal(builder.open,oldOpen,'legacy open must be restored after the link action');
assert.equal(api.syncSummary(),true);
assert.match(validationBox.innerHTML,/2 pièce\(s\)/);
assert.match(validationBox.innerHTML,/1 connexion\(s\)/);
assert.match(validationBox.innerHTML,/1 cache\(s\) liée\(s\)/,'summary must show the real secondary cache count');
console.log('Dungeon cache editor stability V16.78.51: OK');
