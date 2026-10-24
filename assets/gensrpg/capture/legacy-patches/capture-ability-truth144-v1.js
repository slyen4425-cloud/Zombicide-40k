
(function(){
/* V16.144 — une seule définition des effets sert AU MOTEUR et AUX TEXTES.
   Supprime notamment l'ancien amplificateur caché x3 des buffs utilitaires. */

window.cap144ResolvedEffects=function(a){
  return (Array.isArray(a?.effects)&&a.effects.length?a.effects:[{kind:"damage",base:3}]).map(raw=>{
    const e={...raw},k=String(e.kind||"damage").toLowerCase();
    e.kind=k;
    if(k==="buff"||k==="debuff"){
      e.stat=cap142NormStat(e.stat);
      e.value=Math.abs(cap142EffectPct(e.value));
      e.duration=Math.max(2,Number(e.duration)||3);
    }else if(k==="damage"){
      e.base=Math.max(1,Number(e.base??e.value??a?.power??3)||3);
    }else if(k==="heal"||k==="healing"){
      e.base=Math.max(1,Number(e.base??e.value??3)||3);
    }else if(k==="dot"||k==="hot"){
      e.value=Math.max(1,Number(e.value??e.base??1)||1);
      e.duration=Math.max(1,Number(e.duration)||2);
    }
    return e;
  });
};

window.cap144AbilitySummary=function(a){
  if(!a)return "";
  const out=[];
  cap144ResolvedEffects(a).forEach(e=>{
    if(e.kind==="damage"){
      out.push(`Dégâts : base ${e.base} + niveau × 0,45 + Puissance × 0,08. La Défense, l'esquive, les critiques et les affinités élémentaires modifient ensuite le résultat.`);
    }else if(e.kind==="heal"||e.kind==="healing"){
      out.push(`Soin : ${e.base} PV de base + niveau × 0,35 + Esprit × 0,06.`);
    }else if(e.kind==="buff"){
      out.push(`Effet réel : +${e.value}% ${cap142StatLabel(e.stat)} pendant ${e.duration} tour${e.duration>1?"s":""}.`);
    }else if(e.kind==="debuff"){
      out.push(`Effet réel : −${e.value}% ${cap142StatLabel(e.stat)} pendant ${e.duration} tour${e.duration>1?"s":""}.`);
    }else if(e.kind==="dot"){
      out.push(`Effet réel : ${e.value} dégâts par tour pendant ${e.duration} tour${e.duration>1?"s":""}.`);
    }else if(e.kind==="hot"){
      out.push(`Effet réel : +${e.value} PV par tour pendant ${e.duration} tour${e.duration>1?"s":""}.`);
    }
  });
  const r=gensAbilityUseRule?.(a);
  if(r?.mode==="charges")out.push(`${r.value} charge${r.value>1?"s":""} par ${r.recovery==="day"?"jour":r.recovery==="combat"?"combat":"récupération"}.`);
  else if(r?.mode==="mana")out.push(`Coût : ${r.value} Mana.`);
  else if(r?.mode==="cooldown")out.push(`Recharge : ${r.value} tour${r.value>1?"s":""}.`);
  else if(a?.type==="active")out.push(`Utilisation libre.`);
  return out.join(" ");
};
window.capturePlayerAbilityText132=window.cap144AbilitySummary;

/* MOTEUR CANONIQUE : ne passe plus par les anciennes surcouches de buff. */
window.captureBattleApplyAbility=function(battle,actor,ability,target){
  if(!battle||!actor||!ability||!target)return {ok:false,reason:"invalid"};

  if(ability.id!=="capture_basic_attack"){
    const can=gensCaptureAbilityCanUse(actor,ability);
    if(!can.ok)return can;
    gensCaptureConsumeAbilityUse(actor,ability);
  }

  const effects=cap144ResolvedEffects(ability);
  const messages=[];let totalDamage=0,totalHeal=0,crit=false;

  effects.forEach(e=>{
    if(e.kind==="damage"){
      const ad0=captureCreatureDerivedStats(actor?.source?._instance||{},actor?.source||{});
      const td0=captureCreatureDerivedStats(target?.source?._instance||{},target?.source||{});
      const am=cap142ActiveMods(actor),tm=cap142ActiveMods(target);
      const force=Math.max(0,Math.round((Number(ad0.force)||0)*(1+(am.force||0)/100)));
      const agi=Math.max(0,Math.round((Number(ad0.agi)||0)*(1+(am.agi||0)/100)));
      const tAgi=Math.max(0,Math.round((Number(td0.agi)||0)*(1+(tm.agi||0)/100)));
      const defense=Math.max(0,Math.round((Number(td0.defense)||0)*(1+(tm.defense||0)/100)));
      const lvl=Math.max(1,Number(actor.level)||1);

      let dmg=e.base + lvl*.45 + force*.08;
      const mode=captureBattleMode();
      if(mode==="classic")dmg*=.90+Math.random()*.21;
      if(mode==="rpg"){const die=1+Math.floor(Math.random()*6);dmg+=die;window._captureLastRoll=die}
      if(mode==="active")dmg*=.95+Math.random()*.16;
      dmg=Math.max(1,Math.round(dmg));

      const evade=captureCreatureStatRules().agility.enabled===false?0:Math.min(30,tAgi*.20);
      if(Math.random()*100<evade){
        dmg=0;messages.push(`${target.name} esquive.`);
      }else{
        const critChance=Math.min(35,5+agi*.35);
        if(Math.random()*100<critChance){dmg=Math.max(1,Math.round(dmg*1.5));crit=true}
        if(captureCreatureStatRules().defense.enabled!==false)dmg=Math.max(1,Math.round(dmg*100/(100+defense)));
        const em=captureElementDamageMultiplier(target,String(e.element||ability.element||""));
        dmg=Math.max(1,Math.round(dmg*em.mult));
        if(target.defended)dmg=Math.max(1,Math.ceil(dmg/2));
        target.hp=Math.max(0,target.hp-dmg);totalDamage+=dmg;
        messages.push(`${target.name} −${dmg} PV${crit?" · CRITIQUE":""}${em.label?" · "+em.label:""}`);
      }
    }else if(e.kind==="heal"||e.kind==="healing"){
      const d=captureCreatureDerivedStats(actor?.source?._instance||{},actor?.source||{});
      const mods=cap142ActiveMods(actor);
      const spirit=Math.max(0,Math.round((Number(d.spirit)||0)*(1+(mods.spirit||0)/100)));
      const heal=Math.max(1,Math.round(e.base+Math.max(0,(Number(actor.level)||1)-1)*.35+spirit*.06));
      const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+heal);
      totalHeal+=target.hp-before;messages.push(`${target.name} +${target.hp-before} PV`);
    }else if(e.kind==="dot"||e.kind==="hot"){
      target.statuses=Array.isArray(target.statuses)?target.statuses:[];
      target.statuses.push({name:e.name||ability.name,kind:e.kind,value:e.value,duration:e.duration,phase:"turn_end"});
      messages.push(`${e.kind==="dot"?"Dégâts":"Soin"} sur la durée : ${e.value}/tour · ${e.duration}t`);
    }else if(e.kind==="buff"||e.kind==="debuff"){
      target.statuses=Array.isArray(target.statuses)?target.statuses:[];
      target.statuses.push({name:e.name||ability.name,kind:e.kind,stat:e.stat,value:e.value,duration:e.duration,phase:"turn_end"});
      messages.push(`${cap142StatLabel(e.stat)} ${e.kind==="buff"?"+":"−"}${e.value}% · ${e.duration}t`);
    }
  });

  const roll=captureBattleMode()==="rpg"&&window._captureLastRoll?` · 🎲 ${window._captureLastRoll}`:"";
  battle.lastFx={actor:actor.name,target:target.name,ability:ability.name,damage:totalDamage,heal:totalHeal,crit,roll:window._captureLastRoll||null};
  battle.log.push({round:battle.round,type:"ability",text:`${actor.name} utilise ${ability.name} → ${messages.join(" · ")}${roll}`});
  if(target.hp<=0&&!target.ko)gensCaptureBattleHandleKo(battle,target.instanceId);
  try{captureBattlePersistPlayerHp(battle)}catch(e){}
  return {ok:true,damage:totalDamage,heal:totalHeal,crit};
};

/* Remplace aussi les vieux descriptifs visibles HORS combat dans les fiches Capture. */
function refreshTexts144(root=document){
  root.querySelectorAll(".captureAbilityMini button,.cap130Moves button,.capOverlayMoves134 button").forEach(btn=>{
    const oc=btn.getAttribute("onclick")||"";
    const id=oc.match(/showAbilityInfo\('([^']+)'\)/)?.[1];if(!id)return;
    const a=captureBattleAbilityById(id);if(!a)return;
    const span=btn.querySelector("span,small");if(span)span.textContent=cap144AbilitySummary(a);
    const smalls=btn.querySelectorAll("small");
    if(smalls.length>1)smalls[0].textContent=cap144AbilitySummary(a);
  });
}
const rend144=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(){
  const r=rend144.apply(this,arguments);
  refreshTexts144(document);
  return r;
};
const detail144=window.captureOpenCreatureDetail;
if(typeof detail144==="function")window.captureOpenCreatureDetail=function(){
  const r=detail144.apply(this,arguments);setTimeout(()=>refreshTexts144(document),0);return r;
};
const overlay144=window.captureOpenCreatureOverlay134;
if(typeof overlay144==="function")window.captureOpenCreatureOverlay134=function(){
  const r=overlay144.apply(this,arguments);setTimeout(()=>refreshTexts144(document),0);return r;
};

/* Popup générique : affiche en tête la vérité moteur, pas l'ancien champ desc. */
const info144=window.showAbilityInfo;
if(typeof info144==="function")window.showAbilityInfo=function(id){
  const r=info144.apply(this,arguments);
  setTimeout(()=>{
    const a=captureBattleAbilityById(id);if(!a)return;
    let box=document.getElementById("capTruth144");
    if(!box){box=document.createElement("div");box.id="capTruth144";box.className="capTruth144";document.body.appendChild(box)}
    box.innerHTML=`<div><b>⚙️ EFFET RÉEL EN JEU — ${z40kEscHtml(a.name)}</b><span>${z40kEscHtml(cap144AbilitySummary(a))}</span><button onclick="this.parentElement.parentElement.style.display='none'">FERMER</button></div>`;
    box.style.display="flex";
  },0);
  return r;
};
})();
