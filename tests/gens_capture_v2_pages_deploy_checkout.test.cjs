'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync(require('node:path').resolve(__dirname,'../.github/workflows/main.yml'),'utf8');
test('TDD: HTTPS provenance job checks out exact release repository before loading canonical pin',()=>{
 const start=workflow.indexOf('\n  deploy:\n');
 assert.ok(start>=0,'single canonical GitHub Pages deploy job must exist');
 const deploy=workflow.slice(start);
 assert.match(deploy,/uses: actions\/deploy-pages@v4/);
 const release=deploy.indexOf('      - name: Verify actual HTTPS preview provenance and untouched production root');
 assert.ok(release>=0,'live HTTPS verification must remain mandatory');
 const first=deploy.slice(0,release);
 assert.match(first,/      - name: Checkout exact published source for HTTPS proof\n        uses: actions\/checkout@v4\n        with:\n          ref: \$\{\{ github\.sha \}\}/,
   'a separate deployment runner has no repository: checkout github.sha before reading tools/capture_v2_pages_preview_pin.json');
 const check=deploy.slice(release);
 assert.match(check,/fs\.readFileSync\('tools\/capture_v2_pages_preview_pin\.json'/);
 assert.match(check,/release\.source\.commit!==pin\.sha/);
 assert.match(check,/release\.productionRootSha256!==hash/);
 assert.match(check,/release\.deliveryManifestSha256!==hash/);
});
