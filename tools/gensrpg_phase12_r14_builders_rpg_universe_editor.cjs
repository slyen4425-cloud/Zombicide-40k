'use strict';
/* R14 Builders RPG Universe Editor — strict byte-exact declarations only.
 * Source R13 is derived from the verified user archive and pinned to its GREEN Git blob.
 * All 41 function bodies remain original, with one Builders owner and no side-effect moved.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path');
const SOURCE='b5a39705baf83e9782695c14bede8b9dde6ddf52',SOURCE_SIZE=1820094;
const TARGET='dab5be5dedfa56c49d76d40a4cb824a0098903f0',TARGET_SIZE=1772759;
const MODULE='assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js';
const OWNER_BLOB='3faa1131bd6a9a2c4a672a4f18d49f49bcdb9107',OWNER_SIZE=47750;
const ORIGINAL_SCRIPT='bc60b190f9295f9bcb0e4f94cf26b919873c66ac',REMAINDER_SCRIPT='feee6ec2b17c932864b804f14ed2b3b1cd064cad';
const HEADER='/* GenSrpG Phase12 R14: 41 original Builders RPG-universe editor handlers.\n * Sole owner: Builders UI/config forms; no Core/profile authority or runtime initializer moved.\n * Strict parser-synchronous declarations; original function text unchanged.\n */\n';
const HOOK='<script src="'+MODULE+'"></script>\n';
const RANGES='239462,239614;239615,239804;248711,251286;251287,252033;252034,252447;252448,252799;252800,253219;253220,253607;253608,253977;255759,255972;255973,257160;257161,259626;259627,259746;260762,262889;263656,273216;273217,275466;275467,275597;275624,277400;277401,278059;278060,278516;278517,278913;278915,279703;279704,280315;280318,280597;281074,282611;283663,284447;284448,286496;286497,287268;287269,287976;287977,288735;288736,289574;289575,292636;292637,293110;293111,295414;295792,296681;296682,297647;297648,297762;297763,298316;298317,299774;299775,300305;301550,302313'.split(';').map(s=>s.split(',').map(Number));
const assert=(ok,msg)=>{if(!ok)throw Error('R14 proof failure: '+msg)};
const blob=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
const tags=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const NAMES='closeRpgUniverseEditor|showRpgUniverseTab|renderRpgEncounterLocations|collectRpgEncounterLocations|addRpgEncounterLocation|removeRpgEncounterLocation|addRpgLocationTag|removeRpgLocationTag|saveRpgEncounterSettings|renderRpgMovementCustomUnit|saveRpgMovementSettings|saveRpgTrainerPvpSettings|renderRpgGameplayUi|saveRpgGameplayModules|renderRpgUniverseEditor|renderRpgUniversePools|checkedRpgPool|renderRpgElementsEditor|syncRpgElementDraftFromUi|addRpgElementEditorRow|removeRpgElementEditorRow|validateRpgElementsDraft|saveRpgUniverseElements|renderRpgEconomyVisibility|saveRpgUniverseEconomy|saveRpgUniverseIdentity|saveRpgUniverseProgression|saveRpgUniverseStats|rpgRulesPresetDescription|applyRpgRulesPreset|renderRpgInitiativeOptions|saveRpgUniverseCombat|saveRpgUniverseTalents|saveRpgUniverseExploration|renderRpgEventLibrary|openRpgEventEditor|closeRpgEventEditor|refreshRpgEventEffectHelp|saveRpgEventFromEditor|deleteRpgEventFromEditor|saveRpgUniversePools'.split('|');
function chunksFrom(body){
 assert(RANGES.length===41&&NAMES.length===41,'41 original editor declarations');
 const chunks=RANGES.map(([a,z],i)=>{
  assert(z>a&&a>=0&&z<=body.length&&(!i||a>=RANGES[i-1][1]),'ordered positions '+i);
  const chunk=body.slice(a,z);
  assert(chunk.startsWith('function '+NAMES[i]+'('),'wrong editor function '+i);
  return chunk;
 });
 const actual=chunks.map(c=>/^function ([\w$]+)/.exec(c)?.[1]);
 assert(actual.every((n,i)=>n===NAMES[i])&&new Set(actual).size===41,'41 distinct top-level globals');
 assert(Buffer.byteLength(chunks.join(''))===47416,'original function byte count');
 assert(!actual.some(n=>/^(?:openRpgUniverseEditor|selectRpgUniverseProfile|saveGameProfiles|loadGameProfiles|applyGameProfile|reloadRpgGameplayFromProfileId|gensRollLocationEncounter)$/.test(n)),'protected runtime excluded');
 return {chunks,names:actual};
}
function transform(source){
 assert(Buffer.byteLength(source)===SOURCE_SIZE&&blob(source)===SOURCE,'§26 input must exactly match R13 GREEN');
 const list=tags(source);
 assert(list.length===150,'R13 script count');
 const m=list[23];assert(!m[1].includes('src=')&&blob(m[2])===ORIGINAL_SCRIPT,'wrong original anonymous script');
 const body=m[2],{chunks,names}=chunksFrom(body),extracted=HEADER+chunks.join('\n\n')+'\n';
 let remain=body;for(const [a,z] of RANGES.slice().reverse())remain=remain.slice(0,a)+remain.slice(z);
 assert(blob(remain)===REMAINDER_SCRIPT,'remaining runtime source drift');
 new vm.Script(extracted,{filename:MODULE});
 new vm.Script(remain,{filename:'R14 remaining anonymous script'});
 const off=m.index+m[0].indexOf(body);
 let html=source.slice(0,off)+remain+source.slice(off+body.length);
 html=html.slice(0,m.index)+HOOK+html.slice(m.index);
 assert(blob(html)===TARGET&&Buffer.byteLength(html)===TARGET_SIZE,'R14 HTML output hash');
 assert(blob(extracted)===OWNER_BLOB&&Buffer.byteLength(extracted)===OWNER_SIZE,'R14 Builders owner output hash');
 assert(tags(html).length===151&&tags(html)[23][1].includes(MODULE),'synchronous parser order');
 let rollback=remain;RANGES.forEach(([a],i)=>rollback=rollback.slice(0,a)+chunks[i]+rollback.slice(a));
 assert(rollback===body,'R14 to R13 in-memory bit-exact inverse');
 return {html,extracted,names};
}
function restoreR13(){
 const html=fs.readFileSync('index.html','utf8'),hash=blob(html);
 if(hash===SOURCE)return html;
 assert(hash===TARGET&&Buffer.byteLength(html)===TARGET_SIZE,'not an authorized R14 index');
 const extracted=fs.readFileSync(MODULE,'utf8');
 assert(blob(extracted)===OWNER_BLOB&&Buffer.byteLength(extracted)===OWNER_SIZE,'Builders owner drift');
 const without=html.replace(HOOK,'');assert(without!==html,'single parser hook missing');
 const list=tags(without);assert(list.length===150,'R13 parser count on rollback');
 const m=list[23],remain=m[2];assert(blob(remain)===REMAINDER_SCRIPT,'R14 runtime remainder drift');
 let offset=HEADER.length;const chunks=RANGES.map(([a,z],i)=>{
   const text=extracted.slice(offset,offset+z-a);offset+=z-a;
   const sep=i===RANGES.length-1?'\n':'\n\n';
   assert(extracted.slice(offset,offset+sep.length)===sep,'owner function separator '+i);offset+=sep.length;
   return text;
 });
 assert(offset===extracted.length,'owner trailing data');
 let original=remain;RANGES.forEach(([a],i)=>original=original.slice(0,a)+chunks[i]+original.slice(a));
 assert(blob(original)===ORIGINAL_SCRIPT,'reconstructed R13 anonymous script');
 const pos=m.index+m[0].indexOf(remain);
 const restored=without.slice(0,pos)+original+without.slice(pos+remain.length);
 assert(blob(restored)===SOURCE&&Buffer.byteLength(restored)===SOURCE_SIZE,'R14 -> R13 byte exact');
 return restored;
}
function verify(){
 const source=restoreR13();
 const {html,extracted,names}=transform(source);
 assert(fs.readFileSync('index.html','utf8')===html,'R14 active index differs from certified transform');
 assert(fs.readFileSync(MODULE,'utf8')===extracted,'R14 Builders declarations differ');
 const owner=JSON.parse(fs.readFileSync('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json','utf8'));
 assert(owner.files?.[MODULE]?.domain==='builders','owner is not Builders');
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert(sw.includes('"./'+MODULE+'"')&&sw.includes('-r14-builders-rpg-universe-editor"'),'PWA current cache guard');
 const ctx={console};vm.createContext(ctx);new vm.Script(extracted).runInContext(ctx);
 assert(names.every(n=>typeof ctx[n]==='function'),'41 original functions not callable at global scope');
 console.log('R14 verified: 41 Builders UI functions, sole owner, exact R13 rollback, parser, PWA');
}
const mode=process.argv[2]||'--check-source';
if(mode==='--check-source'){
 assert(!fs.existsSync(MODULE),'do not overwrite existing module');
 const r=transform(fs.readFileSync('index.html','utf8'));
 console.log('R14 exact input, 41 Builders UI functions, expected HTML '+TARGET);
}else if(mode==='--apply'){
 assert(!fs.existsSync(MODULE),'no reapplication');
 const r=transform(fs.readFileSync('index.html','utf8'));
 const swp='service-worker.js',sw=fs.readFileSync(swp,'utf8');
 const suffix='-r13-builders-enemy-editor"',newSuffix='-r13-builders-enemy-editor-r14-builders-rpg-universe-editor"';
 assert(sw.includes(suffix)&&!sw.includes(newSuffix),'PWA source version');
 const marker='"./assets/gensrpg/builders/legacy-enemy-editor-v1.js"';
 assert(sw.includes(marker),'known Builders asset marker');
 const nextSw=sw.replace(suffix,newSuffix).replace(marker,marker+',"./'+MODULE+'"');
 const op='docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json',owners=JSON.parse(fs.readFileSync(op,'utf8'));
 assert(!owners.files[MODULE],'Builders owner duplicate');
 owners.files[MODULE]={owner:'GenSrpG Builders RPG universe editor R14',domain:'builders',role:'41 byte-exact RPG universe UI/form/save functions, historical Core/profile/runtime calls unchanged; no initializer moved.'};
 fs.mkdirSync(path.dirname(MODULE),{recursive:true});
 fs.writeFileSync(MODULE,r.extracted);fs.writeFileSync('index.html',r.html);
 fs.writeFileSync(swp,nextSw);fs.writeFileSync(op,JSON.stringify(owners,null,2)+'\n');
 verify();console.log('R14 applied, four files only');
}else if(mode==='--restore-r13')process.stdout.write(restoreR13());
else if(mode==='--verify')verify();
else throw Error('unknown R14 action');
