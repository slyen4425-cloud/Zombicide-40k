/* GenSrpG — Phase12 R10 : déclarations historiques Capture du grand script R09.
 * Propriétaire : Capture du dépôt principal ; aucune initialisation partagée déplacée.
 * Chargement classique synchrone avant le script historique ; fonctions inchangées.
 */
function captureCloseModal(id){const m=document.getElementById(id);if(m){m.style.display="none";m.classList.remove("open")}}

function captureOpenModal(id){
  const m=document.getElementById(id);if(!m){alert("Fenêtre introuvable : "+id);return}
  if(m.parentElement!==document.body)document.body.appendChild(m);
  m.hidden=false;m.style.setProperty("display","flex","important");
  m.style.visibility="visible";m.style.opacity="1";m.classList.add("open");
  const b=m.querySelector(".modalBox");if(b)b.scrollTop=0;
}

function captureXpForDefeat(enemyLevel, allyLevel, trainerBattle=false){
  enemyLevel=Math.max(1,Number(enemyLevel)||1);
  allyLevel=Math.max(1,Number(allyLevel)||1);
  const base=10+(enemyLevel*4);
  const ratio=enemyLevel/allyLevel;
  const difficulty=Math.max(0.18,Math.min(2.25,ratio));
  const trainerBonus=trainerBattle?1.20:1;
  return Math.max(1,Math.round(base*difficulty*trainerBonus));
}

function captureXpToNextLevel(level){
  level=Math.max(1,Number(level)||1);
  return Math.round(35 + level*18 + level*level*4);
}

function captureApplyXpToInstance(inst,amount){
  if(!inst)return {levels:0,level:Number(inst?.level)||1,xp:Number(inst?.xp)||0};
  const pr=captureCreatureProgressRules();
  amount=Math.max(0,Number(amount)||0)*pr.xpMultiplier;
  inst.level=Math.max(1,Number(inst.level)||1);
  inst.xp=Math.max(0,Number(inst.xp)||0)+Math.round(amount);
  inst.talentPoints=Math.max(0,Number(inst.talentPoints)||0);
  inst.statPoints=Math.max(0,Number(inst.statPoints)||0);
  inst.statAlloc=inst.statAlloc&&typeof inst.statAlloc==="object"?inst.statAlloc:{};
  let levels=0,guard=0;
  while(guard++<50){
    const need=captureXpToNextLevel(inst.level);
    if(inst.xp<need)break;
    inst.xp-=need;inst.level++;levels++;
    inst.statPoints+=pr.statPointsPerLevel;
    if(inst.level%pr.talentEvery===0)inst.talentPoints++;
    const ent=loadSharedEntities().find(x=>String(x.id)===String(inst.entityId));
    if(ent){
      inst.knownAbilityIds=Array.isArray(inst.knownAbilityIds)?inst.knownAbilityIds:[];
      inst.pendingAbilityIds=Array.isArray(inst.pendingAbilityIds)?inst.pendingAbilityIds:[];
      captureCreatureAvailableMoves(inst,ent).forEach(a=>{
        if(captureAbilityRequiredLevel(a)===inst.level&&!inst.knownAbilityIds.includes(a.id)&&!inst.pendingAbilityIds.includes(a.id))inst.pendingAbilityIds.push(a.id);
      });
    }
    captureCheckCreatureEvolution(inst);
    const oldMax=Math.max(1,Number(inst.maxHp)||10);
    inst.maxHp=oldMax+2;inst.hp=Math.min(inst.maxHp,Math.max(0,Number(inst.hp)||oldMax)+2);
  }
  return {levels,level:inst.level,xp:inst.xp,next:captureXpToNextLevel(inst.level),talentPoints:inst.talentPoints,statPoints:inst.statPoints};
}

function captureAwardBattleXp(battle){
  if(!battle||battle._xpAwarded||battle.victory?.winner!=="A")return null;
  const heroId=captureActiveHeroId();if(!heroId)return null;
  const st=ensureHeroCreatureState(loadState(heroId));
  const enemies=battle.sides?.B?.creatures||[];
  const allies=battle.sides?.A?.creatures||[];
  if(!enemies.length||!allies.length)return null;
  const trainer=battle.type==="trainer";
  const details=[];
  allies.forEach(a=>{
    const uid=String(a.source?._instance?.uid||"");
    const inst=[...(st.creatureTeam||[]),...(st.creatureReserve||[])].find(x=>String(x.uid)===uid);
    if(!inst)return;
    const total=enemies.reduce((sum,e)=>sum+captureXpForDefeat(e.level||e.source?.level||1,inst.level||1,trainer),0);
    const result=captureApplyXpToInstance(inst,total);
    details.push({name:a.name||"Créature",xp:total,...result});
  });
  if(details.length){
    saveHeroCreatureState(heroId,st);
    battle._xpAwarded=true;
    battle.xpRewards=details;
    battle.log?.push({round:battle.round,type:"xp",text:details.map(x=>x.name+" +"+x.xp+" XP").join(" · ")});
  }
  return details;
}

function captureElementRulesKey(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_elements_v1_"+id;
}

function captureElementRules(){
  const d={enabled:true,resistMultiplier:.65,weakMultiplier:1.5};
  try{Object.assign(d,JSON.parse(localStorage.getItem(captureElementRulesKey())||"{}"))}catch(e){}
  d.enabled=d.enabled!==false;d.resistMultiplier=Math.max(0,Number(d.resistMultiplier)||.65);d.weakMultiplier=Math.max(1,Number(d.weakMultiplier)||1.5);
  return d;
}

function captureSaveElementRulesFromUi(){
  const g=id=>document.getElementById(id),r=captureElementRules();
  if(g("capElem_on"))r.enabled=!!g("capElem_on").checked;
  if(g("capElem_res"))r.resistMultiplier=Math.max(0,Number(g("capElem_res").value)||.65);
  if(g("capElem_weak"))r.weakMultiplier=Math.max(1,Number(g("capElem_weak").value)||1.5);
  localStorage.setItem(captureElementRulesKey(),JSON.stringify(r));
}

function captureLoadElementRulesUi(){
  const r=captureElementRules(),g=id=>document.getElementById(id);
  if(g("capElem_on"))g("capElem_on").checked=r.enabled;
  if(g("capElem_res"))g("capElem_res").value=r.resistMultiplier;
  if(g("capElem_weak"))g("capElem_weak").value=r.weakMultiplier;
}

function captureElementDamageMultiplier(target,element){
  const r=captureElementRules();if(!r.enabled||!element)return {mult:1,label:""};
  const src=target?.source||{},res=Array.isArray(src.elementResistances)?src.elementResistances:[],weak=Array.isArray(src.elementWeaknesses)?src.elementWeaknesses:[];
  if(weak.includes(element))return {mult:r.weakMultiplier,label:"SUPER EFFICACE !"};
  if(res.includes(element))return {mult:r.resistMultiplier,label:"RÉSISTE"};
  return {mult:1,label:""};
}

function captureCreatureProgressRulesKey(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_progress_v2_"+id;
}

function captureCreatureProgressRules(){
  const d={xpMultiplier:1,statCap:300,statPointsPerLevel:5,talentEvery:5,maxMoves:4,moveRelearn:"free"};
  try{Object.assign(d,GensStorageV1.readJson(localStorage,captureCreatureProgressRulesKey(),{}))}catch(e){}
  d.xpMultiplier=Math.max(0,Number(d.xpMultiplier)||1);
  d.statCap=Math.max(1,Math.round(Number(d.statCap)||300));
  d.statPointsPerLevel=Math.max(0,Math.round(Number(d.statPointsPerLevel)||5));
  d.talentEvery=Math.max(1,Math.round(Number(d.talentEvery)||5));
  d.maxMoves=Math.max(1,Math.min(12,Math.round(Number(d.maxMoves)||4)));
  return d;
}

function captureSaveCreatureProgressRulesFromUi(){
  const g=id=>document.getElementById(id);
  const r=captureCreatureProgressRules();
  if(g("capProg_xp"))r.xpMultiplier=Math.max(0,Number(g("capProg_xp").value)||1);
  if(g("capProg_cap"))r.statCap=Math.max(1,Math.round(Number(g("capProg_cap").value)||300));
  if(g("capProg_points"))r.statPointsPerLevel=Math.max(0,Math.round(Number(g("capProg_points").value)||5));
  if(g("capProg_talent"))r.talentEvery=Math.max(1,Math.round(Number(g("capProg_talent").value)||5));
  if(g("capProg_moves"))r.maxMoves=Math.max(1,Math.min(12,Math.round(Number(g("capProg_moves").value)||4)));
  if(g("capProg_relearn"))r.moveRelearn=g("capProg_relearn").value;
  GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),r);
}

function captureLoadCreatureProgressRulesUi(){
  const r=captureCreatureProgressRules(),set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
  set("capProg_xp",r.xpMultiplier);set("capProg_cap",r.statCap);set("capProg_points",r.statPointsPerLevel);
  set("capProg_talent",r.talentEvery);set("capProg_moves",r.maxMoves);set("capProg_relearn",r.moveRelearn);
}

function captureCreatureStatRulesKey(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_creature_stats_v1_"+id;
}

