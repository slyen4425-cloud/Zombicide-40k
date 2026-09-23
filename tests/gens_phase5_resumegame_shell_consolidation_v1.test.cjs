const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function scripts(source){
  const out=[];
  const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=re.exec(source))){
    const attrs=m[1]||'',body=m[2]||'';
    const id=(attrs.match(/\bid=["']([^"']+)["']/i)||[])[1]||'no-id';
    const type=(attrs.match(/\btype=["']([^"']+)["']/i)||[])[1]||'';
    out.push({id,type,body,index:m.index});
  }
  return out;
}
const active=scripts(html).filter(s=>!/application\/x-gensrpg-disabled/i.test(s.type));

const shellOwners=[];
const wrapperOwners=[];
for(const s of active){
  if(/function\s+resumeGame\s*\(/.test(s.body))shellOwners.push(s);
  if(/window\.resumeGame\s*=\s*function\s*\(/.test(s.body))wrapperOwners.push(s);
}

assert.equal(shellOwners.length,1,'Phase 5 target requires exactly one Shell resumeGame declaration');
assert.equal(wrapperOwners.length,0,'Phase 5 target forbids active global resumeGame wrappers after Shell consolidation');

const shell=shellOwners[0].body;
assert.match(shell,/gensMode151\s*\(/,'Shell resumeGame must route using the existing active-module discriminator');
assert.match(shell,/mode\s*===\s*["']dungeon["'][\s\S]*DungeonCore01\.show\s*\(/,
  'Shell must delegate Dungeon resume to DungeonCore01.show only when Dungeon is active');
assert.match(shell,/mode\s*===\s*["']capture["']/,
  'Shell must own the Capture resume branch');
assert.match(shell,/captureEnterWorld139\s*\(|renderCaptureWorldHub\s*\(/,
  'Shell Capture resume must delegate to an existing Capture world entry/render path');
assert.match(shell,/renderMenuStatuses\s*\(\)/,
  'Shell must retain the historical Survival/other resume path');

for(const id of ['dungeonCore307CriticalResumeFix','dungeonCore310PersistenceAndTokens']){
  const s=active.find(x=>x.id===id);
  assert.ok(s,id+' must remain loaded for its non-resume responsibilities');
  assert.doesNotMatch(s.body,/window\.resumeGame\s*=\s*function\s*\(/,
    id+' must no longer replace global resumeGame');
  assert.doesNotMatch(s.body,/previousResume(?:307|310)\s*=\s*window\.resumeGame/,
    id+' must no longer capture the Shell resume owner');
}

console.log('Phase 5 resumeGame Shell consolidation target: one owner, module-routed delegation, Dungeon wrappers retired');
