import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adventureOwnedCollectionV1} from '../assets/gensrpg/capture-v2/adventure-collection-v1.mjs';

const cards=[
 {id:'r',name:'Planta',portrait:{assetId:'official:planta'},rarity:'rare',
  skills:[{name:'Ronce',state:'ready'}]},
 {id:'m',name:'Esprit',rarity:'mythic',skills:[]},
 {id:'l',name:'Oiseau',rarity:'legendary',skills:[]}
];
const session={status:'playing',party:{
 active:{speciesId:'r',instanceId:'one',level:8},
 reserve:[{speciesId:'r',instanceId:'two',level:3}]
},storedCreatures:[{speciesId:'l',instanceId:'three',level:14}]};
test('Collection uses team and storage without another species ownership authority',()=>{
 const result=adventureOwnedCollectionV1({session,bestiaryCards:cards});
 assert.equal(result.totalCount,3);
 assert.equal(result.ownedCount,2);
 assert.equal(result.entries[0].owned,true);
 assert.deepEqual(result.entries[0].members.map(x=>x.level),[8,3]);
 assert.equal(result.entries[1].owned,false);
 assert.equal(result.entries[1].members.length,0);
 assert.equal(result.entries[2].members[0].place,'stockage');
 assert.equal(result.entries[2].members[0].level,14);
 assert.equal(result.entries[2].card,cards[2],'published Bestiary card is not duplicated');
 assert.equal(Object.isFrozen(result),true);
 assert.equal(Object.hasOwn(session,'collection'),false);
});
test('newly acquired species appears after the canonical party changes',()=>{
 const later={...session,party:{...session.party,reserve:[...session.party.reserve,
  {speciesId:'m',instanceId:'new',level:1}]}};
 assert.equal(adventureOwnedCollectionV1({session:later,bestiaryCards:cards}).ownedCount,3);
 assert.equal(adventureOwnedCollectionV1({session,bestiaryCards:cards}).ownedCount,2);
});
test('unowned cards stay disabled and only owned cards can show their fiche',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 assert.match(html,/data-adventure-sheet-tab="collection"/);
 assert.match(view,/tile\.disabled=!entry\.owned/);
 assert.match(view,/if\(!entry\.owned\)return/);
 assert.match(view,/onOpenOwnedCreature\(member\.instanceId\)/);
});

test('rarity border and label project the one published Combat card for owned and locked creatures',()=>{
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',import.meta.url),'utf8');
 const result=adventureOwnedCollectionV1({session,bestiaryCards:cards});
 assert.deepEqual(result.entries.map(x=>x.rarity),['rare','mythic','legendary']);
 assert.match(view,/tile\.dataset\.rarity=entry\.rarity\?\?'rare'/);
 assert.match(view,/sheet-rarity-label/);
 for(const rank of ['rare','mythic','legendary'])
  assert.ok(css.includes('.sheet-collection-card[data-rarity="'+rank+'"]'));
 assert.match(view,/tile\.disabled=!entry\.owned/);
});
test('performance probes are opt-in and retain five source-consistent JSON transfers',()=>{
 const code=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(code,/has\('gensPerf'\)/);
 assert.match(code,/Promise\.all\(\[\s*fetchJson\(/);
 assert.match(code,/adventurePerf\('play iframe ready after launch'/);
});

test('owned Collection opens full official Bestiary page with skills, explanations and return, without exposing unowned',()=>{
 const previousDocument=globalThis.document;
 const create=tag=>({
  tag,children:[],dataset:{},events:{},attrs:{},style:{},hidden:false,
  textContent:'',className:'',
  append(...items){this.children.push(...items)},
  prepend(...items){this.children.unshift(...items)},
  replaceChildren(...items){this.children=items},
  setAttribute(name,value){this.attrs[name]=String(value)},
  addEventListener(name,callback){this.events[name]=callback}
 });
 const walk=(root,predicate)=>[...(predicate(root)?[root]:[]),
  ...(root.children??[]).flatMap(child=>walk(child,predicate))];
 const textContent=root=>[String(root.textContent??''),...(root.children??[]).map(textContent)].join(' ');
 const official={...cards[0],
  description:'Gardienne des vallées moussues.',
  elements:['nature'],measures:[{key:'nature',label:'Nature',value:25,
   effectSummary:'1 point = +1 % dégâts Nature'}],
  resistances:[{element:'fire',amount:-25}],
  skills:[
   {state:'ready',name:'Ronce',requiredLevel:5,element:'nature',cooldownMs:12000,
    explanation:{sentences:['Inflige 12 dégâts de Nature.',
     'Immobilise la cible pendant 2 secondes.']}},
   {state:'unpublished',name:'Compétence secrète'}
  ]};
 try{
  globalThis.document={createElement:create};
  const host=create('div');
  const chosen=adventureOwnedCollectionV1({session,bestiaryCards:[official,...cards.slice(1)]});
  renderAdventureSheetViewV1({host,snapshot:{},tab:'collection',collection:chosen,
   resolveSpeciesPortrait:()=>null,
   onOpenOwnedCreature:()=>{}});
  const tiles=walk(host,e=>e.tag==='button'&&e.dataset.collectionOwned);
  const locked=tiles.find(e=>e.dataset.collectionOwned==='false');
  const owned=tiles.find(e=>e.dataset.collectionOwned==='true');
  const grid=walk(host,e=>e.className==='sheet-collection-grid')[0];
  const page=walk(host,e=>e.className==='sheet-collection-detail')[0];
  assert.equal(locked.disabled,true);
  locked.events.click();
  assert.equal(page.hidden,true,'locked creature cannot reveal anything');
  owned.events.click();
  assert.equal(grid.hidden,true,'gallery gives way to the Bestiary page');
  assert.equal(page.hidden,false);
  const detail=walk(page,e=>e.dataset.collectionBestiarySpecies==='r')[0];
  assert.ok(detail);
  const written=textContent(detail);
  assert.match(written,/FICHE DU BESTIAIRE OFFICIEL/);
  assert.match(written,/Gardienne des vallées moussues/);
  assert.match(written,/Ronce/);
  assert.match(written,/Inflige 12 dégâts de Nature/);
  assert.match(written,/Immobilise la cible pendant 2 secondes/);
  assert.match(written,/1 point = \+1 % dégâts Nature/);
  assert.match(written,/Feu : -25 %/);
  assert.doesNotMatch(written,/Compétence secrète/,'unpublished skills stay hidden');
  const back=walk(page,e=>e.className==='sheet-collection-back')[0];
  back.events.click();
  assert.equal(grid.hidden,false);
  assert.equal(page.hidden,true);
 }finally{
  if(previousDocument===undefined)delete globalThis.document;
  else globalThis.document=previousDocument;
 }
});

test('Collection gallery/page hidden state remains hidden despite authored display:grid CSS',()=>{
 const css=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',import.meta.url),'utf8');
 assert.match(css,/\.sheet-collection-grid\[hidden\],\.sheet-collection-detail\[hidden\]\{display:none!important\}/);
});
