import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
test('Capture never bypasses the official Exploration installer on already installed heroes',()=>{
 assert.match(app,/const record=await installOfficialHeroPresetV1\(\{/);
 assert.doesNotMatch(app,/function findInstalled\(/);
 assert.doesNotMatch(app,/await findInstalled\(/);
 assert.match(app,/baseUrl:OFFICIAL_EXPLORATION_HERO_ROOT/);
});
