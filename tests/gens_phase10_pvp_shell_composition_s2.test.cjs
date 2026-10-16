"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const foreignNames=["GensCaptureV1","GensDungeonV1","GensSurvivalV1","startConfiguredGame","openGensFamily"];
const foreign=Object.fromEntries(foreignNames.map(key=>[key,Object.freeze({key})]));
const callbacks=new Map();
let family="capture",registrationCount=0;
const shell={
  register(id,handler){
    assert.equal(id,"pvp");
    assert.equal(callbacks.has(id),false);
    registrationCount++;callbacks.set(id,handler);return true;
  },
  activeModule(){return family}
};
const win={...foreign,GensShellModuleLaunchV1:shell};
const deny=new Proxy({},{
  get(){throw Error("foreign DOM/storage read")},
  set(){throw Error("foreign DOM/storage write")}
});
const context={window:win,document:deny,localStorage:deny,sessionStorage:deny,
  setTimeout(){throw Error("timer forbidden")},setInterval(){throw Error("interval forbidden")}};
for(const file of ["session-v1.js","module-launch-v1.js","shell-composition-v1.js"]){
  vm.runInNewContext(read("assets/gensrpg/pvp/"+file),context,{filename:file,timeout:1500});
}
const compose=win.GensPvpShellCompositionV1;
const provider=win.GensPvpModuleLaunchV1;
const session=win.GensPvpSessionV1;
assert.equal(Object.isFrozen(compose),true);
assert.equal(compose.status().connected,false,"composition needs an explicit owner invocation");
assert.equal(compose.status().registered,false);
assert.equal(registrationCount,0);
assert.equal(compose.connect(),true);
assert.equal(compose.connect(),true,"composition must be idempotent");
assert.equal(registrationCount,1,"exactly one Shell provider");
assert.equal(compose.status().connected,true);
assert.equal(compose.status().registered,true);
const launch=callbacks.get("pvp");
assert.equal(launch(),false,"unprepared PvP must remain unavailable");
assert.equal(provider.prepare({id:"game",sides:[{id:"a",participants:["one"]},{id:"b",participants:["two"]}],rules:{score:8}}),false,
  "foreign modules cannot configure PvP");
family="pvp";
assert.equal(launch(),false);
const options={id:"config-owned",sides:[{id:"left",participants:["one"]},{id:"right",participants:["two"]}],
  rules:{customThreshold:41,customFlag:true}};
assert.equal(provider.prepare(options),true);
options.rules.customThreshold=999;
assert.equal(session.snapshot().rules.customThreshold,41,"rule owner must clone config");
assert.equal(launch(),true);
assert.equal(launch(),false,"duplicate PvP start forbidden");
assert.equal(provider.stop(),true);
assert.equal(provider.dispose(),true);
assert.equal(compose.status().connected,false);
assert.equal(compose.connect(),false,"Shell has no unregister; do not register twice");
assert.equal(launch(),false,"disposed callback inert");
assert.equal(registrationCount,1);
for(const name of foreignNames)assert.strictEqual(win[name],foreign[name],"foreign authority changed: "+name);
assert.deepEqual(Object.keys(win).filter(k=>!foreignNames.includes(k)&&k!=="GensShellModuleLaunchV1").sort(),
  ["GensPvpModuleLaunchV1","GensPvpSessionV1","GensPvpShellCompositionV1"].sort());
assert.match(read("index.html")+read("assets/gensrpg/shell/legacy-hub-family-ui-v1.js"),/PVP — À VENIR/,"no invented PvP gameplay or false playable UX");
console.log(JSON.stringify({scenario:"Phase 10 S2 explicit PvP-to-Shell composition",
  explicitConnect:true,registered:registrationCount,foreignOwnersIntact:true,customRules:true,
  gameplayImplemented:false,manualIndexCompositionPending:true}));
