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
// Test-only exact reversal of the reviewed Capture trainer authority change.
// Historical R06 must still reconstruct its immutable pre-Lab bytes.
function historicalFix134(body){
 const actual=Buffer.from(body,'utf8');
 assert.equal(hash(actual),'f119720452fbcfa9f62f8c1ddc248efaeff656a9',
  'only the exact reviewed trainer-authority change may be reversed');
 const now="/* Dresseurs : le World Capture possède le seul handler de combat.\n   La difficulté MJ ci-dessus reste une donnée World, sans surcharge globale. */\n\n";
 const old="/* ---------- dresseur hostile : aucun choix de difficulté côté joueur ---------- */\nwindow.captureOpenTrainerBattle=function(){\n  const playerRoster=captureTeamEntityRoster(),pool=loadSharedEntities().filter(x=>x.category===\"creature\");\n  if(!playerRoster.length){alert(\"Aucune créature disponible dans ton équipe.\");return}\n  if(!playerRoster.some(c=>Number(c._instance?.hp??c.hp??0)>0)){alert(\"Toutes tes créatures sont K.O.\");return}\n  if(!pool.length){alert(\"Aucune créature disponible pour créer le dresseur adverse.\");return}\n  const diff=captureTrainerDifficulty134(),delta=[-3,0,3,6][diff-1];\n  const avg=Math.max(1,Math.round(playerRoster.reduce((n,c)=>n+(Number(c.level)||1),0)/playerRoster.length));\n  const auto=captureAutoTrainerRules(playerRoster),enemy=[];\n  for(let i=0;i<auto.teamSize;i++){\n    const base=pool[Math.floor(Math.random()*pool.length)],lvl=Math.max(1,avg+delta+Math.floor(Math.random()*3)-1);\n    enemy.push({...base,level:lvl,hp:Math.max(1,Number(base.hp)||10)+Math.max(0,lvl-(Number(base.level)||1))*2});\n  }\n  const names=[\"Dresseur novice\",\"Dresseur rival\",\"Dresseur confirmé\",\"Dresseur expert\"];\n  captureStartBattleAutomatic(\n    {name:CHARS[captureActiveHeroId()]?.name||\"Dresseur\",roster:playerRoster,controller:\"human\"},\n    {name:names[diff-1],roster:enemy,controller:\"auto\"},\n    {type:\"trainer\",captureAllowed:false,activeSlots:auto.activeSlots,teamSize:auto.teamSize,minBattleTeam:1,maxBattleTeam:6,recallCost:\"turn\",controller:\"auto\"}\n  );\n};\n\n";
 assert.equal(body.split(now).length-1,1,'exactly one retired fix134 trainer override');
 const restored=body.replace(now,old);
 assert.equal(hash(Buffer.from(restored,'utf8')),'804846e88cb8e030e1677a01420a2215e631ed8f',
  'restore the immutable original fix134 bytes');
 return restored;
}

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
  let body=fs.readFileSync(path.join(root,file)).toString('utf8');
  if(name==='captureFix134')body=historicalFix134(body);
  html=html.replace(tag,'<script id="'+name+'">'+body+'</script>');
 }
 const result=Buffer.from(html,'utf8');
 assert.equal(result.length,2782155,'byte-exact R06 Capture owner rollback');
 assert.equal(hash(result),TO,'historical pre-extraction code including validated Dungeon wall remains unchanged');
 return result;
};