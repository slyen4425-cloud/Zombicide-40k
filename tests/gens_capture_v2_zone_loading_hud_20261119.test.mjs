import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADVENTURE_ZONE_LOADING_SCHEMA_V1,readScopedAdventureZoneLoadingV1}
 from '../assets/gensrpg/capture-v2/adventure-combat-visibility-v1.mjs';

const read=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');
const origin='https://game.example',frameWindow={},sessionId='adventure-1';
const event={source:frameWindow,origin,data:{
 schema:ADVENTURE_ZONE_LOADING_SCHEMA_V1,sessionId,visible:true
}};
const readEvent=event=>readScopedAdventureZoneLoadingV1({event,frameWindow,origin,sessionId});
test('native zone loading signal is visibility-only, source/origin/session scoped',()=>{
 assert.deepEqual(readEvent(event),{visible:true});
 assert.deepEqual(readEvent({...event,data:{...event.data,visible:false}}),{visible:false});
 assert.equal(readEvent({...event,source:{}}),null);
 assert.equal(readEvent({...event,origin:'https://forged.invalid'}),null);
 assert.equal(readEvent({...event,data:{...event.data,sessionId:'forged'}}),null);
 assert.equal(readEvent({...event,data:{...event.data,visible:'true'}}),null);
 assert.equal(readEvent({...event,data:{...event.data,schema:'unknown'}}),null);
 assert.equal(readScopedAdventureZoneLoadingV1({event,frameWindow,origin,sessionId:null}),null);
});
test('Capture HUD and existing Shell bar are hidden only via their own scoped owners',()=>{
 const app=read('adventure-app-v1.mjs');
 const css=read('adventure-style-v1.css');
 const shell=read('shell-entry-v1.js');
 const shellCss=read('shell-style-v1.css');
 assert.match(app,/readScopedAdventureZoneLoadingV1\(scoped\)/);
 assert.match(app,/document\.body\.dataset\.adventureZoneLoading=String\(zone\.visible\)/);
 assert.match(app,/setShellAdventureLoadingVisibility\(zone\.visible\|\|!\$\('adventure-launch-loading'\)\.hidden\)/);
 assert.match(app,/setShellAdventureLoadingVisibility\(activeZoneLoading\)/);
 assert.match(app,/activeZoneLoading=false/);
 assert.match(shell,/function setAdventureLoadingVisibility\(visible\)/);
 assert.match(shell,/host\.dataset\.adventureLoadingActive=String\(visible\)/);
 assert.match(shell,/delete host\.dataset\.adventureLoadingActive/);
 assert.match(shellCss,/data-adventure-loading-active="true"\] > \.gensCaptureV2NativeBar\{display:none!important\}/);
 assert.match(css,/data-adventure-zone-loading="true"\] #adventure-play-hud\{display:none!important\}/);
 assert.doesNotMatch(app,/document\.body\.append\(.*loading/i);
});
