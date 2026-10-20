/* GenSrpG Phase12 R14: 41 original Builders RPG-universe editor handlers.
 * Sole owner: Builders UI/config forms; no Core/profile authority or runtime initializer moved.
 * Strict parser-synchronous declarations; original function text unchanged.
 */
function closeRpgUniverseEditor(){const m=document.getElementById("rpgUniverseEditorModal");if(m)m.style.display="none";document.body.style.overflow=""}

function showRpgUniverseTab(tab){document.querySelectorAll(".rpgUniverseTab").forEach(x=>x.style.display="none");const e=document.getElementById("rpgTab_"+tab);if(e)e.style.display="block"}

function renderRpgEncounterLocations(){
  const host=document.getElementById("rpgEncounterLocations");if(!host)return;
  const p=currentRpgProfile();if(!p)return;ensureRpgProfileData(p);
  const locations=p.rpgUniverse.encounters?.locations||[];
  host.innerHTML="";
  if(!locations.length){
    host.innerHTML='<div class="empty">Aucun lieu. Ajoute une forêt, grotte, route, ville, plage…</div>';
    return;
  }

  const creatures=gensEncounterCreatures();

  locations.forEach((loc,li)=>{
    const tags=gensMigrateLegacyLocationTags(loc);
    const card=document.createElement("div");card.className="smodCard";card.style.marginBottom="8px";

    const rows=tags.map((t,ti)=>
      '<div style="display:grid;grid-template-columns:1fr 105px 42px;gap:6px;align-items:end;margin-top:6px">'+
      '<label>Tag<select data-loc-tag="'+li+':'+ti+'">'+gensEncounterTagOptions(t.tagId)+'</select></label>'+
      '<label>Présence / poids %<input data-loc-weight="'+li+':'+ti+'" type="number" min="0" max="1000" step="0.1" value="'+Number(t.weight||0)+'"></label>'+
      '<button type="button" class="danger" onclick="removeRpgLocationTag('+li+','+ti+')">✕</button>'+
      '</div>'
    ).join("");

    const tagIds=new Set(tags.map(t=>t.tagId).filter(Boolean));
    const compatible=creatures.filter(c=>c.spawnTags.some(t=>tagIds.has(t)));
    const preview=compatible.length
      ? compatible.map(c=>z40kEscHtml(c.name)+' <span class="small">('+Number(c.spawnChance)+'%)</span>').join(" · ")
      : "Aucune créature compatible pour le moment.";

    card.innerHTML=
      '<div style="display:flex;gap:7px;align-items:center">'+
        '<input data-enc-name="'+li+'" value="'+z40kEscAttr(loc.name||"Nouveau lieu")+'" maxlength="50" style="flex:1">'+
        '<button class="danger" type="button" onclick="removeRpgEncounterLocation('+li+')">🗑 LIEU</button>'+
      '</div>'+
      '<label style="margin-top:6px">Description<input data-enc-desc="'+li+'" value="'+z40kEscAttr(loc.desc||"")+'" maxlength="120"></label>'+
      '<div style="margin-top:9px"><strong>🏷️ Tags du lieu</strong><div class="small">Les valeurs sont des poids d’ambiance. Elles servent à départager les créatures compatibles ; elles n’écrasent jamais la rareté propre de la créature.</div></div>'+
      rows+
      '<div class="smodActions"><button type="button" onclick="addRpgLocationTag('+li+')">➕ AJOUTER UN TAG</button></div>'+
      '<div class="smodMini" style="margin-top:8px"><strong>Créatures compatibles automatiquement :</strong><br>'+preview+'</div>';

    host.appendChild(card);
  });
}

function collectRpgEncounterLocations(){
  const p=currentRpgProfile();if(!p)return[];
  const old=p.rpgUniverse.encounters?.locations||[];

  return old.map((loc,li)=>{
    const name=document.querySelector('[data-enc-name="'+li+'"]')?.value.trim()||"Lieu";
    const desc=document.querySelector('[data-enc-desc="'+li+'"]')?.value.trim()||"";
    const source=gensMigrateLegacyLocationTags(loc);
    const tags=source.map((t,ti)=>({
      tagId:document.querySelector('[data-loc-tag="'+li+':'+ti+'"]')?.value||"",
      weight:Math.max(0,Number(document.querySelector('[data-loc-weight="'+li+':'+ti+'"]')?.value)||0)
    })).filter(t=>t.tagId&&t.weight>0);

    return {id:loc.id||("loc_"+Date.now().toString(36)+"_"+li),name,desc,tags};
  });
}

function addRpgEncounterLocation(){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;
  const p=ctx.profile;ensureRpgProfileData(p);
  p.rpgUniverse.encounters.locations=collectRpgEncounterLocations();
  p.rpgUniverse.encounters.locations.push({id:"loc_"+Date.now().toString(36),name:"Nouveau lieu",desc:"",tags:[]});
  ctx.profiles[ctx.index]=p;saveGameProfiles(ctx.profiles);renderRpgEncounterLocations();
}

function removeRpgEncounterLocation(i){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;
  const p=ctx.profile;ensureRpgProfileData(p);
  p.rpgUniverse.encounters.locations=collectRpgEncounterLocations();
  p.rpgUniverse.encounters.locations.splice(i,1);
  ctx.profiles[ctx.index]=p;saveGameProfiles(ctx.profiles);renderRpgEncounterLocations();
}

function addRpgLocationTag(i){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;
  const p=ctx.profile;ensureRpgProfileData(p);
  p.rpgUniverse.encounters.locations=collectRpgEncounterLocations();
  const loc=p.rpgUniverse.encounters.locations[i];if(!loc)return;
  loc.tags=loc.tags||[];loc.tags.push({tagId:"",weight:50});
  ctx.profiles[ctx.index]=p;saveGameProfiles(ctx.profiles);renderRpgEncounterLocations();
}

function removeRpgLocationTag(i,j){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;
  const p=ctx.profile;ensureRpgProfileData(p);
  p.rpgUniverse.encounters.locations=collectRpgEncounterLocations();
  const loc=p.rpgUniverse.encounters.locations[i];if(!loc)return;
  loc.tags.splice(j,1);
  ctx.profiles[ctx.index]=p;saveGameProfiles(ctx.profiles);renderRpgEncounterLocations();
}

function saveRpgEncounterSettings(){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;
  const p=ctx.profile;ensureRpgProfileData(p);
  p.rpgUniverse.encounters={enabled:true,locations:collectRpgEncounterLocations()};
  ctx.profiles[ctx.index]=p;saveGameProfiles(ctx.profiles);
  renderRpgEncounterLocations();
  alert("Lieux et tags de rencontre enregistrés ✅");
}

function renderRpgMovementCustomUnit(){
  const row=document.getElementById("rpgMovementCustomUnitRow"),sel=document.getElementById("rpgMovementUnit");
  if(row)row.style.display=sel?.value==="custom"?"":"none";
}

