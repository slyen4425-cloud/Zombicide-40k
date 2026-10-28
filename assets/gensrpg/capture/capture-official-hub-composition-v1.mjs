// Single Capture-owned composition of the official author, World, roster and
// Combat port. Opt-in: the original public Hub owner will call this only after
// migration, UI and PWA gates. No window hooks, storage, fallback or new clock.
import {COMBAT_LAB_SOURCE_V1,loadCombatLabEngineV1} from './combat-lab-engine-loader-v1.mjs';
import {createCombatLabAuthoredSourceV1} from './combat-lab-authored-source-v1.mjs';
import {createCombatLabProviderV1} from './combat-lab-provider-v1.mjs';
import {createCaptureWorldLabWildTransactionV1} from './capture-world-lab-wild-transaction-v1.mjs';
import {createCaptureLabHubBattleCommandV1} from './capture-lab-hub-battle-command-v1.mjs';

const REQUIRED_OWNERS=[
 'activeHeroId','loadHeroState','saveHeroState',
 'readWorldState','saveWorldState','consumeWildEncounter',
 'worldStorageKey','nextEncounterId'
];
const DATA_ROOT='assets/gensrpg/capture/runtime-data/';
const VENDOR_ROOT='vendor/combat-lab/';
const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const REQUIRED_DATA=['author-inputs.json','source.json','global-visual-assets.json'];

async function digestSha256(bytes) {
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)throw new Error('Secure SHA-256 verification unavailable: do not load unverified author data');
 const result=await subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(result)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
