// Read-only transport for the exact Combat/Exploration release consumed by
// Monster Capture. A unique URL avoids stale cache-first JSON in an *older*
// installed PWA worker. This does not cache, mutate, publish or choose species.
export async function fetchOfficialAdventureJsonV1(relative,baseUrl,loadId,request=globalThis.fetch){
 if(typeof relative!=='string'||!relative||typeof baseUrl!=='string'||
    !/^[a-zA-Z0-9-]{16,80}$/.test(loadId)||typeof request!=='function')
  throw new TypeError('Official Adventure JSON request requires an immutable boot key');
 const url=new URL(relative,baseUrl);
 if(!['https:','http:'].includes(url.protocol))throw new TypeError('Official Adventure URL must be HTTP(S)');
 url.searchParams.set('_gens_capture_load',loadId);
 const result=await request(url,{cache:'no-store'});
 if(!result?.ok)
  throw new Error('Source officielle indisponible (HTTP '+(result?.status??'?')+') : '+url.pathname);
 return result.json();
}
