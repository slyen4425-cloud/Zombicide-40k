function clone(value){return structuredClone(value);}
function pct(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<0||n>100) throw new Error('capture-invalid-spawn-percent');
  return n;
}

export function createCaptureBiome({id,name='Biome',tags=[],elementTags=[],encounters=[]}={}){
  if(!id) throw new Error('capture-biome-id-required');
  const normalized=(encounters||[]).map(entry=>({
    speciesId:String(entry.speciesId||''),
    spawnPercent:pct(entry.spawnPercent),
    rarity:entry.rarity==null?null:String(entry.rarity),
    tags:[...(entry.tags||[])].map(String),
  }));
  if(normalized.some(entry=>!entry.speciesId)) throw new Error('capture-biome-species-required');
  const total=normalized.reduce((sum,entry)=>sum+entry.spawnPercent,0);
  if(total>100+Number.EPSILON) throw new Error('capture-biome-spawn-total-over-100');
  return {
    id:String(id),
    name:String(name),
    tags:[...tags].map(String),
    elementTags:[...elementTags].map(String),
    encounters:normalized,
  };
}

export function buildCaptureBiomeIndex(biomes=[]){
  const byId={};
  for(const raw of biomes||[]){
    const biome=createCaptureBiome(raw);
    if(byId[biome.id]) throw new Error('capture-duplicate-biome-id');
    byId[biome.id]=biome;
  }
  return byId;
}

export function validateCaptureBiomeSpecies(biomes=[],canonicalization={}){
  const known=new Set((canonicalization.species||[]).map(entry=>String(entry.canonicalId)));
  const errors=[];
  for(const biome of biomes||[]){
    for(const encounter of biome.encounters||[]){
      if(!known.has(String(encounter.speciesId))){
        errors.push({code:'unknown-capture-species',biomeId:String(biome.id),speciesId:String(encounter.speciesId)});
      }
    }
  }
  return {valid:errors.length===0,errors};
}

export function rollCaptureWildEncounter({biome,rng=Math.random}={}){
  if(!biome) return {ok:false,reason:'biome-missing',encounter:null};
  const table=createCaptureBiome(biome);
  const roll=Math.max(0,Math.min(0.999999999999,Number(rng())))*100;
  let cursor=0;
  for(const entry of table.encounters){
    cursor+=entry.spawnPercent;
    if(roll<cursor){
      return {
        ok:true,
        reason:'wild-encounter',
        roll,
        encounter:{
          type:'wild',
          biomeId:table.id,
          speciesId:entry.speciesId,
          rarity:entry.rarity,
          tags:clone(entry.tags),
          status:'spotted',
        },
      };
    }
  }
  return {ok:true,reason:'no-encounter',roll,encounter:null};
}

export function biomeForCaptureRoom(room={},biomeIndex={}){
  const biomeId=room?.metadata?.captureBiomeId;
  if(!biomeId) return null;
  return biomeIndex[String(biomeId)]||null;
}
