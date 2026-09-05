/* GenSrpG Dungeon — authored zone links 16.78.46.
   Isolated to World Builder/authored Dungeon runtime.
   - Door graph connections become navigable in both directions.
   - Cache destinations are owned by World Builder, not Room Creator.
   - Cache travel keeps a per-hero return stack for sub-zones/buildings.
   Does not alter Random Dungeon, Capture or Survival runtimes. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.1",APP_VERSION="16.78.46";
let retries=0;
function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function writeRt(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function builder(){return ROOT.DungeonWorldBuilder167821||null}
function world(){return ROOT.DungeonWorldRuntime167823||null}
function roomApi(){return ROOT.DungeonRoomCreator100||null}
function roomV2(){return ROOT.DungeonRoomCreatorV2||null}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function activeGraphId(){
  if(!DOC)return "";
  const b=DOC.querySelector?.("#drc300Library .drc300Card.active [data-open]");if(b?.dataset?.open)return String(b.dataset.open);
  const name=String(DOC.getElementById?.("drc300Name")?.value||"").trim();
  const list=builder()?.loadLibrary?.()||[];return String(list.find(g=>String(g?.name||"")===name)?.id||"")
}
function authoredContext(){
  const W=world(),B=builder(),x=readRt();if(!W||!B||!x?.last?.worldRuntime167823)return null;
  const cfg=W.getConfig?.();if(!cfg?.enabled||!cfg.dungeonId)return null;
  const graph=B.findDungeon?.(cfg.dungeonId);if(!graph||String(x.last.worldDungeonId||"")!==String(graph.id))return null;
  const hero=activeHero(x);if(!hero)return null;
  const w=W.ensureWorldState?.(x,graph.id,clone(x.world167823||null))||x.world167823||{};
  const currentNodeId=String(w?.roomNodes?.[String(Number(x.room)||0)]||w?.heroNodes?.[hero]||x.last.worldNodeId||"");
  return {W,B,x,graph,hero,w,currentNodeId,pos:Number(x?.positions?.[hero])}
}
function nodeInfo(graph,nodeId){const node=(graph?.nodes||[]).find(v=>String(v.id)===String(nodeId||""));return node?{node,room:roomApi()?.findRoom?.(node.roomId)||null}:null}
function nodeLabel(graph,nodeId){const p=nodeInfo(graph,nodeId);return String(p?.node?.label||p?.room?.name||"Zone")}
function entryIndexForNode(graph,nodeId){const room=nodeInfo(graph,nodeId)?.room,cells=Array.isArray(room?.cells)?room.cells:[];const i=cells.findIndex(c=>c?.object==="entry");return i>=0?i:0}
function cacheCells(room){const out=[];(room?.cells||[]).forEach((c,i)=>{if(c?.object==="cache")out.push(i)});return out}
function reverseEdge(graph,nodeId,pos){return (graph?.edges||[]).find(e=>String(e?.toNodeId)===String(nodeId||"")&&Number(e?.toEntryIndex)===Number(pos))||null}
function cacheBinding(graph,nodeId,pos){return (graph?.cacheBindings||[]).find(b=>String(b?.sourceNodeId)===String(nodeId||"")&&Number(b?.sourceIndex)===Number(pos)&&b?.targetNodeId)||null}
function stacks(x){x.world167846ReturnStacks=x.world167846ReturnStacks&&typeof x.world167846ReturnStacks==="object"?x.world167846ReturnStacks:{};return x.world167846ReturnStacks}
function heroStack(x,hero){const s=stacks(x);s[hero]=Array.isArray(s[hero])?s[hero]:[];return s[hero]}
function topReturn(ctx){const s=heroStack(ctx.x,ctx.hero),top=s[s.length-1];if(!top||String(top.targetNodeId)!==String(ctx.currentNodeId))return null;const cell=String(ctx.x?.last?.map?.cells?.[ctx.pos]||"");return cell==="entry"?top:null}
function blocked(){try{return !!ROOT.dungeonRoomExitLocked102?.()}catch(e){return false}}
function performTransition(ctx,targetNodeId,arrivalIndex,stackMode,stackData){
  if(!ctx?.W?.directFixedNode||!targetNodeId)return false;
  if(stackMode!=="return"&&blocked()){try{ROOT.showToast?.("🔒 Cette zone est verrouillée.")}catch(e){}return false}
  const s=heroStack(ctx.x,ctx.hero);
  if(stackMode==="push")s.push(stackData);
  if(stackMode==="return")s.pop();
  const plan={targetNodeId:String(targetNodeId),currentNodeId:String(ctx.currentNodeId),first:false,edge:{toEntryIndex:Math.max(0,Math.trunc(Number(arrivalIndex)||0))}};
  const ok=!!ctx.W.directFixedNode(ctx.x,ctx.graph,plan,ctx.hero,ctx.w);
  if(!ok){if(stackMode==="push")s.pop();if(stackMode==="return"&&stackData)s.push(stackData);writeRt(ctx.x);return false}
  try{ROOT.DungeonZoneContent167824?.applyCurrentZone?.()}catch(e){}
  try{ROOT.DungeonCore01?.render?.()}catch(e){}
  return true
}
function travelReverse(){const ctx=authoredContext();if(!ctx)return false;const e=reverseEdge(ctx.graph,ctx.currentNodeId,ctx.pos);if(!e)return false;const ok=performTransition(ctx,e.fromNodeId,e.fromExitIndex,"none");if(ok)try{ROOT.showToast?.("↩ "+nodeLabel(ctx.graph,e.fromNodeId))}catch(err){}return ok}
function travelCache(){const ctx=authoredContext();if(!ctx)return false;const b=cacheBinding(ctx.graph,ctx.currentNodeId,ctx.pos);if(!b)return false;const data={sourceNodeId:String(ctx.currentNodeId),sourceIndex:Number(b.sourceIndex),targetNodeId:String(b.targetNodeId),at:Date.now()};const ok=performTransition(ctx,b.targetNodeId,entryIndexForNode(ctx.graph,b.targetNodeId),"push",data);if(ok)try{ROOT.showToast?.("🕳️ "+nodeLabel(ctx.graph,b.targetNodeId))}catch(err){}return ok}
function travelReturn(){const ctx=authoredContext();if(!ctx)return false;const top=topReturn(ctx);if(!top)return false;const ok=performTransition(ctx,top.sourceNodeId,top.sourceIndex,"return",top);if(ok)try{ROOT.showToast?.("↩ Retour vers "+nodeLabel(ctx.graph,top.sourceNodeId))}catch(err){}return ok}
function ensureButton(id,label,handler,anchor){if(!DOC||!anchor)return null;let b=DOC.getElementById(id);if(!b){b=DOC.createElement("button");b.id=id;b.type="button";if(anchor.className)b.className=anchor.className;b.onclick=handler;anchor.parentNode?.insertBefore(b,anchor)}b.textContent=label;b.disabled=false;return b}
function removeButton(id){try{DOC?.getElementById(id)?.remove()}catch(e){}}
function paintTravelButtons(){
  if(!DOC)return false;const anchor=DOC.getElementById("dc01Explore");if(!anchor){removeButton("dwr167846Return");removeButton("dwr167846Cache");return false}
  const ctx=authoredContext();if(!ctx){removeButton("dwr167846Return");removeButton("dwr167846Cache");return false}
  const top=topReturn(ctx),rev=!top?reverseEdge(ctx.graph,ctx.currentNodeId,ctx.pos):null,b=cacheBinding(ctx.graph,ctx.currentNodeId,ctx.pos);
  if(top)ensureButton("dwr167846Return","↩ Retour vers "+nodeLabel(ctx.graph,top.sourceNodeId),travelReturn,anchor);
  else if(rev)ensureButton("dwr167846Return","↩ Retour vers "+nodeLabel(ctx.graph,rev.fromNodeId),travelReverse,anchor);
  else removeButton("dwr167846Return");
  if(b)ensureButton("dwr167846Cache","🕳️ Entrer dans "+nodeLabel(ctx.graph,b.targetNodeId),travelCache,anchor);else removeButton("dwr167846Cache");
  return true
}
function hideRoomCacheDestinationEditor(){
  if(!DOC)return false;const box=DOC.getElementById("drc200Caches");if(!box)return false;const sec=box.closest?.(".drc200Sub");if(!sec||sec.dataset.zoneLinks167846)return false;
  sec.dataset.zoneLinks167846="1";sec.innerHTML='<div class="drc200Title">🕳️ Cache / passage secret</div><div class="drc200Hint">Place ici uniquement le point physique. La destination est choisie dans le Créateur de donjon / Monde construit afin d’éviter deux liaisons concurrentes.</div>';return true
}
function legacySuggestedRoomId(sourceRoomId,sourceIndex){try{return String(roomV2()?.roomMeta?.(sourceRoomId)?.cacheLinks?.find(l=>Number(l?.sourceIndex)===Number(sourceIndex))?.targetRoomId||"")}catch(e){return ""}}
function saveCacheBinding(graphId,sourceNodeId,sourceIndex,targetNodeId){
  const B=builder(),g=B?.findDungeon?.(graphId);if(!g)return false;const target=String(targetNodeId||"");
  g.cacheBindings=(g.cacheBindings||[]).filter(b=>!(String(b?.sourceNodeId)===String(sourceNodeId)&&Number(b?.sourceIndex)===Number(sourceIndex)));
  if(target){const n=(g.nodes||[]).find(v=>String(v.id)===target);if(!n)return false;g.cacheBindings.push({id:"cachebind_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),sourceNodeId:String(sourceNodeId),sourceIndex:Number(sourceIndex),targetNodeId:target,targetRoomId:String(n.roomId||"")})}
  B.upsertDungeon?.(g);return true
}
function renderWorldCacheBindings(){
  if(!DOC)return false;const box=DOC.getElementById("drc300Caches"),B=builder();if(!box||!B)return false;const graphId=activeGraphId(),g=B.findDungeon?.(graphId);if(!g)return false;
  const rows=[];for(const node of g.nodes||[]){const room=roomApi()?.findRoom?.(node.roomId);for(const index of cacheCells(room))rows.push({node,room,index})}
  if(!rows.length){box.innerHTML='<div style="color:#999;font-size:12px">Aucune cache / passage secret placé dans les pièces utilisées.</div>';return true}
  box.innerHTML=rows.map((r,i)=>{const binding=(g.cacheBindings||[]).find(b=>String(b.sourceNodeId)===String(r.node.id)&&Number(b.sourceIndex)===Number(r.index)),legacy=legacySuggestedRoomId(r.room.id,r.index),candidates=(g.nodes||[]).filter(n=>String(n.id)!==String(r.node.id)),suggested=!binding&&legacy?candidates.find(n=>String(n.roomId)===legacy):null,selected=String(binding?.targetNodeId||suggested?.id||"");const opts=['<option value="">— aucune destination —</option>'].concat(candidates.map(n=>'<option value="'+String(n.id).replace(/"/g,'&quot;')+'" '+(selected===String(n.id)?'selected':'')+'>'+nodeLabel(g,n.id).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;","gt;":"&gt;"}[c]||c))+'</option>')).join("");return '<div class="drc300Card"><b>🕳️ '+nodeLabel(g,r.node.id)+' · case '+(r.index+1)+'</b><small>Destination gérée uniquement ici.'+(suggested?' Ancienne liaison détectée et proposée sans modification automatique.':'')+'</small><div class="drc300Actions"><select data-zl-cache="'+i+'" style="flex:1">'+opts+'</select><button type="button" data-zl-save="'+i+'">💾 Lier</button></div></div>'}).join("");
  box.querySelectorAll("[data-zl-save]").forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.zlSave),r=rows[i],sel=box.querySelector('[data-zl-cache="'+i+'"]');if(saveCacheBinding(g.id,r.node.id,r.index,sel?.value||"")){try{ROOT.showToast?.("✅ Liaison de cache enregistrée") }catch(e){}renderWorldCacheBindings()}});return true
}
function refreshEditors(){hideRoomCacheDestinationEditor();renderWorldCacheBindings()}
function installCoreRender(){const core=ROOT.DungeonCore01;if(!core||typeof core.render!=="function")return false;if(core.render.__zoneLinks167846)return true;const old=core.render;const wrapped=function(){const out=old.apply(this,arguments);try{paintTravelButtons()}catch(e){}return out};wrapped.__zoneLinks167846=true;wrapped.__zoneLinksOriginal=old;core.render=wrapped;return true}
function install(){
  const ok=!!builder()&&!!world();installCoreRender();refreshEditors();paintTravelButtons();
  if(DOC&&!DOC.__zoneLinks167846Click){DOC.__zoneLinks167846Click=true;DOC.addEventListener("click",e=>{if(e?.target?.closest?.("#drc100Modal,#drc300Modal"))setTimeout(refreshEditors,0)},true)}
  if(!ok&&retries++<30&&typeof setTimeout==="function")setTimeout(install,100);return ok
}
ROOT.DungeonZoneLinks167846={VERSION,APP_VERSION,authoredContext,nodeInfo,entryIndexForNode,reverseEdge,cacheBinding,saveCacheBinding,travelReverse,travelCache,travelReturn,paintTravelButtons,hideRoomCacheDestinationEditor,renderWorldCacheBindings,refreshEditors,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();