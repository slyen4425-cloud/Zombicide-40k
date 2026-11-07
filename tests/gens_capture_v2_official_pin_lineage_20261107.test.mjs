import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyCaptureOfficialLabPinsV1} from '../tools/verify_capture_official_lab_pins_v1.mjs';
const sha=c=>c.repeat(40);
const pins={schema:'gensrpg-capture-v2-official-main-pins-v1',legacyCaptureRuntime:false,
 combat:{repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',ref:'main',
  sha:sha('a'),path:'vendor/combat-lab/',certifiedCiRun:11},
 exploration:{repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',ref:'main',
  sha:sha('b'),path:'vendor/exploration-lab/',certifiedCiRun:22}};
const fresh=()=>JSON.parse(JSON.stringify(pins));
const actualProof=({repository,sha})=>({repository,pin:sha,ref:'refs/heads/main',
 main:sha('c')});

test('a certified old Lab SHA is handed unchanged to the single canonical main-history authority',()=>{
 const accepted=[];
 const result=verifyCaptureOfficialLabPinsV1({pins:fresh(),assertHistory:arg=>{
  accepted.push(arg);return {repository:arg.repository,pin:arg.sha,ref:'refs/heads/main',main:sha('c')};
 }});
 assert.deepEqual(accepted,[{repository:pins.combat.repository,sha:sha('a')},
  {repository:pins.exploration.repository,sha:sha('b')}]);
 assert.deepEqual(result,{combat:sha('a'),exploration:sha('b')});
});
test('missing official ancestry proof or fake source identity is rejected without selecting latest Lab main',()=>{
 for(const invalid of [
  ({repository,sha:pin})=>({repository,pin:sha('f'),ref:'refs/heads/main'}),
  ({repository,sha:pin})=>({repository,pin,ref:'refs/heads/gh-pages'}),
  ()=>null
 ]){
  assert.throws(()=>verifyCaptureOfficialLabPinsV1({pins:fresh(),assertHistory:invalid}),
   /not proven/);
 }
 for(const edit of [p=>p.combat.ref='gh-pages',p=>p.combat.certifiedCiRun=0,
  p=>p.combat.sha='main',p=>p.combat.repository='other/repo',p=>p.legacyCaptureRuntime=true]){
  const bad=fresh();edit(bad);
  assert.throws(()=>verifyCaptureOfficialLabPinsV1({pins:bad,assertHistory:actualProof}),
    /Uncertified|manifest/i);
 }
});
test('source CI workflows reuse canonical, immutable main-history proof',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const facade=read('tools/verify_capture_official_lab_pins_v1.mjs');
 assert.match(facade,/import \{assertOfficialMainHistoryPin\} from '\.\/verify_official_main_pin\.mjs'/);
 assert.doesNotMatch(facade,/compare\//,'do not reimplement ancestry in Capture');
 for(const p of ['.github/workflows/capture-v2-clean-base.yml',
  '.github/workflows/capture-lab-delivery.yml','.github/workflows/main.yml']){
  assert.match(read(p),/node tools\/verify_capture_official_lab_pins_v1\.mjs/);
 }
});