function captureCreatureStatRules(){
  const defs={
    hp:{enabled:true,scale:1},power:{enabled:true,scale:1},defense:{enabled:true,scale:1},
    agility:{enabled:true,scale:1},speed:{enabled:true,scale:1},spirit:{enabled:true,scale:1}
  };
  try{
    const raw=JSON.parse(localStorage.getItem(captureCreatureStatRulesKey())||"{}");
    Object.keys(defs).forEach(k=>{
      if(raw[k]){defs[k].enabled=raw[k].enabled!==false;defs[k].scale=Math.max(0,Number(raw[k].scale)||1)}
    });
  }catch(e){}
  return defs;
}

function captureSaveCreatureStatRulesFromUi(){
  const r=captureCreatureStatRules();
  Object.keys(r).forEach(k=>{
    const en=document.getElementById("capStat_"+k+"_on"),sc=document.getElementById("capStat_"+k+"_scale");
    if(en)r[k].enabled=!!en.checked;
    if(sc)r[k].scale=Math.max(0,Number(sc.value)||1);
  });
  localStorage.setItem(captureCreatureStatRulesKey(),JSON.stringify(r));
}

function captureLoadCreatureStatRulesUi(){
  const r=captureCreatureStatRules();
  Object.keys(r).forEach(k=>{
    const en=document.getElementById("capStat_"+k+"_on"),sc=document.getElementById("capStat_"+k+"_scale");
    if(en)en.checked=r[k].enabled!==false;
    if(sc)sc.value=r[k].scale;
  });
}

function captureScaledStat(key,value){
  const r=captureCreatureStatRules()[key];
  return !r||r.enabled===false?0:Math.max(0,Number(value)||0)*Math.max(0,Number(r.scale)||1);
}

function captureBattleModeKey(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_battle_mode_v1_"+id;
}

function captureBattleMode(){
  try{
    const v=localStorage.getItem(captureBattleModeKey())||"classic";
    return ["classic","rpg","active"].includes(v)?v:"classic";
  }catch(e){return "classic"}
}

function captureSetBattleMode(v){
  if(!["classic","rpg","active"].includes(v))v="classic";
  localStorage.setItem(captureBattleModeKey(),v);
  const sel=document.getElementById("captureBattleModeSelect");if(sel)sel.value=v;
}

function captureBattleModeLabel(v=captureBattleMode()){
  return v==="rpg"?"🎲 JDR / Dés":v==="active"?"⚡ Actif":"🎮 Classique";
}

function captureWildRulesKey(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_wild_rules_v1_"+id;
}

function captureWildBattleRules(){
  const d={pct1:100,pct2:0,pct3:0,playerSlots:"match",recallCost:"turn"};
  try{return {...d,...JSON.parse(localStorage.getItem(captureWildRulesKey())||"{}")}}catch(e){return d}
}

function captureSaveWildBattleRules(){
  const n=id=>Math.max(0,Math.min(100,Number(document.getElementById(id)?.value)||0));
  const r={
    pct1:n("captureWildPct1"),pct2:n("captureWildPct2"),pct3:n("captureWildPct3"),
    playerSlots:document.getElementById("captureWildPlayerSlots")?.value||"match",
    recallCost:document.getElementById("captureWildRecall")?.value||"turn"
  };
  if((r.pct1+r.pct2+r.pct3)<=0){r.pct1=100;r.pct2=0;r.pct3=0}
  localStorage.setItem(captureWildRulesKey(),JSON.stringify(r));
  captureCloseModal("captureMjBattleRuleModal");
}

function captureLoadNextBattleOverride(){
  try{return JSON.parse(localStorage.getItem(GENS_CAPTURE_NEXT_BATTLE_RULES_KEY)||"null")}catch(e){return null}
}

function captureClearNextBattleOverride(){try{localStorage.removeItem(GENS_CAPTURE_NEXT_BATTLE_RULES_KEY)}catch(e){}}

function captureMjConfigureBattle(){
  if(typeof isGameMasterDevice==="function"&&!isGameMasterDevice()){alert("Réservé au MJ.");return}
  const w=captureWildBattleRules(),o=captureLoadNextBattleOverride()||{};
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
  set("captureBattleModeSelect",captureBattleMode());
  captureLoadCreatureStatRulesUi();
  captureLoadCreatureProgressRulesUi();
  captureLoadElementRulesUi();
  set("captureWildPct1",w.pct1);set("captureWildPct2",w.pct2);set("captureWildPct3",w.pct3);
  set("captureWildPlayerSlots",w.playerSlots||"match");set("captureWildRecall",w.recallCost||"turn");
  set("captureMjNextSlots",o.activeSlots??"auto");set("captureMjNextTeam",o.teamSize??"auto");set("captureMjNextRecall",o.recallCost??"auto");
  captureOpenModal("captureMjBattleRuleModal");
}

function captureSaveMjNextBattleRules(){
  const val=id=>document.getElementById(id)?.value||"auto";
  const o={activeSlots:val("captureMjNextSlots"),teamSize:val("captureMjNextTeam"),recallCost:val("captureMjNextRecall")};
  localStorage.setItem(GENS_CAPTURE_NEXT_BATTLE_RULES_KEY,JSON.stringify(o));
  captureCloseModal("captureMjBattleRuleModal");
  alert("Réglage MJ enregistré pour le prochain combat.");
}

function captureWeightedWildGroupSize(){
  const w=captureWildBattleRules();
  const a=Math.max(0,Number(w.pct1)||0),b=Math.max(0,Number(w.pct2)||0),c=Math.max(0,Number(w.pct3)||0);
  const total=a+b+c;if(total<=0)return 1;
  const r=Math.random()*total;
  return r<a?1:r<a+b?2:3;
}

function captureWildEnemyRoster(primary){
  const locId=captureWorldState().locationId;
  const loc=captureProfileLocations().find(x=>String(x.id)===String(locId));
  const wanted=captureWeightedWildGroupSize();
  const roster=[primary];
  if(wanted<=1)return roster;
  let compatible=[];
  try{
    compatible=loc?gensLocationCompatibleCreatures(loc):gensEncounterCreatures();
  }catch(e){compatible=gensEncounterCreatures()}
  compatible=compatible.filter(x=>String(x.id)!==String(primary.id));
  while(roster.length<wanted){
    const source=compatible.length?compatible:gensEncounterCreatures();
    if(!source.length)break;
    roster.push(source[Math.floor(Math.random()*source.length)]);
  }
  return roster;
}

function captureAutoTrainerRules(playerRoster){
  const maxPlayer=Math.max(1,Math.min(6,playerRoster.length));
  const activeSlots=Math.max(1,Math.min(3,1+Math.floor(Math.random()*Math.min(3,maxPlayer))));
  const minTeam=Math.max(activeSlots,Math.min(3,maxPlayer));
  const teamSize=Math.max(activeSlots,Math.min(maxPlayer,minTeam+Math.floor(Math.random()*(Math.max(1,maxPlayer-minTeam+1)))));
  return {activeSlots,teamSize};
}

function captureApplyBattleOverride(rules){
  const o=captureLoadNextBattleOverride();
  if(!o)return rules;
  if(o.activeSlots&&o.activeSlots!=="auto")rules.activeSlots=Math.max(1,Math.min(3,Number(o.activeSlots)||rules.activeSlots));
  if(o.teamSize&&o.teamSize!=="auto")rules.teamSize=Math.max(1,Math.min(6,Number(o.teamSize)||rules.teamSize));
  if(o.recallCost&&o.recallCost!=="auto")rules.recallCost=o.recallCost;
  captureClearNextBattleOverride();
  return rules;
}

function captureStartBattleAutomatic(sideA,sideB,rules){
  rules=captureApplyBattleOverride({...rules});
  const b=gensCreateCaptureBattle(sideA,sideB,rules);
  if(!b){alert("Impossible de créer le combat.");return null}
  gensCaptureBattleInit(b);
  window.gensCurrentCaptureBattle=b;
  gensCaptureBattleStartTurn(b);
  captureOpenModal("captureBattleLiveModal");
  captureBattleRunAiUntilHuman(b);
  return b;
}

