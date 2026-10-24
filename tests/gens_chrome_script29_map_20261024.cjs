'use strict';
/* Exact mapping of production's diagnostic-shell.js instrumentScripts behavior.
 * CI reads checked-out index.html locally, not through the GitHub API.
 * Exposes only bounded script metadata to logs, NEVER entire source.
 */
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path'),assert=require('node:assert/strict');
const filepath=process.env.DIAG_INDEX_PATH||path.join(__dirname,'../index.html');
const index=fs.readFileSync(filepath,'utf8');
function scriptTagEnd(html,start){
 let quoted="";
 for(let i=start;i<html.length;i++){
  const c=html[i];
  if(quoted){if(c===quoted)quoted="";continue}
  if(c==="'"||c==='"'){quoted=c;continue}
  if(c===">")return i+1;
 }return -1;
}
function scan(html){
 const found=/<script(?=[\s>])/gi,close=/<\/script\s*>/gi,results=[];
 let index=0,cursor=0;
 for(let open;(open=found.exec(html));){
  if(open.index<cursor)continue;
  const end=scriptTagEnd(html,open.index);if(end<0)break;
  close.lastIndex=end;
  const closing=close.exec(html);if(!closing)break;
  const tag=html.slice(open.index,end);
  const match=/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  const source=match?(match[1]||match[2]||match[3]):'inline';
  const body=html.slice(end,closing.index);
  const firstLine=html.slice(0,open.index).split('\n').length;
  const lastLine=html.slice(0,closing.index+closing[0].length).split('\n').length;
  results.push({n:++index,kind:match?'external':'inline',src:source,bytes:Buffer.byteLength(body),lines:lastLine-firstLine+1,firstLine,lastLine,sha256:crypto.createHash('sha256').update(body).digest('hex'),body});
  cursor=closing.index+closing[0].length;found.lastIndex=cursor;
  if(index>=1000)break;
 }
 return results;
}
const all=scan(index);
assert.ok(all.length>40,'real index has many scripts');
const target=all.find(x=>x.n===29);
assert.ok(target,'script 29 exists');
const selected=all.filter(x=>x.n>=23&&x.n<=35).map(({body,...meta})=>meta);
const body=target.body;
const excerpt=body.split('\n').map((line,i)=>({line:target.firstLine+i+1,src:line.trim()})).filter(x=>x.src).slice(0,28).map(x=>({line:x.line,src:x.src.slice(0,160)}));
const functions=[...body.matchAll(/(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]{2,45})/g)].slice(0,40).map(m=>m[1]);
const calls={localStorage:(body.match(/\blocalStorage\b/g)||[]).length,sessionStorage:(body.match(/\bsessionStorage\b/g)||[]).length,documentWrite:(body.match(/document\.write/g)||[]).length,domElement:(body.match(/document\.getElementById/g)||[]).length,querySelector:(body.match(/querySelector/g)||[]).length,windowOnload:(body.match(/window\.onload|addEventListener\s*\(\s*['"]load/g)||[]).length,while:(body.match(/\bwhile\s*\(/g)||[]).length,for:(body.match(/\bfor\s*\(/g)||[]).length,setInterval:(body.match(/\bsetInterval\s*\(/g)||[]).length,setTimeout:(body.match(/\bsetTimeout\s*\(/g)||[]).length,canvas:(body.match(/getContext\s*\(/g)||[]).length};
const summary={total:all.length,indexSha256:crypto.createHash('sha256').update(index).digest('hex'),filename:path.basename(filepath),target:{n:target.n,kind:target.kind,firstLine:target.firstLine,lastLine:target.lastLine,bytes:target.bytes,sha256:target.sha256,excerpt,functions,calls},nearby:selected};
console.log('GENSRPG_SCRIPT29_MAP '+JSON.stringify(summary));
fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'../artifacts/gensrpg-chrome-script29-map-'+path.basename(filepath)+'.json'),JSON.stringify(summary,null,2));
