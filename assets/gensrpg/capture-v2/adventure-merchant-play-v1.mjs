// Monster Capture V2 — in-game merchant presentation only.
// Exploration owns proximity and NPC placement; AdventureSession owns every
// trade. No second item registry, wallet, shop save or direct browser persistence.
import {tradeAdventureMerchantV1} from './adventure-contract-v1.mjs';

export function installAdventureMerchantPlayV1({
 window,document,frame,load,save,sessionId,bestiaryCards,
 hasPendingCombat,afterSave
}={}){
 const dialog=document.getElementById('adventure-merchant-dialog');
 const title=document.getElementById('adventure-merchant-title');
 const balance=document.getElementById('adventure-merchant-balance');
 const rows=document.getElementById('adventure-merchant-trades');
 const notice=document.getElementById('adventure-merchant-message');
 const close=document.getElementById('adventure-merchant-close');
 let openedMerchant=null,openedSession=null,busy=false;
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
  balance.textContent='Solde : '+state.inventory.currency+' '+money;
  rows.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='Acheter';
  rows.append(heading);
  for(const offer of merchant.offers){
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
  if(!merchant.offers.length){
   const empty=document.createElement('p');empty.textContent='Aucun article à vendre.';
   rows.append(empty);
  }
  if(merchant.buysItems){
   const heading=document.createElement('h3');heading.textContent='Vendre tes objets';
   rows.append(heading);
   for(const [id,count] of Object.entries(state.inventory.items)){
    const article=state.rules.loot.items.find(item=>item.id===id);
    if(!article||article.saleValue<=0)continue;
    const {row,quantity,button}=line(article.name,
      article.saleValue+' '+money+' / unité · possédés : '+count,'sell');
    button.disabled=busy||count<=0;
    button.addEventListener('click',()=>void transact('sell',id,quantity.value));
    rows.append(row);
   }
  }
 }
 async function transact(kind,itemId,rawQuantity){
  if(busy||!dialog.open)return;
  const quantity=Number(rawQuantity);
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>9999){
   say('Choisis une quantité entière entre 1 et 9999.',true);return;
  }
  busy=true;
  try{
   if(typeof window.navigator.locks?.request!=='function')
    throw new Error('Verrou de sauvegarde indisponible : transaction annulée.');
   let receipt=null;
   await window.navigator.locks.request(
    'gensrpg.capture.v2.adventure-combat:'+openedSession,()=>{
     const state=load();
     if(!state||state.sessionId!==openedSession||state.status!=='playing'||
       sessionId()!==openedSession||hasPendingCombat(openedSession))
      throw new Error('La partie ou le combat a changé : transaction annulée.');
     const result=tradeAdventureMerchantV1({
      session:state,merchantId:openedMerchant,itemId,kind,quantity,
      actionId:window.crypto.randomUUID(),now:new Date().toISOString(),
      bestiaryCards:bestiaryCards()
     });
     if(!result.applied)throw new Error('Transaction déjà enregistrée.');
     // The original Capture portfolio is the ONLY persistence authority.
     save(result.session);
     receipt=result.receipt;
   });
   afterSave?.();
   const money=load().rules.economy?.currency.plural??'pièces';
   say((kind==='buy'?'Achat':'Vente')+' enregistré(e) : '+quantity+' × '+
    label(load(),itemId)+' · '+receipt.currencyAmount+' '+money+'.');
  }catch(error){say('Transaction refusée : '+error.message,true);}
  finally{busy=false;render();}
 }
 const onMessage=event=>{
  if(event.origin!==window.location.origin||event.source!==frame.contentWindow||
     event.data?.schema!=='gensrpg.exploration.npc.merchant.open.v1')return;
  const state=load();
  if(!state||state.status!=='playing'||sessionId()!==state.sessionId||
     event.data.sessionId!==state.sessionId||
     document.body.dataset.adventurePlaying!=='true'||frame.hidden||
     hasPendingCombat(state.sessionId)||dialog.open)return;
  const merchant=state.rules.economy?.merchants.find(
   item=>item.id===event.data.merchantId);
  if(!merchant)return; // invalid or removed link never creates a shop.
  openedMerchant=merchant.id;openedSession=state.sessionId;
  say('Choisis un objet et sa quantité.');
  dialog.showModal();render();
  frame.contentWindow?.postMessage({
   schema:'gensrpg.capture.v2.npc.merchant.open-ack.v1',
   sessionId:openedSession
  },window.location.origin);
 };
 window.addEventListener('message',onMessage);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{
  const old=openedSession;
  openedSession=null;openedMerchant=null;
  if(old)frame.contentWindow?.postMessage({
   schema:'gensrpg.capture.v2.npc.merchant.closed.v1',sessionId:old
  },window.location.origin);
 });
 return Object.freeze({dispose:()=>{window.removeEventListener('message',onMessage);
  if(dialog.open)dialog.close();}});
}
