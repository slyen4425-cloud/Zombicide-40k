import assert from 'node:assert/strict';
import { buildQuestJournalEntries, renderQuestJournal, renderQuestJournalCard } from '../src/modes/rpg/quest-journal-ui.js';

const quests=[
  {id:'crypt',name:'Crypte ancienne',description:'Trouver la rune.',enabled:true,repeatable:false,objectives:[
    {id:'kill',label:'Éliminer les squelettes',required:3,optional:false},
    {id:'rune',label:'Trouver la rune',required:1,optional:false},
    {id:'cache',label:'Trouver la cache',required:1,optional:true},
  ]},
  {id:'done',name:'Vieille mission',enabled:true,objectives:[{id:'end',label:'Retourner au village',required:1}]},
  {id:'hidden',name:'Pas encore',enabled:true,objectives:[{id:'x',label:'Inactif',required:1}]},
  {id:'disabled',name:'Désactivée',enabled:false,objectives:[]},
];

const runtime={states:{
  crypt:{status:'active',progress:{kill:2,rune:1,cache:0},startedAt:'t0',rewardsClaimed:false},
  done:{status:'completed',progress:{end:1},completedAt:'t1',rewardsClaimed:true},
  hidden:{status:'inactive',progress:{x:0}},
}};

const entries=buildQuestJournalEntries(quests,runtime);
assert.equal(entries.length,2,'inactive and disabled quests should stay hidden by default');
assert.equal(entries[0].id,'crypt','active quests should be shown first');
assert.equal(entries[0].progress.completed,1);
assert.equal(entries[0].progress.total,2,'optional objectives must not count as mandatory progress');
assert.equal(entries[0].objectives.find(o=>o.id==='kill').value,2);
assert.equal(entries[0].objectives.find(o=>o.id==='rune').completed,true);
assert.equal(entries[0].objectives.find(o=>o.id==='cache').optional,true);
assert.equal(entries[1].status,'completed');
assert.equal(entries[1].rewardsClaimed,true);

const all=buildQuestJournalEntries(quests,runtime,{includeInactive:true});
assert.equal(all.some(entry=>entry.id==='hidden'),true);
assert.equal(all.some(entry=>entry.id==='disabled'),false);

const card=renderQuestJournalCard(entries[0]);
assert.match(card,/Crypte ancienne/);
assert.match(card,/Éliminer les squelettes/);
assert.match(card,/2\/3/);
assert.match(card,/optionnel/);
assert.doesNotMatch(card,/crypt</,'technical quest id must not be presented as visible text');

const html=renderQuestJournal(quests,runtime);
assert.match(html,/Journal de quêtes/);
assert.match(html,/En cours/);
assert.match(html,/Terminée/);
assert.match(html,/1\/2 objectif\(s\) obligatoire\(s\)/);
assert.doesNotMatch(html,/Pas encore/);

const empty=renderQuestJournal(quests,{states:{}});
assert.match(empty,/Aucune quête active/);

console.log('rpg-quest-journal-ui.test.mjs: OK');
