const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
assert.doesNotThrow(()=>new Function(src),'hero art bridge syntax');
const ctx={console,globalThis:null,window:null,document:null,setTimeout:()=>0,requestAnimationFrame:null,
 CHARS:{dungeon_aldren:{name:'Aldren',image:'assets/old-crossed-swords.svg',avatar:'assets/old-crossed-swords.svg'}},
 applyCustomHeroesMulti:function(){this.CHARS.dungeon_aldren.image='assets/old-crossed-swords.svg';this.CHARS.dungeon_aldren.avatar='assets/old-crossed-swords.svg';return true;}
};ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-dungeon-hero-art-repair-167874.js'});
const api=ctx.GensDungeonHeroArtRepair167874;assert.ok(api);api.install();
assert.match(String(ctx.applyCustomHeroesMulti),/__gdar167874|old\.apply/,'late CHARS rebuild must be hooked');
ctx.applyCustomHeroesMulti();
assert.equal(ctx.CHARS.dungeon_aldren.image,'assets/dungeon/creatures/dng_aldren.png','Aldren image must survive/recover after CHARS rebuild');
assert.equal(ctx.CHARS.dungeon_aldren.avatar,'assets/dungeon/creatures/dng_aldren.png','Aldren avatar must survive/recover after CHARS rebuild');
console.log('V16.78.105 Aldren art: late CHARS rebuild -> official PNG restored');
