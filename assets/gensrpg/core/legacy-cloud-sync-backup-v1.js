
const Z40K_SUPABASE_URL = 'https://dntbwwjaqjunkbubgnba.supabase.co';
const Z40K_SUPABASE_KEY = 'sb_publishable_LUV2pjUqotr2x5rjH52CnQ_0ZHR0LwS';
const z40kSB = window.supabase.createClient(Z40K_SUPABASE_URL, Z40K_SUPABASE_KEY);
let z40kRoomId = localStorage.getItem('z40k_online_room_id') || null;
let z40kRoomCode = localStorage.getItem('z40k_online_room_code') || '';
let z40kChannel = null;
let z40kUserId = null;
let z40kApplyingRemote = false;
let z40kPushTimer = null;
let z40kLastEventId=null;
const Z40K_EVENT_KEY='event';
const Z40K_META_KEYS = new Set(['z40k_online_room_id','z40k_online_room_code','z40k_online_user','gensrpg_device_id_v1','gensrpg_device_label_v1','gensrpg_last_creation_sync_v1']);

function z40kSetStatus(label, ok=false) {
  const e=document.getElementById('z40kSyncStatus');
  const c=document.getElementById('z40kRoomCode');
  if(e) { e.textContent=label; e.style.background=ok?'#185d31':'#4a3517'; }
  if(c) c.textContent=z40kRoomCode ? 'CODE '+z40kRoomCode : '';
}
function z40kMsg(m) { const e=document.getElementById('z40kSyncMsg'); if(e)e.textContent=m; }

async function z40kEnsureAuth() {
  let {data:{session}}=await z40kSB.auth.getSession();
  if(!session) {
    const {data,error}=await z40kSB.auth.signInAnonymously();
    if(error) throw error;
    session=data.session;
  }
  z40kUserId = session?.user?.id || null;
  return session;
}

// Données de création GenSrpG : elles sont persistantes et ne doivent jamais
// être effacées simplement parce qu'un ancien téléphone / snapshot ne les contient pas.
const GENSRPG_PERSISTENT_KEYS = new Set([
  "z40k_custom_heroes_multi_v1",
  "z40k_skill_library_v2",
  "gensrpg_custom_equipment_v1",
  "gensrpg_dungeon_talent_sets_v1"
]);

function gensrpgIsPersistentKey(k){
  return GENSRPG_PERSISTENT_KEYS.has(String(k||""));
}
function gensrpgIsBackupKey(k){
  return String(k||"").startsWith("gensrpg_safety_backup_") ||
         String(k||"")==="gensrpg_data_schema";
}

function gensrpgMergeJsonArray(localRaw,remoteRaw){
  try{
    const local=JSON.parse(localRaw||"[]"), remote=JSON.parse(remoteRaw||"[]");
    if(!Array.isArray(local)||!Array.isArray(remote)) return remoteRaw;
    const map=new Map();
    // Le distant est chargé d'abord, puis le local gagne pour un même ID :
    // une mise à jour ne peut donc pas écraser une création locale plus récente.
    remote.forEach((x,i)=>{if(x)map.set(x.id||x.key||x.name||("__r"+i),x)});
    local.forEach((x,i)=>{if(x)map.set(x.id||x.key||x.name||("__l"+i),x)});
    return JSON.stringify([...map.values()]);
  }catch(e){
    return localRaw || remoteRaw;
  }
}

function z40kSnapshot() {
  const data={};
  for(let i=0;i<localStorage.length;i++) {
    const k=localStorage.key(i);
    if(!k || Z40K_META_KEYS.has(k) || k.startsWith('sb-')) continue;
    if(gensrpgIsPersistentKey(k) || gensrpgIsBackupKey(k)) continue;
    if(k===GENS_PARTICIPANTS_KEY) continue;
    data[k]=localStorage.getItem(k);
  }
  data["gensrpg_game_schema"]="3";
  return data;
}

function z40kApplySnapshot(data) {
  if(!data || typeof data!=='object') return;
  z40kApplyingRemote=true;
  try {
    const toRemove=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k || Z40K_META_KEYS.has(k) || k.startsWith('sb-')) continue;
      if(gensrpgIsPersistentKey(k) || gensrpgIsBackupKey(k)) continue;
      if(k===GENS_PARTICIPANTS_KEY) continue;
      if(!(k in data)) toRemove.push(k);
    }
    toRemove.forEach(k=>localStorage.removeItem(k));

    Object.entries(data).forEach(([k,v])=>{
      if(Z40K_META_KEYS.has(k) || k.startsWith('sb-')) return;
      if(gensrpgIsPersistentKey(k) || gensrpgIsBackupKey(k)) return;
      if(k===GENS_PARTICIPANTS_KEY) return;
      localStorage.setItem(k,String(v));
    });
  } finally {
    z40kApplyingRemote=false;
  }
}

function z40kRefreshUI(){
  const previousRemoteState = z40kApplyingRemote;

  // Pendant l'affichage d'une modification reçue d'un autre téléphone,
  // aucune sauvegarde locale ne doit repartir vers Supabase.
  z40kApplyingRemote = true;

  try{
    if(typeof renderHome==='function') renderHome();
    if(typeof renderMenuStatuses==='function') renderMenuStatuses();
    if(typeof renderDeckBadge==='function') renderDeckBadge();
    if(typeof renderZombieConfig==='function') renderZombieConfig();
    if(typeof renderZombieReserve==='function') renderZombieReserve();
    if(typeof renderDeckConfig==='function') renderDeckConfig();

    // Recharge la fiche actuellement ouverte avec l'état partagé.
    if(
      typeof current!=='undefined' &&
      current &&
      typeof loadState==='function'
    ){
      state = loadState(current);

      if(typeof render==='function'){
        render();
      }
    }

  }catch(err){
    console.warn('Refresh UI synchro:',err);

  }finally{
    // Réautorise les sauvegardes seulement une fois le rafraîchissement distant terminé.
    z40kApplyingRemote = previousRemoteState;
  }
}

async function z40kPushState() {
  if(!z40kRoomId || z40kApplyingRemote) return;
  try {
    const session=await z40kEnsureAuth();
    const payload={
      room_id:z40kRoomId,
      state_key:'game',
      state_value:z40kSnapshot(),
      updated_by:session.user.id,
      updated_at:new Date().toISOString()
    };
    const {error}=await z40kSB.from('z40k_sync_state').upsert(payload,{onConflict:'room_id,state_key'});
    if(error) throw error;
    z40kSetStatus('🟢 Synchronisé',true);
  } catch(e) {
    console.error(e); z40kSetStatus('🔴 Erreur synchro'); z40kMsg(e.message||String(e));
  }
}

function z40kSchedulePush() {
  if(!z40kRoomId || z40kApplyingRemote) return;
  clearTimeout(z40kPushTimer);
  z40kPushTimer=setTimeout(z40kPushState,350);
}

let gensrpgCreationsPushTimer=null;
const GENSRPG_CREATIONS_STATE_KEY="creations_v1";
const GENSRPG_CREATIONS_PREFIX="creations_v2_";
const GENSRPG_LAST_CREATION_SEND_KEY="gensrpg_last_creation_send_v2";
const GENSRPG_LAST_CREATION_RECEIVE_KEY="gensrpg_last_creation_receive_v2";

function gensrpgReadArrayKey(k){
  try{
    const a=JSON.parse(localStorage.getItem(k)||"[]");
    return Array.isArray(a)?a:[];
  }catch(e){return []}
}

const GENSRPG_DEVICE_KEY="gensrpg_device_id_v1";
const GENSRPG_DEVICE_LABEL_KEY="gensrpg_device_label_v1";
const GENSRPG_LAST_CREATION_SYNC_KEY="gensrpg_last_creation_sync_v1";

