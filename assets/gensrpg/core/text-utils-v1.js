/* GenSrpG Phase 4 — Core Text Utility v1.
   Pure/inert contract: no DOM, storage, events, timers, navigation or gameplay. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));
}

ROOT.GensTextUtilsV1=Object.freeze({
  VERSION,
  escapeHtml
});

})(typeof window!=="undefined"?window:globalThis);
