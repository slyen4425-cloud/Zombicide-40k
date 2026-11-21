import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('single Pages publisher selects certified Monster InvoC source with official victory audio, Exploration editor fixes and loading art',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../tools/capture_v2_pages_preview_pin.json',import.meta.url),'utf8'));
 assert.equal(manifest.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(manifest.repository,'slyen4425-cloud/Zombicide-40k');
 assert.ok(['e5a35f59a305c0fd55207670710657acc9e47ad8','0b74ac44ab0a39c90dbc0696f8a386084de1cec6','888e41e00dd6c04d0fef2b36418daafd0b500f57','3ecb6dd958315d0ad08130387b7bd9589486f5c5','5ca4481cf24ca727e09718e061f865b9c68e9b40','98606b5e7b0fe608fa5025ecc7da1b28e88c3bf3','5b4dbbf80923e6506e96a25283327ef49884e7dc'].includes(manifest.sha), 'only previously certified or newly certified Capture source SHA is allowed');
 assert.equal(manifest.publicPath,'/preview/capture-v2-pr225/');
 assert.equal(manifest.officialVisuals.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(manifest.officialVisuals.ref,'global-assets');
 assert.equal(manifest.officialVisuals.sha,'b45153efd5d2c4dec53d45a818131aca1cae6705');
});
