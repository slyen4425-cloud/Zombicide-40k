/* GenSrpG Phase12 R15: 54 byte-exact original Builders character, creature and companion editor functions.
 * Builders UI/data authoring only; all Core, shared-storage, Capture gameplay and Shell owners remain in place.
 * Classic synchronous script at the original parser seam; original functions are unchanged.
 */
function hcStartingItemOptions(selected=""){
  refreshCustomEquipmentIntoItems();
  const dungeon=isDungeonMode();
  const items=itemsForMode(dungeon).sort((a,b)=>(a.name||"").localeCompare(b.name||"","fr"));
  return items.map(it=>
    '<option value="'+z40kEscHtml(it.id)+'" '+(it.id===selected?'selected':'')+'>'+
    z40kEscHtml(it.name||it.id)+' · '+z40kEscHtml(it.type||"Objet")+
    '</option>'
  ).join("");
}

function hcRenderStartingEquipment(){
  const box=document.getElementById("hcStartingEquipment"); if(!box)return;
  box.innerHTML="";
  if(!hcStartingEquipment.length){
    box.innerHTML='<div class="empty" style="padding:10px">Aucun équipement de départ.</div>';
    return;
  }
  hcStartingEquipment.forEach((row,i)=>{
    const d=document.createElement("div");
    d.className="hcStartEquipRow";
    d.innerHTML=
      '<select onchange="hcSetStartItem('+i+',this.value)">'+hcStartingItemOptions(row.itemId||"")+'</select>'+
      '<select onchange="hcSetStartSlot('+i+',this.value)">'+
        '<option value="inventory" '+(row.slot==="inventory"?'selected':'')+'>🎒 Inventaire</option>'+
        '<option value="right" '+(row.slot==="right"?'selected':'')+'>👉 Main droite</option>'+
        '<option value="left" '+(row.slot==="left"?'selected':'')+'>👈 Main gauche</option>'+
        '<option value="equipment" '+(row.slot==="equipment"?'selected':'')+'>🛡️ Équipement porté</option>'+
      '</select>'+
      '<button type="button" onclick="hcRemoveStartingEquipment('+i+')">🗑</button>';
    box.appendChild(d);
  });
}

function hcAddStartingEquipment(){
  refreshCustomEquipmentIntoItems();
  const dungeon=isDungeonMode();
  const first=ITEMS.find(it=>dungeon?isDungeonItemRecord(it):!isDungeonItemRecord(it))?.id||"";
  if(!first){alert("Aucun objet disponible.");return}
  hcStartingEquipment.push({itemId:first,slot:"inventory"});
  hcRenderStartingEquipment();
}

function hcRemoveStartingEquipment(i){
  hcStartingEquipment.splice(i,1);
  hcRenderStartingEquipment();
}

function hcSetStartItem(i,id){
  if(hcStartingEquipment[i])hcStartingEquipment[i].itemId=id;
}

function hcSetStartSlot(i,slot){
  if(hcStartingEquipment[i])hcStartingEquipment[i].slot=slot;
}

function hcLoadStartingEquipment(hero){
  hcStartingEquipment=Array.isArray(hero?.startingEquipment)
    ? hero.startingEquipment.map(x=>({itemId:x.itemId||"",slot:x.slot||"inventory"}))
    : [];
  hcRenderStartingEquipment();
}

function hcUseStatsForHeroRecord(h,id=null){
  // Built-in Dungeon heroes have RPG stats unless an explicit override says otherwise.
  if(id && typeof DUNGEON_HERO_IDS!=="undefined" && DUNGEON_HERO_IDS.includes(String(id))){
    if(h && h.useRpgStats===false)return false;
    return true;
  }

  // Existing custom hero: explicit saved flag wins.
  if(h){
    if(h.useRpgStats===false)return false;
    if(h.useRpgStats===true)return true;
    return h.dungeonStats!==null && h.dungeonStats!==undefined;
  }

  // New hero: default depends on gameplay family.
  // Capture/trainer-oriented heroes start without RPG stats; classic RPG starts with them.
  try{return gensCurrentContentFamily()!=="creature"}catch(e){return true}
}

function hcResetStatsUiForHero(h,id=null){
  const useStats=document.getElementById("hcUseRpgStats");
  if(useStats)useStats.checked=hcUseStatsForHeroRecord(h,id);
  hcRenderRpgStatsUsage();
}

function hcRenderRpgStatsUsage(){
  const on=!!document.getElementById("hcUseRpgStats")?.checked;
  const box=document.getElementById("hcRpgStatsFields");
  if(box){
    box.style.display=on?"grid":"none";
    box.style.opacity=on?"1":".35";
  }
}

function applyHeroCreatorModeSections(showRpg){
  const legacySkills=document.getElementById("hcLegacySkillsSection");
  const dungeonTreeInfo=document.getElementById("hcDungeonSkillTreeInfo");
  const skillLibrary=document.getElementById("skillLibraryPanel");
  const skillEditor=document.getElementById("skillEditorPanel");
  const slotPicker=document.getElementById("skillSlotPickerOverlay");
  const skillPicker=document.getElementById("skillPickerOverlay");
  if(legacySkills)legacySkills.style.display=showRpg?"none":"block";
  if(dungeonTreeInfo)dungeonTreeInfo.style.display=showRpg?"block":"none";
  // Sécurité stricte : aucun éditeur/choix de compétence Zombicide ne reste ouvert en Dungeon.
  if(showRpg){
    if(skillLibrary)skillLibrary.style.display="none";
    if(skillEditor)skillEditor.style.display="none";
    if(slotPicker)slotPicker.classList.remove("open");
    if(skillPicker)skillPicker.classList.remove("open");
    hcAssignedSkillIds=[null,null,null,null,null,null,null];
    const slots=document.getElementById("hcSkillSlots");if(slots)slots.innerHTML="";
  }
}

