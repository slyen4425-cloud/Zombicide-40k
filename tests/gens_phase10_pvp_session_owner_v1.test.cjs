"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"assets/gensrpg/pvp/session-v1.js"),"utf8");
const contract=JSON.parse(fs.readFileSync(path.join(root,"assets/gensrpg/pvp/session-contract-v1.json"),"utf8"));
const entry=fs.readFileSync(path.join(root,"assets/gensrpg/pvp/entry-v1.js"),"utf8");
const keys=["GensCaptureV1","GensDungeonV1","GensSurvivalV1","startConfiguredGame","openGensFamily"];
const stubs=Object.fromEntries(keys.map(key=>[key,Object.freeze({unchanged:true})]));
const window={...stubs};
const forbidden=new Proxy({},{
  get(){throw new Error("foreign runtime/storage read")},
  set(){throw new Error("foreign runtime/storage write")}
});
const sandbox={window,document:forbidden,localStorage:forbidden,sessionStorage:forbidden,
  setTimeout(){throw new Error("timer forbidden")},
  setInterval(){throw new Error("polling forbidden")}
};
vm.runInNewContext(source,sandbox,{filename:"session-v1.js",timeout:1500});
assert.deepEqual(Object.keys(window).filter(key=>!keys.includes(key)),["GensPvpSessionV1"]);
for(const key of keys)assert.strictEqual(window[key],stubs[key],"foreign module global changed");
assert.match(entry,/Intentionally contains no runtime code/,"production PvP entry remains inert");
assert.equal(contract.stage,"S0-session-ownership-not-composed");
assert.equal(contract.owner,"pvp");

const owner=window.GensPvpSessionV1;
assert.equal(Object.isFrozen(owner),true);
assert.equal(owner.status().installed,false,"must not auto-install");
assert.equal(owner.prepare({}),false);
assert.equal(owner.start(),false);
assert.equal(owner.stop(),false);
let moduleId="capture",startCount=0,stopCount=0,lastStart=null,stopAllowed=true;
const adapter={
 activeModule:()=>moduleId,
 onStart:s=>{startCount++;lastStart=s},
 onStop:s=>{stopCount++;assert.strictEqual(s,lastStart);return stopAllowed}
};
assert.equal(owner.install(adapter),true);
assert.equal(owner.install(adapter),true);
assert.throws(()=>owner.install({activeModule:()=>moduleId}),/already installed/);
assert.equal(owner.status().phase,"idle");

const rules={targetScore:7,damageMultiplier:0.75,nested:{suddenDeath:false},visualTags:["arena-a"]};
const draft={id:"duel-01",sides:[{id:"a",participants:["hero-a"]},{id:"b",participants:["hero-b","hero-c"]}],rules};
assert.equal(owner.prepare(draft),true);
const snapshot=owner.snapshot();
assert.equal(snapshot.id,"duel-01");
assert.equal(Object.isFrozen(snapshot),true);
assert.equal(Object.isFrozen(snapshot.rules.nested),true);
assert.equal(Object.isFrozen(snapshot.sides[0].participants),true);
assert.equal(owner.status().sideCount,2);
rules.nested.suddenDeath=true;
draft.sides[0].participants[0]="other";
assert.equal(snapshot.rules.nested.suddenDeath,false,"caller cannot silently override configured rules");
assert.equal(snapshot.sides[0].participants[0],"hero-a","participants copied");
assert.equal(owner.start(),false,"Capture selection cannot activate PvP");
assert.equal(startCount,0);
assert.equal(owner.status().phase,"prepared");
assert.throws(()=>owner.prepare({id:"bad",sides:[{id:"one",participants:["p"]},{id:"one",participants:["q"]}],rules:{}}),/duplicate/);
assert.equal(owner.snapshot(),snapshot,"invalid setup cannot clobber existing session");
assert.throws(()=>owner.prepare({id:"bad",sides:[{id:"one",participants:["p"]},{id:"two",participants:["p"]}],rules:{}}),/multiple/);
assert.throws(()=>owner.prepare({id:"bad",sides:[{id:"one",participants:["p"]}],rules:{}}),/two/);
assert.throws(()=>owner.prepare({id:"bad",sides:[{id:"one",participants:["p"]},{id:"two",participants:["q"]}],rules:null}),/rules/);
moduleId="pvp";
assert.equal(owner.start(),true);
assert.equal(owner.status().phase,"active");
assert.equal(startCount,1);
assert.equal(owner.start(),false,"must not start a second concurrent session");
assert.equal(owner.prepare(draft),false,"must not replace an active PvP session");
stopAllowed=false;
assert.equal(owner.stop(),false,"module refusal must preserve the session");
assert.equal(owner.status().phase,"active");
stopAllowed=true;
assert.equal(owner.stop(),true);
assert.equal(stopCount,2);
assert.equal(owner.status().phase,"idle");
assert.equal(owner.snapshot(),null);
assert.equal(owner.stop(),false);

const varied={id:"duel-02",sides:[{id:"red",participants:["r"]},{id:"blue",participants:["b"]},{id:"green",participants:["g"]}],rules:{targetScore:99,damageMultiplier:3}};
assert.equal(owner.prepare(varied),true,"rule and side variations must not be hard-coded");
assert.equal(owner.snapshot().rules.targetScore,99);
assert.equal(owner.status().sideCount,3);
assert.equal(owner.stop(),true,"prepared session must be cancelable");
assert.equal(owner.dispose(),true);
assert.equal(owner.status().installed,false);
assert.equal(owner.start(),false);
assert.strictEqual(window.GensDungeonV1,stubs.GensDungeonV1);
console.log(JSON.stringify({scenario:"Phase 10 S0 PvP standalone session owner",explicitLifecycle:true,storageAndDomUntouched:true,foreignGlobalsIntact:true,customRules:true,sideCounts:[2,3],shellStillPlaceholder:true}));
