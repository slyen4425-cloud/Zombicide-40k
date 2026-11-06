import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {withSelectedAdventureWorldV1,resolveSelectedAdventureWorldV1}
 from '../assets/gensrpg/capture-v2/adventure-world-choice-v1.mjs';

const cards=[{id:'monster-a',name:'Creature',level:1,
 skills:[{slot:'s1',state:'ready',name:'Normal'}]}];
const session=()=>createAdventureSessionV1({
 bestiaryCards:cards,starterId:'monster-a',rules:DEFAULT_ADVENTURE_RULES_V1,
 ids:{sessionId:'sample-one',instanceId:'instance-one',creatorId:'creator-one'},
 now:'2026-11-06T21:00:00Z'
});
const documents=[{id:'foret-1',areas:[{id:'area1'}]},
 {id:'neige-1',areas:[{id:'snow'}]}];
function library(){
 const opened=[];
 return {
  opened,
  list:()=>documents.map(world=>({id:world.id,areaCount:1})),
  load:id=>documents.find(world=>world.id===id)??null,
  activate:id=>{
   opened.push(id);
   return documents.find(world=>world.id===id)??null;
  }
 };
}
test('new AdventureSave stores only the official WorldDocument identity, not map data',()=>{
 const original=session(),selected=withSelectedAdventureWorldV1(original,'foret-1');
 assert.equal(original.world.mapRef,null);
 assert.equal(selected.world.mapRef,'foret-1');
 assert.equal(selected.world.position,null);
 assert.equal('areas' in selected.world,false);
 assert.deepEqual(original.inventory,selected.inventory);
});
test('selected world matches stored adventure identity and activates official Exploration library only',()=>{
 const s=withSelectedAdventureWorldV1(session(),'neige-1'),lib=library();
 const actual=resolveSelectedAdventureWorldV1({session:s,worldLibrary:lib,selectedWorldId:'neige-1'});
 assert.equal(actual.id,'neige-1');
 assert.deepEqual(lib.opened,['neige-1']);
 assert.throws(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:lib,selectedWorldId:'foret-1'}),/monde|partie/i);
 assert.deepEqual(lib.opened,['neige-1'],'mismatched world cannot activate any document');
});
test('unregistered or unavailable official world never changes editor state or session save',()=>{
 const s=withSelectedAdventureWorldV1(session(),'foret-1'),lib=library();
 assert.throws(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:lib,selectedWorldId:'unknown'}),/monde|introuvable/i);
 assert.deepEqual(lib.opened,[]);
 assert.throws(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:null,selectedWorldId:'foret-1'}),/Exploration|bibliothèque/i);
});
test('real Adventure uses official lazy library, never a GenSrpg world serializer',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(app,/createExplorationWorldDocumentLibraryV1/);
 assert.match(app,/withSelectedAdventureWorldV1/);
 assert.match(app,/resolveSelectedAdventureWorldV1/);
 assert.match(html,/id="adventure-world-select"/);
 assert.match(html,/id="adventure-world-status"/);
 assert.doesNotMatch(app,/serializeWorldBuilderDraft|importWorldBuilderDocument/);
});
