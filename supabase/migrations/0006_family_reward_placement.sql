-- Family-day rewards: reveal once, then place now/later, move, or store.
-- A reward remains linked to its family day; storing never deletes history.

alter table family_decorations
  add column if not exists placement_status text not null default 'placed'
    check (placement_status in ('pending_placement', 'placed', 'stored')),
  add column if not exists placed_by uuid references profiles(id),
  add column if not exists stored_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists family_decorations_waiting_idx
  on family_decorations(family_id, placement_status, unlocked_at);

-- Radii use island percentage units and mirror islandAssetPresentation.ts.
-- Small flowers can cluster; large ponds reserve substantially more land.
create or replace function island_reward_collision_radius(p_object_type text)
returns numeric language sql immutable set search_path = public as $$
  select case p_object_type
    when 'flower' then 1.2
    when 'garden' then 1.5
    when 'lantern' then 1.2
    when 'furniture' then 2.2
    when 'tree' then 2.6
    when 'water' then 4.0
    when 'waterfront' then 3.5
    when 'bridge' then 3.5
    when 'landmark' then 3.2
    else 1.6
  end;
$$;

-- New rewards are persisted before reveal, but do not occupy island land
-- until a family member chooses a valid position.
create or replace function select_daily_island_reward(
  p_family_id uuid,
  p_family_day_id uuid,
  p_season text default null
) returns family_decorations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing family_decorations;
  v_decoration decorations;
  v_day_index integer;
  v_summary text;
  v_reward family_decorations;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_family_day_id::text, 0));

  if auth.uid() is not null and not exists (
    select 1 from family_members
    where family_id = p_family_id and user_id = auth.uid() and is_active
  ) then raise exception 'Not a member of this family'; end if;

  select * into v_existing from family_decorations
  where check_in_day_id = p_family_day_id;
  if found then return v_existing; end if;

  if not exists (
    select 1 from check_in_days
    where id = p_family_day_id and family_id = p_family_id and status = 'unlocked'
  ) then raise exception 'Family day is not unlocked'; end if;

  select coalesce(growth_level, 0) + 1 into v_day_index
  from island_state where family_id = p_family_id;
  v_day_index := coalesce(v_day_index, 1);

  select string_agg(left(e.text_content, 120), ' · ' order by e.created_at)
  into v_summary from entries e where e.check_in_day_id = p_family_day_id;

  select d.* into v_decoration
  from decorations d
  where d.enabled
    -- Animals arrive through a future island-life system; they are never
    -- planted as daily family-day decorations.
    and d.category <> 'animal'
    and (d.rarity <> 'milestone' or v_day_index = any(d.milestone_days))
    and (select count(*) from family_decorations fd
         where fd.family_id = p_family_id and fd.decoration_id = d.id) < d.duplicate_limit
  order by (-ln(greatest(random(), 0.000001)) / d.unlock_weight)
  limit 1;

  if v_decoration.id is null then
    raise exception 'No eligible island reward';
  end if;

  insert into family_decorations(
    family_id, decoration_id, check_in_day_id, asset_key, object_type, rarity,
    placement_status, position_x, position_y, z_index, unlocked_at,
    linked_memory_summary
  ) values (
    p_family_id, v_decoration.id, p_family_day_id, v_decoration.asset_url,
    v_decoration.category, v_decoration.rarity, 'pending_placement',
    null, null, null, now(), v_summary
  ) returning * into v_reward;

  return v_reward;
end;
$$;

create or replace function place_family_day_reward(
  p_reward_id uuid,
  p_position_x numeric,
  p_position_y numeric
) returns family_decorations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward family_decorations;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_reward_id::text, 0));

  select * into v_reward from family_decorations where id = p_reward_id;
  if not found then raise exception 'Island trace not found'; end if;
  if not exists (
    select 1 from family_members
    where family_id = v_reward.family_id and user_id = auth.uid() and is_active
  ) then raise exception 'Not a member of this family'; end if;

  -- First confirmed placement wins. A stale second client receives the
  -- persisted row instead of overwriting the family's chosen position.
  if v_reward.placement_status = 'placed' then return v_reward; end if;

  if p_position_x not between 14 and 88 or p_position_y not between 16 and 86 then
    raise exception 'This trace needs a patch of island grass';
  end if;
  if (p_position_x between 28 and 46 and p_position_y between 40 and 59)
     or (p_position_x between 30 and 48 and p_position_y between 56 and 86)
  then raise exception 'This place is already part of the cabin or path'; end if;
  if (v_reward.object_type in ('tree', 'landmark') and
      (p_position_x not between 16 and 86 or p_position_y not between 18 and 76))
     or (v_reward.object_type in ('flower', 'garden') and
      (p_position_x not between 18 and 86 or p_position_y not between 24 and 82))
     or (v_reward.object_type = 'furniture' and
      (p_position_x not between 20 and 82 or p_position_y not between 34 and 82))
     or (v_reward.object_type = 'lantern' and
      (p_position_x not between 24 and 70 or p_position_y not between 36 and 84))
     or (v_reward.object_type = 'water' and
      (p_position_x not between 52 and 84 or p_position_y not between 50 and 82))
  then raise exception 'This trace belongs in a different part of the island'; end if;
  if exists (
    select 1 from family_decorations fd
    where fd.family_id = v_reward.family_id and fd.id <> v_reward.id
      and fd.placement_status = 'placed'
      and sqrt(power(fd.position_x - p_position_x, 2) +
               power(fd.position_y - p_position_y, 2)) <
          island_reward_collision_radius(v_reward.object_type) +
          island_reward_collision_radius(fd.object_type)
  ) then raise exception 'This spot is already part of another trace'; end if;

  update family_decorations set
    placement_status = 'placed',
    position_x = p_position_x,
    position_y = p_position_y,
    z_index = round(p_position_y)::integer + 30,
    placed_by = auth.uid(),
    placed_at = now(),
    stored_at = null,
    updated_at = now()
  where id = p_reward_id
  returning * into v_reward;
  return v_reward;
