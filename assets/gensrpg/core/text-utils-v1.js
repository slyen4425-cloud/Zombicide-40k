/* GenSrpG Phase 4 — pure text utilities.
   Generic text transformation only; no runtime, DOM or gameplay ownership. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const HTML_ENTITIES=Object.freeze({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  '"':"&quot;",
  "'":"&#39;"
});

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>HTML_ENTITIES[ch]);
}

ROOT.GensTextUtilsV1=Object.freeze({
  VERSION,
  escapeHtml
});

})(typeof window!=="undefined"?window:globalThis);
