
(function(){
/* ===== V16.133 : corrections ciblées playtest ===== */

/* 1) Cartes hors combat : utilisent ENFIN les stats dérivées réellement investies. */
window.captureCreatureCardHtml=function(inst,where,index){
  const e=creatureEntityForInstance(inst);if(!e)return"";
  const d=captureCreatureDerivedStats(inst,e);
  const img=e.artData||e.iconData||e.image||"";
  const icon=img?`<img src="${z40kEscAttr(img)}">`:`<div class="capCardIcon133">${z40kEscHtml(e.icon||"🐲")}</div>`;
  const moveBtn=where==="team"
    ? `<button type="button" onclick="moveCreatureToReserve(${index});renderCaptureHeroSheet()">📦 Réserve</button>`
    : `<button type="button" onclick="moveCreatureToTeam('${z40kEscAttr(inst.uid)}');renderCaptureHeroSheet()">⬆️ Équipe</button>`;
  const lvl=Math.max(1,Number(inst.level||e.level)||1),xp=Math.max(0,Number(inst.xp)||0),next=captureXpToNextLevel(lvl);
  const hp=Math.max(0,Math.min(d.maxHp,Number(inst.hp??d.maxHp)));
  return `<div class="captureCreatureCard capCreatureCard133" data-creature-uid="${z40kEscAttr(inst.uid)}">
    ${icon}
    <button class="capUnitInfo133" type="button" onclick="event.stopPropagation();captureOpenCreatureDetail('${z40kEscAttr(inst.uid)}')" title="Voir la fiche">ⓘ</button>
    <strong>${z40kEscHtml(e.name)}</strong>
    <div class="small">Niveau ${lvl} · ❤️ ${hp}/${d.maxHp}</div>
    <div class="capMiniStats133"><span>⚔️ ${d.force}</span><span>🛡️ ${d.defense}</span><span>💨 ${d.agi}</span><span>⚡ ${d.speed}</span><span>✨ ${d.spirit}</span></div>
    <div class="captureXpLine">⭐ XP ${xp} / ${next}</div>
    <div class="v2LibActions"><button type="button" onclick="captureOpenAbilityManager133('${z40kEscAttr(inst.uid)}')">⚡ Compétences</button>${moveBtn}</div>
  </div>`;
};

/* 2) Gestion claire : 4 compétences actives + bouton REMPLACER. */
window.capReplaceSlot133=null;
window.capManagedUid133="";
window.captureOwnedInstance133=function(uid){
  const heroId=captureActiveHeroId()||current;if(!heroId)return null;
  const st=ensureHeroCreatureState(loadState(heroId));
  const all=[...(st.creatureTeam||[]),...(st.creatureReserve||[])];
  const inst=all.find(x=>String(x.uid)===String(uid));if(!inst)return null;
  return {heroId,st,inst,ent:creatureEntityForInstance(inst)};
};
window.captureOpenAbilityManager133=function(uid){
  const f=captureOwnedInstance133(uid);if(!f||!f.ent)return;
  capManagedUid133=uid;
  const pr=captureCreatureProgressRules(),max=Math.max(1,Number(pr.maxMoves)||4);
  f.inst.knownAbilityIds=Array.isArray(f.inst.knownAbilityIds)?f.inst.knownAbilityIds:[...(f.ent.abilityIds||[])];
  f.inst.activeAbilityIds=Array.isArray(f.inst.activeAbilityIds)?f.inst.activeAbilityIds:[...f.inst.knownAbilityIds].filter(id=>{
    const a=captureBattleAbilityById(id);return a&&captureAbilityRequiredLevel(a)<=Number(f.inst.level||1)
  }).slice(0,max);
  const available=captureCreatureAvailableMoves(f.inst,f.ent);
  const active=f.inst.activeAbilityIds.map(captureBattleAbilityById).filter(Boolean);

  let m=document.getElementById("capAbilityManager133");
  if(!m){
    m=document.createElement("div");m.id="capAbilityManager133";m.className="modal";
    m.innerHTML='<div class="modalCard capModal133"><button class="capClose133" onclick="captureCloseModal(\'capAbilityManager133\')">✕</button><div id="capAbilityManagerBody133"></div></div>';
    document.body.appendChild(m);
  }
  document.getElementById("capAbilityManagerBody133").innerHTML=`
    <h2>⚡ Compétences de ${z40kEscHtml(f.ent.name)}</h2>
    <p class="capHelp133">La créature peut utiliser <b>${max} compétences actives maximum</b>. Choisis « Remplacer » sur une capacité actuelle, puis la nouvelle capacité souhaitée.</p>
    <h3>Compétences actives</h3>
    <div class="capActiveMoves133">
      ${Array.from({length:max},(_,i)=>{
        const a=active[i];
        return a?`<div class="capMoveSlot133 ${capReplaceSlot133===i?"selected":""}">
          <b>${z40kEscHtml(a.name)}</b>
          <span>${z40kEscHtml(capturePlayerAbilityText132?.(a)||a.desc||"")}</span>
          <div><button onclick="showAbilityInfo('${z40kEscAttr(a.id)}')">ⓘ Effets</button><button onclick="captureChooseReplaceSlot133(${i})">🔁 Remplacer</button></div>
        </div>`:`<div class="capMoveSlot133 empty"><b>Emplacement libre</b><button onclick="captureChooseReplaceSlot133(${i})">➕ Choisir</button></div>`
      }).join("")}
    </div>
    <h3>Compétences disponibles</h3>
    <div class="capAvailableMoves133">
      ${available.map(a=>{
        const equipped=f.inst.activeAbilityIds.includes(a.id);
        return `<button class="${equipped?"equipped":""}" ${equipped?"disabled":""} onclick="captureEquipAbility133('${z40kEscAttr(a.id)}')">
          <b>${z40kEscHtml(a.name)}</b>
          <span>Puissance ${Number(a.power)||0} · Niveau requis ${captureAbilityRequiredLevel(a)}</span>
          <small>${z40kEscHtml(capturePlayerAbilityText132?.(a)||a.desc||"")}</small>
        </button>`;
      }).join("")||'<div class="empty">Aucune autre compétence disponible à ce niveau.</div>'}
    </div>`;
  captureOpenModal("capAbilityManager133");
};
window.captureChooseReplaceSlot133=function(i){capReplaceSlot133=i;captureOpenAbilityManager133(capManagedUid133)};
window.captureEquipAbility133=function(aid){
  const f=captureOwnedInstance133(capManagedUid133);if(!f)return;
  const pr=captureCreatureProgressRules(),max=Math.max(1,Number(pr.maxMoves)||4);
  f.inst.activeAbilityIds=Array.isArray(f.inst.activeAbilityIds)?f.inst.activeAbilityIds:[];
  f.inst.knownAbilityIds=Array.isArray(f.inst.knownAbilityIds)?f.inst.knownAbilityIds:[];
  if(!f.inst.knownAbilityIds.includes(aid))f.inst.knownAbilityIds.push(aid);
  if(capReplaceSlot133===null){
    if(f.inst.activeAbilityIds.length>=max){alert("Choisis d'abord la compétence à remplacer.");return}
    f.inst.activeAbilityIds.push(aid);
  }else{
    f.inst.activeAbilityIds[capReplaceSlot133]=aid;
  }
  capReplaceSlot133=null;saveHeroCreatureState(f.heroId,f.st);renderCaptureHeroSheet();captureOpenAbilityManager133(capManagedUid133);
};

/* 3) INFO combat : taille correcte et TOUJOURS dans la carte. */
const render133=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
  render133(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;

  host.querySelectorAll(".captureFightMon").forEach(card=>{
    card.style.position="relative";
    /* retire les anciens boutons info contradictoires */
    card.querySelectorAll(".capInfo132,.cap130CardActions,.capInfo133").forEach(x=>x.remove());

    const name=card.querySelector("strong")?.textContent||"";let c=null,side="";
    for(const k of ["A","B"]){c=(b.sides?.[k]?.creatures||[]).find(x=>x.name===name);if(c){side=k;break}}
    if(!c)return;

    const ib=document.createElement("button");
    ib.type="button";ib.className="capInfo133";ib.textContent="ⓘ";ib.title="Voir la fiche";
    ib.onclick=e=>{e.preventDefault();e.stopPropagation();captureOpenCreatureCard132(c.instanceId)};
    card.appendChild(ib);

    /* clic carte = sélection uniquement */
    if(side==="A"){
      card.onclick=()=>captureSelectAlly132(c.instanceId);
      card.classList.toggle("capSelected133",String(b._selectedPlayerCreature||"")===String(c.instanceId));
    }else{
      card.onclick=()=>{window.captureTarget130=c.instanceId;captureRenderBattleLive(b)};
      card.classList.toggle("capTarget133",String(window.captureTarget130||"")===String(c.instanceId));
    }
  });

  /* petits boutons info des capacités, sans prendre une case entière */
  host.querySelectorAll(".capAbilityInfo132,.cap130MoveInfo,.info129").forEach(x=>x.remove());
  host.querySelectorAll(".captureMoveGrid>button").forEach(btn=>{
    const id=(btn.getAttribute("onclick")||"").match(/captureBattleUseAbility\('([^']+)'/)?.[1];if(!id)return;
    if(btn.parentElement.querySelector(`.capAbilityInfo133[data-id="${CSS.escape(id)}"]`))return;
    const ib=document.createElement("button");ib.type="button";ib.className="capAbilityInfo133";ib.dataset.id=id;ib.textContent="ⓘ";
    ib.onclick=e=>{e.preventDefault();e.stopPropagation();showAbilityInfo(id)};btn.after(ib);
  });

  captureRenderTimeline133(b,host);
};

/* 4) Timeline initiative : affiche les prochains acteurs. */
window.captureRenderTimeline133=function(b,host){
  host.querySelector(".capTimeline133")?.remove();
  if(!b?.turnOrder?.length||b.phase==="ended")return;
  const seq=[],order=b.turnOrder,idx=Math.max(0,Number(b.turnIndex)||0);
  for(let i=0;i<Math.min(8,Math.max(5,order.length*2));i++){
    const pos=(idx+i)%order.length,t=order[pos],h=gensCaptureBattleCreature(b,t.instanceId);
    if(!h||h.creature.ko)continue;
    seq.push({side:t.sideKey,name:h.creature.name,current:i===0,roundOffset:Math.floor((idx+i)/order.length)});
  }
  const box=document.createElement("div");box.className="capTimeline133";
  box.innerHTML=`<div class="capTimelineTitle133">⏱️ Ordre des prochains tours</div><div class="capTimelineTrack133">${
    seq.map((x,i)=>`<div class="capTimelineUnit133 ${x.side==="A"?"ally":"enemy"} ${x.current?"current":""}">
      <span>${x.side==="A"?"🔵":"🔴"}</span><b>${z40kEscHtml(x.name)}</b><small>${x.current?"MAINTENANT":x.roundOffset>0?"Tour suivant":"+"+i}</small>
    </div>`).join("")
  }</div>`;
  const top=host.querySelector(".captureBattleTop");if(top)top.after(box);else host.prepend(box);
};

/* 5) La fiche hors combat n'affiche plus l'ancien mini-arbre de bonus de stats comme s'il était pertinent. */
const detail133=window.captureOpenCreatureDetail;
window.captureOpenCreatureDetail=function(uid){
  detail133(uid);
  setTimeout(()=>{
    const body=document.getElementById("captureCreatureDetailBody");if(!body)return;
    const talentHeading=[...body.querySelectorAll("h3")].find(h=>/Mini-arbre de talents/i.test(h.textContent||""));
    if(talentHeading){
      const block=talentHeading.nextElementSibling;
      talentHeading.innerHTML='🌿 Talents spéciaux';
      if(block){
        block.innerHTML=`<div class="capTalentNotice133"><b>Talents distincts des statistiques</b><span>Les points de caractéristiques servent aux valeurs brutes. Les talents seront réservés à des effets uniques : modifier une compétence, survivre à un K.O., améliorer une altération, gagner un bonus conditionnel, etc.</span></div>`;
      }
    }
    /* ajoute bouton compétences à la vraie fiche */
    if(!body.querySelector(".capManageFromSheet133")){
      const b=document.createElement("button");b.className="capManageFromSheet133 startGameBtn";b.textContent="⚡ GÉRER LES COMPÉTENCES";b.onclick=()=>captureOpenAbilityManager133(uid);body.prepend(b);
    }
  },0);
};
})();
