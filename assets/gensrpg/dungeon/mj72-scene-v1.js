
const GENS_DUNGEON_SCENE_KEY="gensrpg_dungeon_scene_v1";
const DUNGEON_RARITY_ORDER={common:0,rare:1,epic:2,legendary:3};
function dungeonRarityLabel(r){return ({common:"Commun",rare:"Rare",epic:"Épique",legendary:"Légendaire"})[r]||"Commun"}
function dungeonItemRarity(it){
  const explicit=String(it?.rpgRarity||"").toLowerCase();if(DUNGEON_RARITY_ORDER[explicit]!==undefined)return explicit;
  const id=String(it?.id||"");if(id==="dng_amulet")return "epic";if(["dng_chain","dng_fire_scroll"].includes(id))return "rare";return "common";
}
function loadDungeonSceneElements(){try{const a=GensStorageV1.readJson(localStorage,GENS_DUNGEON_SCENE_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return []}}
function saveDungeonSceneElements(a){GensStorageV1.writeJson(localStorage,GENS_DUNGEON_SCENE_KEY,a||[]);try{renderDungeonMasterScene()}catch(e){}}
function addDungeonSceneElement(data){const a=loadDungeonSceneElements(),el={id:"dse_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),room:Number(data?.room??loadDungeonState()?.room)||0,createdAt:Date.now(),...data};a.push(el);saveDungeonSceneElements(a);return el}
function removeDungeonSceneElement(id){
  const all=loadDungeonSceneElements();
  const removed=all.find(x=>String(x.id)===String(id));
  if(removed?.kind==="chest" && removed?.fromMap){
    try{
      const ds=loadDungeonState?.()||{};
      const room=Number(ds.room)||0;
      if(ds.last?.map && Number(removed.room||0)===room){
        ds.last.map._dc051ChestConsumed=true;
        saveDungeonState?.(ds);
      }
    }catch(e){console.warn("Core 0.64 chest persistence",e)}
  }
  saveDungeonSceneElements(all.filter(x=>String(x.id)!==String(id)));
}
function dungeonCurrentSceneElements(){const room=Number(loadDungeonState()?.room)||0;return loadDungeonSceneElements().filter(x=>Number(x.room||0)===room)}
function dungeonWeightedKey(obj,fallback){const e=Object.entries(obj||{}).map(([k,v])=>[k,Math.max(0,Number(v)||0)]),t=e.reduce((n,x)=>n+x[1],0);if(t<=0)return fallback;let r=Math.random()*t;for(const [k,v] of e){r-=v;if(r<=0)return k}return fallback}
function dungeonPickChestRarity(cfg=loadDungeonConfig()){return dungeonWeightedKey({common:60,rare:25,epic:10,legendary:5,...(cfg?.chestWeights||{})},"common")}
function dungeonTrapTypes(){
  const c=loadDungeonConfig?.()||{};
  const base={dart:1,snare:1,rune:2,collapse:2,...(c.trapDamage||{})};
  const mult=({weak:.5,normal:1,dangerous:1.5,deadly:2})[c.trapPower||"normal"]||1;
  const dmg=id=>Math.max(1,Math.round((Number(base[id])||1)*mult));
  return {
    dart:{id:"dart",name:"Salve de fléchettes",icon:"🏹",stat:"agilite",statLabel:"Agilité",damage:dmg("dart"),baseDamage:Math.max(1,Number(base.dart)||1),power:c.trapPower||"normal",text:"Une salve jaillit des murs."},
    snare:{id:"snare",name:"Entrave mécanique",icon:"⛓️",stat:"force",statLabel:"Force",damage:dmg("snare"),baseDamage:Math.max(1,Number(base.snare)||1),power:c.trapPower||"normal",text:"Un mécanisme tente d’immobiliser et blesser le héros."},
    rune:{id:"rune",name:"Rune instable",icon:"🔮",stat:"esprit",statLabel:"Esprit",damage:dmg("rune"),baseDamage:Math.max(1,Number(base.rune)||2),power:c.trapPower||"normal",magic:true,text:"Une rune libère une décharge magique."},
    collapse:{id:"collapse",name:"Éboulement",icon:"🪨",stat:"defense",statLabel:"Défense",damage:dmg("collapse"),baseDamage:Math.max(1,Number(base.collapse)||2),power:c.trapPower||"normal",text:"Des blocs s’effondrent sur le héros."}
  }
}
function dungeonPickTrapType(cfg=loadDungeonConfig()){const id=dungeonWeightedKey({dart:35,snare:25,rune:20,collapse:20,...(cfg?.trapWeights||{})},"dart");return dungeonTrapTypes()[id]||dungeonTrapTypes().dart}
function dungeonTrapStatValue(heroId,stat){const d=dungeonDerivedForHero(heroId);if(stat==="defense")return Math.max(0,Number(d.defense)||0);return Math.max(0,Number(d?.[stat])||0)}
function dungeonTrapDifficultyModifier(){const d=loadDungeonConfig().difficulty;return ({easy:10,normal:0,hard:-10,nightmare:-20})[d]??0}
function dungeonTrapCheckChance(heroId,trap){const c=loadDungeonConfig(),v=dungeonTrapStatValue(heroId,trap.stat),base=Math.max(5,Math.min(95,Number(c.trapCheckBase)||50)),ref=Math.max(0,Number(c.trapCheckReference)||10),pp=Math.max(0,Number(c.trapCheckPerPoint)||3);return Math.max(5,Math.min(95,Math.round(base+(v-ref)*pp+dungeonTrapDifficultyModifier())))}
function dungeonResolveTrapAgainstHero(trapId,heroId,show=true){const trap=dungeonTrapTypes()[trapId]||dungeonTrapTypes().dart;if(!heroId)return null;const chance=dungeonTrapCheckChance(heroId,trap),threshold=101-chance,roll=Math.floor(Math.random()*100)+1,ok=roll>=threshold;let wounds=null;if(!ok)wounds=dungeonSetHeroWounds(heroId,Math.max(1,Number(trap.damage)||1));const name=CHARS[heroId]?.name||findCustomHero(heroId)?.name||heroId,val=dungeonTrapStatValue(heroId,trap.stat),html='<strong>'+z40kEscHtml(name)+'</strong> tente de résister au piège.<br>'+trap.statLabel+' '+val+' → <strong>'+chance+'%</strong> de réussite · D100 : <strong>'+threshold+'+</strong><br>Jet : <strong>'+roll+'</strong> → '+(ok?'✅ <strong>RÉUSSI</strong>':'❌ <strong>ÉCHEC</strong>')+(ok?'':('<br>💥 '+trap.damage+' dégât'+(trap.damage>1?'s':'')+' · blessures actuelles : '+wounds));if(show)showEffectPopup(trap.icon,"PIÈGE — "+trap.name,html,'Test '+trap.statLabel+' · '+chance+'%',true);return {ok,roll,chance,threshold,html}}
const DUNGEON_DECK_KEY="gensrpg_dungeon_deck_v1";
function dungeonLoadDeckState(){
  let ds=null;
  ds=GensStorageV1.readJson(localStorage,DUNGEON_DECK_KEY,null)
  if(!ds||!ds.remaining)ds={remaining:{},createdAt:Date.now()};
  const cfg=loadDeckConfig();
  let changed=false;
  itemsForMode(true).forEach(it=>{
    if(ds.remaining[it.id]===undefined){ds.remaining[it.id]=Math.max(1,parseInt(cfg[it.id],10)||2);changed=true}
  });
  if(changed)try{GensStorageV1.writeJson(localStorage,DUNGEON_DECK_KEY,ds)}catch(e){}
  return ds
}
function dungeonSaveDeckState(ds){try{GensStorageV1.writeJson(localStorage,DUNGEON_DECK_KEY,ds)}catch(e){}}
function dungeonBuildDeckState075(){
  try{refreshCustomEquipmentIntoItems?.()}catch(e){}
  const cfg=loadDeckConfig?.()||{},remaining={};
  itemsForMode(true).forEach(it=>{
    const raw=cfg[it.id];
    // If a creator explicitly set 0, keep 0. Otherwise use the normal starter default.
    remaining[it.id]=raw===undefined?2:Math.max(0,parseInt(raw,10)||0);
  });
  const ds={remaining,createdAt:Date.now(),dungeonSession:true};
  dungeonSaveDeckState(ds);
  return ds;
}
window.dungeonBuildDeckState075=dungeonBuildDeckState075;
function dungeonConsumeDeckItem(itemId){const ds=dungeonLoadDeckState();const n=Math.max(0,Number(ds?.remaining?.[itemId])||0);if(n<=0)return false;ds.remaining[itemId]=n-1;dungeonSaveDeckState(ds);return true}
function dungeonEligibleLootItemsForRarity(rarity){
  let ds=dungeonLoadDeckState();
  let items=itemsForMode(true).filter(it=>Math.max(0,Number(ds?.remaining?.[it.id])||0)>0);
  // Core 0.75: with 0% empty-chest chance, exhaustion means reshuffle, not a fake empty chest.
  if(!items.length){
    const ex=getActiveGameProfile?.()?.rpgUniverse?.exploration||{};
    if(Math.max(0,Number(ex.emptyChestChance)||0)<=0){
      ds=dungeonBuildDeckState075();
      items=itemsForMode(true).filter(it=>Math.max(0,Number(ds?.remaining?.[it.id])||0)>0);
    }
  }
  const target=DUNGEON_RARITY_ORDER[rarity]??0;
  let exact=items.filter(it=>(DUNGEON_RARITY_ORDER[dungeonItemRarity(it)]??0)===target);
  if(exact.length)return exact;
  for(let r=target-1;r>=0;r--){const f=items.filter(it=>(DUNGEON_RARITY_ORDER[dungeonItemRarity(it)]??0)===r);if(f.length)return f}
  return items;
}
function dungeonGrantLootByRarity(rarity,heroId=null){const pool=dungeonEligibleLootItemsForRarity(rarity);if(!pool.length)return null;const it=pool[Math.floor(Math.random()*pool.length)];if(!dungeonConsumeDeckItem(it.id))return null;heroId=heroId||dungeonRandomHero();if(!heroId)return null;const st=loadState(heroId);st.inventory=Array.isArray(st.inventory)?st.inventory:[];st.inventory.push(makeInventoryEntry(it.id));localStorage.setItem(key(heroId),JSON.stringify(st));if(String(current||"")===String(heroId)){state=st;try{renderInventory();renderHands();renderGear()}catch(e){}}return {heroId,item:it,rarity:dungeonItemRarity(it)}}
function awardDungeonObjectiveXp(total){
  const ids=dungeonParticipants();total=Math.max(0,Number(total)||0);
  if(!ids.length||!total)return [];
  const base=Math.floor(total/ids.length),rem=total%ids.length,out=[];
  ids.forEach((id,i)=>{
    const add=base+(i<rem?1:0);if(!add)return;
    const st=loadState(id),before=Math.max(0,Number(st.xp)||0);
    st.xp=Math.min(999,before+add);
    if(typeof dungeonSyncProgressionForState==="function")dungeonSyncProgressionForState(id,st);
    dungeonHandleLevelUp071?.(id,before,st,180+i*220);
    localStorage.setItem(key(id),JSON.stringify(st));
    out.push({id,xp:st.xp-before});
  });
  try{renderMenuStatuses();if(current)render()}catch(e){}
  return out
}

function dungeonMerchantDefaultPrice066(it){
  if(!it)return 0;
  if(Number(it.price)>0)return Number(it.price);
  if(!isDungeonMode() || !isDungeonItemRecord(it))return 0;
  if(it.lootOnly || String(it.type||"").toLowerCase()==="butin")return 0;
  const id=String(it.id||"");
  const fixed={
    dng_heal_potion:25,dng_mana_potion:25,dng_fire_scroll:45,
    dng_longsword:90,dng_bow:95,dng_staff:110,
    dng_shield:75,dng_leather:80,dng_chain:130,
    dng_lockpick:20,dng_torch:8,dng_amulet:160,dng_arrows:12
  };
  if(fixed[id]!=null)return fixed[id];
  const type=String(it.type||"").toLowerCase();
  if(type.includes("consomm"))return 25;
  if(type.includes("arme"))return 100;
  if(type.includes("équipement")||type.includes("equipement")||type.includes("armure"))return 90;
  if(type.includes("objet"))return 20;
  return 0;
}
window.dungeonMerchantDefaultPrice066=dungeonMerchantDefaultPrice066;

function merchantItems(){
  refreshCustomEquipmentIntoItems();
  const captureOn=!!(gensGameplayModules?.()?.capture);
  return ITEMS.filter(it=>
    dungeonMerchantDefaultPrice066(it)>0 &&
    (!isDungeonMode()||isDungeonItemRecord(it)) &&
    (!isDungeonMode() || (!it.lootOnly && String(it.type||"").toLowerCase()!=="butin")) &&
    (captureOn || it.type!=="Objet de capture")
  );
}
function openMerchant(){
  if(!gensEconomyEnabled()){alert("Le système économique est désactivé dans cet univers.");return}
  if(!current){const ids=dungeonParticipants?.()||[];if(ids.length)current=ids[0]}
  renderMerchant();const m=document.getElementById("merchantModal");if(m)m.style.display="block";
}
function closeMerchant(){const m=document.getElementById("merchantModal");if(m)m.style.display="none"}
function renderMerchant(){
  const box=document.getElementById("merchantList"),wallet=document.getElementById("merchantWallet");if(!box)return;
  const e=currentRpgEconomy(),gold=current?gensHeroGold(current):0;
  if(wallet)wallet.innerHTML='<strong>'+gensCurrencyLabel(gold)+'</strong> · Prix achat ×'+Number(e.merchantBuyMultiplier||1)+' · Revente '+Number(e.sellPercent||0)+'%';
  const items=merchantItems();
  box.innerHTML=items.length?items.map(it=>{const buy=Math.max(0,Math.round(dungeonMerchantDefaultPrice066(it)*(Number(e.merchantBuyMultiplier)||1)));return '<div class="v2LibCard"><div class="v2LibHead"><strong>'+z40kEscHtml(it.name||it.id)+'</strong><span class="badge">'+gensCurrencyLabel(buy)+'</span></div><div class="small">'+z40kEscHtml(it.type||"Objet")+'</div><div class="v2LibActions"><button type="button" onclick="merchantBuy(\''+z40kEscAttr(it.id)+'\')">🛒 ACHETER</button></div></div>'}).join(""):'<div class="empty">Aucun objet avec une valeur marchande.</div>';
  if(current){
    const st=loadState(current),inv=Array.isArray(st.inventory)?st.inventory:[];
    if(inv.length)box.innerHTML+='<h3 style="margin:12px 0 0">💸 Vendre</h3>'+inv.map((x,i)=>{const it=itemById(x.itemId||x.id),sell=Math.max(0,Math.round((Number(it?.price)||0)*(Number(e.sellPercent)||0)/100));return it&&sell>0?'<div class="v2LibCard"><div class="v2LibHead"><strong>'+z40kEscHtml(it.name)+'</strong><span class="badge">'+gensCurrencyLabel(sell)+'</span></div><div class="v2LibActions"><button type="button" onclick="merchantSell('+i+')">💸 VENDRE</button></div></div>':''}).join("");
  }
}
function merchantBuy(itemId){
  if(!current)return;const it=itemById(itemId);if(!it)return;const e=currentRpgEconomy(),price=Math.max(0,Math.round(dungeonMerchantDefaultPrice066(it)*(Number(e.merchantBuyMultiplier)||1)));
  if(gensHeroGold(current)<price){alert("Pas assez de "+(e.currencyName||"Or")+".");return}
  const st=loadState(current);st.inventory=Array.isArray(st.inventory)?st.inventory:[];st.inventory.push(makeInventoryEntry(itemId));st.gold=gensHeroGold(current)-price;localStorage.setItem(key(current),JSON.stringify(st));state=st;renderMerchant();try{renderInventory();renderEconomyWallet()}catch(e){}
}
function merchantSell(index){
  if(!current)return;const st=loadState(current);st.inventory=Array.isArray(st.inventory)?st.inventory:[];const entry=st.inventory[index],it=itemById(entry?.itemId||entry?.id);if(!it)return;
  const price=Math.max(0,Math.round((Number(it.price)||0)*(Number(currentRpgEconomy().sellPercent)||0)/100));if(price<=0)return;
  st.inventory.splice(index,1);st.gold=gensHeroGold(current)+price;localStorage.setItem(key(current),JSON.stringify(st));state=st;renderMerchant();try{renderInventory();renderHands();renderGear();renderEconomyWallet()}catch(e){}
}

function fillDungeonMjGoldHeroes(){
  const sel=document.getElementById("dungeonMjGoldHero");if(!sel)return;
  const ids=(typeof dungeonParticipants==="function"?dungeonParticipants():normalizeGameParticipants())||[];
  sel.innerHTML=ids.map(id=>'<option value="'+z40kEscAttr(id)+'">'+z40kEscHtml(CHARS[id]?.name||findCustomHero(id)?.name||id)+'</option>').join("");
  sel.onchange=renderDungeonMjGoldBalance;
  renderDungeonMjGoldBalance();
}
function renderDungeonMjGoldBalance(){
  const box=document.getElementById("dungeonMjGoldBalance"),id=document.getElementById("dungeonMjGoldHero")?.value;if(!box)return;
  if(!gensEconomyEnabled()){box.textContent="Le système économique est désactivé.";return}
  box.textContent=id?("Bourse actuelle : "+gensCurrencyLabel(gensHeroGold(id))):"Aucun héros sélectionné.";
}
function dungeonMjChangeGold(sign){
  if(!isGameMasterDevice())return;
  if(!gensEconomyEnabled()){alert("Le système économique est désactivé.");return}
  const id=document.getElementById("dungeonMjGoldHero")?.value;
  const amount=Math.max(1,Number(document.getElementById("dungeonMjGoldAmount")?.value)||1);
  if(!id)return;
  gensChangeHeroGold(id,(sign<0?-1:1)*amount);
  renderDungeonMjGoldBalance();
}
function loadDungeonMjUnified175(){
  try{
    const r=typeof dungeonMjRules151==="function"?dungeonMjRules151():{};
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=String(v)};
    set("dmj175Xp",r.xpMultiplier??1);set("dmj175Gold",r.goldMultiplier??1);set("dmj175Loot",r.lootMultiplier??1);
    set("dmj175Events",r.eventFrequency??2);set("dmj175Diff",r.difficulty??2);set("dmj175Control",r.enemyControl||"ai");
    set("dmj175Init",r.initiativeMode||"strict");set("dmj175Ai",r.aiTactics||"standard");
    const b=document.getElementById("dmj175Boss");if(b)b.checked=!!r.mixedBossMj;
  }catch(e){}
}
function saveDungeonMjUnified175(){
  try{
    const g=id=>document.getElementById(id),r=typeof dungeonMjRules151==="function"?dungeonMjRules151():{};
    r.xpMultiplier=Math.max(0,Number(g("dmj175Xp")?.value)||1);
    r.goldMultiplier=Math.max(0,Number(g("dmj175Gold")?.value)||1);
    r.lootMultiplier=Math.max(0,Number(g("dmj175Loot")?.value)||1);
    r.eventFrequency=Math.max(1,Math.min(3,Number(g("dmj175Events")?.value)||2));
    r.difficulty=Math.max(1,Math.min(4,Number(g("dmj175Diff")?.value)||2));
    r.enemyControl=g("dmj175Control")?.value||"ai";r.initiativeMode=g("dmj175Init")?.value||"strict";
    r.aiTactics=g("dmj175Ai")?.value||"standard";r.mixedBossMj=!!g("dmj175Boss")?.checked;
    GensStorageV1.writeJson(localStorage,"gensrpg_dungeon_mj_rules_v145",r);
    try{gensReconcile171?.("mj175-save")}catch(e){}
    try{gensReconcile151?.("mj175-save")}catch(e){}
  }catch(e){}
}
function dungeonMjObjectiveTypeChanged066(){
  const t=document.getElementById("dungeonMjObjectiveType")?.value||"manual";
  const ew=document.getElementById("dungeonMjObjectiveEnemyWrap"),iw=document.getElementById("dungeonMjObjectiveItemWrap");
  if(ew)ew.style.display=t==="kill"?"block":"none";
  if(iw)iw.style.display=t==="collect"?"block":"none";
}
window.dungeonMjObjectiveTypeChanged066=dungeonMjObjectiveTypeChanged066;

function fillDungeonObjectiveTargets066(){
  const enemySel=document.getElementById("dungeonMjObjectiveEnemy");
  if(enemySel){
    const list=enemiesForMode(true)||[];
    enemySel.innerHTML=list.map(z=>'<option value="'+z40kEscAttr(String(z.id))+'">'+z40kEscHtml(z.name||z.id)+'</option>').join("");
  }
  const itemSel=document.getElementById("dungeonMjObjectiveItem");
  if(itemSel){
    refreshCustomEquipmentIntoItems?.();
    const list=(typeof ITEMS!=="undefined"?ITEMS:[]).filter(it=>isDungeonItemRecord?.(it));
    itemSel.innerHTML=list.map(it=>'<option value="'+z40kEscAttr(String(it.id))+'">'+z40kEscHtml(it.name||it.id)+'</option>').join("");
  }
  dungeonMjObjectiveTypeChanged066();
}

function openDungeonMasterPanel(){if(!isDungeonMode()){return}if(!isGameMasterDevice()){alert("Ce téléphone est configuré comme appareil Joueur. Choisis « Maître du jeu » au lancement de la partie pour utiliser ces commandes.");return}refreshCustomEnemiesIntoZombieTypes();fillDungeonMjGoldHeroes();const modal=document.getElementById("dungeonMasterModal");if(!modal)return;const es=document.getElementById("dungeonMjEnemy"),ts=document.getElementById("dungeonMjTrap");if(es){const list=enemiesForMode(true);es.innerHTML=list.map(z=>'<option value="'+z40kEscHtml(String(z.id))+'">'+z40kEscHtml(z.name)+'</option>').join("")}if(ts)ts.innerHTML=Object.values(dungeonTrapTypes()).map(t=>'<option value="'+t.id+'">'+t.icon+' '+z40kEscHtml(t.name)+' — '+t.statLabel+'</option>').join("");fillDungeonObjectiveTargets066();renderDungeonMasterScene();loadDungeonMjUnified175();modal.style.display="block";document.body.style.overflow="hidden"}
function closeDungeonMasterPanel(){const m=document.getElementById("dungeonMasterModal");if(m)m.style.display="none";document.body.style.overflow=""}
function dungeonMjSpawnEnemy(){const id=document.getElementById("dungeonMjEnemy")?.value,qty=Math.max(1,Math.min(20,Number(document.getElementById("dungeonMjEnemyQty")?.value)||1));if(!id)return;const created=trackSpawnedEnemyInstances(id,qty);renderActiveEnemyButtons();renderActiveEnemies();updateDungeonExploreButtons();showEffectPopup("👹","AJOUT MJ",qty+" × "+z40kEscHtml(activeEnemyDefinition(id)?.name||id)+" ajouté"+(qty>1?"s":"")+" à la salle.",created.length?"Fiches ennemies actives créées":"Ajout effectué",true);renderDungeonMasterScene()}
function dungeonMjAddChest(){const rarity=document.getElementById("dungeonMjChestRarity")?.value||"common",trapped=!!document.getElementById("dungeonMjChestTrapped")?.checked;addDungeonSceneElement({kind:"chest",name:"Coffre "+dungeonRarityLabel(rarity),rarity,trapped});renderDungeonMasterScene()}
function dungeonMjAddTrap(){const trap=dungeonTrapTypes()[document.getElementById("dungeonMjTrap")?.value]||dungeonTrapTypes().dart;addDungeonSceneElement({kind:"trap",name:trap.name,trapId:trap.id});renderDungeonMasterScene()}
function dungeonMjAddObjective(){
  const name=(document.getElementById("dungeonMjObjectiveName")?.value||"").trim()||"Objectif secondaire";
  const xp=Math.max(0,Number(document.getElementById("dungeonMjObjectiveXp")?.value)||0);
  const objectiveType=document.getElementById("dungeonMjObjectiveType")?.value||"manual";
  const qty=Math.max(1,Number(document.getElementById("dungeonMjObjectiveQty")?.value)||1);
  let targetId="",targetName="";
  if(objectiveType==="kill"){
    targetId=document.getElementById("dungeonMjObjectiveEnemy")?.value||"";
    const d=activeEnemyDefinition?.(targetId);targetName=d?.name||targetId;
  }else if(objectiveType==="collect"){
    targetId=document.getElementById("dungeonMjObjectiveItem")?.value||"";
    const d=itemById?.(targetId);targetName=d?.name||targetId;
  }
  addDungeonSceneElement({kind:"objective",name,xp,objectiveType,targetId,targetName,qty,progress:0,status:"active",secondary:true});
  renderDungeonMasterScene();
  try{decorateRoomAssets051?.()}catch(e){}
}
function dungeonResolveChest(id){
  const a=loadDungeonSceneElements(),el=a.find(x=>String(x.id)===String(id));if(!el)return;
  const heroId=dungeonRandomHero();
  if(el.trapped){const trap=dungeonPickTrapType(loadDungeonConfig());el.trapped=false;saveDungeonSceneElements(a);dungeonResolveTrapAgainstHero(trap.id,heroId,true);return}
  const ex=getActiveGameProfile?.()?.rpgUniverse?.exploration||{};
  const emptyChance=Math.max(0,Math.min(100,Number(ex.emptyChestChance)||0));
  if(emptyChance>0 && Math.random()*100<emptyChance){
    removeDungeonSceneElement(id);
    showEffectPopup("🎁","COFFRE VIDE","Le coffre est réellement vide (chance configurée : "+emptyChance+" %).","Dungeon",true);
    return;
  }
  const drop=dungeonGrantLootByRarity(el.rarity||"common",heroId);
  if(!drop){
    // Do not destroy the chest if this is a catalogue/deck configuration problem.
    showEffectPopup("⚠️","PIoche DE COFFRE INDISPONIBLE","Aucun objet Dungeon n’est actuellement disponible dans la pioche.<br><br>Le coffre reste présent : vérifie la configuration de la pioche/objets puis réessaie.","Coffre conservé",true);
    return;
  }
  removeDungeonSceneElement(id);
  showEffectPopup("🎁","COFFRE "+dungeonRarityLabel(el.rarity||"common").toUpperCase(),(CHARS[drop.heroId]?.name||findCustomHero(drop.heroId)?.name||drop.heroId)+" obtient <strong>"+z40kEscHtml(drop.item?.name||"Objet")+"</strong>.<br>Rareté objet : "+dungeonRarityLabel(drop.rarity),"Coffre ouvert",true);
}
function dungeonResolveTrapElement(id,heroId){const el=loadDungeonSceneElements().find(x=>String(x.id)===String(id));if(!el)return;dungeonResolveTrapAgainstHero(el.trapId||"dart",heroId,true);removeDungeonSceneElement(id)}
function dungeonObjectiveProgressText066(el){
  const type=el?.objectiveType||"manual",qty=Math.max(1,Number(el?.qty)||1),p=Math.max(0,Number(el?.progress)||0);
  if(type==="kill")return "Tuer "+qty+" × "+(el.targetName||el.targetId||"créature")+" · "+Math.min(p,qty)+"/"+qty;
  if(type==="collect")return "Récolter "+qty+" × "+(el.targetName||el.targetId||"objet")+" · "+Math.min(p,qty)+"/"+qty;
  return "Validation par le MJ";
}
function dungeonRefreshCollectObjectives066(){
  const all=loadDungeonSceneElements(),room=Number(loadDungeonState()?.room)||0;
  let changed=false;
  all.forEach(el=>{
    if(el.kind!=="objective"||el.status==="done"||el.objectiveType!=="collect"||Number(el.room||0)!==room)return;
    let count=0;
    (dungeonParticipants?.()||[]).forEach(id=>{
      const st=loadState(id),inv=Array.isArray(st?.inventory)?st.inventory:[];
      count+=inv.filter(x=>String(x?.itemId||x?.id||x)===String(el.targetId)).length;
    });
    if(Number(el.progress)!==count){el.progress=count;changed=true}
  });
  if(changed)saveDungeonSceneElements(all);
}
function dungeonProgressKillObjectives066(def){
  const target=String(def?.id||def?.enemyId||"");if(!target)return;
  const all=loadDungeonSceneElements(),room=Number(loadDungeonState()?.room)||0;let changed=false;
  all.forEach(el=>{
    if(el.kind!=="objective"||el.status==="done"||el.objectiveType!=="kill"||Number(el.room||0)!==room)return;
    if(String(el.targetId)!==target)return;
    el.progress=Math.min(Math.max(1,Number(el.qty)||1),Math.max(0,Number(el.progress)||0)+1);changed=true;
  });
  if(changed){saveDungeonSceneElements(all);try{renderDungeonMasterScene();decorateRoomAssets051?.()}catch(e){}}
}
window.dungeonProgressKillObjectives066=dungeonProgressKillObjectives066;

function dungeonCompleteObjective(id){
  dungeonRefreshCollectObjectives066();
  const el=loadDungeonSceneElements().find(x=>String(x.id)===String(id));if(!el)return;
  const qty=Math.max(1,Number(el.qty)||1),type=el.objectiveType||"manual";
  if(type!=="manual" && Math.max(0,Number(el.progress)||0)<qty){
    alert("Cet objectif n’est pas encore rempli : "+dungeonObjectiveProgressText066(el));return;
  }
  const shares=awardDungeonObjectiveXp(el.xp||0);
  removeDungeonSceneElement(id);
  showEffectPopup("🎯","OBJECTIF SECONDAIRE ACCOMPLI",z40kEscHtml(el.name)+(shares.length?"<br><br>⭐ "+shares.map(x=>(CHARS[x.id]?.name||findCustomHero(x.id)?.name||x.id)+" +"+x.xp+" XP").join(" · "):""),"Dungeon",true);
  try{decorateRoomAssets051?.()}catch(e){}
}
function renderDungeonMasterScene(){const host=document.getElementById("dungeonMjSceneList");if(!host)return;const els=dungeonCurrentSceneElements(),heroes=dungeonParticipants();if(!els.length){host.innerHTML='<div class="empty">Aucun coffre, piège ou objectif manuel dans cette salle.</div>';return}host.innerHTML=els.map(el=>{if(el.kind==="chest"){const r=el.rarity||"common";return '<div class="dungeonSceneCard rarity-'+r+'"><div class="dungeonSceneCardHead"><strong>🎁 '+z40kEscHtml(el.name||"Coffre")+'</strong>'+(el.trapped?'<span class="badge">⚠️ PIÉGÉ</span>':'')+'</div><div class="dungeonSceneMeta">Rareté : '+dungeonRarityLabel(r)+'</div><div class="dungeonSceneActions"><button onclick="dungeonResolveChest(\''+el.id+'\')">🔓 OUVRIR</button><button class="danger" onclick="removeDungeonSceneElement(\''+el.id+'\')">🗑</button></div></div>'}if(el.kind==="trap"){const t=dungeonTrapTypes()[el.trapId]||dungeonTrapTypes().dart,opts=heroes.map(h=>'<option value="'+h+'">'+z40kEscHtml(CHARS[h]?.name||findCustomHero(h)?.name||h)+'</option>').join("");return '<div class="dungeonSceneCard"><div class="dungeonSceneCardHead"><strong>'+t.icon+' '+z40kEscHtml(t.name)+'</strong></div><div class="dungeonSceneMeta">Test : '+t.statLabel+' · dégâts : '+t.damage+'</div><select id="trapTarget_'+el.id+'" style="width:100%;margin-top:7px;background:#0c0b09;color:#fff;border:1px solid #5a4d37;border-radius:9px;padding:8px">'+opts+'</select><div class="dungeonSceneActions"><button onclick="dungeonResolveTrapElement(\''+el.id+'\',document.getElementById(\'trapTarget_'+el.id+'\').value)">🎲 DÉCLENCHER</button><button class="danger" onclick="removeDungeonSceneElement(\''+el.id+'\')">🗑</button></div></div>'}dungeonRefreshCollectObjectives066();const fresh=loadDungeonSceneElements().find(x=>String(x.id)===String(el.id))||el;const ready=(fresh.objectiveType||"manual")==="manual"||Math.max(0,Number(fresh.progress)||0)>=Math.max(1,Number(fresh.qty)||1);return '<div class="dungeonSceneCard"><div class="dungeonSceneCardHead"><strong>🎯 '+z40kEscHtml(fresh.name||"Objectif secondaire")+'</strong><span class="badge">'+(ready?'PRÊT':'EN COURS')+'</span></div><div class="dungeonSceneMeta">'+z40kEscHtml(dungeonObjectiveProgressText066(fresh))+'<br>Récompense groupe : '+Math.max(0,Number(fresh.xp)||0)+' XP</div><div class="dungeonSceneActions"><button '+(ready?'':'disabled')+' onclick="dungeonCompleteObjective(\''+fresh.id+'\')">✅ VALIDER</button><button class="danger" onclick="removeDungeonSceneElement(\''+fresh.id+'\')">🗑</button></div></div>'}).join("")}
