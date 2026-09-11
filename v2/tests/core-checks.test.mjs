import assert from 'node:assert/strict';
import { rollDie, normalizeCheckSpec, resolveCheck, resolveActorCheck } from '../src/core/checks.js';

assert.equal(rollDie(100,()=>0),1);
assert.equal(rollDie(100,()=>0.999999),100);
assert.equal(rollDie(1,()=>0),1,'die size is clamped internally to at least 2 but a zero roll still yields 1');

const normalized=normalizeCheckSpec({die:20,statValue:3,difficulty:12,modifier:2,mode:'roll-over'});
assert.deepEqual(normalized,{die:20,statId:null,statValue:3,difficulty:12,modifier:2,mode:'roll-over'});

let check=resolveCheck({die:100,roll:42,statValue:10,difficulty:50,modifier:-5,mode:'roll-under'});
assert.equal(check.threshold,55);
assert.equal(check.success,true);
assert.equal(check.die,100);
assert.equal(check.mode,'roll-under');

check=resolveCheck({die:20,roll:8,statValue:4,difficulty:15,modifier:1,mode:'roll-over'});
assert.equal(check.threshold,10);
assert.equal(check.success,false);

const actor={stats:{agility:12}};
check=resolveActorCheck({die:100,roll:60,statId:'agility',difficulty:50,modifier:0,mode:'roll-under'},actor);
assert.equal(check.statValue,12);
assert.equal(check.threshold,62);
assert.equal(check.success,true);

const combatActor={state:{stats:{strength:7}}};
check=resolveActorCheck({roll:58,statId:'strength',difficulty:50},combatActor);
assert.equal(check.statValue,7);
assert.equal(check.threshold,57);
assert.equal(check.success,false);

console.log('core-checks.test.mjs: OK');
