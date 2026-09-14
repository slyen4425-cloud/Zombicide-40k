const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
function replaceOnce(src,from,to,label){
  const out=typeof from==='string'?src.replace(from,to):src.replace(from,to);
  if(out===src)throw new Error('V114.7 patch missed: '+label);
  return out;
}

// 1) Base tactical UI becomes the ONLY owner of wall source rendering + D100 presentation.
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js';let s=read(p);
  s=replaceOnce(s,'let battle=null,options={},selectedTarget="",selectedAttack="",rootEl=null,busy=false,notice="",detailActorId="",wallObserver=null,mapPatched=false,editorHooked=false;','let battle=null,options={},selectedTarget="",selectedAttack="",rootEl=null,busy=false,notice="",detailActorId="",mapPatched=false,editorHooked=false;','remove base wall observer state');
  s=replaceOnce(s,".gtv2Cell.cover:after{content:'◈';position:absolute;right:3px;top:1px;font-size:12px;color:#f4d86f;text-shadow:0 1px 2px #000}",".gtv2Cell.cover:after{content:'◈';position:absolute;right:3px;top:1px;font-size:12px;color:#f4d86f;text-shadow:0 1px 2px #000}.gtv2Cell.blocked.cover:after{content:none!important;display:none!important}",'suppress tactical wall icon');
  s=replaceOnce(s,".drc100Cell.wall,.dc047Cell.dav167870WallCell{background-image:url('${WALL_ASSET}')!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}",".drc100Cell.wall,.dc047Cell.dav167870WallCell,.dc047Cell.gtv2SourceWall{background:#171512 url('${WALL_ASSET}') center/cover no-repeat!important;filter:none!important}.dc047Cell.gtv2SourceWall::before,.dc047Cell.gtv2SourceWall::after{content:none!important;display:none!important}.dc047Cell.gtv2SourceWall>*{display:none!important}",'source wall CSS');
  s=replaceOnce(s,/  async function showDiceResult\(attacker,target,result,phase\)\{[\s\S]*?\n  \}\n  function nearestOpponent/,`  async function showDiceResult(attacker,target,result,phase){
    const doc=D();if(!doc||!result?.ok)return;
    if(!doc.getElementById("gtv21147DiceStyle")){const st=doc.createElement("style");st.id="gtv21147DiceStyle";st.textContent='.gtv21147DiceRow{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin:9px 0}.gtv21147DiceRow .gtv2Die{width:62px;height:62px;font-size:26px;transform:none!important;animation:none!important}.gtv2DiceCard.gtv21147Rolling .gtv2DiceResult,.gtv2DiceCard.gtv21147Rolling .gtv2DiceRule strong,.gtv2DiceCard.gtv21147Rolling .gtv2112Explain{visibility:hidden!important}@media(max-width:430px){.gtv21147DiceRow .gtv2Die{width:54px;height:54px;font-size:23px}}';(doc.head||doc.documentElement||doc.body)?.appendChild(st)}
    const row=[...arr(battle?.log)].reverse().find(x=>x?.type==="attack"&&x.attackerId===attacker.id&&x.targetId===target.id);const raw=arr(result?.rollsDisplay).length?arr(result.rollsDisplay):arr(row?.rollsDisplay).length?arr(row.rollsDisplay):[result.roll];const rolls=raw.filter(v=>Number.isFinite(Number(v))).map(v=>clamp(Math.round(num(v,1)),1,100));if(!rolls.length)rolls.push(clamp(Math.round(num(result.roll,1)),1,100));
    const high=result.rollHighToHit!==false,threshold=result.hitTarget??ruleTarget(result.hitChance,high),dice=rolls.length,hits=Math.max(0,Math.round(num(result.hits,result.hit?1:0))),resultText=dice>1?(hits?\`TOUCHÉ · \${hits}/\${dice} dé(s) · \${result.damage} dégât(s)\`:\`RATÉ · 0/\${dice} dé(s)\`):(result.hit?\`TOUCHÉ · \${result.damage} dégât(s)\`:"RATÉ");
    const overlay=doc.createElement("div");overlay.className="gtv2DiceBackdrop";overlay.innerHTML=\`<div class="gtv2DiceCard gtv21147Rolling" data-v113-dice="single-owner-v1147"><div class="gtv2DicePhase">\${esc(phase)}</div><div class="gtv2DiceTitle">\${esc(actorDisplayName(attacker))} attaque \${esc(actorDisplayName(target))}</div><div class="gtv2DiceSub">\${attacker.side==="enemy"?"Tour d’initiative ennemi — ce n’est pas une riposte automatique.":"Attaque du héros"}</div><div class="gtv21147DiceRow" data-dice-row>\${rolls.map(()=>'<div class="gtv2Die" data-v1147-die>…</div>').join("")}</div><div class="gtv2DiceResult \${result.hit?"ok":"fail"}" data-result style="visibility:hidden">\${resultText}</div><div class="gtv2DiceRule">Réussite si \${high?"D100 ≥":"D100 ≤"} \${threshold} · jet obtenu : <strong style="visibility:hidden">\${rolls.join(" · ")}</strong></div><button class="gtv2Btn good" data-dice-continue disabled>Continuer</button></div>\`;
    doc.body.appendChild(overlay);const card=overlay.querySelector(".gtv2DiceCard"),faces=[...overlay.querySelectorAll("[data-v1147-die]")],button=overlay.querySelector("[data-dice-continue]"),resultEl=overlay.querySelector("[data-result]"),ruleStrong=overlay.querySelector(".gtv2DiceRule strong");
    const animations=[];for(const face of faces){face.textContent="◆";if(typeof face.animate==="function")animations.push(waitAnimation(face.animate([{transform:"translateY(2px) rotate(-10deg)"},{transform:"translateY(-4px) rotate(8deg)"},{transform:"translateY(0) rotate(0deg)"}],{duration:170,easing:"cubic-bezier(.2,.8,.25,1)",fill:"both"})))}if(animations.length)await Promise.all(animations);
    faces.forEach((face,i)=>{face.textContent=String(rolls[i]);try{face.getAnimations?.().forEach(a=>a.cancel?.())}catch(e){}});card?.classList?.remove?.("gtv21147Rolling");if(resultEl)resultEl.style.visibility="visible";if(ruleStrong)ruleStrong.style.visibility="visible";if(button)button.disabled=false;
    await new Promise(resolve=>{if(!button){overlay.remove();resolve();return}button.addEventListener("click",()=>{overlay.remove();resolve()},{once:true})})
  }
  function nearestOpponent`,'single native D100 animation');
  s=replaceOnce(s,';paintLiveWalls()}',';}','remove post-render wall repaint');
  s=replaceOnce(s,'ensureStyle();hookEditor();patchDungeonMapHtml();installWallObserver();options=opts||{};','ensureStyle();hookEditor();patchDungeonMapHtml();options=opts||{};','remove open wall observer');
  s=replaceOnce(s,/  function patchDungeonMapHtml\(\)\{[^\n]*\}/,`  function patchDungeonMapHtml(){if(mapPatched)return true;const old=R.dungeonMapHtml;if(typeof old!=="function")return false;if(old.__gtv271WallPatch){mapPatched=true;return true}const w=function(map){const html=old.apply(this,arguments),doc=D();if(!doc||typeof html!=="string"||!html)return html;try{const tpl=doc.createElement("template");tpl.innerHTML=html;const cells=[...tpl.content.querySelectorAll(".dc047Grid > .dc047Cell")],kinds=arr(map?.cells);for(let i=0;i<cells.length;i++)if(String(kinds[i]||"").toLowerCase()==="wall"){const c=cells[i];c.classList.add("gtv2SourceWall","dav167870WallCell");c.textContent="";c.style.setProperty("background",\`#171512 url("\${WALL_ASSET}") center/cover no-repeat\`,"important");c.style.setProperty("filter","none","important")}return tpl.innerHTML}catch(e){return html}};w.__gtv271WallPatch=true;w.__original=old;R.dungeonMapHtml=w;mapPatched=true;return true}`,'source-only dungeon wall patch');
  s=replaceOnce(s,/  function paintLiveWalls\(\)\{[^\n]*\}/,'  function paintLiveWalls(){return 0}','disable live wall repaint');
  s=replaceOnce(s,/  function installWallObserver\(\)\{[^\n]*\}/,'  function installWallObserver(){return false}','disable base wall observer');
  s=replaceOnce(s,/  function hookDungeonRender\(\)\{[^\n]*\}/,`  function hookDungeonRender(){const core=R.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__gtv271WallRender)continue;const w=function(){patchDungeonMapHtml();return old.apply(this,arguments)};w.__gtv271WallRender=true;w.__original=old;core[name]=w}return true}`,'pre-render source hook');
  s=replaceOnce(s,'  function installGlobalPolish(){ensureStyle();hookEditor();patchDungeonMapHtml();hookDungeonRender();installWallObserver();paintLiveWalls();R.GENS_RPG_TACTICAL_UI_VERSION=APP_VERSION;return true}','  function installGlobalPolish(){ensureStyle();hookEditor();patchDungeonMapHtml();hookDungeonRender();R.GENS_RPG_TACTICAL_UI_VERSION=APP_VERSION;return true}','remove wall hot loop from install');
  write(p,s);
}

