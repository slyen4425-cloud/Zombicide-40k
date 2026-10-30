'use strict';
// TDD contract: this fails on the certified 11-author staging until the single
// official Combat Lab author source and GenSrpg delivery are repinned together.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const pins=JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
const settings=JSON.parse(read('tests/fixtures/capture-lab-authored-preview-settings-v1.json'));
const officialSha='248f718ec924106d16999d59e5dc8310f8450180';
const visualSha='b3d46ce6f2639ebb59a2984aeff17f97cbcd7377';
const ids=['crea-loup','crea_ailevent','crea_dracendre','crea_foudrillon','crea_lumilo','crea_maraileron','crea_mossback','crea_ombre_2','crea_scar_2','crea_tox_2','crea_voltik','kitsune_lunaire'];
test('official Combat source pin is the validated Kitsune 8-frame author SHA',()=>{
 assert.equal(pins.authoredSourceLabPin,officialSha);
 assert.match(read('assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs'),new RegExp(officialSha));
 assert.equal(pins.authoredAssetsPin,visualSha,'retain independently approved immutable visual catalog');
 assert.equal(pins.productionActivated,false,'staging only, never public activation');
});
test('official delivery and original World whitelist contain the same twelve exact author species',()=>{
 assert.equal(settings.authoredCreatureFiles.length,12);
 assert.deepEqual(settings.authoredCreatureFiles.map(f=>path.basename(f,'.capture-creature-transfer-v1.json')),ids);
 assert.deepEqual(pins.originalWildBattleButton.supportedSpecies,ids);
 assert.equal(Object.hasOwn(pins.originalWildBattleButton,'unpublishedOfficialTransfer'),false,'Kitsune no longer excluded after source fix');
 assert.equal(pins.originalWildBattleButton.officialSourceSha,officialSha);
 assert.equal(pins.originalWildBattleButton.productionActivated,false);
});
