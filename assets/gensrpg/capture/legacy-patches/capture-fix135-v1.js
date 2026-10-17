
(function(){
/* ===== V16.135 : ciblage allié, journal détaillé, stats UX, buffs, reset jour ===== */

/* 1) Cibler une créature alliée en combat.
   On garde la sélection active séparée du ciblage d'objet/soin. */
window.captureAllyTarget135="";
window.captureSelectAllyTarget135=function(id){
  const b=window.gensCurrentCaptureBattle,h=gensCaptureBattleCreature(b,id);
  if(!h||h.sideKey!=="A"||h.creature.ko)return;
  window.captureAllyTarget135=id;
  b._selectedPlayerCreature=id;
  captureRenderBattleLive(b);
};

/* Le choix de cible pour les capacités alliées utilise la créature cliquée. */
const target135=window.captureBattleSelectDefaultTarget;
window.captureBattleSelectDefaultTarget=function(b,sideKey){
  if(sideKey==="B"&&window.captureTarget130){
    const h=gensCaptureBattleCreature(b,window.captureTarget130);
    if(h&&h.sideKey==="B"&&!h.creature.ko)return h.creature;
  }
  if(sideKey==="A"&&window.captureAllyTarget135){
    const h=gensCaptureBattleCreature(b,window.captureAllyTarget135);
    if(h&&h.sideKey==="A"&&!h.creature.ko)return h.creature;
  }
  return target135(b,sideKey);
};

/* 2) Journal beaucoup plus détaillé */
const apply135=window.captureBattleApplyAbility;
window.captureBattleApplyAbility=function(battle,actor,ability,target){
  const beforeHp=Number(target?.hp)||0;
  const r=apply135(battle,actor,ability,target);
  if(!r?.ok)return r;

  const fx=battle.lastFx||{};
  let reason="";
  const lastMsg=(battle.log||[]).slice(-1)[0]?.text||"";
  if(r.damage===0 && /ESQUIVE/i.test(lastMsg)) reason="La cible a esquivé l'attaque.";
  else if(r.damage===0 && beforeHp>0) reason="Aucun dégât n'a été infligé.";
  else {
    const elem=String(ability?.element||"");
    const em=elem?captureElementDamageMultiplier(target,elem):{mult:1,label:""};
    if(em.label)reason+=em.label+". ";
    if(r.crit)reason+="Coup critique. ";
    if(target.defended)reason+="La cible se défendait. ";
  }
  battle.log.push({
    round:battle.round,
    type:"detail",
    text:`${actor.name} → ${target.name} avec ${ability.name} : ${r.damage||0} dégât${r.damage===1?"":"s"}${r.heal?`, +${r.heal} PV`:""}${reason?" · "+reason.trim():""}`
  });
  return r;
};

/* 3) En combat, clic allié = cible/sélection, clic ennemi = cible */
const render135=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
  render135(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;
  host.querySelectorAll(".captureFightMon").forEach(card=>{
    const name=card.querySelector("strong")?.textContent||"";let c=null,side="";
    for(const k of ["A","B"]){c=(b.sides?.[k]?.creatures||[]).find(x=>x.name===name);if(c){side=k;break}}
    if(!c)return;
    if(side==="A"){
      card.onclick=()=>captureSelectAllyTarget135(c.instanceId);
      card.classList.toggle("capAllyTarget135",String(window.captureAllyTarget135)===String(c.instanceId));
    }else{
      card.onclick=()=>{window.captureTarget130=c.instanceId;captureRenderBattleLive(b)};
    }
  });
};

/* 4) Retire le bouton "Gérer les compétences" de la fiche Stats.
   Il reste seulement sur la carte du monstre / onglet Compétences. */
const detail135=window.captureOpenCreatureDetail;
window.captureOpenCreatureDetail=function(uid){
  detail135(uid);
  setTimeout(()=>{
    const body=document.getElementById("captureCreatureDetailBody");if(!body)return;
    body.querySelectorAll(".capAbilityBox134,.capManageFromSheet133").forEach(x=>x.remove());

    /* transforme l'attribution des stats en gros encadré */
    const heading=[...body.querySelectorAll("h3")].find(h=>/Points de caractéristiques/i.test(h.textContent||""));
    const grid=heading?.nextElementSibling;
    if(heading&&grid){
      let box=body.querySelector(".capStatBox135");
      if(!box){
        box=document.createElement("div");box.className="capStatBox135";
        box.innerHTML=`<div class="capStatBoxHead135"><span>📊</span><div><b>Attribuer les caractéristiques</b><small>Répartis les points disponibles dans les statistiques actives.</small></div></div>`;
        heading.parentNode.insertBefore(box,heading);
        box.appendChild(heading);box.appendChild(grid);
      }
      heading.textContent="Points disponibles : "+(captureOwnedInstance133(uid)?.inst?.statPoints||0);
    }
  },0);
};

/* 5) Buff / debuff : valeur réelle minimale significative.
   On traite aussi les anciens effets +1/+2/+3 et les descriptions. */
const oldPlayerText135=window.capturePlayerAbilityText132;
window.capturePlayerAbilityText132=function(a){
  if(a&&Array.isArray(a.effects)){
    a={...a,effects:a.effects.map(e=>{
      const k=String(e.kind||"").toLowerCase();
      if(k==="buff"||k==="debuff"){
        let v=Number(e.value)||0;
        if(Math.abs(v)<20)v=(v<0?-1:1)*(Math.abs(v)<=2?30:Math.abs(v)<=5?40:50);
        return {...e,value:v,duration:Math.max(2,Number(e.duration)||3)};
      }
      return e;
    })};
  }
  return oldPlayerText135(a);
};

const applyBuff135=window.captureBattleApplyAbility;
window.captureBattleApplyAbility=function(battle,actor,ability,target){
  if(ability&&Array.isArray(ability.effects)){
    ability={...ability,effects:ability.effects.map(e=>{
      const k=String(e.kind||"").toLowerCase();
      if(k==="buff"||k==="debuff"){
        let v=Number(e.value)||0;
        if(Math.abs(v)<20)v=(v<0?-1:1)*(Math.abs(v)<=2?30:Math.abs(v)<=5?40:50);
        return {...e,value:v,duration:Math.max(2,Number(e.duration)||3)};
      }
      return e;
    })};
  }
  return applyBuff135(battle,actor,ability,target);
};

})();