function openHeroCreatorStatic(id=null){
  const h=id?findCustomHero(id):null;
  hcEditingId=id;
  hcAvatarData=h?.avatar||"";
  hcAvatarCrop=gensNormCrop(h?.avatarCrop);
  document.getElementById("hcName").value=h?.name||"NOUVEAU HÉROS";
  document.getElementById("hcRole").value=h?.role||"Héros personnalisé";
  document.getElementById("hcArmor").value=String(h?.armor||2);
  document.getElementById("hcHp").value=h?.hp||3;
  const rpgBox=document.getElementById("hcDungeonStatsBox");
  const showRpg=isDungeonMode() || gensHasActiveRpgUniverse() || !!h?.dungeonBuiltin || String(id||"").startsWith("dungeon_");const hcResInit=document.getElementById("hcResistanceEditor");if(hcResInit)hcResInit.innerHTML=gensResistanceEditorHtml(h?.resistances||h?.dungeonStats?.resistances||[],"hcRes");
  if(rpgBox)rpgBox.style.display=showRpg?"block":"none";
  hcResetStatsUiForHero(h,id);
  applyHeroCreatorModeSections(showRpg);
  if(showRpg){fillHeroTalentSetSelect(h?.talentSetId||CHARS[id]?.talentSetId||defaultTalentSetForHero(id));

    const ds=h?.dungeonStats||CHARS[id]?.dungeonStats||{};
    const setR=(fid,val)=>{const el=document.getElementById(fid);if(el)el.value=val};
    setR("hcRpgForce",Number(ds.force??ds.strength??ds.FOR??10)||0);
    setR("hcRpgAgility",Number(ds.agilite??ds.dexterity??ds.DEX??10)||0);
    setR("hcRpgIntelligence",Number(ds.intelligence??ds.int??ds.INT??10)||0);
    setR("hcRpgSpirit",Number(ds.esprit??ds.spirit??ds.wisdom??ds.SAG??10)||0);
    setR("hcRpgEndurance",Number(ds.endurance??ds.constitution??ds.CON??10)||0);
    setR("hcRpgDefense",Number(ds.defense??10)||0);
    setR("hcRpgArmor",Number(ds.armor??h?.armor??0)||0);
    setR("hcRpgInitiative",Number(ds.initiative??0)||0);
    setR("hcRpgMovement",Number(ds.movement??3)||0);
    const heroEls=h?.elementTypes||ds.elementTypes||[];const heroCfg=gensCurrentElementSettings();const heroElEnabled=heroCfg?.enabled===true;hcRenderElementTypes(heroEls);const hcRes=document.getElementById("hcResistanceEditor");if(hcRes){const arr=gensNormalizeResistances(h?.resistances||ds.resistances||[]);hcRes.innerHTML="";arr.forEach(r=>{const d=document.createElement("div");d.className="gensResistanceRow";d.style.cssText="display:grid;grid-template-columns:1fr 110px 42px;gap:6px;margin-top:6px";d.innerHTML='<select data-res-kind>'+gensResistanceOptions(r.kind)+'</select><input data-res-value type="number" step="1" min="-1000" max="1000" value="'+r.value+'"><button type="button" class="smallBtn" onclick="this.closest(\'.gensResistanceRow\').remove()">✕</button>';hcRes.appendChild(d);});}const hew=document.getElementById("hcRpgElementsWrap");if(hew)hew.style.display=heroElEnabled?"block":"none";
  }
  const img=document.getElementById("hcAvatarPreview");
  if(hcAvatarData){img.src=hcAvatarData;img.style.display="block";renderHeroAvatarPreviewCrop()}
  else{img.removeAttribute("src");img.style.display="none"}
  if(!showRpg)hcBuildSkills(h);
  hcLoadStartingEquipment(h);
  document.getElementById("heroCreatorModal").classList.add("open");
}

function hcClassicProgressionSlots(){return HC_SKILL_TEMPLATE.map(x=>({...x}))}

function hcNormalizeProgressionSlots(hero=null){
  const saved=Array.isArray(hero?.progressionSlots)&&hero.progressionSlots.length
    ? hero.progressionSlots
    : (Array.isArray(hero?.skills)&&hero.skills.length
      ? hero.skills.map((sk,i)=>({color:sk.color||HC_SKILL_TEMPLATE[i]?.color||"red",unlock:Number(sk.unlock??HC_SKILL_TEMPLATE[i]?.unlock??43),label:sk.label||HC_SKILL_TEMPLATE[i]?.label||("PALIER "+(i+1))}))
      : hcClassicProgressionSlots());
  return saved.map((x,i)=>({
    color:String(x?.color||"red"),
    unlock:Math.max(0,Number(x?.unlock)||0),
    label:String(x?.label||("PALIER "+(i+1)))
  }));
}

function hcProgressionColorOptions(v){
  return [["blue","Bleu"],["yellow","Jaune"],["orange","Orange"],["red","Rouge"],["purple","Violet"],["black","Noir"],["green","Vert"],["white","Blanc"]]
    .map(x=>'<option value="'+x[0]+'" '+(v===x[0]?'selected':'')+'>'+x[1]+'</option>').join("");
}

function hcAddProgressionTier(){
  const prev=hcProgressionSlots[hcProgressionSlots.length-1]||{unlock:0,color:"blue"};
  hcProgressionSlots.push({color:prev.color==="red"?"purple":prev.color,unlock:Number(prev.unlock||0)+10,label:"NOUVEAU PALIER"});
  hcAssignedSkillIds.push(null);renderHeroSkillSlots(null,true);
}

function hcRemoveProgressionTier(i){
  if(hcProgressionSlots.length<=1){alert("Le héros doit conserver au moins un palier.");return}
  hcProgressionSlots.splice(i,1);hcAssignedSkillIds.splice(i,1);renderHeroSkillSlots(null,true);
}

function hcMoveProgressionTier(i,dir){
  const j=i+dir;if(j<0||j>=hcProgressionSlots.length)return;
  [hcProgressionSlots[i],hcProgressionSlots[j]]=[hcProgressionSlots[j],hcProgressionSlots[i]];
  [hcAssignedSkillIds[i],hcAssignedSkillIds[j]]=[hcAssignedSkillIds[j],hcAssignedSkillIds[i]];
  renderHeroSkillSlots(null,true);
}

