import { readJson, writeJson, cloneData } from '../../core/storage.js';
import { loadWorldDraft } from './world-editor.js';
import { createRoomLayout, getRoomCell, setRoomCell, createWall, addWall, createDoor, addDoor, createMarker, addMarker, resizeRoomLayout, validateRoomLayout } from './room-engine.js';

const LAYOUT_KEY='rpg_room_layout';
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cellKey(x,y){return `${x},${y}`;}

export function loadRoomLayout(room){
  if(!room) return null;
  const saved=readJson(LAYOUT_KEY,String(room.id),null);
  return saved||createRoomLayout({roomId:room.id,name:room.name,width:8,height:8});
}
export function saveRoomLayout(layout){if(!layout?.roomId) return false;return writeJson(LAYOUT_KEY,String(layout.roomId),layout);}

function roomOptions(rooms,selected){return rooms.map(r=>`<option value="${esc(r.id)}" ${String(r.id)===String(selected||'')?'selected':''}>${esc(r.name)}</option>`).join('');}
function iconFor(layout,x,y){
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
  return next;
}

export function mountRoomEditor(host){
  const world=loadWorldDraft();
  if(!world.rooms.length){host.innerHTML='<section class="panel"><h2>Créateur de salle</h2><p>Crée d’abord une salle dans le World Builder.</p></section>';return;}
  let selectedRoomId=world.rooms[0].id;
  let layout=loadRoomLayout(world.rooms[0]);
  let tool='floor';
  let edge='north';

  function persist(){saveRoomLayout(layout);render();}
  function selectRoom(id){selectedRoomId=id;const room=world.rooms.find(r=>String(r.id)===String(id));layout=loadRoomLayout(room);render();}
  function applyTool(x,y){
    let out;
    if(tool==='floor') out=setRoomCell(removeAt(layout,x,y,{cell:true}),x,y,{terrain:'floor',blocked:false});
    else if(tool==='blocked') out=setRoomCell(layout,x,y,{terrain:'floor',blocked:true});
    else if(['water','lava','rock'].includes(tool)) out=setRoomCell(layout,x,y,{terrain:tool,blocked:tool==='rock'});
    else if(tool==='wall') {layout=removeAt(layout,x,y,{doors:true});out=addWall(layout,createWall({x,y,edge}));}
    else if(tool==='door'||tool==='entry'||tool==='exit') {layout=removeAt(layout,x,y,{walls:true,doors:true});out=addDoor(layout,createDoor({x,y,edge,entry:tool==='entry',exit:tool==='exit'}));}
    else if(tool==='special') {layout=removeAt(layout,x,y,{markers:true});out=addMarker(layout,createMarker({x,y,kind:'special',label:'Interaction'}));}
    else if(tool==='erase') {layout=removeAt(layout,x,y,{all:true});persist();return;}
    if(out?.ok) layout=out.layout;
    persist();
  }

  function render(){
    const room=world.rooms.find(r=>String(r.id)===String(selectedRoomId))||world.rooms[0];
    const validation=validateRoomLayout(layout);
    const cells=[];
    for(let y=0;y<layout.height;y++) for(let x=0;x<layout.width;x++) cells.push(`<button type="button" class="room-cell ${terrainClass(layout,x,y)}" data-cell-x="${x}" data-cell-y="${y}" aria-label="Case ${x+1}, ${y+1}"><span>${iconFor(layout,x,y)}</span><small>${x+1},${y+1}</small></button>`);
    host.innerHTML=`<section class="workspace-head"><div><p class="eyebrow">RPG · CRÉATEUR DE SALLE</p><h2>${esc(room.name)}</h2><p class="muted">Peins la grille avec les outils. Les murs, portes, entrées et sorties restent des objets structurés, pas de simples images.</p></div><button class="help-button" type="button" data-help="rpg-room-builder">?</button></section>
      <section class="editor-section"><div class="form-grid"><label>Salle<select id="roomLayoutSelect">${roomOptions(world.rooms,selectedRoomId)}</select></label><label>Orientation mur / porte<select id="roomEdge"><option value="north" ${edge==='north'?'selected':''}>Nord</option><option value="east" ${edge==='east'?'selected':''}>Est</option><option value="south" ${edge==='south'?'selected':''}>Sud</option><option value="west" ${edge==='west'?'selected':''}>Ouest</option></select></label><label>Largeur<input id="roomWidth" type="number" min="1" max="100" value="${layout.width}"></label><label>Hauteur<input id="roomHeight" type="number" min="1" max="100" value="${layout.height}"></label></div><p class="muted">${validation.valid?'✅ Grille valide':`⚠️ ${validation.errors.length} problème(s)`}</p></section>
      <section class="editor-section"><div class="section-title-row"><div><h3>Outils</h3><p class="muted">Choisis un outil puis touche une case.</p></div></div><div class="room-tools">${[['floor','⬜ Sol'],['blocked','⛔ Bloqué'],['water','💧 Eau'],['lava','🌋 Lave'],['rock','🪨 Rocher'],['wall','🧱 Mur'],['door','🚪 Porte'],['entry','⬅️ Entrée'],['exit','➡️ Sortie'],['special','⭐ Interaction'],['erase','🧽 Effacer']].map(([id,label])=>`<button type="button" class="secondary-button ${tool===id?'active-tool':''}" data-room-tool="${id}">${label}</button>`).join('')}</div></section>
      <section class="editor-section room-grid-wrap"><div class="room-grid" style="--room-cols:${layout.width}">${cells.join('')}</div></section>`;

    host.querySelector('#roomLayoutSelect')?.addEventListener('change',e=>selectRoom(e.target.value));
    host.querySelector('#roomEdge')?.addEventListener('change',e=>{edge=e.target.value;render();});
    const resize=()=>{layout=resizeRoomLayout(layout,{width:Number(host.querySelector('#roomWidth')?.value),height:Number(host.querySelector('#roomHeight')?.value)});persist();};
    host.querySelector('#roomWidth')?.addEventListener('change',resize); host.querySelector('#roomHeight')?.addEventListener('change',resize);
    host.querySelectorAll('[data-room-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.roomTool;render();}));
    host.querySelectorAll('[data-cell-x]').forEach(b=>b.addEventListener('click',()=>applyTool(Number(b.dataset.cellX),Number(b.dataset.cellY))));
  }
  render();
}
