/* GenSrpG V16.78.112 — combat coherence and readable resolution.
   Final tactical/Dungeon layer focused on spatial correctness and UX without reintroducing hot-loop stat recalculation:
   - combat participants are scoped to the real room and perception/vision ranges;
   - enemy detection uses line of sight and configured enemy vision;
   - tactical actors keep their real Dungeon cells when possible;
   - actor details expose the cached canonical RPG sheet plus equipment/attack details;
   - dice results explain misses, armor/resistance and final damage;
   - wall art is painted through a stable per-cell layer and the mobile action dock is more compact. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatCoherence1678112=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.112";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgTacticalCombatCoherence1678112Style";
  const WALL_CLASS="gtv2112WallCell";
  const DEFAULT_PERCEPTION=3,MAX_SENSE=12,CONTEXT_TTL=2500;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=v=>str(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let installed=false,adapterHooked=false,startHooked=false,resultHooked=false,detectionHooked=false,detailBound=false,observer=null,queued=false,lastScanSignature="",detailActorId="";

  function doc(rt=R){return rt?.document||null}
  function engine(rt=R){return rt?.GensRpgTacticalCombatV2||null}
  function adapter(rt=R){return rt?.GensRpgTacticalCombatV2Adapter||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function runtimeState(rt=R){try{return rt?.loadDungeonState?.()||JSON.parse(rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2")||"null")||null}catch(e){return null}}
  function profile(rt=R){try{return rt?.currentRpgProfile?.()||rt?.getActiveGameProfile?.()||null}catch(e){return null}}
  function normalizeText(v){return str(v).toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).toLowerCase()}

  function mapInfo(state){
    const map=state?.last?.map||{},cells=arr(map.cells);let width=Math.trunc(num(map.width??map.size,0));
    if(width<1)width=Math.max(1,Math.round(Math.sqrt(cells.length||1)));
    let height=Math.trunc(num(map.height,0));if(height<1)height=Math.max(1,Math.ceil((cells.length||width)/width));
    return {map,cells,width,height};
  }
  function cellXY(state,cell){const m=mapInfo(state),i=Math.trunc(num(cell,-1));return i>=0&&i<m.width*m.height?{x:i%m.width,y:Math.floor(i/m.width)}:null}
  function xyCell(state,x,y){const m=mapInfo(state);return x>=0&&y>=0&&x<m.width&&y<m.height?y*m.width+x:-1}
  function blockedCell(state,cell){const m=mapInfo(state),t=normalizeText(m.cells[Math.trunc(num(cell,-1))]||"");return t==="wall"||t==="void"||t==="blocked"}
  function bresenham(a,b){
    let x0=a.x|0,y0=a.y|0,x1=b.x|0,y1=b.y|0;const out=[],dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;
    while(true){out.push({x:x0,y:y0});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
    return out;
  }
  function lineOfSightCells(state,aCell,bCell){
    const a=cellXY(state,aCell),b=cellXY(state,bCell);if(!a||!b)return false;const pts=bresenham(a,b);
    for(let i=1;i<pts.length-1;i++){const c=xyCell(state,pts[i].x,pts[i].y);if(c<0||blockedCell(state,c))return false}
    return true;
  }
  function pathDistance(state,aCell,bCell,limit=MAX_SENSE){
    const a=Math.trunc(num(aCell,-1)),b=Math.trunc(num(bCell,-1));if(a<0||b<0)return Infinity;if(a===b)return 0;
    const max=Math.max(1,Math.trunc(num(limit,MAX_SENSE))),q=[a],dist=new Map([[a,0]]),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let qi=0;qi<q.length;qi++){const cur=q[qi],d=dist.get(cur)||0;if(d>=max)continue;const p=cellXY(state,cur);if(!p)continue;
      for(const [dx,dy] of dirs){const n=xyCell(state,p.x+dx,p.y+dy);if(n<0||dist.has(n)||blockedCell(state,n))continue;const nd=d+1;if(n===b)return nd;dist.set(n,nd);q.push(n)}
    }
    return Infinity;
  }
  function manhattan(state,aCell,bCell){const a=cellXY(state,aCell),b=cellXY(state,bCell);return !a||!b?Infinity:Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}

  function participants(state){return arr(state?.participants).map(str).filter(Boolean)}
  function activeHeroId(state){const p=participants(state),i=clamp(Math.trunc(num(state?.index,0)),0,Math.max(0,p.length-1));return p[i]||""}
  function roomOfHero(state,id){const v=state?.heroRooms?.[id];return v==null?num(state?.room,0):num(v,0)}
  function heroCell(state,id){return num(state?.positions?.[id],-1)}
  function enemyRoom(enemy,state){return enemy?.dungeonRoom==null?num(state?.room,0):num(enemy.dungeonRoom,num(state?.room,0))}
  function enemyCell(state,enemy){return num(state?.enemyCells?.[str(enemy?.id)],num(enemy?.dungeonCell200??enemy?.dungeonCell104,-1))}
  function heroesInRoom(state,room){return participants(state).filter(id=>roomOfHero(state,id)===num(room,0)&&heroCell(state,id)>=0)}
  function activeEnemies(rt=R){try{return arr(rt?.loadActiveEnemies?.()).filter(e=>num(e?.hp,1)>0&&!e?.removed&&!e?.defeated)}catch(e){return []}}
  function enemiesInRoom(rt,state,room,wanted=[]){const set=new Set(arr(wanted).map(str));return activeEnemies(rt).filter(e=>enemyRoom(e,state)===num(room,0)&&(!set.size||set.has(str(e.id))))}

  function perceptionDef(rt=R){
    let defs=[];try{defs=arr(rt?.GensCleanRpgStats167874?.runtimeDefs?.())}catch(e){}
    return defs.find(d=>/perception|vision|vigilance|awareness/.test(normalizeText(d?.id)+" "+normalizeText(d?.name)))||null;
  }
  function fallbackPerception(rt=R){
    const mv=profile(rt)?.rpgUniverse?.movement||{};
    const v=mv.combatAssistRange??mv.assistRange??mv.helpRange??mv.perceptionRange??DEFAULT_PERCEPTION;
    return clamp(Math.round(num(v,DEFAULT_PERCEPTION)),1,MAX_SENSE);
  }
  function heroPerception(rt=R,id=""){
    const d=perceptionDef(rt);if(d){try{return clamp(Math.round(num(rt?.GensCleanRpgStats167874?.value?.(str(id),str(d.id)),fallbackPerception(rt))),1,MAX_SENSE)}catch(e){}}
    return fallbackPerception(rt);
  }
  function enemyVision(rt=R,enemy=null){
    let def=null,d={};try{def=rt?.activeEnemyDefinition?.(enemy?.enemyId)||null}catch(e){}try{d=rt?.dungeonEnemyDerivedForInstance?.(enemy)||{}}catch(e){}
    const direct=enemy?.vision??enemy?.detectionRange??d?.vision??d?.sight??d?.detectionRange??def?.rule?.vision??def?.rule?.sight??def?.rule?.detectionRange;
    if(Number.isFinite(Number(direct)))return clamp(Math.round(num(direct,1)),1,MAX_SENSE);
    let range=num(def?.rule?.range,1);try{for(const sk of arr(rt?.dungeonEnemyAttackSkills?.(def))){const p=rt?.dungeonEnemyAttackProfile?.(def,sk)||{};range=Math.max(range,num(p?.range??sk?.range,1))}}catch(e){}
    return clamp(Math.round(Math.max(1,range)),1,MAX_SENSE);
  }

  function detectionPairs(rt=R,state=runtimeState(rt),list=null){
    if(!state?.last?.map)return [];const room=num(state.room,0),heroes=heroesInRoom(state,room);if(!heroes.length)return [];
    const enemies=Array.isArray(list)?list:enemiesInRoom(rt,state,room),pairs=[];
    for(const enemy of enemies){const ec=enemyCell(state,enemy),vision=enemyVision(rt,enemy);if(ec<0)continue;
      for(const id of heroes){const hc=heroCell(state,id),distance=manhattan(state,ec,hc);if(distance>vision)continue;if(!lineOfSightCells(state,ec,hc))continue;pairs.push({enemyId:str(enemy.id),heroId:id,room,enemyCell:ec,heroCell:hc,distance,vision})}
    }
    return pairs;
  }
  function detectionEnemyIds(rt=R,state=runtimeState(rt),list=null){return [...new Set(detectionPairs(rt,state,list).map(p=>p.enemyId))]}
  function setContext(rt,context){rt.__gensTacticalV112Context={...context,at:Date.now()};return rt.__gensTacticalV112Context}
  function getContext(rt,room){const c=rt?.__gensTacticalV112Context;if(!c||Date.now()-num(c.at,0)>CONTEXT_TTL||num(c.room,-1)!==num(room,-2))return null;return c}
  function detectionSignature(rt,state){const room=num(state?.room,0),h=heroesInRoom(state,room).map(id=>id+"@"+heroCell(state,id)).sort().join(","),e=enemiesInRoom(rt,state,room).map(x=>str(x.id)+"@"+enemyCell(state,x)+"#"+num(x.hp,0)).sort().join(",");return room+"|"+h+"|"+e}
  function scanDetection(rt=R,reason="vision-v112",force=false){
    if(currentBattle(rt))return [];const state=runtimeState(rt);if(!state)return [];const sig=detectionSignature(rt,state);if(!force&&sig===lastScanSignature)return [];lastScanSignature=sig;
    const pairs=detectionPairs(rt,state);if(!pairs.length)return [];const room=num(state.room,0),enemyIds=[...new Set(pairs.map(p=>p.enemyId))],heroIds=[...new Set(pairs.map(p=>p.heroId))];
    setContext(rt,{room,sourceHeroIds:heroIds,enemyIds,reason});try{rt?.dc200StartCombat?.(enemyIds,reason)}catch(e){try{rt?.console?.warn?.("V16.78.112 detection",e)}catch(_){}}return enemyIds;
  }
  function scheduleDetection(rt=R,reason="vision-v112",force=false){if(rt.__gensTacticalV112ScanQueued)return;rt.__gensTacticalV112ScanQueued=true;const run=()=>{rt.__gensTacticalV112ScanQueued=false;scanDetection(rt,reason,force)};if(typeof setTimeout==="function")setTimeout(run,0);else run()}

  function combatRoom(rt,state,options={}){
    const wanted=new Set(arr(options.enemyIds).map(str)),all=activeEnemies(rt),rooms=[...new Set(all.filter(e=>wanted.has(str(e.id))).map(e=>enemyRoom(e,state)).filter(Number.isFinite))];
    if(rooms.length===1)return rooms[0];const active=activeHeroId(state);return active?roomOfHero(state,active):num(state?.room,0);
  }
  function selectCombatants(rt=R,options={}){
    const state=runtimeState(rt);if(!state)return {room:0,heroIds:arr(options.heroIds).map(str),enemyIds:arr(options.enemyIds).map(str),sourceHeroIds:[]};
    const room=combatRoom(rt,state,options),roomHeroes=heroesInRoom(state,room),wanted=arr(options.enemyIds).map(str),roomEnemies=enemiesInRoom(rt,state,room),ctx=getContext(rt,room);
    let source=arr(ctx?.sourceHeroIds).filter(id=>roomHeroes.includes(str(id))).map(str);const active=activeHeroId(state);if(!source.length&&active&&roomHeroes.includes(active))source=[active];if(!source.length&&roomHeroes.length)source=[roomHeroes[0]];
    let seeds=wanted.length?roomEnemies.filter(e=>wanted.includes(str(e.id))):[];
    if(!seeds.length){const pairs=detectionPairs(rt,state,roomEnemies).filter(p=>!source.length||source.includes(p.heroId));const ids=new Set(pairs.map(p=>p.enemyId));seeds=roomEnemies.filter(e=>ids.has(str(e.id)))}
    const seedCells=seeds.map(e=>enemyCell(state,e)).filter(c=>c>=0),sourceCells=source.map(id=>heroCell(state,id)).filter(c=>c>=0),heroIds=[];
    for(const id of roomHeroes){if(source.includes(id)){heroIds.push(id);continue}const hc=heroCell(state,id),sense=heroPerception(rt,id);let d=Infinity;for(const c of [...sourceCells,...seedCells])d=Math.min(d,pathDistance(state,hc,c,sense));if(d<=sense)heroIds.push(id)}
    if(!heroIds.length)heroIds.push(...source);
    const heroCells=heroIds.map(id=>heroCell(state,id)).filter(c=>c>=0),enemyIds=new Set(seeds.map(e=>str(e.id)));
    for(const e of roomEnemies){if(enemyIds.has(str(e.id)))continue;const ec=enemyCell(state,e),vision=enemyVision(rt,e);if(ec<0)continue;if(heroCells.some(hc=>manhattan(state,ec,hc)<=vision&&lineOfSightCells(state,ec,hc)))enemyIds.add(str(e.id))}
    return {room,heroIds:[...new Set(heroIds)],enemyIds:[...enemyIds],sourceHeroIds:source,perceptionStat:perceptionDef(rt)?.id||""};
  }

  function applyRuntimePositions(rt=R,battle=null,selection=null){
    const state=runtimeState(rt);if(!battle?.actors||!state||num(selection?.room,state.room)!==num(state.room,0))return 0;
    const blocked=new Set(arr(battle.grid?.blocked).map(p=>p.x+","+p.y)),width=num(battle.grid?.width,0),height=num(battle.grid?.height,0),desired=new Map(),reserved=new Set();let moved=0;
    const enemies=activeEnemies(rt);
    for(const actor of battle.actors){let cell=-1;if(actor.side==="hero")cell=heroCell(state,str(actor?.meta?.heroId||actor.id));else{const inst=enemies.find(e=>str(e.id)===str(actor?.meta?.instanceId));cell=inst?enemyCell(state,inst):-1}const p=cellXY(state,cell);if(!p||p.x>=width||p.y>=height)continue;const k=p.x+","+p.y;if(blocked.has(k)||reserved.has(k))continue;desired.set(actor.id,p);reserved.add(k)}
    const used=new Set();
    function firstFree(){for(let y=0;y<height;y++)for(let x=0;x<width;x++){const k=x+","+y;if(!blocked.has(k)&&!reserved.has(k)&&!used.has(k))return {x,y}}return null}
    for(const actor of battle.actors){const p=desired.get(actor.id);if(p){actor.x=p.x;actor.y=p.y;used.add(p.x+","+p.y);moved++;continue}const oldKey=actor.x+","+actor.y;if(actor.x>=0&&actor.y>=0&&actor.x<width&&actor.y<height&&!blocked.has(oldKey)&&!reserved.has(oldKey)&&!used.has(oldKey)){used.add(oldKey);continue}const free=firstFree();if(free){actor.x=free.x;actor.y=free.y;used.add(free.x+","+free.y)}}
    battle.meta=battle.meta&&typeof battle.meta==="object"?battle.meta:{};battle.meta.spatialV112={room:selection?.room,heroIds:arr(selection?.heroIds),enemyIds:arr(selection?.enemyIds),realPositions:moved};return moved;
  }
  function hookAdapter(rt=R){
    const A=adapter(rt);if(!A?.createBattle)return false;if(A.createBattle.__gensRpg112Spatial){adapterHooked=true;return true}const old=A.createBattle;
    const wrapped=function(runtime,options={}){const realRt=runtime||rt,sel=selectCombatants(realRt,options||{}),next={...(options||{}),heroIds:sel.heroIds,enemyIds:sel.enemyIds},b=old.call(this,realRt,next);applyRuntimePositions(realRt,b,sel);return b};
    wrapped.__gensRpg112Spatial=true;wrapped.__original=old;A.createBattle=wrapped;adapterHooked=true;return true;
  }
  function isDetectionReason(reason){return /detection|vision-v11|room-detection|movement-detection|event-detection/i.test(str(reason))}
  function hookStart(rt=R){
    const old=rt?.dc200StartCombat;if(typeof old!=="function")return false;if(old.__gensRpg112Start){startHooked=true;return true}
    const wrapped=function(ids=[],reason="manual"){
      const state=runtimeState(rt);if(!state)return old.apply(this,arguments);
      let requested=arr(ids).map(str);if(isDetectionReason(reason)){const visible=new Set(detectionEnemyIds(rt,state));requested=requested.filter(id=>visible.has(id));if(!requested.length)return {ok:false,reason:"not-detected-v112"};const pairs=detectionPairs(rt,state).filter(p=>requested.includes(p.enemyId));setContext(rt,{room:num(state.room,0),sourceHeroIds:[...new Set(pairs.map(p=>p.heroId))],enemyIds:requested,reason:"vision-v112"})}
      const sel=selectCombatants(rt,{enemyIds:requested});if(!sel.heroIds.length||!sel.enemyIds.length)return {ok:false,reason:"no-spatial-combatants-v112"};setContext(rt,{room:sel.room,sourceHeroIds:sel.sourceHeroIds,enemyIds:sel.enemyIds,reason});return old.call(this,sel.enemyIds,reason);
    };
    wrapped.__gensRpg112Start=true;wrapped.__original=old;rt.dc200StartCombat=wrapped;startHooked=true;return true;
  }

  function hookResultDetails(rt=R){
    const E=engine(rt);if(!E?.resolveAttack||!E?.attackPreview)return false;if(E.resolveAttack.__gensRpg112Explain){resultHooked=true;return true}const old=E.resolveAttack;
    const wrapped=function(state,attackerId,targetId,attackId,forcedRoll=null){let p=null,target=null,attack=null;try{p=E.attackPreview(state,attackerId,targetId,attackId);target=E.actorById?.(state,targetId);attack=E.actorById?.(state,attackerId)?.attacks?.find(a=>str(a.id)===str(attackId))||p?.attack||null}catch(e){}const out=old.apply(this,arguments);if(!out?.ok)return out;
      const extra={rawDamage:num(p?.rawDamage??attack?.power,p?.damage??0),armor:num(p?.armor,0),resistance:num(p?.resistance,0),resistanceKind:str(p?.resistanceKind||""),distance:num(p?.distance,0),cover:num(p?.los?.cover??p?.totalCover??0),targetDefense:num(target?.defense,0),targetDodge:num(target?.dodge,0),baseHit:num(attack?.hit,out.hitChance)};Object.assign(out,extra);const row=[...arr(state?.log)].reverse().find(x=>x?.type==="attack"&&str(x.attackerId)===str(attackerId)&&str(x.targetId)===str(targetId));if(row)Object.assign(row,extra);return out};
    wrapped.__gensRpg112Explain=true;wrapped.__original=old;E.resolveAttack=wrapped;resultHooked=true;return true;
  }
  function latestAttackRow(rt=R){const b=currentBattle(rt);return [...arr(b?.log)].reverse().find(x=>x?.type==="attack")||null}
  function explainAttack(row){
    if(!row)return "";const high=row.rollHighToHit!==false,threshold=num(row.hitTarget,high?101-num(row.hitChance,50):num(row.hitChance,50)),rolls=arr(row.rollsDisplay).length?arr(row.rollsDisplay):[row.roll].filter(v=>v!=null),dice=Math.max(1,num(row.dice,rolls.length||1));
    if(!row.hit)return `0 dégât : ${dice>1?"aucun des "+dice+" dés n'atteint":"le jet n'atteint"} le seuil de réussite (${high?"D100 ≥":"D100 ≤"} ${threshold}).`;
    if(num(row.damage,0)<=0){if(str(row.damageType)==="physical"&&num(row.armor,0)>0)return `Touché, mais 0 dégât : puissance ${num(row.rawDamage,0)} − armure ${num(row.armor,0)} = 0.`;if(num(row.resistance,0)>0)return `Touché, mais 0 dégât après résistance ${num(row.resistance,0)}${row.resistanceKind==="percent"?"%":""}.`;return "Touché, mais les modificateurs défensifs ramènent les dégâts finaux à 0."}
    const parts=[`Dégâts finaux : ${num(row.damage,0)}.`];if(num(row.armor,0)>0&&str(row.damageType)==="physical")parts.push(`Armure cible : ${num(row.armor,0)}.`);if(num(row.resistance,0)>0)parts.push(`Résistance : ${num(row.resistance,0)}${row.resistanceKind==="percent"?"%":""}.`);if(num(row.crits,0)>0||row.crit)parts.push("Coup critique appliqué.");if(num(row.targetDefense,0)||num(row.targetDodge,0)||num(row.cover,0))parts.push(`Seuil influencé par DEF ${num(row.targetDefense,0)}, esquive ${num(row.targetDodge,0)}${num(row.cover,0)?`, couvert ${num(row.cover,0)}`:""}.`);return parts.join(" ")
  }

  function withHero(rt,id,fn){const hc=Object.prototype.hasOwnProperty.call(rt,"current"),hs=Object.prototype.hasOwnProperty.call(rt,"state"),oc=rt.current,os=rt.state;try{rt.current=id;rt.state=rt?.loadState?.(id)||{};return fn(rt.state)}finally{if(hc)rt.current=oc;else try{delete rt.current}catch(e){}if(hs)rt.state=os;else try{delete rt.state}catch(e){}}}
  function equippedItems(rt,id){return withHero(rt,id,state=>{try{const x=rt?.dungeonEquippedItems?.();if(Array.isArray(x)&&x.length)return x.filter(Boolean)}catch(e){}const out=[];for(const idx of [state?.rightHand,state?.leftHand]){if(!Number.isInteger(idx)||!state?.inventory?.[idx])continue;const entry=state.inventory[idx];let it=null;try{it=rt?.getItemFromEntry?.(entry)||rt?.itemById?.(entry?.itemId||entry?.id)||null}catch(e){}if(it&&!out.some(x=>str(x.id)===str(it.id)))out.push(it)}return out})}
  function itemBonusText(it){const rows=Object.entries(it?.rpgBonuses||{}).filter(([,v])=>num(v,0)!==0).map(([k,v])=>(num(v)>0?"+":"")+num(v)+" "+k);return rows.join(" · ")}
  function attackDice(a){try{return num(R?.GensRpgTacticalRuntimeFixes1678111?.attackDice?.(a),1)}catch(e){return num(a?.meta?.dice??a?.dice,1)}}
  function attacksHtml(actor){const rows=arr(actor?.attacks);if(!rows.length)return '<div class="gtv2112Empty">Aucune attaque.</div>';return rows.map(a=>`<article class="gtv2112Attack"><strong>${esc(a.name)}</strong><span>${attackDice(a)} dé(s) · toucher ${num(a.hit,0)}% · puissance ${num(a.power,0)} · portée ${num(a.minRange,0)}-${num(a.maxRange,0)} · ${esc(a.damageType||"physical")}</span>${a?.meta?.ammo!=null?`<small>Munitions : ${esc(a.meta.ammo)}</small>`:""}</article>`).join("")}
  function statsHtml(actor){const snap=actor?.meta?.rpgStats||{},rows=arr(snap.canonical);const canonical=rows.map(s=>`<div class="gtv2112Stat"><b>${esc(s.icon||"📊")}</b><span>${esc(s.name)}</span><strong>${num(s.value,0)}</strong></div>`).join("");const d=snap.derived||{};const derived=[["PV",actor.hp+"/"+actor.maxHp],["Mana",num(d.mana,0)+"/"+num(d.maxMana,0)],["Critique",num(d.crit,0)+"%"],["Esquive",num(d.dodge,actor.dodge)+"%"],["Rés. magique",num(d.magicResistance,0)],["Armure",num(actor.armor,0)],["Défense",num(actor.defense,0)],["Initiative",num(actor.initiative,0)]].map(x=>`<div class="gtv2112Derived"><span>${esc(x[0])}</span><strong>${esc(x[1])}</strong></div>`).join("");return `<div class="gtv2112DerivedGrid">${derived}</div><div class="gtv2112StatGrid">${canonical}</div>`}
  function equipmentHtml(rt,actor){if(actor?.side!=="hero")return "";const id=str(actor?.meta?.heroId||actor.id),items=equippedItems(rt,id);if(!items.length)return '<div class="gtv2112Empty">Aucun équipement détecté.</div>';return items.map(it=>{const bonus=itemBonusText(it),meta=[it?.rarity,it?.type,it?.setId?"Set "+it.setId:""].filter(Boolean).join(" · ");return `<article class="gtv2112Gear"><strong>${esc(it?.name||it?.id||"Objet")}</strong>${meta?`<span>${esc(meta)}</span>`:""}${bonus?`<small>${esc(bonus)}</small>`:""}${it?.description?`<small>${esc(it.description)}</small>`:""}</article>`}).join("")}
  function enemyExtraHtml(rt,actor){if(actor?.side!=="enemy")return "";let inst=null,def=null;try{inst=activeEnemies(rt).find(e=>str(e.id)===str(actor?.meta?.instanceId))||null;def=rt?.activeEnemyDefinition?.(inst?.enemyId||actor?.meta?.enemyId)||null}catch(e){}return `<div class="gtv2112DerivedGrid"><div class="gtv2112Derived"><span>Vision</span><strong>${enemyVision(rt,inst)} cases</strong></div><div class="gtv2112Derived"><span>Type</span><strong>${esc(def?.name||actor.name||"Ennemi")}</strong></div></div>`}
  function trueSheetHtml(rt,actor){return `<section class="gtv2112TrueSheet" data-v112-sheet="${esc(actor.id)}"><h3>📋 Fiche complète</h3>${statsHtml(actor)}${enemyExtraHtml(rt,actor)}<h3>⚔️ Attaques</h3>${attacksHtml(actor)}${actor.side==="hero"?`<h3>🎒 Équipement</h3>${equipmentHtml(rt,actor)}`:""}</section>`}
  function patchDetail(rt=R){const D=doc(rt),b=currentBattle(rt),card=D?.querySelector?.(".gtv271DetailCard");if(!D||!b||!card)return false;let actor=detailActorId?b.actors?.find(a=>str(a.id)===detailActorId):null;if(!actor){const name=normalizeText(card.querySelector?.("h2")?.textContent||"");actor=arr(b.actors).find(a=>normalizeText(a?.name)===name)||null}if(!actor)return false;const old=card.querySelector?.(".gtv2112TrueSheet");if(old?.getAttribute?.("data-v112-sheet")===str(actor.id))return true;old?.remove?.();const box=D.createElement("div");box.innerHTML=trueSheetHtml(rt,actor);const section=box.firstElementChild,actions=card.querySelector?.(".gtv2Actions");if(actions)card.insertBefore(section,actions);else card.appendChild(section);return true}

  function ensureStyle(rt=R){const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
    .gtv2111Dock{width:min(88vw,440px)!important;gap:5px!important;padding:5px!important;border-radius:12px!important}.gtv2111Dock button{min-height:38px!important;font-size:12.5px!important;padding:5px 7px!important;border-radius:8px!important}.gtv2Overlay{padding-bottom:calc(62px + env(safe-area-inset-bottom,0px))!important}
    .gtv2112TrueSheet{margin-top:10px;padding-top:10px;border-top:1px solid #45505e}.gtv2112TrueSheet h3{margin:9px 0 6px}.gtv2112StatGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.gtv2112Stat{display:grid;grid-template-columns:24px 1fr auto;gap:5px;align-items:center;padding:6px;background:#10151c;border:1px solid #303a47;border-radius:8px;font-size:12px}.gtv2112DerivedGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-bottom:7px}.gtv2112Derived{display:flex;justify-content:space-between;gap:8px;padding:6px 7px;background:#202733;border-radius:8px;font-size:12px}.gtv2112Attack,.gtv2112Gear{display:grid;gap:3px;padding:7px 8px;margin:5px 0;background:#10151c;border:1px solid #303a47;border-radius:9px}.gtv2112Attack span,.gtv2112Gear span,.gtv2112Attack small,.gtv2112Gear small{font-size:11px;color:#c5ccd5}.gtv2112Empty{font-size:12px;color:#aab2bd;padding:6px}
    .gtv2112Explain{margin-top:8px;padding:8px 9px;background:#151c25;border:1px solid #39495a;border-radius:9px;font-size:12px;line-height:1.4}
    @media(max-width:430px){.gtv2111Dock{width:calc(100vw - 36px)!important}.gtv2111Dock button{min-height:36px!important;font-size:11.5px!important}.gtv2112StatGrid{grid-template-columns:1fr}.gtv2112DerivedGrid{grid-template-columns:1fr 1fr}}
  `;(D.head||D.documentElement||D.body)?.appendChild(s);return true}
  function markWallCells(rt=R){const D=doc(rt);if(!D)return 0;let n=0;const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];for(let i=0;i<cells.length;i++){const wall=normalizeText(kinds[i])==="wall"||cells[i].classList?.contains?.("dav167870WallCell");if(!wall)continue;const el=cells[i];el.classList?.add(WALL_CLASS);el.style?.setProperty?.("background-image",`url("${WALL_ASSET}")`,"important");el.style?.setProperty?.("background-size","cover","important");el.style?.setProperty?.("background-position","center","important");el.style?.setProperty?.("background-repeat","no-repeat","important");n++}for(const el of D.querySelectorAll?.(".gtv2Cell.blocked,#drc100Grid .drc100Cell.wall,#dc047RoomBoard .dav167870WallCell")||[]){el.classList?.add(WALL_CLASS);el.style?.setProperty?.("background-image",`url("${WALL_ASSET}")`,"important");el.style?.setProperty?.("background-size","cover","important");el.style?.setProperty?.("background-position","center","important");el.style?.setProperty?.("background-repeat","no-repeat","important");n++}return n}
  function patchDice(rt=R){const D=doc(rt),card=D?.querySelector?.(".gtv2DiceCard");if(!card)return false;const row=latestAttackRow(rt);if(!row)return false;let note=card.querySelector?.(".gtv2112Explain");if(!note){note=D.createElement("div");note.className="gtv2112Explain";const button=card.querySelector?.("[data-dice-continue]");if(button)card.insertBefore(note,button);else card.appendChild(note)}note.textContent=explainAttack(row);return true}
  function maintain(rt=R){queued=false;ensureStyle(rt);patchDetail(rt);patchDice(rt);return true}
  function queueMaintain(rt=R){if(queued)return;queued=true;const run=()=>maintain(rt);if(typeof rt?.requestAnimationFrame==="function")rt.requestAnimationFrame(run);else setTimeout(run,0)}
  function bindDetail(rt=R){if(detailBound)return true;const D=doc(rt);if(!D?.addEventListener)return false;D.addEventListener("click",ev=>{const b=ev.target?.closest?.("button");if(!b)return;if(b.dataset?.detail){detailActorId=str(b.dataset.detail);setTimeout(()=>patchDetail(rt),0)}else if(b.hasAttribute?.("data-detail-close"))detailActorId=""},true);detailBound=true;return true}
  function observe(rt=R){const D=doc(rt);if(observer||!D?.body||typeof rt?.MutationObserver!=="function")return !!observer;observer=new rt.MutationObserver(muts=>{for(const m of muts){for(const node of m.addedNodes||[]){if(node?.nodeType!==1)continue;if(node.matches?.(".gtv2DiceBackdrop,.gtv271DetailBackdrop,.dc047Grid")||node.querySelector?.(".gtv2DiceBackdrop,.gtv271DetailBackdrop,.dc047Grid")){queueMaintain(rt);return}}}});observer.observe(D.body,{childList:true,subtree:true});return true}

  function wrapDetectionFunction(rt,name,reason,force=false){const old=rt?.[name];if(typeof old!=="function"||old.__gensRpg112Detection)return false;const w=function(){const out=old.apply(this,arguments);scheduleDetection(rt,reason,force);return out};w.__gensRpg112Detection=true;w.__original=old;rt[name]=w;return true}
  function hookDetection(rt=R){wrapDetectionFunction(rt,"dungeonMoveHero098","movement-vision-v112",false);wrapDetectionFunction(rt,"applyDungeonTurnEvent","event-vision-v112",true);wrapDetectionFunction(rt,"dungeonEventSpawn","spawn-vision-v112",true);wrapDetectionFunction(rt,"trackSpawnedEnemyInstances","spawn-vision-v112",true);const core=rt?.DungeonCore01;if(core)for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__gensRpg112Detection)continue;const w=function(){const out=old.apply(this,arguments);markWallCells(rt);scheduleDetection(rt,"room-vision-v112",false);return out};w.__gensRpg112Detection=true;w.__original=old;core[name]=w}detectionHooked=true;return true}

  function install(rt=R){ensureStyle(rt);hookAdapter(rt);hookResultDetails(rt);bindDetail(rt);maintain(rt);try{rt.GENSRPG_VERSION=APP_VERSION;rt.GENS_RPG_TACTICAL_COHERENCE_VERSION=APP_VERSION}catch(e){}installed=!!(adapterHooked&&resultHooked);return installed}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,DEFAULT_PERCEPTION,MAX_SENSE,mapInfo,cellXY,lineOfSightCells,pathDistance,roomOfHero,heroesInRoom,enemyVision,heroPerception,detectionPairs,detectionEnemyIds,scanDetection,selectCombatants,applyRuntimePositions,explainAttack,markWallCells,patchDice,patchDetail,hookAdapter,hookStart,hookResultDetails,install,installWithRetries,status:()=>({installed,adapterHooked,startHooked,resultHooked,detectionHooked})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
