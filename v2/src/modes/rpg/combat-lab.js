import { createCombatState } from './combat-engine.js';
import { prepareSkillAction, resolveAndAdvance } from './turn-runtime.js';
import { beginActiveTurn, reconcileCombatState } from './combat-session.js';
import { createPresentationState, syncPresentationFromCombat, drainPresentation } from './combat-presentation.js';
import { resolveResourceMax } from '../../core/formulas.js';

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clone(v){return structuredClone(v);}

function defaultActorState(universe){
  const stats=Object.fromEntries((universe.stats||[]).map(s=>[s.id,Number(s.baseValue)||0]));
  const resources={};
  const partial={stats,resources};
  for(const r of universe.resources||[]){
    const max=resolveResourceMax(r,partial,universe);
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

function inferDefeatRule(universe){
  const resource=universe.resources?.[0];
  return resource ? {enabled:true,kind:'resource',sourceId:resource.id,operator:'lte',threshold:0} : {enabled:false,kind:'none'};
}

function engineEventsForDisplay(combat,presentation){
  const synced=syncPresentationFromCombat(presentation,combat);
  return drainPresentation(synced);
}

export function mountCombatLab(host,universe){
  let combat=createDemoCombat(universe);
  let presentation=createPresentationState();
  let journal=[];
  let lastMessage='Combat de test prêt.';
  const defeatRule=inferDefeatRule(universe);

  function syncJournal(){
    const out=engineEventsForDisplay(combat,presentation);
    presentation=out.presentation;
    journal.push(...out.items);
    if(journal.length>30) journal=journal.slice(-30);
  }

  function normalizeTurn(){
    combat=reconcileCombatState(combat,{defeatRule});
    if(combat.phase==='turn'&&combat.activeActorId){
      const begun=beginActiveTurn(combat,{definitions:universe,defeatRule});
      combat=begun.combat;
    }
    syncJournal();
  }

  function render(){
    const active=combat.actors?.[combat.activeActorId];
    const targetId=combat.activeActorId==='demo-hero'?'demo-enemy':'demo-hero';
    const target=combat.actors?.[targetId];
    const skills=universe.skills||[];
    host.innerHTML=`
      <section class="editor-section combat-lab">
        <div class="section-title-row"><div><h3>🧪 Laboratoire de combat</h3><p class="muted">Le moteur décide. L'interface affiche seulement le résultat et peut être animée sans bloquer l'état du combat.</p></div><button class="help-button tiny" type="button" data-help="rpg-combat-lab">?</button></div>
        <div class="combat-timeline">${combat.order.map(id=>{const a=combat.actors[id];return `<span class="combat-turn ${id===combat.activeActorId?'active':''} ${a?.ko?'ko':''}">${esc(actorName(id))}${a?.ko?' · KO':''}</span>`;}).join('')}</div>
        ${combat.phase==='ended'?`<div class="combat-result"><strong>Combat terminé.</strong> Vainqueur : ${esc(combat.winner||'aucun')}.</div>`:''}
        <div class="combat-grid">
          <article class="combatant-card"><h4>${esc(actorName(combat.activeActorId||'—'))}</h4><p class="muted">${combat.phase==='ended'?'Aucun acteur courant':`Acteur courant · tour ${combat.round}`}</p><div class="combat-chips">${renderResources(active,universe)}</div></article>
          <article class="combatant-card"><h4>${esc(actorName(targetId))}</h4><p class="muted">Cible de test</p><div class="combat-chips">${renderResources(target,universe)}</div></article>
        </div>
        <div class="combat-actions">
          <label>Compétence<select id="combatLabSkill" ${combat.phase==='ended'?'disabled':''}><option value="">— Choisir —</option>${skills.map(s=>`<option value="${esc(s.id)}">${esc(s.icon||'✨')} ${esc(s.name)}</option>`).join('')}</select></label>
          <button class="primary-button" id="combatLabUse" type="button" ${!skills.length||combat.phase==='ended'?'disabled':''}>Lancer l'action</button>
          <button class="secondary-button" id="combatLabReset" type="button">Réinitialiser</button>
        </div>
        <div class="combat-result" aria-live="polite">${esc(lastMessage)}</div>
        <div class="combat-journal"><h4>Journal moteur</h4>${journal.length?journal.slice().reverse().map(e=>`<div class="combat-log-row"><span>#${e.seq||'—'}</span><strong>${esc(e.text)}</strong><small>${esc(e.actorId?actorName(e.actorId):'système')}</small></div>`).join(''):'<p class="muted">Aucun événement.</p>'}</div>
      </section>`;

    host.querySelector('#combatLabReset')?.addEventListener('click',()=>{combat=createDemoCombat(universe);presentation=createPresentationState();journal=[];lastMessage='Combat réinitialisé.';normalizeTurn();render();});
    host.querySelector('#combatLabUse')?.addEventListener('click',()=>{
      const skillId=host.querySelector('#combatLabSkill')?.value;
      const skill=skills.find(s=>String(s.id)===String(skillId));
      if(!skill){lastMessage='Choisis une compétence.';render();return;}
      const prepared=prepareSkillAction(combat,skill,targetId,universe,{actionId:`lab-${Date.now()}`});
      if(!prepared.ok){lastMessage=`Action refusée : ${prepared.reason}.`;render();return;}
      const resolved=resolveAndAdvance(prepared.combat,{definitions:universe,randomPercent:()=>0});
      combat=reconcileCombatState(resolved.combat,{defeatRule});
      syncJournal();
      const roll=resolved.check?.roll;
      const success=resolved.check?.success!==false;
      lastMessage=`${skill.name} : ${success?'réussite':'échec'}${roll!=null?` (jet ${roll})`:''}. Le résultat moteur est déjà fixé avant tout rendu visuel.`;
      if(combat.phase==='turn'&&combat.activeActorId){
        const begun=beginActiveTurn(combat,{definitions:universe,defeatRule});
        combat=begun.combat;
        syncJournal();
      }
      render();
    });
  }

  normalizeTurn();
  render();
}
