import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');

test('a user-created hero illustration is read from Exploration HeroDefinition, never a second save',()=>{
 assert.match(app,/record\.assets\.find\(entry=>entry\.id===record\.id\+'\.portrait'\)/);
 assert.match(app,/savedPortrait instanceof Blob/);
 assert.match(app,/hasPersonalPortrait\?URL\.createObjectURL\(savedPortrait\)/);
 assert.match(app,/if\(!hasPersonalPortrait\)\{/);
 assert.match(app,/officialHeroPortraitUrlV1/);
 assert.match(app,/if\(currentHeroVisual\?\.objectUrl\)URL\.revokeObjectURL\(currentHeroVisual\.objectUrl\)/);
 assert.doesNotMatch(app,/localStorage\.setItem\([^\n]*portrait/);
});