function gensrpgDeviceLabel(){
  const saved=(localStorage.getItem(GENSRPG_DEVICE_LABEL_KEY)||"").trim();
  if(saved)return saved;
  return "Appareil "+gensrpgShortHash(gensrpgLocalDeviceId()).toUpperCase();
}
function gensrpgSaveDeviceLabel(){
  const input=document.getElementById("gensSharedDeviceName");
  const v=(input?.value||"").trim().slice(0,32);
  if(v)localStorage.setItem(GENSRPG_DEVICE_LABEL_KEY,v);
  else localStorage.removeItem(GENSRPG_DEVICE_LABEL_KEY);
  gensrpgRenderSharedLibrary();
  gensrpgScheduleCreationsPush();
}
function gensrpgOriginLabel(x){
  if(!x)return "Inconnu";
  if(!x._gensShared)return gensrpgDeviceLabel();
  return String(x._gensOriginLabel||x._gensSharedLabel||("Appareil "+gensrpgShortHash(x._gensOrigin||x._gensSharedFrom||"remote").toUpperCase()));
}

function gensrpgLocalDeviceId(){
  let id=localStorage.getItem(GENSRPG_DEVICE_KEY)||"";
  if(!id){
    id="dev_"+(window.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+"_"+Math.random().toString(36).slice(2));
    localStorage.setItem(GENSRPG_DEVICE_KEY,id);
  }
  return id;
}
function gensrpgCreationSourceId(){
  // L’identité d’une création doit rester stable même si la session Supabase change.
  return String(gensrpgLocalDeviceId());
}
function gensrpgShortHash(s){
  s=String(s||"");
  let h=2166136261;
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return (h>>>0).toString(36).slice(0,8);
}
function gensrpgCreationBaseId(x,i=0){
  return String(x?.id||x?.key||x?.name||("__"+i));
}
function gensrpgNormalizeCreationArray(arr,sourceId,sourceLabel=""){
  const src=String(sourceId||"legacy");
  const label=String(sourceLabel||"");
  return (Array.isArray(arr)?arr:[]).filter(Boolean).map((x,i)=>{
    const c={...x};
    c._gensOrigin=String(c._gensOrigin||src);
    c._gensOriginId=String(c._gensOriginId||gensrpgCreationBaseId(c,i));
    if(!c._gensOriginLabel && label && c._gensOrigin===src)c._gensOriginLabel=label;
    return c;
  });
}
function gensrpgCreationIdentity(x,i=0){
  return String(x?._gensOrigin||"legacy")+"|"+String(x?._gensOriginId||gensrpgCreationBaseId(x,i));
}
function gensrpgSharedId(baseId,origin,used){
  const root=String(baseId||"creation");
  let id=root+"__shared_"+gensrpgShortHash(origin);
  let n=2;
  while(used.has(id)){
    id=root+"__shared_"+gensrpgShortHash(origin)+"_"+n++;
  }
  return id;
}

/*
  Fusion non destructive :
  - même origine + même ID d'origine = même création -> mise à jour ;
  - même ID mais origine différente = les DEUX sont conservées ;
  - la copie reçue reçoit un ID technique distinct, sans modifier l'original.
*/
function gensrpgMergeCreationCollection(localArr,remoteArr,remoteSourceId,remoteSourceLabel=""){
  const localSource=gensrpgCreationSourceId();
  const local=gensrpgNormalizeCreationArray(localArr,localSource,gensrpgDeviceLabel());
  const remote=gensrpgNormalizeCreationArray(remoteArr,remoteSourceId||"legacy_remote",remoteSourceLabel);

  const out=[];
  const byIdentity=new Map();
  const usedIds=new Map();

  local.forEach((x,i)=>{
    const c={...x};
    const ident=gensrpgCreationIdentity(c,i);
    const id=gensrpgCreationBaseId(c,i);
    c.id=c.id||id;
    byIdentity.set(ident,out.length);
    usedIds.set(String(c.id),ident);
    out.push(c);
  });

  remote.forEach((x,i)=>{
    const incoming={...x};
    const ident=gensrpgCreationIdentity(incoming,i);
    if(String(incoming._gensOrigin||remoteSourceId||"")!==String(localSource)){
      incoming._gensShared=true;
      incoming._gensSharedFrom=String(incoming._gensOrigin||remoteSourceId||"remote");
      incoming._gensSharedLabel=String(incoming._gensOriginLabel||remoteSourceLabel||"");
    }

    if(byIdentity.has(ident)){
      // Même création provenant du même appareil/utilisateur : mise à jour,
      // mais on conserve l'ID local déjà attribué à cette copie.
      const idx=byIdentity.get(ident);
      const keepId=out[idx].id;
      const shared=!!out[idx]._gensShared;
      out[idx]={...incoming,id:keepId,_gensShared:shared||incoming._gensShared||false};
      return;
    }

    let desired=String(incoming.id||incoming._gensOriginId||gensrpgCreationBaseId(incoming,i));
    const occupiedBy=usedIds.get(desired);

    if(occupiedBy && occupiedBy!==ident){
      desired=gensrpgSharedId(incoming._gensOriginId||desired,incoming._gensOrigin,usedIds);
      incoming._gensShared=true;
      incoming._gensSharedFrom=String(incoming._gensOrigin||remoteSourceId||"remote");
    }

    incoming.id=desired;
    usedIds.set(desired,ident);
    byIdentity.set(ident,out.length);
    out.push(incoming);
  });

  return out;
}
function gensrpgCollectionIdMap(arr){
  const map=new Map();
  (Array.isArray(arr)?arr:[]).forEach((x,i)=>{
    map.set(gensrpgCreationIdentity(x,i),String(x.id||gensrpgCreationBaseId(x,i)));
  });
  return map;
}
function gensrpgIncomingRefIdentity(remoteCollection,oldId,fallbackOrigin){
  const hit=(Array.isArray(remoteCollection)?remoteCollection:[]).find(x=>String(x?.id||"")===String(oldId));
  if(hit)return gensrpgCreationIdentity(hit);
  return String(fallbackOrigin||"legacy_remote")+"|"+String(oldId||"");
}
function gensrpgRemapRemoteHeroes(remoteHeroes,remoteEquipment,remoteSkills,eqMap,skillMap,remoteSourceId){
  return gensrpgNormalizeCreationArray(remoteHeroes,remoteSourceId).map(h=>{
    const c={...h};
    const origin=c._gensOrigin||remoteSourceId||"legacy_remote";

    if(Array.isArray(c.startingEquipment)){
      c.startingEquipment=c.startingEquipment.map(slot=>{
        if(!slot?.itemId)return slot;
        const ident=gensrpgIncomingRefIdentity(remoteEquipment,slot.itemId,origin);
        return {...slot,itemId:eqMap.get(ident)||slot.itemId};
      });
    }

    if(Array.isArray(c.skills)){
      c.skills=c.skills.map(s=>{
        if(!s?.libraryId)return s;
        const ident=gensrpgIncomingRefIdentity(remoteSkills,s.libraryId,origin);
        return {...s,libraryId:skillMap.get(ident)||s.libraryId};
      });
    }
    return c;
  });
}