// 2) V111/V112/V113 keep their combat features but stop touching wall pixels.
{
  const p='assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js';let s=read(p);
  s=replaceOnce(s,'function maintain(rt=R){maintenanceQueued=false;paintWalls(rt);hideRuntimeTabs(rt);ensureDock(rt);paintDiceOverlay(rt);return true}','function maintain(rt=R){maintenanceQueued=false;hideRuntimeTabs(rt);ensureDock(rt);paintDiceOverlay(rt);return true}','V111 no wall repaint');
  write(p,s);
}
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js';let s=read(p);
  s=replaceOnce(s,'function maintain(rt=R){queued=false;ensureStyle(rt);markWallCells(rt);patchDetail(rt);patchDice(rt);return true}','function maintain(rt=R){queued=false;ensureStyle(rt);patchDetail(rt);patchDice(rt);return true}','V112 no wall repaint');
  s=s.replace(/\.gtv2DiceBackdrop,\.gtv271DetailBackdrop,\.dc047Grid/g,'.gtv2DiceBackdrop,.gtv271DetailBackdrop');
  write(p,s);
}
{
  const p='assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js';let s=read(p);
  s=replaceOnce(s,'function maintain(rt=R){maintainQueued=false;ensureStyle(rt);ensureDetectionHooks(rt);paintWalls(rt);animateDiceOverlay(rt);return true}','function maintain(rt=R){maintainQueued=false;ensureStyle(rt);ensureDetectionHooks(rt);return true}','V113 no visual repaint');
  s=replaceOnce(s,'function install(rt=R){ensureStyle(rt);ensureDetectionHooks(rt);bindBoardClicks(rt);observe(rt);paintWalls(rt);animateDiceOverlay(rt);try{rt.GENS_RPG_TACTICAL_RUNTIME_AUTHORITY_VERSION=APP_VERSION}catch(e){}installed=!!(adapterHooked&&startHooked);return installed}','function install(rt=R){ensureStyle(rt);ensureDetectionHooks(rt);bindBoardClicks(rt);try{rt.GENS_RPG_TACTICAL_RUNTIME_AUTHORITY_VERSION=APP_VERSION}catch(e){}installed=!!(adapterHooked&&startHooked);return installed}','V113 no visual observer');
  write(p,s);
}