end;
$$;

create or replace function move_family_day_reward(
  p_reward_id uuid,
  p_position_x numeric,
  p_position_y numeric
) returns family_decorations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward family_decorations;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_reward_id::text, 0));
  select * into v_reward from family_decorations where id = p_reward_id;
  if not found then raise exception 'Island trace not found'; end if;
  if not exists (
    select 1 from family_members
    where family_id = v_reward.family_id and user_id = auth.uid() and is_active
  ) then raise exception 'Not a member of this family'; end if;
  if v_reward.placement_status <> 'placed' then
    raise exception 'This trace is not currently on the island';
  end if;
  if p_position_x not between 14 and 88 or p_position_y not between 16 and 86 then
    raise exception 'This trace needs a patch of island grass';
  end if;
  if (p_position_x between 28 and 46 and p_position_y between 40 and 59)
     or (p_position_x between 30 and 48 and p_position_y between 56 and 86)
  then raise exception 'This place is already part of the cabin or path'; end if;
  if (v_reward.object_type in ('tree', 'landmark') and
      (p_position_x not between 16 and 86 or p_position_y not between 18 and 76))
     or (v_reward.object_type in ('flower', 'garden') and
      (p_position_x not between 18 and 86 or p_position_y not between 24 and 82))
     or (v_reward.object_type = 'furniture' and
      (p_position_x not between 20 and 82 or p_position_y not between 34 and 82))
     or (v_reward.object_type = 'lantern' and
      (p_position_x not between 24 and 70 or p_position_y not between 36 and 84))
     or (v_reward.object_type = 'water' and
      (p_position_x not between 52 and 84 or p_position_y not between 50 and 82))
  then raise exception 'This trace belongs in a different part of the island'; end if;
  if exists (
    select 1 from family_decorations fd
    where fd.family_id = v_reward.family_id and fd.id <> v_reward.id
      and fd.placement_status = 'placed'
      and sqrt(power(fd.position_x - p_position_x, 2) +
               power(fd.position_y - p_position_y, 2)) <
          island_reward_collision_radius(v_reward.object_type) +
          island_reward_collision_radius(fd.object_type)
  ) then raise exception 'This spot is already part of another trace'; end if;

  update family_decorations set
    position_x = p_position_x,
    position_y = p_position_y,
    z_index = round(p_position_y)::integer + 30,
    placed_by = auth.uid(),
    updated_at = now()
  where id = p_reward_id
  returning * into v_reward;
  return v_reward;
end;
$$;

create or replace function store_family_day_reward(
  p_reward_id uuid
) returns family_decorations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward family_decorations;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_reward_id::text, 0));
  select * into v_reward from family_decorations where id = p_reward_id;
  if not found then raise exception 'Island trace not found'; end if;
  if not exists (
    select 1 from family_members
    where family_id = v_reward.family_id and user_id = auth.uid() and is_active
  ) then raise exception 'Not a member of this family'; end if;

  update family_decorations set
    placement_status = 'stored',
    position_x = null,
    position_y = null,
    z_index = null,
    stored_at = now(),
    updated_at = now()
  where id = p_reward_id
  returning * into v_reward;
  return v_reward;
end;
$$;

revoke execute on function place_family_day_reward(uuid, numeric, numeric) from public;
revoke execute on function move_family_day_reward(uuid, numeric, numeric) from public;
revoke execute on function store_family_day_reward(uuid) from public;
grant execute on function place_family_day_reward(uuid, numeric, numeric) to authenticated;
grant execute on function move_family_day_reward(uuid, numeric, numeric) to authenticated;
grant execute on function store_family_day_reward(uuid) to authenticated;
