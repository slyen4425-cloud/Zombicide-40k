import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createAdventureSessionV1,normalizeAdventureCameraPolicyV1,
 updateAdventureCameraPolicyV1,SHOWCASE_ADVENTURE_RULES_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
const now='2026-11-07T16:30:00.000Z';
const newGame=()=>createAdventureSessionV1({
 bestiaryCards:[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}],
 starterId:'lumilo',ids:{sessionId:'camera-session',instanceId:'camera-creature'},
 rules:SHOWCASE_ADVENTURE_RULES_V1,now
});
test('RED: creator angle is a validated session setting, never a second game camera',()=>{
 const s=newGame();
 assert.deepEqual(s.cameraPolicy,{angleDeg:55});
 for(const angleDeg of [35,40,45,55,70,85,90]){
  const changed=updateAdventureCameraPolicyV1({session:s,angleDeg,now});
  assert.equal(changed.cameraPolicy.angleDeg,angleDeg);
  assert.equal(changed.sessionId,s.sessionId);
  assert.equal(changed.party.active.instanceId,s.party.active.instanceId);
 }
 for(const angleDeg of [0,30,36,91,100,55.5,NaN])
  assert.throws(()=>normalizeAdventureCameraPolicyV1({angleDeg}),/angle|caméra|35|90/i);
 assert.equal(s.cameraPolicy.angleDeg,55,'creator edit cannot mutate the old save');
});
test('RED: Jouer passes the saved angle to official Exploration; only player zoom is free',()=>{
 const s=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(html,/id="adventure-creator-camera-angle"/);
 assert.match(html,/<option value="35">/);
 assert.match(html,/<option value="90">/);
 assert.match(s,/url\.searchParams\.set\('cameraAngle',String\(result\.session\.cameraPolicy/);
 assert.match(s,/updateAdventureCameraPolicyV1\(/);
 assert.doesNotMatch(s,/iframe\.contentDocument|frame\.contentDocument|navigation-camera-angle'\)\.value/);
});
