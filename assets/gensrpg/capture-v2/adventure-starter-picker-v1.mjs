// Capture V2: player-facing Bestiary picker for starter species.
// Read-only official Bestiary cards; existing AdventureSession selectors stay canonical.
export function createAdventureStarterPickerV1({document,cards,playable,portraitUrl,onSelection}={}){
 if(!document||typeof cards!=='function'||typeof playable!=='function'||
    typeof portraitUrl!=='function'||typeof onSelection!=='function')
  throw new TypeError('Capture starter picker requires its official UI bindings');
 const $=id=>document.getElementById(id);
 const dialog=$('adventure-starter-picker');
 const list=$('adventure-starter-gallery');
 const search=$('adventure-starter-search');
 let slot=0;
 const selectors=()=>[$('adventure-starter'),
  ...$('adventure-starter-reserve').querySelectorAll('[data-starter-slot]')];
 const element=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!=null)node.textContent=text;
  return node;
 };
 const portrait=card=>{
  const media=element('span','adventure-starter-portrait');
  const url=card?portraitUrl(card):null;
  if(!url){media.textContent='✦';return media;}
  const image=element('img');
  image.src=url;image.alt='';image.loading='lazy';image.decoding='async';
  image.addEventListener('error',()=>{media.textContent='✦';},{once:true});
  media.append(image);
  return media;
 };
 function renderSlots(){
  const host=$('adventure-starter-cards');
  host.replaceChildren();
  selectors().forEach((select,index)=>{
   const card=cards().find(item=>item.id===select.value);
   const button=element('button','adventure-starter-card');
   button.type='button';
   button.setAttribute('aria-label','Choisir la créature '+(index+1)+
    (card?' : '+card.name:''));
   const copy=element('span','adventure-starter-card-info');
   copy.append(element('strong',null,index===0?'Créature active':'Réserve '+index),
    element('span',null,card?.name??'Choisir une créature'));
   button.append(portrait(card),copy,element('span','adventure-starter-card-edit','Changer'));
   button.addEventListener('click',()=>open(index));
   host.append(button);
  });
 }
 function renderGallery(){
  const query=search.value.trim().toLocaleLowerCase('fr');
  const options=cards().filter(card=>card.name.toLocaleLowerCase('fr').includes(query));
  const selected=selectors()[slot];
  list.replaceChildren();
  if(!options.length){
   list.append(element('p','hint','Aucune créature correspondante dans le Bestiaire officiel.'));
   return;
  }
  for(const card of options){
   const ready=playable(card);
   const button=element('button','adventure-gallery-card');
   button.type='button';button.disabled=!ready;
   button.setAttribute('role','listitem');
   if(selected?.value===card.id)button.dataset.selected='true';
   const copy=element('span','adventure-gallery-caption');
   copy.append(element('strong',null,card.name),
    element('small',null,ready?'Choisir cette créature':
     (card.rarity&&card.rarity!=='rare'&&card.skills?.some(s=>s.state==='ready')
      ?'Rang réservé aux options avancées':'Capacités non prêtes')));
   button.append(portrait(card),copy);
   button.addEventListener('click',()=>{
    const field=selectors()[slot];
    if(!field||field.disabled)return;
    field.value=card.id;
    field.dispatchEvent(new Event('change',{bubbles:true}));
    renderSlots();
    dialog.close();
    onSelection();
   });
   list.append(button);
  }
 }
 function open(index){
  if(!cards().some(playable))return;
  slot=index;
  $('adventure-starter-picker-title').textContent=index===0
   ?'Choisir la créature active':'Choisir la créature de réserve '+index;
  search.value='';
  renderGallery();
  dialog.showModal();
  search.focus();
 }
 function install(){
  $('adventure-starter-picker-close').addEventListener('click',()=>dialog.close());
  search.addEventListener('input',renderGallery);
  $('adventure-starter').addEventListener('change',renderSlots);
 }
 return Object.freeze({renderSlots,install});
}
