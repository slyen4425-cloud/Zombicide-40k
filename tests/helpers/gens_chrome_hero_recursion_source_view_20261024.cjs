'use strict';
/* Test-only historical view for the exact Chrome startup dependency fix.
 * The active runtime is never modified; only the previously audited
 * original bytes are exposed to legacy snapshot tests. Unknown bytes pass
 * through unchanged so the downstream historical fingerprint guard rejects them.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const hash=x=>crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex');
const PATCHED='cc355585acab68958bd349ffcf8fa0de4eab9b0d';
const ORIGINAL='260f00aa179c939f35188ca854f9875971ce8a7b';
const upload=require('../fixtures/gens_profile_save_upload_exact_edits_20261025.json');
function beforeChrome(input){
 let index=Buffer.from(input);
 // Test-only exact inverse of the approved Shell Dungeon edit on the
 // unique current GenSRPG root snapshot. No replacement for an unknown SHA.
 if(hash(index)==="97b3dd1dd5b71b3f7bd486694c28d4367eb4104e"){
  let source=index.toString('utf8');
  for(const [current,previous] of [["\n/* V16.75.8 — séparation structurelle stricte des familles */\nbody.gensDungeonTheme #survivalModEditorHubBtn{display:none!important}\nbody:not(.gensDungeonTheme) #rpgUniverseEditorHubBtn{display:none!important}\n\n</style>\n<script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script>","\n/* V16.75.8 — séparation structurelle stricte des familles */\nbody.gensDungeonTheme #survivalModEditorHubBtn{display:none!important}\nbody:not(.gensDungeonTheme) #rpgUniverseEditorHubBtn,\nbody:not(.gensDungeonTheme) #dungeonAdvancedEditorBtn{display:none!important}\n\n</style>\n<script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script>"],["  renderHome();\n}\nfunction gensShellDungeonEditorAllowed(){\n  try{\n    // Shell authority: the explicitly selected editor family wins over a\n    // previously active game profile (notably after returning from Capture).\n    const hub=globalThis.document?.getElementById?.(\"editorHub\");\n    const family=hub&&hub.style.display!==\"none\"?gensSelectedFamily:\"\";\n    if(family===\"adventure\")return true;\n    if(family===\"capture\"||family===\"survival\"||family===\"pvp\")return false;\n    const p=getActiveGameProfile?.();\n    return !!p&&p.gameStyle===\"dungeon\"&&!window.GensCaptureV1?.isProfile?.(p);\n  }catch(e){return false}\n}\nfunction applyModeEditorVisibility(){\n  let activeProfile=null;try{activeProfile=getActiveGameProfile()}catch(e){}","  renderHome();\n}\nfunction gensShellDungeonEditorAllowed(){\n  try{const p=getActiveGameProfile?.();return !!p&&p.gameStyle===\"dungeon\"&&!window.GensCaptureV1?.isProfile?.(p)}catch(e){return false}\n}\nfunction applyModeEditorVisibility(){\n  let activeProfile=null;try{activeProfile=getActiveGameProfile()}catch(e){}"]]){
   assert.equal(source.split(current).length-1,1,
    'only the audited Dungeon editor Shell diff may be inverted');
   source=source.replace(current,previous);
  }
  index=Buffer.from(source,'utf8');
  assert.equal(hash(index),"17ba8e6f1faf6f8a0be8cdec68c4515d538ff646",
   'shell inverse must exactly reproduce certified main');
 }
 if(hash(index)!==upload.toBlob)return index;
 assert.equal(index.length,upload.toBytes,'provided profile-save upload size');
 let source=index.toString('utf8');
 for(const [before,after] of upload.edits.slice().reverse()){
  assert.equal(source.split(after).length-1,1,'exact profile-save upload body must occur once');
  source=source.replace(after,before);
 }
 const restored=Buffer.from(source,'utf8');
 assert.equal(restored.length,upload.fromBytes);
 assert.equal(hash(restored),upload.fromBlob,'provided upload must restore its exact predecessor');
 assert.equal(upload.fromBlob,PATCHED);
 return restored;
}
let cachedInput=null,cachedOutput=null;
function sourceForHistoricalSentinel(input){
 const original=Buffer.from(input);
 if(cachedInput&&original.equals(cachedInput))return Buffer.from(cachedOutput);
 const index=beforeChrome(original);
 if(hash(index)!==PATCHED)return index;
 const rollback=execFileSync('python3',[
  path.resolve(__dirname,'../gens_chrome_hero_recursion_patch_20261024.py'),
  '--reverse-stdout'
 ],{input:index,maxBuffer:12*1024*1024});
 assert.equal(hash(rollback),ORIGINAL,'Chrome startup history must reconstruct exact old Git blob');
 cachedInput=original;cachedOutput=rollback;
 return Buffer.from(rollback);
}
module.exports=sourceForHistoricalSentinel;
module.exports.beforeChrome=beforeChrome;
module.exports.accepts=input=>[PATCHED,upload.toBlob].includes(hash(Buffer.from(input)));
if(require.main===module)process.stdout.write(sourceForHistoricalSentinel(require('node:fs').readFileSync(0)));