function hcUpdateProgressionSlot(i,key,value){
  const x=hcProgressionSlots[i];if(!x)return;
  if(key==="unlock")x.unlock=Math.max(0,Number(value)||0);else x[key]=String(value||"");
  renderHeroSkillSlots(null,true);
}

function hcResetProgressionClassic(){
  if(!confirm("Revenir au preset Zombicide classique ? Les compétences actuellement attachées seront conservées dans l’ordre autant que possible."))return;
  const ids=[...hcAssignedSkillIds];hcProgressionSlots=hcClassicProgressionSlots();
  hcAssignedSkillIds=hcProgressionSlots.map((_,i)=>ids[i]||null);renderHeroSkillSlots(null,true);
}

function openControllableCreatureLibrary(){
  const profile=getActiveGameProfile?.();
  if(!profile || profile.gameStyle!=="dungeon"){
    alert("Cette section est réservée aux univers RPG / Dungeon.");
    return;
  }
  const modules=gensGameplayModules?.()||{};
  if(!modules.controllableCreatures){
    alert("Le module Créatures contrôlables est désactivé dans Style & Modules.");
    return;
  }
  const modal=document.getElementById("controllableCreatureModal");
  if(!modal){alert("Bibliothèque Créatures introuvable.");return}
  modal.style.display="flex";
  modal.classList.add("open");const mb=modal.querySelector(".modalBox");if(mb)mb.scrollTop=0;
  const fh=document.getElementById("creatureFamilyLibraryHint");if(fh)fh.textContent="Bibliothèque "+gensContentFamilyLabel()+" partagée entre les univers compatibles.";renderControllableCreatureLibrary();const nb=document.getElementById("newControllableCreatureBtn");if(nb)nb.style.setProperty("display","block","important");
}

function closeControllableCreatureLibrary(){
  const modal=document.getElementById("controllableCreatureModal");
  if(modal){modal.style.display="none";modal.classList.remove("open")}
}

function renderControllableCreatureLibrary(){
  const b=document.getElementById("controllableCreatureList");if(!b)return;
  const a=loadSharedEntities().filter(x=>x.category==="creature");
  b.innerHTML=a.length?a.map(x=>{
    const icon=x.iconData?'<img src="'+x.iconData+'" style="width:52px;height:52px;object-fit:cover;border-radius:10px">':'<span style="font-size:36px">'+z40kEscHtml(x.icon||"🐲")+'</span>';
    const art=x.artData?'<img src="'+x.artData+'" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-top:7px">':'';
    const target=x.evolution?.targetId?loadSharedEntities().find(e=>e.id===x.evolution.targetId):null;
    const evo=x.canEvolve?(target?' · 🧬 → '+z40kEscHtml(target.name)+(x.evolution?.condition==="level"?' niv. '+(x.evolution.level||1):''):' · 🧬 évolution à configurer'):'';
    return `<div class="v2LibCard">
      <div style="display:grid;grid-template-columns:58px 1fr;gap:8px;align-items:center">
        <div>${icon}</div>
        <div><div class="v2LibHead"><strong>${z40kEscHtml(x.name)}</strong><span class="badge">${x.starterCreature?"⭐ BASE · ":""}Niv. ${Math.max(1,Number(x.level)||1)}</span></div>
        <div class="small">${x.capturable!==false?"🪤 "+Math.max(0,Math.min(100,Number(x.captureRate)||0))+"%":"Non capturable"} · 🌍 ${Number(x.spawnChance??25)}%${evo}</div>
        <div class="small">${((x.spawnTags?.length?x.spawnTags:x.elementTypes)||[]).map(t=>{const e=gensElementById(t);return e?(e.icon||"◈")+" "+(e.name||t):t}).join(" · ")||"Aucun tag d’apparition"}</div></div>
      </div>
      ${art}
      <div class="small" style="margin-top:5px">${z40kEscHtml(x.desc||"")}</div>
      <div class="v2LibActions">
        <button type="button" onclick="editSharedEntity('${z40kEscAttr(x.id)}')">✏️ MODIFIER</button>
        <button type="button" class="creatorDelete" onclick="deleteSharedEntity('${z40kEscAttr(x.id)}')">🗑️</button>
      </div>
    </div>`;
  }).join(""):'<div class="empty">Aucune créature contrôlable.</div>';
}

function openCompanionLibrary(){
  const profile=getActiveGameProfile?.();
  if(!profile || profile.gameStyle!=="dungeon"){
    alert("Cette section est réservée aux univers RPG / Dungeon.");
    return;
  }
  const modules=gensGameplayModules?.()||{};
  if(!modules.companions){
    alert("Le module Compagnons / Invocations est désactivé dans Style & Modules.");
    return;
  }
  const modal=document.getElementById("companionLibraryModal");
  if(!modal){alert("Bibliothèque Compagnons introuvable.");return}
  modal.style.display="flex";
  modal.classList.add("open");const mb=modal.querySelector(".modalBox");if(mb)mb.scrollTop=0;
  renderCompanionLibrary();
}

function closeCompanionLibrary(){
  const modal=document.getElementById("companionLibraryModal");
  if(modal){modal.style.display="none";modal.classList.remove("open")}
}

function renderCompanionLibrary(){
  const b=document.getElementById("companionLibraryList");if(!b)return;
  const a=sharedEntitiesByCategory("companion");
  b.innerHTML=a.length?a.map(x=>`
    <div class="v2LibCard">
      <div class="v2LibHead"><strong>${z40kEscHtml(x.name)}</strong><span class="badge">${z40kEscHtml(x.companionType||"Compagnon")}</span></div>
      <div class="small">${z40kEscHtml(x.control||"player")} · ${x.durationMode==="turns"?(x.durationTurns||1)+" tour(s)":"Permanent"}</div>
      <div class="v2LibActions">
        <button onclick="editSharedEntity('${z40kEscAttr(x.id)}')">✏️ MODIFIER</button>
        <button class="creatorDelete" onclick="deleteSharedEntity('${z40kEscAttr(x.id)}')">🗑️</button>
      </div>
    </div>`).join(""):'<div class="empty">Aucun compagnon ou invocation.</div>';
}

