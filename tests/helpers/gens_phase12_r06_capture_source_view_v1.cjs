'use strict';
/* TEST-ONLY exact R06 -> approved R05+wall checkpoint reconstruction.
 * Keeps all historical immutable fingerprints unchanged. Runtime never loads it.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const FROM='12fc91df4ee4c7989a172baa96f9790da6dc57f7';
const TO='b33542b033c5afa8a1643d99c56c21dbd4be266c';
const names=['captureGameplayModalMount','capturePlaytestFix128',...Array.from({length:12},(_,i)=>'captureFix'+(129+i)),'captureItems141','captureBuffs142','captureBuffFx143','captureAbilityTruth144'];
const rel=name=>'assets/gensrpg/capture/legacy-patches/'+name.replace(/([A-Z])/g,'-$1').toLowerCase().replace(/^-/, '')+'-v1.js';
module.exports=function originalR06View(index,root=path.resolve(__dirname,'../..')){
 // Test-only: restore the certified pre-Chrome index before the immutable R06 rollback.
 // The adapter is SHA-gated and a no-op for every other input, including old snapshots.
 index=require('./gens_chrome_hero_recursion_source_view_20261024.cjs')(index);
 index=require('./gens_phase12_r07_magic_audio_source_view_v1.cjs')(index,root);
 if(hash(index)!==FROM)return index;
 assert.equal(index.length,2643155,'current R06 Capture extraction output size');
 let html=index.toString('utf8');
 for(const name of names){
  const file=rel(name),tag='<script id="'+name+'" src="'+file+'"></script>';
  assert.equal(html.split(tag).length-1,1,'exactly one classic Capture load '+name);
  const body=fs.readFileSync(path.join(root,file)).toString('utf8');
  html=html.replace(tag,'<script id="'+name+'">'+body+'</script>');
 }
 const result=Buffer.from(html,'utf8');
 assert.equal(result.length,2782155,'byte-exact R06 Capture owner rollback');
 assert.equal(hash(result),TO,'historical pre-extraction code including validated Dungeon wall remains unchanged');
 return result;
};