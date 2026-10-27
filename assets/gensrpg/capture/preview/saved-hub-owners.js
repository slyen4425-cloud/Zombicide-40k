/* Isolated preview identities and DOM only: the actual unchanged Capture
 * world-exploration-v1.js and team-roster-v1.js own their storage operations.
 * Never load this in the real GenSrpg index or install a global gameplay patch.
 */
var current='trainer-preview',state=null;
globalThis.capturePreviewHeroWrites=0;
function activeGameProfileId(){return 'gensrpg_capture_lab_saved_preview_profile_v1'}
function normalizeGameParticipants(){return [current]}
function key(id){return 'gensrpg_capture_lab_saved_preview_hero_'+id}
function loadState(id){return JSON.parse(localStorage.getItem(key(id))||'{}')}
function loadSharedEntities(){return globalThis.capturePreviewEntities||[]}
function hasActiveSession(){return false}
function gensCurrentContentFamily(){return 'creature'}
