// GenSrpG Capture World / Exploration V1 - byte-identical source relocation.
// Classic script intentionally retains historical global API / function scope.
// BEGIN_CAPTURE_WORLD_SECTION_1
const GENS_CAPTURE_WORLD_KEY="gensrpg_capture_world_v1";
function captureWorldKey(){
  let pid="default";try{pid=String(activeGameProfileId?.()||"default")}catch(e){}
  return GENS_CAPTURE_WORLD_KEY+"_"+pid;
}
function captureWorldState(){
  try{
    const x=JSON.parse(localStorage.getItem(captureWorldKey())||"{}");
    return {
      locationId:x.locationId||"",
      locationName:x.locationName||"Camp de départ",
      last:x.last||null,
      playMode:x.playMode==="turns"?"turns":"free",
      day:Math.max(1,Number(x.day)||1),
      turnIndex:Math.max(0,Number(x.turnIndex)||0)
    };
  }catch(e){
    return {locationId:"",locationName:"Camp de départ",last:null,playMode:"free",day:1,turnIndex:0};
  }
}
function saveCaptureWorldState(st){try{localStorage.setItem(captureWorldKey(),JSON.stringify(st||{}))}catch(e){}}
// END_CAPTURE_WORLD_SECTION_1
// BEGIN_CAPTURE_WORLD_SECTION_2
function captureDefaultLocations(){
  return [
    {id:"cap_forest",name:"Forêt sauvage",desc:"Sous-bois, clairières et ruisseaux.",tags:[{tagId:"earth",weight:60},{tagId:"air",weight:30},{tagId:"water",weight:15}]},
    {id:"cap_cave",name:"Grotte rocheuse",desc:"Galeries sombres et parois minérales.",tags:[{tagId:"earth",weight:80},{tagId:"shadow",weight:30}]},
    {id:"cap_lake",name:"Rive du lac",desc:"Zone humide fréquentée par les créatures aquatiques.",tags:[{tagId:"water",weight:80},{tagId:"air",weight:20}]},
    {id:"cap_route",name:"Route des dresseurs",desc:"Route reliant les zones sauvages à la ville.",tags:[{tagId:"air",weight:35},{tagId:"earth",weight:35},{tagId:"light",weight:15}]},
    {id:"cap_ruins",name:"Ruines anciennes",desc:"Vestiges où peuvent rôder des créatures rares.",tags:[{tagId:"shadow",weight:45},{tagId:"light",weight:35},{tagId:"earth",weight:25}]},
    {id:"cap_town",name:"Ville des dresseurs",desc:"Boutique, centre de soin et rencontres avec des PNJ.",tags:[{tagId:"light",weight:40},{tagId:"air",weight:20}]}
  ];
}
function captureProfileLocations(){
  const defaults=captureDefaultLocations();
  try{
    const p=getActiveGameProfile();ensureRpgProfileData(p);
    const custom=(p.rpgUniverse?.encounters?.locations||[]).map(x=>({...x,tags:gensMigrateLegacyLocationTags(x)}));
    if(!custom.length)return defaults;
    // Les lieux créés par le MJ restent prioritaires, mais une vieille sauvegarde
    // ne contenant que "Forêt" ne supprime plus toute la démo.
    const ids=new Set(custom.map(x=>String(x.id)));
    return [...custom,...defaults.filter(x=>!ids.has(String(x.id)))];
  }catch(e){return defaults}
}
function captureTagLabel(id){
  try{const e=gensElementById(id);return (e?.icon||"◈")+" "+(e?.name||id)}catch(e){return id}
}
function captureEnsureDefaultLocations(){
  try{
    const p=getActiveGameProfile();if(!p||!gensPureCaptureSheetMode())return;
    ensureRpgProfileData(p);
    const existing=p.rpgUniverse.encounters.locations||[];
    if(existing.length)return;
    p.rpgUniverse.encounters.locations=captureDefaultLocations();
    const all=loadGameProfiles(),i=all.findIndex(x=>String(x.id)===String(p.id));
    if(i>=0){all[i]=p;saveGameProfiles(all)}
  }catch(e){console.warn("Lieux Capture de démonstration",e)}
}

