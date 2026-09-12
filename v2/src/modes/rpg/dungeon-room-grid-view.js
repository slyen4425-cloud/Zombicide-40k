function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function list(source,key){return Array.isArray(source?.[key])?source[key]:Object.values(source?.[key]||{});}
function posKey(x,y){return `${Number(x)},${Number(y)}`;}
function inside(width,height,x,y){return Number.isInteger(Number(x))&&Number.isInteger(Number(y))&&Number(x)>=0&&Number(y)>=0&&Number(x)<width&&Number(y)<height;}
function actorPosition(spatial,id){const pos=spatial?.positions?.[String(id)]||null;return pos&&Number.isFinite(Number(pos.x))&&Number.isFinite(Number(pos.y))?{x:Number(pos.x),y:Number(pos.y),zoneId:pos.zoneId??spatial?.zoneId??null}:null;}
function heroDef(universe,id){return list(universe,'heroes').find(hero=>String(hero?.id)===String(id))||null;}
function creatureDef(universe,id){return list(universe,'bestiary').find(creature=>String(creature?.id)===String(id))||null;}
function terrainIcon(terrain){if(terrain==='water') return '💧';if(terrain==='lava') return '🌋';if(terrain==='rock') return '🪨';return '';}
function cellClass(cell={}){return `dungeon-board-cell terrain-${esc(cell.terrain||'floor')}${cell.blocked?' blocked':''}`;}

export function buildDungeonRoomGridModel({universe={},roomRuntime=null,roomLayout=null,spatial=null}={}){
  const roomId=roomRuntime?.currentRoomId?String(roomRuntime.currentRoomId):null;
  if(!roomId||!roomLayout) return {ok:false,reason:'dungeon-grid-room-missing',roomId,width:0,height:0,cells:[],actors:[]};
  const width=Math.max(1,Math.min(100,Math.floor(Number(roomLayout.width)||8)));
  const height=Math.max(1,Math.min(100,Math.floor(Number(roomLayout.height)||8)));
  const activeSpatial=spatial||roomRuntime?.spatial||null;
  const actors=[];

  for(const location of Object.values(roomRuntime?.heroLocations||{})){
    if(String(location?.roomId)!==roomId) continue;
    const id=String(location.heroId||'');
    if(!id) continue;
    const pos=actorPosition(activeSpatial,id);
    if(!pos||!inside(width,height,pos.x,pos.y)) continue;
    const def=heroDef(universe,id);
    actors.push({id,side:'hero',x:pos.x,y:pos.y,icon:def?.icon||'🧙',name:def?.name||id,focused:String(roomRuntime?.focusedHeroId||'')===id});
  }

  for(const entity of roomRuntime?.rooms?.[roomId]?.entities||[]){
    const runtime=entity?.kind==='creature'?entity?.data?.creatureRuntime:null;
    if(!runtime||runtime.removed||runtime.defeated||runtime.active===false||entity.active===false) continue;
    const id=String(runtime.instanceId||entity.id||'');
    const pos=actorPosition(activeSpatial,id)||((Number.isFinite(Number(entity.x))&&Number.isFinite(Number(entity.y)))?{x:Number(entity.x),y:Number(entity.y)}:null);
    if(!id||!pos||!inside(width,height,pos.x,pos.y)) continue;
    const def=creatureDef(universe,runtime.creatureId);
    actors.push({id,side:'enemy',x:pos.x,y:pos.y,icon:def?.icon||'👹',name:def?.name||runtime.name||runtime.creatureId||'Ennemi',focused:false});
  }

  const actorMap=new Map();
  for(const actor of actors){const key=posKey(actor.x,actor.y);const bucket=actorMap.get(key)||[];bucket.push(actor);actorMap.set(key,bucket);}
  const doors=new Map((roomLayout.doors||[]).map(door=>[posKey(door.x,door.y),door]));
  const markers=new Map((roomLayout.markers||[]).map(marker=>[posKey(marker.x,marker.y),marker]));
  const interactions=new Map((roomLayout.interactions||[]).filter(item=>item?.enabled!==false&&item?.attachment?.kind==='cell').map(item=>[posKey(item.attachment.x,item.attachment.y),item]));
  const walls=new Map();
  for(const wall of roomLayout.walls||[]){const key=posKey(wall.x,wall.y);const bucket=walls.get(key)||[];bucket.push(wall);walls.set(key,bucket);}
  const cells=[];
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const key=posKey(x,y);
    const cell=roomLayout.cells?.[key]||{x,y,terrain:'floor',blocked:false};
    cells.push({x,y,cell,door:doors.get(key)||null,marker:markers.get(key)||null,interaction:interactions.get(key)||null,walls:walls.get(key)||[],actors:actorMap.get(key)||[]});
  }
  return {ok:true,roomId,width,height,cells,actors};
}

function worldIcon(entry){
  if(entry.interaction){const icons={chest:'📦',trap:'⚠️',puzzle:'🧩',event:'❗',switch:'🔘',portal:'🌀',object:'⭐'};return icons[entry.interaction.kind]||'⭐';}
  if(entry.door?.entry) return '🚪⬅️';
  if(entry.door?.exit) return '🚪➡️';
  if(entry.door) return entry.door.locked?'🔒':'🚪';
  if(entry.marker) return entry.marker.kind==='special'?'⭐':'📍';
  if(entry.walls?.length) return entry.walls.some(w=>w.kind==='low-wall')?'🛡️':'🧱';
  if(entry.cell?.blocked) return '⛔';
  return terrainIcon(entry.cell?.terrain);
}

export function renderDungeonRoomGrid(options={}){
  const model=buildDungeonRoomGridModel(options);
  if(!model.ok) return '';
  const cells=model.cells.map(entry=>{
    const actors=entry.actors.map(actor=>`<span class="dungeon-board-pawn ${actor.side==='hero'?'hero':'enemy'}${actor.focused?' focused':''}" data-dungeon-board-actor="${esc(actor.id)}" title="${esc(actor.name)}" aria-label="${esc(actor.name)}">${esc(actor.icon)}</span>`).join('');
    const world=worldIcon(entry);
    return `<div class="${cellClass(entry.cell)}" data-dungeon-board-cell="${entry.x},${entry.y}" aria-label="Case ${entry.x+1}, ${entry.y+1}">${world?`<span class="dungeon-board-world">${world}</span>`:''}${actors}<small>${entry.x+1},${entry.y+1}</small></div>`;
  }).join('');
  const actorSummary=model.actors.length?model.actors.map(actor=>`${actor.icon} ${esc(actor.name)} · ${actor.x+1},${actor.y+1}`).join(' &nbsp; '):'Aucun pion positionné dans cette salle.';
  return `<section class="editor-section dungeon-board-section"><div class="section-title-row"><div><h3>🗺️ Salle</h3><p class="muted">Vue du plateau en lecture seule. Les pions reflètent uniquement les positions fournies par le runtime spatial.</p></div></div><div class="dungeon-board-wrap"><div class="dungeon-board" style="--dungeon-cols:${model.width}" role="grid" aria-label="Grille de la salle">${cells}</div></div><p class="dungeon-board-legend">${actorSummary}</p></section>`;
}
