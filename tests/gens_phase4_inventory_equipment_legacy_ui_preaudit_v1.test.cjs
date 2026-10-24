'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const index=read('index.html');
const workflow=read('.github/workflows/main.yml');
const ui=read('assets/dungeon/dungeon-equipment-ui.js');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const setEditor=read('assets/dungeon/dungeon-set-editor-167818.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');

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

// Production guarantees the historical canonical set engine before injected UI.
assert.ok(index.includes('assets/dungeon/dungeon-core-316.js'),
  'source index must retain Core 3.16 before Pages-injected Equipment UI');
assert.ok(workflow.includes('assets/dungeon/dungeon-equipment-ui.js'),
  'Pages must inject Equipment UI');
assert.ok(workflow.includes('assets/gensrpg/core/equipment-bonus-sets-v1.js'),
  'Pages must inject Core Equipment bonus + sets');

// The first subtractive cleanup is now complete: no local set-state authority remains.
assert.doesNotMatch(ui,/function\s+fallbackSetStates\s*\(/,
  'Equipment UI local set-state fallback must remain retired');
const setStates=extractFunction(ui,'setStates');
assert.match(setStates,/dungeonSetStateFromItems316/,
  'Equipment UI must depend on the canonical historical set-state seam');
assert.doesNotMatch(setStates,/fallbackSetStates/,
  'Equipment UI must not regain a local set-state fallback');
assert.match(setStates,/return \[\];/,
  'missing or invalid canonical set-state seam must degrade to an empty UI view');

// Wrapper stack characterization.
assert.match(hotfix,/ROOT\.openEquipmentEditor=wrapped/);
assert.match(hotfix,/wrapped\.__equipmentHotfix167817=true;wrapped\.__original=baseOpen/);
assert.match(hotfix,/ROOT\.saveEquipmentEditor=wrapped/);
assert.match(setEditor,/ROOT\.openEquipmentEditor=wrapped/);
assert.match(setEditor,/wrapped\.__setEditor167818=true;wrapped\.__original=baseOpen/);
assert.match(setEditor,/ROOT\.saveEquipmentEditor=wrapped/);
assert.match(cleanup,/function wrapOpen\(\)/);
assert.match(cleanup,/w\.__canonEq102=true;w\.__original=old/);
assert.match(cleanup,/wrapCacheInvalidator\("saveEquipmentEditor"\)/);

assert.match(ui,/ROOT\.renderDungeonGear=wrapped/,
  'Equipment UI still wraps renderDungeonGear');
assert.match(ui,/new ROOT\.MutationObserver\(\(\)=>scheduleRefresh\(\)\)/,
  'Equipment UI still owns a documentElement MutationObserver');
assert.match(ui,/DOC\.addEventListener\?\.\("change"/,
  'Equipment UI still owns a document-level change listener');
assert.match(setEditor,/DOC\.addEventListener\?\.\("change"/);
assert.match(setEditor,/DOC\.addEventListener\?\.\("click"/);
assert.match(setEditor,/setTimeout\(\(\)=>\{ensureSection\(\);addNewButton\(\)\},0\)/,
  'Set editor still owns its delayed click refresh');
assert.match(cleanup,/setTimeout\(\(\)=>decorateEquipmentEditor\(id\),0\)/,
  'canonical cleanup still schedules editor decoration');
assert.match(cleanup,/setTimeout\(install,25\)/,
  'canonical cleanup still owns its dependency retry');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment legacy wrappers/UI preaudit',
  setProgress:{
    localFallbackPresent:false,
    productionCanonicalSeam:'dungeonSetStateFromItems316',
    canonicalOnly:true,
    missingSeamReturnsEmpty:true
  },
  wrapperStack:{
    openEquipmentEditor:['hotfix-167817','set-editor-167818','cleanup-1678102'],
    saveEquipmentEditor:['hotfix-167817','set-editor-167818','cleanup-cache-invalidator'],
    renderDungeonGear:['equipment-ui']
  },
  sideEffects:{
    equipmentUiDocumentObserver:true,
    equipmentUiDocumentChangeListener:true,
    setEditorDocumentListeners:true,
    setEditorDelayedClickRefresh:true,
    cleanupDelayedDecoration:true,
    cleanupInstallRetry:true
  },
  firstSubtractiveCandidateRetired:true,
  runtimeChanged:true
},null,2));
