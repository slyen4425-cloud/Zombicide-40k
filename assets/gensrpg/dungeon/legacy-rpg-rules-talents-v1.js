/* GenSrpG — Phase12 R12 : fonctions Dungeon RPG règles, progression et talents.
 * Source R11 certifiée, déclarations d’origine conservées à l’octet.
 * Propriétaire unique : Dungeon. Chargement classique synchrone juste avant l’ancien grand script.
 * Ni bibliothèque générique des capacités, ni autorité Core, ni logique des autres modules déplacée.
 */
function defaultDungeonRpgRules(){
  return {
    xpPerLevel:10,skillPointsPerLevel:1,startingSkillPoints:0,
    physicalDamageStep:10,physicalDamageGain:1,
    physicalDamageFormula:"step",physicalDamagePercentPerPoint:0,
    magicDamageStep:10,magicDamageGain:1,
    magicDamageFormula:"step",magicDamagePercentPerPoint:0,
    rangedDamageFormula:"none",rangedDamagePercentPerPoint:0,
    hpFormula:"step",hpPercentPerPoint:0,
    manaFormula:"step",manaPercentPerPoint:0,
    critFormula:"step",critPercentPerPoint:0,
    dodgeFormula:"step",dodgePercentPerPoint:0,
    initiativeFormula:"step",initiativePerPoint:0,
    rulesComplexity:"simple",initiativeUsage:"tests",initiativeTurnMode:"fixed",initiativeDie:20,testsEnabled:true,testDie:20,testDefaultDifficulty:10,
    magicResistFormula:"step",magicResistPerPoint:0,
    meleeHitStep:10,meleeHitGain:5,
    rangedHitStep:10,rangedHitGain:5,
    magicHitStep:10,magicHitGain:5,
    basicAttackBaseChance:50,
    baseMana:0,spiritManaStep:10,manaGain:10,magicAttackManaCost:1,
    baseCrit:0,agilityCritStep:10,critGain:5,critCap:50,critMultiplier:2,
    baseDodge:0,agilityDodgeStep:10,dodgeGain:3,dodgeCap:40,
    baseInitiative:0,agilityInitiativeStep:9999,initiativeGain:0,
    enduranceHpStep:10,hpGain:2,
    defensePenaltyPerPoint:1,hitChanceMin:5,hitChanceMax:95,
    armorReductionStep:2,armorReductionGain:1,minPhysicalDamage:1,armorZeroBlockChance:75,
    spiritMagicResistStep:20,magicResistGain:1,minMagicDamage:1
  };
}

function normalizeDungeonRpgRules(r){
  const d=defaultDungeonRpgRules(),o={...d,...(r||{})};
  const pos=(k,min=1,max=9999)=>o[k]=Math.max(min,Math.min(max,Number(o[k])||d[k]));
  const non=(k,max=9999)=>o[k]=Math.max(0,Math.min(max,Number(o[k])||0));
  pos("xpPerLevel");non("skillPointsPerLevel",99);non("startingSkillPoints",99);
  pos("physicalDamageStep");non("physicalDamageGain",99);
  o.physicalDamageFormula=o.physicalDamageFormula==="percent"?"percent":"step";non("physicalDamagePercentPerPoint",100);
  pos("magicDamageStep");non("magicDamageGain",99);
  o.magicDamageFormula=o.magicDamageFormula==="percent"?"percent":"step";non("magicDamagePercentPerPoint",100);
  o.rangedDamageFormula=o.rangedDamageFormula==="percent"?"percent":"none";non("rangedDamagePercentPerPoint",100);
  o.hpFormula=o.hpFormula==="percent"?"percent":"step";non("hpPercentPerPoint",100);
  o.manaFormula=o.manaFormula==="percent"?"percent":"step";non("manaPercentPerPoint",100);
  o.critFormula=o.critFormula==="perPoint"?"perPoint":"step";non("critPercentPerPoint",100);
  o.dodgeFormula=o.dodgeFormula==="perPoint"?"perPoint":"step";non("dodgePercentPerPoint",100);
  o.initiativeFormula=o.initiativeFormula==="perPoint"?"perPoint":"step";non("initiativePerPoint",100);
  o.magicResistFormula=o.magicResistFormula==="perPoint"?"perPoint":"step";non("magicResistPerPoint",100);
  o.rulesComplexity=["simple","tactical","rpg","custom"].includes(o.rulesComplexity)?o.rulesComplexity:"simple";
  o.initiativeUsage=["off","turns","tests","both","custom"].includes(o.initiativeUsage)?o.initiativeUsage:"tests";
  o.initiativeTurnMode=["fixed","die","low"].includes(o.initiativeTurnMode)?o.initiativeTurnMode:"fixed";
  o.initiativeDie=[4,6,8,10,12,20,100].includes(Number(o.initiativeDie))?Number(o.initiativeDie):20;
  o.testsEnabled=o.testsEnabled!==false; o.testDie=[4,6,8,10,12,20,100].includes(Number(o.testDie))?Number(o.testDie):20;
  o.testDefaultDifficulty=Math.max(1,Math.min(999,Number(o.testDefaultDifficulty)||10));
  pos("meleeHitStep");non("meleeHitGain",99);
  pos("rangedHitStep");non("rangedHitGain",99);
  pos("magicHitStep");non("magicHitGain",99);
  o.basicAttackBaseChance=Math.max(1,Math.min(99,Number(o.basicAttackBaseChance)||d.basicAttackBaseChance));
  non("baseMana");pos("spiritManaStep");non("manaGain");non("magicAttackManaCost");
  non("baseCrit",100);pos("agilityCritStep");non("critGain",100);non("critCap",100);
  o.critMultiplier=Math.max(1,Math.min(10,Number(o.critMultiplier)||d.critMultiplier));
  non("baseDodge",100);pos("agilityDodgeStep");non("dodgeGain",100);non("dodgeCap",100);
  o.baseInitiative=Math.max(-99,Math.min(999,Number(o.baseInitiative)||0));
  pos("agilityInitiativeStep");non("initiativeGain",99);
  pos("enduranceHpStep");non("hpGain",999);
  non("defensePenaltyPerPoint",25);
  o.hitChanceMin=Math.max(0,Math.min(99,Number.isFinite(Number(o.hitChanceMin))?Number(o.hitChanceMin):d.hitChanceMin));
  o.hitChanceMax=Math.max(o.hitChanceMin,Math.min(100,Number(o.hitChanceMax)||d.hitChanceMax));
  pos("armorReductionStep");non("armorReductionGain",99);non("minPhysicalDamage",99);non("armorZeroBlockChance",100);
  pos("spiritMagicResistStep");non("magicResistGain",99);non("minMagicDamage",99);
  return o;
}

function loadDungeonRpgRules(){try{return normalizeDungeonRpgRules(JSON.parse(localStorage.getItem(GENS_DUNGEON_RPG_RULES_KEY)||"{}"))}catch(e){return defaultDungeonRpgRules()}}

function saveDungeonRpgRules(r){localStorage.setItem(GENS_DUNGEON_RPG_RULES_KEY,JSON.stringify(normalizeDungeonRpgRules(r)));try{if(current&&state){dungeonSyncProgressionForState(current,state);save();render()}}catch(e){}}

function dungeonRpgLevelFromXp(xp){const r=loadDungeonRpgRules();return 1+Math.floor(Math.max(0,Number(xp)||0)/Math.max(1,r.xpPerLevel))}

function dungeonRpgXpIntoLevel(xp){const r=loadDungeonRpgRules();return Math.max(0,Number(xp)||0)%Math.max(1,r.xpPerLevel)}

function dungeonRpgEarnedSkillPoints(xp){const r=loadDungeonRpgRules();return Math.max(0,r.startingSkillPoints)+Math.floor(Math.max(0,Number(xp)||0)/Math.max(1,r.xpPerLevel))*Math.max(0,r.skillPointsPerLevel)}

function dungeonActiveProgressionConfig(){
  try{
    if(typeof loadGameProfiles==="function" && typeof activeGameProfileId==="function"){
      const p=loadGameProfiles().find(x=>String(x.id)===String(activeGameProfileId()));
      if(p?.gameStyle==="dungeon")return p.rpgUniverse?.progression||{};
    }
  }catch(e){}
  return {};
}

function dungeonSpentSkillPointsFor(heroId,st){
  const nodes=dungeonTreeNodesForHero(heroId);
  const unlocked=new Set(Array.isArray(st?.skillTreeUnlocked)?st.skillTreeUnlocked:[]);
  return nodes.filter(n=>unlocked.has(n.id)).reduce((sum,n)=>sum+Math.max(1,Number(n.cost)||1),0);
}

function dungeonSyncProgressionForState(heroId,st){
  if(!st||!heroId||!(CHARS[heroId]?.dungeonBuiltin||CHARS[heroId]?.gameMode==="dungeon"))return st;
  const earned=dungeonRpgEarnedSkillPoints(st.xp);
  const spent=dungeonSpentSkillPointsFor(heroId,st);
  const p=dungeonActiveProgressionConfig();
  const level=dungeonRpgLevelFromXp(st.xp);
  const earnedStats=Math.max(0,Number(p.startingStatPoints)||0)+Math.max(0,level-1)*Math.max(0,Number(p.statPointsPerLevel??1)||0);
  st.rpgLevel=level;
  st.skillPoints=Math.max(0,earned+Math.max(0,Number(st.bonusSkillPoints)||0)-spent);
  st.statPoints=Math.max(0,earnedStats-Math.max(0,Number(st.rpgStatSpent)||0));
  return st;
}

function dungeonBaseAttributeFromDefinition(heroId,id){
  const ds=CHARS[heroId]?.dungeonStats||{};
  const map={
    force:["force","strength","FOR"],
    agilite:["agilite","dexterity","DEX"],
    intelligence:["intelligence","int","INT"],
    esprit:["esprit","spirit","wisdom","SAG"],
    endurance:["endurance","constitution","CON"]
  };
  for(const k of (map[id]||[id]))if(ds[k]!==undefined&&ds[k]!==null&&ds[k]!=="")return Math.max(0,Number(ds[k])||0);
  return 3;
}

function dungeonBaseManaForState(heroId,st){
  const r=loadDungeonRpgRules();
  const spirit=Math.max(0,Number(st?.rpgAttributes?.esprit ?? dungeonBaseAttributeFromDefinition(heroId,"esprit"))||0);
  return Math.max(0,r.baseMana+Math.floor(spirit/Math.max(1,r.spiritManaStep))*r.manaGain);
}

function dungeonPhysicalDamageBonus(){
  const r=loadDungeonRpgRules(),v=dungeonAttributeValue("force");
  return r.physicalDamageFormula==="percent"?0:Math.floor(v/Math.max(1,r.physicalDamageStep))*r.physicalDamageGain;
}

function dungeonMagicDamageBonus(){
  const r=loadDungeonRpgRules(),v=dungeonAttributeValue("intelligence");
  return r.magicDamageFormula==="percent"?0:Math.floor(v/Math.max(1,r.magicDamageStep))*r.magicDamageGain;
}

