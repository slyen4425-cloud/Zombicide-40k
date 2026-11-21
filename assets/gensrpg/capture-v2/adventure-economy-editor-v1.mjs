// Capture V2 merchant authoring: presentation only.
// The existing AdventureRules economy remains authoritative; no second inventory,
// wallet, merchant runtime, NPC model or persistence is created here.
import {DEFAULT_ADVENTURE_ECONOMY_V1} from './adventure-economy-v1.mjs';

export function installAdventureEconomyEditorV1({
 document,getRules,commitEconomy,notify,resolveIconUrl
}){
 const $=id=>document.getElementById(id);
 const current=()=>getRules().economy??DEFAULT_ADVENTURE_ECONOMY_V1;
 const items=()=>getRules().loot.items;
 let editedId=null,selected=new Set();
 const warn=fn=>()=>{try{fn();}catch(error){notify(error.message,true);}};
 const percentage=id=>{
  const value=Number($(id).value);
  if(!Number.isSafeInteger(value)||value< -100||value>200)
   throw new RangeError('Pourcentage invalide : -100 à +200 %');
  return value;
 };
 function showPrices(){
  const sell=percentage('adventure-merchant-sell-pct');
  const buy=percentage('adventure-merchant-buy-pct');
  $('adventure-merchant-sell-pct-value').textContent=(sell>=0?'+':'')+sell+' %';
  $('adventure-merchant-buy-pct-value').textContent=(buy>=0?'+':'')+buy+' %';
  $('adventure-merchant-price-preview').textContent=
   'Objet de 100 pièces : vendu '+Math.round(100*(100+sell)/100)+
   ' · racheté '+Math.round(100*(100+buy)/100)+' pièces';
 }
 function renderGallery(){
  const host=$('adventure-merchant-catalogue');
  const search=$('adventure-merchant-item-search').value.trim().toLocaleLowerCase('fr');
  host.replaceChildren();
  const catalog=items().filter(item=>!search||item.name.toLocaleLowerCase('fr').includes(search));
  for(const item of catalog){
   const row=document.createElement('label');
   row.className='merchant-item-choice';
   const box=document.createElement('input');
   box.type='checkbox';box.checked=selected.has(item.id);
   box.addEventListener('change',()=>{
    if(box.checked)selected.add(item.id);else selected.delete(item.id);
    showCount();
   });
   const icon=resolveIconUrl?.(item.iconKey);
   if(icon){
    const img=document.createElement('img');img.src=icon;img.loading='lazy';
    img.alt='';row.append(img);
   }
   const label=document.createElement('span');label.textContent=item.name;
   const price=document.createElement('small');price.textContent=item.saleValue+
    ' '+(current().currency?.plural??'pièces')+' (base)';
   row.append(box,label,price);
   host.append(row);
  }
  if(!catalog.length)host.textContent=search?'Aucun objet correspondant.':
   'Bibliothèque vide : crée d’abord des objets.';
  showCount();
 }
 function showCount(){
  $('adventure-merchant-selection-count').textContent=selected.size+
   ' objet(s) choisi(s) dans la bibliothèque.';
 }
 function clearMerchant(){
  editedId=null;selected=new Set();
  $('adventure-merchant-name').value='';
  $('adventure-merchant-sell-pct').value='10';
  $('adventure-merchant-buy-pct').value='-50';
  $('adventure-merchant-add').textContent='Créer le marchand';
  $('adventure-merchant-cancel').hidden=true;
  $('adventure-merchant-legacy-note').hidden=true;
  showPrices();renderGallery();
 }
 function editMerchant(merchant){
  editedId=merchant.id;
  $('adventure-merchant-name').value=merchant.name;
  const old=!Array.isArray(merchant.itemIds);
  selected=new Set(old?merchant.offers.map(x=>x.itemId).filter(id=>
   items().some(item=>item.id===id)):merchant.itemIds);
  $('adventure-merchant-sell-pct').value=old?'10':String(merchant.sellPricePercent);
  $('adventure-merchant-buy-pct').value=old?'-50':String(merchant.buyPricePercent);
  $('adventure-merchant-add').textContent='Enregistrer le marchand';
  $('adventure-merchant-cancel').hidden=false;
  $('adventure-merchant-legacy-note').hidden=!old;
  showPrices();renderGallery();
 }
 function read(){
  const singular=$('adventure-money-singular').value.trim();
  const plural=$('adventure-money-plural').value.trim();
  const currency={singular,plural};
  if(!getRules().economy&&current().merchants.length===0&&
   singular===DEFAULT_ADVENTURE_ECONOMY_V1.currency.singular&&
   plural===DEFAULT_ADVENTURE_ECONOMY_V1.currency.plural)return undefined;
  return {...current(),currency};
 }
 function sync(config){
  const currency=config.economy?.currency??DEFAULT_ADVENTURE_ECONOMY_V1.currency;
  $('adventure-money-singular').value=currency.singular;
  $('adventure-money-plural').value=currency.plural;
  clearMerchant();render();
 }
 function render(){
  const host=$('adventure-merchants');host.replaceChildren();
  for(const merchant of current().merchants){
   const simple=Array.isArray(merchant.itemIds);
   const count=simple?merchant.itemIds.length:merchant.offers.length;
   const row=document.createElement('div');row.className='rule-row';
   const title=document.createElement('span');
   title.textContent=merchant.name+' · '+count+' objet(s)'+(simple?
    ' · vente '+(merchant.sellPricePercent>=0?'+':'')+merchant.sellPricePercent+
    '% / rachat '+(merchant.buyPricePercent>=0?'+':'')+merchant.buyPricePercent+'%':
    ' · ancienne configuration conservée');
   const edit=document.createElement('button');edit.type='button';edit.textContent='Modifier';
   edit.addEventListener('click',()=>editMerchant(merchant));
   const remove=document.createElement('button');remove.type='button';remove.textContent='Supprimer';
   remove.addEventListener('click',warn(()=>{
    if(!document.defaultView.confirm('Supprimer '+merchant.name+' ?'))return;
    commitEconomy({...current(),merchants:current().merchants.filter(x=>x.id!==merchant.id)});
    if(editedId===merchant.id)clearMerchant();
    render();notify('Marchand retiré du brouillon. Enregistre les paramètres.');
   }));
   row.append(title,edit,remove);host.append(row);
  }
  if(!current().merchants.length)host.textContent='Aucun marchand configuré.';
  renderGallery();
 }
 const isItemUsed=id=>current().merchants.some(m=>Array.isArray(m.itemIds)
  ?m.itemIds.includes(id):m.offers.some(o=>
   o.itemId===id||o.resourceCosts.some(r=>r.itemId===id)));
 $('adventure-merchant-item-search').addEventListener('input',renderGallery);
 for(const id of ['adventure-merchant-sell-pct','adventure-merchant-buy-pct'])
  $(id).addEventListener('input',showPrices);
 $('adventure-merchant-cancel').addEventListener('click',clearMerchant);
 $('adventure-merchant-add').addEventListener('click',warn(()=>{
  const name=$('adventure-merchant-name').value.trim();
  if(!name||name.length>80)throw new RangeError('Nom du marchand : 1 à 80 caractères');
  const old=current().merchants.find(m=>m.id===editedId);
  if(old&&!Array.isArray(old.itemIds)&&!document.defaultView.confirm(
   'Convertir cette ancienne boutique en marchand simplifié ? Ses anciens '+
   'prix individuels, stocks et paiements par ressources seront remplacés.'))return;
  const next={id:editedId??'merchant-'+document.defaultView.crypto.randomUUID(),
   name,buysItems:true,itemIds:[...selected],
   sellPricePercent:percentage('adventure-merchant-sell-pct'),
   buyPricePercent:percentage('adventure-merchant-buy-pct')};
  const merchants=editedId?current().merchants.map(m=>m.id===editedId?next:m):
   [...current().merchants,next];
  commitEconomy({...current(),merchants});
  editedId=next.id;render();
  notify('Marchand configuré : objets et pourcentages enregistrés dans le brouillon.');
 }));
 $('adventure-money-plural').addEventListener('input',renderGallery);
 showPrices();
 return {read,sync,render,isItemUsed};
}
