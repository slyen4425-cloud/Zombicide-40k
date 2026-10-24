/* GenSrpG Phase12 R13: 31 byte-identical Builders Enemy Library and Editor functions.
 * Sole owner: Builders; synchronous classic script at the original parser location.
 * No enemies runtime, spawn rules, combat engine or state initializations moved.
 */
function enemyImageChanged(ev){
  const f=ev.target.files?.[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const raw=String(rd.result||"");
    const img=new Image();
    img.onload=()=>{
      try{
        // Même principe que l'éditeur d'objets : assez grand pour une belle fiche,
        // mais suffisamment léger pour localStorage / synchro / GitHub.
        const maxSide=900;
        const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||1,img.naturalHeight||1));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=c.getContext("2d",{alpha:true});
        ctx.drawImage(img,0,0,c.width,c.height);

        let data=c.toDataURL("image/webp",0.80);
        // Si l'image reste très lourde, seconde passe plus agressive.
        if(!data || data.length>950000){
          data=c.toDataURL("image/jpeg",0.74);
        }

        // Dernière sécurité pour les très grosses photos.
        if(data.length>1200000){
          const maxSide2=700;
          const scale2=Math.min(1,maxSide2/Math.max(c.width,c.height));
          const c2=document.createElement("canvas");
          c2.width=Math.max(1,Math.round(c.width*scale2));
          c2.height=Math.max(1,Math.round(c.height*scale2));
          c2.getContext("2d").drawImage(c,0,0,c2.width,c2.height);
          data=c2.toDataURL("image/jpeg",0.70);
        }

        document.getElementById("enemyImageData").value=data;
        document.getElementById("enemyCropJson").value=JSON.stringify({x:0,y:0,scale:1,rot:0});
        renderEnemyPreview();
        setTimeout(()=>openEnemyCropper(),80);
      }catch(err){
        console.error("Compression image ennemi",err);
        alert("Impossible de préparer cette image. Essaie une image plus petite.");
      }
    };
    img.onerror=()=>alert("Cette image n’a pas pu être chargée.");
    img.src=raw;
  };
  rd.readAsDataURL(f);
}

function openEnemyCropper(){
  const data=document.getElementById("enemyImageData")?.value||"";
  let c={};try{c=JSON.parse(document.getElementById("enemyCropJson")?.value||"{}")}catch(e){}
  openGensCropper("enemy",data,c);
}

function renderEnemyActivationFields(){
  const mode=document.getElementById("enemyActivationMode")?.value||"";
  const iw=document.getElementById("enemyInitiativeWrap");
  const tw=document.getElementById("enemyActivationTextWrap");
  if(iw)iw.style.display=mode==="initiative"?"block":"none";
  if(tw)tw.style.display=["condition","manual","standard","actions","initiative"].includes(mode)?"block":"none";
}

function addEnemyAbilityFromLibrary(id){
  const a=abilityById(id);if(!a)return;
  const first=a.effects?.[0]||{};
  enemyEditorAbilities.push({
    id:"ea_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5),
    librarySkillId:a.id,name:a.name||"",trigger:a.type==="passive"?"passive":"activation",text:a.desc||"",
    sound:"none",cooldown:a.activeMeta?.cooldown??null,charges:null,unlockPhase:0,
    effectKind:first.kind||"none",effectValue:first.value??first.base??1,effectValueMode:first.valueMode||"flat",
    damageType:first.damageType||"physical",element:first.element||"",resistanceKind:first.resistanceKind||"",
    tickValue:first.kind==="dot"?Number(first.base)||1:1,target:first.target||"self",chance:100,duration:first.duration||1,hpThreshold:first.threshold||50,statusStackable:false
  });
  renderEnemyAbilitiesEditor();renderEnemyPreview();
}

