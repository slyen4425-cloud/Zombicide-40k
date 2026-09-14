/* GenSrpG V16.78.114.13 — interaction recovery + wall renderer reset.
   This module REMOVES the accumulated special wall ownership path instead of adding another renderer:
   walls use the same rendering principle as floor cells (one CSS background directly on the cell).
   It also makes the exploration hero card and Save & Quit route deterministic again. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgDungeonInteractionWallReset167811413=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.1",APP_VERSION="16.78.114.13";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgWallReset167811413Style";
  const RETRIES=[0,110,280,720,1100,1800];
  const NAV_RETRIES=[0,40,140,360];
  let installed=false,cardBound=false,quitPatched=false,heroPatched=false,resetCount=0;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const D=()=>R?.document||null;

  function runtimeState(){
    try{const x=R.loadDungeonState?.();if(x&&typeof x==="object")return x}catch(e){}
    try{const raw=R.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2");const x=raw?JSON.parse(raw):null;if(x&&typeof x==="object")return x}catch(e){}
    return null;
  }
  function visible(el){
    if(!el)return false;
    try{const cs=R.getComputedStyle?.(el);if(cs)return cs.display!=="none"&&cs.visibility!=="hidden"&&cs.opacity!=="0"}catch(e){}
    return el.style?.display!=="none";
  }
  function ensureStyle(){
    const doc=D();if(!doc)return false;
    let s=doc.getElementById(STYLE_ID);
    if(!s){s=doc.createElement("style");s.id=STYLE_ID;(doc.head||doc.documentElement||doc.body)?.appendChild(s)}
    s.textContent=`
      /* V114.13: same rendering model as floor — texture belongs to the cell itself. */
      .dc047Cell.wall,.gtv2Cell.blocked,.drc100Cell.wall,.gtv2112WallCell,.gtv2113Wall{
        background-color:#171512!important;
        background-image:url('${WALL_ASSET}')!important;
        background-position:center!important;
        background-size:cover!important;
        background-repeat:no-repeat!important;
        filter:none!important;
        contain:none!important;
        isolation:auto!important;
        transform-style:flat!important;
        will-change:auto!important;
      }
      .dc047Cell.wall>*{visibility:hidden!important;pointer-events:none!important}
      .gtv2Cell.blocked>.gtv2WallTile,.drc100Cell.wall>.gtv2WallTile,.gtv2112WallCell>.gtv2WallTile,.gtv2113Wall>.gtv2WallTile,.dc047Cell.wall>.gtv2WallTile{display:none!important}
      .gtv2Cell.blocked::before,.gtv2Cell.blocked::after,.dc047Cell.wall::before,.dc047Cell.wall::after{content:none!important;display:none!important}
      #dc01Heroes .dc01Hero{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important}
      #dc01Heroes .dc01Hero img{pointer-events:none!important;user-select:none!important;-webkit-user-drag:none!important}
    `;
    return true;
  }
  function unwrapMarked(fn,markers){
    let cur=fn,n=0,guard=0;
    while(typeof cur==="function"&&typeof cur.__original==="function"&&guard++<12){
      if(!markers.some(k=>cur[k]===true))break;
      cur=cur.__original;n++;
    }
    return {fn:cur,count:n};
  }
  function restoreNativeMapRenderer(){
    const cur=R.dungeonMapHtml;if(typeof cur!=="function")return 0;
    const out=unwrapMarked(cur,["__gtv271WallPatch"]);if(out.count)R.dungeonMapHtml=out.fn;return out.count;
  }
  function restoreDungeonRenderers(){
    const core=R.DungeonCore01;if(!core)return 0;let n=0;
    for(const name of ["render","show"]){
      const cur=core[name];if(typeof cur!=="function")continue;
      const out=unwrapMarked(cur,["__gensRpg11412WallPostRender","__gtv271WallRender"]);if(out.count){core[name]=out.fn;n+=out.count}
    }
    return n;
  }
  function cleanWallCells(){
    const doc=D();if(!doc)return 0;let n=0;
    for(const img of doc.querySelectorAll?.(".gtv2WallTile")||[]){try{img.remove();n++}catch(e){}}
    for(const el of doc.querySelectorAll?.(".dc047Cell.wall,.gtv2Cell.blocked,.drc100Cell.wall,.gtv2112WallCell,.gtv2113Wall,.dav167870WallCell,.gtv2WallOwner")||[]){
      try{el.classList?.remove?.("dav167870WallCell","gtv2WallOwner");for(const p of ["background","background-image","background-color","contain","isolation","transform-style","will-change"])el.style?.removeProperty?.(p);n++}catch(e){}
    }
    return n;
  }
  function resetWalls(){ensureStyle();const n=restoreNativeMapRenderer()+restoreDungeonRenderers()+cleanWallCells();resetCount+=n;return n}

  function participants(){return arr(runtimeState()?.participants).map(String)}
  function cardHeroId(card){
    if(!card)return "";const direct=str(card.dataset?.heroId||card.dataset?.characterId||"");if(direct)return direct;
    const host=card.closest?.("#dc01Heroes")||D()?.getElementById?.("dc01Heroes");if(!host)return "";
    const cards=[...(host.querySelectorAll?.(":scope > .dc01Hero")||[])],i=cards.indexOf(card),ids=participants();return i>=0?str(ids[i]||""):"";
  }
  function allowedHero(id){
    const doc=D(),role=str(doc?.getElementById?.("dc01Role")?.value||"player"),assigned=str(doc?.getElementById?.("dc01DeviceHero")?.value||"");
    return role==="gm"||!assigned||assigned===str(id);
  }
  function forceOpenHero(id){
    id=str(id);if(!id)return false;const doc=D(),core=doc?.getElementById?.("gensDungeonCore01"),sheet=doc?.getElementById?.("sheet");
    try{if(core)core.style.display="none";if(typeof R.openChar==="function")R.openChar(id);else return false}catch(e){if(core)core.style.display="block";return false}
    if(sheet&&!visible(sheet)){if(core)core.style.display="block";return false}
    return true;
  }
  function verifyHeroRoute(id){
    const sheet=D()?.getElementById?.("sheet");if(visible(sheet))return true;return forceOpenHero(id)
  }
  function patchOpenHero(){
    const core=R.DungeonCore01,old=core?.openHero;if(typeof old!=="function")return false;if(old.__gensRpg11413HeroOpen){heroPatched=true;return true}
    const wrapped=function(id){
      const out=old.apply(this,arguments);if(!allowedHero(id))return out;
      for(const ms of NAV_RETRIES){const fn=()=>verifyHeroRoute(id);if(ms===0)fn();else if(typeof R.setTimeout==="function")R.setTimeout(fn,ms)}
      return out;
    };
    wrapped.__gensRpg11413HeroOpen=true;wrapped.__original=old;core.openHero=wrapped;heroPatched=true;return true;
  }
  function bindHeroCards(){
    const doc=D();if(!doc?.addEventListener||cardBound)return !!doc;
    doc.addEventListener("click",ev=>{
      const card=ev?.target?.closest?.("#dc01Heroes .dc01Hero");if(!card)return;const id=cardHeroId(card);if(!id||!allowedHero(id))return;
      ev.preventDefault?.();ev.stopPropagation?.();ev.stopImmediatePropagation?.();
      const core=R.DungeonCore01;if(typeof core?.openHero==="function")core.openHero(id);else verifyHeroRoute(id);
    },true);
    cardBound=true;return true;
  }
  function forceRootHome(){
    const doc=D();if(!doc)return false;
    try{R.GensRpgTacticalCombatV2Ui?.close?.(false)}catch(e){}
    for(const el of doc.querySelectorAll?.(".gtv2Overlay,[data-v1143-transition]")||[])try{el.remove()}catch(e){}
    const core=doc.getElementById("gensDungeonCore01"),sheet=doc.getElementById("sheet"),family=doc.getElementById("gensFamilyHome"),game=doc.getElementById("gensGameHome"),root=doc.getElementById("gensRootHome");
    if(core)core.style.display="none";if(sheet)sheet.style.display="none";if(family)family.style.display="none";if(game)game.style.display="none";if(root)root.style.display="block";
    try{R.scrollTo?.(0,0)}catch(e){}return !!root;
  }
  function verifyQuitRoute(){
    let active=false;try{active=!!R.DungeonCore01?.active}catch(e){}
    if(active)return false;return forceRootHome()
  }
  function patchQuit(){
    const core=R.DungeonCore01,old=core?.quit;if(typeof old!=="function")return false;if(old.__gensRpg11413Quit){quitPatched=true;return true}
    const wrapped=function(){
      let before=false;try{before=!!core.active}catch(e){}
      const out=old.apply(this,arguments);
      let after=before;try{after=!!core.active}catch(e){}
      if(before&&!after)for(const ms of NAV_RETRIES){const fn=verifyQuitRoute;if(ms===0)fn();else if(typeof R.setTimeout==="function")R.setTimeout(fn,ms)}
      return out;
    };
    wrapped.__gensRpg11413Quit=true;wrapped.__original=old;core.quit=wrapped;quitPatched=true;return true;
  }
  function install(){resetWalls();patchOpenHero();bindHeroCards();patchQuit();try{R.GENS_RPG_DUNGEON_INTERACTION_WALL_RESET_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(){for(const ms of RETRIES){if(ms===0)install();else if(typeof R.setTimeout==="function")R.setTimeout(install,ms)}return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,STYLE_ID,RETRIES,NAV_RETRIES,runtimeState,visible,unwrapMarked,restoreNativeMapRenderer,restoreDungeonRenderers,cleanWallCells,resetWalls,participants,cardHeroId,allowedHero,forceOpenHero,verifyHeroRoute,patchOpenHero,bindHeroCards,forceRootHome,verifyQuitRoute,patchQuit,install,installWithRetries,status:()=>({installed,cardBound,quitPatched,heroPatched,resetCount})};
  if(D()){if(D().readyState==="loading")D().addEventListener?.("DOMContentLoaded",installWithRetries,{once:true});else installWithRetries()}
  return api;
});
