import { loadDungeonDeviceRole, saveDungeonDeviceRole } from './dungeon-device-role.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function renderDungeonDeviceRoleLaunch({role='player'}={}){
  const current=role==='gm'?'gm':'player';
  return `<section class="panel dungeon-device-role-launch" data-dungeon-device-role-launch><div class="section-title-row"><div><h2>Choisir le rôle de ce téléphone</h2><p class="muted">Ce choix concerne uniquement cet appareil. Les règles de la partie restent séparées.</p></div></div><div class="mode-grid dungeon-device-role-grid"><button type="button" class="mode-card ${current==='gm'?'active':''}" data-dungeon-device-role="gm"><span class="mode-icon">📱</span><h3>Ce téléphone est MJ</h3><p>Affiche les outils MJ quand la partie utilise le mode MJ contrôle total.</p>${current==='gm'?'<span class="status-pill">Rôle mémorisé</span>':''}</button><button type="button" class="mode-card ${current==='player'?'active':''}" data-dungeon-device-role="player"><span class="mode-icon">🎮</span><h3>Ce téléphone est Joueur</h3><p>N’affiche jamais le panneau MJ sur cet appareil.</p>${current==='player'?'<span class="status-pill">Rôle mémorisé</span>':''}</button></div></section>`;
}

export function mountDungeonDeviceRoleLaunch(host,{storage=null,onSelect=null}={}){
  if(!host) return false;
  const remembered=loadDungeonDeviceRole(storage);
  host.innerHTML=renderDungeonDeviceRoleLaunch({role:remembered});
  host.querySelectorAll?.('[data-dungeon-device-role]').forEach(button=>button.addEventListener('click',()=>{
    const role=saveDungeonDeviceRole(button.dataset.dungeonDeviceRole,storage);
    onSelect?.({role,isGameMasterDevice:role==='gm'});
  }));
  return remembered;
}