// END_CAPTURE_WORLD_SECTION_2
// BEGIN_CAPTURE_WORLD_SECTION_3
function captureParticipantIds(){
  try{return normalizeGameParticipants().map(String)}catch(e){return[]}
}
function captureTrainerName(id){
  return CHARS[id]?.name||findCustomHero(id)?.name||id||"Dresseur";
}
function captureTogglePlayMode(){
  const ws=captureWorldState();
  ws.playMode=ws.playMode==="turns"?"free":"turns";
  ws.turnIndex=0;
  saveCaptureWorldState(ws);
  renderCaptureWorldHub();
}
function captureNextPlayerTurn(){
  const ws=captureWorldState(),players=captureParticipantIds();
  if(ws.playMode!=="turns"){
    ws.day=Math.max(1,Number(ws.day)||1)+1;
  }else if(players.length){
    ws.turnIndex=(Math.max(0,Number(ws.turnIndex)||0)+1);
    if(ws.turnIndex>=players.length){
      ws.turnIndex=0;
      ws.day=Math.max(1,Number(ws.day)||1)+1;
    }
  }
  ws.last={type:"turn",text:ws.playMode==="turns"?"Le tour passe au dresseur suivant.":"Une nouvelle journée commence."};
  saveCaptureWorldState(ws);
  renderCaptureWorldHub();
}
function captureRenderTurnDay(){
  const ws=captureWorldState(),players=captureParticipantIds();
  const day=document.getElementById("captureDayLabel");
  const player=document.getElementById("captureTurnPlayerLabel");
  const modeBtn=document.getElementById("captureModeToggleBtn");
  const next=document.getElementById("captureNextTurnBtn");
  if(day)day.textContent="☀️ Jour "+ws.day;
  if(ws.playMode==="turns"){
    const i=players.length?ws.turnIndex%players.length:0;
    if(player)player.textContent=players.length?("Au tour de "+captureTrainerName(players[i])):"Mode tours";
    if(modeBtn)modeBtn.textContent="👥 MODE TOURS";
    if(next){next.style.display="";next.textContent="⏭ FIN DU TOUR";}
  }else{
    if(player)player.textContent="Progression libre · chaque joueur évolue de son côté";
    if(modeBtn)modeBtn.textContent="🕊️ MODE LIBRE";
    if(next){next.style.display="";next.textContent="☀️ JOUR SUIVANT";}
  }
}
// END_CAPTURE_WORLD_SECTION_3
// BEGIN_CAPTURE_WORLD_SECTION_4
function renderCaptureWorldHub(){
  try{captureEnsureStarterKitsForParticipants()}catch(e){}

  const hub=document.getElementById("captureGameHub");
  const on=hasActiveSession() && (typeof gensCurrentContentFamily==="function"&&gensCurrentContentFamily()==="creature");
  document.body.classList.toggle("gens-pure-capture",on);
  if(hub)hub.style.display=on?"block":"none";
  if(!on)return;

  try{captureEnsureStarterKitsForParticipants()}catch(e){console.warn("Kit de départ Capture",e)}
  captureEnsureDefaultLocations();
  const ws=captureWorldState();
  captureRenderTurnDay();
  const gm=typeof isGameMasterDevice==="function"&&isGameMasterDevice();
  const mj=document.getElementById("captureMjQuickBtn");if(mj)mj.style.display=gm?"":"none";
  const loc=document.getElementById("captureWorldLocationLabel");if(loc)loc.textContent=ws.locationName||"Camp de départ";

  const st=captureActiveHeroState(),eco=currentRpgEconomy?.();
  const money=document.getElementById("captureWorldMoneyLabel");
  if(money)money.textContent=eco?.enabled?((eco.currencyIcon||"🪙")+" "+Math.max(0,Number(st?.gold)||0)):"🪙 —";
  const team=document.getElementById("captureWorldTeamLabel");if(team)team.textContent="🐲 "+captureTeamEntityRoster().length+"/6";

  const narr=document.getElementById("captureWorldNarrative");
  if(narr)narr.textContent=ws.last?.text||"Choisis un lieu puis pars à l’aventure.";
  renderCaptureCurrentEncounter();
}
function captureOpenExplore(){captureEnsureDefaultLocations();renderCaptureLocationList();captureOpenModal("captureExploreModal")}
function renderCaptureLocationList(){
  const host=document.getElementById("captureLocationList");if(!host)return;
  const ws=captureWorldState(),locs=captureProfileLocations();
  host.innerHTML=locs.map(loc=>{
    const tags=(loc.tags||[]).map(t=>`<span>${z40kEscHtml(captureTagLabel(t.tagId))} ${Number(t.weight)||0}%</span>`).join("");
    return `<div class="captureLocationCard ${String(ws.locationId)===String(loc.id)?"selected":""}">
      <strong>${z40kEscHtml(loc.name||"Lieu")}</strong>
      <div class="small">${z40kEscHtml(loc.desc||"")}</div>
      <div class="captureLocationTags">${tags}</div>
      <div class="captureLocationActions">
        <button type="button" onclick="captureTravelTo('${z40kEscAttr(loc.id)}')">📍 VOYAGER ICI</button>
        <button type="button" onclick="captureExploreAt('${z40kEscAttr(loc.id)}')">🐾 EXPLORER ICI</button>
      </div>
    </div>`;
  }).join("");
}
function captureTravelTo(id){
  const loc=captureProfileLocations().find(x=>String(x.id)===String(id));if(!loc)return;
  const ws=captureWorldState();ws.locationId=String(loc.id);ws.locationName=loc.name||"Lieu";ws.last={type:"travel",text:"Le groupe arrive à "+(loc.name||"ce lieu")+"."};saveCaptureWorldState(ws);
  renderCaptureLocationList();renderCaptureWorldHub();
}
function captureRollLocation(loc){
  try{
    const p=getActiveGameProfile();ensureRpgProfileData(p);
    const exists=(p.rpgUniverse.encounters.locations||[]).some(x=>String(x.id)===String(loc.id));
    if(exists)return gensRollLocationEncounter(loc.id);
  }catch(e){}
  const tags=(loc.tags||[]).filter(t=>t.tagId&&Number(t.weight)>0);
  const eligible=gensEncounterCreatures().filter(c=>c.spawnChance>0&&c.spawnTags.some(t=>tags.some(z=>String(z.tagId)===String(t))));
  const passed=eligible.filter(c=>Math.random()*100<c.spawnChance);
  if(!passed.length)return {location:loc,creature:null,reason:"no_spawn"};
  const chosen=passed[Math.floor(Math.random()*passed.length)];
  return {location:loc,creature:chosen,creatureId:chosen.id,reason:"spawn"};
}
function captureExploreAt(id){
  const loc=captureProfileLocations().find(x=>String(x.id)===String(id));if(!loc)return;
  const ws=captureWorldState();ws.locationId=String(loc.id);ws.locationName=loc.name||"Lieu";ws.last=null;saveCaptureWorldState(ws);
  renderCaptureLocationList();renderCaptureWorldHub();
  captureGenerateEncounter();
  captureCloseModal("captureExploreModal");captureOpenModal("captureEncounterModal");
}
function renderCaptureExploreResult(){
  const host=document.getElementById("captureExploreResult");if(!host)return;
  const ws=captureWorldState(),last=ws.last;
  if(!last){host.innerHTML="";return}
  if(last.type==="wild"){
    const c=loadSharedEntities().find(x=>String(x.id)===String(last.creatureId));
    host.innerHTML=`<div class="captureEncounterCard"><strong>🐾 ${z40kEscHtml(c?.name||"Créature sauvage")}</strong>
      <div class="small" style="margin:5px 0">${z40kEscHtml(c?.desc||"Une créature sauvage vous fait face.")}</div>
      <div class="v2LibActions"><button onclick="captureStartWildBattle('${z40kEscAttr(last.creatureId)}')">⚔️ COMBATTRE</button><button onclick="captureIgnoreEncounter()">➡️ CONTINUER</button></div></div>`;
  }else host.innerHTML=`<div class="captureEncounterCard">${z40kEscHtml(last.text||"")}</div>`;
}
function renderCaptureCurrentEncounter(){
  const host=document.getElementById("captureCurrentEncounterCard");if(!host)return;
  const ws=captureWorldState(),last=ws.last;
  if(last?.type!=="wild"){host.style.display="none";host.innerHTML="";return}
  const c=loadSharedEntities().find(x=>String(x.id)===String(last.creatureId));
  host.style.display="block";
  host.innerHTML=`<strong>🐾 Rencontre sauvage : ${z40kEscHtml(c?.name||"Créature")}</strong>
    <div class="small">${z40kEscHtml(c?.desc||"")}</div>
    <div class="v2LibActions" style="margin-top:7px"><button onclick="captureStartWildBattle('${z40kEscAttr(last.creatureId)}')">⚔️ COMBATTRE</button><button onclick="captureIgnoreEncounter()">➡️ IGNORER</button></div>`;
}

