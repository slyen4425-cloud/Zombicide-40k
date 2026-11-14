// Read-only presentation adapter to Exploration's ONE official model catalog.
// The saved HeroDefinition UUID remains the only game identity.
export async function officialHeroPortraitUrlV1({
 record,catalog,rootUrl,fetchAsset=fetch
}={}){
 if(record?.mapVisual?.animation?.mode!=='directions'||record?.assets?.length!==49||
    !Array.isArray(catalog?.heroes)||!rootUrl)return null;
 const hero=catalog.heroes.find(entry=>entry.name===record.name);
 if(!hero?.thumbnail||!hero?.directions?.S?.[0])return null;
 const base=record.assets.find(asset=>asset.id===record.mapVisual.assetId)?.blob;
 if(!(base instanceof Blob))return null;
 const root=new URL(rootUrl);
 const sprite=new URL(hero.directions.S[0],root),art=new URL(hero.thumbnail,root);
 if(sprite.origin!==root.origin||art.origin!==root.origin||
   !sprite.pathname.includes('/assets/exploration/actors/official/')||
   !art.pathname.includes('/assets/exploration/actors/official/'))return null;
 const response=await fetchAsset(sprite.href,{cache:'force-cache'});
 if(!response?.ok)return null;
 const official=new Uint8Array(await response.arrayBuffer());
 if(official.byteLength!==base.size)return null;
 const saved=new Uint8Array(await base.arrayBuffer());
 if(!saved.every((byte,index)=>byte===official[index]))return null;
 return art.href;
}
