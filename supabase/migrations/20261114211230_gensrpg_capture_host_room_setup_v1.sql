-- Capture online C5: the host's canonical AdventureSession rules are
-- projected once into a private, immutable room snapshot (NOT a save).
-- Guests may read only while authenticated room members; they never edit it.
-- Existing Survival, Dungeon, PvP and Exploration data remain untouched.
CREATE TABLE public.gensrpg_capture_room_setups (
 room_id uuid PRIMARY KEY REFERENCES public.gensrpg_capture_rooms(id) ON DELETE CASCADE,
 host_session_id text NOT NULL,
 rules jsonb NOT NULL CHECK (
  jsonb_typeof(rules) = 'object' AND octet_length(rules::text) BETWEEN 40 AND 1048576
  AND rules->>'schema' = 'gensrpg-capture-adventure-rules-v1'
  AND rules->>'version' = '1'
 ),
 starter_count smallint NOT NULL CHECK (starter_count BETWEEN 1 AND 6),
 camera_policy jsonb NOT NULL CHECK (jsonb_typeof(camera_policy)='object'),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gensrpg_capture_room_setups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gensrpg_capture_room_setups FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gensrpg_capture_room_setups TO authenticated;
CREATE POLICY gensrpg_capture_room_setup_member_read_v1
 ON public.gensrpg_capture_room_setups FOR SELECT TO authenticated
 USING (gensrpg_capture_private.is_member(room_id));

CREATE OR REPLACE FUNCTION gensrpg_capture_private.publish_host_room_setup(
 p_room uuid,p_session text,p_rules jsonb,p_count integer,p_camera jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 v_user uuid := auth.uid();
 v_room public.gensrpg_capture_rooms%rowtype;
 v_saved public.gensrpg_capture_room_setups%rowtype;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Capture authentication required'; END IF;
 SELECT * INTO v_room FROM public.gensrpg_capture_rooms
 WHERE id=p_room FOR UPDATE;
 IF NOT FOUND OR NOT v_room.open THEN RAISE EXCEPTION 'Capture room missing or closed'; END IF;
 IF v_room.owner_id IS DISTINCT FROM v_user
    OR v_room.adventure_session_id IS DISTINCT FROM p_session
    OR NOT EXISTS (
      SELECT 1 FROM public.gensrpg_capture_room_members m
      WHERE m.room_id=p_room AND m.user_id=v_user AND m.role='host'
    ) THEN RAISE EXCEPTION 'Only the real host may publish the room setup'; END IF;
 IF p_rules IS NULL OR jsonb_typeof(p_rules) <> 'object'
    OR octet_length(p_rules::text) NOT BETWEEN 40 AND 1048576
    OR p_rules->>'schema' IS DISTINCT FROM 'gensrpg-capture-adventure-rules-v1'
    OR p_rules->>'version' IS DISTINCT FROM '1'
    OR p_count NOT BETWEEN 1 AND 6
    OR p_camera IS NULL OR jsonb_typeof(p_camera)<>'object'
 THEN RAISE EXCEPTION 'Invalid host Capture setup'; END IF;
 SELECT * INTO v_saved FROM public.gensrpg_capture_room_setups WHERE room_id=p_room;
 IF FOUND THEN
  IF v_saved.host_session_id IS DISTINCT FROM p_session
     OR v_saved.rules IS DISTINCT FROM p_rules
     OR v_saved.starter_count IS DISTINCT FROM p_count
     OR v_saved.camera_policy IS DISTINCT FROM p_camera
  THEN RAISE EXCEPTION 'The host room setup is immutable'; END IF;
  RETURN true;
 END IF;
 INSERT INTO public.gensrpg_capture_room_setups(
  room_id,host_session_id,rules,starter_count,camera_policy
 ) VALUES(p_room,p_session,p_rules,p_count,p_camera);
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION gensrpg_capture_private.publish_host_room_setup(uuid,text,jsonb,integer,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION gensrpg_capture_private.publish_host_room_setup(uuid,text,jsonb,integer,jsonb)
 TO authenticated;

CREATE OR REPLACE FUNCTION public.gensrpg_capture_publish_host_room_setup(
 p_room uuid,p_session text,p_rules jsonb,p_count integer,p_camera jsonb
) RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $$
 SELECT gensrpg_capture_private.publish_host_room_setup(
  p_room,p_session,p_rules,p_count,p_camera
 );
$$;
REVOKE ALL ON FUNCTION public.gensrpg_capture_publish_host_room_setup(uuid,text,jsonb,integer,jsonb)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.gensrpg_capture_publish_host_room_setup(uuid,text,jsonb,integer,jsonb)
 TO authenticated;

-- Room closure expires the shared projection, but never any player save.
CREATE OR REPLACE FUNCTION gensrpg_capture_private.drop_closed_host_room_setup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF OLD.open IS TRUE AND NEW.open IS FALSE THEN
  DELETE FROM public.gensrpg_capture_room_setups WHERE room_id=NEW.id;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION gensrpg_capture_private.drop_closed_host_room_setup()
 FROM PUBLIC,anon,authenticated;
CREATE TRIGGER gensrpg_capture_host_setup_on_close_v1
 AFTER UPDATE OF open ON public.gensrpg_capture_rooms
 FOR EACH ROW WHEN (OLD.open IS DISTINCT FROM NEW.open)
 EXECUTE FUNCTION gensrpg_capture_private.drop_closed_host_room_setup();
