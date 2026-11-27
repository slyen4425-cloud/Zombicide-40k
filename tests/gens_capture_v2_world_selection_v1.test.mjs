import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {withSelectedAdventureWorldV1,resolveSelectedAdventureWorldV1,
 activateSelectedAdventureWorldV1}
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
test('selected world matches stored adventure identity and activates official Exploration library only',async()=>{
 const s=withSelectedAdventureWorldV1(session(),'neige-1'),lib=library();
 const actual=await resolveSelectedAdventureWorldV1({session:s,worldLibrary:lib,selectedWorldId:'neige-1'});
 assert.equal(actual.id,'neige-1');
 assert.deepEqual(lib.opened,[],'read-only world validation never changes editor storage');
 assert.equal((await activateSelectedAdventureWorldV1({worldLibrary:lib,selectedWorldId:'neige-1'})).id,'neige-1');
 assert.deepEqual(lib.opened,['neige-1']);
 await assert.rejects(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:lib,selectedWorldId:'foret-1'}),/monde|partie/i);
 assert.deepEqual(lib.opened,['neige-1'],'mismatched world cannot activate any document');
});
test('unregistered or unavailable official world never changes editor state or session save',async()=>{
 const s=withSelectedAdventureWorldV1(session(),'foret-1'),lib=library();
 await assert.rejects(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:lib,selectedWorldId:'unknown'}),/monde|introuvable/i);
 assert.deepEqual(lib.opened,[]);
 await assert.rejects(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:null,selectedWorldId:'foret-1'}),/Exploration|bibliothèque/i);
});
test('real Adventure uses official lazy library, never a GenSrpg world serializer',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 assert.match(app,/createExplorationWorldDocumentLibraryV1/);
 assert.match(app,/withSelectedAdventureWorldV1/);
 assert.match(app,/resolveSelectedAdventureWorldV1/);
 assert.match(html,/id="adventure-world-select"/);
 assert.match(html,/id="adventure-world-status"/);
 // World transfer now consumes Exploration's native serializer/importer only.
 // Keep the no-duplicate-owner guarantee, rather than forbidding official calls.
 assert.ok(app.includes("import {serializeWorldBuilderDraft,importWorldBuilderDocument}"));
 assert.ok(app.includes("from '../../../vendor/exploration-lab/src/builder/world-builder-draft.js'"));
 for(const symbol of ['serializeWorldBuilderDraft','importWorldBuilderDocument']){
  for(const definition of ['function ','const ','let ','class '])
   assert.equal(app.includes(definition+symbol),false,'Capture cannot redefine native Exploration world functions');
 }
});

test('Jouer displays absent local WorldDocument without creating a hidden fallback',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',
  import.meta.url),'utf8');
 const start=app.indexOf('function refreshWorldChoices(');
 const end=app.indexOf('async function installOfficialWorldLibrary(',start);
 assert.ok(start>=0&&end>start,'canonical world selector required');
 const code=app.slice(start,end);
 assert.match(code,/await readOfficialActiveWorld\(\)/);
 assert.match(app,/const readOfficialActiveWorld=async\(\)=>readWorldAssemblerDraft\(universeWorldStorage\)/);
 assert.match(code,/Aucun monde local disponible/);
 assert.match(code,/Aucun monde local jouable/);
 assert.match(code,/Monde local actuel \(compatibilité\)/);
 assert.doesNotMatch(code,/localStorage\.setItem|createBlankWorldBuilderDraft|createNewExplorationPlay|worldLibrary\.activate/);
});

test('async native archive selection and activation wait for durable acknowledgement',async()=>{
 const lib=library(),s=withSelectedAdventureWorldV1(session(),'foret-1');
 let release;
 const delayed=new Promise(resolve=>{release=resolve;});
 const owner={...lib,list:async()=>lib.list(),load:async id=>lib.load(id),
  activate:async id=>{await delayed;return lib.activate(id);}};
 assert.equal((await resolveSelectedAdventureWorldV1({session:s,worldLibrary:owner,selectedWorldId:'foret-1'})).id,'foret-1');
 assert.deepEqual(lib.opened,[]);
 let complete=false;
 const pending=activateSelectedAdventureWorldV1({worldLibrary:owner,selectedWorldId:'foret-1'}).then(result=>{complete=true;return result;});
 await Promise.resolve();assert.equal(complete,false);assert.deepEqual(lib.opened,[]);
 release();assert.equal((await pending).id,'foret-1');assert.deepEqual(lib.opened,['foret-1']);
 await assert.rejects(()=>resolveSelectedAdventureWorldV1({session:s,worldLibrary:{...owner,load:async()=>{throw Error('IndexedDB failed');}},selectedWorldId:'foret-1'}),/IndexedDB failed/);
});

test('all Adventure author draft consumers await the same native reader with no raw storage bypass',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.equal([...app.matchAll(/readWorldAssemblerDraft\(universeWorldStorage\)/g)].length,1);
 assert.equal([...app.matchAll(/await readOfficialActiveWorld\(\)/g)].length,4);
 assert.match(app,/let world=await readOfficialActiveWorld\(\);\s*if\(launchEpoch!==journeyLaunchEpoch\)return/);
 assert.match(app,/const draft=await readOfficialActiveWorld\(\);\s*if\(launchEpoch!==journeyLaunchEpoch\)return/);
 assert.match(app,/const activeDraft=await readOfficialActiveWorld\(\);\s*if\(activeCaptureRoom!==connection\)throw/);
});