function saveRpgMovementSettings(){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;const p=ctx.profile;ensureRpgProfileData(p);
  const oldMv=p.rpgUniverse.movement||{};
  p.rpgUniverse.movement={
    ...oldMv,
    enabled:!!gensGameplayModules().movement,
    mode:document.getElementById("rpgMovementMode")?.value||"narrative",
    unit:document.getElementById("rpgMovementUnit")?.value||"case",
    customUnit:document.getElementById("rpgMovementCustomUnit")?.value.trim()||"",
    refreshMode:document.getElementById("rpgMovementRefreshMode")?.value||"turn",
    combatParticipationRange:(()=>{const n=Number(document.getElementById("rpgCombatParticipationRange")?.value);return Number.isFinite(n)?Math.max(0,Math.min(20,n)):3})(),
    entities:{heroes:!!document.getElementById("rpgMoveHeroes")?.checked,creatures:!!document.getElementById("rpgMoveCreatures")?.checked,enemies:!!document.getElementById("rpgMoveEnemies")?.checked,companions:!!document.getElementById("rpgMoveCompanions")?.checked},
    defaults:{hero:3,creature:1,enemy:1,companion:3},
    balanceVersion:2
  };
  ctx.profiles[ctx.index]=p;saveGameProfiles(ctx.profiles);alert("Déplacements enregistrés ✅");
}

function saveRpgTrainerPvpSettings(){
  const ctx=lockedRpgEditingProfile();if(!ctx)return;
  const p=ctx.profile;ensureRpgProfileData(p);

  p.rpgUniverse.captureCombat={
    activeSlots:Math.max(1,Math.min(3,Number(document.getElementById("rpgCaptureActiveSlots")?.value)||1)),
    teamSize:Math.max(1,Math.min(20,Number(document.getElementById("rpgCaptureTeamSize")?.value)||6)),
    minBattleTeam:Math.max(1,Math.min(20,Number(document.getElementById("rpgCaptureMinBattleTeam")?.value)||3)),
    maxBattleTeam:Math.max(1,Math.min(20,Number(document.getElementById("rpgCaptureMaxBattleTeam")?.value)||6)),
    recallCost:document.getElementById("rpgCaptureRecallCost")?.value||"turn",
    autoReplaceKo:document.getElementById("rpgCaptureAutoReplaceKo")?.checked!==false,
    itemsAllowed:document.getElementById("rpgCaptureItemsAllowed")?.checked!==false,
    captureAllowed:true,
    controller:document.getElementById("rpgCaptureController")?.value||"auto",
    allowBattleOverride:document.getElementById("rpgCaptureAllowBattleOverride")?.checked!==false,
    itemSlots:Math.max(0,Math.min(20,Number(document.getElementById("rpgCaptureItemSlots")?.value)||0)),
    itemsPerTurn:Math.max(0,Math.min(10,Number(document.getElementById("rpgCaptureItemsPerTurn")?.value)||0)),
    defendAllowed:document.getElementById("rpgCaptureDefendAllowed")?.checked!==false,
    initiativeMode:"dynamic",
    victoryMode:document.getElementById("rpgCaptureVictoryMode")?.value||"all_ko",
    saveBattle:document.getElementById("rpgCaptureSaveBattle")?.checked!==false,
    healMode:document.getElementById("rpgCaptureHealMode")?.value||"free",
    healCost:Math.max(0,Number(document.getElementById("rpgCaptureHealCost")?.value)||0)
  };

  p.rpgUniverse.trainerCombat={
    enabled:!!document.getElementById("rpgTrainerBattlesEnabled")?.checked,
    captureOpponent:!!document.getElementById("rpgTrainerCaptureAllowed")?.checked,
    goldReward:Math.max(0,Number(document.getElementById("rpgTrainerGoldReward")?.value)||0)
  };
  p.rpgUniverse.pvp={
    enabled:!!document.getElementById("rpgPvpEnabled")?.checked,
    rewards:!!document.getElementById("rpgPvpRewards")?.checked,
    itemLoss:!!document.getElementById("rpgPvpItemLoss")?.checked,
    permadeath:!!document.getElementById("rpgPvpPermadeath")?.checked,
    captureOpponent:false
  };

  ctx.profiles[ctx.index]=p;
  saveGameProfiles(ctx.profiles);
  alert("Combat Capture / Dresseurs / PvP enregistrés ✅");
}

function renderRpgGameplayUi(){
  const id=rpgEditingId||activeGameProfileId();
  reloadRpgGameplayFromProfileId(id);
}

function saveRpgGameplayModules(){
  const ctx=lockedRpgEditingProfile();
  if(!ctx){alert("Aucun univers RPG / Dungeon valide n’est sélectionné.");return}
  const {profiles,index,profile:p}=ctx;
  const selectedProfile=rpgGameplaySelectedProfile || p.rpgUniverse.gameplay?.profile || "custom";
  const modules=rpgGameplayDraftFromUi();

  p.rpgUniverse.gameplay={profile:selectedProfile,modules:{...modules}};
  p.rpgUniverse.elements=gensNormalizeElementSettings(p.rpgUniverse.elements);
  p.rpgUniverse.elements.enabled=!!modules.elements;
  p.rpgUniverse.economy={...gensBlankRpgSettings().economy,...(p.rpgUniverse.economy||{}),enabled:!!modules.economy};
  p.rpgUniverse.progression={...p.rpgUniverse.progression,permadeath:!!modules.permadeath};
  profiles[index]=p;

  // Écriture principale : c'est LA source de vérité.
  saveGameProfiles(profiles);

  // Vérification réelle du localStorage : évite les faux « enregistré » si Android est encore saturé.
  const saved=loadGameProfilesRaw().find(x=>String(x.id)===String(p.id));
  const savedGameplay=saved?.rpgUniverse?.gameplay;
  const sameProfile=String(savedGameplay?.profile||"")===String(selectedProfile||"");
  const sameModules=Object.keys(modules).every(k=>!!savedGameplay?.modules?.[k]===!!modules[k]);
  if(!savedGameplay || !sameProfile || !sameModules){
    alert("❌ Les modules n’ont pas pu être enregistrés durablement. Le stockage local est probablement encore saturé.");
    return;
  }

  // Miroir facultatif pour compatibilité seulement, jamais relu comme source principale.
  setStoredRpgGameplay(p.id,savedGameplay);

  setActiveGameProfileId(saved.id);rpgEditingId=saved.id;gensSelectedFamily=gensContentFamilyForProfile(saved)==="creature"?"capture":"adventure";
  applyGameProfile(saved,false);rpgEditingId=saved.id;
  renderRpgUniverseEditor();
  reloadRpgGameplayFromProfileId(saved.id);
  try{refreshCustomEquipmentIntoItems();renderEquipmentLibrary();renderControllableCreatureLibrary();renderCompanionLibrary()}catch(e){}
  try{updateGameplayEditorHubCards()}catch(e){}
  alert("Style et modules enregistrés pour « "+saved.name+" » ✅");
}

