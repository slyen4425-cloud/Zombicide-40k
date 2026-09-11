import { createCombatState } from './combat-engine.js';
import { prepareSkillAction, resolveAndAdvance } from './turn-runtime.js';
import { beginActiveTurn, reconcileCombatState } from './combat-session.js';
import { createPresentationState, syncPresentationFromCombat, drainPresentation } from './combat-presentation.js';
import { resolveResourceMax } from '../../core/formulas.js';
import { calculateInitiative } from './initiative.js';
import { ensureCombatConfig } from './combat-config.js';

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clone(v){return structuredClone(v);}

function defaultActorState(universe){
  const stats=Object.fromEntries((universe.stats||[]).map(s=>[s.id,Number(s.baseValue)||0]));
  const resources={};
  const partial={stats,resources};
  for(const r of universe.resources||[]){const max=resolveResourceMax(r,partial,universe);resources[r.id]={current:max,max};}
  return {stats,resources,level:1,xp:0,skillRuntime:{},statuses:[]};
}

export function createDemoCombat(universe, random=Math.random){
  const cfg=ensureCombatConfig(universe);
  const base=defaultActorState(universe);
  const hero={id:'demo-hero',side:'heroes',state:clone(base),initiativeModifier:0};
  const enemy={id:'demo-enemy',side:'enemies',state:clone(base),initiativeModifier:-2};
  const initA=calculateInitiative(hero,cfg.initiative,random).total;
  const initB=calculateInitiative(enemy,cfg.initiative,random).total;
  return createCombatState({combatants:[{...hero,initiative:initA},{...enemy,initiative:initB}]});
}

function actorName(id){return id==='demo-hero'?'Héros test':id==='demo-enemy'?'Ennemi test':id;}
function renderResources(actor,universe){return (universe.resources||[]).map(r=>{const value=actor?.state?.resources?.[r.id];const current=Number(value?.current??value??0);const max=Number(value?.max??0);return `<span class="combat-chip">${esc(r.icon||'◆')} ${esc(r.name)} <strong>${current}${max?` / ${max}`:''}</strong></span>`;}).join('');}
function engineEventsForDisplay(combat,presentation){const synced=syncPresentationFromCombat(presentation,combat);return drainPresentation(synced);}

