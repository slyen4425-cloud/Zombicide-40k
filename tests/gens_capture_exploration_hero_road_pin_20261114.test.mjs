import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Capture V2 consumes one certified Exploration main with hero + road renderer fixes',()=>{
 const pins=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 assert.equal(pins.schema,'gensrpg-capture-v2-official-main-pins-v1');
 assert.equal(pins.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'3d773ecd9653700750d6de3f62d2255199490a17');
 assert.equal(pins.exploration.certifiedCiRun,43574733643);
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'d25531a888175b3b27b6b78b26cce265eceb2217',
  'do not silently repin or duplicate the official Combat owner');
 assert.equal(pins.legacyCaptureRuntime,false);
});