function addEnemyAbilityEditor(data=null){
  enemyEditorAbilities.push({
    id:data?.id||("ea_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5)),
    name:data?.name||"",
    trigger:data?.trigger||"",
    text:data?.text||"",
    sound:data?.sound||"none",
    cooldown:data?.cooldown??null,
    charges:data?.charges??null,
    unlockPhase:data?.unlockPhase??0,
    effectKind:data?.effectKind||"none",
    effectValue:data?.effectValue??1,
    effectValueMode:data?.effectValueMode||"flat",
    damageType:data?.damageType||"physical",
    tickValue:data?.tickValue??1,
    target:data?.target||"self",
    chance:data?.chance??100,
    duration:data?.duration??1,
    hpThreshold:data?.hpThreshold??50,
    statusStackable:data?.statusStackable??false
  });
  renderEnemyAbilitiesEditor();
}

function removeEnemyAbilityEditor(id){
  enemyEditorAbilities=enemyEditorAbilities.filter(a=>a.id!==id);
  renderEnemyAbilitiesEditor();renderEnemyPreview();
}

function renderEnemyAbilitiesEditor(){
  const box=document.getElementById("enemyAbilitiesEditor");if(!box)return;
  box.innerHTML="";
  if(!enemyEditorAbilities.length){
    box.innerHTML='<div class="small">Aucune capacité ajoutée.</div>';
    return;
  }
  enemyEditorAbilities.forEach(a=>{
    const row=document.createElement("div");row.className="enemyAbilityEditorRow";row.dataset.id=a.id;
    row.innerHTML=
      '<div class="enemyAbilityEditorTop">'+
        '<input class="eaName" placeholder="Nom de la capacité" value="'+z40kEscHtml(a.name||"")+'">'+
        '<select class="eaTrigger">'+
          '<option value="">Déclencheur libre</option>'+
          '<option value="passive" '+(a.trigger==="passive"?'selected':'')+'>Passive</option>'+
          '<option value="activation" '+(a.trigger==="activation"?'selected':'')+'>À l’activation</option>'+
          '<option value="attack" '+(a.trigger==="attack"?'selected':'')+'>À l’attaque du Boss</option>'+
          '<option value="attacked" '+(a.trigger==="attacked"?'selected':'')+'>Quand le Boss est attaqué</option>'+
          '<option value="wounded" '+(a.trigger==="wounded"?'selected':'')+'>Quand le Boss subit des dégâts</option>'+
          '<option value="phase" '+(a.trigger==="phase"?'selected':'')+'>Débloquée par une phase</option>'+
          '<option value="death" '+(a.trigger==="death"?'selected':'')+'>À la mort</option>'+
          '<option value="special" '+(a.trigger==="special"?'selected':'')+'>Spécial</option>'+
        '</select>'+
        '<button type="button" class="danger" onclick="removeEnemyAbilityEditor(\''+a.id+'\')">✕</button>'+
      '</div>'+
      '<textarea class="eaText" placeholder="Description de la capacité...">'+z40kEscHtml(a.text||"")+'</textarea>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">🔊 Son de la capacité<select class="eaSound">'+
          GENSRPG_SOUND_LIBRARY.map(s=>'<option value="'+s.id+'" '+(String(a.sound||"none")===String(s.id)?'selected':'')+'>'+z40kEscHtml(s.label)+'</option>').join("")+
        '</select></label>'+
        '<button type="button" class="cropMiniBtn" onclick="testEnemyAbilitySound(this)">▶ Tester le son</button>'+
      '</div>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Effet réel<select class="eaEffectKind">'+
          '<option value="none" '+(a.effectKind==="none"?'selected':'')+'>Texte uniquement</option>'+
          '<option value="heal_self" '+(a.effectKind==="heal_self"?'selected':'')+'>💚 Soigner la créature</option>'+
          '<option value="heal_all_enemies" '+(a.effectKind==="heal_all_enemies"?'selected':'')+'>💚 Soigner tous les ennemis</option>'+
          '<option value="bonus_damage" '+(a.effectKind==="bonus_damage"?'selected':'')+'>⚔️ Bonus dégâts</option>'+
          '<option value="bonus_armor" '+(a.effectKind==="bonus_armor"?'selected':'')+'>🛡️ Bonus armure</option>'+
           '<option value="bonus_resistance" '+(a.effectKind==="bonus_resistance"?'selected':'')+'>🛡️ Bonus résistance</option>'+
           '<option value="reduce_resistance" '+(a.effectKind==="reduce_resistance"?'selected':'')+'>🔻 Réduction résistance</option>'+
          '<option value="bonus_actions" '+(a.effectKind==="bonus_actions"?'selected':'')+'>⚡ Bonus actions</option>'+
          '<option value="damage_hero" '+(a.effectKind==="damage_hero"?'selected':'')+'>💥 Dégâts à un héros</option>'+
          '<option value="damage_team" '+(a.effectKind==="damage_team"?'selected':'')+'>💥 Dégâts à toute l’équipe</option>'+
          '<option value="poison" '+(a.effectKind==="poison"?'selected':'')+'>☠️ Poison</option>'+
          '<option value="burn" '+(a.effectKind==="burn"?'selected':'')+'>🔥 Brûlure</option>'+
          '<option value="bleed" '+(a.effectKind==="bleed"?'selected':'')+'>🩸 Saignement</option>'+
          '<option value="stun" '+(a.effectKind==="stun"?'selected':'')+'>💫 Étourdissement</option>'+
          '<option value="reduce_armor" '+(a.effectKind==="reduce_armor"?'selected':'')+'>🛡️ Réduction armure</option>'+
          '<option value="reduce_damage" '+(a.effectKind==="reduce_damage"?'selected':'')+'>⚔️ Réduction dégâts</option>'+
          '<option value="drain_mana" '+(a.effectKind==="drain_mana"?'selected':'')+'>💧 Drainer Mana</option>'+
          '<option value="lifesteal" '+(a.effectKind==="lifesteal"?'selected':'')+'>🩸 Vol de vie</option>'+
          '<option value="spawn" '+(a.effectKind==="spawn"?'selected':'')+'>👹 Invoquer des ennemis</option>'+
        '</select></label>'+
        '<label class="small">Cible<select class="eaTarget">'+
          '<option value="self" '+(a.target==="self"?'selected':'')+'>Soi-même</option>'+
          '<option value="randomHero" '+(a.target==="randomHero"?'selected':'')+'>Héros aléatoire</option>'+
          '<option value="allHeroes" '+(a.target==="allHeroes"?'selected':'')+'>Tous les héros</option>'+
        '</select></label>'+
      '</div>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Valeur principale<input class="eaEffectValue" value="'+z40kEscHtml(String(a.effectValue??1))+'" placeholder="ex: 4 PV / +2 dégâts / enemy_id"></label>'+
        '<label class="small">Type de valeur<select class="eaEffectValueMode">'+
          '<option value="flat" '+(a.effectValueMode==="flat"?'selected':'')+'>Valeur fixe</option>'+
          '<option value="percent" '+(a.effectValueMode==="percent"?'selected':'')+'>% du maximum</option>'+
        '</select></label>'+
      '</div>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Type de dégâts<select class="eaDamageType">'+
          '<option value="physical" '+(a.damageType==="physical"?'selected':'')+'>Physique</option>'+
          '<option value="magical" '+(a.damageType==="magical"?'selected':'')+'>Magique</option>'+
          '<option value="pure" '+(a.damageType==="pure"?'selected':'')+'>Pur / ignore armure</option>'+
          '<option value="poison" '+(a.damageType==="poison"?'selected':'')+'>Poison</option>'+
          '<option value="fire" '+(a.damageType==="fire"?'selected':'')+'>Feu</option>'+
        '</select></label>'+
        '<label class="small">Dégâts / effet par tour<input class="eaTickValue" type="number" min="0" max="9999" value="'+Math.max(0,Number(a.tickValue??1))+'"></label>'+
      '</div>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Chance d’effet %<input class="eaChance" type="number" min="0" max="100" value="'+Math.max(0,Math.min(100,Number(a.chance??100)))+'"></label>'+
        '<label class="small">Durée (tours)<input class="eaDuration" type="number" min="1" max="99" value="'+Math.max(1,Number(a.duration??1))+'"></label>'+
      '</div>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Seuil PV de déclenchement %<input class="eaHpThreshold" type="number" min="1" max="100" value="'+Math.max(1,Math.min(100,Number(a.hpThreshold??50)))+'"></label>'+
        '<label class="small">Effet cumulable<select class="eaStatusStackable"><option value="false" '+(!a.statusStackable?'selected':'')+'>Non</option><option value="true" '+(a.statusStackable?'selected':'')+'>Oui</option></select></label>'+
      '</div>'+
      '<div class="hint" style="text-align:left;margin-top:6px">Exemples : <strong>Soin 5</strong> = +5 PV ; <strong>Soin 20%</strong> = +20% PV max ; <strong>Poison</strong> = valeur initiale + dégâts/tour × durée ; <strong>Invocation</strong> = l’ID ennemi dans « valeur principale » et la quantité dans « durée ».</div>'+
      '<div class="enemyAbilityCooldown"><span class="small">Recharge éventuelle (tours)</span><input class="eaCooldown" type="number" min="0" max="99" placeholder="—" value="'+(a.cooldown??"")+'"></div>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Charges max<input class="eaCharges" type="number" min="0" max="99" placeholder="∞" value="'+(a.charges??"")+'"></label>'+
        '<label class="small">Disponible à partir de la phase<input class="eaUnlockPhase" type="number" min="0" max="20" placeholder="0" value="'+(a.unlockPhase??0)+'"></label>'+
      '</div>';
    row.querySelectorAll("input,select,textarea").forEach(el=>el.addEventListener("input",()=>{
      syncEnemyAbilitiesFromUi();renderEnemyPreview();
    }));
    box.appendChild(row);
  });
}

function syncEnemyAbilitiesFromUi(){
  const rows=[...document.querySelectorAll("#enemyAbilitiesEditor .enemyAbilityEditorRow")];
  enemyEditorAbilities=rows.map(row=>{
    const cv=(row.querySelector(".eaCooldown")?.value||"").trim();
    return {
      id:row.dataset.id,
      name:(row.querySelector(".eaName")?.value||"").trim(),
      trigger:row.querySelector(".eaTrigger")?.value||"",
      text:(row.querySelector(".eaText")?.value||"").trim(),
      sound:row.querySelector(".eaSound")?.value||"none",
      cooldown:cv===""?null:Math.max(0,Number(cv)||0),
      charges:(row.querySelector(".eaCharges")?.value||"").trim()===""?null:Math.max(0,Number(row.querySelector(".eaCharges").value)||0),
      unlockPhase:Math.max(0,Number(row.querySelector(".eaUnlockPhase")?.value)||0),
      effectKind:row.querySelector(".eaEffectKind")?.value||"none",
      effectValue:(row.querySelector(".eaEffectValue")?.value||"").trim(),
      effectValueMode:row.querySelector(".eaEffectValueMode")?.value||"flat",
      damageType:row.querySelector(".eaDamageType")?.value||"physical",
      tickValue:Math.max(0,Number(row.querySelector(".eaTickValue")?.value)||0),
      target:row.querySelector(".eaTarget")?.value||"self",
      chance:Math.max(0,Math.min(100,Number(row.querySelector(".eaChance")?.value)||0)),
      duration:Math.max(1,Number(row.querySelector(".eaDuration")?.value)||1),
      hpThreshold:Math.max(1,Math.min(100,Number(row.querySelector(".eaHpThreshold")?.value)||50)),
      statusStackable:row.querySelector(".eaStatusStackable")?.value==="true"
    };
  });
}

function testEnemyAbilitySound(btn){
  const row=btn?.closest(".enemyAbilityEditorRow");
  const id=row?.querySelector(".eaSound")?.value||"none";
  const snd=gensSoundById(id);
  if(snd?.src)z40kPlayOneShot(snd.src,0.9,0,false);
}

function enemyItemOptions(selected=""){
  refreshCustomEquipmentIntoItems();
  return itemsForMode(isDungeonMode()).filter(x=>x && x.id && x.name).map(it=>
    '<option value="'+z40kEscHtml(String(it.id))+'" '+(String(it.id)===String(selected)?'selected':'')+'>'+z40kEscHtml(it.name)+'</option>'
  ).join("");
}

function addEnemyPhaseEditor(data=null){
  enemyEditorPhases.push({
    id:data?.id||("phase_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5)),
    name:data?.name||("Phase "+(enemyEditorPhases.length+1)),
    hpPercent:data?.hpPercent??50,
    text:data?.text||"",
    effectType:data?.effectType||"none",
    effectValue:data?.effectValue??"",
    once:data?.once!==false
  });
  renderEnemyPhasesEditor();
}

function removeEnemyPhaseEditor(id){
  enemyEditorPhases=enemyEditorPhases.filter(x=>x.id!==id);
  renderEnemyPhasesEditor();renderEnemyPreview();
}

function syncEnemyPhasesFromUi(){
  enemyEditorPhases=[...document.querySelectorAll("#enemyPhasesEditor .enemyPhaseRow")].map(row=>({
    id:row.dataset.id,
    name:(row.querySelector(".epName")?.value||"").trim(),
    hpPercent:Math.max(0,Math.min(100,Number(row.querySelector(".epHp")?.value)||0)),
    text:(row.querySelector(".epText")?.value||"").trim(),
    effectType:row.querySelector(".epEffect")?.value||"none",
    effectValue:(row.querySelector(".epValue")?.value||"").trim(),
    once:row.querySelector(".epOnce")?.checked!==false
  })).sort((a,b)=>Number(b.hpPercent)-Number(a.hpPercent));
}

function renderEnemyPhasesEditor(){
  const box=document.getElementById("enemyPhasesEditor");if(!box)return;
  box.innerHTML="";
  if(!enemyEditorPhases.length){box.innerHTML='<div class="small">Aucune phase configurée.</div>';return}
  enemyEditorPhases.forEach((p,i)=>{
    const row=document.createElement("div");row.className="enemyPhaseRow";row.dataset.id=p.id;
    row.innerHTML=
      '<div class="enemyPhaseGrid">'+
        '<input class="epName" placeholder="Nom de la phase" value="'+z40kEscHtml(p.name||"")+'">'+
        '<label class="small">PV ≤ %<input class="epHp" type="number" min="0" max="100" value="'+Number(p.hpPercent??50)+'"></label>'+
        '<button type="button" class="danger" onclick="removeEnemyPhaseEditor(\''+p.id+'\')">✕</button>'+
      '</div>'+
      '<textarea class="epText" placeholder="Ex. Le Boss entre en rage...">'+z40kEscHtml(p.text||"")+'</textarea>'+
      '<div class="enemyPhaseEffectGrid">'+
        '<label class="small">Effet automatique<select class="epEffect">'+
          '<option value="none" '+(p.effectType==="none"?'selected':'')+'>Aucun / texte seulement</option>'+
          '<option value="actions" '+(p.effectType==="actions"?'selected':'')+'>Bonus d’actions</option>'+
          '<option value="strength" '+(p.effectType==="strength"?'selected':'')+'>Bonus de Force</option>'+
          '<option value="armor" '+(p.effectType==="armor"?'selected':'')+'>Modifier Armure</option>'+
          '<option value="heal" '+(p.effectType==="heal"?'selected':'')+'>Soigner le Boss</option>'+
          '<option value="spawn" '+(p.effectType==="spawn"?'selected':'')+'>Invoquer / apparition</option>'+
        '</select></label>'+
        '<label class="small">Valeur / quantité / ID ennemi<input class="epValue" placeholder="+1, 5, ID ennemi..." value="'+z40kEscHtml(String(p.effectValue??""))+'"></label>'+
      '</div>'+
      '<label class="small" style="display:flex;gap:7px;align-items:center;margin-top:7px"><input class="epOnce" type="checkbox" '+(p.once!==false?'checked':'')+'> Déclencher une seule fois</label>';
    row.querySelectorAll("input,select,textarea").forEach(el=>el.addEventListener("input",()=>{syncEnemyPhasesFromUi();renderEnemyPreview()}));
    box.appendChild(row);
  });
}

function addEnemyLootEditor(data=null){
  refreshCustomEquipmentIntoItems();
  enemyEditorLoot.push({
    id:data?.id||("loot_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5)),
    itemId:data?.itemId||ITEMS.find(x=>x?.id)?.id||"",
    chance:data?.chance??1,
    qty:data?.qty??1
  });
  renderEnemyLootEditor();
}

function removeEnemyLootEditor(id){
  enemyEditorLoot=enemyEditorLoot.filter(x=>x.id!==id);
  renderEnemyLootEditor();renderEnemyPreview();
}

function syncEnemyLootFromUi(){
  enemyEditorLoot=[...document.querySelectorAll("#enemyLootEditor .enemyLootRow")].map(row=>({
    id:row.dataset.id,
    itemId:row.querySelector(".elItem")?.value||"",
    chance:Math.max(0,Math.min(100,Number(row.querySelector(".elChance")?.value)||0)),
    qty:Math.max(1,Number(row.querySelector(".elQty")?.value)||1)
  }));
}

function renderEnemyLootEditor(){
  const box=document.getElementById("enemyLootEditor");if(!box)return;
  box.innerHTML="";
  if(!enemyEditorLoot.length){box.innerHTML='<div class="small">Aucun loot configuré.</div>';return}
  enemyEditorLoot.forEach(l=>{
    const row=document.createElement("div");row.className="enemyLootRow";row.dataset.id=l.id;
    row.innerHTML='<div class="enemyLootGrid">'+
      '<select class="elItem">'+enemyItemOptions(l.itemId)+'</select>'+
      '<label class="small">Chance %<input class="elChance" type="number" min="0" max="100" step="0.01" value="'+Number(l.chance??1)+'"></label>'+
      '<label class="small">Qté<input class="elQty" type="number" min="1" max="99" value="'+Number(l.qty??1)+'"></label>'+
      '<button type="button" class="danger" onclick="removeEnemyLootEditor(\''+l.id+'\')">✕</button>'+
    '</div>';
    row.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",()=>{syncEnemyLootFromUi();renderEnemyPreview()}));
    box.appendChild(row);
  });
}

function enemyFormObject(){
  syncEnemyAbilitiesFromUi();
  return {
    id:document.getElementById("enemyEditId")?.value||enemyEditingId||"",
    gameMode:(()=>{const prev=enemyEditingId?loadCustomEnemies().find(x=>String(x.id)===String(enemyEditingId)):null;return prev?.gameMode||(isDungeonMode()?"dungeon":"zombicide")})(),
    name:(document.getElementById("enemyName")?.value||"").trim(),
    category:document.getElementById("enemyCategory")?.value||"",
    skin:normalizeEnemySkin(document.getElementById("enemySkin")?.value||skinFromEnemyCategory(document.getElementById("enemyCategory")?.value)),
    image_data:document.getElementById("enemyImageData")?.value||"",
    imageCrop:(()=>{try{return gensNormCrop(JSON.parse(document.getElementById("enemyCropJson")?.value||"{}"))}catch(e){return gensNormCrop({})}})(),
    defaultCount:Math.max(0,Number(document.getElementById("enemyDefaultCount")?.value)||0),
    rule:(()=>{
      const dungeon=(typeof isDungeonMode==="function"&&isDungeonMode());
      const rpgStats=dungeon?{
        force:Math.max(0,Number(document.getElementById("enemyRpgForce")?.value)||0),
        agilite:Math.max(0,Number(document.getElementById("enemyRpgAgility")?.value)||0),
        intelligence:Math.max(0,Number(document.getElementById("enemyRpgIntelligence")?.value)||0),
        esprit:Math.max(0,Number(document.getElementById("enemyRpgSpirit")?.value)||0),
        endurance:Math.max(0,Number(document.getElementById("enemyRpgEndurance")?.value)||0),
        defense:Math.max(0,Number(document.getElementById("enemyRpgDefense")?.value)||0),
        armor:Math.max(0,Number(document.getElementById("enemyRpgArmor")?.value)||0),
        initiative:Number(document.getElementById("enemyRpgInitiative")?.value)||0,
        movement:Math.max(0,Number(document.getElementById("enemyRpgMovement")?.value)||1),perception:Math.max(0,Number(document.getElementById("enemyRpgPerception")?.value)||0)
      }:null;
      const attackMode=dungeon?(document.getElementById("enemyRpgAttackMode")?.value||"melee"):"";
      const baseChance=dungeon?Math.max(1,Math.min(99,Number(document.getElementById("enemyRpgBaseChance")?.value)||50)):null;
      return {
      hp:dungeon?Math.max(1,Number(document.getElementById("enemyRpgHp")?.value)||1):null,
      rpgStats,elementTypes:gensCurrentElementSettings().enabled?gensSelectedElementTypes("enemyRpgElement1","enemyRpgElement2"):[],resistances:gensReadResistanceEditor(document.getElementById("enemyResistanceEditor")||document),attackElement:gensCurrentElementSettings().enabled?(document.getElementById("enemyRpgAttackElement")?.value||""):"",attackMode,damageType:attackMode==="magic"?"magic":"physical",attackBaseChance:baseChance,rpgHitChance:baseChance,
      strength:dungeon?rpgStats.force:enemyNullableNumber("enemyStrength"),
      endurance:dungeon?rpgStats.endurance:enemyNullableNumber("enemyEndurance"),
      armor:dungeon?String(rpgStats.armor):(document.getElementById("enemyArmor")?.value||"").trim(),
      actions:enemyNullableNumber("enemyActions"),
      activationMode:document.getElementById("enemyActivationMode")?.value||"",
      initiative:enemyNullableNumber("enemyInitiative"),
      movement:dungeon?Math.max(0,Number(document.getElementById("enemyRpgMovement")?.value)||1):null,perception:dungeon?Math.max(0,Number(document.getElementById("enemyRpgPerception")?.value)||0):null,
      activationText:(document.getElementById("enemyActivationText")?.value||"").trim(),
      damage:enemyNullableNumber("enemyDamage"),
      attackDice:enemyNullableNumber("enemyAttackDice"),
      attackAccuracy:enemyNullableNumber("enemyAttackAccuracy"),
      armorPenalty:enemyNullableNumber("enemyArmorPenalty"),
      range:(document.getElementById("enemyRange")?.value||"").trim(),
      xp:enemyNullableNumber("enemyXp"),goldDrop:gensEconomyEnabled()?{chance:Math.max(0,Math.min(100,Number(document.getElementById("enemyGoldChance")?.value)||0)),min:Math.max(0,Number(document.getElementById("enemyGoldMin")?.value)||0),max:Math.max(0,Number(document.getElementById("enemyGoldMax")?.value)||0)}:null,
      abilities:enemyEditorAbilities
        .filter(a=>a.name||a.text)
        .map(a=>({...a})),
      phases:(syncEnemyPhasesFromUi(),enemyEditorPhases.map(p=>({...p}))),
      loot:(syncEnemyLootFromUi(),enemyEditorLoot.filter(l=>l.itemId&&Number(l.chance)>0).map(l=>({...l}))),
      details:(document.getElementById("enemyDescription")?.value||"").trim()
      };
    })()
  };
}

function enemyTriggerLabel(v){
  return ({passive:"Passive",activation:"À l’activation",attack:"À l’attaque",wounded:"Quand blessé",death:"À la mort",special:"Spécial"}[v]||"");
}

function enemyActivationLabel(v){
  return ({standard:"Standard",actions:"Nombre d’actions",initiative:"Initiative / priorité",condition:"Conditionnelle",manual:"Libre / manuel"}[v]||"");
}

function enemyCardHtml(e){
  const r=e.rule||{};
  const stat=[];
  const push=(label,val)=>{
    if(val===null||val===undefined||String(val).trim()==="")return;
    stat.push('<span class="enemyStatChip">'+label+' : '+z40kEscHtml(String(val))+'</span>');
  };
  if(typeof isDungeonMode==="function"&&isDungeonMode()&&r.rpgStats){
    (r.elementTypes||[]).forEach(id=>{const el=gensElementById(id);if(el)push("Type",(el.icon||"◈")+" "+el.name)});
    const d=dungeonEnemyDerived(e);push("FOR",d.force);push("AGI",d.agilite);push("INT",d.intelligence);push("ESP",d.esprit);push("END",d.endurance);push("Défense",d.defense);push("Armure",d.armor+" (−"+d.armorReduction+")");push("Crit",d.crit+"%");push("Esquive",d.dodge+"%");
  }else{push("Force",r.strength);push("Endurance",r.endurance);push("Armure",r.armor);}
  push("Actions",r.actions);
  push("Dégâts",r.damage);
  push("Portée",r.range);
  push("Récompense XP",r.xp);
  push("Initiative",r.initiative);
  if(typeof isDungeonMode==="function"&&isDungeonMode())push("Mouvement",r.movement??r.rpgStats?.movement??1);

  const activation=(r.activationMode||r.activationText)
    ? '<div class="enemyRuleBlock"><strong>🔄 Activation'+(r.activationMode?' — '+z40kEscHtml(enemyActivationLabel(r.activationMode)):'')+'</strong>'+
      (r.activationText?'<div>'+z40kEscHtml(r.activationText)+'</div>':'')+'</div>'
    : '';

  const abilities=(r.abilities||[]).filter(a=>a.name||a.text).map(a=>
    '<div class="enemyAbilityCard"><strong>'+z40kEscHtml(a.name||"Capacité")+'</strong>'+
    ((a.trigger||a.cooldown!==null&&a.cooldown!==undefined)
      ? '<small>'+[
          a.trigger?enemyTriggerLabel(a.trigger):"",
          (a.cooldown!==null&&a.cooldown!==undefined)?"Recharge "+a.cooldown+" tour(s)":""
        ].filter(Boolean).join(" · ")+'</small>':'')+
    (a.text?'<div style="margin-top:4px">'+z40kEscHtml(a.text)+'</div>':'')+
    '</div>'
  ).join("");

  const phases=(r.phases||[]).map((p,i)=>
    '<div class="enemyPhasePreview"><strong>👑 '+z40kEscHtml(p.name||("Phase "+(i+1)))+' — PV ≤ '+Number(p.hpPercent||0)+'%</strong>'+
    (p.text?'<div>'+z40kEscHtml(p.text)+'</div>':'')+'</div>'
  ).join("");
  const loot=(typeof isDungeonMode==="function"&&isDungeonMode())
    ? ''
    : ((r.loot||[]).length
      ? '<div class="enemyRuleBlock"><strong>🎁 Loot possible</strong><div class="small">'+
        (r.loot||[]).map(l=>z40kEscHtml(itemById(l.itemId)?.name||l.itemId)+' — '+Number(l.chance||0)+'% ×'+Number(l.qty||1)).join("<br>")+
        '</div></div>'
      : '');

  const dungeonFormula=(typeof isDungeonMode==="function"&&isDungeonMode()&&r.rpgStats)?(()=>{const d={id:e.id,rule:r},p=dungeonEnemyAttackProfile(d);return '<div class="enemyRuleBlock"><strong>🎲 Formule attaque</strong><div>'+z40kEscHtml((p.mode==="magic"?"INT":p.mode==="ranged"?"AGI":"FOR")+' '+p.attributeValue+' · '+p.baseChance+'% base + '+p.statBonus+'% stat = '+p.chance+'% avant Défense · D100 '+d100ThresholdFromChance(p.chance)+'+ · dégâts '+p.baseDamage+' + '+p.damageBonus+' = '+p.power)+'</div></div>'})():'';
  const skin=normalizeEnemySkin(e.skin||skinFromEnemyCategory(e.category));
  const bg=GENSRPG_ENEMY_SKINS[skin]||GENSRPG_ENEMY_SKINS.creature;
  return '<div class="enemyPreviewCard enemySkinned skin-'+skin+'" style="background-image:url('+bg+')">'+
    '<div class="enemyPreviewArt">'+
      (e.image_data?'<img src="'+e.image_data+'" alt="" style="transform:'+gensCropTransform(e.imageCrop)+';transform-origin:center center">':'<div class="enemyPreviewNoArt">◈</div>')+
    '</div>'+
    '<div class="enemyPreviewBody">'+
      '<div class="enemyPreviewName">'+z40kEscHtml(e.name||"ENNEMI")+'</div>'+
      (e.category?'<div class="enemyPreviewCategory">'+z40kEscHtml(e.category)+'</div>':'')+
      (stat.length?'<div class="enemyStatWrap">'+stat.join("")+'</div>':'')+
      activation+
      dungeonFormula+
      (abilities?'<div class="enemyRuleBlock"><strong>✨ Capacités</strong>'+abilities+'</div>':'')+
      (phases?'<div class="enemyRuleBlock"><strong>👑 Phases</strong>'+phases+'</div>':'')+
      loot+
      (r.details?'<div class="enemyRuleBlock">'+z40kEscHtml(r.details)+'</div>':'')+
    '</div>'+
  '</div>';

}

function renderEnemyPreview(){
  const box=document.getElementById("enemyPreview");if(!box)return;
  const obj=enemyFormObject();box.innerHTML=enemyCardHtml(obj);
  const fp=document.getElementById("enemyRpgFormulaPreview");
  if(fp && typeof isDungeonMode==="function"&&isDungeonMode()){const p=dungeonEnemyAttackProfile(obj),d=dungeonEnemyDerived(obj);fp.innerHTML='<strong>Formule actuelle</strong><br>'+(p.mode==="magic"?"INT":p.mode==="ranged"?"AGI":"FOR")+' '+p.attributeValue+' · '+p.baseChance+'% base + '+p.statBonus+'% stat = <strong>'+p.chance+'%</strong> avant Défense → D100 <strong>'+d100ThresholdFromChance(p.chance)+'+</strong><br>Dégâts : '+p.baseDamage+' + '+p.damageBonus+' = <strong>'+p.power+'</strong> · Crit '+d.crit+'% · Esquive '+d.dodge+'% · Armure −'+d.armorReduction;}
}

function openEnemyEditor(id=""){
  refreshCustomEnemiesIntoZombieTypes();
  const base=builtinEnemyBase(id);
  const e=base ? builtinEnemyToEditorData(id) : (id?loadCustomEnemies().find(x=>x.id===id):null);

  enemyEditingId=e?.id||null;
  document.getElementById("enemyEditId").value=e?.id||"";
  document.getElementById("enemyEditBaseId").value=base?String(base.id):"";
  document.getElementById("enemyEditorTitle").textContent=base
    ?"✏️ Personnaliser "+(e?.name||base.name)
    : e?"✏️ Modifier l’ennemi":"🧟 Créer un ennemi";

  document.getElementById("enemyName").value=e?.name||"";
  document.getElementById("enemyCategory").value=e?.category||"";
  document.getElementById("enemySkin").value=normalizeEnemySkin(e?.skin||skinFromEnemyCategory(e?.category));
  document.getElementById("enemyImageData").value=e?.image_data||"";
  document.getElementById("enemyCropJson").value=JSON.stringify(gensNormCrop(e?.imageCrop||{}));
  document.getElementById("enemyImageFile").value="";

  const r=e?.rule||{};
  const set=(id,v)=>{document.getElementById(id).value=(v===null||v===undefined)?"":v};
  set("enemyStrength",r.strength);
  set("enemyEndurance",r.endurance);
  const endField=document.getElementById("enemyEndurance")?.closest(".eqField");
  if(endField)endField.style.display=(typeof isDungeonMode==="function"&&isDungeonMode())?"none":"";
  set("enemyArmor",r.armor);
  set("enemyActions",r.actions);
  set("enemyActivationMode",r.activationMode);
  set("enemyInitiative",r.initiative);
  set("enemyActivationText",r.activationText);
  set("enemyDamage",r.damage);
  set("enemyAttackDice",r.attackDice);
  set("enemyAttackAccuracy",r.attackAccuracy);
  set("enemyArmorPenalty",r.armorPenalty);
  set("enemyRange",r.range);
  set("enemyXp",r.xp);
  set("enemyDefaultCount",e?.defaultCount??0);
  set("enemyDescription",r.details);
  const dungeonEditor=(typeof isDungeonMode==="function"&&isDungeonMode());
  const rs=dungeonEnemyRpgStats({id:e?.id||id,rule:r});
  set("enemyRpgHp",r.hp??r.endurance??5);set("enemyRpgForce",rs.force);set("enemyRpgAgility",rs.agilite);set("enemyRpgIntelligence",rs.intelligence);set("enemyRpgSpirit",rs.esprit);set("enemyRpgEndurance",rs.endurance);set("enemyRpgDefense",rs.defense);set("enemyRpgArmor",rs.armor);set("enemyRpgInitiative",rs.initiative);set("enemyRpgMovement",r.movement??rs.movement??1);set("enemyRpgPerception",r.perception??rs.perception??0);const elEnabled=gensFillElementTypeSelects("enemyRpgElement1","enemyRpgElement2",r.elementTypes||[]);const enemyRes=document.getElementById("enemyResistanceEditor");if(enemyRes)enemyRes.innerHTML=gensResistanceEditorHtml(r.resistances||[],"enemyRes");const ew=document.getElementById("enemyRpgElementsWrap");if(ew)ew.style.display=elEnabled?"":"none";const ae=document.getElementById("enemyRpgAttackElement");if(ae){ae.innerHTML=gensElementOptions(r.attackElement||"");ae.value=r.attackElement||"";ae.closest(".eqField").style.display=elEnabled?"":"none"}set("enemyRpgAttackMode",r.attackMode||dungeonInferEnemyAttackMode(e?.id||id,r.range));set("enemyRpgBaseChance",r.attackBaseChance??r.rpgHitChance??50);
  const rpgSection=document.getElementById("enemyDungeonRpgStatsSection");if(rpgSection)rpgSection.style.display=(dungeonEditor||elEnabled)?"block":"none";
  ["enemyStrength","enemyEndurance","enemyArmor","enemyAttackAccuracy","enemyArmorPenalty"].forEach(fid=>{const w=document.getElementById(fid)?.closest(".eqField");if(w)w.style.display=dungeonEditor?"none":""});

  enemyEditorAbilities=(r.abilities||[]).map(a=>({...a,id:a.id||("ea_"+Math.random().toString(36).slice(2,7))}));
  enemyEditorPhases=(r.phases||[]).map(p=>({...p,id:p.id||("phase_"+Math.random().toString(36).slice(2,7))}));
  enemyEditorLoot=(r.loot||[]).map(l=>({...l,id:l.id||("loot_"+Math.random().toString(36).slice(2,7))}));set("enemyGoldChance",r.goldDrop?.chance??0);set("enemyGoldMin",r.goldDrop?.min??0);set("enemyGoldMax",r.goldDrop?.max??0);const gdw=document.getElementById("enemyGoldDropWrap");if(gdw)gdw.style.display=gensEconomyEnabled()?"block":"none";

  renderEnemyAbilitiesEditor();
  renderEnemyPhasesEditor();
  renderEnemyLootEditor();
  renderEnemyActivationFields();
  renderEnemyPreview();
  document.getElementById("enemyEditorModal").classList.add("open");
  document.body.style.overflow="hidden";
}

function closeEnemyEditor(){
  document.getElementById("enemyEditorModal").classList.remove("open");
  document.body.style.overflow="";
  enemyEditingId=null;
}

function enemyEditorBackdrop(e){
  if(e.target?.id==="enemyEditorModal")closeEnemyEditor();
}

function saveEnemyEditor(){
  const e=enemyFormObject();
  if(!e.name){alert("Donne un nom à l’ennemi.");return}

  const baseId=document.getElementById("enemyEditBaseId")?.value||"";
  if(baseId && builtinEnemyBase(baseId)){
    e.id=baseId;
    e.builtin=true;
    const o=loadBuiltinEnemyOverrides();
    o[baseId]=e;
    saveBuiltinEnemyOverrides(o);
    applyBuiltinEnemyOverrides([builtinEnemyBase(baseId)].filter(Boolean));

    const cfg=loadZombieConfig();
    cfg[baseId]=Math.max(0,Number(e.defaultCount)||0);
    saveZombieConfig(cfg);

    closeEnemyEditor();
    renderEnemyLibrary();
    try{renderZombieReserve();renderWaveProfileEditor()}catch(err){}
    return;
  }

  const list=loadCustomEnemies();
  if(isDungeonMode()){e.gameMode="dungeon";e.universeId=gensCurrentUniverseId()||GAME_PROFILE_DUNGEON_ID;e.contentFamily=gensCurrentContentFamily()}
  if(!e.id)e.id="custom_enemy_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7);
  const ix=list.findIndex(x=>x.id===e.id);
  if(ix>=0)list[ix]=e;else list.push(e);
  saveCustomEnemies(list);
  if(e.gameMode==="dungeon")gensAttachContentToUniverse(e.universeId,"enemy",e.id);
  refreshCustomEnemiesIntoZombieTypes();

  const cfg=loadZombieConfig();
  if(cfg[e.id]===undefined)cfg[e.id]=Math.max(0,Number(e.defaultCount)||0);
  saveZombieConfig(cfg);

  closeEnemyEditor();
  renderEnemyLibrary();
  if(document.getElementById("waveLevelsEditor"))renderWaveProfileEditor();
}

function deleteCustomEnemy(id){
  const e=loadCustomEnemies().find(x=>x.id===id);
  if(!e)return;
  if(!confirm("Supprimer « "+e.name+" » ?"))return;
  saveCustomEnemies(loadCustomEnemies().filter(x=>x.id!==id));
  refreshCustomEnemiesIntoZombieTypes();
  renderEnemyLibrary();
}

function renderEnemyLibrary(){
  const box=document.getElementById("enemyLibrary");if(!box)return;
  refreshCustomEnemiesIntoZombieTypes();
  const custom=customEnemiesForMode(isDungeonMode());
  box.innerHTML="";

  if(!(typeof isDungeonMode==="function" && isDungeonMode())){
  const titleBase=document.createElement("div");
  titleBase.innerHTML='<strong style="font-size:15px">🎮 Ennemis intégrés</strong><div class="hint" style="text-align:left;margin-top:3px">Walker, Fatty, Runner, Abomination, Tyranides… Tu peux changer leurs stats, règles, capacités, phases et leur table de loot sans perdre le modèle d’origine.</div>';
  box.appendChild(titleBase);

  BASE_ZOMBIE_TYPES.forEach(base=>{
    const z=ZOMBIE_TYPES.find(x=>String(x.id)===String(base.id) && !x.customEnemy)||base;
    const r=z.rule||{};
    const summary=[];
    if(r.strength!==null&&r.strength!==undefined)summary.push("F "+r.strength);
    if(r.endurance!==null&&r.endurance!==undefined)summary.push("End "+r.endurance);
    if(r.armor)summary.push("Armure "+r.armor);
    if(r.actions!==null&&r.actions!==undefined)summary.push(r.actions+" action(s)");
    if(!(typeof isDungeonMode==="function"&&isDungeonMode())&&Array.isArray(r.loot)&&r.loot.length)summary.push("🎁 "+r.loot.length+" drop(s)");

    const card=document.createElement("div");card.className="enemyLibCard";
    card.innerHTML=
      (z.art?'<div class="enemyLibThumb" style="overflow:hidden"><img src="'+z.art+'" alt="" style="width:100%;height:100%;object-fit:contain;transform:'+gensCropTransform(z.imageCrop)+';transform-origin:center center"></div>':'<div class="enemyLibThumb" style="display:grid;place-items:center;font-size:34px">◈</div>')+
      '<div><strong>'+z40kEscHtml(z.name)+'</strong>'+
      '<span class="gensSharedBadge" style="background:#494d52;border-color:#73777b">BASE</span>'+
      (z.builtinCustomized?'<span class="gensSharedBadge" style="background:#6a481d;border-color:#9b7136">MODIFIÉ</span>':'')+
      (summary.length?'<div style="font-size:12px;margin-top:4px">'+summary.join(" · ")+'</div>':'')+
      '</div>'+
      '<div class="enemyLibBtns"><button onclick="openEnemyEditor(\''+base.id+'\')">✏️ Personnaliser</button>'+
      (z.builtinCustomized?'<button style="background:#6b4b1d" onclick="resetBuiltinEnemyCustomization(\''+base.id+'\')">↻ Origine</button>':'')+
      '</div>';
    box.appendChild(card);
  });
  }

  if(typeof isDungeonMode==="function" && isDungeonMode() && gensCurrentContentFamily()==="rpg"){
    const titleDungeon=document.createElement("div");titleDungeon.style.marginTop="12px";titleDungeon.innerHTML='<strong style="font-size:15px">🏰 Bestiaire Dungeon intégré</strong><div class="hint" style="text-align:left;margin-top:3px">20 créatures fantasy. Toutes peuvent être modifiées, y compris leur illustration.</div>';box.appendChild(titleDungeon);
    dungeonEnemies().forEach(base=>{const z=ZOMBIE_TYPES.find(x=>String(x.id)===String(base.id))||base,r=z.rule||{},ed=dungeonEnemyDerived(z),card=document.createElement("div");card.className="enemyLibCard";card.innerHTML=(z.art?'<div class="enemyLibThumb" style="overflow:hidden"><img src="'+z.art+'" alt="" style="width:100%;height:100%;object-fit:contain;transform:'+gensCropTransform(z.imageCrop)+';transform-origin:center center"></div>':'<div class="enemyLibThumb">◈</div>')+'<div><strong>'+z40kEscHtml(z.name)+'</strong><span class="gensSharedBadge" style="background:#5b4524;border-color:#9b7136">DUNGEON</span>'+(z.builtinCustomized?'<span class="gensSharedBadge" style="background:#6a481d;border-color:#9b7136">MODIFIÉ</span>':'')+'<div style="font-size:12px;margin-top:4px">❤️ '+(r.hp??r.endurance??'—')+' · FOR '+ed.force+' · DEF '+ed.defense+' · ARM '+ed.armor+' (−'+ed.armorReduction+') · XP '+(r.xp??0)+'</div></div><div class="enemyLibBtns"><button onclick="openEnemyEditor(\''+base.id+'\')">✏️ Modifier</button>'+(z.builtinCustomized?'<button style="background:#6b4b1d" onclick="resetBuiltinEnemyCustomization(\''+base.id+'\')">↻ Origine</button>':'')+'</div>';box.appendChild(card)});
  }

  const titleCustom=document.createElement("div");
  titleCustom.style.marginTop="12px";
  titleCustom.innerHTML=(typeof isDungeonMode==="function"&&isDungeonMode())
    ?'<strong style="font-size:15px">🧬 Bibliothèque '+z40kEscHtml(gensContentFamilyLabel())+'</strong><div class="hint" style="text-align:left;margin-top:3px">Contenu compatible avec ce type de gameplay · origine : différents univers.</div>'
    :'<strong style="font-size:15px">🧬 Ennemis personnalisés</strong>';
  box.appendChild(titleCustom);

  if(!custom.length){
    const empty=document.createElement("div");
    empty.className="empty";
    empty.textContent="Aucun ennemi personnalisé. Utilise « Créer un ennemi ».";
    box.appendChild(empty);
    return;
  }

  custom.forEach(e=>{
    const r=e.rule||{};
    const summary=[];
    if(r.strength!==null&&r.strength!==undefined)summary.push("F "+r.strength);
    if(r.endurance!==null&&r.endurance!==undefined)summary.push("End "+r.endurance);
    if(r.armor)summary.push("Armure "+r.armor);
    if(r.actions!==null&&r.actions!==undefined)summary.push(r.actions+" action(s)");
    if(!(typeof isDungeonMode==="function"&&isDungeonMode())&&Array.isArray(r.loot)&&r.loot.length)summary.push("🎁 "+r.loot.length+" drop(s)");

    const card=document.createElement("div");card.className="enemyLibCard";
    card.innerHTML=
      (e.image_data?'<div class="enemyLibThumb" style="overflow:hidden"><img src="'+e.image_data+'" alt="" style="width:100%;height:100%;object-fit:contain;transform:'+gensCropTransform(e.imageCrop)+';transform-origin:center center"></div>':'<div class="enemyLibThumb" style="display:grid;place-items:center;font-size:34px">◈</div>')+
      '<div><strong>'+z40kEscHtml(e.name)+'</strong>'+(e._gensShared?'<span class="gensSharedBadge">REÇU</span>':'')+
      '<div class="hint" style="text-align:left">'+(e._gensShared?'Reçu de '+z40kEscHtml(gensrpgOriginLabel(e)):'Local')+'</div>'+
      (e.category?'<div class="hint" style="text-align:left">'+z40kEscHtml(e.category)+'</div>':'')+
      (summary.length?'<div style="font-size:12px;margin-top:4px">'+summary.join(" · ")+'</div>':'')+
      '</div>'+
      '<div class="enemyLibBtns"><button onclick="openEnemyEditor(\''+e.id+'\')">✏️ Modifier</button>'+
      '<button style="background:#70201d" onclick="deleteCustomEnemy(\''+e.id+'\')">🗑 Supprimer</button></div>';
    box.appendChild(card);
  });
}

function openEnemyManagerFromHub(){
  gensEditorReturn="hub";
  hideMainScreens();
  refreshCustomEnemiesIntoZombieTypes();
  document.getElementById("enemyManager").style.display="block";
  renderEnemyLibrary();const createBtn=document.getElementById("enemyCreateNewBtn");if(createBtn)createBtn.style.setProperty("display","block","important");
  window.scrollTo(0,0);
}

function closeEnemyManager(){
  document.getElementById("enemyManager").style.display="none";
  returnFromLibraryEditor();
}
