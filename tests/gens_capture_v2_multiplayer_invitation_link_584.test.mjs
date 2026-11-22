import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCaptureRoomInviteCodeV1,captureRoomInvitationUrlV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-invite-v1.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('#584: a share link opens the existing Capture owner and carries a code, NEVER the host save/universe/hero',()=>{
 const url=captureRoomInvitationUrlV1({
  code:' abcdefghjk ',
  sourceUrl:'https://example.test/Zombicide-40k/preview/capture-v2-pr225/assets/gensrpg/capture-v2/adventure-app-v1.mjs?universe=host-private'
 });
 const parsed=new URL(url);
 assert.equal(parsed.origin,'https://example.test');
 assert.equal(parsed.pathname,'/Zombicide-40k/preview/capture-v2-pr225/assets/gensrpg/capture-v2/adventure.html');
 assert.equal(parsed.searchParams.get('invite'),'ABCDEFGHJK');
 assert.deepEqual([...parsed.searchParams.keys()],['invite']);
 assert.equal(parseCaptureRoomInviteCodeV1(parsed.searchParams.get('invite')),'ABCDEFGHJK');
});
test('#584: malformed URL/code is rejected before transport, no hidden account or world import',()=>{
 for(const bad of ['',null,'123','ABCDEFGHIJK','ABCDEF0HIJ',
  'https://attacker.test','      ','A!CDEFGHJK'])
  assert.equal(parseCaptureRoomInviteCodeV1(bad),null);
 assert.throws(()=>captureRoomInvitationUrlV1({code:'bad',sourceUrl:'https://example.test/app.mjs'}));
 assert.throws(()=>captureRoomInvitationUrlV1({code:'ABCDEFGHJK',sourceUrl:'file:///app.mjs'}));
});
test('#584: existing native Jouer uses invitation link only as prefilled code and explicit join',()=>{
 const app=read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 assert.match(app,/parseCaptureRoomInviteCodeV1\(startParams\.get\('invite'\)\)/);
 assert.match(app,/requestedInviteCode\?'new':/);
 assert.match(app,/\$\('adventure-room-code'\)\.value=requestedInviteCode/);
 assert.match(app,/Invitation prête.*Rejoindre par code/);
 assert.match(app,/captureRoomInvitationUrlV1\(\{code,sourceUrl:import\.meta\.url\}\)/);
 assert.match(app,/navigator\.share\(\{title:'Monster Capture/);
 assert.match(app,/url:invitation/);
 assert.doesNotMatch(app.slice(app.indexOf('const startParams='),app.indexOf('function refreshWorldChoices(')),
  /store\.save\(|portfolio\.remove\(|localStorage\.setItem\(/);
});
