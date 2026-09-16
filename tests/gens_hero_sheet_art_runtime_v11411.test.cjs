const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const sheetSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const boardSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-ingame-art-167898.js'),'utf8');

let sheetSrcValue='native-sheet.png',boardSrcValue='old-board.png',openCalls=0;
const sheetImg={id:'charImage',alt:'Aldren',style:{},hidden:false,getAttribute(k){return k==='src'?sheetSrcValue:null},setAttribute(k,v){if(k==='src')sheetSrcValue=String(v)}};
const boardImg={alt:'Aldren',style:{},hidden:false,getAttribute(k){return k==='src'?boardSrcValue:null},setAttribute(k,v){if(k==='src')boardSrcValue=String(v)}};
const token={dataset:{unitId:'dungeon_aldren'},title:'Aldren',style:{removeProperty(){}},querySelector(sel){return sel==='img'?boardImg:null},querySelectorAll(){return []}};
const boardRoot={querySelectorAll(){return [token]}};
const document={
  readyState:'complete',
  addEventListener(){},
  querySelectorAll(sel){if(/#dc047RoomBoard|#dungeonMap|#dungeonBoard/.test(sel))return [boardRoot];return []},
  createElement(){return {style:{},setAttribute(){}}}
};
const ctx={console,document,current:'dungeon_aldren',CHARS:{dungeon_aldren:{name:'Aldren',image:'old.png',avatar:'old.png'}},openHeroSheet(){openCalls++;return true}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
const originalOpen=ctx.openHeroSheet;
vm.runInContext(sheetSrc,ctx,{filename:'gens-dungeon-sheet-art-stability-167899.js'});
assert.equal(ctx.openHeroSheet,originalOpen,'retired V99 must not wrap hero-sheet lifecycle');
assert.equal(ctx.GensDungeonSheetArtStability167899.repairSheet(),0);
assert.equal(sheetSrcValue,'native-sheet.png','retired V99 must not rewrite the native portrait');

vm.runInContext(boardSrc,ctx,{filename:'gens-dungeon-hero-ingame-art-167898.js'});
ctx.GensDungeonHeroIngameArt167898.repairBoard();
assert.equal(boardSrcValue,'assets/dungeon/creatures/dng_aldren.png','board owner still repairs the Dungeon token');
assert.equal(sheetSrcValue,'native-sheet.png','board repair must leave #charImage untouched');
ctx.openHeroSheet();
assert.equal(openCalls,1,'native hero-sheet opener remains callable and unwrapped');
console.log('GenSrpG V114.11 hero art runtime OK: board token repaired while native sheet portrait remains untouched');
