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
  ref:'main',sha:'d55dd4d4f565baefc66bc5ccbde2f10e501f67fe',
  certifiedCiRun:45422631920
 });
 assert.equal(pin.legacyCaptureRuntime,false);
 assert.equal(pin.combat.sha,'0543103891b5777fff108cb12a1ae55a519544d9',
  'Vipfer and other approved Combat changes must be retained');
});
