// Monster InvoC merchant editor: simple selection from the ONE Adventure loot catalog.
// The existing AdventureRules economy remains the only data owner. Historical
// offers/stocks/resource payments are preserved until the author explicitly converts.
import {DEFAULT_ADVENTURE_ECONOMY_V1,adventureMerchantPriceV1}
 from './adventure-economy-v1.mjs';

export function installAdventureEconomyEditorV1({
 document,getRules,commitEconomy,notify,getItemIconUrl,getPublishedSpecies,onMerchantCommitted,
 merchantScope=null
}){
 const $=id=>document.getElementById(id);
 const option=(value,label)=>{const node=document.createElement('option');
  node.value=value;node.textContent=label;return node;};
 const warn=fn=>()=>{try{fn();}catch(error){notify(error.message,true);}};
 const current=()=>getRules().economy??DEFAULT_ADVENTURE_ECONOMY_V1;
 const items=()=>getRules().loot.items;
 const byMerchant=id=>current().merchants.find(m=>m.id===id);
 const scopedId=merchantScope?.id??null;
 if(scopedId&&!/^[a-z0-9][a-z0-9_:.-]{0,129}$/i.test(scopedId))
  throw Error('Référence PNJ invalide.');
 let editedId=null,selected=new Set(),fragmentPricesDraft={},itemStocksDraft={};
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
  editedId=null;selected=new Set();fragmentPricesDraft={};itemStocksDraft={};
  $('adventure-merchant-name').value=merchantScope?.name??'';
  $('adventure-merchant-sell-percent').value='10';
  $('adventure-merchant-buy-percent').value='-50';
  $('adventure-merchant-add').textContent=scopedId?'Enregistrer les articles, stocks et tarifs':'Ajouter ce marchand';
  $('adventure-merchant-add').disabled=Boolean(scopedId&&byMerchant(scopedId)&&!isSimple(byMerchant(scopedId)));
  $('adventure-merchant-cancel').hidden=true;
  renderPercents();renderLibrary();
 }
 function sync(config){
  const money=config.economy?.currency??DEFAULT_ADVENTURE_ECONOMY_V1.currency;
  $('adventure-money-singular').value=money.singular;
  $('adventure-money-plural').value=money.plural;
  resetMerchantForm();render();
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
 const shownItems=all=>{
  const needle=$('adventure-merchant-search').value.trim().toLocaleLowerCase('fr');
  return all.filter(x=>x.kind===category()&&x.name.toLocaleLowerCase('fr').includes(needle));
 };
 function renderLibrary(){
  const host=$('adventure-merchant-library');
  const all=catalog(),visible=shownItems(all);
  host.replaceChildren();
  for(const item of visible.slice(0,120)){
   const card=document.createElement('div');
   card.className='adventure-merchant-item-card';
   const label=document.createElement('label');
   label.className='adventure-merchant-selection';
   card.append(label);
   const checkbox=document.createElement('input');
   checkbox.type='checkbox';checkbox.checked=selected.has(item.id);
   checkbox.setAttribute('aria-label','Proposer '+item.name);
   checkbox.addEventListener('change',()=>{
    if(checkbox.checked){
     selected.add(item.id);
     if(item.kind==='fragment'&&!Object.hasOwn(fragmentPricesDraft,item.id))
      fragmentPricesDraft[item.id]=100;
    }else selected.delete(item.id);
    // Reveal stock for every selected item, never a separate stock catalog.
    if(!checkbox.checked)delete itemStocksDraft[item.id];
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
   if(selected.has(item.id)){
    const stock=document.createElement('input');
    stock.type='number';stock.min='0';stock.max='100000000';stock.step='1';
    stock.placeholder='Illimité';
    stock.inputMode='numeric';
    stock.value=Object.hasOwn(itemStocksDraft,item.id)?String(itemStocksDraft[item.id]):'';
    stock.setAttribute('aria-label','Stock du '+item.name+' (vide : illimité)');
    stock.title='Stock initial : vide = illimité ; 0 = indisponible';
    stock.addEventListener('input',()=>{
     const raw=stock.value.trim(),count=Number(raw);
     if(stock.validity?.badInput)return;
     if(raw==='')delete itemStocksDraft[item.id];
     else if(Number.isSafeInteger(count)&&count>=0&&count<=100000000)itemStocksDraft[item.id]=count;
    });
    stock.addEventListener('change',()=>{
     const raw=stock.value.trim();
     if(raw===''&&!stock.validity?.badInput){delete itemStocksDraft[item.id];return;}
     const count=Number(raw);
     if(stock.validity?.badInput||!Number.isSafeInteger(count)||count<0||count>100000000){
      notify('Stock : entier de 0 à 100 000 000, ou vide pour illimité.',true);
      stock.value=Object.hasOwn(itemStocksDraft,item.id)?String(itemStocksDraft[item.id]):'';
      return;
     }
     itemStocksDraft[item.id]=count;
    });
    const stockLabel=document.createElement('label');
    stockLabel.className='adventure-merchant-detail';
    stockLabel.textContent='Stock initial (0 = épuisé)';
    stockLabel.append(stock);card.append(stockLabel);
   }
   if(item.kind==='fragment'&&selected.has(item.id)){
    const price=document.createElement('input');
    price.type='number';price.min='1';price.max='100000000';price.step='1';
    price.value=String(fragmentPricesDraft[item.id]??100);
    price.setAttribute('aria-label','Prix de base du '+item.name);
    price.title='Prix de base du fragment (avant le pourcentage du marchand)';
    price.addEventListener('change',()=>{
     fragmentPricesDraft[item.id]=Number(price.value);
    });
    const priceLabel=document.createElement('label');
    priceLabel.className='adventure-merchant-detail';
    priceLabel.textContent='Prix de base du fragment';
    priceLabel.append(price);card.append(priceLabel);
   }
   host.append(card);
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
  const all=catalog(),visible=shownItems(all).slice(0,120);
  const inView=visible.filter(item=>selected.has(item.id)).length;
  const total=all.filter(item=>selected.has(item.id)).length;
  $('adventure-merchant-selected-count').textContent=
   inView+' sélectionné(s) / '+visible.length+' affiché(s) dans cette catégorie'+
   (total!==inView?' · '+total+' sélectionné(s) au total':'');
 }
 function editMerchant(merchant){
  if(!isSimple(merchant)&&!document.defaultView.confirm(
   'Cette boutique utilise les anciens prix, stocks ou échanges. La convertir '+ 
   'remplacera ces paramètres par les deux pourcentages et une liste d’objets. '+
   'Les anciennes parties ne seront pas modifiées. Continuer ?'))return;
  if(scopedId&&merchant.id!==scopedId)throw Error('Ce formulaire appartient à un autre PNJ.');
  editedId=merchant.id;
  $('adventure-merchant-add').disabled=false;
  itemStocksDraft=isSimple(merchant)?{...(merchant.itemStocks??{})}:
   Object.fromEntries(merchant.offers.filter(offer=>offer.stock!==null)
    .map(offer=>[offer.itemId,offer.stock]));
  fragmentPricesDraft=isSimple(merchant)?{...(merchant.fragmentPrices??{})}:
   Object.fromEntries(merchant.offers.filter(offer=>offer.itemId.startsWith('fragment:'))
    .map(offer=>[offer.itemId,offer.currencyPrice]));
  selected=new Set(isSimple(merchant)?merchant.itemIds:merchant.offers
   .map(offer=>offer.itemId).filter(id=>items().some(item=>item.id===id)));
  $('adventure-merchant-name').value=merchant.name;
  $('adventure-merchant-sell-percent').value=String(isSimple(merchant)?merchant.sellPercent:10);
  $('adventure-merchant-buy-percent').value=String(isSimple(merchant)?merchant.buyPercent:-50);
  $('adventure-merchant-add').textContent=scopedId?'Enregistrer les articles, stocks et tarifs':'Enregistrer le marchand';
  $('adventure-merchant-cancel').hidden=false;
  renderPercents();renderLibrary();
 }
 function resetMerchantForm(){
  clearMerchant();
  const existing=scopedId?byMerchant(scopedId):null;
  if(existing&&isSimple(existing))editMerchant(existing);
 }
 function render(){
  const host=$('adventure-merchants');host.replaceChildren();
  // In a PNJ context no second list of shops is created or selectable.
  // Only the legacy conversion command for THIS merchant may be necessary.
  const scopedMerchant=scopedId?byMerchant(scopedId):null;
  const visibleMerchants=scopedId
   ?(scopedMerchant&&!isSimple(scopedMerchant)&&editedId!==scopedId?[scopedMerchant]:[])
   :current().merchants;
  host.hidden=Boolean(scopedId&&!visibleMerchants.length);
  for(const merchant of visibleMerchants){
   const line=document.createElement('div');line.className='rule-row';
   line.dataset.merchantId=merchant.id;
   const label=document.createElement('span');
   label.textContent=merchant.name+' · '+(isSimple(merchant)
    ?merchant.itemIds.length+' objet(s) · vend '+pct(merchant.sellPercent)+
     ' · rachète '+pct(merchant.buyPercent)+
     ' · stock '+(Object.keys(merchant.itemStocks??{}).length
      ?Object.keys(merchant.itemStocks).length+' article(s) limités':'illimité')
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
   line.append(label,edit);
   if(!scopedId)line.append(remove);
   host.append(line);
  }
  if(!scopedId&&!current().merchants.length)host.textContent='Aucun marchand configuré.';
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
  const merchant={id:scopedId??editedId??'merchant-'+document.defaultView.crypto.randomUUID(),
   name,itemIds,
   sellPercent:Number($('adventure-merchant-sell-percent').value),
   buyPercent:Number($('adventure-merchant-buy-percent').value),
   ...(fragments.length?{fragmentPrices:Object.fromEntries(fragments.map(id=>[
    id,fragmentPricesDraft[id]??100]))}:{}),
   ...(itemIds.some(id=>Object.hasOwn(itemStocksDraft,id))
    ?{itemStocks:Object.fromEntries(itemIds.filter(id=>Object.hasOwn(itemStocksDraft,id))
      .map(id=>[id,itemStocksDraft[id]]))}:{})};
  const previous=byMerchant(merchant.id);
  if(scopedId&&previous&&!isSimple(previous)&&editedId!==scopedId)
   throw Error('Confirme la conversion de cette ancienne boutique avant de la modifier.');
  const merchants=previous
   ?current().merchants.map(m=>m.id===merchant.id?merchant:m)
   :[...current().merchants,merchant];
  commitEconomy({...current(),merchants});resetMerchantForm();render();
  if(onMerchantCommitted)onMerchantCommitted(merchant.id);
  else notify('Marchand configuré. Enregistre les paramètres pour conserver ses règles.');
 }));
 $('adventure-merchant-cancel').addEventListener('click',()=>{resetMerchantForm();render();});
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
 resetMerchantForm();
 // An old link is preserved. A missing link opens this same form, using
 // the PNJ's reserved ID, so its first save is an upsert, not a second shop.
 function focusMerchant(merchantId){
  if(scopedId&&merchantId!==scopedId)return false;
  const merchant=byMerchant(merchantId);
  if(!merchant){if(scopedId){resetMerchantForm();render();}return false;}
  if(isSimple(merchant))editMerchant(merchant);
  else if(scopedId){resetMerchantForm();render();}
  if(!scopedId)$('adventure-merchants')?.scrollIntoView?.({block:'nearest'});
  return true;
 }
 return {read,sync,render,isItemUsed,focusMerchant};
}
