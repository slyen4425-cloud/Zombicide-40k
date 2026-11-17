import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Capture V2 consumes one certified Exploration main with hero + road renderer fixes',()=>{
 const pins=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 assert.equal(pins.schema,'gensrpg-capture-v2-official-main-pins-v1');
 assert.equal(pins.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'ec3e87511c18949e645276e6ed0fe4e7322d4a0e');
 assert.equal(pins.exploration.certifiedCiRun,44093570846);
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'62509f44136dddc5646aee75533723eb3f17b21b',
  'do not silently repin or duplicate the official Combat owner');
 assert.equal(pins.legacyCaptureRuntime,false);
});