function gensrpgCreationsSnapshot(){
  const sourceId=gensrpgCreationSourceId();
  const sourceLabel=gensrpgDeviceLabel();
  return {
    schema:3,
    sourceId,
    sourceLabel,
    heroes:gensrpgNormalizeCreationArray(gensrpgReadArrayKey("z40k_custom_heroes_multi_v1"),sourceId,sourceLabel),
    skills:gensrpgNormalizeCreationArray(gensrpgReadArrayKey("z40k_skill_library_v2"),sourceId,sourceLabel),
    equipment:gensrpgNormalizeCreationArray(gensrpgReadArrayKey("gensrpg_custom_equipment_v1"),sourceId,sourceLabel),
    enemies:gensrpgNormalizeCreationArray(gensrpgReadArrayKey("gensrpg_custom_enemies_v1"),sourceId,sourceLabel),
    builtinEnemyOverrides:(()=>{try{return JSON.parse(localStorage.getItem(BUILTIN_ENEMY_OVERRIDES_KEY)||"{}")}catch(e){return {}}})()
  };
}
function gensrpgApplyCreationsSnapshot(remote){
  if(!remote || typeof remote!=="object")return;
  const prev=z40kApplyingRemote;
  z40kApplyingRemote=true;
  try{
    const remoteSource=String(remote.sourceId||"legacy_remote");
    const remoteSourceLabel=String(remote.sourceLabel||"");

    const localEquipment=gensrpgReadArrayKey("gensrpg_custom_equipment_v1");
    const localSkills=gensrpgReadArrayKey("z40k_skill_library_v2");
    const localHeroes=gensrpgReadArrayKey("z40k_custom_heroes_multi_v1");
    const localEnemies=gensrpgReadArrayKey("gensrpg_custom_enemies_v1");

    // On fusionne d'abord les bibliothèques référencées par les héros.
    const equipment=gensrpgMergeCreationCollection(localEquipment,remote.equipment,remoteSource,remoteSourceLabel);
    const skills=gensrpgMergeCreationCollection(localSkills,remote.skills,remoteSource,remoteSourceLabel);

    const eqMap=gensrpgCollectionIdMap(equipment);
    const skillMap=gensrpgCollectionIdMap(skills);
    const remappedRemoteHeroes=gensrpgRemapRemoteHeroes(
      remote.heroes,remote.equipment,remote.skills,eqMap,skillMap,remoteSource
    );

    const heroes=gensrpgMergeCreationCollection(localHeroes,remappedRemoteHeroes,remoteSource,remoteSourceLabel);
    let enemies=gensrpgMergeCreationCollection(localEnemies,remote.enemies,remoteSource,remoteSourceLabel);

    // Les personnalisations des ennemis intégrés ne doivent jamais écraser
    // silencieusement celles de l'autre joueur. En cas de conflit, la version
    // distante est ajoutée comme copie personnalisée distincte.
    const localBuiltin=loadBuiltinEnemyOverrides();
    const remoteBuiltin=(remote.builtinEnemyOverrides&&typeof remote.builtinEnemyOverrides==="object")?remote.builtinEnemyOverrides:{};
    Object.entries(remoteBuiltin).forEach(([baseId,ov])=>{
      if(!localBuiltin[baseId]){
        localBuiltin[baseId]=ov;
      }else if(JSON.stringify(localBuiltin[baseId])!==JSON.stringify(ov)){
        const copy={...ov};
        copy.id="custom_enemy_"+baseId+"_shared_"+gensrpgShortHash(remoteSource+JSON.stringify(ov));
        copy.name=(ov.name||builtinEnemyBase(baseId)?.name||baseId)+" — partagé";
        copy.builtin=false;
        copy._gensShared=true;
        copy._gensOrigin=remoteSource;
        copy._gensOriginId=baseId+"_builtin_override";
        copy._gensOriginLabel=remoteSourceLabel;
        copy._gensSharedLabel=remoteSourceLabel;
        if(!enemies.some(x=>String(x.id)===String(copy.id)))enemies.push(copy);
      }
    });
    saveBuiltinEnemyOverrides(localBuiltin);

    localStorage.setItem("z40k_custom_heroes_multi_v1",JSON.stringify(heroes));
    localStorage.setItem("z40k_skill_library_v2",JSON.stringify(skills));
    localStorage.setItem("gensrpg_custom_equipment_v1",JSON.stringify(equipment));
    localStorage.setItem("gensrpg_custom_enemies_v1",JSON.stringify(enemies));

    gensrpgBackupPersistentNow();
    if(typeof refreshCustomEquipmentIntoItems==="function")refreshCustomEquipmentIntoItems();
    if(typeof applyCustomHeroesMulti==="function")applyCustomHeroesMulti();
    if(typeof refreshCustomEnemiesIntoZombieTypes==="function")refreshCustomEnemiesIntoZombieTypes();
    if(typeof renderMenuStatuses==="function")renderMenuStatuses();
    if(typeof renderEquipmentLibrary==="function" && typeof equipmentLibraryOpen!=="undefined" && equipmentLibraryOpen)renderEquipmentLibrary();
    if(typeof renderHeroManager==="function" && document.getElementById("heroManager")?.style.display==="block")renderHeroManager();
    if(typeof renderEnemyLibrary==="function" && document.getElementById("enemyManager")?.style.display==="block")renderEnemyLibrary();
    if(typeof gensrpgRenderSharedLibrary==="function")gensrpgRenderSharedLibrary();
  }finally{
    z40kApplyingRemote=prev;
  }
}
async function gensrpgPullCreations(){
  if(!z40kRoomId)return {received:0};
  let received=0;
  try{
    const mySource=gensrpgCreationSourceId();
    // V2 : une ligne Supabase par appareil. Plus aucun "dernier appareil gagne".
    const {data,error}=await z40kSB.from("z40k_sync_state")
      .select("state_key,state_value,updated_at")
      .eq("room_id",z40kRoomId)
      .like("state_key",GENSRPG_CREATIONS_PREFIX+"%");
    if(error)throw error;
    const rows=Array.isArray(data)?data:[];
    for(const row of rows){
      const remote=row?.state_value;
      if(!remote || typeof remote!=="object")continue;
      const remoteSource=String(remote.sourceId||"");
      if(remoteSource && remoteSource===mySource)continue;
      gensrpgApplyCreationsSnapshot(remote);
      received++;
    }

    // Compatibilité avec l’ancienne bibliothèque creations_v1 pendant la migration.
    try{
      const {data:legacy}=await z40kSB.from("z40k_sync_state")
        .select("state_value")
        .eq("room_id",z40kRoomId)
        .eq("state_key",GENSRPG_CREATIONS_STATE_KEY)
        .maybeSingle();
      const rv=legacy?.state_value;
      if(rv && String(rv.sourceId||"")!==mySource){
        gensrpgApplyCreationsSnapshot(rv);
        received++;
      }
    }catch(_){ }

    if(received){
      localStorage.setItem(GENSRPG_LAST_CREATION_RECEIVE_KEY,String(Date.now()));
    }
    if(typeof gensrpgRenderSharedLibrary==="function")gensrpgRenderSharedLibrary();
    return {received};
  }catch(e){
    console.warn("Chargement créations GenSrpG",e);
    throw e;
  }
}

function gensrpgMarkLocalCreationsPublished(){
  const source=gensrpgCreationSourceId();
  const label=gensrpgDeviceLabel();
  const now=Date.now();
  const keys=[
    "z40k_custom_heroes_multi_v1",
    "z40k_skill_library_v2",
    "gensrpg_custom_equipment_v1",
    "gensrpg_custom_enemies_v1"
  ];
  keys.forEach(k=>{
    const arr=gensrpgReadArrayKey(k);
    let changed=false;
    const next=arr.map((x,i)=>{
      if(!x || x._gensShared)return x;
      const c={...x};
      c._gensOrigin=String(c._gensOrigin||source);
      c._gensOriginId=String(c._gensOriginId||gensrpgCreationBaseId(c,i));
      c._gensOriginLabel=String(c._gensOriginLabel||label);
      c._gensPublished=true;
      c._gensPublishedAt=now;
      changed=true;
      return c;
    });
    if(changed)localStorage.setItem(k,JSON.stringify(next));
  });
}

