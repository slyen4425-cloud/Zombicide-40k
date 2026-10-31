'use strict';
// Versioned, byte-exact inverse for the ONLY authorized HTML authoring seam.
// This is a test/rollback proof, not a runtime compatibility layer or fallback.
// A changed/unrecognized index is rejected; immutable historical owners remain
// certifiable without storing another 1.7 MB duplicate HTML authority.
const crypto=require('node:crypto');
const original='17ba8e6f1faf6f8a0be8cdec68c4515d538ff646';
const reviewed='c53d234fca05e49a33650a61776fae1c1985613e';
const blob=value=>{
 const data=Buffer.isBuffer(value)?value:Buffer.from(value,'utf8');
 return crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
};
const pairs=[
 [`onclick="(GensCaptureV1.isProfile(getActiveGameProfile())?GensCaptureLabAuthorUiV1.open('creature'):openControllableCreatureLibrary())"`,`onclick="openControllableCreatureLibrary()"`],
 [`id="abilityLibraryHubCard" class="editorHubCard" onclick="(GensCaptureV1.isProfile(getActiveGameProfile())?GensCaptureLabAuthorUiV1.open('skill'):openAbilityLibrary(null))"`,`id="abilityLibraryHubCard" class="editorHubCard" onclick="openAbilityLibrary(null)"`],
 [`<script src="assets/gensrpg/capture/lab-ownership-port-v1.js?v=1"></script>
<script type="module" src="assets/gensrpg/capture/capture-lab-author-entry-v1.mjs"></script>
<script src="assets/gensrpg/capture/entry-v1.js?v=1"></script>`,`<script src="assets/gensrpg/capture/entry-v1.js?v=1"></script>`],
 [`<button type="button" onclick="GensCaptureLabAuthorUiV1.open('bestiary')">📚 Bestiaire Labo</button>
         <button type="button" onclick="GensCaptureLabAuthorUiV1.open('rules')">⚙️ Règles du Labo</button>
         <button id="captureMjQuickBtn" type="button" onclick="captureOpenMjPanel()">🎛️ MJ</button>`,`<button id="captureMjQuickBtn" type="button" onclick="captureOpenMjPanel()">🎛️ MJ</button>`]
];
function toHistoricalIndex(value){
 if(blob(value)!==reviewed)throw new Error('Unknown product index: cannot use historic source projector');
 let source=Buffer.isBuffer(value)?value.toString('utf8'):value;
 for(const [newText,oldText] of pairs){
  if(source.split(newText).length!==2)throw new Error('Nonunique or missing sole Lab author route');
  source=source.replace(newText,oldText);
 }
 if(blob(source)!==original)throw new Error('Historical index byte fingerprint mismatch after strict inverse');
 return Buffer.from(source,'utf8');
}
module.exports=Object.freeze({original,reviewed,blob,toHistoricalIndex});
