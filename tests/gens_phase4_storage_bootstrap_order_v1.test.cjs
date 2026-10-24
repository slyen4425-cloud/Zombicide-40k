const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const index=read('index.html');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const storageTag='<script src="assets/gensrpg/core/storage-v1.js"></script>';
const largeTag='<script src="assets/dungeon/dungeon-large-room-support-167834.js?v=167836"></script>';

const count=(hay,needle)=>hay.split(needle).length-1;
assert.equal(count(index,storageTag),1,'source index must contain exactly one Core storage bootstrap tag');

const qrcode='<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>';
assert.ok(index.indexOf(qrcode)>=0&&index.indexOf(qrcode)<index.indexOf(storageTag),
  'Core storage bootstrap must stay after the stable head dependencies');
const firstInlineStorage=index.indexOf('localStorage.getItem(GENSRPG_IDB_MIGRATION_FLAG)');
assert.ok(firstInlineStorage>0&&index.indexOf(storageTag)<firstInlineStorage,
  'Core storage must be available before the first early inline localStorage access');

const wfStorage=workflow.indexOf('assets/gensrpg/core/storage-v1.js');
const wfLarge=workflow.indexOf('assets/dungeon/dungeon-large-room-support-167834.js');
assert.ok(wfStorage>=0&&wfLarge>=0&&wfStorage<wfLarge,
  'Pages fallback module order must keep Core storage before Large Room Support');
assert.match(workflow,/if tag not in html:[\s\S]*?html = html\.replace\("<\/body>", tag \+ "\\n<\/body>"\)/,
  'Pages build must keep duplicate-safe module injection');

assert.equal(preview.includes('assets/gensrpg/core/storage-v1.js'),false,
  'preview tag list must not inject Core storage a second time');
assert.ok(preview.includes('assets/dungeon/dungeon-large-room-support-167834.js?v=167836'),
  'preview must still append Large Room Support');

let built=index;
if(!built.includes(storageTag))built=built.replace('</body>',storageTag+'\n</body>');
if(!built.includes(largeTag))built=built.replace('</body>',largeTag+'\n</body>');
assert.equal(count(built,storageTag),1,'simulated Pages composition must contain Core storage once');
assert.ok(built.indexOf(storageTag)<built.indexOf(largeTag),
  'simulated Pages composition must execute Core storage before Large Room Support');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Storage Bootstrap Order',
  sourceStorageTags:count(index,storageTag),
  pagesFallback:'storage-before-large-room',
  preview:'inherits-source-storage-without-duplicate'
},null,2));
