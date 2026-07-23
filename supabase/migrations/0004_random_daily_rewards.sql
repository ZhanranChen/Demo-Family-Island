-- Family Island — persisted weighted daily reward selection
-- The database is the sole authority for choosing and placing rewards.

alter table family_members
  add column if not exists is_active boolean not null default true;

alter table decorations drop constraint if exists decorations_category_check;
alter table decorations
  add constraint decorations_category_check check (category in (
    'tree', 'flower', 'furniture', 'lantern', 'animal', 'garden',
    'waterfront', 'seasonal', 'landmark', 'building', 'bridge'
  ));

alter table decorations
  add column if not exists rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare', 'milestone')),
  add column if not exists unlock_weight integer not null default 10
    check (unlock_weight > 0),
  add column if not exists duplicate_limit integer not null default 3
    check (duplicate_limit > 0),
  add column if not exists placement_zones text[] not null default array['flowerMeadow']::text[],
  add column if not exists milestone_days integer[] not null default '{}'::integer[],
  add column if not exists enabled boolean not null default true;

alter table family_decorations
  add column if not exists asset_key text,
  add column if not exists object_type text,
  add column if not exists rarity text,
  add column if not exists placement_zone text,
  add column if not exists position_x numeric(5,2),
  add column if not exists position_y numeric(5,2),
  add column if not exists z_index integer,
  add column if not exists unlocked_at timestamptz,
  add column if not exists linked_memory_summary text;

update family_decorations fd set
  asset_key = coalesce(fd.asset_key, d.asset_url),
  object_type = coalesce(fd.object_type, d.category),
  rarity = coalesce(fd.rarity, d.rarity),
  unlocked_at = coalesce(fd.unlocked_at, fd.placed_at)
from decorations d
where d.id = fd.decoration_id;

create unique index if not exists one_reward_per_family_day
  on family_decorations(check_in_day_id);

create table island_placement_slots (
  id uuid primary key default gen_random_uuid(),
  zone text not null,
  position_x numeric(5,2) not null check (position_x between 0 and 100),
  position_y numeric(5,2) not null check (position_y between 0 and 100),
  z_index integer not null,
  unique(zone, position_x, position_y)
);

alter table island_placement_slots enable row level security;

insert into island_placement_slots(zone, position_x, position_y, z_index) values
  ('northGrove', 31, 54, 42), ('northGrove', 43, 34, 31), ('northGrove', 69, 50, 40),
  ('outerEdge', 22, 66, 48), ('outerEdge', 79, 61, 51),
  ('flowerMeadow', 42, 70, 64), ('flowerMeadow', 78, 76, 71), ('garden', 57, 68, 65),
  ('gardenPath', 47, 64, 62), ('gardenPath', 36, 83, 79),
  ('houseArea', 47, 58, 57), ('houseArea', 61, 59, 58),
  ('pondEdge', 70, 68, 67), ('pondEdge', 72, 78, 73),
  ('waterfront', 27, 88, 84), ('waterfront', 36, 91, 87),
  ('animalArea', 47, 58, 70), ('animalArea', 75, 66, 69)
on conflict do nothing;

-- Configurable reward registry. Weights are relative rather than UI-owned
-- percentages; operations can tune them without shipping frontend code.
update decorations set
  rarity = 'common', unlock_weight = 55, duplicate_limit = 4,
  placement_zones = array['northGrove', 'outerEdge']
where category = 'tree';

update decorations set
  rarity = 'common', unlock_weight = 55, duplicate_limit = 5,
  placement_zones = array['flowerMeadow', 'garden']
where category = 'flower';

update decorations set
  category = 'furniture', rarity = 'uncommon', unlock_weight = 25, duplicate_limit = 2,
  placement_zones = array['gardenPath', 'pondEdge']
where asset_url in ('building-bench', 'building-gate');

update decorations set
  rarity = 'uncommon', unlock_weight = 25, duplicate_limit = 2,
  placement_zones = array['houseArea']
