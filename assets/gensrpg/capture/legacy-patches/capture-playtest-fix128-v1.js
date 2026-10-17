
/* ===== GenSrpG Capture - passe corrective playtest V16.128 ===== */
(function(){
  const oldProgress=captureCreatureProgressRules;
  captureCreatureProgressRules=function(){
    const r=oldProgress();
    if(r.starterLimit===undefined)r.starterLimit=1;
    if(r.dayHealPct===undefined)r.dayHealPct=10;
    if(r.healCenterCost===undefined)r.healCenterCost=10;
    return r;
  };

  window.captureSaveCreatureProgressRulesFromUi=(function(old){
    return function(){
      old();
      const r=captureCreatureProgressRules(),g=id=>document.getElementById(id);
      if(g("capProg_starters"))r.starterLimit=Math.max(1,Math.min(3,Number(g("capProg_starters").value)||1));
      if(g("capProg_dayheal"))r.dayHealPct=Math.max(0,Math.min(100,Number(g("capProg_dayheal").value)||10));
      if(g("capProg_healcost"))r.healCenterCost=Math.max(0,Number(g("capProg_healcost").value)||0);
      GensStorageV1.writeJson(localStorage,captureCreatureProgressRulesKey(),r);
    }
  })(captureSaveCreatureProgressRulesFromUi);

  window.captureLoadCreatureProgressRulesUi=(function(old){
    return function(){
      old(); const r=captureCreatureProgressRules(),set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
      set("capProg_starters",r.starterLimit);set("capProg_dayheal",r.dayHealPct);set("capProg_healcost",r.healCenterCost);
    }
  })(captureLoadCreatureProgressRulesUi);

  // Une seule instance persistante : le roster de combat reçoit les PV actuels et les stats calculées.
  window.captureTeamEntityRoster=function(heroId=captureActiveHeroId()){
    if(!heroId)return [];
    try{
      const st=ensureHeroCreatureState(loadState(heroId)),pool=loadSharedEntities();
      return (st.creatureTeam||[]).map(inst=>{
        const ent=pool.find(x=>String(x.id)===String(inst.entityId||inst.creatureId||""));if(!ent)return null;
        const d=captureCreatureDerivedStats(inst,ent);
        const max=Math.max(1,Number(d.maxHp)||Number(inst.maxHp)||Number(ent.hp)||10);
        inst.maxHp=max;
        if(inst.hp===undefined||inst.hp===null)inst.hp=max;
        inst.hp=Math.max(0,Math.min(max,Number(inst.hp)||0));
        return {...ent,hp:inst.hp,maxHp:max,level:Number(inst.level||ent.level)||1,
          stats:{...(ent.stats||{}),power:d.force,force:d.force,defense:d.defense,agility:d.agi,agilite:d.agi,speed:d.speed,spirit:d.spirit,esprit:d.spirit},
          _instance:inst};
      }).filter(Boolean);
    }catch(e){return[]}
  };

  window.gensCaptureBattleCreatureSnapshot=function(c){
    c=c||{}; const inst=c._instance||null;
    const maxHp=Math.max(1,Number(c.maxHp||inst?.maxHp||c.hp||10));
    const currentHp=inst?Math.max(0,Math.min(maxHp,Number(inst.hp??maxHp))):Math.max(0,Math.min(maxHp,Number(c.hp??maxHp)));
    const snap={
      instanceId:"bc_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),
      creatureId:String(c.id||""),name:String(c.name||"Créature"),level:Math.max(1,Number(c.level)||1),
      hp:currentHp,maxHp,mana:Math.max(0,Number(inst?.mana??c.mana??c.stats?.mana??c.dungeonStats?.mana)||0),
      ko:currentHp<=0,abilityIds:[...(c.abilityIds||[])],statuses:[],cooldowns:{...(inst?.cooldowns||{})},
      charges:{...(inst?.charges||{})},defended:false,
      initiative:Number(c.initiative??c.stats?.initiative??c.dungeonStats?.initiative??10)||10,
      speed:Number(c.speed??c.stats?.speed??c.stats?.agilite??c.dungeonStats?.agilite??0)||0,source:c
    };
    return snap;
  };

  // Charges par puissance en mode créature : attaques faibles nombreuses, attaques fortes rares.
  const oldUseRule=gensAbilityUseRule;
  window.gensAbilityUseRule=function(a){
    const r=oldUseRule(a);
    if(gensAbilityLibraryId(a)==="creature" && r.mode==="charges" && !(a?.useRuleOverride?.enabled)){
      const p=Math.max(0,Number(a.power)||Math.max(0,...(a.effects||[]).filter(e=>String(e.kind).toLowerCase()==="damage").map(e=>Number(e.base)||0)));
      const value=p<=3?20:p<=4?18:p<=5?15:p<=6?12:p<=7?10:p<=8?8:p<=10?5:4;
      return {...r,value};
    }
    return r;
  };

  window.captureBattlePersistPlayerHp=function(battle){
    const heroId=captureActiveHeroId();if(!heroId||!battle)return;
    const st=ensureHeroCreatureState(loadState(heroId)),all=[...(st.creatureTeam||[]),...(st.creatureReserve||[])];
    (battle.sides?.A?.creatures||[]).forEach(c=>{
      const uid=String(c.source?._instance?.uid||"");
      const inst=all.find(x=>String(x.uid)===uid);
      if(inst){
        inst.hp=Math.max(0,Number(c.hp)||0);inst.maxHp=Math.max(1,Number(c.maxHp)||1);
        inst.mana=Math.max(0,Number(c.mana)||0);inst.charges={...(c.charges||{})};inst.cooldowns={...(c.cooldowns||{})};
      }
    });
    saveHeroCreatureState(heroId,st);
  };

  // FX lisibles.
  window.captureBattleFx=function(kind,text,sub=""){
    const fx=document.getElementById("captureBattleFx");if(!fx)return;
    fx.className="captureBattleFx show "+kind;
    fx.innerHTML=`<div class="captureBattleFxMain">${z40kEscHtml(text)}</div>${sub?`<div class="captureBattleFxSub">${z40kEscHtml(sub)}</div>`:""}`;
    clearTimeout(window._captureFxTimer);
    window._captureFxTimer=setTimeout(()=>fx.classList.remove("show"),1900);
  };

  // Buff/debuff purs : impact renforcé automatiquement.
  const oldApply=captureBattleApplyAbility;
  window.captureBattleApplyAbility=function(battle,actor,ability,target){
    const pureUtility=(ability.effects||[]).length && !(ability.effects||[]).some(e=>String(e.kind||"").toLowerCase()==="damage");
    let cloned=ability;
    if(pureUtility){
      cloned={...ability,effects:(ability.effects||[]).map(e=>{
        const k=String(e.kind||"").toLowerCase();
        if(k==="buff"||k==="debuff"){
          const v=Number(e.value)||0;
          return {...e,value:Math.sign(v||1)*Math.max(8,Math.round(Math.abs(v)*3)),duration:Math.max(2,Number(e.duration)||2)};
        }
        return e;
      })};
    }
    const r=oldApply(battle,actor,cloned,target);
    if(r?.ok)captureBattlePersistPlayerHp(battle);
    return r;
  };

  // Intro de combat : aucune attaque avant action du joueur.
  window.captureStartBattleAutomatic=function(sideA,sideB,rules){
    rules=captureApplyBattleOverride({...rules});
    const b=gensCreateCaptureBattle(sideA,sideB,rules);
    if(!b){alert("Impossible de créer le combat.");return null}
    gensCaptureBattleInit(b);window.gensCurrentCaptureBattle=b;gensCaptureBattleStartTurn(b);
    b.awaitingStart=true;
    captureOpenModal("captureBattleLiveModal");captureRenderBattleLive(b);return b;
  };
  window.captureBattleBegin=function(){
    const b=window.gensCurrentCaptureBattle;if(!b)return;
    b.awaitingStart=false;captureRenderBattleLive(b);
    setTimeout(()=>captureBattleRunAiUntilHuman(b),700);
  };

  const oldRender=captureRenderBattleLive;
  window.captureRenderBattleLive=function(battle=window.gensCurrentCaptureBattle){
    oldRender(battle);
    const host=document.getElementById("captureBattleLiveBody");if(!host||!battle)return;
    if(battle.awaitingStart && battle.phase!=="ended"){
      const arena=host.querySelector(".captureArena");
      const rest=[...host.children].filter(x=>x!==host.querySelector("#captureBattleFx")&&x!==host.querySelector(".captureBattleTop")&&x!==arena);
      rest.forEach(x=>x.style.display="none");
      host.insertAdjacentHTML("beforeend",`<div class="captureBattleIntro"><strong>⚔️ Le combat va commencer</strong><span>Prends connaissance des adversaires avant le premier tour.</span><button class="startGameBtn" onclick="captureBattleBegin()">COMMENCER LE COMBAT</button></div>`);
    }
    // Fuite toujours explicite, jamais de fermeture sauvage.
    if(battle.phase!=="ended"&&!host.querySelector(".captureFleeBtn"))
      host.insertAdjacentHTML("beforeend",`<button class="captureFleeBtn" onclick="captureBattleFlee()">🏃 FUIR</button>`);
    // Clarifier les boutons de capacités.
    host.querySelectorAll(".captureMoveGrid button").forEach(btn=>{
      const id=(btn.getAttribute("onclick")||"").match(/captureBattleUseAbility\('([^']+)'/)?.[1];
      const ab=id?captureBattleAbilityById(id):null;if(!ab)return;
      const rule=gensAbilityUseRule(ab),actor=captureBattleCurrentActor(battle)?.creature;
      const remain=rule.mode==="charges"?(actor?.charges?.[ab.id]===undefined?rule.value:actor.charges[ab.id]):null;
      const span=btn.querySelector("span");
      if(span)span.textContent=`Puissance : ${Number(ab.power)||0} · Niveau requis : ${captureAbilityRequiredLevel(ab)}${rule.mode==="charges"?` · Charges : ${remain}/${rule.value}`:rule.mode==="mana"?` · Mana : ${rule.value}`:rule.mode==="cooldown"?` · Recharge : ${rule.value} tour(s)`:""}`;
    });
  };

  // IA plus lente pour laisser lire l'action adverse.
  window.captureBattleRunAiUntilHuman=function(battle){
    let guard=0;
    const step=()=>{
      if(!battle||battle.phase==="ended"||battle.awaitingStart||guard++>=20){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
      const a=captureBattleCurrentActor(battle);
      if(!a){captureRenderBattleLive(battle);return}
      if(a.sideKey==="A"){captureRenderBattleLive(battle);gensCaptureBattleSave(battle);return}
      const abilities=captureBattleAbilities(a.creature);
      const usable=abilities.filter(ab=>ab.id==="capture_basic_attack"||gensCaptureAbilityCanUse(a.creature,ab).ok);
      const ability=usable[Math.floor(Math.random()*usable.length)]||abilities[0];
      const target=captureBattleSelectDefaultTarget(battle,"B");
      const r=target&&ability?captureBattleApplyAbility(battle,a.creature,ability,target):null;
      captureRenderBattleLive(battle);
      if(r?.ok){
        const msg=r.crit?"COUP CRITIQUE !":(battle.lastFx?.ability||ability.name);
        captureBattleFx(r.crit?"crit":r.heal?"heal":"enemyhit",r.heal?("+"+r.heal+" PV"):("-"+r.damage+" PV"),msg);
      }
      gensCaptureBattleEvaluateVictory(battle);
      if(battle.phase==="ended"){setTimeout(()=>{captureRenderBattleLive(battle);gensCaptureBattleSave(battle)},1800);return}
      gensCaptureBattleEndTurn(battle);setTimeout(step,1800);
    };
    setTimeout(step,900);
  };

  window.captureBattleFlee=function(){
    const b=window.gensCurrentCaptureBattle;if(!b||b.phase==="ended")return;
    if(!confirm("Fuir ce combat ? Cette rencontre sera terminée et ne pourra pas être relancée."))return;
    captureBattlePersistPlayerHp(b);b.phase="ended";b.victory={winner:"B",reason:"flee"};b.fled=true;
    if(b.type==="wild")captureConsumeWildEncounter("flee");
    captureCloseModal("captureBattleLiveModal");window.gensCurrentCaptureBattle=null;renderCaptureWorldHub();
  };

  // Le centre de soins a un coût par défaut.
  window.captureHealingRule=function(){
    try{
      const p=getActiveGameProfile();ensureRpgProfileData(p);const cc=p.rpgUniverse?.captureCombat||{},pr=captureCreatureProgressRules();
      return {mode:cc.healMode||"paid",cost:Math.max(0,Number(cc.healCost??pr.healCenterCost??10)||0)};
    }catch(e){return {mode:"paid",cost:10}}
  };

  // Passage d'un jour = soin léger.
  window.captureHealTeamForNewDay=function(){
    const pct=Math.max(0,Number(captureCreatureProgressRules().dayHealPct)||0);if(!pct)return;
    captureParticipantIds().forEach(heroId=>{
      const st=ensureHeroCreatureState(loadState(heroId));
      [...(st.creatureTeam||[]),...(st.creatureReserve||[])].forEach(inst=>{
        const ent=creatureEntityForInstance(inst);if(!ent)return;
        const d=captureCreatureDerivedStats(inst,ent),max=Math.max(1,d.maxHp);
        inst.maxHp=max;inst.hp=Math.min(max,Math.max(0,Number(inst.hp)||0)+Math.max(1,Math.round(max*pct/100)));
      });
      saveHeroCreatureState(heroId,st);
    });
  };
  const oldNextDay=captureNextPlayerTurn;
  window.captureNextPlayerTurn=function(){
    const before=captureWorldState().day;oldNextDay();
    if(captureWorldState().day>before){captureHealTeamForNewDay();renderCaptureWorldHub()}
  };

  // Dresseurs : difficulté choisie et niveau proche de l'équipe.
  window.captureOpenTrainerBattle=function(){
    const playerRoster=captureTeamEntityRoster(),pool=loadSharedEntities().filter(x=>x.category==="creature");
    if(!playerRoster.length||!pool.length){alert("Équipe ou bestiaire indisponible.");return}
    const q=prompt("Difficulté du dresseur :\n1 = Facile\n2 = Équilibré\n3 = Difficile\n4 = Expert","2");
    if(q===null)return;
    const diff=Math.max(1,Math.min(4,Number(q)||2)),delta=[-3,0,3,6][diff-1];
    const avg=Math.max(1,Math.round(playerRoster.reduce((n,c)=>n+(Number(c.level)||1),0)/playerRoster.length));
    const auto=captureAutoTrainerRules(playerRoster),enemy=[];
    for(let i=0;i<auto.teamSize;i++){
      const base=pool[Math.floor(Math.random()*pool.length)],lvl=Math.max(1,avg+delta+Math.floor(Math.random()*3)-1);
      enemy.push({...base,level:lvl,hp:Math.max(1,Number(base.hp)||10)+Math.max(0,lvl-(Number(base.level)||1))*2});
    }
    const names=["Dresseur débutant","Dresseur rival","Dresseur confirmé","Dresseur expert"];
    captureStartBattleAutomatic({name:CHARS[captureActiveHeroId()]?.name||"Dresseur",roster:playerRoster,controller:"human"},
      {name:names[diff-1],roster:enemy,controller:"auto"},
      {type:"trainer",captureAllowed:false,activeSlots:auto.activeSlots,teamSize:auto.teamSize,minBattleTeam:1,maxBattleTeam:6,recallCost:"turn",controller:"auto"});
  };

  // Outils MJ ciblés.
  window.captureMjGiveGold=function(){
    const ids=captureParticipantIds();if(!ids.length)return;
    const who=ids.length===1?ids[0]:prompt("Dresseur :\n"+ids.map((id,i)=>(i+1)+" = "+captureTrainerName(id)).join("\n"),"1");
    const heroId=ids.length===1?ids[0]:ids[Math.max(0,Math.min(ids.length-1,(Number(who)||1)-1))];
    const amount=Number(prompt("Montant à ajouter (négatif pour retirer) :","50"));if(!Number.isFinite(amount))return;
    const st=loadState(heroId);st.gold=Math.max(0,(Number(st.gold)||0)+amount);localStorage.setItem(key(heroId),JSON.stringify(st));
    if(String(heroId)===String(current))state=st;renderCaptureWorldHub();
  };
  window.captureMjGiveItem=function(){
    const ids=captureParticipantIds();if(!ids.length)return;const heroId=ids[0],items=captureShopItems();
    const q=prompt("Objet :\n"+items.map((x,i)=>(i+1)+" = "+x.name).join("\n"),"1");if(q===null)return;
    const it=items[Math.max(0,Math.min(items.length-1,(Number(q)||1)-1))];if(!it)return;
    const qty=Math.max(1,Number(prompt("Quantité :","1"))||1),st=loadState(heroId);st.inventory=Array.isArray(st.inventory)?st.inventory:[];
    const f=st.inventory.find(x=>String(x.itemId||x.id)===String(it.id));if(f)f.qty=(Number(f.qty)||0)+qty;else st.inventory.push({itemId:it.id,id:it.id,name:it.name,type:it.type,desc:it.desc,qty});
    localStorage.setItem(key(heroId),JSON.stringify(st));if(String(heroId)===String(current))state=st;
  };

  // Fiche ennemie consultable.
  window.captureShowEnemyInfo=function(instanceId){
    const b=window.gensCurrentCaptureBattle,h=gensCaptureBattleCreature(b,instanceId);if(!h)return;
    const c=h.creature,d=captureCreatureDerivedStats(c.source?._instance||{},c.source||{});
    alert(`${c.name}\nNiveau ${c.level}\nPV ${c.hp}/${c.maxHp}\nPuissance ${d.force} · Défense ${d.defense}\nAgilité ${d.agi} · Vitesse ${d.speed} · Esprit ${d.spirit}\nType : ${(c.source?.elementTypes||[]).join(", ")||"—"}\nRésiste : ${(c.source?.elementResistances||[]).join(", ")||"—"}\nFaible : ${(c.source?.elementWeaknesses||[]).join(", ")||"—"}`);
  };

  // Starter configurable.
  const oldToggle=gensToggleCaptureStarter;
  window.gensToggleCaptureStarter=function(heroId,creatureId){
    const limit=Math.max(1,Math.min(3,Number(captureCreatureProgressRules().starterLimit)||1));
    const currentIds=gensCaptureStarterIdsForHero(heroId);
    if(!currentIds.includes(String(creatureId))&&currentIds.length>=limit){alert("Maximum "+limit+" créature"+(limit>1?"s":"")+" de départ.");return}
    oldToggle(heroId,creatureId);
  };

  // Injecte les réglages et commandes MJ dans les interfaces existantes.
  document.addEventListener("DOMContentLoaded",()=>{
    const grid=document.querySelector(".captureProgressRuleGrid");
    if(grid && !document.getElementById("capProg_starters")){
      grid.insertAdjacentHTML("beforeend",
        `<label>Créatures de départ max <input id="capProg_starters" type="number" min="1" max="3" value="1" onchange="captureSaveCreatureProgressRulesFromUi()"></label>
         <label>Soin au nouveau jour <input id="capProg_dayheal" type="number" min="0" max="100" step="5" value="10" onchange="captureSaveCreatureProgressRulesFromUi()"> %</label>
         <label>Coût soin au centre <input id="capProg_healcost" type="number" min="0" step="1" value="10" onchange="captureSaveCreatureProgressRulesFromUi()"></label>`);
    }
    const mj=document.querySelector("#captureMjModal .captureMjGrid");
    if(mj){
      mj.insertAdjacentHTML("beforeend",`<button onclick="captureMjGiveGold()">🪙 Donner / retirer de l'or</button><button onclick="captureMjGiveItem()">🎁 Donner un objet</button>`);
    }
    const modal=document.getElementById("captureBattleLiveModal");
    if(modal){
      modal.onclick=null;
      const close=modal.querySelector(".closeBtn");if(close)close.remove();
    }
  });

  // Correctif cartes ennemies / alliées après chaque rendu.
  const render2=window.captureRenderBattleLive;
  window.captureRenderBattleLive=function(battle=window.gensCurrentCaptureBattle){
    render2(battle);
    const host=document.getElementById("captureBattleLiveBody");if(!host||!battle)return;
    const cards=host.querySelectorAll(".captureFightMon");
    cards.forEach(card=>{
      const name=card.querySelector("strong")?.textContent||"";
      let found=null,side="";
      for(const k of ["A","B"]){found=(battle.sides?.[k]?.creatures||[]).find(c=>c.name===name);if(found){side=k;break}}
      if(!found)return;
      if(side==="B"){card.onclick=()=>captureShowEnemyInfo(found.instanceId);card.style.cursor="pointer"}
      else if(side==="A"&&!found.ko){card.onclick=()=>{const active=(battle.sides.A.active||[]).includes(found.instanceId);if(!active)captureBattleSwitchTo(found.instanceId)};card.style.cursor="pointer"}
    });
  };
})();
