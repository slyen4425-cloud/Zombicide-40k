'use strict';
// Build-only Shell composition. The historical source stays BYTE EXACT for
// archived checkpoints. The PUBLIC Pages artifact has one Capture V2 entry.
const fs=require('node:fs');
const path=require('node:path');
const LEGACY='function openGensFamily(family){\n  gensSelectedFamily=family;';
const PUBLIC=`function openGensFamily(family){
  // Only the production Pages Shell uses the official V2 owner. If its
  // stamped entry fails to load, do not fall back to a second Capture engine.
  if(family==="capture"&&document.querySelector('script[data-gensrpg-main-capture-route="v2"]')){
    if(typeof window.GensCaptureMainEntryV1?.open!=="function")
      throw new Error("Official Monster Capture V2 main entry is unavailable");
    return window.GensCaptureMainEntryV1.open();
  }
  gensSelectedFamily=family;`;
function stage(source){
 if(typeof source!=='string'||source.split(LEGACY).length!==2||
    source.includes('GensCaptureMainEntryV1.open'))
   throw new Error('Historical Shell source seam drift or duplicate Capture owner');
 return source.replace(LEGACY,PUBLIC);
}
if(require.main===module){
 const target=process.argv[2];
 const exact='/_site/assets/gensrpg/shell/legacy-hub-family-ui-v1.js';
 if(!target||!path.resolve(target).endsWith(exact))
   throw new Error('Only the assembled _site historical Shell may be staged');
 const original=fs.readFileSync(target,'utf8');
 fs.writeFileSync(target,stage(original),'utf8');
 console.log('STAGED root Shell Capture V2 authority, historical source unchanged');
}
module.exports={stage};
