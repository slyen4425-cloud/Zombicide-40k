// Trusted presentation-only bridge. Never accept combat results or stats here.
export const ADVENTURE_COMBAT_VISIBILITY_SCHEMA_V1='gensrpg.exploration.combat.visibility.v1';
export function readScopedAdventureCombatVisibilityV1({event,frameWindow,origin,sessionId}={}){
 if(!sessionId||!frameWindow||event?.source!==frameWindow||
    event?.origin!==origin)return null;
 const data=event.data;
 if(data?.schema!==ADVENTURE_COMBAT_VISIBILITY_SCHEMA_V1||
    data.sessionId!==sessionId||
    typeof data.encounterId!=='string'||!data.encounterId.trim()||
    typeof data.visible!=='boolean')return null;
 return Object.freeze({encounterId:data.encounterId,visible:data.visible});
}

// A native zone transition uses the SAME trusted iframe, origin and session.
// Only presentation visibility travels; never movement, rules or save data.
export const ADVENTURE_ZONE_LOADING_SCHEMA_V1='gensrpg.exploration.play.loading.v1';
export function readScopedAdventureZoneLoadingV1({event,frameWindow,origin,sessionId}={}){
 if(!sessionId||!frameWindow||event?.source!==frameWindow||
    event?.origin!==origin)return null;
 const data=event.data;
 if(data?.schema!==ADVENTURE_ZONE_LOADING_SCHEMA_V1||
    data.sessionId!==sessionId||typeof data.visible!=='boolean')return null;
 return Object.freeze({visible:data.visible});
}
