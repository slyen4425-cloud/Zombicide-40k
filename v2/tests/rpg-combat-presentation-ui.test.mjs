import assert from 'node:assert/strict';
import { combatActorAssetUrl, combatResourceEntries, combatTimelineEntries, combatJournalEntries, renderCombatPresentation } from '../src/modes/rpg/combat-presentation-ui.js';

const universe={
  heroes:[{id:'lyra',name:'Lyra'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
  resources:[{id:'hp',name:'PV',icon:'❤️'},{id:'mana',name:'Mana',icon:'🔷'}],
  effects:[{id:'hit',name:'Dégâts'}],
};
const combat={
  phase:'turn',round:2,activeActorId:'lyra',order:['skeleton-1','lyra'],
  actors:{
    'skeleton-1':{id:'skeleton-1',side:'enemies',ko:true,metadata:{creatureId:'skeleton'},state:{resources:{hp:{current:0,max:5}}}},
    lyra:{id:'lyra',side:'heroes',ko:false,metadata:{heroId:'lyra'},state:{resources:{hp:{current:6,max:8},mana:{current:3,max:5}}}},
  },
  log:[
    {seq:1,type:'turn-begin',actorId:'lyra'},
    {seq:2,type:'action-resolved',actorId:'lyra',targetId:'skeleton-1',check:{success:true,roll:42},effects:[{effectId:'hit',applied:true}]},
    {seq:3,type:'combatant-ko',actorId:'skeleton-1'},
  ],
};

assert.deepEqual(combatResourceEntries(universe,combat.actors.lyra),[
  {id:'hp',name:'PV',icon:'❤️',current:6,max:8},
  {id:'mana',name:'Mana',icon:'🔷',current:3,max:5},
]);
assert.equal(combatActorAssetUrl(universe,combat.actors.lyra,'lyra'),'../assets/dungeon/creatures/dng_lyra.png');
assert.equal(combatActorAssetUrl(universe,combat.actors['skeleton-1'],'skeleton-1'),'../assets/dungeon/creatures/dng_skeleton.png');
assert.equal(combatActorAssetUrl(universe,{side:'enemies',metadata:{creatureId:'unknown'}},'unknown-1'),null);
const timeline=combatTimelineEntries(universe,combat);
assert.equal(timeline[0].name,'Squelette');
assert.equal(timeline[0].ko,true);
assert.equal(timeline[0].assetUrl,'../assets/dungeon/creatures/dng_skeleton.png');
assert.equal(timeline[1].name,'Lyra');
assert.equal(timeline[1].active,true);
assert.equal(timeline[1].assetUrl,'../assets/dungeon/creatures/dng_lyra.png');
const journal=combatJournalEntries(universe,combat);
assert.match(journal.find(row=>row.kind==='action').text,/Lyra → Squelette : réussite \(jet 42\) · Dégâts/);
assert.match(journal.find(row=>row.kind==='ko').text,/Squelette est KO/);
const html=renderCombatPresentation(universe,combat);
assert.match(html,/Ordre des tours/);
assert.match(html,/Lyra/);
assert.match(html,/Squelette · KO/);
assert.match(html,/combat-turn-portrait has-art/);
assert.match(html,/combatant-portrait has-art/);
assert.match(html,/dng_lyra\.png/);
assert.match(html,/dng_skeleton\.png/);
assert.match(html,/❤️ PV <strong>6 \/ 8<\/strong>/);
assert.match(html,/🔷 Mana <strong>3 \/ 5<\/strong>/);
assert.match(html,/Journal moteur/);
assert.match(html,/jet 42/);
assert.match(html,/Dégâts/);

const fallbackUniverse={...universe,bestiary:[...universe.bestiary,{id:'unknown',name:'Créature inconnue',icon:'❔'}]};
const fallbackCombat={...combat,order:['unknown-1'],activeActorId:'unknown-1',actors:{'unknown-1':{id:'unknown-1',side:'enemies',ko:false,metadata:{creatureId:'unknown'},state:{resources:{}}}}};
const fallbackHtml=renderCombatPresentation(fallbackUniverse,fallbackCombat);
assert.match(fallbackHtml,/combat-turn-portrait fallback/);
assert.match(fallbackHtml,/combatant-portrait fallback/);
assert.match(fallbackHtml,/Créature inconnue/);
assert.doesNotMatch(fallbackHtml,/<img[^>]+src="null"/);
console.log('rpg-combat-presentation-ui.test.mjs: OK');
