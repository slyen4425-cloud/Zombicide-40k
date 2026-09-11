import { startQuestRuntime, applyQuestSignal } from './quest-runtime.js';

function clone(value){return structuredClone(value);}
function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function byId(list,id){return (list||[]).find(x=>String(x.id)===String(id))||null;}

function conditionsPass(ids=[],conditionEvaluator=null){
  if(!ids?.length) return true;
  if(typeof conditionEvaluator!=='function') return false;
  return ids.every(id=>conditionEvaluator(String(id))===true);
}

export function normalizeNpcQuestActions(interaction,quests=[],conditionEvaluator=null){
  const actions=[];
  for(const raw of interaction?.data?.questActions||[]){
    if(!raw?.id||!raw?.kind||!conditionsPass(raw.conditionIds,conditionEvaluator)) continue;
    const kind=String(raw.kind);
    if(kind==='start-quest'){
      const quest=byId(quests,raw.questId);
      if(!quest||quest.enabled===false) continue;
      actions.push({id:String(raw.id),kind,label:String(raw.label||`Accepter : ${quest.name}`),questId:String(quest.id)});
    } else if(kind==='signal'&&raw.signal?.kind){
      actions.push({id:String(raw.id),kind,label:String(raw.label||'Continuer'),signal:{kind:String(raw.signal.kind),targetId:raw.signal.targetId==null?null:String(raw.signal.targetId),amount:Math.max(0,Number(raw.signal.amount??1)||0)}});
    }
  }
  return actions;
}

export function buildNpcInteractionView({interaction,dialogue=[],quests=[],conditionEvaluator=null}={}){
  const actions=normalizeNpcQuestActions(interaction,quests,conditionEvaluator);
  return {
    id:interaction?.id==null?null:String(interaction.id),
    name:String(interaction?.name||'PNJ'),
    icon:String(interaction?.data?.icon||'🗣️'),
    portrait:interaction?.data?.portrait?String(interaction.data.portrait):null,
    dialogue:(dialogue||[]).map(line=>({speaker:String(line.speaker||interaction?.name||'PNJ'),text:String(line.text||''),eventId:line.eventId==null?null:String(line.eventId)})),
    actions,
  };
}

export function renderNpcInteractionView(view={}){
  const portrait=view.portrait?`<img class="npc-portrait" src="${esc(view.portrait)}" alt="${esc(view.name)}">`:`<div class="npc-portrait placeholder" aria-hidden="true">${esc(view.icon||'🗣️')}</div>`;
  const lines=(view.dialogue||[]).map(line=>`<div class="npc-line"><strong>${esc(line.speaker)}</strong><p>${esc(line.text)}</p></div>`).join('')||'<p class="muted">Ce personnage n’a rien à dire pour le moment.</p>';
  const actions=(view.actions||[]).map(action=>`<button type="button" class="primary-button npc-action" data-npc-action="${esc(action.id)}">${esc(action.label)}</button>`).join('');
  return `<section class="npc-interaction-card" data-npc-id="${esc(view.id||'')}"><div class="npc-head">${portrait}<div><p class="eyebrow">INTERACTION</p><h3>${esc(view.name||'PNJ')}</h3></div><button class="help-button tiny" type="button" data-help="rpg-npc-interaction">?</button></div><div class="npc-dialogue">${lines}</div>${actions?`<div class="npc-actions">${actions}</div>`:''}</section>`;
}

export function applyNpcQuestAction(questRuntime,quests,action,{definitions={},context={},now=null}={}){
  if(!action) return {ok:false,reason:'action-missing',runtime:questRuntime};
  if(action.kind==='start-quest'){
    const quest=byId(quests,action.questId);
    if(!quest) return {ok:false,reason:'quest-missing',runtime:questRuntime};
    const out=startQuestRuntime(questRuntime,quest,{definitions,context,now});
    return {...out,action:clone(action)};
  }
  if(action.kind==='signal'){
    const out=applyQuestSignal(questRuntime,quests,action.signal,{definitions,context,now});
    return {...out,action:clone(action)};
  }
  return {ok:false,reason:'action-unsupported',runtime:questRuntime};
}

export function mountNpcInteraction(host,{interaction,dialogue=[],quests=[],questRuntime=null,definitions={},context={},conditionEvaluator=null,onQuestRuntimeChange=null}={}){
  let runtime=questRuntime;
  const render=()=>{
    const view=buildNpcInteractionView({interaction,dialogue,quests,conditionEvaluator});
    host.innerHTML=renderNpcInteractionView(view);
    host.querySelectorAll('[data-npc-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=view.actions.find(item=>String(item.id)===String(button.dataset.npcAction));
      const out=applyNpcQuestAction(runtime,quests,action,{definitions,context});
      if(out.ok){runtime=out.runtime;onQuestRuntimeChange?.(runtime,out);}
    }));
  };
  render();
  return {getQuestRuntime:()=>runtime,render};
}