where category = 'building';

update decorations set
  rarity = 'uncommon', unlock_weight = 18, duplicate_limit = 2,
  placement_zones = array['waterfront']
where category = 'bridge';

update decorations set
  rarity = 'rare', unlock_weight = 12, duplicate_limit = 1,
  placement_zones = array['animalArea', 'houseArea']
where category = 'animal';

insert into decorations(name, category, unlock_rule, asset_url, rarity, unlock_weight, duplicate_limit, placement_zones)
values
  ('Path Lantern', 'lantern', 'weighted', 'lantern_path_01', 'uncommon', 25, 3, array['gardenPath', 'houseArea']),
  ('Water Lily Garden', 'garden', 'weighted', 'flower_cluster_01', 'common', 45, 3, array['pondEdge', 'garden']),
  ('Sunset Dock', 'waterfront', 'weighted', 'dock_01', 'uncommon', 18, 1, array['waterfront']),
  ('Old Family Tree', 'landmark', 'weighted', 'tree_pine_01', 'rare', 8, 1, array['outerEdge'])
on conflict do nothing;

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
  v_slot island_placement_slots;
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
    and (d.rarity <> 'milestone' or v_day_index = any(d.milestone_days))
    and (select count(*) from family_decorations fd
         where fd.family_id = p_family_id and fd.decoration_id = d.id) < d.duplicate_limit
    and exists (
      select 1 from island_placement_slots s
      where s.zone = any(d.placement_zones)
        and not exists (
          select 1 from family_decorations fd
          where fd.family_id = p_family_id
            and fd.placement_zone = s.zone
            and fd.position_x = s.position_x and fd.position_y = s.position_y
        )
    )
  order by (-ln(greatest(random(), 0.000001)) / d.unlock_weight)
  limit 1;

  if v_decoration.id is null then
    raise exception 'No eligible island reward has a valid placement';
  end if;

  select s.* into v_slot from island_placement_slots s
  where s.zone = any(v_decoration.placement_zones)
    and not exists (
      select 1 from family_decorations fd
      where fd.family_id = p_family_id
        and fd.placement_zone = s.zone
        and fd.position_x = s.position_x and fd.position_y = s.position_y
    )
  order by random() limit 1;

  insert into family_decorations(
    family_id, decoration_id, check_in_day_id, asset_key, object_type, rarity,
    placement_zone, position_x, position_y, z_index, unlocked_at, linked_memory_summary
  ) values (
    p_family_id, v_decoration.id, p_family_day_id, v_decoration.asset_url,
    v_decoration.category, v_decoration.rarity, v_slot.zone, v_slot.position_x,
    v_slot.position_y, v_slot.z_index, now(), v_summary
  ) returning * into v_reward;

  return v_reward;
end;
$$;

revoke execute on function select_daily_island_reward(uuid, uuid, text) from public;
grant execute on function select_daily_island_reward(uuid, uuid, text) to authenticated;

create or replace function check_and_unlock_day() returns trigger as $$
declare
  v_family_id uuid;
  v_member_count int;
  v_entry_count int;
  v_reward family_decorations;
begin
  select family_id into v_family_id from check_in_days where id = new.check_in_day_id;
  select count(*) into v_member_count from family_members
    where family_id = v_family_id and is_active;
  select count(distinct e.user_id) into v_entry_count from entries e
    join family_members fm on fm.family_id = v_family_id and fm.user_id = e.user_id and fm.is_active
    where e.check_in_day_id = new.check_in_day_id;

  if v_member_count > 0 and v_entry_count >= v_member_count then
    update check_in_days set status = 'unlocked', unlocked_at = now()
    where id = new.check_in_day_id and status = 'open';

    if found then
      select * into v_reward from select_daily_island_reward(v_family_id, new.check_in_day_id, null);
      insert into island_state(family_id, growth_level) values(v_family_id, 1)
      on conflict(family_id) do update
        set growth_level = island_state.growth_level + 1, updated_at = now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
