import { readJson, writeJson, cloneData } from '../../core/storage.js';
import { createWorld, createZone, createRoom, createRoomLink, buildWorldIndex, validateWorld } from './world-engine.js';

const WORLD_KEY='rpg_world_builder';
const WORLD_ID='starter';

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function createDefaultWorldDraft(){
  const zone=createZone({name:'Zone 1'});
  const room=createRoom({zoneId:zone.id,name:'Salle de départ'});
  zone.roomIds=[room.id];
  return {world:createWorld({name:'Mon monde',startRoomId:room.id,zones:[zone.id]}),zones:[zone],rooms:[room],links:[]};
}

export function ensureWorldDraft(draft){
  const next=draft&&typeof draft==='object'?draft:createDefaultWorldDraft();
  next.zones=Array.isArray(next.zones)?next.zones:[];
  next.rooms=Array.isArray(next.rooms)?next.rooms:[];
  next.links=Array.isArray(next.links)?next.links:[];
  next.world=next.world||createWorld();
  next.world.zones=next.zones.map(z=>String(z.id));
  for(const zone of next.zones){zone.roomIds=next.rooms.filter(r=>String(r.zoneId)===String(zone.id)).map(r=>String(r.id));}
  for(const link of next.links){link.conditionIds=Array.isArray(link.conditionIds)?link.conditionIds.map(String):[];}
  if(next.world.startRoomId&&!next.rooms.some(r=>String(r.id)===String(next.world.startRoomId))) next.world.startRoomId=next.rooms[0]?.id||null;
  return next;
}

export function loadWorldDraft(){return ensureWorldDraft(readJson(WORLD_KEY,WORLD_ID,null)||createDefaultWorldDraft());}
export function saveWorldDraft(draft){return writeJson(WORLD_KEY,WORLD_ID,ensureWorldDraft(draft));}

function roomOptions(rooms,selected,none='— Choisir une salle —'){
  return [`<option value="">${none}</option>`,...rooms.map(r=>`<option value="${esc(r.id)}" ${String(r.id)===String(selected||'')?'selected':''}>${esc(r.name)}</option>`)].join('');
}
function zoneOptions(zones,selected){return zones.map(z=>`<option value="${esc(z.id)}" ${String(z.id)===String(selected||'')?'selected':''}>${esc(z.name)}</option>`).join('');}
export function linkRequiredItemOptions(items=[],selected=null){
  const enabled=(items||[]).filter(item=>item&&item.enabled!==false&&item.id);
  return ['<option value="">— Aucun objet requis —</option>',...enabled.map(item=>`<option value="${esc(item.id)}" ${String(item.id)===String(selected||'')?'selected':''}>${esc(item.icon||'📦')} ${esc(item.name||'Objet')}</option>`)].join('');
}
export function linkConditionOptions(conditions=[],selectedIds=[]){
  const selected=new Set((selectedIds||[]).map(String));
  return (conditions||[]).filter(condition=>condition&&condition.enabled!==false&&condition.id).map(condition=>`<option value="${esc(condition.id)}" ${selected.has(String(condition.id))?'selected':''}>${esc(condition.name||condition.label||'Condition')}</option>`).join('');
}

function zoneCard(zone,rooms){
  const count=rooms.filter(r=>String(r.zoneId)===String(zone.id)).length;
  return `<article class="editor-card compact" data-zone-id="${esc(zone.id)}"><div class="editor-card-head"><strong>🗺️ ${esc(zone.name)}</strong><span class="status-pill">${count} salle${count>1?'s':''}</span></div><label>Nom de la zone<input data-zone-field="name" value="${esc(zone.name)}"></label><button class="danger-button" type="button" data-delete-zone="${esc(zone.id)}">Supprimer</button></article>`;
}

