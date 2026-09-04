const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-large-room-support-167834.js'),'utf8');
let config={size:'large',roomGeometry:'fixed'};
const ctx={console,Math:Object.create(Math),Date,globalThis:null,window:null,loadDungeonConfig(){return config},DungeonCore01:{render(){},show(){}}};ctx.globalThis=ctx;ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-large-room-support-167834.js'});
const api=ctx.DungeonLargeRoom167834;assert.ok(api);assert.equal(api.MAX_SIZE,15);assert.equal(api.MIN_SIZE,6);assert.equal(api.gridSize(),15,'large generated rooms must reach 15x15');
let map=api.generate('enemy',5);assert.equal(map.size,15);assert.equal(map.width,15);assert.equal(map.height,15);assert.equal(map.cells.length,225);assert.equal(map.largeRoom167834,true);assert.equal(map.enemies.length,5);assert.ok(map.entryIdx>=0&&map.exitIdx>=0);
config={size:'medium',roomGeometry:'fixed'};assert.equal(api.gridSize(),9);
config={size:'small',roomGeometry:'fixed'};assert.equal(api.gridSize(),6);
config={roomGeometry:'random'};for(let i=0;i<100;i++){const n=api.gridSize();assert.ok(n>=6&&n<=15,'random size must stay inside 6..15')}
config={roomSizeCells:99};assert.equal(api.gridSize(),15,'explicit values are clamped to supported maximum');
config={roomSizeCells:3};assert.equal(api.gridSize(),6,'explicit values are clamped to supported minimum');
assert.doesNotMatch(src,/Math\.min\(9/,'new generator must not retain historical 9x9 cap');
console.log('Dungeon large-room V16.78.34 regressions: OK');
