/* GenSrpG V16.78.99 compatibility shim.
   Hero-sheet portrait ownership has returned to the native index.html renderer.
   Kept inert so an old cached script reference cannot reinstall wrappers, timers or repairs. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const VERSION="1.1.0",APP_VERSION="16.78.114.11-native-sheet-owner";
function repairSheet(){return 0}
function install(){return true}
R.GensDungeonSheetArtStability167899={VERSION,APP_VERSION,retired:true,repairSheet,install};
})();
