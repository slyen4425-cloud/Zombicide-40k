// The only opt-in Capture DOM view for the official authored Lab battle.
// The pinned Lab Core owns every rule, state, ability, timer and outcome;
// Capture's World/roster own persistence. No runtime or save authority here.
export function createCaptureOfficialBattleViewV1({host,assetResolver}) {
 if(!host||typeof host.replaceChildren!=='function'||
    typeof host.ownerDocument?.createElement!=='function') {
  throw new TypeError('Official Capture battle view requires a dedicated DOM host');
 }
 if(typeof assetResolver?.resolveCaptureLabAsset!=='function') {
  throw new TypeError('Official Capture battle view requires the existing central asset resolver');
 }
 const document=host.ownerDocument;
 const element=(tag,className='')=>{
  const item=document.createElement(tag);
  if(className)item.className=className;
  return item;
 };
 const name=value=>typeof value==='string'?value.trim():'';
 let mounted=false;
 return function mountBattle(battle,context,resources) {
  if(mounted||!host.hidden)throw new Error('Official Capture battle view already mounted');
  if(typeof battle?.skills!=='function'||typeof battle?.useSkill!=='function'||
     typeof battle?.flee!=='function') {
   throw new TypeError('Only the official Combat Lab session may control this view');
  }
  if(typeof resources?.authoredSource?.buildEncounter!=='function'||!resources?.catalog) {
   throw new TypeError('Signed official Combat author and visual catalog are required');
  }
  const sides=context?.snapshot?.sides;
  const count=Array.isArray(sides)&&sides.length===2&&Array.isArray(sides[0]?.creatures)
   ?sides[0].creatures.length:0;
  if(![1,2].includes(count)||!Array.isArray(sides[1]?.creatures)||
     sides[1].creatures.length!==count||!name(context?.encounterId)) {
   throw new TypeError('Official Capture view requires balanced active 1v1 or 2v2 snapshot');
  }
  const members=sides.flatMap(side=>side.creatures);
  const identities=members.map(member=>name(member?.instanceId));
  if(identities.some(id=>!id)||new Set(identities).size!==members.length||
     members.some(member=>!name(member?.creatureId))||
     sides.some(side=>!Array.isArray(side.active)||side.active.length!==count||
      side.active.some((id,i)=>id!==side.creatures[i]?.instanceId))) {
   throw new TypeError('Canonical saved Capture active roster and unique identities required');
  }
  const actorInput=member=>({creatureId:name(member.creatureId),instanceId:name(member.instanceId)});
  // One official author projection for both modes. No guessed sprites, rules,
  // team membership or reserve slots. The public World still launches only 1v1.
  const request=count===1
   ?{player:actorInput(sides[0].creatures[0]),opponent:actorInput(sides[1].creatures[0])}
   :{playerTeam:sides[0].creatures.map(actorInput),
     opponentTeam:sides[1].creatures.map(actorInput)};
  const authored=resources.authoredSource.buildEncounter({
   ...resources.settings,encounterId:context.encounterId,...request
  });
  const source=authored.nativeCombatSource;
  const actors=source?.battleFormat?.actors;
  const actorIds=authored.actorIds;
  if(!Array.isArray(actors)||actors.length!==2*count||
     !Array.isArray(actorIds)||actorIds.length!==actors.length||
     source.battleFormat.localActorId!==actorIds[0]||
     typeof source.battleFormat.teamOf!=='function') {
   throw new TypeError('Official Capture view requires matching native Combat actors');
  }
  const localTeam=source.battleFormat.teamOf(actorIds[0]);
  const enemyTeam=source.battleFormat.teamOf(actorIds[count]);
  if(!name(localTeam)||!name(enemyTeam)||localTeam===enemyTeam||
     actorIds.some((id,i)=>{
      const actor=actors.find(candidate=>candidate.actorId===id);
      return !actor||actor.creatureId!==members[i].creatureId||
       authored.instanceIds?.[id]!==members[i].instanceId||
       source.battleFormat.teamOf(id)!==(i<count?localTeam:enemyTeam);
     })) {
   throw new TypeError('Official Capture actor/team/instance projection drift');
  }
  const sha=name(resources.source?.assetsSha);
  const repository=name(resources.source?.assetsRepository);
  if(!/^[a-f0-9]{40}$/.test(sha)||!repository) {
   throw new TypeError('Official Capture visual release is not pinned');
  }
  const arena=element('div','hub-fighters');
  arena.style.display='grid';
  arena.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
  arena.style.gap='clamp(6px,1.8vw,16px)';
  arena.style.width='100%';
  arena.style.minWidth='0';
  arena.style.boxSizing='border-box';
  const message=element('p');message.setAttribute('role','status');
  const targets=[];
  const destinations=count===1?[arena,arena]:sides.map((side,i)=>{
   const team=element('section','hub-team');
   team.dataset.captureTeam=i===0?'local':'opponent';
   team.style.minWidth='0';
   const heading=element('h3');
   heading.textContent=name(side.name)||(i===0?'Équipe':'Adversaires');
   heading.style.fontSize='clamp(12px,2vw,17px)';
   heading.style.margin='0 0 5px';
   heading.style.textAlign='center';
   const roster=element('div','hub-team-roster');
   roster.style.display='grid';
   roster.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
   roster.style.gap='clamp(3px,1vw,8px)';
   roster.style.minWidth='0';
   team.append(heading,roster);
   arena.append(team);
   return roster;
  });
  const cards=[];
  let selectedTarget=count===2?members[count].instanceId:null;
  function syncSelection(){
   if(count!==2)return;
   for(const card of cards){
    card.targetButton.setAttribute('aria-pressed',String(card.instanceId===selectedTarget));
   }
   if(selectedTarget)host.dataset.captureSelectedTarget=selectedTarget;
   else delete host.dataset.captureSelectedTarget;
  }
  for(let i=0;i<actorIds.length;i++){
   const actor=actors.find(candidate=>candidate.actorId===actorIds[i]);
   const creature=authored.exported.creatures.find(c=>c.id===actor.creatureId);
   const binding=authored.exported.presentation?.creatures?.[creature?.presentationId];
   const isPlayer=i<count;
   const visual=isPlayer?binding?.visual?.back:binding?.visual?.front;
   if(!name(visual?.assetId))throw new Error('Official authored sprite missing for '+actor.creatureId);
   const media=assetResolver.resolveCaptureLabAsset({
    catalog:resources.catalog,assetId:visual.assetId,
    commit:sha,approvedCommit:sha,approvedRepository:repository
   });
   if(!name(media?.url))throw new Error('Approved Capture sprite URL missing');
   const card=element('article','hub-fighter');
   card.dataset.combatActorId=actor.actorId;
   card.dataset.captureInstanceId=members[i].instanceId;
   card.style.display='flex';card.style.flexDirection='column';
   card.style.alignItems='center';card.style.minWidth='0';card.style.textAlign='center';
   const title=element('h2'),image=element('img');
   const hp=element('p'),meter=element('progress'),energy=element('p');
   title.textContent=actor.displayName;
   title.style.fontSize=count===2?'clamp(11px,1.6vw,15px)':'';
   title.style.margin=count===2?'3px 0':'';
   image.alt='Visuel officiel de '+actor.displayName;
   image.src=media.url;
   image.dataset.authorAssetId=visual.assetId;
   image.decoding='async';
   image.loading='eager';
   image.style.maxWidth=count===2?'min(16vw,105px)':'min(24vw, 150px)';
   image.style.maxHeight=count===2?'min(23vh,105px)':'min(32vh, 150px)';
   image.style.objectFit='contain';
   meter.setAttribute('aria-label','PV de '+actor.displayName);
   meter.style.maxWidth='100%';
   hp.style.margin=count===2?'2px 0':'';
   energy.style.margin=count===2?'2px 0':'';
   if(i===0)energy.dataset.playerEnergy='true';
   card.append(title,image,hp,meter,energy);
   let targetButton=null;
   if(count===2){
    targetButton=element('button');
    targetButton.type='button';
    targetButton.textContent='Cibler '+actor.displayName;
    targetButton.dataset.captureTargetInstance=members[i].instanceId;
    targetButton.style.minHeight='44px';
    targetButton.style.maxWidth='100%';
    targetButton.style.whiteSpace='normal';
    targetButton.addEventListener('click',()=>{
     if(!active||targetButton.disabled)return;
     selectedTarget=members[i].instanceId;
     syncSelection();
     message.textContent='Cible : '+actor.displayName;
    });
    card.append(targetButton);
    targets.push(targetButton);
   }
   destinations[isPlayer?0:1].append(card);
   cards.push({id:actor.actorId,instanceId:members[i].instanceId,
    sideIndex:isPlayer?0:1,hp,meter,energy,targetButton});
  }
  const actions=element('div','actions');
  actions.style.display='flex';actions.style.flexWrap='wrap';
  actions.style.gap='8px';actions.style.justifyContent='center';
  let active=true;
  for(const skill of battle.skills()){
   if(!name(skill?.id)||!name(skill?.name))throw new TypeError('Official Combat skill descriptor incomplete');
   const button=element('button');button.type='button';button.textContent=skill.name;
   button.style.minHeight='44px';button.style.flex='0 1 auto';
   button.dataset.combatSkill=skill.id;
   button.addEventListener('click',()=>{
    if(!active)return;
    try{
     if(count===2&&!selectedTarget){
      message.textContent='Aucune cible active disponible.';return;
     }
     // The actual Lab handle validates range, effect, target and cost.
     const outcome=count===2?battle.useSkill(skill.id,selectedTarget):battle.useSkill(skill.id);
     message.textContent=outcome?.ok?'Action en préparation…':'Action indisponible pour le moment.';
    }catch(error){
     message.textContent='Action refusée par le moteur officiel : '+String(error?.message||error);
    }
   });
   actions.append(button);
  }
  const flee=element('button');flee.id='capture-official-flee';flee.type='button';
  flee.textContent='Fuir';flee.style.minHeight='44px';
  flee.addEventListener('click',()=>{
   if(!active)return;
   try{battle.flee();}
   catch(error){message.textContent='Fuite refusée : '+String(error?.message||error);}
  });
  actions.append(flee);
  mounted=true;
  host.replaceChildren(arena,message,actions);
  host.hidden=false;
  syncSelection();
  return Object.freeze({
   render(state){
    if(!active)return;
    if(!state?.fighters)throw new TypeError('Official Combat state required for rendering');
    for(const card of cards){
     const fighter=state.fighters[card.id];
     if(!fighter)throw new TypeError('Official Combat actor missing from live state: '+card.id);
     card.hp.textContent='PV '+fighter.hp+' / '+fighter.maxHp;
     card.meter.max=fighter.maxHp;card.meter.value=fighter.hp;
     card.energy.textContent='Énergie '+fighter.energy+' / '+fighter.maxEnergy;
     if(card.targetButton)card.targetButton.disabled=fighter.hp<=0;
    }
    if(count===2){
     if(!cards.some(card=>card.instanceId===selectedTarget&&
       state.fighters[card.id].hp>0)){
      const next=cards.find(card=>card.sideIndex===1&&state.fighters[card.id].hp>0)||
       cards.find(card=>state.fighters[card.id].hp>0);
      selectedTarget=next?.instanceId??null;
     }
     syncSelection();
    }
   },
   dispose(){
    if(!active)return false;
    active=false;
    mounted=false;
    host.replaceChildren();
    host.hidden=true;
    delete host.dataset.captureSelectedTarget;
    return true;
   }
  });
 };
}
