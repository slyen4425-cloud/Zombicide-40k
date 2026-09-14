/* GenSrpG V16.78.114.5 — targeted phone corrections after V114.4.
   - keeps V114.4 session recovery and validated enemy engagement untouched;
   - pre-paints generated Dungeon wall cells before they enter the DOM, avoiding white zoom frames;
   - keeps dng_wall_block.jpg as the single wall visual authority;
   - replaces the layered tactical D100 animation with one short 260 ms roll, then result/explanation;
   - reconnects Tactical V2 hero snapshots to the current canonical stats engine after the stats refactor. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalWallDiceStats16781145=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.114.5";
  const SNAPSHOT_VERSION="16.78.110",LINK_VERSION="16.78.114.5";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgTacticalWallDiceStats16781145Style";
  const DICE_MS=260,DICE_TICK_MS=32;
  const SPECIAL_NATIVE=new Set(["defense","armor","movement"]);
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,mapHooked=false,diceHooked=false,adapterHooked=false,uiHooked=false;
  let nativeAnimate=null;

  function doc(rt=R){return rt?.document||null}
  function statsApi(rt=R){return rt?.GensCleanRpgStats167874||null}
  function statsBridge(rt=R){return rt?.GensRpgTacticalStats1678110||null}
  function adapter(rt=R){return rt?.GensRpgTacticalCombatV2Adapter||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function coherence(rt=R){return rt?.GensRpgTacticalCombatCoherence1678112||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function heroState(rt,id){try{return rt?.loadState?.(id)||null}catch(e){return null}}
  function heroRecord(rt,id){try{return rt?.CHARS?.[id]||rt?.findCustomHero?.(id)||null}catch(e){return rt?.CHARS?.[id]||null}}
  function actorHeroId(actor){return str(actor?.meta?.heroId||actor?.id)}

  function ensureStyle(rt=R){
    const D=doc(rt);if(!D)return false;if(D.getElementById?.(STYLE_ID))return true;
    const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv21145WallPrepaint,.dav167870WallCell,.gtv2112WallCell,.gtv2113Wall,.gtv2Cell.blocked,#drc100Grid .drc100Cell.wall{
        background-image:url("${WALL_ASSET}")!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;background-color:#171512!important;filter:none!important
      }
      .gtv21145WallPrepaint::before,.gtv21145WallPrepaint::after,.dav167870WallCell::before,.dav167870WallCell::after,.gtv2112WallCell::before,.gtv2112WallCell::after,.gtv2113Wall::before,.gtv2113Wall::after,.gtv2Cell.blocked::before,.gtv2Cell.blocked::after{content:none!important;display:none!important}
      .gtv21145WallPrepaint>*,.dav167870WallCell>*,.gtv2112WallCell>*,.gtv2113Wall>*,.gtv2Cell.blocked>*{visibility:hidden!important}
      .gtv2DiceCard.gtv21145Rolling .gtv2DiceResult,.gtv2DiceCard.gtv21145Rolling .gtv2DiceRule strong,.gtv2DiceCard.gtv21145Rolling .gtv2112Explain{visibility:hidden!important}
      .gtv2DiceCard.gtv21145Rolling .gtv2Die[data-die]{transform:none!important;animation:none!important;min-width:72px!important}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }

  function runtimeState(rt=R){try{return rt?.loadDungeonState?.()||JSON.parse(rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2")||"null")||null}catch(e){return null}}
  function paintExistingWalls(rt=R){
    const D=doc(rt),state=runtimeState(rt),types=arr(state?.last?.map?.cells);if(!D)return 0;let n=0;
    const board=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];
    for(let i=0;i<board.length;i++){if(norm(types[i])!=="wall")continue;const c=board[i];c.classList?.add?.("gtv21145WallPrepaint","dav167870WallCell");if(c.style?.setProperty){c.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");c.style.setProperty("background-size","cover","important");c.style.setProperty("background-position","center","important");c.style.setProperty("background-repeat","no-repeat","important")}n++}
    return n;
  }
  function patchMapHtml(rt=R){
    const old=rt?.dungeonMapHtml;if(typeof old!=="function")return false;if(old.__gensRpg1145WallPrepaint){mapHooked=true;return true}
    const wrapped=function(map){
      const html=old.apply(this,arguments);const D=doc(rt);if(typeof html!=="string"||!html||!D)return html;
      try{
        const types=arr(map?.cells);if(!types.length)return html;const tpl=D.createElement("template");tpl.innerHTML=html;const cells=[...tpl.content.querySelectorAll(".dc047Grid > .dc047Cell")];
        for(let i=0;i<cells.length;i++){if(norm(types[i])!=="wall")continue;const c=cells[i];c.classList.add("gtv21145WallPrepaint","dav167870WallCell");c.style.setProperty("background-image",`url("${WALL_ASSET}")`);c.style.setProperty("background-size","cover");c.style.setProperty("background-position","center");c.style.setProperty("background-repeat","no-repeat");c.style.setProperty("background-color","#171512")}
        return tpl.innerHTML;
      }catch(e){return html}
    };
    wrapped.__gensRpg1145WallPrepaint=true;wrapped.__original=old;rt.dungeonMapHtml=wrapped;mapHooked=true;return true;
  }

  function diceFinalValue(card){const t=card?.querySelector?.(".gtv2DiceRule strong")?.textContent;const n=Number(t);return Number.isFinite(n)?clamp(Math.round(n),1,100):null}
  function patchDice(rt=R){
    const proto=rt?.Element?.prototype||rt?.HTMLElement?.prototype;if(!proto||typeof proto.animate!=="function")return false;
    if(proto.animate.__gensRpg1145FastDice){diceHooked=true;return true}
    let old=proto.animate;
    while(old&&typeof old.__original==="function"&&(old.__gensRpg1143FastDice||old.__gensRpg1142SurvivalDice||old.__gensRpg1145FastDice))old=old.__original;
    if(typeof old!=="function")return false;if(!nativeAnimate)nativeAnimate=old;
    const wrapped=function(){
      try{
        if(this?.matches?.(".gtv2DiceCard > .gtv2Die[data-die]")){
          const die=this,card=die.closest?.(".gtv2DiceCard"),finalValue=diceFinalValue(card);if(card&&finalValue!=null){
            card.classList?.remove?.("gtv21143Rolling","gtv21142Rolling");card.classList?.add?.("gtv21145Rolling");card.setAttribute?.("data-v113-dice","blocked-v1145");
            let done=false,timer=null,resolveDone;const finished=new Promise(resolve=>{resolveDone=resolve});
            const finish=()=>{if(done)return;done=true;if(timer!=null&&typeof clearInterval==="function")clearInterval(timer);die.textContent=String(finalValue);card.classList?.remove?.("gtv21145Rolling");resolveDone?.()};
            die.textContent=String(1+Math.floor(Math.random()*100));if(typeof setInterval==="function")timer=setInterval(()=>{if(!done)die.textContent=String(1+Math.floor(Math.random()*100))},DICE_TICK_MS);
            if(typeof setTimeout==="function")setTimeout(finish,DICE_MS);else finish();return {finished,cancel:finish,finish};
          }
        }
      }catch(e){}
      return nativeAnimate.apply(this,arguments);
    };
    wrapped.__gensRpg1145FastDice=true;wrapped.__gensRpg1143FastDice=true;wrapped.__original=nativeAnimate;proto.animate=wrapped;diceHooked=true;return true;
  }

  function withRuntimeContext(rt,id,currentValue,fn){
    const hc=Object.prototype.hasOwnProperty.call(rt,"current"),hs=Object.prototype.hasOwnProperty.call(rt,"state"),oc=rt.current,os=rt.state,st=heroState(rt,id)||{};
    try{rt.current=currentValue;rt.state=st;return fn(st)}finally{if(hc)rt.current=oc;else try{delete rt.current}catch(e){}if(hs)rt.state=os;else try{delete rt.state}catch(e){}}
  }
  function canonicalValue(rt,id,def,st,rec){
    const sid=str(def?.id),fallback=num(st?.rpgAttributes?.[sid]??rec?.dungeonStats?.[sid]??rec?.[sid],num(def?.defaultValue,0)),api=statsApi(rt);if(!sid||typeof api?.value!=="function")return fallback;
    try{
      /* Deliberately keep current != hero while calling the canonical engine. After the stats cleanup,
         the old dungeonAttributeValue path can still return zero for rebuilt hero stats when current===hero.
         The canonical engine's detached path reads the new rpgAttributes/dungeonStats authority instead. */
      return withRuntimeContext(rt,id,"__gens_tactical_snapshot_1145__",()=>num(api.value(id,sid),fallback));
    }catch(e){return fallback}
  }
  function heroCall(rt,id,name,fallback,...args){return withRuntimeContext(rt,id,id,()=>{try{const fn=rt?.[name];if(typeof fn!=="function")return fallback;const v=fn.apply(rt,args);return v==null?fallback:v}catch(e){return fallback}})}
  function buildLinkedSnapshot(rt=R,id="",actor=null){
    id=str(id);if(!id)return null;const api=statsApi(rt),defs=arr(api?.runtimeDefs?.()),st=heroState(rt,id)||{},rec=heroRecord(rt,id)||{},canonical=[],values={};
    for(const d of defs){const sid=str(d?.id);if(!sid)continue;let value=canonicalValue(rt,id,d,st,rec);
      if(SPECIAL_NATIVE.has(sid)){const equipment=num(heroCall(rt,id,"dungeonEquipmentBonus",0,sid),0);let skill=0;try{skill=num(heroCall(rt,id,"dungeonSkillEffectTotal",0,sid),0)}catch(e){}value+=equipment+skill;value=clamp(value,num(d?.min,-999999),num(d?.max,999999))}
      canonical.push({id:sid,name:str(d?.name||sid),icon:str(d?.icon||""),value});values[sid]=value;
    }
    const movement=Math.max(0,num(values.movement,num(actor?.movement,3))),initiative=num(values.initiative,num(actor?.initiative,10)),defense=Math.max(0,num(values.defense,num(actor?.defense,0))),armor=Math.max(0,num(values.armor,num(actor?.armor,0)));
    const dodge=clamp(num(heroCall(rt,id,"dungeonDodgeChance",num(actor?.dodge,0)),num(actor?.dodge,0)),0,100),crit=clamp(num(heroCall(rt,id,"dungeonCriticalChance",0),0),0,100),magicResistance=Math.max(0,num(heroCall(rt,id,"dungeonMagicResistance",0),0));
    const maxMana=Math.max(0,num(heroCall(rt,id,"dungeonMaxMana",0),0)),mana=Math.max(0,num(st?.mana??st?.mp??st?.currentMana,maxMana));
    let rules={criticalMultiplier:2};try{const r=rt?.loadDungeonRpgRules?.()||{};rules.criticalMultiplier=clamp(num(r.critMultiplier??r.criticalMultiplier??r.critDamageMultiplier,2),1,5)}catch(e){}
    let resistances={};try{resistances={...(st?.resistances||{}),...(st?.rpgResistances||{}),...(st?.elementResistances||{}),...(rec?.resistances||{}),...(rec?.rpgResistances||{}),...(rec?.elementResistances||{})}}catch(e){}
    return {version:SNAPSHOT_VERSION,linkVersion:LINK_VERSION,heroId:id,builtAt:Date.now(),canonical,values,derived:{hp:num(actor?.hp,1),maxHp:num(actor?.maxHp,1),mana,maxMana,crit,dodge,magicResistance,defense,armor,initiative,movement},resistances,rules};
  }
  function repairBattleStats(rt=R,battle=currentBattle(rt),force=false){
    if(!battle?.actors)return 0;let count=0;const bridge=statsBridge(rt);
    for(const actor of battle.actors){if(actor?.side!=="hero")continue;if(!force&&actor?.meta?.rpgStats?.linkVersion===LINK_VERSION)continue;const id=actorHeroId(actor),snap=buildLinkedSnapshot(rt,id,actor);if(!snap)continue;
      if(typeof bridge?.applyHeroSnapshot==="function")bridge.applyHeroSnapshot(actor,snap,{preserveTurnResources:true});else{actor.meta=actor.meta||{};actor.meta.rpgStats=snap;actor.movement=Math.max(0,num(snap.derived.movement,actor.movement));actor.initiative=num(snap.derived.initiative,actor.initiative);actor.defense=Math.max(0,num(snap.derived.defense,actor.defense));actor.armor=Math.max(0,num(snap.derived.armor,actor.armor));actor.dodge=clamp(num(snap.derived.dodge,actor.dodge),0,95)}count++;
    }
    if(count){battle.meta=battle.meta||{};battle.meta.canonicalStatsLinkVersion=LINK_VERSION}
    return count;
  }
  function patchAdapter(rt=R){
    const A=adapter(rt),fn=A?.createBattle;if(typeof fn!=="function")return false;if(fn.__gensRpg1145StatsLink){adapterHooked=true;return true}
    const old=fn,wrapped=function(){const b=old.apply(this,arguments);repairBattleStats(rt,b,true);return b};wrapped.__gensRpg1145StatsLink=true;wrapped.__original=old;A.createBattle=wrapped;adapterHooked=true;return true;
  }
  function refreshDetail(rt=R){
    const D=doc(rt);try{D?.querySelector?.(".gtv271DetailCard .gtv2112TrueSheet")?.remove?.()}catch(e){}try{coherence(rt)?.patchDetail?.(rt)}catch(e){}try{statsBridge(rt)?.decorateDetail?.(rt)}catch(e){}return true;
  }
  function patchUi(rt=R){
    const U=ui(rt),fn=U?.render;if(typeof fn!=="function")return false;if(fn.__gensRpg1145StatsLink){uiHooked=true;return true}
    const old=fn,wrapped=function(){const b=currentBattle(rt);if(b)repairBattleStats(rt,b,false);const out=old.apply(this,arguments);const after=currentBattle(rt);if(after&&repairBattleStats(rt,after,false)>0)refreshDetail(rt);return out};wrapped.__gensRpg1145StatsLink=true;wrapped.__original=old;U.render=wrapped;uiHooked=true;return true;
  }

  function maintain(rt=R){ensureStyle(rt);patchMapHtml(rt);paintExistingWalls(rt);patchDice(rt);patchAdapter(rt);patchUi(rt);const b=currentBattle(rt);if(b&&repairBattleStats(rt,b,false)>0)refreshDetail(rt);return true}
  function install(rt=R){maintain(rt);try{rt.GENS_RPG_TACTICAL_WALL_DICE_STATS_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000,9000,12000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,SNAPSHOT_VERSION,LINK_VERSION,WALL_ASSET,DICE_MS,DICE_TICK_MS,canonicalValue,buildLinkedSnapshot,repairBattleStats,patchMapHtml,paintExistingWalls,patchDice,patchAdapter,patchUi,install,installWithRetries,status:()=>({installed,mapHooked,diceHooked,adapterHooked,uiHooked})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});