async function gensrpgPushCreations(){
  if(!z40kRoomId || z40kApplyingRemote)return {sent:false};
  try{
    const session=await z40kEnsureAuth();

    // Toujours récupérer les autres appareils avant de publier notre propre ligne.
    await gensrpgPullCreations();

    const local=gensrpgCreationsSnapshot();
    const stateKey=GENSRPG_CREATIONS_PREFIX+gensrpgShortHash(local.sourceId);
    const {error}=await z40kSB.from("z40k_sync_state").upsert({
      room_id:z40kRoomId,
      state_key:stateKey,
      state_value:local,
      updated_by:session.user.id,
      updated_at:new Date().toISOString()
    },{onConflict:"room_id,state_key"});
    if(error)throw error;

    gensrpgMarkLocalCreationsPublished();
    const now=Date.now();
    localStorage.setItem(GENSRPG_LAST_CREATION_SYNC_KEY,String(now));
    localStorage.setItem(GENSRPG_LAST_CREATION_SEND_KEY,String(now));
    if(typeof gensrpgRenderSharedLibrary==="function")gensrpgRenderSharedLibrary();
    return {sent:true};
  }catch(e){
    console.warn("Sauvegarde créations GenSrpG",e);
    throw e;
  }
}
function gensrpgScheduleCreationsPush(){
  if(!z40kRoomId || z40kApplyingRemote)return;
  clearTimeout(gensrpgCreationsPushTimer);
  gensrpgCreationsPushTimer=setTimeout(gensrpgPushCreations,450);
}

function gensrpgCreationModeLabel(x,type){
  const id=String(x?.id||"");
  if(x?.gameMode==="dungeon" || x?.dungeonBuiltin || id.startsWith("dng_") || id.startsWith("dungeon_"))return "Dungeon";
  return "40K";
}
function gensrpgSharedEntries(){
  const groups=[
    ["hero","🧙","Héros",gensrpgReadArrayKey("z40k_custom_heroes_multi_v1")],
    ["equipment","🎒","Objet",gensrpgReadArrayKey("gensrpg_custom_equipment_v1")],
    ["enemy","👹","Ennemi",gensrpgReadArrayKey("gensrpg_custom_enemies_v1")]
  ];
  const out=[];
  groups.forEach(([type,icon,label,arr])=>arr.forEach(x=>out.push({type,icon,label,x})));
  return out;
}
function gensrpgRenderSharedLibrary(){
  const panel=document.getElementById("gensSharedLibrary");
  if(!panel)return;
  const input=document.getElementById("gensSharedDeviceName");
  if(input && document.activeElement!==input)input.value=gensrpgDeviceLabel();
  const entries=gensrpgSharedEntries();
  const local=entries.filter(e=>!e.x?._gensShared && !e.x?._gensPublished).length;
  const published=entries.filter(e=>!e.x?._gensShared && !!e.x?._gensPublished).length;
  const received=entries.filter(e=>!!e.x?._gensShared).length;
  const stats=document.getElementById("gensSharedStats");
  if(stats)stats.innerHTML='<div class="gensSharedStat"><b>'+local+'</b><small>📱 Locales</small></div><div class="gensSharedStat"><b>'+published+'</b><small>📤 Partagées</small></div><div class="gensSharedStat"><b>'+received+'</b><small>☁️ Reçues</small></div>';
  const sent=Number(localStorage.getItem(GENSRPG_LAST_CREATION_SEND_KEY)||0);
  const recv=Number(localStorage.getItem(GENSRPG_LAST_CREATION_RECEIVE_KEY)||0);
  const lastEl=document.getElementById("gensSharedLastSync");
  if(lastEl){
    const sTxt=sent?new Date(sent).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"—";
    const rTxt=recv?new Date(recv).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"—";
    lastEl.textContent="↑ "+sTxt+" · ↓ "+rTxt;
  }
  const msg=document.getElementById("gensSharedLibraryMsg");
  if(msg)msg.textContent=z40kRoomId?("Salle "+(z40kRoomCode||"active")+" · les nouvelles créations sont fusionnées automatiquement."):"Hors ligne : connecte-toi à une salle pour échanger les créations.";
  const list=document.getElementById("gensSharedList");
  if(!list)return;
  if(!entries.length){list.innerHTML='<div class="empty">Aucune création personnalisée sur cet appareil.</div>';return;}
  list.innerHTML=entries.map(e=>{
    const shared=!!e.x?._gensShared;
    const published=!shared && !!e.x?._gensPublished;
    const origin=shared?gensrpgOriginLabel(e.x):gensrpgDeviceLabel();
    const badge=shared?'REÇU':(published?'PARTAGÉ':'LOCAL');
    const badgeClass=shared?'gensOriginRemote':'gensOriginLocal';
    return '<div class="gensSharedRow"><div class="gensSharedRowIcon">'+e.icon+'</div><div><div class="gensSharedRowName">'+z40kEscHtml(e.x?.name||"Sans nom")+'</div><div class="gensSharedRowMeta">'+e.label+' · '+gensrpgCreationModeLabel(e.x,e.type)+' · '+z40kEscHtml(origin)+'</div></div><span class="gensSharedBadge '+badgeClass+'">'+badge+'</span></div>';
  }).join("");
}
function gensrpgToggleSharedLibrary(){
  const p=document.getElementById("gensSharedLibrary");if(!p)return;
  p.classList.toggle("open");
  if(p.classList.contains("open"))gensrpgRenderSharedLibrary();
}
async function gensrpgSyncCreationsNow(){
  const msg=document.getElementById("gensSharedLibraryMsg");
  if(!z40kRoomId){if(msg)msg.textContent="⚠️ Rejoins ou crée d'abord une partie en ligne.";return;}
  try{
    if(msg)msg.textContent="🔄 Synchronisation des créations…";
    await z40kEnsureAuth();
    const pull=await gensrpgPullCreations();
    await gensrpgPushCreations();
    localStorage.setItem(GENSRPG_LAST_CREATION_SYNC_KEY,String(Date.now()));
    gensrpgRenderSharedLibrary();
    if(msg)msg.textContent="✅ Synchronisation terminée : envoi effectué · "+(pull?.received||0)+" appareil(s) distant(s) reçu(s).";
  }catch(e){
    console.warn("Synchronisation manuelle créations",e);
    if(msg)msg.textContent="❌ Synchronisation impossible : "+(e?.message||e);
  }
}


function z40kMakeEventId(){
  return window.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
}
async function z40kBroadcastEvent(type,payload){
  if(!z40kRoomId)return;
  try{
    const session=await z40kEnsureAuth();
    const id=z40kMakeEventId();
    z40kLastEventId=id;
    await z40kSB.from('z40k_sync_state').upsert({
      room_id:z40kRoomId,state_key:Z40K_EVENT_KEY,
      state_value:{id,type,payload:payload||{},ts:Date.now()},
      updated_by:session.user.id,updated_at:new Date().toISOString()
    },{onConflict:'room_id,state_key'});
  }catch(e){console.warn('Evénement partagé',e);}
}

let z40kEffectTimer=null;

function showEffectPopup(icon,title,text,sub="",share=true){
  if(z40kEffectTimer){
    clearTimeout(z40kEffectTimer);
    z40kEffectTimer=null;
  }

  const modal=document.getElementById("effectModal");
  if(!modal)return;

  document.getElementById("effectIcon").textContent=icon||"✨";
  document.getElementById("effectTitle").textContent=title||"EFFET";
  document.getElementById("effectText").innerHTML=text||"";
  document.getElementById("effectSub").textContent=sub||"";
  modal.classList.add("open");

  if(share){
    z40kBroadcastEvent("special_effect",{icon,title,text,sub});
  }
}

