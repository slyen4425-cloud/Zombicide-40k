'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const indexPath=path.join(root,'index.html');
const indexBytes=fs.readFileSync(indexPath);
const index=String(indexBytes);
const coreView=read('assets/gensrpg/core/inventory-equipped-view-v1.js');
const coreSets=read('assets/gensrpg/core/equipment-bonus-sets-v1.js');
const coreEvolution=read('assets/gensrpg/core/equipment-evolution-v1.js');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const dungeon316=read('assets/dungeon/dungeon-core-316.js');
const ui=read('assets/dungeon/dungeon-equipment-ui.js');
const pages=read('.github/workflows/main.yml');

function gitBlobSha1(buf){
  return crypto.createHash('sha1')
    .update(Buffer.from('blob '+buf.length+'\0'))
    .update(buf)
    .digest('hex');
}

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing function '+name);
  const openParen=source.indexOf('(',start);
  let paren=0,quote=null,escaped=false,line=false,block=false,close=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')paren++;
    else if(c===')'&&--paren===0){close=i;break}
  }
  assert.ok(close>openParen,'missing parameter close '+name);
  const brace=source.indexOf('{',close);
  let depth=0;quote=null;escaped=false;line=false;block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

assert.equal(indexBytes.length,8174580,'Phase 4 closure audit expects the verified index size');
assert.equal(gitBlobSha1(indexBytes),'5b9b9ae780f735eadef049afeb10acf0b57441fe',
  'Phase 4 closure audit must run on the verified source index blob');

assert.match(coreView,/function reindexRefsAfterRemoval\(/);
assert.match(coreSets,/function setState\(/);
assert.match(coreEvolution,/function totalBonus\(/);
assert.match(pages,/inventory-equipped-view-v1\.js/);
assert.match(pages,/equipment-bonus-sets-v1\.js/);
assert.match(pages,/equipment-evolution-v1\.js/);

assert.match(hotfix,/GensInventoryEquippedViewV1/);
assert.match(hotfix,/equippedView\.equippedItems\(/);

const patchBonus=extractFunction(cleanup,'patchEquipmentBonus');
assert.match(patchBonus,/GensEquipmentBonusSetsV1/);
assert.match(patchBonus,/core\.totalBonus\(/);
assert.doesNotMatch(patchBonus,/old\.apply\(/,
  'active Equipment bonus calculation must not call the historical direct+sets calculator');
const cachedEvolution=extractFunction(cleanup,'cachedEvolutionBonus');
assert.match(cachedEvolution,/GensEquipmentEvolutionV1/);
assert.match(cachedEvolution,/core\.totalBonus\(/);

assert.match(index,/const oldRemove062=window\.removeInventoryEntry;/);
assert.match(index,/window\.removeInventoryEntry=function\(i\)[\s\S]*?Number\(v\)>Number\(i\)[\s\S]*?Number\(v\)-1/,
  'Core 0.62 still manually reindexes rpgGear refs');
assert.match(index,/function removeItem61\(st,idx\)[\s\S]*?for\(const k of \["rightHand","leftHand","equipment"\]\)[\s\S]*?st\.rpgGear/,
  'combat consumable removal still manually reindexes slot refs');
assert.doesNotMatch(index,/GensInventoryEquippedViewV1\.reindexRefsAfterRemoval/,
  'verified source index has not yet connected the Core reindex contract');

assert.match(dungeon316,/function setState316\(/);
assert.match(dungeon316,/window\.dungeonSetStateFromItems316=setState316/);
assert.match(ui,/dungeonSetStateFromItems316\(items\)/);
assert.doesNotMatch(ui,/fallbackSetStates/,
  'local Equipment UI fallback must remain retired');

for(const name of ['loadCustomEquipment','saveCustomEquipment','dungeonItems','openEquipmentEditor','saveEquipmentEditor','equipRight','equipLeft','equipTwoHands','equipRpgGear','unequipRpgGear']){
  assert.match(index,new RegExp('function\\s+'+name+'\\s*\\('),'missing expected historical adapter '+name);
}

console.log(JSON.stringify({
  scenario:'Phase 4 Inventory Equipment closure audit',
  verifiedIndex:{bytes:indexBytes.length,gitBlob:'5b9b9ae780f735eadef049afeb10acf0b57441fe'},
  coreConnected:['equipped-view','bonus+sets','evolution'],
  remainingCommonAuthorities:[
    'slot-ref reindex is still manual in Core 0.62 removeInventoryEntry and combat removeItem61',
    'set-state calculation is still owned by dungeon-core-316 via dungeonSetStateFromItems316'
  ],
  closureReady:false,
  nextLot:'slot-ref reindex runtime raccord'
},null,2));
