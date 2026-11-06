-- Monster Capture C3 only: ephemeral server-authenticated peer poses.
-- Additive migration from C2: no z40k_* mutations, no changes to Survival.
-- Positions are an observation of canonical Exploration, NEVER a save.
alter table public.gensrpg_capture_rooms
 add column world_id text,
 add column world_fingerprint text;
alter table public.gensrpg_capture_rooms
 add constraint capture_world_scope_pair_v1 check (
   (world_id is null and world_fingerprint is null) or
   (world_id is not null and world_fingerprint is not null
    and char_length(world_id) between 1 and 130
    and char_length(world_fingerprint) between 1 and 130)
 );

create table public.gensrpg_capture_peer_positions (
 room_id uuid not null references public.gensrpg_capture_rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 world_id text not null check (char_length(world_id) between 1 and 130),
 world_fingerprint text not null check (char_length(world_fingerprint) between 1 and 130),
 area_id text not null check (char_length(area_id) between 1 and 130),
 x numeric not null check (x>=0 and x<=1000000 and x::text not in ('NaN','Infinity','-Infinity')),
 y numeric not null check (y>=0 and y<=1000000 and y::text not in ('NaN','Infinity','-Infinity')),
 seq bigint not null check (seq>=1),
 updated_at timestamptz not null default now(),
 primary key (room_id,user_id)
);
create index gensrpg_capture_positions_room_idx
 on public.gensrpg_capture_peer_positions(room_id,updated_at desc);
alter table public.gensrpg_capture_peer_positions enable row level security;
revoke all on table public.gensrpg_capture_peer_positions
 from public,anon,authenticated;
grant select on public.gensrpg_capture_peer_positions to authenticated;
create policy capture_peer_positions_read_room_v1
 on public.gensrpg_capture_peer_positions for select to authenticated
 using (gensrpg_capture_private.is_member(room_id));

-- Bind the official WorldDocument identity once. Mismatched fingerprints
-- do not trigger map overwrites or silent world replacement.
create or replace function gensrpg_capture_private.bind_world(
 p_room uuid,p_world_id text,p_world_fingerprint text
)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid := auth.uid();
 v_row public.gensrpg_capture_rooms%rowtype;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_world_id is null or char_length(p_world_id) not between 1 and 130
    or p_world_fingerprint is null
    or char_length(p_world_fingerprint) not between 1 and 130
 then raise exception 'Invalid canonical Exploration world identity'; end if;
 select * into v_row from public.gensrpg_capture_rooms
  where id=p_room for update;
 if not found or not v_row.open then raise exception 'Capture room closed or missing'; end if;
 if v_row.owner_id<>v_user then raise exception 'Only Capture host can bind world'; end if;
 if not exists (select 1 from public.gensrpg_capture_room_members
   where room_id=p_room and user_id=v_user and role='host') then
   raise exception 'Room owner not a participant';
 end if;
 if v_row.world_id is not null then
   if v_row.world_id<>p_world_id or v_row.world_fingerprint<>p_world_fingerprint
   then raise exception 'World already bound to another canonical document'; end if;
   return true;
 end if;
 update public.gensrpg_capture_rooms set
  world_id=p_world_id,world_fingerprint=p_world_fingerprint,
  revision=revision+1,updated_at=now()
 where id=p_room;
 return true;
end;$$;

