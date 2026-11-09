function renderGensRpgUniverseCards(family="adventure"){
  let profiles=[];
  try{profiles=rpgProfiles()}catch(e){
    console.error("GenSrpG RPG profiles",e);
    const raw=loadGameProfiles().filter(p=>{const f=gensContentFamilyForProfile(p);return f==="rpg"||f==="manga"||f==="creature"});
    profiles=raw.map(p=>{try{return ensureRpgProfileData(p)}catch(err){console.error(err);return p}});
  }

  profiles=profiles.filter(p=>(gensContentFamilyForProfile(p)==="creature")===(family==="capture"));
  const cards=profiles.map(p=>{
    try{
      ensureRpgProfileData(p);
      const trainerCount=p.heroPool?.length||0;
      const meta=gensContentFamilyForProfile(p)==="creature"
        ? trainerCount+" dresseur"+(trainerCount===1?"":"s")+" · Capture de créatures"
        : trainerCount+" héros · "+(p.objectPool?.length||0)+" objets · "+Object.keys(p.enemyConfig||{}).length+" monstres";
      const protectedUniverse=p.id===GAME_PROFILE_DUNGEON_ID||p.builtIn;
      return `
        <div class="gensFamilyGameCard gensUniverseCard" data-rpg-profile="${z40kEscAttr(p.id)}">
          <button type="button" class="gensUniverseMainBtn" onclick="openGensBuiltInGame('${z40kEscAttr(p.id)}','${family}')">
            <span>${z40kEscHtml(p.rpgUniverse?.icon||"🧭")}</span>
            <b>${z40kEscHtml(p.name||"Univers RPG")}</b>
            <small>${z40kEscHtml(meta)}</small>
          </button>
          <div class="gensUniverseCardActions">
            <button type="button" onclick="selectRpgUniverseProfile('${z40kEscAttr(p.id)}');openRpgUniverseEditor()">✏️ MODIFIER</button>
            ${protectedUniverse?"":`<button type="button" class="creatorDelete" onclick="deleteRpgUniverseProfile('${z40kEscAttr(p.id)}')">🗑️ SUPPRIMER</button>`}
          </div>
        </div>`;
    }catch(e){console.error("GenSrpG RPG card",e);return ""}
  }).join("");

  return cards+`
    <button type="button" class="gensFamilyGameCard" onclick="createNewRpgUniverse(true,'${family}')">
      <span>➕</span><b>NOUVEL UNIVERS</b>
      <small>${family==="capture"?"Créer un monde Capture avec équipe de créatures.":"Partir de zéro : aucun héros, objet ou monstre sélectionné."}</small>
    </button>`;
}

function renderGensSurvivalUniverseCards(){
  const profiles=survivalProfiles(),cards=profiles.map(p=>{
    ensureSurvivalProfileData(p);
    const icon=p.survival?.icon||"🎮";
    const meta=(p.heroPool?.length||0)+" héros · "+(p.objectPool?.length||0)+" objets · "+Object.keys(p.enemyConfig||{}).length+" ennemis · "+(p.survival?.levels?.length||1)+" niveau(x)";
    return `<button type="button" class="gensFamilyGameCard" onclick="openGensBuiltInGame('${z40kEscAttr(p.id)}','survival')"><span>${z40kEscHtml(icon)}</span><b>${z40kEscHtml(p.name||'Univers Survie')}</b><small>${z40kEscHtml(meta)}</small></button>`;
  }).join("");
  return cards+'<button type="button" class="gensFamilyGameCard" onclick="createNewSurvivalUniverse(true)"><span>➕</span><b>NOUVEL UNIVERS</b><small>Partir de zéro : aucun héros, objet ou ennemi sélectionné.</small></button>';
}
function renderGensFamilyGamesIfVisible(){
  if(document.getElementById("gensFamilyHome")?.style.display==="none")return;
  const host=document.getElementById("gensFamilyGames");if(!host)return;
  if(gensSelectedFamily==="survival")host.innerHTML=renderGensSurvivalUniverseCards();
  if(gensSelectedFamily==="adventure"||gensSelectedFamily==="capture")host.innerHTML=renderGensRpgUniverseCards(gensSelectedFamily);
}

function openGensFamily(family){
  gensSelectedFamily=family;
  document.body.classList.remove("gensCapturePregame","gensAdventurePregame");
  if(family!=="adventure")document.body.classList.remove("gensDungeonTheme");
  gensHideHomeLevels();
  const page=document.getElementById("gensFamilyHome");if(page)page.style.display="block";
  const title=document.getElementById("gensFamilyTitle"),heading=document.getElementById("gensFamilyHeading"),hint=document.getElementById("gensFamilyHint"),host=document.getElementById("gensFamilyGames");
  if(family==="survival"){
    if(title)title.textContent="☠️ Mode Survie";if(heading)heading.textContent="Univers de survie";if(hint)hint.textContent="40K est un univers de référence. Tu peux créer autant d’univers indépendants que tu veux et partir totalement de zéro.";
    if(host)host.innerHTML=renderGensSurvivalUniverseCards();
  }else if(family==="adventure"){
    if(title)title.textContent="🧭 Aventure RPG";if(heading)heading.textContent="Univers RPG";if(hint)hint.textContent="Dungeon est l’univers RPG de référence. Tu peux créer autant d’univers RPG indépendants que tu veux et partir totalement de zéro.";
    if(host)host.innerHTML=renderGensRpgUniverseCards("adventure");
  }else if(family==="capture"){
    if(title)title.textContent="🐲 Monster Capture";if(heading)heading.textContent="Mondes Monster Capture";if(hint)hint.textContent="Crée et explore des mondes de créatures indépendants de Dungeon.";
    if(host)host.innerHTML=renderGensRpgUniverseCards("capture");
  }else{
    if(title)title.textContent="⚔️ Mode Duel / PvP";if(heading)heading.textContent="Duel / affrontement";if(hint)hint.textContent="Le moteur PvP n’est pas encore construit.";
    if(host)host.innerHTML='<button type="button" class="gensFamilyGameCard disabled"><span>⚔️</span><b>PVP — À VENIR</b><small>Cette section est réservée au futur mode d’affrontement entre joueurs.</small></button>';
  }
  window.scrollTo(0,0);
}
function gensFamilyForProfileId(profileId){
  const p=loadGameProfiles().find(x=>String(x.id)===String(profileId||""));
  const f=gensContentFamilyForProfile(p);return f==="creature"?"capture":(f==="rpg"||f==="manga")?"adventure":"survival";
}
function renderGensGameHomeLight(profileId,family){
  const fam=family||gensFamilyForProfileId(profileId||activeGameProfileId());
  if(!gensSelectedFamily)gensSelectedFamily=fam;
  const title=document.getElementById("gensGameHomeTitle");
  if(title){const p=loadGameProfiles().find(x=>String(x.id)===String(profileId||activeGameProfileId()));title.textContent=fam==="capture"?(p?.name||"Monde Capture"):fam==="adventure"?(p?.name||"Univers RPG"):(p?.name||"Univers Survie");}
  const actions=document.getElementById("gensGameHomeActions"),pvp=document.getElementById("gensPvpPlaceholder");
  if(actions)actions.style.display="";
  if(pvp)pvp.style.display="none";
  const b=document.getElementById("resumeBtn"),h=document.getElementById("noSaveHint"),active=hasActiveSession();
  if(b){b.disabled=!active;b.style.opacity=active?"1":".4";}
  if(h)h.style.display=active?"none":"block";
}