function captureCreatureDerivedStats(inst,ent){
  const lvl=Math.max(1,Number(inst?.level||ent?.level)||1),pr=captureCreatureProgressRules();
  const talents=Array.isArray(inst?.talents)?inst.talents:[],alloc=inst?.statAlloc&&typeof inst.statAlloc==="object"?inst.statAlloc:{};
  const rank=id=>talents.filter(t=>t&&t.id===id).reduce((n,t)=>n+Math.max(1,Number(t.rank)||1),0);
  const vit=rank("vitality"),pow=rank("power"),defTal=rank("defense"),agiTal=rank("agility"),spd=rank("speed");
  const cap=v=>Math.min(pr.statCap,Math.max(0,Math.round(v)));
  const baseHp=Math.max(1,Number(ent?.hp||ent?.stats?.hp||10)||10);
  const rawHp=Math.max(1,Number(inst?.maxHp)||baseHp+Math.max(0,lvl-1)*2)+vit*2+Math.max(0,Number(alloc.hp)||0);
  const rawPower=Math.max(1,Number(ent?.stats?.power??ent?.stats?.force??ent?.force??5)||5)+Math.floor((lvl-1)/2)+pow*2+Math.max(0,Number(alloc.power)||0);
  const rawDefense=Math.max(1,Number(ent?.stats?.defense??ent?.defense??5)||5)+Math.floor((lvl-1)/3)+defTal*2+Math.max(0,Number(alloc.defense)||0);
  const rawAgility=Math.max(1,Number(ent?.stats?.agility??ent?.stats?.agilite??ent?.agility??5)||5)+Math.floor((lvl-1)/3)+agiTal*2+Math.max(0,Number(alloc.agility)||0);
  const rawSpeed=Math.max(1,Number(ent?.stats?.speed??ent?.speed??5)||5)+Math.floor((lvl-1)/3)+spd*2+Math.max(0,Number(alloc.speed)||0);
  const rawSpirit=Math.max(1,Number(ent?.stats?.spirit??ent?.stats?.esprit??ent?.spirit??5)||5)+Math.floor((lvl-1)/3)+Math.max(0,Number(alloc.spirit)||0);
  const rules=captureCreatureStatRules();
  const val=(key,v)=>rules[key]?.enabled===false?0:cap(v*Math.max(0,Number(rules[key]?.scale)||1));
  return {lvl,maxHp:rules.hp.enabled===false?1:Math.max(1,val("hp",rawHp)),force:val("power",rawPower),defense:val("defense",rawDefense),agi:val("agility",rawAgility),speed:val("speed",rawSpeed),spirit:val("spirit",rawSpirit),talentRanks:{vitality:vit,power:pow,defense:defTal,agility:agiTal,speed:spd}};
}

function captureCheckCreatureEvolution(inst){
  if(!inst)return null;
  const ent=loadSharedEntities().find(x=>String(x.id)===String(inst.entityId));
  const target=ent?.evolution?.targetId||ent?.evolutionTo||"";
  const level=Number(ent?.evolution?.level??ent?.evolutionLevel??16)||16;
  if(!ent?.canEvolve||!target||Number(inst.level||1)<level)return null;
  inst.pendingEvolutionTo=target;
  return target;
}

function captureEvolveCreature(uid){
  const f=captureFindOwnedCreature(uid);if(!f)return;const {heroId,st,inst,entity}=f;
  const to=loadSharedEntities().find(x=>String(x.id)===String(inst.pendingEvolutionTo||entity.evolutionTo));if(!to)return;
  inst.entityId=to.id;inst.pendingEvolutionTo="";inst.maxHp=Math.max(Number(inst.maxHp)||1,Number(to.hp)||1);inst.hp=Math.min(inst.maxHp,Math.max(1,Number(inst.hp)||1));
  inst.knownAbilityIds=[...new Set([...(inst.knownAbilityIds||[]),...(to.abilityIds||[]).filter(id=>captureAbilityRequiredLevel(captureBattleAbilityById(id))<=Number(inst.level||1))])];
  saveHeroCreatureState(heroId,st);captureOpenCreatureDetail(uid);
}

function captureSpendCreatureStat(uid,stat){
  const allowed=["hp","power","defense","agility","speed","spirit"];if(!allowed.includes(stat))return;
  const f=captureFindOwnedCreature(uid);if(!f)return;
  const {heroId,st,inst,entity}=f,pr=captureCreatureProgressRules(),rules=captureCreatureStatRules();
  if(rules[stat]?.enabled===false){alert("Cette statistique est désactivée dans cet univers.");return}
  if(Math.max(0,Number(inst.statPoints)||0)<1)return;
  const d=captureCreatureDerivedStats(inst,entity),map={hp:"maxHp",power:"force",defense:"defense",agility:"agi",speed:"speed",spirit:"spirit"};
  if(Number(d[map[stat]])>=pr.statCap){alert("Plafond de "+pr.statCap+" atteint.");return}
  inst.statAlloc=inst.statAlloc&&typeof inst.statAlloc==="object"?inst.statAlloc:{};
  inst.statAlloc[stat]=Math.max(0,Number(inst.statAlloc[stat])||0)+1;inst.statPoints--;
  saveHeroCreatureState(heroId,st);captureOpenCreatureDetail(uid);
}

function captureAbilityRequiredLevel(a){return Math.max(1,Number(a?.requiredLevel??a?.learnLevel??a?.levelRequired??1)||1)}

function captureCreatureAvailableMoves(inst,ent){
  const all=loadAbilityLibrary().filter(a=>gensAbilityLibraryId(a)==="creature"),lvl=Math.max(1,Number(inst?.level)||1);
  const speciesIds=Array.isArray(ent?.abilityIds)?ent.abilityIds:[];
  const els=new Set((ent?.elementTypes||[]).map(String));
  return all.filter(a=>{
    if(captureAbilityRequiredLevel(a)>lvl)return false;
    if(speciesIds.includes(a.id))return true;
    if(a.captureRoster && (!a.element || els.has(String(a.element))))return true;
    return false;
  }).sort((a,b)=>captureAbilityRequiredLevel(a)-captureAbilityRequiredLevel(b)||(Number(a.power)||0)-(Number(b.power)||0));
}

function captureSetCreatureMove(uid,newId,oldId=""){
  const f=captureFindOwnedCreature(uid);if(!f)return;
  const {heroId,st,inst,entity}=f,pr=captureCreatureProgressRules();
  inst.knownAbilityIds=Array.isArray(inst.knownAbilityIds)?inst.knownAbilityIds:[];
  inst.activeAbilityIds=Array.isArray(inst.activeAbilityIds)?inst.activeAbilityIds:(entity?.abilityIds||[]).slice(0,pr.maxMoves);
  if(!inst.knownAbilityIds.includes(newId))inst.knownAbilityIds.push(newId);
  if(oldId){const i=inst.activeAbilityIds.indexOf(oldId);if(i>=0)inst.activeAbilityIds[i]=newId}
  else if(!inst.activeAbilityIds.includes(newId)&&inst.activeAbilityIds.length<pr.maxMoves)inst.activeAbilityIds.push(newId);
  saveHeroCreatureState(heroId,st);captureOpenCreatureDetail(uid);
}

