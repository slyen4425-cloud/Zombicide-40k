'use strict';
// Phase 12 / post-R15 EXIT — reproducible *static* authority census of exact certified HTML.
// A multi-writer match identifies a potential conflict, not proof the writes all execute.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const payload=Buffer.from(html,'utf8');
assert.equal(payload.length,1729855,'§26 exact post-R15 source length');
assert.equal(blob(payload),'9f35eb833a6ede4b91399854f19bb9bef59f45ab','§26 exact post-R15 source Git blob');
const tags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const ext=tags.filter(m=>/\bsrc\s*=/.test(m[1]));
const inline=tags.filter(m=>!/\bsrc\s*=/.test(m[1]));
const named=inline.filter(m=>/\bid\s*=/.test(m[1]));
const anonymous=inline.filter(m=>!/\bid\s*=/.test(m[1]));
assert.equal(tags.length,152,'parser script tag count');
assert.equal(ext.length,63,'external production entrypoints');
assert.equal(inline.length,89,'active inline bodies');
assert.equal(named.length,84,'identified inline scripts');
assert.equal(anonymous.length,5,'unidentified inline scripts');
assert.equal(inline.reduce((sum,m)=>sum+Buffer.byteLength(m[2]),0),935765,'remaining inline JavaScript byte count');
assert.equal(named.reduce((sum,m)=>sum+Buffer.byteLength(m[2]),0),334780,'remaining named script byte count');
assert.equal(Buffer.byteLength(tags[24][2]),542293,'largest mixed-owner anonymous body');
assert.equal(Buffer.byteLength(tags[28][2]),51892,'second mixed-owner anonymous body');
const windows=new Map();
tags.forEach((m,i)=>{if(/\bsrc\s*=/.test(m[1]))return;
 const re=/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
 for(const match of m[2].matchAll(re)){
  if(!windows.has(match[1]))windows.set(match[1],new Set());
  windows.get(match[1]).add(i);
 }});
assert.equal(windows.size,209,'number of distinct directly written window globals');
const collisions=[...windows.entries()].filter(([,owners])=>owners.size>1)
  .map(([name,owners])=>[name,[...owners].sort((a,b)=>a-b)])
  .sort((a,b)=>a[0].localeCompare(b[0],'en'));
assert.equal(collisions.length,38,'cross-script global write targets');
for(const [name,count] of [['renderDungeonCombatRound',11],['dungeonRunAi156',8],['dungeonMapHtml',7],['openDungeonCombatVictoryPopup',5]]){
 assert.equal(windows.get(name)?.size,count,name+' historical script writers');
}
const list=collisions.map(([name,indices])=>name+':'+indices.join(',')).join('\n');
const checksum=crypto.createHash('sha256').update(list).digest('hex');
assert.equal(checksum,'71786039cf06f21b1728d454bb55e7007d986377f78bc4e434aef138af0432f7',
 'full 38-target writer-to-script map must not drift');
console.log(JSON.stringify({kind:'post-R15 static EXIT baseline',gitBlob:blob(payload),scriptTags:tags.length,external:ext.length,inline:inline.length,inlineBytes:935765,named:named.length,anonymous:anonymous.length,windowTargets:windows.size,multiWriterTargets:collisions.length,mapSha256:checksum},null,2));
if(process.argv.includes('--detail'))console.log(list);
