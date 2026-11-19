import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,base),'utf8');
test('new World Builder map export and game dezoom have exactly one native Exploration main owner',()=>{
 const pin=JSON.parse(read('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(pin.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pin.exploration.ref,'main');
 assert.equal(pin.exploration.sha,'da4420cef7ff4666d93fb492f246518e0c6803f9');
 assert.equal(pin.exploration.certifiedCiRun,44600694548);
 assert.equal(pin.combat.sha,'61f704ac24f828721ff7ec24baed351078a409aa');
 assert.equal(pin.legacyCaptureRuntime,false);
 const stage=read('tools/stage_capture_v2_labs.mjs');
 assert.match(stage,/copy\(path\.join\(exploration/);
 assert.doesNotMatch(stage,/copy\(path\.join\(combat,'assets'\)/);
});
