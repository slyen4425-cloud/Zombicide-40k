const clone=value=>structuredClone(value);

export const CAPTURE_UI_NOTICE_FEED_CONTRACT=Object.freeze({
  presentationOnly:true,
  independentFromGameplayTime:true,
  fixedRealtimeCadence:false,
  configurableLimit:true,
  configurableVisualExpiry:true,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function normalizeLimit(value){
  if(value==null) return 6;
  const numeric=Math.floor(Number(value));
  return Number.isFinite(numeric)?Math.max(1,numeric):6;
}

function normalizeExpiry(value){
  if(value==null) return null;
  const numeric=Number(value);
  return Number.isFinite(numeric)&&numeric>=0?numeric:null;
}

export function createCaptureUiNoticeFeed({maxVisible=6,expireAfterVisualTime=null,visualTime=0,nextId=0,items=[]}={}){
  const limit=normalizeLimit(maxVisible);
  const expiry=normalizeExpiry(expireAfterVisualTime);
  const now=Math.max(0,Number(visualTime)||0);
  const normalized=(items||[]).map((item,index)=>({
    id:String(item?.id||`notice:${index}`),
    notice:clone(item?.notice||item),
    createdAtVisualTime:Math.max(0,Number(item?.createdAtVisualTime)||0),
  }));
  return {
    maxVisible:limit,
    expireAfterVisualTime:expiry,
    visualTime:now,
    nextId:Math.max(normalized.length,Math.floor(Number(nextId)||0)),
    items:normalized.slice(-limit),
  };
}

function prune(feed){
  const expiry=feed.expireAfterVisualTime;
  const kept=expiry==null
    ? feed.items
    : feed.items.filter(item=>(feed.visualTime-item.createdAtVisualTime)<expiry);
  return {...feed,items:kept.slice(-feed.maxVisible)};
}

export function appendCaptureUiNotices(feed,notices=[]){
  let next=createCaptureUiNoticeFeed(feed||{});
  for(const notice of notices||[]){
    const id=`notice:${next.nextId}`;
    next={
      ...next,
      nextId:next.nextId+1,
      items:[...next.items,{id,notice:clone(notice),createdAtVisualTime:next.visualTime}],
    };
  }
  return prune(next);
}

export function advanceCaptureUiNoticeVisualTime(feed,amount=1){
  const current=createCaptureUiNoticeFeed(feed||{});
  const delta=Math.max(0,Number(amount)||0);
  return prune({...current,visualTime:current.visualTime+delta});
}

export function captureUiNoticeFeedNotices(feed){
  return (feed?.items||[]).map(item=>clone(item.notice));
}
