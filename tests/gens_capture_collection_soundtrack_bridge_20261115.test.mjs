import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');
test('owned Collection opens existing full official Bestiary page, locked species stay disabled',()=>{
 const source=file('adventure-play-sheet-view-v1.mjs');
 const css=file('adventure-style-v1.css');
 assert.match(source,/vendor\\/combat-lab\\/examples\\/dom-demo\\/bestiary\\.html/);
 assert.match(source,/searchParams\\.set\\('embedded','1'\\)/);
 assert.match(source,/page\\.hash=encodeURIComponent\\(entry\\.speciesId\\)/);
 assert.match(source,/sheet-bestiary-embed/);
 assert.doesNotMatch(source,/skill\\.explanation\\?\\.sentences/,'native official renderer owns skill prose');
 assert.match(source,/tile\.disabled=!entry\.owned/);
 assert.match(source,/if\(!entry\.owned\)return/);
 assert.match(source,/Retour à la collection/);
 assert.match(css,/sheet-collection-detail\[hidden\]\{display:none!important\}/);
});
test('Capture uses the ONE authored SoundtrackProject and the real Exploration player, no duplicate audio engine',()=>{
 const source=file('adventure-app-v1.mjs');
 assert.match(source,/readOfficialSoundtrackProjectV1\(window\.localStorage/);
 assert.match(source,/SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1/);
 assert.match(source,/SOUNDTRACK_STARTER_CATALOG_V1/);
 assert.match(source,/searchParams\.set\('soundtrackMusic',JSON\.stringify\(mapMusic\)\)/);
 assert.match(source,/vendor\/exploration-lab\/sculpt-lab\.html/);
 assert.doesNotMatch(source,/new Audio\(/);
});
