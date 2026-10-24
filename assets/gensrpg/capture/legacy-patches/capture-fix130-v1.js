
(function(){
/* Correctif structurel : on remplace les mauvais hooks des versions 128/129. */
window.gensCaptureStarterPool=function(){
  try{
    const p=loadSharedEntities().filter(x=>x?.category==="creature");
    const targets=new Set(p.map(x=>x.evolution?.targetId||x.evolutionTo).filter(Boolean).map(String));
    let a=p.filter(x=>x.starterAllowed===true);
    if(!a.length)a=p.filter(x=>x.starterCreature===true&&!targets.has(String(x.id))&&Number(x.level||1)<=10);
    if(!a.length)a=p.filter(x=>!targets.has(String(x.id))&&Number(x.level||1)<=6&&Number(x.captureRate||0)>=50);
    return a.slice(0,18);
  }catch(e){return[]}
};
window.gensToggleCaptureStarter=function(heroId,creatureId){
  heroId=String(heroId);creatureId=String(creatureId);
  const pool=gensCaptureStarterPool(),limit=Math.max(1,Math.min(3,Number(captureCreatureProgressRules?.().starterLimit)||1));
  const st=ensureHeroCreatureState(loadState(heroId));
  let ids=(st.creatureTeam||[]).map(x=>String(x.entityId||x.creatureId||"")).filter(id=>pool.some(c=>String(c.id)===id));
  const ix=ids.indexOf(creatureId);
  if(ix>=0)ids.splice(ix,1); else {if(ids.length>=limit){alert("Maximum "+limit+" créature"+(limit>1?"s":"")+" de départ.");return}ids.push(creatureId)}
  st.creatureTeam=ids.map(id=>(st.creatureTeam||[]).find(x=>String(x.entityId||x.creatureId||"")===id)||gensCreateStarterCreatureInstance(pool.find(x=>String(x.id)===id))).filter(Boolean);
  st.captureStarterChosen=st.creatureTeam.length>0;saveHeroCreatureState(heroId,st);renderParticipantSelector();
};

/* Vraie fenêtre graphique, distincte de la sélection. */
window.captureInfo130=function(instanceId){
 const b=window.gensCurrentCaptureBattle,h=gensCaptureBattleCreature(b,instanceId);if(!h)return;
 const c=h.creature,e=c.source||{},inst=e._instance||{},d=captureCreatureDerivedStats(inst,e),art=e.iconData||e.artData||e.image||"";
 const abs=captureBattleAbilities(c);
 let modal=document.getElementById("captureInfo130Modal");
 if(!modal){modal=document.createElement("div");modal.id="captureInfo130Modal";modal.className="modal";modal.innerHTML='<div class="modalCard cap130Card"><button class="cap130Close" onclick="captureCloseModal(\'captureInfo130Modal\')">✕</button><div id="captureInfo130Body"></div></div>';document.body.appendChild(modal)}
 document.getElementById("captureInfo130Body").innerHTML=`<div class="cap130Hero">${art?`<img src="${z40kEscAttr(art)}">`:`<div class="cap130NoArt">🐲</div>`}<div><h2>${z40kEscHtml(c.name)}</h2><b>Niveau ${c.level}</b><div>❤️ ${c.hp} / ${c.maxHp} PV</div></div></div>
 <div class="cap130Stats"><span>⚔️ <b>${d.force}</b><small>Puissance</small></span><span>🛡️ <b>${d.defense}</b><small>Défense</small></span><span>💨 <b>${d.agi}</b><small>Agilité</small></span><span>⚡ <b>${d.speed}</b><small>Vitesse</small></span><span>✨ <b>${d.spirit}</b><small>Esprit</small></span></div>
 <div class="cap130Affinity"><b>🧬 Type</b> ${(e.elementTypes||[]).map(z40kEscHtml).join(" · ")||"—"}<br><b>🛡️ Résiste</b> ${(e.elementResistances||[]).map(z40kEscHtml).join(" · ")||"—"}<br><b>💥 Faible</b> ${(e.elementWeaknesses||[]).map(z40kEscHtml).join(" · ")||"—"}</div>
 <h3>⚡ Compétences</h3><div class="cap130Moves">${abs.map(a=>`<button onclick="showAbilityInfo('${z40kEscAttr(a.id)}')"><b>${z40kEscHtml(a.name)}</b><span>Puissance ${Number(a.power)||0} · Niveau ${captureAbilityRequiredLevel(a)}</span><small>${z40kEscHtml(a.desc||"Toucher pour consulter les effets.")}</small></button>`).join("")}</div>`;
 captureOpenModal("captureInfo130Modal");
};

/* Sélection de cible indépendante de INFO. */
window.captureTarget130="";
window.captureSelectTarget130=function(id){const b=window.gensCurrentCaptureBattle,h=gensCaptureBattleCreature(b,id);if(!h||h.sideKey!=="B"||h.creature.ko)return;window.captureTarget130=id;captureRenderBattleLive(b)};
const targetOld=window.captureBattleSelectDefaultTarget;
window.captureBattleSelectDefaultTarget=function(b,k){if(k==="B"&&window.captureTarget130){const h=gensCaptureBattleCreature(b,window.captureTarget130);if(h&&h.sideKey==="B"&&!h.creature.ko)return h.creature}return targetOld(b,k)};

/* Rendu : chaque carte reçoit deux commandes explicites. */
const renderOld=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
 renderOld(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;
 host.querySelectorAll(".captureFightMon").forEach(card=>{
   card.onclick=null;const name=card.querySelector("strong")?.textContent||"";let f=null,k="";
   for(const z of ["A","B"]){f=(b.sides?.[z]?.creatures||[]).find(c=>c.name===name);if(f){k=z;break}}if(!f)return;
   let bar=card.querySelector(".cap130CardActions");if(!bar){bar=document.createElement("div");bar.className="cap130CardActions";card.appendChild(bar)}
   if(k==="B"){
     const selected=String(window.captureTarget130)===String(f.instanceId);card.classList.toggle("cap130Target",selected);
     bar.innerHTML=`<button onclick="event.stopPropagation();captureSelectTarget130('${z40kEscAttr(f.instanceId)}')">${selected?"🎯 CIBLÉ":"🎯 CIBLER"}</button><button onclick="event.stopPropagation();captureInfo130('${z40kEscAttr(f.instanceId)}')">ⓘ FICHE</button>`;
   }else{
     bar.innerHTML=`<button onclick="event.stopPropagation();captureInfo130('${z40kEscAttr(f.instanceId)}')">ⓘ FICHE</button>`;
   }
 });
 /* compétences : bouton INFO séparé de l'attaque */
 host.querySelectorAll(".captureMoveGrid button").forEach(btn=>{
   const id=(btn.getAttribute("onclick")||"").match(/captureBattleUseAbility\('([^']+)'/)?.[1];if(!id)return;
   btn.querySelectorAll(".info129").forEach(x=>x.remove());
   if(!btn.parentElement.querySelector(`[data-info130="${CSS.escape(id)}"]`)){
     const ib=document.createElement("button");ib.type="button";ib.className="cap130MoveInfo";ib.dataset.info130=id;ib.textContent="ⓘ";ib.title="Voir les effets";
     ib.onclick=e=>{e.preventDefault();e.stopPropagation();showAbilityInfo(id)};btn.after(ib);
   }
 });
};

/* Accès MJ AVANT partie : directement dans le vrai #pregameSetup. */
window.captureOpenPregameMj130=function(){
 let m=document.getElementById("capturePregameMj130");
 if(!m){m=document.createElement("div");m.id="capturePregameMj130";m.className="modal";m.innerHTML=`<div class="modalCard cap130Card"><button class="cap130Close" onclick="captureCloseModal('capturePregameMj130')">✕</button><h2>🎛️ Réglages MJ — Capture</h2><label>Créatures de départ max <input id="preStarter130" type="number" min="1" max="3"></label><label>Coût du soin <input id="preHeal130" type="number" min="0"></label><label>Soin par nouveau jour (%) <input id="preDayHeal130" type="number" min="0" max="100"></label><button class="startGameBtn" onclick="captureSavePregameMj130()">✓ ENREGISTRER</button></div>`;document.body.appendChild(m)}
 const r=captureCreatureProgressRules(),set=(id,v)=>document.getElementById(id).value=v;set("preStarter130",r.starterLimit??1);set("preHeal130",r.healCenterCost??10);set("preDayHeal130",r.dayHealPct??10);captureOpenModal("capturePregameMj130");
};
window.captureSavePregameMj130=function(){const r=captureCreatureProgressRules();r.starterLimit=Math.max(1,Math.min(3,Number(document.getElementById("preStarter130").value)||1));r.healCenterCost=Math.max(0,Number(document.getElementById("preHeal130").value)||0);r.dayHealPct=Math.max(0,Math.min(100,Number(document.getElementById("preDayHeal130").value)||0));GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),r);captureCloseModal("capturePregameMj130");renderParticipantSelector()};

