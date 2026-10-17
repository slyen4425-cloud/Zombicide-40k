
(function(){
/* =========================================================
   V16.137 — architecture combat + réglages MJ centralisés
   ========================================================= */

/* ---------- configuration MJ globale ---------- */
window.captureMjRulesKey137=function(){
  let id="default";try{id=String(getActiveGameProfile()?.id||getActiveGameProfile()?.name||"default")}catch(e){}
  return "gensrpg_capture_mj_rules_v137_"+id;
};
window.captureMjRules137=function(){
  const d={
    xpMultiplier:1,goldMultiplier:1,generalDifficulty:2,
    battleMode:"classic",enemyControl:"ai",respectTimeline:true,
    starterLimit:1,healCost:10,dayHealPct:10
  };
  try{Object.assign(d,JSON.parse(localStorage.getItem(captureMjRulesKey137())||"{}"))}catch(e){}
  return d;
};
window.captureSaveMjRules137=function(){
  const g=id=>document.getElementById(id),r=captureMjRules137();
  if(g("mj137Xp"))r.xpMultiplier=Math.max(0,Number(g("mj137Xp").value)||1);
  if(g("mj137Gold"))r.goldMultiplier=Math.max(0,Number(g("mj137Gold").value)||1);
  if(g("mj137Difficulty"))r.generalDifficulty=Math.max(1,Math.min(4,Number(g("mj137Difficulty").value)||2));
  if(g("mj137BattleMode"))r.battleMode=g("mj137BattleMode").value;
  if(g("mj137EnemyControl"))r.enemyControl=g("mj137EnemyControl").value;
  if(g("mj137Timeline"))r.respectTimeline=g("mj137Timeline").value==="true";
  if(g("mj137Starter"))r.starterLimit=Math.max(1,Math.min(3,Number(g("mj137Starter").value)||1));
  if(g("mj137Heal"))r.healCost=Math.max(0,Number(g("mj137Heal").value)||0);
  if(g("mj137DayHeal"))r.dayHealPct=Math.max(0,Math.min(100,Number(g("mj137DayHeal").value)||0));
  localStorage.setItem(captureMjRulesKey137(),JSON.stringify(r));

  /* synchronise avec les règles déjà existantes */
  const pr=captureCreatureProgressRules();
  pr.xpMultiplier=r.xpMultiplier;pr.starterLimit=r.starterLimit;pr.healCenterCost=r.healCost;pr.dayHealPct=r.dayHealPct;
  GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),pr);
  try{captureSetBattleMode(r.battleMode)}catch(e){}
  captureCloseModal("captureMjGlobal137");
  try{captureRefreshAll134()}catch(e){}
};
window.captureOpenMjGlobal137=function(){
  let m=document.getElementById("captureMjGlobal137");
  if(!m){
    m=document.createElement("div");m.id="captureMjGlobal137";m.className="capMjOverlay137";
    m.innerHTML=`<div class="capMjCard137">
      <button class="capMjClose137" onclick="captureCloseModal('captureMjGlobal137')">✕</button>
      <h2>🎛️ Réglages MJ — Capture</h2>
      <div class="capMjSections137">
        <section><h3>📈 Progression & économie</h3>
          <label>Multiplicateur XP <input id="mj137Xp" type="number" min="0" step="0.25"></label>
          <label>Multiplicateur Or <input id="mj137Gold" type="number" min="0" step="0.25"></label>
          <label>Soin au changement de jour (%) <input id="mj137DayHeal" type="number" min="0" max="100"></label>
          <label>Coût du centre de soins <input id="mj137Heal" type="number" min="0"></label>
        </section>
        <section><h3>⚔️ Difficulté & combat</h3>
          <label>Difficulté générale <select id="mj137Difficulty">
            <option value="1">Facile</option><option value="2">Équilibrée</option><option value="3">Difficile</option><option value="4">Expert</option>
          </select></label>
          <label>Gameplay combat <select id="mj137BattleMode">
            <option value="classic">Classique</option><option value="rpg">JDR / dés</option><option value="active">Dynamique (prototype)</option>
          </select></label>
          <label>Contrôle des ennemis <select id="mj137EnemyControl">
            <option value="ai">IA automatique</option><option value="mj">MJ choisit les actions ennemies</option>
          </select></label>
          <label>Respecter la timeline <select id="mj137Timeline">
            <option value="true">Oui — ordre strict</option><option value="false">Non — MJ choisit l'ennemi actif</option>
          </select></label>
        </section>
        <section><h3>🎒 Début de partie</h3>
          <label>Créatures de départ max <input id="mj137Starter" type="number" min="1" max="3"></label>
        </section>
      </div>
      <button class="startGameBtn" onclick="captureSaveMjRules137()">✓ ENREGISTRER</button>
    </div>`;
    document.body.appendChild(m);
  }
  const r=captureMjRules137(),set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=String(v)};
  set("mj137Xp",r.xpMultiplier);set("mj137Gold",r.goldMultiplier);set("mj137Difficulty",r.generalDifficulty);
  set("mj137BattleMode",r.battleMode);set("mj137EnemyControl",r.enemyControl);set("mj137Timeline",r.respectTimeline);
  set("mj137Starter",r.starterLimit);set("mj137Heal",r.healCost);set("mj137DayHeal",r.dayHealPct);
  m.style.display="flex";m.classList.add("open");
};