// 3) V114.1 owns detection only. No dice/wall cleanup in its MutationObserver.
{
  const p='assets/gensrpg/gens-rpg-tactical-hotfix-1678114.js';let s=read(p);
  s=replaceOnce(s,/  function restorePriorVisuals\(rt=R\)\{[\s\S]*?\n  \}\n  function maintain/,`  function restorePriorVisuals(rt=R){return true}
  function maintain`,'V114.1 remove visual rollback');
  s=replaceOnce(s,'function maintain(rt=R){queued=false;ensureDetectionHooks(rt);restorePriorVisuals(rt);return true}','function maintain(rt=R){queued=false;ensureDetectionHooks(rt);return true}','V114.1 detection-only maintain');
  s=replaceOnce(s,/  function observe\(rt=R\)\{[\s\S]*?\n  \}\n  function startHeartbeat/,`  function observe(rt=R){
    const D=doc(rt);if(!D?.body||observer||typeof rt?.MutationObserver!=="function")return !!observer;
    observer=new rt.MutationObserver(muts=>{let board=false;for(const m of muts){for(const n of m.addedNodes||[]){if(boardTouched(n)){board=true;break}}if(board)break}if(board){queueMaintain(rt);scheduleDetection(rt,"board-mutation-v1141",false,[0,100])}});observer.observe(D.body,{childList:true,subtree:true});return true
  }
  function startHeartbeat`,'V114.1 board-only observer');
  s=replaceOnce(s,'function install(rt=R){ensureDetectionHooks(rt);bindBoard(rt);observe(rt);restorePriorVisuals(rt);scheduleDetection(rt,"install-v1141",false,[0,120]);startHeartbeat(rt);try{rt.GENS_RPG_TACTICAL_HOTFIX_VERSION=APP_VERSION}catch(e){}installed=true;return true}','function install(rt=R){ensureDetectionHooks(rt);bindBoard(rt);observe(rt);scheduleDetection(rt,"install-v1141",false,[0,120]);startHeartbeat(rt);try{rt.GENS_RPG_TACTICAL_HOTFIX_VERSION=APP_VERSION}catch(e){}installed=true;return true}','V114.1 install detection only');
  write(p,s);
}