function captureConsumeWildEncounter(reason="battle"){
  const ws=captureWorldState();
  if(ws.last?.type==="wild"){
    ws.last={type:"resolved",text:reason==="victory"?"La créature sauvage est vaincue. Explore de nouveau pour chercher une autre rencontre.":"La rencontre est terminée."};
    saveCaptureWorldState(ws);
  }
  renderCaptureWorldHub();
  renderCaptureExploreResult();
}
function captureIgnoreEncounter(){const ws=captureWorldState();ws.last={type:"empty",text:"Le groupe poursuit son chemin."};saveCaptureWorldState(ws);renderCaptureWorldHub();renderCaptureExploreResult()}
function captureOpenEncounter(){
  if(typeof isGameMasterDevice==="function"&&!isGameMasterDevice()){
    alert("Les rencontres sauvages se découvrent en explorant. Seul le MJ peut forcer une rencontre.");
    return;
  }
  renderCaptureEncounterPage();
  captureOpenModal("captureEncounterModal");
}
function renderCaptureEncounterPage(){
  const host=document.getElementById("captureEncounterModalBody");if(!host)return;
  const ws=captureWorldState(),last=ws.last;
  if(last?.type==="wild"){
    const c=loadSharedEntities().find(x=>String(x.id)===String(last.creatureId));
    host.innerHTML=`<div class="captureEncounterCard"><h3>🐾 ${z40kEscHtml(c?.name||"Créature sauvage")}</h3><div class="small">${z40kEscHtml(c?.desc||"Une créature sauvage vous fait face.")}</div><div class="v2LibActions" style="margin-top:10px"><button onclick="captureStartWildBattle('${z40kEscAttr(last.creatureId)}')">⚔️ COMBATTRE</button><button onclick="captureIgnoreEncounter();captureCloseModal('captureEncounterModal')">🏃 PARTIR</button></div></div>`;return;
  }
  if(last?.type==="item"){
    host.innerHTML=`<div class="captureEncounterCard"><h3>🎁 Découverte</h3><div>${z40kEscHtml(last.text||"Objet trouvé")}</div><div class="v2LibActions" style="margin-top:10px"><button onclick="captureTakeFoundItem('${z40kEscAttr(last.itemId||"")}')">🎒 RAMASSER</button><button onclick="captureGenerateEncounter()">➡️ CONTINUER</button></div></div>`;return;
  }
  if(last?.type==="money"){
    host.innerHTML=`<div class="captureEncounterCard"><h3>🪙 Argent trouvé</h3><div>${z40kEscHtml(last.text||"")}</div><div class="v2LibActions" style="margin-top:10px"><button onclick="captureTakeFoundMoney(${Math.max(0,Number(last.amount)||0)})">💰 RAMASSER</button></div></div>`;return;
  }
  if(last?.type==="friendly_trainer"||last?.type==="hostile_trainer"){
    const hostile=last.type==="hostile_trainer";
    host.innerHTML=`<div class="captureEncounterCard"><h3>${hostile?"😠 Dresseur hostile":"🙂 Dresseur amical"}</h3><div>${z40kEscHtml(last.text||"")}</div><div class="v2LibActions" style="margin-top:10px"><button onclick="captureCloseModal('captureEncounterModal');captureOpenTrainerBattle()">⚔️ ${hostile?"COMBATTRE":"ACCEPTER"}</button>${hostile?"":'<button onclick="captureGenerateEncounter()">➡️ REFUSER</button>'}</div></div>`;return;
  }
  const loc=captureProfileLocations().find(x=>String(x.id)===String(ws.locationId))||captureProfileLocations()[0];
  host.innerHTML=`<div class="captureEncounterCard"><strong>📍 ${z40kEscHtml(loc?.name||"Zone sauvage")}</strong><div style="margin:8px 0">${z40kEscHtml(last?.text||"Explore les environs.")}</div><button class="startGameBtn" onclick="captureGenerateEncounter()">🎲 EXPLORER LES ENVIRONS</button></div>`;
}
function captureGenerateEncounter(){
  const ws=captureWorldState();
  const loc=captureProfileLocations().find(x=>String(x.id)===String(ws.locationId))||captureProfileLocations()[0];
  if(!loc){alert("Aucun lieu disponible.");return}
  const roll=Math.random()*100;let result;
  if(roll<45){
    const wild=captureRollLocation(loc);
    result=wild?.creature
      ?{type:"wild",creatureId:String(wild.creature.id),text:"🐾 Une créature sauvage apparaît : "+wild.creature.name+" !"}
      :{type:"empty",text:"🌿 Vous trouvez des traces, mais aucune créature ne se montre."};
  }else if(roll<60){
    const a=["Le secteur est calme.","Vous explorez sans rien trouver.","Un bruit attire votre attention puis disparaît.","Vous découvrez un ancien sentier, mais rien d'autre."];
    result={type:"empty",text:"🌿 "+a[Math.floor(Math.random()*a.length)]};
  }else if(roll<73){
    const loot=captureShopItems(),it=loot.length?loot[Math.floor(Math.random()*loot.length)]:null;
    result={type:"item",itemId:it?.id||"",text:it?"🎁 Vous trouvez : "+it.name+" !":"🎁 Vous trouvez quelques provisions."};
  }else if(roll<83){
    const amount=5+Math.floor(Math.random()*21);
    result={type:"money",amount,text:"🪙 Vous trouvez "+amount+" pièces !"};
  }else if(roll<92){
    result={type:"friendly_trainer",text:"🙂 Vous rencontrez un dresseur amical. Il propose un combat d'entraînement."};
  }else{
    result={type:"hostile_trainer",text:"😠 Un dresseur hostile vous barre la route. Le combat est inévitable !"};
  }
  ws.last=result;saveCaptureWorldState(ws);renderCaptureWorldHub();renderCaptureEncounterPage();
}

