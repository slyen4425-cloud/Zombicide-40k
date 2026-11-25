// Monster Capture V2 — in-game merchant presentation only.
// Exploration owns proximity and NPC placement; AdventureSession owns every
// trade. No second item registry, wallet, shop save or direct browser persistence.
import {tradeAdventureMerchantV1} from './adventure-contract-v1.mjs';
import {adventureMerchantPriceV1} from './adventure-economy-v1.mjs';

export function installAdventureMerchantPlayV1({
 window,document,frame,load,save,sessionId,bestiaryCards,
 hasPendingCombat,afterSave,preview=false,onPreviewClose
}={}){
 const dialog=document.getElementById('adventure-merchant-dialog');
 const title=document.getElementById('adventure-merchant-title');
 const balance=document.getElementById('adventure-merchant-balance');
 const rows=document.getElementById('adventure-merchant-trades');
 const notice=document.getElementById('adventure-merchant-message');
 const close=document.getElementById('adventure-merchant-close');
 let openedMerchant=null,openedSession=null,busy=false,openEpoch=0;
 const say=(message,error=false)=>{notice.textContent=message;notice.dataset.error=String(error);};
 const label=(session,id)=>{
  if(id.startsWith('fragment:'))return 'Éclat de '+(
   bestiaryCards().find(card=>card.id===id.slice(9))?.name??'créature');
  return session.rules.loot.items.find(item=>item.id===id)?.name??'Objet inconnu';
 };
 const line=(item,price,operation)=>{
  const row=document.createElement('div');row.className='merchant-trade-row';
  const info=document.createElement('span');info.textContent=item+' · '+price;
  const quantity=document.createElement('input');
  quantity.type='number';quantity.min='1';quantity.max='9999';quantity.step='1';quantity.value='1';
  quantity.setAttribute('aria-label','Quantité pour '+item);
  const button=document.createElement('button');button.type='button';
  button.textContent=operation==='buy'?'Acheter':'Vendre';
  button.disabled=busy;
  row.append(info,quantity,button);
  return {row,quantity,button};
 };
 function render(){
  if(!dialog.open||!openedMerchant)return;
  const state=load();
  if(state?.sessionId!==openedSession){dialog.close();return;}
  const merchant=state.rules.economy?.merchants.find(m=>m.id===openedMerchant);
  if(!merchant){say('Cette boutique a été retirée par le créateur.',true);rows.replaceChildren();return;}
  const money=state.rules.economy?.currency.plural??'pièces';
  title.textContent=merchant.name;
  balance.textContent='Solde : '+state.inventory.currency+' '+money+(preview?' · TEST — argent fictif, aucun achat sauvegardé':'');
  rows.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='Acheter';
  rows.append(heading);
  const simple=Array.isArray(merchant.itemIds);
  const offers=simple?merchant.itemIds.map(itemId=>{
   const item=state.rules.loot.items.find(x=>x.id===itemId);
   const basePrice=item?.saleValue??merchant.fragmentPrices?.[itemId];
   return basePrice===undefined?null:{itemId,currencyPrice:adventureMerchantPriceV1(
    basePrice,merchant.sellPercent),resourceCosts:[],
    stock:merchant.itemStocks?.[itemId]??null};
  }).filter(Boolean):merchant.offers;
  for(const offer of offers){
   const resources=offer.resourceCosts.map(cost=>
    cost.quantity+' × '+label(state,cost.itemId)).join(' + ');
   const remaining=offer.stock===null?null:Math.min(
    state.merchantStocks?.[merchant.id]?.[offer.itemId]??offer.stock,offer.stock);
   const price=offer.currencyPrice+' '+money+(resources?' + '+resources:'')+
    ' · stock '+(remaining===null?'illimité':remaining);
   const {row,quantity,button}=line(label(state,offer.itemId),price,'buy');
   button.disabled=busy||remaining===0;
   button.addEventListener('click',()=>void transact('buy',offer.itemId,quantity.value));
   rows.append(row);
  }
  if(!offers.length){
   const empty=document.createElement('p');empty.textContent='Aucun article à vendre.';
   rows.append(empty);
  }
  if(simple||merchant.buysItems){
   const heading=document.createElement('h3');heading.textContent='Vendre tes objets';
   rows.append(heading);
   for(const [id,count] of Object.entries(state.inventory.items)){
    const article=state.rules.loot.items.find(item=>item.id===id);
    if(!article||article.saleValue<=0)continue;
    const resale=simple?adventureMerchantPriceV1(
     article.saleValue,merchant.buyPercent):article.saleValue;
    if(resale<=0)continue;
    const {row,quantity,button}=line(article.name,
      resale+' '+money+' / unité · possédés : '+count,'sell');
    button.disabled=busy||count<=0;
    button.addEventListener('click',()=>void transact('sell',id,quantity.value));
    rows.append(row);
   }
  }
 }
 async function transact(kind,itemId,rawQuantity){
  if(busy||!dialog.open||!openedMerchant)return;
  const quantity=Number(rawQuantity);
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>9999){
   say('Choisis une quantité entière entre 1 et 9999.',true);return;
  }
  const transactionSession=openedSession,transactionMerchant=openedMerchant,epoch=openEpoch;
  const sameOpening=()=>dialog.open&&openEpoch===epoch&&
   openedSession===transactionSession&&openedMerchant===transactionMerchant;
  busy=true;render();
  try{
   if(typeof window.navigator.locks?.request!=='function')
    throw new Error('Verrou de sauvegarde indisponible : transaction annulée.');
   let receipt=null;
   await window.navigator.locks.request(
    'gensrpg.capture.v2.adventure-combat:'+transactionSession,()=>{
     const state=load();
     if(!sameOpening()||!state||state.sessionId!==transactionSession||state.status!=='playing'||
       sessionId()!==transactionSession||hasPendingCombat(transactionSession))
      throw new Error('La partie ou le combat a changé : transaction annulée.');
     const result=tradeAdventureMerchantV1({
      session:state,merchantId:transactionMerchant,itemId,kind,quantity,
      actionId:window.crypto.randomUUID(),now:new Date().toISOString(),
      bestiaryCards:bestiaryCards()
     });
     if(!result.applied)throw new Error('Transaction déjà enregistrée.');
     // The original Capture portfolio is the ONLY persistence authority.
     save(result.session);
     receipt=result.receipt;
   });
   try{afterSave?.();}catch(error){console.error('Actualisation après transaction enregistrée',error);}
   if(sameOpening()){
    const state=load(),money=state.rules.economy?.currency.plural??'pièces';
    say((kind==='buy'?'Achat':'Vente')+' enregistré(e) : '+quantity+' × '+
     label(state,itemId)+' · '+receipt.currencyAmount+' '+money+'.');
   }
  }catch(error){if(sameOpening())say('Transaction refusée : '+error.message,true);}
  finally{busy=false;render();}
 }
 const onMessage=event=>{
  if(preview)return;
  if(event.origin!==window.location.origin||event.source!==frame.contentWindow||
     event.data?.schema!=='gensrpg.exploration.npc.merchant.open.v1')return;
  const activeSession=sessionId();
  if(!activeSession||event.data.sessionId!==activeSession||
     document.body.dataset.adventurePlaying!=='true'||frame.hidden||
     dialog.open)return;
  // The authenticated, visible Explorer may outlive a selected/corrupt save.
  // Surface the refusal in the same Capture-owned modal, with no transactions,
  // rather than swallowing the player's action without any explanation.
  let state;
  try{state=load();}catch(error){console.error('Marchand : sauvegarde inaccessible',error);}
  if(!state||state.status!=='playing'||state.sessionId!==activeSession){
   openEpoch++;openedMerchant=null;openedSession=activeSession;
   title.textContent='Commerce temporairement indisponible';
   balance.textContent='';rows.replaceChildren();
   say('La sauvegarde active ne correspond plus à cette aventure. Reprends cette partie depuis le menu. Aucune transaction effectuée.',true);
   dialog.showModal();
   frame.contentWindow?.postMessage({
    schema:'gensrpg.capture.v2.npc.merchant.open-ack.v1',sessionId:openedSession
   },window.location.origin);
   return;
  }
  // Explain a pending combat instead of silently ignoring an authenticated request.
  let combatBlocked=false;
  try{combatBlocked=hasPendingCombat(state.sessionId);}catch{combatBlocked=true;}
  openShop(state,event.data.merchantId,combatBlocked);
  frame.contentWindow?.postMessage({
   schema:'gensrpg.capture.v2.npc.merchant.open-ack.v1',
   sessionId:openedSession
  },window.location.origin);
 };
 function openShop(state,merchantId,combatBlocked=false){
  const merchant=state.rules.economy?.merchants.find(item=>item.id===merchantId);
  // An authenticated, active Explorer may reference a removed shop. Keep
  // the existing dialog/ack/close lifecycle, but never create a fake shop
  // or make a transaction possible when the canonical reference is missing.
  openEpoch++;openedMerchant=combatBlocked?null:merchant?.id??null;openedSession=state.sessionId;
  if(combatBlocked){
   title.textContent='Commerce temporairement indisponible';
   balance.textContent='';rows.replaceChildren();
   say('Un résultat de combat reste en attente de sauvegarde. Reprends la partie pour le valider avant de commercer. Aucune transaction effectuée.',true);
   dialog.showModal();
  }else if(merchant){
   say('Choisis un objet et sa quantité.');
   dialog.showModal();render();
  }else{
   title.textContent='Marchand indisponible';
   balance.textContent='';
   rows.replaceChildren();
   say('Boutique introuvable dans les règles de cette partie. Ouvre la fiche de ce PNJ, configure ses articles et enregistre. Aucune association de boutique séparée n’est nécessaire.',true);
   dialog.showModal();
  }
 }
 // A dedicated editor iframe reuses this exact view and transaction path,
 // with a Capture-owned in-memory session, never the persistent portfolio.
 function openPreview(merchantId,error=null){
  if(!preview||dialog.open)return false;
  const state=load();
  if(error||!state){
   openEpoch++;openedMerchant=null;openedSession=null;
   title.textContent='Test marchand indisponible';balance.textContent='';
   rows.replaceChildren();say(error??'Configuration indisponible.',true);
   dialog.showModal();return true;
  }
  openShop(state,merchantId);return true;
 }
 window.addEventListener('message',onMessage);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{
  const old=openedSession;
  openEpoch++;openedSession=null;openedMerchant=null;
  if(preview){onPreviewClose?.();return;}
  if(old)frame.contentWindow?.postMessage({
   schema:'gensrpg.capture.v2.npc.merchant.closed.v1',sessionId:old
  },window.location.origin);
 });
 return Object.freeze({openPreview,dispose:()=>{window.removeEventListener('message',onMessage);
  if(dialog.open)dialog.close();}});
}
