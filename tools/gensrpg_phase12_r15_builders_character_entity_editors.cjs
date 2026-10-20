'use strict';
/* GenSrpG Phase12 R15 — exact 54-function Builders-only relocation from second R14 anonymous script.
 * Original declarations preserved byte-exact; no variable, listener, startup, Core storage or Capture runtime moved.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path');
const SOURCE='dab5be5dedfa56c49d76d40a4cb824a0098903f0',SOURCE_SIZE=1772759;
const TARGET='9f35eb833a6ede4b91399854f19bb9bef59f45ab',TARGET_SIZE=1729855;
const SCRIPT='50e5b25ce6d3d9bf41c6e684f5548cc5842be935',REMAIN='629d27c9df8e7fea52c311248da189a065f69a6a';
const MODULE='assets/gensrpg/builders/legacy-character-entity-editors-v1.js',OWNER_BLOB='318aad27b69593f338ace5f3602dfd7fa351c274',OWNER_SIZE=43415;
const HEADER='/* GenSrpG Phase12 R15: 54 byte-exact original Builders character, creature and companion editor functions.\n * Builders UI/data authoring only; all Core, shared-storage, Capture gameplay and Shell owners remain in place.\n * Classic synchronous script at the original parser seam; original functions are unchanged.\n */\n';
const HOOK='<script src="'+MODULE+'"></script>\n';
const RANGES='15014,15431;15432,16561;16562,16910;16911,17017;17018,17112;17113,17209;17210,17439;17442,18171;18172,18364;18365,18612;18613,19702;19704,22743;23107,23186;23187,23812;23813,24104;24105,24422;24423,24654;24655,24981;24982,25200;25201,25578;48363,49350;49351,49536;49537,51552;51554,52219;52220,52390;52391,53216;53217,54493;54494,54632;54633,55107;55108,55372;55374,55725;55726,56240;56241,56419;57631,58480;58481,58631;58632,58748;58750,59785;59786,60592;60593,61079;61080,61532;61534,62525;62905,63470;63471,63735;63736,63967;63968,67970;67971,68695;68696,72327;82836,83662;84038,86373;86374,86658;86659,86706;86707,92014;92015,92450;92451,93464'.split(';').map(s=>s.split(',').map(Number));
const NAMES='hcStartingItemOptions|hcRenderStartingEquipment|hcAddStartingEquipment|hcRemoveStartingEquipment|hcSetStartItem|hcSetStartSlot|hcLoadStartingEquipment|hcUseStatsForHeroRecord|hcResetStatsUiForHero|hcRenderRpgStatsUsage|applyHeroCreatorModeSections|openHeroCreatorStatic|hcClassicProgressionSlots|hcNormalizeProgressionSlots|hcProgressionColorOptions|hcAddProgressionTier|hcRemoveProgressionTier|hcMoveProgressionTier|hcUpdateProgressionSlot|hcResetProgressionClassic|openControllableCreatureLibrary|closeControllableCreatureLibrary|renderControllableCreatureLibrary|openCompanionLibrary|closeCompanionLibrary|renderCompanionLibrary|newControllableCreature|newCompanionEntity|editSharedEntity|deleteSharedEntity|sharedEntityElementOptions|sharedEntityAddElement|sharedEntityReadElements|sharedEntityRenderAbilities|sharedEntityAbilityIds|sharedEntityRemoveAbility|sharedEntityImageChanged|renderSharedEntityVisualPreview|fillSharedEntityEvolutionTargets|renderSharedEntityEvolutionUi|sharedEntitySpawnTagOptions|sharedEntityAddSpawnTag|sharedEntityRenderSpawnTags|sharedEntityReadSpawnTags|openSharedEntityEditor|closeSharedEntityEditor|saveSharedEntity|hcRenderSavedHeroes|openHeroCreator|closeHeroCreator|newCustomHero|saveCustomHero|deleteCurrentCustomHero|z40kPrepareAvatar'.split('|');
const assert=(test,msg)=>{if(!test)throw Error('R15 boundary blocked: '+msg)};
const blob=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
const tags=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
function chunksFrom(body){
 assert(RANGES.length===54&&NAMES.length===54,'source whitelist exactly 54');
 return RANGES.map(([a,z],i)=>{
  assert(Number.isInteger(a)&&Number.isInteger(z)&&a>=0&&z>a&&z<=body.length&&(!i||a>=RANGES[i-1][1]),'bad region '+i);
  const text=body.slice(a,z);
  assert(text.startsWith('function '+NAMES[i]+'(')||text.startsWith('async function '+NAMES[i]+'('),'wrong function name/order '+i);
  return text;
 });
}
function transform(source){
 assert(Buffer.byteLength(source)===SOURCE_SIZE&&blob(source)===SOURCE,'R14 input not exact GREEN §26 source');
 const t=tags(source);assert(t.length===151,'expected R14 parser tags');
 const old=t[27];assert(!/\bsrc\s*=/.test(old[1])&&blob(old[2])===SCRIPT,'wrong second anonymous script');
 const chunks=chunksFrom(old[2]);assert(Buffer.byteLength(chunks.join(''))===42990,'54 original byte count');
 const extracted=HEADER+chunks.join('\n\n')+'\n';
 let remain=old[2];for(const [a,z] of RANGES.slice().reverse())remain=remain.slice(0,a)+remain.slice(z);
 assert(blob(remain)===REMAIN&&Buffer.byteLength(remain)===51892,'remaining monolith mismatch');
 new vm.Script(extracted,{filename:MODULE});new vm.Script(remain,{filename:'remaining-R15-inline.js'});
 const pos=old.index+old[0].indexOf(old[2]);
 let html=source.slice(0,pos)+remain+source.slice(pos+old[2].length);
 html=html.slice(0,old.index)+HOOK+html.slice(old.index);
 assert(Buffer.byteLength(html)===TARGET_SIZE&&blob(html)===TARGET,'new index not exact');
 assert(Buffer.byteLength(extracted)===OWNER_SIZE&&blob(extracted)===OWNER_BLOB,'new owner not exact');
 const newer=tags(html);
 assert(newer.length===152&&newer[27][1].includes(MODULE)&&blob(newer[28][2])===REMAIN,'parser hook/remainder wrong');
 let original=remain;
 RANGES.forEach(([a],i)=>original=original.slice(0,a)+chunks[i]+original.slice(a));
 assert(original===old[2],'inverse source is not bit-identical');
 return {html,extracted,chunks};
}
function restoreR14(){
 const current=fs.readFileSync('index.html','utf8');
 if(blob(current)===SOURCE)return current;
 assert(blob(current)===TARGET&&Buffer.byteLength(current)===TARGET_SIZE,'not authorized R15 HTML');
 const owner=fs.readFileSync(MODULE,'utf8');
 assert(blob(owner)===OWNER_BLOB&&Buffer.byteLength(owner)===OWNER_SIZE,'R15 owner drift');
 const without=current.replace(HOOK,'');assert(without!==current,'missing hook');
 const t=tags(without);assert(t.length===151,'wrong rollback parser count');
 const old=t[27],remain=old[2];assert(blob(remain)===REMAIN,'R15 remain drift');
 let i=HEADER.length;
 const chunks=RANGES.map(([a,z],idx)=>{
  const value=owner.slice(i,i+z-a);i+=z-a;
  const sep=idx===RANGES.length-1?'\n':'\n\n';
  assert(owner.slice(i,i+sep.length)===sep,'owner separator '+idx);i+=sep.length;
  return value;
 });
 assert(i===owner.length,'owner trailing content differs');
 let restored=remain;RANGES.forEach(([a],idx)=>restored=restored.slice(0,a)+chunks[idx]+restored.slice(a));
 assert(blob(restored)===SCRIPT,'original second anonymous is not recoverable');
 const pos=old.index+old[0].indexOf(remain);
 const html=without.slice(0,pos)+restored+without.slice(pos+remain.length);
 assert(Buffer.byteLength(html)===SOURCE_SIZE&&blob(html)===SOURCE,'R15->R14 inverse not exact');
 return html;
}
function verify(){
 const reconstructed=restoreR14();
 const expected=transform(reconstructed);
 assert(fs.readFileSync('index.html','utf8')===expected.html,'active index not exact output');
 assert(fs.readFileSync(MODULE,'utf8')===expected.extracted,'active owner not exact output');
 const map=JSON.parse(fs.readFileSync('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json','utf8'));
 assert(map.files?.[MODULE]?.domain==='builders','owner not Builders');
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert(sw.includes('"./'+MODULE+'"')&&sw.includes('-r15-builders-character-entity-editors"'),'R15 PWA marker absent');
 const cx={console};vm.createContext(cx);new vm.Script(expected.extracted).runInContext(cx);
 assert(NAMES.every(n=>typeof cx[n]==='function'),'54 historical globals no longer callable');
 console.log('R15 verified 54 original Builders globals, 152 parser tags, R14 exact rollback and PWA');
}
const mode=process.argv[2]||'--check-source';
if(mode==='--check-source'){
 assert(!fs.existsSync(MODULE),'owner already exists: abort repeat');
 transform(fs.readFileSync('index.html','utf8'));
 console.log('R15 exact source and 54 decls OK');
}else if(mode==='--apply'){
 assert(!fs.existsSync(MODULE),'owner already exists: abort repeat');
 const result=transform(fs.readFileSync('index.html','utf8'));
 const swp='service-worker.js',sw=fs.readFileSync(swp,'utf8');
 const suffix='-r14-builders-rpg-universe-editor"',nextSuffix='-r14-builders-rpg-universe-editor-r15-builders-character-entity-editors"';
 assert(sw.includes(suffix)&&!sw.includes(nextSuffix),'R14 SW wrong source');
 const marker='"./assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js"';
 assert(sw.includes(marker),'old owner precache missing');
 const nextSw=sw.replace(suffix,nextSuffix).replace(marker,marker+',"./'+MODULE+'"');
 const op='docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json',owners=JSON.parse(fs.readFileSync(op,'utf8'));
 assert(!owners.files[MODULE],'duplicate Builders owner');
 owners.files[MODULE]={owner:'GenSrpG Builders R15 — hero/controllable-creature/companion editors',domain:'builders',role:'54 original byte-identical UI/authoring declarations, no Core entity storage or Capture runtime, synchronous at original parser seam'};
 fs.mkdirSync(path.dirname(MODULE),{recursive:true});
 fs.writeFileSync(MODULE,result.extracted);fs.writeFileSync('index.html',result.html);
 fs.writeFileSync(swp,nextSw);fs.writeFileSync(op,JSON.stringify(owners,null,2)+'\n');
 verify();
 console.log('R15 physically applied, four runtime/owner/PWA files only');
}else if(mode==='--restore-r14')process.stdout.write(restoreR14());
else if(mode==='--verify')verify();
else throw Error('unknown R15 command');
