import { fleeDungeonCombat } from './dungeon-combat-flee-runtime.js';

export function renderDungeonCombatFleeControl({combat=null}={}){
  if(!combat||combat.phase!=='turn'||combat.metadata?.kind!=='dungeon-room-combat') return '';
  return `<div class="combat-actions dungeon-combat-flee-actions" data-dungeon-combat-flee><button type="button" class="secondary-button" data-dungeon-flee-combat>🏃 Fuir</button><p class="muted">La fuite conserve l’état des héros et restaure les ennemis à leur état persistant de salle.</p></div>`;
}

export function mountDungeonCombatFleeControl(root,{getCombat=()=>null,getRoomRuntime=()=>null,getHeroRuntimes=()=>[],onFlee=null,onError=null}={}){
  if(!root?.querySelector) return false;
  const combat=getCombat();
  const section=root.querySelector('.dungeon-combat-section');
  if(!section||combat?.phase!=='turn'||combat?.metadata?.kind!=='dungeon-room-combat') return false;
  section.querySelector('[data-dungeon-combat-flee]')?.remove();
  const html=renderDungeonCombatFleeControl({combat});
  if(!html) return false;
  section.insertAdjacentHTML('beforeend',html);
  const button=section.querySelector('[data-dungeon-flee-combat]');
  button?.addEventListener('click',()=>{
    const out=fleeDungeonCombat({combat:getCombat(),roomRuntime:getRoomRuntime(),heroRuntimes:getHeroRuntimes()});
    if(!out.ok){onError?.(out);return;}
    onFlee?.(out);
  });
  return true;
}
