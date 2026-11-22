// Monster InvoC merchant editor: simple selection from the ONE Adventure loot catalog.
// The existing AdventureRules economy remains the only data owner. Historical
// offers/stocks/resource payments are preserved until the author explicitly converts.
import {DEFAULT_ADVENTURE_ECONOMY_V1,adventureMerchantPriceV1}
 from './adventure-economy-v1.mjs';

export function installAdventureEconomyEditorV1({
 document,getRules,commitEconomy,notify,getItemIconUrl
}){
 const $=id=>document.getElementById(id);
 const option=(value,label)=>{const node=document.createElement('option');
  node.value=value;node.textContent=label;return node;};
 const warn=fn=>()=>{try{fn();}catch(error){notify(error.message,true);}};
 const current=()=>getRules().economy??DEFAULT_ADVENTURE_ECONOMY_V1;
 const items=()=>getRules().loot.items;
 const byMerchant=id=>current().merchants.find(m=>m.id===id);
 let editedId=null,selected=new Set();
 const isSimple=m=>Array.isArray(m.itemIds);
 const pct=n=>(n>0?'+':'')+n+' %';
 function read(){
  const singular=$('adventure-money-singular').value.trim();
  const plural=$('adventure-money-plural').value.trim();
  if(!getRules().economy&&!current().merchants.length&&
   singular===DEFAULT_ADVENTURE_ECONOMY_V1.currency.singular&&
   plural===DEFAULT_ADVENTURE_ECONOMY_V1.currency.plural)return undefined;
  return {...current(),currency:{singular,plural}};
 }
 function clearMerchant(){
  editedId=null;selected=new Set();
  $('adventure-merchant-name').value='';
  $('adventure-merchant-sell-percent').value='10';
  $('adventure-merchant-buy-percent').value='-50';
  $('adventure-merchant-add').textContent='Ajouter ce marchand';
  $('adventure-merchant-cancel').hidden=true;
  renderPercents();renderLibrary();
 }
 function sync(config){
  const money=config.economy?.currency??DEFAULT_ADVENTURE_ECONOMY_V1.currency;
  $('adventure-money-singular').value=money.singular;
  $('adventure-money-plural').value=money.plural;
  clearMerchant();render();
 }
 function renderPercents(){
  const sell=Number($('adventure-merchant-sell-percent').value);
  const buy=Number($('adventure-merchant-buy-percent').value);
  $('adventure-merchant-sell-value').textContent=pct(sell);
  $('adventure-merchant-buy-value').textContent=pct(buy);
  $('adventure-merchant-price-example').textContent=
   'Objet à 100 '+($('adventure-money-plural').value||'pièces')+
   ' : vendu '+adventureMerchantPriceV1(100,sell)+
   ' · racheté '+adventureMerchantPriceV1(100,buy);
 }
 function renderLibrary(){
  const host=$('adventure-merchant-library');
  const needle=$('adventure-merchant-search').value.trim().toLocaleLowerCase('fr');
  const all=items(),visible=all.filter(x=>x.name.toLocaleLowerCase('fr').includes(needle));
  host.replaceChildren();
  // Avoid thousands of DOM controls on landscape phones; search still covers all.
  for(const item of visible.slice(0,120)){
   const label=document.createElement('label');
   label.className='adventure-merchant-item-card';
   const checkbox=document.createElement('input');
   checkbox.type='checkbox';checkbox.checked=selected.has(item.id);
   checkbox.setAttribute('aria-label','Proposer '+item.name);
   checkbox.addEventListener('change',()=>{
    if(checkbox.checked)selected.add(item.id);else selected.delete(item.id);
    renderLibraryCount();
   });
   label.append(checkbox);
   const imageUrl=getItemIconUrl?.(item.iconKey);
   if(imageUrl){
    const image=document.createElement('img');image.src=imageUrl;
    image.alt='';image.loading='lazy';label.append(image);
   }
   const info=document.createElement('span');info.textContent=item.name+
    ' · '+item.saleValue+' '+($('adventure-money-plural').value||'pièces');
   label.append(info);host.append(label);
  }
  if(!visible.length)host.textContent=all.length
   ?'Aucun objet ne correspond à la recherche.'
   :'Aucun objet dans le catalogue : crée ou importe des objets plus haut.';
  if(visible.length>120){
   const note=document.createElement('p');
   note.textContent='120 premiers résultats affichés sur '+visible.length+
    ' : utilise la recherche pour trouver les autres.';
   host.append(note);
  }
  renderLibraryCount();
 }
 function renderLibraryCount(){
  const available=new Set(items().map(x=>x.id));
  $('adventure-merchant-selected-count').textContent=
   [...selected].filter(id=>available.has(id)).length+
   ' objet(s) proposés parmi '+available.size;
 }
 function editMerchant(merchant){
  if(!isSimple(merchant)&&!document.defaultView.confirm(
   'Cette boutique utilise les anciens prix, stocks ou échanges. La convertir '+ 
   'remplacera ces paramètres par les deux pourcentages et une liste d’objets. '+
   'Les anciennes parties ne seront pas modifiées. Continuer ?'))return;
  editedId=merchant.id;
  selected=new Set(isSimple(merchant)?merchant.itemIds:merchant.offers
   .map(offer=>offer.itemId).filter(id=>items().some(item=>item.id===id)));
  $('adventure-merchant-name').value=merchant.name;
  $('adventure-merchant-sell-percent').value=String(isSimple(merchant)?merchant.sellPercent:10);
  $('adventure-merchant-buy-percent').value=String(isSimple(merchant)?merchant.buyPercent:-50);
  $('adventure-merchant-add').textContent='Enregistrer le marchand';
  $('adventure-merchant-cancel').hidden=false;
  renderPercents();renderLibrary();
 }
 function render(){
  const host=$('adventure-merchants');host.replaceChildren();
  for(const merchant of current().merchants){
   const line=document.createElement('div');line.className='rule-row';
   line.dataset.merchantId=merchant.id;
   const label=document.createElement('span');
   label.textContent=merchant.name+' · '+(isSimple(merchant)
    ?merchant.itemIds.length+' objet(s) · vend '+pct(merchant.sellPercent)+
     ' · rachète '+pct(merchant.buyPercent)
    :merchant.offers.length+' offre(s) anciennes (stock/prix conservés)');
   const edit=document.createElement('button');edit.type='button';
   edit.textContent=isSimple(merchant)?'Modifier':'Convertir';
   edit.addEventListener('click',warn(()=>editMerchant(merchant)));
   const remove=document.createElement('button');remove.type='button';
   remove.textContent='Supprimer';
   remove.addEventListener('click',warn(()=>{
    if(!document.defaultView.confirm('Supprimer le marchand '+merchant.name+' ?'))return;
    commitEconomy({...current(),merchants:current().merchants.filter(m=>m.id!==merchant.id)});
    clearMerchant();render();notify('Marchand retiré du brouillon. Enregistre les paramètres.');
   }));
   line.append(label,edit,remove);host.append(line);
  }
  if(!current().merchants.length)host.textContent='Aucun marchand configuré.';
  renderLibrary();
 }
 function isItemUsed(itemId){
  return current().merchants.some(m=>isSimple(m)
   ?m.itemIds.includes(itemId)
   :m.offers.some(offer=>offer.itemId===itemId||
     offer.resourceCosts.some(cost=>cost.itemId===itemId)));
 }
 $('adventure-merchant-add').addEventListener('click',warn(()=>{
  const name=$('adventure-merchant-name').value.trim();
  if(!name||name.length>80)throw new RangeError('Nom du marchand requis (80 caractères max).');
  const available=new Set(items().map(x=>x.id));
  const merchant={id:editedId??'merchant-'+document.defaultView.crypto.randomUUID(),
   name,itemIds:[...selected].filter(id=>available.has(id)),
   sellPercent:Number($('adventure-merchant-sell-percent').value),
   buyPercent:Number($('adventure-merchant-buy-percent').value)};
  const merchants=editedId
   ?current().merchants.map(m=>m.id===editedId?merchant:m)
   :[...current().merchants,merchant];
  commitEconomy({...current(),merchants});clearMerchant();render();
  notify('Marchand configuré. Enregistre les paramètres pour conserver ses règles.');
 }));
 $('adventure-merchant-cancel').addEventListener('click',clearMerchant);
 $('adventure-merchant-search').addEventListener('input',renderLibrary);
 for(const key of ['sell','buy']){
  $('adventure-merchant-'+key+'-percent').addEventListener('input',renderPercents);
 }
 $('adventure-money-plural').addEventListener('input',()=>{renderPercents();renderLibrary();});
 $('adventure-merchant-all').addEventListener('click',()=>{
  selected=new Set(items().map(item=>item.id));renderLibrary();
 });
 $('adventure-merchant-none').addEventListener('click',()=>{
  selected=new Set();renderLibrary();
 });
 clearMerchant();
 // The linked PNJ selects an existing canonical shop without duplicating data.
 function focusMerchant(merchantId){
  const merchant=byMerchant(merchantId);
  if(!merchant)return false;
  if(isSimple(merchant))editMerchant(merchant);
  $('adventure-merchants')?.scrollIntoView?.({block:'nearest'});
  return true;
 }
 return {read,sync,render,isItemUsed,focusMerchant};
}
