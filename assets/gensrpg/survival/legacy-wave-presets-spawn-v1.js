/* GenSrpG — R09 / propriétaire Survie (éditeur de vagues, réserve et apparition).
 * Extraction de déclarations historiques inchangées depuis index.html R08.
 * Script classique synchrone; les constantes partagées demeurent dans l'ancien script.
 * Ne pas déplacer dans un autre propriétaire sans audit de contrat.
 */
function defaultZombieConfig(){
  refreshCustomEnemiesIntoZombieTypes();
  const o={}; ZOMBIE_TYPES.forEach(z=>o[z.id]=z.defaultCount); return o;
}

function loadZombieConfig(){
  let o=defaultZombieConfig();
  try{const s=JSON.parse(localStorage.getItem(ZOMBIE_CONFIG_KEY));if(s)o=Object.assign(o,s)}catch(e){}
  return o;
}

function saveZombieConfig(o){localStorage.setItem(ZOMBIE_CONFIG_KEY,JSON.stringify(o))}

function loadZombieReserve(){
  try{const s=JSON.parse(localStorage.getItem(ZOMBIE_RESERVE_KEY));if(s)return s}catch(e){}
  const o=loadZombieConfig();localStorage.setItem(ZOMBIE_RESERVE_KEY,JSON.stringify(o));return o;
}

function saveZombieReserve(o){localStorage.setItem(ZOMBIE_RESERVE_KEY,JSON.stringify(o))}

function renderZombieConfig(){
  refreshCustomEnemiesIntoZombieTypes();
  const box=document.getElementById("zombieConfig");if(!box)return;
  const cfg=loadZombieConfig();box.innerHTML="";
  enemiesForMode(isDungeonMode()).forEach(z=>{
    const row=document.createElement("div");row.className="zombieRow zombieClickable";
    row.onclick=(ev)=>{if(ev.target.tagName!=="BUTTON" && ev.target.tagName!=="INPUT")openZombieRule(z.id);};
    row.innerHTML='<div class="zombieInfoWrap"><img class="zombieThumb" src="'+z.art+'" alt=""><div><div class="zombieName">'+z.name+'</div><div class="zombieSub">Valeur boîte : '+z.defaultCount+' • toucher pour voir les règles</div></div></div>';
    const controls=document.createElement("div");controls.className="zombieControls";
    const minus=document.createElement("button");minus.textContent="−";minus.onclick=()=>changeZombieConfig(z.id,-1);
    const input=document.createElement("input");input.type="number";input.min="0";input.inputMode="numeric";input.value=Math.max(0,Number(cfg[z.id])||0);
    input.onchange=()=>setZombieConfig(z.id,input.value);
    const plus=document.createElement("button");plus.textContent="+";plus.onclick=()=>changeZombieConfig(z.id,1);
    controls.append(minus,input,plus);row.appendChild(controls);box.appendChild(row);
  });
}

function changeZombieConfig(id,d){
  const c=loadZombieConfig();c[id]=Math.max(0,(Number(c[id])||0)+d);saveZombieConfig(c);renderZombieConfig();
}

function setZombieConfig(id,v){
  const c=loadZombieConfig();c[id]=Math.max(0,parseInt(v,10)||0);saveZombieConfig(c);renderZombieConfig();
}

function saveZombieConfigAndReset(){
  if(document.getElementById("waveLevelsEditor"))saveWaveProfile(readWaveProfileFromUi());
  const wp=loadWaveProfile();
  if(wp.enabled && applyActiveWavePresetReserve()){
    renderZombieConfig();
    renderZombieReserve();
  }else{
    const c=loadZombieConfig();
    saveZombieReserve({...c});
  }
  renderZombieReserve();
  document.getElementById("zombieManager").style.display="none";
  document.getElementById("pregameSetup").style.display="block";
  window.scrollTo(0,0);
}

function renderZombieReserve(){
  refreshCustomEnemiesIntoZombieTypes();
  const box=document.getElementById("zombieReserve");if(!box)return;
  const r=loadZombieReserve(),cfg=loadZombieConfig();box.innerHTML="";
  enemiesForMode(isDungeonMode()).forEach(z=>{
    const row=document.createElement("div");row.className="zombieRow zombieClickable";
    row.onclick=(ev)=>{if(ev.target.tagName!=="BUTTON" && ev.target.tagName!=="INPUT")openZombieRule(z.id);};
    row.innerHTML='<div class="zombieInfoWrap"><img class="zombieThumb" src="'+z.art+'" alt=""><div><div class="zombieName">'+z.name+'</div><div class="zombieSub">En réserve : '+Math.max(0,Number(r[z.id])||0)+' / '+(cfg[z.id]??0)+' • toucher pour voir les règles</div></div></div>';
    const c=document.createElement("div");c.className="zombieControls";
    const n=document.createElement("span");n.className="reserveNum";n.textContent=Math.max(0,Number(r[z.id])||0);
    [1,3,5,8].forEach(v=>{
      const b=document.createElement("button");b.textContent="+"+v;b.onclick=()=>changeZombieReserve(z.id,v);c.appendChild(b);
    });
    row.appendChild(c);box.appendChild(row);
  });
}

function changeZombieReserve(id,d){
  const r=loadZombieReserve(),cfg=loadZombieConfig();
  const max=Math.max(0,Number(cfg[id])||0);
  r[id]=Math.max(0,Math.min(max,(Number(r[id])||0)+d));
  saveZombieReserve(r);renderZombieReserve();
}

function setWaveSaveStatus(text,kind=""){
  const el=document.getElementById("waveSaveStatus");
  if(!el)return;
  el.textContent=text||"";
  el.style.color=kind==="dirty"?"#e5bd66":kind==="saved"?"#8fd59a":"";
}