function showEffectPopupDelayed(icon,title,text,sub="",delay=650,share=true){
  if(z40kEffectTimer)clearTimeout(z40kEffectTimer);
  z40kEffectTimer=setTimeout(()=>{
    z40kEffectTimer=null;
    showEffectPopup(icon,title,text,sub,share);
  },delay);
}

function closeEffectPopup(share=true){
  const modal=document.getElementById("effectModal");
  const wasOpen=!!modal && modal.classList.contains("open");
  modal?.classList.remove("open");
  if(share && wasOpen)z40kBroadcastPopupClose("effect");
}

function effectBackdropClose(e){
  if(e.target?.id==="effectModal")closeEffectPopup();
}

function z40kSpecialWeaponEffect(it,rolls,hits){
  if(!it)return null;
  const naturalSix=rolls.filter(v=>v===6).length;
  const naturalOne=rolls.filter(v=>v===1).length;

  switch(it.id){
    case "lance_grenade":
      if(hits>0){
        return {
          icon:"💥",
          title:"EXPLOSION !",
          text:"Détruisez <strong>tous les Zombies de la zone ayant une Endurance de 2 ou moins</strong>.",
          sub:"Effet du Lance-Grenade"
        };
      }
      break;

    case "marteau_deux_mains":
      if(naturalSix>0){
        return {
          icon:"🔨",
          title:"ONDE DE CHOC !",
          text:"Tous les Zombies de la zone <strong>perdent 1 action</strong> lors de leur prochaine activation.",
          sub:"Déclenché par un 6 naturel"
        };
      }
      break;

    case "gantelet_energetique":
      if(naturalSix>0){
        return {
          icon:"⚡",
          title:"IMPACT ÉNERGÉTIQUE !",
          text:"Cette attaque gagne <strong>+1 Force</strong>.",
          sub:"Déclenché par un 6 naturel"
        };
      }
      break;

    case "fusil_plasma":
      if(naturalOne>=2){
        return {
          icon:"🔥",
          title:"SURCHAUFFE !",
          text:"Le porteur subit une <strong>attaque de Force 1</strong>. Sauvegarde autorisée.",
          sub:"Déclenché par au moins deux 1 naturels"
        };
      }
      break;
  }

  return null;
}

function z40kBroadcastPopupClose(kind){
  if(!z40kRoomId || z40kApplyingRemote)return;
  z40kBroadcastEvent("popup_close",{kind:String(kind||"")});
}
function z40kCloseSharedPopup(kind){
  switch(String(kind||"")){
    case "turn": closeTurnPopup(false); break;
    case "spawn": closeSpawnPopup(false); break;
    case "effect": closeEffectPopup(false); break;
    case "attack": closeDiceModal("attackDiceModal",false); break;
    case "armor": closeDiceModal("armorDiceModal",false); break;
    case "special": closeDiceModal("specialDiceModal",false); break;
  }
}

function z40kHandleSharedEvent(ev){
  if(!ev||!ev.id||ev.id===z40kLastEventId)return;
  z40kLastEventId=ev.id;
  const p=ev.payload||{};
  if(ev.type==='attack_roll')z40kRemoteAttack(p);
  else if(ev.type==='armor_roll')z40kRemoteArmor(p);
  else if(ev.type==='special_roll')z40kRemoteSpecial(p);
  else if(ev.type==='special_effect')showEffectPopup(p.icon,p.title,p.text,p.sub||"👥 Effet déclenché par un autre joueur",false);
  else if(ev.type==='zombie_wave'&&Array.isArray(p.results))showSpawnResolution(p.results,p.dangerName||'Bleu');
  else if(ev.type==='turn_popup'&&p.state){
    saveTurnState(p.state);
    renderTurnUi();
    const cfg=loadGameCustomization();
    if(cfg.sharedPopup)showTurnPopup(false);
  }
  else if(ev.type==='popup_close'&&p.kind){
    z40kCloseSharedPopup(p.kind);
  }
}
function z40kRemoteAttack(p){
  const modal=document.getElementById('attackDiceModal');if(!modal)return;
  attackRollContext=null;modal.classList.add('open');
  document.getElementById('attackDiceTitle').textContent='🎲 '+(p.weapon||'Attaque');
  document.getElementById('attackDiceMeta').innerHTML=[
    p.dice?p.dice+' dés':'',p.accuracy?'Précision '+p.accuracy+'+':'',
    p.strength?'Force '+p.strength:'',p.range?'Portée '+p.range:'','👥 Autre joueur'
  ].filter(Boolean).map(x=>'<span>'+x+'</span>').join('');
  document.getElementById('attackDiceResult').innerHTML='🎲 <strong>Lancer partagé en cours…</strong>';
  const rolls=Array.isArray(p.rolls)?p.rolls:[];
  animateDice('attackDiceRolls',rolls.length,rolls,Number(p.accuracy)||6,()=>{
    document.getElementById('attackDiceResult').innerHTML='<strong>'+(p.hits||0)+' réussite'+((p.hits||0)>1?'s':'')+'</strong> sur '+rolls.length+
      (p.ammoText?'<br><small>'+p.ammoText+'</small>':'')+'<br><small>👥 Jet effectué par un autre joueur</small>';
  });
}
function z40kRemoteArmor(p){
  const modal=document.getElementById('armorDiceModal');if(!modal)return;
  modal.classList.add('open');lastArmorFailures=0;
  document.getElementById('armorApplyBox').style.display='none';
  document.getElementById('armorDiceResult').innerHTML='🎲 <strong>Jet d’armure partagé en cours…</strong>';
  const rolls=Array.isArray(p.rolls)?p.rolls:[];
  animateDice('armorDiceRolls',rolls.length,rolls,Number(p.threshold)||7,()=>{
    document.getElementById('armorDiceResult').innerHTML='🛡️ <strong>'+(p.saved||0)+' sauvegardée'+((p.saved||0)>1?'s':'')+
      '</strong> · 💥 <strong>'+(p.failed||0)+' blessure'+((p.failed||0)>1?'s':'')+' subie'+((p.failed||0)>1?'s':'')+
      '</strong><br><small>👥 Jet effectué par un autre joueur</small>';
  });
}
function z40kRemoteSpecial(p){
  const modal=document.getElementById('specialDiceModal');if(!modal)return;
  modal.classList.add('open');
  document.getElementById('specialDiceTitle').textContent='🎲 '+(p.title||'Jet de compétence');
  document.getElementById('specialDiceIcon').textContent=p.icon||'🎯';
  document.getElementById('specialDiceMeta').innerHTML='<span>1 dé</span><span>Réussite '+(p.threshold||6)+'+</span><span>👥 Autre joueur</span>';
  document.getElementById('specialDiceResult').innerHTML='🎲 <strong>Lancer partagé en cours…</strong>';
  const roll=Number(p.roll)||1, threshold=Number(p.threshold)||6;
  animateDice('specialDiceRolls',1,[roll],threshold,()=>{
    document.getElementById('specialDiceResult').innerHTML=(p.success?'✅ ':'❌ ')+'<strong>'+
      (p.success?(p.successText||'Réussite !'):(p.failText||'Échec.'))+'</strong><br><small>Résultat : '+roll+' · 👥 autre joueur</small>';
  });
}