function dungeonDamagePercentForMode(mode,attrs=null){
  const r=loadDungeonRpgRules();
  const a=attrs||{
    force:dungeonAttributeValue("force"),
    agilite:dungeonAttributeValue("agilite"),
    intelligence:dungeonAttributeValue("intelligence")
  };
  if(mode==="magic"&&r.magicDamageFormula==="percent")return Math.max(0,Number(a.intelligence)||0)*Math.max(0,Number(r.magicDamagePercentPerPoint)||0);
  if(mode==="ranged"&&r.rangedDamageFormula==="percent")return Math.max(0,Number(a.agilite)||0)*Math.max(0,Number(r.rangedDamagePercentPerPoint)||0);
  if(mode==="melee"&&r.physicalDamageFormula==="percent")return Math.max(0,Number(a.force)||0)*Math.max(0,Number(r.physicalDamagePercentPerPoint)||0);
  return 0;
}

function dungeonApplyStatDamagePercent(baseDamage,mode,attrs=null){
  const pct=dungeonDamagePercentForMode(mode,attrs);
  return {pct,bonus:Math.max(0,Math.round((Math.max(0,Number(baseDamage)||0)*pct)/100))};
}

function dungeonMaxMana(){
  const r=loadDungeonRpgRules(),v=dungeonAttributeValue("esprit");
  const derived=r.manaFormula==="percent"
    ? Math.round(r.baseMana*(v*Math.max(0,Number(r.manaPercentPerPoint)||0))/100)
    : Math.floor(v/Math.max(1,r.spiritManaStep))*r.manaGain;
  return Math.max(0,r.baseMana+derived+dungeonEquipmentBonus("mana")+dungeonSkillEffectTotal("mana"));
}

function dungeonCriticalChance(){
  const r=loadDungeonRpgRules(),v=dungeonAttributeValue("agilite");
  const derived=r.critFormula==="perPoint"?v*Math.max(0,Number(r.critPercentPerPoint)||0):Math.floor(v/Math.max(1,r.agilityCritStep))*r.critGain;
  return Math.max(0,Math.min(r.critCap,r.baseCrit+derived+dungeonEquipmentBonus("crit")+dungeonSkillEffectTotal("crit")));
}

function dungeonDodgeChance(){
  const r=loadDungeonRpgRules(),v=dungeonAttributeValue("agilite");
  const derived=r.dodgeFormula==="perPoint"?v*Math.max(0,Number(r.dodgePercentPerPoint)||0):Math.floor(v/Math.max(1,r.agilityDodgeStep))*r.dodgeGain;
  return Math.max(0,Math.min(r.dodgeCap,r.baseDodge+derived+dungeonEquipmentBonus("dodge")+dungeonSkillEffectTotal("dodge")));
}

function dungeonDerivedInitiative(){
  return dungeonAttributeValue("initiative");
}

function dungeonEnduranceHpBonus(){
  const r=loadDungeonRpgRules(),v=dungeonAttributeValue("endurance");
  if(r.hpFormula==="percent"){
    const base=Math.max(1,Number(CHARS[current]?.maxHp||state?.maxWounds||3)||3);
    return Math.round(base*(v*Math.max(0,Number(r.hpPercentPerPoint)||0))/100);
  }
  return Math.floor(v/Math.max(1,r.enduranceHpStep))*r.hpGain;
}

function dungeonHitBonusForMode(mode,value){
  const r=loadDungeonRpgRules();let step=r.meleeHitStep,gain=r.meleeHitGain;
  if(mode==="ranged"){step=r.rangedHitStep;gain=r.rangedHitGain}
  if(mode==="magic"){step=r.magicHitStep;gain=r.magicHitGain}
  return Math.floor(Math.max(0,Number(value)||0)/Math.max(1,step))*gain;
}

function dungeonDerivedForHero(heroId){
  const oldCurrent=current,oldState=state;
  try{
    current=heroId;state=loadState(heroId);
    const maxHp=effectiveMaxWounds(),w=Math.max(0,Number(state.wounds)||0);
    return {
      level:dungeonRpgLevelFromXp(state.xp),xpInto:dungeonRpgXpIntoLevel(state.xp),
      force:dungeonAttributeValue("force"),agilite:dungeonAttributeValue("agilite"),
      intelligence:dungeonAttributeValue("intelligence"),esprit:dungeonAttributeValue("esprit"),endurance:dungeonAttributeValue("endurance"),
      physical:dungeonPhysicalDamageBonus(),magic:dungeonMagicDamageBonus(),maxMana:dungeonMaxMana(),
      mana:Math.max(0,Math.min(dungeonMaxMana(),Number(state.mana)||0)),
      crit:dungeonCriticalChance(),dodge:dungeonDodgeChance(),initiative:dungeonDerivedInitiative(),
      defense:dungeonDerivedDefense(),armor:dungeonArmorScore(),armorReduction:dungeonArmorReduction(),magicResistance:dungeonMagicResistance(),maxHp,hp:Math.max(0,maxHp-w)
    };
  }finally{current=oldCurrent;state=oldState}
}

function dungeonMaxHpForHero(heroId,stObj=null){
  const oldCurrent=current,oldState=state;
  try{current=heroId;state=stObj||loadState(heroId);return Math.max(1,effectiveMaxWounds())}
  finally{current=oldCurrent;state=oldState}
}

function changeDungeonMana(v){if(!isDungeonHeroSheet())return;const max=dungeonMaxMana();state.mana=Math.max(0,Math.min(max,(Number(state.mana)||0)+Number(v||0)));save();renderDungeonAttributes();renderDungeonHeroStats()}

function refillDungeonMana(){if(!isDungeonHeroSheet())return;state.mana=dungeonMaxMana();save();renderDungeonAttributes();renderDungeonHeroStats()}

function dungeonRpgRulesSummaryHtml(){
  const r=loadDungeonRpgRules();
  return [
    "⭐ 1 niveau tous les <strong>"+r.xpPerLevel+" XP</strong> · <strong>"+r.skillPointsPerLevel+" pt(s)</strong> par niveau gagné · départ : <strong>"+r.startingSkillPoints+"</strong> pt(s).",
    r.physicalDamageFormula==="percent"
      ?"⚔️ Chaque <strong>1 Force</strong> : +<strong>"+r.physicalDamagePercentPerPoint+"%</strong> dégâts physiques de mêlée."
      :"⚔️ Tous les <strong>"+r.physicalDamageStep+" Force</strong> : +<strong>"+r.physicalDamageGain+"</strong> dégâts physiques.",
    "🎯 D100 : chance finale = base de l’attaque + bonus de caractéristique + bonus divers − Défense adverse. Réussite si le D100 fait <strong>101 − chance finale</strong> ou plus. Bornes : <strong>"+r.hitChanceMin+" à "+r.hitChanceMax+"%</strong>.",
    "🧱 Défense : chaque point de Défense au-dessus de la caractéristique d’attaque retire <strong>"+r.defensePenaltyPerPoint+"%</strong> de chance de toucher.",
    "🎯 Bonus de précision : mêlée +<strong>"+r.meleeHitGain+"%</strong>/"+r.meleeHitStep+" Force · distance +<strong>"+r.rangedHitGain+"%</strong>/"+r.rangedHitStep+" Agilité · magie +<strong>"+r.magicHitGain+"%</strong>/"+r.magicHitStep+" Intelligence.",
    r.magicDamageFormula==="percent"
      ?"✨ Chaque <strong>1 Intelligence</strong> : +<strong>"+r.magicDamagePercentPerPoint+"%</strong> dégâts magiques."
      :"✨ Tous les <strong>"+r.magicDamageStep+" Intelligence</strong> : +<strong>"+r.magicDamageGain+"</strong> dégâts magiques.",
    r.rangedDamageFormula==="percent"?"🏹 Chaque <strong>1 Agilité</strong> : +<strong>"+r.rangedDamagePercentPerPoint+"%</strong> dégâts à distance.":"",
    r.manaFormula==="percent"
      ?"🔷 Chaque <strong>1 Esprit</strong> : +<strong>"+r.manaPercentPerPoint+"%</strong> du Mana de base · attaque magique : <strong>"+r.magicAttackManaCost+"</strong> mana."
      :"🔷 Tous les <strong>"+r.spiritManaStep+" Esprit</strong> : +<strong>"+r.manaGain+"</strong> mana · attaque magique : <strong>"+r.magicAttackManaCost+"</strong> mana.",
    r.critFormula==="perPoint"
      ?"💥 Chaque <strong>1 Agilité</strong> : +<strong>"+r.critPercentPerPoint+"%</strong> critique · critique ×<strong>"+r.critMultiplier+"</strong>."
      :"💥 Tous les <strong>"+r.agilityCritStep+" Agilité</strong> : +<strong>"+r.critGain+"%</strong> critique · critique ×<strong>"+r.critMultiplier+"</strong>.",
    r.dodgeFormula==="perPoint"
      ?"💨 Chaque <strong>1 Agilité</strong> : +<strong>"+r.dodgePercentPerPoint+"%</strong> esquive · plafond "+r.dodgeCap+"%."
      :"💨 Tous les <strong>"+r.agilityDodgeStep+" Agilité</strong> : +<strong>"+r.dodgeGain+"%</strong> esquive · plafond "+r.dodgeCap+"%.",
    "🐎 Initiative : caractéristique indépendante, sans bonus automatique d’Agilité.",
    "🛡️ Tous les <strong>"+r.armorReductionStep+" Armure</strong> : −<strong>"+r.armorReductionGain+"</strong> dégât physique par touche · minimum <strong>"+r.minPhysicalDamage+"</strong>.",
    r.magicResistFormula==="perPoint"
      ?"🔮 Chaque <strong>1 Esprit</strong> : +<strong>"+r.magicResistPerPoint+"</strong> résistance magique · minimum magique <strong>"+r.minMagicDamage+"</strong>."
      :"🔮 Tous les <strong>"+r.spiritMagicResistStep+" Esprit</strong> : +<strong>"+r.magicResistGain+"</strong> résistance magique, plus les bonus d’équipement · minimum magique <strong>"+r.minMagicDamage+"</strong>.",
    r.hpFormula==="percent"
      ?"❤️ Chaque <strong>1 Endurance</strong> : +<strong>"+r.hpPercentPerPoint+"%</strong> des PV de base."
      :"❤️ Tous les <strong>"+r.enduranceHpStep+" Endurance</strong> : +<strong>"+r.hpGain+"</strong> PV max."
  ].filter(Boolean).map(x=>'<div class="dungeonRuleLine">'+x+'</div>').join("");
}

function renderDungeonProgressiveRules(){
  const usage=document.getElementById("drInitiativeUsage")?.value||"tests",style=document.getElementById("drRulesComplexity")?.value||"simple";
  const turn=document.getElementById("drInitiativeTurnOptions"),tests=document.getElementById("drUniversalTestOptions");
  if(turn)turn.style.display=(usage==="turns"||usage==="both"||usage==="custom")?"grid":"none";
  if(tests)tests.style.display=(usage==="tests"||usage==="both"||usage==="custom"||style==="rpg"||style==="custom")?"block":"none";
}