function newControllableCreature(){
  try{
    const profile=getActiveGameProfile?.();
    if(!profile || profile.gameStyle!=="dungeon"){
      alert("Sélectionne d’abord un univers RPG / Dungeon.");
      return;
    }
    const modules=gensGameplayModules?.()||{};
    if(!modules.controllableCreatures){
      alert("Active le module « Créatures contrôlables » dans Style & Modules.");
      return;
    }

    sharedEntityEditingId=null;
    sharedEntityEditingCategory="creature";

    const lib=document.getElementById("controllableCreatureModal");
    if(lib){lib.style.display="none";lib.classList.remove("open")}

    openSharedEntityEditor({
      name:"",
      icon:"🐲",
      iconData:"",
      artData:"",
      level:1,
      hp:10,
      stats:{force:10,agilite:10,intelligence:10,esprit:10,endurance:10,initiative:0},
      elementTypes:[],
      resistances:[],
      abilityIds:[],
      capturable:true,
      captureRate:50,
      canEvolve:false,
      evolution:null,
      desc:""
    },"creature");

    const name=document.getElementById("sharedEntityName");
    if(name)setTimeout(()=>name.focus(),50);
  }catch(err){
    console.error("Nouvelle créature",err);
    alert("Impossible d’ouvrir la création de créature : "+(err?.message||err));
  }
}

function newCompanionEntity(){sharedEntityEditingId=null;sharedEntityEditingCategory="companion";openSharedEntityEditor(null,"companion")}

function editSharedEntity(id){
  try{
    const x=loadSharedEntities().find(e=>String(e.id)===String(id));
    if(!x){alert("Créature introuvable : "+id);return}
    sharedEntityEditingId=x.id;
    sharedEntityEditingCategory=x.category||"creature";
    openSharedEntityEditor(JSON.parse(JSON.stringify(x)),sharedEntityEditingCategory);
  }catch(err){
    console.error("Édition créature :",err);
    alert("Impossible d’ouvrir cette créature : "+(err?.message||err));
  }
}

function deleteSharedEntity(id){
  const a=loadSharedEntities(),x=a.find(e=>e.id===id);if(!x)return;
  if(!confirm("Supprimer « "+x.name+" » ?"))return;
  saveSharedEntities(a.filter(e=>e.id!==id));
  renderControllableCreatureLibrary();renderCompanionLibrary();
}

function sharedEntityElementOptions(selected=""){
  const cfg=gensCurrentElementSettings();
  const els=(cfg?.enabled?(cfg.elements||[]):[]);
  return '<option value="">Aucun</option>'+els.map(e=>'<option value="'+z40kEscAttr(e.id)+'" '+(String(selected)===String(e.id)?'selected':'')+'>'+z40kEscHtml((e.icon||"◈")+" "+e.name)+'</option>').join("");
}

function sharedEntityAddElement(selected=""){
  const box=document.getElementById("sharedEntityElements");if(!box||box.children.length>=2)return;
  const r=document.createElement("div");r.className="sharedEntityElementRow";
  r.style.cssText="display:grid;grid-template-columns:1fr 42px;gap:6px;margin-top:6px";
  r.innerHTML='<select>'+sharedEntityElementOptions(selected)+'</select><button class="smallBtn" onclick="this.closest(&quot;.sharedEntityElementRow&quot;).remove()">✕</button>';
  box.appendChild(r);
}

function sharedEntityReadElements(){
  return [...document.querySelectorAll("#sharedEntityElements .sharedEntityElementRow select")].map(x=>x.value).filter(Boolean).slice(0,2);
}

function sharedEntityRenderAbilities(ids=[]){
  const b=document.getElementById("sharedEntityAbilityList");if(!b)return;
  const list=(ids||[]).map(abilityById).filter(Boolean);
  b.innerHTML=list.length?list.map(a=>`
    <div class="v2LibCard" style="cursor:pointer" onclick="showAbilityInfo('${z40kEscAttr(a.id)}')">
      <strong>${z40kEscHtml(a.name)}</strong>
      <div class="small">${z40kEscHtml(gensAbilityCategoryLabel(a.category))} · ${a.type==="active"?"⚡ Active":"📈 Passive"}</div>
      <div class="small" style="margin-top:3px">${z40kEscHtml(a.desc||"Cliquer pour voir les détails.")}</div>
      <button class="creatorDelete" onclick="event.stopPropagation();sharedEntityRemoveAbility('${z40kEscAttr(a.id)}')">✕</button>
    </div>`).join(""):'<div class="empty">Aucune compétence.</div>';
  b.dataset.ids=JSON.stringify(ids||[]);
}

function sharedEntityAbilityIds(){
  try{return JSON.parse(document.getElementById("sharedEntityAbilityList")?.dataset.ids||"[]")}catch(e){return[]}
}

function sharedEntityRemoveAbility(id){
  sharedEntityRenderAbilities(sharedEntityAbilityIds().filter(x=>x!==id));
}

function sharedEntityImageChanged(ev,kind){
  const f=ev.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    const raw=String(r.result||"");
    const img=new Image();
    img.onload=()=>{
      try{
        const maxSide=kind==="icon"?256:900;
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||1,img.naturalHeight||1));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        let data=c.toDataURL("image/webp",kind==="icon"?0.82:0.78);
        if(!data||data.length>1200000)data=c.toDataURL("image/jpeg",kind==="icon"?0.82:0.74);
        document.getElementById(kind==="icon"?"sharedEntityIconData":"sharedEntityArtData").value=data;
        renderSharedEntityVisualPreview();
      }catch(err){alert("Impossible de préparer cette image.")}
    };
    img.src=raw;
  };
  r.readAsDataURL(f);
}

function renderSharedEntityVisualPreview(){
  const box=document.getElementById("sharedEntityVisualPreview");if(!box)return;
  const iconText=document.getElementById("sharedEntityIcon")?.value||"🐲";
  const iconData=document.getElementById("sharedEntityIconData")?.value||"";
  const art=document.getElementById("sharedEntityArtData")?.value||"";
  const icon=iconData?'<img src="'+iconData+'" style="width:72px;height:72px;object-fit:cover;border-radius:12px;border:1px solid #555">':'<div style="font-size:46px;text-align:center">'+z40kEscHtml(iconText)+'</div>';
  const artHtml=art?'<img src="'+art+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;border:1px solid #555">':'<div class="hint" style="text-align:left">Aucun art principal.</div>';
  box.innerHTML=icon+artHtml;
}

