import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveCaptureCombatCreatureLevelsV1} from '../_site/vendor/combat-lab/src/ui/capture-editor-combat-test-v1.js';

const pins=JSON.parse(fs.readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
test('GenSRPG consumer explicitly pins certified Combat main owner commit with per-creature levels',()=>{
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.combat.sha,'4425d123f4f02d04b2e2942c989789abaf159b0a');
 assert.equal(pins.combat.certifiedCiRun,41841493907);
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'12759a802f57b83127aef46884763ef53e13b481',
  'Exploration pin must be the official merge with the certified combat journal tree');
 assert.equal(pins.exploration.certifiedCiRun,41877513483);
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
