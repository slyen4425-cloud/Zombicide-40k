/* GenSrpG V16.78.94 — clean RPG stats, single-authority effects and canonical Dungeon runtime link.
   Keeps the phone-validated V16.78.92 stat editor/runtime, but migrates old hidden characteristic
   coefficients into the visible effect system once, then neutralizes their legacy gain keys. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="3.3.0",APP_VERSION="16.78.94",EFFECT_KEY="dynamicEffects90",LEGACY_MIGRATION_KEY="legacyEffectsMigrated94";
const ALIAS={agility:"agilite",spirit:"esprit",strength:"force",dexterity:"agilite",wisdom:"esprit",constitution:"endurance"};
const CORE=[
 ["force","Force","💪",10,0,999,"Dégâts physiques et précision de mêlée."],
 ["agilite","Agilité","🏃",10,0,999,"Distance, critique, esquive et initiative."],
 ["intelligence","Intelligence","🧠",10,0,999,"Dégâts et précision magiques."],
 ["esprit","Esprit","✨",10,0,999,"Mana et résistance magique."],
 ["endurance","Endurance","❤️",10,0,999,"Points de vie maximum."],
 ["initiative","Initiative","⚡",0,-999,999,"Ordre d'action et tests d'initiative."]
].map(x=>({id:x[0],name:x[1],icon:x[2],defaultValue:x[3],min:x[4],max:x[5],visible:true,description:x[6]}));
const CORE_IDS=new Set(CORE.map(x=>x.id));
const TARGETS=[
 ["damage:physical","⚔️ Dégâts physiques bruts"],["damage:melee","🗡️ Dégâts bruts mêlée"],["damage:ranged","🏹 Dégâts bruts distance"],["damage:magic","✨ Dégâts magiques bruts"],
 ["hit:melee","🎯 Toucher mêlée"],["hit:ranged","🎯 Toucher distance"],["hit:magic","🎯 Toucher magie"],
 ["max_hp","❤️ PV maximum"],["max_mana","🔷 Mana maximum"],["crit","💥 Critique %"],["dodge","💨 Esquive %"],["magic_resistance","🔮 Résistance magique"],
 ["defense","🛡️ Défense"],["armor","🧱 Armure"],["initiative","⚡ Initiative"],["enemy_vision","👁️ Champ de vision des ennemis"]
];
const LEGACY=[
 ["legacy_phys","force","damage:physical","physicalDamageStep","physicalDamageGain"],
 ["legacy_magic","intelligence","damage:magic","magicDamageStep","magicDamageGain"],
 ["legacy_hp","endurance","max_hp","enduranceHpStep","hpGain"],
 ["legacy_mana","esprit","max_mana","spiritManaStep","manaGain"],
 ["legacy_crit","agilite","crit","agilityCritStep","critGain"],
 ["legacy_dodge","agilite","dodge","agilityDodgeStep","dodgeGain"],
 ["legacy_hit_melee","force","hit:melee","meleeHitStep","meleeHitGain"],
 ["legacy_hit_ranged","agilite","hit:ranged","rangedHitStep","rangedHitGain"],
 ["legacy_hit_magic","intelligence","hit:magic","magicHitStep","magicHitGain"],
 ["legacy_magic_res","esprit","magic_resistance","spiritMagicResistStep","magicResistGain"]
];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=v=>String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_ -]/g,"").replace(/[ -]+/g,"_").replace(/^_+|_+$/g,"");
const canon=id=>ALIAS[String(id||"")]||String(id||"");
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function dungeon(){try{return !!R.isDungeonMode?.()}catch(e){return false}}
function profile(){try{return R.currentRpgProfile?.()||R.getActiveGameProfile?.()||null}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfile(p){try{const a=profiles();if(!Array.isArray(a)||!p)return false;const ids=[p.id,R.activeGameProfileId?.(),R.getActiveGameProfileId?.()].filter(Boolean).map(String);let i=a.findIndex(x=>ids.includes(String(x?.id||"")));if(i<0&&p?.name){const same=a.map((x,n)=>String(x?.name||"")===String(p.name)?n:-1).filter(n=>n>=0);if(same.length===1)i=same[0]}if(i<0&&a.length===1)i=0;if(i<0)return false;a[i]=p;R.saveGameProfiles?.(a);return true}catch(e){console.warn("clean stats save profile",e);return false}}
function normDef(d){if(!d)return null;const id=canon(slug(d.id||d.name));if(!id)return null;const min=num(d.min,0),max=Math.max(min,num(d.max,999));return {id,name:String(d.name||id),icon:String(d.icon||"📊"),defaultValue:clamp(num(d.defaultValue,0),min,max),min,max,visible:d.visible!==false,description:String(d.description||"")}}
function targetValid(t){return TARGETS.some(x=>x[0]===t)||String(t||"").startsWith("stat:")}
function normEffect(e,i=0){if(!e)return null;const source=canon(e.source),target=String(e.target||"");if(!source||!targetValid(target))return null;return {id:String(e.id||("effect_"+(i+1))),source,target,mode:e.mode==="threshold"?"threshold":"step",step:Math.max(1,num(e.step,1)),gain:num(e.gain,0),threshold:num(e.threshold,10),comparator:["gt","gte","lt","lte","eq"].includes(e.comparator)?e.comparator:"gt",enabled:e.enabled!==false}}
function root(p=profile()){
 if(!p?.rpgUniverse)return null;
 const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
 const by=new Map((Array.isArray(s.dynamicDefinitions)?s.dynamicDefinitions:[]).map(normDef).filter(Boolean).map(x=>[x.id,x]));
 for(const c of CORE)by.set(c.id,normDef({...c,...(by.get(c.id)||{}),id:c.id}));
 s.dynamicDefinitions=[...by.values()];
 s.active=[...new Set((Array.isArray(s.active)?s.active:CORE.map(c=>c.id)).map(canon))];
 const current=(Array.isArray(s[EFFECT_KEY])?s[EFFECT_KEY]:[]).map(normEffect).filter(Boolean);
 const old=(Array.isArray(s.dynamicRules)?s.dynamicRules:[]).map((r,i)=>normEffect({...r,mode:"step",threshold:10,comparator:"gt"},i)).filter(Boolean);
 const fx=new Map(current.map(e=>[e.id,e]));for(const e of old)if(!fx.has(e.id))fx.set(e.id,e);
 s[EFFECT_KEY]=[...fx.values()];
 s.dynamicRules=old.map(e=>({id:e.id,source:e.source,target:e.target,step:e.step,gain:e.gain,enabled:e.enabled}));
 return s;
}
function defs(){return root()?.dynamicDefinitions||[]}
function def(id){id=canon(id);return defs().find(x=>x.id===id)||null}
function active(id){return (root()?.active||[]).includes(canon(id))}
function effects(){return root()?.[EFFECT_KEY]||[]}
function legacyEffects(){
 const s=root();if(s?.[LEGACY_MIGRATION_KEY])return [];
 const r=R.loadDungeonRpgRules?.()||{};
 return LEGACY.map(x=>({id:x[0],source:x[1],target:x[2],mode:"step",step:Math.max(1,num(r[x[3]],10)),gain:num(r[x[4]],0),threshold:0,comparator:"gt",enabled:true,legacy:true,stepKey:x[3],gainKey:x[4]}))
}
function migrateLegacyEffects(p=profile()){
 const s=root(p);if(!s||s[LEGACY_MIGRATION_KEY])return false;
 const rules={...(R.loadDungeonRpgRules?.()||{})};
 const current=(Array.isArray(s[EFFECT_KEY])?s[EFFECT_KEY]:[]).map(normEffect).filter(Boolean);
 let changed=false;
 for(const x of LEGACY){
   const [legacyId,source,target,stepKey,gainKey]=x,step=Math.max(1,num(rules[stepKey],10)),gain=num(rules[gainKey],0);
   const replacement=current.some(e=>e.source===source&&e.target===target);
   if(gain!==0&&!replacement){
     const id="migrated_"+legacyId;
     if(!current.some(e=>e.id===id))current.push(normEffect({id,source,target,mode:"step",step,gain,threshold:0,comparator:"gt",enabled:true}));
   }
   if(num(rules[gainKey],0)!==0){rules[gainKey]=0;changed=true}
 }
 s[EFFECT_KEY]=current;
 s.dynamicRules=current.filter(e=>e.mode==="step"&&!String(e.target).startsWith("stat:")).map(e=>({id:e.id,source:e.source,target:e.target,step:e.step,gain:e.gain,enabled:e.enabled}));
 s[LEGACY_MIGRATION_KEY]=true;
 try{R.saveDungeonRpgRules?.(rules)}catch(e){console.warn("clean stats legacy rules save",e)}
 saveProfile(p);
 return changed||true
}
function allEffects(){return [...legacyEffects(),...effects()]}
function targetLabel(t){if(String(t).startsWith("stat:")){const d=def(String(t).slice(5));return (d?.icon?d.icon+" ":"")+(d?.name||String(t).slice(5))}return TARGETS.find(x=>x[0]===t)?.[1]||t}
function sentence(e){const s=def(e.source)?.name||e.source,t=targetLabel(e.target),g=(e.gain>=0?"+":"")+e.gain;if(e.mode==="threshold")return `Si ${s} ${e.comparator==="gte"?"≥":e.comparator==="lte"?"≤":e.comparator==="gt"?">":e.comparator==="lt"?"<":"="} ${e.threshold} : ${g} ${t}.`;return `Tous les ${e.step} point(s) de ${s} : ${g} ${t}.`}
function summaryFor(id){const a=allEffects().filter(e=>e.enabled&&e.source===canon(id));return a.length?a.map(sentence).join(" "):"Aucun effet configuré pour cette stat."}
function stFor(hero){try{return hero===String(R.current||"")&&R.state?R.state:R.loadState?.(hero)||null}catch(e){return null}}
let nativeAttr=null,nativeChange=null,sheetObserver=null;
function customBase(hero,id){const d=def(id),st=stFor(hero);if(!d)return 0;if(!st)return d.defaultValue;st.rpgAttributes=st.rpgAttributes&&typeof st.rpgAttributes==="object"?st.rpgAttributes:{};if(!Number.isFinite(Number(st.rpgAttributes[id])))st.rpgAttributes[id]=d.defaultValue;return clamp(num(st.rpgAttributes[id],d.defaultValue),d.min,d.max)}
function baseValue(hero,id){id=canon(id);const d=def(id);if(!d||!active(id))return 0;if(CORE_IDS.has(id)&&hero===String(R.current||"")&&typeof nativeAttr==="function")return num(nativeAttr.call(R,id),0);let n=customBase(hero,id);try{n+=num(R.dungeonEquipmentBonus?.(id),0)}catch(e){}try{n+=num(R.dungeonSkillEffectTotal?.("attribute",null,id),0)}catch(e){}try{n+=num(R.dungeonChallengeDebuffTotal067?.(id,stFor(hero)),0)}catch(e){}return n}
function compare(v,c,t){return c==="gte"?v>=t:c==="lte"?v<=t:c==="lt"?v<t:c==="eq"?v===t:v>t}
function effectAmount(e,hero,seen){if(!e?.enabled)return 0;const v=value(hero,e.source,seen);if(e.mode==="threshold")return compare(v,e.comparator,e.threshold)?e.gain:0;return Math.floor(v/Math.max(1,e.step))*e.gain}
function statEffectTotal(id,hero,seen){const target="stat:"+canon(id);return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmount(e,hero,seen),0)}
function value(hero,id,seen=new Set()){id=canon(id);const d=def(id);if(!d||!active(id))return 0;if(seen.has(id))return baseValue(hero,id);const next=new Set(seen);next.add(id);return clamp(baseValue(hero,id)+statEffectTotal(id,hero,next),d.min,d.max)}
function extraTotal(target,hero=String(R.current||"")){return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmount(e,hero,new Set()),0)}
function saveState(hero,st){try{if(hero===String(R.current||"")&&R.state===st){R.save?.();return true}if(typeof R.key==="function"){localStorage.setItem(R.key(hero),JSON.stringify(st));return true}R.saveState?.(hero,st);return true}catch(e){return false}}
function runtimeDefs(){return defs().filter(d=>active(d.id)&&d.visible!==false)}
function canonicalAttributeArray(){try{return typeof DUNGEON_DEFAULT_ATTRIBUTES!=="undefined"&&Array.isArray(DUNGEON_DEFAULT_ATTRIBUTES)?DUNGEON_DEFAULT_ATTRIBUTES:null}catch(e){return null}}
function syncCanonicalAttributes(target=canonicalAttributeArray()){if(!Array.isArray(target))return false;const rows=runtimeDefs().map(d=>({id:d.id,name:(d.icon?d.icon+" ":"")+d.name}));target.splice(0,target.length,...rows);return true}
function syncHeroDefaults(){
 let changed=false;const custom=defs().filter(d=>!CORE_IDS.has(d.id));
 try{for(const c of Object.values(R.CHARS||{})){if(!c?.dungeonStats)continue;for(const d of custom)c.dungeonStats[d.id]=d.defaultValue}}catch(e){}
 const hero=String(R.current||""),st=stFor(hero);if(!hero||!st)return false;
 st.rpgAttributes=st.rpgAttributes&&typeof st.rpgAttributes==="object"?st.rpgAttributes:{};
 for(const d of runtimeDefs())if(!CORE_IDS.has(d.id)&&!Number.isFinite(Number(st.rpgAttributes[d.id]))){st.rpgAttributes[d.id]=d.defaultValue;changed=true}
 if(changed)saveState(hero,st);return changed
}
function syncCanonicalRuntime(){syncCanonicalAttributes();return syncHeroDefaults()}
function decorateCanonicalSheet(){
 if(!D||!dungeon())return false;const host=D.getElementById("dungeonAttributeGrid");if(!host)return false;
 for(const box of host.querySelectorAll(".dungeonStatBox")){
  const id=canon(box.querySelector("[data-attr]")?.dataset?.attr||""),d=def(id);if(!d)continue;
  const strong=box.querySelector("strong");if(strong)strong.textContent=(d.icon?d.icon+" ":"")+d.name;
  const controls=box.querySelector(".controls"),oldSmalls=[...box.querySelectorAll("small")].filter(x=>!x.hasAttribute("data-clean-stat-explanation"));if(oldSmalls.length>1)oldSmalls[oldSmalls.length-1].style.display="none";
  let note=box.querySelector("[data-clean-stat-explanation]");if(!note){note=D.createElement("small");note.setAttribute("data-clean-stat-explanation","1");note.style.cssText="display:block;color:#d6c18a;margin:5px 0;line-height:1.35;text-align:left";box.insertBefore(note,controls||null)}
  const parts=[];if(d.description)parts.push(d.description);const s=summaryFor(id);if(s&&s!=="Aucun effet configuré pour cette stat.")parts.push(s);note.textContent=parts.join(" · ")||"Aucun effet configuré pour cette stat.";
 }
 return true
}
function refreshCanonicalSheet(){const changed=syncCanonicalRuntime();if(changed&&typeof R.renderDungeonAttributes==="function"){setTimeout(()=>{try{R.renderDungeonAttributes()}catch(e){}},0);return true}return decorateCanonicalSheet()}
function observeCanonicalSheet(){if(!D||sheetObserver||typeof R.MutationObserver!=="function")return false;sheetObserver=new R.MutationObserver(m=>{for(const x of m){const t=x.target;if(t?.id==="dungeonAttributeGrid"||t?.closest?.("#dungeonAttributeGrid")||[...x.addedNodes||[]].some(n=>n?.id==="dungeonAttributeGrid"||n?.querySelector?.("#dungeonAttributeGrid"))){setTimeout(refreshCanonicalSheet,0);break}}});sheetObserver.observe(D.documentElement,{childList:true,subtree:true});return true}
function changeCustom(id,delta){id=canon(id);if(!dungeon()||CORE_IDS.has(id))return false;const d=def(id),hero=String(R.current||""),st=stFor(hero);if(!d||!hero||!st||!active(id))return false;syncHeroDefaults();const cur=customBase(hero,id);if(delta>0&&cur>=d.max)return false;if(delta<0&&cur<=d.min)return false;if(typeof nativeChange==="function"){nativeChange.call(R,id,delta);setTimeout(decorateCanonicalSheet,0);return true}return false}
function opt(list,selected){return list.map(x=>'<option value="'+esc(x[0])+'"'+(x[0]===selected?' selected':'')+'>'+esc(x[1])+'</option>').join('')}
function effectTargets(){return [...TARGETS,...defs().map(d=>["stat:"+d.id,"📊 Stat : "+(d.icon?d.icon+" ":"")+d.name])]}
function effectHtml(e){return '<div class="v2LibCard" data-effect-id="'+esc(e.id)+'" style="margin-top:8px"><div class="v2LibHead"><strong data-effect-summary>'+esc(sentence(e))+'</strong><button type="button" data-remove-effect="'+esc(e.id)+'">🗑️</button></div><div class="grid2"><label>Effet<select data-effect-target>'+opt(effectTargets(),e.target)+'</select></label><label>Type<select data-effect-mode><option value="step"'+(e.mode==="step"?' selected':'')+'>Tous les X points</option><option value="threshold"'+(e.mode==="threshold"?' selected':'')+'>Si valeur / seuil</option></select></label><label>Palier X<input data-effect-step type="number" min="1" value="'+e.step+'"></label><label>Seuil<input data-effect-threshold type="number" value="'+e.threshold+'"></label><label>Condition<select data-effect-comp><option value="gt"'+(e.comparator==="gt"?' selected':'')+'>&gt;</option><option value="gte"'+(e.comparator==="gte"?' selected':'')+'>≥</option><option value="lt"'+(e.comparator==="lt"?' selected':'')+'> &lt;</option><option value="lte"'+(e.comparator==="lte"?' selected':'')+'>≤</option><option value="eq"'+(e.comparator==="eq"?' selected':'')+'>=</option></select></label><label>Bonus / malus<input data-effect-gain type="number" step="0.1" value="'+e.gain+'"></label></div></div>'}
function cardHtml(d,i){const rows=allEffects().filter(e=>e.source===d.id).map(effectHtml).join('');return '<section class="v2LibCard" data-stat-card="'+esc(d.id)+'" data-def-index="'+i+'" style="margin-top:10px"><div class="v2LibHead"><strong>'+esc((d.icon?d.icon+' ':'')+d.name)+'</strong>'+(CORE_IDS.has(d.id)?'<small>'+esc(d.id)+'</small>':'<button type="button" data-remove-stat="'+esc(d.id)+'">🗑️</button>')+'</div><div class="grid2"><label><input data-active type="checkbox"'+(active(d.id)?' checked':'')+'> Active en jeu</label><label>Nom<input data-name value="'+esc(d.name)+'"></label><label>Icône<input data-icon value="'+esc(d.icon)+'"></label><label>Valeur de départ<input data-default type="number" value="'+d.defaultValue+'"></label><label>Minimum<input data-min type="number" value="'+d.min+'"></label><label>Maximum<input data-max type="number" value="'+d.max+'"></label></div><label style="display:grid;gap:5px;margin-top:7px">Description<input data-desc value="'+esc(d.description)+'"></label><div class="v2LibHead" style="margin-top:10px"><strong>🔗 Effets</strong><button type="button" data-add-effect="'+esc(d.id)+'">＋ Ajouter un effet</button></div><div data-effect-list>'+rows+'</div><div class="small" style="margin-top:8px"><strong>Résumé :</strong> '+esc(summaryFor(d.id))+'</div></section>'}
function syncEditor(host){
 const p=profile(),s=root(p);if(!p||!s||!host)return false;
 const by=new Map(s.dynamicDefinitions.map(d=>[d.id,d]));
 for(const card of host.querySelectorAll('[data-stat-card]')){const id=canon(card.dataset.statCard),d=by.get(id);if(!d)continue;d.name=String(card.querySelector('[data-name]')?.value||d.name);d.icon=String(card.querySelector('[data-icon]')?.value||d.icon||"📊");d.min=num(card.querySelector('[data-min]')?.value,d.min);d.max=Math.max(d.min,num(card.querySelector('[data-max]')?.value,d.max));d.defaultValue=clamp(num(card.querySelector('[data-default]')?.value,d.defaultValue),d.min,d.max);d.description=String(card.querySelector('[data-desc]')?.value||"");s.active=s.active.filter(x=>canon(x)!==id);if(card.querySelector('[data-active]')?.checked)s.active.push(id)}
 const customBy=new Map(s[EFFECT_KEY].map(e=>[e.id,e]));
 for(const row of host.querySelectorAll('[data-effect-id]')){const id=row.dataset.effectId,old=customBy.get(id);if(!old)continue;customBy.set(id,normEffect({...old,target:String(row.querySelector('[data-effect-target]')?.value||old.target),mode:String(row.querySelector('[data-effect-mode]')?.value)==="threshold"?"threshold":"step",step:Math.max(1,num(row.querySelector('[data-effect-step]')?.value,old.step)),threshold:num(row.querySelector('[data-effect-threshold]')?.value,old.threshold),comparator:String(row.querySelector('[data-effect-comp]')?.value||old.comparator),gain:num(row.querySelector('[data-effect-gain]')?.value,old.gain)}))}
 s[EFFECT_KEY]=[...customBy.values()].filter(Boolean);
 s.dynamicRules=s[EFFECT_KEY].filter(e=>e.mode==="step"&&!String(e.target).startsWith("stat:")).map(e=>({id:e.id,source:e.source,target:e.target,step:e.step,gain:e.gain,enabled:e.enabled}));
 const ok=saveProfile(p);syncCanonicalRuntime();return ok
}
function makeStatId(){const used=new Set(defs().map(d=>d.id));let id="nouvelle_stat",n=2;while(used.has(id))id="nouvelle_stat_"+n++;return id}
function addStat(host){if(host)syncEditor(host);const p=profile(),s=root(p);if(!p||!s)return false;const id=makeStatId();s.dynamicDefinitions.push(normDef({id,name:"Nouvelle stat",icon:"📊",defaultValue:0,min:0,max:999,visible:true,description:""}));if(!s.active.includes(id))s.active.push(id);if(!saveProfile(p))return false;syncCanonicalRuntime();renderEditor();setTimeout(()=>D?.querySelector?.('[data-stat-card="'+id+'"]')?.scrollIntoView?.({block:"center"}),0);return true}
function addEffect(host,source){if(host)syncEditor(host);const p=profile(),s=root(p);if(!p||!s||!def(source))return false;s[EFFECT_KEY].push(normEffect({id:"effect_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),source:canon(source),target:"damage:melee",mode:"step",step:1,gain:1,threshold:10,comparator:"gt",enabled:true}));if(!saveProfile(p))return false;renderEditor();return true}
function removeStat(host,id){if(host)syncEditor(host);const p=profile(),s=root(p),cid=canon(id);if(!p||!s||CORE_IDS.has(cid))return false;s.dynamicDefinitions=s.dynamicDefinitions.filter(d=>d.id!==cid);s.active=s.active.filter(x=>canon(x)!==cid);s[EFFECT_KEY]=s[EFFECT_KEY].filter(e=>e.source!==cid&&e.target!=="stat:"+cid);s.dynamicRules=(s.dynamicRules||[]).filter(e=>e.source!==cid);saveProfile(p);syncCanonicalRuntime();renderEditor();return true}
function removeEffect(host,id){if(host)syncEditor(host);const p=profile(),s=root(p);if(!p||!s)return false;s[EFFECT_KEY]=s[EFFECT_KEY].filter(e=>e.id!==id);s.dynamicRules=(s.dynamicRules||[]).filter(e=>e.id!==id);saveProfile(p);renderEditor();return true}
function renderEditor(){if(!D)return false;const host=D.getElementById("rpgStatsList"),p=profile(),s=root(p);if(!host||!p||!s)return false;host.innerHTML='<div class="v2MechanicBox"><div class="v2LibHead"><strong>📊 Caractéristiques & effets</strong><button type="button" data-add-stat>＋ Nouvelle stat</button></div><div class="small">Une stat cochée est disponible en jeu. Si aucune n’est cochée, aucune caractéristique n’est affichée sur la fiche héros.</div><div data-stat-cards>'+defs().map(cardHtml).join('')+'</div><button class="startGameBtn" type="button" data-save-all>💾 Enregistrer les caractéristiques</button></div>';bindEditor(host);return true}
function bindEditor(host){if(host.dataset.clean792)return;host.dataset.clean792="1";host.addEventListener("click",e=>{const add=e.target.closest('[data-add-stat]');if(add){e.preventDefault();addStat(host);return}const ae=e.target.closest('[data-add-effect]');if(ae){e.preventDefault();addEffect(host,ae.dataset.addEffect);return}const rs=e.target.closest('[data-remove-stat]');if(rs){e.preventDefault();removeStat(host,rs.dataset.removeStat);return}const re=e.target.closest('[data-remove-effect]');if(re){e.preventDefault();removeEffect(host,re.dataset.removeEffect);return}if(e.target.closest('[data-save-all]')){e.preventDefault();const ok=syncEditor(host);renderEditor();try{R.renderDungeonAttributes?.()}catch(_){}R.showToast?.(ok?"💾 Caractéristiques enregistrées":"⚠️ Sauvegarde impossible")}})}
function wrap(name,maker){const old=R[name];if(typeof old!=="function"||old.__clean792)return null;const w=maker(old);w.__clean792=true;w.__original=old;R[name]=w;return old}
function installRuntime(){
 nativeAttr=wrap("dungeonAttributeValue",old=>function(id){id=canon(id);return dungeon()&&def(id)?(active(id)?value(String(R.current||""),id):0):old.apply(this,arguments)})||nativeAttr;
 nativeChange=wrap("changeDungeonAttribute",old=>function(id,delta){id=canon(id);const d=def(id);if(dungeon()&&d&&!active(id))return false;if(dungeon()&&d&&!CORE_IDS.has(id)){syncHeroDefaults();const cur=customBase(String(R.current||""),id);if(num(delta,0)>0&&cur>=d.max)return false;if(num(delta,0)<0&&cur<=d.min)return false;const out=old.apply(this,[id,delta]);setTimeout(decorateCanonicalSheet,0);return out}return old.apply(this,arguments)})||nativeChange;
 wrap("renderDungeonAttributes",old=>function(){syncCanonicalRuntime();const out=old.apply(this,arguments);decorateCanonicalSheet();return out});
 wrap("renderRpgUniverseEditor",old=>function(){const out=old.apply(this,arguments);setTimeout(renderEditor,0);return out});
 wrap("saveRpgUniverseStats",old=>function(){try{const h=D?.getElementById("rpgStatsList");if(h)syncEditor(h)}catch(e){}const out=old.apply(this,arguments);setTimeout(()=>{renderEditor();syncCanonicalRuntime()},0);return out});
 wrap("dungeonPhysicalDamageBonus",old=>function(){return num(old.apply(this,arguments),0)+extraTotal("damage:physical")+extraTotal("damage:melee")});
 wrap("dungeonMagicDamageBonus",old=>function(){return num(old.apply(this,arguments),0)+extraTotal("damage:magic")});
 wrap("dungeonEnduranceHpBonus",old=>function(){return num(old.apply(this,arguments),0)+extraTotal("max_hp")});
 wrap("dungeonMaxMana",old=>function(){return Math.max(0,num(old.apply(this,arguments),0)+extraTotal("max_mana"))});
 wrap("dungeonCriticalChance",old=>function(){const r=R.loadDungeonRpgRules?.()||{};return clamp(num(old.apply(this,arguments),0)+extraTotal("crit"),0,num(r.critCap,100))});
 wrap("dungeonDodgeChance",old=>function(){const r=R.loadDungeonRpgRules?.()||{};return clamp(num(old.apply(this,arguments),0)+extraTotal("dodge"),0,num(r.dodgeCap,100))});
 wrap("dungeonMagicResistance",old=>function(){return Math.max(0,num(old.apply(this,arguments),0)+extraTotal("magic_resistance"))});
 wrap("dungeonDerivedDefense",old=>function(){return Math.max(0,num(old.apply(this,arguments),0)+extraTotal("defense"))});
 wrap("dungeonArmorScore",old=>function(){return Math.max(0,num(old.apply(this,arguments),0)+extraTotal("armor"))});
 wrap("dungeonDerivedInitiative",old=>function(){return num(old.apply(this,arguments),0)+extraTotal("initiative")});
 wrap("applyDungeonCombatScaling",old=>function(it,st){const out=old.apply(this,arguments);if(!dungeon()||!out||!it?.rpgScaling)return out;const mode=it.rpgScaling.magic?"magic":(out.melee?"melee":"ranged"),x=extraTotal("hit:"+mode);if(x){out.hitChance=Math.max(0,num(out.hitChance,0)+x);if(Array.isArray(out.mods))out.mods.push("Stat : "+(x>0?"+":"")+x+"% toucher")}if(mode==="ranged"){const d=extraTotal("damage:ranged");if(d)out.damage=num(out.damage,0)+d}return out})
}
function install(){
 try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
 const p=profile();if(p?.gameStyle==="dungeon"){root(p);migrateLegacyEffects(p);saveProfile(p)}
 syncCanonicalRuntime();installRuntime();observeCanonicalSheet();setTimeout(()=>{renderEditor();syncCanonicalRuntime();decorateCanonicalSheet()},0);return true
}
R.GensCleanRpgStats167874={VERSION,APP_VERSION,CORE,TARGETS,EFFECT_KEY,LEGACY_MIGRATION_KEY,canon,root,defs,def,active,effects,legacyEffects,migrateLegacyEffects,allEffects,value,extraTotal,changeCustom,sentence,summaryFor,syncEditor,addStat,addEffect,removeStat,removeEffect,renderEditor,runtimeDefs,syncCanonicalAttributes,syncHeroDefaults,syncCanonicalRuntime,decorateCanonicalSheet,refreshCanonicalSheet,installRuntime,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
