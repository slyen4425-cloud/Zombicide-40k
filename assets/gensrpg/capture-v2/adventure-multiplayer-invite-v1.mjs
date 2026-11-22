// Presentation-only deep-link to ONE existing Capture room. All auth, member
// roles and world ownership still belong to the canonical Supabase transport.
const CODE=/^[A-HJ-NP-Z2-9]{10}$/;
export function parseCaptureRoomInviteCodeV1(value){
 const trimmed=typeof value==='string'?value.trim().toUpperCase():'';
 return CODE.test(trimmed)?trimmed:null;
}
export function captureRoomInvitationUrlV1({code,sourceUrl}={}){
 const verified=parseCaptureRoomInviteCodeV1(code);
 if(!verified)throw new RangeError('Code d’invitation Monster Capture invalide');
 const source=new URL(sourceUrl);
 if(!['http:','https:'].includes(source.protocol))
  throw new Error('Invitation hors du site Capture officiel');
 // Always open the official native Adventure, not a foreign universe project
 // or an external login. The guest still chooses their own local hero.
 const target=new URL('./adventure.html',source);
 if(target.origin!==source.origin)
  throw new Error('L’invitation doit rester sur le même site');
 target.searchParams.set('invite',verified);
 return target.href;
}