function markWavePresetDirty(){
  wavePresetDirty=true;
  setWaveSaveStatus("● Modifications non enregistrées","dirty");
  clearTimeout(wavePresetAutoSaveTimer);
  wavePresetAutoSaveTimer=setTimeout(()=>persistActiveWavePresetDraft(),450);
}

function persistActiveWavePresetDraft(){
  if(!wavePresetDirty || wavePresetCreateMode)return false;
  const id=activeWavePresetId();
  if(!id)return false;

  const profile=readWaveProfileFromUi();
  refreshCustomEnemiesIntoZombieTypes();
  let reserve=GensSurvivalV1.waveRules.normalizeReserve(profile,collectWaveReserveFromUi(),defaultZombieConfig());
  const presets=loadWavePresets();
  const idx=presets.findIndex(x=>x.id===id);
  if(idx<0)return false;

  presets[idx]={
    ...presets[idx],
    profile:{...profile,enabled:true},
    reserve:{...reserve}
  };
  saveWavePresets(presets);
  saveWaveProfile({...profile,enabled:true});
  wavePresetDirty=false;
  setWaveSaveStatus("✓ Sauvegarde automatique effectuée","saved");
  return true;
}

function bindWaveEditorAutosave(){
  const root=document.getElementById("zombieConfigPanel");
  if(!root || root.dataset.waveAutosaveBound==="1")return;
  root.dataset.waveAutosaveBound="1";
  root.addEventListener("input",ev=>{
    if(ev.target.closest("#waveLevelsEditor") || ev.target.closest("#wavePresetReserve")){
      markWavePresetDirty();
    }
  });
  root.addEventListener("change",ev=>{
    if(ev.target.closest("#waveLevelsEditor") || ev.target.closest("#wavePresetReserve")){
      markWavePresetDirty();
    }
  });
}

function ensureZombicideBasePreset(){
  let presets=loadWavePresetsRaw();
  if(!presets.some(p=>p.id===ZOMBICIDE_BASE_PRESET_ID)){
    presets.unshift({
      id:ZOMBICIDE_BASE_PRESET_ID,
      name:"Zombicide — Base",
      profile:GensSurvivalV1.waveRules.zombicideBaseProfile(BP_SPAWN_CARDS,ZOMBIE_TYPES),
      reserve:GensSurvivalV1.waveRules.zombicideBaseReserve(defaultZombieConfig()),
      builtIn:true
    });
    saveWavePresets(presets);
  }
  return presets;
}

function resetZombicideBasePreset(){
  if(!confirm("Réinitialiser « Zombicide — Base » avec les réglages d’origine ?"))return;
  let presets=loadWavePresetsRaw();
  const fresh={
    id:ZOMBICIDE_BASE_PRESET_ID,
    name:"Zombicide — Base",
    profile:GensSurvivalV1.waveRules.zombicideBaseProfile(BP_SPAWN_CARDS,ZOMBIE_TYPES),
    reserve:GensSurvivalV1.waveRules.zombicideBaseReserve(defaultZombieConfig()),
    builtIn:true
  };
  const idx=presets.findIndex(p=>p.id===ZOMBICIDE_BASE_PRESET_ID);
  if(idx>=0)presets[idx]=fresh; else presets.unshift(fresh);
  saveWavePresets(presets);
  setActiveWavePresetId(ZOMBICIDE_BASE_PRESET_ID);
  saveWaveProfile(fresh.profile);
  applyActiveWavePresetReserve();
  renderWaveProfileEditor();
  renderZombieReserve();
  renderDanger();
}

function loadWavePresetsRaw(){
  try{
    const a=JSON.parse(localStorage.getItem(WAVE_PRESETS_KEY)||"[]");
    return Array.isArray(a)?a:[];
  }catch(e){return []}
}

function loadWavePresets(){
  const raw=loadWavePresetsRaw();
  if(raw.some(p=>p.id===ZOMBICIDE_BASE_PRESET_ID))return raw;
  const fresh={
    id:ZOMBICIDE_BASE_PRESET_ID,
    name:"Zombicide — Base",
    profile:GensSurvivalV1.waveRules.zombicideBaseProfile(BP_SPAWN_CARDS,ZOMBIE_TYPES),
    reserve:GensSurvivalV1.waveRules.zombicideBaseReserve(defaultZombieConfig()),
    builtIn:true
  };
  const merged=[fresh,...raw];
  saveWavePresets(merged);
  return merged;
}

function saveWavePresets(a){
  localStorage.setItem(WAVE_PRESETS_KEY,JSON.stringify(a||[]));
}

function activeWavePresetId(){
  return localStorage.getItem(WAVE_ACTIVE_PRESET_KEY)||"";
}

function setActiveWavePresetId(id){
  if(id)localStorage.setItem(WAVE_ACTIVE_PRESET_KEY,String(id));
  else localStorage.removeItem(WAVE_ACTIVE_PRESET_KEY);
}

function makeWavePresetId(){
  return "wave_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7);
}

function collectWaveReserveFromUi(){
  const out={};
  document.querySelectorAll("#wavePresetReserve [data-enemy-id]").forEach(row=>{
    const id=row.dataset.enemyId;
    const input=row.querySelector("input");
    out[id]=Math.max(0,Number(input?.value)||0);
  });
  return out;
}

function renderWavePresetReserve(reserve){
  const box=document.getElementById("wavePresetReserve");
  if(!box)return;
  box.innerHTML="";
  enemiesForMode(false).forEach(z=>{
    const row=document.createElement("div");
    row.className="waveReserveRow";
    row.dataset.enemyId=z.id;
    row.innerHTML='<span>'+z40kEscHtml(z.name)+'</span><input type="number" min="0" max="999" value="'+Math.max(0,Number(reserve?.[z.id])||0)+'">';
    box.appendChild(row);
  });
}

