import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const indexPath=path.join(root,'index.html');
const html=fs.readFileSync(indexPath,'utf8');

assert.match(html,/type="module"\s+src="\.\/src\/app\.js"/,'V2 entrypoint must load the module app with a relative URL');
for(const rel of ['src/app.js','src/ui/app.css','src/ui/dungeon-combat-mobile.css','src/ui/dungeon-board.css']){
  assert.equal(fs.existsSync(path.join(root,rel)),true,`phone preview dependency missing: ${rel}`);
}
assert.equal(/(?:src|href)="\/(?!\/)/.test(html),false,'V2 preview entrypoint must not depend on repository-root absolute URLs');
assert.equal(/service-worker\.js/i.test(html),false,'temporary phone preview must not register a service worker from index.html');

console.log('rpg-phone-preview.test.mjs: ok');
