import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  CAPTURE_ORB_LIBRARY,
  buildCaptureItemIndex,
  resolveCaptureItem,
  createCaptureInventory,
  consumeCaptureItem,
} from '../src/modes/capture/items.js';
import {
  normalizeCaptureAbility,
  initializeCreatureAbilityState,
  canUseCaptureAbility,
  spendCaptureAbility,
  tickCaptureAbilityCooldowns,
} from '../src/modes/capture/abilities.js';

const root=path.resolve(import.meta.dirname,'..');
const map=JSON.parse(fs.readFileSync(path.join(root,'docs','capture-items-abilities-map.json'),'utf8'));
const itemSource=fs.readFileSync(path.join(root,'src','modes','capture','items.js'),'utf8');
const abilitySource=fs.readFileSync(path.join(root,'src','modes','capture','abilities.js'),'utf8');

assert.equal(map.schemaVersion,1);
assert.equal(map.captureItems.ownership,'capture_only');
assert.equal(map.abilities.ownership,'capture_only');
assert.equal(map.runtimeRules.noRpgTurnRuntimeDependency,true);
assert.equal(map.runtimeRules.noRpgD100Dependency,true);
assert.equal(map.runtimeRules.noRpgInventoryDependency,true);
assert.equal(map.runtimeRules.captureValuesMustNotBeGuessed,true);
assert.equal(map.captureItems.lowHpBonus.thresholdPercent,30);
assert.equal(map.captureItems.lowHpBonus.multiplier,'pending_recovery_or_design');

const expectedOrbIds=['capture_orb_basic','capture_orb_plus','capture_orb_ultra','capture_orb_master'];
assert.deepEqual(map.captureItems.legacyOrbIdsConfirmed.map(x=>x.legacyId),expectedOrbIds);
assert.deepEqual(CAPTURE_ORB_LIBRARY.map(x=>x.id),expectedOrbIds);
assert.ok(CAPTURE_ORB_LIBRARY.every(x=>x.captureCoefficient===null));
assert.ok(CAPTURE_ORB_LIBRARY.every(x=>x.coefficientStatus==='pending_recovery_or_rebalance'));

const index=buildCaptureItemIndex();
assert.equal(index.aliasToId.capture_orb_basic,'capture_orb_basic');
assert.equal(resolveCaptureItem('capture_orb_ultra').found,true);
assert.equal(resolveCaptureItem('legacy_unknown_orb').quarantine,true);

const inventory=createCaptureInventory({capture_orb_basic:3,capture_orb_plus:1,unknown_item:99});
assert.deepEqual(inventory.counts,{capture_orb_basic:3,capture_orb_plus:1});
const spent=consumeCaptureItem(inventory,'capture_orb_basic');
assert.equal(spent.ok,true);
assert.equal(spent.inventory.counts.capture_orb_basic,2);
assert.equal(inventory.counts.capture_orb_basic,3,'inventory mutation must be immutable');
assert.equal(consumeCaptureItem({counts:{}},'capture_orb_master').reason,'insufficient_capture_item');

const def=normalizeCaptureAbility({id:'cap_test',name:'Test',chargeMax:2,cost:3,cooldown:4,tags:['fire']});
assert.equal(def.chargeMax,2);
assert.equal(def.cost,3);
assert.equal(def.cooldown,4);

const creature={instanceId:'owned-1',speciesId:'capture_braiseau',abilityIds:['cap_test']};
const initial=initializeCreatureAbilityState(creature,[def]);
assert.equal(initial.cap_test.charges,2);
assert.equal(initial.cap_test.cost,3);
assert.equal(canUseCaptureAbility(initial,'cap_test').ok,true);

const first=spendCaptureAbility(initial,'cap_test',{cooldown:2});
assert.equal(first.ok,true);
assert.equal(first.state.cap_test.charges,1);
assert.equal(first.state.cap_test.cooldownRemaining,2);
assert.equal(initial.cap_test.charges,2,'ability state mutation must be immutable');
assert.equal(canUseCaptureAbility(first.state,'cap_test').reason,'capture_ability_cooldown');
const cooled=tickCaptureAbilityCooldowns(first.state,2);
assert.equal(cooled.cap_test.cooldownRemaining,0);
const second=spendCaptureAbility(cooled,'cap_test');
assert.equal(second.state.cap_test.charges,0);
assert.equal(canUseCaptureAbility(second.state,'cap_test').reason,'capture_ability_no_charges');

assert.ok(!itemSource.includes('/rpg/'));
assert.ok(!abilitySource.includes('/rpg/'));
assert.ok(!itemSource.includes('d100'));
assert.ok(!abilitySource.includes('turnSequence'));

console.log('capture-items-abilities.test.mjs: ok');
