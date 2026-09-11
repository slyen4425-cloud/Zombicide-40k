import { createCombatState } from './combat-engine.js';
import { prepareSkillAction, resolveAndAdvance } from './turn-runtime.js';

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clone(v){return structuredClone(v);}

function defaultActorState(universe){
  const stats=Object.fromEntries((universe.stats||[]).map(s=>[s.id,Number(s.baseValue)||0]));
  const resources={};
  for(const r of universe.resources||[]){
    const max=r.maxFormula?.kind==='fixed'?Number(r.maxFormula?.value)||0:10;
    resources[r.id]={current:max,max};
  }
  return {stats,resources,level:1,xp:0,skillRuntime:{},statuses:[]};
}

export function createDemoCombat(universe){
  const base=defaultActorState(universe);
  const statId=universe.stats?.[0]?.id;
  const initA=Number(statId?base.stats[statId]:10)||10;
  const initB=Math.max(0,initA-2);
  return createCombatState({combatants:[
    {id:'demo-hero',side:'heroes',initiative:initA,state:clone(base)},
    {id:'demo-enemy',side:'enemies',initiative:initB,state:clone(base)},
  ]});
}

function actorName(id){return id==='demo-hero'?'Héros test':id==='demo-enemy'?'Ennemi test':id;}
function renderResources(actor,universe){
  return (universe.resources||[]).map(r=>{
    const value=actor?.state?.resources?.[r.id];
    const current=Number(value?.current??value??0);
    const max=Number(value?.max??0);
    return `<span class="combat-chip">${esc(r.icon||'◆')} ${esc(r.name)} <strong>${current}${max?` / ${max}`:''}</strong></span>`;
  }).join('');
}

export function mountCombatLab(host,universe){
  let combat=createDemoCombat(universe);
  let lastMessage='Combat de test prêt.';

  function render(){
    const active=combat.actors?.[combat.activeActorId];
    const targetId=combat.activeActorId==='demo-hero'?'demo-enemy':'demo-hero';
    const target=combat.actors?.[targetId];
    const skills=universe.skills||[];
    host.innerHTML=`
      <section class="editor-section combat-lab">
        <div class="section-title-row"><div><h3>🧪 Laboratoire de combat</h3><p class="muted">Interface volontairement simple pour tester le moteur sans dépendre des animations finales.</p></div><button class="help-button tiny" type="button" data-help="rpg-combat-lab">?</button></div>
        <div class="combat-timeline">${combat.order.map(id=>`<span class="combat-turn ${id===combat.activeActorId?'active':''}">${esc(actorName(id))}</span>`).join('')}</div>
        <div class="combat-grid">
          <article class="combatant-card"><h4>${esc(actorName(combat.activeActorId))}</h4><p class="muted">Acteur courant · tour ${combat.round}</p><div class="combat-chips">${renderResources(active,universe)}</div></article>
          <article class="combatant-card"><h4>${esc(actorName(targetId))}</h4><p class="muted">Cible de test</p><div class="combat-chips">${renderResources(target,universe)}</div></article>
        </div>
        <div class="combat-actions">
          <label>Compétence<select id="combatLabSkill"><option value="">— Choisir —</option>${skills.map(s=>`<option value="${esc(s.id)}">${esc(s.icon||'✨')} ${esc(s.name)}</option>`).join('')}</select></label>
          <button class="primary-button" id="combatLabUse" type="button" ${!skills.length?'disabled':''}>Lancer l'action</button>
          <button class="secondary-button" id="combatLabReset" type="button">Réinitialiser</button>
        </div>
        <div class="combat-result" aria-live="polite">${esc(lastMessage)}</div>
      </section>`;

    host.querySelector('#combatLabReset')?.addEventListener('click',()=>{combat=createDemoCombat(universe);lastMessage='Combat réinitialisé.';render();});
    host.querySelector('#combatLabUse')?.addEventListener('click',()=>{
      const skillId=host.querySelector('#combatLabSkill')?.value;
      const skill=skills.find(s=>String(s.id)===String(skillId));
      if(!skill){lastMessage='Choisis une compétence.';render();return;}
      const prepared=prepareSkillAction(combat,skill,targetId,universe,{actionId:`lab-${Date.now()}`});
      if(!prepared.ok){lastMessage=`Action refusée : ${prepared.reason}.`;render();return;}
      const resolved=resolveAndAdvance(prepared.combat,{definitions:universe,randomPercent:()=>0});
      combat=resolved.combat;
      const roll=resolved.check?.roll;
      const success=resolved.check?.success!==false;
      lastMessage=`${skill.name} : ${success?'réussite':'échec'}${roll!=null?` (jet ${roll})`:''}. Action résolue une seule fois.`;
      render();
    });
  }
  render();
}
