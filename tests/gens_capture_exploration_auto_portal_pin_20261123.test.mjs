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
  ref:'main',sha:'46e2e1e11cfd841232998d452dbf4f235f2b482c',
  certifiedCiRun:45466487382
 });
 assert.equal(pin.legacyCaptureRuntime,false);
 assert.equal(pin.combat.sha,'826c6cddf81e14f485f5afae2e1a9160e3f8b415',
  'Vipfer and other approved Combat changes must be retained');
});
