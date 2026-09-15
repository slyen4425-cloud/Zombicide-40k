/* GenSrpG V16.78.111 — tactical/runtime corrections after V110.
   Keeps expensive RPG stat derivation outside the hot combat loop.
   - Stable Dungeon+tactical wall texture sizing at every zoom.
   - Removes creator/runtime launcher tabs while an actual Dungeon board/combat is visible.
   - Restores a persistent fixed Attack / End turn / Ability dock.
   - Preserves weapon dice count through the V2 adapter and resolves all attack dice in one action.
   - Rebuilds hero attacks once when a battle is created so canonical equipment/stat scaling is authoritative.
   - Detects every hero in the current room, after movement and after ambush/reinforcement spawns. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalRuntimeFixes1678111=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.111";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const WALL_SIZE="cover";
  const STYLE_ID="gensRpgTacticalRuntimeFixes1678111Style";
  const DOCK_ATTR="data-v111-dock";
  const MAX_ATTACK_DICE=12;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let installed=false,observer=null,clickBound=false,adapterHooked=false,rulesHooked=false,detectionHooked=false,maintenanceQueued=false;
  let lastDetectionStamp="",lastDetectionAt=0;

  function doc(rt=R){return rt?.document||null}
  function engine(rt=R){return rt?.GensRpgTacticalCombatV2||null}
  function adapter(rt=R){return rt?.GensRpgTacticalCombatV2Adapter||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}

  function attackDice(attack){
    const direct=num(attack?.meta?.dice??attack?.dice,NaN);
    if(Number.isFinite(direct))return clamp(Math.max(1,Math.round(direct)),1,MAX_ATTACK_DICE);
    for(const tag of arr(attack?.tags)){const m=str(tag).match(/^dice:(\d+)$/i);if(m)return clamp(Number(m[1]),1,MAX_ATTACK_DICE)}
    return 1;
  }
  function preserveDiceTag(attack){
    if(!attack||typeof attack!=="object")return attack;
    const dice=attackDice(attack),tags=arr(attack.tags).filter(x=>!/^dice:\d+$/i.test(str(x)));
    tags.push("dice:"+dice);attack.tags=tags;attack.dice=dice;
    attack.meta=attack.meta&&typeof attack.meta==="object"?attack.meta:{};attack.meta.dice=dice;
    return attack;
  }
  function refreshBattleAttacks(rt=R,battle=currentBattle(rt)){
    const A=adapter(rt);if(!battle?.actors||typeof A?.heroAttacks!=="function")return 0;let count=0;
    for(const actor of battle.actors){if(actor?.side!=="hero")continue;const id=str(actor?.meta?.heroId||actor.id);if(!id)continue;
      try{const attacks=arr(A.heroAttacks(rt,id)).map(preserveDiceTag);if(attacks.length){actor.attacks=attacks;rt?.GensRpgTacticalPolish1678109?.normalizeActorRanges?.(actor);count++}}catch(e){}
    }
    try{rt?.GensRpgTacticalStats1678110?.decorateBattle?.(rt,battle)}catch(e){}
    return count;
  }
  function hookAdapter(rt=R){
    if(adapterHooked)return true;const A=adapter(rt);if(!A?.createBattle)return false;
    if(typeof A.heroAttacks==="function"&&!A.heroAttacks.__gensRpg111Dice){const old=A.heroAttacks;const wrapped=function(){return arr(old.apply(this,arguments)).map(preserveDiceTag)};wrapped.__gensRpg111Dice=true;wrapped.__original=old;A.heroAttacks=wrapped}
    if(!A.createBattle.__gensRpg111Refresh){const old=A.createBattle;const wrapped=function(){const b=old.apply(this,arguments);refreshBattleAttacks(rt,b);return b};wrapped.__gensRpg111Refresh=true;wrapped.__original=old;A.createBattle=wrapped}
    adapterHooked=true;return true;
  }

  function nextRandom(state){if(!state?.rngSeed)return Math.random();let t=state.rngSeed=(state.rngSeed+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}
  function displayRoll(engineRoll,state){return state?.config?.rollHighToHit!==false?101-engineRoll:engineRoll}
  function hookMultiDice(rt=R){
    if(rulesHooked)return true;const E=engine(rt);if(!E?.resolveAttack||!E?.attackPreview||!E?.currentActor||!E?.actorById)return false;
    if(E.resolveAttack.__gensRpg111MultiDice){rulesHooked=true;return true}
    const oldResolve=E.resolveAttack;
    const wrapped=function(state,attackerId,targetId,attackId,forcedRoll=null){
      const cur=E.currentActor(state),attack=cur?.attacks?.find(a=>str(a.id)===str(attackId))||cur?.attacks?.[0],dice=attackDice(attack);
      if(dice<=1)return oldResolve.apply(this,arguments);
      if(state?.status!=="active")return {ok:false,reason:"battle-ended"};if(!cur||cur.id!==str(attackerId))return {ok:false,reason:"not-current-actor"};if(num(cur.actionsLeft,0)<1)return {ok:false,reason:"no-action"};
      const p=E.attackPreview(state,attackerId,targetId,attackId);if(!p?.ok)return p;const target=E.actorById(state,targetId);if(!target)return {ok:false,reason:"actor-missing"};
      const forced=Array.isArray(forcedRoll)?forcedRoll:[forcedRoll],rolls=[],rollsDisplay=[],critRolls=[];let hits=0,crits=0,damage=0;
      for(let i=0;i<dice;i++){
        const r=forced[i]!=null?clamp(Math.trunc(num(forced[i],100)),1,100):Math.floor(nextRandom(state)*100)+1;rolls.push(r);rollsDisplay.push(displayRoll(r,state));
        if(r>p.hitChance)continue;hits++;let one=Math.max(0,num(p.damage,0)),crit=false,critRoll=null;
        const critChance=clamp(num(p.critChance,0),0,100),critMult=clamp(num(p.critMultiplier,2),1,5);
        if(one>0&&critChance>0){critRoll=Math.floor(nextRandom(state)*100)+1;crit=critRoll<=critChance;if(crit){crits++;one=Math.max(0,Math.round(one*critMult))}}
        critRolls.push(critRoll);damage+=one;
      }
      if(damage>0){target.hp=clamp(num(target.hp)-damage,0,num(target.maxHp,1));if(target.hp<=0)target.alive=false}
      cur.actionsLeft=Math.max(0,num(cur.actionsLeft,0)-Math.max(1,num(p.attack?.actionCost,1)));
      const result={ok:true,hit:hits>0,roll:rolls[0],rolls,rollsDisplay,dice,hits,crits,crit:crits>0,critRolls,hitChance:p.hitChance,damage,damagePerHit:Math.max(0,num(p.damage,0)),targetHp:target.hp,targetDefeated:!target.alive,attackId:p.attack.id,attackerId:cur.id,targetId:target.id,cellCover:p.cellCover||0,totalCover:p.totalCover||0,damageType:p.damageType||p.attack?.damageType||"physical",resistance:p.resistance||0,critChance:p.critChance||0,critMultiplier:p.critMultiplier||2};
      state.log?.push?.({type:"attack",...result});E.refreshOutcome?.(state);return result;
    };
    wrapped.__gensRpg111MultiDice=true;wrapped.__original=oldResolve;E.resolveAttack=wrapped;rulesHooked=true;return true;
  }

  function runtimeState(rt=R){try{return rt?.loadDungeonState?.()||rt?.GensRpgTacticalPolish1678108?.runtimeState?.(rt)||null}catch(e){return null}}
  function roomOfHero(state,id){const v=state?.heroRooms?.[id];return v==null?num(state?.room,0):num(v,0)}
  function heroCells(state){const room=num(state?.room,0),out=[];for(const id of arr(state?.participants)){if(roomOfHero(state,id)!==room)continue;const cell=num(state?.positions?.[id],-1);if(cell>=0)out.push({id:str(id),cell})}return out}
  function enemyRange(rt,enemy){
    let def=null,d={};try{def=rt?.activeEnemyDefinition?.(enemy?.enemyId)||null}catch(e){}try{d=rt?.dungeonEnemyDerivedForInstance?.(enemy)||{}}catch(e){}
    let range=Math.max(1,num(enemy?.vision??enemy?.detectionRange??d?.vision??d?.sight??d?.detectionRange??def?.rule?.vision??def?.rule?.sight,1));
    try{const skills=arr(rt?.dungeonEnemyAttackSkills?.(def));if(skills.length){for(const sk of skills){const p=rt?.dungeonEnemyAttackProfile?.(def,sk)||{};range=Math.max(range,num(p?.range??sk?.range,1))}}else range=Math.max(range,num(def?.rule?.range,1))}catch(e){range=Math.max(range,num(def?.rule?.range,1))}
    return clamp(Math.round(range),1,12);
  }
  function detectionEnemyIds(rt=R,state=runtimeState(rt),enemies=null){
    if(!state?.last?.map)return [];const heroes=heroCells(state);if(!heroes.length)return [];let list=enemies;try{if(!Array.isArray(list))list=arr(rt?.loadActiveEnemies?.())}catch(e){list=[]}
    const room=num(state?.room,0),enemyCells=state?.enemyCells||{},gridDistance=rt?.GensRpgTacticalPolish1678108?.gridDistance;
    if(typeof gridDistance!=="function")return [];
    return arr(list).filter(enemy=>{
      if(num(enemy?.hp,0)<=0||enemy?.removed||enemy?.defeated)return false;if(enemy?.dungeonRoom!=null&&num(enemy.dungeonRoom,room)!==room)return false;
      const cell=num(enemyCells[str(enemy?.id)],num(enemy?.dungeonCell200??enemy?.dungeonCell104,-1));if(cell<0)return false;const radius=enemyRange(rt,enemy);
      return heroes.some(h=>gridDistance(state.last.map,h.cell,cell,radius)<=radius);
    }).map(x=>str(x.id)).filter(Boolean);
  }
  function scanDetection(rt=R,reason="detection-v111"){
    if(currentBattle(rt))return [];const state=runtimeState(rt);if(!state)return [];const ids=detectionEnemyIds(rt,state);if(!ids.length)return [];
    const heroes=heroCells(state).map(x=>x.id+"@"+x.cell).join(","),stamp=[num(state.room,0),heroes,...ids.slice().sort()].join(":");const now=Date.now();if(stamp===lastDetectionStamp&&now-lastDetectionAt<700)return [];
    lastDetectionStamp=stamp;lastDetectionAt=now;try{rt?.dc200StartCombat?.(ids,reason)}catch(e){try{rt?.console?.warn?.("V16.78.111 detection",e)}catch(_){}}return ids;
  }
  function scheduleDetection(rt=R,reason="detection-v111"){if(typeof setTimeout==="function")setTimeout(()=>scanDetection(rt,reason),0);else scanDetection(rt,reason)}
  function wrapDetectionFunction(rt,name,reason){const old=rt?.[name];if(typeof old!=="function"||old.__gensRpg111Detection)return false;const wrapped=function(){const out=old.apply(this,arguments);scheduleDetection(rt,reason);return out};wrapped.__gensRpg111Detection=true;wrapped.__original=old;rt[name]=wrapped;return true}
  function hookDetection(rt=R){
    wrapDetectionFunction(rt,"dungeonMoveHero098","movement-detection-v111");wrapDetectionFunction(rt,"applyDungeonTurnEvent","event-detection-v111");
    const core=rt?.DungeonCore01;if(core)for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__gensRpg111Detection)continue;const wrapped=function(){const out=old.apply(this,arguments);scheduleDetection(rt,"room-detection-v111");return out};wrapped.__gensRpg111Detection=true;wrapped.__original=old;core[name]=wrapped}
    detectionHooked=true;return true;
  }

  function ensureStyle(rt=R){const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
    .gtv2109QuickAttack,.gtv2110Dock{display:none!important}
    .gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell{background-image:url("${WALL_ASSET}")!important;background-size:${WALL_SIZE}!important;background-position:center!important;background-repeat:no-repeat!important}
    .gtv2111Dock{position:fixed;left:50%;bottom:calc(7px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:31850;width:min(94vw,520px);display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:7px;background:#0d121bf2;border:1px solid #48566a;border-radius:14px;box-shadow:0 10px 32px #000c;backdrop-filter:blur(8px)}
    .gtv2111Dock.hasAbility{grid-template-columns:1fr 1fr 1fr}.gtv2111Dock button{min-height:48px;border:0;border-radius:10px;font-weight:900;color:#fff;background:#303946;font-size:14px}.gtv2111Dock .attack{background:#286b48}.gtv2111Dock .ability{background:#604d86}.gtv2111Dock button:disabled{opacity:.42}.gtv2Overlay{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))!important}
    .gtv2111DiceRow{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:8px 0}.gtv2111DiceRow .gtv2Die{width:62px;height:62px;font-size:26px}
    @media(max-width:430px){.gtv2111Dock{width:calc(100vw - 12px);gap:5px;padding:6px}.gtv2111Dock button{font-size:12px;min-height:45px;padding:6px}.gtv2111DiceRow .gtv2Die{width:54px;height:54px;font-size:23px}}
  `;(D.head||D.documentElement||D.body)?.appendChild(s);return true}
  function paintWalls(rt=R){const D=doc(rt);if(!D)return 0;let count=0;const targets=[];for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell"]){for(const el of D.querySelectorAll?.(sel)||[])if(!targets.includes(el))targets.push(el)}
    const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];for(let i=0;i<cells.length;i++)if(str(kinds[i]).toLowerCase()==="wall"&&!targets.includes(cells[i]))targets.push(cells[i]);
    for(const el of targets){if(!el?.style?.setProperty)continue;el.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");el.style.setProperty("background-size",WALL_SIZE,"important");el.style.setProperty("background-position","center","important");el.style.setProperty("background-repeat","no-repeat","important");count++}return count}
  function visible(el,rt=R){if(!el)return false;try{const cs=rt?.getComputedStyle?.(el);if(cs&&(cs.display==="none"||cs.visibility==="hidden"))return false;const r=el.getBoundingClientRect?.();return !r||(r.width>0&&r.height>0)}catch(e){return true}}
  function runtimeVisible(rt=R){const D=doc(rt);if(!D)return false;if(D.querySelector?.(".gtv2Overlay"))return true;return visible(D.getElementById?.("dc047RoomBoard"),rt)&&!!D.querySelector?.("#dc047RoomBoard .dc047Grid")}
  const TAB_SELECTORS=["#drc100Launcher","#drv167826Toggle","#dzc167824Launch","#drr167822Panel","[data-drc100-launcher]"];
  function hideRuntimeTabs(rt=R){const D=doc(rt);if(!D)return 0;const hide=runtimeVisible(rt);let n=0;for(const sel of TAB_SELECTORS)for(const el of D.querySelectorAll?.(sel)||[]){if(hide){if(!el.hasAttribute?.("data-v111-hidden-tab")){el.setAttribute?.("data-v111-hidden-tab","1");el.style?.setProperty?.("display","none","important")}n++}else if(el.hasAttribute?.("data-v111-hidden-tab")){el.style?.removeProperty?.("display");el.removeAttribute?.("data-v111-hidden-tab")}}return n}

  function sourceButton(rt,kind){const D=doc(rt);if(!D)return null;if(kind==="attack")return D.querySelector?.(".gtv2Overlay [data-v108-attack-go]")||D.querySelector?.(".gtv2Overlay .gtv2Actions button[data-attack]");if(kind==="end")return D.querySelector?.(".gtv2Overlay .gtv2Actions button[data-end]");if(kind==="ability")return D.querySelector?.(".gtv2Overlay [data-v110-ability-go],.gtv2Overlay [data-v108-ability-go]");return null}
  function ensureDock(rt=R){const D=doc(rt),b=currentBattle(rt),E=engine(rt),cur=b&&E?.currentActor?.(b);if(!D||!b||!D.body){D?.querySelector?.("["+DOCK_ATTR+"]")?.remove?.();return false}let dock=D.querySelector?.("["+DOCK_ATTR+"]");if(!dock){dock=D.createElement("div");dock.className="gtv2111Dock";dock.setAttribute(DOCK_ATTR,"1");dock.innerHTML='<button type="button" class="attack" data-v111-attack>⚔️ Attaquer</button><button type="button" data-v111-end>⏭️ Fin du tour</button><button type="button" class="ability" data-v111-ability>✨ Capacité</button>';D.body.appendChild(dock)}
    const heroTurn=b.status==="active"&&cur?.side==="hero",atk=sourceButton(rt,"attack"),end=sourceButton(rt,"end"),ability=sourceButton(rt,"ability"),a=dock.querySelector?.("[data-v111-attack]"),e=dock.querySelector?.("[data-v111-end]"),ab=dock.querySelector?.("[data-v111-ability]");dock.style.display=heroTurn?"grid":"none";if(a)a.disabled=!heroTurn||!atk||!!atk.disabled;if(e)e.disabled=!heroTurn||!end||!!end.disabled;if(ab){ab.style.display=ability?"":"none";ab.disabled=!ability||!!ability.disabled}dock.classList?.toggle?.("hasAbility",!!ability);return true}
  function paintDiceOverlay(rt=R){return false}
  function bindClicks(rt=R){if(clickBound)return true;const D=doc(rt);if(!D?.addEventListener)return false;D.addEventListener("click",ev=>{const b=ev.target?.closest?.("button");if(!b)return;if(b.hasAttribute?.("data-v111-attack")){const s=sourceButton(rt,"attack");if(s&&!s.disabled)s.click?.()}else if(b.hasAttribute?.("data-v111-end")){const s=sourceButton(rt,"end");if(s&&!s.disabled)s.click?.()}else if(b.hasAttribute?.("data-v111-ability")){const s=sourceButton(rt,"ability");if(s&&!s.disabled)s.click?.()}},true);clickBound=true;return true}
  function maintain(rt=R){maintenanceQueued=false;hideRuntimeTabs(rt);ensureDock(rt);paintDiceOverlay(rt);return true}
  function queueMaintain(rt=R){if(maintenanceQueued)return;maintenanceQueued=true;if(typeof requestAnimationFrame==="function")requestAnimationFrame(()=>maintain(rt));else setTimeout(()=>maintain(rt),0)}
  function observe(rt=R){const D=doc(rt);if(!D?.body||typeof MutationObserver==="undefined")return false;if(observer)return true;observer=new MutationObserver(()=>queueMaintain(rt));observer.observe(D.body,{childList:true,subtree:true});return true}

  function install(rt=R){ensureStyle(rt);hookAdapter(rt);hookMultiDice(rt);bindClicks(rt);const b=currentBattle(rt);if(b)refreshBattleAttacks(rt,b);maintain(rt);try{rt.GENS_RPG_TACTICAL_RUNTIME_FIXES_VERSION=APP_VERSION}catch(e){}installed=!!(adapterHooked&&rulesHooked);return installed}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,WALL_SIZE,MAX_ATTACK_DICE,attackDice,preserveDiceTag,refreshBattleAttacks,hookAdapter,hookMultiDice,runtimeState,heroCells,enemyRange,detectionEnemyIds,scanDetection,hookDetection,paintWalls,hideRuntimeTabs,ensureDock,paintDiceOverlay,install,installWithRetries,status:()=>({installed,adapterHooked,rulesHooked,detectionHooked})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
