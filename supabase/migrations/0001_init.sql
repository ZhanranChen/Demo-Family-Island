-- Family Island — initial schema
-- Mirrors the "Database Schema" section of the architecture doc.
-- Design note: every table that should be family-scoped or user-scoped
-- gets Row Level Security enabled with an explicit policy — there is no
-- "trust the app layer" table in this schema, on purpose. If a bug ever
-- lets a query through the app that shouldn't run, Postgres still refuses
-- it at the row level.

create extension if not exists "pgcrypto";

-- Profiles mirrors auth.users with the columns the app actually needs to
-- display (display name, avatar). Kept separate from auth.users because
-- that table is Supabase-managed and shouldn't be joined against directly
-- from RLS policies on app tables.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'other' check (role in ('parent', 'kid', 'other')),
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table daily_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  active boolean not null default true
);

create table check_in_days (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  date date not null,
  prompt_id uuid references daily_prompts (id),
  status text not null default 'open' check (status in ('open', 'unlocked')),
  unlocked_at timestamptz,
  unique (family_id, date)
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  check_in_day_id uuid not null references check_in_days (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('text', 'voice', 'photo')),
  text_content text,
  media_url text,
  media_duration_sec integer,
  created_at timestamptz not null default now(),
  unique (check_in_day_id, user_id)
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('text', 'voice', 'photo')),
  text_content text,
  media_url text,
  created_at timestamptz not null default now()
);

create table island_state (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references families (id) on delete cascade,
  growth_level integer not null default 0,
  updated_at timestamptz not null default now()
);

create table decorations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tree', 'flower', 'bridge', 'animal', 'building')),
  unlock_rule text not null,
  asset_url text not null
);

create table family_decorations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  decoration_id uuid not null references decorations (id),
  check_in_day_id uuid not null references check_in_days (id),
  placed_at timestamptz not null default now()
);

-- ── Unlock trigger ──────────────────────────────────────────────────────
-- Fires after every entry insert. If the number of distinct entries for
-- that check_in_day now equals the number of family members, flips the day
-- to 'unlocked' and bumps island_state.growth_level. Living in the
-- database — not in the Next.js server action — means the invariant
-- ("unlocked" iff "everyone submitted") can never be bypassed by a second
-- write path (an admin script, a future mobile app, a Supabase Edge
-- Function) that forgets to re-run the app's check.
create function check_and_unlock_day() returns trigger as $$
declare
  v_family_id uuid;
  v_member_count int;
  v_entry_count int;
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

    insert into island_state (family_id, growth_level)
    values (v_family_id, 1)
    on conflict (family_id)
    do update set growth_level = island_state.growth_level + 1, updated_at = now();
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_entry_insert
  after insert on entries
  for each row execute function check_and_unlock_day();

-- ── Row Level Security ──────────────────────────────────────────────────
alter table profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table check_in_days enable row level security;
alter table entries enable row level security;
alter table journal_entries enable row level security;
alter table island_state enable row level security;
alter table family_decorations enable row level security;

create policy "profiles are self-readable and family-readable"
  on profiles for select
  using (
    id = auth.uid()
    or id in (
      select fm2.user_id from family_members fm1
      join family_members fm2 on fm2.family_id = fm1.family_id
      where fm1.user_id = auth.uid()
    )
  );

create policy "users update their own profile"
  on profiles for update using (id = auth.uid());

create policy "members read their own families"
  on families for select
  using (id in (select family_id from family_members where user_id = auth.uid()));

create policy "members read their family's roster"
  on family_members for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "members read their family's check-in days"
  on check_in_days for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- Entries: a user can always see their own entry (so their composer can
-- show "already shared today"), and can see everyone's entries for a day
-- only once that day is unlocked — enforcing the "no peeking" rule at the
-- database layer rather than trusting the UI to hide unfetched data.
create policy "see own entries always, family entries once unlocked"
  on entries for select
  using (
    user_id = auth.uid()
    or check_in_day_id in (
      select id from check_in_days
      where status = 'unlocked'
        and family_id in (select family_id from family_members where user_id = auth.uid())
    )
  );

create policy "members insert their own entry"
  on entries for insert
  with check (
    user_id = auth.uid()
    and check_in_day_id in (
      select id from check_in_days
      where family_id in (select family_id from family_members where user_id = auth.uid())
    )
  );

-- Journal entries never join to family_members at all — structurally the
-- only person who can ever read or write a row is its owner.
create policy "journal is strictly private"
  on journal_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "members read their family's island"
  on island_state for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "members read their family's decorations"
  on family_decorations for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));
