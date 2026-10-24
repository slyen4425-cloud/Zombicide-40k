const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-hero-editor-dynamic-167897.js'),'utf8');

assert.match(src,/function canonicalValue\(/,'hero editor must keep a dedicated base-value source');
assert.match(src,/rec\?\.dungeonStats\?\.\[id\]/,'hero editor must continue to read the hero definition value, not a derived combat total');
assert.match(src,/function gameStatValues\(d\)/,'in-game sheet must expose one explicit base/total value helper');
assert.match(src,/total=num\(api\(\)\?\.value\?\.\(hero,d\.id\),base\)/,'in-game sheet must continue to consume the canonical computed value through gameStatValues');
assert.match(src,/base=num\(canonicalValue\(d\.id,d,rec\),d\.defaultValue\|\|0\)/,'in-game sheet base must come from the hero definition/editor value');

const fn=src.match(/function statBoxHtml\(d\)\{([\s\S]*?)\nfunction completeGameStats/);
assert.ok(fn,'statBoxHtml function must remain inspectable');
const body=fn[1];
assert.doesNotMatch(body,/Base '\+vals\.total|Base \$\{?vals\.total/,'in-game sheet must never label the computed total as “Base”');
assert.match(body,/Base héros|Valeur de base/,'in-game stat card must explicitly identify the hero-definition/base value');
assert.match(body,/Total|Valeur actuelle/,'in-game stat card must explicitly identify the canonical current total');
assert.match(body,/vals\.base/,'in-game stat card must render the true base value');
assert.match(body,/vals\.total/,'in-game stat card must render the canonical current total');

console.log('GenSrpG V114.11 hero editor/game stat display semantics contract OK');