export function mountCombatLab(host,universe){
  const cfg=ensureCombatConfig(universe);
  let combat=createDemoCombat(universe);
  let presentation=createPresentationState();
  let journal=[];
  let lastMessage='Combat de test prêt.';
  const defeatRule=cfg.defeatRule;

  function syncJournal(){const out=engineEventsForDisplay(combat,presentation);presentation=out.presentation;journal.push(...out.items);if(journal.length>30)journal=journal.slice(-30);}
  function normalizeTurn(){combat=reconcileCombatState(combat,{defeatRule});if(combat.phase==='turn'&&combat.activeActorId){const begun=beginActiveTurn(combat,{definitions:universe,defeatRule});combat=begun.combat;}syncJournal();}
  function render(){
    const active=combat.actors?.[combat.activeActorId];
    const targetId=combat.activeActorId==='demo-hero'?'demo-enemy':'demo-hero';
    const target=combat.actors?.[targetId];
    const skills=universe.skills||[];
    host.innerHTML=`<section class="editor-section combat-lab"><div class="section-title-row"><div><h3>🧪 Laboratoire de combat</h3><p class="muted">Le moteur utilise les règles configurées : initiative, KO/défaite et jets restent indépendants du rendu.</p></div><button class="help-button tiny" type="button" data-help="rpg-combat-lab">?</button></div>
      <div class="combat-rule-summary"><span>Initiative : <strong>${esc(cfg.initiative.mode)}</strong></span><span>KO : <strong>${esc(defeatRule.kind||'none')} ${esc(defeatRule.operator||'')} ${Number(defeatRule.threshold??0)}</strong></span><span>Jet par défaut : <strong>D${Number(cfg.checkDefaults?.die)||100}</strong></span></div>
      <div class="combat-timeline">${combat.order.map(id=>{const a=combat.actors[id];return `<span class="combat-turn ${id===combat.activeActorId?'active':''} ${a?.ko?'ko':''}">${esc(actorName(id))}${a?.ko?' · KO':''}</span>`;}).join('')}</div>
      ${combat.phase==='ended'?`<div class="combat-result"><strong>Combat terminé.</strong> Vainqueur : ${esc(combat.winner||'aucun')}.</div>`:''}
      <div class="combat-grid"><article class="combatant-card"><h4>${esc(actorName(combat.activeActorId||'—'))}</h4><p class="muted">${combat.phase==='ended'?'Aucun acteur courant':`Acteur courant · tour ${combat.round}`}</p><div class="combat-chips">${renderResources(active,universe)}</div></article><article class="combatant-card"><h4>${esc(actorName(targetId))}</h4><p class="muted">Cible de test</p><div class="combat-chips">${renderResources(target,universe)}</div></article></div>
      <div class="combat-actions"><label>Compétence<select id="combatLabSkill" ${combat.phase==='ended'?'disabled':''}><option value="">— Choisir —</option>${skills.map(s=>`<option value="${esc(s.id)}">${esc(s.icon||'✨')} ${esc(s.name)}</option>`).join('')}</select></label><button class="primary-button" id="combatLabUse" type="button" ${!skills.length||combat.phase==='ended'?'disabled':''}>Lancer l'action</button><button class="secondary-button" id="combatLabReset" type="button">Réinitialiser</button></div>
      <div class="combat-result" aria-live="polite">${esc(lastMessage)}</div><div class="combat-journal"><h4>Journal moteur</h4>${journal.length?journal.slice().reverse().map(e=>`<div class="combat-log-row"><span>#${e.seq||'—'}</span><strong>${esc(e.text)}</strong><small>${esc(e.actorId?actorName(e.actorId):'système')}</small></div>`).join(''):'<p class="muted">Aucun événement.</p>'}</div></section>`;
    host.querySelector('#combatLabReset')?.addEventListener('click',()=>{combat=createDemoCombat(universe);presentation=createPresentationState();journal=[];lastMessage='Combat réinitialisé avec les règles actuelles.';normalizeTurn();render();});
    host.querySelector('#combatLabUse')?.addEventListener('click',()=>{
      const skillId=host.querySelector('#combatLabSkill')?.value;const skill=skills.find(s=>String(s.id)===String(skillId));if(!skill){lastMessage='Choisis une compétence.';render();return;}
      const effectiveSkill=clone(skill);effectiveSkill.roll=effectiveSkill.roll||{};if(effectiveSkill.roll.enabled!==false){effectiveSkill.roll.die=Number(effectiveSkill.roll.die)||Number(cfg.checkDefaults?.die)||100;effectiveSkill.roll.mode=effectiveSkill.roll.mode||cfg.checkDefaults?.mode||'roll-under';}
      const prepared=prepareSkillAction(combat,effectiveSkill,targetId,universe,{actionId:`lab-${Date.now()}`});if(!prepared.ok){lastMessage=`Action refusée : ${prepared.reason}.`;render();return;}
      const resolved=resolveAndAdvance(prepared.combat,{definitions:universe,randomPercent:()=>0});combat=reconcileCombatState(resolved.combat,{defeatRule});syncJournal();const roll=resolved.check?.roll;const success=resolved.check?.success!==false;lastMessage=`${skill.name} : ${success?'réussite':'échec'}${roll!=null?` (jet ${roll})`:''}. Le résultat moteur est déjà fixé avant tout rendu visuel.`;
      if(combat.phase==='turn'&&combat.activeActorId){const begun=beginActiveTurn(combat,{definitions:universe,defeatRule});combat=begun.combat;syncJournal();}render();
    });
  }
  normalizeTurn();render();
}
