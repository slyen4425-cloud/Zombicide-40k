import assert from 'node:assert/strict';
import {
  installDungeonCombatTargetUi,
  setCombatTargetUiContext,
  syncDungeonCombatTargetControls,
} from '../src/modes/rpg/combat-target-ui.js';

const universe={
  heroes:[{id:'lyra',name:'Lyra'},{id:'aldren',name:'Aldren'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
  skills:[
    {id:'shot',name:'Tir',target:'enemy'},
    {id:'heal',name:'Soin allié',target:'ally'},
    {id:'focus',name:'Concentration',target:'self'},
    {id:'wild',name:'Pouvoir libre',target:'any'},
  ],
};
const combat={
  phase:'turn',
  activeActorId:'lyra',
  actors:{
    lyra:{id:'lyra',side:'heroes',ko:false,metadata:{heroId:'lyra'}},
    aldren:{id:'aldren',side:'heroes',ko:false,metadata:{heroId:'aldren'}},
    skeleton:{id:'skeleton',side:'enemies',ko:false,metadata:{creatureId:'skeleton'}},
    fallen:{id:'fallen',side:'enemies',ko:true,metadata:{creatureId:'skeleton'}},
  },
};

const skillSelect={value:'shot',matches(selector){return selector==='[data-dungeon-combat-skill]';}};
const targetSelect={innerHTML:'',disabled:false};
let changeHandler=null;
const root={
  querySelector(selector){
    if(selector==='[data-dungeon-combat-skill]') return skillSelect;
    if(selector==='[data-dungeon-combat-target]') return targetSelect;
    return null;
  },
  addEventListener(type,handler){if(type==='change') changeHandler=handler;},
};

setCombatTargetUiContext({universe,combat});
assert.equal(installDungeonCombatTargetUi(root),true);
assert.equal(typeof changeHandler,'function');

let entries=syncDungeonCombatTargetControls(root);
assert.deepEqual(entries.map(entry=>entry.id),['skeleton']);
assert.match(targetSelect.innerHTML,/Squelette/);
assert.doesNotMatch(targetSelect.innerHTML,/Aldren/);
assert.equal(targetSelect.disabled,false);

skillSelect.value='heal';
changeHandler({target:skillSelect});
assert.match(targetSelect.innerHTML,/Aldren/);
assert.doesNotMatch(targetSelect.innerHTML,/Squelette/);
assert.doesNotMatch(targetSelect.innerHTML,/Lyra/);

skillSelect.value='focus';
changeHandler({target:skillSelect});
assert.match(targetSelect.innerHTML,/Lyra/);
assert.doesNotMatch(targetSelect.innerHTML,/Aldren/);
assert.doesNotMatch(targetSelect.innerHTML,/Squelette/);

skillSelect.value='wild';
changeHandler({target:skillSelect});
assert.match(targetSelect.innerHTML,/Lyra/);
assert.match(targetSelect.innerHTML,/Aldren/);
assert.match(targetSelect.innerHTML,/Squelette/);
assert.doesNotMatch(targetSelect.innerHTML,/fallen/);

combat.actors.aldren.ko=true;
skillSelect.value='heal';
entries=syncDungeonCombatTargetControls(root);
assert.deepEqual(entries,[]);
assert.equal(targetSelect.disabled,true,'target selector must disable when selected skill has no valid target');

console.log('rpg-dungeon-combat-target-live.test.mjs: OK');
