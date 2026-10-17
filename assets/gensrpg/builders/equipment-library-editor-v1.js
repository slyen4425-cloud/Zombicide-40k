const CUSTOM_EQUIPMENT_KEY="gensrpg_custom_equipment_v1";
let equipmentLibraryOpen=false;

function loadCustomEquipment(){
  try{
    const a=gensrpgHydrateAssets(JSON.parse(localStorage.getItem(CUSTOM_EQUIPMENT_KEY)||"[]"));
    if(!Array.isArray(a))return [];
    let changed=false;
    a.forEach(it=>{
      if(it?.gameMode==="dungeon" && !it.contentFamily){
        it.contentFamily=gensLegacyContentFamily(it,"equipment");changed=true;
      }
    });
    if(changed)localStorage.setItem(CUSTOM_EQUIPMENT_KEY,JSON.stringify(gensrpgExternalizeAssetsSync(a)));
    return a;
  }catch(e){return []}
}
function saveCustomEquipment(a){
  try{
    const slim=gensrpgExternalizeAssetsSync(a||[]);
    localStorage.setItem(CUSTOM_EQUIPMENT_KEY,JSON.stringify(slim));
    gensrpgBackupPersistentNow();
    return true;
  }catch(e){
    console.error("Sauvegarde équipements",e);
    return false;
  }
}

function gensStarterCaptureItems(){
  return [
    {id:"capture_orb_basic",name:"Capsule simple",type:"Objet de capture",customEquipment:true,gameMode:"dungeon",contentFamily:"creature",captureLevel:1,captureBonus:0,price:20,charges:1,description:"Objet de capture basique.",effect:"Bonus capture +0%"},
    {id:"capture_orb_plus",name:"Capsule renforcée",type:"Objet de capture",customEquipment:true,gameMode:"dungeon",contentFamily:"creature",captureLevel:2,captureBonus:10,price:50,charges:1,description:"Objet de capture amélioré.",effect:"Bonus capture +10%"},
    {id:"capture_orb_ultra",name:"Capsule avancée",type:"Objet de capture",customEquipment:true,gameMode:"dungeon",contentFamily:"creature",captureLevel:3,captureBonus:25,price:100,charges:1,description:"Objet de capture performant.",effect:"Bonus capture +25%"},
    {id:"capture_orb_master",name:"Capsule suprême",type:"Objet de capture",customEquipment:true,gameMode:"dungeon",contentFamily:"creature",captureLevel:4,captureBonus:50,price:250,charges:1,description:"Objet de capture exceptionnel.",effect:"Bonus capture +50%"}
  ];
}
function ensureStarterCaptureItems(){
  // Contenu intégré : aucune écriture dans localStorage.
  return gensStarterCaptureItems();
}
function refreshCustomEquipmentIntoItems(){
  // Nettoyer les objets runtime/personnalisés précédemment injectés.
  for(let i=ITEMS.length-1;i>=0;i--){
    const it=ITEMS[i];
    if((it?.customEquipment && !it?.dungeonBuiltin) || it?._captureBuiltin)ITEMS.splice(i,1);
  }

  // Contenu réellement sauvegardé par l'utilisateur.
  loadCustomEquipment().forEach(x=>{
    // Ignorer les anciennes capsules de base qui ont pu être persistées par erreur.
    if(String(x?.id||"").startsWith("capture_orb_"))return;
    ITEMS.push({...x,customEquipment:true});
  });

  // Capsules intégrées uniquement en famille Capture.
  try{
    if(gensCurrentContentFamily()==="creature" && gensGameplayModules()?.capture){
      gensStarterCaptureItems().forEach(x=>ITEMS.push({...x,_captureBuiltin:true,customEquipment:false}));
    }
  }catch(e){}

  if(typeof ensureDungeonItems==="function")ensureDungeonItems();
}
function ensureEquipmentLibraryState(){
  const list=loadCustomEquipment();
  // Nothing to migrate currently; this function centralizes future migrations
  // and guarantees the library is initialized after a browser/app restart.
  if(!Array.isArray(list))saveCustomEquipment([]);
  return loadCustomEquipment();
}
function isDungeonItemRecord(it){
  if(!it)return false;
  const id=String(it.id||"");
  return !!it.dungeonBuiltin || it.gameMode==="dungeon" || (typeof DUNGEON_ITEM_IDS!=="undefined" && DUNGEON_ITEM_IDS.includes(id));
}
function customEquipmentForMode(dungeon=isDungeonMode()){
  const all=loadCustomEquipment();
  if(!dungeon)return all.filter(it=>!isDungeonItemRecord(it));
  return all.filter(it=>isDungeonItemRecord(it) && gensContentCompatible(it,"equipment"));
}
function itemsForMode(dungeon=isDungeonMode()){
  const captureOn=!!(gensGameplayModules?.()?.capture);
  return ITEMS.filter(it=>(dungeon?isDungeonItemRecord(it):!isDungeonItemRecord(it)) && (captureOn || it.type!=="Objet de capture"));
}

