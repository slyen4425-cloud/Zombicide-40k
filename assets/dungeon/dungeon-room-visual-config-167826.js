/* GenSrpG V16.78.26 — reliable visual exact-content configuration from Room Creator.
   Mobile hotfix: direct per-cell pointer handlers replace the fragile document-level interceptor.
   Exact content remains attached to a World Builder zone instance, not to the reusable room template. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.26";
const GRAPH_KEY="gensrpg_zone_graphs_v1";
const CONFIGURABLE=new Set(["enemy","boss","chest","trap","puzzle"]);
const ENEMIES=[
 ["dng_skeleton","Squelette"],["dng_skeleton_archer","Squelette archer"],["dng_skeleton_guard","Squelette garde"],["dng_ghoul","Goule"],["dng_wraith","Spectre"],["dng_lich","Liche"],
 ["dng_goblin","Gobelin"],["dng_goblin_archer","Gobelin archer"],["dng_goblin_shaman","Gobelin chaman"],["dng_orc","Orc"],["dng_orc_berserker","Orc berserker"],["dng_orc_shaman","Orc chaman"],
 ["dng_spider","Araignée"],["dng_direwolf","Loup sinistre"],["dng_harpy","Harpie"],["dng_troll","Troll"],["dng_golem","Golem"],["dng_minotaur","Minotaure"],["dng_wyvern","Wyverne"],["dng_necromancer","Nécromancien"]
];
let currentRoomId="",selectedDungeonId="",selectedNodeId="",visualMode=false,activeCell=-1,activeObject="",installed=false;
function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function uid(prefix){return String(prefix||"vc")+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function readJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v}catch(e){return fallback}}
function roomApi(){return ROOT.DungeonRoomCreator100||null}
function zoneApi(){return ROOT.DungeonZoneContent167824||null}
function readGraphs(){const v=readJson(GRAPH_KEY,[]);return Array.isArray(v)?v:[]}
function roomById(id){return roomApi()?.findRoom?.(String(id||""))||null}
function inferRoom(){
  if(currentRoomId&&roomById(currentRoomId))return currentRoomId;
  if(!DOC)return "";
  const name=String(DOC.getElementById("drc100Name")?.value||"").trim();
  const w=Number(DOC.getElementById("drc100Width")?.value),h=Number(DOC.getElementById("drc100Height")?.value);
  const hits=(roomApi()?.loadLibrary?.()||[]).filter(r=>(!name||String(r.name||"")===name)&&(!w||Number(r.width)===w)&&(!h||Number(r.height)===h)).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));
  currentRoomId=String(hits[0]?.id||"");return currentRoomId;
}
function contextsForRoom(roomId){
  const id=String(roomId||""),out=[];
  for(const g of readGraphs())for(const n of Array.isArray(g?.nodes)?g.nodes:[])if(String(n.roomId||"")===id)out.push({dungeonId:String(g.id||""),dungeonName:String(g.name||"Monde"),nodeId:String(n.id||""),nodeLabel:String(n.label||roomById(id)?.name||"Zone")});
  return out;
}
function contextKey(c){return c?c.dungeonId+"::"+c.nodeId:""}
function currentContext(){
  const list=contextsForRoom(inferRoom());
  let c=list.find(x=>x.dungeonId===selectedDungeonId&&x.nodeId===selectedNodeId)||null;
  if(!c&&list.length===1)c=list[0];
  if(c){selectedDungeonId=c.dungeonId;selectedNodeId=c.nodeId}
  return c;
}
function emptyContent(){return {mode:"inherit",enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]}}
function getContent(d,n){return zoneApi()?.getZoneContent?.(d,n)||emptyContent()}
function saveContent(d,n,c){const api=zoneApi();if(!api?.saveZoneContent)throw new Error("Le module de contenu exact n'est pas chargé.");return api.saveZoneContent(d,n,c)}
function listForObject(content,obj){if(obj==="enemy"||obj==="boss")return content.enemies||[];if(obj==="chest")return content.chests||[];if(obj==="trap")return content.traps||[];if(obj==="puzzle")return content.puzzles||[];return []}
function specAt(content,obj,cell){return listForObject(content,obj).find(x=>Number(x.cell)===Number(cell)&&((obj==="boss")?String(x.role||"enemy")==="boss":obj==="enemy"?String(x.role||"enemy")!=="boss":true))||null}
function setList(content,obj,next){if(obj==="enemy"||obj==="boss")content.enemies=next;else if(obj==="chest")content.chests=next;else if(obj==="trap")content.traps=next;else if(obj==="puzzle")content.puzzles=next}
function parseItems(text){if(zoneApi()?.parseRewardItems)return zoneApi().parseRewardItems(text);const out=[];for(const part of String(text||"").split(/[\n,;]+/)){const s=part.trim();if(!s)continue;const m=s.match(/^(.+?)(?:\s*[x×*]\s*(\d+))?$/i);const itemId=String(m?.[1]||"").trim(),qty=Math.max(1,Math.trunc(Number(m?.[2])||1));if(itemId)out.push({itemId,qty})}return out}
function itemsText(items){if(zoneApi()?.rewardItemsText)return zoneApi().rewardItemsText(items);return (Array.isArray(items)?items:[]).map(x=>String(x.itemId||x.id||"")+(Number(x.qty||1)>1?" × "+Number(x.qty||1):"")).join("\n")}
function configureElement(dungeonId,nodeId,roomId,cell,obj,data){
  const room=roomById(roomId),idx=Math.trunc(Number(cell));
  if(!room||!CONFIGURABLE.has(String(obj))||idx<0||idx>=room.cells.length||String(room.cells[idx]?.object||"")!==String(obj))throw new Error("Cet élément n’existe plus sur cette case.");
  const content=clone(getContent(dungeonId,nodeId));if(content.mode==="inherit")content.mode="fixed";
  const list=listForObject(content,obj).filter(x=>!(Number(x.cell)===idx&&((obj==="boss")?String(x.role||"enemy")==="boss":obj==="enemy"?String(x.role||"enemy")!=="boss":true)));
  const old=specAt(getContent(dungeonId,nodeId),obj,idx);let spec=null;
  if(obj==="enemy"||obj==="boss")spec={id:String(old?.id||uid("enemy")),enemyId:String(data?.enemyId||"dng_skeleton"),qty:Math.max(1,Math.min(50,Math.trunc(Number(data?.qty)||1))),cell:idx,role:obj==="boss"?"boss":"enemy",hasKey:!!data?.hasKey,hp:Number(data?.hp)>0?Number(data.hp):null};
  else if(obj==="chest")spec={id:String(old?.id||uid("chest")),cell:idx,rarity:String(data?.rarity||"common"),gold:Math.max(0,Math.trunc(Number(data?.gold)||0)),items:Array.isArray(data?.items)?clone(data.items):parseItems(data?.itemsText||""),label:String(data?.label||"")};
  else if(obj==="trap")spec={id:String(old?.id||uid("trap")),cell:idx,trapType:String(data?.trapType||"damage"),damage:Math.max(0,Math.trunc(Number(data?.damage)||0)),refId:String(data?.refId||""),label:String(data?.label||""),once:data?.once!==false};
  else if(obj==="puzzle")spec={id:String(old?.id||uid("puzzle")),cell:idx,refId:String(data?.refId||""),targetType:String(data?.targetType||"cell"),label:String(data?.label||"")};
  list.push(spec);setList(content,obj,list);saveContent(dungeonId,nodeId,content);return clone(spec);
}
function removeElement(dungeonId,nodeId,cell,obj){const content=clone(getContent(dungeonId,nodeId)),idx=Number(cell),next=listForObject(content,obj).filter(x=>!(Number(x.cell)===idx&&((obj==="boss")?String(x.role||"enemy")==="boss":obj==="enemy"?String(x.role||"enemy")!=="boss":true)));setList(content,obj,next);saveContent(dungeonId,nodeId,content);return content}
function setMode(mode){const c=currentContext();if(!c)return false;const content=clone(getContent(c.dungeonId,c.nodeId));content.mode=["inherit","fixed","mixed"].includes(String(mode))?String(mode):"fixed";saveContent(c.dungeonId,c.nodeId,content);renderPanel();decorateGrid();return true}
function hideLegacyLauncher(){
  if(!DOC)return false;
  let removed=false;
  for(const id of ["dzc167824Launch"]){const el=DOC.getElementById(id);if(el){el.remove();removed=true}}
  return removed;
}
function ensureStyles(){
  if(!DOC||DOC.getElementById("drv167826Styles"))return;
  const s=DOC.createElement("style");s.id="drv167826Styles";s.textContent=`#drv167826Panel{border:1px solid #6e5425;background:#17130d;border-radius:12px;padding:10px;margin:10px 0}.drv167826Top{display:flex;gap:7px;align-items:end;flex-wrap:wrap}.drv167826Field{display:grid;gap:4px;min-width:180px;flex:1}.drv167826Field label{font-size:12px;font-weight:800;color:#d8c79e}.drv167826Field select{width:100%;background:#0b0b0b;color:#fff;border:1px solid #4d4536;border-radius:8px;padding:8px}.drv167826Toggle{background:#72501d!important;font-weight:900}.drv167826Toggle.on{outline:2px solid #f0be54;background:#9a681b!important}.drv167826Hint{font-size:12px;color:#b9b09f;margin-top:7px}.drc100Cell.drv167826Configurable{box-shadow:inset 0 0 0 2px #c89b4c;cursor:pointer}.drc100Cell.drv167826Configured{box-shadow:inset 0 0 0 3px #3fa869}.drc100Cell.drv167826Configurable::after{content:'✎';position:absolute;font-size:9px;right:2px;bottom:2px}.drc100Cell{position:relative}#drv167826Modal{display:none;position:fixed;inset:0;z-index:71000;background:#050505dd;padding:12px;overflow:auto;color:#fff}#drv167826Modal.open{display:flex;align-items:center;justify-content:center}.drv167826Card{width:min(560px,100%);background:#171717;border:1px solid #555;border-radius:15px;padding:14px;box-shadow:0 20px 70px #000}.drv167826Card h3{margin:0 0 8px}.drv167826Grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.drv167826Grid label{display:grid;gap:4px;font-size:12px;color:#ccc}.drv167826Grid input,.drv167826Grid select,.drv167826Grid textarea{width:100%;background:#090909;color:#fff;border:1px solid #444;border-radius:8px;padding:9px;font:inherit}.drv167826Grid textarea{min-height:90px;resize:vertical}.drv167826Full{grid-column:1/-1}.drv167826Actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.drv167826Actions button{flex:1;min-width:120px}.drv167826Delete{background:#70201d!important}@media(max-width:620px){.drv167826Grid{grid-template-columns:1fr}.drv167826Full{grid-column:auto}.drv167826Top{align-items:stretch}}`;DOC.head.appendChild(s)
}
function ensurePanel(){if(!DOC)return;const editor=DOC.getElementById("drc100Editor");if(!editor||DOC.getElementById("drv167826Panel"))return;DOC.getElementById("drv167825Panel")?.remove();const p=DOC.createElement("div");p.id="drv167826Panel";const palette=DOC.getElementById("drc100Palette");if(palette)editor.insertBefore(p,palette);else editor.insertBefore(p,editor.firstChild);renderPanel()}
function setVisualMode(value){
  const ctx=currentContext();visualMode=!!value&&!!ctx;
  if(visualMode){try{ROOT.showToast?.("🎯 Configuration active : touche directement un élément sur la grille.")}catch(e){}}
  renderPanel();decorateGrid();return visualMode;
}
function renderPanel(){
  if(!DOC)return;const p=DOC.getElementById("drv167826Panel");if(!p)return;
  const rid=inferRoom(),ctxs=contextsForRoom(rid),ctx=currentContext(),content=ctx?getContent(ctx.dungeonId,ctx.nodeId):null;
  const opts=ctxs.length?ctxs.map(c=>'<option value="'+esc(contextKey(c))+'" '+(contextKey(c)===contextKey(ctx)?'selected':'')+'>'+esc(c.dungeonName)+' › '+esc(c.nodeLabel)+'</option>').join(''):'<option value="">— cette pièce n’est utilisée dans aucun monde —</option>';
  p.innerHTML='<div style="font-weight:900">🎯 Configuration visuelle du contenu</div><div class="drv167826Top"><div class="drv167826Field"><label>Zone à configurer</label><select id="drv167826Context">'+opts+'</select></div><div class="drv167826Field"><label>Mode de contenu</label><select id="drv167826Mode" '+(ctx?'':'disabled')+'><option value="inherit" '+(content?.mode==='inherit'?'selected':'')+'>Hériter</option><option value="fixed" '+(content?.mode==='fixed'?'selected':'')+'>Fixe — exactement ce que je place</option><option value="mixed" '+(content?.mode==='mixed'?'selected':'')+'>Mixte</option></select></div><button type="button" id="drv167826Toggle" class="drv167826Toggle '+(visualMode?'on':'')+'" '+(ctx?'':'disabled')+'>'+(visualMode?'✓ Configuration active':'🎯 Configurer les éléments')+'</button></div><div class="drv167826Hint">'+(ctx?(visualMode?'Le mode peinture est bloqué. Touche directement 👹 💀 🎁 ⚠️ ou ❓ pour ouvrir sa fiche.':'Active le bouton puis touche directement un élément déjà placé. Aucun numéro de case à mémoriser.'):'Ajoute d’abord cette pièce à un Monde dans le World Builder. Si elle est utilisée plusieurs fois, choisis ici l’instance exacte.')+'</div>';
  const sel=DOC.getElementById("drv167826Context");if(sel)sel.onchange=()=>{const [d,n]=String(sel.value||"").split("::");selectedDungeonId=d||"";selectedNodeId=n||"";setVisualMode(false)};
  const mode=DOC.getElementById("drv167826Mode");if(mode)mode.onchange=()=>setMode(mode.value);
  const t=DOC.getElementById("drv167826Toggle");if(t)t.onclick=()=>setVisualMode(!visualMode);
}
function configuredAt(ctx,obj,cell){if(!ctx)return false;return !!specAt(getContent(ctx.dungeonId,ctx.nodeId),obj,cell)}
function blockEvent(ev){ev?.preventDefault?.();ev?.stopPropagation?.();ev?.stopImmediatePropagation?.()}
function activateCell(index){
  if(!visualMode)return false;
  const room=roomById(inferRoom()),idx=Number(index),obj=String(room?.cells?.[idx]?.object||"");
  if(CONFIGURABLE.has(obj)){openEditor(idx,obj);return true}
  try{ROOT.showToast?.("Sélectionne un ennemi, boss, coffre, piège ou énigme déjà placé.")}catch(e){}
  return false;
}
function bindCell(el,index,obj){
  if(!el)return;
  el.onpointerdown=null;el.onclick=null;el.classList.remove("drv167826Configurable","drv167826Configured","drv167825Configurable","drv167825Configured");
  if(!visualMode)return;
  const ctx=currentContext();
  if(CONFIGURABLE.has(obj)){el.classList.add("drv167826Configurable");if(configuredAt(ctx,obj,index))el.classList.add("drv167826Configured")}
  const handler=ev=>{blockEvent(ev);activateCell(index)};
  el.onpointerdown=handler;
  if(typeof ROOT.PointerEvent==="undefined")el.onclick=handler;
}
function decorateGrid(){
  if(!DOC)return;ensurePanel();hideLegacyLauncher();
  const rid=inferRoom(),room=roomById(rid),grid=DOC.getElementById("drc100Grid");if(!room||!grid)return;
  grid.querySelectorAll("[data-drc-index]").forEach(el=>{const i=Number(el.dataset.drcIndex),obj=String(room.cells?.[i]?.object||"");bindCell(el,i,obj)});
}
function ensureModal(){if(!DOC||DOC.getElementById("drv167826Modal"))return;DOC.getElementById("drv167825Modal")?.remove();const m=DOC.createElement("div");m.id="drv167826Modal";DOC.body.appendChild(m)}
function typeLabel(obj){return obj==="enemy"?"👹 Ennemi":obj==="boss"?"💀 Boss":obj==="chest"?"🎁 Coffre":obj==="trap"?"⚠️ Piège":"❓ Énigme"}
function enemyOptions(value){const known=new Map(ENEMIES);if(value&&!known.has(value))known.set(value,value);return [...known].map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join('')}
function openEditor(cell,obj){
  const ctx=currentContext(),room=roomById(inferRoom());if(!ctx||!room)return false;
  activeCell=Number(cell);activeObject=String(obj);const old=specAt(getContent(ctx.dungeonId,ctx.nodeId),obj,activeCell),x=activeCell%room.width+1,y=Math.floor(activeCell/room.width)+1;ensureModal();const m=DOC.getElementById("drv167826Modal");let body="";
  if(obj==="enemy"||obj==="boss")body='<label>Monstre<select id="drv167826Enemy">'+enemyOptions(String(old?.enemyId||"dng_skeleton"))+'</select></label><label>Quantité<input id="drv167826Qty" type="number" min="1" max="50" value="'+Number(old?.qty||1)+'"></label><label>PV forcés (optionnel)<input id="drv167826Hp" type="number" min="1" value="'+(old?.hp||'')+'" placeholder="laisser vide = stats normales"></label><label style="align-content:end"><span><input id="drv167826Key" type="checkbox" '+(old?.hasKey?'checked':'')+'> Porte la clé</span></label>';
  else if(obj==="chest")body='<label>Rareté<select id="drv167826Rarity"><option value="common">Commun</option><option value="rare">Rare</option><option value="epic">Épique</option><option value="legendary">Légendaire</option></select></label><label>Or exact<input id="drv167826Gold" type="number" min="0" value="'+Number(old?.gold||0)+'"></label><label class="drv167826Full">Contenu exact du coffre<textarea id="drv167826Items" placeholder="potion_soin × 2\nlame_cendre">'+esc(itemsText(old?.items||[]))+'</textarea></label>';
  else if(obj==="trap")body='<label>Type<select id="drv167826TrapType"><option value="damage">Dégâts directs</option><option value="reference">Piège existant</option></select></label><label>Dégâts<input id="drv167826Damage" type="number" min="0" value="'+Number(old?.damage||0)+'"></label><label class="drv167826Full">Référence du piège existant (optionnel)<input id="drv167826TrapRef" value="'+esc(old?.refId||'')+'" placeholder="ID du piège"></label><label class="drv167826Full">Nom / note<input id="drv167826TrapLabel" value="'+esc(old?.label||'')+'"></label>';
  else if(obj==="puzzle")body='<label class="drv167826Full">Énigme existante<input id="drv167826PuzzleRef" value="'+esc(old?.refId||'')+'" placeholder="ID de l’énigme"></label><label>Cible<select id="drv167826Target"><option value="cell">Case</option><option value="door">Porte</option><option value="chest">Coffre</option></select></label><label>Nom / note<input id="drv167826PuzzleLabel" value="'+esc(old?.label||'')+'"></label>';
  m.innerHTML='<div class="drv167826Card"><h3>'+typeLabel(obj)+'</h3><div style="font-size:12px;color:#aaa;margin-bottom:10px">'+esc(ctx.dungeonName)+' › '+esc(ctx.nodeLabel)+' · position automatique '+x+','+y+'</div><div class="drv167826Grid">'+body+'</div><div class="drv167826Actions"><button type="button" onclick="DungeonRoomVisualConfig167826.closeEditor()">Annuler</button><button type="button" class="drv167826Delete" onclick="DungeonRoomVisualConfig167826.deleteActive()">Effacer la configuration</button><button type="button" onclick="DungeonRoomVisualConfig167826.saveActive()">💾 Enregistrer</button></div></div>';
  if(obj==="chest")DOC.getElementById("drv167826Rarity").value=String(old?.rarity||"common");if(obj==="trap")DOC.getElementById("drv167826TrapType").value=String(old?.trapType||"damage");if(obj==="puzzle")DOC.getElementById("drv167826Target").value=String(old?.targetType||"cell");m.classList.add("open");return true;
}
function closeEditor(){DOC?.getElementById("drv167826Modal")?.classList.remove("open");activeCell=-1;activeObject=""}
function saveActive(){
  const c=currentContext();if(!c||activeCell<0)return false;let data={};
  if(activeObject==="enemy"||activeObject==="boss")data={enemyId:DOC.getElementById("drv167826Enemy")?.value,qty:DOC.getElementById("drv167826Qty")?.value,hp:DOC.getElementById("drv167826Hp")?.value,hasKey:!!DOC.getElementById("drv167826Key")?.checked};
  else if(activeObject==="chest"){const modern=ROOT.DungeonRoomContentUI167831?.selectedItems?.("zone");data={rarity:DOC.getElementById("drv167826Rarity")?.value,gold:DOC.getElementById("drv167826Gold")?.value,items:Array.isArray(modern)?modern:parseItems(DOC.getElementById("drv167826Items")?.value||"")};}
  else if(activeObject==="trap")data={trapType:DOC.getElementById("drv167826TrapType")?.value,damage:DOC.getElementById("drv167826Damage")?.value,refId:DOC.getElementById("drv167826TrapRef")?.value,label:DOC.getElementById("drv167826TrapLabel")?.value,once:true};
  else if(activeObject==="puzzle")data={refId:DOC.getElementById("drv167826PuzzleRef")?.value,targetType:DOC.getElementById("drv167826Target")?.value,label:DOC.getElementById("drv167826PuzzleLabel")?.value};
  configureElement(c.dungeonId,c.nodeId,inferRoom(),activeCell,activeObject,data);try{ROOT.showToast?.("✓ "+typeLabel(activeObject)+" configuré") }catch(e){}closeEditor();renderPanel();decorateGrid();return true;
}
function deleteActive(){const c=currentContext();if(!c||activeCell<0)return false;removeElement(c.dungeonId,c.nodeId,activeCell,activeObject);closeEditor();decorateGrid();return true}
function wrapRoomApi(){
  const api=roomApi();if(!api||api.__drv167826Wrapped)return false;api.__drv167826Wrapped=true;
  const wrap=(name,fn)=>{const old=api[name];if(typeof old!=="function")return;api[name]=function(){return fn.call(this,old,arguments)}};
  wrap("editRoom",function(old,args){currentRoomId=String(args[0]||"");setVisualMode(false);const out=old.apply(this,args);setTimeout(()=>{renderPanel();decorateGrid()},0);return out});
  wrap("open",function(old,args){const out=old.apply(this,args);setTimeout(()=>{inferRoom();renderPanel();decorateGrid()},0);return out});
  wrap("newRoom",function(old,args){currentRoomId="";selectedDungeonId="";selectedNodeId="";visualMode=false;const out=old.apply(this,args);setTimeout(()=>{renderPanel();decorateGrid()},0);return out});
  wrap("saveCurrent",function(old,args){const out=old.apply(this,args);if(out?.id)currentRoomId=String(out.id);setTimeout(()=>{renderPanel();decorateGrid()},0);return out});
  wrap("duplicateRoom",function(old,args){const out=old.apply(this,args);currentRoomId=String(out?.id||"");selectedDungeonId="";selectedNodeId="";visualMode=false;setTimeout(()=>{renderPanel();decorateGrid()},0);return out});
  return true;
}
function install(){
  if(installed){hideLegacyLauncher();return true}installed=true;
  try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  ensureStyles();ensureModal();hideLegacyLauncher();wrapRoomApi();ensurePanel();decorateGrid();
  if(DOC)DOC.addEventListener("click",()=>setTimeout(()=>{hideLegacyLauncher();ensurePanel();wrapRoomApi();decorateGrid()},0),true);
  return true;
}
const API={VERSION,APP_VERSION,GRAPH_KEY,CONFIGURABLE,contextsForRoom,getContent,configureElement,removeElement,parseItems,itemsText,setMode,setVisualMode,activateCell,bindCell,openEditor,closeEditor,saveActive,deleteActive,hideLegacyLauncher,install,decorateGrid};
ROOT.DungeonRoomVisualConfig167826=API;
ROOT.DungeonRoomVisualConfig167825=API;
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