-- Authoritative actor ID comes only from auth.uid(), never from client body.
-- The row lock gives each authenticated actor a monotonically increasing
-- sequence; stale/repeated writes are rejected. No inventory/world save data.
create or replace function gensrpg_capture_private.report_position(
 p_room uuid,p_world_id text,p_world_fingerprint text,p_area_id text,
 p_x numeric,p_y numeric,p_expected_seq bigint
)
returns bigint language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid := auth.uid();
 v_room public.gensrpg_capture_rooms%rowtype;
 v_seq bigint;
 v_next bigint;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_expected_seq is null or p_expected_seq<0 then raise exception 'Invalid expected position seq'; end if;
 if p_area_id is null or char_length(p_area_id) not between 1 and 130
   or p_x is null or p_y is null
   or p_x<0 or p_y<0 or p_x>1000000 or p_y>1000000
   or p_x::text in ('NaN','Infinity','-Infinity')
   or p_y::text in ('NaN','Infinity','-Infinity')
 then raise exception 'Invalid Exploration position'; end if;
 select * into v_room from public.gensrpg_capture_rooms where id=p_room for update;
 if not found or not v_room.open then raise exception 'Room not found or closed'; end if;
 if v_room.world_id is null or v_room.world_id is distinct from p_world_id
   or v_room.world_fingerprint is distinct from p_world_fingerprint
 then raise exception 'Foreign WorldDocument / fingerprint'; end if;
 if not exists (select 1 from public.gensrpg_capture_room_members
   where room_id=p_room and user_id=v_user)
 then raise exception 'Authenticated actor is not a Capture room member'; end if;
 select seq into v_seq from public.gensrpg_capture_peer_positions
  where room_id=p_room and user_id=v_user for update;
 if coalesce(v_seq,0)<>p_expected_seq then
  raise exception 'Stale/replayed position update';
 end if;
 v_next:=p_expected_seq+1;
 if v_next<=p_expected_seq then raise exception 'Position sequence overflow'; end if;
 insert into public.gensrpg_capture_peer_positions(
  room_id,user_id,world_id,world_fingerprint,area_id,x,y,seq,updated_at
 ) values (p_room,v_user,p_world_id,p_world_fingerprint,p_area_id,p_x,p_y,v_next,clock_timestamp())
 on conflict (room_id,user_id) do update set
  world_id=excluded.world_id,world_fingerprint=excluded.world_fingerprint,
  area_id=excluded.area_id,x=excluded.x,y=excluded.y,
  seq=excluded.seq,updated_at=excluded.updated_at;
 return v_next;
end;$$;

-- The legacy leave_room RPC remains unchanged; a DELETE trigger cleans
-- temporary positions when the server removes a participant from its room.
create or replace function gensrpg_capture_private.drop_position_after_leave()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 delete from public.gensrpg_capture_peer_positions
  where room_id=old.room_id and user_id=old.user_id;
 return old;
end;$$;
create trigger capture_peer_position_leave_cleanup_v1
 after delete on public.gensrpg_capture_room_members
 for each row execute function gensrpg_capture_private.drop_position_after_leave();

create or replace function public.gensrpg_capture_bind_world(
 p_room uuid,p_world_id text,p_world_fingerprint text
)
returns boolean language sql security invoker set search_path=''
as $$ select gensrpg_capture_private.bind_world(p_room,p_world_id,p_world_fingerprint); $$;

create or replace function public.gensrpg_capture_report_position(
 p_room uuid,p_world_id text,p_world_fingerprint text,p_area_id text,
 p_x numeric,p_y numeric,p_expected_seq bigint
)
returns bigint language sql security invoker set search_path=''
as $$
 select gensrpg_capture_private.report_position(
  p_room,p_world_id,p_world_fingerprint,p_area_id,p_x,p_y,p_expected_seq
 );
$$;

revoke all on function gensrpg_capture_private.bind_world(uuid,text,text) from public,anon;
revoke all on function gensrpg_capture_private.report_position(uuid,text,text,text,numeric,numeric,bigint)
 from public,anon;
revoke all on function gensrpg_capture_private.drop_position_after_leave() from public,anon,authenticated;
grant execute on function gensrpg_capture_private.bind_world(uuid,text,text) to authenticated;
grant execute on function gensrpg_capture_private.report_position(uuid,text,text,text,numeric,numeric,bigint)
 to authenticated;
revoke all on function public.gensrpg_capture_bind_world(uuid,text,text) from public,anon;
revoke all on function public.gensrpg_capture_report_position(uuid,text,text,text,numeric,numeric,bigint)
 from public,anon;
grant execute on function public.gensrpg_capture_bind_world(uuid,text,text) to authenticated;
grant execute on function public.gensrpg_capture_report_position(uuid,text,text,text,numeric,numeric,bigint)
 to authenticated;
notify pgrst,'reload schema';
