-- Issue #553 — Authorize the EXISTING private Supabase Realtime channel.
-- Before this migration, realtime.messages has RLS enabled but no policies:
-- Capture joins/broadcasts/presence are rejected, while REST room/position
-- reads and server writes still succeed. Never make the channel public.
--
-- Membership, open-state and topic are read from the ORIGINAL Capture rooms.
-- No new room/position tables, media/Save payloads or game-state authorities.
-- The server-side report_position RPC remains the only position writer.
-- Supabase evaluates these permissions at private-channel join.
-- Deployment gate: verify isolated tests + CI + authorized DB migration,
-- then PC/Android validation. Do not apply automatically with a PWA build.

create policy gensrpg_capture_realtime_room_read_v1
on realtime.messages
for select to authenticated
using (
 realtime.messages.extension in ('broadcast','presence')
 and exists (
  select 1
  from public.gensrpg_capture_room_members member
  join public.gensrpg_capture_rooms room on room.id=member.room_id
  where member.user_id=(select auth.uid())
   and room.open=true
   and (select realtime.topic())='gensrpg-capture-room:'||room.id::text
 )
);

create policy gensrpg_capture_realtime_room_write_v1
on realtime.messages
for insert to authenticated
with check (
 realtime.messages.extension in ('broadcast','presence')
 and exists (
  select 1
  from public.gensrpg_capture_room_members member
  join public.gensrpg_capture_rooms room on room.id=member.room_id
  where member.user_id=(select auth.uid())
   and room.open=true
   and (select realtime.topic())='gensrpg-capture-room:'||room.id::text
 )
);
