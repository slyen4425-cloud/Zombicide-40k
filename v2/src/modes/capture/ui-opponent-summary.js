import {captureAssetPathAllowed,resolveCaptureSpeciesAsset} from './assets.js';
import {buildCaptureSpatialSummary} from './ui-spatial-summary.js';

export const CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeBattleOpponent:true,
  readsAuthoritativeVitals:true,
  readsAuthoritativeStatuses:true,
  readsAuthoritativePosition:true,
  readsAuthoritativeSpatialDistance:true,
  readsCanonicalCaptureAssetRegistry:true,
  neverUsesRpgOrDungeonFallback:true,
  exposesInspectionTarget:true,
  mutatesBattle:false,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function text(value,fallback=''){
  const normalized=String(value??'').trim();
  return normalized||fallback;
}

function finiteOrNull(value){
  if(value==null||value==='') return null;
  const number=Number(value);
  return Number.isFinite(number)?number:null;
}

function statusEntry(status={}){
  const id=text(status?.id,'');
  const name=text(status?.name,id);
  if(!id&&!name) return null;
  const stacks=finiteOrNull(status?.stacks);
  const remainingDuration=finiteOrNull(status?.remainingDuration);
  return {
    id,
    name,
    stacks:stacks===null?null:Math.max(1,stacks),
    remainingDuration:remainingDuration===null?null:Math.max(0,remainingDuration),
  };
}

function availableAssetPart(part,registry){
  if(!part||typeof part!=='object') return null;
  const path=text(part.path,'');
  const status=text(part.status,'');
  if(!path||status==='pending_import'||!captureAssetPathAllowed(path,registry)) return null;
  return {status,path};
}

export function captureAssetPathToUiSrc(path){
  const value=text(path,'');
  if(!value) return null;
  return value.startsWith('v2/')?`./${value.slice(3)}`:value;
}

export function buildCaptureOpponentSummary(state={}, {assetRegistry={}}={}){
  const battle=state?.battle||null;
  const opponent=battle?.opponent||null;
  if(!battle||battle.status!=='active'||!opponent) return null;

  const creature=opponent.creature||{};
  const instanceId=text(opponent.activeInstanceId||creature.instanceId,'');
  const rawSpeciesId=text(creature.speciesId||battle?.encounter?.speciesId,'');
  if(!instanceId&&!rawSpeciesId) return null;

  const resolvedAsset=resolveCaptureSpeciesAsset(rawSpeciesId,assetRegistry);
  const speciesId=resolvedAsset?.speciesId||rawSpeciesId;
  const displayName=resolvedAsset?.displayName||speciesId||instanceId;
  const mainArt=availableAssetPart(resolvedAsset?.mainArt,assetRegistry);
  const iconArt=availableAssetPart(resolvedAsset?.iconArt,assetRegistry);
  const currentHp=finiteOrNull(opponent?.vitals?.currentHp);
  const maxHp=finiteOrNull(opponent?.vitals?.maxHp);
  const ko=opponent?.vitals?.ko===true||(currentHp!==null&&currentHp<=0);
  const hpLabel=currentHp!==null&&maxHp!==null
    ?`${Math.max(0,currentHp)} / ${Math.max(0,maxHp)}`
    :currentHp!==null
      ?String(Math.max(0,currentHp))
      :maxHp!==null
        ?`? / ${Math.max(0,maxHp)}`
        :null;
  const statuses=Array.isArray(opponent.statuses)
    ?opponent.statuses.map(statusEntry).filter(Boolean)
    :[];
  const actorId=text(opponent.actorId,'');
  const position=actorId&&battle?.spatial?.positions?.[actorId]
    ?structuredClone(battle.spatial.positions[actorId])
    :null;
  const spatial=buildCaptureSpatialSummary(state);
  const distanceLabel=spatial?.distanceLabel??null;

  return {
    instanceId,
    speciesId,
    displayName,
    title:distanceLabel!==null?`${displayName} · distance ${distanceLabel}`:displayName,
    wild:creature.wild===true||battle.mode==='wild',
    currentHp,
    maxHp,
    hpLabel,
    ko,
    statuses,
    position,
    playerPosition:spatial?.playerPosition?structuredClone(spatial.playerPosition):null,
    distance:spatial?.distance??null,
    distanceLabel,
    mainArt:mainArt?{...mainArt,src:captureAssetPathToUiSrc(mainArt.path)}:null,
    iconArt:iconArt?{...iconArt,src:captureAssetPathToUiSrc(iconArt.path)}:null,
  };
}

export function buildCaptureOpponentInspection(state={}, {speciesDef=null,assetRegistry={}}={}){
  const summary=buildCaptureOpponentSummary(state,{assetRegistry});
  if(!summary) return {ok:false,reason:'capture-opponent-inspection-unavailable'};
  const speciesName=text(speciesDef?.name)||text(speciesDef?.displayName)||summary.displayName||summary.speciesId||summary.instanceId;
  const fields=[
    {id:'species',label:'Espèce',value:speciesName},
    {id:'instance',label:'Instance',value:summary.instanceId||'—'},
  ];
  if(summary.hpLabel!==null) fields.push({id:'hp',label:'PV',value:summary.hpLabel});
  if(summary.ko) fields.push({id:'ko',label:'État',value:'KO'});
  if(summary.statuses.length){
    fields.push({
      id:'statuses',
      label:'Statuts',
      value:summary.statuses.map(status=>{
        const stacks=status.stacks!==null&&status.stacks>1?` ×${status.stacks}`:'';
        const remaining=status.remainingDuration!==null?` · reste ${status.remainingDuration}`:'';
        return `${status.name||status.id}${stacks}${remaining}`;
      }).join(' ; '),
    });
  }
  if(summary.playerPosition&&summary.playerPosition.x!=null&&summary.playerPosition.y!=null){
    fields.push({id:'player-position',label:'Votre position',value:`${summary.playerPosition.x}, ${summary.playerPosition.y}`});
  }
  if(summary.position&&summary.position.x!=null&&summary.position.y!=null){
    fields.push({id:'position',label:'Position adverse',value:`${summary.position.x}, ${summary.position.y}`});
  }
  if(summary.distanceLabel!==null){
    fields.push({id:'distance',label:'Distance praticable',value:summary.distanceLabel});
  }
  if(speciesDef&&Array.isArray(speciesDef.elements)&&speciesDef.elements.length){
    fields.push({id:'elements',label:'Éléments',value:speciesDef.elements.map(String).join(', ')});
  }
  return {
    ok:true,
    kind:'opponent-inspection',
    title:speciesName,
    message:summary.wild?'Adversaire sauvage':'Adversaire actif',
    fields:structuredClone(fields),
    metadata:{instanceId:summary.instanceId,speciesId:summary.speciesId,fields:structuredClone(fields)},
  };
}
