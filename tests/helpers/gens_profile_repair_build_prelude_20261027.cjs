'use strict';
// Static test projection of the explicit, already-shipped Pages prelude.
// The production loader and the runtime file are never changed by this helper.
const assert=require('node:assert/strict');
const MODULE='assets/gensrpg/core/dungeon-profile-auto-repair-v1.js';
const STORAGE='assets/gensrpg/core/storage-v1.js';
function includeBuildPrelude(direct,workflow){
  const marker='<script src="'+STORAGE+'"></script>';
  const repair='<script src="'+MODULE+'?v=20261025"></script>';
  assert.equal(workflow.split("marker = '"+marker+"'").length-1,1,'one exact Pages storage marker');
  assert.equal(workflow.split("repair = '"+repair+"'").length-1,1,'one exact Pages profile repair prelude');
  assert.ok(workflow.includes("html.replace(marker, repair + '\\n' + marker, 1)"),'Pages must inject repair immediately before storage');
  assert.ok(workflow.includes("assert repair not in html"),'Pages must reject duplicate repair insertion');
  assert.equal(direct.includes(MODULE),false,'repair must not be silently loaded twice');
  const index=direct.indexOf(STORAGE);assert.ok(index>=0,'Core storage owner must be present');
  return [...direct.slice(0,index),MODULE,...direct.slice(index)];
}
module.exports={MODULE,includeBuildPrelude};