function renderRpgUniverseEditor(){
  const profiles=rpgProfiles(),p=currentRpgProfile();if(!p)return;ensureRpgProfileData(p);const cfg=p.rpgUniverse;
  const _renderProfileId=String(p.id);setTimeout(()=>{try{if(String(rpgEditingId)===_renderProfileId)reloadRpgGameplayFromProfileId(_renderProfileId)}catch(e){}},0);
  const sel=document.getElementById("rpgProfileSelect");if(sel){sel.innerHTML=profiles.map(x=>'<option value="'+z40kEscAttr(x.id)+'">'+z40kEscHtml((x.rpgUniverse?.icon||"🧭")+" "+x.name)+'</option>').join("");sel.value=p.id}
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v??""};
  set("rpgName",p.name);set("rpgDesc",p.desc||"");set("rpgIcon",cfg.icon||"🧭");set("rpgThemeColor",cfg.themeColor||"#654c32");
  set("rpgXpPerLevel",cfg.progression.xpPerLevel);set("rpgMaxLevel",cfg.progression.maxLevel);set("rpgTalentPointsPerLevel",cfg.progression.talentPointsPerLevel);set("rpgStartingSkillPoints",cfg.progression.startingSkillPoints||0);set("rpgStartingStatPoints",cfg.progression.startingStatPoints||0);set("rpgStatPointsPerLevel",cfg.progression.statPointsPerLevel??1);set("rpgAttributeEditMode",cfg.progression.attributeEditMode||"points");set("rpgLevelUpRestore",cfg.progression.levelUpRestore||"none");set("rpgWeaponSwitchCost",cfg.progression.weaponSwitchCost||"free");set("rpgXpCurveMode",cfg.progression.xpCurveMode||"linear");set("rpgKeepXp",String(cfg.progression.keepXp!==false));set("rpgKeepGear",String(cfg.progression.keepGear!==false));set("rpgPermadeath",String(!!cfg.progression.permadeath));setTimeout(()=>{try{renderRpgHeroProgressionCurve()}catch(e){}},0);
  set("rpgBaseHp",cfg.stats.baseHp);set("rpgHpPer10End",cfg.stats.hpPer10Endurance);set("rpgBaseMana",cfg.stats.baseMana);set("rpgManaPer10Spirit",cfg.stats.manaPer10Spirit);
  set("rpgBaseHit",cfg.combat.baseHit);set("rpgMinHit",cfg.combat.minHit);set("rpgMaxHit",cfg.combat.maxHit);set("rpgCritMultiplier",cfg.combat.critMultiplier);set("rpgCritCap",cfg.combat.critCap);set("rpgMinPhysicalDamage",cfg.combat.minPhysicalDamage);set("rpgMinMagicDamage",cfg.combat.minMagicDamage);
  set("rpgPhysicalFormula",cfg.combat.physicalDamageFormula||"step");set("rpgPhysicalPctPerPoint",cfg.combat.physicalDamagePercentPerPoint||0);set("rpgMagicFormula",cfg.combat.magicDamageFormula||"step");set("rpgMagicPctPerPoint",cfg.combat.magicDamagePercentPerPoint||0);set("rpgRangedFormula",cfg.combat.rangedDamageFormula||"none");set("rpgRangedPctPerPoint",cfg.combat.rangedDamagePercentPerPoint||0);set("rpgHpFormula",cfg.combat.hpFormula||"step");set("rpgHpPctPerPoint",cfg.combat.hpPercentPerPoint||0);set("rpgManaFormula",cfg.combat.manaFormula||"step");set("rpgManaPctPerPoint",cfg.combat.manaPercentPerPoint||0);set("rpgCritFormula",cfg.combat.critFormula||"step");const eco=cfg.economy||{};set("rpgCurrencyName",eco.currencyName||"Or");set("rpgCurrencyIcon",eco.currencyIcon||"🪙");set("rpgStartingGold",eco.startingGold??0);set("rpgSellPercent",eco.sellPercent??50);set("rpgMerchantBuyMultiplier",eco.merchantBuyMultiplier??1);const stock317=eco.merchantStockLimits||{};set("rpgMerchantStockWeapons",stock317.weapons??3);set("rpgMerchantStockEquipment",stock317.equipment??3);set("rpgMerchantStockConsumables",stock317.consumables??3);set("rpgMerchantStockOther",stock317.other??3);set("rpgEnemyGoldEnabled",String(eco.enemyGoldEnabled!==false));set("rpgMerchantEventEnabled",String(eco.merchantEventEnabled!==false));const ems=document.getElementById("rpgEconomyModuleStatus");if(ems)ems.innerHTML=(cfg.gameplay?.modules?.economy?"✅ Économie activée":"⛔ Économie désactivée")+" · change ce choix dans Style & Modules.";const els=document.getElementById("rpgElementsModuleStatus");if(els)els.innerHTML=(cfg.gameplay?.modules?.elements?"✅ Éléments activés":"⛔ Éléments désactivés")+" · change ce choix dans Style & Modules.";setTimeout(renderRpgEconomyVisibility,0);set("rpgCritPctPerPoint",cfg.combat.critPercentPerPoint||0);set("rpgDodgeFormula",cfg.combat.dodgeFormula||"step");set("rpgDodgePctPerPoint",cfg.combat.dodgePercentPerPoint||0);set("rpgInitiativeFormula","direct");set("rpgInitiativePerPoint",0);set("rpgMagicResistFormula",cfg.combat.magicResistFormula||"step");set("rpgMagicResistPerPoint",cfg.combat.magicResistPerPoint||0);set("rpgRulesComplexity",cfg.combat.rulesComplexity||"simple");set("rpgInitiativeUsage",cfg.combat.initiativeUsage||"tests");set("rpgInitiativeTurnMode",cfg.combat.initiativeTurnMode||"fixed");set("rpgInitiativeDie",String(cfg.combat.initiativeDie||20));set("rpgTestsEnabled",String(cfg.combat.testsEnabled!==false));set("rpgTestDie",String(cfg.combat.testDie||20));set("rpgTestDefaultDifficulty",Number(cfg.combat.testDefaultDifficulty)||10);renderRpgInitiativeOptions();
  const mv=cfg.movement||gensBlankRpgSettings().movement;
  set("rpgMovementUnit",mv.unit||"case");set("rpgMovementCustomUnit",mv.customUnit||"");set("rpgMovementMode",mv.mode||"narrative");set("rpgMovementRefreshMode",mv.refreshMode||"turn");set("rpgCombatParticipationRange",Number.isFinite(Number(mv.combatParticipationRange))?Math.max(0,Number(mv.combatParticipationRange)):3);
  [["rpgMoveHeroes","heroes"],["rpgMoveCreatures","creatures"],["rpgMoveEnemies","enemies"],["rpgMoveCompanions","companions"]].forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.checked=mv.entities?.[k]!==false});
  set("rpgMoveHeroValue",mv.defaults?.hero??3);set("rpgMoveCreatureValue",mv.defaults?.creature??1);set("rpgMoveEnemyValue",mv.defaults?.enemy??1);set("rpgMoveCompanionValue",mv.defaults?.companion??3);
  const cc=cfg.captureCombat||gensBlankRpgSettings().captureCombat,tc=cfg.trainerCombat||{},pv=cfg.pvp||{};
  set("rpgCaptureActiveSlots",Math.max(1,Math.min(3,Number(cc.activeSlots)||1)));
  set("rpgCaptureTeamSize",Math.max(1,Number(cc.teamSize)||6));
  set("rpgCaptureRecallCost",cc.recallCost||"turn");
  set("rpgCaptureMinBattleTeam",Math.max(1,Number(cc.minBattleTeam)||3));
  set("rpgCaptureMaxBattleTeam",Math.max(1,Number(cc.maxBattleTeam)||6));
  set("rpgCaptureController",cc.controller||"auto");
  set("rpgCaptureItemSlots",Math.max(0,Number(cc.itemSlots)??4));
  set("rpgCaptureItemsPerTurn",Math.max(0,Number(cc.itemsPerTurn)??1));
  set("rpgCaptureVictoryMode",cc.victoryMode||"all_ko");
  set("rpgCaptureHealMode",cc.healMode||"free");
  set("rpgCaptureHealCost",Math.max(0,Number(cc.healCost)||20));
  const arko=document.getElementById("rpgCaptureAutoReplaceKo");if(arko)arko.checked=cc.autoReplaceKo!==false;
  const abo=document.getElementById("rpgCaptureAllowBattleOverride");if(abo)abo.checked=cc.allowBattleOverride!==false;
  const ia=document.getElementById("rpgCaptureItemsAllowed");if(ia)ia.checked=cc.itemsAllowed!==false;
  const da=document.getElementById("rpgCaptureDefendAllowed");if(da)da.checked=cc.defendAllowed!==false;
  const sb=document.getElementById("rpgCaptureSaveBattle");if(sb)sb.checked=cc.saveBattle!==false;
  [["rpgTrainerBattlesEnabled",!!tc.enabled],["rpgTrainerCaptureAllowed",!!tc.captureOpponent],["rpgPvpEnabled",!!pv.enabled],["rpgPvpRewards",!!pv.rewards],["rpgPvpItemLoss",!!pv.itemLoss],["rpgPvpPermadeath",!!pv.permadeath]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.checked=v});
  set("rpgTrainerGoldReward",tc.goldReward??0);
  renderRpgMovementCustomUnit();renderRpgEncounterLocations();
  renderRpgElementsEditor();
  set("rpgTalentSlots",cfg.talents.slots);set("rpgTalentRequired",String(cfg.talents.required!==false));
  set("rpgChestTrapChance",cfg.exploration.chestTrapChance);set("rpgLootEnabled",String(cfg.exploration.lootEnabled!==false));set("rpgTrapBaseDifficulty",cfg.exploration.trapBaseDifficulty);set("rpgRoundEvents",String(cfg.exploration.roundEvents!==false));
  set("rpgEventTrigger",cfg.exploration.eventTrigger||"round");set("rpgEventChance",cfg.exploration.eventChance??35);set("rpgEventRepeats",String(cfg.exploration.eventRepeats!==false));
  set("rpgEmptyChestChance",cfg.exploration.emptyChestChance??0);set("rpgChestItemCount",cfg.exploration.chestItemCount??1);
  set("rpgTrapDetection",String(cfg.exploration.trapDetection!==false));set("rpgTrapDetectionStat",cfg.exploration.trapDetectionStat||"agilite");set("rpgTrapDetectionBase",cfg.exploration.trapDetectionBase??50);set("rpgTrapDetectionRadius",cfg.exploration.trapDetectionRadius??2);set("rpgTrapDetectionStatGain",cfg.exploration.trapDetectionStatGain??2);set("rpgTrapDetectionOnce",String(cfg.exploration.trapDetectionOnce!==false));set("rpgEnemyDetection",String(cfg.exploration.enemyDetection!==false));set("rpgEnemyDetectionRadius",cfg.exploration.enemyDetectionRadius??2);set("rpgEnemyDetectionShowZones",String(cfg.exploration.enemyDetectionShowZones!==false));set("rpgEnemyDetectionAutoCombat",String(cfg.exploration.enemyDetectionAutoCombat!==false));
  set("rpgSecretChance",cfg.exploration.secretChance??0);set("rpgRestEnabled",String(cfg.exploration.restEnabled!==false));set("rpgRestHeal",cfg.exploration.restHeal??0);set("rpgRestMana",cfg.exploration.restMana??0);
  set("rpgExplorationTags",(cfg.exploration.activeTags||[]).join(", "));
  renderRpgEventLibrary();

  const statsHost=document.getElementById("rpgStatsList");
  if(statsHost){
    const labels={force:"Force",agility:"Agilité",intelligence:"Intelligence",spirit:"Esprit",endurance:"Endurance",initiative:"Initiative"};
    statsHost.innerHTML=Object.entries(labels).map(([id,label])=>'<label class="smodPoolRow"><input type="checkbox" value="'+id+'" '+(cfg.stats.active.includes(id)?"checked":"")+'><span>'+label+'</span></label>').join("");
  }
  renderRpgUniversePools(p);
}

