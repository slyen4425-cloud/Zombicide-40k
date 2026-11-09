import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readScopedAdventureCombatVisibilityV1,
 ADVENTURE_COMBAT_VISIBILITY_SCHEMA_V1} from '../assets/gensrpg/capture-v2/adventure-combat-visibility-v1.mjs';
const origin='https://example.test',sessionId='save-1',frameWindow={id:'official-exploration'};
const event={origin,source:frameWindow,data:{
 schema:ADVENTURE_COMBAT_VISIBILITY_SCHEMA_V1,sessionId,encounterId:'enc-1',visible:true}};
const read=e=>readScopedAdventureCombatVisibilityV1({event:e,frameWindow,origin,sessionId});
test('HUD visibility only accepts the genuine Exploration iframe and active session',()=>{
 assert.deepEqual(read(event),{encounterId:'enc-1',visible:true});
 assert.deepEqual(read({...event,data:{...event.data,visible:false}}),
  {encounterId:'enc-1',visible:false});
 assert.equal(read({...event,origin:'https://attacker.invalid'}),null);
 assert.equal(read({...event,source:{}}),null);
 assert.equal(read({...event,data:{...event.data,sessionId:'other'}}),null);
 assert.equal(read({...event,data:{...event.data,schema:'other'}}),null);
 assert.equal(read({...event,data:{...event.data,visible:'false'}}),null);
 assert.equal(read({...event,data:{...event.data,encounterId:''}}),null);
 assert.equal(readScopedAdventureCombatVisibilityV1({event,frameWindow,origin,sessionId:null}),null);
});
test('only the Capture-owned HUD is hidden and restored by encounter correlation',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',import.meta.url),'utf8');
 assert.match(app,/activeCombatOverlayId=visibility\.encounterId/);
 assert.match(app,/activeCombatOverlayId===visibility\.encounterId/);
 assert.match(app,/\$\('adventure-play-hud'\)\.hidden=true/);
 assert.match(app,/if\(dialog\.open\|\|activeCombatOverlayId\)return/);
 assert.match(app,/resetAdventureCombatHud\(\)/);
 assert.match(css,/body\[data-adventure-combat-visible="true"\] #adventure-play-hud\{display:none!important\}/);
});