async function z40kSubscribe() {
  if(z40kChannel) await z40kSB.removeChannel(z40kChannel);
  if(!z40kRoomId) return;
  z40kChannel=z40kSB.channel('z40k-'+z40kRoomId)
    .on('postgres_changes',{event:'*',schema:'public',table:'z40k_sync_state',filter:'room_id=eq.'+z40kRoomId},payload=>{
      const row=payload.new;
      if(!row)return;
      if(z40kUserId && row.updated_by===z40kUserId)return;
      if(row.state_key===Z40K_EVENT_KEY){z40kHandleSharedEvent(row.state_value);return;}
      if(row.state_key===GENSRPG_CREATIONS_STATE_KEY){
        gensrpgApplyCreationsSnapshot(row.state_value);
        return;
      }
      if(row.state_key===GENS_PARTICIPANTS_STATE_KEY){
        const ids=row.state_value?.ids;
        if(Array.isArray(ids)){
          const prev=z40kApplyingRemote;z40kApplyingRemote=true;
          try{localStorage.setItem(GENS_PARTICIPANTS_KEY,JSON.stringify([...new Set(ids.map(String))]));}
          finally{z40kApplyingRemote=prev;}
          if(typeof renderParticipantSelector==="function")renderParticipantSelector();
          if(typeof renderMenuStatuses==="function")renderMenuStatuses();
          if(typeof renderTurnUi==="function")renderTurnUi();
        }
        return;
      }
      if(row.state_key!=='game')return;

      const wasActive = (typeof hasActiveSession==='function') ? hasActiveSession() : false;
      z40kApplySnapshot(row.state_value);
      z40kRefreshUI();
      if(typeof renderParticipantSelector==="function")renderParticipantSelector();
      if(typeof renderMenuStatuses==="function")renderMenuStatuses();
      if(typeof renderTurnUi==="function")renderTurnUi();
      const isActive = (typeof hasActiveSession==='function') ? hasActiveSession() : false;
      z40kSetStatus('🟢 Synchronisé',true);
      if(!wasActive && isActive && typeof resumeGame==='function'){
        z40kMsg('La partie vient de démarrer — ouverture automatique.');
        resumeGame();
      }else{
        z40kMsg('Mise à jour reçue d’un autre appareil.');
      }
    }).subscribe(status=>{
      if(status==='SUBSCRIBED'){
        z40kSetStatus('🟢 Synchronisé',true);
      }else if(status==='CHANNEL_ERROR' || status==='TIMED_OUT'){
        z40kSetStatus('🔴 Connexion instable');
      }
    });
}




function z40kOpenOnline(){const m=document.getElementById('z40kSyncBar');if(m)m.classList.add('open');if(typeof gensrpgRenderSharedLibrary==='function')gensrpgRenderSharedLibrary();}
function z40kCloseOnline(){const m=document.getElementById('z40kSyncBar');if(m)m.classList.remove('open');}
function z40kOnlineBackdrop(e){if(e.target?.id==='z40kSyncBar')z40kCloseOnline();}
function z40kOpenSettings(){const m=document.getElementById('z40kSettingsModal');if(m)m.classList.add('open');}
function z40kCloseSettings(){const m=document.getElementById('z40kSettingsModal');if(m)m.classList.remove('open');}
function z40kSettingsBackdrop(e){if(e.target?.id==='z40kSettingsModal')z40kCloseSettings();}
async function z40kShareApp(){
  const u=new URL(window.location.href);u.search='';u.hash='';const url=u.toString();
  try{
    if(navigator.share){await navigator.share({title:'GenSrpG',text:'Installe GenSrpG sur ton téléphone',url});}
    else if(navigator.clipboard){await navigator.clipboard.writeText(url);alert('Lien de l’application copié.');}
    else{prompt('Copie ce lien :',url);}
  }catch(e){}
}
let z40kInstallPrompt = null;

function z40kIsStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function z40kOpenShortcut(){const m=document.getElementById('z40kShortcutModal');if(m)m.classList.add('open');}
function z40kCloseShortcut(){const m=document.getElementById('z40kShortcutModal');if(m)m.classList.remove('open');}
function z40kShortcutBackdrop(e){if(e.target?.id==='z40kShortcutModal')z40kCloseShortcut();}
async function z40kCopyAppLink(){
  const u=new URL(window.location.href);u.search='';u.hash='';
  try{await navigator.clipboard.writeText(u.toString());alert('Lien de l’application copié.');}
  catch(e){prompt('Copie ce lien :',u.toString());}
}
function z40kRefreshInstallButton(){
  const btn=document.getElementById('z40kInstallBtn');if(!btn)return;
  if(z40kIsStandalone()){
    btn.textContent='✅ Application installée';btn.disabled=true;btn.style.opacity='.65';
  }else{
    btn.textContent='📲 Installer GenSrpG';btn.disabled=false;btn.style.opacity='1';
  }
}
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();z40kInstallPrompt=e;z40kRefreshInstallButton();});
window.addEventListener('appinstalled',()=>{z40kInstallPrompt=null;z40kRefreshInstallButton();});
window.addEventListener('DOMContentLoaded',z40kRefreshInstallButton);
async function z40kInstallApp(){
  if(z40kIsStandalone()){z40kRefreshInstallButton();return;}
  if(z40kInstallPrompt){
    try{
      const promptEvent=z40kInstallPrompt;
      z40kInstallPrompt=null;
      await promptEvent.prompt();
      const result=await promptEvent.userChoice;
      if(result?.outcome==='accepted'){
        z40kRefreshInstallButton();
        return;
      }
      // L'utilisateur a annulé : ne pas remplacer silencieusement par un raccourci Chrome.
      z40kRefreshInstallButton();
      return;
    }catch(e){
      console.warn('Installation GenSrpG:',e);
    }
  }
  z40kOpenShortcut();
}

