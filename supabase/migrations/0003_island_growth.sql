-- Family Island — decoration catalog + island growth
-- Depends on 0001_init.sql, 0002_auth_and_family_onboarding.sql

-- `asset_url` is repurposed here as a symbolic renderer key (e.g.
-- 'tree-pine') rather than a real image URL, since hand-drawn SVG shapes
-- are what the frontend renders for the MVP — there's no illustration
-- pipeline yet. The column name and shape stay the same as the original
-- schema on purpose: swapping in real illustrated asset URLs later is a
-- data change, not a schema or code change.
insert into decorations (name, category, unlock_rule, asset_url) values
  ('Sprout Pine',       'tree',     'sequential', 'tree-pine'),
  ('Round Oak',         'tree',     'sequential', 'tree-oak'),
  ('Sunflower Patch',   'flower',   'sequential', 'flower-sunflower'),
  ('Wild Poppies',      'flower',   'sequential', 'flower-poppy'),
  ('Stone Footbridge',  'bridge',   'sequential', 'bridge-stone'),
  ('Rope Bridge',       'bridge',   'sequential', 'bridge-rope'),
  ('Curious Rabbit',    'animal',   'sequential', 'animal-rabbit'),
  ('Napping Cat',       'animal',   'sequential', 'animal-cat'),
  ('Singing Bird',      'animal',   'sequential', 'animal-bird'),
  ('Little Lantern Hut','building', 'sequential', 'building-hut'),
  ('Garden Gate',       'building', 'sequential', 'building-gate'),
  ('Cozy Bench',        'building', 'sequential', 'building-bench');

-- Extends the original trigger (0001) to also place a decoration, instead
-- of only incrementing a number. `growth_level` alone isn't a visual — the
-- island page needs a concrete row in `family_decorations` to render.
-- Picking "the next one in catalog order, wrapping around" is a
-- deliberately boring, deterministic rule (not `random()`) so a given
-- family's Nth unlock always produces the same decoration, which matters
-- if this trigger ever needs to be re-run or debugged against real data.
create or replace function check_and_unlock_day() returns trigger as $$
declare
  v_family_id uuid;
  v_member_count int;
  v_entry_count int;
  v_growth_level int;
  v_decoration_count int;
  v_next_decoration decorations;
begin
  select family_id into v_family_id
  from check_in_days where id = new.check_in_day_id;

  select count(*) into v_member_count
  from family_members where family_id = v_family_id;

  select count(*) into v_entry_count
  from entries where check_in_day_id = new.check_in_day_id;

  if v_entry_count >= v_member_count then
    update check_in_days
    set status = 'unlocked', unlocked_at = now()
    where id = new.check_in_day_id and status = 'open';

    if found then
      insert into island_state (family_id, growth_level)
      values (v_family_id, 1)
      on conflict (family_id)
      do update set growth_level = island_state.growth_level + 1, updated_at = now()
      returning growth_level into v_growth_level;

      select count(*) into v_decoration_count from decorations;

      select * into v_next_decoration from decorations
      order by id
      offset ((v_growth_level - 1) % v_decoration_count)
      limit 1;

      insert into family_decorations (family_id, decoration_id, check_in_day_id)
      values (v_family_id, v_next_decoration.id, new.check_in_day_id);
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
