function clone(value){return structuredClone(value);}
function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

const STATUS_META={
  inactive:{icon:'⚪',label:'Inactive'},
  active:{icon:'🟡',label:'En cours'},
  completed:{icon:'✅',label:'Terminée'},
  failed:{icon:'❌',label:'Échouée'},
};

function stateFor(runtime,questId){return runtime?.states?.[String(questId)]||null;}

export function buildQuestJournalEntries(quests=[],runtime,{includeInactive=false}={}){
  const entries=[];
  for(const quest of quests||[]){
    if(!quest?.id||quest.enabled===false) continue;
    const state=stateFor(runtime,quest.id);
    const status=String(state?.status||'inactive');
    if(status==='inactive'&&!includeInactive) continue;
    const objectives=(quest.objectives||[]).map(objective=>{
      const required=Math.max(1,Math.floor(Number(objective.required??1)||1));
      const value=Math.max(0,Math.min(required,Number(state?.progress?.[objective.id]||0)));
      return {
        id:String(objective.id),
        label:String(objective.label||'Objectif'),
        optional:Boolean(objective.optional),
        required,
        value,
        completed:value>=required,
      };
    });
    const requiredObjectives=objectives.filter(objective=>!objective.optional);
    const completedRequired=requiredObjectives.filter(objective=>objective.completed).length;
    entries.push({
      id:String(quest.id),
      name:String(quest.name||'Quête'),
      description:String(quest.description||''),
      status,
      statusMeta:clone(STATUS_META[status]||STATUS_META.inactive),
      repeatable:Boolean(quest.repeatable),
      objectives,
      progress:{completed:completedRequired,total:requiredObjectives.length},
      startedAt:state?.startedAt||null,
      completedAt:state?.completedAt||null,
      failedAt:state?.failedAt||null,
      rewardsClaimed:Boolean(state?.rewardsClaimed),
    });
  }
  const order={active:0,completed:1,failed:2,inactive:3};
  entries.sort((a,b)=>(order[a.status]??9)-(order[b.status]??9)||a.name.localeCompare(b.name,'fr'));
  return entries;
}

export function renderQuestJournal(quests=[],runtime,{includeInactive=false}={}){
  const entries=buildQuestJournalEntries(quests,runtime,{includeInactive});
  if(!entries.length) return '<section class="editor-section quest-journal"><div class="section-title-row"><div><h3>📜 Journal de quêtes</h3><p class="muted">Aucune quête active pour le moment.</p></div><button class="help-button" data-help="rpg-quest-journal" type="button">?</button></div></section>';
  return `<section class="editor-section quest-journal"><div class="section-title-row"><div><h3>📜 Journal de quêtes</h3><p class="muted">Objectifs et progression mis à jour automatiquement par le donjon.</p></div><button class="help-button" data-help="rpg-quest-journal" type="button">?</button></div><div class="editor-list">${entries.map(entry=>renderQuestJournalCard(entry)).join('')}</div></section>`;
}

export function renderQuestJournalCard(entry){
  const status=entry.statusMeta||STATUS_META.inactive;
  const objectives=entry.objectives||[];
  const progressText=entry.progress?.total?`${entry.progress.completed}/${entry.progress.total} objectif(s) obligatoire(s)`:'Aucun objectif obligatoire';
  return `<article class="editor-card compact quest-card" data-quest-id="${esc(entry.id)}"><div class="editor-card-head"><div><strong>${esc(status.icon)} ${esc(entry.name)}</strong><p class="muted">${esc(progressText)}</p></div><span class="status-pill">${esc(status.label)}</span></div>${entry.description?`<p>${esc(entry.description)}</p>`:''}<div class="quest-objectives">${objectives.map(objective=>`<div class="quest-objective ${objective.completed?'completed':''}"><span>${objective.completed?'✅':'⬜'} ${esc(objective.label)}${objective.optional?' <small>(optionnel)</small>':''}</span><strong>${objective.value}/${objective.required}</strong></div>`).join('')||'<p class="muted">Aucun objectif.</p>'}</div>${entry.repeatable?'<p class="muted">🔁 Quête répétable</p>':''}</article>`;
}

export function mountQuestJournal(host,quests=[],runtime,options={}){
  if(!host) return;
  host.innerHTML=renderQuestJournal(quests,runtime,options);
}
