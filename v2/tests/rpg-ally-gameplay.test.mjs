import assert from 'node:assert/strict';
import { createAllyDefinition, createAllyRoster } from '../src/modes/rpg/ally-engine.js';
import { createAllyInteractionDefinition, validateAllyInteraction, availableDialogue, recruitAlly, summonAlly, dismissGameplayAlly } from '../src/modes/rpg/ally-gameplay.js';

const mercenary=createAllyDefinition({
  id:'rurik',name:'Rurik',kind:'mercenary',sourceKind:'custom',controlMode:'player',ownerRequired:false,
  statValues:{force:4},skillIds:['slash']
});
const summon=createAllyDefinition({
  id:'spirit-wolf',name:'Loup spectral',kind:'summon',sourceKind:'custom',controlMode:'player',ownerRequired:true,
  duration:{kind:'turns',value:3},statValues:{force:2},skillIds:['bite'],metadata:{ownerSelector:'hero'}
});
const escort=createAllyDefinition({id:'prisoner',name:'Prisonnier',kind:'escort',sourceKind:'custom',controlMode:'ai',canJoinCombat:false});

const definitions={
  allies:[mercenary,summon,escort],
  stats:[{id:'force',baseValue:0}],resources:[],skills:[{id:'slash',enabled:true},{id:'bite',enabled:true}],
  conditions:[{id:'renown-2'}],events:[{id:'merc-hired'},{id:'merc-refused'},{id:'wolf-summoned'},{id:'ally-dismissed'}],
  quests:[{id:'escort-prisoner'}],heroes:[],bestiary:[]
};

const mercInteraction=createAllyInteractionDefinition({
  id:'rurik-interaction',allyDefinitionId:'rurik',
  dialogue:[
    {id:'hello',text:'Besoin d\'une lame ?'},
    {id:'trusted',text:'Je te fais un prix.',conditionIds:['renown-2']}
  ],
  recruitment:{currencyId:'gold',cost:50,conditionIds:['renown-2'],successEventId:'merc-hired',failureEventId:'merc-refused'},
  dismissEventId:'ally-dismissed'
});
assert.equal(validateAllyInteraction(mercInteraction,definitions).valid,true);
assert.equal(availableDialogue(mercInteraction).length,1);
assert.equal(availableDialogue(mercInteraction,{conditionEvaluator:id=>id==='renown-2'}).length,2);

let roster=createAllyRoster();
let wallet={gold:40};
let hired=recruitAlly({interaction:mercInteraction,roster,wallet,definitions,roomId:'room-1',x:1,y:1,conditionEvaluator:()=>true});
assert.equal(hired.ok,false);
assert.equal(hired.reason,'not-enough-currency');
assert.equal(hired.eventId,'merc-refused');

wallet={gold:100};
hired=recruitAlly({interaction:mercInteraction,roster,wallet,definitions,roomId:'room-1',x:1,y:1,conditionEvaluator:()=>true});
assert.equal(hired.ok,true);
assert.equal(hired.wallet.gold,50);
assert.equal(hired.eventId,'merc-hired');
assert.equal(hired.runtime.kind,'mercenary');
roster=hired.roster;

const summonInteraction=createAllyInteractionDefinition({
  id:'wolf-call',allyDefinitionId:'spirit-wolf',
  summon:{sourceKind:'skill',sourceId:'summon-wolf',successEventId:'wolf-summoned'}
});
let called=summonAlly({interaction:summonInteraction,roster,definitions,ownerActorId:'aldren',roomId:'room-1',x:2,y:1,sourceKind:'item',sourceId:'summon-wolf'});
assert.equal(called.ok,false);
assert.equal(called.reason,'wrong-source-kind');
called=summonAlly({interaction:summonInteraction,roster,definitions,ownerActorId:'aldren',roomId:'room-1',x:2,y:1,sourceKind:'skill',sourceId:'summon-wolf'});
assert.equal(called.ok,true);
assert.equal(called.runtime.kind,'summon');
assert.equal(called.runtime.ownerActorId,'aldren');
assert.equal(called.runtime.remaining,3);
assert.equal(called.eventId,'wolf-summoned');
roster=called.roster;

const dismissed=dismissGameplayAlly({interaction:mercInteraction,roster,instanceId:hired.runtime.instanceId});
assert.equal(dismissed.ok,true);
assert.equal(dismissed.eventId,'ally-dismissed');
assert.equal(dismissed.roster.actors[hired.runtime.instanceId].dismissed,true);

const escortInteraction=createAllyInteractionDefinition({id:'prisoner-interaction',allyDefinitionId:'prisoner',escortQuestId:'escort-prisoner'});
assert.equal(validateAllyInteraction(escortInteraction,definitions).valid,true);

const broken=createAllyInteractionDefinition({id:'broken',allyDefinitionId:'missing',escortQuestId:'missing-quest'});
const checked=validateAllyInteraction(broken,definitions);
assert.equal(checked.valid,false);
assert.ok(checked.errors.some(x=>x.code==='missing-ally-definition'));
assert.ok(checked.errors.some(x=>x.code==='missing-quest'));

console.log('rpg ally gameplay ok');
