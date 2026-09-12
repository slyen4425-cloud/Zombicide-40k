import { combatInteractionPolicy } from './combat-config.js';
import { combatTargetLabel } from './combat-target-ui.js';
import { gmSetCombatResource, gmSetCombatKo, gmRollCombatCheck, gmAdvanceCombatTurn } from './dungeon-combat-gm-runtime.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}
function defById(collection,id){return list(collection).find(entry=>String(entry?.id||'')===String(id||''))||null;}

export function dungeonGmActorEntries(universe={},combat=null){
  if(!combat) return [];
  return (combat.order||Object.keys(combat.actors||{})).map(id=>{
    const actor=combat.actors?.[id];
    if(!actor) return null;
    return {id:String(id),name:combatTargetLabel(universe,combat,actor),side:String(actor.side||''),ko:Boolean(actor.ko),active:String(combat.activeActorId||'')===String(id)};
  }).filter(Boolean);
}

export function dungeonGmResourceEntries(universe={},combat=null,actorId=null){
  const actor=combat?.actors?.[String(actorId||'')];
  if(!actor) return [];
  const state=actor.state?.resources||{};
  const ids=[];
  for(const def of list(universe.resources)) if(def?.id!=null&&Object.prototype.hasOwnProperty.call(state,String(def.id))) ids.push(String(def.id));
  for(const id of Object.keys(state)) if(!ids.includes(String(id))) ids.push(String(id));
  return ids.map(id=>{
    const def=defById(universe.resources,id)||{};
    const raw=state[id];
    const current=Number(raw?.current??raw??0)||0;
    const maxValue=Number(raw?.max);
    return {id,name:String(def.name||id),icon:String(def.icon||'◆'),current,max:Number.isFinite(maxValue)?maxValue:null};
  });
}

export function renderDungeonCombatGmControls({universe={},combat=null}={}){
  const policy=combatInteractionPolicy(universe);
  if(!policy.manualCombatControls||!combat||combat.phase!=='turn'||combat.metadata?.kind!=='dungeon-room-combat') return '';
  const actors=dungeonGmActorEntries(universe,combat);
  const selected=actors.find(entry=>entry.active)||actors[0]||null;
  const resources=dungeonGmResourceEntries(universe,combat,selected?.id);
  const firstResource=resources[0]||null;
  const stats=list(universe.stats);
  const defaults=universe.combat?.checkDefaults||{};
  return `<section class="editor-card dungeon-combat-gm-controls" data-dungeon-gm-controls><div class="editor-card-head"><strong>🎭 MJ contrôle total</strong><span class="status-pill">Manuel</span></div><p class="muted">Toutes les commandes ci-dessous modifient le même combat et sa timeline.</p><div class="form-grid"><label>Combattant<select data-dungeon-gm-actor>${actors.map(entry=>`<option value="${esc(entry.id)}" ${entry.id===selected?.id?'selected':''}>${entry.side==='heroes'?'🛡️':'👹'} ${esc(entry.name)}${entry.ko?' · KO':''}${entry.active?' · tour actif':''}</option>`).join('')}</select></label><label>Ressource<select data-dungeon-gm-resource ${resources.length?'':'disabled'}>${resources.map(entry=>`<option value="${esc(entry.id)}">${esc(entry.icon)} ${esc(entry.name)}</option>`).join('')}</select></label><label>Valeur<input type="number" data-dungeon-gm-resource-value value="${firstResource?.current??0}" ${firstResource?'':'disabled'}></label><button type="button" class="secondary-button" data-dungeon-gm-set-resource ${firstResource?'':'disabled'}>Appliquer la ressource</button></div><div class="action-row"><button type="button" class="secondary-button" data-dungeon-gm-ko>💀 Mettre KO</button><button type="button" class="secondary-button" data-dungeon-gm-reactivate>❤️ Réactiver</button></div><div class="form-grid"><label>Stat du jet<select data-dungeon-gm-stat><option value="">— Aucune —</option>${stats.map(stat=>`<option value="${esc(stat.id)}">${esc(stat.icon||'')} ${esc(stat.name||stat.id)}</option>`).join('')}</select></label><label>Difficulté<input type="number" data-dungeon-gm-difficulty value="50"></label><label>Dé<input type="number" min="2" data-dungeon-gm-die value="${Math.max(2,Number(defaults.die)||100)}"></label><label>Mode<select data-dungeon-gm-mode><option value="roll-under" ${defaults.mode==='roll-over'?'':'selected'}>Réussite sous le seuil</option><option value="roll-over" ${defaults.mode==='roll-over'?'selected':''}>Réussite au-dessus du seuil</option></select></label><button type="button" class="primary-button" data-dungeon-gm-roll>🎲 Lancer le jet</button></div><div class="action-row"><button type="button" class="primary-button" data-dungeon-gm-next-turn>⏭️ Passer le tour</button></div><div class="combat-result" data-dungeon-gm-result aria-live="polite"></div></section>`;
}

