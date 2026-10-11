'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/gensrpg/capture/hub-entry-v1.js'),'utf8');
const dom=new Map();
for(const id of ['gensRootHome','gensFamilyHome','gensGameHome','setup','menu','captureGameHub']){
  dom.set(id,{id,style:{display:id==='menu'?'none':'block',setProperty(name,value){if(name==='display')this.display=value;}},scrollIntoView(){}});
}
const events=[];
const win={document:{getElementById:id=>dom.get(id)||null},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};
// The Shell is the ONLY writer of the three home-level visibility values.
win.gensHideHomeLevels=()=>{
  events.push('shell-hide-home');
  for(const id of ['gensRootHome','gensFamilyHome','gensGameHome'])dom.get(id).style.display='none';
};
vm.runInNewContext(source,{window:win},{timeout:1500});
const owner=win.GensCaptureHubEntryV1;
owner.install({
  closeTurnPopup:()=>events.push('close-popup'),
  renderMenuStatuses:()=>events.push('menu-statuses'),
  renderCaptureWorldHub:()=>events.push('capture-world')
});
owner.enterWorld();
for(const id of ['gensRootHome','gensFamilyHome','gensGameHome'])assert.equal(dom.get(id).style.display,'none',id+' must be hidden through Shell before Capture world opens');
assert.equal(dom.get('setup').style.display,'none');
assert.equal(dom.get('menu').style.display,'block');
assert.equal(dom.get('captureGameHub').style.display,'block');
assert.equal(events[0],'shell-hide-home','Shell must clear stale Dungeon/Survie home before displaying Capture');
assert.equal(events.filter(x=>x==='shell-hide-home').length,1,'one Shell navigation call per Capture entry');
assert.ok(!source.includes('"gensRootHome"'),'Capture must not write Shell home levels itself');
console.log(JSON.stringify({scenario:'Capture world entry hides stale root through existing Shell owner',shellCalls:1,returnToCapture:true}));
