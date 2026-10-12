-- Phase 3: live sessions and remote lab bookings.
-- Run after schema.sql, phase1.sql, and phase2.sql.

create table if not exists public.live_sessions (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(trim(title)) > 0),
    type text not null check (type in ('class', 'webinar', 'instructor_session')),
    starts_at timestamptz not null,
    duration_min integer not null check (duration_min between 5 and 480),
    meeting_url text not null,
    instructor_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid references public.courses(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists idx_live_sessions_starts_at on public.live_sessions(starts_at);
create index if not exists idx_live_sessions_instructor_id on public.live_sessions(instructor_id);

create table if not exists public.session_registrations (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.live_sessions(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    registered_at timestamptz not null default now(),
    unique (session_id, user_id)
);

create index if not exists idx_session_registrations_user_id on public.session_registrations(user_id);

create table if not exists public.lab_stations (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    status text not null default 'available' check (status in ('available', 'maintenance', 'offline')),
    created_at timestamptz not null default now()
);

create table if not exists public.lab_bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    station_id uuid not null references public.lab_stations(id) on delete restrict,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed')),
    created_at timestamptz not null default now(),
    check (ends_at > starts_at)
);

-- This partial exclusion constraint is the concurrency-safe double-booking guard.
-- PostgreSQL rejects two rows for the same station whose half-open time ranges
-- overlap, but allows cancelled/completed historical bookings to coexist.
create extension if not exists btree_gist;
alter table public.lab_bookings drop constraint if exists lab_bookings_station_no_overlap;
alter table public.lab_bookings add constraint lab_bookings_station_no_overlap
    exclude using gist (station_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
    where (status = 'booked');

create index if not exists idx_lab_bookings_user_starts on public.lab_bookings(user_id, starts_at);

create table if not exists public.lab_queue (
    user_id uuid not null references public.profiles(id) on delete cascade,
    station_id uuid not null references public.lab_stations(id) on delete cascade,
    requested_at timestamptz not null default now(),
    status text not null default 'waiting' check (status in ('waiting', 'fulfilled', 'cancelled')),
    primary key (user_id, station_id)
);

create index if not exists idx_lab_queue_station_waiting on public.lab_queue(station_id, status, requested_at);

alter table public.live_sessions enable row level security;
alter table public.session_registrations enable row level security;
alter table public.lab_stations enable row level security;
alter table public.lab_bookings enable row level security;
alter table public.lab_queue enable row level security;

drop policy if exists "Authenticated users can view live sessions" on public.live_sessions;
create policy "Authenticated users can view live sessions" on public.live_sessions for select to authenticated using (true);
drop policy if exists "Instructors can create their live sessions" on public.live_sessions;
create policy "Instructors can create their live sessions" on public.live_sessions for insert to authenticated with check (auth.uid() = instructor_id and exists (select 1 from public.profiles where id = auth.uid() and role = 'instructor'));
drop policy if exists "Instructors manage their live sessions" on public.live_sessions;
create policy "Instructors manage their live sessions" on public.live_sessions for update to authenticated using (auth.uid() = instructor_id) with check (auth.uid() = instructor_id);
drop policy if exists "Instructors delete their live sessions" on public.live_sessions;
create policy "Instructors delete their live sessions" on public.live_sessions for delete to authenticated using (auth.uid() = instructor_id);

drop policy if exists "Users view their registrations" on public.session_registrations;
create policy "Users view their registrations" on public.session_registrations for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.live_sessions s where s.id = session_id and s.instructor_id = auth.uid()));
drop policy if exists "Users register themselves" on public.session_registrations;
create policy "Users register themselves" on public.session_registrations for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users remove their registrations" on public.session_registrations;
create policy "Users remove their registrations" on public.session_registrations for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Authenticated users view lab stations" on public.lab_stations;
create policy "Authenticated users view lab stations" on public.lab_stations for select to authenticated using (true);
drop policy if exists "Instructors manage lab stations" on public.lab_stations;
create policy "Instructors manage lab stations" on public.lab_stations for all to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role = 'instructor')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'instructor'));

drop policy if exists "Users view their lab bookings" on public.lab_bookings;
create policy "Users view their lab bookings" on public.lab_bookings for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users create their lab bookings" on public.lab_bookings;
create policy "Users create their lab bookings" on public.lab_bookings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update their future lab bookings" on public.lab_bookings;
create policy "Users update their future lab bookings" on public.lab_bookings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users view their queue entries" on public.lab_queue;
create policy "Users view their queue entries" on public.lab_queue for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users join their station queue" on public.lab_queue;
create policy "Users join their station queue" on public.lab_queue for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update their queue entries" on public.lab_queue;
create policy "Users update their queue entries" on public.lab_queue for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
