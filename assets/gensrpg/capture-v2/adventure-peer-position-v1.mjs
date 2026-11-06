// C3: projection of peer positions from official Exploration's committed
// navigation ONLY. Not a movement engine, renderer or a save owner.
// Server obtains actor identity from the authenticated JWT and stamps revision.
// Remote rows never write to WorldDocument/Navigation/AdventureSave.
export const CAPTURE_PEER_POSITION_SCHEMA_V1='gensrpg.capture.peer-position.v1';
export const OFFICIAL_EXPLORATION_NAV_SCHEMA_V1='gensrpg.exploration.play-navigation.v1';
const NAV_FIELDS=Object.freeze(['schema','version','worldId','worldFingerprint',
 'sessionId','currentAreaId','x','y']);
const ROW_FIELDS=Object.freeze(['room_id','user_id','world_id','world_fingerprint',
 'area_id','x','y','seq','updated_at']);
const checkFields=(obj,allowed,description)=>{
 if(!obj||typeof obj!=='object'||Array.isArray(obj)||
    Object.keys(obj).length!==allowed.length||
    Object.keys(obj).some(key=>!allowed.includes(key)))
  throw new TypeError(description+': unexpected metadata / invalid schema');
};
const nonempty=(value,field)=>{
 if(typeof value!=='string'||!value.trim()||value.length>130||
    /[\u0000-\u001f\u007f]/.test(value))
  throw new TypeError(field+': invalid identifier');
 return value;
};
const uuid=(value,field)=>{
 if(typeof value!=='string'||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))
  throw new TypeError(field+': invalid UUID');
 return value;
};
const coordinate=(value,field)=>{
 if(typeof value!=='number'||!Number.isFinite(value)||value<0)
  throw new TypeError(field+': invalid Exploration position');
 return value;
};
const sequence=(value,field)=>{
 if(!Number.isSafeInteger(value)||value<0)
  throw new TypeError(field+': invalid sequence');
 return value;
};
const timestamp=value=>{
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))
  throw new TypeError('Invalid position update timestamp');
 return new Date(value).toISOString();
};

export function capturePeerPositionFromOfficialNavigationV1({
 navigation,sessionId,worldId,worldFingerprint
}={}){
 checkFields(navigation,NAV_FIELDS,'Official Exploration navigation');
 if(navigation.schema!==OFFICIAL_EXPLORATION_NAV_SCHEMA_V1||
    navigation.version!==1)
  throw new TypeError('Official Exploration navigation schema expected');
 if(navigation.sessionId!==nonempty(sessionId,'session scope')||
    navigation.worldId!==nonempty(worldId,'world scope')||
    navigation.worldFingerprint!==nonempty(worldFingerprint,'world fingerprint'))
  throw new RangeError('Invalid Exploration navigation scope or world fingerprint');
 const areaId=nonempty(navigation.currentAreaId,'area ID');
 return Object.freeze({
  worldId,worldFingerprint,areaId,
  x:coordinate(navigation.x,'x'),y:coordinate(navigation.y,'y')
 });
}
export function capturePeerPositionFromServerRowV1({
 raw,roomId,worldId,worldFingerprint,participants,lastSeq=0
}={}){
 checkFields(raw,ROW_FIELDS,'Server peer position');
 if(raw.room_id!==uuid(roomId,'room ID'))
  throw new RangeError('Foreign room position rejected');
 if(raw.world_id!==nonempty(worldId,'world')||
    raw.world_fingerprint!==nonempty(worldFingerprint,'fingerprint'))
  throw new RangeError('Foreign world fingerprint rejected');
 const actorId=uuid(raw.user_id,'server actor ID');
 if(!Array.isArray(participants)||!participants.includes(actorId))
  throw new RangeError('Unknown room participant rejected');
 const seq=sequence(raw.seq,'position seq');
 if(seq<=sequence(lastSeq,'last accepted seq'))
  throw new RangeError('Stale/replayed peer position rejected');
 return Object.freeze({
  actorId,areaId:nonempty(raw.area_id,'area ID'),
  x:coordinate(raw.x,'x'),y:coordinate(raw.y,'y'),
  seq,updatedAt:timestamp(raw.updated_at)
 });
}
export function capturePeerPositionListV1({
 rows,roomId,worldId,worldFingerprint,participants,ownActorId,
 previousSequences={}
}={}){
 if(!Array.isArray(rows)||!Array.isArray(participants)||
    !previousSequences||typeof previousSequences!=='object')
  throw new TypeError('Invalid server peer position collection');
 uuid(ownActorId,'own actor');
 const actors=[];
 const sequences={...previousSequences};
 const seen=new Set();
 for(const raw of rows){
  if(raw?.user_id===ownActorId)continue;
  const id=uuid(raw?.user_id,'server row actor');
  if(seen.has(id))throw new Error('Duplicate peer position in server snapshot');
  seen.add(id);
  const last=sequences[id]??0;
  if(Number.isSafeInteger(raw?.seq)&&raw.seq<=last)continue;
  const position=capturePeerPositionFromServerRowV1({
   raw,roomId,worldId,worldFingerprint,participants,lastSeq:last
  });
  actors.push(position);
  sequences[id]=position.seq;
 }
 return Object.freeze({actors:Object.freeze(actors),
  sequences:Object.freeze(sequences)});
}
