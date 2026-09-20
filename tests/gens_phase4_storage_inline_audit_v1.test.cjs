const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const index=read('index.html');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');

const storageTag='<script src="assets/gensrpg/core/storage-v1.js"></script>';
const largeTag='assets/dungeon/dungeon-large-room-support-167834.js';

assert.equal(index.includes(storageTag),false,
  'audit base: source index.html must not yet load Core storage directly');

const wfLarge=workflow.indexOf(largeTag);
const wfStorage=workflow.indexOf('assets/gensrpg/core/storage-v1.js');
assert.ok(wfLarge>=0&&wfStorage>=0,'Pages composition must mention Large Room Support and Core storage');
assert.ok(wfLarge<wfStorage,
  'audit base: Pages module list currently puts Large Room Support before Core storage');

const pvLarge=preview.indexOf(largeTag);
const pvStorage=preview.indexOf('assets/gensrpg/core/storage-v1.js');
assert.ok(pvLarge>=0&&pvStorage>=0,'preview must mention Large Room Support and Core storage');
assert.ok(pvLarge<pvStorage,
  'audit base: preview currently puts Large Room Support before Core storage');

const firstInlineStorage=index.indexOf('localStorage.getItem(GENSRPG_IDB_MIGRATION_FLAG)');
assert.ok(firstInlineStorage>0,'expected early inline storage access is missing');
assert.ok(index.indexOf('<script',0)<firstInlineStorage,
  'inline application scripts execute before the first mapped localStorage access');

assert.match(index,/function captureCreatureProgressRulesKey\(\)[\s\S]*?gensrpg_capture_progress_v2_/,
  'Capture progress dynamic JSON family must remain identifiable');
assert.match(index,/JSON\.parse\(localStorage\.getItem\(captureCreatureProgressRulesKey\(\)\)\|\|"\{\}"\)/,
  'Capture progress reader semantics must remain JSON-object based');
assert.match(index,/localStorage\.setItem\(captureCreatureProgressRulesKey\(\),JSON\.stringify\(/,
  'Capture progress writers must remain JSON-object based');

console.log(JSON.stringify({
  scenario:'Phase 4 inline storage audit',
  sourceIndexLoadsCoreStorage:false,
  pagesOrder:'large-room-before-storage',
  previewOrder:'large-room-before-storage',
  candidateFamily:'gensrpg_capture_progress_v2_<profile>',
  decision:'bootstrap Core storage before inline/business migrations'
},null,2));