function renderRpgUniversePools(p){
  applyCustomHeroesMulti();
  const heroAllowed=new Set((p.heroPool||[]).map(String).filter(gensHeroCompatibleWithCurrentFamily)),itemAllowed=new Set((p.objectPool||[]).map(String)),enemyAllowed=new Set(Object.keys(p.enemyConfig||{}).map(String));
  const hh=document.getElementById("rpgHeroPool");if(hh){
    const ids=currentAllHeroIds().filter(id=>gensHeroCompatibleWithCurrentFamily(id));
    const builtin=ids.filter(id=>typeof DUNGEON_HERO_IDS!=="undefined"&&DUNGEON_HERO_IDS.includes(String(id)));
    const custom=ids.filter(id=>!builtin.includes(id));

    let html="";
    if(builtin.length){
      html+='<div class="small" style="font-weight:900;margin:5px 0">⚔️ Héros RPG intégrés</div>';
      html+=builtin.map(id=>'<label class="smodPoolRow"><input type="checkbox" value="'+z40kEscAttr(id)+'" '+(heroAllowed.has(String(id))?"checked":"")+'><span>'+z40kEscHtml(CHARS[id]?.name||id)+'</span></label>').join("");
    }
    if(custom.length){
      html+='<div class="small" style="font-weight:900;margin:8px 0 5px">👤 Bibliothèque '+z40kEscHtml(gensContentFamilyLabel())+'</div>';
      html+=custom.map(id=>'<label class="smodPoolRow"><input type="checkbox" value="'+z40kEscAttr(id)+'" '+(heroAllowed.has(String(id))?"checked":"")+'><span>'+z40kEscHtml(CHARS[id]?.name||findCustomHero(id)?.name||id)+'</span></label>').join("");
    }
    hh.innerHTML=html||'<div class="empty">Aucun héros compatible avec ce type de gameplay.</div>';
  }
  const ih=document.getElementById("rpgItemPool");if(ih){
    const items=itemsForMode(true);ih.innerHTML=items.map(it=>'<label class="smodPoolRow"><input type="checkbox" value="'+z40kEscAttr(it.id)+'" '+(itemAllowed.has(String(it.id))?"checked":"")+'><span>'+z40kEscHtml(it.name||it.id)+'</span></label>').join("")||'<div class="empty">Aucun objet RPG disponible.</div>';
  }
  const eh=document.getElementById("rpgEnemyPool");if(eh){
    const enemies=enemiesForMode(true);eh.innerHTML=enemies.map(e=>'<label class="smodPoolRow"><input type="checkbox" value="'+z40kEscAttr(e.id)+'" '+(enemyAllowed.has(String(e.id))?"checked":"")+'><span>'+z40kEscHtml(e.name||e.id)+'</span></label>').join("")||'<div class="empty">Aucun monstre RPG disponible.</div>';
  }
}

