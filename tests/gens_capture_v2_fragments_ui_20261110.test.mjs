// Native Capture Sac contract: real projection, existing UI and source fields.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {
 SHOWCASE_ADVENTURE_RULES_V1,createAdventureSessionV1,
 awardAdventureSpeciesFragmentsV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventurePlaySheetSnapshotV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';
import {renderAdventureSheetViewV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const source=file=>readFileSync(resolve(here,'..',file),'utf8');
const cards=[{id:'gorice',name:'Gorice',skills:[{state:'ready'}]},
 {id:'gemmor',name:'Gemmor',skills:[{state:'ready'}]}];
const registry={schema:'capture-stat-registry-v1',stats:[]};
const now='2026-11-10T11:05:00.000Z';
const current=()=>{
 const s=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'gorice',
  ids:{sessionId:'world-test',instanceId:'owned-gorice'},now,
  rules:SHOWCASE_ADVENTURE_RULES_V1
 });
 return {...s,status:'playing'};
};
const snapshot=session=>adventurePlaySheetSnapshotV1({
 session,bestiaryCards:cards,statRegistry:registry
});
class FakeEl{
 constructor(tag){
  this.tagName=tag;this.className='';this.children=[];
  this.textContent='';this.listeners={};this.disabled=false;this.value='';
 }
 append(...children){this.children.push(...children);}
 prepend(...children){this.children.unshift(...children);}
 replaceChildren(...children){this.children=[...children];}
 setAttribute(name,value){this[name]=value;}
 addEventListener(type,callback){this.listeners[type]=callback;}
 click(){this.listeners.click?.();}
}
const find=(el,predicate)=>{
 if(predicate(el))return el;
 for(const child of el.children??[]){
  const result=find(child,predicate);if(result)return result;
 }
 return null;
};
test('official fragments project as Éclat, quantity 7/10 and no false full-inventory action',()=>{
 const raw=current();
 const s=awardAdventureSpeciesFragmentsV1({
  session:raw,bestiaryCards:cards,speciesId:'gemmor',
  quantity:7,actionId:'reward-1',now
 }).session;
 const item=snapshot(s).inventory.items.find(v=>v.id==='fragment:gemmor');
 assert.equal(item.name,'Éclat de Gemmor');
 assert.equal(item.quantity,7);
 assert.equal(item.fragment.required,10);
 assert.equal(item.fragment.summonLevel,1);
 assert.equal(item.fragment.canSummon,false);
 assert.equal(item.fragment.canConvert,false);
 const full=awardAdventureSpeciesFragmentsV1({
  session:s,bestiaryCards:cards,speciesId:'gemmor',
  quantity:3,actionId:'reward-2',now
 }).session;
 assert.equal(snapshot(full).inventory.items.find(v=>v.fragment).fragment.canSummon,true);
});
test('existing Sac view invokes real callbacks only for valid fragments and target instances',()=>{
 let s=awardAdventureSpeciesFragmentsV1({
  session:current(),bestiaryCards:cards,speciesId:'gorice',
  quantity:12,actionId:'reward',now
 }).session;
 const oldDocument=globalThis.document;
 globalThis.document={createElement:tag=>new FakeEl(tag)};
 const actions=[];
 try{
  const host=new FakeEl('div');
  renderAdventureSheetViewV1({
   host,snapshot:snapshot(s),tab:'inventory',
   resolveFragmentIcon:()=>null,
   onSummonFragment:speciesId=>actions.push(['summon',speciesId]),
   onUseFragmentXp:(speciesId,id,quantity)=>actions.push(['xp',speciesId,id,quantity])
  });
  const invoke=find(host,e=>e.tagName==='button'&&e.textContent==='Invoquer');
  assert.ok(invoke);assert.equal(invoke.disabled,false);invoke.click();
  const select=find(host,e=>e.className==='sheet-fragment-target');
  const amount=find(host,e=>e.className==='sheet-fragment-quantity');
  const convert=find(host,e=>e.tagName==='button'&&e.textContent==='Convertir en XP');
  assert.ok(select);assert.ok(amount);assert.ok(convert);
  select.value='owned-gorice';amount.value='3';convert.click();
  assert.deepEqual(actions,[['summon','gorice'],['xp','gorice','owned-gorice',3]]);
  const count=find(host,e=>e.className==='sheet-item-progress');
  assert.match(count.textContent,/12 \/ 10/);
 }finally{globalThis.document=oldDocument;}
});
test('old saves without fragments do not show invented collectible actions',()=>{
 const s={...current(),rules:{...current().rules}};
 delete s.rules.fragmentRecruitment;
 const oldDocument=globalThis.document;
 globalThis.document={createElement:tag=>new FakeEl(tag)};
 try{
  const host=new FakeEl('div');
  renderAdventureSheetViewV1({host,snapshot:snapshot(s),tab:'inventory'});
  assert.equal(find(host,e=>e.tagName==='button'&&e.textContent==='Invoquer'),null);
 }finally{globalThis.document=oldDocument;}
});
test('real creator form and handler are wired without publishing or a second save',()=>{
 const html=source('assets/gensrpg/capture-v2/adventure.html');
 const app=source('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 for(const id of [
  'adventure-fragments-enabled','adventure-fragments-required',
  'adventure-fragments-summon-level','adventure-fragments-xp',
  'adventure-fragments-drop-chance','adventure-fragments-drop-min',
  'adventure-fragments-drop-max','adventure-fragments-storage-capacity',
  'adventure-fragments-duplicates'
 ])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(app,/performPlayingFragmentAction/);
 assert.match(app,/fragmentActionPending/);
 assert.match(app,/navigator\.locks/);
 assert.match(app,/readCombatHandoff/);
 assert.match(app,/store\.save\(receipt\.session\)/);
 assert.match(app,/play\.refreshParty\(receipt\.session\)/);
 assert.match(app,/publishedCapturePortraitUrlV1/);
 assert.ok(!app.includes('localStorage.setItem("fragment:"'));
});