function dungeonUniversalTest(statValue,opt={}){
  const r=loadDungeonRpgRules(); if(!r.testsEnabled)return {enabled:false,success:true,total:Number(statValue)||0,roll:0};
  const sides=Math.max(2,Number(opt.die)||r.testDie||20),roll=1+Math.floor(Math.random()*sides),mod=Number(opt.modifier)||0,difficulty=Math.max(1,Number(opt.difficulty)||r.testDefaultDifficulty||10),total=(Number(statValue)||0)+roll+mod;
  return {enabled:true,success:total>=difficulty,total,roll,sides,modifier:mod,difficulty};
}

function dungeonInitiativeScore(statValue){const r=loadDungeonRpgRules(),v=Number(statValue)||0;if(r.initiativeTurnMode!=="die")return v;const d=Math.max(2,Number(r.initiativeDie)||20);return v+1+Math.floor(Math.random()*d)}

function openDungeonRpgRulesEditor(){
  const adv=document.getElementById("dungeonAdvancedEditor"),ed=document.getElementById("dungeonRpgRulesEditor");
  if(adv)adv.style.display="none";if(ed)ed.style.display="block";
  fillDungeonRpgRulesEditor();window.scrollTo(0,0);
}

function closeDungeonRpgRulesEditor(){
  const ed=document.getElementById("dungeonRpgRulesEditor"),adv=document.getElementById("dungeonAdvancedEditor");
  if(ed)ed.style.display="none";if(adv)adv.style.display="block";window.scrollTo(0,0);
}

function fillDungeonRpgRulesEditor(){
  const r=loadDungeonRpgRules(),map={
    drXpPerLevel:"xpPerLevel",drSkillPointsPerLevel:"skillPointsPerLevel",drStartingSkillPoints:"startingSkillPoints",
    drPhysicalStep:"physicalDamageStep",drPhysicalGain:"physicalDamageGain",
    drPhysicalPctPerPoint:"physicalDamagePercentPerPoint",
    drMagicStep:"magicDamageStep",drMagicGain:"magicDamageGain",
    drMagicPctPerPoint:"magicDamagePercentPerPoint",
    drRangedPctPerPoint:"rangedDamagePercentPerPoint",
    drHpPctPerPoint:"hpPercentPerPoint",drManaPctPerPoint:"manaPercentPerPoint",
    drCritPerPoint:"critPercentPerPoint",drDodgePerPoint:"dodgePercentPerPoint",
    drInitiativePerPoint:"initiativePerPoint",drMagicResistPerPoint:"magicResistPerPoint",
    drMeleeHitStep:"meleeHitStep",drMeleeHitGain:"meleeHitGain",
    drRangedHitStep:"rangedHitStep",drRangedHitGain:"rangedHitGain",
    drMagicHitStep:"magicHitStep",drMagicHitGain:"magicHitGain",
    drBasicHitChance:"basicAttackBaseChance",drHitChanceMin:"hitChanceMin",drHitChanceMax:"hitChanceMax",drDefensePenalty:"defensePenaltyPerPoint",
    drBaseMana:"baseMana",drSpiritStep:"spiritManaStep",drManaGain:"manaGain",drMagicAttackCost:"magicAttackManaCost",
    drBaseCrit:"baseCrit",drCritStep:"agilityCritStep",drCritGain:"critGain",drCritCap:"critCap",drCritMultiplier:"critMultiplier",
    drBaseDodge:"baseDodge",drDodgeStep:"agilityDodgeStep",drDodgeGain:"dodgeGain",drDodgeCap:"dodgeCap",
    drBaseInitiative:"baseInitiative",drInitiativeStep:"agilityInitiativeStep",drInitiativeGain:"initiativeGain",
    drHpStep:"enduranceHpStep",drHpGain:"hpGain",
    drArmorStep:"armorReductionStep",drArmorGain:"armorReductionGain",drMinPhysicalDamage:"minPhysicalDamage",drArmorZeroBlockChance:"armorZeroBlockChance",
    drMagicResistStep:"spiritMagicResistStep",drMagicResistGain:"magicResistGain",drMinMagicDamage:"minMagicDamage"
  };
  Object.entries(map).forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.value=r[k]});
  const selects={
    drPhysicalFormula:r.physicalDamageFormula,drMagicFormula:r.magicDamageFormula,
    drRangedDamageFormula:r.rangedDamageFormula,drHpFormula:r.hpFormula,drManaFormula:r.manaFormula,
    drCritFormula:r.critFormula,drDodgeFormula:r.dodgeFormula,drInitiativeFormula:r.initiativeFormula,
    drMagicResistFormula:r.magicResistFormula
  };
  Object.entries(selects).forEach(([id,val])=>{const e=document.getElementById(id);if(e)e.value=val});
  [["drRulesComplexity",r.rulesComplexity],["drInitiativeUsage",r.initiativeUsage],["drInitiativeTurnMode",r.initiativeTurnMode],["drInitiativeDie",r.initiativeDie],["drTestDie",r.testDie]].forEach(([id,val])=>{const e=document.getElementById(id);if(e)e.value=String(val)});
  const te=document.getElementById("drTestsEnabled");if(te)te.checked=r.testsEnabled!==false; const td=document.getElementById("drTestDefaultDifficulty");if(td)td.value=r.testDefaultDifficulty; renderDungeonProgressiveRules();
  const p=document.getElementById("dungeonRulesEditorPreview");if(p)p.innerHTML="<strong>📖 Résumé joueur</strong>"+dungeonRpgRulesSummaryHtml();
}

function readDungeonRpgRulesEditor(){
  const v=id=>Number(document.getElementById(id)?.value);
  return {
    rulesComplexity:document.getElementById("drRulesComplexity")?.value||"simple",initiativeUsage:document.getElementById("drInitiativeUsage")?.value||"tests",initiativeTurnMode:document.getElementById("drInitiativeTurnMode")?.value||"fixed",initiativeDie:v("drInitiativeDie"),testsEnabled:!!document.getElementById("drTestsEnabled")?.checked,testDie:v("drTestDie"),testDefaultDifficulty:v("drTestDefaultDifficulty"),
    xpPerLevel:v("drXpPerLevel"),skillPointsPerLevel:v("drSkillPointsPerLevel"),startingSkillPoints:v("drStartingSkillPoints"),
    physicalDamageStep:v("drPhysicalStep"),physicalDamageGain:v("drPhysicalGain"),
    physicalDamageFormula:document.getElementById("drPhysicalFormula")?.value||"step",physicalDamagePercentPerPoint:v("drPhysicalPctPerPoint"),
    magicDamageStep:v("drMagicStep"),magicDamageGain:v("drMagicGain"),
    magicDamageFormula:document.getElementById("drMagicFormula")?.value||"step",magicDamagePercentPerPoint:v("drMagicPctPerPoint"),
    rangedDamageFormula:document.getElementById("drRangedDamageFormula")?.value||"none",rangedDamagePercentPerPoint:v("drRangedPctPerPoint"),
    hpFormula:document.getElementById("drHpFormula")?.value||"step",hpPercentPerPoint:v("drHpPctPerPoint"),
    manaFormula:document.getElementById("drManaFormula")?.value||"step",manaPercentPerPoint:v("drManaPctPerPoint"),
    critFormula:document.getElementById("drCritFormula")?.value||"step",critPercentPerPoint:v("drCritPerPoint"),
    dodgeFormula:document.getElementById("drDodgeFormula")?.value||"step",dodgePercentPerPoint:v("drDodgePerPoint"),
    initiativeFormula:document.getElementById("drInitiativeFormula")?.value||"step",initiativePerPoint:v("drInitiativePerPoint"),
    magicResistFormula:document.getElementById("drMagicResistFormula")?.value||"step",magicResistPerPoint:v("drMagicResistPerPoint"),
    meleeHitStep:v("drMeleeHitStep"),meleeHitGain:v("drMeleeHitGain"),
    rangedHitStep:v("drRangedHitStep"),rangedHitGain:v("drRangedHitGain"),
    magicHitStep:v("drMagicHitStep"),magicHitGain:v("drMagicHitGain"),
    basicAttackBaseChance:v("drBasicHitChance"),hitChanceMin:v("drHitChanceMin"),hitChanceMax:v("drHitChanceMax"),defensePenaltyPerPoint:v("drDefensePenalty"),
    baseMana:v("drBaseMana"),spiritManaStep:v("drSpiritStep"),manaGain:v("drManaGain"),magicAttackManaCost:v("drMagicAttackCost"),
    baseCrit:v("drBaseCrit"),agilityCritStep:v("drCritStep"),critGain:v("drCritGain"),critCap:v("drCritCap"),critMultiplier:v("drCritMultiplier"),
    baseDodge:v("drBaseDodge"),agilityDodgeStep:v("drDodgeStep"),dodgeGain:v("drDodgeGain"),dodgeCap:v("drDodgeCap"),
    baseInitiative:v("drBaseInitiative"),agilityInitiativeStep:v("drInitiativeStep"),initiativeGain:v("drInitiativeGain"),
    enduranceHpStep:v("drHpStep"),hpGain:v("drHpGain"),
    armorReductionStep:v("drArmorStep"),armorReductionGain:v("drArmorGain"),minPhysicalDamage:v("drMinPhysicalDamage"),armorZeroBlockChance:v("drArmorZeroBlockChance"),
    spiritMagicResistStep:v("drMagicResistStep"),magicResistGain:v("drMagicResistGain"),minMagicDamage:v("drMinMagicDamage")
  };
}

function saveDungeonRpgRulesFromEditor(){saveDungeonRpgRules(readDungeonRpgRulesEditor());fillDungeonRpgRulesEditor();alert("Règles RPG Dungeon enregistrées ✅")}

function resetDungeonRpgRules(){if(!confirm("Réinitialiser toutes les règles RPG Dungeon ?"))return;localStorage.removeItem(GENS_DUNGEON_RPG_RULES_KEY);fillDungeonRpgRulesEditor();try{if(current&&state){dungeonSyncProgressionForState(current,state);state.mana=Math.min(Number(state.mana)||0,dungeonMaxMana());save();render()}}catch(e){}}