function checkedRpgPool(id){return [...document.querySelectorAll("#"+id+" input[type=checkbox]:checked")].map(x=>String(x.value))}

function renderRpgElementsEditor(){
  const p=currentRpgProfile();if(!p)return;ensureRpgProfileData(p);if(!rpgElementDraft)rpgElementDraft=JSON.parse(JSON.stringify(gensNormalizeElementSettings(p.rpgUniverse.elements)));
  rpgElementDraft.enabled=!!currentRpgProfile()?.rpgUniverse?.gameplay?.modules?.elements;
  const list=document.getElementById("rpgElementsList"),matrix=document.getElementById("rpgElementMatrix");if(!list||!matrix)return;
  list.innerHTML=(rpgElementDraft.elements||[]).map((e,i)=>'<div class="smodGrid" data-element-row="'+i+'"><label>Icône<input class="rpgElIcon" maxlength="8" value="'+z40kEscAttr(e.icon||'◈')+'"></label><label>Nom<input class="rpgElName" maxlength="30" value="'+z40kEscAttr(e.name||'Élément')+'"></label><button type="button" class="danger" onclick="removeRpgElementEditorRow('+i+')">🗑</button></div>').join('');
  const els=rpgElementDraft.elements||[];let h='<table style="border-collapse:collapse;min-width:100%"><tr><th style="padding:5px">ATQ ↓ / CIBLE →</th>'+els.map(e=>'<th style="padding:5px">'+z40kEscHtml((e.icon||'◈')+' '+e.name)+'</th>').join('')+'</tr>';
  els.forEach(a=>{h+='<tr><th style="padding:5px;text-align:left">'+z40kEscHtml((a.icon||'◈')+' '+a.name)+'</th>';els.forEach(d=>{const v=Number(rpgElementDraft.matrix?.[a.id]?.[d.id]);h+='<td style="padding:4px"><input data-atk="'+z40kEscAttr(a.id)+'" data-def="'+z40kEscAttr(d.id)+'" class="rpgElMult" type="number" min="0" max="10" step="0.25" value="'+(Number.isFinite(v)?v:1)+'" style="width:72px"></td>'});h+='</tr>'});h+='</table>';matrix.innerHTML=h;
  list.querySelectorAll('input').forEach(x=>x.addEventListener('change',syncRpgElementDraftFromUi));matrix.querySelectorAll('input').forEach(x=>x.addEventListener('change',syncRpgElementDraftFromUi));
}

function syncRpgElementDraftFromUi(){
  if(!rpgElementDraft)return;rpgElementDraft.enabled=document.getElementById('rpgElementsEnabled')?.value==='true';
  [...document.querySelectorAll('#rpgElementsList [data-element-row]')].forEach((row,i)=>{const e=rpgElementDraft.elements[i];if(!e)return;e.name=row.querySelector('.rpgElName')?.value.trim()||e.name;e.icon=row.querySelector('.rpgElIcon')?.value.trim()||'◈'});
  document.querySelectorAll('#rpgElementMatrix .rpgElMult').forEach(x=>{const a=x.dataset.atk,d=x.dataset.def;rpgElementDraft.matrix[a]=rpgElementDraft.matrix[a]||{};rpgElementDraft.matrix[a][d]=Math.max(0,Math.min(10,Number(x.value)||0))});
}

function addRpgElementEditorRow(){
  syncRpgElementDraftFromUi();
  if(!rpgElementDraft){const p=currentRpgProfile();rpgElementDraft=JSON.parse(JSON.stringify(gensNormalizeElementSettings(p?.rpgUniverse?.elements)))}
  const ids=new Set((rpgElementDraft.elements||[]).map(e=>String(e.id)));
  let n=1,id="element";
  while(ids.has(id))id="element_"+(++n);
  rpgElementDraft.elements.push({id,name:"Nouvel élément",icon:"◈"});
  renderRpgElementsEditor();
}

function removeRpgElementEditorRow(i){
  syncRpgElementDraftFromUi();
  if(!rpgElementDraft?.elements?.[i])return;
  const id=rpgElementDraft.elements[i].id;
  rpgElementDraft.elements.splice(i,1);
  delete rpgElementDraft.matrix[id];
  Object.values(rpgElementDraft.matrix||{}).forEach(row=>{if(row)delete row[id]});
  renderRpgElementsEditor();
  try{gensRefreshDynamicTagSelects()}catch(e){}
}

function validateRpgElementsDraft(){
  syncRpgElementDraftFromUi();
  if(!rpgElementDraft)return;
  const els=(rpgElementDraft.elements||[]).filter(e=>String(e.name||"").trim());
  rpgElementDraft.elements=els;
  rpgElementDraft.matrix=rpgElementDraft.matrix||{};
  const ids=new Set(els.map(e=>String(e.id)));
  Object.keys(rpgElementDraft.matrix).forEach(a=>{if(!ids.has(String(a)))delete rpgElementDraft.matrix[a]});
  els.forEach(a=>{
    rpgElementDraft.matrix[a.id]=rpgElementDraft.matrix[a.id]||{};
    Object.keys(rpgElementDraft.matrix[a.id]).forEach(b=>{if(!ids.has(String(b)))delete rpgElementDraft.matrix[a.id][b]});
    els.forEach(b=>{
      if(rpgElementDraft.matrix[a.id][b.id]===undefined)rpgElementDraft.matrix[a.id][b.id]=1;
    });
  });
  renderRpgElementsEditor();
}

function saveRpgUniverseElements(){
  syncRpgElementDraftFromUi();const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);p.rpgUniverse.elements=gensNormalizeElementSettings(rpgElementDraft);p.rpgUniverse.elements.enabled=!!p.rpgUniverse.gameplay?.modules?.elements;saveGameProfiles(profiles);applyGameProfile(p,false);rpgElementDraft=JSON.parse(JSON.stringify(p.rpgUniverse.elements));renderRpgElementsEditor();gensRefreshElementUi();try{gensRefreshDynamicTagSelects()}catch(e){};alert('Éléments enregistrés ✅')
}

