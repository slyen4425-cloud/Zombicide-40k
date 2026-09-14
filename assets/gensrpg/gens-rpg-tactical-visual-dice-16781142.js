/* GenSrpG V16.78.114.3 — final tactical wall/dice/transition/menu authority.
   Keeps validated V114.1 enemy engagement and V113 room/sub-room scoping untouched.
   Fixes the remaining UI seams:
   - dng_wall_block.jpg is the only visible Dungeon wall asset, direct cover/center like Builder floors;
   - old V107/V113 repaint attempts using dungeon_wall.png are rewritten/intercepted;
   - tactical D100 uses the proven fast reel and reveals result only after the reel is finished;
   - exploration -> combat gets a short readable transition;
   - Quitter is replaced by an emergency Retour menu which suppresses immediate re-engagement. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalVisualDice16781142=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.1.0",APP_VERSION="16.78.114.3";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const WRONG_WALL_ASSET="assets/dungeon/creatures/dungeon_wall.png";
  const STYLE_ID="gensRpgTacticalVisualDice16781143Style";
  const OLD_STYLE_ID="gensRpgTacticalVisualDice16781142Style";
  const ESCAPE_KEY="gensrpg_tactical_menu_escape_until_v1";
  const ESCAPE_MS=5000,TRANSITION_MS=560,DICE_WATCHDOG_MS=780;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,observer=null,queued=false,diceAnimatePatched=false,styleSetPatched=false,uiPatched=false,menuBound=false,diceSeq=0,transitionCount=0;

  function doc(rt=R){return rt?.document||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function runtimeState(rt=R){
    try{const raw=rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2"),x=raw?JSON.parse(raw):null;if(x&&typeof x==="object")return x}catch(e){}
    try{return rt?.loadDungeonState?.()||null}catch(e){return null}
  }

  function ensureStyle(rt=R){
    const D=doc(rt);if(!D)return false;
    D.getElementById?.(OLD_STYLE_ID)?.remove?.();
    if(D.getElementById?.(STYLE_ID))return true;
    const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv2112WallCell::before,.gtv2Cell.blocked::before,#drc100Grid .drc100Cell.wall::before,#dc047RoomBoard .dav167870WallCell::before{content:none!important;display:none!important;background:none!important}
      .gtv2113Wall,.gtv2112WallCell,.gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell{background-image:url("${WALL_ASSET}")!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;color:transparent!important;text-shadow:none!important;font-size:0!important;filter:none!important}
      .gtv2Cell.blocked.cover::after,.gtv2113Wall::after,.gtv2112WallCell::after,#drc100Grid .drc100Cell.wall::after,#dc047RoomBoard .dav167870WallCell::after{content:none!important;display:none!important}
      .gtv2113Wall>*,.gtv2112WallCell>*,.gtv2Cell.blocked>*,#drc100Grid .drc100Cell.wall>*,#dc047RoomBoard .dav167870WallCell>*{visibility:hidden!important}
      .gtv2113DiceRow{display:none!important}
      .gtv2DiceCard>.gtv2Die{animation:none!important}
      .gtv21143FastDiceHost.gtv2Die{width:100%!important;height:auto!important;min-height:86px!important;margin:10px 0!important;border-radius:0!important;background:none!important;box-shadow:none!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;font-size:inherit!important;color:inherit!important}
      .gtv21143FastDiceHost.gtv2111DiceRow{margin:8px 0!important}
      .gtv21143FastDiceHost .rpgD100Target{display:none!important}
      .gtv21143FastDiceHost .rpgD100Card.success,.gtv21143FastDiceHost .rpgD100Card.fail{filter:none!important}
      .gtv2DiceCard.gtv21143Rolling .gtv2DiceRule strong,.gtv2DiceCard.gtv21143Rolling .gtv2DiceResult,.gtv2DiceCard.gtv21143Rolling .gtv2112Explain{visibility:hidden!important}
      .gtv21143Transition{position:fixed;inset:0;z-index:40050;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at center,#4f1717aa,#05070bea 66%);animation:gtv21143TransitionFade ${TRANSITION_MS}ms ease-out both}
      .gtv21143TransitionCard{text-align:center;padding:20px 28px;border:1px solid #a44d45;border-radius:18px;background:#120d12e8;box-shadow:0 18px 55px #000d;animation:gtv21143TransitionCard ${TRANSITION_MS}ms cubic-bezier(.2,.8,.25,1) both}
      .gtv21143TransitionTitle{font-size:13px;font-weight:900;letter-spacing:.13em;color:#f09b8f}.gtv21143TransitionMain{font-size:27px;font-weight:1000;margin-top:5px;color:#fff}
      @keyframes gtv21143TransitionFade{0%{opacity:0}16%{opacity:1}74%{opacity:1}100%{opacity:0}}@keyframes gtv21143TransitionCard{0%{transform:scale(.82);opacity:0}22%{transform:scale(1.04);opacity:1}48%{transform:scale(1)}100%{transform:scale(.98);opacity:.92}}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }

  function rewriteWrongWallStyles(rt=R){
    const D=doc(rt);if(!D)return 0;let changed=0;
    for(const s of D.querySelectorAll?.("style")||[]){
      let text=str(s.textContent);if(!text.includes("dungeon_wall.png"))continue;
      text=text.split("assets/dungeon/creatures/dungeon_wall.png").join(WALL_ASSET).split("dungeon_wall.png").join("dng_wall_block.jpg");
      if(s.id==="gensRpgTacticalRuntimeAuthority1678113Style")text=text.replace(/background-size\s*:\s*100%\s+100%/g,"background-size:cover");
      s.textContent=text;changed++;
    }
    return changed;
  }
  function patchStyleSetProperty(rt=R){
    const proto=rt?.CSSStyleDeclaration?.prototype;if(!proto||typeof proto.setProperty!=="function")return false;
    if(proto.setProperty.__gensRpg1143Wall){styleSetPatched=true;return true}
    const old=proto.setProperty;
    const wrapped=function(property,value,priority){
      let p=str(property),v=value;const low=p.toLowerCase();
      if((low==="background-image"||low==="background")&&str(v).includes("dungeon_wall.png"))v=str(v).split("assets/dungeon/creatures/dungeon_wall.png").join(WALL_ASSET).split("dungeon_wall.png").join("dng_wall_block.jpg");
      if(low==="background-size"&&/^100%\s+100%$/i.test(str(v).trim())){let bg="";try{bg=str(this.getPropertyValue?.("background-image")||this.backgroundImage)}catch(e){}if(bg.includes("dng_wall_block.jpg")||bg.includes("dungeon_wall.png"))v="cover"}
      return old.call(this,p,v,priority);
    };
    wrapped.__gensRpg1143Wall=true;wrapped.__original=old;proto.setProperty=wrapped;styleSetPatched=true;return true;
  }
  function wallTargets(rt=R){
    const D=doc(rt),out=[];if(!D)return out;
    for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell","#dc047RoomBoard .gtv2112WallCell","#dc047RoomBoard .gtv2113Wall"]){for(const el of D.querySelectorAll?.(sel)||[])if(!out.includes(el))out.push(el)}
    const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];
    for(let i=0;i<cells.length;i++){if(norm(kinds[i])!=="wall")continue;cells[i].classList?.add?.("gtv2112WallCell");if(!out.includes(cells[i]))out.push(cells[i])}
    return out;
  }
  function applyWallVisuals(rt=R){
    ensureStyle(rt);rewriteWrongWallStyles(rt);let count=0;
    for(const el of wallTargets(rt)){if(!el?.style?.setProperty)continue;el.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");el.style.setProperty("background-size","cover","important");el.style.setProperty("background-position","center","important");el.style.setProperty("background-repeat","no-repeat","important");el.style.setProperty("color","transparent","important");el.style.setProperty("text-shadow","none","important");el.style.setProperty("font-size","0","important");el.style.setProperty("filter","none","important");count++}
    return count;
  }

  function latestAttackRow(rt=R){const b=currentBattle(rt);return [...arr(b?.log)].reverse().find(x=>x?.type==="attack")||null}
  function diceInfo(rt=R,card=null){
    const row=latestAttackRow(rt),text=str(card?.querySelector?.(".gtv2DiceRule")?.textContent),m=text.match(/D100\s*(≥|>=|≤|<=)\s*(\d+)/),threshold=clamp(Math.round(num(m?.[2],50)),1,100),high=!m||m[1]==="≥"||m[1]===">=";
    let rolls=arr(row?.rollsDisplay).filter(v=>Number.isFinite(Number(v))).map(v=>clamp(Math.round(num(v,1)),1,100));
    if(!rolls.length){const strong=card?.querySelector?.(".gtv2DiceRule strong")?.textContent,one=Number.isFinite(Number(strong))?Number(strong):num(row?.roll,1);rolls=[clamp(Math.round(one),1,100)]}
    return {rolls,threshold,high};
  }
  function runFastDice(rt=R,card=null,host=null){
    const perf=rt?.GensMobileCombatPerformance16781022,fast=perf?.animateRpgDiceFast;if(typeof fast!=="function"||!card||!host)return null;
    card.setAttribute?.("data-v113-dice","blocked-v1143");card.classList?.add?.("gtv21143Rolling");host.classList?.add?.("gtv21143FastDiceHost","gtv2111DiceRow");if(!host.id)host.id="gtv21143DiceHost"+(++diceSeq);
    const info=diceInfo(rt,card);return new Promise(resolve=>{
      let done=false,watchdog=null;const finish=ok=>{if(done)return;done=true;if(watchdog!=null&&typeof clearTimeout==="function")clearTimeout(watchdog);card.classList?.remove?.("gtv21143Rolling");resolve(ok!==false)};
      try{const started=fast.call(rt,host.id,info.rolls.length,info.rolls,info.threshold,100,()=>finish(true));if(started===false){finish(false);return}}catch(e){finish(false);return}
      if(typeof setTimeout==="function")watchdog=setTimeout(()=>finish(true),DICE_WATCHDOG_MS);
    });
  }
  function patchTacticalDiceAnimate(rt=R){
    const proto=rt?.Element?.prototype||rt?.HTMLElement?.prototype;if(!proto||typeof proto.animate!=="function")return false;
    if(proto.animate.__gensRpg1143FastDice){diceAnimatePatched=true;return true}
    let old=proto.animate;while(old?.__gensRpg1142SurvivalDice&&typeof old.__original==="function")old=old.__original;
    const wrapped=function(){
      try{
        if(this?.matches?.(".gtv2DiceCard > .gtv2Die[data-die]")){
          const card=this.closest?.(".gtv2DiceCard"),perf=rt?.GensMobileCombatPerformance16781022;
          if(card&&typeof perf?.animateRpgDiceFast==="function"){const finished=runFastDice(rt,card,this);if(finished)return {finished}}
        }
      }catch(e){}
      return old.apply(this,arguments);
    };
    wrapped.__gensRpg1143FastDice=true;wrapped.__original=old;proto.animate=wrapped;diceAnimatePatched=true;return true;
  }
  function cleanupLegacyDice(rt=R){const D=doc(rt);if(!D)return 0;let n=0;for(const row of D.querySelectorAll?.(".gtv2113DiceRow")||[]){row.remove?.();n++}for(const c of D.querySelectorAll?.(".gtv2DiceCard.gtv21142Rolling")||[])c.classList?.remove?.("gtv21142Rolling");return n}

  function showCombatTransition(rt=R,options={}){
    const D=doc(rt);if(!D?.body)return false;D.querySelector?.("[data-v1143-transition]")?.remove?.();const auto=/auto-engage|ambush|vision|detect|rep[eé]r/i.test(str(options?.reason));const el=D.createElement("div");el.className="gtv21143Transition";el.setAttribute("data-v1143-transition","1");el.innerHTML=`<div class="gtv21143TransitionCard"><div class="gtv21143TransitionTitle">${auto?"⚠️ ENNEMI REPÉRÉ":"⚔️ COMBAT"}</div><div class="gtv21143TransitionMain">ENGAGEMENT</div></div>`;D.body.appendChild(el);transitionCount++;if(typeof setTimeout==="function")setTimeout(()=>el.remove?.(),TRANSITION_MS+40);return true;
  }
  function decorateCombatUi(rt=R){const D=doc(rt),b=D?.querySelector?.(".gtv2Overlay .gtv2Top [data-close],.gtv2Overlay .gtv2Top [data-v1143-menu]");if(!b)return false;b.removeAttribute?.("data-close");b.setAttribute?.("data-v1143-menu","1");b.textContent="🏠 Retour menu";b.classList?.remove?.("danger");b.classList?.add?.("warn");return true}

  function escapeUntil(rt=R){let v=num(rt?.__gensTacticalMenuEscapeUntil,0);try{v=Math.max(v,num(rt?.sessionStorage?.getItem?.(ESCAPE_KEY),0))}catch(e){}return v}
  function emergencyActive(rt=R){return Date.now()<escapeUntil(rt)}
  function setEmergencyEscape(rt=R,ms=ESCAPE_MS){const until=Date.now()+Math.max(1000,num(ms,ESCAPE_MS));try{rt.__gensTacticalMenuEscapeUntil=until}catch(e){}try{rt?.sessionStorage?.setItem?.(ESCAPE_KEY,String(until))}catch(e){}return until}
  function guardCombatStart(rt=R){
    const old=rt?.dc200StartCombat;if(typeof old!=="function")return false;if(old.__gensRpg1143MenuGuard)return true;
    const wrapped=function(){if(emergencyActive(rt))return {ok:false,reason:"menu-escape-v1143"};return old.apply(this,arguments)};wrapped.__gensRpg1143MenuGuard=true;wrapped.__original=old;rt.dc200StartCombat=wrapped;return true;
  }
  function visible(el,rt=R){if(!el)return false;try{const cs=rt?.getComputedStyle?.(el);if(cs&&(cs.display==="none"||cs.visibility==="hidden"))return false;const r=el.getBoundingClientRect?.();if(r&&r.width===0&&r.height===0)return false}catch(e){}return true}
  function clickMenuCandidate(rt=R){
    const D=doc(rt);if(!D)return false;const exact=new Set(["accueil","menu","menu principal","retour menu","retour au menu","retour a l accueil","retour à l accueil"]);
    for(const el of D.querySelectorAll?.("button,a,[role=button]")||[]){if(el.closest?.(".gtv2Overlay")||!visible(el,rt))continue;const t=norm(el.textContent);if(exact.has(t)){try{el.click?.();return true}catch(e){}}}
    return false;
  }
  function invokeMenuFunction(rt=R){for(const name of ["showHome","showMainMenu","openMainMenu","goHome","returnToMenu","backToMenu"]){const fn=rt?.[name];if(typeof fn!=="function")continue;try{fn.call(rt);return true}catch(e){}}return false}
  function returnToMenu(rt=R){
    setEmergencyEscape(rt);const U=ui(rt);try{U?.close?.(false)}catch(e){}
    const go=()=>{if(clickMenuCandidate(rt)||invokeMenuFunction(rt))return true;try{rt?.location?.reload?.();return true}catch(e){return false}};
    if(typeof setTimeout==="function")setTimeout(go,30);else go();return true;
  }
  function bindMenu(rt=R){const D=doc(rt);if(!D?.addEventListener||menuBound)return !!D;D.addEventListener("click",ev=>{const b=ev?.target?.closest?.("[data-v1143-menu]");if(!b)return;try{ev.preventDefault?.();ev.stopPropagation?.();ev.stopImmediatePropagation?.()}catch(e){}returnToMenu(rt)},true);menuBound=true;return true}
  function patchUiOpen(rt=R){
    const U=ui(rt);if(!U)return false;let patched=false;
    for(const name of ["openCurrentEncounter","open"]){const fn=U[name];if(typeof fn!=="function"||fn.__gensRpg1143Transition)continue;const old=fn;const wrapped=function(){const opts=arguments[0]||{};showCombatTransition(rt,opts);const out=old.apply(this,arguments);decorateCombatUi(rt);if(typeof setTimeout==="function")setTimeout(()=>decorateCombatUi(rt),0);return out};wrapped.__gensRpg1143Transition=true;wrapped.__original=old;U[name]=wrapped;patched=true}
    uiPatched=patched||uiPatched;return uiPatched;
  }

  function touched(node){if(!node||node.nodeType!==1)return false;return !!(node.matches?.("#dc047RoomBoard,#dc047RoomBoard *,#drc100Grid,#drc100Grid *,.gtv2Overlay,.gtv2Overlay *")||node.closest?.("#dc047RoomBoard,#drc100Grid,.gtv2Overlay")||node.querySelector?.("#dc047RoomBoard,#drc100Grid,.gtv2Overlay"))}
  function maintain(rt=R){queued=false;ensureStyle(rt);patchStyleSetProperty(rt);rewriteWrongWallStyles(rt);applyWallVisuals(rt);patchTacticalDiceAnimate(rt);cleanupLegacyDice(rt);patchUiOpen(rt);decorateCombatUi(rt);guardCombatStart(rt);bindMenu(rt);return true}
  function queueMaintain(rt=R){if(queued)return;queued=true;const run=()=>maintain(rt);if(typeof rt?.requestAnimationFrame==="function")rt.requestAnimationFrame(run);else if(typeof setTimeout==="function")setTimeout(run,0);else run()}
  function observe(rt=R){const D=doc(rt);if(!D?.body||observer||typeof rt?.MutationObserver!=="function")return !!observer;observer=new rt.MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes||[]){if(touched(n)){queueMaintain(rt);return}}}});observer.observe(D.body,{childList:true,subtree:true});return true}
  function install(rt=R){patchStyleSetProperty(rt);ensureStyle(rt);rewriteWrongWallStyles(rt);patchTacticalDiceAnimate(rt);patchUiOpen(rt);bindMenu(rt);guardCombatStart(rt);observe(rt);maintain(rt);try{rt.GENS_RPG_TACTICAL_VISUAL_DICE_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000,8000,11000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,WRONG_WALL_ASSET,ESCAPE_MS,TRANSITION_MS,DICE_WATCHDOG_MS,runtimeState,rewriteWrongWallStyles,patchStyleSetProperty,wallTargets,applyWallVisuals,diceInfo,runFastDice,patchTacticalDiceAnimate,showCombatTransition,decorateCombatUi,emergencyActive,setEmergencyEscape,guardCombatStart,returnToMenu,patchUiOpen,install,installWithRetries,status:()=>({installed,observer:!!observer,diceAnimatePatched,styleSetPatched,uiPatched,menuBound,transitionCount})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
