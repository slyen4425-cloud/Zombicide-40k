const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const sheetSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const bridgeSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');

const CUSTOM='data:image/png;base64,LYRA_CUSTOM';
let src='assets/dungeon/creatures/dng_aldren.png',srcWrites=0,openCalls=0,statsCalls=0;
const img={
  id:'charImage',className:'heroPortrait',alt:'Aldren',title:'',hidden:true,style:{display:'none',visibility:'hidden'},
  getAttribute(k){return k==='src'?src:null},
  setAttribute(k,v){if(k==='src'){src=String(v);srcWrites++}},
  removeAttribute(){}
};
const sheet={
  textContent:'Lyra',
  getAttribute(k){return k==='data-hero-id'?'dungeon_lyra':null},
  querySelectorAll(sel){return sel==='img'||/charImage|heroPortrait|heroAvatar|characterPortrait/.test(sel)?[img]:[]}
};
const document={
  readyState:'complete',
  body:{appendChild(){}},head:{appendChild(){}},documentElement:{appendChild(){}},
  addEventListener(){},
  querySelector(sel){if(/^script\[data-/.test(sel))return {};return null},
  querySelectorAll(sel){if(/#sheet|heroSheet|characterSheet|dungeonSheet|customSheet/.test(sel))return [sheet];return []},
  getElementById(){return null},
  createElement(){return {setAttribute(){},style:{}}}
};
const ctx={
  console,document,current:'dungeon_lyra',
  CHARS:{dungeon_lyra:{name:'Lyra',image:CUSTOM,avatar:CUSTOM,portrait:CUSTOM}},
  openHeroSheet(){openCalls++;return true},
  renderDungeonHeroStats(){statsCalls++;return true},
  openChar(){return true},openCharacter(){return true},showHeroSheet(){return true},renderCharacterSheet(){return true},renderDungeonHeroSheet(){return true},renderDungeonAttributes(){return true},
  ensureDungeonHeroes(){return true},renderParticipantSelector(){return true},renderMenu(){return true},renderRpgUniverseEditor(){return true},saveRpgUniverseStats(){return true},openHeroCreator(){return true},hcRenderRpgStatsUsage(){return true},openEquipmentEditor(){return true},
  requestAnimationFrame(fn){fn()},
  setTimeout(){return 1},clearTimeout(){},
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(sheetSrc,ctx,{filename:'gens-dungeon-sheet-art-stability-167899.js'});
vm.runInContext(bridgeSrc,ctx,{filename:'gens-dungeon-hero-art-repair-167874.js'});

assert.equal(ctx.openHeroSheet.__gdss167899,undefined,'hero-sheet compatibility helper must not wrap the canonical lifecycle');
assert.equal(ctx.renderDungeonHeroStats.__gdss167899,undefined,'hero stat rerender must stay owned by the normal renderer');
assert.equal(ctx.openHeroSheet.__gdar167874,undefined,'visual bridge must not stack a hero-sheet wrapper');
assert.equal(ctx.renderDungeonHeroStats.__gdar167874,undefined,'visual bridge must not wrap hero stat rerender');

const sameImg=img;
ctx.openHeroSheet();
ctx.renderDungeonHeroStats();
ctx.renderDungeonAttributes();
ctx.openHeroSheet();
ctx.GensDungeonSheetArtStability167899.repairSheet();
ctx.GensDungeonHeroArtRepair167874.repairSheet();
assert.equal(openCalls,2);
assert.equal(statsCalls,1);
assert.equal(img,sameImg,'sheet image node must stay stable across rerenders');
assert.equal(src,CUSTOM,'sheet helper must use Lyra canonical custom art, never Aldren/built-in art');
assert.equal(srcWrites,1,'canonical source must be written at most once, not bounce between competing owners');
assert.equal(ctx.CHARS.dungeon_lyra.image,CUSTOM,'visual helpers must not mutate canonical hero art data');
assert.equal(img.hidden,false);
assert.equal(img.style.display,'');
assert.equal(img.style.visibility,'visible');
console.log('GenSrpG V114.11 hero sheet runtime stable: canonical custom art, no lifecycle wrapper, one src write');
