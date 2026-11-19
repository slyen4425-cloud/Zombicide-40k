import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Capture has one certified native Exploration source for south-fringe tree layers and raised-road seams',()=>{
 const p=JSON.parse(read('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(p.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(p.exploration.ref,'main');
 assert.equal(p.exploration.sha,'0128e69c290b43014a5a899804c588d805e2b4b0');
 assert.equal(p.exploration.certifiedCiRun,44580011055);
 assert.equal(p.combat.sha,'61f704ac24f828721ff7ec24baed351078a409aa');
 assert.equal(p.legacyCaptureRuntime,false);
 const stage=read('tools/stage_capture_v2_labs.mjs');
 assert.match(stage,/copy\(path\.join\(exploration/);
 assert.doesNotMatch(stage,/copy\(path\.join\(combat,'assets'\)/);
});
