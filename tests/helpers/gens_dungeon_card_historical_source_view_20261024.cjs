'use strict';
// Immutable, test-only inverse of the 2026-10-24 Dungeon card presentation change.
// It never runs in the browser and never modifies a file or a persisted profile.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const ORIGINAL='e45f3b4e419a10b030c47bc921bded1ec0dc723b';
const PATCHED='1323e83467feacccc69d2c2cd3d3c3cea37608eb';
const OLD='  profiles=profiles.filter(p=>(gensContentFamilyForProfile(p)==="creature")===(family==="capture"));\n  const cards=profiles.map(p=>{';
const NEW=[
'  // Shell presentation only: one card per persisted profile ID, even when an',
'  // older Chrome session contains multiple copies of the built-in Dungeon ID.',
'  // Never rewrite or delete profiles here: stored copies and saves stay intact.',
'  const shownProfileIds=new Set();',
'  profiles=profiles.filter(p=>{',
'    if((gensContentFamilyForProfile(p)==="creature")!==(family==="capture"))return false;',
'    const id=String(p?.id??"");',
'    if(!id)return true; // do not silently hide malformed/unsaved profiles',
'    if(shownProfileIds.has(id))return false;',
'    shownProfileIds.add(id);',
'    return true;',
'  });',
'  const cards=profiles.map(p=>{'
].join('\n');
module.exports=function historicalR03HubSource(input){
 const raw=Buffer.from(input);
 const sha=hash(raw);
 if(sha===ORIGINAL)return raw;
 assert.equal(sha,PATCHED,'only the exact reviewed Dungeon card patch may be inverted');
 const text=raw.toString('utf8');
 assert.equal(text.split(NEW).length,2,'one exact new Shell list expression');
 const historical=Buffer.from(text.replace(NEW,OLD),'utf8');
 assert.equal(historical.length,6651,'historic R03 Shell payload length');
 assert.equal(hash(historical),ORIGINAL,'history must preserve byte-identical R03 Shell owner');
 return historical;
};