function z40kInviteUrl(){
  if(!z40kRoomCode) return '';
  const u = new URL(window.location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('join', z40kRoomCode);
  return u.toString();
}

async function z40kShareInvite(){
  if(!z40kRoomCode){
    z40kMsg('Crée ou rejoins d’abord une partie en ligne.');
    return;
  }
  const url = z40kInviteUrl();
  try{
    if(navigator.share){
      await navigator.share({
        title:'Zombicide 40K',
        text:'Rejoins ma partie Zombicide 40K — code '+z40kRoomCode,
        url
      });
      z40kMsg('Invitation partagée.');
    }else if(navigator.clipboard){
      await navigator.clipboard.writeText(url);
      z40kMsg('Lien d’invitation copié.');
    }else{
      prompt('Copie ce lien :', url);
    }
  }catch(e){
    if(e?.name!=='AbortError') z40kMsg('Impossible de partager automatiquement. Utilise le QR code.');
  }
}

function z40kShowQR(){
  if(!z40kRoomCode){
    z40kMsg('Crée ou rejoins d’abord une partie en ligne.');
    return;
  }
  const url=z40kInviteUrl();
  const modal=document.getElementById('z40kQRModal');
  const holder=document.getElementById('z40kQRCode');
  const room=document.getElementById('z40kQRRoom');
  const link=document.getElementById('z40kQRLink');
  if(room) room.textContent='CODE '+z40kRoomCode;
  if(link) link.textContent=url;
  if(holder){
    holder.innerHTML='';
    if(window.QRCode){
      new QRCode(holder,{text:url,width:220,height:220,correctLevel:QRCode.CorrectLevel.M});
    }else{
      holder.style.color='#111';
      holder.textContent='QR indisponible — utilise Partager.';
    }
  }
  if(modal) modal.style.display='flex';
}

function z40kHideQR(){
  const modal=document.getElementById('z40kQRModal');
  if(modal) modal.style.display='none';
}

async function z40kCreateRoom() {
  try {
    z40kSetStatus('🟡 Connexion…'); z40kMsg('Création de la partie en ligne…');
    await z40kEnsureAuth();
    const {data,error}=await z40kSB.rpc('z40k_make_room');
    if(error) throw error;
    const r=Array.isArray(data)?data[0]:data;
    z40kRoomId=r.room_id; z40kRoomCode=r.room_code;
    localStorage.setItem('z40k_online_room_id',z40kRoomId);
    localStorage.setItem('z40k_online_room_code',z40kRoomCode);
    await z40kSubscribe();
    await z40kPushState();
    await gensrpgPushCreations();
    await gensrpgPushParticipants();
    z40kMsg('Partie créée. Partage le lien ou le QR code — code '+z40kRoomCode);
  } catch(e) { console.error(e); z40kSetStatus('🔴 Erreur'); z40kMsg(e.message||String(e)); }
}

async function z40kJoinRoom() {
  try {
    const inp=document.getElementById('z40kJoinCode');
    const code=(inp?.value||'').trim().toUpperCase();
    if(code.length!==6) { z40kMsg('Entre le code à 6 caractères.'); return; }
    z40kSetStatus('🟡 Connexion…'); await z40kEnsureAuth();
    const {data,error}=await z40kSB.rpc('z40k_join_room',{p_code:code});
    if(error) throw error;
    const r=Array.isArray(data)?data[0]:data;
    z40kRoomId=r.room_id; z40kRoomCode=r.room_code;
    localStorage.setItem('z40k_online_room_id',z40kRoomId);
    localStorage.setItem('z40k_online_room_code',z40kRoomCode);
    const {data:rows,error:readErr}=await z40kSB.from('z40k_sync_state').select('state_value').eq('room_id',z40kRoomId).eq('state_key','game').maybeSingle();
    if(readErr) throw readErr;
    if(rows?.state_value) {
      z40kApplySnapshot(rows.state_value);
      z40kRefreshUI();
    }
    await z40kSubscribe();
    await gensrpgPullCreations();
    await gensrpgPullParticipants();
    z40kSetStatus('🟢 Synchronisé',true);
    if(typeof hasActiveSession==='function' && hasActiveSession()){
      z40kMsg('Partie '+z40kRoomCode+' rejointe — ouverture de la partie en cours.');
      if(typeof resumeGame==='function') resumeGame();
    }else{
      z40kMsg('Partie '+z40kRoomCode+' rejointe. Le joueur hôte n’a pas encore démarré la partie.');
      if(typeof renderHome==='function') renderHome();
    }
  } catch(e) { console.error(e); z40kSetStatus('🔴 Erreur'); z40kMsg(e.message||String(e)); }
}

async function z40kLeaveRoom() {
  if(z40kChannel) await z40kSB.removeChannel(z40kChannel);
  z40kChannel=null; z40kRoomId=null; z40kRoomCode='';
  localStorage.removeItem('z40k_online_room_id'); localStorage.removeItem('z40k_online_room_code');
  z40kSetStatus('🟠 Hors ligne'); z40kMsg('Synchronisation quittée. La sauvegarde locale est conservée.');
}


/* ===== V16.74.5 : sauvegarde / restauration GenSrpG =====
   Le backup complet est exporté hors localStorage pour ne pas dupliquer les arts.
   Les identifiants Supabase / salle en ligne / appareil ne sont jamais exportés. */
const GENSRPG_BACKUP_SCHEMA=1;
const GENSRPG_BACKUP_EXCLUDED_KEYS=new Set([
  'z40k_online_room_id','z40k_online_room_code','z40k_online_user',
  'gensrpg_device_id_v1','gensrpg_device_label_v1','gensrpg_last_creation_sync_v1'
]);

function gensrpgBackupCanIncludeKey(k){
  k=String(k||'');
  if(!k)return false;
  if(k.startsWith('sb-'))return false;
  if(GENSRPG_BACKUP_EXCLUDED_KEYS.has(k))return false;
  if(k.startsWith('gensrpg_safety_backup_'))return false;
  return true;
}
function gensrpgCollectLocalData(){
  const data={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!gensrpgBackupCanIncludeKey(k))continue;
    try{data[k]=localStorage.getItem(k)}catch(_){ }
  }
  return data;
}
function gensrpgBackupPayload(reason='manual'){
  const data=gensrpgCollectLocalData();
  return {
    format:'GenSrpG Backup',
    schema:GENSRPG_BACKUP_SCHEMA,
    appVersion:'16.77.0',
    createdAt:new Date().toISOString(),
    reason:String(reason||'manual'),
    origin:location.origin+location.pathname,
    keyCount:Object.keys(data).length,
    data
  };
}

async function gensrpgBackupPayloadWithAssets(reason='manual'){
  const payload=gensrpgBackupPayload(reason);
  payload.schema=Math.max(Number(payload.schema)||1,GENSRPG_BACKUP_SCHEMA);
  payload.appVersion='16.100.4';
  payload.indexedAssets=await gensrpgExportIndexedAssets();
  payload.assetCount=Object.keys(payload.indexedAssets||{}).length;
  return payload;
}

function gensrpgBackupFilename(prefix='GenSrpG_Backup'){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return prefix+'_'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'_'+pad(d.getHours())+'-'+pad(d.getMinutes())+'.json';
}
function gensrpgDownloadJson(payload,filename){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename||gensrpgBackupFilename();
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function gensrpgExportBackup(reason='manual',silent=false){
  try{
    const payload=await gensrpgBackupPayloadWithAssets(reason);
    gensrpgDownloadJson(payload,gensrpgBackupFilename(reason==='pre-import'?'GenSrpG_Avant_Import':'GenSrpG_Backup'));
    if(!silent)alert('✅ Sauvegarde GenSrpG exportée.\n\n'+payload.keyCount+' éléments + '+(payload.assetCount||0)+' image(s) IndexedDB enregistrés.');
    return payload;
  }catch(e){
    console.error('Export GenSrpG',e);
    if(!silent)alert('❌ Impossible de créer la sauvegarde : '+(e?.message||e));
    return null;
  }
}
function gensrpgChooseBackupImport(){
  document.getElementById('gensrpgBackupFileInput')?.click();
}
function gensrpgValidateBackup(payload){
  if(!payload||typeof payload!=='object')throw new Error('Fichier JSON invalide.');
  if(payload.format!=='GenSrpG Backup')throw new Error('Ce fichier n’est pas une sauvegarde GenSrpG.');
  if(Number(payload.schema)!==GENSRPG_BACKUP_SCHEMA)throw new Error('Version de sauvegarde non prise en charge (schéma '+payload.schema+').');
  if(!payload.data||typeof payload.data!=='object'||Array.isArray(payload.data))throw new Error('La section de données est absente ou invalide.');
  const keys=Object.keys(payload.data).filter(gensrpgBackupCanIncludeKey);
  if(!keys.length)throw new Error('La sauvegarde ne contient aucune donnée restaurable.');
  return keys;
}
function gensrpgRawRemoveRestorableKeys(){
  const doomed=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(gensrpgBackupCanIncludeKey(k))doomed.push(k);
  }
  doomed.forEach(k=>{try{z40kOrigRemoveItem.call(localStorage,k)}catch(_){}});
}
function gensrpgRawApplyData(data){
  const failed=[];
  Object.entries(data||{}).forEach(([k,v])=>{
    if(!gensrpgBackupCanIncludeKey(k))return;
    try{z40kOrigSetItem.call(localStorage,k,String(v??''));}
    catch(e){failed.push({key:k,error:e});}
  });
  return failed;
}
async function gensrpgImportBackupFile(file){
  if(!file)return;
  try{
    const text=await file.text();
    const payload=JSON.parse(text);
    const keys=gensrpgValidateBackup(payload);
    const when=payload.createdAt?new Date(payload.createdAt).toLocaleString():'date inconnue';
    const ok=confirm(
      '⚠️ RESTAURER CETTE SAUVEGARDE ?\n\n'+
      'Sauvegarde : '+when+'\n'+
      'Version : '+(payload.appVersion||'inconnue')+'\n'+
      'Données : '+keys.length+' entrées\n\n'+
      'Les données locales actuelles de GenSrpG seront remplacées.\n'+
      'Une copie de sécurité sera téléchargée automatiquement AVANT la restauration.'
    );
    if(!ok)return;

    // Backup hors navigateur, donc aucune duplication des images dans localStorage.
    const before=await gensrpgBackupPayloadWithAssets('pre-import');
    gensrpgDownloadJson(before,gensrpgBackupFilename('GenSrpG_Avant_Import'));

    // Garder également l'ancien état en mémoire le temps de la transaction.
    const previous=before.data;
    const incoming={};
    keys.forEach(k=>incoming[k]=payload.data[k]);

    gensrpgRawRemoveRestorableKeys();
    let failed=gensrpgRawApplyData(incoming);
    if(failed.length){
      console.warn('Import GenSrpG incomplet, rollback',failed);
      gensrpgRawRemoveRestorableKeys();
      const rollbackFailed=gensrpgRawApplyData(previous);
      throw new Error(
        'Le stockage du téléphone n’a pas accepté toutes les données ('+failed.length+' erreur(s)). '+
        (rollbackFailed.length?'La restauration automatique de l’ancien état a aussi rencontré '+rollbackFailed.length+' erreur(s). Utilise le fichier “Avant Import” téléchargé.':'L’ancien état a été remis automatiquement.')
      );
    }

    if(payload.indexedAssets)await gensrpgImportIndexedAssets(payload.indexedAssets);
    localStorage.removeItem(GENSRPG_IDB_MIGRATION_FLAG);

    // Réinitialiser uniquement les références JS transitoires ; les données persistantes restent celles importées.
    try{if(typeof refreshCustomEquipmentIntoItems==='function')refreshCustomEquipmentIntoItems();}catch(_){ }
    try{if(typeof applyCustomHeroesMulti==='function')applyCustomHeroesMulti();}catch(_){ }
    try{if(typeof refreshCustomEnemiesIntoZombieTypes==='function')refreshCustomEnemiesIntoZombieTypes();}catch(_){ }

    alert('✅ Sauvegarde restaurée.\n\nGenSrpG va maintenant se recharger pour appliquer toutes les données.');
    location.reload();
  }catch(e){
    console.error('Import GenSrpG',e);
    alert('❌ Import impossible.\n\n'+(e?.message||e));
  }
}

