/* GenSrpG V16.78.31 — intuitive exact-content editor controls.
   UI-only layer over the existing zone/template content APIs.
   Reuses existing enemy catalog, dungeonTrapTypes() and itemsForMode(true).
   One placed enemy marker = one enemy for now; legacy qty/hp/key fields remain schema-compatible. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.31";
const drafts={zone:[],template:[]};
let installed=false;
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function visual(){return ROOT.DungeonRoomVisualConfig167826||ROOT.DungeonRoomVisualConfig167825||null}
function template(){return ROOT.DungeonRoomTemplateContent167828||null}
function trapTypes(){
  try{const x=ROOT.dungeonTrapTypes?.();if(Array.isArray(x)&&x.length)return x.map(t=>({id:String(t?.id||""),label:String(t?.label||t?.name||t?.id||"Piège")})).filter(t=>t.id)}catch(e){}
  return [{id:"dtrap_darts",label:"Fléchettes"},{id:"dtrap_snare",label:"Entrave"},{id:"dtrap_rune",label:"Rune explosive"},{id:"dtrap_collapse",label:"Éboulement"}];
}
function lootItems(){
  let list=[];try{list=ROOT.itemsForMode?.(true)||[]}catch(e){}
  const seen=new Set(),out=[];
  for(const it of Array.isArray(list)?list:[]){const id=String(it?.id||it?.itemId||it?.key||"");if(!id||seen.has(id))continue;seen.add(id);out.push({id,label:String(it?.name||it?.label||it?.title||id),rarity:String(it?.rarity||"")})}
  return out.sort((a,b)=>a.label.localeCompare(b.label,"fr"));
}
function parseItems(text){try{return visual()?.parseItems?.(text)||[]}catch(e){return []}}
function itemsText(items){return (Array.isArray(items)?items:[]).map(x=>String(x.itemId||x.id||"")+(Number(x.qty||1)>1?"*"+Math.max(1,Math.trunc(Number(x.qty)||1)):"")).join("\n")}
function prefix(surface){return surface==="zone"?"drv167826":"drt"}
function grid(surface){return DOC?.querySelector?.(surface==="zone"?"#drv167826Modal .drv167826Grid":"#drt167828Modal .drtGrid")||null}
function currentValues(surface,obj){const p=prefix(surface),get=id=>DOC?.getElementById(p+id);if(obj==="enemy"||obj==="boss")return {enemyId:String(get("Enemy")?.value||"dng_skeleton")};if(obj==="chest")return {rarity:String(get("Rarity")?.value||"common"),gold:Number(get("Gold")?.value||0),items:String(get("Items")?.value||"")};if(obj==="trap")return {refId:String(get(surface==="zone"?"TrapRef":"TrapRef")?.value||""),label:String(get(surface==="zone"?"TrapLabel":"TrapLabel")?.value||"")};return {}}
function optionHtml(items,value){return items.map(x=>'<option value="'+esc(x.id)+'" '+(String(x.id)===String(value)?'selected':'')+'>'+esc(x.label)+(x.rarity?' · '+esc(x.rarity):'')+'</option>').join('')}
function enemyOptionsFromOld(surface,value){const p=prefix(surface),old=DOC?.getElementById(p+"Enemy");if(old?.innerHTML)return old.innerHTML;const api=visual();const fallback=["dng_skeleton","dng_skeleton_archer","dng_skeleton_guard","dng_ghoul","dng_wraith","dng_lich","dng_goblin","dng_goblin_archer","dng_goblin_shaman","dng_orc","dng_orc_berserker","dng_orc_shaman","dng_spider","dng_direwolf","dng_harpy","dng_troll","dng_golem","dng_minotaur","dng_wyvern","dng_necromancer"];return fallback.map(id=>'<option value="'+id+'" '+(id===value?'selected':'')+'>'+id.replace(/^dng_/,"")+'</option>').join('')}
function simplify(surface,obj){
  const g=grid(surface);if(!g)return false;const p=prefix(surface),v=currentValues(surface,obj),full=surface==="zone"?"drv167826Full":"drtFull";
  if(obj==="enemy"||obj==="boss"){
    const opts=enemyOptionsFromOld(surface,v.enemyId);g.innerHTML='<label class="'+full+'">Type de monstre<select id="'+p+'Enemy">'+opts+'</select></label><div class="'+full+'" style="font-size:12px;color:#aaa">1 marqueur = 1 ennemi. Les PV et statistiques viennent de la fiche du monstre existante.</div>';return true;
  }
  if(obj==="chest"){
    drafts[surface]=parseItems(v.items);const items=lootItems();g.innerHTML='<label>Rareté<select id="'+p+'Rarity"><option value="common">Commun</option><option value="rare">Rare</option><option value="epic">Épique</option><option value="legendary">Légendaire</option></select></label><label>Or exact<input id="'+p+'Gold" type="number" min="0" value="'+Math.max(0,Math.trunc(v.gold||0))+'"></label><label class="'+full+'">Objet à ajouter<select id="dui167831Item'+surface+'">'+(items.length?optionHtml(items,""):'<option value="">— aucun objet disponible —</option>')+'</select></label><label>Quantité<input id="dui167831Qty'+surface+'" type="number" min="1" max="99" value="1"></label><button type="button" onclick="DungeonRoomContentUI167831.addItem(\''+surface+'\')">➕ Ajouter au coffre</button><div id="dui167831List'+surface+'" class="'+full+'"></div><textarea id="'+p+'Items" style="display:none"></textarea>';
    DOC.getElementById(p+"Rarity").value=v.rarity;renderItems(surface);return true;
  }
  if(obj==="trap"){
    const traps=trapTypes(),selected=traps.some(t=>t.id===v.refId)?v.refId:(traps[0]?.id||"");g.innerHTML='<label class="'+full+'">Type de piège<select id="dui167831Trap'+surface+'">'+optionHtml(traps,selected)+'</select></label><input type="hidden" id="'+p+'TrapType" value="reference"><input type="hidden" id="'+p+'Damage" value="0"><input type="hidden" id="'+p+'TrapRef"><input type="hidden" id="'+p+'TrapLabel"><div class="'+full+'" style="font-size:12px;color:#aaa">Le piège utilise directement le système de pièges existant du Dungeon.</div>';const sel=DOC.getElementById("dui167831Trap"+surface);if(sel)sel.onchange=()=>syncTrap(surface);syncTrap(surface);return true;
  }
  return false;
}
function renderItems(surface){const box=DOC?.getElementById("dui167831List"+surface),hidden=DOC?.getElementById(prefix(surface)+"Items");if(hidden)hidden.value=itemsText(drafts[surface]);if(!box)return;const names=new Map(lootItems().map(x=>[x.id,x.label]));box.innerHTML=drafts[surface].length?'<div style="font-size:12px;font-weight:800;margin:6px 0">Contenu du coffre</div>'+drafts[surface].map((it,i)=>'<div style="display:flex;gap:8px;align-items:center;margin:5px 0;padding:7px;border:1px solid #444;border-radius:8px"><span style="flex:1">'+esc(names.get(String(it.itemId))||it.itemId)+' × '+Math.max(1,Number(it.qty)||1)+'</span><button type="button" style="padding:5px 8px;font-size:12px" onclick="DungeonRoomContentUI167831.removeItem(\''+surface+'\','+i+')">✕</button></div>').join(''):'<div style="font-size:12px;color:#aaa">Aucun objet exact ajouté. Le coffre peut contenir seulement de l’or.</div>'}
function addItem(surface){const sel=DOC?.getElementById("dui167831Item"+surface),qty=DOC?.getElementById("dui167831Qty"+surface),id=String(sel?.value||"");if(!id)return false;const n=Math.max(1,Math.min(99,Math.trunc(Number(qty?.value)||1))),old=drafts[surface].find(x=>String(x.itemId)===id);if(old)old.qty=Math.max(1,Number(old.qty)||1)+n;else drafts[surface].push({itemId:id,qty:n});renderItems(surface);return true}
function removeItem(surface,index){const i=Math.trunc(Number(index));if(i<0||i>=drafts[surface].length)return false;drafts[surface].splice(i,1);renderItems(surface);return true}
function syncTrap(surface){const sel=DOC?.getElementById("dui167831Trap"+surface),id=String(sel?.value||""),t=trapTypes().find(x=>x.id===id);const p=prefix(surface),ref=DOC?.getElementById(p+"TrapRef"),label=DOC?.getElementById(p+"TrapLabel"),type=DOC?.getElementById(p+"TrapType"),damage=DOC?.getElementById(p+"Damage");if(ref)ref.value=id;if(label)label.value=String(t?.label||id);if(type)type.value="reference";if(damage)damage.value="0";return !!id}
function patch(api,surface){if(!api||api.__dui167831Patched||typeof api.openEditor!=="function")return false;const old=api.openEditor;api.openEditor=function(cell,obj){const ok=old.apply(this,arguments);if(ok)simplify(surface,String(obj));return ok};api.__dui167831Patched=true;return true}
function install(){if(installed){patch(visual(),"zone");patch(template(),"template");return true}installed=true;try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}patch(visual(),"zone");patch(template(),"template");return true}
ROOT.DungeonRoomContentUI167831={VERSION,APP_VERSION,trapTypes,lootItems,simplify,addItem,removeItem,renderItems,syncTrap,patch,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
