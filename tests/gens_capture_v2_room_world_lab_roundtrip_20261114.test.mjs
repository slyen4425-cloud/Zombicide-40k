import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument}
 from '../_site/vendor/exploration-lab/src/builder/world-builder-draft.js';
import {playWorldFingerprint}
 from '../_site/vendor/exploration-lab/src/play/exploration-play-session.js';
import {createExplorationWorldDocumentLibraryV1}
 from '../_site/vendor/exploration-lab/src/builder/exploration-world-document-library-v1.js';
import {importCaptureSharedWorldV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-world-transfer-v1.mjs';

const memoryStorage=()=>{
 const bytes=new Map();
 return {getItem:k=>bytes.has(k)?bytes.get(k):null,
  setItem:(k,v)=>bytes.set(k,String(v)),removeItem:k=>bytes.delete(k),
  key:i=>[...bytes.keys()][i]??null,get length(){return bytes.size;}};
};
test('real native Exploration serializer/validator and library round-trip a remote room WorldDocument unchanged',()=>{
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
 const result=importCaptureSharedWorldV1(args);
 assert.equal(result.worldId,hostWorld.id);
 assert.equal(playWorldFingerprint(library.load(hostWorld.id)),fp);
 assert.equal(importCaptureSharedWorldV1(args).alreadyAvailable,true,'idempotent read-only import');
});