const z40kOrigSetItem=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v) {
  try{
    z40kOrigSetItem.call(this,k,v);
  }catch(err){
    if(this!==localStorage || !gensrpgIsQuotaError(err))throw err;
    // Les anciens backups locaux sont redondants et constituent de loin la
    // principale source de saturation quand des arts sont stockés en base64.
    gensrpgPurgeSafetyBackupKeys();
    try{z40kOrigSetItem.call(this,k,v)}catch(err2){
      gensrpgStorageQuotaHit=true;
      console.warn('Quota localStorage GenSrpG',k,err2);
      return;
    }
  }
  if(this!==localStorage)return;
  if(gensrpgIsPersistentKey(k)){gensrpgScheduleCreationsPush();return;}
  if(gensrpgIsBackupKey(k))return;
  if(!Z40K_META_KEYS.has(k) && !String(k).startsWith('sb-')) z40kSchedulePush();
};
const z40kOrigRemoveItem=Storage.prototype.removeItem;
Storage.prototype.removeItem=function(k) {
  z40kOrigRemoveItem.call(this,k);
  if(this!==localStorage)return;
  if(gensrpgIsPersistentKey(k)){gensrpgScheduleCreationsPush();return;}
  if(gensrpgIsBackupKey(k))return;
  if(!Z40K_META_KEYS.has(k) && !String(k).startsWith('sb-')) z40kSchedulePush();
};

function gensrpgCreateSafetyBackup(){
  // Désactivé depuis V16.73.5 : une copie complète dans le même localStorage
  // doublait inutilement les images et pouvait saturer Android.
  return false;
}
function gensrpgBackupPersistentNow(){
  // Désactivé : les données principales restent la source de vérité.
  // Une fonction d'export dédiée sera préférable à des duplications locales.
  return false;
}

function gensrpgRecoverPersistentBackups(){
  try{
    const backupKeys=[
      "gensrpg_safety_backup_v2","gensrpg_safety_backup_v3",
      "gensrpg_safety_backup_v4_3","gensrpg_safety_backup_v4_2","gensrpg_safety_backup_v4_1"
    ];
    const merged={};
    GENSRPG_PERSISTENT_KEYS.forEach(k=>{ merged[k]=localStorage.getItem(k)||"[]"; });
    backupKeys.forEach(bk=>{
      try{
        const b=JSON.parse(localStorage.getItem(bk)||"null");
        if(!b?.data)return;
        Object.entries(b.data).forEach(([k,v])=>{
          if(gensrpgIsPersistentKey(k) && v){
            merged[k]=gensrpgMergeJsonArray(merged[k],String(v));
          }
        });
      }catch(_){}
    });
    Object.entries(merged).forEach(([k,v])=>localStorage.setItem(k,v));
  }catch(e){console.warn("Récupération sauvegardes GenSrpG",e)}
}
function gensrpgRecoverThenCompactBackups(){
  try{
    // Lire toutes les anciennes copies AVANT de les supprimer, y compris v5.
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(String(k||"").startsWith("gensrpg_safety_backup_"))keys.push(k);
    }
    const merged={};
    GENSRPG_PERSISTENT_KEYS.forEach(k=>{merged[k]=localStorage.getItem(k)||"[]"});
    keys.forEach(bk=>{
      try{
        const b=JSON.parse(localStorage.getItem(bk)||"null");
        if(!b?.data)return;
        Object.entries(b.data).forEach(([k,v])=>{
          if(gensrpgIsPersistentKey(k)&&v)merged[k]=gensrpgMergeJsonArray(merged[k],String(v));
        });
      }catch(_){ }
    });
    // Libérer d'abord l'espace puis remettre les données fusionnées.
    keys.forEach(k=>{try{z40kOrigRemoveItem.call(localStorage,k)}catch(_){}});
    Object.entries(merged).forEach(([k,v])=>{
      try{if(localStorage.getItem(k)!==v)z40kOrigSetItem.call(localStorage,k,v)}catch(e){console.warn("Restauration compacte",k,e)}
    });
  }catch(e){console.warn("Compactage sauvegardes GenSrpG",e)}
}
gensrpgRecoverThenCompactBackups();
try{
  // Marqueur minuscule de diagnostic seulement : aucune copie d'art ou de création.
  const light={version:'16.77.0',lastSeen:new Date().toISOString(),keys:Object.keys(gensrpgCollectLocalData()).length};
  sessionStorage.setItem('gensrpg_light_recovery_meta_v1',JSON.stringify(light));
}catch(_){ }



window.addEventListener('DOMContentLoaded', async()=>{
  const inviteCode=(new URLSearchParams(location.search).get('join')||'').trim().toUpperCase();

  if(z40kRoomId && z40kRoomCode) {
    try {
      await z40kEnsureAuth(); await z40kSubscribe(); await gensrpgPullCreations(); await gensrpgPullParticipants();
      z40kSetStatus('🟢 Synchronisé',true); z40kMsg('Partie en ligne '+z40kRoomCode);
    } catch(e) { z40kSetStatus('🔴 Erreur'); z40kMsg(e.message||String(e)); }
  } else z40kSetStatus('🟠 Hors ligne');

  if(inviteCode && /^[A-Z0-9]{6}$/.test(inviteCode) && inviteCode!==z40kRoomCode){
    const inp=document.getElementById('z40kJoinCode');
    if(inp) inp.value=inviteCode;
    z40kMsg('Invitation détectée — connexion à la partie '+inviteCode+'…');
    setTimeout(()=>z40kJoinRoom(),250);
  }
});
