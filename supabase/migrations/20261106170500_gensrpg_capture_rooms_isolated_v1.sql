-- GenSRPG Monster Capture rooms v1. Isolated from all z40k_* Survival objects.
-- Only ephemeral room metadata, auth users and presence; NEVER AdventureSave.
-- START: checkpoint/gensrpg-start-capture-session-multiplayer-contract-2026-11-06.
create schema if not exists gensrpg_capture_private;
revoke all on schema gensrpg_capture_private from public;
grant usage on schema gensrpg_capture_private to authenticated;

create table if not exists public.gensrpg_capture_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{10}$'),
  owner_id uuid not null references auth.users(id),
  adventure_session_id text not null check (char_length(adventure_session_id) between 1 and 128),
  max_players integer not null default 2 check (max_players between 2 and 32),
  join_enabled boolean not null default true,
  host_is_game_master boolean not null default false,
  guest_permissions jsonb not null check (
    jsonb_typeof(guest_permissions) = 'object'
    and guest_permissions ?& array['editProgression','editRewards','editWorld','allocateOwnCreatureStats']
    and jsonb_typeof(guest_permissions->'editProgression') = 'boolean'
    and jsonb_typeof(guest_permissions->'editRewards') = 'boolean'
    and jsonb_typeof(guest_permissions->'editWorld') = 'boolean'
    and jsonb_typeof(guest_permissions->'allocateOwnCreatureStats') = 'boolean'
    and guest_permissions = jsonb_build_object(
      'editProgression',coalesce(guest_permissions->'editProgression','null'::jsonb),
      'editRewards',coalesce(guest_permissions->'editRewards','null'::jsonb),
      'editWorld',coalesce(guest_permissions->'editWorld','null'::jsonb),
      'allocateOwnCreatureStats',coalesce(guest_permissions->'allocateOwnCreatureStats','null'::jsonb)
    )
  ),
  open boolean not null default true,
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.gensrpg_capture_room_members (
  room_id uuid not null references public.gensrpg_capture_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  display_name text not null check (char_length(display_name) between 1 and 48),
  role text not null check (role in ('host','guest')),
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id)
);
create index if not exists gensrpg_capture_room_members_user_idx
  on public.gensrpg_capture_room_members(user_id);

alter table public.gensrpg_capture_rooms enable row level security;
alter table public.gensrpg_capture_room_members enable row level security;
revoke all on public.gensrpg_capture_rooms, public.gensrpg_capture_room_members
  from public, anon, authenticated;
grant select on public.gensrpg_capture_rooms, public.gensrpg_capture_room_members
  to authenticated;

-- Membership is checked in a non-exposed schema to avoid RLS recursion.
create or replace function gensrpg_capture_private.is_member(p_room uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.gensrpg_capture_room_members
    where room_id = p_room and user_id = (select auth.uid())
  );
$$;
revoke all on function gensrpg_capture_private.is_member(uuid) from public, anon;
grant execute on function gensrpg_capture_private.is_member(uuid) to authenticated;

create policy capture_room_read_members_v1
  on public.gensrpg_capture_rooms for select to authenticated
  using (gensrpg_capture_private.is_member(id));
create policy capture_members_read_room_v1
  on public.gensrpg_capture_room_members for select to authenticated
  using (gensrpg_capture_private.is_member(room_id));

-- The public RPC entry points are SECURITY INVOKER, delegating to guarded
-- private SECURITY DEFINER operations. No direct insert/update REST grants.
create or replace function gensrpg_capture_private.make_room(
  p_session_id text,p_max_players integer,p_host_is_gm boolean,
  p_permissions jsonb,p_display_name text
)
returns table(room_id uuid,room_code text)
language plpgsql security definer set search_path = ''
as $$
declare
 v_owner uuid := auth.uid();
 v_room uuid;
 v_code text;
 v_random bytea;
 v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 v_i integer;
 v_tries integer := 0;
begin
 if v_owner is null then raise exception 'Authentication required'; end if;
 if p_session_id is null or char_length(p_session_id) not between 1 and 128 then
   raise exception 'Invalid AdventureSession ID';
 end if;
 if p_max_players is null or p_max_players not between 2 and 32 then
   raise exception 'Room capacity must be 2..32';
 end if;
 if p_host_is_gm is null then raise exception 'GM flag required'; end if;
 if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 48 then
   raise exception 'Invalid host display name';
 end if;
 if p_permissions is null or jsonb_typeof(p_permissions) <> 'object'
   or p_permissions <> jsonb_build_object(
    'editProgression',coalesce(p_permissions->'editProgression','null'::jsonb),
    'editRewards',coalesce(p_permissions->'editRewards','null'::jsonb),
    'editWorld',coalesce(p_permissions->'editWorld','null'::jsonb),
    'allocateOwnCreatureStats',coalesce(p_permissions->'allocateOwnCreatureStats','null'::jsonb)
   )
   or jsonb_typeof(p_permissions->'editProgression') <> 'boolean'
   or jsonb_typeof(p_permissions->'editRewards') <> 'boolean'
   or jsonb_typeof(p_permissions->'editWorld') <> 'boolean'
   or jsonb_typeof(p_permissions->'allocateOwnCreatureStats') <> 'boolean'
 then raise exception 'Invalid guest permissions'; end if;
 loop
   v_tries := v_tries+1;
   if v_tries > 10 then raise exception 'Could not allocate unique room code'; end if;
   v_code := '';
   v_random := extensions.gen_random_bytes(10);
   for v_i in 0..9 loop
     v_code := v_code || substr(v_alphabet,1+(get_byte(v_random,v_i)%32),1);
   end loop;
   begin
     insert into public.gensrpg_capture_rooms(
       code,owner_id,adventure_session_id,max_players,join_enabled,
       host_is_game_master,guest_permissions
     ) values (v_code,v_owner,p_session_id,p_max_players,true,p_host_is_gm,p_permissions)
     returning id into v_room;
     exit;
   exception when unique_violation then
     -- Retry only an invite collision; do not overwrite an existing room.
     continue;
   end;
 end loop;
 insert into public.gensrpg_capture_room_members(room_id,user_id,display_name,role)
 values(v_room,v_owner,trim(p_display_name),'host');
 return query select v_room,v_code;
