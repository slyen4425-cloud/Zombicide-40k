import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Capture V2 consumes one certified Exploration main with hero + road renderer fixes',()=>{
 const pins=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 assert.equal(pins.schema,'gensrpg-capture-v2-official-main-pins-v1');
 assert.equal(pins.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'42d0f9608c17f6d56d65038ac895564252126d5e');
 assert.equal(pins.exploration.certifiedCiRun,44511672447);
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'2c80f57b0e5e70cac7cd22957a1ae906a64ed310',
  'do not silently repin or duplicate the official Combat owner');
 assert.equal(pins.legacyCaptureRuntime,false);
});
