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
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gens-v167894-')),target=path.join(tmp,'index.html');
fs.copyFileSync(source,target);cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
const html=fs.readFileSync(target,'utf8');
assert.match(html,/gensCurrentRpgProfileActiveV167894/,'native currentRpgProfile must carry the active-profile fix');
assert.match(html,/editorOpen=document\.getElementById\("rpgUniverseEditorModal"\)\?\.style\?\.display==="block"/);
assert.match(html,/if\(editorOpen&&rpgEditingId\)/,'editing id is authoritative only while the editor is visible');
assert.match(html,/const active=arr\.find\(p=>String\(p\.id\)===String\(activeGameProfileId\(\)\)\)/,'active gameplay profile must be preferred outside the editor');
assert.match(html,/function gensActiveCustomStatDefsV167893\(\)/);
assert.match(html,/active\.has\(String\(def\.id\)\)/);
assert.match(html,/gsrCustomStatDescription/);assert.match(html,/Influence : /);
assert.match(html,/dataset\.gensUnifiedStatGrid="167894"/);
assert.match(html,/GENSRPG_VERSION="16\.78\.94"/);
const start=html.indexOf('/* GenSrpG V16.78.94');const end=html.indexOf('</script>',start);assert.ok(start>=0&&end>start);
const wrapper=html.slice(start,end);
assert.doesNotMatch(wrapper,/MutationObserver|setInterval|setTimeout|createElement\(["']script["']\)|enemyCells\s*=|dungeonRoom\s*=|startDungeonCombat/);

// Exact regression: rpgEditingId may remain stale after the modal closes.
const currentStart=html.indexOf('function currentRpgProfile(){');
const currentEnd=html.indexOf('\nlet rpgEditingId=null;',currentStart);
assert.ok(currentStart>=0&&currentEnd>currentStart);
const currentFn=html.slice(currentStart,currentEnd);
const oldProfile={id:'old_editor',rpgUniverse:{stats:{active:['furtivite'],customStats:[{id:'furtivite',name:'Furtivité'}]}}};
const activeProfile={id:'active_game',rpgUniverse:{stats:{active:['furtivite','mouvement'],customStats:[{id:'furtivite',name:'Furtivité'},{id:'mouvement',name:'Mouvement'}]}}};
const modal={style:{display:'none'}};
const profileSandbox={
  rpgEditingId:'old_editor',GAME_PROFILE_DUNGEON_ID:'dungeon',
  rpgProfiles:()=>[oldProfile,activeProfile],activeGameProfileId:()=> 'active_game',
  document:{getElementById:id=>id==='rpgUniverseEditorModal'?modal:null},globalThis:null
};profileSandbox.globalThis=profileSandbox;
vm.runInNewContext(currentFn,profileSandbox);
assert.equal(profileSandbox.currentRpgProfile().id,'active_game','closed editor must never override the active gameplay profile');
modal.style.display='block';
assert.equal(profileSandbox.currentRpgProfile().id,'old_editor','visible editor must keep the edited profile');
modal.style.display='none';

// Renderer proof with TWO custom stats from the active profile.
const cards=[];const grid={dataset:{},querySelectorAll:()=>[],appendChild:node=>cards.push(node)};
const document={getElementById:id=>id==='dungeonAttributeGrid'?grid:(id==='rpgUniverseEditorModal'?modal:null),createElement:()=>({className:'',dataset:{},innerHTML:''})};
const heroState={statPoints:2,customStats:{furtivite:12,mouvement:4},rpgAttributes:{furtivite:12,mouvement:4}};
const sandbox={
  console,document,current:'hero_test',rpgEditingId:'old_editor',GAME_PROFILE_DUNGEON_ID:'dungeon',
  rpgProfiles:()=>[oldProfile,activeProfile],activeGameProfileId:()=> 'active_game',
  loadState:id=>id==='hero_test'?heroState:null,
  GensGenericStats167887:{descriptionForSource:id=>id==='furtivite'?'Esquive':id==='mouvement'?'Déplacement':'Aucune liaison automatique.'},
  GensCustomStats167879:{change:()=>true},globalThis:null
};sandbox.globalThis=sandbox;
vm.runInNewContext(currentFn,sandbox);vm.runInNewContext(wrapper,sandbox);
assert.equal(sandbox.gensRenderActiveCustomStatsV167892(),true);
assert.equal(cards.length,2,'both active custom stats must render from the active gameplay profile');
assert.deepEqual(cards.map(c=>c.dataset.statId),['furtivite','mouvement']);
assert.equal(grid.dataset.gensActiveCustomStatIds,'furtivite,mouvement');

cp.execFileSync('python3',[patcher,target],{stdio:'pipe'});
const twice=fs.readFileSync(target,'utf8');
assert.equal((twice.match(/gensCurrentRpgProfileActiveV167894/g)||[]).length,1);
assert.equal((twice.match(/function gensUnifiedStatGridV167890\(\)/g)||[]).length,1);
const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){assert.match(site,/gensCurrentRpgProfileActiveV167894/);assert.match(site,/GENSRPG_VERSION="16\.78\.94"/)}
console.log('GenSrpG active-profile custom-stat propagation V16.78.94 regression: OK');
