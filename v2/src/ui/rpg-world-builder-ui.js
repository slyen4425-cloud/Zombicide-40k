function text(node){return String(node?.textContent||'').trim();}
function sectionTitle(section){return text(section?.querySelector('h3'))||'';}

function enhanceWorld(root){
  const head=[...root.querySelectorAll('.workspace-head')].find(node=>text(node.querySelector('.eyebrow')).includes('WORLD BUILDER'));
  if(!head||head.dataset.worldUx==='1') return false;
  const sections=[...root.querySelectorAll('.editor-section')].filter(section=>section.compareDocumentPosition(head)&Node.DOCUMENT_POSITION_FOLLOWING);
  const world=sections.find(section=>sectionTitle(section)==='Monde');
  const zones=sections.find(section=>sectionTitle(section)==='Zones');
  const rooms=sections.find(section=>sectionTitle(section)==='Salles');
  const links=sections.find(section=>sectionTitle(section)==='Liaisons');
  if(!world||!zones||!rooms||!links) return false;
  head.dataset.worldUx='1';
  head.classList.add('world-builder-head');
  const shell=document.createElement('div');
  shell.className='world-builder-shell';
  shell.innerHTML='<nav class="world-builder-local-nav" aria-label="Construction du monde"><button type="button" data-world-jump="overview">🌍 Vue du monde</button><button type="button" data-world-jump="rooms">🚪 Zones & salles</button><button type="button" data-world-jump="links">🔗 Passages</button></nav><section class="world-builder-overview" data-world-overview></section><section class="world-builder-rooms" data-world-rooms></section><section class="world-builder-links" data-world-links></section>';
  head.after(shell);
  shell.querySelector('[data-world-overview]').append(world,zones);
  shell.querySelector('[data-world-rooms]').append(rooms);
  shell.querySelector('[data-world-links]').append(links);
  const zonesCount=zones.querySelectorAll('[data-zone-id]').length;
  const roomsCount=rooms.querySelectorAll('[data-room-id]').length;
  const linksCount=links.querySelectorAll('[data-link-id]').length;
  const summary=document.createElement('div');
  summary.className='world-builder-summary';
  summary.innerHTML=`<span><strong>${zonesCount}</strong> zone${zonesCount>1?'s':''}</span><span><strong>${roomsCount}</strong> salle${roomsCount>1?'s':''}</span><span><strong>${linksCount}</strong> passage${linksCount>1?'s':''}</span>`;
  head.append(summary);
  shell.querySelectorAll('[data-world-jump]').forEach(button=>button.addEventListener('click',()=>{
    const target=button.dataset.worldJump==='overview'?shell.querySelector('[data-world-overview]'):button.dataset.worldJump==='rooms'?shell.querySelector('[data-world-rooms]'):shell.querySelector('[data-world-links]');
    target?.scrollIntoView?.({behavior:'smooth',block:'start'});
  }));
  return true;
}

function enhanceRoom(root){
  const head=[...root.querySelectorAll('.workspace-head')].find(node=>text(node.querySelector('.eyebrow')).includes('CRÉATEUR DE SALLE'));
  if(!head||head.dataset.roomUx==='1') return false;
  const sections=[...root.querySelectorAll('.editor-section')].filter(section=>section.compareDocumentPosition(head)&Node.DOCUMENT_POSITION_FOLLOWING);
  const settings=sections.find(section=>section.querySelector('#roomLayoutSelect'));
  const obstacles=sections.find(section=>sectionTitle(section).includes('Réglages des obstacles'));
  const tools=sections.find(section=>sectionTitle(section)==='Outils');
  const grid=sections.find(section=>section.classList.contains('room-grid-wrap'));
  const interactions=sections.find(section=>sectionTitle(section)==='Interactions');
  if(!settings||!obstacles||!tools||!grid||!interactions) return false;
  head.dataset.roomUx='1';
  head.classList.add('room-builder-head');
  const shell=document.createElement('div');
  shell.className='room-builder-shell';
  shell.innerHTML='<section class="room-builder-stage"><div class="room-builder-toolhost" data-room-toolhost></div><div class="room-builder-gridhost" data-room-gridhost></div></section><details class="room-builder-settings" data-room-settings><summary>⚙️ Réglages de la salle</summary><div data-room-settings-body></div></details><section class="room-builder-interactions" data-room-interactions></section>';
  head.after(shell);
  shell.querySelector('[data-room-toolhost]').append(tools);
  shell.querySelector('[data-room-gridhost]').append(grid);
  shell.querySelector('[data-room-settings-body]').append(settings,obstacles);
  shell.querySelector('[data-room-interactions]').append(interactions);
  const toolbar=tools.querySelector('.room-tools');
  if(toolbar){toolbar.classList.add('room-tools-gamebar');toolbar.setAttribute('aria-label','Outils de peinture de la salle');}
  grid.classList.add('room-grid-primary');
  interactions.classList.add('room-interactions-secondary');
  const meta=document.createElement('div');
  meta.className='room-builder-summary';
  const cellCount=grid.querySelectorAll('[data-cell-x]').length;
  const interactionCount=interactions.querySelectorAll('[data-interaction-id]').length;
  meta.innerHTML=`<span><strong>${cellCount}</strong> cases</span><span><strong>${interactionCount}</strong> interaction${interactionCount>1?'s':''}</span>`;
  head.append(meta);
  return true;
}

export function polishRpgWorldBuilder(root=document){
  if(!root?.querySelectorAll) return 0;
  let count=0;
  if(enhanceWorld(root)) count++;
  if(enhanceRoom(root)) count++;
  return count;
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;polishRpgWorldBuilder(document);});}
if(typeof document!=='undefined'){
  polishRpgWorldBuilder(document);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
}