function dungeonStarterTalentSets(){
  const p=(id,name,desc,tier,req,effects,cost=1)=>({id,name,desc,tier,requires:req||[],cost,effects:effects||[],type:"passive"});
  const a=(id,name,desc,tier,req,active,cost=1)=>({id,name,desc,tier,requires:req||[],cost,effects:[],type:"active",active});
  return [
    {id:"warrior",name:"Guerrier",desc:"Force, défense et techniques d’armes.",nodes:[
      p("w_force","Discipline martiale","+1 Force.",0,[],[{kind:"attribute",attribute:"force",value:1,label:"+1 Force"}]),
      p("w_guard","Garde","+1 Défense.",1,["w_force"],[{kind:"defense",value:1,label:"+1 Défense"}]),
      a("w_whirl","Tourbillon","Frappe tous les ennemis engagés. Nécessite une épée ou une hache.",2,["w_force"],{kind:"whirlwind",amount:2,manaCost:1,weapon:"sword_axe"},2),
      p("w_power","Puissance","+1 dégâts de mêlée.",3,["w_whirl"],[{kind:"power",mode:"melee",value:1,label:"+1 Puissance mêlée"}],2),
      a("w_execute","Exécution","Frappe spéciale puissante sur une cible.",4,["w_power"],{kind:"damage",amount:4,manaCost:2,weapon:"melee"},3)
    ]},
    {id:"elementalist",name:"Élémentaliste",desc:"Magie offensive, mana et maîtrise élémentaire.",nodes:[
      p("e_int","Étude élémentaire","+1 Intelligence.",0,[],[{kind:"attribute",attribute:"intelligence",value:1,label:"+1 Intelligence"}]),
      p("e_mana","Canalisation","+10 Mana maximum.",1,["e_int"],[{kind:"mana",value:10,label:"+10 Mana"}]),
      a("e_bolt","Projectile élémentaire","Attaque magique active.",2,["e_int"],{kind:"damage",amount:3,manaCost:2,weapon:""},2),
      p("e_hit","Précision arcanique","+5% toucher magique.",3,["e_bolt"],[{kind:"hitChance",mode:"magic",value:5,label:"+5% toucher magique"}],2)
    ]},
    {id:"druid",name:"Druide",desc:"Soin, esprit et endurance.",nodes:[
      p("d_spirit","Harmonie","+1 Esprit.",0,[],[{kind:"attribute",attribute:"esprit",value:1,label:"+1 Esprit"}]),
      a("d_heal","Soin naturel","Rend des PV à un héros engagé.",1,["d_spirit"],{kind:"heal",amount:2,manaCost:2,weapon:""},1),
      p("d_end","Écorce","+1 Endurance.",2,["d_heal"],[{kind:"attribute",attribute:"endurance",value:1,label:"+1 Endurance"}],2),
      a("d_heal2","Régénération","Soin plus puissant.",3,["d_end"],{kind:"heal",amount:4,manaCost:3,weapon:""},2)
    ]},
    {id:"paladin",name:"Paladin",desc:"Défense, soin et puissance sacrée.",nodes:[
      p("pa_def","Serment","+1 Défense.",0,[],[{kind:"defense",value:1,label:"+1 Défense"}]),
      a("pa_heal","Imposition des mains","Rend des PV à un héros engagé.",1,["pa_def"],{kind:"heal",amount:3,manaCost:2,weapon:""},2),
      p("pa_pow","Arme bénie","+1 dégâts de mêlée.",2,["pa_def"],[{kind:"power",mode:"melee",value:1,label:"+1 Puissance mêlée"}],2)
    ]},
    {id:"thief",name:"Voleur",desc:"Agilité, critique et esquive.",nodes:[
      p("t_agi","Souplesse","+1 Agilité.",0,[],[{kind:"attribute",attribute:"agilite",value:1,label:"+1 Agilité"}]),
      p("t_crit","Coup précis","+5% critique.",1,["t_agi"],[{kind:"crit",value:5,label:"+5% critique"}]),
      p("t_dodge","Pas de côté","+5% esquive.",1,["t_agi"],[{kind:"dodge",value:5,label:"+5% esquive"}])
    ]},
    {id:"priest",name:"Prêtre",desc:"Soutien, mana et soins.",nodes:[
      p("pr_spirit","Foi","+1 Esprit.",0,[],[{kind:"attribute",attribute:"esprit",value:1,label:"+1 Esprit"}]),
      a("pr_heal","Soin","Rend des PV à un héros engagé.",1,["pr_spirit"],{kind:"heal",amount:2,manaCost:1,weapon:""},1),
      p("pr_mana","Dévotion","+10 Mana maximum.",2,["pr_heal"],[{kind:"mana",value:10,label:"+10 Mana"}],2)
    ]}
  ];
}

function dungeonTalentSlotTier(slotIndex){
  let n=Number(slotIndex)||0,acc=0;
  for(let tier=0;tier<DUNGEON_TALENT_TIER_WIDTHS.length;tier++){
    const w=DUNGEON_TALENT_TIER_WIDTHS[tier];
    if(n<acc+w)return tier;
    acc+=w;
  }
  return DUNGEON_TALENT_TIER_WIDTHS.length-1;
}

function normalizeDungeonTalentSetSlots(set){
  if(!set||typeof set!=="object")return set;
  const original=(Array.isArray(set.nodes)?set.nodes:[]).map(normalizeDungeonTalentNode);
  const used=new Set();
  let fallback=0;
  original.forEach(n=>{
    let si=Number.isInteger(Number(n.slotIndex))?Number(n.slotIndex):null;
    if(si===null||si<0||si>=DUNGEON_TALENT_SLOT_COUNT||used.has(si)){
      while(used.has(fallback)&&fallback<DUNGEON_TALENT_SLOT_COUNT)fallback++;
      si=fallback<DUNGEON_TALENT_SLOT_COUNT?fallback:null;
    }
    if(si!==null){n.slotIndex=si;n.tier=dungeonTalentSlotTier(si);used.add(si)}
  });
  const bySlot=new Map(original.filter(n=>Number.isInteger(Number(n.slotIndex))).map(n=>[Number(n.slotIndex),n]));
  const padded=[];
  for(let i=0;i<DUNGEON_TALENT_SLOT_COUNT;i++){
    padded.push(bySlot.get(i)||{
      id:"empty_"+set.id+"_"+i,
      name:"Emplacement libre",
      desc:"",
      type:"empty",
      empty:true,
      slotIndex:i,
      tier:dungeonTalentSlotTier(i),
      cost:1,
      requires:[],
      effects:[]
    });
  }
  set.nodes=padded;
  return set;
}

function dungeonTalentPlayableNodes(set){
  return (set?.nodes||[]).filter(n=>!n.empty&&n.type!=="empty");
}

function dungeonTalentLegacyToEffects(node){
  if(!node||node.type!=="active")return node;
  if(Array.isArray(node.effects)&&node.effects.length){
    node.activeMeta=node.activeMeta||{manaCost:Math.max(0,Number(node.active?.manaCost)||0),weapon:node.active?.weapon||"",cooldown:Math.max(0,Number(node.active?.cooldown)||0)};
    return node;
  }
  const a=node.active||{};if(!a.kind)return node;
  const target=(a.kind==="heal"||a.kind==="mana_restore")?"ally":(["heal_all"].includes(a.kind)?"all_allies":(["area_damage","whirlwind"].includes(a.kind)?"all_enemies":"enemy"));
  const damageType=a.kind==="magic_damage"?"magical":"physical";
  node.effects=[{kind:a.kind,base:Math.max(0,Number(a.amount)||0),scaleAttribute:"",scaleCoeff:0,target,damageType,element:"",duration:0,stat:""}];
  node.activeMeta={manaCost:Math.max(0,Number(a.manaCost)||0),weapon:a.weapon||"",cooldown:Math.max(0,Number(a.cooldown)||0)};
  return node;
}

function normalizeDungeonTalentNode(node){
  if(!node||typeof node!=="object")return node;
  if(node.type==="active")dungeonTalentLegacyToEffects(node);
  if(!Array.isArray(node.effects))node.effects=[];
  return node;
}

function dungeonTalentEffectLabel(e){
  if(!e)return "Effet";
  const names={heal:"Soin",heal_all:"Soin de groupe",hot:"Soin sur la durée",damage:"Dégâts physiques",magic_damage:"Dégâts magiques",area_damage:"Dégâts de zone",whirlwind:"Tourbillon",double_strike:"Double frappe",mana_restore:"Restauration Mana",life_steal:"Drain de vie",execute:"Exécution",dot:"Dégâts sur la durée",stat_mod:"Modification de stat"};
  const stats={defense:"Défense",initiative:"Initiative"};
  if(e.kind==="stat_mod")return (Number(e.value)>=0?"+":"")+(Number(e.value)||0)+" "+(stats[e.stat]||e.stat||"stat")+(e.duration?" · "+e.duration+" tour(s)":"");
  let txt=(names[e.kind]||e.kind||"Effet")+" "+(Number(e.base)||0);
  if(e.scaleAttribute&&Number(e.scaleCoeff))txt+=" + "+Math.round(Number(e.scaleCoeff)*100)+"% "+(RPG_ATTRIBUTE_LABELS[e.scaleAttribute]||e.scaleAttribute);
  return txt;
}

function dungeonTalentSummary(node){
  if(!node)return "";
  if(node.type!=="active")return (node.effects||[]).map(e=>e.label||((e.kind||"")+" "+(e.value||0))).join(" · ");
  const fx=(node.effects||[]).map(dungeonTalentEffectLabel).join(" · ");
  const meta=node.activeMeta||{};return fx+(meta.cooldown?" · Recharge "+meta.cooldown+"t":"");
}

function loadDungeonTalentSets(){
  let arr=[];
  try{arr=JSON.parse(localStorage.getItem(GENS_DUNGEON_TALENT_SETS_KEY)||"[]")}catch(e){arr=[]}
  let created=false;
  if(!Array.isArray(arr)||!arr.length){arr=dungeonStarterTalentSets();created=true}
  arr=arr.map(normalizeDungeonTalentSetSlots);
  try{
    if(created || arr.some(set=>(set.nodes||[]).length===DUNGEON_TALENT_SLOT_COUNT))
      localStorage.setItem(GENS_DUNGEON_TALENT_SETS_KEY,JSON.stringify(arr));
  }catch(e){}
  return arr;
}

function saveDungeonTalentSets(arr){arr=(Array.isArray(arr)?arr:[]).map(normalizeDungeonTalentSetSlots);localStorage.setItem(GENS_DUNGEON_TALENT_SETS_KEY,JSON.stringify(arr));try{renderDungeonTalentSetEditor();fillHeroTalentSetSelect()}catch(e){}}

function dungeonTalentSetById(id){return loadDungeonTalentSets().find(x=>String(x.id)===String(id))||null}

function defaultTalentSetForHero(heroId){
  if(heroId==="dungeon_lyra")return "thief";
  if(heroId==="dungeon_brom")return "elementalist";
  return "warrior";
}

function dungeonHeroTalentSetId(heroId){
  const c=CHARS[heroId]||{};
  return c.talentSetId||defaultTalentSetForHero(heroId);
}

function dungeonTreeNodesForHero(heroId){
  const set=dungeonTalentSetById(dungeonHeroTalentSetId(heroId));
  if(set&&Array.isArray(set.nodes))return dungeonTalentPlayableNodes(set);
  return CHARS[heroId]?.skillTree||dungeonSkillTreeDefinition(heroId)||[];
}

