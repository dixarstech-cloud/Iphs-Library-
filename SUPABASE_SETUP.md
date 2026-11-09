# Online accounts and sync (Supabase)

The app already contains your project address and **publishable** key. Do these steps once.

## 1. Create the tables
Supabase dashboard → **SQL Editor** → New query → paste → **Run**. It is safe to run more than once.

```sql
create table if not exists public.iphs_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, role text default 'Student',
  is_teacher boolean not null default false,
  created_at timestamptz default now());
create table if not exists public.iphs_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now());

alter table public.iphs_profiles enable row level security;
alter table public.iphs_app_state enable row level security;

drop policy if exists iphs_profiles_read on public.iphs_profiles;
create policy iphs_profiles_read on public.iphs_profiles for select using (auth.uid() = id);
drop policy if exists iphs_profiles_update on public.iphs_profiles;
create policy iphs_profiles_update on public.iphs_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists iphs_state_all on public.iphs_app_state;
create policy iphs_state_all on public.iphs_app_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- stop users making themselves teachers
create or replace function public.iphs_lock_teacher() returns trigger language plpgsql as $$
begin
  if new.is_teacher is distinct from old.is_teacher and auth.uid() is not null then
    new.is_teacher := old.is_teacher;
  end if;
  return new;
end $$;
drop trigger if exists iphs_lock_teacher on public.iphs_profiles;
create trigger iphs_lock_teacher before update on public.iphs_profiles
  for each row execute function public.iphs_lock_teacher();

-- create a profile row for every new account
create or replace function public.iphs_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.iphs_profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists iphs_on_signup on auth.users;
create trigger iphs_on_signup after insert on auth.users for each row execute function public.iphs_new_user();
```

## 2. Sign-in settings
Authentication → **Sign In / Providers → Email**: keep it on. Turn **Confirm email** off for simplest sign-up, or leave it on and learners must tap the link in their email first.
Authentication → **URL Configuration**: set **Site URL** to your GitHub Pages address (for example `https://yourname.github.io/iphs/`) and add the same address under Redirect URLs. Password-reset and confirmation links use it.

**If the confirmation email opens a GitHub "404" page:** the Site URL still points to the root of your GitHub address. Set it to the full app address, including the repository folder (for example `https://yourname.github.io/iphs/`), and add the same address under Redirect URLs. Old emails keep the old link, so ask for a new one. The simplest option for a school is to turn **Confirm email** off.

## 3. Approve teachers for Gemini
Anyone can create an account, so Gemini is switched on only for accounts you approve. In **Table Editor → iphs_profiles**, tick **is_teacher** for the teacher's row (or run `update public.iphs_profiles set is_teacher = true where id = '...';`). The teacher opens My account once and Gemini appears in Settings.
Also set the same teacher access code check in your Gemini proxy (see PROXY_SETUP.md).

## 4. Keys
- The **publishable** key in `app.js` is meant to be public. The rules above protect the data.
- The **secret** key must never go into the app or GitHub. If you pasted it anywhere, go to Project Settings → API Keys and **rotate** it.

## What is synced
Profile, bookmarks, favourites, reading progress, quiz scores, classes, learners, assessments and marks. Theme and AI settings stay on each device. The app works offline and saves online when the phone is connected. If two devices changed things, they are merged.
