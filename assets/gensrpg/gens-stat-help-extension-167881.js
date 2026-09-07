/* GenSrpG V16.78.82 — contextual help + RPG rule bridge.
   Reuses the existing custom-stat, ability-library and equipment editors.
   Ability definitions remain in the ability library; links store IDs only.
   Damage abilities now enter the existing attack damage resolver as RAW damage. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="2.0.0",APP_VERSION="16.78.82";
const CORE_STATS=[
  ["force","Force"],["agilite","Agilité"],["intelligence","Intelligence"],["esprit","Esprit"],["endurance","Endurance"],["initiative","Initiative"]
];
const DAMAGE_KINDS=new Set(["damage","magic_damage","area_damage","double_strike","life_steal","execute","dot"]);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const attr=v=>esc(v).replace(/`/g,"&#96;");
const customApi=()=>R.GensCustomStats167879||null;
function profile(){try{return R.currentRpgProfile?.()||R.loadGameProfiles?.().find(x=>String(x.id)===String(R.activeGameProfileId?.()))||null}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfiles(a){try{R.saveGameProfiles?.(a);return true}catch(e){return false}}
function abilities(){try{return R.loadAbilityLibrary?.()||[]}catch(e){return []}}
function rpgAbilities(){return abilities().filter(a=>{try{return (R.gensAbilityUsages?.(a)||a.usageScopes||["rpgHero"]).includes("rpgHero")}catch(e){return true}})}
function statCatalog(){
  const out=CORE_STATS.map(([id,name])=>({id,name,custom:false}));
  try{for(const d of customApi()?.defs?.()||[])if(!out.some(x=>x.id===d.id))out.push({id:String(d.id),name:String(d.name||d.id),icon:String(d.icon||"📊"),custom:true})}catch(e){}
  return out;
}
function statValue(hero,id){
  try{const api=customApi(),d=api?.def?.(id);if(d)return Number(api.value(hero,id))||0}catch(e){}
  try{const s=R.loadState?.(hero)||{};if(s?.rpgAttributes?.[id]!=null)return Number(s.rpgAttributes[id])||0}catch(e){}
  try{const snap=R.dungeonCombatHeroSnapshot?.(hero)||{};if(snap?.[id]!=null)return Number(snap[id])||0}catch(e){}
  return 0;
}
function optionHtml(selected=""){return statCatalog().map(s=>'<option value="'+attr(s.id)+'"'+(String(s.id)===String(selected)?' selected':'')+'>'+esc((s.icon?s.icon+' ':'')+s.name+(s.custom?' · personnalisée':''))+'</option>').join("")}
function abilityOptionHtml(selected=""){return '<option value="">Aucune</option>'+rpgAbilities().map(a=>'<option value="'+attr(a.id)+'"'+(String(a.id)===String(selected)?' selected':'')+'>'+esc(a.name||a.id)+'</option>').join("")}
function rulesRoot(){const p=profile();if(!p?.rpgUniverse)return null;return p.rpgUniverse.rules=p.rpgUniverse.rules&&typeof p.rpgUniverse.rules==="object"?p.rpgUniverse.rules:{} }
function statAbilityLinks(){const root=rulesRoot();if(!root)return [];root.statAbilityLinks=Array.isArray(root.statAbilityLinks)?root.statAbilityLinks:[];return root.statAbilityLinks.map((x,i)=>({id:String(x?.id||('link_'+(i+1))),enabled:x?.enabled!==false,statId:String(x?.statId||"force"),when:["always","gte","lte"].includes(x?.when)?x.when:"gte",threshold:Number(x?.threshold)||0,abilityId:String(x?.abilityId||"")}))}
function persistStatLinks(list){const p=profile(),root=rulesRoot();if(!p||!root)return false;root.statAbilityLinks=(list||[]).map((x,i)=>({id:String(x.id||('link_'+(i+1))),enabled:x.enabled!==false,statId:String(x.statId||"force"),when:["always","gte","lte"].includes(x.when)?x.when:"gte",threshold:Number(x.threshold)||0,abilityId:String(x.abilityId||"")})).filter(x=>x.abilityId);const all=profiles(),ix=all.findIndex(x=>String(x.id||"")===String(p.id||""));if(ix>=0){all[ix]=p;saveProfiles(all)}renderStatLinks();return true}
function collectStatLinks(){if(!D)return statAbilityLinks();return [...D.querySelectorAll('#grb167882StatLinks .grbLink')].map((row,i)=>({id:row.dataset.id||('link_'+(i+1)),enabled:row.querySelector('[data-l="enabled"]')?.checked!==false,statId:row.querySelector('[data-l="stat"]')?.value||"force",when:row.querySelector('[data-l="when"]')?.value||"gte",threshold:Number(row.querySelector('[data-l="threshold"]')?.value)||0,abilityId:row.querySelector('[data-l="ability"]')?.value||""}))}
function addStatLink(){persistStatLinks([...collectStatLinks(),{id:'link_'+Date.now().toString(36),enabled:true,statId:statCatalog()[0]?.id||'force',when:'gte',threshold:10,abilityId:rpgAbilities()[0]?.id||''}])}
function removeStatLink(id){persistStatLinks(collectStatLinks().filter(x=>String(x.id)!==String(id)))}
function renderStatLinks(){
  if(!D)return false;const box=D.getElementById('gcs167879Box');if(!box)return false;
  let host=D.getElementById('grb167882StatLinks');if(!host){host=D.createElement('div');host.id='grb167882StatLinks';host.className='v2LibCard';host.style.marginTop='12px';box.insertAdjacentElement('afterend',host)}
  const rows=statAbilityLinks().map(x=>'<div class="v2LibCard grbLink" data-id="'+attr(x.id)+'" style="margin:7px 0"><div class="grid2"><label><input data-l="enabled" type="checkbox"'+(x.enabled?' checked':'')+'> Actif</label><label>Stat<select data-l="stat">'+optionHtml(x.statId)+'</select></label><label>Condition<select data-l="when"><option value="always"'+(x.when==='always'?' selected':'')+'>Toujours</option><option value="gte"'+(x.when==='gte'?' selected':'')+'>Stat ≥ seuil</option><option value="lte"'+(x.when==='lte'?' selected':'')+'>Stat ≤ seuil</option></select></label><label>Seuil<input data-l="threshold" type="number" value="'+x.threshold+'"></label><label style="grid-column:1/-1">Donne accès à<select data-l="ability">'+abilityOptionHtml(x.abilityId)+'</select></label></div><button type="button" onclick="GensRpgRuleBridge167882.removeStatLink(\''+attr(x.id)+'\')">🗑️ SUPPRIMER LE LIEN</button></div>').join('');
  host.innerHTML='<div class="v2LibHead"><strong>🔗 Stats → compétences</strong><button type="button" onclick="GensRpgRuleBridge167882.addStatLink()">＋ AJOUTER</button></div><div class="small">Une statistique peut donner accès à une compétence du Répertoire sans en copier la définition. La bibliothèque reste la source de vérité.</div>'+rows+'<div class="v2LibActions"><button type="button" onclick="GensRpgRuleBridge167882.persistStatLinks(GensRpgRuleBridge167882.collectStatLinks())">💾 ENREGISTRER LES LIENS</button></div>';
  return true;
}
function linkMatches(hero,l){if(!l?.enabled||!l.abilityId)return false;const v=statValue(hero,l.statId);return l.when==='always'||(l.when==='gte'&&v>=l.threshold)||(l.when==='lte'&&v<=l.threshold)}
function equippedItemsFor(hero){
  try{const st=R.loadState?.(hero)||{},ids=[st.rightHand,st.leftHand,st.equipment,...Object.values(st.rpgGear||{})],seen=new Set(),out=[];for(const ix of ids){if(ix===null||ix===undefined||seen.has(ix))continue;seen.add(ix);const en=st.inventory?.[Number(ix)];if(!en)continue;const it=R.itemById?.(en.itemId)||R.dungeonItems?.().find(x=>String(x.id)===String(en.itemId));if(it)out.push(it)}return out}catch(e){return []}
}
function grantedAbilities(hero){
  const ids=new Set();for(const l of statAbilityLinks())if(linkMatches(hero,l))ids.add(String(l.abilityId));for(const it of equippedItemsFor(hero))for(const id of (Array.isArray(it?.rpgAbilityRefs)?it.rpgAbilityRefs:[]))ids.add(String(id));
  const map=new Map(rpgAbilities().map(a=>[String(a.id),a]));return [...ids].map(id=>map.get(id)).filter(Boolean).map(a=>({...a,grantedByRule:true,requires:[],cost:0,tier:0}));
}
function decorateAbilityScaling(){
  if(!D)return false;const cat=statCatalog();D.querySelectorAll('#dtalentEffectsHost select[data-f="scaleAttribute"]').forEach(sel=>{const cur=sel.value;for(const s of cat)if(![...sel.options].some(o=>o.value===s.id)){const o=D.createElement('option');o.value=s.id;o.textContent=(s.icon?s.icon+' ':'')+s.name+(s.custom?' (personnalisée)':'');sel.appendChild(o)}if([...sel.options].some(o=>o.value===cur))sel.value=cur});
  const p=D.getElementById('dtalentPassiveAttribute');if(p){const cur=p.value;for(const s of cat)if(![...p.options].some(o=>o.value===s.id)){const o=D.createElement('option');o.value=s.id;o.textContent=(s.icon?s.icon+' ':'')+s.name+(s.custom?' (personnalisée)':'');p.appendChild(o)}if([...p.options].some(o=>o.value===cur))p.value=cur}
  return true;
}
function itemForEdit(){const id=D?.getElementById('eqEditId')?.value||'';try{return R.dungeonItems?.().find(x=>String(x.id)===String(id))||R.loadCustomEquipment?.().find(x=>String(x.id)===String(id))||null}catch(e){return null}}
function decorateEquipmentEditor(){
  if(!D)return false;const modal=D.getElementById('equipmentEditorModal'),anchor=D.getElementById('eqRpgBaseChanceWrap');if(!modal||!anchor)return false;let box=D.getElementById('grb167882EquipmentRules');if(!box){box=D.createElement('div');box.id='grb167882EquipmentRules';box.className='v2MechanicBox';anchor.insertAdjacentElement('afterend',box)}const it=itemForEdit()||{},sc=it.rpgScaling||{},refs=new Set(Array.isArray(it.rpgAbilityRefs)?it.rpgAbilityRefs.map(String):[]);box.innerHTML='<strong>🔗 Règles RPG avancées</strong><div class="small">Améliore cet objet sans dupliquer les compétences : les capacités restent définies dans le Répertoire.</div><div class="grid2" style="margin-top:7px"><label>Stat du jet / toucher<select id="grb167882WeaponStat">'+optionHtml(sc.attribute||'force')+'</select></label><label>Bonus dégâts via stat<select id="grb167882WeaponDamageStat"><option value="">Aucun bonus propre à l’arme</option>'+optionHtml(sc.damageAttribute||'')+'</select></label><label>Coefficient dégâts<input id="grb167882WeaponDamageCoeff" type="number" step="0.05" min="-10" max="10" value="'+(Number(sc.damageCoeff)||0)+'"></label></div><details style="margin-top:8px"><summary><strong>📚 Capacités accordées quand l’objet est équipé</strong></summary><div id="grb167882ItemAbilities">'+rpgAbilities().map(a=>'<label style="display:block;margin:5px 0"><input type="checkbox" value="'+attr(a.id)+'"'+(refs.has(String(a.id))?' checked':'')+'> '+esc(a.name||a.id)+'</label>').join('')+'</div></details>';
  return true;
}
function selectedItemRefs(){if(!D)return [];return [...D.querySelectorAll('#grb167882ItemAbilities input[type="checkbox"]:checked')].map(x=>String(x.value))}
function persistItemRules(id,refs,scPatch){
  if(!id)return false;try{
    if(Array.isArray(R.DUNGEON_ITEM_IDS)&&R.DUNGEON_ITEM_IDS.includes(String(id))&&typeof R.loadDungeonItemOverrides==='function'){const o=R.loadDungeonItemOverrides()||{},prev=o[id]&&typeof o[id]==='object'?o[id]:{},scale={...(prev.rpgScaling||R.dungeonItems?.().find(x=>String(x.id)===String(id))?.rpgScaling||{}),...(scPatch||{})};o[id]={...prev,rpgAbilityRefs:[...new Set(refs||[])],rpgScaling:scale};R.saveDungeonItemOverrides?.(o);R.refreshCustomEquipmentIntoItems?.();return true}
    const a=R.loadCustomEquipment?.()||[],ix=a.findIndex(x=>String(x.id)===String(id));if(ix<0)return false;a[ix]={...a[ix],rpgAbilityRefs:[...new Set(refs||[])],rpgScaling:{...(a[ix].rpgScaling||{}),...(scPatch||{})}};R.saveCustomEquipment?.(a);R.refreshCustomEquipmentIntoItems?.();return true
  }catch(e){console.warn('RPG item rule save',e);return false}
}
function progressionRawBonus(hero,e,raw){
  if(!DAMAGE_KINDS.has(String(e?.kind||'')))return 0;let r={};try{r=R.loadDungeonRpgRules?.()||{}}catch(_){return 0}const magical=String(e?.damageType||'')==='magical'||String(e?.kind||'')==='magic_damage',stat=magical?'intelligence':'force',v=statValue(hero,stat);if(magical){if(r.magicDamageFormula==='percent')return Math.max(0,Math.round(raw*v*Math.max(0,Number(r.magicDamagePercentPerPoint)||0)/100));return Math.floor(v/Math.max(1,Number(r.magicDamageStep)||10))*Math.max(0,Number(r.magicDamageGain)||0)}if(r.physicalDamageFormula==='percent')return Math.max(0,Math.round(raw*v*Math.max(0,Number(r.physicalDamagePercentPerPoint)||0)/100));return Math.floor(v/Math.max(1,Number(r.physicalDamageStep)||10))*Math.max(0,Number(r.physicalDamageGain)||0)
}
function calculatedTalentAmount(hero,e){
  let raw=Math.max(0,Number(e?.base)||0);if(e?.scaleAttribute&&Number(e?.scaleCoeff))raw+=statValue(hero,e.scaleAttribute)*Number(e.scaleCoeff);raw=Math.max(0,Math.round(raw));if(DAMAGE_KINDS.has(String(e?.kind||'')))raw+=progressionRawBonus(hero,e,raw);const api=customApi();if(api?.applyEffects&&DAMAGE_KINDS.has(String(e?.kind||''))){raw=api.applyEffects(raw,hero,'damage:all',{min:0});const t=(String(e?.damageType||'')==='magical'||String(e?.kind||'')==='magic_damage')?'damage:magic':(String(e?.attackMode||'')==='ranged'?'damage:ranged':'damage:melee');raw=api.applyEffects(raw,hero,t,{min:0})}return Math.max(0,Math.round(raw))
}
function installRawDamageBridge(){
  if(typeof R.dungeonTalentCalculatedAmount==='function'&&!R.dungeonTalentCalculatedAmount.__grb167882){const old=R.dungeonTalentCalculatedAmount,w=function(hero,e){return calculatedTalentAmount(hero,e)};w.__grb167882=true;w.__original=old;R.dungeonTalentCalculatedAmount=w}
  if(typeof R.dungeonTalentDealDirectDamage==='function'&&!R.dungeonTalentDealDirectDamage.__grb167882){const old=R.dungeonTalentDealDirectDamage,w=function(heroId,targetId,amount,damageType='physical',element=''){const target=R.loadActiveEnemies?.().find(e=>String(e.id)===String(targetId)&&!e.defeated&&Number(e.hp)>0);if(!target)return false;const raw=Math.max(0,Math.round(Number(amount)||0));try{R.combatRewardHeroId=heroId}catch(e){}const prev=R.attackRollContext;R.attackRollContext={heroId,hits:1,hitDamages:[raw],damageType,element,rawDamage:true};try{R.applyDungeonAttackDamage?.(target.id,raw,1,raw)}finally{R.attackRollContext=prev||null}return true};w.__grb167882=true;w.__original=old;R.dungeonTalentDealDirectDamage=w}
}
function wrapEditors(){
  const wrapAfter=(name,after)=>{const old=R[name];if(typeof old!=='function'||old.__grb167882)return;const w=function(){const out=old.apply(this,arguments);try{after.apply(this,arguments)}catch(e){}return out};w.__grb167882=true;w.__original=old;R[name]=w};
  wrapAfter('renderDungeonTalentEffectsEditor',decorateAbilityScaling);wrapAfter('openDungeonTalentNodeEditor',decorateAbilityScaling);wrapAfter('openEquipmentEditor',()=>setTimeout(decorateEquipmentEditor,0));
  const saveEq=R.saveEquipmentEditor;if(typeof saveEq==='function'&&!saveEq.__grb167882){const w=function(){let id=D?.getElementById('eqEditId')?.value||'';if(!id&&D?.getElementById('eqEditId')){id='custom_item_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);D.getElementById('eqEditId').value=id}const refs=selectedItemRefs(),hitStat=D?.getElementById('grb167882WeaponStat')?.value||'',damageAttribute=D?.getElementById('grb167882WeaponDamageStat')?.value||'',damageCoeff=Number(D?.getElementById('grb167882WeaponDamageCoeff')?.value)||0;const out=saveEq.apply(this,arguments);persistItemRules(id,refs,{attribute:hitStat||undefined,damageAttribute,damageCoeff});return out};w.__grb167882=true;w.__original=saveEq;R.saveEquipmentEditor=w}
  const eff=R.effectiveAttackStats;if(typeof eff==='function'&&!eff.__grbDamageScale167882){const w=function(it){const st=eff.apply(this,arguments);if(!st||!it?.rpgScaling?.damageAttribute||!Number(it.rpgScaling.damageCoeff))return st;const hero=String(R.current||''),v=statValue(hero,it.rpgScaling.damageAttribute),bonus=Math.round(v*Number(it.rpgScaling.damageCoeff));if(bonus){st.strength=Math.max(0,(Number(st.strength)||0)+bonus);st.mods=Array.isArray(st.mods)?st.mods:[];st.mods.push('Scaling '+(statCatalog().find(x=>x.id===it.rpgScaling.damageAttribute)?.name||it.rpgScaling.damageAttribute)+' : '+(bonus>=0?'+':'')+bonus+' dégâts bruts')}return st};w.__grbDamageScale167882=true;w.__original=eff;R.effectiveAttackStats=w}
}
function wrapGrantedAbilities(){
  const oldNodes=R.dungeonTreeNodesForHero;if(typeof oldNodes==='function'&&!oldNodes.__grb167882){const w=function(hero){const base=oldNodes.apply(this,arguments)||[],extra=grantedAbilities(hero),seen=new Set(base.map(x=>String(x.id)));return [...base,...extra.filter(x=>!seen.has(String(x.id)))]};w.__grb167882=true;w.__original=oldNodes;R.dungeonTreeNodesForHero=w}
  const oldActive=R.dungeonUnlockedActiveTalents;if(typeof oldActive==='function'&&!oldActive.__grb167882){const w=function(hero){const base=oldActive.apply(this,arguments)||[],extra=grantedAbilities(hero).filter(x=>x.type==='active'),seen=new Set(base.map(x=>String(x.id)));return [...base,...extra.filter(x=>!seen.has(String(x.id)))]};w.__grb167882=true;w.__original=oldActive;R.dungeonUnlockedActiveTalents=w}
  const oldEffects=R.dungeonUnlockedSkillEffectsForHero;if(typeof oldEffects==='function'&&!oldEffects.__grb167882){const w=function(hero){const base=oldEffects.apply(this,arguments)||[],extra=grantedAbilities(hero).filter(x=>x.type!=='active').flatMap(x=>Array.isArray(x.effects)?x.effects:[]);return [...base,...extra]};w.__grb167882=true;w.__original=oldEffects;R.dungeonUnlockedSkillEffectsForHero=w}
}
function installHelp(){const api=R.GensStatRules167880;if(!api?.HELP)return false;api.HELP.primaryStats={title:'Caractéristiques principales',body:'Cette liste est le sélecteur unique des caractéristiques actives de l’univers. Les statistiques personnalisées créées plus bas y apparaissent automatiquement.',example:'Tu crées Épuisement : elle apparaît ici et peut ensuite être utilisée par les tests, compétences et objets.'};api.HELP.statEffects={title:'Effets en jeu d’une statistique',body:'Les effets directs restent définis dans la statistique. Pour donner une vraie capacité, utilise Stats → compétences : la capacité n’est pas copiée, elle reste dans le Répertoire.',example:'Épuisement ≥ 70 → Déplacement -1. Furtivité ≥ 10 → donne accès à une capacité du Répertoire.'};api.HELP.rawDamage={title:'Dégâts bruts : valeur de référence',body:'Une arme ou compétence produit d’abord des dégâts bruts. Les bonus de caractéristiques et effets modifient cette valeur. Ensuite seulement viennent les filtres : élément, armure/résistance et réductions.',example:'Épée de lumière : 3 brut + bonus Force → élément Lumière → armure/résistance → dégâts finaux.'};if(D){const host=D.getElementById('rpgStatsList')?.closest('.smodCard'),h=host?.querySelector('h3');if(h&&!h.querySelector('.gsh167881PrimaryHelp')){const b=D.createElement('button');b.type='button';b.className='gsh167880Help gsh167881PrimaryHelp';b.textContent='?';b.onclick=()=>api.help('primaryStats');h.appendChild(b)}}return true}
function wrapCustomApi(){const api=customApi();if(!api||api.__grb167882)return;for(const n of ['persist','add','remove']){const old=api[n];if(typeof old!=='function')continue;api[n]=function(){const out=old.apply(this,arguments);setTimeout(()=>{renderStatLinks();decorateAbilityScaling()},0);return out}}api.__grb167882=true}
function install(){try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}installHelp();wrapCustomApi();wrapEditors();wrapGrantedAbilities();installRawDamageBridge();decorateAbilityScaling();decorateEquipmentEditor();renderStatLinks();setTimeout(()=>{installHelp();wrapCustomApi();wrapEditors();wrapGrantedAbilities();installRawDamageBridge();decorateAbilityScaling();renderStatLinks()},120);return true}
R.GensRpgRuleBridge167882={VERSION,APP_VERSION,statCatalog,statValue,statAbilityLinks,persistStatLinks,collectStatLinks,addStatLink,removeStatLink,grantedAbilities,decorateAbilityScaling,decorateEquipmentEditor,persistItemRules,calculatedTalentAmount,installRawDamageBridge,install};
R.GensStatHelpExtension167881={VERSION,APP_VERSION,install};
if(D){D.readyState==='loading'?D.addEventListener('DOMContentLoaded',install,{once:true}):install()}
})();
