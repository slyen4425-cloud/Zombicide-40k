import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const oldOnline=read('assets/gensrpg/core/legacy-cloud-sync-backup-v1.js');
const entry=read('assets/gensrpg/gens-multiplayer-entry-167831.js');
const lobby=read('assets/gensrpg/capture-v2/adventure-multiplayer-lobby-v1.mjs');
const adventure=read('assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
const doc=read('docs/GENSRPG_CAPTURE_SURVIVAL_MULTIPLAYER_REUSE_2026-11-06.md');

test('Survival already provides a real-looking room client contract, not a confirmed online E2E',()=>{
 for(const contract of ["rpc('z40k_make_room')","rpc('z40k_join_room'","signInAnonymously()",
 "postgres_changes","room_id=eq.","z40kShareInvite","z40kShowQR"]){
  assert.ok(oldOnline.includes(contract),'missing historical room mechanism: '+contract);
 }
 assert.match(entry,/z40kOpenOnline/);
 assert.doesNotMatch(entry,/createClient\s*\(/,'UI entry must remain delegation only');
 assert.match(doc,/RLS/);
 assert.match(doc,/deux navigateurs/);
});

test('Capture can inspect inherited concepts but may not import or activate destructive global sync',()=>{
 // Global Survival state is broad and destructive: it iterates localStorage
 // and removes missing keys during remote join. Never wire Capture to it.
 assert.match(oldOnline,/function z40kSnapshot\(\)/);
 assert.match(oldOnline,/function z40kApplySnapshot\(data\)/);
 assert.match(oldOnline,/toRemove\.forEach\(k=>localStorage\.removeItem\(k\)\)/);
 assert.match(oldOnline,/Storage\.prototype\.setItem=function/);
 assert.doesNotMatch(lobby,/\bz40k(ApplySnapshot|PushState|Subscribe|JoinRoom|CreateRoom)\b/);
 assert.doesNotMatch(lobby,/\b(localStorage|Storage\.prototype|indexedDB)\b/);
 assert.doesNotMatch(lobby,/\.from\(['"]z40k_sync_state['"]\)/,
  'Captures must use a scoped authenticated transport, not write old state table directly');
 assert.doesNotMatch(lobby,/\b(createClient|supabase)\b/i,
  'The lobby is domain state, not a second Supabase client');
 assert.match(adventure,/sessionControl/,'existing creator settings must remain the authority');
});

test('Survival six-character server room codes are not silently equated with Capture invite prototype',()=>{
 assert.match(oldOnline,/z40kSB\.rpc\('z40k_make_room'\)/);
 assert.match(oldOnline,/code\.length!==6/);
 assert.match(lobby,/INVITE_FORMAT=/,'Capture lobby still has its own versioned code format');
 assert.match(doc,/6 caractères/);
 assert.match(doc,/8–12 caractères/);
});

test('Capture SQL migration cannot modify Survival schema, rooms, sync or session identities',()=>{
 const migration=read('supabase/migrations/20261106170500_gensrpg_capture_rooms_isolated_v1.sql');
 assert.match(migration,/create table if not exists public\.gensrpg_capture_rooms\b/i);
 assert.match(migration,/create table if not exists public\.gensrpg_capture_room_members\b/i);
 assert.match(migration,/create policy capture_room_read_members_v1/i);
 assert.match(migration,/on realtime\.messages/i);
 assert.match(migration,/realtime\.messages\.private is true/i);
 assert.match(migration,/security invoker/i,'public Capture RPC must never bypass RLS');
 assert.match(migration,/gensrpg-capture-room:/,'only scoped Capture Realtime topics');
 assert.doesNotMatch(migration,/\b(?:alter|update|delete\s+from|insert\s+into|drop|truncate|create\s+or\s+replace\s+function)\s+(?:table\s+|function\s+|policy\s+[^;]*?\s+on\s+)?(?:public\.)?z40k_/i,
  'Survival schema and functions must remain read-only from Capture migrations');
 for(const forbidden of ['z40k_sync_state','z40kApplySnapshot','z40kPushState']){
  assert.ok(!migration.includes(forbidden),'No legacy Survival sync API in Capture SQL');
 }
});