function showEquipmentLibrary(){
  equipmentLibraryOpen=true;
  renderEquipmentLibrary();
  const box=document.getElementById("equipmentLibrary");
  if(box)setTimeout(()=>box.scrollIntoView({behavior:"smooth",block:"start"}),20);
}
function toggleEquipmentLibrary(){
  showEquipmentLibrary();
}
function renderEquipmentLibrary(){
  ensureEquipmentLibraryState();
  const box=document.getElementById("equipmentLibrary");if(!box)return;
  box.style.display=equipmentLibraryOpen?"grid":"none";
  if(!equipmentLibraryOpen)return;
  let list=isDungeonMode()?[...(gensCurrentContentFamily()==="rpg"?dungeonItems():[]),...customEquipmentForMode(true)]:customEquipmentForMode(false);if(!(gensGameplayModules?.()?.capture))list=list.filter(it=>it.type!=="Objet de capture");
  if(!list.length){box.innerHTML='<div class="empty">Aucun équipement personnalisé. Utilise « Créer un équipement ».</div>';return}
  box.innerHTML="";
  list.forEach(it=>{
    const d=document.createElement("div");d.className="equipLibCard";
    d.innerHTML='<img src="'+(it.image_data||"")+'" alt=""><div><strong>'+z40kEscHtml(it.name)+'</strong>'+(it._gensShared?'<span class="gensSharedBadge">REÇU</span>':'')+'<div class="hint" style="text-align:left">'+z40kEscHtml(it.type||"Objet")+(it._gensShared?' · reçu de '+z40kEscHtml(gensrpgOriginLabel(it)):' · local')+'</div><div style="font-size:12px;margin-top:4px">'+z40kEscHtml(equipmentSummary(it))+'</div></div>'+
      '<div class="equipLibBtns"><button onclick="openEquipmentEditor(\''+it.id+'\')">✏️ Modifier</button>'+(it.dungeonBuiltin?'<button style="background:#6b4b1d" onclick="resetDungeonItem(\''+it.id+'\')">↻ Origine</button>':'<button style="background:#70201d" onclick="deleteCustomEquipment(\''+it.id+'\')">🗑 Supprimer</button>')+'</div>';
    box.appendChild(d);
  });
}
function equipmentSummary(it){
  const p=[];
  if(it.type==="Arme")p.push((it.dice||0)+" dé(s)",String(it.accuracy||"")+" précision","Force "+(it.strength||0),"Portée "+(it.range||0));
  if(it.ammoCapacity)p.push(it.ammoCapacity+" mun.");
  if(it.statBonus?.kind)p.push((it.statBonus.value>=0?"+":"")+it.statBonus.value+" "+it.statBonus.kind);
  if(it.charges)p.push(it.charges+" charge(s)");
  if(it.rpgUse?.kind==="heal")p.push("Soin "+Math.max(0,Number(it.rpgUse.value)||0)+" PV");
  if(it.rpgUse?.kind==="mana")p.push("Mana +"+Math.max(0,Number(it.rpgUse.value)||0));
  if(it.rpgUse?.kind==="damage")p.push(Math.max(0,Number(it.rpgUse.value)||0)+" dégâts");
  if(it.type==="Objet de capture")p.push("Niv. "+Math.max(1,Number(it.captureLevel)||1),"Bonus capture +"+Math.max(0,Number(it.captureBonus)||0)+"%");
  return p.filter(Boolean).join(" · ") || (it.description||it.effect||"Objet personnalisé");
}
function renderEquipmentEvolutionEditor(){
  const on=!!document.getElementById("eqEvolutionEnabled")?.checked;
  const box=document.getElementById("eqEvolutionFields");
  if(box)box.style.display=on?"block":"none";

  const ability=!!document.getElementById("eqEvo4AbilityEnabled")?.checked;
  const ab=document.getElementById("eqEvo4AbilityFields");
  if(ab)ab.style.display=(on&&ability)?"block":"none";

  const type=document.getElementById("eqEvo4AbilityType")?.value||"text";
  const show=(id,v)=>{
    const e=document.getElementById(id);
    if(e)e.style.display=(on&&ability&&type===v)?"block":"none";
  };
  show("eqEvo4TempBonusFields","temp_bonus");
  show("eqEvo4SpecialAttackFields","special_attack");
  show("eqEvo4DirectDamageFields","direct_damage");
  show("eqEvo4HealFields","heal");
}
function equipmentEvolutionFromEditor(){
  if(!document.getElementById("eqEvolutionEnabled")?.checked)return null;
  return {
    enabled:true,
    mode:"hero_xp",
    levels:[
      {level:2,xp:Math.max(0,Number(document.getElementById("eqEvo2Xp")?.value)||0),
       dice:Number(document.getElementById("eqEvo2Dice")?.value)||0,
       result:Number(document.getElementById("eqEvo2Result")?.value)||0,
       force:Number(document.getElementById("eqEvo2Force")?.value)||0},
      {level:3,xp:Math.max(0,Number(document.getElementById("eqEvo3Xp")?.value)||0),
       dice:Number(document.getElementById("eqEvo3Dice")?.value)||0,
       result:Number(document.getElementById("eqEvo3Result")?.value)||0,
       force:Number(document.getElementById("eqEvo3Force")?.value)||0},
      {level:4,xp:Math.max(0,Number(document.getElementById("eqEvo4Xp")?.value)||0),
       dice:Number(document.getElementById("eqEvo4Dice")?.value)||0,
       result:Number(document.getElementById("eqEvo4Result")?.value)||0,
       force:Number(document.getElementById("eqEvo4Force")?.value)||0,
       ability:document.getElementById("eqEvo4AbilityEnabled")?.checked?{
         enabled:true,
         name:(document.getElementById("eqEvo4AbilityName")?.value||"").trim()||"Capacité de l’objet",
         text:(document.getElementById("eqEvo4AbilityText")?.value||"").trim(),
         cooldownRounds:Math.max(0,Number(document.getElementById("eqEvo4AbilityCooldown")?.value)||0),
         effectType:document.getElementById("eqEvo4AbilityType")?.value||"text",
         tempBonus:{
           kind:document.getElementById("eqEvo4TempKind")?.value||"combat_dice",
           mode:document.getElementById("eqEvo4TempMode")?.value||"all",
           value:Number(document.getElementById("eqEvo4TempValue")?.value)||0,
           durationRounds:Math.max(1,Number(document.getElementById("eqEvo4TempDuration")?.value)||1)
         },
         specialAttack:{
           dice:Math.max(1,Number(document.getElementById("eqEvo4AtkDice")?.value)||1),
           accuracy:document.getElementById("eqEvo4AtkAcc")?.value||"4",
           strength:Math.max(0,Number(document.getElementById("eqEvo4AtkForce")?.value)||0),
           range:Math.max(0,Number(document.getElementById("eqEvo4AtkRange")?.value)||0),
           damagePerHit:Math.max(1,Number(document.getElementById("eqEvo4AtkDamage")?.value)||1),
           ignoreArmor:!!document.getElementById("eqEvo4AtkIgnoreArmor")?.checked
         },
         directDamage:{
           damage:Math.max(1,Number(document.getElementById("eqEvo4DirectDamage")?.value)||1),
           target:document.getElementById("eqEvo4DirectTarget")?.value||"single",
           ignoreArmor:!!document.getElementById("eqEvo4DirectIgnoreArmor")?.checked
         },
         heal:{
           amount:Math.max(1,Number(document.getElementById("eqEvo4HealAmount")?.value)||1)
         }
       }:null}
    ]
  };
}
function loadEquipmentEvolutionEditor(it){
  const ev=it?.evolution||null;
  document.getElementById("eqEvolutionEnabled").checked=!!ev?.enabled;
  const byLevel=new Map((ev?.levels||[]).map(x=>[Number(x.level),x]));
  [2,3,4].forEach((lv)=>{
    const d=byLevel.get(lv)||{};
    document.getElementById("eqEvo"+lv+"Xp").value=d.xp??(lv===2?7:lv===3?19:43);
    document.getElementById("eqEvo"+lv+"Dice").value=d.dice??0;
    document.getElementById("eqEvo"+lv+"Result").value=d.result??0;
    document.getElementById("eqEvo"+lv+"Force").value=d.force??0;
  });
  const a=byLevel.get(4)?.ability||null;
  document.getElementById("eqEvo4AbilityEnabled").checked=!!a?.enabled;
  document.getElementById("eqEvo4AbilityName").value=a?.name||"";
  document.getElementById("eqEvo4AbilityText").value=a?.text||"";
  document.getElementById("eqEvo4AbilityCooldown").value=Math.max(0,Number(a?.cooldownRounds)||0);
  document.getElementById("eqEvo4AbilityType").value=a?.effectType||"text";

  const tb=a?.tempBonus||{};
  document.getElementById("eqEvo4TempKind").value=tb.kind||"combat_dice";
  document.getElementById("eqEvo4TempMode").value=tb.mode||"all";
  document.getElementById("eqEvo4TempValue").value=tb.value??1;
  document.getElementById("eqEvo4TempDuration").value=Math.max(1,Number(tb.durationRounds)||1);

  const sa=a?.specialAttack||{};
  document.getElementById("eqEvo4AtkDice").value=Math.max(1,Number(sa.dice)||3);
  document.getElementById("eqEvo4AtkAcc").value=sa.accuracy||"4";
  document.getElementById("eqEvo4AtkForce").value=Math.max(0,Number(sa.strength)||2);
  document.getElementById("eqEvo4AtkRange").value=Math.max(0,Number(sa.range)||0);
  document.getElementById("eqEvo4AtkDamage").value=Math.max(1,Number(sa.damagePerHit)||1);
  document.getElementById("eqEvo4AtkIgnoreArmor").checked=!!sa.ignoreArmor;

  const dd=a?.directDamage||{};
  document.getElementById("eqEvo4DirectDamage").value=Math.max(1,Number(dd.damage)||1);
  document.getElementById("eqEvo4DirectTarget").value=dd.target||"single";
  document.getElementById("eqEvo4DirectIgnoreArmor").checked=!!dd.ignoreArmor;

  document.getElementById("eqEvo4HealAmount").value=Math.max(1,Number(a?.heal?.amount)||1);

  renderEquipmentEvolutionEditor();
}

