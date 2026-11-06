// Pinned PUBLIC configuration for Capture's own Supabase client.
// Mirrored from the existing Core Survival provider; CI tests enforce equality.
// Auth storage is DIFFERENT, and all room RPCs/tables/channels are Capture only.
export const CAPTURE_SUPABASE_PROVIDER_V1=Object.freeze({
 url:"https://dntbwwjaqjunkbubgnba.supabase.co",
 publishableKey:"sb_publishable_LUV2pjUqotr2x5rjH52CnQ_0ZHR0LwS",
 authStorageKey:'gensrpg.capture.multiplayer.auth.v1'
});
export function createCaptureSupabaseClientV1({factory}={}){
 if(typeof factory!=='function')throw new TypeError('Bibliothèque Supabase indisponible');
 const provider=CAPTURE_SUPABASE_PROVIDER_V1;
 return factory(provider.url,provider.publishableKey,{
  auth:{
   storageKey:provider.authStorageKey,
   persistSession:true,autoRefreshToken:true,detectSessionInUrl:false
  }
 });
}