function autoConfigureWaveReserve(){
  const p=readWaveProfileFromUi();
  refreshCustomEnemiesIntoZombieTypes();
  const reserve=GensSurvivalV1.waveRules.normalizeReserve(p,GensSurvivalV1.waveRules.autoReserve(p,defaultZombieConfig()),defaultZombieConfig());
  renderWavePresetReserve(reserve);
  markWavePresetDirty();
}

function renderWavePresetSelector(){
  const presets=loadWavePresets();
  let active=activeWavePresetId();
  if(!active && !wavePresetCreateMode && presets.some(p=>p.id===ZOMBICIDE_BASE_PRESET_ID)){
    active=ZOMBICIDE_BASE_PRESET_ID;
    setActiveWavePresetId(active);
  }
  const host=document.getElementById("waveSetLibrary");
  const name=document.getElementById("wavePresetName");
  const summary=document.getElementById("waveActiveSummary");

  if(host){
    host.innerHTML="";
    if(!presets.length){
      host.innerHTML='<div class="hint">Aucun set enregistré. Configure les niveaux ci-dessous, donne un nom puis appuie sur « Enregistrer / Activer ».</div>';
    }else{
      presets.forEach(p=>{
        const card=document.createElement("div");
        const isActive=p.id===active;
        card.className="waveSetCard"+(isActive?" active":"");
        const count=(p.profile?.levels||[]).length;
        card.innerHTML=
          '<div style="font-size:22px">🃏</div>'+
          '<div style="flex:1"><div class="waveSetCardName">'+z40kEscHtml(p.name||"Set sans nom")+'</div>'+
          '<div class="waveSetCardMeta">'+count+' niveau'+(count>1?'x':'')+'</div></div>'+
          (isActive?'<span class="waveSetActiveBadge">ACTIF</span>':'<span class="waveSetCardMeta">Toucher pour activer</span>');
        card.onclick=()=>selectWavePreset(p.id);
        host.appendChild(card);
      });
    }
  }

  const selected=presets.find(x=>x.id===active);
  if(name){
    if(wavePresetCreateMode)name.value=name.value||"";
    else name.value=selected?.name||name.value||"";
  }
  if(summary){
    summary.textContent=selected
      ?"✅ Set actif : "+(selected.name||"Set sans nom")+" — sa réserve et ses cartes seront utilisées en partie."
      :"ℹ️ Aucun set enregistré actif. Le profil affiché peut être modifié puis enregistré.";
  }
}

function selectWavePreset(id){
  if(!id)return;
  if(wavePresetDirty && !wavePresetCreateMode)persistActiveWavePresetDraft();
  wavePresetCreateMode=false;
  wavePresetDirty=false;
  const preset=loadWavePresets().find(x=>x.id===id);
  if(!preset)return;

  setActiveWavePresetId(id);

  const profile={...(preset.profile||GensSurvivalV1.waveRules.defaultProfile()),enabled:true};
  saveWaveProfile(profile);
  applyActiveWavePresetReserve();

  const nm=document.getElementById("wavePresetName");
  if(nm)nm.value=preset.name||"";

  renderWaveProfileEditor();
  renderZombieConfig();
  renderZombieReserve();
  renderDanger();
}

function saveAndActivateWaveSet(){
  const profile=readWaveProfileFromUi();
  let reserve=collectWaveReserveFromUi();
  const used=GensSurvivalV1.waveRules.collectEnemyIds(profile);
  const hasAny=Object.values(reserve).some(v=>Number(v)>0);
  if(!hasAny && used.length)reserve=GensSurvivalV1.waveRules.autoReserve(profile,defaultZombieConfig());
  refreshCustomEnemiesIntoZombieTypes();
  reserve=GensSurvivalV1.waveRules.normalizeReserve(profile,reserve,defaultZombieConfig());

  const name=(document.getElementById("wavePresetName")?.value||"").trim()||"Set de vagues";
  let presets=loadWavePresets();
  let id=activeWavePresetId();

  const activePreset=presets.find(x=>x.id===id);
  const savingBuiltInAsNew = !!activePreset?.builtIn && name!==(activePreset.name||"");
  const mustCreate = wavePresetCreateMode || !id || !activePreset || savingBuiltInAsNew;

  if(mustCreate){
    id=makeWavePresetId();
    presets.push({
      id,
      name,
      profile:{...profile,enabled:true},
      reserve:{...reserve},
      builtIn:false
    });
  }else{
    const idx=presets.findIndex(x=>x.id===id);
    // Le set Zombicide de base reste modifiable, mais son identité "builtIn" est conservée.
    presets[idx]={
      ...presets[idx],
      name,
      profile:{...profile,enabled:true},
      reserve:{...reserve}
    };
  }

  saveWavePresets(presets);
  setActiveWavePresetId(id);
  wavePresetCreateMode=false;
  wavePresetDirty=false;
  saveWaveProfile({...profile,enabled:true});

  try{applyActiveWavePresetReserve();}catch(e){console.warn("Application réserve du set :",e)}

  renderWaveProfileEditor();
  renderZombieReserve();
  renderDanger();

  const summary=document.getElementById("waveActiveSummary");
  if(summary)summary.textContent="✅ Set actif : "+name+" — enregistré.";
  setWaveSaveStatus("✓ Set enregistré","saved");
}

function createNewWaveSet(){
  if(wavePresetDirty && !wavePresetCreateMode)persistActiveWavePresetDraft();
  wavePresetCreateMode=true;
  wavePresetDirty=false;
  setActiveWavePresetId("");

  const p=GensSurvivalV1.waveRules.defaultProfile();
  p.enabled=true;
  saveWaveProfile(p);

  renderWaveProfileEditor();

  const nm=document.getElementById("wavePresetName");
  if(nm){
    nm.value="";
    nm.placeholder="Nom du nouveau set";
    nm.focus();
  }

  const summary=document.getElementById("waveActiveSummary");
  if(summary)summary.textContent="➕ Nouveau set en cours de création — il sera ajouté sans écraser les sets existants.";
}

