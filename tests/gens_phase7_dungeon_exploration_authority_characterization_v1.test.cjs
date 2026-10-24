'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const room=read('assets/dungeon/dungeon-room-runtime-167822.js');
const world=read('assets/dungeon/dungeon-world-runtime-167823.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const bridge=read('assets/dungeon/dungeon-world-session-bridge-167832.js');
const retPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const actionFix=read('assets/dungeon/dungeon-authored-action-fix-167857.js');

assert.match(entry,/GensDungeonV1/,
  'Phase 7 Dungeon public entry must expose the connected public namespace');
assert.match(entry,/planGeneratedAdvance/,
  'Phase 7 first connected Dungeon slice must remain the generated advance planner');
assert.doesNotMatch(entry,/document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Phase 7 first connected Dungeon slice must remain pure and side-effect free');
assert.equal(contract.module,'dungeon');
assert.ok(contract.owns.includes('exploration'),'Dungeon contract must own exploration');
assert.ok(contract.owns.includes('movement'),'Dungeon contract must own movement');
assert.ok(contract.owns.includes('combat trigger'),'Dungeon contract must own the Tactical trigger boundary');
assert.ok(contract.forbidden.includes('Tactical combat resolution'),
  'Dungeon contract must never absorb Tactical combat resolution');

assert.match(room,/function installExploreWrapper\(\)/,
  'Room Runtime exploration wrapper must remain characterized');
assert.match(room,/core\.explore=wrapped/,
  'Room Runtime currently replaces DungeonCore01.explore');
assert.match(room,/wrapped\.__drr167822=true/,
  'Room Runtime exploration marker drifted');

assert.match(world,/function installExploreWrapper\(\)/,
  'World Runtime exploration wrapper must remain characterized');
assert.match(world,/core\.explore=wrapped/,
  'World Runtime currently replaces DungeonCore01.explore');
assert.match(world,/wrapped\.__dwr167823=true/,
  'World Runtime exploration marker drifted');
assert.match(world,/function travel\(\).*DungeonCore01\?\.explore/s,
  'World Runtime travel must still route through the current DungeonCore01.explore chain');

assert.match(authored,/function travel\(\)/,
  'Authored Runtime travel owner must remain explicit');
assert.match(authored,/function enterNode\(/,
  'Authored Runtime enterNode owner must remain explicit');
assert.match(authored,/function disableLegacyWorldRuntime\(\)/,
  'Authored Runtime must explicitly disable the legacy World Runtime');
assert.match(authored,/oldExplore=core\.explore/,
  'Authored Runtime must still wrap the pre-existing explore chain');
assert.match(authored,/w\.__dar167839=true/,
  'Authored Runtime exploration marker drifted');
assert.match(authored,/w\.__drr167822=true/,
  'Authored Runtime must preserve the Room Runtime chain marker');
assert.match(authored,/w\.__dwr167823=true/,
  'Authored Runtime must preserve the World Runtime chain marker');
assert.match(authored,/return active\(\)\?travel\(\):oldExplore\.apply\(this,arguments\)/,
  'Authored Runtime must own built-world travel while delegating generated adventures');
assert.doesNotMatch(authored,/GensRpgTactical|TacticalCombat|gtv2|tactical/i,
  'Authored exploration runtime must not consume Tactical UI/runtime directly');

assert.match(bridge,/function patchStart\(\)/,
  'World Session Bridge start boundary must remain characterized');
assert.match(bridge,/DungeonAuthoredRuntime167839/,
  'Built-world start must route to the authored runtime');
assert.match(bridge,/disableLegacyWorld/,
  'Built-world selection must keep legacy World Runtime disabled');

assert.match(retPersist,/A\.enterNode=wrapped/,
  'Return persistence still decorates Authored enterNode and must be preserved during migration');
assert.match(actionFix,/DungeonSpatial313/,
  'Authored action fix still decorates spatial persistence and is outside the first migration seam');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon exploration entry authority characterization',
  publicEntry:'partial-runtime-generated-advance-plan',
  generatedAdventure:'delegated to pre-authored explore chain',
  authoredWorld:'DungeonAuthoredRuntime167839.travel',
  adjacentDecorators:[
    'DungeonAuthoredReturnPersist167862',
    'DungeonAuthoredActionFix167857'
  ],
  decision:'characterized-not-yet-migrated'
},null,2));
