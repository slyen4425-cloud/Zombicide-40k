'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

assert.equal(bytes.length,8170350,
  'generated-transition characterization must start from the exact previous Phase 7 GREEN runtime');
assert.equal(blob,'e513d23c7a8c7aef9a187202bbcc34ab540e856f',
  'generated-transition characterization must start from the exact previous Phase 7 GREEN blob');

const m=index.match(/<script\b[^>]*\bid=["']dungeonCore200Rebuild["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(m,'missing dungeonCore200Rebuild');
const core=m[1];

const planPos=core.indexOf('const advancePlan=GensDungeonV1.exploration.planGeneratedAdvance(');
const movePos=core.indexOf('function moveTo(',planPos);
assert.ok(planPos>=0&&movePos>planPos,
  'generated transition must remain locatable between the advance plan and moveTo');
const transition=core.slice(planPos,movePos);

assert.match(transition,/const targetRoom=advancePlan\.targetRoom;/,
  'Core200 must consume the target room from the public Dungeon planner');
assert.match(transition,/const movementLeft=Number\.isFinite\(Number\(x\.remaining\?\.\[heroId\]\)\)[\s\S]*?Math\.max\(0,Number\(x\.remaining\[heroId\]\)\):moveMax\(heroId\);/,
  'room transition must preserve current movement when available');
assert.match(transition,/spatialPersist\(x\);/,
  'current spatial state must be persisted before changing rooms');

const existingPos=transition.indexOf("const existing=x.roomStates?.[String(targetRoom)];");
const existingIf=transition.indexOf("if(advancePlan.status==='existing'&&existing?.last){",existingPos);
const createPos=transition.indexOf('x.room=targetRoom;x.enemyCells={};x.branch=null;',existingIf);
assert.ok(existingPos>=0&&existingIf>existingPos&&createPos>existingIf,
  'existing-room path must remain before new-room creation');

const existingBlock=transition.slice(existingIf,createPos);
assert.match(existingBlock,/spatialSetRoom\(x,heroId,targetRoom\);/,
  'existing-room join must move only the active hero room assignment');
assert.match(existingBlock,/spatialActivate\(x,heroId\);/,
  'existing-room join must activate the joining hero spatial state');
assert.match(existingBlock,/const entry=spawnIndex\(x\.last\?\.map\);/,
  'existing-room join must resolve the room entry cell');
assert.match(existingBlock,/x\.positions\[heroId\]=entry;/,
  'existing-room join must place the active hero on the entry cell');
assert.match(existingBlock,/x\.remaining\[heroId\]=movementLeft;/,
  'existing-room join must preserve the active hero movement');
assert.match(existingBlock,/created:false/,
  'existing-room transition marker must record created=false');
assert.match(existingBlock,/saveRt\(x\);render\(\);/,
  'existing-room join must persist then render');
assert.doesNotMatch(existingBlock,/chooseKind\(|createRoom\(|placeSceneForRoom\(|assignEnemyCells\(|maybeDoorChallenge\(/,
  'existing-room join must not recreate generated room content');

const createBlock=transition.slice(createPos);
assert.match(createBlock,/x\.room=targetRoom;x\.enemyCells=\{\};x\.branch=null;/,
  'new-room path must reset room-local generated state');
assert.match(createBlock,/spatialSetRoom\(x,heroId,targetRoom\);/,
  'new-room path must move the active hero room assignment');
assert.match(createBlock,/const kind=chooseKind\(x\.room\),made=createRoom\(x\.room,kind\);/,
  'new-room path must keep kind selection and room creation together');
assert.match(createBlock,/x\.last=\{kind,room:x\.room,at:Date\.now\(\),title:made\.result\.title,map:made\.map,narrative:'',exitLocked:false,keyEnemyId:''\};/,
  'new-room path must create the canonical room snapshot');
assert.match(createBlock,/const entry=spawnIndex\(x\.last\?\.map\);/,
  'new-room path must resolve the room entry cell');
assert.match(createBlock,/x\.positions\[heroId\]=entry;/,
  'new-room path must place the active hero on the entry cell');
assert.match(createBlock,/x\.remaining\[heroId\]=movementLeft;/,
  'new-room path must preserve active hero movement');
assert.match(createBlock,/created:true/,
  'new-room transition marker must record created=true');

const order=[
  'saveRt(x);placeSceneForRoom(x,kind,made.result);',
  "if(kind==='rest')applyRest200(x);",
  'maybeSpecialBranch(x);assignEnemyCells(x);initLock(x);maybeDoorChallenge(x);saveRt(x);render();roomIntro(x,made.result)'
].map(s=>createBlock.indexOf(s));
assert.ok(order.every(n=>n>=0)&&order[0]<order[1]&&order[1]<order[2],
  'new-room post-create scene/rest/event preparation order must remain unchanged');

assert.doesNotMatch(transition,/GensRpgTacticalCombatV2Bridge|requestCombat|launchCombat200|startCombat\(/,
  'room transition itself must not start Tactical combat');

assert.match(entry,/planGeneratedAdvance/,
  'previous Phase 7 public advance planner must remain installed');
assert.doesNotMatch(entry,/document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'active Dungeon public slice must remain pure during transition characterization');
assert.doesNotMatch(authored,/GensDungeonV1/,
  'authored travel must remain separate during generated transition characterization');

console.log(JSON.stringify({
  scenario:'Phase 7 generated room transition characterization',
  base:{bytes:bytes.length,blob},
  existing:{
    preservesMovement:true,
    entryPlacement:true,
    recreatesRoom:false,
    transitionCreated:false
  },
  create:{
    preservesMovement:true,
    entryPlacement:true,
    transitionCreated:true,
    postCreateOrderProtected:true
  },
  tacticalTriggered:false,
  authored:'separate'
},null,2));
