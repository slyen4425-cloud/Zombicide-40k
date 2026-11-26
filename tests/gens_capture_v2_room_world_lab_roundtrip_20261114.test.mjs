import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument}
 from '../_site/vendor/exploration-lab/src/builder/world-builder-draft.js';
import {playWorldFingerprint}
 from '../_site/vendor/exploration-lab/src/play/exploration-play-session.js';
import {createExplorationWorldDocumentLibraryV1}
 from '../_site/vendor/exploration-lab/src/builder/exploration-world-document-library-v1.js';
import {importCaptureSharedWorldV1,preserveCaptureGuestDraftV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-world-transfer-v1.mjs';

import {saveWorldAssemblerDraft,readWorldAssemblerDraft}
 from '../_site/vendor/exploration-lab/src/builder/world-assembler-handoff.js';

const memoryStorage=()=>{
 const bytes=new Map();
 return {getItem:k=>bytes.has(k)?bytes.get(k):null,
  setItem:(k,v)=>bytes.set(k,String(v)),removeItem:k=>bytes.delete(k),
  key:i=>[...bytes.keys()][i]??null,get length(){return bytes.size;}};
};
test('real native Exploration serializer/validator and library round-trip a remote room WorldDocument unchanged',async()=>{
 const hostWorld=createBlankWorldBuilderDraft({id:'monde-a-deux',width:640,height:480});
 const serialized=serializeWorldBuilderDraft(hostWorld);
 const imported=importWorldBuilderDocument(serialized);
 const fp=playWorldFingerprint(hostWorld);
 assert.equal(playWorldFingerprint(imported),fp,'official world fingerprint must survive transport');
 const room={open:true,worldId:hostWorld.id,worldFingerprint:fp,
  members:[{id:'host'},{id:'guest'}]};
 const packet={worldId:hostWorld.id,worldFingerprint:fp,serializedDocument:serialized};
 const library=createExplorationWorldDocumentLibraryV1({storage:memoryStorage()});
 const args={connection:{role:'guest',userId:'guest'},room,packet,library,
  importOfficial:importWorldBuilderDocument,fingerprintOfficial:playWorldFingerprint};
 const result=await importCaptureSharedWorldV1(args);
 assert.equal(result.worldId,hostWorld.id);
 assert.equal(playWorldFingerprint(library.load(hostWorld.id)),fp);
 assert.equal((await importCaptureSharedWorldV1(args)).alreadyAvailable,true,'idempotent read-only import');
});

test('real Exploration library preserves old guest author draft before activating host world',async()=>{
 const storage=memoryStorage();
 const oldWorld=createBlankWorldBuilderDraft({id:'mon-brouillon',width:720,height:480});
 saveWorldAssemblerDraft(storage,oldWorld);
 const library=createExplorationWorldDocumentLibraryV1({storage});
 const hostWorld=createBlankWorldBuilderDraft({id:'monde-hote',width:800,height:540});
 const fp=playWorldFingerprint(hostWorld);
 const room={open:true,worldId:hostWorld.id,worldFingerprint:fp,
  members:[{id:'h'},{id:'g'}]};
 const kept=await preserveCaptureGuestDraftV1({
  activeDraft:readWorldAssemblerDraft(storage),room,library,
  fingerprintOfficial:playWorldFingerprint
 });
 assert.equal(kept.archived,true);
 assert.equal(playWorldFingerprint(library.load('mon-brouillon')),
  playWorldFingerprint(oldWorld));
 const imported=await importCaptureSharedWorldV1({
  connection:{role:'guest',userId:'g'},room,library,
  packet:{worldId:hostWorld.id,worldFingerprint:fp,
   serializedDocument:serializeWorldBuilderDraft(hostWorld)},
  importOfficial:importWorldBuilderDocument,fingerprintOfficial:playWorldFingerprint
 });
 assert.equal(imported.worldId,hostWorld.id);
 assert.equal(library.list().length,2);
 assert.equal(library.activate(hostWorld.id).id,hostWorld.id,
  'native Exploration can now switch without erasing the previous draft');
 assert.equal(playWorldFingerprint(library.load('mon-brouillon')),
  playWorldFingerprint(oldWorld),'the original authored draft remains archived');
});
