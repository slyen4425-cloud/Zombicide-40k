'use strict';
/* GenSrpG Phase12 R12 — 96 original Dungeon RPG rule, progression, talent declarations.
 * R11 checkpoint source authenticated from E1.zip + exact inert-script retirement.
 * No generic Builders ability library function, Core engine or init statement moved.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),path=require('node:path');
const ORIGINAL='f257bd9e193648dc62cd8a40d510831debfe045a',ORIGINAL_SIZE=1934253;
const TARGET='b0d0c73292e4374fc4f23e86edffad5c1b39a7b6',TARGET_SIZE=1863745;
const OWNER_BLOB='82c847234e75adbfe33ef70ca8f58fa1ebdc381d',OWNER_SIZE=71155;
const MODULE='assets/gensrpg/dungeon/legacy-rpg-rules-talents-v1.js';
const HOOK='<script src="'+MODULE+'"></script>\n';
const RANGES='31386,32875;32876,36129;36130,36307;36308,36530;36531,36668;36669,36792;36793,37002;37003,37337;37409,37692;37693,38370;38371,38844;38845,39136;39137,39359;39360,39577;39578,40299;40300,40512;40513,40896;40897,41269;41270,41647;41648,41732;41733,42100;42101,42424;42425,43462;43463,43694;43695,43916;43917,44064;44065,47827;47828,48364;48365,48868;48869,49093;49094,49365;49366,49607;49608,52717;52718,55913;55914,56075;56076,56413;65682,69255;69391,69672;69673,70780;70781,70889;70891,71824;71825,72045;72046,72924;72925,73268;73270,73765;73766,74013;74014,74120;74121,74281;74282,74410;74411,74670;74671,75085;86131,86466;86467,86694;86695,88806;88807,88903;88904,89185;89186,89582;89583,89956;89957,90365;90406,90688;90689,90951;90952,91339;91373,91569;91570,92018;92019,92182;92183,92439;92440,93243;93244,93502;93503,98198;98201,99432;99436,99612;99613,100133;100134,102541;102542,102731;102732,103049;103050,105627;105628,109447;109448,110210;110211,110492;110493,111310;111311,111682;111684,111821;111822,112070;112071,112406;112407,113255;113257,113568;113569,113703;113704,113926;113927,114261;114262,115011;115012,115668;115669,116208;116209,118219;118220,118317;118318,118411;118413,122297'.split(';').map(x=>x.split(',').map(Number));
const HEADER='/* GenSrpG — Phase12 R12 : fonctions Dungeon RPG règles, progression et talents.\n * Source R11 certifiée, déclarations d’origine conservées à l’octet.\n * Propriétaire unique : Dungeon. Chargement classique synchrone juste avant l’ancien grand script.\n * Ni bibliothèque générique des capacités, ni autorité Core, ni logique des autres modules déplacée.\n */\n';
const assert=(ok,msg)=>{if(!ok)throw Error('R12 guard: '+msg)};
const blob=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')};
const scripts=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
function select(body){
 assert(RANGES.length===96,'96 AST ranges required');
 const chunks=RANGES.map(([a,b],i)=>{
   assert(b>a&&a>=0&&b<=body.length&&(!i||a>=RANGES[i-1][1]),'invalid original range '+i);
   const text=body.slice(a,b);
   assert(/^function [A-Za-z_$][\w$]*\s*\(/.test(text),'not a plain top-level function '+i);
   return text;
 });
 const names=chunks.map(x=>/^function ([A-Za-z_$][\w$]*)/.exec(x)[1]);
 assert(new Set(names).size===96,'selected declarations must be unique');
 assert(names[0]==='defaultDungeonRpgRules'&&names[35]==='resetDungeonRpgRules','rule group boundary');
 assert(names[36]==='dungeonStarterTalentSets'&&names[50]==='fillHeroTalentSetSelect','talent definition group boundary');
 assert(names[51]==='openDungeonTalentSetEditor'&&names.at(-1)==='dungeonCombatUseActiveTalent','talent execution group boundary');
 for(const name of names)assert(!/^(?:openAbilityLibrary|renderAbilityLibrary|editAbilityLibraryEntry|loadDungeonConfig|startConfiguredGame|capture)/.test(name),'cross-owner function '+name);
 assert(Buffer.byteLength(chunks.join(''))===70586,'96 declaration byte count');
 return {chunks,names};
}
function forward(source){
 assert(Buffer.byteLength(source)===ORIGINAL_SIZE&&blob(source)===ORIGINAL,'§26 exact R11 source mismatch');
 const tags=scripts(source);
 assert(tags.length===148,'R11 should have 148 script tags');
 const m=tags[21],body=m[2];
 assert(!/\bsrc=/.test(m[1])&&Buffer.byteLength(body)===704020&&blob(body)==='42217af77c73fdc10427c1ac9bf3ecd64a724341','wrong anonymous script');
 const {chunks,names}=select(body);
 let remaining=body;
 for(const [a,b] of RANGES.slice().reverse())remaining=remaining.slice(0,a)+remaining.slice(b);
 const extracted=HEADER+chunks.join('\n\n')+'\n';
 new vm.Script(remaining,{filename:'R12 Dungeon historical remainder'});
 new vm.Script(extracted,{filename:MODULE});
 let rebuilt=remaining;
 RANGES.forEach(([a],i)=>rebuilt=rebuilt.slice(0,a)+chunks[i]+rebuilt.slice(a));
 assert(rebuilt===body,'in-memory byte exact rollback failed');
 const offset=m.index+m[0].indexOf(body);
 let html=source.slice(0,offset)+remaining+source.slice(offset+body.length);
 html=html.slice(0,m.index)+HOOK+html.slice(m.index);
 assert(Buffer.byteLength(html)===TARGET_SIZE&&blob(html)===TARGET,'target HTML hash or size mismatch');
 assert(Buffer.byteLength(extracted)===OWNER_SIZE&&blob(extracted)===OWNER_BLOB,'Dungeon owner hash or size mismatch');
 assert(scripts(html).length===149&&scripts(html)[21][1].includes(MODULE),'classic loader position');
 return {html,extracted,names,original:source};
}
function restoreR11(){
 const current=fs.readFileSync('index.html','utf8'),hash=blob(current);
 if(hash===ORIGINAL)return current;
 assert(hash===TARGET,'not an authorized R12 runtime');
 const owner=fs.readFileSync(MODULE,'utf8');
 assert(blob(owner)===OWNER_BLOB&&Buffer.byteLength(owner)===OWNER_SIZE,'R12 owner altered');
 assert(current.includes(HOOK),'R12 loader absent');
 const without=current.replace(HOOK,'');
 const tags=scripts(without),m=tags[21],body=m[2];
 assert(tags.length===148,'wrong rollback parser order');
 let cursor=HEADER.length;
 const chunks=RANGES.map(([a,b],i)=>{
   const value=owner.slice(cursor,cursor+(b-a));cursor+=b-a;
   const sep=i===RANGES.length-1?'\n':'\n\n';
   assert(owner.slice(cursor,cursor+sep.length)===sep,'owner separator '+i);
   cursor+=sep.length;
   return value;
 });
 assert(cursor===owner.length,'owner trailing source changed');
 let restored=body;RANGES.forEach(([a],i)=>restored=restored.slice(0,a)+chunks[i]+restored.slice(a));
 const pos=m.index+m[0].indexOf(body);
 const html=without.slice(0,pos)+restored+without.slice(pos+body.length);
 assert(Buffer.byteLength(html)===ORIGINAL_SIZE&&blob(html)===ORIGINAL,'R12 -> R11 source not identical');
 return html;
}
function verify(){
 const original=restoreR11();
 const expected=forward(original);
 assert(fs.readFileSync('index.html','utf8')===expected.html,'runtime differs from expected R12');
 assert(fs.readFileSync(MODULE,'utf8')===expected.extracted,'module differs from expected R12');
 const owners=JSON.parse(fs.readFileSync('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json','utf8'));
 assert(owners.files?.[MODULE]?.domain==='dungeon','runtime Dungeon owner missing');
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert(sw.includes('./'+MODULE+'"')&&sw.includes('-r12-dungeon-rpg-rules-talents"'),'PWA cache/asset missing');
 const ctx={console};vm.createContext(ctx);new vm.Script(expected.extracted).runInContext(ctx);
 assert(typeof ctx.defaultDungeonRpgRules==='function'&&typeof ctx.dungeonCombatUseActiveTalent==='function','global function boundaries absent');
 assert(expected.names.every(name=>typeof ctx[name]==='function'),'some of the 96 declarations not callable');
 console.log('R12 GREEN local: 96 Dungeon originals, owner, parser, PWA and exact R11 rollback');
}
const mode=process.argv[2]||'--check-source';
if(mode==='--restore-r11')process.stdout.write(restoreR11());
else if(mode==='--check-source'){
 assert(!fs.existsSync(MODULE),'already applied');const result=forward(fs.readFileSync('index.html','utf8'));
 console.log('R12 exact source: 96 Dungeon-only declarations, '+(ORIGINAL_SIZE-TARGET_SIZE)+' HTML bytes saved; rollback validated');
}
else if(mode==='--apply'){
 assert(!fs.existsSync(MODULE),'already applied');
 const result=forward(fs.readFileSync('index.html','utf8'));
 const swp='service-worker.js',sw=fs.readFileSync(swp,'utf8');
 const marker='-r11-retired-disabled"',next='-r11-retired-disabled-r12-dungeon-rpg-rules-talents"';
 assert(sw.includes(marker)&&!sw.includes(next),'PWA version mismatch');
 const asset='"./assets/gensrpg/capture/legacy-monolith-functions-v1.js"';
 assert(sw.includes(asset),'existing PWA pre-cache absent');
 const updatedSw=sw.replace(marker,next).replace(asset,asset+',"./'+MODULE+'"');
 const op='docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json',owners=JSON.parse(fs.readFileSync(op,'utf8'));
 assert(!owners.files[MODULE]&&owners.files['assets/gensrpg/dungeon/entry-v1.js'],'owner collision/entry absent');
 owners.files[MODULE]={owner:'GenSrpG Dungeon / 96 RPG rules, progression and talents historical declarations R12',domain:'dungeon',role:'96 original top-level Dungeon RPG rule, character progression and talent declarations, byte-identical. No generic Builders ability library or shared Core rules. Classic synchronous before remaining monolith.'};
 fs.mkdirSync(path.dirname(MODULE),{recursive:true});
 fs.writeFileSync(MODULE,result.extracted,'utf8');
 fs.writeFileSync('index.html',result.html,'utf8');
 fs.writeFileSync(swp,updatedSw,'utf8');
 fs.writeFileSync(op,JSON.stringify(owners,null,2)+'\n','utf8');
 verify();
 console.log('R12 applied with exact R11 rollback and PWA/owner guards');
}
else if(mode==='--verify')verify();
else throw Error('unknown R12 mode '+mode);