// 4) V114.3 is reduced to transition + emergency menu only. Compatibility exports remain no-ops.
{
  const p='assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js';
  const s=`/* GenSrpG V16.78.114.7 — transition/menu compatibility layer.
   Wall rendering belongs only to the base tactical/source renderer. Dice presentation belongs only to the base tactical UI.
   This legacy file now owns ONLY exploration->combat transition and emergency Retour menu. */
(function(root,factory){
  const api=factory(root||globalThis);if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.GensRpgTacticalVisualDice16781142=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.2.0",APP_VERSION="16.78.114.3";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg",WRONG_WALL_ASSET="assets/dungeon/creatures/dungeon_wall.png";
  const ESCAPE_KEY="gensrpg_tactical_menu_escape_until_v1",ESCAPE_MS=5000,TRANSITION_MS=560,DICE_WATCHDOG_MS=0;
  const str=v=>String(v??""),num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\\u0300-\\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,uiPatched=false,menuBound=false,transitionCount=0;
  function doc(rt=R){return rt?.document||null}function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function runtimeState(rt=R){try{const raw=rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2"),x=raw?JSON.parse(raw):null;if(x&&typeof x==="object")return x}catch(e){}try{return rt?.loadDungeonState?.()||null}catch(e){return null}}
  // Compatibility no-ops: these features no longer own rendering in V114.7.
  function rewriteWrongWallStyles(){return 0}function patchStyleSetProperty(){return false}function wallTargets(){return []}function applyWallVisuals(){return 0}function runFastDice(){return null}function patchTacticalDiceAnimate(){return false}
  function diceInfo(rt=R,card=null){const b=ui(rt)?.getBattle?.(),row=[...(Array.isArray(b?.log)?b.log:[])].reverse().find(x=>x?.type==="attack")||null,text=str(card?.querySelector?.(".gtv2DiceRule")?.textContent),m=text.match(/D100\\s*(≥|>=|≤|<=)\\s*(\\d+)/),threshold=Math.max(1,Math.min(100,Math.round(num(m?.[2],50)))),high=!m||m[1]==="≥"||m[1]===">=";let rolls=(Array.isArray(row?.rollsDisplay)?row.rollsDisplay:[]).filter(v=>Number.isFinite(Number(v))).map(v=>Math.max(1,Math.min(100,Math.round(num(v,1)))));if(!rolls.length){const strong=card?.querySelector?.(".gtv2DiceRule strong")?.textContent,one=Number.isFinite(Number(strong))?Number(strong):num(row?.roll,1);rolls=[Math.max(1,Math.min(100,Math.round(one)))]}return {rolls,threshold,high}}
  function ensureStyle(rt=R){const D=doc(rt);if(!D||D.getElementById?.("gensRpgTacticalTransitionMenu16781147Style"))return !!D;const s=D.createElement("style");s.id="gensRpgTacticalTransitionMenu16781147Style";s.textContent=\`.gtv21143Transition{position:fixed;inset:0;z-index:40050;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at center,#4f1717aa,#05070bea 66%);animation:gtv21143TransitionFade \\${TRANSITION_MS}ms ease-out both}.gtv21143TransitionCard{text-align:center;padding:20px 28px;border:1px solid #a44d45;border-radius:18px;background:#120d12e8;box-shadow:0 18px 55px #000d;animation:gtv21143TransitionCard \\${TRANSITION_MS}ms cubic-bezier(.2,.8,.25,1) both}.gtv21143TransitionTitle{font-size:13px;font-weight:900;letter-spacing:.13em;color:#f09b8f}.gtv21143TransitionMain{font-size:27px;font-weight:1000;margin-top:5px;color:#fff}@keyframes gtv21143TransitionFade{0%{opacity:0}16%{opacity:1}74%{opacity:1}100%{opacity:0}}@keyframes gtv21143TransitionCard{0%{transform:scale(.82);opacity:0}22%{transform:scale(1.04);opacity:1}48%{transform:scale(1)}100%{transform:scale(.98);opacity:.92}}\`; (D.head||D.documentElement||D.body)?.appendChild(s);return true}
  function showCombatTransition(rt=R,options={}){const D=doc(rt);if(!D?.body)return false;D.querySelector?.("[data-v1143-transition]")?.remove?.();const auto=/auto-engage|ambush|vision|detect|rep[eé]r/i.test(str(options?.reason));const el=D.createElement("div");el.className="gtv21143Transition";el.setAttribute("data-v1143-transition","1");el.innerHTML=\`<div class="gtv21143TransitionCard"><div class="gtv21143TransitionTitle">\\${auto?"⚠️ ENNEMI REPÉRÉ":"⚔️ COMBAT"}</div><div class="gtv21143TransitionMain">ENGAGEMENT</div></div>\`;D.body.appendChild(el);transitionCount++;if(typeof setTimeout==="function")setTimeout(()=>el.remove?.(),TRANSITION_MS+40);return true}
  function decorateCombatUi(rt=R){const D=doc(rt),b=D?.querySelector?.(".gtv2Overlay .gtv2Top [data-close],.gtv2Overlay .gtv2Top [data-v1143-menu]");if(!b)return false;b.removeAttribute?.("data-close");b.setAttribute?.("data-v1143-menu","1");b.textContent="🏠 Retour menu";b.classList?.remove?.("danger");b.classList?.add?.("warn");return true}
  function escapeUntil(rt=R){let v=num(rt?.__gensTacticalMenuEscapeUntil,0);try{v=Math.max(v,num(rt?.sessionStorage?.getItem?.(ESCAPE_KEY),0))}catch(e){}return v}function emergencyActive(rt=R){return Date.now()<escapeUntil(rt)}
  function setEmergencyEscape(rt=R,ms=ESCAPE_MS){const until=Date.now()+Math.max(1000,num(ms,ESCAPE_MS));try{rt.__gensTacticalMenuEscapeUntil=until}catch(e){}try{rt?.sessionStorage?.setItem?.(ESCAPE_KEY,String(until))}catch(e){}return until}
  function guardCombatStart(rt=R){const old=rt?.dc200StartCombat;if(typeof old!=="function")return false;if(old.__gensRpg1143MenuGuard)return true;const wrapped=function(){if(emergencyActive(rt))return {ok:false,reason:"menu-escape-v1143"};return old.apply(this,arguments)};wrapped.__gensRpg1143MenuGuard=true;wrapped.__original=old;rt.dc200StartCombat=wrapped;return true}
  function visible(el,rt=R){if(!el)return false;try{const cs=rt?.getComputedStyle?.(el);if(cs&&(cs.display==="none"||cs.visibility==="hidden"))return false;const r=el.getBoundingClientRect?.();if(r&&r.width===0&&r.height===0)return false}catch(e){}return true}
  function clickMenuCandidate(rt=R){const D=doc(rt);if(!D)return false;const exact=new Set(["accueil","menu","menu principal","retour menu","retour au menu","retour a l accueil","retour à l accueil"]);for(const el of D.querySelectorAll?.("button,a,[role=button]")||[]){if(el.closest?.(".gtv2Overlay")||!visible(el,rt))continue;if(exact.has(norm(el.textContent))){try{el.click?.();return true}catch(e){}}}return false}
  function invokeMenuFunction(rt=R){for(const name of ["showHome","showMainMenu","openMainMenu","goHome","returnToMenu","backToMenu"]){const fn=rt?.[name];if(typeof fn!=="function")continue;try{fn.call(rt);return true}catch(e){}}return false}
  function returnToMenu(rt=R){setEmergencyEscape(rt);try{ui(rt)?.close?.(false)}catch(e){}const go=()=>{if(clickMenuCandidate(rt)||invokeMenuFunction(rt))return true;try{rt?.location?.reload?.();return true}catch(e){return false}};if(typeof setTimeout==="function")setTimeout(go,30);else go();return true}
  function bindMenu(rt=R){const D=doc(rt);if(!D?.addEventListener||menuBound)return !!D;D.addEventListener("click",ev=>{const b=ev?.target?.closest?.("[data-v1143-menu]");if(!b)return;try{ev.preventDefault?.();ev.stopPropagation?.();ev.stopImmediatePropagation?.()}catch(e){}returnToMenu(rt)},true);menuBound=true;return true}
  function patchUiOpen(rt=R){const U=ui(rt);if(!U)return false;let patched=false;for(const name of ["openCurrentEncounter","open"]){const fn=U[name];if(typeof fn!=="function"||fn.__gensRpg1143Transition)continue;const old=fn;const wrapped=function(){const opts=arguments[0]||{};showCombatTransition(rt,opts);const out=old.apply(this,arguments);decorateCombatUi(rt);return out};wrapped.__gensRpg1143Transition=true;wrapped.__original=old;U[name]=wrapped;patched=true}uiPatched=patched||uiPatched;return uiPatched}
  function install(rt=R){ensureStyle(rt);patchUiOpen(rt);bindMenu(rt);guardCombatStart(rt);decorateCombatUi(rt);try{rt.GENS_RPG_TACTICAL_VISUAL_DICE_VERSION=APP_VERSION}catch(e){}installed=true;return true}function installWithRetries(rt=R){return install(rt)}
  const api={VERSION,APP_VERSION,WALL_ASSET,WRONG_WALL_ASSET,ESCAPE_MS,TRANSITION_MS,DICE_WATCHDOG_MS,runtimeState,rewriteWrongWallStyles,patchStyleSetProperty,wallTargets,applyWallVisuals,diceInfo,runFastDice,patchTacticalDiceAnimate,showCombatTransition,decorateCombatUi,emergencyActive,setEmergencyEscape,guardCombatStart,returnToMenu,patchUiOpen,install,installWithRetries,status:()=>({installed,observer:false,diceAnimatePatched:false,styleSetPatched:false,uiPatched,menuBound,transitionCount})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>install(R),{once:true});else install(R)}return api;
});
`;
  write(p,s);
}

