'use strict';
// R11: exact E1.zip R10 source; no active JS/CSS changes.
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process'),path=require('node:path');
const SOURCE='b8ef8dcb497cad94c91094ed008136a5d9800155',SIZE=2031649;
const TARGET='f257bd9e193648dc62cd8a40d510831debfe045a',TARGET_SIZE=1934253;
const BASE='b1797246c76543447cbbd11248bd59b5c3d7ad6b';
const SCRIPT=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const DISABLED=/\btype\s*=\s*(["'])application\/x-gensrpg-disabled\1/i;
const STYLES=['rpgTurnTargetFlow157Css','rpgPlayerTargeting158Css','rpgHeroTargeting159Css','dungeonCore091PostCombatUnlockCss','dungeonCore104CoherenceCss'];
function assert(x,msg){if(!x)throw Error('R11 blocked: '+msg)}
function blob(x){const b=Buffer.from(x);return crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')}
function analyze(s){
 assert(Buffer.byteLength(s,'utf8')===SIZE&&blob(s)===SOURCE,'§26 source R10 mismatch');
 const old=[...s.matchAll(SCRIPT)],retired=old.filter(x=>DISABLED.test(x[1]));
 assert(old.length===165&&retired.length===17,'not 165 tags / 17 disabled');
 const names=retired.map(x=>{const m=/\bid\s*=\s*(["'])(.*?)\1/i.exec(x[1]);assert(m,'missing retired ID');return m[2]});
 assert(new Set(names).size===17&&names[0]==='rpgTurnTargetFlow157'&&names.at(-1)==='dungeonCore105MovementRenderFix','retired boundaries');
 assert(retired.reduce((n,x)=>n+Buffer.byteLength(x[2]),0)===95878,'retired body size mismatch');
 const output=s.replace(SCRIPT,(whole,attrs)=>DISABLED.test(attrs)?'':whole);
 const active=old.filter(x=>!DISABLED.test(x[1])),remaining=[...output.matchAll(SCRIPT)];
 assert(remaining.length===148&&active.length===148&&remaining.every((x,i)=>x[0]===active[i][0]),'active scripts changed or reordered');
 assert(STYLES.every(x=>output.includes('id="'+x+'"')),'active CSS altered');
 assert(Buffer.byteLength(output,'utf8')===TARGET_SIZE&&blob(output)===TARGET,'target mismatch');
 return {output,names};
}
function scan(s){
 const result=analyze(s),names=result.names;
 // Exception démontrée: script[data-*] sélectionne les bridges injectés, jamais les 17 inertes sans attribut data-*.
 const tests=[/document\s*\.\s*scripts\b/i,/getElementsByTagName\s*\(\s*["']script["']\s*\)/i,/querySelector(?:All)?\s*\(\s*["']script(?!\[data-)(?:\[|\.|:|["'])/i,/application\/x-gensrpg-disabled/i];
 function check(code,label){for(const name of names)assert(!code.includes(name),label+' references '+name);for(const p of tests)assert(!p.test(code),label+' scans retired script DOM '+p)}
 let count=0,bytes=0;
 for(const m of s.matchAll(SCRIPT)){if(DISABLED.test(m[1])||/\bsrc\s*=/.test(m[1]))continue;check(m[2],'inline');count++}
 function visit(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())visit(f);else if(e.isFile()&&/\.(?:js|mjs)$/.test(e.name)){const code=fs.readFileSync(f,'utf8');check(code,f);count++;bytes+=Buffer.byteLength(code)}}}
 visit('assets');
 return {...result,count,bytes};
}
function r10(){const b=cp.execFileSync('git',['show',BASE+':index.html'],{maxBuffer:10*1024*1024});assert(b.length===SIZE&&blob(b)===SOURCE,'R10 rollback source unavailable');return b}
const mode=process.argv[2]||'--audit',file=process.argv[3]||'index.html';
if(mode==='--restore-r10')process.stdout.write(r10());
else if(mode==='--verify'){
 const actual=fs.readFileSync('index.html','utf8');
 assert(Buffer.byteLength(actual)===TARGET_SIZE&&blob(actual)===TARGET,'R11 target index mismatch');
 assert(actual===analyze(r10().toString('utf8')).output,'R11 forward reconstruction mismatch');
 console.log('R11 rollback and active order verified');
}else if(mode==='--audit'||mode==='--apply'){
 const info=scan(fs.readFileSync(file,'utf8'));
 if(mode==='--audit')console.log('R11 preflight: '+info.count+' active and external JS blocks, '+info.bytes+' asset JS bytes screened; CSS + all active scripts preserved');
 else{assert(file==='index.html','apply checkout only');fs.writeFileSync('index.html',info.output,'utf8');console.log('R11 17 inerts retired, 97396 HTML bytes removed')}
}else throw Error('Unknown mode '+mode);
