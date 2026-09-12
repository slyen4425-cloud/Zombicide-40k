import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync(new URL('../docs/capture-dynamic-combat-contract.json',import.meta.url),'utf8'));

assert.equal(contract.architecture.mode,'capture');
assert.equal(contract.architecture.runtime,'dedicated_capture_dynamic_runtime');
assert.equal(contract.architecture.sharesNeutralSpatialCore,true);
assert.equal(contract.architecture.sharesRpgTurnRuntime,false);
assert.equal(contract.architecture.usesTurnSequence,false);
assert.equal(contract.architecture.usesD100Timeline,false);
assert.equal(contract.architecture.exactRealtimeTiming,'future_design_not_frozen');

assert.equal(contract.entryExit.startsFromActiveEncounter,true);
assert.equal(contract.entryExit.requiresPlayerActiveCreature,true);
assert.equal(contract.entryExit.explorationStatePausedNotDestroyed,true);
assert.ok(contract.entryExit.battleCanEndBy.includes('capture_success'));
assert.ok(contract.entryExit.battleCanEndBy.includes('flee'));
assert.equal(contract.entryExit.captureSuccessEndsWildBattle,true);
assert.equal(contract.entryExit.returnToExplorationAfterBattle,true);

assert.equal(contract.activeCreature.oneActiveCreaturePerSideByDefault,true);
assert.equal(contract.activeCreature.playerChoosesFromActiveTeam,true);
assert.equal(contract.activeCreature.ownedInstanceStatePreserved,true);
assert.equal(contract.activeCreature.switchingAllowed,true);
assert.equal(contract.activeCreature.switchMustNotMergeCreatureInstances,true);
assert.equal(contract.activeCreature.exactSwitchDelayOrCost,'future_design_not_frozen');

assert.equal(contract.spatial.movementExpected,true);
assert.equal(contract.spatial.positioningExpected,true);
assert.equal(contract.spatial.rangeExpected,true);
assert.equal(contract.spatial.usesNeutralSpatialCore,true);
assert.equal(contract.spatial.mustNotUseRpgCombatState,true);

assert.equal(contract.defense.dodgeOrPositioningExpected,true);
assert.equal(contract.defense.exactDodgeFormula,'future_design_not_frozen');

assert.equal(contract.abilities.usesCaptureAbilityRuntime,true);
assert.equal(contract.abilities.chargesPerOwnedInstance,true);
assert.equal(contract.abilities.costsSupported,true);
assert.equal(contract.abilities.cooldownsSupported,true);
assert.equal(contract.abilities.rangeCanBeDefinedPerAbility,true);

assert.equal(contract.capture.captureAttemptAllowedDuringWildBattle,true);
assert.equal(contract.capture.usesCaptureAttemptEngine,true);
assert.equal(contract.capture.lowHpBonusThresholdPercent,30);
assert.equal(contract.capture.captureSuccessCreatesOwnedInstance,true);
assert.equal(contract.capture.overflowGoesToReserve,true);

assert.equal(contract.aiAndPvp.vsAiSupported,true);
assert.equal(contract.aiAndPvp.vsPlayerSupported,true);
assert.equal(contract.aiAndPvp.networkSyncModel,'future_design_not_frozen');

for(const value of [
  contract.architecture.exactRealtimeTiming,
  contract.activeCreature.exactSwitchDelayOrCost,
  contract.spatial.lineOfSightPolicy,
  contract.defense.exactDodgeFormula,
  contract.defense.invulnerabilityFrames,
  contract.abilities.exactCastTime,
  contract.aiAndPvp.aiDecisionModel,
  contract.aiAndPvp.networkSyncModel,
]) assert.equal(value,'future_design_not_frozen');