// 5) Add a canonical snapshot reader inside the one canonical stat engine.
{
  const p='assets/gensrpg/gens-rpg-stats-clean-167874.js';let s=read(p);
  const old=`function effectAmount(e,hero,seen){if(!e?.enabled)return 0;const v=value(hero,e.source,seen);if(e.mode==="threshold")return compare(v,e.comparator,e.threshold)?e.gain:0;return Math.floor(v/Math.max(1,e.step))*e.gain}\nfunction statEffectTotal(id,hero,seen=new Set()){const target="stat:"+canon(id);return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmount(e,hero,seen),0)}\nfunction extraTotal(target,hero=String(R.current||""),seen=new Set()){return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmount(e,hero,seen),0)}\nfunction value(hero,id,seen=new Set()){id=canon(id);const d=def(id);if(!d||!active(id))return 0;if(seen.has(id))return baseValue(hero,id);const next=new Set(seen);next.add(id);let n=baseValue(hero,id)+statEffectTotal(id,hero,next);if(SPECIAL_NATIVE.has(id))n+=extraTotal(id,hero,next);return clamp(n,d.min,d.max)}`;
  const neu=`function effectAmountWith(resolve,e,hero,seen){if(!e?.enabled)return 0;const v=resolve(hero,e.source,seen);if(e.mode==="threshold")return compare(v,e.comparator,e.threshold)?e.gain:0;return Math.floor(v/Math.max(1,e.step))*e.gain}\nfunction effectAmount(e,hero,seen){return effectAmountWith(value,e,hero,seen)}\nfunction statEffectTotalWith(resolve,id,hero,seen=new Set()){const target="stat:"+canon(id);return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmountWith(resolve,e,hero,seen),0)}\nfunction extraTotalWith(resolve,target,hero,seen=new Set()){return effects().filter(e=>e.enabled&&e.target===target).reduce((n,e)=>n+effectAmountWith(resolve,e,hero,seen),0)}\nfunction statEffectTotal(id,hero,seen=new Set()){return statEffectTotalWith(value,id,hero,seen)}\nfunction extraTotal(target,hero=String(R.current||""),seen=new Set()){return extraTotalWith(value,target,hero,seen)}\nfunction value(hero,id,seen=new Set()){id=canon(id);const d=def(id);if(!d||!active(id))return 0;if(seen.has(id))return baseValue(hero,id);const next=new Set(seen);next.add(id);let n=baseValue(hero,id)+statEffectTotal(id,hero,next);if(SPECIAL_NATIVE.has(id))n+=extraTotal(id,hero,next);return clamp(n,d.min,d.max)}\nfunction withHeroRuntime(hero,fn){const hc=Object.prototype.hasOwnProperty.call(R,"current"),hs=Object.prototype.hasOwnProperty.call(R,"state"),oc=R.current,os=R.state,target=String(hero||"")===String(oc||"")&&os?os:(R.loadState?.(hero)||{});try{R.current=hero;R.state=target;return fn(target)}finally{if(hc)R.current=oc;else try{delete R.current}catch(e){}if(hs)R.state=os;else try{delete R.state}catch(e){}}}\nfunction snapshotBaseValue(hero,id){id=canon(id);const d=def(id);if(!d||!active(id))return 0;if(SPECIAL_NATIVE.has(id)){let n=specialRaw(hero,id);if(id==="defense"||id==="armor")n=withHeroRuntime(hero,()=>n+num(R.dungeonEquipmentBonus?.(id),0)+num(R.dungeonSkillEffectTotal?.(id),0));return n}let n=customBase(hero,id);return withHeroRuntime(hero,()=>{try{n+=num(R.dungeonEquipmentBonus?.(id),0)}catch(e){}try{n+=num(R.dungeonSkillEffectTotal?.("attribute",null,id),0)}catch(e){}try{n+=num(R.dungeonChallengeDebuffTotal067?.(id,stFor(hero)),0)}catch(e){}return n})}\nfunction snapshotValue(hero,id,seen=new Set()){id=canon(id);const d=def(id);if(!d||!active(id))return 0;if(seen.has(id))return clamp(snapshotBaseValue(hero,id),d.min,d.max);const next=new Set(seen);next.add(id);let n=snapshotBaseValue(hero,id)+statEffectTotalWith(snapshotValue,id,hero,next);if(SPECIAL_NATIVE.has(id))n+=extraTotalWith(snapshotValue,id,hero,next);return clamp(n,d.min,d.max)}`;
  s=replaceOnce(s,old,neu,'canonical snapshotValue');
  s=replaceOnce(s,'allEffects,value,extraTotal,changeCustom','allEffects,value,snapshotValue,extraTotal,changeCustom','export canonical snapshotValue');
  write(p,s);
}

