import { readJson, writeJson, cloneData } from '../../core/storage.js';
import { loadWorldDraft } from './world-editor.js';
import { createRoomLayout, getRoomCell, setRoomCell, createWall, addWall, createDoor, addDoor, createMarker, addMarker, resizeRoomLayout, validateRoomLayout } from './room-engine.js';
import { ensureRoomInteractions, createRoomInteraction, addRoomInteraction, updateRoomInteraction, removeRoomInteraction, validateRoomInteractions } from './interaction-engine.js';

const LAYOUT_KEY='rpg_room_layout';
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cellKey(x,y){return `${x},${y}`;}

export function loadRoomLayout(room){
  if(!room) return null;
  const saved=readJson(LAYOUT_KEY,String(room.id),null);
  return ensureRoomInteractions(saved||createRoomLayout({roomId:room.id,name:room.name,width:8,height:8}));
}
export function saveRoomLayout(layout){if(!layout?.roomId) return false;return writeJson(LAYOUT_KEY,String(layout.roomId),ensureRoomInteractions(layout));}

function roomOptions(rooms,selected){return rooms.map(r=>`<option value="${esc(r.id)}" ${String(r.id)===String(selected||'')?'selected':''}>${esc(r.name)}</option>`).join('');}
export function doorRequiredItemOptions(items=[],selected=null){
  const enabled=(items||[]).filter(item=>item&&item.enabled!==false&&item.id);
  return ['<option value="">— Aucune clé / objet —</option>',...enabled.map(item=>`<option value="${esc(item.id)}" ${String(item.id)===String(selected||'')?'selected':''}>${esc(item.icon||'🗝️')} ${esc(item.name||'Objet')}</option>`)].join('');
}
function iconFor(layout,x,y){
  const interaction=(layout.interactions||[]).find(i=>i.enabled!==false&&i.attachment?.kind==='cell'&&Number(i.attachment.x)===x&&Number(i.attachment.y)===y);
  if(interaction){const icons={chest:'📦',trap:'⚠️',puzzle:'🧩',event:'❗',switch:'🔘',portal:'🌀',object:'⭐'};return icons[interaction.kind]||'⭐';}
  const door=(layout.doors||[]).find(d=>Number(d.x)===x&&Number(d.y)===y);
  if(door?.entry) return '🚪⬅️';
  if(door?.exit) return '🚪➡️';
  if(door) return door.locked?'🔒':'🚪';
  const marker=(layout.markers||[]).find(m=>Number(m.x)===x&&Number(m.y)===y);
  if(marker) return marker.kind==='special'?'⭐':'📍';
  const wall=(layout.walls||[]).find(w=>Number(w.x)===x&&Number(w.y)===y);
  if(wall) return '🧱';
  const cell=getRoomCell(layout,x,y);
  if(cell.blocked) return '⛔';
  if(Number(cell.coverModifier)||0) return '🛡️';
  if(cell.terrain==='water') return '💧';
  if(cell.terrain==='lava') return '🌋';
  if(cell.terrain==='rock') return '🪨';
  return '';
}
function terrainClass(layout,x,y){const c=getRoomCell(layout,x,y);return `terrain-${esc(c.terrain||'floor')} ${c.blocked?'blocked':''}`;}
function removeAt(layout,x,y,{cell=false,walls=false,doors=false,markers=false,all=false}={}){
  const next=cloneData(layout); const match=o=>Number(o.x)===x&&Number(o.y)===y;
  if(all||cell) delete next.cells?.[cellKey(x,y)];
  if(all||walls) next.walls=(next.walls||[]).filter(o=>!match(o));
  if(all||doors) next.doors=(next.doors||[]).filter(o=>!match(o));
  if(all||markers) next.markers=(next.markers||[]).filter(o=>!match(o));
  if(all) next.interactions=(next.interactions||[]).filter(i=>!(i.attachment?.kind==='cell'&&match(i.attachment)));
  return next;
}
function cellOptions(layout,attachment={}){
  const out=[];
  for(let y=0;y<layout.height;y++) for(let x=0;x<layout.width;x++){
    const value=`${x},${y}`;const selected=attachment.kind==='cell'&&Number(attachment.x)===x&&Number(attachment.y)===y;
    out.push(`<option value="${value}" ${selected?'selected':''}>Case ${x+1}, ${y+1}</option>`);
  }
  return out.join('');
}
function doorOptions(layout,targetId){return (layout.doors||[]).map((d,index)=>`<option value="${esc(d.id)}" ${String(d.id)===String(targetId||'')?'selected':''}>${d.entry?'Entrée':d.exit?'Sortie':'Porte'} ${index+1} · case ${Number(d.x)+1},${Number(d.y)+1}</option>`).join('');}
function chestOptions(layout,targetId,selfId){return (layout.interactions||[]).filter(i=>i.kind==='chest'&&String(i.id)!==String(selfId)).map(i=>`<option value="${esc(i.id)}" ${String(i.id)===String(targetId||'')?'selected':''}>📦 ${esc(i.name)}</option>`).join('');}
function attachmentTarget(interaction,layout){
  const a=interaction.attachment||{kind:'cell',x:0,y:0};
  if(a.kind==='door') return `<select data-interaction-target>${doorOptions(layout,a.targetId)||'<option value="">— Aucune porte —</option>'}</select>`;
  if(a.kind==='interaction') return `<select data-interaction-target>${chestOptions(layout,a.targetId,interaction.id)||'<option value="">— Aucun coffre —</option>'}</select>`;
  return `<select data-interaction-target>${cellOptions(layout,a)}</select>`;
}
function interactionCard(interaction,layout){
  const a=interaction.attachment||{kind:'cell',x:0,y:0};
  return `<article class="editor-card compact" data-interaction-id="${esc(interaction.id)}"><div class="editor-card-head"><strong>${interaction.kind==='chest'?'📦':interaction.kind==='trap'?'⚠️':interaction.kind==='puzzle'?'🧩':interaction.kind==='event'?'❗':interaction.kind==='switch'?'🔘':interaction.kind==='portal'?'🌀':'⭐'} ${esc(interaction.name)}</strong><span class="status-pill">${interaction.enabled!==false?'Actif':'Inactif'}</span></div><div class="form-grid"><label>Nom<input data-interaction-field="name" value="${esc(interaction.name)}"></label><label>Type<select data-interaction-field="kind"><option value="chest" ${interaction.kind==='chest'?'selected':''}>Coffre</option><option value="trap" ${interaction.kind==='trap'?'selected':''}>Piège</option><option value="puzzle" ${interaction.kind==='puzzle'?'selected':''}>Énigme</option><option value="event" ${interaction.kind==='event'?'selected':''}>Événement</option><option value="switch" ${interaction.kind==='switch'?'selected':''}>Interrupteur</option><option value="portal" ${interaction.kind==='portal'?'selected':''}>Portail</option><option value="object" ${interaction.kind==='object'?'selected':''}>Objet interactif</option></select></label><label>Attaché à<select data-attachment-kind><option value="cell" ${a.kind==='cell'?'selected':''}>Case</option><option value="door" ${a.kind==='door'?'selected':''}>Porte</option><option value="interaction" ${a.kind==='interaction'?'selected':''}>Coffre</option></select></label><label>Support${attachmentTarget(interaction,layout)}</label></div><div class="toggle-row"><label><input type="checkbox" data-interaction-enabled ${interaction.enabled!==false?'checked':''}> Actif</label></div><button class="danger-button" type="button" data-delete-interaction="${esc(interaction.id)}">Supprimer</button></article>`;
}

