const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const patcher=path.join(root,'tools','patch_generic_stat_grid_v167890.py');
const source=path.join(root,'index.html');
assert.ok(fs.existsSync(patcher));assert.ok(fs.existsSync(source));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gens-v167893-')),target=path.join(tmp,'index.html');
fs.copyFileSync(source,target);cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
const html=fs.readFileSync(target,'utf8');
assert.match(html,/function renderDungeonAttributes__native167890\(\)\{/);
assert.match(html,/function renderDungeonHeroStats__native167890\(\)\{/);
assert.match(html,/function gensCurrentHeroIdV167891\(\)\{/);
assert.match(html,/function gensCurrentRpgProfileV167893\(\)\{[\s\S]*currentRpgProfile\(\)/,'custom cards must use the lexical RPG profile from the native script');
assert.doesNotMatch(html,/const profile=globalThis\.getActiveGameProfile/,'custom-card source must not depend on the external global gameplay-profile bridge anymore');
assert.match(html,/function gensActiveCustomStatDefsV167893\(\)/);
assert.match(html,/active\.has\(String\(def\.id\)\)/,'active list remains the single activation source');
assert.match(html,/function gensCustomStatValueV167893/,'values must be read directly from the selected hero state');
assert.match(html,/state\?\.customStats\?\.\[id\]/);
assert.match(html,/state\?\.rpgAttributes\?\.\[id\]/);
assert.match(html,/gsrCustomStatDescription/);
assert.match(html,/Influence : /);
assert.match(html,/dataset\.gensActiveCustomStatIds/,'rendered ids must be exposed for exact regression checks');
assert.match(html,/dataset\.gensUnifiedStatGrid="167893"/);
assert.match(html,/GENSRPG_VERSION="16\.78\.93"/);
const start=html.indexOf('/* GenSrpG V16.78.93');
const end=html.indexOf('</script>',start);
assert.ok(start>=0&&end>start);
const wrapper=html.slice(start,end);
assert.doesNotMatch(wrapper,/MutationObserver|setInterval|setTimeout|createElement\(["']script["']\)|enemyCells\s*=|dungeonRoom\s*=|startDungeonCombat/);

// Runtime-like proof with TWO simultaneous custom stats, matching the user's failure case.
const cards=[];
const grid={dataset:{},querySelectorAll:()=>[],appendChild:node=>cards.push(node)};
const document={
  getElementById:id=>id==='dungeonAttributeGrid'?grid:null,
  createElement:()=>({className:'',dataset:{},innerHTML:''})
};
const profile={rpgUniverse:{stats:{
  active:['force','furtivite','mouvement'],
  customStats:[
    {id:'furtivite',name:'Furtivité',icon:'🥷',defaultValue:10,editMode:'points',description:'Se déplacer sans être repéré.'},
    {id:'mouvement',name:'Mouvement',icon:'👣',defaultValue:3,editMode:'points',description:'Mobilité tactique.'}
  ]
}}};
const heroState={statPoints:2,customStats:{furtivite:12,mouvement:4},rpgAttributes:{furtivite:12,mouvement:4}};
const sandbox={
  console,document,current:'hero_test',
  currentRpgProfile:()=>profile,
  loadState:id=>id==='hero_test'?heroState:null,
  GensGenericStats167887:{descriptionForSource:id=>id==='furtivite'?'Esquive':id==='mouvement'?'Déplacement':'Aucune liaison automatique.'},
  GensCustomStats167879:{change:()=>true},
  globalThis:null
};
sandbox.globalThis=sandbox;
vm.runInNewContext(wrapper,sandbox);
assert.equal(sandbox.gensRenderActiveCustomStatsV167892(),true);
assert.equal(cards.length,2,'both active custom stats must render in the same hero grid');
assert.deepEqual(cards.map(c=>c.dataset.statId),['furtivite','mouvement']);
assert.match(cards[0].innerHTML,/Se déplacer sans être repéré\./);
assert.match(cards[0].innerHTML,/Influence : Esquive/);
assert.match(cards[1].innerHTML,/Mobilité tactique\./);
assert.match(cards[1].innerHTML,/Influence : Déplacement/);
assert.equal(grid.dataset.gensActiveCustomStats,'2');
assert.equal(grid.dataset.gensActiveCustomStatIds,'furtivite,mouvement');

cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
const twice=fs.readFileSync(target,'utf8');
assert.equal((twice.match(/function gensCurrentRpgProfileV167893\(\)/g)||[]).length,1);
assert.equal((twice.match(/function gensActiveCustomStatDefsV167893\(\)/g)||[]).length,1);
assert.equal((twice.match(/function gensUnifiedStatGridV167890\(\)/g)||[]).length,1);
const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){
  assert.match(site,/gensCurrentRpgProfileV167893/);
  assert.match(site,/gensActiveCustomStatIds/);
  assert.match(site,/GENSRPG_VERSION="16\.78\.93"/);
}
console.log('GenSrpG lexical-profile custom-stat grid V16.78.93 regression: OK');
