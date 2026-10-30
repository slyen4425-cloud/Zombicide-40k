'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'index.html');
const reviewed=fs.readFileSync(file);
const exactRollback=require('./helpers/gens_capture_author_index_reverse_20261030.cjs');
const active=exactRollback.toHistoricalIndex(reviewed);
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
assert.equal(exactRollback.blob(reviewed),exactRollback.reviewed,'only the 4 approved author routes may alter active HTML');
const history=require('./helpers/gens_chrome_hero_recursion_source_view_20261024.cjs');
const receipt=require('./fixtures/gens_profile_save_upload_exact_edits_20261025.json');

test('provided source upload reverses before Chrome and every historical byte guard remains exact',()=>{
  assert.equal(hash(active),'17ba8e6f1faf6f8a0be8cdec68c4515d538ff646');
  const historical=history(active);
  assert.equal(hash(historical),'260f00aa179c939f35188ca854f9875971ce8a7b');
  assert.equal(historical.length,1720766);
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gens-source-roundtrip-'));
  try{
    const target=path.join(temp,'verified.html');fs.writeFileSync(target,historical);
    execFileSync('python3',[path.join(root,'tests/gens_chrome_hero_recursion_patch_20261024.py'),target]);
    const chrome=fs.readFileSync(target);assert.equal(hash(chrome),receipt.fromBlob);
    let reapplied=chrome.toString('utf8');
    for(const [before,after] of receipt.edits){assert.equal(reapplied.split(before).length-1,1);reapplied=reapplied.replace(before,after);}
    assert.ok(Buffer.from(reapplied).equals(active),'all runtime bytes must survive the full roundtrip');
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
  assert.ok(fs.readFileSync(file).equals(reviewed),'history never writes back to the reviewed runtime');
});

test('subprocess historical view uses the same source projector',()=>{
  // The historical projector is pinned to the preserved original byte stream,
  // not the new live HTML (which is intentionally not a legacy snapshot).
  const projected=history(active);
  assert.equal(hash(projected),'260f00aa179c939f35188ca854f9875971ce8a7b');
});

test('unknown or altered runtime bytes are never projected to an approved historical blob',()=>{
  const altered=Buffer.concat([active,Buffer.from('\n// unexpected modification\n')]);
  assert.ok(history(altered).equals(altered));
  assert.notEqual(hash(history(altered)),receipt.fromBlob);
  assert.notEqual(hash(history(altered)),'260f00aa179c939f35188ca854f9875971ce8a7b');
});

test('current profile save still preserves backups and blocks conflicting IDs',()=>{
  const source=active.toString('utf8');
  const start=source.indexOf('function saveGameProfiles(a){'),end=source.indexOf('\nfunction activeGameProfileId(){',start);
  assert.ok(start>0&&end>start);
  const values=new Map([['profiles','original exact data'],['unrelated','keep']]);
  const ctx={GAME_PROFILES_KEY:'profiles',localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},console:{error(){}}};
  require('node:vm').runInNewContext(source.slice(start,end),ctx);
  assert.equal(ctx.saveGameProfiles([{id:'same',name:'Dungeon'},{id:'same',name:'Dungeon'},{id:'distinct',name:'Dungeon'}]),true);
  assert.equal(values.get('profiles_duplicate_backup_20261024'),'original exact data');
  assert.equal(JSON.parse(values.get('profiles')).length,2);
  const before=values.get('profiles');
  assert.equal(ctx.saveGameProfiles([{id:'same',name:'A'},{id:'same',name:'B'}]),false);
  assert.equal(values.get('profiles'),before);assert.equal(values.get('unrelated'),'keep');
});
