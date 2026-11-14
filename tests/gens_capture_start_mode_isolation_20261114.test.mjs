import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
const html=readFileSync(new URL('adventure.html',root),'utf8');
const css=readFileSync(new URL('adventure-style-v1.css',root),'utf8');
const app=readFileSync(new URL('adventure-app-v1.mjs',root),'utf8');

test('boot is born in the choice view, before the official ES module loads',()=>{
 assert.match(html,/<body data-adventure-start-view="choice">/);
 assert.match(html,/new URLSearchParams\(location.search\).get\('editor'\)==='items'/);
 assert.match(css,/body\[data-adventure-start-view="choice"\] \.adventure-columns\{display:none!important\}/);
});
test('new adventure cannot show a previously active save or its load actions',()=>{
 assert.match(app,/let newlyCreatedAdventureId=null;/);
 assert.match(app,/if\(view==='new'\)newlyCreatedAdventureId=null;/);
 assert.match(app,/const showActiveSession=Boolean\(state\)&&/);
 assert.match(app,/view==='new'&&newlyCreatedAdventureId===state\.sessionId/);
 assert.match(app,/newlyCreatedAdventureId=created\.sessionId;/);
 assert.match(css,/body\[data-adventure-start-view="new"\] #adventure-session-panel \.save-state\{display:none!important\}/);
 assert.match(css,/body\[data-adventure-start-view="new"\] #adventure-save-load-panel\{display:none!important\}/);
});
test('new adventure uses creator defaults, never last loaded session settings',()=>{
 assert.match(app,/rules=normalizeAdventureRulesV1\(draftStore\?\.load\(\)\?\?SHOWCASE_ADVENTURE_RULES_V1\)/);
 assert.match(app,/if\(view==='new'\)/);
 assert.match(app,/\$\('adventure-player-alias'\)\.value='';/);
});
