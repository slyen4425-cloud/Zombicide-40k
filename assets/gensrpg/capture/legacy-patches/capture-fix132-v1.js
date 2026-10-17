
(function(){
/* ---------- descriptions joueur ---------- */
window.capturePlayerAbilityText132=function(a){
 const effects=Array.isArray(a?.effects)?a.effects:[];
 const parts=[];
 effects.forEach(e=>{
   const k=String(e.kind||"").toLowerCase(),v=Math.abs(Number(e.value??e.base)||0),dur=Math.max(1,Number(e.duration)||1);
   if(k==="damage") parts.push(`Inflige ${Number(e.base??a.power)||Number(a.power)||1} points de dégâts.`);
   else if(k==="heal") parts.push(`Rend ${Number(e.base??e.value)||1} PV.`);
   else if(k==="buff"){
     const stat=String(e.stat||"caractéristique").replace("defense","Défense").replace("speed","Vitesse").replace("agility","Agilité").replace("power","Puissance");
     parts.push(`Augmente ${stat} de ${v}${v<=10?" points":" %"} pendant ${dur} tour${dur>1?"s":""}.`);
   } else if(k==="debuff"){
     const stat=String(e.stat||"caractéristique").replace("defense","Défense").replace("speed","Vitesse").replace("agility","Agilité").replace("power","Puissance");
     parts.push(`Réduit ${stat} de ${v}${v<=10?" points":" %"} pendant ${dur} tour${dur>1?"s":""}.`);
   } else if(k==="dot") parts.push(`Inflige ${v||1} dégâts supplémentaires pendant ${dur} tour${dur>1?"s":""}.`);
   else if(k==="hot") parts.push(`Rend ${v||1} PV par tour pendant ${dur} tour${dur>1?"s":""}.`);
 });
 return parts.join(" ")||String(a?.desc||"Aucun effet supplémentaire.");
};

/* ---------- buff/debuff purs vraiment utiles ---------- */
const apply132=window.captureBattleApplyAbility;
window.captureBattleApplyAbility=function(b,actor,a,target){
 if(a&&Array.isArray(a.effects)&&a.effects.length&&!a.effects.some(e=>String(e.kind||"").toLowerCase()==="damage")){
   a={...a,effects:a.effects.map(e=>{
     const k=String(e.kind||"").toLowerCase();
     if(k==="buff"||k==="debuff"){
       let v=Number(e.value)||0;
       if(Math.abs(v)<20)v=(v<0?-1:1)*Math.max(30,Math.abs(v)*10);
       return {...e,value:v,duration:Math.max(2,Number(e.duration)||3)};
     }
     return e;
   })};
 }
 return apply132(b,actor,a,target);
};

/* ---------- sélection d'une créature = sélection, jamais action ---------- */
window.captureSelectAlly132=function(id){
 const b=window.gensCurrentCaptureBattle;if(!b||b.phase==="ended")return;
 const h=gensCaptureBattleCreature(b,id);if(!h||h.sideKey!=="A"||h.creature.ko)return;
 b.sides.A.selectedActive=id;
 b._selectedPlayerCreature=id;
 captureRenderBattleLive(b);
};
const actor132=window.captureBattleCurrentActor;
window.captureBattleCurrentActor=function(b){
 const r=actor132(b);
 if(r?.sideKey==="A"&&b?._selectedPlayerCreature){
   const h=gensCaptureBattleCreature(b,b._selectedPlayerCreature);
   if(h&&!h.creature.ko)return h;
 }
 return r;
};

/* ---------- vraie fiche graphique réutilisable ---------- */
window.captureOpenCreatureCard132=function(id){
 const b=window.gensCurrentCaptureBattle,h=gensCaptureBattleCreature(b,id);if(!h)return;
 const c=h.creature,e=c.source||{},inst=e._instance||{},d=captureCreatureDerivedStats(inst,e),art=e.iconData||e.artData||e.image||"";
 let m=document.getElementById("capCard132");
 if(!m){m=document.createElement("div");m.id="capCard132";m.className="modal";m.innerHTML='<div class="modalCard capCard132"><button class="capClose132" onclick="captureCloseModal(\'capCard132\')">✕</button><div id="capCardBody132"></div></div>';document.body.appendChild(m)}
 const abilities=captureBattleAbilities(c);
 document.getElementById("capCardBody132").innerHTML=`<div class="capHero132">${art?`<img src="${z40kEscAttr(art)}">`:`<div class="capNoArt132">🐲</div>`}<div><h2>${z40kEscHtml(c.name)}</h2><b>Niveau ${c.level}</b><div class="capHp132">❤️ ${c.hp} / ${c.maxHp} PV</div></div></div>
 <div class="capStats132"><span><b>${d.force}</b><small>Puissance</small></span><span><b>${d.defense}</b><small>Défense</small></span><span><b>${d.agi}</b><small>Agilité</small></span><span><b>${d.speed}</b><small>Vitesse</small></span><span><b>${d.spirit}</b><small>Esprit</small></span></div>
 <div class="capAff132"><b>Type :</b> ${(e.elementTypes||[]).map(z40kEscHtml).join(" · ")||"—"}<br><b>Résistances :</b> ${(e.elementResistances||[]).map(z40kEscHtml).join(" · ")||"—"}<br><b>Faiblesses :</b> ${(e.elementWeaknesses||[]).map(z40kEscHtml).join(" · ")||"—"}</div>
 <h3>Compétences</h3><div class="capMoves132">${abilities.map(a=>`<div><b>${z40kEscHtml(a.name)}</b><span>${z40kEscHtml(capturePlayerAbilityText132(a))}</span><button onclick="showAbilityInfo('${z40kEscAttr(a.id)}')">ⓘ Détails</button></div>`).join("")}</div>`;
 captureOpenModal("capCard132");
};

/* ---------- compétences : info minuscule et indépendante ---------- */
const render132=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
 render132(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;

 host.querySelectorAll(".captureFightMon").forEach(card=>{
   card.onclick=null;
   const name=card.querySelector("strong")?.textContent||"";let c=null,side="";
   for(const k of ["A","B"]){c=(b.sides?.[k]?.creatures||[]).find(x=>x.name===name);if(c){side=k;break}}
   if(!c)return;
   card.querySelectorAll(".cap130CardActions").forEach(x=>x.remove());
   let info=card.querySelector(".capInfo132");
   if(!info){info=document.createElement("button");info.className="capInfo132";info.textContent="ⓘ";info.title="Voir la fiche";card.appendChild(info)}
   info.onclick=e=>{e.stopPropagation();captureOpenCreatureCard132(c.instanceId)};
   if(side==="A"){
     card.onclick=()=>captureSelectAlly132(c.instanceId);
     card.classList.toggle("capSelected132",String(b._selectedPlayerCreature||"")===String(c.instanceId));
   }else{
     card.onclick=()=>{window.captureTarget130=c.instanceId;captureRenderBattleLive(b)};
     card.classList.toggle("capTarget132",String(window.captureTarget130||"")===String(c.instanceId));
   }
 });

 host.querySelectorAll(".captureMoveGrid button").forEach(btn=>{
   if(btn.classList.contains("cap130MoveInfo"))btn.remove();
 });
 host.querySelectorAll(".captureMoveGrid button").forEach(btn=>{
   const id=(btn.getAttribute("onclick")||"").match(/captureBattleUseAbility\('([^']+)'/)?.[1];if(!id)return;
   let wrap=btn.parentElement;
   if(wrap?.querySelector(`.capAbilityInfo132[data-id="${CSS.escape(id)}"]`))return;
   const ib=document.createElement("button");ib.type="button";ib.className="capAbilityInfo132";ib.dataset.id=id;ib.textContent="ⓘ";ib.title="Consulter l'effet";
   ib.onclick=e=>{e.preventDefault();e.stopPropagation();showAbilityInfo(id)};
   btn.insertAdjacentElement("afterend",ib);
 });
};

/* ---------- gestion explicite des compétences équipées ---------- */
window.captureManageAbilities132=function(instanceUid){
 const heroId=captureActiveHeroId(),st=ensureHeroCreatureState(loadState(heroId));
 const inst=[...(st.creatureTeam||[]),...(st.creatureReserve||[])].find(x=>String(x.uid)===String(instanceUid));if(!inst)return;
 const ent=creatureEntityForInstance(inst);if(!ent)return;
 const learned=[...(inst.learnedAbilityIds||ent.abilityIds||[])];
 const equipped=[...(inst.abilityIds||learned.slice(0,4))];
 const lib=loadSharedAbilities().filter(a=>gensAbilityLibraryId(a)==="creature" && captureAbilityRequiredLevel(a)<=Number(inst.level||1));
 let m=document.getElementById("capAbilities132");if(!m){m=document.createElement("div");m.id="capAbilities132";m.className="modal";m.innerHTML='<div class="modalCard capCard132"><button class="capClose132" onclick="captureCloseModal(\'capAbilities132\')">✕</button><h2>⚡ Compétences équipées</h2><div id="capAbilitiesBody132"></div></div>';document.body.appendChild(m)}
 document.getElementById("capAbilitiesBody132").innerHTML=`<p>Choisis jusqu'à 4 compétences. Toucher une compétence l'équipe ou la retire.</p><div class="capManage132">${lib.map(a=>{const on=equipped.includes(a.id);return `<button class="${on?"on":""}" onclick="captureToggleAbility132('${z40kEscAttr(instanceUid)}','${z40kEscAttr(a.id)}')"><b>${z40kEscHtml(a.name)}</b><span>${z40kEscHtml(capturePlayerAbilityText132(a))}</span><small>${on?"✓ Équipée":"Disponible"}</small></button>`}).join("")}</div>`;
 captureOpenModal("capAbilities132");
};
window.captureToggleAbility132=function(uid,aid){
 const heroId=captureActiveHeroId(),st=ensureHeroCreatureState(loadState(heroId)),inst=[...(st.creatureTeam||[]),...(st.creatureReserve||[])].find(x=>String(x.uid)===String(uid));if(!inst)return;
 let ids=[...(inst.abilityIds||[])];const i=ids.indexOf(aid);
 if(i>=0)ids.splice(i,1);else{if(ids.length>=4){alert("4 compétences maximum. Retire d'abord une compétence.");return}ids.push(aid)}
 inst.abilityIds=ids;saveHeroCreatureState(heroId,st);captureManageAbilities132(uid);
};

/* Ajoute gestion compétences sur les cartes équipe quand elles sont rendues. */
const teamOld=window.renderCaptureTeamPanel;
if(typeof teamOld==="function")window.renderCaptureTeamPanel=function(){
 const r=teamOld.apply(this,arguments);
 const heroId=captureActiveHeroId(),st=heroId?ensureHeroCreatureState(loadState(heroId)):null;
 document.querySelectorAll("[data-creature-uid]").forEach(card=>{
   const uid=card.dataset.creatureUid;if(!uid||card.querySelector(".capManageBtn132"))return;
   const b=document.createElement("button");b.className="capManageBtn132";b.textContent="⚡ Compétences";b.onclick=e=>{e.stopPropagation();captureManageAbilities132(uid)};card.appendChild(b);
 });
 return r;
};

/* Talents : retire les bonus bruts inutiles du texte joueur et explique le rôle. */
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll(".captureTalentTree").forEach(tree=>{
   if(!tree.querySelector(".talentRole132"))tree.insertAdjacentHTML("afterbegin",'<div class="talentRole132"><b>🌿 Talents</b><span>Les talents changent la manière de jouer de la créature : effets spéciaux, améliorations de compétences et capacités uniques. Les caractéristiques brutes se développent séparément.</span></div>');
 });
});
})();
