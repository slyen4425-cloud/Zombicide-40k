
(function(){
/* =========================================================
   V16.134 — consolidation interface / rafraîchissement
   ========================================================= */

/* ---------- refresh centralisé ---------- */
window.captureRefreshAll134=function(){
  const run=()=>{
    try{if(typeof renderCaptureHeroSheet==="function")renderCaptureHeroSheet()}catch(e){}
    try{if(typeof renderCaptureWorldHub==="function")renderCaptureWorldHub()}catch(e){}
    try{if(typeof renderParticipantSelector==="function"&&typeof gensCapturePregameMode==="function"&&gensCapturePregameMode())renderParticipantSelector()}catch(e){}
    try{if(window.gensCurrentCaptureBattle&&typeof captureRenderBattleLive==="function")captureRenderBattleLive(window.gensCurrentCaptureBattle)}catch(e){}
  };
  cancelAnimationFrame(window._capRefresh134||0);
  window._capRefresh134=requestAnimationFrame(run);
};

/* ---------- réglages MJ avant partie : visible + difficulté dresseur ---------- */
window.captureTrainerDifficultyKey134=function(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_trainer_difficulty_v1_"+id;
};
window.captureTrainerDifficulty134=function(){
  try{return Math.max(1,Math.min(4,Number(localStorage.getItem(captureTrainerDifficultyKey134()))||2))}catch(e){return 2}
};
window.captureSavePregameMj134=function(){
  const old=document.getElementById("preStarter130"),heal=document.getElementById("preHeal130"),day=document.getElementById("preDayHeal130");
  const r=captureCreatureProgressRules();
  if(old)r.starterLimit=Math.max(1,Math.min(3,Number(old.value)||1));
  if(heal)r.healCenterCost=Math.max(0,Number(heal.value)||0);
  if(day)r.dayHealPct=Math.max(0,Math.min(100,Number(day.value)||0));
  GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),r);
  const d=document.getElementById("capTrainerDifficulty134");
  if(d)localStorage.setItem(captureTrainerDifficultyKey134(),String(Math.max(1,Math.min(4,Number(d.value)||2))));
  captureCloseModal("capturePregameMj130");
  captureRefreshAll134();
};
const oldOpenPregameMj134=window.captureOpenPregameMj130;
window.captureOpenPregameMj130=function(){
  oldOpenPregameMj134();
  setTimeout(()=>{
    const body=document.querySelector("#capturePregameMj130 .modalCard");
    if(!body)return;
    if(!document.getElementById("capTrainerDifficulty134")){
      const lab=document.createElement("label");
      lab.innerHTML=`Difficulté des prochains dresseurs
        <select id="capTrainerDifficulty134">
          <option value="1">Facile — env. 3 niveaux sous l'équipe</option>
          <option value="2">Équilibré — proche de l'équipe</option>
          <option value="3">Difficile — env. +3 niveaux</option>
          <option value="4">Expert — env. +6 niveaux</option>
        </select>`;
      const save=body.querySelector(".startGameBtn");
      if(save)body.insertBefore(lab,save);else body.appendChild(lab);
    }
    document.getElementById("capTrainerDifficulty134").value=String(captureTrainerDifficulty134());
    const save=body.querySelector(".startGameBtn");
    if(save)save.setAttribute("onclick","captureSavePregameMj134()");
  },0);
};

/* bouton MJ nettement visible dans le vrai pregame */
function capPregameButton134(){
  const pre=document.getElementById("pregameSetup");if(!pre||!gensCapturePregameMode())return;
  let b=document.getElementById("capturePregameMjBig134");
  if(!b){
    b=document.createElement("button");b.id="capturePregameMjBig134";b.type="button";
    b.innerHTML='<span>🎛️</span><b>RÉGLAGES MJ — CAPTURE</b><small>Starters · soins · difficulté des dresseurs · progression</small>';
    b.onclick=()=>captureOpenPregameMj130();
    pre.prepend(b);
  }
  document.getElementById("capturePregameTools131")?.remove();
}
const rp134=window.renderParticipantSelector;
window.renderParticipantSelector=function(){const r=rp134.apply(this,arguments);try{capPregameButton134()}catch(e){}return r};
setTimeout(capPregameButton134,120);