function renderRpgEconomyVisibility(){
  const p=currentRpgProfile?.();const on=!!p?.rpgUniverse?.gameplay?.modules?.economy;
  ["rpgEconomyFields","rpgEconomyTradeCard","rpgEconomyDropCard"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.opacity=on?"1":".38"});
}

function saveRpgUniverseEconomy(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;
  const p=profiles[i];ensureRpgProfileData(p);const e=p.rpgUniverse.economy;
  e.enabled=!!p.rpgUniverse.gameplay?.modules?.economy;
  e.currencyName=(document.getElementById("rpgCurrencyName")?.value||"Or").trim()||"Or";
  e.currencyIcon=(document.getElementById("rpgCurrencyIcon")?.value||"🪙").trim()||"🪙";
  e.startingGold=Math.max(0,Number(document.getElementById("rpgStartingGold")?.value)||0);
  e.sellPercent=Math.max(0,Number(document.getElementById("rpgSellPercent")?.value)||0);
  e.merchantBuyMultiplier=Math.max(0,Number(document.getElementById("rpgMerchantBuyMultiplier")?.value)||1);
  e.merchantStockLimits={weapons:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockWeapons")?.value)||0))),equipment:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockEquipment")?.value)||0))),consumables:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockConsumables")?.value)||0))),other:Math.max(0,Math.min(999,Math.round(Number(document.getElementById("rpgMerchantStockOther")?.value)||0)))};
  e.enemyGoldEnabled=document.getElementById("rpgEnemyGoldEnabled")?.value!=="false";
  e.merchantEventEnabled=document.getElementById("rpgMerchantEventEnabled")?.value!=="false";
  saveGameProfiles(profiles);applyGameProfile(p,false);renderRpgUniverseEditor();alert("Économie enregistrée ✅");
}

function saveRpgUniverseIdentity(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);
  p.name=document.getElementById("rpgName")?.value.trim()||"Univers RPG";p.desc=document.getElementById("rpgDesc")?.value.trim()||"";p.rpgUniverse.icon=document.getElementById("rpgIcon")?.value.trim()||"🧭";p.rpgUniverse.themeColor=document.getElementById("rpgThemeColor")?.value||"#4e5968";
  saveGameProfiles(profiles);setActiveGameProfileId(p.id);rpgEditingId=p.id;gensSelectedFamily=gensContentFamilyForProfile(p)==="creature"?"capture":"adventure";applyGameProfile(p,false);rpgEditingId=p.id;renderRpgUniverseEditor();renderGensFamilyGamesIfVisible();alert("Univers RPG enregistré ✅");
}

function saveRpgUniverseProgression(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;
  const p=profiles[i];ensureRpgProfileData(p);const x=p.rpgUniverse.progression;
  x.xpCurveMode=document.getElementById("rpgXpCurveMode")?.value==="custom"?"custom":"linear";
  x.xpPerLevel=Math.max(1,Number(document.getElementById("rpgXpPerLevel")?.value)||10);
  x.maxLevel=Math.max(1,Math.min(999,Number(document.getElementById("rpgMaxLevel")?.value)||100));
  x.startingSkillPoints=Math.max(0,Number(document.getElementById("rpgStartingSkillPoints")?.value)||0);
  x.talentPointsPerLevel=Math.max(0,Number(document.getElementById("rpgTalentPointsPerLevel")?.value)||0);
  x.startingStatPoints=Math.max(0,Number(document.getElementById("rpgStartingStatPoints")?.value)||0);
  x.statPointsPerLevel=Math.max(0,Number(document.getElementById("rpgStatPointsPerLevel")?.value)||0);
  x.attributeEditMode=document.getElementById("rpgAttributeEditMode")?.value==="free"?"free":"points";
  x.levelUpRestore=["health","health_mana"].includes(document.getElementById("rpgLevelUpRestore")?.value)?document.getElementById("rpgLevelUpRestore").value:"none";
  x.weaponSwitchCost=document.getElementById("rpgWeaponSwitchCost")?.value==="turn"?"turn":"free";
  if(x.xpCurveMode==="custom"){
    const thresholds={1:0};let prev=0;
    for(let lv=2;lv<=x.maxLevel;lv++){
      const el=document.getElementById("rpgXpThreshold_"+lv);
      const fallback=(lv-1)*x.xpPerLevel;
      const v=Math.max(prev+1,Number(el?.value)||fallback);
      thresholds[lv]=v;prev=v;
    }
    x.xpThresholds=thresholds;
  }else x.xpThresholds={};
  x.keepXp=document.getElementById("rpgKeepXp")?.value==="true";
  x.keepGear=document.getElementById("rpgKeepGear")?.value==="true";
  x.permadeath=document.getElementById("rpgPermadeath")?.value==="true";
  saveGameProfiles(profiles);syncRpgUniverseToDungeonRules(p);applyGameProfile(p,false);
  renderRpgHeroProgressionCurve();
  alert("Progression des héros enregistrée ✅");
}

function saveRpgUniverseStats(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);const x=p.rpgUniverse.stats;
  x.active=[...document.querySelectorAll("#rpgStatsList input:checked")].map(e=>e.value);x.baseHp=Math.max(1,Number(document.getElementById("rpgBaseHp")?.value)||3);x.hpPer10Endurance=Math.max(0,Number(document.getElementById("rpgHpPer10End")?.value)||0);x.baseMana=Math.max(0,Number(document.getElementById("rpgBaseMana")?.value)||0);x.manaPer10Spirit=Math.max(0,Number(document.getElementById("rpgManaPer10Spirit")?.value)||0);
  saveGameProfiles(profiles);syncRpgUniverseToDungeonRules(p);applyGameProfile(p,false);alert("Stats RPG enregistrées ✅");
}

function rpgRulesPresetDescription(style){
  const d={
    simple:"🎲 Simple : l’Initiative sert surtout aux tests et réactions (pièges, esquive, perception d’un danger). Aucun ordre de tour automatique n’est imposé.",
    tactical:"⚔️ Tactique : l’Initiative détermine l’ordre des tours et peut aussi servir aux tests/réactions. Idéal pour un combat structuré.",
    rpg:"📖 JDR : priorité aux tests de caractéristiques et aux réactions. L’ordre des tours reste libre par défaut pour laisser le maître de jeu ou les joueurs décider.",
    custom:"🛠️ Personnalisé : aucun réglage n’est imposé. Tu choisis toi-même l’usage de l’Initiative, l’ordre des tours et les jets."
  };
  return d[style]||d.simple;
}