function roomCard(room,zones,startRoomId){
  return `<article class="editor-card compact" data-room-id="${esc(room.id)}"><div class="editor-card-head"><strong>🚪 ${esc(room.name)}</strong>${String(room.id)===String(startRoomId)?'<span class="status-pill">Départ</span>':''}</div><div class="form-grid"><label>Nom<input data-room-field="name" value="${esc(room.name)}"></label><label>Zone<select data-room-field="zoneId">${zoneOptions(zones,room.zoneId)}</select></label><label>Type<select data-room-field="kind"><option value="room" ${room.kind==='room'?'selected':''}>Salle</option><option value="corridor" ${room.kind==='corridor'?'selected':''}>Couloir</option><option value="cache" ${room.kind==='cache'?'selected':''}>Cache / annexe</option><option value="boss" ${room.kind==='boss'?'selected':''}>Boss</option><option value="rest" ${room.kind==='rest'?'selected':''}>Repos</option></select></label></div><div class="toggle-row"><label><input type="radio" name="worldStartRoom" data-start-room="${esc(room.id)}" ${String(room.id)===String(startRoomId)?'checked':''}> Salle de départ</label></div><button class="danger-button" type="button" data-delete-room="${esc(room.id)}">Supprimer</button></article>`;
}

function linkCard(link,rooms,items,conditions){
  const conditionOptions=linkConditionOptions(conditions,link.conditionIds||[]);
  return `<article class="editor-card compact" data-link-id="${esc(link.id)}"><div class="editor-card-head"><strong>🔗 ${esc(link.label||'Passage')}</strong></div><div class="form-grid"><label>Nom<input data-link-field="label" value="${esc(link.label||'')}"></label><label>Depuis<select data-link-field="fromRoomId">${roomOptions(rooms,link.fromRoomId)}</select></label><label>Vers<select data-link-field="toRoomId">${roomOptions(rooms,link.toRoomId)}</select></label><label>Type<select data-link-field="direction"><option value="forward" ${link.direction==='forward'?'selected':''}>Passage</option><option value="branch" ${link.direction==='branch'?'selected':''}>Branche</option><option value="return" ${link.direction==='return'?'selected':''}>Retour explicite</option></select></label><label>Objet requis <button class="help-button tiny" type="button" data-help="rpg-world-builder" aria-label="Aide objet requis">?</button><select data-link-field="requiredItemId">${linkRequiredItemOptions(items,link.requiredItemId)}</select></label><label>Conditions requises <button class="help-button tiny" type="button" data-help="rpg-condition" aria-label="Aide conditions requises">?</button><select multiple size="${Math.max(2,Math.min(5,(conditions||[]).length||2))}" data-link-field="conditionIds">${conditionOptions}</select></label></div><div class="toggle-row"><label><input type="checkbox" data-link-field="enabled" ${link.enabled!==false?'checked':''}> Actif</label><label><input type="checkbox" data-link-field="oneWay" ${link.oneWay?'checked':''}> Sens unique</label></div><p class="muted">L'objet et les conditions sont choisis par leur nom. Le lien reste inaccessible tant que toutes les exigences ne sont pas remplies.</p><button class="danger-button" type="button" data-delete-link="${esc(link.id)}">Supprimer</button></article>`;
}

function fieldValue(input){
  if(input.type==='checkbox')return input.checked;
  if(input.multiple)return [...input.selectedOptions].map(option=>String(option.value)).filter(Boolean);
  return input.value||null;
}

