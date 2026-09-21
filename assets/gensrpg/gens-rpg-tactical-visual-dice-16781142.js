/* GenSrpG V16.78.114.11 — browser-profiled tactical D100/session authority.
   Keeps V114.1 engagement, V113 room/sub-room scope, V114.4 recovery and V114.7 canonical stats.
   V114.9 removes the global body observer which could recursively mutate the tactical overlay.
   Walls are emitted once by the base Tactical UI/Dungeon map renderer; this module never repaints them.
   V114.11 reconnects canonical melee raw-damage bonuses and the Core 3.17 configurable armor-zero floor. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalVisualDice16781142=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="2.3.0",APP_VERSION="16.78.114.11";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const WRONG_WALL_ASSET="assets/dungeon/creatures/dungeon_wall.png";
  const STYLE_ID="gensRpgTacticalVisualDice167811411Style";
  const ESCAPE_KEY="gensrpg_tactical_menu_escape_until_v1";
  const ESCAPE_MS=5000,TRANSITION_MS=420,DICE_WATCHDOG_MS=0;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,hitPatched=false,menuBound=false,uiOpenPatched=false,transitionCount=0;

  function doc(rt=R){return rt?.document||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function engine(rt=R){return rt?.GensRpgTacticalCombatV2||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function runtimeState(rt=R){
    try{const raw=rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2"),x=raw?JSON.parse(raw):null;if(x&&typeof x==="object")return x}catch(e){}
    try{return rt?.loadDungeonState?.()||null}catch(e){return null}
  }

  function ensureStyle(rt=R){
    const D=doc(rt);if(!D)return false;
    for(const id of ["gensRpgTacticalVisualDice16781142Style","gensRpgTacticalVisualDice16781143Style","gensRpgTacticalVisualDice16781148Style","gensRpgTacticalVisualDice167811410Style"])D.getElementById?.(id)?.remove?.();
    if(D.getElementById?.(STYLE_ID))return true;
    const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv2113DiceRow,.gtv21143FastDiceHost{display:none!important}
      .gtv21149Transition{position:fixed;inset:0;z-index:40050;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at center,#4f1717aa,#05070bea 66%);animation:gtv21149TransitionFade ${TRANSITION_MS}ms ease-out both}
      .gtv21149TransitionCard{text-align:center;padding:18px 25px;border:1px solid #a44d45;border-radius:18px;background:#120d12e8;box-shadow:0 18px 55px #000d;animation:gtv21149TransitionCard ${TRANSITION_MS}ms cubic-bezier(.2,.8,.25,1) both}
      .gtv21149TransitionTitle{font-size:13px;font-weight:900;letter-spacing:.13em;color:#f09b8f}.gtv21149TransitionMain{font-size:27px;font-weight:1000;margin-top:5px;color:#fff}
      @keyframes gtv21149TransitionFade{0%{opacity:0}18%{opacity:1}72%{opacity:1}100%{opacity:0}}@keyframes gtv21149TransitionCard{0%{transform:scale(.86);opacity:0}25%{transform:scale(1.03);opacity:1}55%{transform:scale(1)}100%{transform:scale(.99);opacity:.94}}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }

  /* Compatibility facade: the base UI is the sole wall renderer in V114.9+. */
  function preloadWallBitmap(rt=R){try{return Promise.resolve(!!ui(rt)?.preloadWall?.())}catch(e){return Promise.resolve(false)}}
  function wallTargets(rt=R){const D=doc(rt);if(!D)return [];return [...(D.querySelectorAll?.(".gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell")||[])]}
  function styleWallTile(img){return img||null}
  function attachWallTile(rt=R,el=null){try{return !!ui(rt)?.ensureWallTile?.(el)}catch(e){return false}}
  function stabilizeWalls(rt=R){try{return num(ui(rt)?.paintLiveWalls?.(),0)}catch(e){return 0}}
  function patchDungeonMapHtml(rt=R){try{return !!ui(rt)?.patchDungeonMapHtml?.()}catch(e){return false}}
  function patchRenderHooks(){return false}
  function observeWalls(){return false}

  function thresholdForChance(hitChance,high=true){const chance=clamp(Math.round(num(hitChance,50)),1,99);return high?101-chance:chance}
  function displayHit(roll,hitChance,high=true){const r=clamp(Math.round(num(roll,1)),1,100),t=thresholdForChance(hitChance,high);return high?r>=t:r<=t}
  function forcedToDisplay(value,high=true){const r=clamp(Math.round(num(value,1)),1,100);return high?101-r:r}
  function nextRandom(state){if(!state?.rngSeed)return Math.random();let t=state.rngSeed=(state.rngSeed+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}
  function attackDice(rt,attack){try{const fn=rt?.GensRpgTacticalRuntimeFixes1678111?.attackDice;if(typeof fn==="function")return clamp(Math.round(num(fn(attack),1)),1,12)}catch(e){}for(const tag of arr(attack?.tags)){const m=str(tag).match(/^dice:(\d+)$/i);if(m)return clamp(Number(m[1]),1,12)}return clamp(Math.round(num(attack?.meta?.dice??attack?.dice,1)),1,12)}

  function hitCalculation(preview,target,attack,high=true){
    const baseHit=clamp(Math.round(num(attack?.hit,preview?.hitChance??50)),1,100);
    const defensePenalty=Math.max(0,Math.round(num(target?.defense,0)));
    const dodgePenalty=Math.max(0,Math.round(num(target?.dodge,0)));
    const lineCoverPenalty=Math.max(0,Math.round(num(preview?.los?.cover,0)));
    const cellCoverPenalty=Math.max(0,Math.round(num(preview?.cellCover,0)));
    const rawChance=baseHit-defensePenalty-dodgePenalty-lineCoverPenalty-cellCoverPenalty;
    const listedChance=clamp(rawChance,5,95);
    const finalChance=clamp(Math.round(num(preview?.hitChance,listedChance)),5,95);
    const otherModifier=finalChance-listedChance;
    const hitOrigin=attack?.meta?.hitBreakdown||null;return {baseHit,defensePenalty,dodgePenalty,lineCoverPenalty,cellCoverPenalty,rawChance,listedChance,otherModifier,finalChance,high:high!==false,threshold:thresholdForChance(finalChance,high!==false),clampMin:5,clampMax:95,...(hitOrigin?{hitOrigin}:{})};
  }

  function physicalType(value){
    try{if(typeof R?.DungeonCore317?.isPhysicalDamageType==="function")return !!R.DungeonCore317.isPhysicalDamageType(value)}catch(e){}
    const t=norm(value||"physical");return !/(magic|magique|spell|sort|fire|feu|water|eau|earth|terre|air|wind|vent|light|lumi|shadow|ombre|electric|elect|lightning|foudre|ice|glace|frost|givre|poison|venin|acid|acide|holy|sacre|dark|void)/.test(t);
  }
  function attackMode(attack){const tags=arr(attack?.tags).map(norm);if(tags.includes("melee"))return "melee";if(tags.includes("ranged"))return "ranged";if(tags.includes("magic"))return "magic";return num(attack?.maxRange??attack?.range,1)<=1?"melee":"ranged"}
  function canonicalDamageBonus(attacker,attack,preview){
    const d=attacker?.meta?.rpgStats?.derived||{},type=str(preview?.damageType||attack?.damageType||"physical"),mode=attackMode(attack);
    if(physicalType(type)&&mode==="melee")return Math.max(0,num(d.physicalDamageBonus,0));
    if(!physicalType(type)&&mode==="magic")return Math.max(0,num(d.magicDamageBonus,0));
    return 0;
  }
  function armorRules(rt=R){try{return rt?.loadDungeonRpgRules?.()||{}}catch(e){return {}}}
  function resolvePhysicalDamage(rt=R,state=null,attacker=null,target=null,attack=null,preview=null,forcedArmorRoll=null){
    const attackPower=Math.max(0,num(attack?.power,preview?.rawDamage??preview?.damage??0));
    const statDamageBonus=canonicalDamageBonus(attacker,attack,preview);
    const embeddedStatDamageBonus=attackMode(attack)==="melee"?Math.max(0,num(attack?.meta?.rpgDamageBonus,0)):0;
    const baseWeaponDamage=Math.max(0,attackPower-embeddedStatDamageBonus);
    const rawDamage=Math.max(0,Math.round(baseWeaponDamage+statDamageBonus));
    const armor=attack?.ignoreArmor?0:Math.max(0,num(preview?.armor,target?.armor??0));
    const rules=armorRules(rt),armorZeroBlockChance=clamp(num(rules?.armorZeroBlockChance,75),0,100);
    let armorRoll=null,damage=Math.max(0,rawDamage-armor),armorBlocked=false,armorFloorTriggered=false;
    if(rawDamage>0&&damage<=0){
      armorFloorTriggered=true;armorRoll=Number.isFinite(Number(forcedArmorRoll))?Number(forcedArmorRoll):Math.floor(nextRandom(state)*100);
      try{if(typeof rt?.DungeonCore317?.resolveArmorFloor==="function")damage=Math.max(0,num(rt.DungeonCore317.resolveArmorFloor(rawDamage,armor,1,"physical",rules,armorRoll),0));else damage=armorRoll<armorZeroBlockChance?0:1}catch(e){damage=armorRoll<armorZeroBlockChance?0:1}
      armorBlocked=damage<=0;
    }
    return {baseWeaponDamage,statDamageBonus,embeddedStatDamageBonus,rawDamage,armor,damage,armorZeroBlockChance,armorRoll,armorBlocked,armorFloorTriggered};
  }
  function resolveDamagePerHit(rt=R,state=null,attacker=null,target=null,attack=null,preview=null,forcedArmorRoll=null){
    const type=str(preview?.damageType||attack?.damageType||"physical");
    if(physicalType(type))return {...resolvePhysicalDamage(rt,state,attacker,target,attack,preview,forcedArmorRoll),damageType:"physical"};
    return {baseWeaponDamage:Math.max(0,num(attack?.power,preview?.rawDamage??preview?.damage??0)),statDamageBonus:0,rawDamage:Math.max(0,num(preview?.rawDamage??attack?.power,preview?.damage??0)),armor:0,damage:Math.max(0,num(preview?.damage,0)),armorZeroBlockChance:0,armorRoll:null,armorBlocked:false,armorFloorTriggered:false,damageType:type};
  }
  function damageCalculationFormula(result){
    if(!result?.hit)return "Aucun dégât : attaque ratée.";
    const base=Math.max(0,num(result.baseWeaponDamage,result.rawDamage??result.damagePerHit??0)),bonus=num(result.statDamageBonus,0),raw=Math.max(0,Math.round(base+bonus)),armor=Math.max(0,num(result.armor,0)),perHit=Math.max(0,num(result.damagePerHit,result.damage??0)),hits=Math.max(1,Math.round(num(result.hits,1))),total=Math.max(0,num(result.damage,perHit*hits));
    const left=bonus?`Puissance arme ${base} + bonus stat ${bonus} = ${raw} brut`:`Puissance arme ${base} = ${raw} brut`;
    let out=left;if(str(result.damageType||"physical")==="physical"&&armor>0)out+=` − armure ${armor}`;out+=` = ${perHit} dégât(s) par touche`;
    if(hits>1)out+=` ; ${hits} touche(s) = ${total} dégâts infligés`;else out+=` ; ${total} dégât(s) infligé(s)`;
    if(result.armorFloorTriggered)out+=result.armorBlocked?" ; blocage d’armure réussi":" ; plancher d’armure : 1 dégât minimum";
    return out+".";
  }

  function patchHitResolver(rt=R){
    const E=engine(rt);if(!E?.attackPreview||!E?.currentActor||!E?.actorById||!E?.refreshOutcome)return false;
    if(E.resolveAttack?.__gensRpg11411Damage){hitPatched=true;return true}
    const previous=E.resolveAttack;
    const resolve=function(state,attackerId,targetId,attackId,forcedRoll=null){
      if(state?.status!=="active")return {ok:false,reason:"battle-ended"};
      const cur=E.currentActor(state);if(!cur||cur.id!==str(attackerId))return {ok:false,reason:"not-current-actor"};if(num(cur.actionsLeft,0)<1)return {ok:false,reason:"no-action"};
      const p=E.attackPreview(state,attackerId,targetId,attackId);if(!p?.ok)return p;
      const target=E.actorById(state,targetId);if(!target)return {ok:false,reason:"actor-missing"};
      const attack=p.attack||cur.attacks?.find(a=>str(a.id)===str(attackId))||cur.attacks?.[0];
      const high=state?.config?.rollHighToHit!==false,calculation=hitCalculation(p,target,attack,high),dice=attackDice(rt,attack),forced=Array.isArray(forcedRoll)?forcedRoll:[forcedRoll],rolls=[],hitsRoll=[],critRolls=[],damageRolls=[];let hits=0,crits=0,damage=0;
      for(let i=0;i<dice;i++){
        const shown=forced[i]!=null?forcedToDisplay(forced[i],high):Math.floor(nextRandom(state)*100)+1;
        rolls.push(shown);const ok=displayHit(shown,calculation.finalChance,high);hitsRoll.push(ok);if(!ok){critRolls.push(null);damageRolls.push(null);continue}hits++;
        const damageInfo=resolveDamagePerHit(rt,state,cur,target,attack,p);let one=Math.max(0,num(damageInfo.damage,0)),critRoll=null;const critChance=clamp(num(p.critChance,0),0,100),critMult=clamp(num(p.critMultiplier,2),1,5);
        if(one>0&&critChance>0){critRoll=Math.floor(nextRandom(state)*100)+1;if(critRoll<=critChance){crits++;one=Math.max(0,Math.round(one*critMult))}}
        critRolls.push(critRoll);damageRolls.push({...damageInfo,finalDamage:one,crit:critRoll!=null&&critRoll<=critChance});damage+=one;
      }
      if(damage>0){target.hp=clamp(num(target.hp)-damage,0,num(target.maxHp,1));if(target.hp<=0)target.alive=false}
      cur.actionsLeft=Math.max(0,num(cur.actionsLeft,0)-Math.max(1,num(attack?.actionCost,1)));
      const firstDamage=damageRolls.find(Boolean)||resolveDamagePerHit(rt,state,cur,target,attack,p,0);
      const result={ok:true,hit:hits>0,roll:rolls[0],rolls,rollsDisplay:rolls.slice(),hitsRoll,dice,hits,crits,crit:crits>0,critRolls,damageRolls,rollHighToHit:high,hitTarget:calculation.threshold,hitChance:calculation.finalChance,hitCalculation:calculation,damage,damagePerHit:Math.max(0,num(firstDamage.damage,0)),targetHp:target.hp,targetDefeated:!target.alive,attackId:attack?.id||str(attackId),attackerId:cur.id,targetId:target.id,cellCover:calculation.cellCoverPenalty,totalCover:calculation.lineCoverPenalty+calculation.cellCoverPenalty,damageType:firstDamage.damageType||p.damageType||attack?.damageType||"physical",resistance:p.resistance||0,resistanceKind:p.resistanceKind||"",baseWeaponDamage:firstDamage.baseWeaponDamage,statDamageBonus:firstDamage.statDamageBonus,rawDamage:firstDamage.rawDamage,armor:firstDamage.armor,armorZeroBlockChance:firstDamage.armorZeroBlockChance,armorRoll:firstDamage.armorRoll,armorBlocked:firstDamage.armorBlocked,armorFloorTriggered:firstDamage.armorFloorTriggered,distance:num(p.distance,0),cover:calculation.lineCoverPenalty+calculation.cellCoverPenalty,targetDefense:calculation.defensePenalty,targetDodge:calculation.dodgePenalty,baseHit:calculation.baseHit,critChance:p.critChance||0,critMultiplier:p.critMultiplier||2};
      state.log?.push?.({type:"attack",...result});E.refreshOutcome(state);return result;
    };
    resolve.__gensRpg11411Damage=true;resolve.__gensRpg11410DirectD100=true;resolve.__gensRpg1149DirectD100=true;resolve.__gensRpg1148DirectD100=true;resolve.__original=previous;E.resolveAttack=resolve;hitPatched=true;return true;
  }

  function diceInfo(rt=R){
    const row=[...arr(currentBattle(rt)?.log)].reverse().find(x=>x?.type==="attack")||{},high=row.rollHighToHit!==false,threshold=num(row.hitTarget,thresholdForChance(row.hitChance,high)),rolls=arr(row.rollsDisplay).length?arr(row.rollsDisplay):[row.roll].filter(v=>v!=null);
    return {rolls:rolls.map(v=>clamp(Math.round(num(v,1)),1,100)),threshold,high,calculation:row.hitCalculation||null};
  }

  function showCombatTransition(rt=R,options={}){
    const D=doc(rt);if(!D?.body)return false;D.querySelector?.("[data-v1149-transition]")?.remove?.();
    const auto=/auto-engage|ambush|vision|detect|rep[eé]r/i.test(str(options?.reason)),el=D.createElement("div");el.className="gtv21149Transition";el.setAttribute("data-v1149-transition","1");
    el.innerHTML=`<div class="gtv21149TransitionCard"><div class="gtv21149TransitionTitle">${auto?"⚠️ ENNEMI REPÉRÉ":"⚔️ COMBAT"}</div><div class="gtv21149TransitionMain">ENGAGEMENT</div></div>`;
    D.body.appendChild(el);transitionCount++;if(typeof setTimeout==="function")setTimeout(()=>el.remove?.(),TRANSITION_MS+40);return true;
  }
  function decorateCombatUi(rt=R){
    const D=doc(rt),b=D?.querySelector?.(".gtv2Overlay .gtv2Top [data-close],.gtv2Overlay .gtv2Top [data-v1143-menu]");if(!b)return false;let changed=false;
    if(b.hasAttribute?.("data-close")){b.removeAttribute("data-close");changed=true}
    if(b.getAttribute?.("data-v1143-menu")!=="1"){b.setAttribute("data-v1143-menu","1");changed=true}
    if(b.textContent!=="🏠 Retour menu"){b.textContent="🏠 Retour menu";changed=true}
    if(b.classList?.contains?.("danger")){b.classList.remove("danger");changed=true}
    if(!b.classList?.contains?.("warn")){b.classList.add("warn");changed=true}
    return changed;
  }

  function escapeUntil(rt=R){let v=num(rt?.__gensTacticalMenuEscapeUntil,0);try{v=Math.max(v,num(rt?.sessionStorage?.getItem?.(ESCAPE_KEY),0))}catch(e){}return v}
  function emergencyActive(rt=R){return Date.now()<escapeUntil(rt)}
  function setEmergencyEscape(rt=R,ms=ESCAPE_MS){const until=Date.now()+Math.max(1000,num(ms,ESCAPE_MS));try{rt.__gensTacticalMenuEscapeUntil=until}catch(e){}try{rt?.sessionStorage?.setItem?.(ESCAPE_KEY,String(until))}catch(e){}return until}
  function guardCombatStart(rt=R){const old=rt?.dc200StartCombat;if(typeof old!=="function")return false;if(old.__gensRpg1143MenuGuard)return true;const wrapped=function(){if(emergencyActive(rt))return {ok:false,reason:"menu-escape-v1143"};return old.apply(this,arguments)};wrapped.__gensRpg1143MenuGuard=true;wrapped.__original=old;rt.dc200StartCombat=wrapped;return true}
  function visible(el,rt=R){if(!el)return false;try{const cs=rt?.getComputedStyle?.(el);if(cs&&(cs.display==="none"||cs.visibility==="hidden"))return false;const r=el.getBoundingClientRect?.();if(r&&r.width===0&&r.height===0)return false}catch(e){}return true}
  function clickMenuCandidate(rt=R){const D=doc(rt);if(!D)return false;const exact=new Set(["accueil","menu","menu principal","retour menu","retour au menu","retour a l accueil","retour à l accueil"]);for(const el of D.querySelectorAll?.("button,a,[role=button]")||[]){if(el.closest?.(".gtv2Overlay")||!visible(el,rt))continue;if(exact.has(norm(el.textContent))){try{el.click?.();return true}catch(e){}}}return false}
  function invokeMenuFunction(rt=R){for(const name of ["showHome","showMainMenu","openMainMenu","goHome","returnToMenu","backToMenu"]){const fn=rt?.[name];if(typeof fn!=="function")continue;try{fn.call(rt);return true}catch(e){}}return false}
  function returnToMenu(rt=R){setEmergencyEscape(rt);try{ui(rt)?.close?.(false)}catch(e){}const go=()=>{if(clickMenuCandidate(rt)||invokeMenuFunction(rt))return true;try{rt?.location?.reload?.();return true}catch(e){return false}};if(typeof setTimeout==="function")setTimeout(go,30);else go();return true}
  function bindMenu(rt=R){const D=doc(rt);if(!D?.addEventListener||menuBound)return !!D;D.addEventListener("click",ev=>{const b=ev?.target?.closest?.("[data-v1143-menu]");if(!b)return;try{ev.preventDefault?.();ev.stopPropagation?.();ev.stopImmediatePropagation?.()}catch(e){}returnToMenu(rt)},true);menuBound=true;return true}
  function patchUiOpen(rt=R){
    const U=ui(rt);if(!U)return false;let patched=false;
    for(const name of ["openCurrentEncounter","open"]){const fn=U[name];if(typeof fn!=="function"||fn.__gensRpg1149Transition)continue;const old=fn;const wrapped=function(){const opts=name==="open"?(arguments[1]||arguments[0]||{}):(arguments[0]||{});showCombatTransition(rt,opts);const out=old.apply(this,arguments);decorateCombatUi(rt);return out};wrapped.__gensRpg1149Transition=true;wrapped.__gensRpg1148Transition=true;wrapped.__original=old;U[name]=wrapped;patched=true}
    uiOpenPatched=patched||uiOpenPatched;return uiOpenPatched;
  }

  function install(rt=R){
    ensureStyle(rt);preloadWallBitmap(rt);patchDungeonMapHtml(rt);patchHitResolver(rt);patchUiOpen(rt);bindMenu(rt);guardCombatStart(rt);decorateCombatUi(rt);
    try{rt.GENS_RPG_TACTICAL_VISUAL_DICE_VERSION=APP_VERSION}catch(e){}installed=true;return true;
  }
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,WRONG_WALL_ASSET,ESCAPE_MS,TRANSITION_MS,DICE_WATCHDOG_MS,runtimeState,preloadWallBitmap,wallTargets,styleWallTile,attachWallTile,stabilizeWalls,patchDungeonMapHtml,patchRenderHooks,observeWalls,thresholdForChance,displayHit,forcedToDisplay,attackDice,hitCalculation,physicalType,attackMode,canonicalDamageBonus,armorRules,resolvePhysicalDamage,resolveDamagePerHit,damageCalculationFormula,patchHitResolver,diceInfo,showCombatTransition,decorateCombatUi,emergencyActive,setEmergencyEscape,guardCombatStart,returnToMenu,patchUiOpen,install,installWithRetries,status:()=>({installed,observer:false,uiRenderPatched:false,mapPatched:false,corePatched:false,hitPatched,menuBound,uiOpenPatched,transitionCount})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});