function openEquipmentEditor(id=""){
  try{
  const list=loadCustomEquipment(); const dungeonBase=(typeof DUNGEON_ITEM_IDS!=="undefined"&&DUNGEON_ITEM_IDS.includes(String(id)))?dungeonItems().find(x=>x.id===id):null; const it=dungeonBase||(id?list.find(x=>x.id===id):null);
  document.getElementById("eqEditId").value=it?.id||"";
  document.getElementById("eqEditorTitle").textContent=it?(dungeonBase?"🏰 Modifier l’équipement Dungeon":"🧰 Modifier l’équipement"):"🧰 Créer un équipement";
  document.getElementById("eqName").value=it?.name||"";updateCaptureItemCategoryVisibility();
  document.getElementById("eqCategory").value=it?.type||"Arme";const ep=document.getElementById("eqPrice");if(ep)ep.value=Math.max(0,Number(it?.price)||0);const ecl=document.getElementById("eqCaptureLevel");if(ecl)ecl.value=Math.max(1,Number(it?.captureLevel)||1);const ecb=document.getElementById("eqCaptureBonus");if(ecb)ecb.value=Math.max(0,Number(it?.captureBonus)||0);
  document.getElementById("eqImageData").value=it?.image_data||"";
  document.getElementById("eqCropJson").value=JSON.stringify(gensNormCrop(it?.imageCrop));
  document.getElementById("eqHands").value=it?.hands??1;
  document.getElementById("eqDice").value=it?.dice??1;
  document.getElementById("eqAccuracy").value=it?.accuracy||"4+";
  document.getElementById("eqStrength").value=it?.strength??1;
  document.getElementById("eqRange").value=it?.range??"0";
  document.getElementById("eqAmmo").value=it?.ammoCapacity??0;
  document.getElementById("eqAttackMode").value=it?.rpgScaling?.magic?"magic":(it?.attackMode||((String(it?.range||"0")==="0")?"melee":"ranged"));const eqEl=document.getElementById("eqAttackElement");if(eqEl){eqEl.innerHTML=gensElementOptions(it?.element||it?.attackElement||"");eqEl.value=it?.element||it?.attackElement||"";}const eqRes=document.getElementById("eqResistanceEditor");if(eqRes)eqRes.innerHTML=gensResistanceEditorHtml(it?.resistances||[],"eqRes");
  const rpgChance=document.getElementById("eqRpgBaseChance");if(rpgChance)rpgChance.value=it?.rpgScaling?.baseChance??50;
  document.getElementById("eqBonusKind").value=it?.statBonus?.kind||"";
  document.getElementById("eqBonusMode").value=it?.statBonus?.mode||"all";
  document.getElementById("eqBonusValue").value=it?.statBonus?.value??1;
  document.getElementById("eqCharges").value=it?.charges??0;
  const useKind=document.getElementById("eqRpgUseKind");if(useKind)useKind.value=it?.rpgUse?.kind||"";
  const useValue=document.getElementById("eqRpgUseValue");if(useValue)useValue.value=Math.max(0,Number(it?.rpgUse?.value)||0);
  const rarityEl=document.getElementById("eqRpgRarity");if(rarityEl)rarityEl.value=dungeonItemRarity(it);
  document.getElementById("eqDescription").value=it?.description||it?.effect||"";
  loadEquipmentEvolutionEditor(it);
  populateEquipmentSoundSelects();
  document.getElementById("eqSoundAttack").value=it?.sounds?.attack||"none";
  document.getElementById("eqSoundReload").value=it?.sounds?.reload||"none";
  document.getElementById("eqSoundUse").value=it?.sounds?.use||it?.sounds?.impact||"none";
  renderEquipmentEditorType();
  document.getElementById("equipmentEditorModal").classList.add("open");
  renderEquipmentPreview();
  }catch(e){
    console.error("Éditeur équipement :",e);
    alert("Impossible d’ouvrir l’éditeur : "+(e?.message||e));
  }
}
function closeEquipmentEditor(){document.getElementById("equipmentEditorModal")?.classList.remove("open")}
function equipmentEditorBackdrop(e){if(e.target?.id==="equipmentEditorModal")closeEquipmentEditor()}
function updateCaptureItemCategoryVisibility(){
  const sel=document.getElementById("eqCategory");if(!sel)return;
  const opt=[...sel.options].find(o=>o.value==="Objet de capture");
  const on=!!(gensGameplayModules?.()?.capture);
  if(opt)opt.hidden=!on;
  if(!on && sel.value==="Objet de capture")sel.value="Objet spécial";
}function renderEquipmentEditorType(){updateCaptureItemCategoryVisibility();const ew=document.getElementById("eqEconomyWrap");if(ew)ew.style.display=gensEconomyEnabled()?"block":"none";
  const type=document.getElementById("eqCategory")?.value;const capWrap=document.getElementById("eqCaptureItemWrap");if(capWrap)capWrap.style.display=type==="Objet de capture"?"block":"none";
  const rpgUseWrap=document.getElementById("eqRpgUseWrap");
  if(rpgUseWrap)rpgUseWrap.style.display=(isDungeonMode() && type==="Consommable")?"block":"none";
  const rk=document.getElementById("eqRpgUseKind")?.value||"";
  const rvLabel=document.getElementById("eqRpgUseValueLabel");
  if(rvLabel)rvLabel.textContent=rk==="heal"?"PV rendus":rk==="mana"?"Mana rendu":rk==="damage"?"Dégâts":"Valeur";
  const isWeapon=type==="Arme";
  document.getElementById("eqWeaponBox").style.display=isWeapon?"block":"none";

  let mode=document.getElementById("eqAttackMode")?.value||"melee";
  const magicOpt=document.querySelector('#eqAttackMode option[value="magic"]');if(magicOpt)magicOpt.hidden=!isDungeonMode();
  if(!isDungeonMode()&&mode==="magic"){mode="melee";document.getElementById("eqAttackMode").value="melee";}
  const isRanged=isWeapon && (mode==="ranged" || mode==="hybrid");
  const isMelee=isWeapon && mode==="melee";
  const dungeonWeapon=isWeapon && isDungeonMode();
  const legacyAcc=document.getElementById("eqLegacyAccuracyWrap"),rpgChance=document.getElementById("eqRpgBaseChanceWrap");
  if(legacyAcc)legacyAcc.style.display=dungeonWeapon?"none":"";if(rpgChance)rpgChance.style.display=dungeonWeapon?"block":"none";
  const rarityWrap=document.getElementById("eqRpgRarityWrap");if(rarityWrap)rarityWrap.style.display=isDungeonMode()?"block":"none";const elementWrap=document.getElementById("eqAttackElementWrap"),elementSel=document.getElementById("eqAttackElement"),elementCfg=gensCurrentElementSettings();if(elementSel){const cur=elementSel.value;elementSel.innerHTML=gensElementOptions(cur);elementSel.value=cur}if(elementWrap)elementWrap.style.display=elementCfg.enabled?"block":"none";

  const attackRow=document.getElementById("eqSoundAttackRow");
  const reloadRow=document.getElementById("eqSoundReloadRow");
  const useRow=document.getElementById("eqSoundUseRow");
  if(attackRow)attackRow.style.display=isWeapon?"block":"none";
  if(reloadRow)reloadRow.style.display=isRanged?"block":"none";
  if(useRow)useRow.style.display=isWeapon?"none":"block";

  const hint=document.getElementById("eqSoundHint");
  if(hint){
    if(isRanged) hint.textContent="Arme à distance : attaque + rechargement.";
    else if(isMelee) hint.textContent="Arme de mêlée : son d’attaque.";
    else hint.textContent="Objet divers : son d’utilisation / interface.";
  }
  renderEquipmentPreview();
}
function equipmentAttackModeChanged(){
  const m=document.getElementById("eqAttackMode").value;
  if(m==="melee")document.getElementById("eqRange").value="0";
  else if((m==="ranged"||m==="magic") && document.getElementById("eqRange").value==="0")document.getElementById("eqRange").value="1-3";
  renderEquipmentEditorType();
}
function equipmentImageChanged(e){
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    const raw=String(r.result||"");
    const img=new Image();
    img.onload=()=>{
      try{
        const maxSide=720;
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||1,img.naturalHeight||1));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=c.getContext("2d");
        ctx.drawImage(img,0,0,c.width,c.height);
        let data=c.toDataURL("image/webp",0.78);
        // Fallback JPEG for browsers without useful WebP canvas output.
        if(!data || data.length>900000)data=c.toDataURL("image/jpeg",0.72);
        document.getElementById("eqImageData").value=data;
        document.getElementById("eqCropJson").value=JSON.stringify({x:0,y:0,scale:1,rot:0});
        renderEquipmentPreview();
      }catch(err){
        console.error("Compression image équipement",err);
        alert("Impossible de préparer cette image. Essaie une image plus petite.");
      }
    };
    img.onerror=()=>alert("Cette image n’a pas pu être chargée.");
    img.src=raw;
  };
  r.readAsDataURL(f);
}
function renderEquipmentPreview(){
  const b=document.getElementById("eqPreview");if(!b)return;
  const name=document.getElementById("eqName")?.value||"Nouvel équipement";
  const type=document.getElementById("eqCategory")?.value||"Objet";
  const img=document.getElementById("eqImageData")?.value||"";
  let s=type;
  if(type==="Arme")s+=" · "+(document.getElementById("eqDice")?.value||0)+" dé(s) · "+(document.getElementById("eqAccuracy")?.value||"")+" · Force "+(document.getElementById("eqStrength")?.value||0)+" · Portée "+(document.getElementById("eqRange")?.value||0);
  let crop={};try{crop=JSON.parse(document.getElementById("eqCropJson")?.value||"{}")}catch(e){}
  b.innerHTML=(img?'<div style="width:110px;height:90px;overflow:hidden;background:#0d1a2b;border-radius:10px;float:left;margin-right:10px"><img src="'+img+'" alt="" style="width:100%;height:100%;object-fit:contain;transform:'+gensCropTransform(crop)+';transform-origin:center"></div>':"")+
    '<strong>'+z40kEscHtml(name)+'</strong><div style="margin-top:5px">'+z40kEscHtml(s)+'</div><div style="clear:both"></div>';
}
function saveEquipmentEditor(){
  const name=document.getElementById("eqName").value.trim();
  if(!name){alert("Donne un nom à l’équipement.");return}
  const list=loadCustomEquipment();
  const editId=document.getElementById("eqEditId").value;
  const id=editId||("custom_item_"+Date.now()+"_"+Math.random().toString(36).slice(2,7));
  const previous=list.find(x=>String(x.id)===String(id));
  const itemGameMode=previous?.gameMode||(isDungeonMode()?"dungeon":"zombicide");
  const type=document.getElementById("eqCategory").value;if(type==="Objet de capture" && !(gensGameplayModules?.()?.capture)){alert("Active le module Capture de créatures pour créer un objet de capture.");return}
  const bonusKind=document.getElementById("eqBonusKind").value;
  const obj={
    id,name,type,customEquipment:true,gameMode:itemGameMode,universeId:itemGameMode==="dungeon"?(gensCurrentUniverseId()||previous?.universeId||GAME_PROFILE_DUNGEON_ID):null,contentFamily:itemGameMode==="dungeon"?gensCurrentContentFamily():(previous?.contentFamily||"survival"),price:Math.max(0,Number(document.getElementById("eqPrice")?.value)||0),captureLevel:type==="Objet de capture"?Math.max(1,Number(document.getElementById("eqCaptureLevel")?.value)||1):(previous?.captureLevel||null),captureBonus:type==="Objet de capture"?Math.max(0,Number(document.getElementById("eqCaptureBonus")?.value)||0):(previous?.captureBonus||0),
    rpgRarity:isDungeonMode()?(document.getElementById("eqRpgRarity")?.value||"common"):(previous?.rpgRarity||null),
    image_data:document.getElementById("eqImageData").value||"",
    imageCrop:(()=>{try{return gensNormCrop(JSON.parse(document.getElementById("eqCropJson").value||"{}"))}catch(e){return gensNormCrop({})}})(),
    description:document.getElementById("eqDescription").value.trim(),
    effect:document.getElementById("eqDescription").value.trim(),
    hands:type==="Arme"?Math.max(0,Number(document.getElementById("eqHands").value)||0):0,
    attackMode:type==="Arme"?document.getElementById("eqAttackMode").value:null,
    element:gensCurrentElementSettings().enabled?(document.getElementById("eqAttackElement")?.value||""):(previous?.element||""),     resistances:gensReadResistanceEditor(document.getElementById("eqResistanceEditor")||document),
    rpgScaling:(type==="Arme"&&isDungeonMode())?(()=>{const m=document.getElementById("eqAttackMode").value;return {attribute:m==="magic"?"intelligence":m==="melee"?"force":"agilite",mode:"percent",baseChance:Math.max(1,Math.min(99,Number(document.getElementById("eqRpgBaseChance")?.value)||50)),diceSides:100,magic:m==="magic"}})():(previous?.rpgScaling||null),
    dice:type==="Arme"?Math.max(0,Number(document.getElementById("eqDice").value)||0):0,
    accuracy:type==="Arme"?document.getElementById("eqAccuracy").value:"",
    strength:type==="Arme"?Math.max(0,Number(document.getElementById("eqStrength").value)||0):0,
    range:type==="Arme"?document.getElementById("eqRange").value.trim():"",
    ammoCapacity:type==="Arme"?Math.max(0,Number(document.getElementById("eqAmmo").value)||0):0,
    charges:Math.max(0,Number(document.getElementById("eqCharges").value)||0),
    rpgUse:(isDungeonMode() && type==="Consommable")?(()=>{
      const kind=document.getElementById("eqRpgUseKind")?.value||"";
      if(!kind)return null;
      const value=Math.max(0,Number(document.getElementById("eqRpgUseValue")?.value)||0);
      return {...(previous?.rpgUse||{}),kind,value};
    })():(previous?.rpgUse||null),
    wearable:type==="Armure"||type==="Équipement"||type==="Objet spécial",
    statBonus:bonusKind?{kind:bonusKind,mode:document.getElementById("eqBonusMode").value,value:Number(document.getElementById("eqBonusValue").value)||0}:null,
    evolution:equipmentEvolutionFromEditor(),
    sounds:{
      attack:type==="Arme"?(document.getElementById("eqSoundAttack")?.value||"none"):"none",
      reload:(type==="Arme" && ["ranged","hybrid"].includes(document.getElementById("eqAttackMode")?.value))?(document.getElementById("eqSoundReload")?.value||"none"):"none",
      use:type!=="Arme"?(document.getElementById("eqSoundUse")?.value||"none"):"none"
    }
  };
  if(typeof DUNGEON_ITEM_IDS!=="undefined" && DUNGEON_ITEM_IDS.includes(String(id))){ const ovs=loadDungeonItemOverrides(); ovs[id]={...obj,dungeonBuiltin:true,customEquipment:false}; saveDungeonItemOverrides(ovs); const pos=ITEMS.findIndex(x=>x.id===id); if(pos>=0)ITEMS.splice(pos,1); ensureDungeonItems(); closeEquipmentEditor(); equipmentLibraryOpen=true; renderEquipmentLibrary();renderDeckConfig(); return; }
  const ix=list.findIndex(x=>x.id===id);
  if(ix>=0)list[ix]=obj;else list.push(obj);
  if(!saveCustomEquipment(list)){alert("Impossible d’enregistrer l’équipement. Le stockage local disponible est insuffisant.");return;}
  refreshCustomEquipmentIntoItems();
  const deckCfg=loadDeckConfig();
  if(deckCfg[id]===undefined){
    deckCfg[id]=0;
    saveDeckConfig(deckCfg);
  }
  closeEquipmentEditor();
  equipmentLibraryOpen=true;
  renderEquipmentLibrary();renderDeckConfig();
}
function resetDungeonItem(id){const o=loadDungeonItemOverrides();delete o[id];saveDungeonItemOverrides(o);const pos=ITEMS.findIndex(x=>x.id===id);if(pos>=0)ITEMS.splice(pos,1);ensureDungeonItems();renderEquipmentLibrary();renderDeckConfig()}
function deleteCustomEquipment(id){
  const list=loadCustomEquipment(),it=list.find(x=>x.id===id);if(!it)return;
  if(!confirm("Supprimer « "+it.name+" » de la bibliothèque ?"))return;
  saveCustomEquipment(list.filter(x=>x.id!==id));
  refreshCustomEquipmentIntoItems();
  const cfg=loadDeckConfig();delete cfg[id];saveDeckConfig(cfg);
  renderEquipmentLibrary();renderDeckConfig();
}