/* ---------- dresseur hostile : aucun choix de difficulté côté joueur ---------- */
window.captureOpenTrainerBattle=function(){
  const playerRoster=captureTeamEntityRoster(),pool=loadSharedEntities().filter(x=>x.category==="creature");
  if(!playerRoster.length){alert("Aucune créature disponible dans ton équipe.");return}
  if(!playerRoster.some(c=>Number(c._instance?.hp??c.hp??0)>0)){alert("Toutes tes créatures sont K.O.");return}
  if(!pool.length){alert("Aucune créature disponible pour créer le dresseur adverse.");return}
  const diff=captureTrainerDifficulty134(),delta=[-3,0,3,6][diff-1];
  const avg=Math.max(1,Math.round(playerRoster.reduce((n,c)=>n+(Number(c.level)||1),0)/playerRoster.length));
  const auto=captureAutoTrainerRules(playerRoster),enemy=[];
  for(let i=0;i<auto.teamSize;i++){
    const base=pool[Math.floor(Math.random()*pool.length)],lvl=Math.max(1,avg+delta+Math.floor(Math.random()*3)-1);
    enemy.push({...base,level:lvl,hp:Math.max(1,Number(base.hp)||10)+Math.max(0,lvl-(Number(base.level)||1))*2});
  }
  const names=["Dresseur novice","Dresseur rival","Dresseur confirmé","Dresseur expert"];
  captureStartBattleAutomatic(
    {name:CHARS[captureActiveHeroId()]?.name||"Dresseur",roster:playerRoster,controller:"human"},
    {name:names[diff-1],roster:enemy,controller:"auto"},
    {type:"trainer",captureAllowed:false,activeSlots:auto.activeSlots,teamSize:auto.teamSize,minBattleTeam:1,maxBattleTeam:6,recallCost:"turn",controller:"auto"}
  );
};

/* ---------- fiche créature : vrai overlay au-dessus de tout ---------- */
window.captureOpenCreatureOverlay134=function(instanceId){
  const b=window.gensCurrentCaptureBattle,h=gensCaptureBattleCreature(b,instanceId);if(!h)return;
  const c=h.creature,e=c.source||{},inst=e._instance||{},d=captureCreatureDerivedStats(inst,e),art=e.iconData||e.artData||e.image||"";
  const abilities=captureBattleAbilities(c);
  let m=document.getElementById("capOverlay134");
  if(!m){
    m=document.createElement("div");m.id="capOverlay134";m.className="capOverlay134";
    m.innerHTML='<div class="capOverlayCard134"><button class="capOverlayClose134">✕</button><div id="capOverlayBody134"></div></div>';
    document.body.appendChild(m);
    m.querySelector(".capOverlayClose134").onclick=()=>m.classList.remove("open");
    m.onclick=e=>{if(e.target===m)m.classList.remove("open")};
  }
  document.getElementById("capOverlayBody134").innerHTML=`
    <div class="capOverlayHero134">${art?`<img src="${z40kEscAttr(art)}">`:`<div class="capOverlayNoArt134">🐲</div>`}
      <div><h2>${z40kEscHtml(c.name)}</h2><div>Niveau <b>${c.level}</b></div><div class="capOverlayHp134">❤️ ${c.hp} / ${c.maxHp} PV</div></div>
    </div>
    <div class="capOverlayStats134">
      <span><b>${d.force}</b><small>Puissance</small></span><span><b>${d.defense}</b><small>Défense</small></span>
      <span><b>${d.agi}</b><small>Agilité</small></span><span><b>${d.speed}</b><small>Vitesse</small></span><span><b>${d.spirit}</b><small>Esprit</small></span>
    </div>
    <div class="capOverlayAff134"><b>Type :</b> ${(e.elementTypes||[]).map(z40kEscHtml).join(" · ")||"—"}<br>
      <b>Résistances :</b> ${(e.elementResistances||[]).map(z40kEscHtml).join(" · ")||"—"}<br>
      <b>Faiblesses :</b> ${(e.elementWeaknesses||[]).map(z40kEscHtml).join(" · ")||"—"}</div>
    <h3>⚡ Compétences</h3>
    <div class="capOverlayMoves134">${abilities.map(a=>`<button onclick="showAbilityInfo('${z40kEscAttr(a.id)}')"><b>${z40kEscHtml(a.name)}</b><span>${z40kEscHtml(capturePlayerAbilityText132?.(a)||a.desc||"")}</span><small>Puissance ${Number(a.power)||0} · Niveau requis ${captureAbilityRequiredLevel(a)}</small></button>`).join("")}</div>`;
  m.classList.add("open");
};