function fillSharedEntityEvolutionTargets(selected="",selfId=""){
  const sel=document.getElementById("sharedEntityEvolutionTarget");if(!sel)return;
  const list=loadSharedEntities().filter(x=>x.category==="creature"&&String(x.id)!==String(selfId));
  sel.innerHTML='<option value="">Choisir une créature...</option>'+list.map(x=>'<option value="'+z40kEscAttr(x.id)+'" '+(String(selected)===String(x.id)?'selected':'')+'>'+z40kEscHtml((x.icon||"🐲")+" "+x.name)+'</option>').join("");
}

function renderSharedEntityEvolutionUi(){
  const on=document.getElementById("sharedEntityCanEvolve")?.value==="true";
  const fields=document.getElementById("sharedEntityEvolutionFields");if(fields)fields.style.display=on?"block":"none";
  const cond=document.getElementById("sharedEntityEvolutionCondition")?.value||"level";
  const lw=document.getElementById("sharedEntityEvolutionLevelWrap");if(lw)lw.style.display=(on&&cond==="level")?"":"none";
}

function sharedEntitySpawnTagOptions(selected=""){
  let els=[];
  try{
    if(rpgElementDraft){
      syncRpgElementDraftFromUi();
      els=(rpgElementDraft.elements||[]).map(e=>({...e}));
    }
  }catch(e){}
  if(!els.length){
    try{
      const editorOpen=document.getElementById("rpgUniverseEditorModal")?.style.display==="block";
      const id=editorOpen?rpgEditingId:activeGameProfileId();
      const p=loadGameProfiles().find(x=>String(x.id)===String(id));
      if(p?.rpgUniverse){ensureRpgProfileData(p);els=gensNormalizeElementSettings(p.rpgUniverse.elements).elements||[]}
    }catch(e){}
  }
  if(!els.length){try{els=gensCurrentElementSettings().elements||[]}catch(e){}}
  if(!els.length)els=gensDefaultElementSettings().elements||[];
  return '<option value="">— choisir un tag —</option>'+els.map(e=>
    '<option value="'+z40kEscAttr(e.id)+'" '+(String(selected)===String(e.id)?'selected':'')+'>'+z40kEscHtml((e.icon||"◈")+" "+(e.name||e.id))+'</option>'
  ).join("");
}

function sharedEntityAddSpawnTag(selected=""){
  const box=document.getElementById("sharedEntitySpawnTags");if(!box)return;
  const row=document.createElement("div");
  row.className="sharedEntitySpawnTagRow";
  row.style.cssText="display:grid;grid-template-columns:1fr 42px;gap:6px;margin-top:6px";
  row.innerHTML='<select class="sharedEntitySpawnTagSelect">'+sharedEntitySpawnTagOptions(selected)+'</select>'+
    '<button type="button" class="smallBtn" onclick="this.closest(&quot;.sharedEntitySpawnTagRow&quot;).remove()">✕</button>';
  box.appendChild(row);
}

function sharedEntityRenderSpawnTags(tags=[]){
  const box=document.getElementById("sharedEntitySpawnTags");if(!box)return;
  box.innerHTML="";
  const arr=[...new Set((Array.isArray(tags)?tags:[]).filter(Boolean))];
  arr.forEach(t=>sharedEntityAddSpawnTag(t));
}

function sharedEntityReadSpawnTags(){
  const box=document.getElementById("sharedEntitySpawnTags");if(!box)return[];
  return [...new Set([...box.querySelectorAll(".sharedEntitySpawnTagSelect")].map(x=>x.value).filter(Boolean))];
}

function openSharedEntityEditor(x,cat){
  try{
    x=x||{};
    sharedEntityEditingCategory=cat||x.category||"creature";
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??""};

    const title=document.getElementById("sharedEntityEditorTitle");
    if(title)title.textContent=sharedEntityEditingCategory==="creature"?"🐲 Créature contrôlable":"🐺 Compagnon / Invocation";

    set("sharedEntityName",x.name||"");
    set("sharedEntityIcon",x.icon||"🐲");
    set("sharedEntityIconData",x.iconData||"");
    set("sharedEntityArtData",x.artData||"");
    try{renderSharedEntityVisualPreview()}catch(e){}

    const kind=document.getElementById("sharedEntityKind");
    if(kind)kind.innerHTML=sharedEntityEditingCategory==="creature"
      ?'<option value="creature">Créature contrôlable</option>'
      :'<option value="companion">Compagnon / Invocation</option>';

    set("sharedEntityLevel",x.level??1);
    set("sharedEntityHp",x.hp??10);
    set("sharedEntityForce",x.stats?.force??10);
    set("sharedEntityAgility",x.stats?.agilite??10);
    set("sharedEntityIntelligence",x.stats?.intelligence??10);
    set("sharedEntitySpirit",x.stats?.esprit??10);
    set("sharedEntityEndurance",x.stats?.endurance??10);
    set("sharedEntityInitiative",x.stats?.initiative??0);
    set("sharedEntityCapturable",String(x.capturable!==false));
    set("sharedEntityCaptureRate",x.captureRate??50);
    set("sharedEntitySpawnChance",x.spawnChance??25);
    sharedEntityRenderSpawnTags(x.spawnTags?.length?x.spawnTags:(x.elementTypes||[]));
    set("sharedEntityCanEvolve",String(!!x.canEvolve));
    set("sharedEntityEvolutionCondition",x.evolution?.condition||"level");
    set("sharedEntityEvolutionLevel",x.evolution?.level??x.evolutionLevel??16);
    try{fillSharedEntityEvolutionTargets(x.evolution?.targetId||x.evolutionTo||"",x.id||"")}catch(e){}
    try{renderSharedEntityEvolutionUi()}catch(e){}

    set("sharedEntityCompanionType",x.companionType||"companion");
    set("sharedEntityControl",x.control||"player");
    set("sharedEntityDurationMode",x.durationMode||"permanent");
    set("sharedEntityDurationTurns",x.durationTurns??3);
    set("sharedEntityDesc",x.desc||"");

    const creatureOpts=document.getElementById("sharedEntityCreatureOptions");
    const companionOpts=document.getElementById("sharedEntityCompanionOptions");
    if(creatureOpts)creatureOpts.style.display=sharedEntityEditingCategory==="creature"?"":"none";
    if(companionOpts)companionOpts.style.display=sharedEntityEditingCategory==="companion"?"":"none";

    const eb=document.getElementById("sharedEntityElements");
    if(eb){
      eb.innerHTML="";
      (x.elementTypes||[]).forEach(v=>sharedEntityAddElement(v));
    }

    const rb=document.getElementById("sharedEntityResistances");
    if(rb){
      rb.innerHTML="";
      const editorRes=(Array.isArray(x.resistances)&&x.resistances.length)
        ?x.resistances
        :captureAffinitiesToGenericResistances(x.elementResistances||[],x.elementWeaknesses||[]);
      gensNormalizeResistances(editorRes).forEach(r=>{
        const d=document.createElement("div");
        d.className="gensResistanceRow";
        d.style.cssText="display:grid;grid-template-columns:1fr 110px 42px;gap:6px;margin-top:6px";
        d.innerHTML='<select data-res-kind>'+gensResistanceOptions(r.kind)+'</select><input data-res-value type="number" value="'+r.value+'"><button type="button" class="smallBtn" onclick="this.closest(&quot;.gensResistanceRow&quot;).remove()">✕</button>';
        rb.appendChild(d);
      });
    }

    try{sharedEntityRenderAbilities(x.abilityIds||[])}catch(e){}

    const modal=document.getElementById("sharedEntityEditorModal");
    if(!modal)throw new Error("Fenêtre d’édition introuvable");
    modal.style.display="flex";
    modal.classList.add("open");
    modal.scrollTop=0;
  }catch(err){
    console.error("Ouverture éditeur créature",err);
    alert("Impossible d’ouvrir l’éditeur : "+(err?.message||err));
  }
}