function saveCurrentWavePreset(){saveAndActivateWaveSet();}

function duplicateCurrentWavePreset(){
  const profile=readWaveProfileFromUi();
  let reserve=collectWaveReserveFromUi();
  if(!Object.values(reserve).some(v=>Number(v)>0))reserve=GensSurvivalV1.waveRules.autoReserve(profile,defaultZombieConfig());

  const base=(document.getElementById("wavePresetName")?.value||"Set de vagues").trim();
  const p={
    id:makeWavePresetId(),
    name:(base||"Set de vagues")+" - copie",
    profile:{...profile,enabled:true},
    reserve:{...reserve},
    builtIn:false
  };

  const presets=loadWavePresets();
  presets.push(p);
  saveWavePresets(presets);

  wavePresetCreateMode=false;
  setActiveWavePresetId(p.id);
  saveWaveProfile(p.profile);
  try{applyActiveWavePresetReserve();}catch(e){console.warn(e)}

  renderWaveProfileEditor();
  renderZombieReserve();
  renderDanger();
}

function deleteCurrentWavePreset(){
  const id=activeWavePresetId();if(!id)return;
  if(id===ZOMBICIDE_BASE_PRESET_ID){
    alert("Le set Zombicide — Base ne peut pas être supprimé. Utilise « Réinitialiser Zombicide » si tu veux retrouver ses valeurs d’origine.");
    return;
  }
  if(!confirm("Supprimer ce set de vagues ?"))return;
  const presets=loadWavePresets().filter(x=>x.id!==id);
  saveWavePresets(presets);
  setActiveWavePresetId(ZOMBICIDE_BASE_PRESET_ID);
  const base=presets.find(x=>x.id===ZOMBICIDE_BASE_PRESET_ID);
  if(base){
    saveWaveProfile({...base.profile,enabled:true});
    applyActiveWavePresetReserve();
  }
  renderWaveProfileEditor();
  renderZombieReserve();
  renderDanger();
}

function applyActiveWavePresetReserve(){
  const id=activeWavePresetId();
  if(!id)return false;
  const p=loadWavePresets().find(x=>x.id===id);
  if(!p)return false;
  const profile=p.profile||GensSurvivalV1.waveRules.defaultProfile();
  refreshCustomEnemiesIntoZombieTypes();
  const reserve=GensSurvivalV1.waveRules.normalizeReserve(
    profile,
    p.reserve||GensSurvivalV1.waveRules.autoReserve(profile,defaultZombieConfig()),
    defaultZombieConfig()
  );

  // Répare aussi les anciens sets qui avaient un ennemi utilisé mais une réserve à 0.
  if(JSON.stringify(reserve)!==JSON.stringify({...defaultZombieConfig(),...(p.reserve||{})})){
    const presets=loadWavePresets();
    const idx=presets.findIndex(x=>x.id===p.id);
    if(idx>=0){
      presets[idx]={...presets[idx],reserve:{...reserve}};
      saveWavePresets(presets);
    }
  }

  saveZombieConfig({...defaultZombieConfig(),...reserve});
  saveZombieReserve({...defaultZombieConfig(),...reserve});
  return true;
}

function loadWaveProfile(){
  try{
    const raw=JSON.parse(localStorage.getItem(WAVE_PROFILE_KEY)||"null");
    if(raw && Array.isArray(raw.levels)){
      return {...GensSurvivalV1.waveRules.defaultProfile(),...raw,levels:raw.levels.slice(0,20)};
    }
  }catch(e){}
  return GensSurvivalV1.waveRules.defaultProfile();
}

function saveWaveProfile(p){
  const clean={...p,levels:(p.levels||[]).slice(0,20)};
  localStorage.setItem(WAVE_PROFILE_KEY,JSON.stringify(clean));
  return clean;
}

function waveEnemyOptions(selected){
  refreshCustomEnemiesIntoZombieTypes();
  return enemiesForMode(false).map(z=>'<option value="'+z.id+'" '+(z.id===selected?'selected':'')+'>'+z.name+'</option>').join("");
}

