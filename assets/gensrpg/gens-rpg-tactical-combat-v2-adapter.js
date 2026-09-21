/* GenSrpG Tactical Combat V2 — runtime adapter.
   V16.78.114.10 converts legacy D6 accuracy exactly once at the D100 boundary,
   derives Dungeon RPG weapon precision from its canonical scaling, and refuses heroes
   that have not entered the current room. Legacy combat/timeline is never called. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Adapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.4.0",APP_VERSION="16.78.114.10";
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const call=(rt,name,...args)=>typeof rt?.[name]==="function"?rt[name](...args):undefined;
  const cellKey=(x,y)=>`${x},${y}`;

  function engine(rt=R){return rt?.GensRpgTacticalCombatV2||R?.GensRpgTacticalCombatV2||null}
  function heroRecord(rt,id){return rt?.CHARS?.[id]||call(rt,"findCustomHero",id)||{id,name:id}}
  function heroState(rt,id){try{return call(rt,"loadState",id)||{}}catch(e){return {}}}
  function itemFromEntry(rt,entry){
    try{if(typeof rt?.getItemFromEntry==="function")return rt.getItemFromEntry(entry)}catch(e){}
    const id=entry?.itemId??entry?.id;try{return typeof rt?.itemById==="function"?rt.itemById(id):null}catch(e){return null}
  }
  function accuracyPercent(v){
    const n=parseInt(String(v??"").replace(/\D/g,""),10);
    if(!Number.isFinite(n)||n<=0)return 75;
    if(n<=6)return clamp(Math.round(((7-n)/6)*100),5,95);
    return clamp(n,5,95);
  }
  function weaponHitProfile(rt,id,it={},st={}){
    const melee=st.melee===true||it.melee===true||num(st.range??it.range,1)<=1;
    const scaling=it.rpgScaling&&typeof it.rpgScaling==="object"?it.rpgScaling:null;
    const explicit=st.hitChance??it.rpgHitChance??it.hitChance??it.rpgBaseChance;
    if(scaling?.attribute){
      const mode=scaling.magic?"magic":(melee?"melee":"ranged"),attribute=str(scaling.attribute),baseChance=clamp(Math.round(num(scaling.baseChance,50)),1,99);
      let attributeValue=0,statBonus=0;
      try{withHero(rt,id,()=>{
        attributeValue=num(call(rt,"dungeonAttributeValue",attribute),canonicalStat(rt,id,attribute,0));
        let canonicalDerived=NaN;
        try{canonicalDerived=rt?.GensCleanRpgStats167874?.sourceEffectTotal?.("hit:"+mode,attribute,id)}catch(e){}
        const derived=call(rt,"dungeonHitBonusForMode",mode,attributeValue);
        statBonus=Number.isFinite(Number(canonicalDerived))&&Number(canonicalDerived)!==0?num(canonicalDerived):(Number.isFinite(Number(derived))&&Number(derived)!==0?num(derived):Math.max(0,attributeValue)*num(scaling.chancePerPoint,0));
      })}catch(e){}
      const returned=Number(explicit),effective=Number.isFinite(returned)&&returned>6?returned:baseChance+statBonus;
      const hit=clamp(Math.round(effective),5,95),otherBonus=Math.round(effective-baseChance-statBonus);
      return {hit,breakdown:{kind:"rpg-d100",baseChance,attribute,attributeValue,statBonus,otherBonus,effectiveHit:hit,source:Number.isFinite(returned)&&returned>6?"effectiveAttackStats":"rpgScaling"}};
    }
    if(Number.isFinite(Number(explicit))&&Number(explicit)>6){
      const hit=clamp(Math.round(num(explicit)),5,95);
      return {hit,breakdown:{kind:"d100",baseChance:hit,effectiveHit:hit,source:"explicitD100"}};
    }
    const rawThreshold=explicit??st.accuracy??it.accuracy,threshold=clamp(parseInt(String(rawThreshold??"4").replace(/\D/g,""),10)||4,2,6);
    const hit=accuracyPercent(threshold);
    return {hit,breakdown:{kind:"legacy-d6",legacyThreshold:threshold,successFaces:7-threshold,dieSides:6,baseChance:hit,effectiveHit:hit,source:"legacyAccuracy"}};
  }
  function withHero(rt,id,fn){
    const hadCurrent=Object.prototype.hasOwnProperty.call(rt,"current"),hadState=Object.prototype.hasOwnProperty.call(rt,"state");
    const oldCurrent=rt.current,oldState=rt.state;
    try{rt.current=id;rt.state=heroState(rt,id);return fn(rt.state)}finally{
      if(hadCurrent)rt.current=oldCurrent;else try{delete rt.current}catch(e){}
      if(hadState)rt.state=oldState;else try{delete rt.state}catch(e){}
    }
  }
  function canonicalStat(rt,id,stat,fallback=0){
    try{const api=rt?.GensCleanRpgStats167874;if(api?.value)return num(api.value(str(id),stat),fallback)}catch(e){}
    return fallback;
  }
  function heroSnapshot(rt,id){
    try{if(typeof rt?.dungeonCombatHeroSnapshot==="function")return rt.dungeonCombatHeroSnapshot(id)||{}}catch(e){}
    return withHero(rt,id,()=>({
      hp:Math.max(0,num(call(rt,"effectiveMaxWounds"),1)-num(rt.state?.wounds,0)),
      maxHp:Math.max(1,num(call(rt,"effectiveMaxWounds"),1)),
      movement:num(call(rt,"dungeonAttributeValue","movement"),3),
      initiative:num(call(rt,"dungeonDerivedInitiative"),10),
      defense:num(call(rt,"dungeonDerivedDefense"),0),
      armor:num(call(rt,"dungeonArmorScore"),0),
      dodge:num(call(rt,"dungeonDodgeChance"),0)
    }));
  }
  function equippedWeaponEntries(rt,id){
    const st=heroState(rt,id),out=[];
    for(const idx of [st.rightHand,st.leftHand]){
      if(!Number.isInteger(idx)||!st.inventory?.[idx])continue;
      const entry=st.inventory[idx],it=itemFromEntry(rt,entry);
      if(it?.type==="Arme"&&!out.some(x=>x.idx===idx))out.push({idx,entry,it});
    }
    return out;
  }
  function itemAttack(rt,id,row,index){
    const it=row.it||{},entry=row.entry||{};
    let st=null;
    try{st=withHero(rt,id,()=>typeof rt?.effectiveAttackStats==="function"?rt.effectiveAttackStats(it):null)}catch(e){}
    st=st||{};
    const melee=st.melee===true||it.melee===true||num(st.range??it.range,1)<=1;
    const rawRange=num(st.range??it.range,melee?1:4);
    const maxRange=melee?1:clamp(Math.round(rawRange||4),2,12);
    const minRange=Math.max(0,Math.trunc(num(it.minRange??it.rpgMinRange,melee?0:1)));
    const hitProfile=weaponHitProfile(rt,id,it,st),hit=hitProfile.hit;
    const power=Math.max(1,Math.round(num(st.damage??st.power??st.strength??it.damage??it.strength,1)));
    return {
      id:`item:${str(it.id||entry.itemId||index)}`,
      name:str(it.name||`Arme ${index+1}`),minRange,maxRange,hit,power,
      damageType:str(st.damageType||it.damageType||(st.magic?"magic":"physical")),
      ignoreArmor:!!(st.ignoreArmor||it.ignoreArmor),lineOfSight:!melee,
      tags:[melee?"melee":"ranged"],
      meta:{itemId:str(it.id||entry.itemId||""),inventoryIndex:row.idx,dice:num(st.dice??it.dice,1),ammo:entry.ammo??null,hitBreakdown:hitProfile.breakdown,rpgDamageBonus:Math.max(0,num(st.rpgDamageBonus,0))}
    };
  }
  function heroAttacks(rt,id){
    const weapons=equippedWeaponEntries(rt,id).map((x,i)=>itemAttack(rt,id,x,i));
    if(weapons.length)return weapons;
    const snap=heroSnapshot(rt,id);
    return [{id:"unarmed",name:"Mains nues",minRange:0,maxRange:1,hit:70,power:Math.max(1,Math.round(num(snap.force,1)/5)||1),damageType:"physical",ignoreArmor:false,lineOfSight:false,tags:["melee","unarmed"]}];
  }
  function heroActor(rt,id,pos){
    const rec=heroRecord(rt,id),s=heroSnapshot(rt,id),movement=Math.max(1,Math.round(num(s.movement,canonicalStat(rt,id,"movement",3))));
    return {id:str(id),name:str(rec.name||id),side:"hero",x:pos.x,y:pos.y,hp:Math.max(0,num(s.hp,1)),maxHp:Math.max(1,num(s.maxHp,s.hp||1)),movement,
      initiative:num(s.initiative,canonicalStat(rt,id,"initiative",10)),defense:num(s.defense,canonicalStat(rt,id,"defense",0)),armor:num(s.armor,canonicalStat(rt,id,"armor",0)),dodge:num(s.dodge,0),
      attacks:heroAttacks(rt,id),meta:{kind:"hero",heroId:str(id),art:rec.image||rec.avatar||rec.portrait||rec.art||""}};
  }
  function enemyDef(rt,inst){try{return call(rt,"activeEnemyDefinition",inst?.enemyId)||null}catch(e){return null}}
  function enemyDerived(rt,inst,def){
    try{if(typeof rt?.dungeonEnemyDerivedForInstance==="function")return rt.dungeonEnemyDerivedForInstance(inst)||{}}catch(e){}
    try{if(typeof rt?.dungeonEnemyDerived==="function")return rt.dungeonEnemyDerived(def)||{}}catch(e){}
    return {};
  }
  function enemySkills(rt,def){
    try{const a=call(rt,"dungeonEnemyAttackSkills",def);if(Array.isArray(a)&&a.length)return a}catch(e){}
    return [null];
  }
  function enemyAttacks(rt,inst,def){
    return enemySkills(rt,def).map((sk,i)=>{
      let p={};try{p=call(rt,"dungeonEnemyAttackProfile",def,sk)||{}}catch(e){}
      const mode=str(p.mode||sk?.mode||def?.rule?.attackMode||"melee");
      const rawRange=num(p.range??sk?.range??def?.rule?.range,mode==="melee"?1:4);
      return {id:`enemy:${str(sk?.id||i)}`,name:str(sk?.name||def?.name||"Attaque"),minRange:0,maxRange:mode==="melee"?1:clamp(Math.round(rawRange||4),2,12),
        hit:clamp(num(p.chance??p.hitChance,70),5,95),power:Math.max(1,Math.round(num(p.power??p.damage??def?.rule?.damage,1))),damageType:mode==="magic"?"magic":"physical",ignoreArmor:!!(sk?.ignoreArmor||p.ignoreArmor),lineOfSight:mode!=="melee",tags:[mode]};
    });
  }
  function enemyActor(rt,inst,pos){
    const def=enemyDef(rt,inst)||{},d=enemyDerived(rt,inst,def),maxHp=Math.max(1,num(inst?.maxHp??def?.rule?.hp??d.maxHp,1));
    return {id:`enemy:${str(inst?.id||inst?.enemyId)}`,name:str(def.name||inst?.name||inst?.enemyId||"Ennemi"),side:"enemy",x:pos.x,y:pos.y,hp:clamp(num(inst?.hp,maxHp),0,maxHp),maxHp,
      movement:Math.max(1,Math.round(num(d.movement??def?.rule?.movement,2))),initiative:num(d.initiative,8),defense:num(d.defense,0),armor:num(d.armor,0),dodge:num(d.dodge,0),attacks:enemyAttacks(rt,inst,def),
      meta:{kind:"enemy",instanceId:str(inst?.id||""),enemyId:str(inst?.enemyId||""),art:def.art||def.image_data||def.image||""}};
  }
  function defaultGrid(heroCount,enemyCount){
    const rows=Math.max(6,Math.min(12,Math.max(heroCount,enemyCount)+3));
    return {width:10,height:rows,blocked:[]};
  }
  function dungeonMap(rt){
    try{const s=call(rt,"loadDungeonState")||{};return s?.last?.map||null}catch(e){return null}
  }
  function gridFromDungeonMap(rt){
    const map=dungeonMap(rt),cells=arr(map?.cells);if(!cells.length)return null;
    let size=Math.trunc(num(map?.size,Math.sqrt(cells.length)));
    if(!Number.isFinite(size)||size<4||size*size>cells.length+size)size=Math.max(4,Math.round(Math.sqrt(cells.length)));
    size=clamp(size,4,40);
    const blocked=[],cover=[];
    for(let i=0;i<Math.min(cells.length,size*size);i++){
      const type=str(cells[i]||"floor"),x=i%size,y=Math.floor(i/size);
      if(type==="wall"||type==="void")blocked.push({x,y});
      if(type==="cover")cover.push({x,y});
    }
    return {width:size,height:size,blocked,cover,sourceMap:{shape:map?.shape||"",roomKind:map?.kind||""}};
  }
  function spread(count,x,height){
    if(count<=0)return [];
    const out=[],step=height/(count+1);
    for(let i=0;i<count;i++)out.push({x,y:clamp(Math.round(step*(i+1))-1,0,height-1)});
    return out;
  }
  function spawnCells(grid,count,side,used=new Set()){
    const blocked=new Set(arr(grid?.blocked).map(p=>cellKey(p.x,p.y))),cells=[];
    for(let y=0;y<grid.height;y++)for(let x=0;x<grid.width;x++){
      const k=cellKey(x,y);if(blocked.has(k)||used.has(k))continue;
      const edge=side==="hero"?x:(grid.width-1-x),center=Math.abs(y-(grid.height-1)/2);
      cells.push({x,y,score:edge*100+center});
    }
    cells.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
    const out=[];
    for(const c of cells){if(out.length>=count)break;const k=cellKey(c.x,c.y);if(used.has(k))continue;used.add(k);out.push({x:c.x,y:c.y})}
    return out;
  }
  function participants(rt){
    try{const x=call(rt,"dungeonParticipants");if(Array.isArray(x)&&x.length)return x.map(String)}catch(e){}
    try{const x=call(rt,"normalizeGameParticipants");if(Array.isArray(x)&&x.length)return x.map(String)}catch(e){}
    return Object.keys(rt?.CHARS||{}).filter(id=>/^dungeon_/i.test(id));
  }
  function dungeonRuntimeState(rt){
    try{const raw=rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2"),x=raw?JSON.parse(raw):null;if(x?.participants&&x?.last?.map)return x}catch(e){}
    try{const x=call(rt,"loadDungeonState");if(x?.participants&&x?.last?.map)return x}catch(e){}
    return null;
  }
  function runtimeHeroCell(state,id){
    const p=state?.participants||[],active=str(p[clamp(Math.trunc(num(state?.index,0)),0,Math.max(0,p.length-1))]);
    if(str(id)===active&&state?.branch?.active&&Number.isInteger(Number(state?.positions?.[id])))return Number(state.positions[id]);
    const saved=state?.heroBranchStates?.[id];if(saved?.branch?.active&&Number.isInteger(Number(saved.cell)))return Number(saved.cell);
    return Number.isInteger(Number(state?.positions?.[id]))?Number(state.positions[id]):-1;
  }
  function runtimeHeroScope(state,id){
    id=str(id);const p=state?.participants||[],active=str(p[clamp(Math.trunc(num(state?.index,0)),0,Math.max(0,p.length-1))]);
    const rawRoom=state?.heroRooms?.[id],room=Number.isFinite(Number(rawRoom))?Math.max(0,Number(rawRoom)):0;let branchSourceId="";
    if(id===active&&state?.branch?.active)branchSourceId=str(state.branch.sourceId||state.branch.branchSourceId||"");
    else{const saved=state?.heroBranchStates?.[id];if(saved?.branch?.active)branchSourceId=str(saved.branch.sourceId||saved.branch.branchSourceId||"")}
    return {room,branchSourceId};
  }
  function enteredParticipants(rt,ids=participants(rt),wantedScope=null){
    const requested=[...new Set(arr(ids).map(str).filter(Boolean))],state=dungeonRuntimeState(rt);if(!state)return requested;
    const p=arr(state.participants).map(str),active=p[clamp(Math.trunc(num(state.index,0)),0,Math.max(0,p.length-1))]||"",scope=wantedScope||runtimeHeroScope(state,active);
    return requested.filter(id=>{const own=runtimeHeroScope(state,id),cell=runtimeHeroCell(state,id);return own.room>0&&cell>=0&&own.room===num(scope?.room,0)&&own.branchSourceId===str(scope?.branchSourceId)});
  }
  function activeEnemies(rt){try{return arr(call(rt,"loadActiveEnemies")).filter(x=>!x?.removed&&!x?.defeated&&num(x?.hp,1)>0)}catch(e){return []}}
  function buildInput(rt=R,options={}){
    const requestedHeroIds=arr(options.heroIds).length?arr(options.heroIds).map(String):participants(rt),heroIds=enteredParticipants(rt,requestedHeroIds,options.scope);
    const enemies=activeEnemies(rt).filter(x=>!arr(options.enemyIds).length||arr(options.enemyIds).map(String).includes(str(x.id)));
    const grid=options.grid||gridFromDungeonMap(rt)||defaultGrid(heroIds.length,enemies.length),used=new Set();
    let hp=spawnCells(grid,heroIds.length,"hero",used),ep=spawnCells(grid,enemies.length,"enemy",used);
    if(hp.length<heroIds.length||ep.length<enemies.length){const fallback=defaultGrid(heroIds.length,enemies.length);used.clear();hp=spawnCells(fallback,heroIds.length,"hero",used);ep=spawnCells(fallback,enemies.length,"enemy",used);grid.width=fallback.width;grid.height=fallback.height;grid.blocked=[]}
    const actors=[...heroIds.map((id,i)=>heroActor(rt,id,hp[i])),...enemies.map((x,i)=>enemyActor(rt,x,ep[i]))];
    return {id:options.id||`gens_${Date.now().toString(36)}`,grid,actors,rngSeed:num(options.rngSeed,0),config:{actionsPerTurn:1},meta:{source:"gensrpg",heroIds,enemyInstanceIds:enemies.map(x=>str(x.id))}};
  }
  function createBattle(rt=R,options={}){
    const E=engine(rt);if(!E?.createBattle)throw new Error("Tactical combat V2 engine unavailable");
    return E.createBattle(buildInput(rt,options));
  }
  function commitBattle(rt=R,battle,{removeDefeatedEnemies=false}={}){
    if(!battle?.actors)return {heroes:0,enemies:0};let heroes=0,enemies=0;
    for(const a of battle.actors){
      if(a.side==="hero"){
        const id=a.meta?.heroId||a.id,st=heroState(rt,id);if(!st)continue;
        st.wounds=Math.max(0,Math.round(num(a.maxHp,1)-num(a.hp,0)));
        try{if(typeof rt?.key==="function"&&rt.localStorage?.setItem)rt.localStorage.setItem(rt.key(id),JSON.stringify(st));else if(typeof rt?.saveState==="function")rt.saveState(id,st)}catch(e){}
        heroes++;
      }
    }
    let list=activeEnemies(rt);let changed=false;
    for(const a of battle.actors.filter(x=>x.side==="enemy")){
      const iid=a.meta?.instanceId;const ix=list.findIndex(x=>str(x.id)===str(iid));if(ix<0)continue;
      list[ix].hp=Math.max(0,num(a.hp,0));list[ix].defeated=!a.alive||list[ix].hp<=0;changed=true;enemies++;
    }
    if(changed&&removeDefeatedEnemies)list=list.filter(x=>!x.defeated&&num(x.hp,0)>0);
    if(changed)try{call(rt,"saveActiveEnemies",list)}catch(e){}
    return {heroes,enemies};
  }

  return {VERSION,APP_VERSION,accuracyPercent,weaponHitProfile,heroSnapshot,equippedWeaponEntries,heroAttacks,heroActor,enemyAttacks,enemyActor,defaultGrid,dungeonMap,gridFromDungeonMap,spread,spawnCells,participants,dungeonRuntimeState,runtimeHeroCell,runtimeHeroScope,enteredParticipants,activeEnemies,buildInput,createBattle,commitBattle};
});
