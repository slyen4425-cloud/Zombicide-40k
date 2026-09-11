import assert from 'node:assert/strict';
import { renderDungeonGameplayView } from '../src/modes/rpg/dungeon-gameplay-view.js';

const universe={
  quests:[],
  items:[],
};

const roomLayout={
  id:'camp-layout',roomId:'camp',interactions:[
    {id:'guide-npc',kind:'npc',name:'Guide du camp',enabled:true,data:{allyInteractionId:'guide-talk'}},
    {id:'hidden-npc',kind:'npc',name:'Masqué',enabled:false},
    {id:'lever',kind:'switch',name:'Levier',enabled:true},
  ],
};

const runtime={
  currentRoomId:'camp',
  rooms:{camp:{visits:1,entities:[]}},
  eventQueue:{pending:[]},
  eventOrchestrator:{
    active:{
      eventState:{
        status:'waiting-choice',
        waitingChoice:{
          actionId:'decision',
          choices:[
            {id:'help',label:'Aider le village',actions:[]},
            {id:'leave',label:'Partir',actions:[]},
          ],
        },
      },
    },
  },
  questRuntime:{states:{}},
};

const html=renderDungeonGameplayView(universe,runtime,{roomLayout,lootRecipients:[]});
assert.match(html,/Choix d’événement/);
assert.match(html,/Aider le village/);
assert.match(html,/Partir/);
assert.match(html,/Personnages/);
assert.match(html,/Guide du camp/);
assert.doesNotMatch(html,/Masqué/);
assert.doesNotMatch(html,/Levier/);
assert.match(html,/data-dungeon-event-choice="help"/);
assert.match(html,/data-dungeon-npc-body="guide-npc"/);

const quietRuntime=structuredClone(runtime);
quietRuntime.eventOrchestrator.active=null;
const quietHtml=renderDungeonGameplayView(universe,quietRuntime,{roomLayout,lootRecipients:[]});
assert.doesNotMatch(quietHtml,/Choix d’événement/);
assert.match(quietHtml,/Guide du camp/);

console.log('rpg-dungeon-interactions-view.test.mjs: OK');