function renderWaveProfileEditor(){
  refreshCustomEnemiesIntoZombieTypes();
  const p=loadWaveProfile();
  renderWavePresetSelector();
  const enabled=document.getElementById("waveProfileEnabled");
  const mode=document.getElementById("waveProfileMode");
  if(!enabled||!mode)return;
  enabled.value=p.enabled?"1":"0";
  mode.value=p.mode||"xp";

  const manualWrap=document.getElementById("waveManualLevelWrap");
  if(manualWrap)manualWrap.style.display=(p.mode==="manual")?"grid":"none";

  const manual=document.getElementById("waveManualLevel");
  if(manual){
    manual.innerHTML=p.levels.map((l,i)=>'<option value="'+i+'" '+(i===Number(p.manualLevel||0)?'selected':'')+'>Niveau '+(i+1)+' — '+z40kEscHtml(l.name||("Niveau "+(i+1)))+'</option>').join("");
  }

  const box=document.getElementById("waveLevelsEditor");
  if(!box)return;
  box.innerHTML="";

  p.levels.forEach((lvl,li)=>{
    const card=document.createElement("div");
    card.className="waveLevelCard";
    card.dataset.level=li;
    card.innerHTML=
      '<div class="waveLevelHead">'+
        '<div class="waveLevelIndex">'+(li+1)+'</div>'+
        '<label><span>Nom du niveau</span><input class="waveLevelName" value="'+z40kEscHtml(lvl.name||("Niveau "+(li+1)))+'"></label>'+
        '<label><span>Couleur</span><input class="waveLevelColor" type="color" value="'+(lvl.color||"#777777")+'"></label>'+
        '<label class="waveThreshold"><span>Seuil</span><input class="waveLevelThreshold" type="number" min="0" max="9999" value="'+Math.max(0,Number(lvl.threshold)||0)+'"></label>'+
        '<button class="danger waveDeleteLevel" type="button" onclick="removeWaveLevel('+li+')">✕</button>'+
      '</div>'+
      '<div class="waveCards"></div>'+
      '<button type="button" class="waveAddBtn" onclick="addWaveCard('+li+')">➕ Ajouter une carte</button>';

    const cards=card.querySelector(".waveCards");
    (lvl.cards||[]).forEach((c,ci)=>{
      const row=document.createElement("div");
      row.className="waveCardRow";
      row.innerHTML=
        '<div class="waveCardNum">Carte '+(ci+1)+'</div>'+
        '<select class="waveCardKind" onchange="waveCardKindChanged(this)">'+
          '<option value="enemy" '+(c.kind==="enemy"?'selected':'')+'>Ennemi</option>'+
          '<option value="double" '+(c.kind==="double"?'selected':'')+'>Double apparition</option>'+
          '<option value="activation" '+(c.kind==="activation"?'selected':'')+'>Activation supplémentaire</option>'+
          '<option value="none" '+(c.kind==="none"?'selected':'')+'>Aucune apparition</option>'+
        '</select>'+
        '<select class="waveCardEnemy">'+waveEnemyOptions(c.enemy||"walker")+'</select>'+
        '<input class="waveCardQty" type="number" min="1" max="99" value="'+Math.max(1,Number(c.qty)||1)+'">'+
        '<button class="danger" type="button" onclick="removeWaveCard('+li+','+ci+')">✕</button>';
      cards.appendChild(row);
      waveCardKindChanged(row.querySelector(".waveCardKind"));
    });

    box.appendChild(card);
  });

  const add=document.getElementById("waveAddLevelBtn");
  if(add)add.disabled=p.levels.length>=20;

  const activeId=activeWavePresetId();
  const preset=loadWavePresets().find(x=>x.id===activeId);
  renderWavePresetReserve(preset?.reserve||GensSurvivalV1.waveRules.autoReserve(p,defaultZombieConfig()));
}

function waveCardKindChanged(sel){
  const row=sel.closest(".waveCardRow");if(!row)return;
  const kind=sel.value;
  const enemy=row.querySelector(".waveCardEnemy");
  const qty=row.querySelector(".waveCardQty");
  enemy.style.display=(kind==="enemy"||kind==="activation")?"block":"none";
  qty.style.display=kind==="enemy"?"block":"none";
}

function readWaveProfileFromUi(){
  const current=loadWaveProfile();
  const levels=[...document.querySelectorAll("#waveLevelsEditor .waveLevelCard")].map((el,i)=>({
    name:el.querySelector(".waveLevelName")?.value.trim()||("Niveau "+(i+1)),
    color:el.querySelector(".waveLevelColor")?.value||"#777777",
    threshold:Math.max(0,Number(el.querySelector(".waveLevelThreshold")?.value)||0),
    cards:[...el.querySelectorAll(".waveCardRow")].map(row=>({
      kind:row.querySelector(".waveCardKind")?.value||"enemy",
      enemy:row.querySelector(".waveCardEnemy")?.value||"walker",
      qty:Math.max(1,Number(row.querySelector(".waveCardQty")?.value)||1)
    }))
  }));
  return {
    enabled:document.getElementById("waveProfileEnabled")?.value==="1",
    mode:document.getElementById("waveProfileMode")?.value||"xp",
    manualLevel:Math.max(0,Number(document.getElementById("waveManualLevel")?.value)||0),
    levels:levels.length?levels:current.levels
  };
}

function saveWaveProfileFromUi(){
  const p=saveWaveProfile(readWaveProfileFromUi());
  const id=activeWavePresetId();
  if(id){
    const presets=loadWavePresets();
    const idx=presets.findIndex(x=>x.id===id);
    if(idx>=0){
      presets[idx]={...presets[idx],profile:p,reserve:collectWaveReserveFromUi()};
      saveWavePresets(presets);
    }
  }
  renderWaveProfileEditor();
  renderDanger();
  alert("Profil de vagues enregistré.");
  return p;
}

function waveProfileUiChanged(){
  const p=readWaveProfileFromUi();
  saveWaveProfile(p);
  if(p.enabled){
    if(!applyActiveWavePresetReserve()){
      const reserve=collectWaveReserveFromUi();
      if(Object.keys(reserve).length){
        saveZombieConfig({...defaultZombieConfig(),...reserve});
        saveZombieReserve({...defaultZombieConfig(),...reserve});
      }else{
        const auto=GensSurvivalV1.waveRules.autoReserve(p,defaultZombieConfig());
        saveZombieConfig({...defaultZombieConfig(),...auto});
        saveZombieReserve({...defaultZombieConfig(),...auto});
      }
    }
  }
  renderWaveProfileEditor();
  renderZombieConfig();
  renderZombieReserve();
  renderDanger();
}

function addWaveLevel(){
  const p=readWaveProfileFromUi();
  if(p.levels.length>=20){alert("Maximum : 20 niveaux.");return}
  const i=p.levels.length;
  p.levels.push({
    name:"Niveau "+(i+1),
    color:"#777777",
    threshold:i?Math.max(0,Number(p.levels[i-1]?.threshold)||0)+10:0,
    cards:[{kind:"enemy",enemy:"walker",qty:1}]
  });
  saveWaveProfile(p);renderWaveProfileEditor();markWavePresetDirty();
}

function removeWaveLevel(i){
  const p=readWaveProfileFromUi();
  if(p.levels.length<=1){alert("Il faut conserver au moins un niveau.");return}
  p.levels.splice(i,1);
  p.manualLevel=Math.min(Number(p.manualLevel)||0,p.levels.length-1);
  saveWaveProfile(p);renderWaveProfileEditor();renderDanger();markWavePresetDirty();
}

