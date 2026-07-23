-- Family Island — auth + family onboarding
-- Depends on 0001_init.sql

-- ── Auto-create a profile row on signup ─────────────────────────────────
-- Runs as the Postgres superuser (security definer) because a brand-new
-- auth.users row has no corresponding family_members row yet, so it can't
-- pass any RLS check on its own. This is the standard Supabase pattern for
-- keeping `profiles` in sync with `auth.users` without trusting the client
-- to remember to make a second insert after signup.
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── create_family / join_family ─────────────────────────────────────────
-- Both run as security definer for the same reason: creating or joining a
-- family requires an insert into `families` and/or `family_members` before
-- the calling user has any row in `family_members` for RLS to key off of.
-- Rather than opening a blanket INSERT policy on those tables (which would
-- let any authenticated user insert arbitrary rows), the privilege
-- escalation is scoped to exactly these two intentional actions — each
-- function does one specific, auditable thing and nothing else.

create function create_family(p_name text)
returns families
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family families;
begin
  insert into families (name) values (p_name) returning * into v_family;

  insert into family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), 'parent');

  return v_family;
end;
$$;

create function join_family(p_invite_code text)
returns families
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family families;
begin
  select * into v_family from families where invite_code = p_invite_code;

  if v_family.id is null then
    raise exception 'No family found with that invite code';
  end if;

  insert into family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), 'other')
  on conflict (family_id, user_id) do nothing;

  return v_family;
end;
$$;

-- Only authenticated users may call these — anonymous callers have no
-- auth.uid() for the functions to attach a membership row to.
revoke execute on function create_family(text) from public;
revoke execute on function join_family(text) from public;
grant execute on function create_family(text) to authenticated;
grant execute on function join_family(text) to authenticated;