function closeSharedEntityEditor(){
  const modal=document.getElementById("sharedEntityEditorModal");
  if(modal){modal.style.display="none";modal.classList.remove("open")}
  if(sharedEntityEditingCategory==="creature"){
    const lib=document.getElementById("controllableCreatureModal");
    if(lib){lib.style.display="flex";lib.classList.add("open");renderControllableCreatureLibrary();const mb=lib.querySelector(".modalBox");if(mb)mb.scrollTop=0}
  }else if(sharedEntityEditingCategory==="companion"){
    const lib=document.getElementById("companionLibraryModal");
    if(lib){lib.style.display="flex";lib.classList.add("open");renderCompanionLibrary();const mb=lib.querySelector(".modalBox");if(mb)mb.scrollTop=0}
  }
}

function saveSharedEntity(){
  try{
    const name=document.getElementById("sharedEntityName")?.value.trim();
    if(!name){alert("Donne un nom à la créature.");return}
    const a=loadSharedEntities();
    const id=sharedEntityEditingId||("entity_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5));
    const x={
      id,category:sharedEntityEditingCategory,name,
      contentFamily:gensCurrentContentFamily(),
      universeId:gensCurrentUniverseId()||null,
      icon:(document.getElementById("sharedEntityIcon")?.value||"🐲").trim()||"🐲",
      iconData:document.getElementById("sharedEntityIconData")?.value||"",
      artData:document.getElementById("sharedEntityArtData")?.value||"",
      level:Math.max(1,Number(document.getElementById("sharedEntityLevel")?.value)||1),
      hp:Math.max(1,Number(document.getElementById("sharedEntityHp")?.value)||1),
      stats:{
        force:Number(document.getElementById("sharedEntityForce")?.value)||0,
        agilite:Number(document.getElementById("sharedEntityAgility")?.value)||0,
        intelligence:Number(document.getElementById("sharedEntityIntelligence")?.value)||0,
        esprit:Number(document.getElementById("sharedEntitySpirit")?.value)||0,
        endurance:Number(document.getElementById("sharedEntityEndurance")?.value)||0,
        initiative:Number(document.getElementById("sharedEntityInitiative")?.value)||0
      },
      elementTypes:sharedEntityReadElements(),
      resistances:gensReadResistanceEditor(document.getElementById("sharedEntityResistances")?.parentElement||document),
      abilityIds:sharedEntityAbilityIds(),
      desc:document.getElementById("sharedEntityDesc")?.value.trim()||""
    };
    if(sharedEntityEditingCategory==="creature"){
      x.capturable=document.getElementById("sharedEntityCapturable")?.value==="true";
      x.captureRate=Math.max(0,Math.min(100,Number(document.getElementById("sharedEntityCaptureRate")?.value)||0));
      x.spawnChance=Math.max(0,Math.min(100,Number(document.getElementById("sharedEntitySpawnChance")?.value)||0));
      x.spawnTags=sharedEntityReadSpawnTags();
      x.canEvolve=document.getElementById("sharedEntityCanEvolve")?.value==="true";
      const condition=document.getElementById("sharedEntityEvolutionCondition")?.value||"level";
      const level=Math.max(1,Number(document.getElementById("sharedEntityEvolutionLevel")?.value)||1);
      const targetId=document.getElementById("sharedEntityEvolutionTarget")?.value||"";
      x.evolutionLevel=level;
      x.evolutionTo=targetId;
      x.evolution=x.canEvolve?{enabled:true,condition,level,targetId}:null;
      const aff=captureGenericResistancesToAffinities(x.resistances||[]);
      x.elementResistances=aff.res;
      x.elementWeaknesses=aff.weak;
    }else{
      x.companionType=document.getElementById("sharedEntityCompanionType")?.value||"companion";
      x.control=document.getElementById("sharedEntityControl")?.value||"player";
      x.durationMode=document.getElementById("sharedEntityDurationMode")?.value||"permanent";
      x.durationTurns=Math.max(1,Number(document.getElementById("sharedEntityDurationTurns")?.value)||1);
    }
    const i=a.findIndex(e=>String(e.id)===String(id));
    if(i>=0)a[i]={...a[i],...x};else a.push(x);
    if(saveSharedEntities(a)===false)return;
    sharedEntityEditingId=id;
    closeSharedEntityEditor();
    renderControllableCreatureLibrary();
    renderCompanionLibrary();
    try{renderCreatureCaptureList()}catch(e){}
  }catch(err){
    console.error("Sauvegarde créature",err);
    alert("Impossible d’enregistrer la créature : "+(err?.message||err));
  }
}

function hcRenderSavedHeroes(){
  const box=document.getElementById("hcSavedHeroes");
  if(!box)return;
  const heroes=z40kCustomHeroes();

  box.innerHTML=heroes.length ? heroes.map(h=>
    '<div style="display:flex;gap:7px;align-items:center;background:#292929;border-radius:9px;padding:7px">'+
      '<div style="flex:1"><strong>'+z40kEscHtml(h.name)+'</strong>'+(h.universeId?'<div class="small">📁 '+z40kEscHtml(gensCurrentUniverseName())+'</div>':'')+'</div>'+
      '<button type="button" style="font-size:12px;padding:7px" onclick="openHeroCreator(\''+h.id+'\')">ÉDITER</button>'+
      '<button type="button" style="font-size:12px;padding:7px;background:#365d76" onclick="useCustomHeroNow(\''+h.id+'\')">UTILISER</button>'+
    '</div>'
  ).join("") : '<div class="hint">Aucun héros personnalisé enregistré.</div>';
}

function openHeroCreator(id=null){
  hcEditingId=id;
  const h=(id&&typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id)))?(()=>{ensureDungeonHeroes();const c=CHARS[id];return c?{id,name:c.name,role:c.role,avatar:c.image,avatarCrop:c.avatarCrop,armor:c.armor,hp:c.maxHp,startingEquipment:c.startingEquipment,skills:c.skills,dungeonStats:c.dungeonStats,useRpgStats:c.useRpgStats!==false,dungeonBuiltin:true}:null})():(id?z40kCustomHeroes().find(x=>x.id===id):null);
  hcAvatarData=h?.avatar||"";
  hcAvatarCrop=gensNormCrop(h?.avatarCrop);
  document.getElementById("hcName").value=h?.name||"NOUVEAU HÉROS";
  document.getElementById("hcRole").value=h?.role||"Héros personnalisé";
  document.getElementById("hcArmor").value=String(h?.armor||2);
  document.getElementById("hcHp").value=h?.hp||3;
  const rpgBox=document.getElementById("hcDungeonStatsBox");
  const showRpg=isDungeonMode() || gensHasActiveRpgUniverse() || !!h?.dungeonBuiltin || String(id||"").startsWith("dungeon_");
  if(rpgBox)rpgBox.style.display=showRpg?"block":"none";
  hcResetStatsUiForHero(h,id);
  applyHeroCreatorModeSections(showRpg);
  if(showRpg){fillHeroTalentSetSelect(h?.talentSetId||CHARS[id]?.talentSetId||defaultTalentSetForHero(id));

    const ds=h?.dungeonStats||CHARS[id]?.dungeonStats||{};
    const setR=(fid,val)=>{const el=document.getElementById(fid);if(el)el.value=val};
    setR("hcRpgForce",Number(ds.force??ds.strength??ds.FOR??10)||0);
    setR("hcRpgAgility",Number(ds.agilite??ds.dexterity??ds.DEX??10)||0);
    setR("hcRpgIntelligence",Number(ds.intelligence??ds.int??ds.INT??10)||0);
    setR("hcRpgSpirit",Number(ds.esprit??ds.spirit??ds.wisdom??ds.SAG??10)||0);
    setR("hcRpgEndurance",Number(ds.endurance??ds.constitution??ds.CON??10)||0);
    setR("hcRpgDefense",Number(ds.defense??10)||0);
    setR("hcRpgArmor",Number(ds.armor??h?.armor??0)||0);
    setR("hcRpgInitiative",Number(ds.initiative??0)||0);
    setR("hcRpgMovement",Number(ds.movement??3)||0);
  }
  const img=document.getElementById("hcAvatarPreview");
  if(hcAvatarData){img.src=hcAvatarData;img.style.display="block";renderHeroAvatarPreviewCrop()}else{img.removeAttribute("src");img.style.display="none"}
  if(!showRpg)hcBuildSkills(h);
  hcLoadStartingEquipment(h);
  document.getElementById("heroCreatorModal").classList.add("open");
}

