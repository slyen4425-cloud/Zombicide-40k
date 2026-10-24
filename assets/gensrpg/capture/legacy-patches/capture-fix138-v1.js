
(function(){
/* =========================================================
   V16.138 — flow Capture / ciblage / tour / traduction
   ========================================================= */

/* ---------- contexte Capture fiable ---------- */
window.isCaptureContext138=function(){
  try{
    const p=getActiveGameProfile?.();
    return !!window.GensCaptureV1?.isProfile?.(p);
  }catch(e){return false}
};

/* ---------- ordre de tour Capture : uniquement si MODE TOURS est réellement choisi ---------- */
const turnMgr138=window.startTurnManagerForGame;
window.startTurnManagerForGame=function(){
  if(isCaptureContext138()){
    const ws=captureWorldState();
    if(ws.playMode!=="turns"){
      try{saveTurnState(null);renderTurnUi()}catch(e){}
      return false;
    }
    /* mode tours : popup immédiat, pas après plusieurs actions */
    const cfg=loadGameCustomization();cfg.turnOrder=true;saveGameCustomization(cfg);
    applyCustomHeroesMulti();
    const heroes=turnHeroOrderForRound(1);
    if(!heroes.length){renderTurnUi();return false}
    const state={round:1,phase:"hero",heroes:[...heroes],index:0,startedAt:Date.now()};
    saveTurnState(state);renderTurnUi();
    setTimeout(()=>showTurnPopup(true),20);
    return true;
  }
  return turnMgr138.apply(this,arguments);
};

/* ---------- démarrage Capture : arrive directement sur Explorer / Hub ---------- */
const start138=window.startConfiguredGame;
window.startConfiguredGame=async function(){
  const cap=isCaptureContext138();
  const res=await start138.apply(this,arguments);
  if(cap){
    setTimeout(()=>{
      if(!isCaptureContext138())return;
      try{
        document.getElementById("sheet")&&(document.getElementById("sheet").style.display="none");
        document.getElementById("menu")&&(document.getElementById("menu").style.display="block");
        renderCaptureWorldHub();
        const hub=document.getElementById("captureGameHub");
        if(hub){hub.style.display="block";hub.scrollIntoView({block:"start"})}
      }catch(e){}
    },30);
  }
  return res;
};

/* ---------- traduction propre des éléments ---------- */
window.captureElementLabel138=function(id){
  const k=String(id||"").toLowerCase();
  const map={
    fire:"Feu",water:"Eau",earth:"Terre",air:"Air",electric:"Électricité",
    light:"Lumière",shadow:"Ombre",poison:"Poison",steel:"Acier",psy:"Psy",
    psychic:"Psy",ice:"Glace",nature:"Nature",spirit:"Esprit",physical:"Physique",
    none:"Aucun"
  };
  try{
    const e=typeof gensElementById==="function"?gensElementById(k):null;
    if(e?.name && !/^[a-z]+$/i.test(e.name))return e.name;
  }catch(e){}
  return map[k]||String(id||"—");
};

/* Remplace les libellés anglais dans les fiches Capture sans changer les IDs internes. */
const overlay138=window.captureOpenCreatureOverlay134;
window.captureOpenCreatureOverlay134=function(instanceId){
  overlay138(instanceId);
  setTimeout(()=>{
    const body=document.getElementById("capOverlayBody134");if(!body)return;
    body.innerHTML=body.innerHTML
      .replace(/\bearth\b/gi,"Terre").replace(/\bwater\b/gi,"Eau").replace(/\bfire\b/gi,"Feu")
      .replace(/\belectric\b/gi,"Électricité").replace(/\bshadow\b/gi,"Ombre").replace(/\blight\b/gi,"Lumière")
      .replace(/\bsteel\b/gi,"Acier").replace(/\bpsy\b/gi,"Psy").replace(/\bice\b/gi,"Glace")
      .replace(/\bnature\b/gi,"Nature").replace(/\bspirit\b/gi,"Esprit");
  },0);
};

/* Nettoyage cohérence : aucune créature ne peut être à la fois résistante et faible au même élément. */
window.captureNormalizeAffinities138=function(){
  try{
    const all=loadSharedEntities();let changed=false;
    all.forEach(c=>{
      if(c.category!=="creature")return;
      const res=[...(c.elementResistances||[])],weak=[...(c.elementWeaknesses||[])];
      const set=new Set(res.map(x=>String(x).toLowerCase()));
      const nw=weak.filter(x=>!set.has(String(x).toLowerCase()));
      if(nw.length!==weak.length){c.elementWeaknesses=nw;changed=true}
    });
    if(changed&&typeof saveSharedEntities==="function")saveSharedEntities(all);
  }catch(e){}
};
setTimeout(captureNormalizeAffinities138,250);

/* ---------- ciblage central : sideKey = camp de l'acteur ---------- */
window.captureBattleSelectDefaultTarget=function(battle,actorSide){
  if(!battle)return null;
  if(actorSide==="A"){
    if(window.captureTarget130){
      const h=gensCaptureBattleCreature(battle,window.captureTarget130);
      if(h&&h.sideKey==="B"&&!h.creature.ko)return h.creature;
    }
    return gensCaptureBattleActiveCreatures(battle,"B").find(c=>!c.ko)||null;
  }
  return gensCaptureBattleActiveCreatures(battle,"A").find(c=>!c.ko)||null;
};

/* garde-fou absolu : une capacité offensive ne frappe jamais son propre camp */
const apply138=window.captureBattleApplyAbility;
window.captureBattleApplyAbility=function(battle,actor,ability,target){
  const effects=Array.isArray(ability?.effects)?ability.effects:[];
  const offensive=effects.some(e=>["damage","dot","debuff"].includes(String(e.kind||"").toLowerCase()));

  if(offensive&&battle&&actor){
    const actorHit=gensCaptureBattleCreature(battle,actor.instanceId);
    const targetHit=target?gensCaptureBattleCreature(battle,target.instanceId):null;
    const actorSide=actorHit?.sideKey;

    if(!targetHit || !actorSide || targetHit.sideKey===actorSide){
      const opposite=actorSide==="A"?"B":"A";
      const replacement=gensCaptureBattleActiveCreatures(battle,opposite).find(c=>!c.ko)||null;
      if(!replacement){
        battle.log.push({round:battle.round,type:"error",text:"Action annulée : aucune cible adverse valide."});
        return {ok:false,reason:"invalid_target"};
      }
      target=replacement;
    }
  }
  return apply138(battle,actor,ability,target);
};

/* IA : cible TOUJOURS l'autre camp. */
const ai138=window.captureBattleRunAiUntilHuman;
window.captureBattleRunAiUntilHuman=function(battle){
  if(!battle)return;
  const rules=captureMjRules137?.()||{enemyControl:"ai"};
  const actor=captureBattleCurrentActor(battle);
  if(rules.enemyControl==="mj"&&actor?.sideKey==="B"){captureRenderBattleLive(battle);return}
  return ai138.apply(this,arguments);
};

/* Le sélecteur visuel ennemi n'altère jamais l'acteur courant. */
const render138=window.captureRenderBattleLive;
window.captureRenderBattleLive=function(b=window.gensCurrentCaptureBattle){
  render138(b);const host=document.getElementById("captureBattleLiveBody");if(!host||!b)return;
  host.querySelectorAll(".captureFightSide.enemy .captureFightMon").forEach(card=>{
    const name=card.querySelector("strong")?.textContent||"";
    const c=(b.sides?.B?.creatures||[]).find(x=>x.name===name);if(!c)return;
    card.onclick=()=>{
      window.captureTarget130=c.instanceId;
      b._selectedPlayerCreature=b._selectedPlayerCreature; /* ne touche jamais à l'acteur */
      captureRenderBattleLive(b);
    };
    card.classList.toggle("capEnemyTarget138",String(window.captureTarget130||"")===String(c.instanceId));
  });
};
})();
