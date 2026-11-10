// Capture V2 economy editor: presentation only, no inventory state or runtime.
import {DEFAULT_ADVENTURE_ECONOMY_V1} from './adventure-economy-v1.mjs';

export function installAdventureEconomyEditorV1({
 document,getRules,commitEconomy,notify
}){
 const $=id=>document.getElementById(id);
 const option=(value,label)=>{const node=document.createElement('option');
  node.value=value;node.textContent=label;return node;};
 const warn=fn=>()=>{try{fn();}catch(error){notify(error.message,true);}};
 const itemName=id=>getRules().loot.items.find(x=>x.id===id)?.name??id;
 const current=()=>getRules().economy??DEFAULT_ADVENTURE_ECONOMY_V1;
 const byMerchant=id=>current().merchants.find(m=>m.id===id);
 let editedMerchantId=null,editedOffer=null,resources=[];
 const numeric=(field,min=0,max=100000000)=>{
  const value=Number($(field).value);
  if(!Number.isSafeInteger(value)||value<min||value>max)
   throw new RangeError('Valeur invalide pour '+field);
  return value;
 };
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
  editedMerchantId=null;editedOffer=null;resources=[];
  const money=config.economy?.currency??DEFAULT_ADVENTURE_ECONOMY_V1.currency;
  $('adventure-money-singular').value=money.singular;
  $('adventure-money-plural').value=money.plural;
  clearMerchant();clearOffer();render();
 }
 function clearMerchant(){
  editedMerchantId=null;
  $('adventure-merchant-name').value='';
  $('adventure-merchant-buys').checked=true;
  $('adventure-merchant-add').textContent='Ajouter ce marchand';
  $('adventure-merchant-cancel').hidden=true;
 }
 function clearOffer(){
  editedOffer=null;resources=[];
  $('adventure-merchant-price').value='10';
  $('adventure-merchant-unlimited').checked=true;
  $('adventure-merchant-stock').value='1';
  $('adventure-merchant-stock').disabled=true;
  $('adventure-merchant-offer-add').textContent='Ajouter cette offre';
  $('adventure-merchant-offer-cancel').hidden=true;
  renderResources();
 }
 function renderResources(){
  const host=$('adventure-merchant-resource-list');
  host.replaceChildren();
  for(const cost of resources){
   const line=document.createElement('div');line.className='rule-row';
   const label=document.createElement('span');
   label.textContent=itemName(cost.itemId)+' × '+cost.quantity;
   const remove=document.createElement('button');remove.type='button';
   remove.textContent='Retirer';
   remove.addEventListener('click',warn(()=>{
    resources=resources.filter(x=>x.itemId!==cost.itemId);renderResources();
   }));
   line.append(label,remove);host.append(line);
  }
  if(!resources.length)host.textContent='Pas de ressource supplémentaire exigée.';
 }
 function render(){
  const economy=current(),items=getRules().loot.items;
  const merchantSelect=$('adventure-merchant-select');
  const chosen=merchantSelect.value;
  merchantSelect.replaceChildren(...economy.merchants.map(m=>option(m.id,m.name)));
  if(economy.merchants.some(m=>m.id===chosen))merchantSelect.value=chosen;
  else if(economy.merchants.length)merchantSelect.value=economy.merchants[0].id;
  const itemsSelector=$('adventure-merchant-item'),selectedItem=itemsSelector.value;
  itemsSelector.replaceChildren(...items.map(i=>option(i.id,i.name)));
  if(items.some(i=>i.id===selectedItem))itemsSelector.value=selectedItem;
  const resourceSelector=$('adventure-merchant-resource'),selectedResource=resourceSelector.value;
  resourceSelector.replaceChildren(option('','Aucune (paiement en monnaie uniquement)'),
   ...items.map(i=>option(i.id,i.name)));
  if(items.some(i=>i.id===selectedResource))resourceSelector.value=selectedResource;
  $('adventure-merchant-offer-add').disabled=!economy.merchants.length||!items.length;
  $('adventure-merchant-resource-add').disabled=!items.length;
  const host=$('adventure-merchants');host.replaceChildren();
  for(const merchant of economy.merchants){
   const line=document.createElement('div');line.className='rule-row';
   const label=document.createElement('span');
   label.textContent=merchant.name+' · '+merchant.offers.length+' offre(s) · '+
    (merchant.buysItems?'rachète les objets':'ne rachète pas')+
    ' · ID : '+merchant.id;
   const edit=document.createElement('button');edit.type='button';edit.textContent='Modifier';
   edit.addEventListener('click',warn(()=>{
    editedMerchantId=merchant.id;
    $('adventure-merchant-name').value=merchant.name;
    $('adventure-merchant-buys').checked=merchant.buysItems;
    $('adventure-merchant-add').textContent='Enregistrer le marchand';
    $('adventure-merchant-cancel').hidden=false;
   }));
   const remove=document.createElement('button');remove.type='button';remove.textContent='Supprimer';
   remove.addEventListener('click',warn(()=>{
    if(merchant.offers.length&&!document.defaultView.confirm(
      'Supprimer '+merchant.name+' et ses '+merchant.offers.length+' offres ?'))return;
    commitEconomy({...current(),merchants:current().merchants.filter(m=>m.id!==merchant.id)});
    clearMerchant();clearOffer();render();
    notify('Marchand retiré du brouillon. Enregistre les paramètres.');
   }));
   line.append(label,edit,remove);host.append(line);
  }
  if(!economy.merchants.length)host.textContent='Aucun marchand défini. Les PNJ restent indépendants.';
  renderOffers();
 }
 function renderOffers(){
  const host=$('adventure-merchant-offers');host.replaceChildren();
  const merchant=byMerchant($('adventure-merchant-select').value);
  if(!merchant){host.textContent='Crée un marchand puis choisis ses objets.';return;}
  const currency=$('adventure-money-plural').value||'pièces';
  for(const offer of merchant.offers){
   const line=document.createElement('div');line.className='rule-row';
   const label=document.createElement('span');
   label.textContent=itemName(offer.itemId)+' · '+offer.currencyPrice+' '+currency+
    offer.resourceCosts.map(x=>' + '+x.quantity+' '+itemName(x.itemId)).join('')+
    ' · stock '+(offer.stock===null?'illimité':offer.stock);
   const edit=document.createElement('button');edit.type='button';edit.textContent='Modifier';
   edit.addEventListener('click',warn(()=>{
    editedOffer={merchantId:merchant.id,itemId:offer.itemId};
    $('adventure-merchant-item').value=offer.itemId;
    $('adventure-merchant-price').value=String(offer.currencyPrice);
    $('adventure-merchant-unlimited').checked=offer.stock===null;
    $('adventure-merchant-stock').disabled=offer.stock===null;
    $('adventure-merchant-stock').value=String(offer.stock??1);
    resources=offer.resourceCosts.map(x=>({...x}));
    $('adventure-merchant-offer-add').textContent='Enregistrer cette offre';
    $('adventure-merchant-offer-cancel').hidden=false;
    renderResources();
   }));
   const remove=document.createElement('button');remove.type='button';remove.textContent='Retirer';
   remove.addEventListener('click',warn(()=>{
    const merchants=current().merchants.map(m=>m.id===merchant.id?
     {...m,offers:m.offers.filter(x=>x.itemId!==offer.itemId)}:m);
    commitEconomy({...current(),merchants});clearOffer();render();
    notify('Offre retirée. Enregistre les paramètres.');
   }));
   line.append(label,edit,remove);host.append(line);
  }
  if(!merchant.offers.length)host.textContent='Aucune offre chez ce marchand.';
 }
 const isItemUsed=itemId=>current().merchants.some(m=>m.offers.some(offer=>
  offer.itemId===itemId||offer.resourceCosts.some(cost=>cost.itemId===itemId)));
 $('adventure-merchant-cancel').addEventListener('click',clearMerchant);
 $('adventure-merchant-offer-cancel').addEventListener('click',clearOffer);
 $('adventure-merchant-select').addEventListener('change',()=>{clearOffer();renderOffers();});
 $('adventure-merchant-unlimited').addEventListener('change',()=>{
  $('adventure-merchant-stock').disabled=$('adventure-merchant-unlimited').checked;
 });
 $('adventure-merchant-resource-add').addEventListener('click',warn(()=>{
  const itemId=$('adventure-merchant-resource').value;
  if(!itemId)throw new RangeError('Choisis un objet-ressource.');
  if(itemId===$('adventure-merchant-item').value)
   throw new RangeError('Une offre ne peut pas être payée avec ce même objet.');
  if(resources.some(r=>r.itemId===itemId))
   throw new RangeError('Cette ressource figure déjà dans le prix.');
  resources.push({itemId,quantity:numeric('adventure-merchant-resource-qty',1,9999)});
  $('adventure-merchant-resource').value='';renderResources();
 }));
 $('adventure-merchant-add').addEventListener('click',warn(()=>{
  const name=$('adventure-merchant-name').value.trim();
  const id=editedMerchantId??'merchant-'+document.defaultView.crypto.randomUUID();
  const next={id,name,buysItems:$('adventure-merchant-buys').checked,
   offers:editedMerchantId?(byMerchant(editedMerchantId)?.offers??[]):[]};
  const merchants=editedMerchantId?current().merchants.map(m=>m.id===id?next:m)
   :[...current().merchants,next];
  commitEconomy({...current(),merchants});clearMerchant();render();
  $('adventure-merchant-select').value=id;renderOffers();
  notify('Marchand configuré. Enregistre les paramètres pour conserver ses règles.');
 }));
 $('adventure-merchant-offer-add').addEventListener('click',warn(()=>{
  const merchantId=$('adventure-merchant-select').value;
  const merchant=byMerchant(merchantId);
  if(!merchant)throw new RangeError('Choisis un marchand.');
  const itemId=$('adventure-merchant-item').value;
  if(!itemId)throw new RangeError('Choisis un objet.');
  const offer={itemId,currencyPrice:numeric('adventure-merchant-price'),
   resourceCosts:resources.map(x=>({...x})),
   stock:$('adventure-merchant-unlimited').checked?null:
    numeric('adventure-merchant-stock')};
  const offers=editedOffer?
   merchant.offers.map(x=>x.itemId===editedOffer.itemId?offer:x):
   [...merchant.offers,offer];
  const merchants=current().merchants.map(m=>m.id===merchant.id?{...m,offers}:m);
  commitEconomy({...current(),merchants});clearOffer();render();
  $('adventure-merchant-select').value=merchantId;renderOffers();
  notify('Offre configurée. Enregistre les paramètres.');
 }));
 $('adventure-money-plural').addEventListener('input',renderOffers);
 return {read,sync,render,isItemUsed};
}
