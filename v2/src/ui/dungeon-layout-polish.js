const PRIMARY_SELECTORS=[
  '.dungeon-hero-focus',
  '.dungeon-board-section',
  '.dungeon-event-choice',
  '.dungeon-combat-section',
];

function directMatch(node,selectors){
  return selectors.some(selector=>node.matches?.(selector));
}

export function structureDungeonGameplay(root=document){
  const grids=[...root.querySelectorAll('.dungeon-gameplay-grid')];
  for(const grid of grids){
    if(grid.dataset.gameplayStructured==='true') continue;
    const children=[...grid.children];
    if(!children.length) continue;

    const primary=children.filter(node=>directMatch(node,PRIMARY_SELECTORS));
    const secondary=children.filter(node=>!directMatch(node,PRIMARY_SELECTORS));

    const playSurface=document.createElement('div');
    playSurface.className='dungeon-play-surface';
    playSurface.setAttribute('data-dungeon-play-surface','');
    primary.forEach(node=>playSurface.appendChild(node));
    grid.appendChild(playSurface);

    if(secondary.length){
      const drawer=document.createElement('details');
      drawer.className='dungeon-secondary-drawer';
      drawer.setAttribute('data-dungeon-secondary-drawer','');
      const summary=document.createElement('summary');
      summary.innerHTML='<span>☰ Journal & détails</span><small>Passages · événements · personnages · butin · quêtes</small>';
      drawer.appendChild(summary);
      const content=document.createElement('div');
      content.className='dungeon-secondary-content';
      secondary.forEach(node=>content.appendChild(node));
      drawer.appendChild(content);
      grid.appendChild(drawer);
    }

    grid.dataset.gameplayStructured='true';
  }
}

function scheduleStructure(){
  queueMicrotask(()=>structureDungeonGameplay(document));
}

const observer=new MutationObserver(mutations=>{
  if(mutations.some(mutation=>mutation.addedNodes.length)) scheduleStructure();
});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    structureDungeonGameplay(document);
    observer.observe(document.body,{childList:true,subtree:true});
  },{once:true});
}else{
  structureDungeonGameplay(document);
  observer.observe(document.body,{childList:true,subtree:true});
}