export function mountDungeonCombatGmControls(root,{universe={},getCombat=()=>null,onChange=null,onError=null}={}){
  if(!root?.querySelector) return false;
  const combat=getCombat();
  const section=root.querySelector('.dungeon-combat-section');
  if(!section||!combatInteractionPolicy(universe).manualCombatControls||combat?.phase!=='turn'||combat?.metadata?.kind!=='dungeon-room-combat') return false;
  section.querySelector('[data-dungeon-gm-controls]')?.remove();
  const html=renderDungeonCombatGmControls({universe,combat});
  if(!html) return false;
  section.insertAdjacentHTML('beforeend',html);
  const block=section.querySelector('[data-dungeon-gm-controls]');
  const actorSelect=block?.querySelector('[data-dungeon-gm-actor]');
  const resourceSelect=block?.querySelector('[data-dungeon-gm-resource]');
  const resourceValue=block?.querySelector('[data-dungeon-gm-resource-value]');
  const result=block?.querySelector('[data-dungeon-gm-result]');
  const report=(out,label)=>{
    if(!out?.ok){if(result) result.textContent=`Action MJ refusée : ${out?.reason||'erreur'}.`;onError?.(out);return false;}
    if(result&&label) result.textContent=label;
    onChange?.(out);
    return true;
  };
  const syncResource=()=>{
    const entries=dungeonGmResourceEntries(universe,getCombat(),actorSelect?.value||null);
    if(resourceSelect){resourceSelect.innerHTML=entries.map(entry=>`<option value="${esc(entry.id)}">${esc(entry.icon)} ${esc(entry.name)}</option>`).join('');resourceSelect.disabled=!entries.length;}
    const first=entries[0]||null;
    if(resourceValue){resourceValue.value=String(first?.current??0);resourceValue.disabled=!first;}
    const apply=block?.querySelector('[data-dungeon-gm-set-resource]');if(apply) apply.disabled=!first;
  };
  const syncValue=()=>{
    const entry=dungeonGmResourceEntries(universe,getCombat(),actorSelect?.value||null).find(row=>row.id===String(resourceSelect?.value||''));
    if(resourceValue) resourceValue.value=String(entry?.current??0);
  };
  actorSelect?.addEventListener('change',syncResource);
  resourceSelect?.addEventListener('change',syncValue);
  block?.querySelector('[data-dungeon-gm-set-resource]')?.addEventListener('click',()=>report(gmSetCombatResource({universe,combat:getCombat(),actorId:actorSelect?.value,resourceId:resourceSelect?.value,value:resourceValue?.value}),'Ressource mise à jour.'));
  block?.querySelector('[data-dungeon-gm-ko]')?.addEventListener('click',()=>report(gmSetCombatKo({universe,combat:getCombat(),actorId:actorSelect?.value,ko:true}),'Combattant mis KO.'));
  block?.querySelector('[data-dungeon-gm-reactivate]')?.addEventListener('click',()=>report(gmSetCombatKo({universe,combat:getCombat(),actorId:actorSelect?.value,ko:false}),'Combattant réactivé.'));
  block?.querySelector('[data-dungeon-gm-roll]')?.addEventListener('click',()=>{
    const out=gmRollCombatCheck({universe,combat:getCombat(),actorId:actorSelect?.value,spec:{statId:block.querySelector('[data-dungeon-gm-stat]')?.value||null,difficulty:Number(block.querySelector('[data-dungeon-gm-difficulty]')?.value)||0,die:Number(block.querySelector('[data-dungeon-gm-die]')?.value)||100,mode:block.querySelector('[data-dungeon-gm-mode]')?.value||'roll-under'}});
    report(out,out?.ok?`Jet ${out.check.roll} / seuil ${out.check.threshold} : ${out.check.success?'réussi':'échoué'}.`:null);
  });
  block?.querySelector('[data-dungeon-gm-next-turn]')?.addEventListener('click',()=>report(gmAdvanceCombatTurn({universe,combat:getCombat()}),'Tour passé manuellement.'));
  syncResource();
  return true;
}
