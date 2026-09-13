/* GenSrpG V16.78.108 — Dungeon/tactical readability and action ergonomics.
   - Immediate proximity detection after Dungeon movement, using the traversable grid.
   - Restores the wall texture validated by Dungeon Builder/authored rooms.
   - Keeps complete pawn portraits visible instead of cropping heads.
   - Adds compact attack / weapon / reload / item selectors on the tactical hero turn.
   Existing combat, reload, inventory and item systems remain the source of truth. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalPolish1678108=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.108";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const RUNTIME_KEY="gensrpg_dungeon_runtime_v2";
  const DETECTION_RADIUS=1;
  const STYLE_ID="gensRpgTacticalPolish1678108Style";
  let observer=null,installed=false,lastDetectionStamp="",lastDetectionAt=0;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const esc=v=>str(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const escAttr=esc;
  function doc(rt=R){return rt?.document||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function adapter(rt=R){return rt?.GensRpgTacticalCombatV2Adapter||null}
  function engine(rt=R){return rt?.GensRpgTacticalCombatV2||null}

  function runtimeState(rt=R){
    try{const raw=rt?.localStorage?.getItem?.(RUNTIME_KEY);return raw?JSON.parse(raw):null}catch(e){return null}
  }
  function activeHeroId(state){
    if(!state)return "";
    return str(arr(state.participants)[num(state.index,0)]||"");
  }
  function roomOfHero(state,heroId){
    const specific=state?.heroRooms?.[heroId];
    return specific===undefined||specific===null?num(state?.room,0):num(specific,0);
  }
  function mapSize(map){
    const width=Math.max(1,num(map?.width,map?.size||0));
    const height=Math.max(1,num(map?.height,map?.size||Math.ceil(arr(map?.cells).length/width)||1));
    return {width,height};
  }
  function blockedKind(kind){return /^(?:wall|void|blocked|rock)$/i.test(str(kind).trim())}
  function gridDistance(map,fromIndex,toIndex,maxDistance=Infinity){
    const cells=arr(map?.cells),{width,height}=mapSize(map),from=num(fromIndex,-1),to=num(toIndex,-1);
    if(from<0||to<0||from>=width*height||to>=width*height)return Infinity;
    if(from===to)return 0;
    if(blockedKind(cells[from])||blockedKind(cells[to]))return Infinity;
    const seen=new Set([from]),queue=[[from,0]];
    while(queue.length){
      const [idx,d]=queue.shift();
      if(d>=maxDistance)continue;
      const x=idx%width,y=Math.floor(idx/width);
      const next=[];
      if(x>0)next.push(idx-1);if(x+1<width)next.push(idx+1);
      if(y>0)next.push(idx-width);if(y+1<height)next.push(idx+width);
      for(const n of next){
        if(n<0||n>=width*height||seen.has(n)||blockedKind(cells[n]))continue;
        if(n===to)return d+1;
        seen.add(n);queue.push([n,d+1]);
      }
    }
    return Infinity;
  }
  function detectionEnemyIds(state,enemies,radius=DETECTION_RADIUS){
    if(!state)return [];
    const heroId=activeHeroId(state),heroCell=num(state?.positions?.[heroId],-1),room=roomOfHero(state,heroId),map=state?.last?.map;
    if(!heroId||heroCell<0||!map)return [];
    const enemyCells=state?.enemyCells||{};
    return arr(enemies).filter(enemy=>{
      if(num(enemy?.hp,0)<=0)return false;
      if(enemy?.dungeonRoom!==undefined&&enemy?.dungeonRoom!==null&&num(enemy.dungeonRoom,room)!==room)return false;
      const cell=num(enemyCells[str(enemy?.id)],-1);
      return cell>=0&&gridDistance(map,heroCell,cell,radius)<=radius;
    }).map(enemy=>str(enemy.id)).filter(Boolean);
  }
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function scanImmediateDetection(rt=R){
    if(currentBattle(rt))return [];
    const state=runtimeState(rt);if(!state)return [];
    let enemies=[];try{enemies=arr(rt?.loadActiveEnemies?.())}catch(e){}
    const ids=detectionEnemyIds(state,enemies,DETECTION_RADIUS);if(!ids.length)return [];
    const hero=activeHeroId(state),cell=num(state?.positions?.[hero],-1),room=roomOfHero(state,hero);
    const stamp=[room,hero,cell,...ids.slice().sort()].join(":");
    const now=Date.now();if(stamp===lastDetectionStamp&&now-lastDetectionAt<900)return [];
    lastDetectionStamp=stamp;lastDetectionAt=now;
    try{if(typeof rt?.dc200StartCombat==="function")rt.dc200StartCombat(ids,"detection-immediate")}catch(e){try{rt?.console?.warn?.("V16.78.108 immediate detection",e)}catch(_){}}
    return ids;
  }
  function hookDetection(rt=R){
    const old=rt?.dungeonMoveHero098;if(typeof old!=="function")return false;
    if(old.__gensRpg108ImmediateDetection)return true;
    const wrapped=function(){const out=old.apply(this,arguments);try{scanImmediateDetection(rt)}catch(e){}return out};
    wrapped.__gensRpg108ImmediateDetection=true;wrapped.__original=old;rt.dungeonMoveHero098=wrapped;return true;
  }

  function ensureStyle(rt=R){
    const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;
    const style=D.createElement("style");style.id=STYLE_ID;
    style.textContent=`
      .gtv2Pawn img{object-fit:contain!important;object-position:center top!important;transform:scale(.96);transform-origin:center top;background:transparent!important}
      .gtv2Cell.blocked,#drc100Grid .drc100Cell.wall{background-image:url("${WALL_ASSET}")!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
      .gtv2108Panel{display:grid;gap:8px;margin:8px 0;padding:9px;border:1px solid #3b4657;border-radius:12px;background:rgba(10,15,24,.92)}
      .gtv2108Row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center}
      .gtv2108Row.weapon{grid-template-columns:minmax(0,1fr) auto auto}
      .gtv2108Row.item{grid-template-columns:minmax(0,1fr) 68px auto}
      .gtv2108Label{font-size:11px;font-weight:900;letter-spacing:.04em;opacity:.76;text-transform:uppercase;grid-column:1/-1}
      .gtv2108Panel select,.gtv2108Panel button{min-height:38px;border-radius:9px;border:1px solid #53627a;background:#151d2a;color:#fff;padding:7px 9px;font-weight:800;box-sizing:border-box}
      .gtv2108Panel select{width:100%;min-width:0}.gtv2108Panel button{white-space:nowrap;cursor:pointer}
      .gtv2108Panel button:disabled,.gtv2108Panel select:disabled{opacity:.45;cursor:not-allowed}
      .gtv2108LegacyAttack{display:none!important}
      .gtv2108Hint{font-size:11px;opacity:.68;line-height:1.3}
      @media(max-width:540px){.gtv2108Row.weapon{grid-template-columns:minmax(0,1fr) auto}.gtv2108Row.weapon [data-v108-reload]{grid-column:1/-1}.gtv2108Row.item{grid-template-columns:minmax(0,1fr) 60px}.gtv2108Row.item [data-v108-use]{grid-column:1/-1}}
    `;
    (D.head||D.documentElement||D.body)?.appendChild(style);return true;
  }
  function paintWalls(rt=R){
    const D=doc(rt);if(!D)return 0;let count=0;
    for(const el of D.querySelectorAll?.("#drc100Grid .drc100Cell.wall")||[]){el.style?.setProperty?.("background-image",`url("${WALL_ASSET}")`,"important");el.style?.setProperty?.("background-size","cover","important");count++}
    const state=runtimeState(rt),map=state?.last?.map,kinds=arr(map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];
    for(let i=0;i<cells.length;i++)if(str(kinds[i]).toLowerCase()==="wall"){cells[i].style?.setProperty?.("background-image",`url("${WALL_ASSET}")`,"important");cells[i].style?.setProperty?.("background-size","cover","important");cells[i].style?.setProperty?.("background-position","center","important");count++}
    return count;
  }
  function patchDungeonMapHtml(rt=R){
    const old=rt?.dungeonMapHtml;if(typeof old!=="function")return false;
    if(old.__gensRpg108WallTexture)return true;
    const wrapped=function(){let html=old.apply(this,arguments);if(typeof html==="string")html=html.split("assets/dungeon/creatures/dungeon_wall.png").join(WALL_ASSET);return html};
    wrapped.__gensRpg108WallTexture=true;wrapped.__original=old;rt.dungeonMapHtml=wrapped;return true;
  }
  function hookDungeonRender(rt=R){
    const core=rt?.DungeonCore01;if(!core)return false;let hooked=false;
    for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__gensRpg108Walls)continue;const wrapped=function(){const out=old.apply(this,arguments);paintWalls(rt);return out};wrapped.__gensRpg108Walls=true;wrapped.__original=old;core[name]=wrapped;hooked=true}
    return hooked;
  }

  function itemFromEntry(rt,entry){try{return rt?.getItemFromEntry?.(entry)||rt?.itemById?.(entry?.itemId||entry?.id)||null}catch(e){return null}}
  function qtyOf(entry){return Math.max(1,num(entry?.qty,entry?.quantity??entry?.count??1))}
  function inventoryState(rt,heroId){try{return rt?.loadState?.(heroId)||null}catch(e){return null}}
  function weaponOptions(rt=R,heroId=""){
    const st=inventoryState(rt,heroId);if(!st)return [];
    return arr(st.inventory).map((entry,index)=>({entry,index,item:itemFromEntry(rt,entry)})).filter(x=>str(x.item?.type).toLowerCase()==="arme").map(x=>({index:x.index,id:str(x.item?.id||x.entry?.itemId),name:str(x.item?.name||x.item?.id||x.entry?.itemId||`Arme ${x.index+1}`),ammo:x.entry?.ammo,capacity:num(x.item?.ammoCapacity,0),equipped:x.index===st.rightHand||x.index===st.leftHand}));
  }
  function isConsumable(item){
    if(!item)return false;if(item.consumable===true)return true;
    const hay=(str(item.type)+" "+str(item.category)+" "+str(item.name)).toLowerCase();
    if(/consomm|potion|élixir|elixir|parchemin|scroll|grenade|soin/.test(hay))return true;
    const kind=str(item?.use?.kind||item?.combatUse?.kind).toLowerCase();return !!kind&&kind!=="damage";
  }
  function itemOptions(rt=R,heroId=""){
    const st=inventoryState(rt,heroId);if(!st)return [];
    const groups=new Map();
    arr(st.inventory).forEach((entry,index)=>{const item=itemFromEntry(rt,entry);if(!isConsumable(item))return;const id=str(item?.id||entry?.itemId||entry?.id);if(!id)return;const key=id,old=groups.get(key)||{id,name:str(item?.name||id),qty:0,index,item};old.qty+=qtyOf(entry);groups.set(key,old)});
    return [...groups.values()];
  }
  function currentActor(rt=R){const b=currentBattle(rt);if(!b)return null;try{return engine(rt)?.currentActor?.(b)||null}catch(e){return null}}
  function heroIdFromActor(actor){return str(actor?.meta?.heroId||actor?.id)}
  function refreshActorFromState(rt,heroId){
    const b=currentBattle(rt),actor=arr(b?.actors).find(a=>str(a.id)===str(heroId)||str(a?.meta?.heroId)===str(heroId));if(!actor)return false;
    try{const attacks=adapter(rt)?.heroAttacks?.(rt,heroId);if(Array.isArray(attacks)&&attacks.length)actor.attacks=attacks}catch(e){}
    try{const snap=rt?.dungeonCombatHeroSnapshot?.(heroId);if(snap&&Number.isFinite(Number(snap.hp))){actor.hp=Math.max(0,num(snap.hp));actor.maxHp=Math.max(actor.hp,num(snap.maxHp,actor.maxHp||actor.hp));actor.alive=actor.hp>0}}catch(e){}
    try{rt?.GensMobileCombatPerformance16781022?.clear?.()}catch(e){}
    try{ui(rt)?.render?.()}catch(e){}
    return true;
  }
  function equipWeapon(rt=R,heroId="",inventoryIndex=-1){
    const st=inventoryState(rt,heroId),idx=num(inventoryIndex,-1);if(!st||idx<0||idx>=arr(st.inventory).length)return false;
    const item=itemFromEntry(rt,st.inventory[idx]);if(str(item?.type).toLowerCase()!=="arme")return false;
    st.rightHand=idx;
    try{rt?.saveState?.(heroId,st)}catch(e){return false}
    refreshActorFromState(rt,heroId);return true;
  }
  function reloadWeapon(rt=R,heroId="",inventoryIndex=-1){
    const idx=num(inventoryIndex,-1);if(idx>=0&&!equipWeapon(rt,heroId,idx))return false;
    try{if(typeof rt?.dc214Reload==="function"){rt.dc214Reload(heroId);setTimeout(()=>refreshActorFromState(rt,heroId),0);return true}}catch(e){try{rt?.console?.warn?.("V16.78.108 reload",e)}catch(_){}}
    try{if(typeof rt?.refillWeapon==="function"){rt.refillWeapon(idx);setTimeout(()=>refreshActorFromState(rt,heroId),0);return true}}catch(e){}
    return false;
  }
  function legacyConsumableArgs(fn,heroId,item,index){
    let names=[];try{const src=Function.prototype.toString.call(fn),m=src.match(/^[^(]*\(([^)]*)\)/);if(m)names=m[1].split(",").map(x=>x.trim().toLowerCase()).filter(Boolean)}catch(e){}
    if(!names.length){if(fn.length>=2)return [heroId,item.id];if(fn.length===1)return [item.id];return []}
    return names.map((name,pos)=>{if(/hero|char|actor/.test(name))return heroId;if(/index|idx|slot|inventory/.test(name))return index;if(/item|object|objet|consum/.test(name))return item.id;if(/qty|quant|count|amount/.test(name))return 1;return pos===0?heroId:pos===1?item.id:index});
  }
  async function useConsumable(rt=R,heroId="",itemId="",qty=1){
    const options=itemOptions(rt,heroId),opt=options.find(x=>x.id===str(itemId));if(!opt)return false;
    const fn=rt?.dungeonCombatUseItem061;if(typeof fn!=="function")return false;
    const count=Math.max(1,Math.min(num(qty,1),opt.qty));
    for(let i=0;i<count;i++){
      const latest=itemOptions(rt,heroId).find(x=>x.id===opt.id);if(!latest)break;
      const args=legacyConsumableArgs(fn,heroId,latest.item,latest.index);
      if(!args.length)return false;
      await Promise.resolve(fn.apply(rt,args));
    }
    refreshActorFromState(rt,heroId);return true;
  }

  function attackLabel(a){
    let text=str(a?.name||a?.id||"Attaque");const range=num(a?.maxRange,0);if(range>0)text+=` · portée ${range}`;
    const ammo=a?.meta?.ammo,cap=a?.meta?.ammoCapacity;if(ammo!==undefined&&ammo!==null)text+=` · ${ammo}${cap?`/${cap}`:""}`;return text;
  }
  function actionPanelHtml(rt=R,actor=null){
    const heroId=heroIdFromActor(actor),weapons=weaponOptions(rt,heroId),items=itemOptions(rt,heroId),attacks=arr(actor?.attacks);
    const equipped=weapons.find(w=>w.equipped)||weapons[0],selectedWeapon=equipped?.index??-1;
    return `<div class="gtv2108Panel" data-v108-panel="${escAttr(heroId)}">
      <div class="gtv2108Row"><div class="gtv2108Label">⚔️ Attaque</div><select data-v108-attack ${attacks.length?"":"disabled"}>${attacks.length?attacks.map(a=>`<option value="${escAttr(a.id)}">${esc(attackLabel(a))}</option>`).join(""):'<option>Aucune attaque</option>'}</select><button type="button" data-v108-attack-go ${attacks.length?"":"disabled"}>Attaquer</button></div>
      <div class="gtv2108Row weapon"><div class="gtv2108Label">🗡️ Arme</div><select data-v108-weapon ${weapons.length?"":"disabled"}>${weapons.length?weapons.map(w=>`<option value="${w.index}" ${w.index===selectedWeapon?"selected":""}>${esc(w.name)}${w.capacity?` · ${num(w.ammo,0)}/${w.capacity}`:""}${w.equipped?" ✓":""}</option>`).join(""):'<option>Aucune arme</option>'}</select><button type="button" data-v108-equip ${weapons.length?"":"disabled"}>Équiper</button><button type="button" data-v108-reload ${weapons.some(w=>w.capacity>0)?"":"disabled"}>🔄 Recharger</button></div>
      <div class="gtv2108Row item"><div class="gtv2108Label">🧪 Objet</div><select data-v108-item ${items.length?"":"disabled"}>${items.length?items.map(it=>`<option value="${escAttr(it.id)}">${esc(it.name)} ×${it.qty}</option>`).join(""):'<option>Aucun consommable</option>'}</select><select data-v108-qty ${items.length?"":"disabled"}>${items.length?Array.from({length:Math.max(1,Math.min(99,items[0].qty))},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join(""):'<option>1</option>'}</select><button type="button" data-v108-use ${items.length&&typeof rt?.dungeonCombatUseItem061==="function"?"":"disabled"}>Utiliser</button></div>
      <div class="gtv2108Hint">Les capacités auront leur propre liste déroulante dans l’étape suivante, sans surcharger cette fiche.</div>
    </div>`;
  }
  function enhanceActions(rt=R){
    const D=doc(rt),U=ui(rt),battle=U?.getBattle?.();if(!D||!battle)return false;
    const actor=currentActor(rt);if(!actor||actor.side!=="hero")return false;
    const overlay=D.querySelector?.(".gtv2Overlay");if(!overlay)return false;
    const actions=overlay.querySelector?.(".gtv2Actions");if(!actions)return false;
    for(const btn of actions.querySelectorAll?.("button[data-attack]")||[])btn.classList?.add?.("gtv2108LegacyAttack");
    let panel=overlay.querySelector?.("[data-v108-panel]");const heroId=heroIdFromActor(actor);
    if(panel&&panel.getAttribute?.("data-v108-panel")!==heroId){panel.remove?.();panel=null}
    if(!panel){const wrap=D.createElement("div");wrap.innerHTML=actionPanelHtml(rt,actor);panel=wrap.firstElementChild;if(panel)actions.parentNode?.insertBefore?.(panel,actions)}
    return !!panel;
  }
  function updateQtySelect(rt=R,itemSelect){
    const panel=itemSelect?.closest?.("[data-v108-panel]"),heroId=panel?.getAttribute?.("data-v108-panel")||"",qtySel=panel?.querySelector?.("[data-v108-qty]");if(!qtySel)return;
    const opt=itemOptions(rt,heroId).find(x=>x.id===str(itemSelect.value)),max=Math.max(1,Math.min(99,num(opt?.qty,1)));
    qtySel.innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join("");
  }
  function bindControls(rt=R){
    const D=doc(rt);if(!D||D.__gensRpg108Controls)return true;D.__gensRpg108Controls=true;
    D.addEventListener?.("change",ev=>{const t=ev?.target;if(t?.matches?.("[data-v108-item]"))updateQtySelect(rt,t)});
    D.addEventListener?.("click",async ev=>{
      const btn=ev?.target?.closest?.("button[data-v108-attack-go],button[data-v108-equip],button[data-v108-reload],button[data-v108-use]");if(!btn)return;
      const panel=btn.closest?.("[data-v108-panel]"),heroId=panel?.getAttribute?.("data-v108-panel")||"";if(!panel||!heroId)return;
      ev.preventDefault?.();ev.stopPropagation?.();
      if(btn.hasAttribute("data-v108-attack-go")){
        const id=panel.querySelector?.("[data-v108-attack]")?.value,legacy=[...(D.querySelectorAll?.(".gtv2Actions button[data-attack]")||[])].find(b=>str(b.dataset?.attack)===str(id));legacy?.click?.();return;
      }
      const weaponIndex=num(panel.querySelector?.("[data-v108-weapon]")?.value,-1);
      if(btn.hasAttribute("data-v108-equip")){equipWeapon(rt,heroId,weaponIndex);return}
      if(btn.hasAttribute("data-v108-reload")){reloadWeapon(rt,heroId,weaponIndex);return}
      if(btn.hasAttribute("data-v108-use")){
        const itemId=panel.querySelector?.("[data-v108-item]")?.value,qty=num(panel.querySelector?.("[data-v108-qty]")?.value,1);btn.disabled=true;
        try{await useConsumable(rt,heroId,itemId,qty)}finally{btn.disabled=false;try{ui(rt)?.render?.()}catch(e){}}
      }
    },true);return true;
  }
  function hookUiRender(rt=R){
    const U=ui(rt),old=U?.render;if(typeof old!=="function")return false;if(old.__gensRpg108Polish)return true;
    const wrapped=function(){const out=old.apply(this,arguments);try{enhanceActions(rt);paintWalls(rt)}catch(e){}return out};wrapped.__gensRpg108Polish=true;wrapped.__original=old;U.render=wrapped;return true;
  }
  function observe(rt=R){
    const D=doc(rt);if(!D||observer||typeof rt?.MutationObserver!=="function")return false;
    observer=new rt.MutationObserver(()=>{try{enhanceActions(rt);paintWalls(rt)}catch(e){}});observer.observe(D.body||D.documentElement,{childList:true,subtree:true});return true;
  }
  function install(rt=R){
    ensureStyle(rt);patchDungeonMapHtml(rt);hookDungeonRender(rt);hookDetection(rt);bindControls(rt);hookUiRender(rt);observe(rt);paintWalls(rt);enhanceActions(rt);
    try{rt.GENS_RPG_TACTICAL_POLISH_VERSION=APP_VERSION}catch(e){}
    installed=true;return true;
  }
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function"){for(const ms of [80,220,600,1200,2500])setTimeout(()=>install(rt),ms)}return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,RUNTIME_KEY,DETECTION_RADIUS,mapSize,gridDistance,detectionEnemyIds,runtimeState,scanImmediateDetection,hookDetection,paintWalls,patchDungeonMapHtml,weaponOptions,itemOptions,equipWeapon,reloadWeapon,useConsumable,actionPanelHtml,enhanceActions,install,installWithRetries,status:()=>({installed,wall:WALL_ASSET,detectionRadius:DETECTION_RADIUS})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
