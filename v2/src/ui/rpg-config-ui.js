function text(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim();}

const GROUPS=[
  {id:'foundation',label:'🧱 Fondations',hint:'Statistiques, ressources et progression de base.',match:/statistique|ressource|progression|héros/i},
  {id:'rules',label:'⚔️ Règles & combat',hint:'Jets, pièges, déplacement, vision et règles de combat.',match:/jet|test|piège|combat|déplacement|mouvement|vision|spatial|initiative|armure|dégât/i},
  {id:'abilities',label:'✨ Capacités',hint:'Conditions, effets, compétences et transformations.',match:/condition|effet|compétence|transformation|forme/i},
  {id:'content',label:'🎒 Contenu & monde',hint:'Objets, équipements, sets, économie, bestiaire et contenu narratif.',match:/objet|équipement|set|marchand|économie|bestiaire|créature|quête|allié|compagnon|événement|butin/i},
];

function currentEditorRoot(root){
  const body=root.querySelector?.('#rpgPageBody');
  if(!body) return null;
  const eyebrow=text(body.querySelector('.workspace-head .eyebrow'));
  if(!/RPG\s*·\s*ÉDITEUR GÉNÉRIQUE/i.test(eyebrow)) return null;
  return body;
}

function headingFor(section){return text(section.querySelector('h3')||section.querySelector('h2'));}
function groupFor(section){
  const heading=headingFor(section);
  return GROUPS.find(group=>group.match.test(heading))||GROUPS[3];
}

function makeShell(body){
  let shell=body.querySelector(':scope > [data-rpg-config-shell]');
  if(shell) return shell;
  shell=document.createElement('section');
  shell.className='rpg-config-shell';
  shell.dataset.rpgConfigShell='';
  shell.innerHTML=`<div class="rpg-config-overview"><div><p class="eyebrow">CONFIGURATION RPG</p><h3>Organiser l’univers</h3><p class="muted">Les réglages sont regroupés par usage. Les éditeurs et leurs données restent inchangés.</p></div><div class="rpg-config-summary" data-rpg-config-summary></div></div><nav class="rpg-config-nav" aria-label="Catégories de configuration">${GROUPS.map((group,index)=>`<button type="button" class="secondary-button ${index===0?'active':''}" data-rpg-config-tab="${group.id}"><span>${group.label}</span><small>${group.hint}</small></button>`).join('')}</nav><div class="rpg-config-groups">${GROUPS.map((group,index)=>`<section class="rpg-config-group" data-rpg-config-group="${group.id}" ${index===0?'':'hidden'}><header><h3>${group.label}</h3><p class="muted">${group.hint}</p></header><div data-rpg-config-group-body="${group.id}"></div></section>`).join('')}</div>`;
  const head=body.querySelector(':scope > .workspace-head');
  if(head) head.insertAdjacentElement('afterend',shell); else body.prepend(shell);
  shell.querySelectorAll('[data-rpg-config-tab]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.rpgConfigTab;
    shell.querySelectorAll('[data-rpg-config-tab]').forEach(node=>node.classList.toggle('active',node===button));
    shell.querySelectorAll('[data-rpg-config-group]').forEach(group=>group.hidden=group.dataset.rpgConfigGroup!==id);
    shell.dataset.activeGroup=id;
  }));
  shell.dataset.activeGroup='foundation';
  return shell;
}

export function organizeRpgConfiguration(root=document){
  const body=currentEditorRoot(root);
  if(!body) return {organized:false,count:0};
  const shell=makeShell(body);
  const sections=[...body.querySelectorAll('.editor-section')].filter(section=>!section.closest('[data-rpg-config-shell]'));
  let moved=0;
  for(const section of sections){
    const group=groupFor(section);
    const target=shell.querySelector(`[data-rpg-config-group-body="${group.id}"]`);
    if(!target) continue;
    section.dataset.rpgConfigCategory=group.id;
    target.append(section);
    moved+=1;
  }
  const counts=GROUPS.map(group=>({group,count:shell.querySelectorAll(`[data-rpg-config-category="${group.id}"]`).length}));
  const summary=shell.querySelector('[data-rpg-config-summary]');
  if(summary) summary.innerHTML=counts.map(({group,count})=>`<span><strong>${count}</strong><small>${group.label.replace(/^\S+\s/,'')}</small></span>`).join('');
  return {organized:true,count:moved,counts:Object.fromEntries(counts.map(x=>[x.group.id,x.count]))};
}

let scheduled=false;
function schedule(){
  if(scheduled) return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;organizeRpgConfiguration(document);});
}

if(typeof document!=='undefined'){
  organizeRpgConfiguration(document);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
}
