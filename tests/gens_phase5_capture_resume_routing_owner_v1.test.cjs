const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core310=scriptBody('dungeonCore310PersistenceAndTokens');

assert.match(core310,/const previousResume310=window\.resumeGame;/,
  'Core 3.10 must preserve the previous Shell/module resume authority');
assert.match(core310,/const capture=typeof isCaptureContext138==="function"&&isCaptureContext138\(\);/,
  'Core 3.10 resume must reuse the canonical Capture-context boundary');
assert.match(core310,/const dungeon=typeof isDungeonMode==="function"&&isDungeonMode\(\)&&!capture;/,
  'Core 3.10 resume must require true Dungeon context and explicitly exclude Capture');
assert.match(core310,/if\(dungeon&&ok&&window\.DungeonCore01\)\{/,
  'DungeonCore01 may only steal Resume inside the guarded Dungeon context');
assert.match(core310,/return typeof previousResume310==="function"\?previousResume310\.apply\(this,arguments\):undefined/,
  'non-Dungeon contexts must delegate to the previous Resume owner');
assert.doesNotMatch(core310,/removeItem\(["']gensrpg_dungeon_runtime_v2["']\)/,
  'routing fix must not delete the independent Dungeon save');

console.log('Phase 5 Capture resume owner guard OK: stale Dungeon save cannot steal Capture Resume');
