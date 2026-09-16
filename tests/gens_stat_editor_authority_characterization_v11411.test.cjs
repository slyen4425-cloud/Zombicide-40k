const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

function walk(dir,out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p,out);
    else if(/\.(?:js|html|cjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}
function snippets(src,needle,radius=420){
  const out=[]; let at=0;
  while((at=src.indexOf(needle,at))>=0){
    out.push(src.slice(Math.max(0,at-radius),Math.min(src.length,at+needle.length+radius)).replace(/\s+/g,' '));
    at+=needle.length;
  }
  return out;
}

const files=walk(root);
const probes=['rpgStatsList','renderRpgUniverseEditor','data-stat-card','data-stat-active'];
const hits=[];
for(const file of files){
  const rel=path.relative(root,file).replaceAll('\\','/');
  if(rel.startsWith('tests/')) continue;
  const src=fs.readFileSync(file,'utf8');
  const counts={};
  for(const p of probes){
    const n=src.split(p).length-1;
    if(n) counts[p]=n;
  }
  if(Object.keys(counts).length) hits.push({rel,counts,src});
}

console.log('=== STAT EDITOR AUTHORITY INVENTORY ===');
for(const h of hits){
  console.log('\nFILE',h.rel,JSON.stringify(h.counts));
  for(const needle of ['rpgStatsList','renderRpgUniverseEditor']){
    for(const [i,s] of snippets(h.src,needle).entries()) console.log(`  ${needle}#${i+1}: ${s}`);
  }
}

const canonicalPath=path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const canonical=fs.readFileSync(canonicalPath,'utf8');
assert.match(canonical,/id="rpgStatsList"|getElementById\("rpgStatsList"\)/,'canonical stats module must target the stat editor host');
assert.match(canonical,/data-stat-card/,'canonical stats module must own stat cards');
assert.match(canonical,/data-add-effect/,'canonical stats module must expose editable effects');
assert.match(canonical,/type="number"/,'canonical stats module must expose numeric settings');

console.log('\nCharacterization complete:',hits.length,'runtime files reference stat-editor authority markers.');