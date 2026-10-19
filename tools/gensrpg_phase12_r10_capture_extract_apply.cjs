'use strict';
/* GenSrpG Phase12 R10 — extraction Capture strictement contrôlée de R09.
 * Positions UTF-16 certifiées par analyse AST sur d8.zip vérifié, jamais sur
 * une lecture GitHub potentiellement tronquée. Fonctions inchangées.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process');
const OLD_INDEX='4dbe3314d5048f2def404ed674498c0670c04fc1', NEW_INDEX='b8ef8dcb497cad94c91094ed008136a5d9800155';
const NEW_MODULE='c6ea3c101a6861b99f8bc064d2d1fec874e7266b';
const ORIGINAL_SHA='f2d5f954fc8e678bbf6819d2358964f47c61783f';
const MODULE='assets/gensrpg/capture/legacy-monolith-functions-v1.js';
const HOOK='<script src="'+MODULE+'"></script>\n';
const RANGES='150747,150871;150872,151262;151264,151662;151663,151792;151793,153454;153455,154580;154667,154860;154861,155224;155225,155641;155642,155934;155935,156432;156433,156635;156636,157238;157239,158014;158015,158386;158387,158591;158592,159106;159107,159501;159502,159802;159803,159980;159981,160175;160176,160376;160377,160603;160604,160734;160735,160927;160928,161142;161143,161704;161707,161862;161863,161980;161981,162814;162815,163226;163227,163509;163510,164227;164228,164657;164658,165131;165132,165545;165548,167494;167497,167908;167909,168579;168580,169518;169519,169642;169643,170293;170294,171052;171053,177824;177825,178671;178672,178809;178810,179588;179590,180059;180060,180485;180486,181077;181078,182452;182453,182956;182957,185238;185239,186676;186677,186883;186884,187460;187462,187883;187884,188013;188014,188117;188118,191514;191515,191692;191693,192969;192970,193227;193228,193663;193664,193934;193935,195301;195302,195821;195823,196652;196653,197580;197581,197914;197915,202583;202584,203702;203703,204606;204607,204680;204681,204985;204987,205147;205148,206043;206044,206260;206261,207292;207320,207627;207628,207769;207770,208565;208566,208650;210367,211304;211305,211571;211572,211664;213651,214601;214602,214667;214668,215111;245696,246434'.split(';').map(x=>x.split(',').map(Number));
const HEADER='/* GenSrpG — Phase12 R10 : déclarations historiques Capture du grand script R09.\n * Propriétaire : Capture du dépôt principal ; aucune initialisation partagée déplacée.\n * Chargement classique synchrone avant le script historique ; fonctions inchangées.\n */\n';
function assert(ok,msg){if(!ok)throw Error('R10 guard: '+msg)}
function blob(s){const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')}
function scripts(s){return [...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]}
function select(body){
  assert(RANGES.length===90,'not 90 ranges');
  const chunks=RANGES.map(([a,b],i)=>{
    assert(a>=0&&b>a&&b<=body.length&&(!i||a>RANGES[i-1][1]),'invalid range '+i);
    const piece=body.slice(a,b);
    assert(/^function capture[A-Za-z0-9_$]*\s*\(/.test(piece),'not a Capture declaration at '+i);
    return piece;
  });
  const names=chunks.map(x=>/^function\s+([A-Za-z_$][\w$]*)/.exec(x)[1]);
  assert(new Set(names).size===90,'duplicate declaration');
  assert(names[0]==='captureCloseModal'&&names.at(-1)==='captureCurrentGameProfile','selection boundary');
  return {chunks,names};
}
function forward(source){
  assert(Buffer.byteLength(source,'utf8')===2093066&&blob(source)===OLD_INDEX,'§26 incorrect original index');
  const all=scripts(source);
  assert(all.length===164&&!all[20][1].includes('src='),'original parser position');
  const match=all[20],body=match[2];
  assert(Buffer.byteLength(body,'utf8')===765516&&blob(body)==='db8e91c0e1d9fea04f4c19ad6e84d69ea7259509','multi-domain body changed');
  const {chunks}=select(body);
  const extracted=HEADER+chunks.join('\n\n')+'\n';
  let remaining=body;
  for(const [a,b] of RANGES.slice().reverse())remaining=remaining.slice(0,a)+remaining.slice(b);
  new vm.Script(extracted,{filename:MODULE});new vm.Script(remaining,{filename:'legacy-r10-remaining.js'});
  let reconstructed=remaining;
  RANGES.forEach(([a],i)=>reconstructed=reconstructed.slice(0,a)+chunks[i]+reconstructed.slice(a));
  assert(reconstructed===body,'byte-identical JS reversal failed');
  const p=match.index+match[0].indexOf(body);
  let html=source.slice(0,p)+remaining+source.slice(p+body.length);
  html=html.slice(0,match.index)+HOOK+html.slice(match.index);
  assert(Buffer.byteLength(html,'utf8')===2031649&&blob(html)===NEW_INDEX,'expected output HTML mismatched');
  assert(Buffer.byteLength(extracted,'utf8')===61943&&blob(extracted)===NEW_MODULE,'expected Capture owner mismatched');
  return {html,extracted};
}
function restoreR09(){
  const current=fs.readFileSync('index.html','utf8');
  const html=['f257bd9e193648dc62cd8a40d510831debfe045a','b0d0c73292e4374fc4f23e86edffad5c1b39a7b6'].includes(blob(current))
    ? cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r11_retired_scripts.cjs','--restore-r10'],{maxBuffer:10*1024*1024}).toString('utf8')
    : current;
  const extracted=fs.readFileSync(MODULE,'utf8');
  assert(blob(html)===NEW_INDEX&&blob(extracted)===NEW_MODULE,'not the R10 certified files');
  assert(html.includes(HOOK),'Capture loader missing');
  const sans=html.replace(HOOK,'');
  const all=scripts(sans);assert(all.length===164,'script count after loader removal');
  const match=all[20],body=match[2];
  let cursor=HEADER.length;
  const chunks=RANGES.map(([a,b],i)=>{
    const piece=extracted.slice(cursor,cursor+(b-a));cursor+=b-a;
    const sep=i===RANGES.length-1?'\n':'\n\n';
    assert(extracted.slice(cursor,cursor+sep.length)===sep,'owner separator '+i);
    cursor+=sep.length;
    return piece;
  });
  assert(cursor===extracted.length,'unexpected trailing module code');
  let full=body;
  RANGES.forEach(([a],i)=>full=full.slice(0,a)+chunks[i]+full.slice(a));
  const p=match.index+match[0].indexOf(body);
  const prev=sans.slice(0,p)+full+sans.slice(p+body.length);
  assert(Buffer.byteLength(prev)===2093066&&blob(prev)===OLD_INDEX,'R10 -> R09 rollback not exact');
  return prev;
}
const mode=process.argv[2]||'--check-source';
if(mode==='--restore-r09'){process.stdout.write(restoreR09())}
else if(mode==='--check-source'){
  assert(!fs.existsSync(MODULE),'Capture file already exists');
  const x=forward(fs.readFileSync('index.html','utf8'));
  process.stdout.write('R10 source verified: 90 Capture functions, '+(2093066-Buffer.byteLength(x.html))+' HTML bytes saved\n');
}
else if(mode==='--apply'){
  assert(!fs.existsSync(MODULE),'Capture file already exists');
  const x=forward(fs.readFileSync('index.html','utf8'));
  const swp='service-worker.js',sw=fs.readFileSync(swp,'utf8');
  const old='-r09-survival-wave-spawn',nu=old+'-r10-capture-main-functions';
  assert(sw.includes(old)&&!sw.includes(nu),'PWA version marker mismatch');
  const oldAsset='"./assets/gensrpg/survival/legacy-wave-presets-spawn-v1.js"';
  assert(sw.includes(oldAsset),'existing PWA asset missing');
  const newSw=sw.replace(old,nu).replace(oldAsset,oldAsset+',"./'+MODULE+'"');
  const ownerp='docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json',owners=JSON.parse(fs.readFileSync(ownerp,'utf8'));
  assert(!owners.files[MODULE]&&owners.files['assets/gensrpg/capture/entry-v1.js'],'owner collision/entry missing');
  owners.files[MODULE]={owner:'GenSrpG Capture / 90 legacy declarations R10',domain:'capture',role:'90 fonctions historiques Capture originales (combat classique, creat/XP, inventaire, boutiques, soin, regles de mode). Aucun nouveau moteur. Chargement classique synchrone'};
  fs.mkdirSync(require('node:path').dirname(MODULE),{recursive:true});
  fs.writeFileSync(MODULE,x.extracted,'utf8');
  fs.writeFileSync('index.html',x.html,'utf8');
  fs.writeFileSync(swp,newSw,'utf8');
  fs.writeFileSync(ownerp,JSON.stringify(owners,null,2)+'\n','utf8');
  assert(blob(restoreR09())===OLD_INDEX,'rollback mismatch after applying');
  process.stdout.write('R10 applied: 90 functions Capture, R09 rollback exact\n');
}
else if(mode==='--verify'){
  const source=cp.execFileSync('git',['show',ORIGINAL_SHA+':index.html'],{maxBuffer:10*1024*1024}).toString('utf8');
  const expected=forward(source);
  const current=fs.readFileSync('index.html','utf8');
  const currentR10=['f257bd9e193648dc62cd8a40d510831debfe045a','b0d0c73292e4374fc4f23e86edffad5c1b39a7b6'].includes(blob(current))
    ? cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r11_retired_scripts.cjs','--restore-r10'],{maxBuffer:10*1024*1024}).toString('utf8')
    : current;
  assert(currentR10===expected.html,'index differs from exactly expected R10 source');
  assert(fs.readFileSync(MODULE,'utf8')===expected.extracted,'Capture module differs');
  assert(restoreR09()===source,'byte exact R09 rollback');
  const sw=fs.readFileSync('service-worker.js','utf8');
  assert(sw.includes('./'+MODULE)&&sw.includes('-r10-capture-main-functions'),'PWA missing');
  const owners=JSON.parse(fs.readFileSync('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json','utf8'));
  assert(owners.files[MODULE]?.domain==='capture','wrong owner');
  process.stdout.write('R10 verified: source, loader, module, PWA, owner, exact rollback\n');
}else{throw Error('Unknown mode: '+mode)}
