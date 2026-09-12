import assert from 'node:assert/strict';
import {createCaptureModeState,startCaptureBattle} from '../src/modes/capture/capture.js';
import {tickCaptureModeStatuses} from '../src/modes/capture/status-runtime.js';

const team=[{
  instanceId:'p1',
  speciesId:'capture_braiseau',
  currentHp:20,
  maxHp:20,
  statuses:[
    {id:'slow',name:'Slow',remainingDuration:2,duration:2,stacks:1,stackMode:'refresh',maxStacks:1,effects:[{type:'speed_modifier',value:-1}]},
    {id:'mark',name:'Mark',remainingDuration:1,duration:1,stacks:1,stackMode:'refresh',maxStacks:1,effects:[]},
  ],
}];
let state=createCaptureModeState({activeTeam:team,roster:[...team]});
state={...state,encounter:{type:'wild',speciesId:'capture_aquafin',status:'spotted'}};
const started=startCaptureBattle(state,{
  opponent:{
    instanceId:'w1',
    speciesId:'capture_aquafin',
    wild:true,
    currentHp:20,
    maxHp:20,
    statuses:[{id:'wet',name:'Wet',remainingDuration:3,duration:3,stacks:1,stackMode:'refresh',maxStacks:1,effects:[]}],
  },
});
assert.equal(started.ok,true);
state=started.state;

const first=tickCaptureModeStatuses(state,{amount:1});
assert.equal(first.ok,true);
assert.equal(first.battle.player.statuses.length,1);
assert.equal(first.battle.player.statuses[0].id,'slow');
assert.equal(first.battle.player.statuses[0].remainingDuration,1);
assert.equal(first.expired.player.length,1);
assert.equal(first.expired.player[0].id,'mark');
assert.equal(first.battle.opponent.statuses[0].remainingDuration,2);
assert.equal(first.state.activeTeam[0].statuses.length,1);
assert.equal(first.state.activeTeam[0].statuses[0].id,'slow');
assert.equal(first.state.roster[0].statuses[0].remainingDuration,1);
assert.equal(first.state.exploration.freeMovement,false);

const second=tickCaptureModeStatuses(first.state,{amount:1});
assert.equal(second.ok,true);
assert.equal(second.battle.player.statuses.length,0);
assert.equal(second.expired.player.length,1);
assert.equal(second.expired.player[0].id,'slow');
assert.equal(second.battle.opponent.statuses[0].remainingDuration,1);
assert.equal(second.state.activeTeam[0].statuses.length,0);
assert.equal(second.state.roster[0].statuses.length,0);

const noBattle=tickCaptureModeStatuses({...second.state,battle:null},{amount:1});
assert.equal(noBattle.ok,false);
assert.equal(noBattle.reason,'battle-missing');

console.log('capture-status-tick-global.test.mjs: ok');
