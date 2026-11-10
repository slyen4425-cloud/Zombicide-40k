// Monster Capture V2 — optional economy / merchants configuration.
// AdventureRules and AdventureSession remain the only gameplay data owners.
// No NPC placement, separate currency wallet, inventory or save system here.
export const DEFAULT_ADVENTURE_ECONOMY_V1=Object.freeze({
 currency:Object.freeze({singular:'pièce',plural:'pièces'}),
 merchants:Object.freeze([])
});
const obj=(v,name)=>{
 if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(name+' must be an object');
 return v;
};
const exact=(v,keys,name)=>{
 obj(v,name);
 const received=Object.keys(v);
 if(received.some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(v,k)))
  throw new TypeError(name+' fields must be '+keys.join(', '));
 return v;
};
const integer=(v,name,min=0,max=Number.MAX_SAFE_INTEGER)=>{
 if(!Number.isSafeInteger(v)||v<min||v>max)throw new RangeError(name+' must be an integer in ['+min+','+max+']');
 return v;
};
const id=(v,name)=>{
 if(typeof v!=='string'||v.length>130||!/^[a-z0-9][a-z0-9_:.-]*$/i.test(v))
  throw new RangeError(name+' must be a safe ID');
 return v;
};
const title=(v,name,max=80)=>{
 if(typeof v!=='string'||!v.trim()||v.trim().length>max)
  throw new RangeError(name+' must be non-empty (max '+max+' chars)');
 return v.trim();
};
const freeze=v=>{
 if(v&&typeof v==='object'){for(const value of Object.values(v))freeze(value);Object.freeze(v);}
 return v;
};

// An alternate resource is an existing Adventure item in inventory.items,
// not a second counter or a separate item registry. Cost lines reference IDs.
export function normalizeAdventureEconomyV1(input,lootItems=[]){
 const source=exact(input??DEFAULT_ADVENTURE_ECONOMY_V1,['currency','merchants'],'economy');
 const currency=exact(source.currency,['singular','plural'],'economy.currency');
 const singular=title(currency.singular,'currency.singular',40);
 const plural=title(currency.plural,'currency.plural',40);
 if(!Array.isArray(lootItems)||!Array.isArray(source.merchants))
  throw new TypeError('Economy items and merchants must be arrays');
 const existing=new Set(lootItems.map(item=>id(item.id,'economy item.id')));
 const isCommodity=commodity=>existing.has(commodity)||
  (commodity.startsWith('fragment:')&&commodity.length>'fragment:'.length);
 const seen=new Set();
 const merchants=source.merchants.map((raw,i)=>{
  const m=exact(raw,['id','name','buysItems','offers'],'economy.merchants['+i+']');
  const merchantId=id(m.id,'merchant.id');
  if(seen.has(merchantId))throw new RangeError('Duplicate merchant ID '+merchantId);
  seen.add(merchantId);
  if(typeof m.buysItems!=='boolean')throw new TypeError('merchant.buysItems must be boolean');
  if(!Array.isArray(m.offers))throw new TypeError('merchant.offers must be an array');
  const offered=new Set();
  const offers=m.offers.map((rawOffer,j)=>{
   const offer=exact(rawOffer,['itemId','currencyPrice','resourceCosts','stock'],
    'merchant.offers['+j+']');
   const itemId=id(offer.itemId,'offer.itemId');
   if(!isCommodity(itemId))throw new RangeError('Merchant item missing from loot.items: '+itemId);
   if(offered.has(itemId))throw new RangeError('Duplicate merchant offer '+itemId);
   offered.add(itemId);
   const currencyPrice=integer(offer.currencyPrice,'offer.currencyPrice',0,100000000);
   if(offer.stock!==null)integer(offer.stock,'offer.stock',0,100000000);
   if(!Array.isArray(offer.resourceCosts))
    throw new TypeError('merchant resourceCosts must be an array');
   const resourceIds=new Set();
   const resourceCosts=offer.resourceCosts.map(cost=>{
    exact(cost,['itemId','quantity'],'offer.resourceCost');
    const resourceId=id(cost.itemId,'resourceCost.itemId');
    if(!isCommodity(resourceId))throw new RangeError('Unknown resource item: '+resourceId);
    if(resourceId===itemId)throw new RangeError('An item cannot pay for itself');
    if(resourceIds.has(resourceId))throw new RangeError('Duplicate resource cost '+resourceId);
    resourceIds.add(resourceId);
    return {itemId:resourceId,quantity:integer(cost.quantity,'resourceCost.quantity',1,9999)};
   });
   if(currencyPrice===0&&resourceCosts.length===0)
    throw new RangeError('Merchant offer must have a currency or resource price');
   return {itemId,currencyPrice,resourceCosts,stock:offer.stock};
  });
  return {id:merchantId,name:title(m.name,'merchant.name'),buysItems:m.buysItems,offers};
 });
 return freeze({currency:{singular,plural},merchants});
}
const multiply=(a,b,name)=>{
 const n=a*b;
 if(!Number.isSafeInteger(n))throw new RangeError(name+' overflow');
 return n;
};
const add=(a,b,name)=>{
 const n=a+b;
 if(!Number.isSafeInteger(n)||n<0)throw new RangeError(name+' overflow');
 return n;
};

