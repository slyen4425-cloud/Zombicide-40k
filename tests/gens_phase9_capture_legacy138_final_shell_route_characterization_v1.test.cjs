'use strict';

// Phase 9: execute the actual inline Capture138 and Dungeon200 launch slices,
// then the actual final Shell authority from its source file. This is a
// characterization of CURRENT behavior, not proof that Capture138 is removable.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const index=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
assert.equal(bytes.length,8165438,'Rule 26: unexpected index size; re-audit the active source');
assert.equal(blob,'1a61147d5a32889fa85e6a09e846049103b9f0bf','Rule 26: unexpected index blob');
const shellFile='assets/gensrpg/shell/module-launch-final-authority-v1.js';
const shellFinal=fs.readFileSync(path.join(root,shellFile),'utf8');
const captureEntry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const getBlock=id=>{
  const re=new RegExp('<script\\b[^>]*\\bid="'+id+'"[^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=re.exec(index);assert.ok(m,'missing active script '+id);return m[1];
};
const capture138=getBlock('captureFix138');
const dungeon200=getBlock('dungeonCore200Rebuild');
const exact=(source,re,label)=>{const m=source.match(re);assert.ok(m,'missing real '+label);return m[0]};
const captureSlice=exact(capture138,/const start138=window\.startConfiguredGame;\s*window\.startConfiguredGame=async function\(\)\{[\s\S]*?\n\};/,'Capture138 global wrapper');
const dungeonSlice=exact(dungeon200,/const startOutside200=window\.startConfiguredGame;\s*const gensDungeonStartConfiguredGame200V1=async function\(\)\{[^\n]*\};\s*const gensDungeonStartModuleSessionV1=async\(\)=>\{[\s\S]*?\n\};/,'Dungeon200 retained fallback');
assert.ok(index.indexOf('<script id="captureFix138">')<index.indexOf('<script id="dungeonCore200Rebuild">'));
assert.ok(index.indexOf('<script id="dungeonCore200Rebuild">')<index.indexOf('<script src="'+shellFile+'"></script>'));
assert.match(shellFinal,/window\.startConfiguredGame=async function\(\)/,'final Shell must replace historical public global');
assert.match(index,/onclick="startConfiguredGame\(\)"/,'existing launch button must still target the final global');
assert.match(dungeon200,/GensShellModuleLaunchV1\.register\("dungeon",gensDungeonStartModuleSessionV1\)/);

(async()=>{
  let mode='capture',legacyBaseCalls=0,captureStarts=0,dungeonStarts=0,worldRenders=0;
  const actions=[],timers=[],handlers=new Map();
  const dom=new Map(['sheet','menu','captureGameHub'].map(id=>[id,{style:{display:'initial'},scrollIntoView:opts=>actions.push('scroll:'+id+':'+opts.block)}]));
  const launch={
    activeModule:()=>mode,
    register:(name,handler)=>{assert.equal(handlers.has(name),false,'single public provider '+name);handlers.set(name,handler);return true},
    startModuleSession:async name=>{
      actions.push('route:'+name);
      return handlers.has(name)?handlers.get(name)():false;
    }
  };
  const win={GensShellModuleLaunchV1:launch,startConfiguredGame:async()=>{legacyBaseCalls++;return 'legacy-base'}};
  const context=vm.createContext({
    window:win,console,
    document:{getElementById:id=>dom.get(id)||null},
    isCaptureContext138:()=>mode==='capture',
    isDungeonMode:()=>mode==='dungeon',
    gensShellActiveModuleV1:()=>mode,
    start:async()=>{dungeonStarts++;return 'dungeon-start'},
    renderCaptureWorldHub:()=>{worldRenders++},
    setTimeout:(cb,ms)=>{timers.push({cb,ms});return timers.length}
  });
  vm.runInContext(captureSlice,context,{timeout:2000,filename:'index:Capture138 actual wrapper'});
  const oldWindowWrapper=win.startConfiguredGame;
  assert.notEqual(typeof oldWindowWrapper,'undefined');
  vm.runInContext(dungeonSlice+'\n'+exact(dungeon200,/window\.GensShellModuleLaunchV1\.register\(\"dungeon\",gensDungeonStartModuleSessionV1\);/,'Dungeon200 registration'),context,{timeout:2000,filename:'index:Dungeon200 actual closure'});
  vm.runInContext(captureEntry,context,{timeout:2000,filename:'capture/entry-v1.js'});
  win.GensCaptureV1.install({start:async()=>{captureStarts++;return true}});
  vm.runInContext(shellFinal,context,{timeout:2000,filename:shellFile});
  assert.notEqual(win.startConfiguredGame,oldWindowWrapper,'the FINAL authority must replace Capture138 globally');

  mode='capture';
  assert.equal(await win.startConfiguredGame(),true);
  assert.equal(captureStarts,1);
  assert.equal(legacyBaseCalls,0,'public Capture launch never reaches the historical wrapped baseline');
  assert.equal(worldRenders,0,'Capture entry mock does not re-enter the legacy post-launch timer');
  assert.equal(timers.length,0,'public Capture launch creates no Capture138 timer');

  mode='dungeon';
  assert.equal(await win.startConfiguredGame(),true);
  assert.equal(dungeonStarts,1,'Dungeon public provider takes its local start');
  assert.equal(legacyBaseCalls,0);
  assert.equal(timers.length,0);

  mode='survival';
  assert.equal(await win.startConfiguredGame(),false,'unregistered Survie is not spoofed as Capture');
  assert.equal(actions.at(-1),'route:survival');
  assert.equal(legacyBaseCalls,0);

  // The *local* Dungeon200 fallback captures old Capture138 before the final
  // Shell override. This deliberately documents a remaining stale reference;
  // DO NOT delete Capture138 on the strength of the normal public path alone.
  mode='capture';
  assert.equal(await vm.runInContext('gensDungeonStartConfiguredGame200V1()',context,{timeout:2000}), 'legacy-base');
  assert.equal(legacyBaseCalls,1,'Dungeon200 retained fallback still calls the old chain');
  assert.deepEqual(timers.map(x=>x.ms),[30]);
  timers.splice(0).forEach(x=>x.cb());
  assert.equal(worldRenders,1,'historical fallback still refreshes Capture Hub');
  assert.equal(dom.get('sheet').style.display,'none');
  assert.equal(dom.get('menu').style.display,'block');
  assert.equal(dom.get('captureGameHub').style.display,'block');
  assert.ok(actions.includes('scroll:captureGameHub:start'));

  // A delayed callback can fire after a context change: the historical
  // code does not check identity again. Observe risk; do not claim a fix.
  mode='capture';
  await vm.runInContext('gensDungeonStartConfiguredGame200V1()',context,{timeout:2000});
  mode='dungeon';
  const before=worldRenders;
  timers.splice(0).forEach(x=>x.cb());
  assert.equal(worldRenders,before,'Capture138 delayed callback must be inert after the mode changes');

  console.log(JSON.stringify({scenario:'Capture138 / Dungeon200 / final Shell real-source ordering',
    publicRoutes:['capture','dungeon','survival'],publicLegacyInvocations:0,
    staleDungeonFallback:true,legacyTimerMs:30,postModeChangeLegacyTimerStillRuns:false,
    runtimeChanged:false,indexBytes:bytes.length,indexBlob:blob}));
})().catch(e=>{console.error(e);process.exitCode=1});
