/* GenSrpG V16.78.114.8 — final D100 hit authority + stable wall bitmap layer.
   Keeps V114.1 engagement, V113 room/sub-room scope, V114.4 session recovery and V114.7 canonical stats.
   - D100 success is evaluated from the visible roll and visible threshold, once, here.
   - The exact Builder wall texture is rendered as a real decoded IMG layer, so old CSS background repaints cannot flash white on zoom.
   - The existing short V114.7 dice presentation remains the only dice animation.
   - Exploration -> combat transition and emergency Retour menu are preserved. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalVisualDice16781142=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="2.0.1",APP_VERSION="16.78.114.8";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const WRONG_WALL_ASSET="assets/dungeon/creatures/dungeon_wall.png";
  const STYLE_ID="gensRpgTacticalVisualDice16781148Style";
  const ESCAPE_KEY="gensrpg_tactical_menu_escape_until_v1";
  const ESCAPE_MS=5000,TRANSITION_MS=520,DICE_WATCHDOG_MS=0;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,observer=null,uiRenderPatched=false,mapPatched=false,corePatched=false,hitPatched=false,menuBound=false,uiOpenPatched=false,transitionCount=0,wallImagePromise=null;

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
    for(const id of ["gensRpgTacticalVisualDice16781142Style","gensRpgTacticalVisualDice16781143Style"])D.getElementById?.(id)?.remove?.();
    if(D.getElementById?.(STYLE_ID))return true;
    const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv21148StableWall{position:relative!important;overflow:hidden!important;isolation:isolate!important;background-color:#171512!important;-webkit-backface-visibility:hidden!important;backface-visibility:hidden!important;transform:translateZ(0)}
      .gtv21148StableWall>.gtv21148WallTile{display:block!important;visibility:visible!important;opacity:1!important;position:absolute!important;inset:-1px!important;width:calc(100% + 2px)!important;height:calc(100% + 2px)!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center!important;pointer-events:none!important;user-select:none!important;z-index:0!important;background:#171512!important;-webkit-backface-visibility:hidden!important;backface-visibility:hidden!important;transform:translateZ(0)!important;contain:paint!important}
      .gtv21148StableWall>*:not(.gtv21148WallTile){visibility:hidden!important}
      .gtv21148StableWall::before,.gtv21148StableWall::after,.gtv2Cell.blocked.cover::after{content:none!important;display:none!important}
      .gtv2113DiceRow{display:none!important}
      .gtv21143FastDiceHost{display:none!important}
      .gtv21148Transition{position:fixed;inset:0;z-index:40050;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at center,#4f1717aa,#05070bea 66%);animation:gtv21148TransitionFade ${TRANSITION_MS}ms ease-out both}
      .gtv21148TransitionCard{text-align:center;padding:20px 28px;border:1px solid #a44d45;border-radius:18px;background:#120d12e8;box-shadow:0 18px 55px #000d;animation:gtv21148TransitionCard ${TRANSITION_MS}ms cubic-bezier(.2,.8,.25,1) both}
      .gtv21148TransitionTitle{font-size:13px;font-weight:900;letter-spacing:.13em;color:#f09b8f}.gtv21148TransitionMain{font-size:27px;font-weight:1000;margin-top:5px;color:#fff}
      @keyframes gtv21148TransitionFade{0%{opacity:0}16%{opacity:1}74%{opacity:1}100%{opacity:0}}@keyframes gtv21148TransitionCard{0%{transform:scale(.82);opacity:0}22%{transform:scale(1.04);opacity:1}48%{transform:scale(1)}100%{transform:scale(.98);opacity:.92}}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }

  function preloadWallBitmap(rt=R){
    if(wallImagePromise)return wallImagePromise;
    const ImageCtor=rt?.Image;if(typeof ImageCtor!=="function")return wallImagePromise=Promise.resolve(false);
    wallImagePromise=new Promise(resolve=>{try{const im=new ImageCtor();im.decoding="sync";im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=WALL_ASSET;if(typeof im.decode==="function")im.decode().then(()=>resolve(true)).catch(()=>{})}catch(e){resolve(false)}});return wallImagePromise;
  }
  function wallTargets(rt=R){
    const D=doc(rt),out=[];if(!D)return out;
    for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell","#dc047RoomBoard .gtv2112WallCell","#dc047RoomBoard .gtv2113Wall"]){for(const el of D.querySelectorAll?.(sel)||[])if(!out.includes(el))out.push(el)}
    const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];
    for(let i=0;i<cells.length;i++)if(norm(kinds[i])==="wall"&&!out.includes(cells[i]))out.push(cells[i]);
    return out;
  }
  function styleWallTile(img){if(!img?.style?.setProperty)return img;for(const [p,v] of [["display","block"],["visibility","visible"],["opacity","1"],["position","absolute"],["inset","-1px"],["width","calc(100% + 2px)"],["height","calc(100% + 2px)"],["object-fit","cover"],["object-position","center"],["pointer-events","none"],["z-index","0"],["background","#171512"]])img.style.setProperty(p,v,"important");return img}
  function attachWallTile(rt=R,el=null){
    const D=doc(rt);if(!D||!el)return false;el.classList?.add?.("gtv21148StableWall");
    const existing=el.querySelector?.(":scope > .gtv21148WallTile");if(existing){styleWallTile(existing);return true}
    const img=D.createElement("img");img.className="gtv21148WallTile";img.src=WALL_ASSET;img.alt="";img.draggable=false;img.setAttribute?.("aria-hidden","true");img.setAttribute?.("decoding","sync");img.setAttribute?.("fetchpriority","high");styleWallTile(img);
    try{el.prepend?.(img)}catch(e){try{el.insertBefore?.(img,el.firstChild||null)}catch(_){return false}}return true;
  }
  function stabilizeWalls(rt=R){ensureStyle(rt);preloadWallBitmap(rt);let n=0;for(const el of wallTargets(rt))if(attachWallTile(rt,el))n++;return n}

  function patchDungeonMapHtml(rt=R){
    const old=rt?.dungeonMapHtml;if(typeof old!=="function")return false;if(old.__gensRpg1148StableWall){mapPatched=true;return true}
    const wrapped=function(map){const html=old.apply(this,arguments),D=doc(rt);if(typeof html!=="string"||!html||!D)return html;try{const tpl=D.createElement("template");tpl.innerHTML=html;const cells=[...tpl.content.querySelectorAll(".dc047Grid > .dc047Cell")],kinds=arr(map?.cells);for(let i=0;i<cells.length;i++){const wall=norm(kinds[i])==="wall"||cells[i].classList.contains("dav167870WallCell")||cells[i].classList.contains("gtv2112WallCell")||cells[i].classList.contains("gtv2113Wall");if(!wall)continue;cells[i].classList.add("gtv21148StableWall");const img=D.createElement("img");img.className="gtv21148WallTile";img.src=WALL_ASSET;img.alt="";img.draggable=false;img.setAttribute("aria-hidden","true");img.setAttribute("decoding","sync");img.setAttribute("fetchpriority","high");styleWallTile(img);cells[i].prepend(img)}return tpl.innerHTML}catch(e){return html}};
    wrapped.__gensRpg1148StableWall=true;wrapped.__original=old;rt.dungeonMapHtml=wrapped;mapPatched=true;return true;
  }
  function patchRenderHooks(rt=R){
    const U=ui(rt);if(U&&typeof U.render==="function"&&!U.render.__gensRpg1148StableWall){const old=U.render;const wrapped=function(){const out=old.apply(this,arguments);stabilizeWalls(rt);decorateCombatUi(rt);return out};wrapped.__gensRpg1148StableWall=true;wrapped.__original=old;U.render=wrapped;uiRenderPatched=true}else if(U?.render?.__gensRpg1148StableWall)uiRenderPatched=true;
    const core=rt?.DungeonCore01;if(core)for(const name of ["render","show"]){const fn=core[name];if(typeof fn!=="function"||fn.__gensRpg1148StableWall)continue;const old=fn;const wrapped=function(){patchDungeonMapHtml(rt);const out=old.apply(this,arguments);stabilizeWalls(rt);return out};wrapped.__gensRpg1148StableWall=true;wrapped.__original=old;core[name]=wrapped;corePatched=true}
    return uiRenderPatched||corePatched;
  }
  function observeWalls(rt=R){const D=doc(rt);if(observer||!D?.body||typeof rt?.MutationObserver!=="function")return !!observer;observer=new rt.MutationObserver(()=>{stabilizeWalls(rt);decorateCombatUi(rt)});observer.observe(D.body,{childList:true,subtree:true});return true}

  function thresholdForChance(hitChance,high=true){const chance=clamp(Math.round(num(hitChance,50)),1,99);return high?101-chance:chance}
  function displayHit(roll,hitChance,high=true){const r=clamp(Math.round(num(roll,1)),1,100),t=thresholdForChance(hitChance,high);return high?r>=t:r<=t}
  function forcedToDisplay(value,high=true){const r=clamp(Math.round(num(value,1)),1,100);return high?101-r:r}
  function nextRandom(state){if(!state?.rngSeed)return Math.random();let t=state.rngSeed=(state.rngSeed+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}
  function attackDice(rt,attack){try{const fn=rt?.GensRpgTacticalRuntimeFixes1678111?.attackDice;if(typeof fn==="function")return clamp(Math.round(num(fn(attack),1)),1,12)}catch(e){}for(const tag of arr(attack?.tags)){const m=str(tag).match(/^dice:(\d+)$/i);if(m)return clamp(Number(m[1]),1,12)}return clamp(Math.round(num(attack?.meta?.dice??attack?.dice,1)),1,12)}
  function patchHitResolver(rt=R){
    const E=engine(rt);if(!E?.attackPreview||!E?.currentActor||!E?.actorById||!E?.refreshOutcome)return false;if(E.resolveAttack?.__gensRpg1148DirectD100){hitPatched=true;return true}
    const previous=E.resolveAttack;
    const resolve=function(state,attackerId,targetId,attackId,forcedRoll=null){
      if(state?.status!=="active")return {ok:false,reason:"battle-ended"};const cur=E.currentActor(state);if(!cur||cur.id!==str(attackerId))return {ok:false,reason:"not-current-actor"};if(num(cur.actionsLeft,0)<1)return {ok:false,reason:"no-action"};
      const p=E.attackPreview(state,attackerId,targetId,attackId);if(!p?.ok)return p;const target=E.actorById(state,targetId);if(!target)return {ok:false,reason:"actor-missing"};const attack=p.attack||cur.attacks?.find(a=>str(a.id)===str(attackId))||cur.attacks?.[0];
      const high=state?.config?.rollHighToHit!==false,threshold=thresholdForChance(p.hitChance,high),dice=attackDice(rt,attack),forced=Array.isArray(forcedRoll)?forcedRoll:[forcedRoll],rolls=[],hitsRoll=[],critRolls=[];let hits=0,crits=0,damage=0;
      for(let i=0;i<dice;i++){
        const shown=forced[i]!=null?forcedToDisplay(forced[i],high):Math.floor(nextRandom(state)*100)+1;rolls.push(shown);const ok=displayHit(shown,p.hitChance,high);hitsRoll.push(ok);if(!ok){critRolls.push(null);continue}hits++;
        let one=Math.max(0,num(p.damage,0)),crit=false,critRoll=null;const critChance=clamp(num(p.critChance,0),0,100),critMult=clamp(num(p.critMultiplier,2),1,5);if(one>0&&critChance>0){critRoll=Math.floor(nextRandom(state)*100)+1;crit=critRoll<=critChance;if(crit){crits++;one=Math.max(0,Math.round(one*critMult))}}critRolls.push(critRoll);damage+=one;
      }
      if(damage>0){target.hp=clamp(num(target.hp)-damage,0,num(target.maxHp,1));if(target.hp<=0)target.alive=false}
      cur.actionsLeft=Math.max(0,num(cur.actionsLeft,0)-Math.max(1,num(attack?.actionCost,1)));
      const result={ok:true,hit:hits>0,roll:rolls[0],rolls,rollsDisplay:rolls.slice(),hitsRoll,dice,hits,crits,crit:crits>0,critRolls,rollHighToHit:high,hitTarget:threshold,hitChance:p.hitChance,damage,damagePerHit:Math.max(0,num(p.damage,0)),targetHp:target.hp,targetDefeated:!target.alive,attackId:attack?.id||str(attackId),attackerId:cur.id,targetId:target.id,cellCover:p.cellCover||0,totalCover:p.totalCover??p.los?.cover??0,damageType:p.damageType||attack?.damageType||"physical",resistance:p.resistance||0,resistanceKind:p.resistanceKind||"",rawDamage:num(p.rawDamage??attack?.power,p.damage??0),armor:num(p.armor,0),distance:num(p.distance,0),cover:num(p.los?.cover??p.totalCover,0),targetDefense:num(target?.defense,0),targetDodge:num(target?.dodge,0),baseHit:num(attack?.hit,p.hitChance),critChance:p.critChance||0,critMultiplier:p.critMultiplier||2};
      state.log?.push?.({type:"attack",...result});E.refreshOutcome(state);return result;
    };
    resolve.__gensRpg1148DirectD100=true;resolve.__original=previous;E.resolveAttack=resolve;hitPatched=true;return true;
  }

  function diceInfo(rt=R,card=null){const row=[...arr(currentBattle(rt)?.log)].reverse().find(x=>x?.type==="attack")||{},high=row.rollHighToHit!==false,threshold=num(row.hitTarget,thresholdForChance(row.hitChance,high)),rolls=arr(row.rollsDisplay).length?arr(row.rollsDisplay):[row.roll].filter(v=>v!=null);return {rolls:rolls.map(v=>clamp(Math.round(num(v,1)),1,100)),threshold,high}}

  function showCombatTransition(rt=R,options={}){const D=doc(rt);if(!D?.body)return false;D.querySelector?.("[data-v1148-transition]")?.remove?.();const auto=/auto-engage|ambush|vision|detect|rep[eé]r/i.test(str(options?.reason));const el=D.createElement("div");el.className="gtv21148Transition";el.setAttribute("data-v1148-transition","1");el.innerHTML=`<div class="gtv21148TransitionCard"><div class="gtv21148TransitionTitle">${auto?"⚠️ ENNEMI REPÉRÉ":"⚔️ COMBAT"}</div><div class="gtv21148TransitionMain">ENGAGEMENT</div></div>`;D.body.appendChild(el);transitionCount++;if(typeof setTimeout==="function")setTimeout(()=>el.remove?.(),TRANSITION_MS+40);return true}
  function decorateCombatUi(rt=R){const D=doc(rt),b=D?.querySelector?.(".gtv2Overlay .gtv2Top [data-close],.gtv2Overlay .gtv2Top [data-v1143-menu]");if(!b)return false;b.removeAttribute?.("data-close");b.setAttribute?.("data-v1143-menu","1");b.textContent="🏠 Retour menu";b.classList?.remove?.("danger");b.classList?.add?.("warn");return true}
  function escapeUntil(rt=R){let v=num(rt?.__gensTacticalMenuEscapeUntil,0);try{v=Math.max(v,num(rt?.sessionStorage?.getItem?.(ESCAPE_KEY),0))}catch(e){}return v}
  function emergencyActive(rt=R){return Date.now()<escapeUntil(rt)}
  function setEmergencyEscape(rt=R,ms=ESCAPE_MS){const until=Date.now()+Math.max(1000,num(ms,ESCAPE_MS));try{rt.__gensTacticalMenuEscapeUntil=until}catch(e){}try{rt?.sessionStorage?.setItem?.(ESCAPE_KEY,String(until))}catch(e){}return until}
  function guardCombatStart(rt=R){const old=rt?.dc200StartCombat;if(typeof old!=="function")return false;if(old.__gensRpg1143MenuGuard)return true;const wrapped=function(){if(emergencyActive(rt))return {ok:false,reason:"menu-escape-v1143"};return old.apply(this,arguments)};wrapped.__gensRpg1143MenuGuard=true;wrapped.__original=old;rt.dc200StartCombat=wrapped;return true}
  function visible(el,rt=R){if(!el)return false;try{const cs=rt?.getComputedStyle?.(el);if(cs&&(cs.display==="none"||cs.visibility==="hidden"))return false;const r=el.getBoundingClientRect?.();if(r&&r.width===0&&r.height===0)return false}catch(e){}return true}
  function clickMenuCandidate(rt=R){const D=doc(rt);if(!D)return false;const exact=new Set(["accueil","menu","menu principal","retour menu","retour au menu","retour a l accueil","retour à l accueil"]);for(const el of D.querySelectorAll?.("button,a,[role=button]")||[]){if(el.closest?.(".gtv2Overlay")||!visible(el,rt))continue;if(exact.has(norm(el.textContent))){try{el.click?.();return true}catch(e){}}}return false}
  function invokeMenuFunction(rt=R){for(const name of ["showHome","showMainMenu","openMainMenu","goHome","returnToMenu","backToMenu"]){const fn=rt?.[name];if(typeof fn!=="function")continue;try{fn.call(rt);return true}catch(e){}}return false}
  function returnToMenu(rt=R){setEmergencyEscape(rt);try{ui(rt)?.close?.(false)}catch(e){}const go=()=>{if(clickMenuCandidate(rt)||invokeMenuFunction(rt))return true;try{rt?.location?.reload?.();return true}catch(e){return false}};if(typeof setTimeout==="function")setTimeout(go,30);else go();return true}
  function bindMenu(rt=R){const D=doc(rt);if(!D?.addEventListener||menuBound)return !!D;D.addEventListener("click",ev=>{const b=ev?.target?.closest?.("[data-v1143-menu]");if(!b)return;try{ev.preventDefault?.();ev.stopPropagation?.();ev.stopImmediatePropagation?.()}catch(e){}returnToMenu(rt)},true);menuBound=true;return true}
  function patchUiOpen(rt=R){const U=ui(rt);if(!U)return false;let patched=false;for(const name of ["openCurrentEncounter","open"]){const fn=U[name];if(typeof fn!=="function"||fn.__gensRpg1148Transition)continue;const old=fn;const wrapped=function(){const opts=name==="open"?(arguments[1]||arguments[0]||{}):(arguments[0]||{});showCombatTransition(rt,opts);const out=old.apply(this,arguments);stabilizeWalls(rt);decorateCombatUi(rt);return out};wrapped.__gensRpg1148Transition=true;wrapped.__original=old;U[name]=wrapped;patched=true}uiOpenPatched=patched||uiOpenPatched;return uiOpenPatched}

  function install(rt=R){ensureStyle(rt);preloadWallBitmap(rt);patchDungeonMapHtml(rt);patchRenderHooks(rt);observeWalls(rt);patchHitResolver(rt);patchUiOpen(rt);bindMenu(rt);guardCombatStart(rt);stabilizeWalls(rt);decorateCombatUi(rt);try{rt.GENS_RPG_TACTICAL_VISUAL_DICE_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000,8000,11000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,WRONG_WALL_ASSET,ESCAPE_MS,TRANSITION_MS,DICE_WATCHDOG_MS,runtimeState,preloadWallBitmap,wallTargets,styleWallTile,attachWallTile,stabilizeWalls,patchDungeonMapHtml,patchRenderHooks,thresholdForChance,displayHit,forcedToDisplay,attackDice,patchHitResolver,diceInfo,showCombatTransition,decorateCombatUi,emergencyActive,setEmergencyEscape,guardCombatStart,returnToMenu,patchUiOpen,install,installWithRetries,status:()=>({installed,observer:!!observer,uiRenderPatched,mapPatched,corePatched,hitPatched,menuBound,uiOpenPatched,transitionCount})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});