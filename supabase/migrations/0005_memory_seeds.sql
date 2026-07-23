-- Family Island — intentional Memory Seed placement
-- Pending seeds are entries without a matching island_memory_objects row.
-- MEMORY_PLACEMENT_RULESET_V1 (mirrors memoryPlacement.ts):
-- land/water boundary x=.14..88, y=.16..86; cabin x=.28..46, y=.40..59;
-- path x=.30..48, y=.56..86; minimum object distance=.035.

create table island_memory_objects (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  memory_id uuid not null unique references entries(id) on delete cascade,
  object_type text not null check (object_type in (
    'wildflower', 'leafy_plant', 'mushroom', 'flower_stone', 'young_sapling'
  )),
  position_x numeric(7,6) not null check (position_x between 0 and 1),
  position_y numeric(7,6) not null check (position_y between 0 and 1),
  scale numeric(4,3) not null default 1 check (scale between 0.7 and 1.3),
  rotation numeric(6,2) not null default 0 check (rotation between -15 and 15),
  growth_stage smallint not null default 1 check (growth_stage between 0 and 10),
  placed_by uuid not null references profiles(id),
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index island_memory_objects_family_idx
  on island_memory_objects(family_id, placed_at);

alter table island_memory_objects enable row level security;

create policy "members read their family's memory objects"
  on island_memory_objects for select
  using (
    family_id in (
      select family_id from family_members
      where user_id = auth.uid() and is_active
    )
  );

-- Writes go through place_memory_seed so family ownership, collision rules,
-- and idempotency cannot be bypassed by client-supplied family_id values.
create or replace function place_memory_seed(
  p_memory_id uuid,
  p_object_type text,
  p_position_x numeric,
  p_position_y numeric,
  p_scale numeric default 1,
  p_rotation numeric default 0
) returns island_memory_objects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing island_memory_objects;
  v_family_id uuid;
  v_result island_memory_objects;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_memory_id::text, 0));

  select d.family_id into v_family_id
  from entries e
  join check_in_days d on d.id = e.check_in_day_id
  where e.id = p_memory_id;

  if v_family_id is null then raise exception 'Memory not found'; end if;
  if not exists (
    select 1 from family_members
    where family_id = v_family_id and user_id = auth.uid() and is_active
  ) then raise exception 'Not a member of this memory family'; end if;

  -- Authorization happens before the idempotent return so knowing another
  -- family's memory UUID can never disclose its planted object.
  select * into v_existing from island_memory_objects where memory_id = p_memory_id;
  if found then return v_existing; end if;

  if p_object_type not in (
    'wildflower', 'leafy_plant', 'mushroom', 'flower_stone', 'young_sapling'
  ) then raise exception 'Invalid memory object type'; end if;
  if p_position_x not between 0.14 and 0.88
     or p_position_y not between 0.16 and 0.86 then
    raise exception 'Position is outside plantable island land';
  end if;

  -- Fixed blocked areas on the sparse prototype terrain:
  -- cabin/tree center and the path down to the shore.
  if (p_position_x between 0.28 and 0.46 and p_position_y between 0.40 and 0.59)
     or (p_position_x between 0.30 and 0.48 and p_position_y between 0.56 and 0.86)
  then raise exception 'Position overlaps a fixed island landmark'; end if;

  if exists (
    select 1 from island_memory_objects o
    where o.family_id = v_family_id
      and sqrt(
        power(o.position_x - p_position_x, 2) +
        power(o.position_y - p_position_y, 2)
      ) < 0.035
  ) then raise exception 'Position is too close to another memory object'; end if;

  insert into island_memory_objects(
    family_id, memory_id, object_type, position_x, position_y,
    scale, rotation, placed_by
  ) values (
    v_family_id, p_memory_id, p_object_type, p_position_x, p_position_y,
    least(1.3, greatest(0.7, p_scale)),
    least(15, greatest(-15, p_rotation)),
    auth.uid()
  ) returning * into v_result;

  return v_result;
end;
$$;

revoke execute on function place_memory_seed(uuid, text, numeric, numeric, numeric, numeric) from public;
grant execute on function place_memory_seed(uuid, text, numeric, numeric, numeric, numeric) to authenticated;