function captureOpenCreatureDetail(uid){
  const f=captureFindOwnedCreature(uid);if(!f)return;
  const {inst,entity:ent}=f,host=document.getElementById("captureCreatureDetailBody");if(!host||!ent)return;
  const d=captureCreatureDerivedStats(inst,ent),xp=Math.max(0,Number(inst.xp)||0),need=captureXpToNextLevel(d.lvl),pct=Math.min(100,Math.round(xp/Math.max(1,need)*100));
  const art=ent.iconData||ent.artData||ent.image||"";
  const tags=(ent.elementTypes||ent.spawnTags||ent.elements||ent.tags||[]).map(x=>typeof x==="string"?x:(x.tagId||x.name||"")).filter(Boolean);
  const pr=captureCreatureProgressRules();
  inst.knownAbilityIds=Array.isArray(inst.knownAbilityIds)?inst.knownAbilityIds:[...(ent.abilityIds||[])];
  inst.activeAbilityIds=Array.isArray(inst.activeAbilityIds)?inst.activeAbilityIds:[...(ent.abilityIds||[])].filter(id=>captureAbilityRequiredLevel(captureBattleAbilityById(id))<=d.lvl).slice(0,pr.maxMoves);
  const abilities=inst.activeAbilityIds.map(captureBattleAbilityById).filter(Boolean);
  const available=captureCreatureAvailableMoves(inst,ent);
  const talents=[
    {id:"vitality",icon:"❤️",name:"Vitalité",desc:"+2 PV max / rang"},
    {id:"power",icon:"⚔️",name:"Puissance",desc:"+2 Puissance / rang"},
    {id:"defense",icon:"🛡️",name:"Carapace",desc:"+2 Défense / rang"},
    {id:"agility",icon:"💨",name:"Instinct",desc:"+2 Agilité / rang"},
    {id:"speed",icon:"⚡",name:"Vélocité",desc:"+2 Vitesse / rang"}
  ];
  const rank=id=>Number(d.talentRanks?.[id]||0);
  host.innerHTML=`<div class="captureCreatureProfile">
    <div class="captureCreatureHero">
      ${art?`<img src="${z40kEscAttr(art)}">`:`<div class="captureCreaturePlaceholder">🐲</div>`}
      <div><h2>${z40kEscHtml(ent.name||"Créature")}</h2><div>Niveau <strong>${d.lvl}</strong></div><div class="small">${tags.map(z40kEscHtml).join(" · ")||"Type non défini"}</div></div>
    </div>
    <div class="captureXpBar"><i style="width:${pct}%"></i></div><div class="small">XP ${xp} / ${need}</div>
    <div class="captureStatGrid">
      <div><span>❤️ PV</span><strong>${Math.max(0,Number(inst.hp??d.maxHp))} / ${d.maxHp}</strong><small>Résistance avant K.O.</small></div>
      <div><span>⚔️ Puissance</span><strong>${d.force}</strong><small>Dégâts infligés</small></div>
      <div><span>🛡️ Défense</span><strong>${d.defense}</strong><small>Réduit les dégâts reçus</small></div>
      <div><span>💨 Agilité</span><strong>${d.agi}</strong><small>Critique + esquive</small></div>
      <div><span>⚡ Vitesse</span><strong>${d.speed}</strong><small>Ordre d'action</small></div>
      <div><span>✨ Esprit</span><strong>${d.spirit}</strong><small>Soins + capacités</small></div>
    </div>
    <div class="captureStatHelp">
      <strong>ℹ️ Effet des caractéristiques</strong>
      <div>⚔️ <b>Puissance</b> : augmente les dégâts infligés.</div>
      <div>🛡️ <b>Défense</b> : réduit progressivement les dégâts reçus.</div>
      <div>💨 <b>Agilité</b> : augmente les chances de critique et d'esquive.</div>
      <div>⚡ <b>Vitesse</b> : détermine l'ordre d'action.</div>
      <div>✨ <b>Esprit</b> : augmente les soins et les capacités spéciales.</div>
      <div>❤️ <b>PV</b> : à 0, la créature est K.O.</div>
    </div>
    <div class="captureAffinityBox">
      <b>🧬 Affinités</b>
      <span>Résiste : ${(ent.elementResistances||[]).length?(ent.elementResistances||[]).map(z40kEscHtml).join(", "):"—"}</span>
      <span>Faible : ${(ent.elementWeaknesses||[]).length?(ent.elementWeaknesses||[]).map(z40kEscHtml).join(", "):"—"}</span>
      <span>Évolution : ${ent.canEvolve?(z40kEscHtml(loadSharedEntities().find(x=>String(x.id)===String(ent.evolution?.targetId||ent.evolutionTo))?.name||ent.evolution?.targetId||ent.evolutionTo)+" au niv. "+Number(ent.evolution?.level??ent.evolutionLevel??16)):"forme finale"}</span>
    </div>${inst.pendingEvolutionTo?`<button class="captureEvolveBtn" onclick="captureEvolveCreature('${z40kEscAttr(inst.uid)}')">✨ FAIRE ÉVOLUER</button>`:""}
    <h3 style="margin:14px 0 7px">➕ Points de caractéristiques <span class="small">· ${Math.max(0,Number(inst.statPoints)||0)} disponible(s) · plafond ${captureCreatureProgressRules().statCap}</span></h3>
    <div class="captureStatSpend">
      ${[["hp","❤️ PV"],["power","⚔️ Puissance"],["defense","🛡️ Défense"],["agility","💨 Agilité"],["speed","⚡ Vitesse"],["spirit","✨ Esprit"]].map(x=>`<button ${Math.max(0,Number(inst.statPoints)||0)<1||captureCreatureStatRules()[x[0]]?.enabled===false?"disabled":""} onclick="captureSpendCreatureStat('${z40kEscAttr(inst.uid)}','${x[0]}')">+1 ${x[1]}</button>`).join("")}
    </div>
    <h3 style="margin:14px 0 7px">⚡ Compétences actives</h3>
    <div class="captureAbilityMini">${abilities.length?abilities.map(a=>`<button onclick="showAbilityInfo('${z40kEscAttr(a.id)}')"><b>${z40kEscHtml(a.name)} · P${Number(a.power)||0}</b><span>Niv. ${captureAbilityRequiredLevel(a)} · ${z40kEscHtml(a.desc||a.category||"Compétence")}</span></button>`).join(""):'<div class="empty">Aucune compétence active.</div>'}</div>
    <details class="captureLearnset"><summary>📚 Capacités disponibles (${available.length})</summary><div class="captureLearnsetGrid">${available.map(a=>{
      const active=inst.activeAbilityIds.includes(a.id),known=inst.knownAbilityIds.includes(a.id);
      return `<div class="captureLearnMove"><b>${z40kEscHtml(a.name)}</b><span>${a.element?z40kEscHtml(a.element)+" · ":""}Niv. ${captureAbilityRequiredLevel(a)} · Puissance ${Number(a.power)||0}</span>${active?`<em>ACTIVE</em>`:inst.activeAbilityIds.length<pr.maxMoves?`<button onclick="captureSetCreatureMove('${z40kEscAttr(inst.uid)}','${z40kEscAttr(a.id)}')">${known?"ÉQUIPER":"APPRENDRE"}</button>`:`<small>4 capacités actives : remplace une capacité depuis la gestion avancée.</small>`}</div>`;
    }).join("")}</div></details>
    <div class="hint" style="text-align:left;margin-top:7px">Courbe de puissance lissée : P3 niv.1 → P4 niv.5 → P5 niv.10 → P6 niv.16 → P7 niv.24 → P8 niv.34 → P10 niv.46. Les techniques utilitaires compensent leur puissance brute plus faible par leurs effets.</div>
    <h3 style="margin:14px 0 7px">🌿 Mini-arbre de talents <span class="small">· ${Math.max(0,Number(inst.talentPoints)||0)} point(s)</span></h3>
    <div class="captureTalentMini">${talents.map(t=>`<button ${(Number(inst.talentPoints||0)<1||rank(t.id)>=5)?"disabled":""} onclick="captureBuyCreatureTalent('${z40kEscAttr(inst.uid)}','${t.id}')"><b>${t.icon} ${t.name} · ${rank(t.id)}/5</b><span>${t.desc}</span></button>`).join("")}</div>
    <div class="hint" style="text-align:left;margin-top:9px">Chaque niveau donne 1 point de talent. Les branches pourront ensuite être personnalisées espèce par espèce.</div>
  </div>`;
  captureOpenModal("captureCreatureDetailModal");
}

function captureBuyCreatureTalent(uid,talentId){
  const f=captureFindOwnedCreature(uid);if(!f)return;
  const {heroId,st,inst}=f;
  if(Math.max(0,Number(inst.talentPoints)||0)<1)return;
  inst.talents=Array.isArray(inst.talents)?inst.talents:[];
  const existing=inst.talents.find(t=>t&&t.id===talentId);
  const currentRank=existing?Math.max(1,Number(existing.rank)||1):0;
  if(currentRank>=5){alert("Ce talent est déjà au rang maximum (5).");return}
  if(existing)existing.rank=currentRank+1;
  else inst.talents.push({id:talentId,rank:1,at:Date.now()});
  if(talentId==="vitality"){
    inst.maxHp=Math.max(1,Number(inst.maxHp)||10)+2;
    inst.hp=Math.min(inst.maxHp,Math.max(0,Number(inst.hp)||0)+2);
  }
  inst.talentPoints=Math.max(0,Number(inst.talentPoints)||0)-1;
  saveHeroCreatureState(heroId,st);
  captureOpenCreatureDetail(uid);
}

function captureBattleAbilityById(id){
  try{return loadAbilityLibrary().find(a=>String(a.id)===String(id))||null}catch(e){return null}
}

function captureBattleAbilities(creature){
  const inst=creature?.source?._instance||creature?._instance||null;
  const max=captureCreatureProgressRules().maxMoves;
  let ids=[];
  if(inst&&Array.isArray(inst.activeAbilityIds)&&inst.activeAbilityIds.length)ids=inst.activeAbilityIds;
  else ids=creature?.abilityIds||creature?.source?.abilityIds||[];
  const lvl=Math.max(1,Number(creature?.level||inst?.level||creature?.source?.level)||1);
  const a=ids.map(captureBattleAbilityById).filter(x=>x&&x.type==="active"&&captureAbilityRequiredLevel(x)<=lvl).slice(0,max);
  if(a.length)return a;
  return [{id:"capture_basic_attack",name:"Attaque",type:"active",desc:"Attaque de base.",power:3,requiredLevel:1,effects:[{kind:"damage",base:3}],activeMeta:{manaCost:0,cooldown:0}}];
}

function captureBattleInventory(){
  const heroId=captureActiveHeroId();if(!heroId)return [];
  const st=loadState(heroId),inv=Array.isArray(st.inventory)?st.inventory:[];
  return inv.filter(x=>Math.max(0,Number(x.qty)||0)>0).map(entry=>{
    const id=String(entry.itemId||entry.id||"");
    const def=captureShopItems().find(x=>String(x.id)===id)||ITEMS.find(x=>String(x.id)===id)||entry;
    return {...def,_entry:entry,qty:Math.max(0,Number(entry.qty)||0)};
  });
}

function captureBattleItemKind(it){
  const id=String(it?.id||it?.itemId||"").toLowerCase(),type=String(it?.type||"").toLowerCase(),name=String(it?.name||"").toLowerCase();
  if(type.includes("capture")||id.includes("ball")||name.includes("capsule")||name.includes("capture"))return "capture";
  if(type.includes("heal")||name.includes("potion")||name.includes("soin")||name.includes("kit"))return "heal";
  return "other";
}

function captureConsumeInventoryItem(itemId,qty=1){
  const heroId=captureActiveHeroId();if(!heroId)return false;
  const st=loadState(heroId);st.inventory=Array.isArray(st.inventory)?st.inventory:[];
  const i=st.inventory.findIndex(x=>String(x.itemId||x.id)===String(itemId));
  if(i<0||Math.max(0,Number(st.inventory[i].qty)||0)<qty)return false;
  st.inventory[i].qty=Math.max(0,Number(st.inventory[i].qty)||0)-qty;
  if(st.inventory[i].qty<=0)st.inventory.splice(i,1);
  localStorage.setItem(key(heroId),JSON.stringify(st));if(String(heroId)===String(current))state=st;
  return true;
}

