/* GenSrpG Phase 4 — pure text utilities.
   No DOM, storage, events, timers, RNG, navigation or gameplay ownership. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g,ch=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  })[ch]);
}

ROOT.GensTextUtilsV1=Object.freeze({
  VERSION,
  escapeHtml
});

})(typeof window!=="undefined"?window:globalThis);