// 6) V110 uses the canonical snapshot reader, and real derived runtime values win for combat fields.
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js';let s=read(p);
  s=replaceOnce(s,'try{if(typeof api?.value==="function"){metrics.canonicalReads++;value=num(api.value(id,sid),value)}}catch(e){}','try{const reader=typeof api?.snapshotValue==="function"?api.snapshotValue:api?.value;if(typeof reader==="function"){metrics.canonicalReads++;value=num(reader.call(api,id,sid),value)}}catch(e){}','V110 canonical snapshot reader');
  s=replaceOnce(s,'const movement=Math.max(0,num(values.movement, safeCall(rt,"dungeonHeroMoveValue083",num(actor?.movement,3),id)));\n      const initiative=num(values.initiative,safeCall(rt,"dungeonDerivedInitiative",num(actor?.initiative,10)));\n      const defense=Math.max(0,num(values.defense,safeCall(rt,"dungeonDerivedDefense",num(actor?.defense,0))));\n      const armor=Math.max(0,num(values.armor,safeCall(rt,"dungeonArmorScore",num(actor?.armor,0))));','const movement=Math.max(0,num(safeCall(rt,"dungeonHeroMoveValue083",values.movement??num(actor?.movement,3),id),values.movement??num(actor?.movement,3)));\n      const initiative=num(safeCall(rt,"dungeonDerivedInitiative",values.initiative??num(actor?.initiative,10)),values.initiative??num(actor?.initiative,10));\n      const defense=Math.max(0,num(safeCall(rt,"dungeonDerivedDefense",values.defense??num(actor?.defense,0)),values.defense??num(actor?.defense,0)));\n      const armor=Math.max(0,num(safeCall(rt,"dungeonArmorScore",values.armor??num(actor?.armor,0)),values.armor??num(actor?.armor,0)));','V110 derived runtime priority');
  write(p,s);
}

// 7) Cache-bust the retained transition module and bump PWA version.
{
  const p='assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js';let s=read(p);
  s=s.replace('gens-rpg-tactical-visual-dice-16781142.js?v=16.78.114.3','gens-rpg-tactical-visual-dice-16781142.js?v=16.78.114.7');
  s=s.replace('V114.3 owns final wall visuals, short D100 sequencing, combat transition and emergency menu exit.','V114.7 base UI owns wall/D100 rendering; the legacy V114.3 module now owns transition and emergency menu exit only.');
  write(p,s);
}
{
  const p='service-worker.js';let s=read(p);
  s=replaceOnce(s,'const CACHE_NAME = "gensrpg-cache-16.78.114.6-consolidated-tactical-runtime";','const CACHE_NAME = "gensrpg-cache-16.78.114.7-single-authority-runtime";\n// gensrpg-cache-16.78.114.6-consolidated-tactical-runtime','V114.7 cache');
  write(p,s);
}

