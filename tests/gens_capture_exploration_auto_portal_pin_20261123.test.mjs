import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Capture V2 links only certified Exploration main for auto portals and canonical marker visuals',()=>{
 const pin=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 assert.equal(pin.schema,'gensrpg-capture-v2-official-main-pins-v1');
 assert.deepEqual({
  repository:pin.exploration.repository,ref:pin.exploration.ref,
  sha:pin.exploration.sha,certifiedCiRun:pin.exploration.certifiedCiRun
 },{
  repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',
  ref:'main',sha:'afdd45a4ab4065c0921b160a38a948ca3663e62f',
  certifiedCiRun:45569743090
 });
 assert.equal(pin.legacyCaptureRuntime,false);
 assert.equal(pin.combat.sha,'c02be408963fed0ce8e70e028ae463f3719e1010',
  'Vipfer and other approved Combat changes must be retained');
});
