-- UUID support extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- 2. Profiles (Standard)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text not null,
  created_at timestamptz default now()
);

-- 3. Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 4. Group Members
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

-- 5. Expenses (Normalized)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  paid_by uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null
);

-- 6. Expense Splits (New Table: Replaces arrays/jsonb)
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_owed numeric(12,2) not null,
  unique (expense_id, user_id)
);

-- 7. Settlements
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz default now()
);

-- 8. Friendships
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, friend_id),
  check (user_id != friend_id) -- Prevent self-friending
);

-- Indexes for performance
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_expenses_group on public.expenses(group_id);
create index if not exists idx_splits_expense on public.expense_splits(expense_id);
create index if not exists idx_splits_user on public.expense_splits(user_id);
create index if not exists idx_expenses_paid_by on public.expenses(paid_by);
create index if not exists idx_expenses_created_at on public.expenses(created_at);
create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);
create index if not exists idx_settlements_group on public.settlements(group_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.friendships enable row level security;

-- ================= RLS POLICIES =================

-- Helper: return all group_ids the current user belongs to (anti-recursion)
create or replace function public.get_my_group_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from public.group_members where user_id = auth.uid();
$$;

-- PROFILES
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- GROUPS
-- Allow viewing any group (needed for join functionality via invite links)
-- Users still need proper permissions to modify or see group details
drop policy if exists "View groups you belong to" on public.groups;
drop policy if exists "View groups" on public.groups;
create policy "View groups"
  on public.groups for select
  using (true);
drop policy if exists "Users can create groups" on public.groups;
create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

drop policy if exists "Admins can update groups" on public.groups;
create policy "Admins can update groups"
  on public.groups for update
  using (auth.uid() = created_by);

drop policy if exists "Admins can delete groups" on public.groups;
create policy "Admins can delete groups"
  on public.groups for delete
  using (auth.uid() = created_by);

-- GROUP MEMBERS

-- View members: you can see your own membership rows, or
-- any members of groups you belong to (via helper).
drop policy if exists "View members of your groups" on public.group_members;
drop policy if exists "View members" on public.group_members;
create policy "View members"
  on public.group_members for select
  using (
    user_id = auth.uid()
    or group_id in (select public.get_my_group_ids())
  );

-- Helper: secure ownership check to avoid RLS recursion
create or replace function public.is_group_creator(group_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.groups 
    where id = group_uuid 
      and created_by = auth.uid()
  );
$$;

-- Allow adding members if you are the creator of the group OR adding yourself
drop policy if exists "Admins can add members" on public.group_members;
drop policy if exists "Add members" on public.group_members;
drop policy if exists "Users can join groups" on public.group_members;
create policy "Add members"
  on public.group_members for insert
  with check (
    public.is_group_creator(group_id) or user_id = auth.uid()
  );

-- EXPENSES
drop policy if exists "View expenses of your groups" on public.expenses;
drop policy if exists "View expenses" on public.expenses;
create policy "View expenses"
  on public.expenses for select
  using (
    group_id in (select public.get_my_group_ids())
  );

drop policy if exists "Create expenses in your groups" on public.expenses;
drop policy if exists "Create expenses" on public.expenses;
create policy "Create expenses"
  on public.expenses for insert
  with check (
    created_by = auth.uid()
    and group_id in (select public.get_my_group_ids())
  );

-- Allow creators to update their own expenses
drop policy if exists "Update expenses" on public.expenses;
create policy "Update expenses"
  on public.expenses for update
  using (
    created_by = auth.uid()
    and group_id in (select public.get_my_group_ids())
  )
  with check (
    created_by = auth.uid()
    and group_id in (select public.get_my_group_ids())
  );

-- Allow creators to delete their own expenses
drop policy if exists "Delete expenses" on public.expenses;
create policy "Delete expenses"
  on public.expenses for delete
  using (
    created_by = auth.uid()
    and group_id in (select public.get_my_group_ids())
  );

-- EXPENSE SPLITS
drop policy if exists "View splits of your groups" on public.expense_splits;
drop policy if exists "View splits" on public.expense_splits;
create policy "View splits"
  on public.expense_splits for select
  using (
    exists (
      select 1 from public.expenses
      where id = expense_splits.expense_id
        and group_id in (select public.get_my_group_ids())
    )
  );

drop policy if exists "Create splits via expense creation" on public.expense_splits;
drop policy if exists "Create splits" on public.expense_splits;
create policy "Create splits"
  on public.expense_splits for insert
  with check (
    exists (
      select 1 from public.expenses
      where id = expense_id
      and created_by = auth.uid()
    )
  );

-- Allow creators to update existing splits (needed for upsert)
drop policy if exists "Update splits" on public.expense_splits;
create policy "Update splits"
  on public.expense_splits for update
  using (
    exists (
      select 1 from public.expenses
      where id = expense_id
        and created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.expenses
      where id = expense_id
        and created_by = auth.uid()
    )
  );

-- Allow creators to delete splits for their own expenses (needed for cascades)
drop policy if exists "Delete splits" on public.expense_splits;
create policy "Delete splits"
  on public.expense_splits for delete
  using (
    exists (
      select 1 from public.expenses
      where id = expense_id
        and created_by = auth.uid()
    )
  );

-- SETTLEMENTS
drop policy if exists "View settlements of your groups" on public.settlements;
drop policy if exists "View settlements" on public.settlements;
create policy "View settlements"
  on public.settlements for select
  using (
    group_id in (select public.get_my_group_ids())
  );

drop policy if exists "Create settlements" on public.settlements;
create policy "Create settlements"
  on public.settlements for insert
  with check (auth.uid() = from_user);

-- FRIENDSHIPS
drop policy if exists "View own friendships" on public.friendships;
create policy "View own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Create friendship" on public.friendships;
create policy "Create friendship"
  on public.friendships for insert
  with check (auth.uid() = user_id);

-- ================= TRIGGERS =================

-- User Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-add group creator as a member of their group
create or replace function public.auto_add_creator_as_member()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.auto_add_creator_as_member();

-- Enable Realtime (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'groups'
  ) then
    alter publication supabase_realtime add table public.groups;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table public.expenses;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'group_members'
  ) then
    alter publication supabase_realtime add table public.group_members;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'expense_splits'
  ) then
    alter publication supabase_realtime add table public.expense_splits;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'settlements'
  ) then
    alter publication supabase_realtime add table public.settlements;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
end$$;