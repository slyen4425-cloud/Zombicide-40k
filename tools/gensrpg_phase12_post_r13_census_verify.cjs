'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const p=process.argv[2];
if(!p){console.error('Usage: node gensrpg_phase12_post_r13_census_verify.cjs <exact-R13-index.html>');process.exit(2)}
const file=fs.readFileSync(p);
const blob=(b)=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const expected='b5a39705baf83e9782695c14bede8b9dde6ddf52';
assert.equal(file.length,1820094,'R13 exact byte count required');
assert.equal(blob(file),expected,'source is not R13 GREEN');
const html=file.toString('utf8');
const matches=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const attr=(s,n)=>{const a=s.match(new RegExp('(?:^|\\s)'+n+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return a?(a[1]??a[2]??a[3]):null};
const scripts=matches.map((m,i)=>({ordinal:i+1,src:attr(m[1],'src'),id:attr(m[1],'id'),type:attr(m[1],'type'),body:Buffer.from(m[2],'utf8')}));
const external=scripts.filter(s=>s.src);
const disabled=scripts.filter(s=>s.type==='application/x-gensrpg-disabled');
const active=scripts.filter(s=>!s.src&&!disabled.includes(s));
const anon=active.filter(s=>!s.id),named=active.filter(s=>s.id);
const sum=(a)=>a.reduce((v,s)=>v+s.body.length,0);
assert.deepEqual([scripts.length,external.length,active.length,disabled.length,sum(active),anon.length,sum(anon),named.length,sum(named)], [150,61,89,0,1026171,5,691391,84,334780]);
const slots=[[24,589709,'bc60b190f9295f9bcb0e4f94cf26b919873c66ac'],[27,94882,'50e5b25ce6d3d9bf41c6e684f5548cc5842be935'],[29,219,'cdf33d5bbe5ba17c36d100b2e348c82e67818160'],[63,6337,'ff958f9e2965130ed9c4da1ba8df721b47332d10'],[149,244,'c43d47df21d662a46ae54c0770106d3694acf235']];
for(const [id,bytes,digest] of slots){const x=scripts[id-1];assert.equal(x.body.length,bytes,'body bytes #'+id);assert.equal(blob(x.body),digest,'body Git blob #'+id)}
console.log('R13 verified: exact source + 150 tags, 61 external, 89 inline (1,026,171 B), 0 disabled, 5 anonymous blobs');
