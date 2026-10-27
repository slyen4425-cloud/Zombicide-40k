import {loadCombatLabEngineV1} from '../combat-lab-engine-loader-v1.mjs';
import {createCombatLabProviderV1} from '../combat-lab-provider-v1.mjs';

const notice=document.getElementById('notice');
const zoneHost=document.getElementById('zone-host');
const battleHost=document.getElementById('battle-host');
let play=null;

try {
  const [engine,response]=await Promise.all([
    loadCombatLabEngineV1(new URL('./vendor/combat-lab/',document.baseURI)),
    fetch(new URL('./tests/fixtures/capture-lab-1v1-export-v1.json',document.baseURI))
  ]);
  if(!response.ok)throw new Error('Les données de la clairière sont indisponibles.');
  const exported=await response.json();
  const source=engine.adaptCaptureCombatExportStackV1(exported);
  let companionHp=source.fighters[0].initialHp, encounterNumber=0;
  const provider=createCombatLabProviderV1({engine,
    resolveBattle:()=>({nativeCombatSource:source,actorIds:['player','opponent']}),
    mountBattle(battle,context){
      zoneHost.hidden=true;battleHost.hidden=false;
      notice.textContent='Une créature sauvage apparaît !';
      const arena=document.createElement('div');arena.className='arena';
      const cards=source.battleFormat.actors.map(actor=>{
        const card=document.createElement('article');card.className='fighter';
        const name=document.createElement('h2');name.textContent=actor.displayName;
        const hp=document.createElement('p'),bar=document.createElement('progress'),energy=document.createElement('p');
        bar.setAttribute('aria-label','PV de '+actor.displayName);
        card.append(name,hp,bar,energy);arena.append(card);
        return {id:actor.actorId,hp,bar,energy};
      });
      const message=document.createElement('p');message.className='combat-message';message.setAttribute('aria-live','polite');
      const actions=document.createElement('div');actions.className='actions';
      for(const skill of battle.skills()){
        const button=document.createElement('button');button.type='button';button.textContent=skill.name;
        button.addEventListener('click',()=>{
          try{const result=battle.useSkill(skill.id);message.textContent=result.ok?'Action en préparation…':'Cette action n’est pas disponible pour le moment.';}
          catch{message.textContent='Le combat a été interrompu.';}
        });actions.append(button);
      }
      const flee=document.createElement('button');flee.type='button';flee.textContent='Fuir';
      flee.addEventListener('click',()=>battle.flee());actions.append(flee);
      battleHost.replaceChildren(arena,message,actions);
      return {
        render(state){
          for(const card of cards){const fighter=state.fighters[card.id];
            card.hp.textContent=fighter.hp+' / '+fighter.maxHp+' PV';card.bar.max=fighter.maxHp;card.bar.value=fighter.hp;
            card.energy.textContent='Énergie '+fighter.energy+' / '+fighter.maxEnergy;
          }
        },
        dispose(){battleHost.replaceChildren();battleHost.hidden=true;zoneHost.hidden=false;}
      };
    }
  });
  play=globalThis.GensCaptureTemporaryZonePlayV1.mount({host:zoneHost,provider,width:5,height:3,
    encounterAt:(x,y)=>(x===1&&y===0)||(x===3&&y===2)?'clairiere':null,
    resolveEncounter(){
      if(companionHp<=0)throw new Error('Ton compagnon est KO. Recharge cette partie d’essai pour recommencer.');
      const encounterId='clairiere-'+(++encounterNumber);
      return {encounterId,snapshot:{sides:exported.actors.map((actor,i)=>{
        const creature=exported.creatures.find(c=>c.id===actor.creatureId);
        const instanceId=i===0?'companion-instance':encounterId+'-wild';
        return {name:actor.displayName,active:[instanceId],creatures:[{instanceId,creatureId:creature.id,
          hp:i===0?companionHp:creature.combat.initialHp,maxHp:creature.combat.maxHp,abilityIds:creature.skillIds}]};
      })}};
    },
    onBattleReturn(event){
      if(event.result)companionHp=event.result.creatures.find(c=>c.instanceId==='companion-instance').hp;
      notice.textContent=event.error?'Combat interrompu. Tu peux reprendre tes déplacements.':
        event.cancelled?'Rencontre interrompue.':
        ({victory:'Victoire ! La clairière est de nouveau accessible.',defeat:'Ton compagnon est KO. Recharge la partie d’essai pour recommencer.',flee:'Tu as fui. Tu peux reprendre tes déplacements.'}[event.result.outcome]);
      zoneHost.dataset.lastOutcome=event.result?.outcome??'cancelled';
    }
  });
  notice.textContent='Rejoins les hautes herbes pour rencontrer une créature sauvage.';
  // Page-local lifecycle; it owns no persistent game data or global handler.
  addEventListener('pagehide',()=>play?.dispose(),{once:true});
}catch(error){
  play?.dispose();notice.textContent='La clairière ne peut pas démarrer : '+error.message;
  notice.dataset.error='true';
}