// 8) Bring regression tests in line with the now-authoritative wall requested by the phone test.
{
  const p='tests/gens_rpg_tactical_combat_v2_ui_v1678107.test.cjs';let s=read(p);
  s=s.replace("assert.match(ui,/dungeon_wall\\.png/,'walls must use the corrected wall texture');\nassert.doesNotMatch(ui,/dng_wall_block\\.jpg/,'white/legacy wall block asset must not be used by tactical UI');","assert.match(ui,/dng_wall_block\\.jpg/,'walls must use the Dungeon Builder wall texture');\nassert.doesNotMatch(ui,/WALL_ASSET=\"assets\\/dungeon\\/creatures\\/dungeon_wall\\.png\"/,'obsolete wall asset must not be authoritative');");
  s=s.replace("assert.match(ui,/patchDungeonMapHtml/,'random Dungeon map renderer must be patched too');\nassert.match(ui,/#dc047RoomBoard \\.dc047Grid > \\.dc047Cell/,'live random Dungeon board walls must be repainted');","assert.match(ui,/patchDungeonMapHtml/,'random Dungeon map renderer must be patched before DOM insertion');\nassert.match(ui,/gtv2SourceWall/,'generated wall cells must be marked at source');\nassert.doesNotMatch(ui,/new R\\.MutationObserver|new MutationObserver/,'wall rendering must not depend on a live repaint observer');");
  s=s.replace(/assert\.match\(sw,\/gensrpg-cache-16\\\.78\\\.107-tactical-actions-dice-terrain\|gensrpg-cache-16\\\.78\\\.107\\\.1-tactical-readability-roll-walls\/\);/,'assert.match(sw,/gensrpg-cache-16\\.78\\.114\\.7-single-authority-runtime/);');
  write(p,s);
}
{
  const p='tests/gens_rpg_tactical_runtime_authority_v1678113.test.cjs';let s=read(p);
  s=s.replace(/gensrpg-cache-16\\\.78\\\.114\\\.6-consolidated-tactical-runtime/g,'gensrpg-cache-16\\.78\\.114\\.7-single-authority-runtime');
  s=s.replace('V16.78.113 scope/detection preserved; V114.6 owns final wall/dice presentation and reasserts V110 stats: OK','V16.78.113 scope/detection preserved; V114.7 single-authority wall/dice + canonical stats: OK');
  write(p,s);
}
{
  const p='tests/gens_rpg_tactical_hotfix_v1678114.test.cjs';let s=read(p);
  s=s.replace("assert.match(visual,/rewriteWrongWallStyles/,'old style sheets that still mention dungeon_wall.png must be rewritten at runtime');\nassert.match(visual,/patchStyleSetProperty/,'late V107/V113 inline repaint attempts must be intercepted');\nassert.match(visual,/background-size\",\"cover\"/,'generated Dungeon and tactical walls must use cover scaling');\nassert.match(visual,/filter\",\"none\"/,'tactical wall must not receive the old dark filter');\nassert.match(visual,/gtv2Cell\\.blocked\\.cover::after/,'the useless tactical wall/cover icon must be suppressed');\nassert.match(visual,/font-size\",\"0\"/,'legacy wall text/icon must be hidden');\n\nassert.match(visual,/animateRpgDiceFast/,'tactical D100 must use the proven short mobile reel');\nassert.doesNotMatch(visual,/withSurvivalContext/,'V114.3 must never force the slow native Survival context');\nassert.doesNotMatch(visual,/animateRpgDiceDispatch/,'V114.3 must not start a second native Survival animation');\nassert.doesNotMatch(visual,/setInterval\\s*\\(/,'V114.3 must not use random-number interval animation');\nassert.match(visual,/data-v113-dice/,'V113 synthetic dice row must be blocked before its observer can start');\nassert.match(visual,/gtv2111DiceRow/,'V111 must not replace the active fast-reel host during animation');\nassert.match(visual,/gtv21143Rolling \\.gtv2112Explain/,'result explanation is hidden only during animation and remains after it');\nassert.match(visual,/DICE_WATCHDOG_MS=780/,'dice sequence must not linger after result');","assert.match(visual,/function rewriteWrongWallStyles\\(\\)\\{return 0\\}/,'legacy V114.3 wall repaint must be disabled');\nassert.match(visual,/function patchStyleSetProperty\\(\\)\\{return false\\}/,'legacy inline wall interceptor must be disabled');\nassert.match(visual,/function applyWallVisuals\\(\\)\\{return 0\\}/,'V114.3 must not repaint wall DOM');\nassert.match(visual,/function patchTacticalDiceAnimate\\(\\)\\{return false\\}/,'V114.3 must not intercept dice animation');\nassert.doesNotMatch(visual,/MutationObserver/,'transition/menu layer must not observe or repaint the DOM');\nassert.doesNotMatch(visual,/animateRpgDiceFast/,'transition/menu layer must not start a second dice animation');\nassert.equal(V.DICE_WATCHDOG_MS,0,'legacy dice watchdog is disabled');");
  s=s.replace('gens-rpg-tactical-visual-dice-16781142\\.js\\?v=16\\.78\\.114\\.3','gens-rpg-tactical-visual-dice-16781142\\.js\\?v=16\\.78\\.114\\.7');
  s=s.replace(/gensrpg-cache-16\\\.78\\\.114\\\.3-wall-dice-transition-menu/g,'gensrpg-cache-16\\.78\\.114\\.7-single-authority-runtime');
  s=s.replace("console.log('V16.78.114.3: live engagement preserved; wall repaint conflicts neutralized; short ordered D100 + transition/menu UX: OK');","console.log('V16.78.114.7: live engagement preserved; V114.3 reduced to transition/menu only: OK');");
  write(p,s);
}