function addWaveCard(li){
  const p=readWaveProfileFromUi();
  p.levels[li]?.cards.push({kind:"enemy",enemy:"walker",qty:1});
  saveWaveProfile(p);renderWaveProfileEditor();markWavePresetDirty();
}

function removeWaveCard(li,ci){
  const p=readWaveProfileFromUi();
  const cards=p.levels[li]?.cards;
  if(!cards)return;
  cards.splice(ci,1);
  saveWaveProfile(p);renderWaveProfileEditor();markWavePresetDirty();
}

function waveProfileLevelIndex(){
  const p=loadWaveProfile(),levels=p.levels||[];
  if(!levels.length)return 0;
  if(p.mode==="manual")return Math.max(0,Math.min(levels.length-1,Number(p.manualLevel)||0));

  let value=0;
  if(p.mode==="round"){
    value=Math.max(1,Number(loadTurnState()?.round)||1);
  }else{
    value=Math.max(0,Number(highestInPlayXP().xp)||0);
  }

  let idx=0;
  levels.forEach((l,i)=>{if(value>=Math.max(0,Number(l.threshold)||0))idx=i;});
  return Math.max(0,Math.min(levels.length-1,idx));
}

function customWaveDangerInfo(){
  const p=loadWaveProfile();
  const idx=waveProfileLevelIndex();
  const l=p.levels[idx]||{name:"Niveau "+(idx+1),color:"#777777",threshold:0};
  const h=highestInPlayXP();
  return {key:"custom",name:l.name||("Niveau "+(idx+1)),xp:h.xp,found:h.found,source:h.source,
    levelIndex:idx,color:l.color||"#777777",threshold:Number(l.threshold)||0,mode:p.mode};
}

function drawCustomWaveCard(){
  const p=loadWaveProfile(),idx=waveProfileLevelIndex();
  const lvl=p.levels[idx];
  if(!lvl || !Array.isArray(lvl.cards) || !lvl.cards.length){
    return {kind:"none",enemy:"walker",qty:0};
  }
  return lvl.cards[Math.floor(Math.random()*lvl.cards.length)];
}

function resolveCustomWaveCard(c){
  refreshCustomEnemiesIntoZombieTypes();
  const kind=c?.kind||"none";
  if(kind==="none")return {kind:"none",title:"AUCUNE APPARITION",text:"Aucun ennemi."};
  if(kind==="double")return {kind:"double",title:"DOUBLE APPARITION",text:"Générez immédiatement une apparition supplémentaire."};

  // Dans un set personnalisé, l'ennemi choisi sur la carte est toujours respecté.
  // On ne le remplace jamais silencieusement par un Walker/Fatty/etc.
  const requested=String(c?.enemy||"walker");
  const exists=ZOMBIE_TYPES.some(z=>String(z.id)===requested);
  const type=exists?requested:String(ZOMBIE_TYPES[0]?.id||requested);

  if(kind==="activation"){
    const label=zombieLabel(type);
    return {
      kind:"activation",
      type,
      title:"ACTIVATION SUPPLÉMENTAIRE — "+label.toUpperCase(),
      text:"Tous les "+label+" déjà en jeu jouent immédiatement 1 activation supplémentaire."
    };
  }

  const wanted=Math.max(1,Number(c.qty)||1);
  const take=takeFromZombieReserve(type,wanted);
  const warning=take.shortage
    ?"⚠️ Réserve insuffisante : tous les "+zombieLabel(type)+" déjà en jeu reçoivent 1 ACTIVATION SUPPLÉMENTAIRE."
    :"";
  return {
    kind:"spawn",
    type,
    wanted,
    spawned:take.spawned,
    warning,
    title:wanted+" × "+zombieLabel(type),
    text:wanted+" × "+zombieLabel(type)
  };
}

function highestInPlayXP(){
  let best=0,found=false,source="";
  const ids=hasActiveSession()
    ? normalizeGameParticipants().map(String)
    : Object.keys(CHARS);

  ids.forEach(id=>{
    if(!CHARS[id] && findCustomHero(id))applyCustomHeroesMulti();
    const c=CHARS[id];
    if(!c)return;
    const s=loadState(id);

    // En partie : uniquement participants vivants. Hors partie : uniquement "En jeu".
    const eligible=hasActiveSession()
      ? (s.campaignStatus||"available")!=="dead"
      : s.campaignStatus==="inplay";

    if(eligible){
      const xp=Math.max(0,Number(s.xp)||0);
      if(!found || xp>best){best=xp;source=c.name;}
      found=true;
    }
  });

  if(!found && current && state && !hasActiveSession()){
    best=Math.max(0,Number(state.xp)||0);
    found=true;
    source=CHARS[current]?.name+" (fiche actuelle)";
  }
  return {xp:best,found,source};
}

function dangerInfo(){
  const wp=loadWaveProfile();
  if(wp.enabled)return customWaveDangerInfo();

  const h=highestInPlayXP(),xp=h.xp;
  if(xp>=43)return {key:"red",name:"Rouge",xp,found:h.found,source:h.source};
  if(xp>=19)return {key:"orange",name:"Orange",xp,found:h.found,source:h.source};
  if(xp>=7)return {key:"yellow",name:"Jaune",xp,found:h.found,source:h.source};
  return {key:"blue",name:"Bleu",xp,found:h.found,source:h.source};
}

function renderDanger(){
  const d=dangerInfo(),el=document.getElementById("currentDanger");if(!el)return;
  const wp=loadWaveProfile();
  if(wp.enabled){
    const modeTxt=wp.mode==="round"?"Tour "+(loadTurnState()?.round||1):wp.mode==="manual"?"manuel":d.xp+" XP";
    el.textContent="Niveau : "+d.name+" — "+modeTxt;
    el.style.borderLeft="7px solid "+(d.color||"#777");
  }else{
    el.textContent="Niveau : "+d.name+" — "+d.xp+" XP"+(d.source?" • "+d.source:" (aucun héros En jeu)");
    el.style.borderLeft="";
  }
}