function applyRpgRulesPreset(style){
  const usage=document.getElementById("rpgInitiativeUsage"),turnMode=document.getElementById("rpgInitiativeTurnMode"),tests=document.getElementById("rpgTestsEnabled"),die=document.getElementById("rpgTestDie"),diff=document.getElementById("rpgTestDefaultDifficulty");
  if(style==="simple"){if(usage)usage.value="tests";if(tests)tests.value="true";if(die)die.value="20";if(diff)diff.value=10;}
  else if(style==="tactical"){if(usage)usage.value="both";if(turnMode)turnMode.value="fixed";if(tests)tests.value="true";if(die)die.value="20";if(diff)diff.value=10;}
  else if(style==="rpg"){if(usage)usage.value="tests";if(tests)tests.value="true";if(die)die.value="20";if(diff)diff.value=12;}
  renderRpgInitiativeOptions();
}

function renderRpgInitiativeOptions(){
  const usage=document.getElementById("rpgInitiativeUsage")?.value||"tests";
  const style=document.getElementById("rpgRulesComplexity")?.value||"simple";
  const turn=document.getElementById("rpgInitiativeTurnOptions"),tests=document.getElementById("rpgUniversalTestOptions"),die=document.getElementById("rpgInitiativeDieRow"),help=document.getElementById("rpgRulesPresetHelp");
  if(help)help.textContent=rpgRulesPresetDescription(style);
  if(turn)turn.style.display=(usage==="turns"||usage==="both"||usage==="custom")?"grid":"none";
  if(tests)tests.style.display=(usage==="tests"||usage==="both"||usage==="custom")?"block":"none";
  if(die)die.style.display=((usage==="turns"||usage==="both"||usage==="custom")&&document.getElementById("rpgInitiativeTurnMode")?.value==="die")?"block":"none";
}

function saveRpgUniverseCombat(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);const x=p.rpgUniverse.combat;
  x.baseHit=Math.max(0,Math.min(100,Number(document.getElementById("rpgBaseHit")?.value)||0));x.minHit=Math.max(0,Math.min(100,Number(document.getElementById("rpgMinHit")?.value)||0));x.maxHit=Math.max(0,Math.min(100,Number(document.getElementById("rpgMaxHit")?.value)||100));x.critMultiplier=Math.max(1,Number(document.getElementById("rpgCritMultiplier")?.value)||2);x.critCap=Math.max(0,Math.min(100,Number(document.getElementById("rpgCritCap")?.value)||100));x.minPhysicalDamage=Math.max(0,Number(document.getElementById("rpgMinPhysicalDamage")?.value)||0);x.minMagicDamage=Math.max(0,Number(document.getElementById("rpgMinMagicDamage")?.value)||0);
  x.physicalDamageFormula=document.getElementById("rpgPhysicalFormula")?.value||"step";x.physicalDamagePercentPerPoint=Math.max(0,Number(document.getElementById("rpgPhysicalPctPerPoint")?.value)||0);x.magicDamageFormula=document.getElementById("rpgMagicFormula")?.value||"step";x.magicDamagePercentPerPoint=Math.max(0,Number(document.getElementById("rpgMagicPctPerPoint")?.value)||0);x.rangedDamageFormula=document.getElementById("rpgRangedFormula")?.value||"none";x.rangedDamagePercentPerPoint=Math.max(0,Number(document.getElementById("rpgRangedPctPerPoint")?.value)||0);x.hpFormula=document.getElementById("rpgHpFormula")?.value||"step";x.hpPercentPerPoint=Math.max(0,Number(document.getElementById("rpgHpPctPerPoint")?.value)||0);x.manaFormula=document.getElementById("rpgManaFormula")?.value||"step";x.manaPercentPerPoint=Math.max(0,Number(document.getElementById("rpgManaPctPerPoint")?.value)||0);x.critFormula=document.getElementById("rpgCritFormula")?.value||"step";x.critPercentPerPoint=Math.max(0,Number(document.getElementById("rpgCritPctPerPoint")?.value)||0);x.dodgeFormula=document.getElementById("rpgDodgeFormula")?.value||"step";x.dodgePercentPerPoint=Math.max(0,Number(document.getElementById("rpgDodgePctPerPoint")?.value)||0);x.initiativeFormula="direct";x.initiativePerPoint=0;x.magicResistFormula=document.getElementById("rpgMagicResistFormula")?.value||"step";x.magicResistPerPoint=Math.max(0,Number(document.getElementById("rpgMagicResistPerPoint")?.value)||0);x.rulesComplexity=document.getElementById("rpgRulesComplexity")?.value||"simple";x.initiativeUsage=document.getElementById("rpgInitiativeUsage")?.value||"tests";x.initiativeTurnMode=document.getElementById("rpgInitiativeTurnMode")?.value||"fixed";x.initiativeDie=Number(document.getElementById("rpgInitiativeDie")?.value)||20;x.testsEnabled=document.getElementById("rpgTestsEnabled")?.value!=="false";x.testDie=Number(document.getElementById("rpgTestDie")?.value)||20;x.testDefaultDifficulty=Math.max(1,Number(document.getElementById("rpgTestDefaultDifficulty")?.value)||10);
  saveGameProfiles(profiles);applyGameProfile(p,false);syncRpgUniverseCombatToDungeonRules(p);alert("Combat RPG enregistré ✅");
}

function saveRpgUniverseTalents(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);p.rpgUniverse.talents.slots=Math.max(1,Number(document.getElementById("rpgTalentSlots")?.value)||24);p.rpgUniverse.talents.required=document.getElementById("rpgTalentRequired")?.value==="true";saveGameProfiles(profiles);applyGameProfile(p,false);alert("Talents RPG enregistrés ✅");
}

function saveRpgUniverseExploration(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);const x=p.rpgUniverse.exploration;
  const pct=id=>Math.max(0,Math.min(100,Number(document.getElementById(id)?.value)||0));
  const num=(id,d=0)=>Math.max(0,Number(document.getElementById(id)?.value)||d);
  x.chestTrapChance=pct("rpgChestTrapChance");x.lootEnabled=document.getElementById("rpgLootEnabled")?.value==="true";
  x.emptyChestChance=pct("rpgEmptyChestChance");x.chestItemCount=Math.max(0,Math.round(num("rpgChestItemCount",1)));
  x.trapBaseDifficulty=pct("rpgTrapBaseDifficulty");x.trapDetection=document.getElementById("rpgTrapDetection")?.value==="true";
  x.trapDetectionStat=document.getElementById("rpgTrapDetectionStat")?.value||"agilite";x.trapDetectionBase=pct("rpgTrapDetectionBase");x.trapDetectionRadius=Math.max(1,Math.round(num("rpgTrapDetectionRadius",2)));x.trapDetectionStatGain=num("rpgTrapDetectionStatGain",2);x.trapDetectionOnce=document.getElementById("rpgTrapDetectionOnce")?.value!=="false";x.enemyDetection=document.getElementById("rpgEnemyDetection")?.value!=="false";x.enemyDetectionRadius=Math.max(1,Math.round(num("rpgEnemyDetectionRadius",2)));x.enemyDetectionShowZones=document.getElementById("rpgEnemyDetectionShowZones")?.value!=="false";x.enemyDetectionAutoCombat=document.getElementById("rpgEnemyDetectionAutoCombat")?.value!=="false";
  x.roundEvents=document.getElementById("rpgRoundEvents")?.value==="true";x.eventTrigger=["room","round","both","manual"].includes(document.getElementById("rpgEventTrigger")?.value)?document.getElementById("rpgEventTrigger").value:"room";
  x.eventChance=pct("rpgEventChance");x.eventRepeats=document.getElementById("rpgEventRepeats")?.value==="true";
  x.secretChance=pct("rpgSecretChance");x.restEnabled=document.getElementById("rpgRestEnabled")?.value==="true";
  x.restHeal=num("rpgRestHeal");x.restMana=num("rpgRestMana");
  x.activeTags=String(document.getElementById("rpgExplorationTags")?.value||"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
  saveGameProfiles(profiles);applyGameProfile(p,false);syncRpgUniverseExplorationToDungeon(p);renderRpgEventLibrary();alert("Exploration RPG enregistrée ✅");
}

