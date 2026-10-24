const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','storage-v1.js'),'utf8');
const summarySrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-world-summary-167820.js'),'utf8');
const PROFILE='gp_mt7ker7t_m2iw9';
const EXACT='gensrpg_shared_entities_v1__'+PROFILE;
const FAMILY='gensrpg_shared_entities_v1__family__creature';

function boot(entries={}){
  const values=new Map(Object.entries(entries).map(([k,v])=>[k,String(v)]));
  const reads=[];
  const localStorage={
    getItem(k){reads.push(String(k));return values.has(k)?values.get(k):null},
    setItem(){throw new Error('World Summary parity fixture must stay read-only')},
    removeItem(){throw new Error('World Summary parity fixture must stay read-only')}
  };
  const ctx={
    console,Math,Date,setTimeout,clearTimeout,localStorage,
    rpgProfiles(){return [{id:PROFILE,heroPool:[],rpgUniverse:{gameplay:{profile:'creature'}}}]},
    loadCustomHeroesMulti(){return []},
    loadCustomEquipment(){return []},
    gensStarterCaptureItems(){return []}
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
  vm.runInContext(summarySrc,ctx,{filename:'gens-world-summary-167820.js'});
  return {api:ctx.GensWorldSummary167820,reads};
}

{
  const seed=JSON.stringify([
    {id:'c1',category:'creature',contentFamily:'creature'},
    {id:'c2',category:'creature',contentFamily:'creature'},
    {id:'c2',category:'creature',contentFamily:'creature'}
  ]);
  const {api,reads}=boot({[EXACT]:seed});
  const summary=api.captureSummary({id:PROFILE,heroPool:[]});
  assert.equal(summary.creatures,2,'exact profile roster keeps unique creature count');
  assert.deepEqual(reads,[EXACT],'non-empty exact roster must keep priority over family fallback');
}

{
  const familySeed=JSON.stringify([
    {id:'f1',contentFamily:'creature',universeId:PROFILE},
    {id:'f2',contentFamily:'creature',universeId:'starter_capture'},
    {id:'f3',contentFamily:'rpg',universeId:'other-world'},
    {id:'f4',contentFamily:'creature'}
  ]);
  const {api,reads}=boot({[EXACT]:'[]',[FAMILY]:familySeed});
  const summary=api.captureSummary({id:PROFILE,heroPool:[]});
  assert.equal(summary.creatures,3,'empty exact roster must keep historical family filtering');
  assert.deepEqual(reads,[EXACT,FAMILY],'family fallback must be read only after empty exact roster');
}

for(const raw of [undefined,'','{bad','null','{}','42','"text"']){
  const entries={};
  if(raw!==undefined)entries[EXACT]=raw;
  const {api,reads}=boot(entries);
  const summary=api.captureSummary({id:PROFILE,heroPool:[]});
  assert.equal(summary.creatures,0,String(raw)+' must preserve empty-array fallback semantics');
  assert.deepEqual(reads,[EXACT,FAMILY],String(raw)+' must preserve fallback key order');
}

console.log(JSON.stringify({
  scenario:'Phase 4 World Summary storage parity',
  profileKey:'gensrpg_shared_entities_v1__<profileId>',
  familyKey:FAMILY,
  fallback:[],
  writes:0,
  formatMigration:false
},null,2));
