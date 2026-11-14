-- GenSRPG Monster Capture - live Realtime auth repair (applied 2026-11-14).
-- Scope: Capture private channel RLS only. No Survival, Dungeon, PvP, or
-- gameplay/save authority changes. Existing policies are ALTERED in place.
--
-- Diagnosis: realtime.authorize() evaluates reads via provisional rows whose
-- realtime.messages.private is NULL, even for a private subscribed channel.
-- Requiring private IS TRUE in our RLS policies therefore rejected every
-- valid authenticated room member with Unauthorized / CHANNEL_ERROR.
--
-- Keep topic exact, extension restricted to Broadcast/Presence, and user
-- membership checked by auth.uid(). The Capture client still creates a
-- channel with config.private=true. Nonmembers and other topics are denied.
ALTER POLICY gensrpg_capture_realtime_read_v1 ON realtime.messages
  USING (
    extension IN ('broadcast','presence')
    AND EXISTS (
      SELECT 1 FROM public.gensrpg_capture_room_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND (SELECT realtime.topic()) = ('gensrpg-capture-room:' || m.room_id::text)
    )
  );

ALTER POLICY gensrpg_capture_realtime_send_v1 ON realtime.messages
  WITH CHECK (
    extension IN ('broadcast','presence')
    AND EXISTS (
      SELECT 1 FROM public.gensrpg_capture_room_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND (SELECT realtime.topic()) = ('gensrpg-capture-room:' || m.room_id::text)
    )
  );
