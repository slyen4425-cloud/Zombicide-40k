/* GenSrpG V16.78.110 — cached canonical RPG stats bridge for Tactical Combat V2.
   Expensive RPG/equipment/stat derivation happens only when a tactical snapshot is built.
   Preview, resolution and rendering read the in-memory snapshot and never recalculate RPG stats. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalStats1678110=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.110",SNAPSHOT_VERSION="16.78.110";
  const STYLE_ID="gensRpgTacticalStats1678110Style";
  const dirtyHeroes=new Set();
  const metrics={snapshotsBuilt:0,canonicalReads:0,derivedReads:0,previewSnapshotReads:0,renderSnapshotReads:0};
  let installed=false,uiHooked=false,adapterHooked=false,rulesHooked=false,saveHooked=false,clickHooked=false,lastDetailActorId="";
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=v=>str(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function doc(rt=R){return rt?.document||null}
  function engine(rt=R){return rt?.GensRpgTacticalCombatV2||null}
  function adapter(rt=R){return rt?.GensRpgTacticalCombatV2Adapter||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function statsApi(rt=R){return rt?.GensCleanRpgStats167874||null}
  function heroState(rt,id){try{return rt?.loadState?.(id)||null}catch(e){return null}}
  function heroRecord(rt,id){try{return rt?.CHARS?.[id]||rt?.findCustomHero?.(id)||null}catch(e){return rt?.CHARS?.[id]||null}}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function actorHeroId(actor){return str(actor?.meta?.heroId||actor?.id)}
  function safeCall(rt,name,fallback,...args){try{if(typeof rt?.[name]==="function"){metrics.derivedReads++;const v=rt[name](...args);return v===undefined||v===null?fallback:v}}catch(e){}return fallback}
  function withHero(rt,id,fn){
    const hadCurrent=Object.prototype.hasOwnProperty.call(rt,"current"),hadState=Object.prototype.hasOwnProperty.call(rt,"state");
    const oldCurrent=rt.current,oldState=rt.state;
    try{rt.current=id;rt.state=heroState(rt,id)||{};return fn(rt.state)}finally{
      if(hadCurrent)rt.current=oldCurrent;else try{delete rt.current}catch(e){}
      if(hadState)rt.state=oldState;else try{delete rt.state}catch(e){}
    }
  }
  function normalizeResistanceKey(k){
    const s=str(k).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(k).trim().toLowerCase();
    const map={feu:"fire",fire:"fire",eau:"water",water:"water",terre:"earth",earth:"earth",lumiere:"light",light:"light",ombre:"shadow",shadow:"shadow",air:"air",electricite:"electric",electric:"electric",electricity:"electric",lightning:"electric"};
    return map[s]||s;
  }
  function collectResistanceObjects(...sources){
    const out={};
    for(const src of sources){if(!src||typeof src!=="object"||Array.isArray(src))continue;for(const [k,v] of Object.entries(src)){if(!Number.isFinite(Number(v)))continue;out[normalizeResistanceKey(k)]=clamp(num(v),-100,100)}}
    return out;
  }
  function resistanceSnapshot(rt,id,state,rec){
    return collectResistanceObjects(state?.resistances,state?.rpgResistances,state?.elementResistances,state?.elements?.resistances,rec?.resistances,rec?.rpgResistances,rec?.elementResistances,rec?.elements?.resistances);
  }
  function rulesSnapshot(rt){
    let r={};try{r=rt?.loadDungeonRpgRules?.()||{}}catch(e){}
    const criticalMultiplier=clamp(num(r.critMultiplier??r.criticalMultiplier??r.critDamageMultiplier,2),1,5);
    return {criticalMultiplier};
  }
  function buildHeroSnapshot(rt=R,heroId="",actor=null){
    const id=str(heroId);if(!id)return null;
    const api=statsApi(rt),rec=heroRecord(rt,id),st=heroState(rt,id)||{};
    return withHero(rt,id,()=>{
      if(typeof api?.coreSnapshot!=="function")throw new Error("Core Stats snapshot adapter unavailable");
      const core=api.coreSnapshot(id);if(!core)throw new Error("Core Stats snapshot unavailable for "+id);
      const canonical=arr(core.canonical).map(row=>({id:str(row?.id),name:str(row?.name||row?.id),icon:str(row?.icon||""),value:num(row?.value,0)}));
      const values={...(core.values||{})},stable=core.derived||{};metrics.canonicalReads+=canonical.length;
      const maxHp=Math.max(1,num(actor?.maxHp,safeCall(rt,"effectiveMaxWounds",1)));
      const hp=clamp(num(actor?.hp,maxHp-num(st?.wounds,0)),0,maxHp);
      const movement=Math.max(0,num(values.movement, safeCall(rt,"dungeonHeroMoveValue083",num(actor?.movement,3),id)));
      const initiative=num(values.initiative,safeCall(rt,"dungeonDerivedInitiative",num(actor?.initiative,10)));
      const defense=Math.max(0,num(values.defense,safeCall(rt,"dungeonDerivedDefense",num(actor?.defense,0))));
      const armor=Math.max(0,num(values.armor,safeCall(rt,"dungeonArmorScore",num(actor?.armor,0))));
      const dodge=clamp(num(stable.dodge,num(actor?.dodge,0)),0,100);
      const crit=clamp(num(stable.crit,0),0,100);
      const magicResistance=Math.max(0,num(stable.magicResistance,0));
      const maxMana=Math.max(0,num(stable.maxMana,0));
      const mana=Math.max(0,num(st?.mana??st?.mp??st?.currentMana,maxMana));
      const physicalDamageBonus=num(stable.physicalDamageBonus,0),magicDamageBonus=num(stable.magicDamageBonus,0);
      const snap={version:SNAPSHOT_VERSION,heroId:id,builtAt:Date.now(),canonical,values,
        derived:{hp,maxHp,mana,maxMana,crit,dodge,magicResistance,defense,armor,initiative,movement,physicalDamageBonus,magicDamageBonus},
        resistances:resistanceSnapshot(rt,id,st,rec),rules:rulesSnapshot(rt)};
      metrics.snapshotsBuilt++;return snap;
    });
  }
  function applyHeroSnapshot(actor,snap,{preserveTurnResources=true}={}){
    if(!actor||!snap)return actor;actor.meta=actor.meta&&typeof actor.meta==="object"?actor.meta:{};actor.meta.rpgStats=snap;
    const d=snap.derived||{},oldMovementLeft=num(actor.movementLeft,0),wasStarted=actor.movementLeft!==undefined;
    if(Number.isFinite(Number(d.movement))&&num(d.movement)>0)actor.movement=Math.max(0,Math.round(num(d.movement)));
    if(Number.isFinite(Number(d.initiative)))actor.initiative=num(d.initiative);
    if(Number.isFinite(Number(d.defense)))actor.defense=Math.max(0,num(d.defense));
    if(Number.isFinite(Number(d.armor)))actor.armor=Math.max(0,num(d.armor));
    if(Number.isFinite(Number(d.dodge)))actor.dodge=clamp(num(d.dodge),0,95);
    if(wasStarted)actor.movementLeft=Math.min(oldMovementLeft,actor.movement);
    return actor;
  }
  function enemySnapshot(rt,actor){
    if(!actor||actor.side!=="enemy")return null;let inst=null,def=null,d={};
    try{inst=arr(rt?.loadActiveEnemies?.()).find(x=>str(x?.id)===str(actor?.meta?.instanceId))||null}catch(e){}
    try{def=rt?.activeEnemyDefinition?.(inst?.enemyId||actor?.meta?.enemyId)||null}catch(e){}
    try{d=rt?.dungeonEnemyDerivedForInstance?.(inst)||rt?.dungeonEnemyDerived?.(def)||{}}catch(e){}
    const resistances=collectResistanceObjects(d?.resistances,d?.elementResistances,def?.resistances,def?.elementResistances,def?.rule?.resistances);
    return {version:SNAPSHOT_VERSION,enemyId:str(actor?.meta?.enemyId||inst?.enemyId),builtAt:Date.now(),canonical:[],values:{},derived:{crit:clamp(num(d?.crit??d?.criticalChance??def?.rule?.crit,0),0,100),magicResistance:Math.max(0,num(d?.magicResistance??d?.magic_resistance??def?.rule?.magicResistance,0))},resistances,rules:rulesSnapshot(rt)};
  }
  function decorateBattle(rt=R,battle=currentBattle(rt),{force=false}={}){
    if(!battle?.actors)return battle;
    for(const actor of battle.actors){
      if(actor.side==="hero"){
        const id=actorHeroId(actor),stale=force||dirtyHeroes.has(id)||actor?.meta?.rpgStats?.version!==SNAPSHOT_VERSION;
        if(stale){applyHeroSnapshot(actor,buildHeroSnapshot(rt,id,actor),{preserveTurnResources:!force});dirtyHeroes.delete(id)}
      }else if(force||actor?.meta?.rpgStats?.version!==SNAPSHOT_VERSION){actor.meta=actor.meta||{};actor.meta.rpgStats=enemySnapshot(rt,actor)}
    }
    battle.meta=battle.meta&&typeof battle.meta==="object"?battle.meta:{};battle.meta.statsSnapshotVersion=SNAPSHOT_VERSION;return battle;
  }
  function refreshHeroSnapshot(rt=R,heroId=""){
    const b=currentBattle(rt),id=str(heroId);if(!b||!id)return false;const actor=arr(b.actors).find(a=>a.side==="hero"&&actorHeroId(a)===id);if(!actor)return false;
    applyHeroSnapshot(actor,buildHeroSnapshot(rt,id,actor),{preserveTurnResources:true});dirtyHeroes.delete(id);return true;
  }
  function markHeroDirty(heroId){const id=str(heroId);if(id)dirtyHeroes.add(id);return id}
  function hookSaveInvalidation(rt=R){
    if(saveHooked)return true;const old=rt?.saveState;if(typeof old!=="function")return false;if(old.__gensRpg110Dirty){saveHooked=true;return true}
    const wrapped=function(heroId){const out=old.apply(this,arguments);markHeroDirty(heroId);return out};wrapped.__gensRpg110Dirty=true;wrapped.__original=old;rt.saveState=wrapped;saveHooked=true;return true;
  }
  function normalizeDamageType(value){
    const s=normalizeResistanceKey(value||"physical");if(["magic","magique","arcane"].includes(s))return "magic";if(["physical","physique","melee","ranged"].includes(s))return "physical";return s;
  }
  function snapshotOf(actor){metrics.previewSnapshotReads++;return actor?.meta?.rpgStats||null}
  function resistanceFor(actor,damageType){
    const snap=snapshotOf(actor),type=normalizeDamageType(damageType);if(!snap)return {kind:"none",value:0};
    if(type==="magic")return {kind:"flat",value:Math.max(0,num(snap?.derived?.magicResistance,0))};
    const pct=num(snap?.resistances?.[type],0);return {kind:"percent",value:clamp(pct,-100,100)};
  }
  function adjustedDamage(preview,target){
    if(!preview?.ok)return preview;const attack=preview.attack||{},type=normalizeDamageType(attack.damageType);
    if(type==="physical")return {...preview,damageType:type,resistance:0};
    const raw=Math.max(0,num(attack.power,preview.damage)),res=resistanceFor(target,type);let damage=raw;
    if(res.kind==="flat")damage=Math.max(0,Math.round(raw-res.value));
    else if(res.kind==="percent")damage=Math.max(0,Math.round(raw*(1-res.value/100)));
    return {...preview,damageType:type,rawDamage:raw,resistance:res.value,resistanceKind:res.kind,damage};
  }
  function nextRandom(state){
    if(!state?.rngSeed)return Math.random();let t=state.rngSeed=(state.rngSeed+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;
  }
  function hookRules(rt=R){
    if(rulesHooked)return true;const E=engine(rt);if(!E?.attackPreview||!E?.resolveAttack)return false;if(E.__gensRpg110StatsRules){rulesHooked=true;return true}
    const basePreview=E.attackPreview;
    const preview=function(state,attackerId,targetId,attackId){const p=basePreview.call(E,state,attackerId,targetId,attackId);if(!p?.ok)return p;const attacker=E.actorById?.(state,attackerId),target=E.actorById?.(state,targetId);const out=adjustedDamage(p,target);const snap=snapshotOf(attacker);return {...out,critChance:clamp(num(snap?.derived?.crit,0),0,100),critMultiplier:clamp(num(snap?.rules?.criticalMultiplier,2),1,5)}};
    const resolve=function(state,attackerId,targetId,attackId,forcedRoll=null){
      if(state?.status!=="active")return {ok:false,reason:"battle-ended"};const cur=E.currentActor?.(state);if(!cur||cur.id!==str(attackerId))return {ok:false,reason:"not-current-actor"};if(cur.actionsLeft<1)return {ok:false,reason:"no-action"};
      const p=preview(state,attackerId,targetId,attackId);if(!p?.ok)return p;const target=E.actorById?.(state,targetId);if(!target)return {ok:false,reason:"actor-missing"};
      const roll=forcedRoll==null?Math.floor(nextRandom(state)*100)+1:clamp(Math.trunc(num(forcedRoll,100)),1,100),hit=roll<=p.hitChance;
      let crit=false,critRoll=null,damage=hit?p.damage:0;if(hit&&damage>0&&p.critChance>0){critRoll=Math.floor(nextRandom(state)*100)+1;crit=critRoll<=p.critChance;if(crit)damage=Math.max(0,Math.round(damage*p.critMultiplier))}
      if(damage>0){target.hp=clamp(num(target.hp)-damage,0,num(target.maxHp,1));if(target.hp<=0)target.alive=false}
      cur.actionsLeft-=1;const result={ok:true,hit,roll,hitChance:p.hitChance,damage,targetHp:target.hp,targetDefeated:!target.alive,attackId:p.attack.id,attackerId:cur.id,targetId:target.id,cellCover:p.cellCover||0,totalCover:p.totalCover||0,damageType:p.damageType||normalizeDamageType(p.attack.damageType),resistance:p.resistance||0,crit,critRoll,critChance:p.critChance,critMultiplier:p.critMultiplier};
      state.log.push({type:"attack",...result});E.refreshOutcome?.(state);return result;
    };
    function nearestEnemy(state,actor){return arr(state?.actors).filter(a=>a.alive&&a.side!==actor.side).sort((a,b)=>E.distance(actor,a)-E.distance(actor,b)||num(a.hp)-num(b.hp)||str(a.id).localeCompare(str(b.id)))[0]||null}
    function bestAttack(state,actor,target){return arr(actor?.attacks).map(a=>({a,p:preview(state,actor.id,target.id,a.id)})).filter(x=>x.p.ok).sort((x,y)=>y.p.damage-x.p.damage||y.p.hitChance-x.p.hitChance||x.p.distance-y.p.distance)[0]||null}
    const aiStep=function(state,actorId=E.currentActor?.(state)?.id){
      const actor=E.actorById?.(state,actorId);if(!actor||!actor.alive||actor.side!=="enemy")return {ok:false,reason:"not-ai-actor"};if(E.currentActor?.(state)?.id!==actor.id)return {ok:false,reason:"not-current-actor"};
      let target=nearestEnemy(state,actor),choice=target?bestAttack(state,actor,target):null;if(choice&&actor.actionsLeft>0){const attack=resolve(state,actor.id,target.id,choice.a.id);if(state.status==="active")E.endTurn(state);return {ok:true,type:"attack",attack}}
      const cells=E.reachableCells(state,actor.id).filter(c=>c.cost>0);let best=null;for(const cell of cells){const d=target?E.distance(cell,target):999,cover=num(E.coverAt?.(state,cell),0),score=d*100-cover*2+cell.cost;if(!best||score<best.score)best={cell,score}}if(best)E.moveActor(state,actor.id,best.cell);
      target=nearestEnemy(state,actor);choice=target?bestAttack(state,actor,target):null;let attack=null;if(choice&&actor.actionsLeft>0)attack=resolve(state,actor.id,target.id,choice.a.id);if(state.status==="active")E.endTurn(state);return {ok:true,type:attack?"move-attack":"move",attack,position:{x:actor.x,y:actor.y}};
    };
    E.attackPreview=preview;E.resolveAttack=resolve;E.aiStep=aiStep;E.__gensRpg110StatsRules=true;rulesHooked=true;return true;
  }
  function hookAdapter(rt=R){
    if(adapterHooked)return true;const A=adapter(rt);if(!A?.createBattle)return false;if(A.createBattle.__gensRpg110Stats){adapterHooked=true;return true}
    const old=A.createBattle,wrapped=function(){const b=old.apply(this,arguments);return decorateBattle(rt,b,{force:true})};wrapped.__gensRpg110Stats=true;wrapped.__original=old;A.createBattle=wrapped;adapterHooked=true;return true;
  }
  function statRows(snapshot){metrics.renderSnapshotReads++;return arr(snapshot?.canonical).map(x=>({id:x.id,label:(x.icon?x.icon+" ":"")+x.name,value:x.value}))}
  function detailRows(actor){
    const snap=actor?.meta?.rpgStats;if(!snap)return [];const rows=statRows(snap),seen=new Set(rows.map(x=>x.id)),d=snap.derived||{};
    const add=(id,label,value,suffix="")=>{if(seen.has(id)||!Number.isFinite(Number(value)))return;seen.add(id);rows.push({id,label,value,suffix})};
    add("crit","💥 Critique",d.crit,"%");add("magic_resistance","🔮 Résistance magique",d.magicResistance);if(d.maxMana>0){add("mana","🔷 Mana",d.mana+"/"+d.maxMana)}
    return rows;
  }
  function detailStatsHtml(actor){return detailRows(actor).map(r=>`<div class="gtv271Stat gtv2110Stat"><strong>${esc(r.value)}${esc(r.suffix||"")}</strong>${esc(r.label)}</div>`).join("")}
  function ensureStyle(rt=R){
    const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv2109QuickAttack{display:none!important}
      .gtv2Overlay{padding-bottom:calc(74px + env(safe-area-inset-bottom,0px))!important}
      .gtv2110Dock{position:fixed;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:31600;width:min(94vw,520px);display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;background:#0d121beF;border:1px solid #48566a;border-radius:14px;box-shadow:0 10px 32px #000b;backdrop-filter:blur(8px)}
      .gtv2110Dock.hasAbility{grid-template-columns:1fr 1fr 1fr}.gtv2110Dock button{min-height:48px;border:0;border-radius:10px;font-weight:900;color:#fff;background:#303946;font-size:14px}.gtv2110Dock button.attack{background:#286b48}.gtv2110Dock button.ability{background:#604d86}.gtv2110Dock button:disabled{opacity:.42}.gtv2110FullStatsTitle{margin:12px 0 5px;font-size:12px;font-weight:900;color:#d8e2ef;letter-spacing:.04em}.gtv2110Stat{border:1px solid #283545}
      @media(max-width:430px){.gtv2110Dock{width:calc(100vw - 12px);bottom:calc(5px + env(safe-area-inset-bottom,0px));gap:5px;padding:6px}.gtv2110Dock button{font-size:12px;min-height:45px;padding:6px}}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }
  function sourceButton(rt,kind){const D=doc(rt),overlay=D?.querySelector?.(".gtv2Overlay");if(!overlay)return null;if(kind==="attack")return overlay.querySelector?.("[data-v108-attack-go]")||overlay.querySelector?.(".gtv2Actions button[data-attack]");if(kind==="end")return overlay.querySelector?.(".gtv2Actions button[data-end]");if(kind==="ability")return overlay.querySelector?.("[data-v110-ability-go],[data-v108-ability-go]");return null}
  function ensureDock(rt=R){
    const D=doc(rt),overlay=D?.querySelector?.(".gtv2Overlay"),b=currentBattle(rt),E=engine(rt),cur=b&&E?.currentActor?.(b);if(!D||!overlay||!b)return false;
    let dock=overlay.querySelector?.("[data-v110-dock]");if(!dock){dock=D.createElement("div");dock.className="gtv2110Dock";dock.setAttribute("data-v110-dock","1");dock.innerHTML='<button type="button" class="attack" data-v110-attack>⚔️ Attaquer</button><button type="button" data-v110-end>⏭️ Fin du tour</button><button type="button" class="ability" data-v110-ability>✨ Capacité</button>';overlay.appendChild(dock)}
    const heroTurn=b.status==="active"&&cur?.side==="hero",atk=sourceButton(rt,"attack"),end=sourceButton(rt,"end"),ability=sourceButton(rt,"ability"),ab=dock.querySelector?.("[data-v110-ability]");dock.style.display=heroTurn?"grid":"none";
    const at=dock.querySelector?.("[data-v110-attack]"),en=dock.querySelector?.("[data-v110-end]");if(at)at.disabled=!heroTurn||!atk||!!atk.disabled;if(en)en.disabled=!heroTurn||!end||!!end.disabled;
    if(ab){ab.style.display=ability?"":"none";ab.disabled=!ability||!!ability.disabled}dock.classList?.toggle?.("hasAbility",!!ability);return true;
  }
  function findDetailActor(rt=R){const b=currentBattle(rt);if(!b)return null;if(lastDetailActorId)return arr(b.actors).find(a=>str(a.id)===lastDetailActorId)||null;return null}
  function decorateDetail(rt=R){
    const D=doc(rt),card=D?.querySelector?.(".gtv271DetailCard"),actor=findDetailActor(rt);if(!card||!actor||actor.side!=="hero")return false;const html=detailStatsHtml(actor);if(!html)return false;
    const old=card.querySelector?.("[data-v110-full-stats]");old?.remove?.();const block=D.createElement("div");block.setAttribute("data-v110-full-stats","1");block.innerHTML=`<div class="gtv2110FullStatsTitle">FICHE RPG — VALEURS EFFECTIVES EN COMBAT</div><div class="gtv271Stats">${html}</div>`;
    const base=card.querySelector?.(".gtv271Stats");if(base){base.style.display="none";base.insertAdjacentElement?.("afterend",block)}else card.appendChild?.(block);return true;
  }
  function enhanceUi(rt=R){const b=currentBattle(rt);if(b)decorateBattle(rt,b);ensureStyle(rt);ensureDock(rt);decorateDetail(rt);return !!b}
  function hookUi(rt=R){
    if(uiHooked)return true;const U=ui(rt);if(!U?.render)return false;if(U.render.__gensRpg110Stats){uiHooked=true;return true}const old=U.render,wrapped=function(){try{const b=currentBattle(rt);if(b)decorateBattle(rt,b)}catch(e){}const out=old.apply(this,arguments);try{enhanceUi(rt)}catch(e){}return out};wrapped.__gensRpg110Stats=true;wrapped.__original=old;U.render=wrapped;uiHooked=true;return true;
  }
  function bindClicks(rt=R){
    if(clickHooked)return true;const D=doc(rt);if(!D?.addEventListener)return false;D.addEventListener("click",ev=>{
      const btn=ev.target?.closest?.("button");if(!btn)return;
      if(btn.dataset?.detail){lastDetailActorId=str(btn.dataset.detail);setTimeout(()=>decorateDetail(rt),0);return}
      if(btn.hasAttribute?.("data-detail-close")){lastDetailActorId="";return}
      if(btn.hasAttribute?.("data-v110-attack")){const src=sourceButton(rt,"attack");if(src&&!src.disabled)src.click?.();return}
      if(btn.hasAttribute?.("data-v110-end")){const src=sourceButton(rt,"end");if(src&&!src.disabled)src.click?.();return}
      if(btn.hasAttribute?.("data-v110-ability")){const src=sourceButton(rt,"ability");if(src&&!src.disabled)src.click?.();return}
    });clickHooked=true;return true;
  }
  function install(rt=R){ensureStyle(rt);hookSaveInvalidation(rt);hookAdapter(rt);hookRules(rt);hookUi(rt);bindClicks(rt);const b=currentBattle(rt);if(b)decorateBattle(rt,b);enhanceUi(rt);try{rt.GENS_RPG_TACTICAL_STATS_VERSION=APP_VERSION}catch(e){}installed=!!(adapterHooked&&rulesHooked);return installed}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500])setTimeout(()=>install(rt),ms);return true}
  function resetMetrics(){for(const k of Object.keys(metrics))metrics[k]=0;return metrics}
  const api={VERSION,APP_VERSION,SNAPSHOT_VERSION,metrics,resetMetrics,buildHeroSnapshot,applyHeroSnapshot,enemySnapshot,decorateBattle,refreshHeroSnapshot,markHeroDirty,normalizeDamageType,resistanceFor,adjustedDamage,statRows,detailRows,detailStatsHtml,ensureDock,decorateDetail,hookAdapter,hookRules,hookSaveInvalidation,install,installWithRetries,status:()=>({installed,adapterHooked,rulesHooked,uiHooked,snapshotsBuilt:metrics.snapshotsBuilt,dirty:[...dirtyHeroes]})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
