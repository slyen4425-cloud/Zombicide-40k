/* GenSrpG V16.78.28 — direct exact-content editing on Room Creator templates.
   The room template can be configured before it belongs to any World Builder graph.
   When a room instance is added to a world, template content is copied into that zone,
   after which the zone may diverge independently through the advanced per-zone editor. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.28",TEMPLATE_DUNGEON_ID="__room_template__";
const CONFIGURABLE=new Set(["enemy","boss","chest","trap","puzzle"]);
const ENEMIES=[
 ["dng_skeleton","Squelette"],["dng_skeleton_archer","Squelette archer"],["dng_skeleton_guard","Squelette garde"],["dng_ghoul","Goule"],["dng_wraith","Spectre"],["dng_lich","Liche"],
 ["dng_goblin","Gobelin"],["dng_goblin_archer","Gobelin archer"],["dng_goblin_shaman","Gobelin chaman"],["dng_orc","Orc"],["dng_orc_berserker","Orc berserker"],["dng_orc_shaman","Orc chaman"],
 ["dng_spider","Araignée"],["dng_direwolf","Loup sinistre"],["dng_harpy","Harpie"],["dng_troll","Troll"],["dng_golem","Golem"],["dng_minotaur","Minotaure"],["dng_wyvern","Wyverne"],["dng_necromancer","Nécromancien"]
];
let templateMode=false,activeCell=-1,activeObject="",advancedOpen=false,installed=false,observer=null;
function roomApi(){return ROOT.DungeonRoomCreator100||null}
function zoneApi(){return ROOT.DungeonZoneContent167824||null}
function visualApi(){return ROOT.DungeonRoomVisualConfig167826||ROOT.DungeonRoomVisualConfig167825||null}
function builderApi(){return ROOT.DungeonWorldBuilder167821||null}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function inferRoomId(){
  const api=roomApi();if(!api||!DOC)return "";
  const name=String(DOC.getElementById("drc100Name")?.value||"").trim();
  const w=Number(DOC.getElementById("drc100Width")?.value),h=Number(DOC.getElementById("drc100Height")?.value);
  const hits=(api.loadLibrary?.()||[]).filter(r=>(!name||String(r.name||"")===name)&&(!w||Number(r.width)===w)&&(!h||Number(r.height)===h)).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));
  return String(hits[0]?.id||"");
}
function room(){const id=inferRoomId();return id?roomApi()?.findRoom?.(id)||null:null}
function emptyContent(){return {mode:"inherit",enemies:[],chests:[],traps:[],puzzles:[],npcs:[],items:[]}}
function templateContent(roomId){const id=String(roomId||inferRoomId());return id?(zoneApi()?.getZoneContent?.(TEMPLATE_DUNGEON_ID,id)||emptyContent()):emptyContent()}
function saveTemplate(roomId,content){const id=String(roomId||inferRoomId());if(!id||!zoneApi()?.saveZoneContent)return null;return zoneApi().saveZoneContent(TEMPLATE_DUNGEON_ID,id,content)}
function listFor(content,obj){if(obj==="enemy"||obj==="boss")return content.enemies||[];if(obj==="chest")return content.chests||[];if(obj==="trap")return content.traps||[];if(obj==="puzzle")return content.puzzles||[];return []}
function specAt(content,obj,cell){return listFor(content,obj).find(x=>Number(x.cell)===Number(cell)&&((obj==="boss")?String(x.role||"enemy")==="boss":obj==="enemy"?String(x.role||"enemy")!=="boss":true))||null}
function typeLabel(obj){return obj==="enemy"?"👹 Ennemi":obj==="boss"?"💀 Boss":obj==="chest"?"🎁 Coffre":obj==="trap"?"⚠️ Piège":"❓ Énigme"}
function enemyOptions(value){const known=new Map(ENEMIES);if(value&&!known.has(value))known.set(value,value);return [...known].map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join('')}
function itemsText(items){const api=visualApi();if(api?.itemsText)return api.itemsText(items);return (Array.isArray(items)?items:[]).map(x=>String(x.itemId||x.id||"")+(Number(x.qty||1)>1?" × "+Number(x.qty||1):"")).join("\n")}
function parseItems(text){const api=visualApi();if(api?.parseItems)return api.parseItems(text);return String(text||"").split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(.+?)(?:\s*[x×*]\s*(\d+))?$/);return {itemId:String(m?.[1]||"").trim(),qty:Math.max(1,Number(m?.[2]||1))}}).filter(x=>x.itemId)}
function configureTemplate(roomId,cell,obj,data){
  const id=String(roomId||inferRoomId()),api=visualApi();if(!id||!api?.configureElement)return null;
  const out=api.configureElement(TEMPLATE_DUNGEON_ID,id,id,Number(cell),String(obj),data||{});
  propagateToInheritedZones(id);return out;
}
function removeTemplate(roomId,cell,obj){
  const id=String(roomId||inferRoomId()),api=visualApi();if(!id||!api?.removeElement)return null;
  const out=api.removeElement(TEMPLATE_DUNGEON_ID,id,Number(cell),String(obj));propagateToInheritedZones(id);return out;
}
function copyTemplateToZone(dungeonId,nodeId,roomId,force){
  const z=zoneApi();if(!z?.getZoneContent||!z?.saveZoneContent)return false;
  const tpl=z.getZoneContent(TEMPLATE_DUNGEON_ID,String(roomId||""));if(!tpl||tpl.mode==="inherit")return false;
  const current=z.getZoneContent(String(dungeonId||""),String(nodeId||""));if(!force&&current?.mode!=="inherit")return false;
  z.saveZoneContent(String(dungeonId||""),String(nodeId||""),clone(tpl));return true;
}
function propagateToInheritedZones(roomId){
  const b=builderApi();if(!b?.loadLibrary)return 0;let n=0;
  for(const g of b.loadLibrary()||[])for(const node of g.nodes||[])if(String(node.roomId||"")===String(roomId||""))if(copyTemplateToZone(g.id,node.id,roomId,false))n++;
  return n;
}
function wrapBuilder(){
  const b=builderApi();if(!b||b.__drt167828Wrapped||typeof b.addRoomInstance!=="function")return false;
  const old=b.addRoomInstance;b.addRoomInstance=function(dungeonId,roomId,label){const out=old.apply(this,arguments);try{const node=out?.node;if(node?.id)copyTemplateToZone(dungeonId,node.id,roomId,false)}catch(e){console.warn("GenSrpG V16.78.28 template copy",e)}return out};b.__drt167828Wrapped=true;return true;
}
function ensureStyles(){if(!DOC||DOC.getElementById("drt167828Styles"))return;const s=DOC.createElement("style");s.id="drt167828Styles";s.textContent=`#drt167828Panel{border:1px solid #416347;background:#111b14;border-radius:12px;padding:10px;margin:10px 0}#drt167828Panel .drtTitle{font-weight:900}.drtActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.drtActions button{flex:1;min-width:180px}.drtMain{background:#285d35!important;font-weight:900}.drtMain.on{outline:2px solid #62c978;background:#347b46!important}.drtHint{font-size:12px;color:#a9c9b1;margin-top:7px}.drc100Cell.drt167828Configurable{box-shadow:inset 0 0 0 3px #d1a34d;cursor:pointer}.drc100Cell.drt167828Configured{box-shadow:inset 0 0 0 3px #4fc36a}.drc100Cell.drt167828Configurable::after{content:'✎';position:absolute;font-size:10px;right:2px;bottom:2px}#drv167826Panel.drtAdvancedClosed{display:none!important}#drt167828Modal{display:none;position:fixed;inset:0;z-index:72000;background:#050505e8;padding:12px;overflow:auto;color:#fff}#drt167828Modal.open{display:flex;align-items:center;justify-content:center}.drtCard{width:min(560px,100%);background:#171717;border:1px solid #555;border-radius:15px;padding:14px}.drtGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.drtGrid label{display:grid;gap:4px;font-size:12px;color:#ccc}.drtGrid input,.drtGrid select,.drtGrid textarea{width:100%;background:#090909;color:#fff;border:1px solid #444;border-radius:8px;padding:9px;font:inherit}.drtFull{grid-column:1/-1}.drtModalActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.drtModalActions button{flex:1;min-width:120px}@media(max-width:620px){.drtGrid{grid-template-columns:1fr}.drtFull{grid-column:auto}}`;DOC.head.appendChild(s)}
function ensurePanel(){
  if(!DOC)return false;const editor=DOC.getElementById("drc100Editor");if(!editor)return false;
  let p=DOC.getElementById("drt167828Panel");if(!p){p=DOC.createElement("div");p.id="drt167828Panel";const old=DOC.getElementById("drv167826Panel"),palette=DOC.getElementById("drc100Palette");if(old?.parentNode)old.parentNode.insertBefore(p,old);else if(palette)editor.insertBefore(p,palette);else editor.insertBefore(p,editor.firstChild)}
  renderPanel();return true;
}
function renderPanel(){
  if(!DOC)return;const p=DOC.getElementById("drt167828Panel");if(!p)return;const id=inferRoomId(),content=id?templateContent(id):null;
  p.innerHTML='<div class="drtTitle">🧱 Contenu exact de cette pièce</div><div class="drtHint">'+(id?'Configure directement les éléments déjà posés. Tu peux faire cela avant de créer le monde. Ce contenu sera copié dans chaque nouvelle instance de cette pièce.':'Enregistre d’abord la pièce pour pouvoir configurer son contenu exact.')+'</div><div class="drtActions"><button type="button" id="drt167828Toggle" class="drtMain '+(templateMode?'on':'')+'" '+(id?'':'disabled')+'>'+(templateMode?'✓ Configuration active':'🎯 Configurer directement les éléments')+'</button><button type="button" id="drt167828Advanced">⚙️ Variante par zone</button></div>'+(content&&content.mode!=="inherit"?'<div class="drtHint">✓ Modèle configuré : '+(content.enemies?.length||0)+' groupe(s) ennemi · '+(content.chests?.length||0)+' coffre(s) · '+(content.traps?.length||0)+' piège(s) · '+(content.puzzles?.length||0)+' énigme(s)</div>':'');
  DOC.getElementById("drt167828Toggle").onclick=()=>setTemplateMode(!templateMode);
  DOC.getElementById("drt167828Advanced").onclick=()=>{advancedOpen=!advancedOpen;syncAdvanced();renderPanel()};syncAdvanced();
}
function syncAdvanced(){const p=DOC?.getElementById("drv167826Panel");if(p)p.classList.toggle("drtAdvancedClosed",!advancedOpen)}
function setTemplateMode(v){
  templateMode=!!v&&!!inferRoomId();try{visualApi()?.setVisualMode?.(false)}catch(e){}renderPanel();decorateGrid();
  if(templateMode)try{ROOT.showToast?.("🎯 Touche maintenant directement un ennemi, coffre, piège ou énigme.")}catch(e){}return templateMode;
}
function block(ev){ev?.preventDefault?.();ev?.stopPropagation?.();ev?.stopImmediatePropagation?.()}
function decorateGrid(){
  if(!DOC)return;const r=room(),grid=DOC.getElementById("drc100Grid");if(!r||!grid)return;const content=templateContent(r.id);
  grid.querySelectorAll("[data-drc-index]").forEach(el=>{const i=Number(el.dataset.drcIndex),obj=String(r.cells?.[i]?.object||"");el.classList.remove("drt167828Configurable","drt167828Configured");if(!templateMode)return;if(CONFIGURABLE.has(obj)){el.classList.add("drt167828Configurable");if(specAt(content,obj,i))el.classList.add("drt167828Configured")}const handler=ev=>{block(ev);if(CONFIGURABLE.has(obj))openEditor(i,obj);else try{ROOT.showToast?.("Touche un ennemi, boss, coffre, piège ou énigme déjà placé.")}catch(e){}};el.onpointerdown=handler;el.onclick=typeof ROOT.PointerEvent==="undefined"?handler:null});
}
function ensureModal(){if(!DOC||DOC.getElementById("drt167828Modal"))return;const m=DOC.createElement("div");m.id="drt167828Modal";DOC.body.appendChild(m)}
function openEditor(cell,obj){
  const r=room();if(!r)return false;activeCell=Number(cell);activeObject=String(obj);const old=specAt(templateContent(r.id),obj,activeCell);ensureModal();const m=DOC.getElementById("drt167828Modal");let body="";
  if(obj==="enemy"||obj==="boss")body='<label>Monstre<select id="drtEnemy">'+enemyOptions(String(old?.enemyId||"dng_skeleton"))+'</select></label><label>Quantité<input id="drtQty" type="number" min="1" max="50" value="'+Number(old?.qty||1)+'"></label><label>PV forcés (optionnel)<input id="drtHp" type="number" min="1" value="'+(old?.hp||'')+'"></label><label style="align-content:end"><span><input id="drtKey" type="checkbox" '+(old?.hasKey?'checked':'')+'> Porte la clé</span></label>';
  else if(obj==="chest")body='<label>Rareté<select id="drtRarity"><option value="common">Commun</option><option value="rare">Rare</option><option value="epic">Épique</option><option value="legendary">Légendaire</option></select></label><label>Or exact<input id="drtGold" type="number" min="0" value="'+Number(old?.gold||0)+'"></label><label class="drtFull">Contenu exact<textarea id="drtItems" placeholder="potion_soin × 2\nlame_cendre">'+esc(itemsText(old?.items||[]))+'</textarea></label>';
  else if(obj==="trap")body='<label>Type<select id="drtTrapType"><option value="damage">Dégâts directs</option><option value="reference">Piège existant</option></select></label><label>Dégâts<input id="drtDamage" type="number" min="0" value="'+Number(old?.damage||0)+'"></label><label class="drtFull">Référence piège existant<input id="drtTrapRef" value="'+esc(old?.refId||'')+'"></label><label class="drtFull">Nom / note<input id="drtTrapLabel" value="'+esc(old?.label||'')+'"></label>';
  else if(obj==="puzzle")body='<label class="drtFull">Énigme existante<input id="drtPuzzleRef" value="'+esc(old?.refId||'')+'"></label><label>Cible<select id="drtTarget"><option value="cell">Case</option><option value="door">Porte</option><option value="chest">Coffre</option></select></label><label>Nom / note<input id="drtPuzzleLabel" value="'+esc(old?.label||'')+'"></label>';
  m.innerHTML='<div class="drtCard"><h3>'+typeLabel(obj)+'</h3><div class="drtHint">Modèle : '+esc(r.name)+' · position liée automatiquement</div><div class="drtGrid">'+body+'</div><div class="drtModalActions"><button type="button" onclick="DungeonRoomTemplateContent167828.closeEditor()">Annuler</button><button type="button" onclick="DungeonRoomTemplateContent167828.deleteActive()">Effacer config</button><button type="button" onclick="DungeonRoomTemplateContent167828.saveActive()">💾 Enregistrer</button></div></div>';
  if(obj==="chest")DOC.getElementById("drtRarity").value=String(old?.rarity||"common");if(obj==="trap")DOC.getElementById("drtTrapType").value=String(old?.trapType||"damage");if(obj==="puzzle")DOC.getElementById("drtTarget").value=String(old?.targetType||"cell");m.classList.add("open");return true;
}
function closeEditor(){DOC?.getElementById("drt167828Modal")?.classList.remove("open");activeCell=-1;activeObject=""}
function saveActive(){
  const id=inferRoomId();if(!id||activeCell<0)return false;let data={};
  if(activeObject==="enemy"||activeObject==="boss")data={enemyId:DOC.getElementById("drtEnemy")?.value,qty:DOC.getElementById("drtQty")?.value,hp:DOC.getElementById("drtHp")?.value,hasKey:!!DOC.getElementById("drtKey")?.checked};
  else if(activeObject==="chest")data={rarity:DOC.getElementById("drtRarity")?.value,gold:DOC.getElementById("drtGold")?.value,itemsText:DOC.getElementById("drtItems")?.value};
  else if(activeObject==="trap")data={trapType:DOC.getElementById("drtTrapType")?.value,damage:DOC.getElementById("drtDamage")?.value,refId:DOC.getElementById("drtTrapRef")?.value,label:DOC.getElementById("drtTrapLabel")?.value,once:true};
  else if(activeObject==="puzzle")data={refId:DOC.getElementById("drtPuzzleRef")?.value,targetType:DOC.getElementById("drtTarget")?.value,label:DOC.getElementById("drtPuzzleLabel")?.value};
  configureTemplate(id,activeCell,activeObject,data);closeEditor();renderPanel();decorateGrid();try{ROOT.showToast?.("✓ Contenu du modèle enregistré") }catch(e){}return true;
}
function deleteActive(){const id=inferRoomId();if(!id||activeCell<0)return false;removeTemplate(id,activeCell,activeObject);closeEditor();renderPanel();decorateGrid();return true}
function wrapRoomApi(){const a=roomApi();if(!a||a.__drt167828Wrapped)return false;a.__drt167828Wrapped=true;for(const name of ["open","editRoom","newRoom","saveCurrent","duplicateRoom","applyResize","resizePreset","clearRoom","setZoom"]){const old=a[name];if(typeof old!=="function")continue;a[name]=function(){const out=old.apply(this,arguments);setTimeout(()=>{templateMode=false;ensurePanel();renderPanel();decorateGrid()},0);return out}}return true}
function install(){
  if(installed){wrapBuilder();wrapRoomApi();ensurePanel();syncAdvanced();return true}installed=true;try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  ensureStyles();ensureModal();wrapBuilder();wrapRoomApi();ensurePanel();syncAdvanced();decorateGrid();
  if(DOC&&typeof MutationObserver==="function"){observer=new MutationObserver(()=>{wrapBuilder();wrapRoomApi();ensurePanel();syncAdvanced();decorateGrid()});observer.observe(DOC.documentElement,{childList:true,subtree:true})}return true;
}
ROOT.DungeonRoomTemplateContent167828={VERSION,APP_VERSION,TEMPLATE_DUNGEON_ID,templateContent,saveTemplate,configureTemplate,removeTemplate,copyTemplateToZone,propagateToInheritedZones,setTemplateMode,decorateGrid,openEditor,closeEditor,saveActive,deleteActive,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
