// GenSrpG V2 — RPG navigation presentation only.
// Reuses the existing tab buttons/listeners; no RPG gameplay state is owned here.

export const RPG_NAV_GROUPS = [
  { id:'play', icon:'🎮', label:'Jouer', description:'Lancer et reprendre une aventure.', tabs:['dungeon'] },
  { id:'heroes', icon:'🧙', label:'Héros', description:'Consulter les personnages jouables.', tabs:['heroes'] },
  { id:'world', icon:'🗺️', label:'Monde', description:'Construire le monde et ses salles.', tabs:['world','room'] },
  { id:'settings', icon:'⚙️', label:'Configuration', description:'Règles, contenu et outils avancés.', tabs:['editor','combat'] },
];

const TAB_LABELS = {
  dungeon:'🎮 Donjon',
  heroes:'🧙 Fiche héros',
  world:'🗺️ World Builder',
  room:'🧱 Salles',
  editor:'⚙️ Règles & contenu',
  combat:'🧪 Laboratoire combat',
};

function groupMarkup(group){
  const section=document.createElement('section');
  section.className=`rpg-nav-group rpg-nav-group-${group.id}`;
  section.dataset.rpgNavGroup=group.id;
  section.innerHTML=`<div class="rpg-nav-group-head"><span class="rpg-nav-group-icon" aria-hidden="true">${group.icon}</span><div><strong>${group.label}</strong><small>${group.description}</small></div></div><div class="rpg-nav-group-actions" data-rpg-nav-actions="${group.id}"></div>`;
  return section;
}

export function enhanceRpgNavigation(root=document,{defaultToPlay=true}={}){
  const nav=root.querySelector?.('.rpg-tabs');
  if(!nav||nav.dataset.rpgNavEnhanced==='true') return {ok:false,reason:'navigation-missing-or-enhanced'};

  const buttons=[...nav.querySelectorAll('[data-rpg-tab]')];
  if(!buttons.length) return {ok:false,reason:'navigation-buttons-missing'};
  const byTab=new Map(buttons.map(button=>[String(button.dataset.rpgTab||''),button]));

  nav.dataset.rpgNavEnhanced='true';
  nav.classList.add('rpg-hub-nav');
  nav.setAttribute('aria-label','Navigation RPG');
  nav.innerHTML='';

  const heading=document.createElement('div');
  heading.className='rpg-nav-heading';
  heading.innerHTML='<div><p class="eyebrow">AVENTURE RPG</p><strong>Que veux-tu faire ?</strong></div><p>Le jeu, les héros, le monde et les réglages sont maintenant séparés.</p>';
  nav.appendChild(heading);

  const grid=document.createElement('div');
  grid.className='rpg-nav-groups';
  nav.appendChild(grid);

  for(const group of RPG_NAV_GROUPS){
    const section=groupMarkup(group);
    const actions=section.querySelector('[data-rpg-nav-actions]');
    for(const tab of group.tabs){
      const button=byTab.get(tab);
      if(!button) continue;
      button.textContent=TAB_LABELS[tab]||button.textContent;
      button.dataset.rpgNavGroupId=group.id;
      button.classList.add('rpg-nav-action');
      actions.appendChild(button);
    }
    grid.appendChild(section);
  }

  const current=buttons.find(button=>button.classList.contains('active'));
  const dungeon=byTab.get('dungeon');
  if(defaultToPlay&&dungeon&&current?.dataset.rpgTab==='editor'){
    queueMicrotask(()=>{
      if(document.contains(dungeon)) dungeon.click();
    });
  }

  return {ok:true,nav,groups:RPG_NAV_GROUPS.length,buttons:buttons.length};
}

export function startRpgNavigationEnhancer(root=document){
  const apply=()=>enhanceRpgNavigation(root);
  apply();
  if(typeof MutationObserver!=='function') return {disconnect(){}};
  const observer=new MutationObserver(()=>apply());
  observer.observe(root.body||root.documentElement||root,{subtree:true,childList:true});
  return observer;
}

if(typeof document!=='undefined') startRpgNavigationEnhancer(document);