// 9) New behavior regression test: no wall hot-loop, no timer D100, canonical snapshot values.
{
  const p='tests/gens_rpg_tactical_single_authority_v16781147.test.cjs';
  const s=`const assert=require('node:assert/strict');\nconst fs=require('node:fs');\nconst path=require('node:path');\nconst root=path.join(__dirname,'..');\nconst uiSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');\nconst v111=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');\nconst v112=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'),'utf8');\nconst v113=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');\nconst v1143=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');\nconst statsSrc=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');\nconst v110src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'),'utf8');\nconst sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');\nassert.match(uiSrc,/WALL_ASSET=\"assets\\/dungeon\\/creatures\\/dng_wall_block\\.jpg\"/);\nassert.match(uiSrc,/gtv2SourceWall/);\nassert.match(uiSrc,/background.*center\\/cover no-repeat/);\nassert.doesNotMatch(uiSrc,/new R\\.MutationObserver|new MutationObserver/);\nassert.doesNotMatch(uiSrc,/setInterval\\s*\\(/);\nassert.doesNotMatch(uiSrc,/setTimeout\\s*\\(/);\nassert.match(uiSrc,/face\\.animate/);\nassert.match(uiSrc,/duration:170/);\nassert.match(uiSrc,/function paintLiveWalls\\(\\)\\{return 0\\}/);\nassert.doesNotMatch(v111,/function maintain\\(rt=R\\)\\{maintenanceQueued=false;paintWalls\\(rt\\)/);\nassert.doesNotMatch(v112,/function maintain\\(rt=R\\)\\{queued=false;ensureStyle\\(rt\\);markWallCells\\(rt\\)/);\nassert.doesNotMatch(v113,/function maintain\\(rt=R\\)\\{maintainQueued=false;ensureStyle\\(rt\\);ensureDetectionHooks\\(rt\\);paintWalls\\(rt\\)/);\nassert.doesNotMatch(v1143,/MutationObserver/);\nassert.match(v1143,/function patchTacticalDiceAnimate\\(\\)\\{return false\\}/);\nassert.match(statsSrc,/function snapshotValue\\(/);\nassert.match(statsSrc,/allEffects,value,snapshotValue,extraTotal/);\nassert.match(v110src,/api\\?\\.snapshotValue/);\nassert.match(sw,/gensrpg-cache-16\\.78\\.114\\.7-single-authority-runtime/);\nconst S=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));\nconst rt={\n  current:'h1',state:{rpgAttributes:{force:17,agilite:14,defense:12,armor:3,movement:4,initiative:6}},\n  loadState:()=>({rpgAttributes:{force:17,agilite:14,defense:12,armor:3,movement:4,initiative:6}}),CHARS:{h1:{dungeonStats:{force:10,agilite:10}}},\n  GensCleanRpgStats167874:{runtimeDefs:()=>['force','agilite','defense','armor','movement','initiative'].map(id=>({id,name:id,defaultValue:0})),snapshotValue(id,sid){return {force:17,agilite:14,defense:12,armor:3,movement:4,initiative:6}[sid]}},\n  dungeonHeroMoveValue083:()=>5,dungeonDerivedInitiative:()=>9,dungeonDerivedDefense:()=>15,dungeonArmorScore:()=>7,dungeonDodgeChance:()=>11,dungeonCriticalChance:()=>8,dungeonMagicResistance:()=>4,dungeonMaxMana:()=>0,loadDungeonRpgRules:()=>({critMultiplier:2})\n};\nconst actor={id:'h1',side:'hero',hp:20,maxHp:20,movement:0,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'h1'}};\nconst snap=S.buildHeroSnapshot(rt,'h1',actor);\nassert.equal(snap.values.force,17);assert.equal(snap.values.agilite,14);assert.equal(snap.derived.movement,5);assert.equal(snap.derived.initiative,9);assert.equal(snap.derived.defense,15);assert.equal(snap.derived.armor,7);\nconsole.log('V16.78.114.7 single-authority wall + native D100 + canonical combat stats OK');\n`;
  write(p,s);
}

// 10) Dedicated workflow now validates V114.7 and keeps old suites.
{
  const p='.github/workflows/v1678114-tactical-hotfix.yml';let s=read(p);
  s=s.replace('name: Validate V16.78.114.6 Consolidated Tactical Runtime','name: Validate V16.78.114.7 Single Authority Tactical Runtime');
  if(!s.includes('work/v16.78.114.7-single-authority'))s=s.replace('      - work/v16.78.114.6-consolidate-wall-dice-stats\n','      - work/v16.78.114.6-consolidate-wall-dice-stats\n      - work/v16.78.114.7-single-authority\n');
  s=s.replace('      - name: Exact V114.6 consolidated wall dice stats scenarios\n        run: node tests/gens_rpg_tactical_consolidation_v16781146.test.cjs','      - name: Exact V114.7 single-authority wall dice stats scenarios\n        run: node tests/gens_rpg_tactical_single_authority_v16781147.test.cjs');
  write(p,s);
}

console.log('V114.7 one-shot consolidation applied');
