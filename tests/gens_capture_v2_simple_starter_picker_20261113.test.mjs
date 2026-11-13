import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAdventureStarterPickerV1} from '../assets/gensrpg/capture-v2/adventure-starter-picker-v1.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
class FakeNode {
 constructor(tag='div'){
  this.tag=tag;this.children=[];this.listeners=new Map();this.dataset={};
  this.textContent='';this.disabled=false;this.value='';this.hidden=false;
 }
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 addEventListener(type,callback){
  const handlers=this.listeners.get(type)||[];
  this.listeners.set(type,[...handlers,callback]);
 }
 dispatchEvent(event){
  for(const handler of this.listeners.get(event.type)||[])handler(event);
  return true;
 }
 click(){this.dispatchEvent({type:'click'});}
 setAttribute(name,value){this[name]=value;}
 querySelectorAll(selector){
  assert.equal(selector,'[data-starter-slot]');
  return this.children;
 }
 showModal(){this.open=true;}
 close(){this.open=false;}
 focus(){this.focused=true;}
}
test('Capture V2 keeps simple play visible, advanced options collapsed and original session inputs',async()=>{
 const html=await read('assets/gensrpg/capture-v2/adventure.html');
 assert.match(html,/<details id="adventure-advanced-panel"/);
 assert.match(html,/<summary>⚙️ Réglages avancés de l'aventure<\/summary>/);
 assert.match(html,/<div class="adventure-starter-native" hidden>/);
 assert.match(html,/<dialog id="adventure-starter-picker"/);
 for(const id of ['adventure-starter','adventure-starter-count','adventure-starter-reserve',
  'adventure-rules-panel','adventure-loot-panel','adventure-creator-panel',
  'adventure-create','adventure-starter-gallery'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' stays unique');
 const start=html.indexOf('id="adventure-advanced-panel"');
 const rules=html.indexOf('id="adventure-rules-panel"');
 const multiplayer=html.indexOf('id="adventure-multiplayer-panel"');
 const creator=html.indexOf('id="adventure-creator-panel"');
 const gallery=html.indexOf('id="adventure-starter-gallery"');
 assert.ok(start>0&&start<rules&&rules<multiplayer&&multiplayer<creator&&creator<gallery);
 const app=await read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 assert.match(app,/starterPicker\.renderSlots\(\)/);
 assert.match(app,/starterPicker\.install\(\)/);
 assert.match(app,/createAdventureSessionV1\(\{[\s\S]*?starterIds:getStarterSpeciesIds/);
});

test('Bestiary gallery changes canonical starter selectors without a second saved roster',()=>{
 const ids=['adventure-starter','adventure-starter-reserve','adventure-starter-cards',
  'adventure-starter-picker','adventure-starter-gallery','adventure-starter-search',
  'adventure-starter-picker-title','adventure-starter-picker-close'];
 const nodes=Object.fromEntries(ids.map(id=>[id,new FakeNode()]));
 const first=nodes['adventure-starter'];
 first.value='rain';
 const second=new FakeNode('select');second.value='rain';
 second.dataset.starterSlot='1';
 nodes['adventure-starter-reserve'].children=[second];
 const cards=[{id:'rain',name:'Pluie',skills:[{state:'ready'}]},
  {id:'light',name:'Lumière',skills:[{state:'ready'}]},
  {id:'notready',name:'Créature indisponible',skills:[]}];
 let changes=0;
 const picker=createAdventureStarterPickerV1({
  document:{getElementById:id=>nodes[id],createElement:tag=>new FakeNode(tag)},
  cards:()=>cards,playable:card=>card.skills.some(x=>x.state==='ready'),
  portraitUrl:()=>null,onSelection:()=>changes++
 });
 picker.install();picker.renderSlots();
 assert.equal(nodes['adventure-starter-cards'].children.length,2);
 nodes['adventure-starter-cards'].children[1].click();
 assert.equal(nodes['adventure-starter-picker'].open,true);
 const gallery=nodes['adventure-starter-gallery'].children;
 assert.equal(gallery.length,3);
 assert.equal(gallery[2].disabled,true,'non playable creatures remain visible but unavailable');
 gallery[1].click();
 assert.equal(second.value,'light','reserve selector is the single source of truth');
 assert.equal(first.value,'rain','active creature is untouched');
 assert.equal(changes,1);
 assert.equal(nodes['adventure-starter-picker'].open,false);
 assert.equal(nodes['adventure-starter-cards'].children.length,2);
});