function captureTakeFoundMoney(amount){
  const heroId=captureActiveHeroId();if(!heroId)return;
  amount=Math.max(0,Number(amount)||0);
  const st=loadState(heroId);st.gold=Math.max(0,Number(st.gold)||0)+amount;
  localStorage.setItem(key(heroId),JSON.stringify(st));if(String(heroId)===String(current))state=st;
  const ws=captureWorldState();ws.last={type:"resolved",text:"🪙 "+amount+" pièces ajoutées à votre bourse."};saveCaptureWorldState(ws);
  renderCaptureEncounterPage();renderCaptureWorldHub();
}
function captureTakeFoundItem(itemId){
  const heroId=captureActiveHeroId();if(!heroId){alert("Aucun dresseur actif.");return}
  const it=captureShopItems().find(x=>String(x.id)===String(itemId));if(!it){alert("Objet introuvable.");return}
  const st=loadState(heroId);st.inventory=Array.isArray(st.inventory)?st.inventory:[];
  const e=st.inventory.find(x=>String(x.itemId||x.id)===String(it.id));
  if(e)e.qty=Math.max(1,Number(e.qty)||1)+1;
  else st.inventory.push({itemId:it.id,id:it.id,name:it.name,type:it.type,desc:it.desc,qty:1,virtual:!!it._captureDemo});
  localStorage.setItem(key(heroId),JSON.stringify(st));if(heroId===current)state=st;
  const ws=captureWorldState();ws.last={type:"empty",text:"🎒 "+it.name+" a été ajouté à l'inventaire."};saveCaptureWorldState(ws);
  renderCaptureEncounterPage();renderCaptureWorldHub();
}

// END_CAPTURE_WORLD_SECTION_4
