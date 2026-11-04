import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventureSessionV1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {createAdventurePublishedEncounterGrantV1} from '../assets/gensrpg/capture-v2/adventure-published-grant-v1.mjs';

const card=(id,ready=true)=>({id,name:id,level:1,
 skills:[{slot:'s1',state:ready?'ready':'draft'}]});
const cards=[card('starter'),card('wild-ready'),card('wild-unready',false)];
const catalogRecords=[
 {id:'starter',name:'Starter',elements:['fire'],spawnChance:0},
 {id:'wild-ready',name:'Wild',elements:['water','ice'],spawnChance:12},
 {id:'wild-unready',name:'Unready',elements:['ice'],spawnChance:100},
 {id:'draft-unpublished',name:'Draft',elements:['fire'],spawnChance:100}
];
const provider={
 listCreatures:()=>catalogRecords,
 listElements:()=>[{id:'fire',label:'Feu'},{id:'water',label:'Eau'},{id:'ice',label:'Glace'}],
 resolveCreature:id=>catalogRecords.find(c=>c.id===id)??null,
 findByElement:id=>catalogRecords.filter(c=>c.elements.includes(id))
};
const configured=createAdventureSessionV1({
 bestiaryCards:cards,starterId:'starter',
 ids:{sessionId:'game-v1-01',instanceId:'actor-v1-01'},
 now:'2026-11-04T01:00:00.000Z'
});
const playing={...configured,status:'playing',
 world:{mapRef:'world-real-01',position:null}};
const sha='a'.repeat(40);
const create=(extras={})=>createAdventurePublishedEncounterGrantV1({
 session:playing,worldId:'world-real-01',combatSha:sha,
 bestiaryCards:cards,captureCatalog:provider,...extras
});

test('Aventure issues only official Combat-published ready species IDs, with no gameplay copies',()=>{
 const g=create();
 assert.deepEqual(g,{
  schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
  sessionId:'game-v1-01',worldId:'world-real-01',combatSha:sha,
  allowedCreatureIds:['starter','wild-ready']
 });
 assert.equal(Object.isFrozen(g),true);
 assert.equal(Object.isFrozen(g.allowedCreatureIds),true);
 assert.equal('creatures' in g,false);
 assert.equal('skills' in g,false);
 assert.equal('spawnChance' in g,false);
 assert.equal(configured.status,'configured','issuer never mutates Core Adventure save');
 assert.equal(playing.world.position,null,'issuer never writes Exploration coordinates');
});

test('only the saved, active AdventureSession may mint a grant for exactly its world and official Combat SHA',()=>{
 assert.throws(()=>create({session:configured}),/playing|partie|active/i);
 assert.throws(()=>create({worldId:'different-world'}),/world|monde/i);
 assert.throws(()=>create({combatSha:'main'}),/Combat|SHA|source/i);
 assert.throws(()=>create({session:{...playing,sessionId:'bad/session'}}),/session|identif/i);
 assert.throws(()=>create({session:{...playing,party:{active:{...playing.party.active,speciesId:'draft-unpublished'}}}}),
  /Bestiaire|published|publi/i);
});

test('missing official publication source fails closed, no demo species or fabricated rarity',()=>{
 assert.throws(()=>create({bestiaryCards:null}),/Bestiaire|Bestiary|official/i);
 assert.throws(()=>create({captureCatalog:null}),/Exploration|catalog|provider/i);
 assert.throws(()=>create({bestiaryCards:[card('wild-ready')]}),/Bestiaire|published|publi/i);
});