function closeHeroCreator(){
  document.getElementById("heroCreatorModal").classList.remove("open");
  applyCustomHeroesMulti();
  renderMenuStatuses();
  const hm=document.getElementById("heroManager");
  if(hm && hm.style.display==="block")renderHeroManager();
  hcEditingId=null;
}

function newCustomHero(){openHeroCreator(null)}

function saveCustomHero(){
  const name=document.getElementById("hcName").value.trim();
  if(!name){alert("Donne un nom au héros.");return}

  const all=loadCustomHeroesMulti();
  const id=hcEditingId||("custom_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6));

  const previousHero=all.find(h=>String(h.id)===String(id));
  const hero={
    id,
    name,
    gameMode:previousHero?.gameMode||(isDungeonMode()?"dungeon":"zombicide"),
    universeId:(isDungeonMode()||gensHasActiveRpgUniverse())?(gensCurrentUniverseId()||previousHero?.universeId||GAME_PROFILE_DUNGEON_ID):(previousHero?.universeId||null),
    contentFamily:(isDungeonMode()||gensHasActiveRpgUniverse())?gensCurrentContentFamily():(previousHero?.contentFamily||"survival"),
    role:document.getElementById("hcRole").value.trim()||"Héros personnalisé",
    useRpgStats:document.getElementById("hcUseRpgStats")?.checked!==false,
    avatar:hcAvatarData,
    avatarCrop:{...hcAvatarCrop},
    armor:Number(document.getElementById("hcArmor").value)||2,
    hp:Number(document.getElementById("hcHp").value)||3,
    talentSetId:(isDungeonMode() || (typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id))))?(document.getElementById("hcTalentSet")?.value||previousHero?.talentSetId||defaultTalentSetForHero(id)):(previousHero?.talentSetId||null),
    dungeonStats:((document.getElementById("hcUseRpgStats")?.checked!==false) && (isDungeonMode() || gensHasActiveRpgUniverse() || gensCurrentElementSettings().enabled || (typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id)))))?{
      force:Math.max(0,Number(document.getElementById("hcRpgForce")?.value)||0),
      agilite:Math.max(0,Number(document.getElementById("hcRpgAgility")?.value)||0),
      intelligence:Math.max(0,Number(document.getElementById("hcRpgIntelligence")?.value)||0),
      esprit:Math.max(0,Number(document.getElementById("hcRpgSpirit")?.value)||0),
      endurance:Math.max(0,Number(document.getElementById("hcRpgEndurance")?.value)||0),
      defense:Math.max(0,Number(document.getElementById("hcRpgDefense")?.value)||0),
      armor:Math.max(0,Number(document.getElementById("hcRpgArmor")?.value)||0),
      initiative:Number(document.getElementById("hcRpgInitiative")?.value)||0,
      movement:Math.max(0,Number(document.getElementById("hcRpgMovement")?.value)||0),
      elementTypes:hcReadElementTypes()
    }:((isDungeonMode()||gensHasActiveRpgUniverse())?null:(previousHero?.dungeonStats||null)),
    elementTypes:((document.getElementById("hcUseRpgStats")?.checked!==false) && (isDungeonMode() || gensHasActiveRpgUniverse() || gensCurrentElementSettings().enabled || (typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id)))))?hcReadElementTypes():[],
     resistances:((document.getElementById("hcUseRpgStats")?.checked!==false) && (isDungeonMode() || gensHasActiveRpgUniverse() || gensCurrentElementSettings().enabled))?gensReadResistanceEditor(document.getElementById("hcResistanceEditor")?.parentElement||document):[],
    startingEquipment:hcStartingEquipment
      .filter(x=>x&&x.itemId&&itemById(x.itemId))
      .map(x=>({itemId:x.itemId,slot:x.slot||"inventory"})),
    progressionSlots:(isDungeonMode() || (typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id))))?(previousHero?.progressionSlots||[]):hcProgressionSlots.map(x=>({...x})),
    skills:(isDungeonMode() || (typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id))))?[]:hcProgressionSlots.map((slot,i)=>{
      const libId=hcAssignedSkillIds[i]||null;
      const libSkill=libId?findSelectableSkill(libId):null;
      return libSkill?{
        libraryId:libId,
        color:slot.color,unlock:slot.unlock,
        title:libSkill.name,desc:libSkill.desc||"",
        mechanic:libSkill.type==="deployable"?"deployable":libSkill.type==="active"?"active":libSkill.type==="stat"?"stat":"text",
        deployable:libSkill.deployable||null,
        active:libSkill.active||null,
        effect:libSkill.effect||null
      }:{
        libraryId:null,color:slot.color,unlock:slot.unlock,title:"",desc:"",mechanic:"text"
      };
    })
  };

  if(typeof DUNGEON_HERO_IDS!=="undefined" && DUNGEON_HERO_IDS.includes(String(id))){const o=loadDungeonHeroOverrides();o[id]={...hero,dungeonBuiltin:true};saveDungeonHeroOverrides(o);ensureDungeonHeroes();hcEditingId=id;alert("Héros Dungeon enregistré ✅");closeHeroCreator();return;}

  const idx=all.findIndex(h=>h.id===id);
  if(idx>=0)all[idx]=hero; else all.push(hero);

  try{
    saveCustomHeroesMulti(all);
  }catch(e){
    console.warn(e);
    if(hero.avatar){
      hero.avatar="";
      const idx2=all.findIndex(h=>h.id===id);
      if(idx2>=0)all[idx2]=hero;
      try{
        saveCustomHeroesMulti(all);
        hcAvatarData="";
        alert("Héros enregistré ✅\\n\\nLa photo était trop lourde et n’a pas été conservée.");
        applyCustomHeroesMulti();
        closeHeroCreator();
        return;
      }catch(e2){}
    }
    alert("Impossible d’enregistrer le héros : "+(e?.name||"stockage indisponible"));
    return;
  }

  hcEditingId=id;
  if(hero.gameMode==="dungeon")gensAttachContentToUniverse(hero.universeId,"hero",id);
  applyCustomHeroesMulti();
  alert("Héros enregistré ✅");
  closeHeroCreator();
}

