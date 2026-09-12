import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, '../docs/capture-creature-canonicalization.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

assert.equal(data.schemaVersion, 1);
assert.equal(data.policy.oneCanonicalSpecies, true);
assert.equal(data.policy.preserveLegacyAliases, true);
assert.equal(data.policy.migrateLegacyIds, true);
assert.equal(data.policy.doNotMergeInventoryCountsAutomatically, true);

const species = data.species;
assert.ok(Array.isArray(species) && species.length >= 14);

const ids = species.map((entry) => entry.canonicalId);
assert.equal(new Set(ids).size, ids.length, 'canonical IDs must stay unique');

const names = species.map((entry) => entry.canonicalName.toLocaleLowerCase('fr-FR'));
assert.equal(new Set(names).size, names.length, 'canonical names must stay unique');

const aliasOwner = new Map();
for (const entry of species) {
  assert.ok(entry.canonicalId.startsWith('capture_'));
  assert.ok(Array.isArray(entry.legacyAliases));
  for (const alias of entry.legacyAliases) {
    assert.ok(!aliasOwner.has(alias), `legacy alias ${alias} cannot map to two canonical species`);
    aliasOwner.set(alias, entry.canonicalId);
  }
}

for (const entry of species) {
  if (entry.evolutionTo) {
    assert.ok(ids.includes(entry.evolutionTo), `evolution target ${entry.evolutionTo} must exist`);
  }
}

assert.equal(aliasOwner.get('crea_embercub'), 'capture_braiseau');
assert.equal(aliasOwner.get('crea_braiseau'), 'capture_braiseau');
assert.equal(aliasOwner.get('crea_galewing'), 'capture_ailevent');
assert.equal(aliasOwner.get('crea_ailevent'), 'capture_ailevent');
assert.equal(aliasOwner.get('crea_lumipup'), 'capture_lumino');
assert.equal(aliasOwner.get('crea_lumilo'), 'capture_lumino');
assert.equal(aliasOwner.get('crea_nightfang'), 'capture_nocteceoc');
assert.equal(aliasOwner.get('crea_noctecroc'), 'capture_nocteceoc');
assert.equal(aliasOwner.get('crea_rockhorn'), 'capture_rocorne');
assert.equal(aliasOwner.get('crea_rocorne'), 'capture_rocorne');
assert.equal(aliasOwner.get('crea_sparkmoth'), 'capture_lucieclaire');
assert.equal(aliasOwner.get('crea_lucieclair'), 'capture_lucieclaire');
assert.equal(aliasOwner.get('crea_miragecat'), 'capture_mirachat');
assert.equal(aliasOwner.get('crea_mirachat'), 'capture_mirachat');
assert.equal(aliasOwner.get('crea_ashdrake'), 'capture_descendre');
assert.equal(aliasOwner.get('crea_dracendre'), 'capture_descendre');

const evolutionPairs = species
  .filter((entry) => entry.evolutionTo)
  .map((entry) => `${entry.canonicalId}->${entry.evolutionTo}`)
  .sort();

assert.deepEqual(evolutionPairs, [
  'capture_aquafin->capture_maraileron',
  'capture_voltige->capture_fulguros'
]);

const rejected = new Set(data.rejectedLegacyEvolutionEdges.map(([from, to]) => `${from}->${to}`));
for (const edge of [
  'crea_braiseau->crea_pyrolynx',
  'crea_ailevent->crea_rafalcor',
  'crea_lumilo->crea_solarys',
  'crea_noctecroc->crea_ombrage',
  'crea_rocabri->crea_rocorne',
  'crea_lucieclair->crea_foudrillon',
  'crea_mirachat->crea_chimerage',
  'crea_dracendre->crea_volcadrake'
]) {
  assert.ok(rejected.has(edge), `legacy generated edge ${edge} must remain blocked by default`);
}

console.log('capture creature canonicalization regression: ok');
