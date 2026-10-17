
(function(){
/* V16.143 — descriptions exactes + FX buff/debuff sans faux "0 dégât" */

window.cap143AbilitySummary=function(a){
  if(!a)return "";
  const parts=[];
  (a.effects||[]).forEach(e=>{
    const k=String(e.kind||"").toLowerCase();
    if(k==="damage"){
      const p=Math.max(1,Number(e.base??e.value??a.power)||Number(a.power)||1);
      parts.push(`Inflige des dégâts (puissance ${p})${e.element||a.element?` de type ${captureElementLabel138?.(e.element||a.element)||(e.element||a.element)}`:""}.`);
    }else if(k==="heal"||k==="healing"){
      const v=Math.max(1,Number(e.base??e.value)||1);
      parts.push(`Restaure ${v} PV de base, améliorés par l'Esprit et le niveau.`);
    }else if(k==="buff"||k==="debuff"){
      const pct=Math.abs(cap142EffectPct(e.value)),dur=Math.max(2,Number(e.duration)||3);
      parts.push(`${k==="buff"?"Augmente":"Réduit"} la ${cap142StatLabel(e.stat)} de ${pct}% pendant ${dur} tour${dur>1?"s":""}.`);
    }else if(k==="dot"){
      const v=Math.max(1,Number(e.value??e.base)||1),dur=Math.max(1,Number(e.duration)||2);
      parts.push(`Inflige ${v} dégâts à la fin de chaque tour pendant ${dur} tour${dur>1?"s":""}.`);
    }else if(k==="hot"){
      const v=Math.max(1,Number(e.value??e.base)||1),dur=Math.max(1,Number(e.duration)||2);
      parts.push(`Rend ${v} PV à la fin de chaque tour pendant ${dur} tour${dur>1?"s":""}.`);
    }
  });
  const rule=gensAbilityUseRule?.(a);
  if(rule?.mode==="charges")parts.push(`Utilisations : ${rule.value} charge${rule.value>1?"s":""}.`);
  else if(rule?.mode==="mana")parts.push(`Coût : ${rule.value} Mana.`);
  else if(rule?.mode==="cooldown")parts.push(`Recharge : ${rule.value} tour${rule.value>1?"s":""}.`);
  return parts.join(" ");
};
window.capturePlayerAbilityText132=function(a){return cap143AbilitySummary(a)||String(a?.desc||"Aucun effet configuré.")};

/* FX visuel dédié */
window.cap143FxForAbility=function(battle,ability,target,result,actorSide){
  const effects=Array.isArray(ability?.effects)?ability.effects:[];
  const hasDamage=effects.some(e=>String(e.kind||"").toLowerCase()==="damage");
  const hasHeal=effects.some(e=>["heal","healing","hot"].includes(String(e.kind||"").toLowerCase()));
  const buffs=effects.filter(e=>String(e.kind||"").toLowerCase()==="buff");
  const debuffs=effects.filter(e=>String(e.kind||"").toLowerCase()==="debuff");

  if(result?.crit && result.damage>0){
    captureBattleFx("crit","COUP CRITIQUE !",`${target.name} · -${result.damage} PV`);return;
  }
  if(result?.damage>0){
    captureBattleFx("hit",`-${result.damage} PV`,ability.name);return;
  }
  if(result?.heal>0){
    captureBattleFx("heal",`+${result.heal} PV`,ability.name);return;
  }
  if(buffs.length){
    const e=buffs[0],pct=Math.abs(cap142EffectPct(e.value)),dur=Math.max(2,Number(e.duration)||3);
    captureBattleFx("buff","EFFET POSITIF",`${target.name} · ${cap142StatLabel(e.stat)} +${pct}% · ${dur}t`);return;
  }
  if(debuffs.length){
    const e=debuffs[0],pct=Math.abs(cap142EffectPct(e.value)),dur=Math.max(2,Number(e.duration)||3);
    captureBattleFx("debuff","EFFET NÉGATIF",`${target.name} · ${cap142StatLabel(e.stat)} -${pct}% · ${dur}t`);return;
  }
  if(hasHeal)captureBattleFx("heal","EFFET POSITIF",ability.name);
  else if(!hasDamage)captureBattleFx("buff","EFFET APPLIQUÉ",ability.name);
};

/* Player action: do not ever show "-0 PV" for utility abilities */
window.captureBattleUseAbility=function(abilityId){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended"||battle._actionLocked137)return;
  const actor=captureBattleCurrentActor(battle);if(!actor||actor.sideKey!=="A")return;
  const ability=abilityId==="capture_basic_attack"
    ? {id:"capture_basic_attack",name:"Attaque",type:"active",power:3,effects:[{kind:"damage",base:3,target:"enemy"}]}
    : captureBattleAbilityById(abilityId);
  if(!ability)return;

  const resolved=captureResolveAbilityTarget137(battle,actor,ability);
  if(resolved.kind==="friendlyPicker"){captureOpenFriendlyTarget136(abilityId);return}
  if(!resolved.target){alert("Aucune cible disponible.");return}

  battle._actionLocked137=true;
  const r=captureBattleApplyAbility(battle,actor.creature,ability,resolved.target);
  if(!r?.ok){
    battle._actionLocked137=false;
    alert(r?.reason==="charges"?"Plus de charges.":r?.reason==="cooldown"?"Compétence en recharge.":r?.reason==="mana"?"Mana insuffisant.":"Compétence indisponible.");
    return;
  }
  captureRenderBattleLive(battle);
  cap143FxForAbility(battle,ability,resolved.target,r,"A");
  setTimeout(()=>{
    captureBattleAdvanceAfterAction(battle);
    setTimeout(()=>{if(battle)battle._actionLocked137=false},250);
  },750);
};

/* Friendly-target execution follows same FX logic */
window.captureExecuteAbility136=function(abilityId,target){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended"||battle._actionLocked137)return;
  const actor=captureBattleCurrentActor(battle);if(!actor||actor.sideKey!=="A")return;
  const ability=abilityId==="capture_basic_attack"
    ? {id:"capture_basic_attack",name:"Attaque",type:"active",power:3,effects:[{kind:"damage",base:3,target:"enemy"}]}
    : captureBattleAbilityById(abilityId);
  if(!ability||!target)return;
  battle._actionLocked137=true;
  const r=captureBattleApplyAbility(battle,actor.creature,ability,target);
  if(!r?.ok){battle._actionLocked137=false;return}
  captureRenderBattleLive(battle);
  cap143FxForAbility(battle,ability,target,r,"A");
  setTimeout(()=>{
    captureBattleAdvanceAfterAction(battle);
    setTimeout(()=>{if(battle)battle._actionLocked137=false},250);
  },750);
};

/* AI visual feedback too */
const ai143=window.captureBattleRunAiUntilHuman;
window.captureBattleRunAiUntilHuman=function(battle){
  if(!battle)return;
  const rules=captureMjRules137?.()||{enemyControl:"ai"};
  if(rules.enemyControl==="mj")return ai143.apply(this,arguments);

  let guard=0;
  const step=()=>{
    if(!battle||battle.phase==="ended"||battle.awaitingStart||guard++>=20){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
    const a=captureBattleCurrentActor(battle);if(!a){captureRenderBattleLive(battle);return}
    if(a.sideKey==="A"){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
    const abilities=captureBattleAbilities(a.creature),usable=abilities.filter(ab=>ab.id==="capture_basic_attack"||gensCaptureAbilityCanUse(a.creature,ab).ok);
    const ability=usable[Math.floor(Math.random()*usable.length)]||abilities[0];
    const mode=gensCaptureAbilityTargetMode(ability);
    const target=(mode==="self")?a.creature:(mode==="ally"||mode==="all_allies")
      ? (gensCaptureBattleActiveCreatures(battle,"B").find(c=>!c.ko)||a.creature)
      : captureBattleSelectDefaultTarget(battle,"B");
    const r=target&&ability?captureBattleApplyAbility(battle,a.creature,ability,target):null;
    captureRenderBattleLive(battle);
    if(r?.ok)cap143FxForAbility(battle,ability,target,r,"B");
    gensCaptureBattleEvaluateVictory(battle);
    if(battle.phase==="ended"){setTimeout(()=>{captureRenderBattleLive(battle);gensCaptureBattleSave(battle)},1100);return}
    gensCaptureBattleEndTurn(battle);
    setTimeout(step,1500);
  };
  setTimeout(step,700);
};

/* ability details windows always show the real current summary */
const showOld143=window.showAbilityInfo;
if(typeof showOld143==="function"){
  window.showAbilityInfo=function(id){
    const r=showOld143.apply(this,arguments);
    setTimeout(()=>{
      const a=captureBattleAbilityById(id)||loadSharedAbilities?.().find(x=>String(x.id)===String(id));
      if(!a)return;
      const candidates=["sharedAbilityInfoBody","abilityInfoBody","gensAbilityInfoBody"];
      const body=candidates.map(x=>document.getElementById(x)).find(Boolean);
      if(body){
        const old=[...body.querySelectorAll(".capRealEffect143")];old.forEach(x=>x.remove());
        const d=document.createElement("div");d.className="capRealEffect143";
        d.innerHTML=`<b>Effet en jeu</b><span>${z40kEscHtml(cap143AbilitySummary(a))}</span>`;
        body.appendChild(d);
      }
    },0);
    return r;
  };
}
})();
