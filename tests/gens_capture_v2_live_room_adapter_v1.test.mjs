import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createCaptureRoomTransportV1
} from '../assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs';
import {
 CAPTURE_SUPABASE_PROVIDER_V1,createCaptureSupabaseClientV1
} from '../assets/gensrpg/capture-v2/adventure-multiplayer-provider-v1.mjs';
import {
 createAdventureSessionV1,updateAdventureSessionControlV1,SHOWCASE_ADVENTURE_RULES_V1,
 DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const hostId='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const roomId='d142e95f-a220-4ae9-9487-5d5ae1c0fd18';
const code='ABCDEFGHJK';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function save(){
 const s=createAdventureSessionV1({
  bestiaryCards:[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]}],
  starterId:'lumilo',rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId:'capture-session-1',instanceId:'creature-1',creatorId:'local-save-creator'},
  now:'2026-11-06T17:00:00.000Z'
 });
 return updateAdventureSessionControlV1({session:s,now:s.createdAt,settings:{
  hostIsGameMaster:true,joinEnabled:true,guestPermissions:DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1
 }});
}
const client=()=>{
 const calls=[],channels=[];
 const api={
  calls,channels,
  auth:{
   getSession:async()=>({data:{session:{user:{id:hostId}}},error:null}),
   signInAnonymously:async()=>{throw Error('unexpected sign-in');}
  },
  rpc:async (name,args)=>{
   calls.push({name,args});
   if(name==='gensrpg_capture_leave_room')return {data:true,error:null};
   return {data:[{room_id:roomId,room_code:code}],error:null};
  },
  from(name){
   calls.push({table:name});
   return {
    select(){
     return {
      eq(){
       return {
        maybeSingle:async()=>({data:{
         code,owner_id:hostId,adventure_session_id:'capture-session-1',
         max_players:3,open:true,revision:1,join_enabled:true
        },error:null}),
        order:async()=>({data:[{user_id:hostId,display_name:'Hôte',role:'host'}],error:null})
       };
      }
     };
    }
   };
  },
  channel(topic,options){
   const events=[];
   const ch={topic,options,events,
    on(type,filter,callback){events.push({type,filter,callback});return this;},
    subscribe(cb){this.subscription=cb;return this;},
    track:async()=>({status:'ok'})};
   channels.push(ch);
   return ch;
  },
  removeChannel:async ch=>{calls.push({removed:ch.topic});return 'ok';}
 };
 return api;
};
test('online room uses exactly the current Survival public URL/key but separate auth storage and no z40k transport',()=>{
 const old=source('assets/gensrpg/core/legacy-cloud-sync-backup-v1.js');
 const config=CAPTURE_SUPABASE_PROVIDER_V1;
 assert.match(old,new RegExp("const Z40K_SUPABASE_URL = '"+config.url.replaceAll('.','\\.')+"'"));
 assert.ok(old.includes("const Z40K_SUPABASE_KEY = '"+config.publishableKey+"'"));
 assert.notEqual(config.authStorageKey,'sb-dntbwwjaqjunkbubgnba-auth-token');
 const made=createCaptureSupabaseClientV1({factory:(url,key,opts)=>({url,key,opts})});
 assert.equal(made.url,config.url);
 assert.equal(made.opts.auth.storageKey,config.authStorageKey);
 assert.equal(made.opts.auth.detectSessionInUrl,false);
 const transportSource=source('assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs');
 assert.doesNotMatch(transportSource,/z40k|z40k_sync_state|localStorage|Storage\.prototype/);
 assert.doesNotMatch(transportSource,/\.upsert\(/);
});
test('Capture host only calls its guarded RPC with policy, not full save or Survival RPC',async()=>{
 const sb=client(),transport=createCaptureRoomTransportV1({client:sb});
 const response=await transport.create({session:save(),name:'Hôte',maxPlayers:3});
 assert.equal(response.roomId,roomId);assert.equal(response.code,code);
 assert.equal(response.userId,hostId);assert.equal(response.role,'host');
 const call=sb.calls.find(x=>x.name);
 assert.equal(call.name,'gensrpg_capture_create_room');
 assert.equal(call.args.p_max_players,3);
 assert.equal(call.args.p_host_is_gm,true);
 assert.deepEqual(call.args.p_permissions,DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1);
 assert.equal(Object.hasOwn(call.args,'save'),false);
 assert.equal(Object.hasOwn(call.args,'rules'),false);
 assert.equal(Object.hasOwn(call.args,'inventory'),false);
 assert.equal(Object.hasOwn(call.args,'world'),false);
 const c=client();const disabled=save();const blocked={
  ...disabled,sessionControl:{...disabled.sessionControl,joinEnabled:false}
 };
 await assert.rejects(createCaptureRoomTransportV1({client:c}).create({
  session:blocked,name:'Hôte'
 }),/Autoriser|invité|rejoindre/i);
 assert.equal(c.calls.length,0,'no remote RPC for disabled room');
});
test('join/observe/leave are separate, private and scoped; no cross-game side effects',async()=>{
 const sb=client(),transport=createCaptureRoomTransportV1({client:sb});
 await assert.rejects(transport.join({code:'ABC',name:'Joueur'}),/10 caractères/i);
 assert.equal(sb.calls.length,0);
 const join=await transport.join({code:' abcdefghjk ',name:'Joueur'});
 assert.equal(join.roomId,roomId);
 assert.equal(sb.calls[0].name,'gensrpg_capture_join_room');
 assert.equal(sb.calls[0].args.p_code,code);
 let state=null;
 await transport.observe({roomId,userId:hostId,onChange:s=>{state=s;}});
 assert.equal(sb.channels.length,1);
 const ch=sb.channels[0];
 assert.equal(ch.topic,'gensrpg-capture-room:'+roomId);
 assert.equal(ch.options.config.private,true);
 assert.equal(ch.options.config.presence.key,hostId);
 assert.ok(ch.events.some(e=>e.type==='presence'));
 assert.equal(ch.events.some(e=>e.type==='postgres_changes'),false);
 ch.subscription('SUBSCRIBED');
 // async callbacks are intentionally verified through inspectRoom directly.
 const view=await transport.inspectRoom(roomId);
 assert.equal(view.members[0].name,'Hôte');
 assert.equal(Object.hasOwn(view,'inventory'),false);
 await transport.leave({roomId});
 assert.ok(sb.calls.some(x=>x.name==='gensrpg_capture_leave_room'));
 assert.ok(sb.calls.some(x=>x.removed===ch.topic));
});
test('actual Monster Capture screen offers host/join/leave, independent status and no Survival buttons',()=>{
 const html=source('assets/gensrpg/capture-v2/adventure.html');
 const app=source('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 for(const id of ['adventure-multiplayer-panel','adventure-player-alias',
  'adventure-room-capacity','adventure-room-host','adventure-room-code',
  'adventure-room-join','adventure-room-leave','adventure-room-status',
  'adventure-room-members'])
  assert.ok(html.includes('id="'+id+'"'),'missing actual Capture room control '+id);
 assert.match(app,/createCaptureRoomTransportV1/);
 assert.match(app,/createCaptureSupabaseClientV1/);
 assert.match(app,/adventure-room-host'\)\.addEventListener/);
 assert.match(app,/adventure-room-join'\)\.addEventListener/);
 assert.match(app,/adventure-room-leave'\)\.addEventListener/);
 assert.doesNotMatch(app,/z40kCreateRoom|z40kJoinRoom|z40kSubscribe/);
});