function ownProperty(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function uniqueNames(source,field) {
 if(!Array.isArray(source)||source.some(id=>typeof id!=='string'||!id.trim())||
    new Set(source).size!==source.length)throw new TypeError(field+' must be unique nonempty IDs');
 return source;
}
function makeReader(site,readBytes) {
 if(readBytes!==undefined&&typeof readBytes!=='function')throw new TypeError('Read-only package reader must be a function');
 return readBytes??(async relative=>{
  const response=await fetch(new URL(relative,site),{cache:'no-store'});
  if(!response.ok)throw new Error('Official Combat payload unavailable: '+relative);
  return new Uint8Array(await response.arrayBuffer());
 });
}
async function loadPackage(site,readBytes){
 const read=makeReader(site,readBytes),decoder=new TextDecoder();
 async function bytes(path){
  const raw=await read(path);
  if(raw instanceof Uint8Array)return raw;
  if(raw instanceof ArrayBuffer)return new Uint8Array(raw);
  throw new TypeError('Official Combat package must return raw bytes: '+path);
 }
 const manifest=JSON.parse(decoder.decode(await bytes(DATA_ROOT+'delivery-manifest.json')));
 if(manifest?.schema!=='gensrpg-capture-official-delivery-v1'||manifest.version!==1||
    manifest.productionActivated!==false||manifest.combatSha!==COMBAT_LAB_SOURCE_V1.sha||
    manifest.combatRepository!==COMBAT_LAB_SOURCE_V1.repository||
    !SHA.test(manifest.assetsSha)||manifest.vendorDirectory!==VENDOR_ROOT||
    manifest.dataDirectory!==DATA_ROOT) {
  throw new TypeError('Capture delivery is not from the pinned official Combat author');
 }
 const ids=uniqueNames(manifest.supportedCreatureIds,'Official Combat species');
 if(ids.length<2)throw new TypeError('Incomplete official authored Capture creature delivery');
 if(!Array.isArray(manifest.transport))throw new TypeError('Official Combat delivery checksum manifest missing');
 const entries=new Map();
 for(const entry of manifest.transport){
  if(typeof entry?.path!=='string'||!Number.isInteger(entry.size)||entry.size<1||
     !HEX.test(entry.sha256)||entries.has(entry.path)||
     !entry.path.startsWith(DATA_ROOT)&&!entry.path.startsWith(VENDOR_ROOT)) {
   throw new TypeError('Malformed or duplicate official delivery inventory');
  }
  entries.set(entry.path,entry);
 }
 const verified={};
 for(const filename of REQUIRED_DATA){
  const path=DATA_ROOT+filename;
  const expected=entries.get(path);
  if(!expected)throw new Error('Missing signed author data: '+path);
  const raw=await bytes(path);
  if(raw.length!==expected.size||await digestSha256(raw)!==expected.sha256){
   throw new Error('Official Combat author payload does not match pinned delivery SHA256: '+path);
  }
  verified[filename]=JSON.parse(decoder.decode(raw));
 }
 const inputs=verified['author-inputs.json'],source=verified['source.json'],catalog=verified['global-visual-assets.json'];
 if(inputs?.schema!=='gensrpg-capture-lab-author-inputs-v1'||
    inputs.sourceSha!==manifest.combatSha||
    source?.combatSha!==manifest.combatSha||
    source.assetsSha!==manifest.assetsSha||source.assetsRepository!==manifest.assetsRepository||
    catalog?.storage?.repository!==manifest.assetsRepository||
    !Array.isArray(inputs.creatureTransfers)||!Array.isArray(inputs.configuredSkillDrafts)||
    !inputs.battleSettings||typeof inputs.battleSettings!=='object') {
  throw new TypeError('Mismatched official Combat author, assets or battle configuration');
 }
 const authoredIds=uniqueNames(inputs.creatureTransfers.map(x=>x?.draft?.id),'Authored transfer IDs');
 if(authoredIds.length!==ids.length||authoredIds.some((id,i)=>id!==ids[i])||
    !authoredIds.includes(source.expectedPlayer)||!authoredIds.includes(source.expectedOpponent)){
  throw new TypeError('Published Capture species are not identical to authored species');
 }
 return Object.freeze({manifest,inputs,source,catalog});
}

// The caller supplies the true Capture World and roster owners. It never gives
// the combat engine permission to write the user's saves by itself.
export async function createCaptureOfficialHubCompositionV1({
 siteBaseUrl,owners,combatPort,mountBattle,validateBattleResult,
 nextClock,onReturn=()=>{},onError=()=>{},readBytes
}) {
 const site=new URL(siteBaseUrl);
 if(!site.pathname.endsWith('/'))throw new TypeError('Capture delivery site URL must end with /');
 if(typeof location!=='undefined'&&site.origin!==location.origin){
  throw new TypeError('Official Combat modules must be served from this GenSrpg site');
 }
 for(const name of REQUIRED_OWNERS){
  if(typeof owners?.[name]!=='function')throw new TypeError('Original Capture owner missing '+name);
 }
 for(const [name,fn] of Object.entries({mountBattle,validateBattleResult,onReturn,onError})){
  if(typeof fn!=='function')throw new TypeError('Capture Hub owner needs '+name);
 }
 const packageData=await loadPackage(site,readBytes);
 const vendor=new URL(VENDOR_ROOT,site);
 const moduleNames=[
  'src/contracts/capture-creature-transfer-v1.js',
  'src/contracts/capture-skill-editor-draft-v1.js',
  'src/adapters/input/capture/capture-combat-rules-overlay-v1.js',
  'src/adapters/input/capture/capture-editor-exporter-v3.js',
  'src/adapters/input/capture/capture-export-adapter-stack-v1.js'
 ];
 // The ESM imports, adapter and engine all come from the same build-verified
 // immutable Lab checkout. Never load a moving GitHub branch at play time.
 const [engine,...authorModules]=await Promise.all([
  loadCombatLabEngineV1(vendor),
  ...moduleNames.map(path=>import(new URL(path,vendor).href))
 ]);
 if(engine.source?.sha!==packageData.manifest.combatSha)throw new Error('Combat Core version changed from the author package');
 const [creature,draft,rules,exporter,adapter]=authorModules;
 const authoredSource=createCombatLabAuthoredSourceV1({
  normalizeCreatureTransfer:creature.normalizeCaptureCreatureTransferV1,
  normalizeSkillDraft:draft.normalizeCaptureSkillEditorDraftV1,
  overlayCombatRules:rules.applyCaptureCombatRulesToCreatureDraftV1,
  exportEditorDrafts:exporter.exportCaptureEditorDraftsToCombatExportV3,
  adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
  statRegistry:packageData.inputs.statRegistry,
  configuredSkillDrafts:packageData.inputs.configuredSkillDrafts,
  creatureTransfers:packageData.inputs.creatureTransfers
 });
 const settings=packageData.inputs.battleSettings;
 const transaction=createCaptureWorldLabWildTransactionV1({
  ...Object.fromEntries(REQUIRED_OWNERS.map(name=>[name,owners[name]])),
  authoredSource,adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
  validateBattleResult,readBattleSettings:()=>settings
 });
 const resources=Object.freeze({
  authoredSource,catalog:packageData.catalog,
  source:packageData.source,settings,
  publishedSpecies:Object.freeze([...packageData.manifest.supportedCreatureIds])
 });
 const command=createCaptureLabHubBattleCommandV1({
  transaction,combatPort,engine,createProvider:createCombatLabProviderV1,
  clock:nextClock,mountBattle:(battle,context)=>mountBattle(battle,context,resources),
  onReturn,onError
 });
 return Object.freeze({
  startWildBattle(id){
   if(!resources.publishedSpecies.includes(id)){
    throw new RangeError('This species has no official Combat Lab author transfer in the current release: '+id);
   }
   return command.startWildBattle(id);
  },
  cancel:()=>command.cancel(),
  retryCommit:()=>command.retryCommit(),
  status:()=>command.status(),
  dispose:()=>command.dispose(),
  resources
 });
}