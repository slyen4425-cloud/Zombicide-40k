
(function(){
/* =========================================================
   V16.136 — ciblage corrigé
   - Cliquer un allié ne cible JAMAIS une attaque.
   - Cliquer un ennemi = cible offensive.
   - Les soins/buffs alliés demandent une cible APRÈS activation.
   ========================================================= */

window.captureAllyTarget135="";

/* 1) Cible offensive = uniquement ennemi sélectionné */
const defaultTarget136=window.captureBattleSelectDefaultTarget;
window.captureBattleSelectDefaultTarget=function(battle,sideKey){
  if(sideKey==="A" && window.captureTarget130){
    const h=gensCaptureBattleCreature(battle,window.captureTarget130);
    if(h&&h.sideKey==="B"&&!h.creature.ko)return h.creature;
  }
  return defaultTarget136(battle,sideKey);
};

/* 2) Cliquer sur une créature alliée sert seulement à changer/sélectionner
      la créature qui va agir, jamais à devenir cible d'une attaque. */
window.captureSelectAlly136=function(id){
  const b=window.gensCurrentCaptureBattle;if(!b||b.phase==="ended")return;
  const h=gensCaptureBattleCreature(b,id);if(!h||h.sideKey!=="A"||h.creature.ko)return;
  b._selectedPlayerCreature=id;
  b.sides.A.selectedActive=id;
  captureRenderBattleLive(b);
};

/* 3) Picker de cible alliée déclenché uniquement par une capacité de soin/buff */
window.capturePendingAbility136=null;
window.captureChooseFriendlyTarget136=function(instanceId){
  const p=window.capturePendingAbility136,b=window.gensCurrentCaptureBattle;
  if(!p||!b)return;
  const h=gensCaptureBattleCreature(b,instanceId);
  if(!h||h.sideKey!=="A"||h.creature.ko)return;
  window.capturePendingAbility136=null;
  const m=document.getElementById("capFriendlyTarget136");if(m)m.classList.remove("open");
  captureExecuteAbility136(p.abilityId,h.creature);
};
window.captureOpenFriendlyTarget136=function(abilityId){
  const b=window.gensCurrentCaptureBattle,a=captureBattleCurrentActor(b);if(!b||!a||a.sideKey!=="A")return;
  const allies=gensCaptureBattleActiveCreatures(b,"A").filter(c=>!c.ko);
  if(!allies.length)return;
  if(allies.length===1){captureExecuteAbility136(abilityId,allies[0]);return}

  window.capturePendingAbility136={abilityId};
  let m=document.getElementById("capFriendlyTarget136");
  if(!m){
    m=document.createElement("div");m.id="capFriendlyTarget136";m.className="capFriendlyTarget136";
    m.innerHTML='<div class="capFriendlyCard136"><h2>Choisir une cible</h2><div id="capFriendlyBody136"></div><button onclick="document.getElementById(\'capFriendlyTarget136\').classList.remove(\'open\');capturePendingAbility136=null">ANNULER</button></div>';
    document.body.appendChild(m);
  }
  document.getElementById("capFriendlyBody136").innerHTML=allies.map(c=>`
    <button onclick="captureChooseFriendlyTarget136('${z40kEscAttr(c.instanceId)}')">
      <b>${z40kEscHtml(c.name)}</b><span>❤️ ${c.hp}/${c.maxHp} PV</span>
    </button>`).join("");
  m.classList.add("open");
};

/* 4) Exécution unique d'une capacité avec cible déjà résolue */
window.captureExecuteAbility136=function(abilityId,target){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended")return;
  const a=captureBattleCurrentActor(battle);if(!a||a.sideKey!=="A")return;
  const ability=abilityId==="capture_basic_attack"
    ? {id:"capture_basic_attack",name:"Attaque",type:"active",effects:[{kind:"damage",base:3}]}
    : captureBattleAbilityById(abilityId);
  if(!ability||!target)return;

  const r=captureBattleApplyAbility(battle,a.creature,ability,target);
  if(!r.ok){
    alert(r.reason==="charges"?"Plus de charges.":r.reason==="cooldown"?"Compétence en recharge.":r.reason==="mana"?"Mana insuffisant.":"Compétence indisponible.");
    return;
  }
  captureRenderBattleLive(battle);
  const fx=battle.lastFx;
  if(fx)captureBattleFx(r.crit?"crit":r.heal?"heal":"hit",r.heal?("+"+r.heal+" PV"):("-"+r.damage+" PV"),r.crit?"COUP CRITIQUE !":ability.name);
  setTimeout(()=>captureBattleAdvanceAfterAction(battle),520);
};

/* 5) Remplace complètement le routage des capacités */
window.captureBattleUseAbility=function(abilityId){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended")return;
  const a=captureBattleCurrentActor(battle);if(!a||a.sideKey!=="A")return;
  const ability=abilityId==="capture_basic_attack"
    ? {id:"capture_basic_attack",name:"Attaque",type:"active",effects:[{kind:"damage",base:3}]}
    : captureBattleAbilityById(abilityId);
  if(!ability)return;

  const mode=gensCaptureAbilityTargetMode(ability);

  /* soi-même : aucune sélection */
  if(mode==="self"){captureExecuteAbility136(abilityId,a.creature);return}

  /* allié : picker AU MOMENT de l'utilisation */
  if(mode==="ally"||mode==="all_allies"){
    captureOpenFriendlyTarget136(abilityId);
    return;
  }

  /* ennemi : cible sélectionnée ou premier ennemi vivant */
  let target=null;
  if(window.captureTarget130){
    const h=gensCaptureBattleCreature(battle,window.captureTarget130);
    if(h&&h.sideKey==="B"&&!h.creature.ko)target=h.creature;
  }
  if(!target)target=gensCaptureBattleActiveCreatures(battle,"B").find(c=>!c.ko)||null;
  if(!target){alert("Aucune cible ennemie disponible.");return}
  captureExecuteAbility136(abilityId,target);
};

/* 6) Rendu : alliés sélectionnables pour agir, ennemis ciblables pour attaquer */
const render136=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
  render136(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;

  host.querySelectorAll(".captureFightMon").forEach(card=>{
    const name=card.querySelector("strong")?.textContent||"";let c=null,side="";
    for(const k of ["A","B"]){c=(b.sides?.[k]?.creatures||[]).find(x=>x.name===name);if(c){side=k;break}}
    if(!c)return;

    card.classList.remove("capAllyTarget135");
    if(side==="A"){
      card.onclick=()=>captureSelectAlly136(c.instanceId);
      card.classList.toggle("capSelected136",String(b._selectedPlayerCreature||"")===String(c.instanceId));
    }else{
      card.onclick=()=>{window.captureTarget130=c.instanceId;captureRenderBattleLive(b)};
      card.classList.toggle("capEnemyTarget136",String(window.captureTarget130||"")===String(c.instanceId));
    }
  });
};
})();