/* bouton MJ visible avant ET pendant la partie */
function injectMj137(){
  if(typeof gensCapturePregameMode==="function"&&gensCapturePregameMode()){
    const pre=document.getElementById("pregameSetup");
    if(pre){
      document.getElementById("capturePregameMjBig134")?.remove();
      let b=document.getElementById("captureMjBig137");
      if(!b){b=document.createElement("button");b.id="captureMjBig137";b.className="captureMjBig137";
        b.innerHTML='<span>🎛️</span><b>RÉGLAGES MJ — CAPTURE</b><small>XP · Or · difficulté · gameplay · contrôle des ennemis · starters</small>';
        b.onclick=captureOpenMjGlobal137;pre.prepend(b)}
    }
  }
  const hub=document.getElementById("captureGameHub");
  if(hub&&!document.getElementById("captureMjInGame137")){
    const b=document.createElement("button");b.id="captureMjInGame137";b.className="captureMjInGame137";b.textContent="🎛️ MJ";
    b.onclick=captureOpenMjGlobal137;hub.prepend(b);
  }
}
setTimeout(injectMj137,120);
const rp137=window.renderParticipantSelector;
window.renderParticipantSelector=function(){const r=rp137.apply(this,arguments);injectMj137();return r};
const rh137=window.renderCaptureWorldHub;
window.renderCaptureWorldHub=function(){const r=rh137.apply(this,arguments);injectMj137();return r};

/* ---------- multiplicateurs XP / or ---------- */
const xp137=window.captureApplyXpToInstance;
window.captureApplyXpToInstance=function(inst,amount){
  const r=captureMjRules137();
  const pr=captureCreatureProgressRules();
  /* neutralise le multiplicateur historique pour éviter x2 appliqué deux fois */
  const saved=pr.xpMultiplier;
  pr.xpMultiplier=1;
  const result=xp137(inst,Math.round((Number(amount)||0)*r.xpMultiplier));
  pr.xpMultiplier=saved;
  return result;
};
const reward137=window.captureGenerateBattleRewards;
window.captureGenerateBattleRewards=function(b){
  const rw=reward137(b);
  if(rw&&!rw._mj137){rw.gold=Math.round((Number(rw.gold)||0)*captureMjRules137().goldMultiplier);rw._mj137=true}
  return rw;
};

/* difficulté générale : sauvage + dresseur */
const wild137=window.captureWildEnemyRoster;
if(typeof wild137==="function")window.captureWildEnemyRoster=function(primary){
  const arr=wild137.apply(this,arguments),d=captureMjRules137().generalDifficulty,delta=[-2,0,2,5][d-1];
  return (arr||[]).map(c=>({...c,level:Math.max(1,(Number(c.level)||1)+delta)}));
};
window.captureTrainerDifficulty134=function(){return captureMjRules137().generalDifficulty};

/* ---------- ciblage : une attaque offensive ne peut JAMAIS viser l'acteur ---------- */
window.captureResolveAbilityTarget137=function(battle,actor,ability){
  const effects=Array.isArray(ability?.effects)?ability.effects:[];
  const kinds=effects.map(e=>String(e.kind||"").toLowerCase());
  const offensive=kinds.some(k=>["damage","dot","debuff"].includes(k));
  const friendly=kinds.length>0 && !offensive && kinds.some(k=>["heal","healing","hot","buff","shield"].includes(k));

  if(offensive){
    let t=null;
    if(window.captureTarget130){
      const h=gensCaptureBattleCreature(battle,window.captureTarget130);
      if(h&&h.sideKey==="B"&&!h.creature.ko)t=h.creature;
    }
    if(!t)t=gensCaptureBattleActiveCreatures(battle,"B").find(c=>!c.ko)||null;
    return {kind:"enemy",target:t};
  }
  if(friendly){
    const explicit=gensCaptureAbilityTargetMode(ability);
    if(explicit==="self")return {kind:"self",target:actor.creature};
    return {kind:"friendlyPicker",target:null};
  }
  return {kind:"self",target:actor.creature};
};