export function mountRoomEditor(host,universe={}){
  const world=loadWorldDraft();
  if(!world.rooms.length){host.innerHTML='<section class="panel"><h2>Créateur de salle</h2><p>Crée d’abord une salle dans le World Builder.</p></section>';return;}
  const items=Array.isArray(universe?.items)?universe.items:[];
  let selectedRoomId=world.rooms[0].id;
  let layout=loadRoomLayout(world.rooms[0]);
  let tool='floor';
  let edge='north';
  let coverModifier=-15;
  let doorLocked=false;
  let doorKeyItemId=null;

  function persist(){layout=ensureRoomInteractions(layout);saveRoomLayout(layout);render();}
  function selectRoom(id){selectedRoomId=id;const room=world.rooms.find(r=>String(r.id)===String(id));layout=loadRoomLayout(room);render();}
  function applyTool(x,y){
    let out;
    if(tool==='floor') out=setRoomCell(removeAt(layout,x,y,{cell:true}),x,y,{terrain:'floor',blocked:false,coverModifier:0});
    else if(tool==='blocked') out=setRoomCell(layout,x,y,{terrain:'floor',blocked:true,coverModifier:0});
    else if(tool==='cover') out=setRoomCell(layout,x,y,{terrain:'floor',blocked:false,coverModifier:Number(coverModifier)||0});
    else if(['water','lava','rock'].includes(tool)) out=setRoomCell(layout,x,y,{terrain:tool,blocked:tool==='rock',coverModifier:0});
    else if(tool==='wall') {layout=removeAt(layout,x,y,{doors:true});out=addWall(layout,createWall({x,y,edge}));}
    else if(tool==='door'||tool==='entry'||tool==='exit') {layout=removeAt(layout,x,y,{walls:true,doors:true});out=addDoor(layout,createDoor({x,y,edge,entry:tool==='entry',exit:tool==='exit',locked:doorLocked,keyItemId:doorLocked?doorKeyItemId:null}));}
    else if(tool==='special') {layout=removeAt(layout,x,y,{markers:true});out=addMarker(layout,createMarker({x,y,kind:'special',label:'Interaction'}));}
    else if(tool==='erase') {layout=removeAt(layout,x,y,{all:true});persist();return;}
    if(out?.ok) layout=out.layout;
    persist();
  }
  function patchInteraction(id,patch){const out=updateRoomInteraction(layout,id,patch);if(out.ok){layout=out.layout;persist();}}

  function render(){
    layout=ensureRoomInteractions(layout);
    const room=world.rooms.find(r=>String(r.id)===String(selectedRoomId))||world.rooms[0];
    const validation=validateRoomLayout(layout);const interactionValidation=validateRoomInteractions(layout);
    const cells=[];
    for(let y=0;y<layout.height;y++) for(let x=0;x<layout.width;x++) cells.push(`<button type="button" class="room-cell ${terrainClass(layout,x,y)}" data-cell-x="${x}" data-cell-y="${y}" aria-label="Case ${x+1}, ${y+1}"><span>${iconFor(layout,x,y)}</span><small>${x+1},${y+1}</small></button>`);
    host.innerHTML=`<section class="workspace-head"><div><p class="eyebrow">RPG · CRÉATEUR DE SALLE</p><h2>${esc(room.name)}</h2><p class="muted">Peins la grille puis rattache coffres, pièges, énigmes et événements aux cases, portes ou coffres par menus.</p></div><button class="help-button" type="button" data-help="rpg-room-builder">?</button></section>
      <section class="editor-section"><div class="form-grid"><label>Salle<select id="roomLayoutSelect">${roomOptions(world.rooms,selectedRoomId)}</select></label><label>Orientation mur / porte<select id="roomEdge"><option value="north" ${edge==='north'?'selected':''}>Nord</option><option value="east" ${edge==='east'?'selected':''}>Est</option><option value="south" ${edge==='south'?'selected':''}>Sud</option><option value="west" ${edge==='west'?'selected':''}>Ouest</option></select></label><label>Couverture (modificateur)<input id="roomCoverModifier" type="number" step="1" value="${Number(coverModifier)||0}"></label><label>Clé / objet de porte<select id="roomDoorKeyItem">${doorRequiredItemOptions(items,doorKeyItemId)}</select></label><label>Largeur<input id="roomWidth" type="number" min="1" max="100" value="${layout.width}"></label><label>Hauteur<input id="roomHeight" type="number" min="1" max="100" value="${layout.height}"></label></div><div class="toggle-row"><label><input id="roomDoorLocked" type="checkbox" ${doorLocked?'checked':''}> 🔒 Verrouiller les prochaines portes placées</label></div><p class="muted">Une porte verrouillée peut exiger l’objet choisi. Sans objet requis, elle peut rester verrouillée pour être ouverte plus tard par un événement, une énigme ou un interrupteur.</p><p class="muted">${validation.valid&&interactionValidation.valid?'✅ Salle valide':`⚠️ ${validation.errors.length+interactionValidation.errors.length} problème(s)`}</p></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Outils</h3><p class="muted">Choisis un outil puis touche une case. La couverture utilise le modificateur réglé ci-dessus.</p></div></div><div class="room-tools">${[['floor','⬜ Sol'],['blocked','⛔ Bloqué'],['cover','🛡️ Couverture'],['water','💧 Eau'],['lava','🌋 Lave'],['rock','🪨 Rocher'],['wall','🧱 Mur'],['door','🚪 Porte'],['entry','⬅️ Entrée'],['exit','➡️ Sortie'],['special','⭐ Repère'],['erase','🧽 Effacer']].map(([id,label])=>`<button type="button" class="secondary-button ${tool===id?'active-tool':''}" data-room-tool="${id}">${label}</button>`).join('')}</div></section>
      <section class="editor-section room-grid-wrap"><div class="room-grid" style="--room-cols:${layout.width}">${cells.join('')}</div></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Interactions</h3><p class="muted">Un piège ou une énigme peut être attaché à une case, une porte ou directement à un coffre.</p></div><button class="primary-button" id="addRoomInteraction" type="button">+ Interaction</button></div><div class="editor-list">${layout.interactions.map(i=>interactionCard(i,layout)).join('')||'<p class="muted">Aucune interaction.</p>'}</div></section>`;

    host.querySelector('#roomLayoutSelect')?.addEventListener('change',e=>selectRoom(e.target.value));
    host.querySelector('#roomEdge')?.addEventListener('change',e=>{edge=e.target.value;render();});
    host.querySelector('#roomCoverModifier')?.addEventListener('change',e=>{coverModifier=Number(e.target.value)||0;render();});
    host.querySelector('#roomDoorLocked')?.addEventListener('change',e=>{doorLocked=e.target.checked;render();});
    host.querySelector('#roomDoorKeyItem')?.addEventListener('change',e=>{doorKeyItemId=e.target.value||null;render();});
    const resize=()=>{layout=resizeRoomLayout(layout,{width:Number(host.querySelector('#roomWidth')?.value),height:Number(host.querySelector('#roomHeight')?.value)});layout=ensureRoomInteractions(layout);layout.interactions=layout.interactions.filter(i=>validateRoomInteractions({...layout,interactions:[i]}).valid);persist();};
    host.querySelector('#roomWidth')?.addEventListener('change',resize);host.querySelector('#roomHeight')?.addEventListener('change',resize);
    host.querySelectorAll('[data-room-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.roomTool;render();}));
    host.querySelectorAll('[data-cell-x]').forEach(b=>b.addEventListener('click',()=>applyTool(Number(b.dataset.cellX),Number(b.dataset.cellY))));
    host.querySelector('#addRoomInteraction')?.addEventListener('click',()=>{const out=addRoomInteraction(layout,createRoomInteraction({kind:'chest',name:'Nouveau coffre',attachment:{kind:'cell',x:0,y:0}}));if(out.ok){layout=out.layout;persist();}});
    host.querySelectorAll('[data-interaction-id]').forEach(card=>{
      const id=card.dataset.interactionId;const current=layout.interactions.find(i=>String(i.id)===String(id));if(!current)return;
      card.querySelectorAll('[data-interaction-field]').forEach(input=>input.addEventListener('change',()=>patchInteraction(id,{[input.dataset.interactionField]:input.value})));
      card.querySelector('[data-interaction-enabled]')?.addEventListener('change',e=>patchInteraction(id,{enabled:e.target.checked}));
      card.querySelector('[data-attachment-kind]')?.addEventListener('change',e=>{const kind=e.target.value;let attachment={kind:'cell',x:0,y:0};if(kind==='door')attachment={kind:'door',targetId:layout.doors?.[0]?.id||null};if(kind==='interaction')attachment={kind:'interaction',targetId:layout.interactions.find(i=>i.kind==='chest'&&String(i.id)!==String(id))?.id||null};patchInteraction(id,{attachment});});
      card.querySelector('[data-interaction-target]')?.addEventListener('change',e=>{const kind=current.attachment?.kind||'cell';if(kind==='cell'){const [x,y]=e.target.value.split(',').map(Number);patchInteraction(id,{attachment:{kind:'cell',x,y}});}else patchInteraction(id,{attachment:{kind,targetId:e.target.value||null}});});
    });
    host.querySelectorAll('[data-delete-interaction]').forEach(b=>b.addEventListener('click',()=>{layout=removeRoomInteraction(layout,b.dataset.deleteInteraction);persist();}));
  }
  render();
}
