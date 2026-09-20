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

assert.equal(index.split(storageTag).length-1,1,
  'source index.html must load Core storage exactly once after bootstrap');

const wfLarge=workflow.indexOf(largeTag);
const wfStorage=workflow.indexOf('assets/gensrpg/core/storage-v1.js');
assert.ok(wfLarge>=0&&wfStorage>=0,'Pages composition must mention Large Room Support and Core storage');
assert.ok(wfStorage<wfLarge,
  'Pages fallback order must keep Core storage before Large Room Support');

assert.equal(preview.includes('assets/gensrpg/core/storage-v1.js'),false,
  'preview must not append a second Core storage tag; it relies on source index.html');

const firstInlineStorage=index.indexOf('localStorage.getItem(GENSRPG_IDB_MIGRATION_FLAG)');
assert.ok(firstInlineStorage>0,'expected early inline storage access is missing');
assert.ok(index.indexOf(storageTag)<firstInlineStorage,
  'Core storage must load before the first mapped inline storage access');

assert.match(index,/function captureCreatureProgressRulesKey\(\)[\s\S]*?gensrpg_capture_progress_v2_/,
  'Capture progress dynamic JSON family must remain identifiable');
assert.match(index,/JSON\.parse\(localStorage\.getItem\(captureCreatureProgressRulesKey\(\)\)\|\|"\{\}"\)/,
  'Capture progress reader semantics must remain JSON-object based');
assert.match(index,/localStorage\.setItem\(captureCreatureProgressRulesKey\(\),JSON\.stringify\(/,
  'Capture progress writers must remain JSON-object based');

console.log(JSON.stringify({
  scenario:'Phase 4 inline storage audit',
  sourceIndexLoadsCoreStorage:true,
  pagesOrder:'storage-before-large-room',
  previewOrder:'source-bootstrap-no-duplicate',
  candidateFamily:'gensrpg_capture_progress_v2_<profile>',
  decision:'bootstrap Core storage before inline/business migrations'
},null,2));
