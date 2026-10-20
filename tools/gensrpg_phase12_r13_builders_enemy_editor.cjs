'use strict';
/* R13 Builders Enemy Library and Editor — strict byte-exact declarations only.
 * Source R12 is derived from the verified user archive and pinned to its GREEN Git blob.
 * All 31 function bodies remain original, with one Builders owner and no side-effect moved.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path');
const SOURCE='b0d0c73292e4374fc4f23e86edffad5c1b39a7b6',SOURCE_SIZE=1863745;
const TARGET='b5a39705baf83e9782695c14bede8b9dde6ddf52',TARGET_SIZE=1820094;
const MODULE='assets/gensrpg/builders/legacy-enemy-editor-v1.js';
const OWNER_BLOB='47b8d0e2b65bfffca4128d29c345b7e82af2a5fe',OWNER_SIZE=44044;
const ORIGINAL_SCRIPT='1c53f44e98493de37374f1e93d7db6b553ecff4a',REMAINDER_SCRIPT='bc60b190f9295f9bcb0e4f94cf26b919873c66ac';
const HEADER='/* GenSrpG Phase12 R13: 31 byte-identical Builders Enemy Library and Editor functions.\n * Sole owner: Builders; synchronous classic script at the original parser location.\n * No enemies runtime, spawn rules, combat engine or state initializations moved.\n */\n';
const HOOK='<script src="'+MODULE+'"></script>\n';
const RANGES='338045,340055;340056,340282;340283,340692;340694,341571;341572,342386;342387,342546;342547,350914;350915,352499;352501,352732;352734,353045;353046,353475;353476,353624;353625,354231;354232,356485;356486,356820;356821,356962;356963,357326;357327,358352;358354,362844;362845,363024;363025,363214;363215,367412;367413,368211;368212,372525;372526,372686;372687,372780;372781,374242;374243,374522;374523,380995;380996,381367;381368,381492'.split(';').map(s=>s.split(',').map(Number));
const assert=(ok,msg)=>{if(!ok)throw Error('R13 proof failure: '+msg)};
const blob=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
const tags=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
function chunksFrom(body){
 assert(RANGES.length===31,'exact 31 original functions');
 const chunks=RANGES.map(([a,z],i)=>{
   assert(z>a&&a>=0&&z<=body.length&&(!i||a>=RANGES[i-1][1]),'invalid AST region '+i);
   const chunk=body.slice(a,z);
   assert(/^function [A-Za-z_$][\w$]*\s*\(/.test(chunk),'not a top-level function '+i);
   return chunk;
 });
 const names=chunks.map(c=>/^function ([\w$]+)/.exec(c)[1]);
 assert(names[0]==='enemyImageChanged'&&names.at(-1)==='closeEnemyManager','wrong Builders domain boundary');
 assert(new Set(names).size===31,'duplicate function declaration');
 assert(Buffer.byteLength(chunks.join(''))===43725,'original function byte count');
 assert(!names.some(n=>/^dungeon|^capture|^gensRollLocation|^rollEnemyAttack|^customEnemyToZombieType|^generateRealSpawn|^loadCustomEnemies/.test(n)),'foreign gameplay owner selected');
 return {chunks,names};
}
function transform(source){
 assert(Buffer.byteLength(source)===SOURCE_SIZE&&blob(source)===SOURCE,'§26 input must exactly match R12 GREEN');
 const list=tags(source);
 assert(list.length===149,'R12 script count');
 const m=list[22];assert(!m[1].includes('src=')&&blob(m[2])===ORIGINAL_SCRIPT,'wrong original anonymous script');
 const body=m[2],{chunks,names}=chunksFrom(body),extracted=HEADER+chunks.join('\n\n')+'\n';
 let remain=body;for(const [a,z] of RANGES.slice().reverse())remain=remain.slice(0,a)+remain.slice(z);
 assert(blob(remain)===REMAINDER_SCRIPT,'remaining runtime source drift');
 new vm.Script(extracted,{filename:MODULE});
 new vm.Script(remain,{filename:'R13 remaining anonymous script'});
 const off=m.index+m[0].indexOf(body);
 let html=source.slice(0,off)+remain+source.slice(off+body.length);
 html=html.slice(0,m.index)+HOOK+html.slice(m.index);
 assert(blob(html)===TARGET&&Buffer.byteLength(html)===TARGET_SIZE,'R13 HTML output hash');
 assert(blob(extracted)===OWNER_BLOB&&Buffer.byteLength(extracted)===OWNER_SIZE,'R13 Builders owner output hash');
 assert(tags(html).length===150&&tags(html)[22][1].includes(MODULE),'synchronous parser order');
 let rollback=remain;RANGES.forEach(([a],i)=>rollback=rollback.slice(0,a)+chunks[i]+rollback.slice(a));
 assert(rollback===body,'R13 to R12 in-memory bit-exact inverse');
 return {html,extracted,names};
}
function restoreR12(){
 let html=fs.readFileSync('index.html','utf8');
 if(blob(html)==='9f35eb833a6ede4b91399854f19bb9bef59f45ab')html=cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r15_builders_character_entity_editors.cjs','--restore-r14'],{maxBuffer:12*1024*1024}).toString('utf8');
 if(blob(html)==='dab5be5dedfa56c49d76d40a4cb824a0098903f0')html=cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r14_builders_rpg_universe_editor.cjs','--restore-r13'],{maxBuffer:10*1024*1024}).toString('utf8');
 const hash=blob(html);
 if(hash===SOURCE)return html;
 assert(hash===TARGET&&Buffer.byteLength(html)===TARGET_SIZE,'not an authorized R13 index');
 const extracted=fs.readFileSync(MODULE,'utf8');
 assert(blob(extracted)===OWNER_BLOB&&Buffer.byteLength(extracted)===OWNER_SIZE,'Builders owner drift');
 const without=html.replace(HOOK,'');assert(without!==html,'single parser hook missing');
 const list=tags(without);assert(list.length===149,'R12 parser count on rollback');
 const m=list[22],remain=m[2];assert(blob(remain)===REMAINDER_SCRIPT,'R13 runtime remainder drift');
 let offset=HEADER.length;const chunks=RANGES.map(([a,z],i)=>{
   const text=extracted.slice(offset,offset+z-a);offset+=z-a;
   const sep=i===RANGES.length-1?'\n':'\n\n';
   assert(extracted.slice(offset,offset+sep.length)===sep,'owner function separator '+i);offset+=sep.length;
   return text;
 });
 assert(offset===extracted.length,'owner trailing data');
 let original=remain;RANGES.forEach(([a],i)=>original=original.slice(0,a)+chunks[i]+original.slice(a));
 assert(blob(original)===ORIGINAL_SCRIPT,'reconstructed R12 anonymous script');
 const pos=m.index+m[0].indexOf(remain);
 const restored=without.slice(0,pos)+original+without.slice(pos+remain.length);
 assert(blob(restored)===SOURCE&&Buffer.byteLength(restored)===SOURCE_SIZE,'R13 -> R12 byte exact');
 return restored;
}
function verify(){
 const source=restoreR12();
 const {html,extracted,names}=transform(source);
 let installed=fs.readFileSync('index.html','utf8');
 if(blob(installed)==='9f35eb833a6ede4b91399854f19bb9bef59f45ab')installed=cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r15_builders_character_entity_editors.cjs','--restore-r14'],{maxBuffer:12*1024*1024}).toString('utf8');
 const historical=blob(installed)==='dab5be5dedfa56c49d76d40a4cb824a0098903f0'?cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r14_builders_rpg_universe_editor.cjs','--restore-r13'],{maxBuffer:10*1024*1024}).toString('utf8'):installed;
 assert(historical===html,'R13 exact historical index differs from certified transform');
 assert(fs.readFileSync(MODULE,'utf8')===extracted,'R13 Builders declarations differ');
 const owner=JSON.parse(fs.readFileSync('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json','utf8'));
 assert(owner.files?.[MODULE]?.domain==='builders','owner is not Builders');
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert(sw.includes('"./'+MODULE+'"')&&sw.includes('-r13-builders-enemy-editor'),'PWA current cache guard');
 const ctx={console};vm.createContext(ctx);new vm.Script(extracted).runInContext(ctx);
 assert(names.every(n=>typeof ctx[n]==='function'),'31 original functions not callable at global scope');
 console.log('R13 verified: 31 Builders functions, sole owner, exact R12 rollback, parser, PWA');
}
const mode=process.argv[2]||'--check-source';
if(mode==='--check-source'){
 assert(!fs.existsSync(MODULE),'do not overwrite existing module');
 const r=transform(fs.readFileSync('index.html','utf8'));
 console.log('R13 exact input, 31 Builders functions, expected HTML '+TARGET);
}else if(mode==='--apply'){
 assert(!fs.existsSync(MODULE),'no reapplication');
 const r=transform(fs.readFileSync('index.html','utf8'));
 const swp='service-worker.js',sw=fs.readFileSync(swp,'utf8');
 const suffix='-r12-dungeon-rpg-rules-talents"',newSuffix='-r12-dungeon-rpg-rules-talents-r13-builders-enemy-editor"';
 assert(sw.includes(suffix)&&!sw.includes(newSuffix),'PWA source version');
 const marker='"./assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js"';
 assert(sw.includes(marker),'known Builders asset marker');
 const nextSw=sw.replace(suffix,newSuffix).replace(marker,marker+',"./'+MODULE+'"');
 const op='docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json',owners=JSON.parse(fs.readFileSync(op,'utf8'));
 assert(!owners.files[MODULE],'Builders owner duplicate');
 owners.files[MODULE]={owner:'GenSrpG Builders / enemy editor and enemy library R13',domain:'builders',role:'31 byte-exact historical enemy editor functions. Classic synchronous before original anonymous script. No runtime spawn, enemy conversion or combat rules.'};
 fs.mkdirSync(path.dirname(MODULE),{recursive:true});
 fs.writeFileSync(MODULE,r.extracted);fs.writeFileSync('index.html',r.html);
 fs.writeFileSync(swp,nextSw);fs.writeFileSync(op,JSON.stringify(owners,null,2)+'\n');
 verify();console.log('R13 applied, four files only');
}else if(mode==='--restore-r12')process.stdout.write(restoreR12());
else if(mode==='--verify')verify();
else throw Error('unknown R13 action');