function captureBattleUsePotion(itemId,targetInstanceId){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended")return;
  const actor=captureBattleCurrentActor(battle);if(!actor||actor.sideKey!=="A")return;
  if(!battle.config.itemsAllowed){alert("Les objets sont interdits dans ce combat.");return}
  const lim=Math.max(0,Number(battle.config.itemsPerTurn)||1);
  if((battle.itemUseThisTurn.A||0)>=lim){alert("Limite d'objets atteinte pour ce tour.");return}
  const item=captureBattleInventory().find(x=>String(x.id||x.itemId)===String(itemId));if(!item)return;
  const target=gensCaptureBattleCreature(battle,targetInstanceId)?.creature;
  if(!target||target.ko){alert("Cible invalide.");return}
  const max=Math.max(1,Number(target.maxHp)||1);
  if(target.hp>=max){alert(target.name+" a déjà tous ses PV.");return}
  const heal=Math.max(1,Number(item.heal||item.healHp)||10);
  if(!captureConsumeInventoryItem(itemId,1))return;
  const before=target.hp;target.hp=Math.min(max,target.hp+heal);
  battle.itemUseThisTurn.A=(battle.itemUseThisTurn.A||0)+1;
  battle.log.push({round:battle.round,type:"item",text:"Potion sur "+target.name+" : +"+(target.hp-before)+" PV"});
  captureRenderBattleLive(battle);
  captureBattleFx("heal","+"+(target.hp-before)+" PV",item.name||"Soin");
  setTimeout(()=>captureBattleAdvanceAfterAction(battle),450);
}

function captureBattleCaptureChance(enemy,item){
  const base=Math.max(1,Math.min(100,Number(enemy?.source?.captureRate??enemy?.source?.captureChance??50)||50));
  const hpRatio=Math.max(0,Math.min(1,(Number(enemy.hp)||0)/Math.max(1,Number(enemy.maxHp)||1)));
  const hpBonus=(1-hpRatio)*45;
  const itemName=String(item?.name||"").toLowerCase();
  const itemBonus=itemName.includes("renfor")||itemName.includes("super")?20:0;
  return Math.max(1,Math.min(95,Math.round(base*0.65+hpBonus+itemBonus)));
}

function captureBattleTryCapture(itemId){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended")return;
  const actor=captureBattleCurrentActor(battle);if(!actor||actor.sideKey!=="A")return;
  if(battle.type!=="wild"||battle.config.captureAllowed===false){alert("La capture n'est pas autorisée dans ce combat.");return}
  if(!battle.config.itemsAllowed){alert("Les objets sont interdits dans ce combat.");return}
  const lim=Math.max(0,Number(battle.config.itemsPerTurn)||1);
  if((battle.itemUseThisTurn.A||0)>=lim){alert("Limite d'objets atteinte pour ce tour.");return}
  const item=captureBattleInventory().find(x=>String(x.id||x.itemId)===String(itemId));if(!item)return;
  const enemy=gensCaptureBattleActiveCreatures(battle,"B")[0];
  if(!enemy){alert("Aucune créature à capturer.");return}
  if(!captureConsumeInventoryItem(itemId,1))return;
  battle.itemUseThisTurn.A=(battle.itemUseThisTurn.A||0)+1;
  const chance=captureBattleCaptureChance(enemy,item),roll=Math.random()*100;
  captureRenderBattleLive(battle);
  captureBattleFx("capture","◉","CAPTURE "+chance+"%");
  if(roll<chance){
    const heroId=captureActiveHeroId(),st=ensureHeroCreatureState(loadState(heroId));
    const ent=enemy.source||loadSharedEntities().find(x=>String(x.id)===String(enemy.creatureId));
    const inst=creatureInstance(ent?.id||enemy.creatureId);
    inst.level=Math.max(1,Number(enemy.level)||1);
    inst.hp=Math.max(1,Number(enemy.hp)||1);
    inst.maxHp=Math.max(1,Number(enemy.maxHp)||inst.hp);
    if((st.creatureTeam||[]).length<6)st.creatureTeam.push(inst);else st.creatureReserve.push(inst);
    saveHeroCreatureState(heroId,st);
    battle.capturedCreature={name:enemy.name,entityId:enemy.creatureId};
    battle.victory={winner:"A",reason:"capture"};battle.phase="ended";
    battle.log.push({round:battle.round,type:"capture",text:enemy.name+" est capturé !"});
    setTimeout(()=>{captureRenderBattleLive(battle);captureBattleFx("captureok","CAPTURÉ !",enemy.name)},650);
  }else{
    battle.log.push({round:battle.round,type:"capture",text:"Échec de capture de "+enemy.name+" ("+chance+"%)"});
    setTimeout(()=>{captureBattleFx("capturefail","ÉCHEC","La créature s'échappe de la capsule");captureBattleAdvanceAfterAction(battle)},650);
  }
}

function captureRenderBattleItems(battle){
  if(!battle?.config?.itemsAllowed)return "";
  const inv=captureBattleInventory();
  if(!inv.length)return `<details class="captureBattleItems"><summary>🎒 Objets</summary><div class="empty">Inventaire vide.</div></details>`;
  const activeAllies=gensCaptureBattleActiveCreatures(battle,"A");
  return `<details class="captureBattleItems"><summary>🎒 Objets de combat</summary><div class="captureItemGrid">`+
    inv.map(it=>{
      const kind=captureBattleItemKind(it),id=z40kEscAttr(it.id||it.itemId),label=z40kEscHtml(it.name||"Objet");
      if(kind==="capture"){
        const disabled=battle.type!=="wild"||battle.config.captureAllowed===false;
        const enemy=gensCaptureBattleActiveCreatures(battle,"B")[0];
        const ch=enemy?captureBattleCaptureChance(enemy,it):0;
        return `<button ${disabled?"disabled":""} onclick="captureBattleTryCapture('${id}')"><b>◉ ${label} ×${it.qty}</b><span>${disabled?"Capture interdite":"Chance actuelle : "+ch+"%"}</span></button>`;
      }
      if(kind==="heal"){
        return activeAllies.map(c=>`<button onclick="captureBattleUsePotion('${id}','${z40kEscAttr(c.instanceId)}')"><b>💚 ${label} ×${it.qty}</b><span>Soigner ${z40kEscHtml(c.name)}</span></button>`).join("");
      }
      return `<button disabled><b>📦 ${label} ×${it.qty}</b><span>Pas d'effet de combat configuré</span></button>`;
    }).join("")+`</div></details>`;
}

function captureBattleCurrentActor(battle){
  const t=gensCaptureBattleCurrentTurn(battle);if(!t)return null;
  const hit=gensCaptureBattleCreature(battle,t.instanceId);
  return hit?{turn:t,...hit}:null;
}

function captureBattleDamageValue(actor,ability,effect){
  const base=Math.max(1,Number(effect?.base??effect?.value??3)||3);
  const lvl=Math.max(1,Number(actor?.level)||1);
  const d=captureCreatureDerivedStats(actor?.source?._instance||{},actor?.source||{});
  let dmg=base + lvl*0.45 + d.force*0.08;
  const mode=captureBattleMode();
  if(mode==="classic")dmg*=0.90+Math.random()*0.21;
  if(mode==="rpg"){const die=1+Math.floor(Math.random()*6);dmg+=die;window._captureLastRoll=die}
  if(mode==="active")dmg*=0.95+Math.random()*0.16;
  return Math.max(1,Math.round(dmg));
}

function captureBattleFx(kind,text,sub=""){
  const fx=document.getElementById("captureBattleFx");if(!fx)return;
  fx.className="captureBattleFx show "+kind;
  fx.innerHTML=`<div class="captureBattleFxMain">${z40kEscHtml(text)}</div>${sub?`<div class="captureBattleFxSub">${z40kEscHtml(sub)}</div>`:""}`;
  clearTimeout(window._captureFxTimer);
  window._captureFxTimer=setTimeout(()=>fx.classList.remove("show"),1050);
}

function captureBattleHpPct(c){return Math.max(0,Math.min(100,Math.round((Number(c.hp)||0)/Math.max(1,Number(c.maxHp)||1)*100)))}

function captureBattleHpClass(c){const p=captureBattleHpPct(c);return p<=20?"danger":p<=50?"warn":"ok"}

