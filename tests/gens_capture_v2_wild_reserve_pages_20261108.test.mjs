import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const root='_site/preview/capture-v2-pr225/';
const site=(file)=>read(root+file);

test('real assembled Pages Capture uses the ONE exact source and both certified main lab SHAs',()=>{
 const pin=JSON.parse(read('tools/capture_v2_pages_preview_pin.json'));
 const sourcePins=JSON.parse(site('assets/gensrpg/capture-v2/source-pins-v1.json'));
 const provenance=JSON.parse(site('release-provenance.v1.json'));
 assert.equal(pin.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(provenance.source.commit,pin.sha);
 assert.equal(provenance.combat.sha,sourcePins.combat.sha);
 assert.equal(provenance.exploration.sha,sourcePins.exploration.sha);
 assert.equal(sourcePins.combat.ref,'main');
 assert.equal(sourcePins.exploration.ref,'main');
 assert.match(sourcePins.combat.sha,/^[a-f0-9]{40}$/);
 assert.match(sourcePins.exploration.sha,/^[a-f0-9]{40}$/);
 assert.ok(Number.isSafeInteger(sourcePins.combat.certifiedCiRun));
 assert.ok(Number.isSafeInteger(sourcePins.exploration.certifiedCiRun));
});

test('actual physical Pages files preserve the six-member Adventure to Exploration to native Combat roster chain',()=>{
 const adventure=site('assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs');
 const results=site('assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
 const explorer=site('vendor/exploration-lab/src/encounters/adventure-playing-party-v1.js');
 const bridge=site('vendor/exploration-lab/integration/combat-bridge/exploration-native-source-v1.js');
 const combat=site('vendor/combat-lab/src/ui/capture-encounter-combat-source-v1.js');
 const lifecycle=site('vendor/combat-lab/src/ui/embedded-combat-lifecycle-v1.js');
 assert.match(adventure,/rawReserve\.length>5/,'GenSRPG must project at most five reserve members');
 assert.match(adventure,/reserve:Object\.freeze\(members\.slice\(1\)\)/,'real saved party must be projected, not a fabricated Tester team');
 assert.match(results,/partyState\.members/,'each owned member must be reconciled after battle');
 assert.match(explorer,/readScopedAdventurePlayingPartyV1/,'Explorer must validate read-only scoped party');
 assert.match(explorer,/reserveMembers/,'Explorer must retain all saved reserve members');
 assert.match(bridge,/localReserve:adventureParty\.reserve\?\?\[\]/,'Explorer must pass reserve to native Combat');
 assert.match(combat,/buildCaptureWildReserveSourceV1/,'native Combat must own the full roster');
 assert.match(combat,/skillIdsByRosterMember/,'native Combat must configure every roster fighter');
 assert.match(lifecycle,/members\.some\(member=>member\.hp>0\)/,'one KO must not end a battle if reserve survives');
});
