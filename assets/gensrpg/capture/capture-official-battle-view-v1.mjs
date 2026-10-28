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
  const local=context?.snapshot?.sides?.[0]?.creatures?.[0];
  const wild=context?.snapshot?.sides?.[1]?.creatures?.[0];
  if(!name(local?.creatureId)||!name(local?.instanceId)||
     !name(wild?.creatureId)||!name(wild?.instanceId)||
     !name(context?.encounterId)) {
   throw new TypeError('Canonical saved Capture World/roster battle identities required');
  }
  const authored=resources.authoredSource.buildEncounter({
   ...resources.settings,encounterId:context.encounterId,
   player:{creatureId:local.creatureId,instanceId:local.instanceId},
   opponent:{creatureId:wild.creatureId,instanceId:wild.instanceId}
  });
  const source=authored.nativeCombatSource;
  const actors=source?.battleFormat?.actors;
  if(!Array.isArray(actors)||actors.length!==2||
     source.battleFormat.localActorId!=='player') {
   throw new TypeError('Official Capture battle view requires a 1v1 author export');
  }
  const sha=name(resources.source?.assetsSha);
  const repository=name(resources.source?.assetsRepository);
  if(!/^[a-f0-9]{40}$/.test(sha)||!repository) {
   throw new TypeError('Official Capture visual release is not pinned');
  }
  const arena=element('div','hub-fighters');
  const cards=[];
  for(const actor of actors) {
   const creature=authored.exported.creatures.find(c=>c.id===actor.creatureId);
   const binding=authored.exported.presentation?.creatures?.[creature?.presentationId];
   const isPlayer=actor.actorId===source.battleFormat.localActorId;
   const visual=isPlayer?binding?.visual?.back:binding?.visual?.front;
   if(!name(visual?.assetId))throw new Error('Official authored sprite missing for '+actor.creatureId);
   const media=assetResolver.resolveCaptureLabAsset({
    catalog:resources.catalog,assetId:visual.assetId,
    commit:sha,approvedCommit:sha,approvedRepository:repository
   });
   if(!name(media?.url))throw new Error('Approved Capture sprite URL missing');
   const card=element('article','hub-fighter');
   const title=element('h2'),image=element('img');
   const hp=element('p'),meter=element('progress'),energy=element('p');
   title.textContent=actor.displayName;
   image.alt='Visuel officiel de '+actor.displayName;
   image.src=media.url;
   image.dataset.authorAssetId=visual.assetId;
   image.decoding='async';
   image.loading='eager';
   image.style.maxWidth='min(24vw, 150px)';
   image.style.maxHeight='min(32vh, 150px)';
   image.style.objectFit='contain';
   meter.setAttribute('aria-label','PV de '+actor.displayName);
   if(isPlayer)energy.dataset.playerEnergy='true';
   card.append(title,image,hp,meter,energy);
   arena.append(card);
   cards.push({id:actor.actorId,hp,meter,energy});
  }
  const message=element('p');message.setAttribute('role','status');
  const actions=element('div','actions');
  let active=true;
  for(const skill of battle.skills()) {
   if(!name(skill?.id)||!name(skill?.name))throw new TypeError('Official Combat skill descriptor incomplete');
   const button=element('button');button.type='button';button.textContent=skill.name;
   button.dataset.combatSkill=skill.id;
   button.addEventListener('click',()=>{
    if(!active)return;
    try {
     const outcome=battle.useSkill(skill.id);
     message.textContent=outcome?.ok?'Action en préparation…':'Action indisponible pour le moment.';
    } catch(error) {
     message.textContent='Action refusée par le moteur officiel : '+String(error?.message||error);
    }
   });
   actions.append(button);
  }
  const flee=element('button');flee.id='capture-official-flee';flee.type='button';
  flee.textContent='Fuir';
  flee.addEventListener('click',()=>{
   if(!active)return;
   try {battle.flee();}
   catch(error){message.textContent='Fuite refusée : '+String(error?.message||error);}
  });
  actions.append(flee);
  mounted=true;
  host.replaceChildren(arena,message,actions);
  host.hidden=false;
  return Object.freeze({
   render(state){
    if(!active)return;
    if(!state?.fighters)throw new TypeError('Official Combat state required for rendering');
    for(const card of cards) {
     const fighter=state.fighters[card.id];
     if(!fighter)throw new TypeError('Official Combat actor missing from live state: '+card.id);
     card.hp.textContent='PV '+fighter.hp+' / '+fighter.maxHp;
     card.meter.max=fighter.maxHp;card.meter.value=fighter.hp;
     card.energy.textContent='Énergie '+fighter.energy+' / '+fighter.maxEnergy;
    }
   },
   dispose(){
    if(!active)return false;
    active=false;
    mounted=false;
    host.replaceChildren();
    host.hidden=true;
    return true;
   }
  });
 };
}
