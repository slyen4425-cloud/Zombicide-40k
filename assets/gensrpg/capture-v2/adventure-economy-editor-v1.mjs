// Monster InvoC merchant editor: simple selection from the ONE Adventure loot catalog.
// The existing AdventureRules economy remains the only data owner. Historical
// offers/stocks/resource payments are preserved until the author explicitly converts.
import {DEFAULT_ADVENTURE_ECONOMY_V1,adventureMerchantPriceV1}
 from './adventure-economy-v1.mjs';

export function installAdventureEconomyEditorV1({
 document,getRules,commitEconomy,notify,getItemIconUrl,getPublishedSpecies,onMerchantCommitted
}){
 const $=id=>document.getElementById(id);
 const option=(value,label)=>{const node=document.createElement('option');
  node.value=value;node.textContent=label;return node;};
 const warn=fn=>()=>{try{fn();}catch(error){notify(error.message,true);}};
 const current=()=>getRules().economy??DEFAULT_ADVENTURE_ECONOMY_V1;
 const items=()=>getRules().loot.items;
 const byMerchant=id=>current().merchants.find(m=>m.id===id);
 let editedId=null,selected=new Set(),fragmentPricesDraft={};
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
  editedId=null;selected=new Set();fragmentPricesDraft={};
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
 // Fragments are official Bestiary projections, NOT duplicate loot.items.
 const catalog=()=>[
  ...items().map(item=>({...item,kind:item.kind??'resource'})),
  ...(getPublishedSpecies?.()??[]).map(card=>({
   id:'fragment:'+card.id,name:'Éclat de '+card.name,kind:'fragment'
  }))
 ];
 const category=()=>$('adventure-merchant-category').value;
 function renderLibrary(){
  const host=$('adventure-merchant-library');
  const needle=$('adventure-merchant-search').value.trim().toLocaleLowerCase('fr');
  const all=catalog(),visible=all.filter(x=>x.kind===category()&&
   x.name.toLocaleLowerCase('fr').includes(needle));
  host.replaceChildren();
  for(const item of visible.slice(0,120)){
   const label=document.createElement('label');
   label.className='adventure-merchant-item-card';
   const checkbox=document.createElement('input');
   checkbox.type='checkbox';checkbox.checked=selected.has(item.id);
   checkbox.setAttribute('aria-label','Proposer '+item.name);
   checkbox.addEventListener('change',()=>{
    if(checkbox.checked){
     selected.add(item.id);
     if(item.kind==='fragment'&&!Object.hasOwn(fragmentPricesDraft,item.id))
      fragmentPricesDraft[item.id]=100;
    }else selected.delete(item.id);
    renderLibrary();
   });
   label.append(checkbox);
   const imageUrl=item.kind==='fragment'?null:getItemIconUrl?.(item.iconKey);
   if(imageUrl){
    const image=document.createElement('img');image.src=imageUrl;
    image.alt='';image.loading='lazy';label.append(image);
   }
   const info=document.createElement('span');
   info.textContent=item.name+(item.kind==='fragment'
    ?' · fragment officiel': ' · '+item.saleValue+' '+($('adventure-money-plural').value||'pièces'));
   label.append(info);
   if(item.kind==='fragment'&&selected.has(item.id)){
    const price=document.createElement('input');
    price.type='number';price.min='1';price.max='100000000';price.step='1';
    price.value=String(fragmentPricesDraft[item.id]??100);
    price.setAttribute('aria-label','Prix de base du '+item.name);
    price.title='Prix de base du fragment (avant le pourcentage du marchand)';
    price.addEventListener('change',()=>{
     fragmentPricesDraft[item.id]=Number(price.value);
    });
    label.append(price);
   }
   host.append(label);
  }
  if(!visible.length)host.textContent=all.some(x=>x.kind===category())
   ?'Aucun article ne correspond à la recherche.'
   :'Catégorie vide : ajoute des objets dans la Bibliothèque ou publie des créatures.';
  if(visible.length>120){
   const note=document.createElement('p');
   note.textContent='120 premiers résultats sur '+visible.length+' : affine la recherche.';
   host.append(note);
  }
  renderLibraryCount();
 }
 function renderLibraryCount(){
  const available=new Set(catalog().map(x=>x.id));
  $('adventure-merchant-selected-count').textContent=
   [...selected].filter(id=>available.has(id)).length+
   ' article(s) proposés parmi '+available.size+' disponibles';
 }
 function editMerchant(merchant){
  if(!isSimple(merchant)&&!document.defaultView.confirm(
   'Cette boutique utilise les anciens prix, stocks ou échanges. La convertir '+ 
   'remplacera ces paramètres par les deux pourcentages et une liste d’objets. '+
   'Les anciennes parties ne seront pas modifiées. Continuer ?'))return;
  editedId=merchant.id;
  fragmentPricesDraft=isSimple(merchant)?{...(merchant.fragmentPrices??{})}:
   Object.fromEntries(merchant.offers.filter(offer=>offer.itemId.startsWith('fragment:'))
    .map(offer=>[offer.itemId,offer.currencyPrice]));
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
  const available=new Set(catalog().map(x=>x.id));
  const itemIds=[...selected].filter(id=>available.has(id));
  const fragments=itemIds.filter(id=>id.startsWith('fragment:'));
  const merchant={id:editedId??'merchant-'+document.defaultView.crypto.randomUUID(),
   name,itemIds,
   sellPercent:Number($('adventure-merchant-sell-percent').value),
   buyPercent:Number($('adventure-merchant-buy-percent').value),
   ...(fragments.length?{fragmentPrices:Object.fromEntries(fragments.map(id=>[
    id,fragmentPricesDraft[id]??100]))}:{})};
  const merchants=editedId
   ?current().merchants.map(m=>m.id===editedId?merchant:m)
   :[...current().merchants,merchant];
  commitEconomy({...current(),merchants});clearMerchant();render();
  if(onMerchantCommitted)onMerchantCommitted(merchant.id);
  else notify('Marchand configuré. Enregistre les paramètres pour conserver ses règles.');
 }));
 $('adventure-merchant-cancel').addEventListener('click',clearMerchant);
 $('adventure-merchant-search').addEventListener('input',renderLibrary);
 $('adventure-merchant-category').addEventListener('change',renderLibrary);
 for(const key of ['sell','buy']){
  $('adventure-merchant-'+key+'-percent').addEventListener('input',renderPercents);
 }
 $('adventure-money-plural').addEventListener('input',()=>{renderPercents();renderLibrary();});
 $('adventure-merchant-all').addEventListener('click',()=>{
  for(const item of catalog().filter(item=>item.kind===category()))
   selected.add(item.id);
  for(const id of selected)if(id.startsWith('fragment:')&&
    !Object.hasOwn(fragmentPricesDraft,id))fragmentPricesDraft[id]=100;
  renderLibrary();
 });
 $('adventure-merchant-none').addEventListener('click',()=>{
  for(const item of catalog().filter(item=>item.kind===category()))
   selected.delete(item.id);
  renderLibrary();
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