/* ---------- stats : boutons toujours présents et rafraîchissement instantané ---------- */
const spend134=window.captureSpendCreatureStat;
window.captureSpendCreatureStat=function(uid,stat){
  const r=spend134(uid,stat);
  captureRefreshAll134();
  setTimeout(()=>{try{captureOpenCreatureDetail(uid)}catch(e){}},0);
  return r;
};

/* fiche hors combat : regroupe Stats / Compétences et supprime le learnset au mauvais endroit */
const detail134=window.captureOpenCreatureDetail;
window.captureOpenCreatureDetail=function(uid){
  detail134(uid);
  setTimeout(()=>{
    const body=document.getElementById("captureCreatureDetailBody");if(!body)return;
    /* retire "capacités disponibles" de la section stats */
    [...body.querySelectorAll("details")].forEach(d=>{if(/Capacités disponibles/i.test(d.textContent||""))d.remove()});
    [...body.querySelectorAll(".hint")].forEach(h=>{if(/Courbe de puissance|compétence devient disponible/i.test(h.textContent||""))h.remove()});

    /* bouton compétences sous forme d'un vrai encadré */
    body.querySelectorAll(".capManageFromSheet133").forEach(x=>x.remove());
    let block=body.querySelector(".capAbilityBox134");
    if(!block){
      block=document.createElement("div");block.className="capAbilityBox134";
      block.innerHTML=`<div><span>⚡</span><div><b>Compétences</b><small>Voir les capacités équipées, apprendre et remplacer.</small></div></div>
        <button onclick="captureOpenAbilityManager133('${z40kEscAttr(uid)}')">GÉRER LES COMPÉTENCES →</button>`;
      const stats=body.querySelector(".captureStatGrid");
      if(stats)stats.insertAdjacentElement("afterend",block);else body.prepend(block);
    }
    /* on garantit que la zone d'attribution des stats est bien visible */
    const statHeading=[...body.querySelectorAll("h3")].find(h=>/Points de caractéristiques/i.test(h.textContent||""));
    if(statHeading){statHeading.style.display="block";statHeading.nextElementSibling&&(statHeading.nextElementSibling.style.display="grid")}
  },0);
};

