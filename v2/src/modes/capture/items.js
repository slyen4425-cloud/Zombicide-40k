const clone=value=>structuredClone(value);

export const CAPTURE_ORB_LIBRARY=[
  {id:'capture_orb_basic',legacyIds:['capture_orb_basic'],tier:1,captureCoefficient:null,coefficientStatus:'pending_recovery_or_rebalance'},
  {id:'capture_orb_plus',legacyIds:['capture_orb_plus'],tier:2,captureCoefficient:null,coefficientStatus:'pending_recovery_or_rebalance'},
  {id:'capture_orb_ultra',legacyIds:['capture_orb_ultra'],tier:3,captureCoefficient:null,coefficientStatus:'pending_recovery_or_rebalance'},
  {id:'capture_orb_master',legacyIds:['capture_orb_master'],tier:4,captureCoefficient:null,coefficientStatus:'pending_recovery_or_rebalance'},
];

export function buildCaptureItemIndex(items=CAPTURE_ORB_LIBRARY){
  const byId={};
  const aliasToId={};
  for(const item of items){
    byId[item.id]=clone(item);
    aliasToId[item.id]=item.id;
    for(const alias of item.legacyIds||[]) aliasToId[String(alias)]=item.id;
  }
  return {byId,aliasToId};
}

export function resolveCaptureItem(itemId,items=CAPTURE_ORB_LIBRARY){
  const {byId,aliasToId}=buildCaptureItemIndex(items);
  const requestedId=String(itemId||'');
  const canonicalId=aliasToId[requestedId]||requestedId;
  const item=byId[canonicalId]||null;
  return item?{found:true,item:clone(item),canonicalId}:{found:false,item:null,canonicalId,quarantine:true};
}

export function createCaptureInventory(seed={}){
  const counts={};
  for(const [id,count] of Object.entries(seed||{})){
    const resolved=resolveCaptureItem(id);
    if(!resolved.found) continue;
    counts[resolved.canonicalId]=(counts[resolved.canonicalId]||0)+Math.max(0,Number(count)||0);
  }
  return {counts};
}

export function consumeCaptureItem(inventory,itemId,amount=1){
  const resolved=resolveCaptureItem(itemId);
  if(!resolved.found) return {ok:false,reason:'unknown_capture_item',inventory:clone(inventory)};
  const next=clone(inventory||{counts:{}});
  next.counts=next.counts||{};
  const qty=Math.max(1,Number(amount)||1);
  const current=Math.max(0,Number(next.counts[resolved.canonicalId])||0);
  if(current<qty) return {ok:false,reason:'insufficient_capture_item',inventory:next};
  next.counts[resolved.canonicalId]=current-qty;
  return {ok:true,itemId:resolved.canonicalId,inventory:next};
}
