/* GenSrpG V16.78.21 — Dungeon / Zone Graph Builder, Phase 3.
   Assembles saved room templates into reusable dungeon graphs.
   Data model intentionally generic (zone graph) for future villages/biomes.
   Does not alter movement, combat, timeline, enemy spawn or runtime room generation. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="3.0.0";
const APP_VERSION="16.78.21";
const SCHEMA_VERSION=1;
const STORAGE_KEY="gensrpg_zone_graphs_v1";
const GRAPH_KIND="dungeon";
let activeId="";

function now(){return new Date().toISOString()}
function uid(prefix){return String(prefix||"zg")+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function arr(v){return Array.isArray(v)?v:[]}
function clone(v){return JSON.parse(JSON.stringify(v))}
function roomApi(){return ROOT.DungeonRoomCreator100||null}
function interApi(){return ROOT.DungeonRoomCreatorV2||null}
function roomLibrary(){return arr(roomApi()?.loadLibrary?.())}
function findRoom(id){return roomApi()?.findRoom?.(id)||null}

function readStore(){
  try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(raw)?raw:[]}
  catch(e){return []}
}
function writeStore(list){
  const clean=arr(list).map(normalizeGraph).filter(Boolean);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));
  return clean;
}
function normalizeNode(raw){
  if(!raw||typeof raw!=="object")return null;
  return {id:String(raw.id||uid("zone")),roomId:String(raw.roomId||""),label:String(raw.label||""),x:Number.isFinite(Number(raw.x))?Number(raw.x):0,y:Number.isFinite(Number(raw.y))?Number(raw.y):0,createdAt:String(raw.createdAt||now())};
}
function normalizeEdge(raw){
  if(!raw||typeof raw!=="object")return null;
  return {id:String(raw.id||uid("edge")),kind:String(raw.kind||"door"),fromNodeId:String(raw.fromNodeId||""),fromExitIndex:Math.max(0,Math.trunc(Number(raw.fromExitIndex)||0)),toNodeId:String(raw.toNodeId||""),toEntryIndex:Math.max(0,Math.trunc(Number(raw.toEntryIndex)||0)),createdAt:String(raw.createdAt||now())};
}
function normalizeCacheBinding(raw){
  if(!raw||typeof raw!=="object")return null;
  return {id:String(raw.id||uid("cachebind")),sourceNodeId:String(raw.sourceNodeId||""),sourceIndex:Math.max(0,Math.trunc(Number(raw.sourceIndex)||0)),targetNodeId:String(raw.targetNodeId||""),targetRoomId:String(raw.targetRoomId||"")};
}
function normalizeGraph(raw){
  if(!raw||typeof raw!=="object")return null;
  return {
    schema:SCHEMA_VERSION,
    id:String(raw.id||uid("dungeon")),
    kind:String(raw.kind||GRAPH_KIND),
    name:String(raw.name||"Nouveau donjon"),
    theme:String(raw.theme||"dungeon"),
    notes:String(raw.notes||""),
    startNodeId:String(raw.startNodeId||""),
    nodes:arr(raw.nodes).map(normalizeNode).filter(Boolean),
    edges:arr(raw.edges).map(normalizeEdge).filter(Boolean),
    cacheBindings:arr(raw.cacheBindings).map(normalizeCacheBinding).filter(Boolean),
    createdAt:String(raw.createdAt||now()),
    updatedAt:String(raw.updatedAt||now())
  };
}
function loadLibrary(){return readStore().map(normalizeGraph).filter(Boolean)}
function findDungeon(id){return loadLibrary().find(d=>d.id===String(id||""))||null}
function upsertDungeon(graph){
  const g=normalizeGraph(graph);if(!g)return null;
  g.updatedAt=now();
  const list=loadLibrary(),i=list.findIndex(x=>x.id===g.id);
  if(i>=0)list[i]=g;else list.unshift(g);
  writeStore(list);return clone(g);
}
function createDungeon(opts){
  const stamp=now();
  return upsertDungeon({schema:SCHEMA_VERSION,id:uid("dungeon"),kind:GRAPH_KIND,name:String(opts?.name||"Nouveau donjon"),theme:String(opts?.theme||"dungeon"),notes:"",startNodeId:"",nodes:[],edges:[],cacheBindings:[],createdAt:stamp,updatedAt:stamp});
}
function deleteDungeon(id){writeStore(loadLibrary().filter(d=>d.id!==String(id||"")));if(activeId===String(id||""))activeId=""}
function duplicateDungeon(id){
  const src=findDungeon(id);if(!src)return null;
  const copy=clone(src),map=new Map();
  copy.id=uid("dungeon");copy.name=src.name+" — copie";copy.createdAt=now();copy.updatedAt=copy.createdAt;
  copy.nodes=copy.nodes.map(n=>{const old=n.id,nn={...n,id:uid("zone"),createdAt:now()};map.set(old,nn.id);return nn});
  copy.startNodeId=map.get(src.startNodeId)||"";
  copy.edges=copy.edges.map(e=>({...e,id:uid("edge"),fromNodeId:map.get(e.fromNodeId)||"",toNodeId:map.get(e.toNodeId)||"",createdAt:now()})).filter(e=>e.fromNodeId&&e.toNodeId);
  copy.cacheBindings=copy.cacheBindings.map(b=>({...b,id:uid("cachebind"),sourceNodeId:map.get(b.sourceNodeId)||"",targetNodeId:map.get(b.targetNodeId)||""})).filter(b=>b.sourceNodeId);
  return upsertDungeon(copy);
}
function roomPorts(roomId){
  const room=findRoom(roomId),entries=[],exits=[];
  arr(room?.cells).forEach((c,i)=>{
    if(c?.object==="entry")entries.push({index:i,label:"Entrée · case "+(i+1)});
    if(c?.object==="exit")exits.push({index:i,label:"Sortie · case "+(i+1)});
  });
  return {entries,exits};
}
function nodeLabel(graph,node){
  const room=findRoom(node?.roomId);
  return String(node?.label||room?.name||"Pièce introuvable");
}
function addRoomInstance(dungeonId,roomId,label){
  const g=findDungeon(dungeonId);if(!g)throw new Error("Donjon introuvable");
  const room=findRoom(roomId);if(!room)throw new Error("Pièce introuvable dans la bibliothèque");
  const same=g.nodes.filter(n=>n.roomId===room.id).length;
  const node=normalizeNode({id:uid("zone"),roomId:room.id,label:String(label||room.name+(same?" #"+(same+1):"")),x:g.nodes.length,y:0});
  g.nodes.push(node);if(!g.startNodeId)g.startNodeId=node.id;
  return {node,dungeon:upsertDungeon(g)};
}
function removeRoomInstance(dungeonId,nodeId){
  const g=findDungeon(dungeonId);if(!g)throw new Error("Donjon introuvable");
  const id=String(nodeId||"");
  g.nodes=g.nodes.filter(n=>n.id!==id);
  g.edges=g.edges.filter(e=>e.fromNodeId!==id&&e.toNodeId!==id);
  g.cacheBindings=g.cacheBindings.filter(b=>b.sourceNodeId!==id&&b.targetNodeId!==id);
  if(g.startNodeId===id)g.startNodeId=g.nodes[0]?.id||"";
  return upsertDungeon(g);
}
function setStart(dungeonId,nodeId){
  const g=findDungeon(dungeonId);if(!g)throw new Error("Donjon introuvable");
  if(!g.nodes.some(n=>n.id===String(nodeId)))throw new Error("Pièce de départ invalide");
  g.startNodeId=String(nodeId);return upsertDungeon(g);
}
function connectRooms(dungeonId,data){
  const g=findDungeon(dungeonId);if(!g)throw new Error("Donjon introuvable");
  const from=g.nodes.find(n=>n.id===String(data?.fromNodeId||"")),to=g.nodes.find(n=>n.id===String(data?.toNodeId||""));
  if(!from||!to)throw new Error("Sélectionne deux pièces valides");
  if(from.id===to.id)throw new Error("Une connexion doit relier deux instances différentes");
  const fromExitIndex=Math.trunc(Number(data?.fromExitIndex)),toEntryIndex=Math.trunc(Number(data?.toEntryIndex));
  if(!roomPorts(from.roomId).exits.some(p=>p.index===fromExitIndex))throw new Error("La porte de sortie source n’existe plus");
  if(!roomPorts(to.roomId).entries.some(p=>p.index===toEntryIndex))throw new Error("La porte d’entrée cible n’existe plus");
  if(g.edges.some(e=>e.fromNodeId===from.id&&e.fromExitIndex===fromExitIndex))throw new Error("Cette sortie est déjà connectée");
  if(g.edges.some(e=>e.toNodeId===to.id&&e.toEntryIndex===toEntryIndex))throw new Error("Cette entrée est déjà utilisée");
  const edge=normalizeEdge({id:uid("edge"),kind:"door",fromNodeId:from.id,fromExitIndex,toNodeId:to.id,toEntryIndex});
  g.edges.push(edge);return {edge,dungeon:upsertDungeon(g)};
}
function removeConnection(dungeonId,edgeId){
  const g=findDungeon(dungeonId);if(!g)throw new Error("Donjon introuvable");
  g.edges=g.edges.filter(e=>e.id!==String(edgeId||""));return upsertDungeon(g);
}
function templateCacheLinks(roomId){
  const api=interApi();if(!api)return [];
  return arr(api.roomMeta?.(roomId)?.cacheLinks).filter(l=>l.targetRoomId);
}
function expectedCacheBindings(graph){
  const out=[];
  for(const node of arr(graph?.nodes)){
    for(const link of templateCacheLinks(node.roomId)){
      out.push({sourceNodeId:node.id,sourceIndex:Number(link.sourceIndex),targetRoomId:String(link.targetRoomId||"")});
    }
  }
  return out;
}
function bindCache(dungeonId,sourceNodeId,sourceIndex,targetNodeId){
  const g=findDungeon(dungeonId);if(!g)throw new Error("Donjon introuvable");
  const source=g.nodes.find(n=>n.id===String(sourceNodeId||""));if(!source)throw new Error("Pièce source introuvable");
  const expected=expectedCacheBindings(g).find(x=>x.sourceNodeId===source.id&&x.sourceIndex===Number(sourceIndex));if(!expected)throw new Error("Cette cache n’a plus de sous-pièce liée dans le modèle");
  const target=String(targetNodeId||"");
  if(target){
    const node=g.nodes.find(n=>n.id===target);if(!node)throw new Error("Sous-pièce cible introuvable");
    if(node.roomId!==expected.targetRoomId)throw new Error("La cible ne correspond pas à la sous-pièce configurée");
  }
  g.cacheBindings=g.cacheBindings.filter(b=>!(b.sourceNodeId===source.id&&b.sourceIndex===Number(sourceIndex)));
  if(target)g.cacheBindings.push(normalizeCacheBinding({sourceNodeId:source.id,sourceIndex:Number(sourceIndex),targetNodeId:target,targetRoomId:expected.targetRoomId}));
  return upsertDungeon(g);
}
function validation(graph){
  const g=normalizeGraph(graph),warnings=[],errors=[];
  const nodeIds=new Set(g.nodes.map(n=>n.id));
  if(!g.nodes.length)errors.push("Ajoute au moins une pièce.");
  if(g.nodes.length&&!nodeIds.has(g.startNodeId))errors.push("Choisis une pièce de départ.");
  for(const n of g.nodes)if(!findRoom(n.roomId))errors.push("Pièce modèle manquante : "+(n.label||n.roomId));
  for(const e of g.edges){
    if(!nodeIds.has(e.fromNodeId)||!nodeIds.has(e.toNodeId))errors.push("Une connexion pointe vers une pièce supprimée.");
  }
  if(g.startNodeId&&nodeIds.has(g.startNodeId)){
    const seen=new Set([g.startNodeId]),queue=[g.startNodeId];
    while(queue.length){
      const id=queue.shift();
      for(const e of g.edges){
        const other=e.fromNodeId===id?e.toNodeId:(e.toNodeId===id?e.fromNodeId:"");
        if(other&&!seen.has(other)){seen.add(other);queue.push(other)}
      }
    }
    const disconnected=g.nodes.filter(n=>!seen.has(n.id));
    if(disconnected.length)warnings.push(disconnected.length+" pièce(s) non reliée(s) au réseau principal.");
  }
  const expected=expectedCacheBindings(g);
  for(const x of expected){
    const binding=g.cacheBindings.find(b=>b.sourceNodeId===x.sourceNodeId&&b.sourceIndex===x.sourceIndex&&b.targetNodeId);
    const candidates=g.nodes.filter(n=>n.roomId===x.targetRoomId);
    if(!candidates.length)warnings.push("Sous-pièce requise absente : "+(findRoom(x.targetRoomId)?.name||x.targetRoomId));
    else if(!binding)warnings.push("Cache non affectée à une instance de sous-pièce.");
  }
  return {valid:errors.length===0,errors,warnings,nodeCount:g.nodes.length,edgeCount:g.edges.length,cacheCount:expected.length};
}
function runtimePackage(dungeonId){
  const g=findDungeon(dungeonId);if(!g)return null;
  return {
    kind:"gensrpg-zone-graph",
    schema:SCHEMA_VERSION,
    graph:clone(g),
    zones:g.nodes.map(n=>({instance:clone(n),room:clone(findRoom(n.roomId)),interactions:clone(interApi()?.roomMeta?.(n.roomId)||null)})),
    validation:validation(g)
  };
}

function ensureStyles(){
  if(!DOC||DOC.getElementById("drc300Styles"))return;
  const s=DOC.createElement("style");s.id="drc300Styles";s.textContent=`
#drc300Modal{display:none;position:fixed;inset:0;z-index:70000;background:#070707f4;color:#f2eee6;overflow:auto;padding:10px}
#drc300Modal.open{display:block}.drc300Shell{width:min(1200px,100%);margin:auto;background:#141414;border:1px solid #444;border-radius:16px;overflow:hidden}
.drc300Head{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;background:#171717;border-bottom:1px solid #383838}.drc300Head h2{margin:0;flex:1;font-size:20px}
.drc300Body{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:75vh}.drc300Side{padding:12px;background:#101010;border-right:1px solid #333}.drc300Main{padding:12px;min-width:0}
.drc300Library,.drc300Nodes,.drc300Edges,.drc300Caches{display:grid;gap:7px;margin-top:8px}.drc300Library{max-height:60vh;overflow:auto}
.drc300Card{border:1px solid #393939;background:#1b1b1b;border-radius:11px;padding:9px}.drc300Card.active{outline:2px solid #c89b4c}.drc300Card small{color:#aaa}
.drc300Actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.drc300Actions button{font-size:12px;padding:7px 8px}.drc300Primary{background:#72501d!important}.drc300Danger{background:#70201d!important}
.drc300Field{display:grid;gap:5px;margin:8px 0}.drc300Field label{font-size:12px;color:#bbb;font-weight:800}.drc300Field input,.drc300Field select,.drc300Field textarea{width:100%;background:#0b0b0b;color:white;border:1px solid #444;border-radius:9px;padding:9px}
.drc300Grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.drc300Section{border:1px solid #3b352c;border-radius:12px;padding:10px;margin-top:12px;background:#12100d}.drc300Section h3{margin:0 0 7px;font-size:16px}
.drc300Status{padding:9px;border:1px solid #355d42;background:#132018;color:#bde5c7;border-radius:9px;margin:8px 0;font-size:12px;font-weight:800}.drc300Warn{border-color:#7a5627;background:#241b10;color:#efc178}
.drc300Graph{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.drc300Node{min-width:150px;border:1px solid #444;border-radius:10px;padding:8px;background:#1a1a1a}.drc300Node.start{outline:2px solid #c89b4c}.drc300Arrow{color:#c89b4c;font-size:18px}
@media(max-width:760px){#drc300Modal{padding:0}.drc300Shell{border-radius:0;min-height:100vh}.drc300Body{grid-template-columns:1fr}.drc300Side{border-right:0;border-bottom:1px solid #333}.drc300Library{max-height:190px}.drc300Grid2{grid-template-columns:1fr}.drc300Head h2{font-size:17px}}
`;DOC.head.appendChild(s);
}
function ensureLauncher(){
  if(!DOC)return;
  const old=DOC.getElementById("drc100Launcher");
  if(old&&!DOC.getElementById("drc300Launch")){
    const btn=DOC.createElement("button");btn.id="drc300Launch";btn.type="button";btn.className="drc100Launch";btn.style.marginTop="6px";btn.textContent="🏰 CONSTRUIRE UN DONJON";btn.onclick=open;old.appendChild(btn);
  }
  const head=DOC.querySelector("#drc100Modal .drc100Head");
  if(head&&!DOC.getElementById("drc300FromRoomCreator")){
    const btn=DOC.createElement("button");btn.id="drc300FromRoomCreator";btn.type="button";btn.textContent="🏰 Donjons";btn.onclick=open;head.appendChild(btn);
  }
}
function ensureModal(){
  if(!DOC||DOC.getElementById("drc300Modal"))return;
  const m=DOC.createElement("div");m.id="drc300Modal";m.innerHTML=`
<div class="drc300Shell">
 <div class="drc300Head"><button type="button" id="drc300Close">← Retour</button><h2>🏰 Constructeur de donjon — Phase 3</h2><span>V${APP_VERSION}</span></div>
 <div class="drc300Body">
  <aside class="drc300Side">
   <button type="button" id="drc300New" class="drc300Primary">➕ Nouveau donjon</button>
   <div class="drc300Field"><label>Donjons enregistrés</label><div id="drc300Library" class="drc300Library"></div></div>
  </aside>
  <main class="drc300Main">
   <div id="drc300Empty" class="drc300Status drc300Warn">Crée ou sélectionne un donjon.</div>
   <div id="drc300Editor" style="display:none">
    <div class="drc300Grid2"><div class="drc300Field"><label>Nom du donjon</label><input id="drc300Name" maxlength="100"></div><div class="drc300Field"><label>Type de structure</label><select id="drc300Kind"><option value="dungeon">Donjon</option></select></div></div>
    <div class="drc300Field"><label>Notes</label><textarea id="drc300Notes" placeholder="Objectif, ambiance, règles spéciales..."></textarea></div>
    <div class="drc300Actions"><button type="button" id="drc300Save" class="drc300Primary">💾 Enregistrer le donjon</button><button type="button" id="drc300Duplicate">⧉ Dupliquer</button><button type="button" id="drc300Delete" class="drc300Danger">🗑 Supprimer</button></div>
    <div id="drc300Autosave" class="drc300Status">✅ Sauvegarde automatique active pour les pièces et connexions.</div>
    <div class="drc300Section"><h3>1. Pièces du donjon</h3><div class="drc300Grid2"><select id="drc300RoomTemplate"></select><button type="button" id="drc300AddRoom">➕ Ajouter cette pièce</button></div><div id="drc300Nodes" class="drc300Nodes"></div></div>
    <div class="drc300Section"><h3>2. Connexions porte → porte</h3><div class="drc300Grid2"><select id="drc300FromNode"></select><select id="drc300FromExit"></select><select id="drc300ToNode"></select><select id="drc300ToEntry"></select></div><button type="button" id="drc300Connect" style="margin-top:7px">🔗 Relier les pièces</button><div id="drc300Edges" class="drc300Edges"></div></div>
    <div class="drc300Section"><h3>3. Caches → sous-pièces</h3><div style="font-size:12px;color:#aaa">Les liaisons définies dans le Créateur V2 sont reprises ici et affectées à une instance précise du donjon.</div><div id="drc300Caches" class="drc300Caches"></div></div>
    <div class="drc300Section"><h3>Vue du réseau</h3><div id="drc300Graph" class="drc300Graph"></div></div>
    <div id="drc300Validation" class="drc300Status"></div>
   </div>
  </main>
 </div>
</div>`;DOC.body.appendChild(m);
  DOC.getElementById("drc300Close").onclick=close;
  DOC.getElementById("drc300New").onclick=newDungeonUI;
  DOC.getElementById("drc300Save").onclick=saveMetaUI;
  DOC.getElementById("drc300Duplicate").onclick=duplicateUI;
  DOC.getElementById("drc300Delete").onclick=deleteUI;
  DOC.getElementById("drc300AddRoom").onclick=addRoomUI;
  DOC.getElementById("drc300Connect").onclick=connectUI;
  DOC.getElementById("drc300FromNode").onchange=renderPortSelectors;
  DOC.getElementById("drc300ToNode").onchange=renderPortSelectors;
}
function current(){return activeId?findDungeon(activeId):null}
function autosave(text){
  const box=DOC?.getElementById("drc300Autosave");if(!box)return;
  const t=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  box.textContent="✅ "+text+" — enregistré automatiquement à "+t;
}
function renderLibrary(){
  const box=DOC?.getElementById("drc300Library");if(!box)return;
  const list=loadLibrary();
  box.innerHTML=list.length?list.map(d=>'<div class="drc300Card '+(d.id===activeId?'active':'')+'"><b>'+esc(d.name)+'</b><small>'+d.nodes.length+' pièce(s) · '+d.edges.length+' connexion(s)</small><div class="drc300Actions"><button type="button" data-open="'+esc(d.id)+'">Ouvrir</button></div></div>').join(""):'<div style="color:#999;font-size:12px">Aucun donjon enregistré.</div>';
  box.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{activeId=b.dataset.open;renderAll()});
}
function renderTemplateSelect(){
  const sel=DOC?.getElementById("drc300RoomTemplate");if(!sel)return;
  const rooms=roomLibrary();
  sel.innerHTML=rooms.length?rooms.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+' · '+esc(r.roomType)+'</option>').join(""):'<option value="">Aucune pièce enregistrée</option>';
}
function renderNodes(g){
  const box=DOC?.getElementById("drc300Nodes");if(!box)return;
  box.innerHTML=g.nodes.length?g.nodes.map(n=>{
    const room=findRoom(n.roomId),ports=roomPorts(n.roomId);
    return '<div class="drc300Card"><b>'+(g.startNodeId===n.id?'⭐ ':'')+esc(nodeLabel(g,n))+'</b><small>Modèle : '+esc(room?.name||"introuvable")+' · '+ports.entries.length+' entrée(s) · '+ports.exits.length+' sortie(s)</small><div class="drc300Actions"><button type="button" data-start="'+esc(n.id)+'">⭐ Départ</button><button type="button" data-remove-node="'+esc(n.id)+'">Retirer</button></div></div>';
  }).join(""):'<div style="color:#999;font-size:12px">Ajoute des pièces depuis ta bibliothèque.</div>';
  box.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>{setStart(g.id,b.dataset.start);autosave("Pièce de départ modifiée");renderAll()});
  box.querySelectorAll("[data-remove-node]").forEach(b=>b.onclick=()=>{removeRoomInstance(g.id,b.dataset.removeNode);autosave("Pièce retirée");renderAll()});
}
function nodeOptions(g,selected){return g.nodes.map(n=>'<option value="'+esc(n.id)+'" '+(n.id===selected?'selected':'')+'>'+esc(nodeLabel(g,n))+'</option>').join("")}
function renderConnectionSelectors(g){
  const from=DOC.getElementById("drc300FromNode"),to=DOC.getElementById("drc300ToNode");
  const oldFrom=from.value,oldTo=to.value;
  from.innerHTML=nodeOptions(g,oldFrom);to.innerHTML=nodeOptions(g,oldTo||g.nodes[1]?.id||"");
  renderPortSelectors();
}
function renderPortSelectors(){
  const g=current();if(!g||!DOC)return;
  const fromNode=g.nodes.find(n=>n.id===DOC.getElementById("drc300FromNode")?.value),toNode=g.nodes.find(n=>n.id===DOC.getElementById("drc300ToNode")?.value);
  const out=DOC.getElementById("drc300FromExit"),inn=DOC.getElementById("drc300ToEntry");
  const exits=roomPorts(fromNode?.roomId).exits,entries=roomPorts(toNode?.roomId).entries;
  out.innerHTML=exits.length?exits.map(p=>'<option value="'+p.index+'">'+esc(p.label)+'</option>').join(""):'<option value="">Aucune sortie</option>';
  inn.innerHTML=entries.length?entries.map(p=>'<option value="'+p.index+'">'+esc(p.label)+'</option>').join(""):'<option value="">Aucune entrée</option>';
}
function renderEdges(g){
  const box=DOC?.getElementById("drc300Edges");if(!box)return;
  box.innerHTML=g.edges.length?g.edges.map(e=>{
    const a=g.nodes.find(n=>n.id===e.fromNodeId),b=g.nodes.find(n=>n.id===e.toNodeId);
    return '<div class="drc300Card"><b>'+esc(nodeLabel(g,a))+' → '+esc(nodeLabel(g,b))+'</b><small>Sortie case '+(e.fromExitIndex+1)+' → entrée case '+(e.toEntryIndex+1)+'</small><div class="drc300Actions"><button type="button" data-remove-edge="'+esc(e.id)+'">Supprimer la connexion</button></div></div>';
  }).join(""):'<div style="color:#999;font-size:12px">Aucune connexion.</div>';
  box.querySelectorAll("[data-remove-edge]").forEach(b=>b.onclick=()=>{removeConnection(g.id,b.dataset.removeEdge);autosave("Connexion supprimée");renderAll()});
}
function renderCaches(g){
  const box=DOC?.getElementById("drc300Caches");if(!box)return;
  const expected=expectedCacheBindings(g);
  if(!expected.length){box.innerHTML='<div style="color:#999;font-size:12px">Aucune cache liée à une sous-pièce dans les salles utilisées.</div>';return}
  box.innerHTML=expected.map((x,i)=>{
    const source=g.nodes.find(n=>n.id===x.sourceNodeId),targetRoom=findRoom(x.targetRoomId),binding=g.cacheBindings.find(b=>b.sourceNodeId===x.sourceNodeId&&b.sourceIndex===x.sourceIndex);
    const candidates=g.nodes.filter(n=>n.roomId===x.targetRoomId);
    const opts=['<option value="">— sélectionner une instance —</option>'].concat(candidates.map(n=>'<option value="'+esc(n.id)+'" '+(binding?.targetNodeId===n.id?'selected':'')+'>'+esc(nodeLabel(g,n))+'</option>')).join("");
    return '<div class="drc300Card"><b>🕳️ '+esc(nodeLabel(g,source))+' · cache case '+(x.sourceIndex+1)+'</b><small>Doit mener vers : '+esc(targetRoom?.name||x.targetRoomId)+'</small><div class="drc300Actions"><select data-cache-select="'+i+'" style="flex:1">'+opts+'</select><button type="button" data-cache-bind="'+i+'">🔗 Affecter</button></div></div>';
  }).join("");
  box.querySelectorAll("[data-cache-bind]").forEach(btn=>btn.onclick=()=>{
    const i=Number(btn.dataset.cacheBind),x=expected[i],sel=box.querySelector('[data-cache-select="'+i+'"]');
    bindCache(g.id,x.sourceNodeId,x.sourceIndex,sel?.value||"");autosave("Liaison de sous-pièce mise à jour");renderAll();
  });
}
function renderGraph(g){
  const box=DOC?.getElementById("drc300Graph");if(!box)return;
  if(!g.nodes.length){box.innerHTML='<span style="color:#999">Réseau vide.</span>';return}
  box.innerHTML=g.nodes.map(n=>{
    const outgoing=g.edges.filter(e=>e.fromNodeId===n.id).map(e=>g.nodes.find(x=>x.id===e.toNodeId)).filter(Boolean);
    return '<div class="drc300Node '+(g.startNodeId===n.id?'start':'')+'"><b>'+(g.startNodeId===n.id?'⭐ ':'')+esc(nodeLabel(g,n))+'</b><div style="font-size:11px;color:#aaa">'+(outgoing.length?'→ '+outgoing.map(x=>esc(nodeLabel(g,x))).join(", "):"aucune sortie reliée")+'</div></div>';
  }).join('<span class="drc300Arrow">·</span>');
}
function renderValidation(g){
  const v=validation(g),box=DOC?.getElementById("drc300Validation");if(!box)return;
  box.className="drc300Status"+((v.errors.length||v.warnings.length)?" drc300Warn":"");
  box.innerHTML='<b>'+(v.valid?'Structure enregistrable':'Structure incomplète')+'</b> · '+v.nodeCount+' pièce(s) · '+v.edgeCount+' connexion(s) · '+v.cacheCount+' cache(s) liée(s)'+(v.errors.length?'<br>❌ '+v.errors.map(esc).join("<br>❌ "):"")+(v.warnings.length?'<br>⚠️ '+v.warnings.map(esc).join("<br>⚠️ "):"");
}
function renderAll(){
  ensureStyles();ensureLauncher();ensureModal();renderLibrary();renderTemplateSelect();
  const g=current(),editor=DOC.getElementById("drc300Editor"),empty=DOC.getElementById("drc300Empty");
  editor.style.display=g?"block":"none";empty.style.display=g?"none":"block";if(!g)return;
  DOC.getElementById("drc300Name").value=g.name;DOC.getElementById("drc300Notes").value=g.notes;
  renderNodes(g);renderConnectionSelectors(g);renderEdges(g);renderCaches(g);renderGraph(g);renderValidation(g);
}
function open(){ensureStyles();ensureLauncher();ensureModal();DOC.getElementById("drc300Modal")?.classList.add("open");if(!activeId)activeId=loadLibrary()[0]?.id||"";renderAll()}
function close(){DOC?.getElementById("drc300Modal")?.classList.remove("open")}
function newDungeonUI(){const d=createDungeon({name:"Nouveau donjon"});activeId=d.id;renderAll();autosave("Nouveau donjon créé")}
function saveMetaUI(){const g=current();if(!g)return;g.name=String(DOC.getElementById("drc300Name")?.value||"Nouveau donjon").trim()||"Nouveau donjon";g.notes=String(DOC.getElementById("drc300Notes")?.value||"");upsertDungeon(g);autosave("Donjon");renderAll()}
function duplicateUI(){const g=current();if(!g)return;const copy=duplicateDungeon(g.id);if(copy){activeId=copy.id;renderAll();autosave("Copie du donjon créée")}}
function deleteUI(){const g=current();if(!g)return;if(typeof confirm==="function"&&!confirm("Supprimer définitivement « "+g.name+" » ?"))return;deleteDungeon(g.id);activeId=loadLibrary()[0]?.id||"";renderAll()}
function addRoomUI(){const g=current();if(!g)return;const roomId=String(DOC.getElementById("drc300RoomTemplate")?.value||"");try{addRoomInstance(g.id,roomId);autosave("Pièce ajoutée");renderAll()}catch(e){if(typeof alert==="function")alert(e.message)}}
function connectUI(){const g=current();if(!g)return;try{connectRooms(g.id,{fromNodeId:DOC.getElementById("drc300FromNode")?.value,fromExitIndex:DOC.getElementById("drc300FromExit")?.value,toNodeId:DOC.getElementById("drc300ToNode")?.value,toEntryIndex:DOC.getElementById("drc300ToEntry")?.value});autosave("Connexion ajoutée");renderAll()}catch(e){if(typeof alert==="function")alert(e.message)}}
function install(){try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}ensureStyles();ensureLauncher();ensureModal();renderLibrary()}
ROOT.DungeonWorldBuilder167821={VERSION,APP_VERSION,SCHEMA_VERSION,STORAGE_KEY,GRAPH_KIND,normalizeGraph,loadLibrary,findDungeon,upsertDungeon,createDungeon,deleteDungeon,duplicateDungeon,roomPorts,addRoomInstance,removeRoomInstance,setStart,connectRooms,removeConnection,expectedCacheBindings,bindCache,validation,runtimePackage,open,close,install};
if(DOC){
  if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install();
  if(typeof MutationObserver==="function")new MutationObserver(()=>{ensureLauncher();ensureModal()}).observe(DOC.documentElement,{childList:true,subtree:true});
}
})();
