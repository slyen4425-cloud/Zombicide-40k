import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('single Pages publisher selects certified Monster InvoC source with official victory audio, Exploration editor fixes and loading art',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../tools/capture_v2_pages_preview_pin.json',import.meta.url),'utf8'));
 assert.equal(manifest.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(manifest.repository,'slyen4425-cloud/Zombicide-40k');
 assert.equal(manifest.sha,'3cadca46b98962f95f8ee92c8efdc3a52b76f48e');
 assert.equal(manifest.publicPath,'/preview/capture-v2-pr225/');
 assert.equal(manifest.officialVisuals.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(manifest.officialVisuals.ref,'global-assets');
 assert.equal(manifest.officialVisuals.sha,'9eef5847a2b9907c493d9575a5c148b09d41a5bf');
});