/* ---------- manager compétences : les compétences équipées sont préremplies + apprenables ici ---------- */
const mgr134=window.captureOpenAbilityManager133;
window.captureOpenAbilityManager133=function(uid){
  const f=captureOwnedInstance133(uid);if(!f||!f.ent)return;
  const pr=captureCreatureProgressRules(),max=Math.max(1,Number(pr.maxMoves)||4);
  f.inst.knownAbilityIds=Array.isArray(f.inst.knownAbilityIds)&&f.inst.knownAbilityIds.length
    ?f.inst.knownAbilityIds:[...(f.ent.abilityIds||[])];
  if(!Array.isArray(f.inst.activeAbilityIds)||!f.inst.activeAbilityIds.length){
    f.inst.activeAbilityIds=[...f.inst.knownAbilityIds].map(captureBattleAbilityById).filter(a=>a&&captureAbilityRequiredLevel(a)<=Number(f.inst.level||1)).slice(0,max).map(a=>a.id);
    saveHeroCreatureState(f.heroId,f.st);
  }
  mgr134(uid);
  setTimeout(()=>{
    const box=document.getElementById("capAbilityManagerBody133");if(!box)return;
    const h=[...box.querySelectorAll("h3")].find(x=>/Compétences disponibles/i.test(x.textContent||""));
    if(h)h.textContent="Compétences apprises / disponibles";
  },0);
};

/* ---------- timeline : Dresseur/Héros + créature, moins ambigu ---------- */
window.captureRenderTimeline133=function(b,host){
  host.querySelector(".capTimeline133")?.remove();
  if(!b?.turnOrder?.length||b.phase==="ended")return;
  const seq=[],order=b.turnOrder,idx=Math.max(0,Number(b.turnIndex)||0),type=b.config?.type||b.type||"";
  for(let i=0;i<Math.min(8,Math.max(5,order.length*2));i++){
    const pos=(idx+i)%order.length,t=order[pos],h=gensCaptureBattleCreature(b,t.instanceId);if(!h||h.creature.ko)continue;
    const sideName=b.sides?.[t.sideKey]?.name||(t.sideKey==="A"?"Joueur":"Adversaire");
    let owner=t.sideKey==="A"?sideName:(type==="wild"?"Sauvage":sideName);
    seq.push({side:t.sideKey,owner,creature:h.creature.name,current:i===0,roundOffset:Math.floor((idx+i)/order.length)});
  }
  const box=document.createElement("div");box.className="capTimeline133";
  box.innerHTML=`<div class="capTimelineTitle133">⏱️ Ordre des prochains tours</div><div class="capTimelineTrack133">${
    seq.map((x,i)=>`<div class="capTimelineUnit133 ${x.side==="A"?"ally":"enemy"} ${x.current?"current":""}">
      <span>${x.side==="A"?"🔵":"🔴"}</span><b>${z40kEscHtml(x.owner)}</b><em>${z40kEscHtml(x.creature)}</em><small>${x.current?"MAINTENANT":x.roundOffset>0?"Tour suivant":"+"+i}</small>
    </div>`).join("")
  }</div>`;
  const top=host.querySelector(".captureBattleTop");if(top)top.after(box);else host.prepend(box);
};

/* ---------- rendu combat : info fiable, overlay au-dessus, timeline ---------- */
const render134=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
  render134(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;
  host.querySelectorAll(".captureFightMon").forEach(card=>{
    const name=card.querySelector("strong")?.textContent||"";let c=null,side="";
    for(const k of ["A","B"]){c=(b.sides?.[k]?.creatures||[]).find(x=>x.name===name);if(c){side=k;break}}if(!c)return;
    card.querySelectorAll(".capInfo133,.capInfo132,.capUnitInfo133").forEach(x=>x.remove());
    const ib=document.createElement("button");ib.className="capInfo134";ib.type="button";ib.textContent="ⓘ";ib.title="Fiche de la créature";
    ib.onclick=e=>{e.preventDefault();e.stopPropagation();captureOpenCreatureOverlay134(c.instanceId)};card.appendChild(ib);
  });
  captureRenderTimeline133(b,host);
};

/* mutation d'état fréquente => rafraîchissement immédiat */
["saveHeroCreatureState"].forEach(name=>{
  const old=window[name];if(typeof old!=="function")return;
  window[name]=function(){const r=old.apply(this,arguments);requestAnimationFrame(()=>{try{if(typeof renderCaptureHeroSheet==="function")renderCaptureHeroSheet()}catch(e){}});return r};
});
})();