export function mountWorldEditor(host,universe={}){
  let draft=loadWorldDraft();
  const items=Array.isArray(universe?.items)?universe.items:[];
  const conditions=Array.isArray(universe?.conditions)?universe.conditions:[];
  function commit(){draft=ensureWorldDraft(draft);saveWorldDraft(draft);render();}
  function render(){
    draft=ensureWorldDraft(draft);
    const index=buildWorldIndex(draft); const validation=validateWorld(index);
    host.innerHTML=`<section class="workspace-head"><div><p class="eyebrow">RPG · WORLD BUILDER</p><h2>${esc(draft.world.name)}</h2><p class="muted">Crée les zones, salles et passages. Les liaisons se font uniquement par menus : aucun ID technique à saisir.</p></div><button class="help-button" type="button" data-help="rpg-world-builder">?</button></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Monde</h3><p class="muted">Structure générale et salle de départ.</p></div></div><div class="form-grid"><label>Nom du monde<input id="worldName" value="${esc(draft.world.name)}"></label><label>Salle de départ<select id="worldStart">${roomOptions(draft.rooms,draft.world.startRoomId)}</select></label></div><p class="muted">Validation : ${validation.valid?'✅ structure valide':`⚠️ ${validation.errors.length} problème(s)`}</p></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Zones</h3><p class="muted">Une zone regroupe plusieurs salles sans imposer un ordre linéaire.</p></div><button class="primary-button" id="addWorldZone" type="button">+ Zone</button></div><div class="editor-list">${draft.zones.map(z=>zoneCard(z,draft.rooms)).join('')||'<p class="muted">Aucune zone.</p>'}</div></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Salles</h3><p class="muted">Salle normale, couloir, cache, boss ou repos. Les branches restent de vraies branches.</p></div><button class="primary-button" id="addWorldRoom" type="button" ${draft.zones.length?'':'disabled'}>+ Salle</button></div><div class="editor-list">${draft.rooms.map(r=>roomCard(r,draft.zones,draft.world.startRoomId)).join('')||'<p class="muted">Aucune salle.</p>'}</div></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Liaisons</h3><p class="muted">Choisis la salle de départ, la destination, l'objet requis et les conditions éventuelles pour franchir le passage.</p></div><button class="primary-button" id="addWorldLink" type="button" ${draft.rooms.length>1?'':'disabled'}>+ Liaison</button></div><div class="editor-list">${draft.links.map(l=>linkCard(l,draft.rooms,items,conditions)).join('')||'<p class="muted">Aucune liaison.</p>'}</div></section>`;

    host.querySelector('#worldName')?.addEventListener('change',e=>{draft.world.name=e.target.value||'Mon monde';commit();});
    host.querySelector('#worldStart')?.addEventListener('change',e=>{draft.world.startRoomId=e.target.value||null;commit();});
    host.querySelector('#addWorldZone')?.addEventListener('click',()=>{draft.zones.push(createZone({id:uid(),name:`Zone ${draft.zones.length+1}`}));commit();});
    host.querySelector('#addWorldRoom')?.addEventListener('click',()=>{const zone=draft.zones[0];if(!zone)return;draft.rooms.push(createRoom({id:uid(),zoneId:zone.id,name:`Salle ${draft.rooms.length+1}`}));commit();});
    host.querySelector('#addWorldLink')?.addEventListener('click',()=>{const [a,b]=draft.rooms;if(!a||!b)return;draft.links.push(createRoomLink({id:uid(),fromRoomId:a.id,toRoomId:b.id,label:'Passage'}));commit();});

    host.querySelectorAll('[data-zone-id]').forEach(card=>{const zone=draft.zones.find(z=>String(z.id)===String(card.dataset.zoneId));card.querySelectorAll('[data-zone-field]').forEach(input=>input.addEventListener('change',()=>{zone[input.dataset.zoneField]=fieldValue(input);commit();}));});
    host.querySelectorAll('[data-room-id]').forEach(card=>{const room=draft.rooms.find(r=>String(r.id)===String(card.dataset.roomId));card.querySelectorAll('[data-room-field]').forEach(input=>input.addEventListener('change',()=>{room[input.dataset.roomField]=fieldValue(input);commit();}));});
    host.querySelectorAll('[data-link-id]').forEach(card=>{const link=draft.links.find(l=>String(l.id)===String(card.dataset.linkId));card.querySelectorAll('[data-link-field]').forEach(input=>input.addEventListener('change',()=>{link[input.dataset.linkField]=fieldValue(input);commit();}));});
    host.querySelectorAll('[data-start-room]').forEach(input=>input.addEventListener('change',()=>{if(input.checked){draft.world.startRoomId=input.dataset.startRoom;commit();}}));

    host.querySelectorAll('[data-delete-zone]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.deleteZone;const roomIds=new Set(draft.rooms.filter(r=>String(r.zoneId)===String(id)).map(r=>String(r.id)));draft.zones=draft.zones.filter(z=>String(z.id)!==String(id));draft.rooms=draft.rooms.filter(r=>!roomIds.has(String(r.id)));draft.links=draft.links.filter(l=>!roomIds.has(String(l.fromRoomId))&&!roomIds.has(String(l.toRoomId)));commit();}));
    host.querySelectorAll('[data-delete-room]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.deleteRoom;draft.rooms=draft.rooms.filter(r=>String(r.id)!==String(id));draft.links=draft.links.filter(l=>String(l.fromRoomId)!==String(id)&&String(l.toRoomId)!==String(id));commit();}));
    host.querySelectorAll('[data-delete-link]').forEach(b=>b.addEventListener('click',()=>{draft.links=draft.links.filter(l=>String(l.id)!==String(b.dataset.deleteLink));commit();}));
  }
  render();
}

export function worldDraftSnapshot(){return cloneData(loadWorldDraft());}
