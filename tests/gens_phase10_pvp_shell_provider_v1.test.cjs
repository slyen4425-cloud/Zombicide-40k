"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const ownerSource=fs.readFileSync(path.join(root,"assets/gensrpg/pvp/session-v1.js"),"utf8");
const providerSource=fs.readFileSync(path.join(root,"assets/gensrpg/pvp/module-launch-v1.js"),"utf8");
const contract=JSON.parse(fs.readFileSync(path.join(root,"assets/gensrpg/pvp/module-launch-contract-v1.json"),"utf8"));
const entry=fs.readFileSync(path.join(root,"assets/gensrpg/pvp/entry-v1.js"),"utf8");
const runtime=fs.readFileSync(path.join(root,"assets/gensrpg/core/runtime-bootstrap-v1.js"),"utf8");

const foreignNames=["GensCaptureV1","GensDungeonV1","GensSurvivalV1","startConfiguredGame","openGensFamily"];
const foreign=Object.fromEntries(foreignNames.map(name=>[name,Object.freeze({name})]));
const window={...foreign};
const denied=new Proxy({}, {get(){throw Error("foreign document/storage read")},set(){throw Error("foreign document/storage write")}});
const context={window,document:denied,localStorage:denied,sessionStorage:denied,
  setInterval(){throw Error("interval forbidden")},setTimeout(){throw Error("timer forbidden")}
};
vm.runInNewContext(ownerSource,context,{filename:"pvp/session-v1.js",timeout:1500});
vm.runInNewContext(providerSource,context,{filename:"pvp/module-launch-v1.js",timeout:1500});
assert.deepEqual(Object.keys(window).filter(name=>!foreignNames.includes(name)).sort(),
  ["GensPvpModuleLaunchV1","GensPvpSessionV1"],"only two PvP APIs may be published");
foreignNames.forEach(name=>assert.strictEqual(window[name],foreign[name],"foreign owner mutated: "+name));
assert.match(entry,/Intentionally contains no runtime code/);
assert.doesNotMatch(runtime,/gensrpg\/pvp\/(module-launch|session)-v1\.js/);
assert.equal(contract.stage,"S1-Shell-provider-explicit-not-composed");
assert.equal(contract.owner,"pvp");

const provider=window.GensPvpModuleLaunchV1,owner=window.GensPvpSessionV1;
assert.equal(Object.isFrozen(provider),true);
assert.equal(provider.status().installed,false,"explicit install required");
assert.equal(provider.status().registered,false);
assert.equal(provider.prepare({}),false);
assert.equal(provider.startModuleSession(),false);
assert.equal(provider.stop(),false);
assert.throws(()=>provider.install({}),/Shell/);
assert.equal(provider.status().registered,false);

let family="capture",registrations=0,startCalls=0,stopCalls=0,allowStop=true,received=null;
const callbacks=new Map();
const shell={
  register(id,fn){
    assert.equal(id,"pvp","PvP may only register its own id");
    assert.equal(callbacks.has(id),false,"one provider registration");
    assert.equal(typeof fn,"function");
    registrations++;callbacks.set(id,fn);return true;
  },
  activeModule(){return family}
};
const bindings={
  shell,session:owner,
  onStart(session){startCalls++;received=session;return true},
  onStop(session){stopCalls++;assert.strictEqual(session,received);return allowStop}
};
assert.equal(provider.install(bindings),true);
assert.equal(provider.install(bindings),true,"same binding idempotent");
assert.equal(registrations,1);
assert.throws(()=>provider.install({...bindings}),/already installed/);
assert.equal(provider.status().installed,true);
assert.equal(provider.status().registered,true);
const launch=callbacks.get("pvp");
assert.equal(launch(),false,"Capture selection cannot launch PvP");
const setup={id:"duel-01",sides:[{id:"red",participants:["r1"]},{id:"blue",participants:["b1"]}],
  rules:{turns:"configured-by-user",targetScore:5}};
assert.equal(provider.prepare(setup),false,"foreign family cannot prepare PvP");
family="pvp";
assert.equal(launch(),false,"must not start unprepared PvP session");
assert.equal(provider.prepare(setup),true);
setup.rules.targetScore=999;
const snap=owner.snapshot();
assert.equal(snap.rules.targetScore,5,"session rules cloned before launch");
assert.equal(Object.isFrozen(snap.rules),true);
assert.equal(launch(),true);
assert.equal(provider.status().sessionPhase,"active");
assert.equal(startCalls,1);
assert.equal(launch(),false,"cannot launch duplicate active session");
assert.equal(provider.prepare(setup),false);
allowStop=false;
assert.equal(provider.dispose(),false,"cannot discard session after owner veto");
assert.equal(owner.status().phase,"active");
allowStop=true;
assert.equal(provider.stop(),true);
assert.equal(stopCalls,2);
assert.equal(owner.status().phase,"idle");
assert.equal(provider.dispose(),true);
assert.equal(provider.status().installed,false);
assert.equal(provider.status().registered,true,"Shell still stores old callback");
assert.equal(launch(),false,"disposed registration must be inert");
assert.throws(()=>provider.install(bindings),/terminal/,"no duplicate Shell registration");
assert.equal(registrations,1);
foreignNames.forEach(name=>assert.strictEqual(window[name],foreign[name],"foreign owner changed after lifecycle"));

console.log(JSON.stringify({scenario:"Phase 10 S1 PvP explicit Shell module-launch provider",
  registrationCount:registrations,sideCount:snap.sides.length,started:startCalls,
  ownerStopCalls:stopCalls,disposedProviderInert:true,nonInterference:true,
  gameplayImplemented:false,productionComposed:false}));
