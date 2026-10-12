-- Phase 1 student dashboard additions.
-- Run after schema.sql in the Supabase SQL editor.

-- Categorize courses for the learner recommendation ranking. Existing courses
-- receive the Robotics default until instructors can edit their category.
alter table public.courses
    add column if not exists category text not null default 'Robotics';

create index if not exists idx_courses_category
    on public.courses (category);

-- Subscription data is read-only to users. Payment processing and writes will
-- be added later through trusted server-side integrations.
create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.profiles(id) on delete cascade,
    plan text not null,
    status text not null check (status in ('active', 'trial', 'expired')),
    renewal_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscription"
    on public.subscriptions;
create policy "Users can view their own subscription"
    on public.subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Saved courses are private to each student.
create table if not exists public.saved_courses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, course_id)
);

create index if not exists idx_saved_courses_user_id
    on public.saved_courses (user_id);

alter table public.saved_courses enable row level security;

drop policy if exists "Users can view their own saved courses"
    on public.saved_courses;
create policy "Users can view their own saved courses"
    on public.saved_courses
    for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "Users can save courses for themselves"
    on public.saved_courses;
create policy "Users can save courses for themselves"
    on public.saved_courses
    for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own saved courses"
    on public.saved_courses;
create policy "Users can remove their own saved courses"
    on public.saved_courses
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Keep timestamps reliable when a lesson is first started or its completion
-- state changes. Preserve the original completion time if an already-complete
-- row is updated for another reason.
alter table public.lesson_progress
    add column if not exists completed_at timestamptz;

alter table public.lesson_progress
    add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_lesson_progress_timestamps()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    if new.is_completed then
        if tg_op = 'INSERT' then
            new.completed_at := coalesce(new.completed_at, now());
        elsif not old.is_completed then
            new.completed_at := coalesce(new.completed_at, now());
        else
            new.completed_at := coalesce(new.completed_at, old.completed_at);
        end if;
    else
        new.completed_at := null;
    end if;
    return new;
end;
$$;

drop trigger if exists lesson_progress_timestamps
    on public.lesson_progress;
create trigger lesson_progress_timestamps
    before insert or update on public.lesson_progress
    for each row execute function public.set_lesson_progress_timestamps();

-- Development/test seed: assign one active plan to the earliest student
-- profile. Change the selected profile or values as needed for local testing.
insert into public.subscriptions (user_id, plan, status, renewal_date)
select id, 'Student Monthly', 'active', current_date + 30
from public.profiles
where role = 'student'
order by created_at
limit 1
on conflict (user_id) do update
set plan = excluded.plan,
    status = excluded.status,
    renewal_date = excluded.renewal_date,
    updated_at = now();
