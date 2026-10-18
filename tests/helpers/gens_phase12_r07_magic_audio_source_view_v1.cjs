'use strict';
// Read-only R07 -> R06 exact source reconstruction for historical sentinels.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const OLD='12fc91df4ee4c7989a172baa96f9790da6dc57f7',CURRENT='aca31c540d61c81e1504d3b915b034b372103b5b';
const tag='<script src="assets/gensrpg/core/legacy-magic-sounds-v1.js"></script>';
const ali='const GENSRPG_MAGIC_SOUNDS = GensRpgLegacyMagicSoundsR07;';
const prefix='const GensRpgLegacyMagicSoundsR07 = ';
module.exports=function originalR07View(index,root=path.resolve(__dirname,'../..')){
 if(hash(index)!==CURRENT)return index;
 assert.equal(index.length,2217805,'only R07 current HTML is reversible');
 const asset=fs.readFileSync(path.join(root,'assets/gensrpg/core/legacy-magic-sounds-v1.js'));
 assert.equal(asset.length,425484);
 assert.equal(hash(asset),'a09e21c0da7439ccda5a6aaa246096950e1b261b');
 const s=index.toString('utf8'),js=asset.toString('utf8');
 assert.equal(s.split(tag).length-1,1);
 assert.equal(s.split(ali).length-1,1);
 assert.ok(js.startsWith(prefix)&&js.endsWith('\n'));
 const orig='const GENSRPG_MAGIC_SOUNDS = '+js.slice(prefix.length,-1);
 const result=Buffer.from(s.replace(tag,'').replace(ali,orig),'utf8');
 assert.equal(result.length,2643155);
 assert.equal(hash(result),OLD);
 return result;
};