function shuffleArray(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function resetSpawnDeck(){
  const ds={deck:shuffleArray(BP_SPAWN_CARDS.map(c=>c.id)),discard:[],pendingDraws:1};
  localStorage.setItem(SPAWN_DECK_KEY,JSON.stringify(ds));return ds;
}

function loadSpawnDeck(){
  try{
    const s=JSON.parse(localStorage.getItem(SPAWN_DECK_KEY));
    if(s&&Array.isArray(s.deck)&&Array.isArray(s.discard))return s;
  }catch(e){}
  return resetSpawnDeck();
}

function saveSpawnDeck(ds){localStorage.setItem(SPAWN_DECK_KEY,JSON.stringify(ds))}

function drawSpawnCard(){
  const ds=loadSpawnDeck();
  if(!ds.deck.length){
    ds.deck=shuffleArray(ds.discard.slice());ds.discard=[];
  }
  const id=ds.deck.pop();ds.discard.push(id);saveSpawnDeck(ds);
  return BP_SPAWN_CARDS.find(c=>c.id===id);
}

function dangerColumn(){
  const d=dangerInfo();
  return d.key==="blue"?"b":d.key==="yellow"?"y":d.key==="orange"?"o":"r";
}

function zombieLabel(id){
  refreshCustomEnemiesIntoZombieTypes();
  const z=ZOMBIE_TYPES.find(x=>x.id===id);return z?z.name:id;
}

function configuredCount(id){
  const cfg=loadZombieConfig();
  return Math.max(0,Number(cfg[id])||0);
}

function currentReserveCount(id){
  const r=loadZombieReserve();
  return Math.max(0,Number(r[id])||0);
}

function resolveWalkerFamilyType(){
  const candidates=["walker","tyranide","cracheur"]
    .filter(id=>configuredCount(id)>0 && currentReserveCount(id)>0);

  if(!candidates.length) return "walker";

  const total=candidates.reduce((s,id)=>s+configuredCount(id),0);
  let roll=Math.random()*total;
  for(const id of candidates){
    roll-=configuredCount(id);
    if(roll<=0)return id;
  }
  return candidates[candidates.length-1];
}

function resolveSpawnType(requestedType){
  refreshCustomEnemiesIntoZombieTypes();
  const requested=String(requestedType||"");
  if(configuredCount(requested)>0 && currentReserveCount(requested)>0)return requested;

  const candidates=enemiesForMode(isDungeonMode()).map(z=>z.id)
    .filter(id=>configuredCount(id)>0 && currentReserveCount(id)>0);

  if(!candidates.length)return requested;

  const total=candidates.reduce((sum,id)=>sum+Math.max(1,configuredCount(id)),0);
  let roll=Math.random()*total;
  for(const id of candidates){
    roll-=Math.max(1,configuredCount(id));
    if(roll<=0)return id;
  }
  return candidates[candidates.length-1];
}

function takeFromZombieReserve(type,wanted){
  const r=loadZombieReserve();
  const available=Math.max(0,Number(r[type])||0);
  const spawned=Math.min(wanted,available);
  r[type]=available-spawned;saveZombieReserve(r);
  return {spawned,available,shortage:spawned<wanted};
}

function resolveSpawnCard(card){
  const d=dangerInfo(),entry=card[dangerColumn()];
  if(entry[0]==="none"){
    return {cardId:card.id,kind:"none",title:"AUCUNE APPARITION",text:"Aucun Zombie."};
  }
  if(entry[0]==="double"){
    return {
      cardId:card.id,
      kind:"double",
      title:"DOUBLE APPARITION",
      text:"Cette apparition génère immédiatement 1 carte d’apparition supplémentaire."
    };
  }
  if(entry[0]==="activation"){
    const configured=enemiesForMode(isDungeonMode()).map(z=>z.id).filter(id=>configuredCount(id)>0);
    const requested=String(entry[1]||"walker");
    const active=(configuredCount(requested)>0 ? [requested] : configured);
    const labels=(active.length?active:[requested]).map(zombieLabel);
    return {
      cardId:card.id,
      kind:"activation",
      type:active[0]||requested,
      title:"ACTIVATION SUPPLÉMENTAIRE — "+labels.join(" / "),
      text:"Tous les "+labels.join(", ")+" déjà en jeu reçoivent immédiatement 1 activation supplémentaire."
    };
  }
  const requestedType=entry[0],wanted=entry[1];
  const type=resolveSpawnType(requestedType);
  const take=takeFromZombieReserve(type,wanted);
  let warning="";
  if(take.shortage){
    warning="⚠️ Réserve insuffisante : tous les "+zombieLabel(type)+"s déjà en jeu reçoivent 1 ACTIVATION SUPPLÉMENTAIRE.";
  }
  return {cardId:card.id,kind:"spawn",type,wanted,spawned:take.spawned,warning,
    title:wanted+" × "+zombieLabel(type),text:wanted+" × "+zombieLabel(type)};
}

function closeSpawnPopup(share=true){
  const modal=document.getElementById("spawnModal");
  const wasOpen=!!modal && modal.style.display!=="none" && getComputedStyle(modal).display!=="none";
  if(modal)modal.style.display="none";
  document.body.style.overflow="";
  if(share && wasOpen)z40kBroadcastPopupClose("spawn");
}

function spawnBackdropClose(e){
  if(e.target && e.target.id==="spawnModal")closeSpawnPopup();
}

function setSpawnDangerBadge(){
  const d=dangerInfo();
  const el=document.getElementById("spawnDangerBadge");
  if(!el)return;
  const wp=loadWaveProfile();
  el.textContent="NIVEAU "+d.name.toUpperCase()+(wp.enabled?"":" — "+d.xp+" XP");
  el.className="dangerBadge "+(wp.enabled?"":"danger-"+d.key);
  if(wp.enabled){
    el.style.background=d.color||"#555";
    el.style.color="#fff";
  }else{
    el.style.background="";
    el.style.color="";
  }
}

function z40kZombieSoundKey(type){
  const s=String(type||"").toLowerCase();
  if(s.includes("tyran"))return "tyranide";
  if(s.includes("crache"))return "cracheur";
  if(s.includes("abom"))return "abomination";
  if(s.includes("runner"))return "runner";
  if(s.includes("fatty"))return "fatty";
  return "walker";
}

function z40kPlayZombieSpawnSound(type){
  const list=Z40K_ZOMBIE_SOUNDS[z40kZombieSoundKey(type)]||Z40K_ZOMBIE_SOUNDS.walker;
  z40kPlayOneShot(list[Math.floor(Math.random()*list.length)],0.88,0,false);
}

function showSpawnResolution(results,dangerName){
  const result=document.getElementById("waveResult");
  const spawns=results.filter(x=>x.kind==="spawn");
  const doubles=results.filter(x=>x.kind==="double");
  const activations=results.filter(x=>x.kind==="activation");
  const none=results.filter(x=>x.kind==="none");
  const warnings=results.filter(x=>x.warning || x.kind==="warning");

  if(spawns.length){
    const soundSpawn=spawns[Math.floor(Math.random()*spawns.length)];
    z40kPlayZombieSpawnSound(soundSpawn.type);
  }

  if(result){
    let h='<div class="waveDanger">Niveau '+dangerName+'</div>';
    results.forEach(x=>{
      if(x.kind==="spawn"){
        h+='<div style="margin-top:8px"><strong>'+x.wanted+' × '+zombieLabel(x.type).toUpperCase()+'</strong></div>';
      }else if(x.kind==="activation"){
        h+='<div style="margin-top:8px"><strong>ACTIVATION SUPPLÉMENTAIRE — '+zombieLabel(x.type).toUpperCase()+'</strong></div>';
      }else if(x.kind==="double"){
        h+='<div style="margin-top:8px"><strong>DOUBLE APPARITION — EFFECTUEZ 2 NOUVELLES INVOCATIONS</strong></div>';
      }else if(x.kind==="none"){
        h+='<div style="margin-top:8px"><strong>AUCUNE APPARITION</strong></div>';
      }
      if(x.warning)h+='<div class="waveWarning">'+x.warning+'</div>';
    });
    result.innerHTML=h;
  }

  setSpawnDangerBadge();
  const artEl=document.getElementById("spawnArtImg");
  const qty=document.getElementById("spawnQty");
  const type=document.getElementById("spawnType");
  const warn=document.getElementById("spawnWarn");

  if(results.length===1 && spawns.length===1){
    const x=spawns[0];
    const z=ZOMBIE_TYPES.find(v=>v.id===x.type);
    artEl.src=z?z.art:"";
    artEl.style.display="block";
    qty.textContent=x.wanted+" × "+zombieLabel(x.type).toUpperCase();
    type.textContent="";
    warn.innerHTML=x.warning?'<div class="waveWarning">'+x.warning+'</div>':"";
  }
  else if(results.length===1 && activations.length===1){
    const x=activations[0];
    artEl.style.display="none";
    qty.textContent="ACTIVATION SUPPLÉMENTAIRE";
    type.textContent=zombieLabel(x.type).toUpperCase();
    warn.innerHTML='<div style="font-weight:800;margin-top:8px">Tous les '+zombieLabel(x.type)+' déjà en jeu jouent immédiatement une activation supplémentaire.</div>';
  }
  else if(results.length===1 && doubles.length===1){
    artEl.style.display="none";
    qty.textContent="DOUBLE APPARITION";
    type.textContent="EFFECTUEZ 2 NOUVELLES INVOCATIONS";
    warn.innerHTML="";
  }
  else if(results.length===1 && none.length===1){
    artEl.style.display="none";
    qty.textContent="AUCUNE APPARITION";
    type.textContent="";
    warn.innerHTML="";
  }
  else{
    artEl.style.display="none";
    qty.textContent="RÉSULTAT DE LA VAGUE";
    type.textContent="";
    const lines=[];
    results.forEach(x=>{
      if(x.kind==="spawn"){
        lines.push('<div style="margin-top:10px;font-size:1.2em;font-weight:800">'+x.wanted+' × '+zombieLabel(x.type).toUpperCase()+'</div>');
      }else if(x.kind==="activation"){
        lines.push('<div style="margin-top:10px;font-weight:800">ACTIVATION SUPPLÉMENTAIRE — '+zombieLabel(x.type).toUpperCase()+'</div>');
      }else if(x.kind==="double"){
        lines.push('<div style="margin-top:10px;font-weight:800">DOUBLE APPARITION — EFFECTUEZ 2 NOUVELLES INVOCATIONS</div>');
      }else if(x.kind==="none"){
        lines.push('<div style="margin-top:10px;font-weight:800">AUCUNE APPARITION</div>');
      }
      if(x.warning)lines.push('<div class="waveWarning">'+x.warning+'</div>');
    });
    warn.innerHTML=lines.join("");
  }

  const activeBtn=document.getElementById("spawnActiveEnemyBtn");
  if(activeBtn){
    activeBtn.style.display=(lastSpawnedTrackableEnemyIds?.length)?"block":"none";
    activeBtn.textContent=(lastSpawnedTrackableEnemyIds?.length===1)
      ?"👹 OUVRIR LA FICHE ENNEMI"
      :"👹 OUVRIR LES FICHES ENNEMIS ("+lastSpawnedTrackableEnemyIds.length+")";
  }
  document.getElementById("spawnModal").style.display="flex";
  document.body.style.overflow="hidden";
}