// Pure transaction. The caller (Adventure contract) validates the session,
// commits the returned session with its existing Core storage, and supplies
// a unique actionId to make retries idempotent.
export function tradeAdventureMerchantInventoryV1({
 session,merchantId,itemId,kind,quantity=1,actionId,now
}={}){
 const state=obj(session,'AdventureSession');
 const action=id(actionId,'merchant actionId');
 const previous=state.processedMerchantActions??[];
 if(!Array.isArray(previous))throw new TypeError('Invalid merchant action history');
 if(previous.includes(action))return {applied:false,session:state,receipt:null};
 if(state.status==='finished')throw new RangeError('Cannot trade in a finished adventure');
 const economy=normalizeAdventureEconomyV1(state.rules?.economy,state.rules?.loot?.items);
 const merchant=economy.merchants.find(m=>m.id===id(merchantId,'merchantId'));
 if(!merchant)throw new RangeError('Unknown merchant '+merchantId);
 const target=id(itemId,'trade itemId');
 const count=integer(quantity,'trade quantity',1,9999);
 const definition=state.rules.loot.items.find(item=>item.id===target);
 if(!definition&&!target.startsWith('fragment:'))
  throw new RangeError('Unknown trade item '+target);
 const inventory=obj(state.inventory,'inventory'),original=obj(inventory.items,'inventory.items');
 const items={...original};
 let currency=integer(inventory.currency,'inventory.currency');
 const stocks=state.merchantStocks??{};
 let nextStocks=stocks;
 let paidCurrency=0;
 const paidResources=[];
 if(kind==='buy'){
  const offer=merchant.offers.find(x=>x.itemId===target);
  if(!offer)throw new RangeError('Merchant does not offer this item');
  const remaining=offer.stock===null?null:
   Math.min(stocks[merchant.id]?.[target]??offer.stock,offer.stock);
  if(remaining!==null&&remaining<count)throw new RangeError('Merchant out of stock');
  paidCurrency=multiply(offer.currencyPrice,count,'currency purchase');
  if(currency<paidCurrency)throw new RangeError('Insufficient currency');
  for(const cost of offer.resourceCosts){
   const needed=multiply(cost.quantity,count,'resource purchase');
   if((items[cost.itemId]??0)<needed)throw new RangeError('Insufficient resource '+cost.itemId);
   paidResources.push({itemId:cost.itemId,quantity:needed});
  }
  currency-=paidCurrency;
  for(const cost of paidResources){
   const left=items[cost.itemId]-cost.quantity;
   if(left===0)delete items[cost.itemId];else items[cost.itemId]=left;
  }
  items[target]=add(items[target]??0,count,'purchased items');
  if(remaining!==null){
   nextStocks={...stocks,[merchant.id]:{...(stocks[merchant.id]??{}),[target]:remaining-count}};
  }
 }else if(kind==='sell'){
  if(!merchant.buysItems)throw new RangeError('Merchant does not buy items');
  if(!definition)throw new RangeError('Fragment resale has no authored saleValue');
  if((items[target]??0)<count)throw new RangeError('Insufficient items to sell');
  const price=integer(definition.saleValue,'item.saleValue',0,100000000);
  if(price===0)throw new RangeError('Item has no resale value');
  paidCurrency=multiply(price,count,'resale currency');
  currency=add(currency,paidCurrency,'wallet currency');
  const left=items[target]-count;
  if(left===0)delete items[target];else items[target]=left;
 }else throw new RangeError('Unknown merchant transaction');
 const iso=now??state.updatedAt;
 if(typeof iso!=='string'||!Number.isFinite(Date.parse(iso)))
  throw new TypeError('Merchant transaction requires an ISO timestamp');
 const updated={...state,updatedAt:iso,inventory:{currency,items},
  ...(nextStocks===stocks?{}:{merchantStocks:nextStocks}),
  processedMerchantActions:[...previous,action]};
 const receipt=freeze({actionId:action,merchantId:merchant.id,itemId:target,
  kind,quantity:count,currencyAmount:paidCurrency,resourceCosts:paidResources});
 return {applied:true,session:freeze(updated),receipt};
}
