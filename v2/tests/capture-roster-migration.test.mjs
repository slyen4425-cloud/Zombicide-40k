import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  buildSpeciesAliasIndex,
  canonicalizeSpeciesId,
  importLegacyOwnedCreatures,
  splitRosterIntoTeamAndReserve,
  moveOwnedCreature,
} from '../src/modes/capture/roster.js';

const root=path.resolve(import.meta.dirname,'..');
const canonicalization=JSON.parse(fs.readFileSync(path.join(root,'docs','capture-creature-canonicalization.json'),'utf8'));

const aliasIndex=buildSpeciesAliasIndex(canonicalization);
assert.equal(aliasIndex.byAlias.crea_embercub,'capture_braiseau');
assert.equal(aliasIndex.byAlias.crea_braiseau,'capture_braiseau');
assert.equal(aliasIndex.byAlias.crea_aquafin,'capture_aquafin');
assert.equal(aliasIndex.byAlias.crea_dracendre,'capture_descendre');

assert.deepEqual(canonicalizeSpeciesId('crea_noctecroc',canonicalization).canonicalId,'capture_nocteceoc');
assert.equal(canonicalizeSpeciesId('crea_pyrolynx',canonicalization).ok,false,'generated legacy evolution must not silently enter canon');

const legacy=[
  {instanceId:'owned-1',speciesId:'crea_embercub',name:'Flamme',level:3,xp:4,currentHp:7,maxHp:10,abilityCharges:{a:2}},
  {instanceId:'owned-2',speciesId:'crea_braiseau',name:'Braise',level:5,xp:9,currentHp:8,maxHp:12,abilityCharges:{a:1}},
  {instanceId:'owned-3',speciesId:'crea_aquafin',level:2},
  {instanceId:'owned-4',speciesId:'crea_voltik',level:2},
  {instanceId:'owned-5',speciesId:'crea_tidejaw',level:4},
  {instanceId:'owned-6',speciesId:'crea_rockhorn',level:4},
  {instanceId:'owned-7',speciesId:'crea_dracendre',level:6},
  {instanceId:'owned-x',speciesId:'crea_pyrolynx',level:7},
];

const migrated=importLegacyOwnedCreatures(legacy,canonicalization);
assert.equal(migrated.roster.length,7);
assert.equal(migrated.quarantine.length,1);
assert.equal(migrated.quarantine[0].legacy.speciesId,'crea_pyrolynx');

const braiseauOwned=migrated.roster.filter(c=>c.speciesId==='capture_braiseau');
assert.equal(braiseauOwned.length,2,'two owned creatures of same species must remain two instances');
assert.notEqual(braiseauOwned[0].instanceId,braiseauOwned[1].instanceId);
assert.equal(braiseauOwned[0].legacySpeciesId,'crea_embercub');
assert.equal(braiseauOwned[1].legacySpeciesId,'crea_braiseau');

const split=splitRosterIntoTeamAndReserve(migrated.roster,{preferredActiveIds:['owned-7','owned-3'],teamSize:6});
assert.equal(split.activeTeam.length,6);
assert.equal(split.reserve.length,1);
assert.equal(split.activeTeam[0].instanceId,'owned-7');
assert.equal(split.activeTeam[1].instanceId,'owned-3');

const movedOut=moveOwnedCreature(split,'owned-7','reserve');
assert.equal(movedOut.ok,true);
assert.equal(movedOut.activeTeam.length,5);
assert.ok(movedOut.reserve.some(c=>c.instanceId==='owned-7'));

const movedBack=moveOwnedCreature(movedOut,'owned-7','active');
assert.equal(movedBack.ok,true);
assert.equal(movedBack.activeTeam.length,6);

const full=moveOwnedCreature(split,split.reserve[0].instanceId,'active');
assert.equal(full.ok,false);
assert.equal(full.reason,'capture-active-team-limit');

console.log('capture-roster-migration.test.mjs: ok');
