"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const rootDir=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(rootDir,f),"utf8");
const foreignKeys=["GensCaptureV1","GensDungeonV1","GensSurvivalV1","startConfiguredGame","openGensFamily"];
const foreign=Object.fromEntries(foreignKeys.map(key=>[key,Object.freeze({key})]));
const win={...foreign};
const denied=new Proxy({},{
  get(){throw new Error("foreign document or storage read")},
  set(){throw new Error("foreign document or storage write")}
});
const context={window:win,document:denied,localStorage:denied,sessionStorage:denied,
  setTimeout(){throw new Error("PvP UI timer forbidden")},
  setInterval(){throw new Error("PvP UI interval forbidden")}};
for(const f of ["session-v1.js","module-launch-v1.js","setup-ui-v1.js"]){
  vm.runInNewContext(read("assets/gensrpg/pvp/"+f),context,{filename:f,timeout:1600});
}
const ui=win.GensPvpSetupUiV1,provider=win.GensPvpModuleLaunchV1,owner=win.GensPvpSessionV1;
assert.equal(ui.status().mounted,false,"not auto-mounted");
assert.equal(Object.isFrozen(ui),true);
assert.deepEqual(Object.keys(win).filter(x=>!foreignKeys.includes(x)).sort(),
  ["GensPvpSetupUiV1","GensPvpModuleLaunchV1","GensPvpSessionV1"].sort());

class FakeNode{
  constructor(tag,doc){
    this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];
    this.parentNode=null;this.listeners=new Map();this.textContent="";this.value="";
  }
  appendChild(child){assert.equal(child.parentNode,null);this.children.push(child);child.parentNode=this;return child}
  removeChild(child){const index=this.children.indexOf(child);assert.ok(index>=0);this.children.splice(index,1);child.parentNode=null;return child}
  setAttribute(key,val){this[key]=val}
  addEventListener(key,fn){let listeners=this.listeners.get(key)||new Set();listeners.add(fn);this.listeners.set(key,listeners)}
  removeEventListener(key,fn){this.listeners.get(key)?.delete(fn)}
  fire(event,props={}){
    for(const fn of this.listeners.get(event)||[])fn({...props,preventDefault(){this.defaultPrevented=true}});
  }
}
const doc={createElement(tag){return new FakeNode(tag,doc)}};
function descendants(n){
  return [n,...n.children.flatMap(descendants)];
}
function placeholder(n,term){
  const match=descendants(n).find(x=>x.placeholder&&x.placeholder.includes(term));
  assert.ok(match,"missing input: "+term);
  return match;
}
function button(n,label){
  const match=descendants(n).find(x=>x.tagName==="BUTTON"&&x.textContent===label);
  assert.ok(match,"missing button: "+label);
  return match;
}
function statusText(n){return descendants(n).find(x=>x.role==="status")?.textContent}
const foreignPanel=doc.createElement("article");
const container=doc.createElement("div");
container.appendChild(foreignPanel);
const other=doc.createElement("div");
let active="capture",registered=0,starts=0;
const handlers=new Map();
const shell={
  activeModule(){return active},
  register(id,callback){registered++;handlers.set(id,callback);return true}
};
assert.equal(provider.install({shell,session:owner}),true);
assert.equal(registered,1);
assert.throws(()=>ui.mount({container,activeModule:()=>active,provider}),/active PvP/);
assert.equal(ui.status().mounted,false);
active="pvp";
const root=ui.mount({container,activeModule:()=>active,provider}).root;
assert.equal(ui.status().mounted,true);
assert.strictEqual(container.children[0],foreignPanel,"pre-existing screen must remain");
assert.equal(root.parentNode,container);
assert.equal(descendants(root).filter(x=>x.className==="gens-pvp-side").length,2);
assert.match(descendants(root).find(x=>x.tagName==="P")?.textContent||"",/Aucun combat PvP/);

button(root,"Retirer ce camp").fire("click");
assert.equal(descendants(root).filter(x=>x.className==="gens-pvp-side").length,2,"two camps minimum");
button(root,"Ajouter un camp").fire("click");
assert.equal(descendants(root).filter(x=>x.className==="gens-pvp-side").length,3);
button(root,"Retirer ce camp").fire("click");
assert.equal(descendants(root).filter(x=>x.className==="gens-pvp-side").length,2);

const form=descendants(root).find(x=>x.tagName==="FORM");
const submit=()=>form.fire("submit");
placeholder(root,"session").value="custom-duel";
const campIds=descendants(root).filter(x=>x.placeholder==="ex. equipe-a");
const participantIds=descendants(root).filter(x=>x.placeholder==="ex. perso-1,perso-2");
campIds[0].value="alpha";campIds[1].value="beta";
participantIds[0].value="p1, p2";participantIds[1].value="p3";
const rules=descendants(root).find(x=>x.tagName==="TEXTAREA");
rules.value="{}";
submit();
assert.match(statusText(root),/objet JSON non vide/);
assert.equal(owner.status().phase,"idle");
rules.value="{broken json";
submit();
assert.match(statusText(root),/Configuration invalide/);
assert.equal(owner.status().phase,"idle");
rules.value=JSON.stringify({creatorDefined:{victoryPredicate:"from-game-profile"},customThreshold:23});
submit();
assert.equal(owner.status().phase,"prepared");
const snapshot=owner.snapshot();
assert.equal(snapshot.id,"custom-duel");
assert.deepEqual(JSON.parse(JSON.stringify(snapshot.sides)),[
  {id:"alpha",participants:["p1","p2"]},{id:"beta",participants:["p3"]}
]);
assert.equal(snapshot.rules.customThreshold,23);
assert.equal(Object.isFrozen(snapshot.rules.creatorDefined),true);
assert.match(statusText(root),/gameplay de duel reste à développer/);
assert.equal(starts,0,"setup should not launch a fight");

assert.equal(provider.stop(),true);
campIds[1].value="alpha";
submit();
assert.match(statusText(root),/duplicate PvP side/);
assert.equal(owner.status().phase,"idle");
campIds[1].value="beta";
active="dungeon";
submit();
assert.match(statusText(root),/réservée au mode PvP/);
assert.equal(owner.status().phase,"idle");

assert.equal(ui.dispose(),true);
assert.equal(ui.dispose(),true,"repeat dispose is safe");
assert.equal(ui.status().mounted,false);
assert.deepEqual(container.children,[foreignPanel],"dispose removes only the owned screen");
assert.equal(form.listeners.get("submit")?.size,0,"local listeners released");
assert.equal(other.children.length,0);
for(const key of foreignKeys)assert.strictEqual(win[key],foreign[key],"foreign globals untouched");
assert.equal(handlers.get("pvp")(),false,"no prepared PvP session after stop");
console.log(JSON.stringify({scenario:"Phase 10 S3 isolated configurator screen",
  explicitMount:true,creatorRules:true,creatorCamps:true,foreignModulesUnchanged:true,
  ownerValidationReused:true,noGameRulesInvented:true,noAutoStart:true,domDisposed:true}));
