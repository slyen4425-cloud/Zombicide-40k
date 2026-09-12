import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'capture-gameplay-contracts.json'), 'utf8'));

assert.equal(rules.architecture.mode, 'capture');
assert.equal(rules.architecture.separateTopLevelMode, true);
assert.equal(rules.architecture.sharesNeutralSpatialBaseWithRpg, true);
assert.equal(rules.architecture.sharesWorldBuilderBaseWithRpg, true);
assert.equal(rules.architecture.sharesRpgTurnEngine, false);
assert.equal(rules.architecture.usesRpgTurnSequence, false);
assert.equal(rules.architecture.usesRpgD100Timeline, false);
assert.equal(rules.architecture.combatRuntime, 'dedicated_capture_runtime');

assert.equal(rules.captureRules.speciesOwnCaptureRate, true);
assert.equal(rules.captureRules.lowHpBonus.enabled, true);
assert.equal(rules.captureRules.lowHpBonus.thresholdPercent, 30);
assert.equal(rules.captureRules.captureItems.mustLiveInCaptureItemLibrary, true);
assert.equal(rules.captureRules.captureItems.mustNotBeRpgEquipment, true);

assert.equal(rules.rosterRules.activeTeamLimit, 6);
assert.equal(rules.rosterRules.reserveLimit, 'unbounded_by_default');
assert.equal(rules.rosterRules.ownedCreaturesAreInstances, true);
assert.equal(rules.rosterRules.overflowCaptureGoesToReserve, true);
assert.equal(rules.rosterRules.doNotMergeOwnedInstancesDuringMigration, true);

assert.equal(rules.abilityRules.abilitiesCanHaveCharges, true);
assert.equal(rules.abilityRules.abilitiesCanHaveCosts, true);
assert.equal(rules.abilityRules.chargesArePerOwnedCreatureInstance, true);

assert.equal(rules.encounterRules.biomesSupported, true);
assert.equal(rules.encounterRules.spawnPercentPerBiomeSupported, true);
assert.equal(rules.encounterRules.mustNotReadRpgBestiaryAtRuntime, true);

assert.equal(rules.battleRules.vsAiSupported, true);
assert.equal(rules.battleRules.vsPlayerSupported, true);
assert.equal(rules.battleRules.futureDynamicModeRequired, true);
assert.equal(rules.battleRules.creatureSwitchExpected, true);

for (const pending of [
  rules.captureRules.lowHpBonus.exactMultiplier,
  rules.captureRules.captureItems.exactLegacyIds,
  rules.captureRules.captureItems.exactCoefficients,
  rules.abilityRules.exactLegacyChargeValues,
  rules.abilityRules.exactLegacyCosts
]) {
  assert.match(String(pending), /^pending_/, `Unverified legacy value must stay pending: ${pending}`);
}

assert.equal(rules.migrationPolicy.unknownCoefficient, 'do_not_guess');
console.log('capture-gameplay-contracts.test.mjs: ok');
