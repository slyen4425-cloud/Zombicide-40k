import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  CAPTURE_RUNTIME_CONTRACT,
  createCaptureModeState,
  initializeCaptureRoster,
  moveCaptureRosterCreature,
} from '../src/modes/capture/capture.js';

const root=path.resolve(import.meta.dirname,'..');
const app=fs.readFileSync(path.join(root,'src','app.js'),'utf8');
const page=fs.readFileSync(path.join(root,'src','modes','capture','capture-page.js'),'utf8');
const canonicalization=JSON.parse(fs.readFileSync(path.join(root,'docs','capture-creature-canonicalization.json'),'utf8'));

assert.equal(CAPTURE_RUNTIME_CONTRACT.lazyInitializationRequired,true);
assert.ok(!app.includes("import { mountCapturePage }"),'Capture must not be statically imported at app startup');
assert.match(app,/import\('\.\/modes\/capture\/capture-page\.js'\)/,'Capture must be dynamically imported');
assert.match(app,/Promise\.all\(/,'Capture lazy dependencies may load in parallel only after Capture entry');
assert.match(app,/loadCaptureAssetRegistry\(\)/,'Capture asset registry must stay lazy with Capture entry');
assert.match(app,/id: 'capture'.*enabled: true/s,'Capture home card must be enabled');
assert.ok(!app.includes('ensureBuiltinMonsterCapture'),'legacy Capture seed must never run from app startup');
assert.ok(!page.includes('../rpg/'),'Capture page must not import RPG mode');

let state=createCaptureModeState({playerId:'p1'});
state=initializeCaptureRoster(state,{
  canonicalization,
  preferredActiveIds:['owned-a'],
  legacyOwned:[
    {ownedId:'owned-a',speciesId:'crea_embercub',level:5},
    {ownedId:'owned-b',speciesId:'crea_braiseau',level:3},
    {ownedId:'owned-c',speciesId:'crea_aquafin',level:2},
    {ownedId:'legacy-x',speciesId:'crea_pyrolynx',level:8},
  ],
});
assert.equal(state.roster.length,3);
assert.equal(state.activeTeam.length,3);
assert.equal(state.reserve.length,0);
assert.equal(state.quarantine.length,1);
assert.equal(state.activeTeam[0].instanceId,'owned-a');
assert.equal(state.activeTeam[0].speciesId,'capture_braiseau');
assert.equal(state.activeTeam[1].speciesId,'capture_braiseau');
assert.notEqual(state.activeTeam[0].instanceId,state.activeTeam[1].instanceId);

let moved=moveCaptureRosterCreature(state,'owned-b','reserve');
assert.equal(moved.ok,true);
state=moved.state;
assert.equal(state.activeTeam.length,2);
assert.equal(state.reserve.length,1);
assert.equal(state.roster.length,3);
assert.equal(state.reserve[0].instanceId,'owned-b');

console.log('capture-lazy-entry.test.mjs: ok');
