/* GenSrpG V16.78.109 — tactical timeline, compact HUD and ranged weapon repair.
   Keeps the V108 gameplay bridge intact while making one final visual layer authoritative:
   - Builder wall texture wins after every tactical/Dungeon render.
   - Duplicate Tour/Cible HUD cards are removed in favor of the existing highlights.
   - A Heroes-style initiative ribbon shows the upcoming activation order.
   - A fixed attack shortcut avoids repeated scrolling on mobile.
   - Mains nues can be equipped explicitly.
   - Known ranged bow/staff attacks cannot silently collapse to range 1.
*/
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalPolish1678109=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.109";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgTacticalPolish1678109Style";
  const TIMELINE_CLASS="gtv2109Timeline";
  const QUICK_CLASS="gtv2109QuickAttack";
  const UNARMED_VALUE="-1";
  const BOW_RANGE=6,STAFF_RANGE=4;
  let observer=null,installed=false,bound=false;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const esc=v=>str(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const doc=(rt=R)=>rt?.document||null;
  const ui=(rt=R)=>rt?.GensRpgTacticalCombatV2Ui||null;
  const engine=(rt=R)=>rt?.GensRpgTacticalCombatV2||null;
  const adapter=(rt=R)=>rt?.GensRpgTacticalCombatV2Adapter||null;

  function rangedKind(attack){
    const hay=[attack?.name,attack?.id,attack?.meta?.itemId,attack?.meta?.weaponId].map(str).join(" ").toLowerCase();
    if(/\b(?:arc|bow|longbow|shortbow|arbal[eè]te|crossbow)\b/.test(hay))return "bow";
    if(/\b(?:b[aâ]ton|baton|staff|wand|sceptre|scepter)\b/.test(hay))return "staff";
    return "";
  }
  function normalizeRangedAttack(attack){
    if(!attack||typeof attack!=="object")return attack;
    const kind=rangedKind(attack);if(!kind)return attack;
    const expected=kind==="bow"?BOW_RANGE:STAFF_RANGE;
    if(num(attack.maxRange??attack.range,1)>1)return attack;
    attack.minRange=Math.max(1,num(attack.minRange,1));
    attack.maxRange=expected;
    if(Object.prototype.hasOwnProperty.call(attack,"range"))attack.range=expected;
    attack.lineOfSight=true;
    attack.tags=arr(attack.tags).filter(x=>str(x)!=="melee");
    if(!attack.tags.includes("ranged"))attack.tags.push("ranged");
    return attack;
  }
  function normalizeActorRanges(actor){for(const a of arr(actor?.attacks))normalizeRangedAttack(a);return actor}
  function normalizeBattleRanges(battle){for(const actor of arr(battle?.actors).filter(a=>a?.side==="hero"))normalizeActorRanges(actor);return battle}

  function hookAdapterRanges(rt=R){
    const A=adapter(rt);if(!A)return false;
    if(typeof A.heroAttacks==="function"&&!A.heroAttacks.__gensRpg109Range){
      const old=A.heroAttacks;
      const wrapped=function(){const out=old.apply(this,arguments);for(const a of arr(out))normalizeRangedAttack(a);return out};
      wrapped.__gensRpg109Range=true;wrapped.__original=old;A.heroAttacks=wrapped;
    }
    if(typeof A.createBattle==="function"&&!A.createBattle.__gensRpg109Range){
      const old=A.createBattle;
      const wrapped=function(){return normalizeBattleRanges(old.apply(this,arguments))};
      wrapped.__gensRpg109Range=true;wrapped.__original=old;A.createBattle=wrapped;
    }
    return true;
  }

  function ensureStyle(rt=R){
    const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;
    const s=D.createElement("style");s.id=STYLE_ID;
    s.textContent=`
      .gtv2Hud{display:none!important}
      .${TIMELINE_CLASS}{display:flex;align-items:center;gap:6px;overflow-x:auto;margin:8px 0;padding:7px 8px;background:#111720;border:1px solid #354150;border-radius:12px;scrollbar-width:thin}
      .gtv2109TimelineLabel{flex:0 0 auto;font-size:10px;font-weight:900;letter-spacing:.07em;opacity:.7;text-transform:uppercase;margin-right:2px}
      .gtv2109TurnChip{position:relative;flex:0 0 45px;height:45px;border-radius:10px;overflow:hidden;border:2px solid #4a5666;background:#202733;display:grid;place-items:center}
      .gtv2109TurnChip img{width:100%;height:100%;object-fit:contain;object-position:center top;background:#141a22}
      .gtv2109TurnChip.hero{border-color:#3e82c7}.gtv2109TurnChip.enemy{border-color:#a34d46}
      .gtv2109TurnChip.current{flex-basis:52px;height:52px;border-width:3px;box-shadow:0 0 0 2px #6eb8ff,0 0 18px #4b9be855}
      .gtv2109TurnChip.target{box-shadow:0 0 0 3px #e2b539,0 0 18px #e2b53955}
      .gtv2109TurnChip .fallback{font-size:21px}.gtv2109TurnChip .order{position:absolute;right:1px;bottom:1px;min-width:14px;height:14px;padding:0 2px;border-radius:5px;background:#06080bd9;color:#fff;font-size:9px;font-weight:900;line-height:14px;text-align:center}
      .gtv2109TurnChip .init{position:absolute;left:1px;top:1px;padding:1px 3px;border-radius:4px;background:#06080bd9;color:#dfe8f2;font-size:8px;font-weight:800}
      .${QUICK_CLASS}{position:fixed;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:30040;min-width:112px;min-height:48px;border:2px solid #e1b545;border-radius:14px;background:#7b2f25;color:#fff;font-weight:950;font-size:15px;box-shadow:0 8px 25px #000a;padding:9px 13px}
      .${QUICK_CLASS}:disabled{opacity:.4;filter:grayscale(.45)}
      @media(max-width:540px){.${TIMELINE_CLASS}{margin:6px 0;padding:6px}.gtv2109TurnChip{flex-basis:40px;height:40px}.gtv2109TurnChip.current{flex-basis:47px;height:47px}.${QUICK_CLASS}{right:9px;min-width:104px}}
    `;
    (D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }

  function builderWallTargets(rt=R){
    const D=doc(rt);if(!D)return [];
    const out=[];
    for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell"]){for(const el of D.querySelectorAll?.(sel)||[])if(!out.includes(el))out.push(el)}
    const state=(()=>{try{return JSON.parse(rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2")||"null")}catch(e){return null}})();
    const kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];
    for(let i=0;i<cells.length;i++)if(str(kinds[i]).toLowerCase()==="wall"&&!out.includes(cells[i]))out.push(cells[i]);
    return out;
  }
  function paintBuilderWalls(rt=R){
    let count=0;for(const el of builderWallTargets(rt)){if(!el?.style?.setProperty)continue;el.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");el.style.setProperty("background-size","cover","important");el.style.setProperty("background-position","center","important");el.style.setProperty("background-repeat","no-repeat","important");count++}return count;
  }

  function turnSequence(battle,limit=10){
    const order=arr(battle?.order),actors=arr(battle?.actors);if(!order.length)return [];
    const alive=new Map(actors.filter(a=>a?.alive!==false).map(a=>[str(a.id),a]));
    const start=Math.max(0,Math.min(order.length-1,num(battle?.turnIndex,0))),ids=[];
    for(let step=0;step<order.length&&ids.length<limit;step++){const id=str(order[(start+step)%order.length]);if(alive.has(id))ids.push(id)}
    return ids.map((id,index)=>({actor:alive.get(id),index}));
  }
  function selectedTargetId(rt=R){const D=doc(rt);return str(D?.querySelector?.(".gtv2Target.active[data-target]")?.dataset?.target||"")}
  function timelineHtml(rt=R,battle=null){
    const U=ui(rt),targetId=selectedTargetId(rt),seq=turnSequence(battle,10);
    return `<div class="gtv2109TimelineLabel">Ordre</div>${seq.map(({actor,index})=>{const art=U?.actorArt?.(actor)||str(actor?.meta?.art||""),name=U?.actorDisplayName?.(actor)||str(actor?.name||actor?.id||"?"),classes=["gtv2109TurnChip",str(actor?.side)==="enemy"?"enemy":"hero",index===0?"current":"",str(actor?.id)===targetId?"target":""].filter(Boolean).join(" ");return `<div class="${classes}" title="${esc(name)} · Initiative ${num(actor?.initiative,0)}">${art?`<img src="${esc(art)}" alt="">`:'<span class="fallback">◆</span>'}<span class="init">${num(actor?.initiative,0)}</span><span class="order">${index+1}</span></div>`}).join("")}`;
  }
  function renderTimeline(rt=R){
    const D=doc(rt),U=ui(rt),battle=U?.getBattle?.();if(!D||!battle)return false;
    const shell=D.querySelector?.(".gtv2Overlay .gtv2Shell"),top=shell?.querySelector?.(".gtv2Top");if(!shell||!top)return false;
    let bar=shell.querySelector?.("."+TIMELINE_CLASS);if(!bar){bar=D.createElement("div");bar.className=TIMELINE_CLASS;top.insertAdjacentElement?.("afterend",bar);if(!bar.parentNode)top.parentNode?.insertBefore?.(bar,top.nextSibling)}
    const html=timelineHtml(rt,battle);if(bar.innerHTML!==html)bar.innerHTML=html;return true;
  }

  function itemAt(rt,state,index){const entry=state?.inventory?.[index];if(!entry)return null;try{return rt?.getItemFromEntry?.(entry)||rt?.itemById?.(entry?.itemId||entry?.id)||null}catch(e){return null}}
  function isWeapon(item){return str(item?.type).toLowerCase()==="arme"}
  function isUnarmedState(rt,state){return !Number.isInteger(state?.rightHand)||!isWeapon(itemAt(rt,state,state.rightHand))}
  function equipUnarmed(rt=R,heroId=""){
    let state=null;try{state=rt?.loadState?.(heroId)||null}catch(e){}if(!state)return false;
    state.rightHand=null;
    if(Number.isInteger(state.leftHand)&&isWeapon(itemAt(rt,state,state.leftHand)))state.leftHand=null;
    try{rt?.saveState?.(heroId,state)}catch(e){return false}
    const U=ui(rt),A=adapter(rt),battle=U?.getBattle?.(),actor=arr(battle?.actors).find(a=>str(a.id)===str(heroId)||str(a?.meta?.heroId)===str(heroId));
    if(actor&&typeof A?.heroAttacks==="function"){try{actor.attacks=A.heroAttacks(rt,heroId);normalizeActorRanges(actor)}catch(e){}}
    try{rt?.GensMobileCombatPerformance16781022?.clear?.()}catch(e){}
    try{U?.render?.()}catch(e){}return true;
  }
  function ensureUnarmedOption(rt=R){
    const D=doc(rt);if(!D)return 0;let count=0;
    for(const panel of D.querySelectorAll?.("[data-v108-panel]")||[]){const sel=panel.querySelector?.("[data-v108-weapon]"),btn=panel.querySelector?.("[data-v108-equip]");if(!sel)continue;let opt=[...sel.options||[]].find(o=>str(o.value)===UNARMED_VALUE);if(!opt){opt=D.createElement("option");opt.value=UNARMED_VALUE;opt.textContent="Mains nues";sel.insertBefore?.(opt,sel.firstChild);count++}sel.disabled=false;if(btn)btn.disabled=false;const heroId=panel.getAttribute?.("data-v108-panel")||"";let state=null;try{state=rt?.loadState?.(heroId)||null}catch(e){}if(state&&isUnarmedState(rt,state))sel.value=UNARMED_VALUE}
    return count;
  }

  function selectedAttackButton(rt=R){
    const D=doc(rt),panel=D?.querySelector?.("[data-v108-panel]"),id=str(panel?.querySelector?.("[data-v108-attack]")?.value||"");
    const buttons=[...(D?.querySelectorAll?.(".gtv2Actions button[data-attack]")||[])];return buttons.find(b=>str(b.dataset?.attack)===id)||buttons.find(b=>!b.disabled)||buttons[0]||null;
  }
  function quickAttackState(rt=R){
    const battle=ui(rt)?.getBattle?.(),cur=battle&&engine(rt)?.currentActor?.(battle),button=selectedAttackButton(rt);return {visible:!!battle&&battle.status==="active"&&cur?.side==="hero",disabled:!button||!!button.disabled||num(cur?.actionsLeft,0)<1,button};
  }
  function ensureQuickAttack(rt=R){
    const D=doc(rt);if(!D)return false;const overlay=D.querySelector?.(".gtv2Overlay");if(!overlay){D.querySelector?.("."+QUICK_CLASS)?.remove?.();return false}
    let btn=overlay.querySelector?.("."+QUICK_CLASS);if(!btn){btn=D.createElement("button");btn.type="button";btn.className=QUICK_CLASS;btn.setAttribute("data-v109-quick-attack","");btn.textContent="⚔️ Attaquer";overlay.appendChild(btn)}
    const st=quickAttackState(rt);btn.style.display=st.visible?"block":"none";btn.disabled=st.disabled;return true;
  }

  function enhance(rt=R){ensureStyle(rt);const battle=ui(rt)?.getBattle?.();if(battle)normalizeBattleRanges(battle);renderTimeline(rt);ensureUnarmedOption(rt);ensureQuickAttack(rt);return true}
  function hookUi(rt=R){
    const U=ui(rt),old=U?.render;if(typeof old!=="function")return false;if(old.__gensRpg109Ui)return true;
    const wrapped=function(){try{normalizeBattleRanges(U.getBattle?.())}catch(e){}const out=old.apply(this,arguments);try{enhance(rt)}catch(e){}return out};wrapped.__gensRpg109Ui=true;wrapped.__original=old;U.render=wrapped;return true;
  }
  function hookDungeonRender(rt=R){const core=rt?.DungeonCore01;if(!core)return false;let any=false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__gensRpg109Walls)continue;const wrapped=function(){const out=old.apply(this,arguments);try{paintBuilderWalls(rt)}catch(e){}return out};wrapped.__gensRpg109Walls=true;wrapped.__original=old;core[name]=wrapped;any=true}return any}

  function bind(rt=R){
    const D=doc(rt);if(!D||bound)return !!D;bound=true;
    D.addEventListener?.("click",ev=>{
      const quick=ev?.target?.closest?.("[data-v109-quick-attack]");if(quick){ev.preventDefault?.();ev.stopPropagation?.();const st=quickAttackState(rt);if(!st.disabled)st.button?.click?.();return}
      const equip=ev?.target?.closest?.("button[data-v108-equip]");if(!equip)return;const panel=equip.closest?.("[data-v108-panel]"),sel=panel?.querySelector?.("[data-v108-weapon]");if(str(sel?.value)!==UNARMED_VALUE)return;ev.preventDefault?.();ev.stopPropagation?.();ev.stopImmediatePropagation?.();equipUnarmed(rt,panel?.getAttribute?.("data-v108-panel")||"");
    },true);
    return true;
  }
  function observe(rt=R){
    const D=doc(rt);if(!D||observer||typeof rt?.MutationObserver!=="function")return false;let queued=false;
    const run=()=>{queued=false;try{enhance(rt)}catch(e){}};
    observer=new rt.MutationObserver(()=>{if(queued)return;queued=true;if(typeof rt?.requestAnimationFrame==="function")rt.requestAnimationFrame(run);else setTimeout(run,0)});observer.observe(D.body||D.documentElement,{childList:true,subtree:true});return true;
  }
  function install(rt=R){ensureStyle(rt);hookAdapterRanges(rt);hookUi(rt);bind(rt);enhance(rt);try{rt.GENS_RPG_TACTICAL_POLISH_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500])setTimeout(()=>install(rt),ms);return true}

  const api={VERSION,APP_VERSION,WALL_ASSET,BOW_RANGE,STAFF_RANGE,UNARMED_VALUE,rangedKind,normalizeRangedAttack,normalizeActorRanges,normalizeBattleRanges,turnSequence,timelineHtml,paintBuilderWalls,isUnarmedState,equipUnarmed,quickAttackState,ensureUnarmedOption,ensureQuickAttack,enhance,install,installWithRetries,status:()=>({installed,wall:WALL_ASSET})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