function renderRpgEventLibrary(){
  const h=document.getElementById("rpgEventLibrary");if(!h)return;
  const {exploration:x}=activeRpgExplorationConfig();
  const events=Array.isArray(x.events)?x.events:[];
  h.innerHTML=events.map(e=>{
    const effect=e.effect?.kind||"none",tags=(e.tags||[]).join(", ");
    return `<button type="button" class="smodPoolRow" style="text-align:left;width:100%" onclick="openRpgEventEditor('${z40kEscAttr(e.id)}')">
      <span style="font-size:22px">${z40kEscHtml(e.icon||"🎲")}</span><span style="flex:1"><strong>${z40kEscHtml(e.name||"Événement")}</strong><br>
      <small>${z40kEscHtml((e.enabled===false?"INACTIF · ":"")+(e.category||"narrative")+" · fréquence "+(e.weight??10)+" · effet "+effect+(tags?" · "+tags:""))}</small></span></button>` 
  }).join("")||'<div class="empty">Aucun événement. Crée le premier événement de cet univers.</div>';
}

function openRpgEventEditor(id=null){
  const {exploration:x}=activeRpgExplorationConfig();
  const e=id?(x.events||[]).find(v=>String(v.id)===String(id)):null;
  const set=(k,v)=>{const el=document.getElementById(k);if(el)el.value=v??""};
  set("rpgEventId",e?.id||"");set("rpgEventName",e?.name||"");set("rpgEventIcon",e?.icon||"🎲");
  set("rpgEventCategory",e?.category||"narrative");set("rpgEventEnabled",String(e?.enabled!==false));
  set("rpgEventWeight",e?.weight??10);set("rpgEventMinRound",e?.minRound??1);set("rpgEventMaxRound",e?.maxRound??0);
  set("rpgEventTags",(e?.tags||[]).join(", "));set("rpgEventText",e?.text||"");
  set("rpgEventEffectKind",e?.effect?.kind||"none");set("rpgEventEffectValue",e?.effect?.qty??e?.effect?.value??1);
  const del=document.getElementById("rpgEventDeleteBtn");if(del)del.style.display=e?"":"none";
  refreshRpgEventEffectHelp();
  const m=document.getElementById("rpgEventEditorModal");if(m)m.style.display="flex";
}

function closeRpgEventEditor(){const m=document.getElementById("rpgEventEditorModal");if(m)m.style.display="none"}

function refreshRpgEventEffectHelp(){
  const k=document.getElementById("rpgEventEffectKind")?.value||"none",h=document.getElementById("rpgEventEffectHelp");
  if(!h)return;
  h.textContent=k==="spawn"?"Valeur = nombre d’ennemis à faire apparaître."
    :k==="damageRandom"?"Valeur = blessures infligées à un héros aléatoire."
    :k==="healRandom"?"Valeur = blessures soignées sur un héros aléatoire."
    :k==="loot"?"La valeur n’est pas utilisée : un objet aléatoire est donné."
    :"Aucun effet mécanique : le texte sert au role-play / plateau.";
}

function saveRpgEventFromEditor(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;
  const p=profiles[i];ensureRpgProfileData(p);const x=p.rpgUniverse.exploration;if(!Array.isArray(x.events))x.events=[];
  let id=document.getElementById("rpgEventId")?.value||"",e=id?x.events.find(v=>String(v.id)===String(id)):null;
  if(!e){e={id:rpgEventId()};x.events.push(e)}
  const n=(id,d=0)=>Number(document.getElementById(id)?.value)||d;
  e.name=document.getElementById("rpgEventName")?.value.trim()||"Nouvel événement";e.icon=document.getElementById("rpgEventIcon")?.value.trim()||"🎲";
  e.category=document.getElementById("rpgEventCategory")?.value||"narrative";e.enabled=document.getElementById("rpgEventEnabled")?.value==="true";
  e.weight=Math.max(0,n("rpgEventWeight",10));e.minRound=Math.max(1,n("rpgEventMinRound",1));e.maxRound=Math.max(0,n("rpgEventMaxRound",0));
  e.tags=String(document.getElementById("rpgEventTags")?.value||"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
  e.text=document.getElementById("rpgEventText")?.value.trim()||"";
  const kind=document.getElementById("rpgEventEffectKind")?.value||"none",val=Math.max(0,n("rpgEventEffectValue",1));
  e.effect=kind==="spawn"?{kind,qty:Math.max(1,Math.round(val||1))}:kind==="loot"?{kind}:{kind,value:val};
  saveGameProfiles(profiles);applyGameProfile(p,false);closeRpgEventEditor();renderRpgEventLibrary();
}

function deleteRpgEventFromEditor(){
  const id=document.getElementById("rpgEventId")?.value;if(!id)return;
  if(!confirm("Supprimer cet événement ?"))return;
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;
  const p=profiles[i];ensureRpgProfileData(p);p.rpgUniverse.exploration.events=(p.rpgUniverse.exploration.events||[]).filter(e=>String(e.id)!==String(id));
  saveGameProfiles(profiles);applyGameProfile(p,false);closeRpgEventEditor();renderRpgEventLibrary();
}

function saveRpgUniversePools(){
  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(rpgEditingId));if(i<0)return;const p=profiles[i];ensureRpgProfileData(p);
  p.heroPool=checkedRpgPool("rpgHeroPool");p.objectPool=checkedRpgPool("rpgItemPool");const enemyIds=checkedRpgPool("rpgEnemyPool"),oldCfg=p.enemyConfig||{},oldRes=p.enemyReserve||{};p.enemyConfig={};p.enemyReserve={};
  enemyIds.forEach(id=>{const def=enemiesForMode(true).find(e=>String(e.id)===String(id));p.enemyConfig[id]=Math.max(0,Number(oldCfg[id]??def?.defaultCount??0)||0);p.enemyReserve[id]=Math.max(0,Number(oldRes[id]??p.enemyConfig[id])||0)});
  saveGameProfiles(profiles);applyGameProfile(p,false);renderRpgUniverseEditor();alert("Pools RPG enregistrés ✅");
}
