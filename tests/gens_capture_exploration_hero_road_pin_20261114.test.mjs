import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Capture V2 consumes one certified Exploration main with hero + road renderer fixes',()=>{
 const pins=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 assert.equal(pins.schema,'gensrpg-capture-v2-official-main-pins-v1');
 assert.equal(pins.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'13bbd8230d8dfcef612586974b2dcb54e18e16c4');
 assert.equal(pins.exploration.certifiedCiRun,44137364939);
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'72cc1b8271b4e83d3014d8f85c7addcd0aa8436e',
  'do not silently repin or duplicate the official Combat owner');
 assert.equal(pins.legacyCaptureRuntime,false);
});