function captureBattleApplyAbility(battle,actor,ability,target){
  if(!battle||!actor||!ability||!target)return {ok:false,reason:"invalid"};
  if(ability.id!=="capture_basic_attack"){
    const can=gensCaptureAbilityCanUse(actor,ability);
    if(!can.ok)return can;
    gensCaptureConsumeAbilityUse(actor,ability);
  }
  const effects=Array.isArray(ability.effects)&&ability.effects.length?ability.effects:[{kind:"damage",base:3}];
  const messages=[];let totalDamage=0,totalHeal=0,crit=false;
  effects.forEach(e=>{
    const kind=String(e.kind||"damage").toLowerCase();
    if(kind==="damage"){
      let dmg=captureBattleDamageValue(actor,ability,e);
      const ad=captureCreatureDerivedStats(actor?.source?._instance||{},actor?.source||{});
      const td=captureCreatureDerivedStats(target?.source?._instance||{},target?.source||{});
      const agi=ad.agi,critChance=Math.min(35,5+agi*0.35);
      const evadeChance=captureCreatureStatRules().agility.enabled===false?0:Math.min(30,td.agi*0.20);
      if(Math.random()*100<evadeChance){dmg=0;messages.push(target.name+" ESQUIVE !")}
      else{
        if(Math.random()*100<critChance){dmg=Math.max(1,Math.round(dmg*1.5));crit=true}
        if(captureCreatureStatRules().defense.enabled!==false)dmg=Math.max(1,Math.round(dmg*100/(100+Math.max(0,td.defense))));
        const em=captureElementDamageMultiplier(target,String(e.element||ability.element||""));
        dmg=Math.max(1,Math.round(dmg*em.mult));
        if(target.defended)dmg=Math.max(1,Math.ceil(dmg/2));
        target.hp=Math.max(0,target.hp-dmg);totalDamage+=dmg;
        messages.push(target.name+" -"+dmg+" PV"+(crit?" CRITIQUE !":"")+(em.label?" · "+em.label:""));
      }
    }else if(kind==="heal"||kind==="healing"){
      const baseHeal=Math.max(1,Number(e.base??e.value??3)||3);
      const spirit=captureCreatureDerivedStats(actor?.source?._instance||{},actor?.source||{}).spirit;
      const heal=Math.max(1,Math.round(baseHeal + Math.max(0,(Number(actor.level)||1)-1)*0.35 + spirit*0.06));
      const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+heal);
      totalHeal+=target.hp-before;messages.push(target.name+" +"+(target.hp-before)+" PV");
    }else if(kind==="dot"){
      target.statuses.push({name:e.name||ability.name,kind:"dot",value:Math.max(1,Number(e.value??e.base)||1),duration:Math.max(1,Number(e.duration)||2),phase:"turn_end"});
      messages.push("effet "+(e.name||ability.name));
    }else if(kind==="hot"){
      target.statuses.push({name:e.name||ability.name,kind:"hot",value:Math.max(1,Number(e.value??e.base)||1),duration:Math.max(1,Number(e.duration)||2),phase:"turn_end"});
    }else if(kind==="debuff"||kind==="buff"){
      target.statuses.push({name:e.name||ability.name,kind,stat:e.stat||"",value:Number(e.value)||0,duration:Math.max(1,Number(e.duration)||1),phase:"turn_end"});
    }
  });
  const roll=captureBattleMode()==="rpg"&&window._captureLastRoll?(" · 🎲 "+window._captureLastRoll):"";
  battle.lastFx={actor:actor.name,target:target.name,ability:ability.name,damage:totalDamage,heal:totalHeal,crit,roll:window._captureLastRoll||null};
  battle.log.push({round:battle.round,type:"ability",text:actor.name+" utilise "+ability.name+" → "+messages.join(" · ")+roll});
  if(target.hp<=0&&!target.ko)gensCaptureBattleHandleKo(battle,target.instanceId);
  return {ok:true,damage:totalDamage,heal:totalHeal,crit};
}

function captureBattleSelectDefaultTarget(battle,sideKey){
  const other=gensCaptureBattleOtherSide(sideKey);
  return gensCaptureBattleActiveCreatures(battle,other)[0]||null;
}

function captureBattleUseAbility(abilityId){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended")return;
  const a=captureBattleCurrentActor(battle);if(!a||a.sideKey!=="A")return;
  const ability=abilityId==="capture_basic_attack"
    ? {id:"capture_basic_attack",name:"Attaque",type:"active",effects:[{kind:"damage",base:3}]}
    : captureBattleAbilityById(abilityId);
  if(!ability)return;
  const mode=gensCaptureAbilityTargetMode(ability);
  let target;
  if(mode==="self")target=a.creature;
  else if(mode==="ally"||mode==="all_allies")target=gensCaptureBattleActiveCreatures(battle,"A")[0]||a.creature;
  else target=captureBattleSelectDefaultTarget(battle,"A");
  if(!target){alert("Aucune cible disponible.");return}
  const r=captureBattleApplyAbility(battle,a.creature,ability,target);
  if(!r.ok){alert(r.reason==="charges"?"Plus de charges.":r.reason==="cooldown"?"Compétence en recharge.":r.reason==="mana"?"Mana insuffisant.":"Compétence indisponible.");return}
  captureRenderBattleLive(battle);
  const fx=battle.lastFx;
  if(fx)captureBattleFx(r.crit?"crit":r.heal?"heal":"hit",r.heal?("+"+r.heal+" PV"):("-"+r.damage+" PV"),r.crit?"COUP CRITIQUE !":ability.name);
  setTimeout(()=>captureBattleAdvanceAfterAction(battle),520);
}

function captureBattleDefendCurrent(){
  const battle=window.gensCurrentCaptureBattle,a=captureBattleCurrentActor(battle);
  if(!a||a.sideKey!=="A")return;
  gensCaptureBattleDefend(battle,a.creature.instanceId);
  captureBattleAdvanceAfterAction(battle);
}

function captureBattleSwitchTo(uid){
  const battle=window.gensCurrentCaptureBattle,a=captureBattleCurrentActor(battle);
  if(!a||a.sideKey!=="A")return;
  const reserve=gensCaptureBattleReserve(battle,"A").find(c=>c.instanceId===uid);if(!reserve)return;
  const r=gensCaptureBattleRecall(battle,"A",a.creature.instanceId,reserve.instanceId);
  if(!r.ok){alert("Rappel impossible.");return}
  captureBattleAdvanceAfterAction(battle);
}

