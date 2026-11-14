// Monster Capture presentation only. Read-only from the canonical sheet projection.
// All numbers and art URLs arrive from their authoritative owners.
const elementLabel={fire:'Feu',water:'Eau',earth:'Terre',air:'Air',electric:'Électricité',
 light:'Lumière',shadow:'Ombre',nature:'Nature',ice:'Glace',poison:'Poison',
 steel:'Acier',spirit:'Esprit',physical:'Physique'};
function node(tag,klass,text){
 const e=document.createElement(tag);
 if(klass)e.className=klass;
 if(text!==undefined)e.textContent=String(text);
 return e;
}
function detail(label,value){
 const term=node('div','sheet-vital');
 term.append(node('span','sheet-vital-label',label),node('strong','',value));
 return term;
}
function hint(text){
 return node('p','sheet-hint',text);
}
function portraitFrame({url,alt,caption}){
 const frame=node('figure','sheet-portrait-frame');
 const placeholder=node('span','sheet-portrait-placeholder','◈');
 placeholder.setAttribute('aria-hidden','true');
 frame.append(placeholder);
 if(url){
  const img=document.createElement('img');
  img.alt=alt;
  img.loading='eager';img.decoding='async';
  img.setAttribute('data-capture-official-portrait','');
  img.addEventListener('load',()=>{placeholder.hidden=true});
  img.addEventListener('error',()=>{
   img.remove();placeholder.hidden=false;
   frame.append(node('figcaption','sheet-art-status','Illustration indisponible'));
  },{once:true});
  img.src=url;frame.append(img);
 }else{
  frame.append(node('figcaption','sheet-art-status',caption??'Aucun portrait sélectionné'));
 }
 return frame;
}
function profile({kind,name,subtitle,imageUrl,artCaption,vitals=[],elements=[]}){
 const card=node('article','sheet-profile');
 card.dataset.sheetProfile=kind;
 const top=node('div','sheet-profile-top');
 top.append(portraitFrame({url:imageUrl,alt:'Portrait de '+name,caption:artCaption}));
 const info=node('div','sheet-profile-info');
 info.append(node('span','sheet-overline',kind==='hero'?'PERSONNAGE':'CRÉATURE DE L’ÉQUIPE'));
 info.append(node('h3','sheet-display-name',name));
 if(subtitle)info.append(node('p','sheet-profile-subtitle',subtitle));
 if(elements.length){
  const chips=node('div','sheet-elements');
  for(const element of elements)
   chips.append(node('span','sheet-element',elementLabel[element]??element));
  info.append(chips);
 }
 const bars=node('div','sheet-vitals');
 for(const [key,value] of vitals)bars.append(detail(key,value));
 info.append(bars);top.append(info);card.append(top);
 return card;
}
function statGrid(stats,{availablePoints=null,onAllocate=null}={}){
 const area=node('section','sheet-stats-panel');
 const title=node('div','sheet-section-title');
 title.append(node('h4','', 'Caractéristiques'));
 if(availablePoints!==null)title.append(node('span','sheet-points',
  'Points à répartir : '+availablePoints));
 area.append(title);
 const grid=node('div','sheet-stat-grid');
 for(const stat of stats){
  const cell=node('div','sheet-stat-card');
  cell.append(node('span','sheet-stat-name',stat.label));
  cell.append(node('strong','sheet-stat-value',
   stat.baseValue===null?'—':stat.baseValue));
  cell.append(node('span','sheet-stat-bonus',
   stat.gameHp?'Points Santé investis : +'+stat.allocated+' (déjà inclus)':
    'Points attribués : +'+stat.allocated));
  if(stat.gameHp)cell.append(node('small','sheet-stat-source',
   'PV originaux au Labo : '+stat.authoredBaseHp));
  if(onAllocate){
   const buttons=node('div','sheet-stat-actions');
   for(const count of [1,5]){
    const button=node('button','', '+'+count);
    button.type='button';
    button.disabled=availablePoints<count;
    button.setAttribute('aria-label','Attribuer '+count+' point(s) : '+stat.label);
    button.addEventListener('click',()=>onAllocate(stat.id,count));
    buttons.append(button);
   }
   cell.append(buttons);
  }
  grid.append(cell);
 }
 area.append(grid);
 return area;
}
export function renderAdventureSheetViewV1({
 host,snapshot,tab,portraitUrl=null,heroVisual=null,collection=null,
 resolveSpeciesPortrait=null,onOpenOwnedCreature=null,onAllocate=null,
 onSelectCreature=null,onMoveCreature=null,onMakeActive=null,
 onSummonFragment=null,onUseFragmentXp=null,resolveFragmentIcon=null,resolveItemIcon=null
}={}){
 if(!host||!snapshot)throw new TypeError('A valid active Capture sheet and host are required');
 const content=[];
 if(tab==='hero'){
  const selected=Boolean(snapshot.hero.definitionId);
  const name=heroVisual?.name??(selected?'Héros sélectionné':'Aucun héros sélectionné');
  content.push(profile({kind:'hero',name,
   subtitle:selected?'Portrait de la bibliothèque officielle Exploration':
    'Choisis un héros dans l’éditeur officiel Exploration',
   imageUrl:heroVisual?.url??null,
   artCaption:selected?'Visuel du héros indisponible':'Héros non sélectionné',
   vitals:[['Progression',snapshot.hero.progressionEnabled?'Activée':'Non activée'],
    ...(snapshot.hero.progressionEnabled?
     [['Niveau',snapshot.hero.level],['XP',snapshot.hero.xp],
      ['Points de talent',snapshot.hero.talentPoints]]:[])]
  }));
  if(!selected)content.push(hint('Le héros n’a pas encore été choisi pour cette partie. Aucun portrait fictif n’est affiché.'));
 }else if(tab==='team'||tab==='stats'){
  const selector=node('section','sheet-roster');
  selector.append(node('h4','','Équipe · ordre de départ au combat'));
  for(const [index,member] of snapshot.team.entries()){
   const row=node('div','sheet-roster-row');
   const choose=node('button','sheet-roster-pick',
    (index+1)+'. '+member.name+(member.isActive?' · 1er combattant':'')+
     (member.hp===0?' · KO':''));
   choose.type='button';choose.setAttribute('aria-pressed',String(member.isSelected));
   choose.addEventListener('click',()=>onSelectCreature?.(member.instanceId));
   row.append(choose);
   if(tab==='team'&&onMoveCreature){
    for(const direction of ['up','down']){
     const button=node('button','sheet-roster-move',direction==='up'?'↑':'↓');
     button.type='button';button.disabled=(direction==='up'&&index===0)||
      (direction==='down'&&index===snapshot.team.length-1)||
      (direction==='up'&&index===1&&member.hp===0)||
      (direction==='down'&&index===0&&snapshot.team[1]?.hp===0);
     button.setAttribute('aria-label',(direction==='up'?'Monter ':'Descendre ')+member.name);
     button.addEventListener('click',()=>onMoveCreature(member.instanceId,direction));
     row.append(button);
    }
   }
   if(tab==='team'&&!member.isActive&&member.hp!==0&&onMakeActive){
    const active=node('button','sheet-roster-active','Commencer avec');
    active.type='button';active.addEventListener('click',()=>onMakeActive(member.instanceId));
    row.append(active);
   }
   selector.append(row);
  }
  content.push(selector);
  const c=snapshot.creature;
  const card=profile({kind:'creature',name:c.name,
   subtitle:c.isActive?'Premier combattant':'Créature de réserve',imageUrl:portraitUrl,
   artCaption:'Aucun portrait officiel disponible',
   elements:c.elements,
   vitals:[['Niveau',c.level],
    ...(Number.isFinite(c.maxHp)?[
     ['PV en jeu',c.hp+' / '+c.maxHp],
     ['PV maximum au Labo',c.labMaxHp],
     ['Règle de PV',c.hpPercent+' %']
    ]:[['PV actuels',c.hp===null?'Non renseignés':c.hp]]),
    ['XP',c.xp]]
  });
  card.append(statGrid(c.stats,{
   availablePoints:c.availablePoints,
   onAllocate:tab==='stats'?onAllocate:null
  }));
  content.push(card);
  if(tab==='team'){
   content.push(hint('Sélectionne une créature, consulte sa fiche et modifie son ordre. '+
    'La première créature non KO commencera le prochain combat. Les points sont individuels.'));
  }
 }else if(tab==='inventory'){
  const section=node('section','sheet-inventory');
  const heading=node('div','sheet-inventory-heading');
  heading.append(node('h3','','Mon sac'),node('span','sheet-currency',
   '◈ '+snapshot.inventory.currency+' '+(snapshot.inventory.currencyLabel??'pièces')));
  section.append(heading);
  if(!snapshot.inventory.items.length){
   section.append(hint('Ton inventaire est vide pour le moment.'));
  }else{
   const grid=node('div','sheet-items');
   for(const item of snapshot.inventory.items){
    const row=node('div','sheet-item');
    row.append(node('span','sheet-item-name',item.name),
     node('strong','sheet-item-quantity','× '+item.quantity));
    if(item.saleValue!==null)row.append(node('small','sheet-item-value',
     item.saleValue+' '+(snapshot.inventory.currencyLabel??'pièces')+' / unité'));
    if(!item.fragment&&item.iconKey){
     const imageUrl=resolveItemIcon?.(item.iconKey);
     if(imageUrl){
      const image=node('img','sheet-item-icon');
      image.alt='Icône de '+item.name;image.src=imageUrl;image.loading='lazy';
      row.prepend(image);
     }
    }
    if(item.fragment){
     const fragment=item.fragment;
     const imageUrl=resolveFragmentIcon?.(fragment.speciesId);
     if(imageUrl){
      const image=node('img','sheet-item-icon');
      image.alt='Icône officielle de '+item.name;image.src=imageUrl;
      image.loading='lazy';row.prepend(image);
     }
     row.append(node('small','sheet-item-progress',
      fragment.message+' · Invocation niv. '+fragment.summonLevel));
     if(onSummonFragment){
      const summon=node('button','sheet-fragment-summon','Invoquer');
      summon.type='button';summon.disabled=!fragment.canSummon;
      summon.setAttribute('aria-label','Invoquer '+item.name);
      summon.addEventListener('click',()=>onSummonFragment(fragment.speciesId));
      row.append(summon);
     }
     if(onUseFragmentXp&&fragment.targets.length){
      const controls=node('div','sheet-fragment-xp');
      const targetLabel=node('label','', 'Donner de l’XP à');
      const selector=node('select','sheet-fragment-target');
      selector.setAttribute('aria-label','Créature recevant les éclats '+item.name);
      for(const target of fragment.targets){
       const entry=node('option','',target.label);
       entry.value=target.instanceId;selector.append(entry);
      }
      targetLabel.append(selector);
      const quantityLabel=node('label','', 'Éclats à utiliser');
      const amount=node('input','sheet-fragment-quantity');
      amount.type='number';amount.min='1';amount.max=String(item.quantity);
      amount.step='1';amount.value='1';
      quantityLabel.append(amount);
      const convert=node('button','sheet-fragment-convert','Convertir en XP');
      convert.type='button';convert.disabled=!fragment.canConvert;
      convert.addEventListener('click',()=>onUseFragmentXp(
       fragment.speciesId,selector.value,Number(amount.value)));
      controls.append(targetLabel,quantityLabel,convert);
      controls.append(node('small','',fragment.xpPerFragment+' XP par éclat'));
      row.append(controls);
     }
    }
    grid.append(row);
   }
   section.append(grid);
  }
  content.push(section);
  if(snapshot.storage?.count){
   const reserve=node('section','sheet-storage');
   reserve.append(node('h3','','Stockage hors combat · '+snapshot.storage.count+' créature(s)'));
   for(const member of snapshot.storage.members)
    reserve.append(node('p','sheet-storage-member',
     member.name+' · niveau '+member.level+(member.hp===0?' · KO':'')));
   reserve.append(hint('Ces créatures ne sont pas remplaçantes en combat. Leur transfert vers l’équipe sera configuré séparément.'));
   content.push(reserve);
  }
 }else if(tab==='collection'){
  if(!collection||!Array.isArray(collection.entries))
   throw new TypeError('La Collection exige le Bestiaire et la partie officiels');
  const section=node('section','sheet-collection');
  section.append(node('h3','',`Collection · ${collection.ownedCount} / ${collection.totalCount}`),
   hint('Créatures possédées dans ton équipe ou ton stockage. Les fiches inconnues restent verrouillées.'));
  const grid=node('div','sheet-collection-grid');
  const detailHost=node('section','sheet-collection-detail');
  detailHost.append(hint('Touche une créature possédée pour consulter sa fiche.'));
  for(const entry of collection.entries){
   const tile=node('button','sheet-collection-card');
   tile.type='button';tile.disabled=!entry.owned;
   tile.dataset.collectionOwned=String(entry.owned);
   // Rarity belongs to the official Combat Bestiary card, even when locked.
   tile.dataset.rarity=entry.rarity??'rare';
   tile.setAttribute('aria-label',entry.owned
    ?entry.name+' · '+entry.members.map(m=>'niveau '+m.level).join(', ')
    :'Créature non possédée : fiche verrouillée');
   const art=node('span','sheet-collection-art');
   const url=resolveSpeciesPortrait?.(entry.card)??null;
   if(url){
    const image=node('img');image.src=url;image.alt='';
    image.loading='lazy';image.decoding='async';art.append(image);
   }else art.append(node('span','','◈'));
   tile.append(art,
    node('strong','',entry.owned?entry.name:'???'),
    node('small','sheet-rarity-label',entry.rarity==='legendary'?'Légendaire':entry.rarity==='mythic'?'Mythique':'Rare'),
    node('small','',entry.owned?entry.members.map(m=>'Niv. '+m.level).join(' · '):'Non possédée'));
   tile.addEventListener('click',()=>{
    if(!entry.owned)return;
    const detail=profile({kind:'creature',name:entry.name,
     subtitle:entry.rarity==='legendary'?'Légendaire':entry.rarity==='mythic'?'Mythique':'Rare',
     imageUrl:url,artCaption:'Aucune illustration publiée',
     elements:Array.isArray(entry.card.elements)?entry.card.elements:[],
     vitals:[['Exemplaires possédés',entry.members.length],
      ['Niveaux',entry.members.map(m=>m.level).join(', ')]]});
    if(typeof entry.card.description==='string'&&entry.card.description.trim())
     detail.append(node('p','sheet-hint',entry.card.description));
    const skills=Array.isArray(entry.card.skills)
     ?entry.card.skills.filter(skill=>skill.state==='ready'):[];
    if(skills.length){
     const box=node('section','sheet-collection-skills');
     box.append(node('h4','','Capacités du Bestiaire officiel'));
     for(const skill of skills)box.append(node('p','',skill.name??'Capacité'));
     detail.append(box);
    }
    const instances=node('div','sheet-collection-members');
    for(const member of entry.members){
     const line=node('div','sheet-collection-member');
     line.append(node('span','',`Niveau ${member.level} · ${member.place}`));
     if(member.place==='équipe'&&onOpenOwnedCreature){
      const open=node('button','','Voir ses statistiques');
      open.type='button';open.addEventListener('click',()=>onOpenOwnedCreature(member.instanceId));
      line.append(open);
     }
     instances.append(line);
    }
    detail.append(instances);
    detailHost.replaceChildren(detail);
   });
   grid.append(tile);
  }
  section.append(grid,detailHost);
  content.push(section);
 }else throw new RangeError('Rubrique de fiche inconnue');
 host.replaceChildren(...content);
}