end;$$;

create or replace function gensrpg_capture_private.join_room(p_code text,p_display_name text)
returns table(room_id uuid,room_code text)
language plpgsql security definer set search_path = ''
as $$
declare
 v_user uuid := auth.uid();
 v_room public.gensrpg_capture_rooms%rowtype;
 v_total integer;
 v_existing boolean;
 v_code text := upper(trim(p_code));
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 48 then
   raise exception 'Invalid participant name';
 end if;
 if v_code is null or v_code !~ '^[A-HJ-NP-Z2-9]{10}$' then
   raise exception 'Invalid Capture room code';
 end if;
 select * into v_room from public.gensrpg_capture_rooms r
   where r.code = v_code for update;
 if not found then raise exception 'Capture room not found'; end if;
 if not v_room.open or not v_room.join_enabled then raise exception 'Room closed'; end if;
 select exists(select 1 from public.gensrpg_capture_room_members m
   where m.room_id=v_room.id and m.user_id=v_user) into v_existing;
 if not v_existing then
   select count(*) into v_total from public.gensrpg_capture_room_members m
    where m.room_id=v_room.id;
   if v_total>=v_room.max_players then raise exception 'Room full'; end if;
   insert into public.gensrpg_capture_room_members(room_id,user_id,display_name,role)
    values(v_room.id,v_user,trim(p_display_name),'guest');
   update public.gensrpg_capture_rooms r
     set revision=revision+1,updated_at=now() where r.id=v_room.id;
 end if;
 return query select v_room.id,v_room.code;
end;$$;

create or replace function gensrpg_capture_private.leave_room(p_room uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_owner uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select owner_id into v_owner from public.gensrpg_capture_rooms where id=p_room for update;
 if v_owner is null then return false; end if;
 if not exists(select 1 from public.gensrpg_capture_room_members
   where room_id=p_room and user_id=v_user) then return false; end if;
 if v_user=v_owner then
   update public.gensrpg_capture_rooms
    set open=false,revision=revision+1,updated_at=now() where id=p_room;
   delete from public.gensrpg_capture_room_members where room_id=p_room;
 else
   delete from public.gensrpg_capture_room_members where room_id=p_room and user_id=v_user;
   update public.gensrpg_capture_rooms
     set revision=revision+1,updated_at=now() where id=p_room;
 end if;
 return true;
end;$$;

create or replace function public.gensrpg_capture_create_room(
 p_session_id text,p_max_players integer,p_host_is_gm boolean,
 p_permissions jsonb,p_display_name text
)
returns table(room_id uuid,room_code text)
language sql security invoker set search_path = ''
as $$
 select * from gensrpg_capture_private.make_room(
  p_session_id,p_max_players,p_host_is_gm,p_permissions,p_display_name
 );
$$;
create or replace function public.gensrpg_capture_join_room(p_code text,p_display_name text)
returns table(room_id uuid,room_code text)
language sql security invoker set search_path = ''
as $$
 select * from gensrpg_capture_private.join_room(p_code,p_display_name);
$$;
create or replace function public.gensrpg_capture_leave_room(p_room uuid)
returns boolean language sql security invoker set search_path = ''
as $$
 select gensrpg_capture_private.leave_room(p_room);
$$;

revoke all on function gensrpg_capture_private.make_room(text,integer,boolean,jsonb,text)
 from public,anon;
revoke all on function gensrpg_capture_private.join_room(text,text) from public,anon;
revoke all on function gensrpg_capture_private.leave_room(uuid) from public,anon;
grant execute on function gensrpg_capture_private.make_room(text,integer,boolean,jsonb,text)
 to authenticated;
grant execute on function gensrpg_capture_private.join_room(text,text) to authenticated;
grant execute on function gensrpg_capture_private.leave_room(uuid) to authenticated;
revoke all on function public.gensrpg_capture_create_room(text,integer,boolean,jsonb,text) from public,anon;
revoke all on function public.gensrpg_capture_join_room(text,text) from public,anon;
revoke all on function public.gensrpg_capture_leave_room(uuid) from public,anon;
grant execute on function public.gensrpg_capture_create_room(text,integer,boolean,jsonb,text) to authenticated;
grant execute on function public.gensrpg_capture_join_room(text,text) to authenticated;
grant execute on function public.gensrpg_capture_leave_room(uuid) to authenticated;

-- Only private Capture topics: never change Realtime settings or Survival channels.
create policy gensrpg_capture_realtime_read_v1 on realtime.messages
 for select to authenticated using (
   realtime.messages.private is true
   and realtime.messages.extension in ('broadcast','presence')
   and exists (
     select 1 from public.gensrpg_capture_room_members m
     where m.user_id = (select auth.uid())
       and realtime.topic() = ('gensrpg-capture-room:'||m.room_id::text)
   )
 );
create policy gensrpg_capture_realtime_send_v1 on realtime.messages
 for insert to authenticated with check (
   realtime.messages.private is true
   and realtime.messages.extension in ('broadcast','presence')
   and exists (
     select 1 from public.gensrpg_capture_room_members m
     where m.user_id = (select auth.uid())
       and realtime.topic() = ('gensrpg-capture-room:'||m.room_id::text)
   )
 );