function fillHeroTalentSetSelect(selected=null){
  const el=document.getElementById("hcTalentSet");if(!el)return;
  const sets=loadDungeonTalentSets();
  el.innerHTML=sets.map(s=>'<option value="'+z40kEscAttr(s.id)+'">'+z40kEscHtml(s.name)+'</option>').join("");
  const wanted=selected||el.dataset.selected||defaultTalentSetForHero(hcEditingId);
  if(sets.some(s=>String(s.id)===String(wanted)))el.value=wanted;
}

function openDungeonTalentSetEditor(){
  loadDungeonTalentSets();
  const m=document.getElementById("dungeonTalentSetModal");if(!m)return;
  m.style.display="block";document.body.style.overflow="hidden";
  if(!dungeonTalentEditingSetId)dungeonTalentEditingSetId=loadDungeonTalentSets()[0]?.id||null;
  renderDungeonTalentSetEditor();
}

function closeDungeonTalentSetEditor(){const m=document.getElementById("dungeonTalentSetModal");if(m)m.style.display="none";document.body.style.overflow="";fillHeroTalentSetSelect(document.getElementById("hcTalentSet")?.value)}

function renderDungeonTalentSetEditor(){
  const sets=loadDungeonTalentSets();
  if(!sets.length)return;
  if(!sets.some(s=>s.id===dungeonTalentEditingSetId))dungeonTalentEditingSetId=sets[0].id;
  const set=normalizeDungeonTalentSetSlots(sets.find(s=>s.id===dungeonTalentEditingSetId)||sets[0]);
  const sel=document.getElementById("dtalentSetSelect");
  if(sel){sel.innerHTML=sets.map(s=>'<option value="'+z40kEscAttr(s.id)+'">'+z40kEscHtml(s.name)+'</option>').join("");sel.value=set.id}
  const n=document.getElementById("dtalentSetName"),d=document.getElementById("dtalentSetDesc");
  if(n)n.value=set.name||"";if(d)d.value=set.desc||"";
  const host=document.getElementById("dtalentNodeList");if(!host)return;

  let offset=0;
  const rows=DUNGEON_TALENT_TIER_WIDTHS.map((width,tier)=>{
    const slots=[];
    for(let j=0;j<width;j++){
      const slotIndex=offset+j,node=set.nodes[slotIndex],empty=!node||node.empty||node.type==="empty";
      if(empty){
        slots.push('<div class="dtalentSlot empty" onclick="editDungeonTalentSlot('+slotIndex+')"><span class="slotNo">#'+(slotIndex+1)+'</span><strong>＋ Talent</strong><small>Emplacement libre</small><small>Palier '+tier+'</small></div>');
      }else{
        const typ=node.type==="active"?"⚡ ACTIF":"📈 PASSIF";
        const effect=dungeonTalentSummary(node);
        slots.push('<div class="dtalentSlot" onclick="editDungeonTalentNode(\''+z40kEscAttr(node.id)+'\')"><span class="slotNo">#'+(slotIndex+1)+'</span><strong>'+z40kEscHtml(node.name||node.id)+'</strong><div class="slotType '+(node.type==="active"?"active":"passive")+'">'+typ+'</div><small>'+z40kEscHtml(effect||node.desc||"")+'</small><small>'+Math.max(1,Number(node.cost)||1)+' pt</small></div>');
      }
    }
    offset+=width;
    return '<div class="dtalentTierLabel">PALIER '+tier+'</div><div class="dtalentTierRow">'+slots.join("")+'</div>';
  }).join("");
  host.className="dtalentPyramid";
  host.innerHTML=rows+'<div class="dungeonTreeScrollHint">24 emplacements · 8 paliers · clique sur une case pour choisir ou remplacer sa compétence depuis le répertoire.</div>';
}

function selectDungeonTalentSet(id){dungeonTalentEditingSetId=id;renderDungeonTalentSetEditor()}

function newDungeonTalentSet(){
  const sets=loadDungeonTalentSets(),id="tree_"+Date.now().toString(36);
  sets.push(normalizeDungeonTalentSetSlots({id,name:"Nouvel arbre",desc:"",nodes:[]}));saveDungeonTalentSets(sets);dungeonTalentEditingSetId=id;renderDungeonTalentSetEditor()
}

function saveDungeonTalentSetMeta(){
  const sets=loadDungeonTalentSets(),s=sets.find(x=>x.id===dungeonTalentEditingSetId);if(!s)return;
  s.name=document.getElementById("dtalentSetName")?.value.trim()||"Arbre sans nom";
  s.desc=document.getElementById("dtalentSetDesc")?.value.trim()||"";
  saveDungeonTalentSets(sets);renderDungeonTalentSetEditor();alert("Arbre « "+s.name+" » enregistré ✅")
}

function duplicateDungeonTalentSet(){
  const sets=loadDungeonTalentSets(),s=sets.find(x=>x.id===dungeonTalentEditingSetId);if(!s)return;
  const copy=JSON.parse(JSON.stringify(s));copy.id="tree_"+Date.now().toString(36);copy.name=(s.name||"Arbre")+" — copie";
  sets.push(copy);saveDungeonTalentSets(sets);dungeonTalentEditingSetId=copy.id;renderDungeonTalentSetEditor()
}

function deleteDungeonTalentSet(){
  const sets=loadDungeonTalentSets(),s=sets.find(x=>x.id===dungeonTalentEditingSetId);if(!s)return;
  if(sets.length<=1){alert("Il faut conserver au moins un arbre.");return}
  if(!confirm("Supprimer l’arbre « "+s.name+" » ?"))return;
  const next=sets.filter(x=>x.id!==s.id);saveDungeonTalentSets(next);dungeonTalentEditingSetId=next[0].id;renderDungeonTalentSetEditor()
}

function addDungeonTalentNode(){
  const set=dungeonTalentSetById(dungeonTalentEditingSetId);
  const free=(set?.nodes||[]).find(n=>n.empty||n.type==="empty");
  if(!free){alert("Les 24 emplacements sont déjà utilisés.");return}
  editDungeonTalentSlot(Number(free.slotIndex)||0);
}

function editDungeonTalentSlot(slotIndex){
  dungeonTalentEditingSlotIndex=Math.max(0,Math.min(DUNGEON_TALENT_SLOT_COUNT-1,Number(slotIndex)||0));
  dungeonTalentEditingNodeId=null;
  openAbilityLibrary({kind:"talent",slotIndex:dungeonTalentEditingSlotIndex});
}

function editDungeonTalentNode(id){
  const set=dungeonTalentSetById(dungeonTalentEditingSetId);
  const node=set?.nodes?.find(n=>n.id===id);
  const slotIndex=Number.isInteger(Number(node?.slotIndex))?Number(node.slotIndex):null;
  if(slotIndex===null)return;
  dungeonTalentEditingNodeId=id;
  dungeonTalentEditingSlotIndex=slotIndex;
  openAbilityLibrary({kind:"talent",slotIndex});
}

function dungeonNewTalentEffect(){return {kind:"damage",base:2,scaleAttribute:"",scaleCoeff:0,target:"enemy",damageType:"physical",element:"",stat:"defense",resistanceKind:"",value:-1,duration:1}}

function dungeonTalentEffectTargetsForKind(kind){
  if(kind==="heal"||kind==="hot"||kind==="mana_restore")return ["self","ally","all_allies"];
  if(kind==="heal_all")return ["all_allies"];
  if(kind==="area_damage"||kind==="whirlwind")return ["all_enemies"];
  if(kind==="stat_mod"||kind==="dot")return ["enemy","all_enemies"];if(kind==="resistance_mod")return ["self","ally","enemy","all_allies","all_enemies"];
  return ["enemy","all_enemies"];
}

function addDungeonTalentEffect(){syncDungeonTalentEffectDraftFromDom();dungeonTalentEffectDraft.push(dungeonNewTalentEffect());renderDungeonTalentEffectsEditor()}

function removeDungeonTalentEffect(i){syncDungeonTalentEffectDraftFromDom();if(dungeonTalentEffectDraft.length<=1){alert("Une compétence active doit garder au moins un effet.");return}dungeonTalentEffectDraft.splice(i,1);renderDungeonTalentEffectsEditor()}

function syncDungeonTalentEffectDraftFromDom(){
  const host=document.getElementById("dtalentEffectsHost");if(!host)return;
  host.querySelectorAll(".dtalentEffectRow").forEach((row,i)=>{
    const e=dungeonTalentEffectDraft[i]||dungeonNewTalentEffect(),q=n=>row.querySelector('[data-f="'+n+'"]');
    e.kind=q("kind")?.value||"damage";e.base=Number(q("base")?.value)||0;e.scaleAttribute=q("scaleAttribute")?.value||"";e.scaleCoeff=Number(q("scaleCoeff")?.value)||0;e.target=q("target")?.value||"enemy";e.damageType=q("damageType")?.value||"physical";e.element=q("element")?.value||"";e.stat=q("stat")?.value||"defense";e.resistanceKind=q("resistanceKind")?.value||"";e.value=Number(q("value")?.value)||0;e.duration=Math.max(0,Number(q("duration")?.value)||0);
    dungeonTalentEffectDraft[i]=e;
  });
}

function changeDungeonTalentEffectKind(i){syncDungeonTalentEffectDraftFromDom();const e=dungeonTalentEffectDraft[i];const allowed=dungeonTalentEffectTargetsForKind(e.kind);if(!allowed.includes(e.target))e.target=allowed[0];renderDungeonTalentEffectsEditor()}

