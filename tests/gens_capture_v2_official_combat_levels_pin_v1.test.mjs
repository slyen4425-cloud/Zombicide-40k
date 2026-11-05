import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveCaptureCombatCreatureLevelsV1} from '../_site/vendor/combat-lab/src/ui/capture-editor-combat-test-v1.js';

const pins=JSON.parse(fs.readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
test('GenSRPG consumer explicitly pins certified Combat main owner commit with per-creature levels',()=>{
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'53890e1383b33f7a0ec5bb2fafed59acf1d7a163');
 assert.equal(pins.combat.certifiedCiRun,41948369881);
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'2b27339a5706fcdb436558aeebd4f8b6b0ce9d85',
  'Exploration pin must be the certified official main, including real HP policy and exact Adventure duel');
 assert.equal(pins.exploration.certifiedCiRun,41945445069);
});
test('a true owned starter level 1 and an enemy level 3 project independently through official Combat',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['published.starter'],opponentCreatureIds:['published.enemy'],
  creatureLevelsById:{'published.starter':1,'published.enemy':3}
 });
 assert.equal(levels.get('published.starter'),1);
 assert.equal(levels.get('published.enemy'),3);
});
test('the historical isolated Combat Tester retains level 20 and no alternative rules owner',()=>{
 const levels=resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['published.starter'],opponentCreatureIds:['published.enemy']
 });
 assert.equal(levels.get('published.starter'),20);
 assert.equal(levels.get('published.enemy'),20);
});
test('unknown/missing real fighter levels fail, never become a false level-20 battle',()=>{
 assert.throws(()=>resolveCaptureCombatCreatureLevelsV1({
  localCreatureIds:['published.starter'],opponentCreatureIds:['published.enemy'],
  creatureLevelsById:{'published.starter':1}
 }));
});