/* anti-spam + ciblage réécrit */
window.captureBattleUseAbility=function(abilityId){
  const battle=window.gensCurrentCaptureBattle;if(!battle||battle.phase==="ended")return;
  if(battle._actionLocked137)return;
  const actor=captureBattleCurrentActor(battle);if(!actor||actor.sideKey!=="A")return;
  const ability=abilityId==="capture_basic_attack"
    ? {id:"capture_basic_attack",name:"Attaque",type:"active",power:3,effects:[{kind:"damage",base:3,target:"enemy"}]}
    : captureBattleAbilityById(abilityId);
  if(!ability)return;

  const resolved=captureResolveAbilityTarget137(battle,actor,ability);
  if(resolved.kind==="friendlyPicker"){
    captureOpenFriendlyTarget136(abilityId);return;
  }
  if(!resolved.target){alert("Aucune cible ennemie disponible.");return}

  battle._actionLocked137=true;
  const r=captureBattleApplyAbility(battle,actor.creature,ability,resolved.target);
  if(!r?.ok){
    battle._actionLocked137=false;
    alert(r?.reason==="charges"?"Plus de charges.":r?.reason==="cooldown"?"Compétence en recharge.":r?.reason==="mana"?"Mana insuffisant.":"Compétence indisponible.");
    return;
  }
  captureRenderBattleLive(battle);
  const fx=battle.lastFx;
  if(fx)captureBattleFx(r.crit?"crit":r.heal?"heal":"hit",r.heal?("+"+r.heal+" PV"):("-"+r.damage+" PV"),r.crit?"COUP CRITIQUE !":ability.name);
  setTimeout(()=>{
    captureBattleAdvanceAfterAction(battle);
    setTimeout(()=>{if(battle)battle._actionLocked137=false},250);
  },750);
};

/* ---------- contrôle MJ des ennemis ---------- */
window.captureMjEnemyUseAbility137=function(abilityId){
  const b=window.gensCurrentCaptureBattle;if(!b||b._actionLocked137)return;
  let actor=captureBattleCurrentActor(b);
  if(captureMjRules137().enemyControl!=="mj"||!actor||actor.sideKey!=="B")return;
  if(!captureMjRules137().respectTimeline && b._mjEnemyActorId137){
    const h=gensCaptureBattleCreature(b,b._mjEnemyActorId137);
    if(h&&h.sideKey==="B"&&!h.creature.ko)actor={...actor,...h};
  }
  const ab=captureBattleAbilityById(abilityId)||captureBattleAbilities(actor.creature).find(x=>x.id===abilityId);if(!ab)return;
  const target=gensCaptureBattleActiveCreatures(b,"A").find(c=>!c.ko);if(!target)return;
  b._actionLocked137=true;
  captureBattleApplyAbility(b,actor.creature,ab,target);
  captureRenderBattleLive(b);
  setTimeout(()=>{
    gensCaptureBattleEvaluateVictory(b);
    if(b.phase!=="ended"){gensCaptureBattleEndTurn(b);gensCaptureBattleStartTurn(b)}
    b._actionLocked137=false;
    captureRenderBattleLive(b);
    if(captureMjRules137().enemyControl==="ai")captureBattleRunAiUntilHuman(b);
  },800);
};

/* IA : si MJ contrôle, on s'arrête sur les tours ennemis */
const ai137=window.captureBattleRunAiUntilHuman;
window.captureBattleRunAiUntilHuman=function(b){
  const r=captureMjRules137(),a=captureBattleCurrentActor(b);
  if(r.enemyControl==="mj"&&a?.sideKey==="B"){captureRenderBattleLive(b);return}
  return ai137.apply(this,arguments);
};

/* rendu des contrôles MJ sur tour ennemi + sélection ennemi libre si timeline off */
const render137=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
  render137(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;
  const rules=captureMjRules137(),actor=captureBattleCurrentActor(b);

  /* désactive tous les boutons attaque pendant résolution */
  host.querySelectorAll(".captureMoveGrid>button").forEach(x=>x.disabled=x.disabled||!!b._actionLocked137);

  if(rules.enemyControl==="mj"&&actor?.sideKey==="B"&&b.phase!=="ended"){
    const act = (!rules.respectTimeline&&b._mjEnemyActorId137)
      ? (gensCaptureBattleCreature(b,b._mjEnemyActorId137)?.creature||actor.creature)
      : actor.creature;
    const abs=captureBattleAbilities(act);
    const action=host.querySelector(".captureFightActions");
    if(action){
      action.innerHTML=`<div class="captureActionTitle">🎛️ MJ — action de <strong>${z40kEscHtml(act.name)}</strong></div>
        <div class="captureMoveGrid">${abs.slice(0,4).map(ab=>`<button onclick="captureMjEnemyUseAbility137('${z40kEscAttr(ab.id)}')"><strong>${z40kEscHtml(ab.name)}</strong><span>${z40kEscHtml(capturePlayerAbilityText132?.(ab)||ab.desc||"")}</span></button>`).join("")}</div>`;
    }
    if(!rules.respectTimeline){
      host.querySelectorAll(".captureFightSide.enemy .captureFightMon").forEach(card=>{
        const name=card.querySelector("strong")?.textContent||"",c=(b.sides.B.creatures||[]).find(x=>x.name===name);
        if(!c||c.ko)return;
        card.onclick=()=>{b._mjEnemyActorId137=c.instanceId;captureRenderBattleLive(b)};
        card.classList.toggle("capMjEnemy137",String(b._mjEnemyActorId137)===String(c.instanceId));
      });
    }
  }
};
})();
