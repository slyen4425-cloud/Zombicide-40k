const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-100.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');

const values=new Map();
const ctx={
  console,Math,Date,setTimeout,clearTimeout,
  localStorage:{
    getItem(k){return values.has(k)?values.get(k):null},
    setItem(k,v){values.set(k,String(v))},
    removeItem(k){values.delete(k)}
  }
};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'dungeon-room-creator-100.js'});

const d=ctx.DungeonRoomCreator100;
assert.ok(d,'Room Creator API missing');
assert.equal(d.VERSION,'1.0.0');
assert.equal(d.APP_VERSION,'16.78.14');
assert.equal(d.MAX_SIZE,30);

let room=d.createRoom({name:'Grande salle test',width:15,height:15});
assert.equal(room.width,15);
assert.equal(room.height,15);
assert.equal(room.cells.length,225);
assert.equal(d.validateRoom(room).valid,true,'new room should start with one entry and one exit');

room=d.applyTool(room,10,'entry');
assert.equal(d.validateRoom(room).entries,1,'only one entry is allowed');
assert.equal(room.cells[10].object,'entry');
room=d.applyTool(room,20,'enemy');
room=d.applyTool(room,21,'trap');
room=d.applyTool(room,22,'chest');
room=d.applyTool(room,23,'boss');
let validation=d.validateRoom(room);
assert.equal(validation.objects.enemy,1);
assert.equal(validation.objects.trap,1);
assert.equal(validation.objects.chest,1);
assert.equal(validation.objects.boss,1);

room=d.resizeRoom(room,20,18);
assert.equal(room.cells.length,360);
assert.equal(room.cells[1*20+5].object,'enemy','resize must preserve coordinates');

const huge=d.createRoom({width:99,height:99});
assert.equal(huge.width,30);
assert.equal(huge.height,30);
assert.equal(huge.cells.length,900);

const saved=d.upsertRoom(room);
assert.equal(d.loadLibrary().length,1);
assert.equal(d.findRoom(saved.id).width,20);
const copy=d.duplicateRoomById(saved.id);
assert.ok(copy&&copy.id!==saved.id);
assert.equal(d.loadLibrary().length,2);
d.deleteRoomById(saved.id);
assert.equal(d.loadLibrary().length,1);

assert.match(src,/dungeonAdvancedEditor/,'launcher must target the Dungeon editor');
assert.match(src,/drc100Launcher/,'room creator launcher missing');
assert.match(src,/30×30/,'large room UI missing');
for(const tool of ['entry','exit','enemy','boss','trap','chest','merchant','rest','puzzle'])assert.ok(d.TOOLS[tool],`missing tool ${tool}`);
assert.match(sw,/const CACHE_NAME = "gensrpg-cache-[^"]+"/,'PWA cache missing');
assert.match(sw,/dungeon-room-creator-100\.js/,'Room Creator must be precached');
assert.match(workflow,/Charger les modules Dungeon externes/,'Pages module injection step missing');
assert.match(workflow,/dungeon-room-creator-100\.js/,'Pages must load Room Creator');
assert.match(workflow,/html\.replace\("<\/body>"/,'Room Creator must be injected before body close');

console.log('Dungeon Room Creator 1.0 regressions: OK');
