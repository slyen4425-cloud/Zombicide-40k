import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  buildCaptureAssetIndex,
  resolveCaptureSpeciesAsset,
  resolveOwnedCreatureAsset,
  captureAssetPathAllowed,
} from '../src/modes/capture/assets.js';

const root=path.resolve(import.meta.dirname,'..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'docs','capture-creature-assets.json'),'utf8'));
const canonical=JSON.parse(fs.readFileSync(path.join(root,'docs','capture-creature-canonicalization.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'src','modes','capture','assets.js'),'utf8');

assert.equal(registry.schemaVersion,1);
assert.equal(registry.assetRoot,'v2/assets/capture/creatures/');
assert.equal(registry.policy.oneAssetRecordPerCanonicalSpecies,true);
assert.equal(registry.policy.doNotDuplicatePhysicalFilesForAliases,true);
assert.equal(registry.policy.neverFallbackToRpgOrDungeonArt,true);
assert.equal(registry.policy.preferValidatedCanonicalArt,true);
assert.equal(registry.policy.generatedLegacyFamiliesStayQuarantined,true);
assert.equal(registry.legacyRecovery.doNotGuessFilenames,true);

assert.equal(registry.speciesAssets.length,canonical.species.length);
assert.ok(registry.speciesAssets.length>=14);

const canonicalIds=new Set(canonical.species.map(x=>x.canonicalId));
const assetIds=new Set(registry.speciesAssets.map(x=>x.speciesId));
assert.equal(assetIds.size,registry.speciesAssets.length,'one asset record per canonical species');
assert.deepEqual([...assetIds].sort(),[...canonicalIds].sort());

const seenAliases=new Set();
for(const record of registry.speciesAssets){
  assert.ok(record.mainArt && Object.hasOwn(record.mainArt,'status') && Object.hasOwn(record.mainArt,'path'));
  assert.ok(record.iconArt && Object.hasOwn(record.iconArt,'status') && Object.hasOwn(record.iconArt,'path'));
  assert.equal(captureAssetPathAllowed(record.mainArt.path,registry),true);
  assert.equal(captureAssetPathAllowed(record.iconArt.path,registry),true);
  for(const alias of record.legacyAliases||[]){
    assert.ok(!seenAliases.has(alias),`duplicate alias ${alias}`);
    seenAliases.add(alias);
  }
}

assert.ok(!source.includes("../rpg/"));
assert.ok(!source.includes('assets/dungeon/creatures'));

const index=buildCaptureAssetIndex(registry);
assert.equal(index.aliasToSpecies.crea_embercub,'capture_braiseau');
assert.equal(index.aliasToSpecies.crea_braiseau,'capture_braiseau');
assert.equal(index.aliasToSpecies.crea_aquafin,'capture_aquafin');
assert.equal(index.aliasToSpecies.crea_dracendre,'capture_descendre');

const oldBraiseau=resolveCaptureSpeciesAsset('crea_embercub',registry);
const newerBraiseau=resolveCaptureSpeciesAsset('crea_braiseau',registry);
assert.equal(oldBraiseau.speciesId,'capture_braiseau');
assert.equal(newerBraiseau.speciesId,'capture_braiseau');
assert.equal(oldBraiseau.fallback,'capture-placeholder');
assert.equal(newerBraiseau.fallback,'capture-placeholder');

const owned=resolveOwnedCreatureAsset({instanceId:'owned-1',speciesId:'capture_aquafin'},registry);
assert.equal(owned.found,true);
assert.equal(owned.speciesId,'capture_aquafin');
assert.equal(owned.fallback,'capture-placeholder');

const unknown=resolveCaptureSpeciesAsset('crea_pyrolynx',registry);
assert.equal(unknown.found,false);
assert.equal(unknown.fallback,'capture-placeholder');

assert.equal(captureAssetPathAllowed('v2/assets/capture/creatures/aquafin.png',registry),true);
assert.equal(captureAssetPathAllowed('assets/dungeon/creatures/dng_wyvern.png',registry),false);
assert.equal(captureAssetPathAllowed('v2/assets/rpg/aquafin.png',registry),false);

console.log('capture-creature-assets.test.mjs: ok');
