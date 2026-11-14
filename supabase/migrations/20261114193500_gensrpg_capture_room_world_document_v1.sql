-- Capture C4: share ONE official Exploration WorldDocument per authenticated room.
-- The room's world_id/world_fingerprint (bound via existing bind_world RPC)
-- remains the single authority. This is transient transport, NOT a second
-- World Builder, AdventureSave, movement engine or Combat renderer.
-- No Survival/Dungeon/PvP schema or functions are changed.
CREATE TABLE IF NOT EXISTS public.gensrpg_capture_room_world_documents (
  room_id uuid PRIMARY KEY REFERENCES public.gensrpg_capture_rooms(id) ON DELETE CASCADE,
  world_id text NOT NULL,
  world_fingerprint text NOT NULL,
  document_text text NOT NULL CHECK (
    octet_length(document_text) BETWEEN 16 AND 8388608
  ),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gensrpg_capture_room_world_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gensrpg_capture_room_world_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gensrpg_capture_room_world_documents TO authenticated;

CREATE POLICY capture_room_world_read_members_v1
 ON public.gensrpg_capture_room_world_documents
 FOR SELECT TO authenticated
 USING (gensrpg_capture_private.is_member(room_id));

-- Only the host can publish; it must match the identity ALREADY bound by the
-- canonical Capture room RPC. The official JS Exploration importer validates
-- every WorldDocument before upload and again on the guest device.
CREATE OR REPLACE FUNCTION gensrpg_capture_private.publish_world_document(
 p_room uuid, p_world_id text, p_world_fingerprint text, p_document text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
 v_user uuid := auth.uid();
 v_room public.gensrpg_capture_rooms%rowtype;
 v_doc jsonb;
 v_existing text;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Capture authentication required'; END IF;
 IF p_document IS NULL OR octet_length(p_document) NOT BETWEEN 16 AND 8388608
 THEN RAISE EXCEPTION 'WorldDocument too large or absent (max 8 MiB)'; END IF;
 SELECT * INTO v_room FROM public.gensrpg_capture_rooms WHERE id=p_room FOR UPDATE;
 IF NOT FOUND OR NOT v_room.open THEN RAISE EXCEPTION 'Capture room missing or closed'; END IF;
 IF v_room.owner_id<>v_user OR NOT EXISTS (
   SELECT 1 FROM public.gensrpg_capture_room_members m
   WHERE m.room_id=p_room AND m.user_id=v_user AND m.role='host'
 ) THEN RAISE EXCEPTION 'Only the authenticated Capture host may share this world'; END IF;
 IF v_room.world_id IS NULL OR v_room.world_fingerprint IS NULL
    OR v_room.world_id IS DISTINCT FROM p_world_id
    OR v_room.world_fingerprint IS DISTINCT FROM p_world_fingerprint
 THEN RAISE EXCEPTION 'WorldDocument does not match the official bound world'; END IF;
 BEGIN
   v_doc := p_document::jsonb;
 EXCEPTION WHEN invalid_text_representation THEN
   RAISE EXCEPTION 'WorldDocument must be valid JSON';
 END;
 IF jsonb_typeof(v_doc) <> 'object'
    OR v_doc->>'id' IS DISTINCT FROM p_world_id
    OR jsonb_typeof(v_doc->'areas') <> 'array'
 THEN RAISE EXCEPTION 'WorldDocument identity/areas invalid'; END IF;
 SELECT document_text INTO v_existing
 FROM public.gensrpg_capture_room_world_documents WHERE room_id=p_room;
 IF FOUND THEN
   IF v_existing <> p_document THEN
     RAISE EXCEPTION 'A different WorldDocument is already shared for this room';
   END IF;
   RETURN true;
 END IF;
 INSERT INTO public.gensrpg_capture_room_world_documents(
  room_id,world_id,world_fingerprint,document_text
 ) VALUES (p_room,p_world_id,p_world_fingerprint,p_document);
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION gensrpg_capture_private.publish_world_document(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION gensrpg_capture_private.publish_world_document(uuid,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.gensrpg_capture_publish_world_document(
 p_room uuid,p_world_id text,p_world_fingerprint text,p_document text
) RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
 SELECT gensrpg_capture_private.publish_world_document(
  p_room,p_world_id,p_world_fingerprint,p_document
 ); $$;
REVOKE ALL ON FUNCTION public.gensrpg_capture_publish_world_document(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gensrpg_capture_publish_world_document(uuid,text,text,text) TO authenticated;

-- The room itself remains a status-only record after close. Never retain a
-- large shared snapshot beyond the host's explicit room closure.
CREATE OR REPLACE FUNCTION gensrpg_capture_private.drop_closed_world_document()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF OLD.open IS TRUE AND NEW.open IS FALSE THEN
  DELETE FROM public.gensrpg_capture_room_world_documents
   WHERE room_id=NEW.id;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION gensrpg_capture_private.drop_closed_world_document() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER gensrpg_capture_world_doc_on_close_v1
 AFTER UPDATE OF open ON public.gensrpg_capture_rooms
 FOR EACH ROW WHEN (OLD.open IS DISTINCT FROM NEW.open)
 EXECUTE FUNCTION gensrpg_capture_private.drop_closed_world_document();
