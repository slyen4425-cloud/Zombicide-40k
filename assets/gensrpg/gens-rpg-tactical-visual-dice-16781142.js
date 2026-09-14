/* GenSrpG V16.78.114.2 — final wall + dice visual authority.
   Visual-only layer loaded after V114.1:
   - uses exactly the Dungeon Builder wall asset on Builder, generated Dungeon and tactical combat maps;
   - paints the wall directly on the cell with cover/center (same strategy as floor tiles), no pseudo layer and no wall icon;
   - reuses the native Survival D100 animation for tactical combat without changing combat math, timing rules or result explanations. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalVisualDice16781142=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.114.2";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgTacticalVisualDice16781142Style";
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,observer=null,queued=false,diceAnimatePatched=false,diceSeq=0;

  function doc(rt=R){return rt?.document||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function runtimeState(rt=R){
    try{const raw=rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2"),x=raw?JSON.parse(raw):null;if(x&&typeof x==="object")return x}catch(e){}
    try{return rt?.loadDungeonState?.()||null}catch(e){return null}
  }
  function ensureStyle(rt=R){
    const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;
    const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv2112WallCell::before,.gtv2Cell.blocked::before,#drc100Grid .drc100Cell.wall::before,#dc047RoomBoard .dav167870WallCell::before{content:none!important;display:none!important;background:none!important}
      .gtv2113Wall,.gtv2112WallCell,.gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell{background-image:url("${WALL_ASSET}")!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;color:transparent!important;text-shadow:none!important;font-size:0!important}
      .gtv2Cell.blocked.cover::after,.gtv2113Wall::after,.gtv2112WallCell::after,#drc100Grid .drc100Cell.wall::after,#dc047RoomBoard .dav167870WallCell::after{content:none!important;display:none!important}
      .gtv2113Wall>*,.gtv2112WallCell>*,.gtv2Cell.blocked>*,#drc100Grid .drc100Cell.wall>*,#dc047RoomBoard .dav167870WallCell>*{visibility:hidden!important}
      .gtv2DiceCard>.gtv2Die{animation:none!important}
      .gtv21142SurvivalDiceHost.gtv2Die{width:100%!important;height:auto!important;min-height:86px!important;margin:10px 0!important;border-radius:0!important;background:none!important;box-shadow:none!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;font-size:inherit!important;color:inherit!important}
      .gtv21142SurvivalDiceHost.gtv2111DiceRow{margin:8px 0!important}
      .gtv21142SurvivalDiceHost .rpgD100Target{display:none!important}
      .gtv2DiceCard.gtv21142Rolling .gtv2DiceRule strong,.gtv2DiceCard.gtv21142Rolling .gtv2DiceResult,.gtv2DiceCard.gtv21142Rolling .gtv2112Explain{visibility:hidden!important}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }
  function wallTargets(rt=R){
    const D=doc(rt),out=[];if(!D)return out;
    for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell","#dc047RoomBoard .gtv2112WallCell","#dc047RoomBoard .gtv2113Wall"]){for(const el of D.querySelectorAll?.(sel)||[])if(!out.includes(el))out.push(el)}
    const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];
    for(let i=0;i<cells.length;i++){if(norm(kinds[i])!=="wall")continue;cells[i].classList?.add?.("gtv2112WallCell");if(!out.includes(cells[i]))out.push(cells[i])}
    return out;
  }
  function applyWallVisuals(rt=R){
    ensureStyle(rt);let count=0;
    for(const el of wallTargets(rt)){if(!el?.style?.setProperty)continue;el.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");el.style.setProperty("background-size","cover","important");el.style.setProperty("background-position","center","important");el.style.setProperty("background-repeat","no-repeat","important");el.style.setProperty("color","transparent","important");el.style.setProperty("text-shadow","none","important");el.style.setProperty("font-size","0","important");count++}
    return count;
  }

  function latestAttackRow(rt=R){const b=currentBattle(rt);return [...arr(b?.log)].reverse().find(x=>x?.type==="attack")||null}
  function diceInfo(rt=R,card=null){
    const row=latestAttackRow(rt),text=str(card?.querySelector?.(".gtv2DiceRule")?.textContent),m=text.match(/D100\s*(?:≥|>=|≤|<=)\s*(\d+)/),threshold=clamp(Math.round(num(m?.[1],50)),1,100);
    let rolls=arr(row?.rollsDisplay).filter(v=>Number.isFinite(Number(v))).map(v=>clamp(Math.round(num(v,1)),1,100));
    if(!rolls.length){const strong=card?.querySelector?.(".gtv2DiceRule strong")?.textContent,one=Number.isFinite(Number(strong))?Number(strong):num(row?.roll,1);rolls=[clamp(Math.round(one),1,100)]}
    return {rolls,threshold};
  }
  function withSurvivalContext(rt=R,fn=()=>undefined){
    const names=["getActiveGameProfile","activeGameProfileRaw"],saved=names.map(name=>({name,had:Object.prototype.hasOwnProperty.call(rt,name),value:rt[name]}));
    for(const rec of saved){const old=rec.value;rt[rec.name]=function(){let p=null;try{p=typeof old==="function"?old.apply(this,arguments):null}catch(e){}return {...(p&&typeof p==="object"?p:{}),gameStyle:"survival"}}}
    try{return fn()}finally{for(const rec of saved){if(rec.had)rt[rec.name]=rec.value;else try{delete rt[rec.name]}catch(e){rt[rec.name]=rec.value}}}
  }
  function runSurvivalDice(rt=R,card=null,originalDie=null){
    return new Promise(resolve=>{
      const launch=()=>{
        try{
          if(!card?.isConnected){resolve(false);return}
          card.setAttribute?.("data-v113-dice","blocked-v1142");
          const info=diceInfo(rt,card),host=card.querySelector?.(".gtv2111DiceRow")||card.querySelector?.("[data-die]")||originalDie;
          if(!host){card.classList?.remove?.("gtv21142Rolling");resolve(false);return}
          host.classList?.add?.("gtv21142SurvivalDiceHost");if(!host.id)host.id="gtv21142DiceHost"+(++diceSeq);
          const perf=rt?.GensMobileCombatPerformance16781022,dispatch=perf?.animateRpgDiceDispatch;
          if(typeof dispatch!=="function"){card.classList?.remove?.("gtv21142Rolling");resolve(false);return}
          let done=false,timer=null;const finish=()=>{if(done)return;done=true;if(timer!=null&&typeof clearTimeout==="function")clearTimeout(timer);card.classList?.remove?.("gtv21142Rolling");resolve(true)};
          const result=withSurvivalContext(rt,()=>dispatch.call(rt,host.id,info.rolls.length,info.rolls,info.threshold,100,finish));
          if(result===false){finish();return}
          if(typeof setTimeout==="function")timer=setTimeout(finish,1400);
        }catch(e){card?.classList?.remove?.("gtv21142Rolling");resolve(false)}
      };
      if(typeof setTimeout==="function")setTimeout(launch,0);else launch();
    });
  }
  function patchTacticalDiceAnimate(rt=R){
    if(diceAnimatePatched)return true;const proto=rt?.Element?.prototype||rt?.HTMLElement?.prototype;if(!proto||typeof proto.animate!=="function")return false;
    if(proto.animate.__gensRpg1142SurvivalDice){diceAnimatePatched=true;return true}
    const old=proto.animate;
    const wrapped=function(){
      try{
        if(this?.matches?.(".gtv2DiceCard > .gtv2Die[data-die]")){
          const card=this.closest?.(".gtv2DiceCard");if(card){card.setAttribute?.("data-v113-dice","blocked-v1142");card.classList?.add?.("gtv21142Rolling");return {finished:runSurvivalDice(rt,card,this)}}
        }
      }catch(e){}
      return old.apply(this,arguments);
    };
    wrapped.__gensRpg1142SurvivalDice=true;wrapped.__original=old;proto.animate=wrapped;diceAnimatePatched=true;return true;
  }

  function boardOrDiceTouched(node){if(!node||node.nodeType!==1)return false;return !!(node.matches?.("#dc047RoomBoard,#dc047RoomBoard *,#drc100Grid,#drc100Grid *,.gtv2Grid,.gtv2Grid *,.gtv2DiceBackdrop,.gtv2DiceCard")||node.closest?.("#dc047RoomBoard,#drc100Grid,.gtv2Grid,.gtv2DiceBackdrop")||node.querySelector?.("#dc047RoomBoard,#drc100Grid,.gtv2Grid,.gtv2DiceBackdrop"))}
  function maintain(rt=R){queued=false;ensureStyle(rt);patchTacticalDiceAnimate(rt);try{rt?.GensRpgTacticalCombatCoherence1678112?.markWallCells?.(rt)}catch(e){}applyWallVisuals(rt);return true}
  function queueMaintain(rt=R){if(queued)return;queued=true;const run=()=>maintain(rt);if(typeof rt?.requestAnimationFrame==="function")rt.requestAnimationFrame(run);else if(typeof setTimeout==="function")setTimeout(run,0);else run()}
  function observe(rt=R){
    const D=doc(rt);if(!D?.body||observer||typeof rt?.MutationObserver!=="function")return !!observer;
    observer=new rt.MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes||[]){if(boardOrDiceTouched(n)){queueMaintain(rt);return}}}});observer.observe(D.body,{childList:true,subtree:true});return true;
  }
  function install(rt=R){ensureStyle(rt);patchTacticalDiceAnimate(rt);observe(rt);maintain(rt);try{rt.GENS_RPG_TACTICAL_VISUAL_DICE_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000,8000,11000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,wallTargets,applyWallVisuals,diceInfo,withSurvivalContext,runSurvivalDice,patchTacticalDiceAnimate,install,installWithRetries,status:()=>({installed,observer:!!observer,diceAnimatePatched})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
