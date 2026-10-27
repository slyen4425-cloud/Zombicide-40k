// Deterministic preview transport from pinned official Combat Lab *author*
// records. Generates data, never an alternative Combat engine/catalog owner.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {COMBAT_LAB_SOURCE_V1} from '../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs';
import {createCaptureLabAuthoredSourceV1} from '../assets/gensrpg/capture/combat-lab-authored-source-v1.mjs';

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lab=resolve(process.argv[2]||'');
const visuals=resolve(process.argv[3]||'');
const output=resolve(process.argv[4]||join(project,'_site/capture-lab-preview'));
if(!process.argv[2]||!process.argv[3])throw new Error('Usage: prepare_capture_lab_authored_preview.mjs <pinned-lab> <pinned-global-assets> <output>');
const ref=JSON.parse(readFileSync(join(project,'docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'),'utf8'));
const commit=root=>execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(commit(lab)!==COMBAT_LAB_SOURCE_V1.sha||ref.authoredSourceLabPin!==COMBAT_LAB_SOURCE_V1.sha){
 throw new Error('Official Combat Lab author source SHA drift');
}
if(commit(visuals)!==ref.authoredAssetsPin||
 ref.authoredAssetsRepository!=='slyen4425-cloud/GenSrpg_labo_combat_dynamique'){
 throw new Error('Official Capture visual catalog SHA or repository drift');
}
const data=relative=>JSON.parse(readFileSync(join(lab,relative),'utf8'));
const src=relative=>import(pathToFileURL(join(lab,relative)).href);
const [creature,skill,skillDraft,rules,exporter,adapter,portable,complex,presets]=await Promise.all([
 src('src/contracts/capture-creature-transfer-v1.js'),
 src('src/contracts/capture-skill-transfer-v1.js'),
 src('src/contracts/capture-skill-editor-draft-v1.js'),
 src('src/adapters/input/capture/capture-combat-rules-overlay-v1.js'),
 src('src/adapters/input/capture/capture-editor-exporter-v3.js'),
 src('src/adapters/input/capture/capture-export-adapter-stack-v1.js'),
 src('src/catalogs/capture-portable-native-skill-catalog-v1.js'),
 src('src/catalogs/capture-complex-native-skill-catalog-v1.js'),
 src('src/catalogs/capture-showcase-skill-presets-v1.js')
]);
const makeSkill=skillDraft.normalizeCaptureSkillEditorDraftV1;
const byId=new Map();
for(const row of data('data/combat/skills/catalog.v1.json').entries){
 const entry=makeSkill({schema:'capture-skill-editor-draft-v1',id:row.id,
  description:row.label||row.id,requiredLevel:1,usageScopes:['capture','combat'],
  definition:row.definition,presentation:null});
 byId.set(entry.id,entry);
}
for(const item of [...portable.capturePortableNativeSkillDraftsV1(),...complex.captureComplexNativeSkillDraftsV1()]){
 byId.set(item.id,item);
}
for(const file of presets.CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1){
 const authored=skill.normalizeCaptureSkillTransferV1(data(file));
 byId.set(authored.draft.id,authored.draft);
}
const settings=JSON.parse(readFileSync(join(project,'tests/fixtures/capture-lab-authored-preview-settings-v1.json'),'utf8'));
if(settings.schema!=='gensrpg-capture-authored-preview-settings-v1'||settings.version!==1){
 throw new TypeError('Unsupported author preview settings schema');
}
const producer=createCaptureLabAuthoredSourceV1({
 normalizeCreatureTransfer:creature.normalizeCaptureCreatureTransferV1,
 normalizeSkillDraft:makeSkill,
 overlayCombatRules:rules.applyCaptureCombatRulesToCreatureDraftV1,
 exportEditorDrafts:exporter.exportCaptureEditorDraftsToCombatExportV3,
 adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
 statRegistry:data('data/capture/monster-capture-stat-registry.v1.json'),
 configuredSkillDrafts:[...byId.values()],
 creatureTransfers:settings.authoredCreatureFiles.map(data)
});
const author=producer.buildEncounter(settings.battle);
const visualCatalog=JSON.parse(readFileSync(join(visuals,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
if(visualCatalog.storage?.repository!==ref.authoredAssetsRepository){
 throw new Error('Visual source is not the original author-owned catalog');
}
const referenced=new Set();
for(const binding of Object.values(author.exported.presentation?.creatures??{})){
 for(const record of Object.values(binding.visual??{})){
  if(record&&typeof record.assetId==='string')referenced.add(record.assetId);
 }
}
for(const binding of Object.values(author.exported.presentation?.skills??{})){
 for(const record of Object.values(binding.visual??{})){
  if(record&&typeof record.assetId==='string')referenced.add(record.assetId);
 }
}
const known=new Set(visualCatalog.assets.map(item=>item.id));
const missing=[...referenced].filter(id=>!known.has(id));
// Not every authored asset uses a pack:capture file; core: IDs belong to the
// Lab built-in asset namespace and are deliberately NOT invented here.
const absentPack=missing.filter(id=>id.startsWith('pack:capture:'));
if(absentPack.length)throw new Error('Authored sprite absent from pinned visual catalog: '+absentPack.join(', '));
const folder=join(output,'assets/gensrpg/capture/preview/generated');
mkdirSync(folder,{recursive:true});
writeFileSync(join(folder,'authored-export.json'),JSON.stringify(author.exported,null,2)+'\n');
writeFileSync(join(folder,'global-visual-assets.json'),JSON.stringify(visualCatalog)+'\n');
writeFileSync(join(folder,'source.json'),JSON.stringify({
 schema:'gensrpg-capture-lab-authored-preview-source-v1',
 combatSha:COMBAT_LAB_SOURCE_V1.sha,
 assetsSha:ref.authoredAssetsPin,
 assetsRepository:ref.authoredAssetsRepository,
 encounter:settings.battle.encounterId,
 expectedPlayer:settings.battle.player.creatureId,
 expectedOpponent:settings.battle.opponent.creatureId,
 playerInstanceId:settings.battle.player.instanceId,
 opponentInstanceId:settings.battle.opponent.instanceId
},null,2)+'\n');
console.log(JSON.stringify({authored:author.exported.actors.map(x=>x.creatureId),assets:referenced.size,source:COMBAT_LAB_SOURCE_V1.sha,visuals:ref.authoredAssetsPin}));
