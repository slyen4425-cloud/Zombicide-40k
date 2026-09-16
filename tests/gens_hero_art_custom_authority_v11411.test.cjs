const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const sheetSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const boardSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-ingame-art-167898.js'),'utf8');
const legacyBoardSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-ingame-hero-art-167898.js'),'utf8');
const bridgeSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');

for(const [name,src] of [['sheet',sheetSrc],['board',boardSrc],['legacy-board',legacyBoardSrc]]){
  assert.doesNotMatch(src,/MutationObserver/,'hero art '+name+' must not own a global DOM observer');
  assert.doesNotMatch(src,/tries\+\+|retries\+\+|setTimeout\(retry|setTimeout\(install/,'hero art '+name+' must not use delayed retries to regain authority');
}
assert.doesNotMatch(boardSrc,/wrap\(R,"?openChar|\["renderDungeonMap"[\s\S]*"openChar"/,'board art helper must not wrap the global hero/sheet render lifecycle');
assert.doesNotMatch(legacyBoardSrc,/wrapCore\(\)/,'legacy board module must not wrap DungeonCore render/show');

const CUSTOM='data:image/png;base64,LYRA_CUSTOM';
let imgSrc='assets/dungeon/creatures/dng_aldren.png',writes=0;
const img={
  id:'charImage',className:'heroPortrait',alt:'Lyra',title:'',hidden:false,style:{display:'',visibility:'visible'},
  getAttribute(k){return k==='src'?imgSrc:null},
  setAttribute(k,v){if(k==='src'){imgSrc=String(v);writes++}},
  removeAttribute(){}
};
const sheet={
  textContent:'Lyra',dataset:{heroId:'dungeon_lyra'},
  getAttribute(k){return k==='data-hero-id'?'dungeon_lyra':null},
  querySelectorAll(sel){return sel==='img'||/charImage|heroPortrait|heroAvatar|characterPortrait/.test(sel)?[img]:[]}
};
const document={
  readyState:'complete',body:{},documentElement:{},head:{},addEventListener(){},
  querySelectorAll(sel){return /#sheet|heroSheet|characterSheet|dungeonSheet|customSheet/.test(sel)?[sheet]:[]},
  querySelector(){return null},createElement(){return {style:{},setAttribute(){}}}
};
const ctx={
  console,document,current:'dungeon_lyra',
  CHARS:{dungeon_lyra:{id:'dungeon_lyra',name:'Lyra',image:CUSTOM,avatar:CUSTOM,portrait:CUSTOM}},
  requestAnimationFrame(fn){fn()},
  setTimeout(){throw new Error('hero portrait authority must not need a delayed timer')},
  clearTimeout(){},
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(sheetSrc,ctx,{filename:'gens-dungeon-sheet-art-stability-167899.js'});
assert.ok(ctx.GensDungeonSheetArtStability167899,'sheet art compatibility API missing');
ctx.GensDungeonSheetArtStability167899.repairSheet();
assert.equal(ctx.CHARS.dungeon_lyra.image,CUSTOM,'sheet helper must never rewrite canonical hero art data');
assert.equal(ctx.CHARS.dungeon_lyra.avatar,CUSTOM,'custom avatar must remain authoritative');
assert.equal(imgSrc,CUSTOM,'Lyra sheet must use the already-selected canonical custom art immediately');
assert.ok(writes<=1,'portrait must not bounce through an intermediate built-in art');

assert.doesNotMatch(bridgeSrc,/c\[key\]\s*=\s*art/,'visual bridge must not overwrite canonical CHARS art with built-in defaults');
assert.doesNotMatch(boardSrc,/c\[key\]\s*=\s*src/,'board helper must not overwrite canonical CHARS art with built-in defaults');
assert.doesNotMatch(legacyBoardSrc,/c\.image\s*=\s*src|c\.avatar\s*=\s*src/,'legacy board helper must not hard-pin canonical CHARS art');

console.log('GenSrpG V114.11 hero art authority target OK: custom hero art stays canonical, immediate, and observer/retry-free');
