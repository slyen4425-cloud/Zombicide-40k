import { addItem, removeItem, inventoryQuantity } from './inventory-engine.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

function findItem(definitions,itemId){return (definitions?.items||[]).find?.(x=>String(x.id)===String(itemId))||definitions?.items?.[itemId]||null;}
function priceFor(item,entry,kind){
  const base=Math.max(0,Number(entry?.price ?? item?.value ?? 0)||0);
  const multiplier=kind==='sell'?Number(entry?.sellMultiplier??1):Number(entry?.buyMultiplier??1);
  return Math.max(0,Math.round(base*(Number.isFinite(multiplier)?multiplier:1)));
}

export function createMerchantDefinition({
  id=uid(),name='Nouveau marchand',enabled=true,currencyId='gold',buyMultiplier=1,sellMultiplier=0.5,
  stock=[],categories=[],audioId=null,tags=[]
}={}){
  return {
    id:String(id),name:String(name||'Marchand'),enabled:enabled!==false,currencyId:String(currencyId||'gold'),
    buyMultiplier:Math.max(0,Number(buyMultiplier)||0),sellMultiplier:Math.max(0,Number(sellMultiplier)||0),
    stock:(stock||[]).map(entry=>({
      itemId:String(entry.itemId||''),quantity:Math.max(0,Math.floor(Number(entry.quantity)||0)),
      maxQuantity:Math.max(0,Math.floor(Number(entry.maxQuantity??entry.quantity)||0)),
      price:entry.price==null?null:Math.max(0,Number(entry.price)||0),
      category:entry.category==null?null:String(entry.category),
      buyMultiplier:entry.buyMultiplier==null?null:Math.max(0,Number(entry.buyMultiplier)||0),
      sellMultiplier:entry.sellMultiplier==null?null:Math.max(0,Number(entry.sellMultiplier)||0),
      restockOnSell:entry.restockOnSell!==false,
    })),
    categories:[...(categories||[])].map(String),audioId:audioId==null?null:String(audioId),tags:[...(tags||[])].map(String),
  };
}

export function createMerchantRuntime(definition){
  const merchant=createMerchantDefinition(definition||{});
  return {
    merchantId:merchant.id,
    stock:Object.fromEntries(merchant.stock.map(entry=>[entry.itemId,{...clone(entry)}])),
    transactions:[],
    sequence:0,
  };
}

export function merchantStock(runtime,itemId){return Math.max(0,Number(runtime?.stock?.[String(itemId)]?.quantity)||0);}

export function buyFromMerchant(runtime,merchant,inventory,wallet,itemId,quantity=1,definitions={}){
  const qty=Math.max(1,Math.floor(Number(quantity)||1));
  const item=findItem(definitions,itemId); if(!item||item.enabled===false) return {ok:false,reason:'item-missing',runtime,inventory,wallet};
  const entry=runtime?.stock?.[String(itemId)]; if(!entry) return {ok:false,reason:'not-sold',runtime,inventory,wallet};
  if(Number(entry.quantity)<qty) return {ok:false,reason:'sold-out',runtime,inventory,wallet};
  const unit=priceFor(item,{...entry,buyMultiplier:entry.buyMultiplier??merchant?.buyMultiplier},'buy');
  const total=unit*qty; const currency=String(merchant?.currencyId||'gold');
  const balance=Math.max(0,Number(wallet?.[currency])||0); if(balance<total) return {ok:false,reason:'not-enough-currency',runtime,inventory,wallet,cost:total};
  const add=addItem(inventory,itemId,qty,definitions); if(!add.ok) return {ok:false,reason:add.reason,runtime,inventory,wallet};
  const nextRuntime=clone(runtime); nextRuntime.stock[String(itemId)].quantity-=qty; nextRuntime.sequence=(Number(nextRuntime.sequence)||0)+1;
  nextRuntime.transactions.push({id:uid(),type:'buy',itemId:String(itemId),quantity:qty,total,currency});
  const nextWallet=clone(wallet||{}); nextWallet[currency]=balance-total;
  return {ok:true,runtime:nextRuntime,inventory:add.inventory,wallet:nextWallet,cost:total,unitPrice:unit};
}

export function sellToMerchant(runtime,merchant,inventory,wallet,itemId,quantity=1,definitions={}){
  const qty=Math.max(1,Math.floor(Number(quantity)||1));
  const item=findItem(definitions,itemId); if(!item||item.enabled===false) return {ok:false,reason:'item-missing',runtime,inventory,wallet};
  if(inventoryQuantity(inventory,itemId)<qty) return {ok:false,reason:'not-enough-items',runtime,inventory,wallet};
  const stockEntry=runtime?.stock?.[String(itemId)]||null;
  const pricingEntry=stockEntry||{sellMultiplier:merchant?.sellMultiplier};
  const unit=priceFor(item,{...pricingEntry,sellMultiplier:pricingEntry.sellMultiplier??merchant?.sellMultiplier},'sell');
  const total=unit*qty; const remove=removeItem(inventory,itemId,qty); if(!remove.ok) return {ok:false,reason:remove.reason,runtime,inventory,wallet};
  const nextRuntime=clone(runtime); nextRuntime.stock=nextRuntime.stock||{};
  if(stockEntry?.restockOnSell!==false){
    if(!nextRuntime.stock[String(itemId)]) nextRuntime.stock[String(itemId)]={itemId:String(itemId),quantity:0,maxQuantity:0,price:null,category:null,buyMultiplier:null,sellMultiplier:null,restockOnSell:true};
    nextRuntime.stock[String(itemId)].quantity=Math.max(0,Number(nextRuntime.stock[String(itemId)].quantity)||0)+qty;
    nextRuntime.stock[String(itemId)].maxQuantity=Math.max(Number(nextRuntime.stock[String(itemId)].maxQuantity)||0,nextRuntime.stock[String(itemId)].quantity);
  }
  nextRuntime.sequence=(Number(nextRuntime.sequence)||0)+1; const currency=String(merchant?.currencyId||'gold');
  nextRuntime.transactions.push({id:uid(),type:'sell',itemId:String(itemId),quantity:qty,total,currency});
  const nextWallet=clone(wallet||{}); nextWallet[currency]=Math.max(0,Number(nextWallet[currency])||0)+total;
  return {ok:true,runtime:nextRuntime,inventory:remove.inventory,wallet:nextWallet,revenue:total,unitPrice:unit};
}

export function restockMerchant(runtime,itemId,quantity=null){
  const next=clone(runtime); const entry=next?.stock?.[String(itemId)]; if(!entry) return {ok:false,reason:'not-sold',runtime};
  const target=quantity==null?Number(entry.maxQuantity)||0:Math.max(0,Math.floor(Number(quantity)||0)); entry.quantity=target;
  entry.maxQuantity=Math.max(Number(entry.maxQuantity)||0,target); next.sequence=(Number(next.sequence)||0)+1; return {ok:true,runtime:next};
}
