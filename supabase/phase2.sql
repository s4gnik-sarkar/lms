-- Phase 2: Robotics Learner learning path.
-- Run after schema.sql and phase1.sql in the Supabase SQL editor.

create table if not exists public.learning_paths (
    id uuid primary key default gen_random_uuid(),
    title text not null unique,
    description text
);

create table if not exists public.path_steps (
    id uuid primary key default gen_random_uuid(),
    path_id uuid not null references public.learning_paths(id) on delete cascade,
    position integer not null check (position > 0),
    title text not null,
    description text,
    course_id uuid references public.courses(id) on delete set null,
    unique (path_id, position)
);

create index if not exists idx_path_steps_path_position
    on public.path_steps (path_id, position);

create index if not exists idx_path_steps_course_id
    on public.path_steps (course_id);

alter table public.learning_paths enable row level security;
alter table public.path_steps enable row level security;

drop policy if exists "Authenticated users can read learning paths"
    on public.learning_paths;
create policy "Authenticated users can read learning paths"
    on public.learning_paths
    for select
    to authenticated
    using (true);

drop policy if exists "Instructors can create learning paths"
    on public.learning_paths;
create policy "Instructors can create learning paths"
    on public.learning_paths
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    );

drop policy if exists "Instructors can update learning paths"
    on public.learning_paths;
create policy "Instructors can update learning paths"
    on public.learning_paths
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    )
    with check (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    );

drop policy if exists "Instructors can delete learning paths"
    on public.learning_paths;
create policy "Instructors can delete learning paths"
    on public.learning_paths
    for delete
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    );

drop policy if exists "Authenticated users can read path steps"
    on public.path_steps;
create policy "Authenticated users can read path steps"
    on public.path_steps
    for select
    to authenticated
    using (true);

drop policy if exists "Instructors can create path steps"
    on public.path_steps;
create policy "Instructors can create path steps"
    on public.path_steps
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    );

drop policy if exists "Instructors can update path steps"
    on public.path_steps;
create policy "Instructors can update path steps"
    on public.path_steps
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    )
    with check (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    );

drop policy if exists "Instructors can delete path steps"
    on public.path_steps;
create policy "Instructors can delete path steps"
    on public.path_steps
    for delete
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid() and role = 'instructor'
        )
    );

-- Seed/update the ordered Robotics Learner path.
insert into public.learning_paths (title, description)
values (
    'Robotics Learner',
    'Build your robotics skills step by step, from core concepts to intelligent projects.'
)
on conflict (title) do update
set description = excluded.description;

with path as (
    select id
    from public.learning_paths
    where title = 'Robotics Learner'
),
steps(position, title, description, search_terms) as (
    values
        (1, 'Robotics fundamentals', 'Learn the core ideas behind robots, mechanisms, and control.', array['fundamental', 'introduction to robotics', 'robotics basics']),
        (2, 'Arduino / microcontrollers', 'Program microcontrollers and connect hardware to code.', array['arduino', 'microcontroller']),
        (3, 'Sensors and actuators', 'Read the environment and create movement with sensors and actuators.', array['sensor', 'actuator']),
        (4, 'ROS and autonomous robots', 'Use ROS concepts to build robots that navigate and act autonomously.', array['ros', 'autonomous robot']),
        (5, 'AI robotics projects', 'Apply artificial intelligence to practical robotics projects.', array['robotics ai', 'ai robotics', 'artificial intelligence'])
)
insert into public.path_steps (path_id, position, title, description, course_id)
select
    path.id,
    steps.position,
    steps.title,
    steps.description,
    matching_course.id
from path
cross join steps
left join lateral (
    select course.id
    from public.courses as course
    where course.is_published
      and exists (
          select 1
          from unnest(steps.search_terms) as keywords(term)
          where course.title ilike '%' || keywords.term || '%'
      )
    order by course.created_at desc
    limit 1
) as matching_course on true
on conflict (path_id, position) do update
set title = excluded.title,
    description = excluded.description,
    course_id = coalesce(excluded.course_id, public.path_steps.course_id);
