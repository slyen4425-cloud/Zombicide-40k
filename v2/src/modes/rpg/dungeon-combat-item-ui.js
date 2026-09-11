import { dungeonHeroCombatItems, useDungeonHeroCombatItem } from './dungeon-combat-item-runtime.js';
import { validSkillTargets } from './targeting-engine.js';
import { combatTargetLabel } from './combat-target-ui.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}

export function dungeonCombatItemTargetEntries({universe={},combat=null,itemEntry=null}={}){
  if(!combat||combat.phase!=='turn'||!combat.activeActorId||!itemEntry) return [];
  const actorId=String(combat.activeActorId);
  return validSkillTargets({combat,actorId,targetKind:itemEntry.targetKind||'self'}).map(entry=>({
    id:String(entry.actor.id),
    side:String(entry.actor.side||''),
    self:String(entry.actor.id)===actorId,
    name:combatTargetLabel(universe,combat,entry.actor),
  }));
}

export function renderDungeonCombatItemControls({universe={},combat=null,heroRuntimes=[]}={}){
  const items=dungeonHeroCombatItems({combat,heroRuntimes,universe});
  if(!items.length) return '';
  const first=items[0];
  const targets=dungeonCombatItemTargetEntries({universe,combat,itemEntry:first});
  return `<div class="combat-actions dungeon-combat-item-actions" data-dungeon-combat-items><label>Objet<select data-dungeon-combat-item>${items.map(entry=>`<option value="${esc(entry.itemId)}">${esc(entry.item.icon||'🧪')} ${esc(entry.item.name||'Objet')} · x${entry.quantity}</option>`).join('')}</select></label><label>Cible de l'objet<select data-dungeon-combat-item-target ${targets.length?'':'disabled'}>${targets.map(target=>`<option value="${esc(target.id)}">${target.self?'👤 ':target.side==='heroes'?'🛡️ ':'👹 '}${esc(target.name)}</option>`).join('')}</select></label><button type="button" class="secondary-button" data-dungeon-use-item ${targets.length?'':'disabled'}>Utiliser l'objet</button></div>`;
}

export function mountDungeonCombatItemControls(root,{universe={},getCombat=()=>null,getHeroRuntimes=()=>[],onUse=null,onError=null}={}){
  if(!root?.querySelector) return false;
  const combat=getCombat();
  const actor=combat?.actors?.[combat?.activeActorId];
  const host=root.querySelector('.dungeon-combat-actions');
  if(!host||actor?.side!=='heroes') return false;
  host.querySelector('[data-dungeon-combat-items]')?.remove();
  const html=renderDungeonCombatItemControls({universe,combat,heroRuntimes:getHeroRuntimes()});
  if(!html) return false;
  host.insertAdjacentHTML('afterend',html);
  const block=root.querySelector('[data-dungeon-combat-items]');
  const itemSelect=block?.querySelector('[data-dungeon-combat-item]');
  const targetSelect=block?.querySelector('[data-dungeon-combat-item-target]');
  const useButton=block?.querySelector('[data-dungeon-use-item]');
  const syncTargets=()=>{
    const currentCombat=getCombat();
    const entries=dungeonHeroCombatItems({combat:currentCombat,heroRuntimes:getHeroRuntimes(),universe});
    const selected=entries.find(entry=>String(entry.itemId)===String(itemSelect?.value||''))||entries[0]||null;
    const targets=dungeonCombatItemTargetEntries({universe,combat:currentCombat,itemEntry:selected});
    if(targetSelect){
      targetSelect.innerHTML=targets.map(target=>`<option value="${esc(target.id)}">${target.self?'👤 ':target.side==='heroes'?'🛡️ ':'👹 '}${esc(target.name)}</option>`).join('');
      targetSelect.disabled=!targets.length;
    }
    if(useButton) useButton.disabled=!selected||!targets.length;
    return targets;
  };
  itemSelect?.addEventListener('change',syncTargets);
  useButton?.addEventListener('click',()=>{
    const out=useDungeonHeroCombatItem({
      combat:getCombat(),
      heroRuntimes:getHeroRuntimes(),
      universe,
      itemId:itemSelect?.value||null,
      targetId:targetSelect?.value||null,
    });
    if(!out.ok){onError?.(out);return;}
    onUse?.(out);
  });
  syncTargets();
  return true;
}
