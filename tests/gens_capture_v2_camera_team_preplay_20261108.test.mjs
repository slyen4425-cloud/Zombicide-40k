import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1,
 normalizeAdventureCameraPolicyV1,updateAdventureCameraPolicyV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventurePlaySheetSnapshotV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';

const now='2026-11-08T10:45:00.000Z';
const cards=['alpha','beta','gamma'].map(id=>({id,name:id,skills:[{state:'ready'}]}));
const game=()=>createAdventureSessionV1({
 bestiaryCards:cards,starterId:'alpha',starterIds:cards.map(c=>c.id),
 rules:SHOWCASE_ADVENTURE_RULES_V1,
 ids:{sessionId:'camera-team',instanceId:'a1',reserveInstanceIds:['b2','c3']},now
});

test('optional initial zoom saves with angle without overwriting old AdventureSession saves',()=>{
 const original=game();
 assert.deepEqual(original.cameraPolicy,{angleDeg:55});
 assert.deepEqual(normalizeAdventureCameraPolicyV1({angleDeg:45,zoomPercent:205}),
  {angleDeg:45,zoomPercent:205});
 const saved=updateAdventureCameraPolicyV1({session:original,angleDeg:45,zoomPercent:205,now});
 assert.deepEqual(saved.cameraPolicy,{angleDeg:45,zoomPercent:205});
 assert.equal(saved.party.reserve.length,2);
 assert.equal(saved.party.active.instanceId,original.party.active.instanceId);
 assert.deepEqual(original.cameraPolicy,{angleDeg:55});
 assert.deepEqual(updateAdventureCameraPolicyV1({session:saved,angleDeg:40,now}).cameraPolicy,
  {angleDeg:40,zoomPercent:205});
 for(const bad of [95,99,101,241,245,NaN,200.5])
  assert.throws(()=>normalizeAdventureCameraPolicyV1({angleDeg:45,zoomPercent:bad}),
   /Zoom|caméra/i);
});
test('preparation settings are visible and passed to native Exploration, team opens with all members',()=>{
 const base=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
 const app=readFileSync(new URL('adventure-app-v1.mjs',base),'utf8');
 const html=readFileSync(new URL('adventure.html',base),'utf8');
 const view=readFileSync(new URL('adventure-play-sheet-view-v1.mjs',base),'utf8');
 assert.match(html,/id="adventure-play-team-count"/);
 assert.match(html,/id="adventure-creator-camera-zoom"/);
 assert.match(html,/value="205"/);
 assert.match(html,/value="45" selected/);
 assert.match(app,/currentSheetTab='team';/);
 assert.match(app,/url\.searchParams\.set\('cameraZoom'/);
 assert.match(app,/cameraZoomPercent:Number\(\$\('adventure-creator-camera-zoom'\)\.value\)/);
 assert.match(app,/zoomPercent:Number\(\$\('adventure-creator-camera-zoom'\)\.value\)/);
 assert.match(app,/text\(\$\('adventure-play-team-count'\)/);
 assert.match(view,/for\(const \[index,member\] of snapshot\.team\.entries\(\)\)/);
 assert.match(view,/onSelectCreature/);
 assert.match(view,/onMakeActive/);
 const snapshot=adventurePlaySheetSnapshotV1({
  session:{...game(),status:'playing'},bestiaryCards:cards,
  statRegistry:{schema:'capture-stat-registry-v1',stats:[]}
 });
 assert.deepEqual(snapshot.team.map(x=>x.name),['alpha','beta','gamma']);
 assert.equal(snapshot.team.length,3);
});
