// Capture boundary for the REAL official Combat Lab scene.
// The Lab's mountCaptureCombatPreviewV1 creates the sole CombatSession,
// CombatRuntime, roster/AI, FX, audio and native renderer. No GenSrpg clone.
export function createCaptureNativeLabProviderV1({resolveBattle,mountBattle}) {
 if(typeof resolveBattle!=='function'||typeof mountBattle!=='function')
   throw new TypeError('Native Lab provider needs author resolver and native scene mount');
 const sessions=new WeakMap();
 function createBattle(context){
  const sides=context?.snapshot?.sides;
  const count=Array.isArray(sides)&&sides.length===2?sides[0]?.creatures?.length:0;
  if(![1,2].includes(count)||sides[1]?.creatures?.length!==count||
     sides.some(side=>!Array.isArray(side?.active)||side.active.length!==count||
       side.creatures.some(c=>!side.active.includes(c?.instanceId)||
         !Number.isFinite(c.hp)||c.hp<=0||c.hp>c.maxHp))){
   throw new TypeError('Embedded Lab requires balanced active-only Capture combat snapshot');
  }
  const members=sides.flatMap(side=>side.creatures);
  if(new Set(members.map(c=>c.instanceId)).size!==members.length)
   throw new TypeError('Duplicate Capture creature identity');
  const source=resolveBattle(context);
  const actorIds=source?.actorIds;
  const native=source?.nativeCombatSource;
  if(!native||!Array.isArray(actorIds)||actorIds.length!==members.length||
     new Set(actorIds).size!==actorIds.length||
     native.battleFormat?.actors?.length!==members.length||
     native.battleFormat?.localActorId!==actorIds[0]||
     typeof native.battleFormat?.teamOf!=='function'||
     !source.exported){
   throw new TypeError('Signed Lab Combat actor/export boundary incomplete');
  }
  const team=native.battleFormat.teamOf(actorIds[0]);
  const foe=native.battleFormat.teamOf(actorIds[count]);
  if(team===foe||actorIds.some((id,i)=>native.battleFormat.teamOf(id)!==(i<count?team:foe)))
    throw new TypeError('Lab BattleFormat team projection mismatch');
  const hpByActor={};
  for(let i=0;i<members.length;i++){
   const id=actorIds[i],actor=native.battleFormat.actors.find(a=>a.actorId===id);
   const config=native.fighters.find(f=>f.id===id);
   const member=members[i],roster=native.roster?.teams?.[id];
   if(!actor||actor.creatureId!==member.creatureId||!config||
      member.hp>config.maxHp||member.maxHp!==config.maxHp||
      !roster||roster.activeMemberId!==member.instanceId||
      roster.members?.length!==1||roster.members[0].creatureId!==member.creatureId){
    throw new TypeError('Capture profile does not match official Lab runtime actor');
   }
   hpByActor[id]=member.hp;
  }
  let phase='created',display=null;
  let resolveDone,rejectDone;
  const completion=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});
  function finish(result){
   if(phase==='settled'||phase==='disposed')return false;
   if(!['flee','victory','defeat'].includes(result?.outcome)||!result.state?.fighters)
     throw new TypeError('Only native Lab battle outcomes may be committed');
   const creatures=members.map((member,i)=>{
    const fighter=result.state.fighters[actorIds[i]];
    if(!fighter||!Number.isFinite(fighter.hp)||fighter.hp<0||
       fighter.hp>member.maxHp)throw new TypeError('Native Lab result missing fighter '+actorIds[i]);
    return Object.freeze({instanceId:member.instanceId,hp:fighter.hp});
   });
   phase='settled';
   resolveDone(Object.freeze({outcome:result.outcome,creatures}));
   return true;
  }
  const handle=Object.freeze({
    completion,
    flee(){
     if(phase!=='running'||!display)return false;
     return display.combat.flee();
    }
  });
  sessions.set(handle,{
   start(){
    if(phase!=='created')throw new Error('Native Lab battle already started');
    phase='running';
    // Deferred native mount is still owned by the one Capture port.
    Promise.resolve().then(()=>mountBattle(context,source,Object.freeze(hpByActor))).then(mounted=>{
     if(phase!=='running'){mounted?.dispose?.();return;}
     if(!mounted||typeof mounted.dispose!=='function'||
        typeof mounted.combat?.flee!=='function'||
        typeof mounted.combat?.completion?.then!=='function'){
       mounted?.dispose?.();
       throw new TypeError('The native Lab visual/combat owner did not mount');
     }
     display=mounted;
     mounted.combat.completion.then(result=>{
      try{finish(result);}catch(error){rejectDone(error);}
     },rejectDone);
    }).catch(error=>{
      if(phase==='running'){phase='settled';rejectDone(error);}
    });
   },
   stop(){
    if(phase==='running'||phase==='created'){
      phase='settled';resolveDone(Object.freeze({outcome:'cancelled',creatures:[]}));
    }
    display?.dispose();
   },
   dispose(){
    if(phase==='disposed')return false;
    if(phase==='running'||phase==='created'){
      phase='settled';resolveDone(Object.freeze({outcome:'cancelled',creatures:[]}));
    }
    phase='disposed';
    display?.dispose();
    display=null;
    sessions.delete(handle);
    return true;
   }
  });
  return handle;
 }
 function record(handle){const x=sessions.get(handle);if(!x)throw new TypeError('Unknown official Lab scene handle');return x;}
 return Object.freeze({
  protocol:1,version:'1.1.0',capabilities:Object.freeze(['battle-trigger','battle-1v1','battle-2v2-active']),
  createBattle,startBattle:handle=>record(handle).start(),
  stopBattle:handle=>sessions.get(handle)?.stop(),
  disposeBattle:handle=>sessions.get(handle)?.dispose(),
  openCreatureEditor(){throw new Error('Lab editor is separate from the battle runtime');},
  closeCreatureEditor(){return false;}
 });
}