function captureBattleAdvanceAfterAction(battle){
  gensCaptureBattleEvaluateVictory(battle);
  if(battle.phase==="ended"){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
  gensCaptureBattleEndTurn(battle);
  captureBattleRunAiUntilHuman(battle);
}

function captureBattleRunAiUntilHuman(battle){
  let guard=0;
  const step=()=>{
    if(!battle||battle.phase==="ended"||guard++>=20){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
    const a=captureBattleCurrentActor(battle);
    if(!a){captureRenderBattleLive(battle);return}
    if(a.sideKey==="A"){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
    const abilities=captureBattleAbilities(a.creature);
    let ability=abilities[Math.floor(Math.random()*abilities.length)]||abilities[0];
    const usable=abilities.filter(ab=>ab.id==="capture_basic_attack"||gensCaptureAbilityCanUse(a.creature,ab).ok);
    if(usable.length)ability=usable[Math.floor(Math.random()*usable.length)];
    const target=captureBattleSelectDefaultTarget(battle,"B");
    let r=null;
    if(target&&ability)r=captureBattleApplyAbility(battle,a.creature,ability,target);
    captureRenderBattleLive(battle);
    if(r?.ok)captureBattleFx(r.crit?"crit":r.heal?"heal":"enemyhit",r.heal?("+"+r.heal+" PV"):("-"+r.damage+" PV"),(r.crit?"COUP CRITIQUE ! · ":"")+a.creature.name+" · "+ability.name);
    gensCaptureBattleEvaluateVictory(battle);
    if(battle.phase==="ended"){setTimeout(()=>{captureRenderBattleLive(battle);gensCaptureBattleSave(battle)},650);return}
    gensCaptureBattleEndTurn(battle);
    setTimeout(step,720);
  };
  step();
}

function captureBattlePersistPlayerHp(battle){
  const heroId=captureActiveHeroId();if(!heroId||!battle)return;
  const st=ensureHeroCreatureState(loadState(heroId));
  const all=[...(st.creatureTeam||[]),...(st.creatureReserve||[])];
  (battle.sides?.A?.creatures||[]).forEach(c=>{
    const uid=String(c.source?._instance?.uid||"");
    const inst=all.find(x=>String(x.uid)===uid);
    if(inst){inst.hp=Math.max(0,Number(c.hp)||0);inst.maxHp=Math.max(1,Number(c.maxHp)||1)}
  });
  saveHeroCreatureState(heroId,st);
}

function captureGenerateBattleRewards(battle){
  if(!battle||battle.victory?.winner!=="A"||battle.rewardsGenerated)return battle?.captureRewards||null;
  const trainer=battle.type==="trainer";
  const enemyLvls=(battle.sides?.B?.creatures||[]).map(c=>Math.max(1,Number(c.level)||1));
  const avg=enemyLvls.length?enemyLvls.reduce((a,b)=>a+b,0)/enemyLvls.length:1;
  let gold=0,item=null;
  if(trainer)gold=Math.max(5,Math.round(8+avg*3+Math.random()*12));
  else if(Math.random()<0.45)gold=Math.max(3,Math.round(3+avg*2+Math.random()*8));
  if(Math.random()<(trainer?0.25:0.18)){
    const pool=captureShopItems();
    if(pool.length)item=pool[Math.floor(Math.random()*pool.length)];
  }
  battle.captureRewards={gold,itemId:item?.id||"",itemName:item?.name||""};
  battle.rewardsGenerated=true;
  return battle.captureRewards;
}

function captureGrantBattleRewards(battle){
  if(!battle||battle.rewardsGranted||battle.victory?.winner!=="A")return battle?.captureRewards||null;
  const rw=captureGenerateBattleRewards(battle)||{},heroId=captureActiveHeroId();if(!heroId)return rw;
  const st=loadState(heroId);
  st.gold=Math.max(0,Number(st.gold)||0)+Math.max(0,Number(rw.gold)||0);
  if(rw.itemId){
    st.inventory=Array.isArray(st.inventory)?st.inventory:[];
    const it=captureShopItems().find(x=>String(x.id)===String(rw.itemId));
    const found=st.inventory.find(x=>String(x.itemId||x.id)===String(rw.itemId));
    if(found)found.qty=Math.max(0,Number(found.qty)||0)+1;
    else if(it)st.inventory.push({itemId:it.id,id:it.id,name:it.name,type:it.type,desc:it.desc,qty:1,virtual:!!it._captureDemo});
  }
  localStorage.setItem(key(heroId),JSON.stringify(st));if(String(heroId)===String(current))state=st;
  battle.rewardsGranted=true;
  return rw;
}

function captureBattleFinishAndClose(){
  const b=window.gensCurrentCaptureBattle;
  if(b)captureBattlePersistPlayerHp(b);
  if(b?.type==="wild")captureConsumeWildEncounter(b.victory?.winner==="A"?"victory":"battle");
  captureCloseModal("captureBattleLiveModal");
  window.gensCurrentCaptureBattle=null;
  renderCaptureWorldHub();
}

function captureRenderBattleLive(battle=window.gensCurrentCaptureBattle){
  const host=document.getElementById("captureBattleLiveBody");if(!host||!battle)return;
  const actor=captureBattleCurrentActor(battle);
  const card=(c,active)=>{
    const pct=captureBattleHpPct(c),cls=captureBattleHpClass(c),art=c.source?.iconData||c.source?.artData||c.source?.image||"";
    const uid=String(c.source?._instance?.uid||"");
    return `<div class="captureFightMon ${active?"active":""} ${c.ko?"ko":""}" ${uid?`onclick="captureOpenCreatureDetail('${z40kEscAttr(uid)}')" style="cursor:pointer"`:""}>
      <div class="captureFightPortrait">${art?`<img src="${z40kEscAttr(art)}">`:`<span>${c.ko?"💀":active?"⚔️":"🐲"}</span>`}</div>
      <div class="captureFightInfo"><div><strong>${z40kEscHtml(c.name)}</strong><span>Niv. ${c.level||1}</span></div>
      <div class="captureHpTrack"><i class="${cls}" style="width:${pct}%"></i></div>
      <small>PV ${c.hp} / ${c.maxHp}${uid?" · toucher pour fiche":""}</small></div>
    </div>`;
  };
  const sideHtml=(key)=>{
    const side=battle.sides?.[key];if(!side)return"";
    const active=new Set(side.active||[]);
    return `<div class="captureFightSide ${key==="A"?"player":"enemy"}"><h3>${key==="A"?"🔵":"🔴"} ${z40kEscHtml(side.name||key)}</h3>`+
      (side.creatures||[]).map(c=>card(c,active.has(c.instanceId))).join("")+`</div>`;
  };

  if(battle.phase==="ended"){
    const win=battle.victory?.winner==="A",caught=battle.victory?.reason==="capture";
    const xp=caught?"":(battle.xpRewards||[]).map(x=>`${z40kEscHtml(x.name)} <strong>+${x.xp} XP</strong>${x.levels?` · ⭐ +${x.levels} niveau${x.levels>1?"x":""}`:""}`).join("<br>");
    const rw=(win&&!caught)?captureGrantBattleRewards(battle):null;
    const rewardHtml=rw&&((rw.gold||0)>0||rw.itemName)?`<div class="captureRewardBox"><strong>🎁 Récompenses</strong>${rw.gold?`<div>🪙 +${rw.gold}</div>`:""}${rw.itemName?`<div>📦 ${z40kEscHtml(rw.itemName)} ×1</div>`:""}</div>`:"";
    host.innerHTML=`<div id="captureBattleFx" class="captureBattleFx"></div><div class="captureVictory ${win?"win":"lose"}"><div class="big">${caught?"◉":win?"🏆":"💀"}</div><h2>${caught?"CAPTURE RÉUSSIE !":win?"VICTOIRE !":"DÉFAITE"}</h2>${caught?`<div class="captureCaughtName">${z40kEscHtml(battle.capturedCreature?.name||"Créature")} rejoint votre équipe !</div>`:""}${xp?`<div class="captureXpReward">${xp}</div>`:""}${rewardHtml}<button class="startGameBtn" onclick="captureBattleFinishAndClose()">✓ TERMINER</button></div>`;
    captureBattlePersistPlayerHp(battle);return;
  }

  let actions="";
  if(actor?.sideKey==="A"){
    const abs=captureBattleAbilities(actor.creature);
    actions=`<div class="captureFightActions"><div class="captureActionTitle">Que doit faire <strong>${z40kEscHtml(actor.creature.name)}</strong> ?</div><div class="captureMoveGrid">`+
      abs.slice(0,4).map((ab,i)=>{
        const can=ab.id==="capture_basic_attack"?{ok:true}:gensCaptureAbilityCanUse(actor.creature,ab);
        const meta=ab.activeMeta||{},extra=meta.manaCost?`💧 ${meta.manaCost}`:meta.cooldown?`⏱ ${meta.cooldown}`:"";
        return `<button ${can.ok?"":"disabled"} onclick="captureBattleUseAbility('${z40kEscAttr(ab.id)}')"><strong>${z40kEscHtml(ab.name||"Compétence")}</strong><span>${extra||z40kEscHtml(ab.category||"Attaque")}</span></button>`;
      }).join("")+`</div><div class="captureUtilityActions">`+
      (battle.config.defendAllowed?`<button onclick="captureBattleDefendCurrent()">🛡️ Défendre</button>`:"")+
      `</div>`;
    const reserve=gensCaptureBattleReserve(battle,"A");
    if(reserve.length&&battle.config.recallCost!=="forbidden"){
      actions+=`<details><summary>🔄 Changer de créature</summary><div class="v2LibActions">`+
        reserve.map(c=>`<button onclick="captureBattleSwitchTo('${z40kEscAttr(c.instanceId)}')">${z40kEscHtml(c.name)}</button>`).join("")+`</div></details>`;
    }
    actions+=captureRenderBattleItems(battle);
    actions+=`</div>`;
  }else actions=`<div class="captureFightActions"><div class="captureThinking">⏳ ${z40kEscHtml(actor?.creature?.name||"L’adversaire")} prépare son action…</div></div>`;

  const log=(battle.log||[]).slice(-4).reverse().map(x=>`<div>• ${z40kEscHtml(x.text||"")}</div>`).join("");
  host.innerHTML=`<div id="captureBattleFx" class="captureBattleFx"></div>
    <div class="captureBattleTop"><span>${captureBattleModeLabel()}</span><strong>Tour ${battle.round}</strong></div>
    <div class="captureArena">${sideHtml("B")}${sideHtml("A")}</div>
    ${actions}
    <details class="captureFightLog"><summary>📜 Journal du combat</summary>${log||"<div>Le combat commence.</div>"}</details>`;
}

function captureStartWildBattle(creatureId){
  // This is the original, unique public callback called by Capture World.
  // Do not replace it on window or route wild fights to the old simulator.
  const world=captureWorldState(),id=String(creatureId||"");
  if(world?.last?.type!=="wild"||String(world.last.creatureId)!==id){
    alert("La rencontre sauvage a changé. Retourne dans le monde Capture.");return;
  }
  if(window.gensCurrentCaptureBattle){
    alert("Un autre combat Capture est encore actif.");return;
  }
  const owners={
    activeHeroId:()=>captureActiveHeroId(),
    loadHeroState:heroId=>loadState(heroId),
    saveHeroState:(heroId,next)=>saveHeroCreatureState(heroId,next),
    readWorldState:()=>captureWorldState(),
    saveWorldState:next=>saveCaptureWorldState(next),
    consumeWildEncounter:reason=>captureConsumeWildEncounter(reason),
    worldStorageKey:()=>captureWorldKey(),
    nextEncounterId:()=>{
      if(typeof crypto?.randomUUID!=="function")throw new Error("Identifiant sécurisé de rencontre indisponible");
      return "capture"+crypto.randomUUID().replaceAll("-","");
    }
  };
  const moduleUrl=new URL("assets/gensrpg/capture/capture-official-public-wild-v1.mjs",document.baseURI);
  import(moduleUrl.href).then(async({startCaptureOfficialPublicWildV1})=>{
    const result=await startCaptureOfficialPublicWildV1({
      creatureId:id,owners,
      confirmConsent:line=>Promise.resolve(window.confirm(
        "Migration Monster Capture vers le Labo officiel :\n\n"+line+
        "\n\nConfirmer pour enregistrer la conversion réversible du profil avant ce combat ?"
      ))
    });
    if(result.started)captureCloseModal("captureEncounterModal");
  }).catch(error=>{
    console.error("Combat Capture officiel — propriétaire sauvage",error);
    alert("Combat officiel indisponible : "+String(error?.message||error)+
      "\nLa rencontre n'a pas été remplacée par l'ancien moteur.");
  });
}

function captureOpenTrainerBattle(){
  const playerRoster=captureTeamEntityRoster(),pool=loadSharedEntities().filter(x=>x.category==="creature");
  if(!playerRoster.length){alert("Aucune créature dans l’équipe du dresseur.");return}
  if(!pool.length){alert("Aucune créature disponible pour créer un adversaire.");return}
  const auto=captureAutoTrainerRules(playerRoster);
  const enemy=[];
  for(let i=0;i<auto.teamSize;i++)enemy.push(pool[Math.floor(Math.random()*pool.length)]);
  captureStartBattleAutomatic(
    {name:(CHARS[captureActiveHeroId()]?.name||"Dresseur"),roster:playerRoster,controller:"human"},
    {name:"Dresseur rival",roster:enemy,controller:"auto"},
    {
      type:"trainer",
      captureAllowed:false,
      activeSlots:auto.activeSlots,
      teamSize:auto.teamSize,
      minBattleTeam:1,
      maxBattleTeam:6,
      recallCost:"turn",
      controller:"auto"
    }
  );
}

function captureLaunchTrainerBattle(qty){
  captureOpenTrainerBattle();
}

function captureOpenTrainer(){
  const id=captureActiveHeroId();if(!id){alert("Aucun dresseur actif.");return}
  try{openChar(id);setTimeout(()=>{try{applyPureCaptureSheetUi();setCaptureSheetTab("team")}catch(e){}},20)}
  catch(e){console.error(e);alert("Erreur ouverture dresseur : "+(e?.message||e))}
}

function captureStarterKitConfig(){
  return {currency:100,captureItemQty:3,healItemQty:2,captureItemId:"capture_demo_ball",healItemId:"capture_demo_potion"};
}

function captureEnsureStarterKit(heroId){
  if(!heroId)return;
  const st=loadState(heroId);
  if(st.captureStarterKitGranted)return;
  const cfg=captureStarterKitConfig();
  st.gold=Math.max(0,Number(st.gold)||0)+cfg.currency;
  st.inventory=Array.isArray(st.inventory)?st.inventory:[];
  const add=(id,qty)=>{
    const it=captureShopItems().find(x=>String(x.id)===String(id));
    if(!it||qty<=0)return;
    const found=st.inventory.find(x=>String(x.itemId||x.id)===String(id));
    if(found)found.qty=Math.max(0,Number(found.qty)||0)+qty;
    else st.inventory.push({itemId:it.id,id:it.id,name:it.name,type:it.type,desc:it.desc,qty,virtual:!!it._captureDemo});
  };
  add(cfg.captureItemId,cfg.captureItemQty);
  add(cfg.healItemId,cfg.healItemQty);
  st.captureStarterKitGranted=true;
  localStorage.setItem(key(heroId),JSON.stringify(st));
  if(String(heroId)===String(current))state=st;
}

function captureEnsureStarterKitsForParticipants(){
  if(typeof gensCurrentContentFamily!=="function"||gensCurrentContentFamily()!=="creature")return;
  normalizeGameParticipants().forEach(captureEnsureStarterKit);
}

function captureShopItems(){
  let found=[];
  try{
    found=ITEMS.filter(it=>{
      const type=String(it.type||"").toLowerCase(),name=String(it.name||"").toLowerCase();
      return type.includes("capture")||name.includes("capture")||name.includes("soin")||name.includes("potion")||name.includes("kit");
    }).slice(0,24);
  }catch(e){}
  if(found.length)return found;
  return [
    {id:"capture_demo_ball",name:"Capsule de capture",type:"capture",desc:"Objet standard permettant une tentative de capture.",price:20,captureBonus:0,_captureDemo:true},
    {id:"capture_demo_superball",name:"Capsule renforcée",type:"capture",desc:"Capsule améliorée pour les créatures difficiles à capturer.",price:60,captureBonus:20,_captureDemo:true},
    {id:"capture_demo_potion",name:"Potion de soin",type:"heal",desc:"Restaure 10 PV à une créature.",price:25,heal:10,_captureDemo:true},
    {id:"capture_demo_antidote",name:"Antidote",type:"status",desc:"Retire un effet de poison.",price:15,clearStatus:"poison",_captureDemo:true}
  ];
}

function captureSetShopTab(tab){
  captureShopTab=tab==="sell"?"sell":"buy";
  document.getElementById("captureShopBuyTabBtn")?.classList.toggle("active",captureShopTab==="buy");
  document.getElementById("captureShopSellTabBtn")?.classList.toggle("active",captureShopTab==="sell");
  renderCaptureShop();
}

function captureItemSellPrice(it){
  const base=Math.max(0,Number(it?.price??it?.value??10)||0);
  return Math.max(1,Math.floor(base*0.5));
}

function captureSellItem(itemId){
  const heroId=captureActiveHeroId();if(!heroId)return;
  const st=loadState(heroId);st.inventory=Array.isArray(st.inventory)?st.inventory:[];
  const idx=st.inventory.findIndex(x=>String(x.itemId||x.id)===String(itemId)&&Math.max(0,Number(x.qty)||0)>0);
  if(idx<0)return;
  const entry=st.inventory[idx];
  const it=captureShopItems().find(x=>String(x.id)===String(itemId))||ITEMS.find(x=>String(x.id)===String(itemId))||entry;
  const price=captureItemSellPrice(it);
  entry.qty=Math.max(0,Number(entry.qty)||0)-1;
  if(entry.qty<=0)st.inventory.splice(idx,1);
  st.gold=Math.max(0,Number(st.gold)||0)+price;
  localStorage.setItem(key(heroId),JSON.stringify(st));if(String(heroId)===String(current))state=st;
  renderCaptureShop();renderCaptureWorldHub();
}

function captureOpenShop(){renderCaptureShop();captureOpenModal("captureShopModal")}

function captureBuyItem(itemId){
  const heroId=captureActiveHeroId();if(!heroId)return;
  const it=captureShopItems().find(x=>String(x.id)===String(itemId))||ITEMS.find(x=>String(x.id)===String(itemId));if(!it)return;
  const st=loadState(heroId),eco=currentRpgEconomy?.(),price=Math.max(0,Number(it.price??it.value??10)||0);
  if(eco?.enabled && Number(st.gold||0)<price){alert("Monnaie insuffisante.");return}
  if(eco?.enabled)st.gold=Math.max(0,Number(st.gold||0)-price);
  st.inventory=Array.isArray(st.inventory)?st.inventory:[];
  const existing=st.inventory.find(x=>String(x.itemId||x.id)===String(it.id));
  if(existing)existing.qty=Math.max(1,Number(existing.qty)||1)+1;
  else st.inventory.push({itemId:it.id,id:it.id,name:it.name,type:it.type,desc:it.desc,qty:1,virtual:!!it._captureDemo});
  localStorage.setItem(key(heroId),JSON.stringify(st));if(heroId===current)state=st;
  renderCaptureShop();renderCaptureWorldHub();
}

function captureHealingRule(){
  try{
    const p=getActiveGameProfile();ensureRpgProfileData(p);
    const cc=p.rpgUniverse?.captureCombat||{};
    return {mode:cc.healMode||"free",cost:Math.max(0,Number(cc.healCost)||0)};
  }catch(e){return {mode:"free",cost:0}}
}

function captureOpenHeal(){
  renderCaptureHeal();
  captureOpenModal("captureHealModal");
}

function captureHealOne(uid,where){
  const heroId=captureActiveHeroId();if(!heroId)return;
  const st=ensureHeroCreatureState(loadState(heroId)),pool=loadSharedEntities(),rule=captureHealingRule();
  const arr=where==="reserve"?(st.creatureReserve||[]):(st.creatureTeam||[]);
  const inst=arr.find(x=>String(x.uid)===String(uid));if(!inst)return;
  const ent=pool.find(x=>String(x.id)===String(inst.entityId||inst.creatureId||""));
  const max=Math.max(1,Number(inst.maxHp||ent?.hp||inst.hp)||10);
  if(Number(inst.hp)>=max)return;
  if(rule.mode==="paid"){
    if(Math.max(0,Number(st.gold)||0)<rule.cost){alert("Monnaie insuffisante.");return}
    st.gold=Math.max(0,Number(st.gold||0)-rule.cost);
  }
  inst.maxHp=max;inst.hp=max;
  saveHeroCreatureState(heroId,st);
  const ws=captureWorldState();ws.last={type:"heal",text:(ent?.name||"Une créature")+" a été soignée."};saveCaptureWorldState(ws);
  renderCaptureHeal();renderCaptureWorldHub();
}

function captureOpenMjPanel(){captureOpenModal("captureMjModal")}

function captureForceWildEncounter(){
  captureCloseModal("captureMjModal");
  const pool=loadSharedEntities().filter(x=>x.category==="creature");
  if(!pool.length){alert("Aucune créature disponible.");return}
  const c=pool[Math.floor(Math.random()*pool.length)],ws=captureWorldState();
  ws.last={type:"wild",creatureId:String(c.id),text:"Le MJ déclenche une rencontre avec "+c.name+"."};saveCaptureWorldState(ws);renderCaptureWorldHub();
}

function captureCurrentGameProfile(name,id,builtIn=false){
  const waveId=activeWavePresetId();
  const wavePreset=loadWavePresets().find(p=>p.id===waveId);
  return {
    id:id||gameProfileId(),
    name:name||"Profil de partie",
    builtIn:!!builtIn,
    gameStyle:"custom",
    modules:{rules:true,objects:true,heroes:true,enemies:true,waves:true},
    rules:{...loadGameCustomization()},
    deck:{...loadDeckConfig()},
    heroPool:currentAllHeroIds(),
    objectPool:ITEMS.map(it=>String(it.id)),
    wavePresetId:waveId||ZOMBICIDE_BASE_PRESET_ID,
    enemyConfig:{...loadZombieConfig()},
    enemyReserve:{...(wavePreset?.reserve||loadZombieConfig())},
    enemyLoot:{enabled:false,multiplier:0.1},
    createdAt:Date.now()
  };
}
