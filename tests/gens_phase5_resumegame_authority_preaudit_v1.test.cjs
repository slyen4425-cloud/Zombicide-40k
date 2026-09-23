const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function scripts(source){
  const out=[];
  const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=re.exec(source))){
    const attrs=m[1]||'',body=m[2]||'';
    const id=(attrs.match(/\bid=["']([^"']+)["']/i)||[])[1]||'no-id';
    const type=(attrs.match(/\btype=["']([^"']+)["']/i)||[])[1]||'';
    out.push({id,type,attrs,body,index:m.index});
  }
  return out;
}
const all=scripts(html);
const active=all.filter(s=>!/application\/x-gensrpg-disabled/i.test(s.type));
const owners=[];
for(const s of active){
  if(/function\s+resumeGame\s*\(/.test(s.body))owners.push({id:s.id,kind:'shell-declaration',body:s.body,index:s.index});
  if(/window\.resumeGame\s*=\s*function\s*\(/.test(s.body))owners.push({id:s.id,kind:'global-wrapper',body:s.body,index:s.index});
}
owners.sort((a,b)=>a.index-b.index);

assert.equal(owners.length,3,'current active runtime must characterize exactly three resumeGame authorities');
assert.equal(owners[0].kind,'shell-declaration','historical Shell resumeGame must be the base owner');
assert.equal(owners[1].id,'dungeonCore307CriticalResumeFix','Core 3.07 must be the first active Dungeon resume wrapper');
assert.equal(owners[2].id,'dungeonCore310PersistenceAndTokens','Core 3.10 must be the final active Dungeon resume wrapper');

assert.match(owners[1].body,/const\s+dungeonSession=Array\.isArray\(runtime\?\.participants\)&&runtime\.participants\.length>0/,
  'Core 3.07 interception must be characterized as participant-presence based');
assert.doesNotMatch(owners[1].body,/gensMode151\s*\(\)\s*===?\s*["']dungeon["']/,
  'Core 3.07 currently lacks an active-module Dungeon ownership predicate');

assert.match(owners[2].body,/const\s+x=runtime\(\),ok=Array\.isArray\(x\?\.participants\)&&x\.participants\.length>0/,
  'Core 3.10 interception must be characterized as participant-presence based');
assert.doesNotMatch(owners[2].body,/gensMode151\s*\(\)\s*===?\s*["']dungeon["']/,
  'Core 3.10 currently lacks an active-module Dungeon ownership predicate');

const disabled=all.find(s=>s.id==='dungeonCore100ResumeAndInteractionFix');
assert.ok(disabled,'historical Core 1.00 resume layer must remain discoverable');
assert.match(disabled.type,/application\/x-gensrpg-disabled/i,'Core 1.00 must remain disabled and must not be counted as active authority');

assert.match(html,/window\.gensMode151=function\(\)[\s\S]*?return "capture"[\s\S]*?return "dungeon"[\s\S]*?return "other"/,
  'current runtime must already expose the module discriminator needed by Shell routing');
assert.match(html,/window\.isCaptureContext138=function\(\)/,
  'Capture context contract must remain available');
assert.match(html,/function\s+activeGameProfileId\s*\(\)/,
  'Shell active-profile source must remain available');

console.log(JSON.stringify({
  scenario:'Phase 5 resumeGame authority preaudit',
  activeOwners:owners.map(o=>({id:o.id,kind:o.kind})),
  disabledHistorical:'dungeonCore100ResumeAndInteractionFix',
  target:'one Shell owner routes by active module; Dungeon wrappers retire subtractively'
}));
