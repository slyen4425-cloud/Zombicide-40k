
(function(){
"use strict";

/* Core 3.03 = base 2.14 conservée.
   Cette couche ne touche ni aux pions, ni aux coffres, ni aux énigmes,
   ni au renderer visuel 2.14. Elle répare uniquement la timeline. */

let T={sig:"",order:[],index:0,aiBusy:false,pendingHero:false};

function sig(){
  return JSON.stringify({
    h:(dungeonCombatSelection?.heroes||[]).map(String).sort(),
    e:(dungeonCombatSelection?.enemies||[]).map(String).sort()
  });
}
function heroAlive(id){
  try{return Number(dungeonCombatHeroSnapshot?.(id)?.hp)>0}catch(e){return false}
}
function enemyAlive(id){
  try{
    const e=(loadActiveEnemies?.()||[]).find(x=>String(x.id)===String(id));
    return !!e&&!e.defeated&&Number(e.hp)>0
  }catch(e){return false}
}
function build(){
  const a=[];
  (dungeonCombatSelection?.heroes||[]).forEach(id=>{
    if(!heroAlive(id))return;
    const sn=dungeonCombatHeroSnapshot?.(id)||{};
    a.push({kind:"hero",id:String(id),name:CHARS?.[id]?.name||String(id),initiative:Number(sn.initiative)||0})
  });
  try{
    (loadActiveEnemies?.()||[])
      .filter(e=>(dungeonCombatSelection?.enemies||[]).map(String).includes(String(e.id))&&!e.defeated&&Number(e.hp)>0)
      .forEach(e=>{
        const d=activeEnemyDefinition?.(e.enemyId);
        const dr=dungeonEnemyDerivedForInstance?.(e)||dungeonEnemyDerived?.(d)||{};
        a.push({kind:"enemy",id:String(e.id),name:d?.name||e.name||"Ennemi",initiative:Number(dr.initiative)||0})
      });
  }catch(e){}
  a.sort((x,y)=>y.initiative-x.initiative||(x.kind==="hero"?-1:1));
  return a;
}
function init(force=false){
  const s=sig();
  if(!force&&T.sig===s&&T.order.length)return;
  T={sig:s,order:build(),index:0,aiBusy:false,pendingHero:false};
}
function current(){
  init();
  const alive=build(), keys=new Set(alive.map(a=>a.kind+":"+a.id));
  const old=T.order[T.index];
  T.order=T.order.filter(a=>keys.has(a.kind+":"+a.id));
  alive.forEach(a=>{if(!T.order.some(b=>b.kind===a.kind&&b.id===a.id))T.order.push(a)});
  if(!T.order.length)return null;
  if(old){
    const i=T.order.findIndex(a=>a.kind===old.kind&&a.id===old.id);
    if(i>=0)T.index=i;
  }
  if(T.index>=T.order.length)T.index=0;
  return T.order[T.index]||null;
}
function resultOpen(){
  const open=id=>{
    const e=document.getElementById(id);
    if(!e)return false;
    return e.classList.contains("open") || (e.style.display && e.style.display!=="none");
  };
  return open("attackDiceModal")||open("specialDiceModal")||open("effectModal");
}
function advance(){
  if(!T.order.length)return;
  T.index=(T.index+1)%T.order.length;
  T.aiBusy=false;
  T.pendingHero=false;
  render();
}
function timelineHtml(){
  const c=current();if(!c||!T.order.length)return "";
  const idx=T.order.findIndex(a=>a.kind===c.kind&&a.id===c.id);
  const arr=[...T.order.slice(idx),...T.order.slice(0,idx)].slice(0,8);
  return '<div id="dc302Timeline" class="dungeonTimeline156">'+arr.map((a,i)=>
    '<div class="dungeonTimelineNode156 '+a.kind+' '+(i===0?'now':'')+'">'+
    '<small>'+(i===0?'MAINTENANT':'PUIS')+'</small><b>'+String(a.name)+'</b><span>⚡ '+a.initiative+'</span></div>'
  ).join("")+'</div>';
}
function applyTurnUi(){
  const host=document.getElementById("dungeonCombatSetupView");if(!host)return;
  host.querySelector("#dc302Timeline")?.remove();
  host.insertAdjacentHTML("afterbegin",timelineHtml());

  const cur=current();if(!cur)return;

  const heroIds=[...(dungeonCombatSelection?.heroes||[])]
    .sort((a,b)=>(dungeonCombatHeroSnapshot?.(b)?.initiative||0)-(dungeonCombatHeroSnapshot?.(a)?.initiative||0));

  document.querySelectorAll("#combatHeroSide .combatantCard").forEach((card,i)=>{
    const id=String(heroIds[i]||"");
    const ownsTurn=cur.kind==="hero"&&cur.id===id;
    const active=ownsTurn&&!T.pendingHero&&!resultOpen();
    card.classList.toggle("turnActive156",ownsTurn);

    card.querySelectorAll(".dungeonHeroCombatAttackBtn").forEach(el=>{el.disabled=!active});
    card.querySelectorAll(".dc211CombatTools button,.dc213CombatTools button").forEach(el=>{
      /* utility controls remain usable for the active hero only */
      el.disabled=!active;
    });
  });
}

function pickTarget(){
  const hs=(dungeonCombatSelection?.heroes||[])
    .map(id=>({id:String(id),s:dungeonCombatHeroSnapshot?.(id)}))
    .filter(x=>Number(x.s?.hp)>0);
  if(!hs.length)return null;
  return hs.sort((a,b)=>Number(a.s.hp)-Number(b.s.hp))[0].id;
}
function completeAi(token=T.aiToken){
  if(!T.aiBusy||token!==T.aiToken)return;
  T.aiBusy=false;
  advance();
}
function runAi(){
  const cur=current();
  if(!cur||cur.kind!=="enemy"||T.aiBusy||T.pendingHero||resultOpen())return;
  T.aiBusy=true;
  const token=(Number(T.aiToken)||0)+1;
  T.aiToken=token;

  setTimeout(()=>{
    let launched=false;
    try{
      const inst=(loadActiveEnemies?.()||[]).find(e=>String(e.id)===String(cur.id));
      if(!inst||inst.defeated||Number(inst.hp)<=0){
        completeAi(token);return;
      }
      const def=activeEnemyDefinition?.(inst.enemyId);
      const skills=dungeonEnemyAttackSkills?.(def)||[];
      const skill=skills[Math.floor(Math.random()*skills.length)]||skills[0];
      const target=pickTarget();
      if(skill&&target){
        /* l'ancien système 156 reste coupé : aucune double IA */
        try{
          if(window.dungeonTurn156){dungeonTurn156.active=false;dungeonTurn156.aiBusy=false}
        }catch(e){}
        rollDungeonEnemyAttackSkill?.(inst.id,skill.id,target);
        launched=resultOpen();
      }
    }catch(e){console.warn("Core 3.03 IA",e)}
    /* Une attaque visible se termine uniquement après fermeture réelle du jet
       (et application des dégâts). Si aucun jet n'a pu démarrer, on libère le tour. */
    if(!launched)setTimeout(()=>completeAi(token),350);
  },350);
}

document.addEventListener("gensrpg:enemy-attack-resolved",()=>completeAi(T.aiToken));

function render(){
  if(typeof window.dc315ResolveCombatWipe==="function"&&window.dc315ResolveCombatWipe()){
    T={sig:"",order:[],index:0,aiBusy:false,pendingHero:false};
    return;
  }
  /* On appelle le renderer 2.14 intact. */
  if(typeof window.__dc214RenderCombat==="function"){
    window.__dc214RenderCombat();
  }else if(typeof window.renderDungeonCombatRound==="function" && window.renderDungeonCombatRound!==render){
    window.renderDungeonCombatRound();
  }
  document.querySelectorAll(".dungeonTimelineTitle157,#dungeonTimeline156,#dc301Timeline").forEach(e=>e.remove());
  document.querySelectorAll("#dungeonCombatSetupView .dungeonTimeline156").forEach(e=>{
    if(e.id!=="dc302Timeline")e.remove();
  });
  applyTurnUi();
  const cur=current();
  if(cur?.kind==="enemy"&&!T.pendingHero&&!resultOpen())runAi();
}
window.__dc302RenderCombat=render;

/* Le runtime 2.00 doit appeler cette couche, mais on conserve __dc214RenderCombat intact. */
window.renderDungeonCombatRound=render;

/* Les actions héros consomment le tour uniquement après fermeture du résultat. */
["dungeonCombatAttack","dungeonCombatBasicAttack","dungeonCombatUseActiveTalent","dungeonCombatUseItem061","dungeonCombatUseItemAbility316"].forEach(name=>{
  const base=window[name];if(typeof base!=="function")return;
  window[name]=function(heroId){
    const cur=current();
    if(cur&&!(cur.kind==="hero"&&String(cur.id)===String(heroId))){
      alert("Ce n'est pas le tour de ce héros.");
      return;
    }
    T.pendingHero=true;
    const r=base.apply(this,arguments);

    /* action refusée / pas de popup = ne consomme pas le tour */
    setTimeout(()=>{
      if(!resultOpen()){
        T.pendingHero=false;
        render();
      }
    },0);
    return r;
  };
});

function flushHero(){
  if(!T.pendingHero||resultOpen())return;
  T.pendingHero=false;
  advance();
}

if(typeof window.closeAttackRoll==="function"){
  const b=window.closeAttackRoll;
  window.closeAttackRoll=function(){
    const r=b.apply(this,arguments);
    setTimeout(flushHero,0);
    return r;
  };
}
if(typeof window.closeSpecialRoll==="function"){
  const b=window.closeSpecialRoll;
  window.closeSpecialRoll=function(){
    const r=b.apply(this,arguments);
    setTimeout(flushHero,0);
    return r;
  };
}
if(typeof window.closeEffectPopup==="function"){
  const b=window.closeEffectPopup;
  window.closeEffectPopup=function(){
    const r=b.apply(this,arguments);
    setTimeout(flushHero,0);
    return r;
  };
}

/* L'ancien moteur de timeline/IA reste explicitement inactif. */
try{
  if(window.dungeonTurn156){
    dungeonTurn156.active=false;
    dungeonTurn156.aiBusy=false;
  }
  if(typeof window.dungeonRunAi156==="function")window.dungeonRunAi156=function(){};
  if(typeof window.dungeonAdvanceTurn156==="function")window.dungeonAdvanceTurn156=function(){};
}catch(e){}


window.dungeonDebug303=function(){
  return {
    actor:current(),
    order:T.order,
    pendingHero:T.pendingHero,
    aiBusy:T.aiBusy,
    resultOpen:resultOpen()
  };
};

try{
  const b=document.querySelector(".dc01Badge");if(b)b.textContent="NOUVEAU MOTEUR · CORE 3.06";
  const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core 3.06 · rollback 2.14 + timeline réparée.";
}catch(e){}
})();