function deleteCurrentCustomHero(){
  if(!hcEditingId){alert("Crée ou ouvre un héros à modifier.");return}
  const h=findCustomHero(hcEditingId);
  if(!h){alert("Héros introuvable.");return}
  if(!confirm("Supprimer "+h.name+" ?"))return;
  saveCustomHeroesMulti(loadCustomHeroesMulti().filter(x=>x.id!==hcEditingId));
  localStorage.removeItem(key(hcEditingId));
  hcEditingId=null;
  applyCustomHeroesMulti();
  closeHeroCreator();
}

async function z40kPrepareAvatar(file){
  if(!file)return "";
  if(!file.type.startsWith("image/"))throw new Error("Le fichier choisi n’est pas une image.");

  const data=await new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=reject;
    r.readAsDataURL(file);
  });

  const img=await new Promise((resolve,reject)=>{
    const im=new Image();
    im.onload=()=>resolve(im);
    im.onerror=reject;
    im.src=data;
  });

  // Limite volontaire pour éviter de saturer localStorage sur téléphone.
  const maxW=600,maxH=760;
  const scale=Math.min(1,maxW/img.width,maxH/img.height);
  const w=Math.max(1,Math.round(img.width*scale));
  const h=Math.max(1,Math.round(img.height*scale));

  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,0,0,w,h);

  // JPEG léger : généralement 40–150 Ko au lieu de plusieurs Mo.
  return canvas.toDataURL("image/jpeg",0.78);
}
