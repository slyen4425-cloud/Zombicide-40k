/* GenSrpG V16.79.02 — safe/selective backup import.
   Import never clears unrelated mode data. Default mode is merge: current local data wins,
   missing records/fields from the backup are added. Replace is explicit and category-scoped. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.79.02";
const HERO_KEY="z40k_custom_heroes_multi_v1";
const CATS=[
 {id:"zheroes",label:"🧟 Héros Zombicide / Survie"},
 {id:"rheroes",label:"⚔️ Héros RPG"},
 {id:"skills",label:"📚 Compétences / bibliothèques"},
 {id:"talents",label:"🌳 Talents RPG"},
 {id:"profiles",label:"🌍 Univers / profils de jeu"},
 {id:"dungeon",label:"🏰 Dungeon / World Builder / salles"},
 {id:"capture",label:"🧬 Capture / créatures"},
 {id:"progress",label:"💾 Parties / progression des héros"},
 {id:"settings",label:"⚙️ Autres réglages"},
 {id:"assets",label:"🖼️ Images IndexedDB"}
];
let pending=null;
const clone=v=>{try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}};
function isDungeonHero(h){return !!(h&&(h.gameMode==="dungeon"||h.dungeonBuiltin||String(h.contentFamily||"").toLowerCase()==="rpg"||/^dungeon_/i.test(String(h.id||""))))}
function deepMergeIncomingThenLocal(incoming,local){
 if(Array.isArray(incoming)&&Array.isArray(local))return mergeArray(local,incoming);
 if(incoming&&typeof incoming==="object"&&!Array.isArray(incoming)&&local&&typeof local==="object"&&!Array.isArray(local)){
   const out=clone(incoming)||{};for(const [k,v] of Object.entries(local)){out[k]=(k in out)?deepMergeIncomingThenLocal(out[k],v):clone(v)}return out;
 }
 return local===undefined?clone(incoming):clone(local);
}
function recordId(x){return x&&typeof x==="object"?(x.id??x.key??x.name??null):null}
function mergeArray(local,incoming){
 const out=[],map=new Map(),lo=Array.isArray(local)?local:[],inc=Array.isArray(incoming)?incoming:[];
 const addIncoming=x=>{const id=recordId(x);if(id==null){const sig=JSON.stringify(x);if(!out.some(y=>JSON.stringify(y)===sig))out.push(clone(x));return}map.set(String(id),clone(x))};
 inc.forEach(addIncoming);
 lo.forEach(x=>{const id=recordId(x);if(id==null){const sig=JSON.stringify(x);if(!out.some(y=>JSON.stringify(y)===sig))out.push(clone(x));return}const k=String(id);map.set(k,map.has(k)?deepMergeIncomingThenLocal(map.get(k),x):clone(x))});
 return [...map.values(),...out];
}
function parse(raw,fallback=null){try{return JSON.parse(raw)}catch(e){return fallback}}
function stringifyMerged(localRaw,incomingRaw){
 const inc=parse(incomingRaw,undefined),loc=parse(localRaw,undefined);
 if(inc===undefined)return String(localRaw??"");if(loc===undefined)return String(incomingRaw??"");
 if(Array.isArray(inc)&&Array.isArray(loc))return JSON.stringify(mergeArray(loc,inc));
 if(inc&&typeof inc==="object"&&loc&&typeof loc==="object")return JSON.stringify(deepMergeIncomingThenLocal(inc,loc));
 return localRaw!=null?String(localRaw):String(incomingRaw??"");
}
function categoryForKey(k){k=String(k||"");
 if(k===HERO_KEY)return "heroes";
 if(k==="z40k_skill_library_v2")return "skills";
 if(k==="gensrpg_dungeon_talent_sets_v1")return "talents";
 if(k==="gensrpg_game_profiles_v1"||k==="gensrpg_game_profile_active_v1")return "profiles";
 if(/capture|creature|trainer/i.test(k))return "capture";
 if(/dungeon|world|room|zone_graph|zonegraph/i.test(k))return "dungeon";
 if(/^z40k_.+_v1$/.test(k)&&!/(custom_heroes|skill_library|online_)/.test(k))return "progress";
 return "settings";
}
function selectedIds(){return new Set([...D.querySelectorAll('#gbi902Cats input[data-cat]:checked')].map(x=>x.dataset.cat))}
function mergeHeroes(localRaw,incomingRaw,sel,mode){
 const local=parse(localRaw,[]),incoming=parse(incomingRaw,[]);if(!Array.isArray(local)||!Array.isArray(incoming))return mode==="replace"?incomingRaw:stringifyMerged(localRaw,incomingRaw);
 const wantZ=sel.has("zheroes"),wantR=sel.has("rheroes");if(!wantZ&&!wantR)return localRaw;
 if(mode==="merge"){const chosen=incoming.filter(h=>isDungeonHero(h)?wantR:wantZ);return JSON.stringify(mergeArray(local,chosen))}
 const keep=local.filter(h=>isDungeonHero(h)?!wantR:!wantZ),chosen=incoming.filter(h=>isDungeonHero(h)?wantR:wantZ);return JSON.stringify(mergeArray([],chosen).concat(keep));
}
function ensureUi(){if(!D||D.getElementById("gbi902Modal"))return;
 const style=D.createElement("style");style.id="gbi902Style";style.textContent="#gbi902Modal{position:fixed;inset:0;z-index:2147483646;background:#000d;display:none;align-items:center;justify-content:center;padding:14px}#gbi902Modal.open{display:flex}#gbi902Box{width:min(620px,100%);max-height:90vh;overflow:auto;background:#171412;border:1px solid #8b7657;border-radius:14px;padding:15px;color:#fff}#gbi902Cats{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}#gbi902Cats label{display:flex;gap:8px;align-items:center;padding:8px;background:#211d19;border-radius:8px}#gbi902Modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}#gbi902Modes label{padding:9px;border:1px solid #555;border-radius:8px}.gbi902Actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.gbi902Actions button{min-height:44px}.gbi902Warn{font-size:12px;color:#efc08b}@media(max-width:520px){#gbi902Cats,#gbi902Modes{grid-template-columns:1fr}}";(D.head||D.documentElement).appendChild(style);
 const modal=D.createElement("div");modal.id="gbi902Modal";modal.innerHTML='<div id="gbi902Box"><h2>📥 Import GenSrpG sécurisé</h2><div id="gbi902Meta" class="small"></div><div class="gbi902Warn">Par défaut, <strong>Fusionner</strong> conserve tout ce qui existe déjà sur ce téléphone et ajoute les éléments manquants du fichier. Aucun autre mode n’est effacé.</div><div id="gbi902Cats">'+CATS.map(c=>'<label><input type="checkbox" data-cat="'+c.id+'" checked> '+c.label+'</label>').join('')+'</div><div id="gbi902Modes"><label><input type="radio" name="gbi902Mode" value="merge" checked> <strong>Fusionner</strong><br><small>Le local gagne en cas de conflit.</small></label><label><input type="radio" name="gbi902Mode" value="replace"> <strong>Remplacer la sélection</strong><br><small>Uniquement les catégories cochées.</small></label></div><div class="gbi902Actions"><button type="button" data-gbi-cancel>Annuler</button><button type="button" data-gbi-apply>Importer la sélection</button></div></div>';D.body.appendChild(modal);
 modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest("[data-gbi-cancel]")){modal.classList.remove("open");pending=null;return}if(e.target.closest("[data-gbi-apply]"))applyPending()});
}
function show(payload,file){ensureUi();pending={payload,file};const keys=Object.keys(payload.data||{}),meta=D.getElementById("gbi902Meta");if(meta)meta.textContent=(payload.createdAt?new Date(payload.createdAt).toLocaleString()+" · ":"")+keys.length+" entrée(s) dans la sauvegarde.";D.getElementById("gbi902Modal")?.classList.add("open")}
async function importFile(file){if(!file)return false;try{const payload=JSON.parse(await file.text());R.gensrpgValidateBackup?.(payload);show(payload,file);return true}catch(e){console.error("Import sélectif GenSrpG",e);R.alert?.("❌ Import impossible.\n\n"+(e?.message||e));return false}}
async function applyPending(){if(!pending)return false;const payload=pending.payload,sel=selectedIds(),mode=D.querySelector('input[name="gbi902Mode"]:checked')?.value==="replace"?"replace":"merge";if(!sel.size){R.alert?.("Choisis au moins une catégorie.");return false}
 try{
   const before=await R.gensrpgBackupPayloadWithAssets?.("pre-import");if(before)R.gensrpgDownloadJson?.(before,R.gensrpgBackupFilename?.("GenSrpG_Avant_Import_Securise"));
   const data=payload.data||{};for(const [k,v] of Object.entries(data)){
     if(!R.gensrpgBackupCanIncludeKey?.(k))continue;
     if(k===HERO_KEY){const next=mergeHeroes(localStorage.getItem(k),String(v??""),sel,mode);if(next!=null)localStorage.setItem(k,next);continue}
     const cat=categoryForKey(k);if(!sel.has(cat))continue;
     const current=localStorage.getItem(k),next=mode==="replace"?String(v??""):stringifyMerged(current,String(v??""));localStorage.setItem(k,next);
   }
   if(sel.has("assets")&&payload.indexedAssets)await R.gensrpgImportIndexedAssets?.(payload.indexedAssets);
   try{localStorage.removeItem("gensrpg_idb_assets_migrated_v1")}catch(e){}
   try{R.refreshCustomEquipmentIntoItems?.()}catch(e){}try{R.applyCustomHeroesMulti?.()}catch(e){}try{R.refreshCustomEnemiesIntoZombieTypes?.()}catch(e){}
   D.getElementById("gbi902Modal")?.classList.remove("open");pending=null;R.alert?.("✅ Import terminé sans effacer les autres catégories.\n\nGenSrpG va se recharger.");R.location?.reload?.();return true;
 }catch(e){console.error("Import sélectif GenSrpG",e);R.alert?.("❌ Import impossible.\n\n"+(e?.message||e));return false}
}
function builtinHeroFallback(id){try{const file={dungeon_aldren:"dng_aldren.png",dungeon_lyra:"dng_lyra.png",dungeon_brom:"dng_brom.png"}[String(id)];if(!file)return false;const c=R.CHARS?.[id];if(!c)return false;const fallback="assets/dungeon/creatures/"+file,img=String(c.image||c.avatar||"");if(!img){c.image=fallback;return true}if(img.startsWith("idbasset:")){c.image=fallback;Promise.resolve(R.gensrpgAssetGet?.(img)).then(data=>{if(data){c.image=data;if(c.avatar===img)c.avatar=data}}).catch(()=>{});return true}return true}catch(e){return false}}
function aldrenFallback(){return builtinHeroFallback("dungeon_aldren")}
function install(){ensureUi();R.gensrpgImportBackupFile=importFile;["dungeon_aldren","dungeon_lyra","dungeon_brom"].forEach(builtinHeroFallback);const ensure=R.ensureDungeonHeroes;if(typeof ensure==="function"&&!ensure.__gbi902){const w=function(){const out=ensure.apply(this,arguments);["dungeon_aldren","dungeon_lyra","dungeon_brom"].forEach(builtinHeroFallback);return out};w.__gbi902=true;w.__original=ensure;R.ensureDungeonHeroes=w}if(D)D.addEventListener("error",e=>{const img=e.target;if(img?.tagName!=="IMG")return;const text=(img.alt||"")+" "+(img.closest?.("[data-char-id],[data-custom-hero-id]")?.dataset?.charId||"");if(/aldren|dungeon_aldren/i.test(text)){img.src="assets/dungeon/creatures/dng_aldren.png"}},true);return true}
R.GensSafeBackupImport167902={VERSION,APP_VERSION,CATS,isDungeonHero,categoryForKey,deepMergeIncomingThenLocal,mergeArray,stringifyMerged,mergeHeroes,importFile,applyPending,builtinHeroFallback,aldrenFallback,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
