import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'capture-storage-migration.json'), 'utf8'));

assert.equal(map.architecture.mode, 'capture');
assert.equal(map.architecture.noSharedMutableGameplayStorage, true);
assert.equal(map.architecture.lazyLoadOnly, true);
assert.equal(map.migrationRules.legacyReadOnly, true);
assert.equal(map.migrationRules.neverWriteLegacyKeys, true);
assert.equal(map.migrationRules.neverFallbackToRpgStorageAtRuntime, true);
assert.equal(map.migrationRules.teamSizeLimit, 6);
assert.equal(map.migrationRules.overflowOwnedCreaturesGoToReserve, true);
assert.equal(map.migrationRules.canonicalizeCreatureIdsBeforeRosterImport, true);
assert.equal(map.migrationRules.doNotMergeDistinctOwnedInstances, true);

const namespaces = Object.values(map.v2Namespaces);
assert.ok(namespaces.length >= 8);
for (const key of namespaces) {
  assert.match(key, /^gensrpg:v2:capture:/, `V2 Capture namespace must be isolated: ${key}`);
  assert.ok(!key.includes(':rpg:'), `Capture namespace must not point to RPG: ${key}`);
  assert.ok(!key.includes(':survival:'), `Capture namespace must not point to Survival: ${key}`);
  assert.ok(!key.includes(':pvp:'), `Capture namespace must not point to PVP: ${key}`);
}
assert.equal(new Set(namespaces).size, namespaces.length, 'Capture V2 namespaces must be unique');

const sourcePatterns = map.legacySources.map((entry) => entry.pattern);
for (const required of [
  'gensrpg_shared_entities_v1__<profileId>',
  'gensrpg_shared_entities_v1__family__creature',
  'starter_capture',
  'gensrpg_capture_wild_rules_v1_<profileId>',
  'gensrpg_capture_mj_rules_v137_<profileId>',
  'gensrpg_capture_battle_mode_v1_<profileId>'
]) {
  assert.ok(sourcePatterns.includes(required), `Missing legacy Capture source: ${required}`);
}

for (const source of map.legacySources) {
  if (source.pattern.startsWith('gensrpg_shared_entities_v1')) {
    assert.equal(source.action, 'read_for_migration_only');
  }
}

assert.equal(map.generatedLegacyFamilies.classification, 'quarantine');
assert.ok(map.generatedLegacyFamilies.families.length >= 20);

console.log('capture-storage-migration.test.mjs: ok');