function injectPregame130(){
 const pre=document.getElementById("pregameSetup");if(!pre)return;
 if(!document.getElementById("preMj130Btn")){const b=document.createElement("button");b.id="preMj130Btn";b.className="preMj130Btn";b.textContent="🎛️ RÉGLAGES MJ — CAPTURE";b.onclick=captureOpenPregameMj130;pre.prepend(b)}
}
const rpOld=window.renderParticipantSelector;
window.renderParticipantSelector=function(){const r=rpOld.apply(this,arguments);return r};

/* Retire le bloc Aventure Dungeon de la vraie phase de réglage Capture. */
function cleanupPregame130(){
 if(!gensCapturePregameMode())return;
 const pre=document.getElementById("pregameSetup");if(!pre)return;
 [...pre.querySelectorAll("*")].forEach(el=>{const t=(el.textContent||"").trim();if((/aventure/i.test(t)&&/dungeon|sélection|selection/i.test(t))||el.id==="dungeonAdventureSelect"){const block=el.closest(".panel,.setupSection,.card")||el;if(block!==pre)block.style.display="none"}});
 injectPregame130();
}
/* V16.131: nettoyage automatique désactivé — il masquait le vrai contenu de préparation. */

/* Le clic sur carte alliée ne déclenche PLUS aucun rappel/action. */
})();
