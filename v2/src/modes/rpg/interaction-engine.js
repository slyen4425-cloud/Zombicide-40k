function clone(value){return structuredClone(value);}
function id(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export const INTERACTION_KINDS=['chest','trap','puzzle','event','switch','portal','object'];
export const ATTACHMENT_KINDS=['cell','door','interaction'];

export function ensureRoomInteractions(layout){
  const next=clone(layout||{});
  next.interactions=Array.isArray(next.interactions)?next.interactions:[];
  return next;
}

export function createRoomInteraction({
  id:interactionId=id(),
  kind='object',
  name='Nouvelle interaction',
  enabled=true,
  attachment={kind:'cell',x:0,y:0},
  conditionIds=[],
  effectIds=[],
  data={},
}={}){
  return {
    id:String(interactionId),
    kind:INTERACTION_KINDS.includes(kind)?kind:'object',
    name:String(name||'Interaction'),
    enabled:enabled!==false,
    attachment:clone(attachment||{kind:'cell',x:0,y:0}),
    conditionIds:[...(conditionIds||[])].map(String),
    effectIds:[...(effectIds||[])].map(String),
    data:clone(data||{}),
  };
}

function inside(layout,x,y){
  return Number.isInteger(Number(x))&&Number.isInteger(Number(y))&&Number(x)>=0&&Number(y)>=0&&Number(x)<Number(layout?.width||0)&&Number(y)<Number(layout?.height||0);
}

export function validateInteractionAttachment(layout,interaction){
  const attachment=interaction?.attachment||{};
  if(!ATTACHMENT_KINDS.includes(attachment.kind)) return {valid:false,reason:'invalid-attachment-kind'};
  if(attachment.kind==='cell') return inside(layout,attachment.x,attachment.y)?{valid:true}:{valid:false,reason:'cell-out-of-bounds'};
  if(attachment.kind==='door') return (layout?.doors||[]).some(d=>String(d.id)===String(attachment.targetId))?{valid:true}:{valid:false,reason:'door-missing'};
  if(attachment.kind==='interaction'){
    if(String(attachment.targetId)===String(interaction?.id)) return {valid:false,reason:'self-attachment'};
    return (layout?.interactions||[]).some(i=>String(i.id)===String(attachment.targetId))?{valid:true}:{valid:false,reason:'interaction-missing'};
  }
  return {valid:false,reason:'invalid-attachment'};
}

export function addRoomInteraction(layout,interaction){
  const next=ensureRoomInteractions(layout);
  if(next.interactions.some(i=>String(i.id)===String(interaction?.id))) return {ok:false,reason:'interaction-exists',layout};
  const candidate=createRoomInteraction(interaction);
  const check=validateInteractionAttachment(next,candidate);
  if(!check.valid) return {ok:false,reason:check.reason,layout};
  next.interactions.push(candidate);
  return {ok:true,layout:next,interaction:clone(candidate)};
}

export function updateRoomInteraction(layout,interactionId,patch={}){
  const next=ensureRoomInteractions(layout);
  const index=next.interactions.findIndex(i=>String(i.id)===String(interactionId));
  if(index<0) return {ok:false,reason:'interaction-missing',layout};
  const candidate={...next.interactions[index],...clone(patch)};
  if(patch.attachment) candidate.attachment=clone(patch.attachment);
  const check=validateInteractionAttachment(next,candidate);
  if(!check.valid) return {ok:false,reason:check.reason,layout};
  next.interactions[index]=candidate;
  return {ok:true,layout:next,interaction:clone(candidate)};
}

export function removeRoomInteraction(layout,interactionId){
  const next=ensureRoomInteractions(layout);
  const target=String(interactionId);
  next.interactions=next.interactions.filter(i=>String(i.id)!==target);
  for(const interaction of next.interactions){
    if(interaction.attachment?.kind==='interaction'&&String(interaction.attachment.targetId)===target){
      interaction.attachment={kind:'cell',x:0,y:0};
    }
  }
  return next;
}

export function interactionsAtCell(layout,x,y){
  const list=layout?.interactions||[];
  const direct=list.filter(i=>i.enabled!==false&&i.attachment?.kind==='cell'&&Number(i.attachment.x)===Number(x)&&Number(i.attachment.y)===Number(y));
  const doorIds=new Set((layout?.doors||[]).filter(d=>Number(d.x)===Number(x)&&Number(d.y)===Number(y)).map(d=>String(d.id)));
  const onDoors=list.filter(i=>i.enabled!==false&&i.attachment?.kind==='door'&&doorIds.has(String(i.attachment.targetId)));
  const directIds=new Set([...direct,...onDoors].map(i=>String(i.id)));
  const nested=list.filter(i=>i.enabled!==false&&i.attachment?.kind==='interaction'&&directIds.has(String(i.attachment.targetId)));
  return [...direct,...onDoors,...nested].map(clone);
}

export function validateRoomInteractions(layout){
  const errors=[];
  const ids=new Set();
  for(const interaction of layout?.interactions||[]){
    if(ids.has(String(interaction.id))) errors.push({code:'duplicate-interaction-id',interactionId:String(interaction.id)});
    ids.add(String(interaction.id));
    if(!INTERACTION_KINDS.includes(interaction.kind)) errors.push({code:'invalid-interaction-kind',interactionId:String(interaction.id)});
    const check=validateInteractionAttachment(layout,interaction);
    if(!check.valid) errors.push({code:check.reason,interactionId:String(interaction.id)});
    if(interaction.attachment?.kind==='interaction'){
      const target=(layout.interactions||[]).find(i=>String(i.id)===String(interaction.attachment.targetId));
      if(target?.attachment?.kind==='interaction'&&String(target.attachment.targetId)===String(interaction.id)) errors.push({code:'attachment-cycle',interactionId:String(interaction.id)});
    }
  }
  return {valid:errors.length===0,errors};
}
