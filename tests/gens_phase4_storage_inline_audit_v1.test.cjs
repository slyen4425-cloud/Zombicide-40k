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
assert.equal((index.match(/localStorage\.getItem\(captureCreatureProgressRulesKey\(\)\)/g)||[]).length,0,
  'Capture progress must have no direct localStorage read after Core raccord');
assert.equal((index.match(/localStorage\.setItem\(captureCreatureProgressRulesKey\(\)/g)||[]).length,0,
  'Capture progress must have no direct localStorage writer after Core raccord');
assert.equal((index.match(/GensStorageV1\.readJson\(localStorage,captureCreatureProgressRulesKey\(\),\{\}\)/g)||[]).length,1,
  'Capture progress must expose exactly one Core JSON read');
assert.equal((index.match(/GensStorageV1\.writeJson\(localStorage,captureCreatureProgressRulesKey\(\),(?:r|pr)\)/g)||[]).length,6,
  'Capture progress must expose exactly six Core JSON writes');

console.log(JSON.stringify({
  scenario:'Phase 4 inline storage audit',
  sourceIndexLoadsCoreStorage:true,
  pagesOrder:'storage-before-large-room',
  previewOrder:'source-bootstrap-no-duplicate',
  migratedFamily:'gensrpg_capture_progress_v2_<profile>',
  decision:'Capture progress now delegates JSON serialization to Core storage; continue with remaining isolated families'
},null,2));