function renderDungeonTalentEffectsEditor(){
  const host=document.getElementById("dtalentEffectsHost");if(!host)return;if(!dungeonTalentEffectDraft.length)dungeonTalentEffectDraft=[dungeonNewTalentEffect()];
  const kindOpts={damage:"⚔️ Dégâts physiques",magic_damage:"🔮 Dégâts magiques",area_damage:"💥 Dégâts de zone",heal:"✨ Soin",heal_all:"💚 Soin de groupe",hot:"🌿 Soin sur la durée",mana_restore:"💧 Restauration Mana",double_strike:"⚡ Double frappe",life_steal:"🩸 Drain de vie",execute:"☠️ Exécution",dot:"🔥 Dégâts sur la durée",stat_mod:"📉 Buff / Debuff de statistique",resistance_mod:"🛡️ Buff / Debuff de résistance"};
  const targetNames={self:"Lanceur",ally:"1 allié",enemy:"1 ennemi",all_allies:"Tous les alliés",all_enemies:"Tous les ennemis"};
  const scaling=e=>'<label>Scaling<select data-f="scaleAttribute"><option value="">Aucun</option>'+[["force","Force"],["agilite","Agilité"],["intelligence","Intelligence"],["esprit","Esprit"],["endurance","Endurance"],["initiative","Initiative"]].map(([v,l])=>'<option value="'+v+'" '+(e.scaleAttribute===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label><label>Coefficient (0,5 = 50%)<input data-f="scaleCoeff" type="number" step="0.05" min="-10" max="10" value="'+(Number(e.scaleCoeff)||0)+'"></label>';
  host.innerHTML=dungeonTalentEffectDraft.map((e,i)=>{
    const targets=dungeonTalentEffectTargetsForKind(e.kind);if(!targets.includes(e.target))e.target=targets[0];
    const isStat=e.kind==="stat_mod",isRes=e.kind==="resistance_mod",isDot=e.kind==="dot",isHot=e.kind==="hot",isDamage=["damage","magic_damage","area_damage","double_strike","life_steal","execute"].includes(e.kind);
    let body='';
    if(isStat){
      body='<label>Statistique<select data-f="stat"><option value="defense" '+(e.stat==='defense'?'selected':'')+'>Défense</option><option value="initiative" '+(e.stat==='initiative'?'selected':'')+'>Initiative</option></select></label><label>Valeur (+ buff / − debuff)<input data-f="value" type="number" value="'+(Number(e.value)||0)+'"></label><label>Durée (tours)<input data-f="duration" type="number" min="1" max="99" value="'+Math.max(1,Number(e.duration)||1)+'"></label>';
    }else if(isRes){
      body='<label>Résistance ciblée<select data-f="resistanceKind">'+gensResistanceOptions(e.resistanceKind||"")+'</select></label><label>Valeur (%) — + résistance / − vulnérabilité<input data-f="value" type="number" min="-1000" max="1000" value="'+(Number(e.value)||0)+'"></label><label>Durée (tours)<input data-f="duration" type="number" min="1" max="99" value="'+Math.max(1,Number(e.duration)||1)+'"></label>';
    }else if(isDot){
      body='<label>Dégâts par tour<input data-f="base" type="number" min="0" max="9999" value="'+(Number(e.base)||0)+'"></label>'+scaling(e)+'<label>Durée (tours)<input data-f="duration" type="number" min="1" max="99" value="'+Math.max(1,Number(e.duration)||1)+'"></label><label>Type de dégâts<select data-f="damageType"><option value="physical" '+(e.damageType==='physical'?'selected':'')+'>Physiques</option><option value="magical" '+(e.damageType==='magical'?'selected':'')+'>Magiques</option><option value="true" '+(e.damageType==='true'?'selected':'')+'>Bruts</option></select></label><label>Élément<select data-f="element">'+gensElementOptions(e.element||"")+'</select></label>';
    }else if(isHot){
      body='<label>Soin par tour<input data-f="base" type="number" min="0" max="9999" value="'+(Number(e.base)||0)+'"></label>'+scaling(e)+'<label>Durée (tours)<input data-f="duration" type="number" min="1" max="99" value="'+Math.max(1,Number(e.duration)||1)+'"></label>';
    }else{
      body='<label>Valeur de base<input data-f="base" type="number" min="0" max="9999" value="'+(Number(e.base)||0)+'"></label>'+scaling(e)+'<input data-f="damageType" type="hidden" value="'+(e.kind==='magic_damage'?'magical':'physical')+'">'+(isDamage&&gensCurrentElementSettings().enabled?'<label>Élément<select data-f="element">'+gensElementOptions(e.element||"")+'</select></label>':'');
    }
    return '<div class="dtalentEffectRow"><div class="dtalentEffectHead"><strong>Effet '+(i+1)+'</strong><button type="button" class="dtalentEffectRemove" onclick="removeDungeonTalentEffect('+i+')">✕</button></div><div class="dtalentEffectGrid"><label>Type<select data-f="kind" onchange="changeDungeonTalentEffectKind('+i+')">'+Object.entries(kindOpts).map(([v,l])=>'<option value="'+v+'" '+(e.kind===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label><label>Cible<select data-f="target">'+targets.map(v=>'<option value="'+v+'" '+(e.target===v?'selected':'')+'>'+targetNames[v]+'</option>').join('')+'</select></label>'+body+'</div></div>';
  }).join('');
}

function updateDungeonPassiveTalentUi(){
  const kind=document.getElementById("dtalentPassiveKind")?.value||"none";
  const attr=kind==="attribute";
  const resist=kind==="resistance";
  const mode=kind==="hitChance";
  const none=kind==="none";
  const condition=document.getElementById("dtalentPassiveCondition")?.value||"always";
  const show=(id,v)=>{const e=document.getElementById(id);if(e)e.style.display=v?"":"none"};
  show("dtalentPassiveAttributeWrap",attr);
  show("dtalentPassiveResistanceWrap",resist);
  show("dtalentPassiveModeWrap",mode);
  show("dtalentPassiveScopeWrap",!none);
  show("dtalentPassiveValueLabel",!none);
  show("dtalentPassiveConditionWrap",!none);
  show("dtalentPassiveThresholdWrap",!none&&condition==="hpBelow");

  const vm=document.getElementById("dtalentPassiveValueMode");
  const percentOnly=["hitChance","crit","dodge","damageReduction","resistance"];
  if(vm){
    vm.disabled=percentOnly.includes(kind);
    if(percentOnly.includes(kind))vm.value="percent";
  }
  const lab=document.getElementById("dtalentPassiveValueLabel");
  if(lab&&!none){
    const unit=(vm?.value==="percent"||percentOnly.includes(kind))?"%":"points";
    lab.childNodes[0].nodeValue="Valeur ("+unit+")";
  }
}

function dungeonTierSlotRange(tier){
  let start=0;
  for(let t=0;t<tier;t++)start+=DUNGEON_TALENT_TIER_WIDTHS[t];
  return {start,width:DUNGEON_TALENT_TIER_WIDTHS[tier]||0};
}

function dungeonAutoPrerequisitesForSlot(set,slotIndex){
  const tier=dungeonTalentSlotTier(slotIndex);
  if(tier<=0)return [];
  const cur=dungeonTierSlotRange(tier),prev=dungeonTierSlotRange(tier-1);
  const pos=Math.max(0,slotIndex-cur.start);
  // Map proportionally to the closest slot in the previous row.
  const mapped=cur.width<=1?0:Math.round(pos*(Math.max(0,prev.width-1))/Math.max(1,cur.width-1));
  const prevNode=set?.nodes?.[prev.start+mapped];
  return prevNode && !prevNode.empty ? [prevNode.id] : [];
}

function openDungeonTalentNodeEditor(id){
  const set=dungeonTalentSetById(dungeonTalentEditingSetId),node=set?.nodes?.find(n=>n.id===id)||null;
  document.getElementById("dtalentNodeTitle").textContent=node?"✏️ Modifier un talent":"➕ Nouveau talent";
  document.getElementById("dtalentNodeName").value=node?.name||"Nouveau talent";
  document.getElementById("dtalentNodeType").value=node?.type==="active"?"active":"passive";
  document.getElementById("dtalentNodeTier").value=node?dungeonTalentSlotTier(Number(node.slotIndex)||0):dungeonTalentSlotTier(Number(dungeonTalentEditingSlotIndex)||0);
  document.getElementById("dtalentNodeCost").value=Math.max(1,Number(node?.cost)||1);document.getElementById("dtalentNodeTier").closest("label").style.display="";document.getElementById("dtalentNodeCost").closest("label").style.display="";
  document.getElementById("dtalentNodeDesc").value=node?.desc||"";
  
  const e=node?.effects?.[0]||{};
  document.getElementById("dtalentPassiveKind").value=e.kind||"attribute";
  document.getElementById("dtalentPassiveValue").value=Number(e.value)||1;const pvm=document.getElementById("dtalentPassiveValueMode");if(pvm)pvm.value=e.valueMode||"flat";
  document.getElementById("dtalentPassiveAttribute").value=e.attribute||"force";const pr=document.getElementById("dtalentPassiveResistanceKind");if(pr){pr.innerHTML=gensResistanceOptions(e.resistanceKind||"");pr.value=e.resistanceKind||"";}
  document.getElementById("dtalentPassiveMode").value=e.mode||"all";document.getElementById("dtalentPassiveScope").value=e.scope||"self";const pc=document.getElementById("dtalentPassiveCondition");if(pc)pc.value=e.condition==="hpBelow"?"hpBelow":"always";document.getElementById("dtalentPassiveThreshold").value=Math.max(1,Math.min(100,Number(e.threshold)||30));
  const a=node?.activeMeta||node?.active||{};
  document.getElementById("dtalentActiveMana").value=Math.max(0,Number(a.manaCost)||0);
  document.getElementById("dtalentActiveWeapon").value=a.weapon||"";
  document.getElementById("dtalentActiveCooldown").value=Math.max(0,Number(a.cooldown)||0);
  dungeonTalentEffectDraft=JSON.parse(JSON.stringify((node?.type==="active"&&Array.isArray(node?.effects)&&node.effects.length)?node.effects:[dungeonNewTalentEffect()]));
  renderDungeonTalentEffectsEditor();
  updateDungeonTalentNodeTypeUi();
  document.getElementById("dungeonTalentNodeModal").style.display="block";
}

function closeDungeonTalentNodeEditor(){const m=document.getElementById("dungeonTalentNodeModal");if(m)m.style.display="none";gensAbilityLibraryEditMode=false;gensAbilityLibraryEditId=null}

function updateDungeonTalentNodeTypeUi(){
  const active=document.getElementById("dtalentNodeType")?.value==="active";
  const p=document.getElementById("dtalentPassiveFields"),a=document.getElementById("dtalentActiveFields");
  if(p)p.style.display=active?"none":"block";if(a)a.style.display=active?"block":"none";
}

function saveAbilityLibraryEditorFromTalentForm(){
  const arr=loadAbilityLibrary(),ix=arr.findIndex(x=>String(x.id)===String(gensAbilityLibraryEditId));if(ix<0)return;
  const type=document.getElementById("dtalentNodeType")?.value==="active"?"active":"passive";
  const a={...arr[ix],name:document.getElementById("dtalentNodeName")?.value.trim()||"Compétence",desc:document.getElementById("dtalentNodeDesc")?.value.trim()||"",type};
  a.libraryId=gensAbilityLibraryTab||gensAbilityLibraryId(a);a.useRuleOverride=readAbilityUseRuleOverride();a.usageScopes=readAbilityUsageScopes();if(!a.usageScopes.length)a.usageScopes=a.libraryId==="creature"?["captureCreature"]:a.libraryId==="trainer"?["trainer"]:a.libraryId==="companion"?["companion"]:["rpgHero","enemy"];
  if(type==="active"){
    syncDungeonTalentEffectDraftFromDom();
    a.effects=JSON.parse(JSON.stringify(dungeonTalentEffectDraft||[]));
    a.activeMeta={manaCost:Math.max(0,Number(document.getElementById("dtalentActiveMana")?.value)||0),weapon:document.getElementById("dtalentActiveWeapon")?.value||"",cooldown:Math.max(0,Number(document.getElementById("dtalentActiveCooldown")?.value)||0)};
  }else{
    const kind=document.getElementById("dtalentPassiveKind")?.value||"none",value=Number(document.getElementById("dtalentPassiveValue")?.value)||0,valueMode=document.getElementById("dtalentPassiveValueMode")?.value||"flat",attribute=document.getElementById("dtalentPassiveAttribute")?.value||"",resistanceKind=document.getElementById("dtalentPassiveResistanceKind")?.value||"",mode=document.getElementById("dtalentPassiveMode")?.value||"all",scope=document.getElementById("dtalentPassiveScope")?.value||"self",condition=document.getElementById("dtalentPassiveCondition")?.value||"always",threshold=Math.max(1,Math.min(100,Number(document.getElementById("dtalentPassiveThreshold")?.value)||30));
    if(kind==="none")a.effects=[];
    else{const e={kind,value,valueMode:(kind==="resistance"?"percent":valueMode),scope,condition,threshold};if(kind==="attribute"&&attribute)e.attribute=attribute;if(kind==="resistance"&&resistanceKind)e.resistanceKind=resistanceKind;if(kind==="hitChance")e.mode=mode;a.effects=[e]}
    a.activeMeta=null;
  }
  arr[ix]=a;saveAbilityLibrary(arr);gensAbilityLibraryEditMode=false;gensAbilityLibraryEditId=null;
  syncTalentNodesFromAbilityLibrary();closeDungeonTalentNodeEditor();renderDungeonTalentSetEditor();
  const lib=document.getElementById("abilityLibraryModal");if(lib){lib.style.display="block";renderAbilityLibrary();}
  alert("Compétence du répertoire enregistrée ✅");
}

function saveDungeonTalentNode(){   if(gensAbilityLibraryEditMode){saveAbilityLibraryEditorFromTalentForm();return}
  const sets=loadDungeonTalentSets(),set=sets.find(x=>x.id===dungeonTalentEditingSetId);if(!set)return;
  const name=document.getElementById("dtalentNodeName")?.value.trim();if(!name){alert("Donne un nom au talent.");return}
  const type=document.getElementById("dtalentNodeType")?.value==="active"?"active":"passive";
  const old=set.nodes?.find(n=>n.id===dungeonTalentEditingNodeId);
  const id=old?.id||("tal_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,5));
  const reqEl=document.getElementById("dtalentNodeRequires");const requires=reqEl?[...reqEl.selectedOptions].map(o=>o.value).filter(x=>x!==id):[];
  const slotIndex=Number.isInteger(Number(dungeonTalentEditingSlotIndex))?Number(dungeonTalentEditingSlotIndex):(old?.slotIndex??0);
  let node={id,name,desc:document.getElementById("dtalentNodeDesc")?.value.trim()||"",type,slotIndex,tier:dungeonTalentSlotTier(slotIndex),cost:Math.max(1,Number(document.getElementById("dtalentNodeCost")?.value)||1),requires,effects:[]};
  if(type==="active"){
    syncDungeonTalentEffectDraftFromDom();
    node.effects=JSON.parse(JSON.stringify(dungeonTalentEffectDraft.length?dungeonTalentEffectDraft:[dungeonNewTalentEffect()]));
    node.activeMeta={manaCost:Math.max(0,Number(document.getElementById("dtalentActiveMana")?.value)||0),weapon:document.getElementById("dtalentActiveWeapon")?.value||"",cooldown:Math.max(0,Number(document.getElementById("dtalentActiveCooldown")?.value)||0)};
    const first=node.effects[0]||{};node.active={kind:first.kind||"damage",amount:Math.max(0,Number(first.base)||0),manaCost:node.activeMeta.manaCost,weapon:node.activeMeta.weapon,cooldown:node.activeMeta.cooldown};
  }else{
    const kind=document.getElementById("dtalentPassiveKind")?.value||"attribute",value=Number(document.getElementById("dtalentPassiveValue")?.value)||0,valueMode=document.getElementById("dtalentPassiveValueMode")?.value||"flat",attribute=document.getElementById("dtalentPassiveAttribute")?.value||"force",resistanceKind=document.getElementById("dtalentPassiveResistanceKind")?.value||"",mode=document.getElementById("dtalentPassiveMode")?.value||"all",scope=document.getElementById("dtalentPassiveScope")?.value||"self",condition=document.getElementById("dtalentPassiveCondition")?.value||"always",threshold=Math.max(1,Math.min(100,Number(document.getElementById("dtalentPassiveThreshold")?.value)||30));
    const labels={attribute:"Caractéristique",hitChance:"Toucher",defense:"Défense",armor:"Armure",resistance:"Résistance ciblée",mana:"Mana max",maxHp:"PV max",crit:"Critique",dodge:"Esquive",initiative:"Initiative",damageReduction:"Réduction dégâts",regenHp:"Régénération PV/tour",regenMana:"Régénération Mana/tour",};
    if(kind==="none"){node.effects=[];}else{const e={kind,value,valueMode:(kind==="resistance"?"percent":valueMode),scope,condition,threshold,label:(value>=0?"+":"")+value+(kind==="resistance"||valueMode==="percent"?"%":"")+" "+(labels[kind]||kind)+(scope==="team"?" (équipe)":"")+(condition==="hpBelow"?" si PV ≤ "+threshold+"%":"")};if(kind==="attribute"&&attribute)e.attribute=attribute;if(kind==="resistance"&&resistanceKind)e.resistanceKind=resistanceKind;if(kind==="hitChance")e.mode=mode;node.effects=[e];}
  }
  set.nodes=normalizeDungeonTalentSetSlots(set).nodes;
  const oldIx=set.nodes.findIndex(n=>n.id===id);
  if(oldIx>=0 && oldIx!==slotIndex)set.nodes[oldIx]={id:"empty_"+set.id+"_"+oldIx,name:"Emplacement libre",desc:"",type:"empty",empty:true,slotIndex:oldIx,tier:dungeonTalentSlotTier(oldIx),cost:1,requires:[],effects:[]};
  set.nodes[slotIndex]=node;
  saveDungeonTalentSets(sets);dungeonTalentEditingNodeId=id;closeDungeonTalentNodeEditor();renderDungeonTalentSetEditor()
}

function deleteDungeonTalentNode(){
  if(!dungeonTalentEditingNodeId){closeDungeonTalentNodeEditor();return}
  const sets=loadDungeonTalentSets(),set=sets.find(x=>x.id===dungeonTalentEditingSetId);if(!set)return;
  const node=set.nodes?.find(n=>n.id===dungeonTalentEditingNodeId);if(!node)return;
  if(!confirm("Supprimer le talent « "+node.name+" » ?"))return;
  const slotIndex=Number(node.slotIndex)||0;
  set.nodes=set.nodes.map((n,i)=>n.id===node.id?{id:"empty_"+set.id+"_"+i,name:"Emplacement libre",desc:"",type:"empty",empty:true,slotIndex:i,tier:dungeonTalentSlotTier(i),cost:1,requires:[],effects:[]}:{...n,requires:(n.requires||[]).filter(r=>r!==node.id)});
  saveDungeonTalentSets(sets);closeDungeonTalentNodeEditor();renderDungeonTalentSetEditor()
}

function dungeonUnlockedActiveTalents(heroId){
  const st=loadState(heroId),unlocked=new Set(st?.skillTreeUnlocked||[]);
  return dungeonTreeNodesForHero(heroId).filter(n=>!n.empty&&n.type==="active"&&((Array.isArray(n.effects)&&n.effects.length)||n.active)&&unlocked.has(n.id));
}

function dungeonHeroHasRequiredWeapon(heroId,req){
  if(!req)return true;
  const weapons=dungeonCombatHeroWeapons(heroId);
  const norm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const names=weapons.map(w=>norm(w.it?.name||""));
  const modes=weapons.map(w=>norm(w.it?.rpgAttackMode||w.it?.attackMode||"melee"));
  if(req==="melee")return modes.some(m=>m==="melee");
  if(req==="ranged")return modes.some(m=>m==="ranged"||m==="distance");
  if(req==="sword_axe")return names.some(n=>/epee|sword|hache|axe/.test(n));
  if(req==="sword")return names.some(n=>/epee|sword/.test(n));
  if(req==="axe")return names.some(n=>/hache|axe/.test(n));
  if(req==="bow")return names.some(n=>/arc|bow/.test(n));
  if(req==="staff")return names.some(n=>/baton|staff/.test(n));
  return true;
}

function dungeonSpendTalentMana(heroId,cost){
  const st=loadState(heroId),snap=dungeonCombatHeroSnapshot(heroId),c=Math.max(0,Number(cost)||0);
  if((Number(st.mana)||0)<c){alert("Mana insuffisant : "+c+" requis.");return false}
  st.mana=Math.max(0,(Number(st.mana)||0)-c);localStorage.setItem(key(heroId),JSON.stringify(st));if(current===heroId)state=st;return true;
}

function dungeonTalentSaveHeroState(heroId,st){
  localStorage.setItem(key(heroId),JSON.stringify(st));
  if(current===heroId)state=st;
}

function dungeonTalentHealHero(heroId,amount){
  const st=loadState(heroId),before=Math.max(0,Number(st.wounds)||0);
  st.wounds=Math.max(0,before-Math.max(0,Number(amount)||0));
  dungeonTalentSaveHeroState(heroId,st);
  return before-st.wounds;
}

function dungeonTalentRestoreMana(heroId,amount){
  const st=loadState(heroId),snap=dungeonCombatHeroSnapshot(heroId);
  const before=Math.max(0,Number(st.mana)||0),max=Math.max(0,Number(snap.maxMana)||0);
  st.mana=Math.min(max,before+Math.max(0,Number(amount)||0));
  dungeonTalentSaveHeroState(heroId,st);
  return st.mana-before;
}

function dungeonTalentDealDirectDamage(heroId,targetId,amount,damageType="physical",element=""){
  const target=loadActiveEnemies().find(e=>String(e.id)===String(targetId)&&!e.defeated&&Number(e.hp)>0);
  if(!target)return false;
  const def=activeEnemyDefinition(target.enemyId),types=target.elementTypes||def?.rule?.elementTypes||[];
  const mult=gensElementMultiplier(element,types),finalAmount=Math.max(0,Math.round((Number(amount)||0)*mult));
  combatRewardHeroId=heroId;
  attackRollContext={heroId,hits:1,hitDamages:[finalAmount],damageType,element,elementMultiplier:mult};
  applyDungeonAttackDamage(target.id,finalAmount,1,finalAmount);
  attackRollContext=null;
  if(element&&mult!==1)try{showToast((gensElementById(element)?.icon||'🌈')+' '+(mult===0?'Immunité':mult>1?'Faiblesse ×'+mult:'Résistance ×'+mult))}catch(e){}
  return true;
}

function dungeonTalentCalculatedAmount(heroId,e){
  const base=Number(e?.base)||0;if(!e?.scaleAttribute||!Number(e?.scaleCoeff))return Math.max(0,Math.round(base));
  const snap=dungeonCombatHeroSnapshot(heroId),v=Number(snap?.[e.scaleAttribute])||0;return Math.max(0,Math.round(base+v*Number(e.scaleCoeff)));
}

function dungeonTalentCooldownRemaining(heroId,talentId){return Math.max(0,Number(loadState(heroId)?.talentCooldowns?.[talentId])||0)}

function dungeonTalentSetCooldown(heroId,talentId,turns){const st=loadState(heroId);st.talentCooldowns=st.talentCooldowns||{};st.talentCooldowns[talentId]=Math.max(0,Number(turns)||0);dungeonTalentSaveHeroState(heroId,st)}

function dungeonEnemyDerivedForInstance(inst){
  const def=inst?activeEnemyDefinition(inst.enemyId):null,d=def?dungeonEnemyDerived(def):null;if(!d)return d;
  const m=inst?.runtimeMods||{};return {...d,defense:Math.max(0,(Number(d.defense)||0)+(Number(m.defense)||0)),initiative:(Number(d.initiative)||0)+(Number(m.initiative)||0)};
}

function dungeonApplyEnemyTalentStatMod(targetId,e,talentName){
  const list=loadActiveEnemies(),ix=list.findIndex(x=>String(x.id)===String(targetId));if(ix<0)return false;
  const inst=list[ix];inst.runtimeMods=inst.runtimeMods||{actions:0,strength:0,armor:null};inst.talentTimedMods=Array.isArray(inst.talentTimedMods)?inst.talentTimedMods:[];
  const stat=e.stat==="initiative"?"initiative":"defense",value=Number(e.value)||0,duration=Math.max(1,Number(e.duration)||1);
  inst.runtimeMods[stat]=(Number(inst.runtimeMods[stat])||0)+value;inst.talentTimedMods.push({id:"tm_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),stat,value,remaining:duration,label:talentName||"Talent"});list[ix]=inst;saveActiveEnemies(list);return true;
}

function dungeonApplyEnemyTalentDot(heroId,targetId,e,talentName){
  const list=loadActiveEnemies(),ix=list.findIndex(x=>String(x.id)===String(targetId)&&!x.defeated&&Number(x.hp)>0);if(ix<0)return false;
  const inst=list[ix];inst.talentDots=Array.isArray(inst.talentDots)?inst.talentDots:[];
  inst.talentDots.push({id:"dot_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),sourceHeroId:heroId,amount:dungeonTalentCalculatedAmount(heroId,e),damageType:e.damageType||"physical",element:e.element||"",remaining:Math.max(1,Number(e.duration)||1),label:talentName||"Dégâts sur la durée"});
  list[ix]=inst;saveActiveEnemies(list);return true;
}

function dungeonApplyHeroTalentHot(sourceHeroId,targetHeroId,e,talentName){
  const st=loadState(targetHeroId);if(!st)return false;
  st.talentHots=Array.isArray(st.talentHots)?st.talentHots:[];
  st.talentHots.push({id:"hot_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),sourceHeroId:sourceHeroId,targetHeroId:targetHeroId,amount:dungeonTalentCalculatedAmount(sourceHeroId,e),remaining:Math.max(1,Number(e.duration)||1),label:talentName||"Soin sur la durée"});
  dungeonTalentSaveHeroState(targetHeroId,st);return true;
}

function tickDungeonTalentRuntimeEffects(){
  if(!isDungeonMode())return;
  (typeof dungeonParticipants==="function"?dungeonParticipants():[]).forEach(hid=>{
    const st=loadState(hid);
    if(st.talentCooldowns)Object.keys(st.talentCooldowns).forEach(k=>st.talentCooldowns[k]=Math.max(0,(Number(st.talentCooldowns[k])||0)-1));
    const hots=Array.isArray(st.talentHots)?st.talentHots:[],nextHots=[];
    hots.forEach(h=>{
      const amount=Math.max(0,Number(h.amount)||0),before=Math.max(0,Number(st.wounds)||0);
      st.wounds=Math.max(0,before-amount);
      h.remaining=Math.max(0,(Number(h.remaining)||1)-1);
      if(h.remaining>0)nextHots.push(h);
    });
    st.talentHots=nextHots;
    dungeonTalentSaveHeroState(hid,st);
  });
  let list=loadActiveEnemies(),changed=false;
  list.forEach(inst=>{const arr=Array.isArray(inst.talentTimedMods)?inst.talentTimedMods:[],next=[];arr.forEach(m=>{m.remaining=Math.max(0,(Number(m.remaining)||1)-1);if(m.remaining<=0){inst.runtimeMods=inst.runtimeMods||{};inst.runtimeMods[m.stat]=(Number(inst.runtimeMods[m.stat])||0)-(Number(m.value)||0);changed=true}else next.push(m)});inst.talentTimedMods=next});if(changed)saveActiveEnemies(list);
  list=loadActiveEnemies();
  const dots=[];list.forEach(inst=>(Array.isArray(inst.talentDots)?inst.talentDots:[]).forEach(d=>dots.push({targetId:inst.id,dot:{...d}})));
  dots.forEach(x=>{const live=loadActiveEnemies().find(e=>String(e.id)===String(x.targetId)&&!e.defeated&&Number(e.hp)>0);if(!live)return;dungeonTalentDealDirectDamage(x.dot.sourceHeroId,x.targetId,Math.max(0,Number(x.dot.amount)||0),x.dot.damageType||"physical",x.dot.element||"");const fresh=loadActiveEnemies(),ix=fresh.findIndex(e=>String(e.id)===String(x.targetId));if(ix<0)return;const a=Array.isArray(fresh[ix].talentDots)?fresh[ix].talentDots:[],di=a.findIndex(d=>d.id===x.dot.id);if(di>=0){a[di].remaining=Math.max(0,(Number(a[di].remaining)||1)-1);if(a[di].remaining<=0)a.splice(di,1);fresh[ix].talentDots=a;saveActiveEnemies(fresh)}});
}

function dungeonTalentEffectNeedsAlly(e){return ["ally","self","all_allies"].includes(e?.target)}

function dungeonTalentEffectNeedsEnemy(e){return ["enemy","all_enemies"].includes(e?.target)}

function dungeonCombatUseActiveTalent(heroId,talentId,targetId){
  const talent=normalizeDungeonTalentNode(dungeonTreeNodesForHero(heroId).find(n=>n.id===talentId));if(!talent)return;
  const meta=talent.activeMeta||talent.active||{},effects=Array.isArray(talent.effects)?talent.effects:[];if(!effects.length)return;
  const cd=dungeonTalentCooldownRemaining(heroId,talentId);if(cd>0){alert("« "+talent.name+" » est en recharge : "+cd+" tour(s).");return}
  const reqLabel={melee:"arme de mêlée",ranged:"arme à distance",sword_axe:"épée ou hache",sword:"épée",axe:"hache",bow:"arc",staff:"bâton"};
  if(!dungeonHeroHasRequiredWeapon(heroId,meta.weapon)){alert("Arme requise pour « "+talent.name+" » : "+(reqLabel[meta.weapon]||meta.weapon)+".");return}
  if(!dungeonSpendTalentMana(heroId,meta.manaCost))return;

  const livingEnemies=()=>loadActiveEnemies().filter(e=>dungeonCombatSelection.enemies.includes(e.id)&&!e.defeated&&Number(e.hp)>0),notes=[];
  for(const e of effects){
    const amount=dungeonTalentCalculatedAmount(heroId,e),enemyTargets=e.target==="all_enemies"?livingEnemies().map(x=>x.id):[targetId||dungeonCombatHeroTargetOptions()[0]?.id].filter(Boolean);
    const allyTargets=e.target==="all_allies"?dungeonCombatSelection.heroes:(e.target==="self"?[heroId]:[targetId||heroId]);
    if(e.kind==="heal"||e.kind==="heal_all"){
      allyTargets.forEach(hid=>{const n=dungeonTalentHealHero(hid,amount);notes.push((CHARS[hid]?.name||hid)+" +"+n+" PV")});continue;
    }
    if(e.kind==="mana_restore"){
      allyTargets.forEach(hid=>{const n=dungeonTalentRestoreMana(hid,amount);notes.push((CHARS[hid]?.name||hid)+" +"+n+" Mana")});continue;
    }
    if(e.kind==="hot"){
      allyTargets.forEach(hid=>{if(dungeonApplyHeroTalentHot(heroId,hid,e,talent.name))notes.push((CHARS[hid]?.name||hid)+" : "+amount+" PV/tour · "+Math.max(1,Number(e.duration)||1)+"t")});continue;
    }
    if(e.kind==="dot"){
      enemyTargets.forEach(tid=>{if(dungeonApplyEnemyTalentDot(heroId,tid,e,talent.name))notes.push(dungeonTalentEffectLabel(e)+" · "+Math.max(1,Number(e.duration)||1)+"t")});continue;
    }
    if(e.kind==="stat_mod"){
      enemyTargets.forEach(tid=>{if(dungeonApplyEnemyTalentStatMod(tid,e,talent.name))notes.push((Number(e.value)>=0?"+":"")+(Number(e.value)||0)+" "+(e.stat==="initiative"?"Initiative":"Défense")+" · "+Math.max(1,Number(e.duration)||1)+"t")});continue;
    }
    if(e.kind==="double_strike"){
      enemyTargets.forEach(tid=>{dungeonTalentDealDirectDamage(heroId,tid,amount,"physical",e.element||"");const alive=loadActiveEnemies().find(x=>String(x.id)===String(tid)&&!x.defeated&&Number(x.hp)>0);if(alive)dungeonTalentDealDirectDamage(heroId,tid,amount,"physical",e.element||"")});notes.push("Double frappe : "+amount+" ×2");continue;
    }
    if(e.kind==="life_steal"){
      enemyTargets.forEach(tid=>dungeonTalentDealDirectDamage(heroId,tid,amount,"physical",e.element||""));const n=dungeonTalentHealHero(heroId,Math.max(1,Math.floor(amount/2)));notes.push(amount+" dégâts · +"+n+" PV");continue;
    }
    if(e.kind==="execute"){
      enemyTargets.forEach(tid=>{const inst=loadActiveEnemies().find(x=>String(x.id)===String(tid)),low=inst&&Number(inst.maxHp)>0&&(Number(inst.hp)/Number(inst.maxHp)<=.25),dmg=low?amount*2:amount;dungeonTalentDealDirectDamage(heroId,tid,dmg,"physical",e.element||"");notes.push("Exécution : "+dmg+" dégâts"+(low?" ×2":""))});continue;
    }
    const dtype=e.kind==="magic_damage"?"magical":"physical";
    enemyTargets.forEach(tid=>dungeonTalentDealDirectDamage(heroId,tid,amount,dtype,e.element||""));notes.push(dungeonTalentEffectLabel(e)+" → "+enemyTargets.length+" cible(s)");
  }
  if(Math.max(0,Number(meta.cooldown)||0)>0)dungeonTalentSetCooldown(heroId,talentId,meta.cooldown);
  alert("⚡ "+talent.name+(notes.length?"\n"+notes.join("\n"):""));renderDungeonCombatRound();try{render()}catch(e){}
}
