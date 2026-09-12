import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { dungeonGmActorEntries, dungeonGmResourceEntries, renderDungeonCombatGmControls } from '../src/modes/rpg/dungeon-combat-gm-ui.js';

const universe={
  heroes:[{id:'hero',name:'Lyra'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
  resources:[{id:'hp',name:'PV',icon:'❤️'},{id:'mana',name:'Mana',icon:'🔷'}],
  stats:[{id:'force',name:'Force',icon:'💪'}],
  combat:{
    initiative:{mode:'fixed'},
    defeatRule:{enabled:true,kind:'resource',sourceId:'hp',operator:'lte',threshold:0},
    checkDefaults:{die:100,mode:'roll-under'},
    interaction:{directCombat:false,gmFullControl:true},
  },
};
let combat=createCombatState({combatants:[
  {id:'hero',side:'heroes',initiative:10,state:{resources:{hp:{current:7,max:10},mana:{current:3,max:5}},stats:{force:20}},metadata:{heroId:'hero'}},
  {id:'enemy',side:'enemies',initiative:5,state:{resources:{hp:{current:4,max:9}},stats:{}},metadata:{creatureId:'skeleton'}},
]});
combat.metadata={kind:'dungeon-room-combat',roomId:'room-1'};

assert.deepEqual(dungeonGmActorEntries(universe,combat).map(entry=>entry.name),['Lyra','Squelette']);
assert.deepEqual(dungeonGmResourceEntries(universe,combat,'hero').map(entry=>[entry.id,entry.current,entry.max]),[['hp',7,10],['mana',3,5]]);

const html=renderDungeonCombatGmControls({universe,combat});
assert.match(html,/MJ contrôle total/);
assert.match(html,/data-dungeon-gm-actor/);
assert.match(html,/Lyra/);
assert.match(html,/Squelette/);
assert.match(html,/PV/);
assert.match(html,/value="7"/);
assert.match(html,/Mettre KO/);
assert.match(html,/Réactiver/);
assert.match(html,/Lancer le jet/);
assert.match(html,/Passer le tour/);
assert.match(html,/Force/);

const disabled=structuredClone(universe);
disabled.combat.interaction.gmFullControl=false;
assert.equal(renderDungeonCombatGmControls({universe:disabled,combat}), '');

const pageSource=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
assert.match(pageSource,/mountDungeonCombatGmControls/);
assert.match(pageSource,/kind:'combat-gm'/);
assert.match(pageSource,/dungeonView\.setCombat\(currentDungeonCombat\)/);

console.log('rpg-dungeon-combat-gm-ui.test.mjs: OK');
