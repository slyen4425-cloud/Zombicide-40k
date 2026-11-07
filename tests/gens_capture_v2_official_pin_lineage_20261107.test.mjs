import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyCaptureOfficialLabPinsV1,EXPECTED_LAB_REPOS}
 from '../tools/verify_capture_official_lab_pins_v1.mjs';
const sha=x=>x.repeat(40);
const pinned={schema:'gensrpg-capture-v2-official-main-pins-v1',legacyCaptureRuntime:false,
 combat:{repository:EXPECTED_LAB_REPOS.combat,ref:'main',sha:sha('a'),certifiedCiRun:11},
 exploration:{repository:EXPECTED_LAB_REPOS.exploration,ref:'main',sha:sha('b'),certifiedCiRun:22}};
const currentPins=()=>JSON.parse(JSON.stringify(pinned));

test('certified immutable SHA on current main is accepted without remote compare',async()=>{
 let compares=0;
 const result=await verifyCaptureOfficialLabPinsV1({pins:currentPins(),
  headFor:async n=>pinned[n].sha,
  compare:async()=>{compares++;return null;}});
 assert.equal(compares,0);
 assert.deepEqual(result,{combat:sha('a'),exploration:sha('b')});
});
test('an older certified main SHA remains valid when current main advances without altering its ancestry',async()=>{
 const result=await verifyCaptureOfficialLabPinsV1({pins:currentPins(),
  headFor:async n=>n==='combat'?sha('c'):sha('b'),
  compare:async()=>({status:'ahead',ahead_by:12,behind_by:0,merge_base_commit:{sha:sha('a')}})});
 assert.equal(result.combat,sha('a'),'no silent upgrade to new Combat HEAD');
});
test('divergence, rollback, unrelated history and missing certification always fail closed',async()=>{
 for(const proof of [
  {status:'diverged',ahead_by:2,behind_by:1,merge_base_commit:{sha:sha('f')}},
  {status:'behind',ahead_by:0,behind_by:2,merge_base_commit:{sha:sha('c')}},
  {status:'ahead',ahead_by:12,behind_by:0,merge_base_commit:{sha:sha('f')}}
 ]){
  await assert.rejects(verifyCaptureOfficialLabPinsV1({pins:currentPins(),
    headFor:async n=>n==='combat'?sha('c'):sha('b'),compare:async()=>proof}),
    /main lineage/);
 }
 for(const mutation of [p=>{p.combat.certifiedCiRun=0},p=>{p.combat.ref='gh-pages'},
  p=>{p.combat.repository='other/repository'},p=>{p.legacyCaptureRuntime=true}]){
  const changed=currentPins();mutation(changed);
  await assert.rejects(verifyCaptureOfficialLabPinsV1({pins:changed,
   headFor:async n=>pinned[n].sha,compare:async()=>null}),/pin|ownership/i);
 }
 await assert.rejects(verifyCaptureOfficialLabPinsV1({pins:currentPins(),
  headFor:async n=>n==='combat'?sha('c'):sha('b'),
  compare:async()=>{throw Error('HTTP 429');}}),/HTTP 429/);
});
test('all official workflows reuse this one verified main-pin contract instead of the moving-tip equality',()=>{
 for(const path of ['.github/workflows/capture-v2-clean-base.yml',
  '.github/workflows/capture-lab-delivery.yml','.github/workflows/main.yml']){
  const yml=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(yml,/node tools\/verify_capture_official_lab_pins_v1\.mjs/);
  assert.doesNotMatch(yml,/main moved: approved consumer|main has changed: recertify|Uncertified .* main drift/);
 }
});
