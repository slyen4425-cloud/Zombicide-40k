/* GenSrpG Tactical Combat V2 — runtime adapter.
   Snapshots current Dungeon heroes/enemies once, then feeds the isolated engine.
   Legacy combat/timeline is never called from this adapter. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Adapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.2.0",APP_VERSION="16.78.103";
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const call=(rt,name,...args)=>typeof rt?.[name]==="function"?rt[name](...args):undefined;

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
    const explicitHit=st.hitChance??it.rpgHitChance??it.hitChance;
    const hit=Number.isFinite(Number(explicitHit))?clamp(num(explicitHit),5,95):accuracyPercent(st.accuracy??it.accuracy);
    const power=Math.max(1,Math.round(num(st.damage??st.power??st.strength??it.damage??it.strength,1)));
    return {
      id:`item:${str(it.id||entry.itemId||index)}`,
      name:str(it.name||`Arme ${index+1}`),minRange,maxRange,hit,power,
      damageType:str(st.damageType||it.damageType||(st.magic?"magic":"physical")),
      ignoreArmor:!!(st.ignoreArmor||it.ignoreArmor),lineOfSight:!melee,
      tags:[melee?"melee":"ranged"],
      meta:{itemId:str(it.id||entry.itemId||""),inventoryIndex:row.idx,dice:num(st.dice??it.dice,1),ammo:entry.ammo??null}
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
  function spread(count,x,height){
    if(count<=0)return [];
    const out=[],step=height/(count+1);
    for(let i=0;i<count;i++)out.push({x,y:clamp(Math.round(step*(i+1))-1,0,height-1)});
    return out;
  }
  function participants(rt){
    try{const x=call(rt,"dungeonParticipants");if(Array.isArray(x)&&x.length)return x.map(String)}catch(e){}
    try{const x=call(rt,"normalizeGameParticipants");if(Array.isArray(x)&&x.length)return x.map(String)}catch(e){}
    return Object.keys(rt?.CHARS||{}).filter(id=>/^dungeon_/i.test(id));
  }
  function activeEnemies(rt){try{return arr(call(rt,"loadActiveEnemies")).filter(x=>!x?.removed&&!x?.defeated&&num(x?.hp,1)>0)}catch(e){return []}}
  function buildInput(rt=R,options={}){
    const heroIds=arr(options.heroIds).length?arr(options.heroIds).map(String):participants(rt);
    const enemies=activeEnemies(rt).filter(x=>!arr(options.enemyIds).length||arr(options.enemyIds).map(String).includes(str(x.id)));
    const grid=options.grid||defaultGrid(heroIds.length,enemies.length),hp=spread(heroIds.length,1,grid.height),ep=spread(enemies.length,grid.width-2,grid.height);
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

  return {VERSION,APP_VERSION,accuracyPercent,heroSnapshot,equippedWeaponEntries,heroAttacks,heroActor,enemyAttacks,enemyActor,defaultGrid,spread,participants,activeEnemies,buildInput,createBattle,commitBattle};
});
